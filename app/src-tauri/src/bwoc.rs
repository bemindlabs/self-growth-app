//! BWOC transport — how the app reaches an agent in the BWOC fleet.
//!
//! Replaces the former OpenClaw OpenAI-compatible gateway client. Every AI
//! feature in the app is the same shape — "send a prompt + context, get text
//! back" — which in BWOC terms is "send a message to an agent, get a reply".
//!
//! Three transports are configurable in Settings (`bwoc_transport`):
//! - `cli` — shell out to the local `bwoc run <agent>` (local workspace).
//! - `a2a` — A2A JSON-RPC `message/send` over HTTP to an agent's listener. The
//!   URL may be local (`bwoc serve`) or a remote hosted endpoint, which is how
//!   you reach a gateway-hosted agent without running your own server.
//! - `gateway` — native WS signed-envelope relay (roadmap; see `Transport`).
//!
//! The agent owns its own LLM backend, so the app no longer holds any LLM
//! provider endpoint/token/model — only which agent to address.

use crate::db::DbState;
use crate::store::get_setting;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::State;

const SETTING_TRANSPORT: &str = "bwoc_transport";
const SETTING_AGENT_ID: &str = "bwoc_agent_id";
const SETTING_AGENT_URL: &str = "bwoc_agent_url";
const SETTING_WORKSPACE: &str = "bwoc_workspace_path";
const SETTING_TOKEN: &str = "bwoc_token";

/// Default agent the app talks to when none is configured.
pub const DEFAULT_AGENT_ID: &str = "agent-growth-coach";
/// Default transport when none is configured.
pub const DEFAULT_TRANSPORT: &str = "a2a";

/// Which BWOC protocol the app uses to reach the agent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Transport {
    /// Local `bwoc` CLI exec.
    Cli,
    /// A2A JSON-RPC over HTTP (local or remote/hosted).
    A2a,
    /// Native gateway WS relay — not yet wired (use A2A with a remote URL).
    Gateway,
}

impl Transport {
    fn parse(s: &str) -> Transport {
        match s.trim().to_lowercase().as_str() {
            "cli" => Transport::Cli,
            "gateway" => Transport::Gateway,
            _ => Transport::A2a,
        }
    }
}

/// Resolved BWOC connection config, read from the settings table.
#[derive(Debug, Clone)]
pub struct BwocConfig {
    pub transport: Transport,
    pub agent_id: String,
    /// A2A base URL (required for the `a2a` transport).
    pub agent_url: String,
    /// Workspace root for the `cli` transport (empty = let `bwoc` resolve it).
    #[cfg_attr(mobile, allow(dead_code))]
    pub workspace_path: String,
    /// Optional bearer token for an authenticated A2A endpoint.
    pub token: String,
}

/// Read the BWOC config from settings, applying defaults.
pub fn bwoc_config(state: &State<DbState>) -> Result<BwocConfig, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let transport = Transport::parse(
        &get_setting(&conn, SETTING_TRANSPORT).unwrap_or_else(|| DEFAULT_TRANSPORT.to_string()),
    );
    let agent_id = get_setting(&conn, SETTING_AGENT_ID)
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_AGENT_ID.to_string());
    let agent_url = get_setting(&conn, SETTING_AGENT_URL).unwrap_or_default();
    let workspace_path = get_setting(&conn, SETTING_WORKSPACE).unwrap_or_default();
    let token = get_setting(&conn, SETTING_TOKEN).unwrap_or_default();

    Ok(BwocConfig {
        transport,
        agent_id,
        agent_url: agent_url.trim().trim_end_matches('/').to_string(),
        workspace_path: workspace_path.trim().to_string(),
        token: token.trim().to_string(),
    })
}

/// Send a chat-style message sequence to the configured BWOC agent and return
/// `(reply_text, agent_id)`. `messages` use the OpenAI message shape (a `content`
/// string, or an array of `{type:"text"|"image_url", ...}` parts for vision).
///
/// `temperature` / `max_tokens` are advisory — the agent owns its own sampling —
/// and are accepted only for call-site compatibility.
pub async fn send_message(
    cfg: &BwocConfig,
    messages: &[serde_json::Value],
    _temperature: f64,
    _max_tokens: u32,
) -> Result<(String, String), String> {
    match cfg.transport {
        #[cfg(desktop)]
        Transport::Cli => send_via_cli(cfg, messages).await,
        #[cfg(mobile)]
        Transport::Cli => Err("The CLI transport is desktop-only. Select the 'a2a' \
            transport on mobile to reach your BWOC agent."
            .to_string()),
        Transport::A2a => send_via_a2a(cfg, messages).await,
        Transport::Gateway => Err("The native gateway (WS relay) transport is not yet \
            available. To reach a gateway-hosted agent without running your own server, \
            select the 'a2a' transport and point the agent URL at the hosted endpoint."
            .to_string()),
    }
}

// ---------------------------------------------------------------------------
// CLI transport — `bwoc run <agent> --task <prompt> --json`
// ---------------------------------------------------------------------------

#[cfg(desktop)]
async fn send_via_cli(
    cfg: &BwocConfig,
    messages: &[serde_json::Value],
) -> Result<(String, String), String> {
    if messages_have_image(messages) {
        return Err(
            "Image input is not supported by the CLI transport. Use the \
            'a2a' transport with a vision-capable agent for OCR."
                .to_string(),
        );
    }
    let task = flatten_messages(messages);
    let agent = cfg.agent_id.clone();
    let workspace = cfg.workspace_path.clone();

    let output = tauri::async_runtime::spawn_blocking(move || {
        let mut cmd = std::process::Command::new("bwoc");
        cmd.arg("run")
            .arg(&agent)
            .arg("--task")
            .arg(&task)
            .arg("--json");
        if !workspace.is_empty() {
            cmd.arg("--workspace").arg(&workspace);
        }
        cmd.output()
    })
    .await
    .map_err(|e| format!("Failed to run bwoc: {e}"))?
    .map_err(|e| {
        format!("Failed to launch 'bwoc'. Is the BWOC CLI installed and on PATH? ({e})")
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("bwoc run failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let data: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Failed to parse bwoc JSON output: {e}"))?;

    let content = data
        .get("output")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    if content.is_empty() {
        return Err("bwoc agent returned empty output".to_string());
    }
    let agent_id = data
        .get("agent")
        .and_then(|v| v.as_str())
        .unwrap_or(&cfg.agent_id)
        .to_string();
    Ok((content, agent_id))
}

// ---------------------------------------------------------------------------
// A2A transport — JSON-RPC `message/send` over HTTP
// ---------------------------------------------------------------------------

async fn send_via_a2a(
    cfg: &BwocConfig,
    messages: &[serde_json::Value],
) -> Result<(String, String), String> {
    if cfg.agent_url.is_empty() {
        return Err(
            "Missing BWOC agent URL. Set the agent's A2A endpoint in Settings.".to_string(),
        );
    }

    let message = build_a2a_message(messages);
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": next_request_id(),
        "method": "message/send",
        "params": { "message": message },
    });

    let client = reqwest::Client::new();
    let mut req = client.post(&cfg.agent_url).json(&request);
    if !cfg.token.is_empty() {
        req = req.bearer_auth(&cfg.token);
    }

    let response = req
        .send()
        .await
        .map_err(|e| format!("BWOC A2A request failed: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("BWOC A2A error ({status}): {text}"));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse BWOC A2A response: {e}"))?;

    if let Some(err) = data.get("error") {
        let msg = err
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown error");
        return Err(format!("BWOC agent error: {msg}"));
    }

    let result = data
        .get("result")
        .ok_or_else(|| "BWOC A2A response missing 'result'".to_string())?;

    let content = extract_a2a_text(result);
    if content.trim().is_empty() {
        return Err("BWOC agent returned empty content".to_string());
    }
    Ok((content.trim().to_string(), cfg.agent_id.clone()))
}

/// Build an A2A `message` object from OpenAI-style messages. The conversation is
/// folded into a single user message: role-labelled text plus any image parts.
fn build_a2a_message(messages: &[serde_json::Value]) -> serde_json::Value {
    let mut text_buf = String::new();
    let mut parts: Vec<serde_json::Value> = Vec::new();

    for msg in messages {
        let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
        let label = match role {
            "system" => "System",
            "assistant" => "Assistant",
            _ => "User",
        };
        match msg.get("content") {
            Some(serde_json::Value::String(s)) if !s.trim().is_empty() => {
                text_buf.push_str(&format!("{label}: {}\n\n", s.trim()));
            }
            Some(serde_json::Value::Array(items)) => {
                for item in items {
                    match item.get("type").and_then(|v| v.as_str()) {
                        Some("text") => {
                            if let Some(t) = item.get("text").and_then(|v| v.as_str()) {
                                text_buf.push_str(&format!("{label}: {}\n\n", t.trim()));
                            }
                        }
                        Some("image_url") => {
                            if let Some(url) = item
                                .get("image_url")
                                .and_then(|v| v.get("url"))
                                .and_then(|v| v.as_str())
                            {
                                if let Some(file_part) = data_url_to_file_part(url) {
                                    parts.push(file_part);
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }

    // The text part leads, followed by any image/file parts.
    let mut all_parts = Vec::with_capacity(parts.len() + 1);
    if !text_buf.trim().is_empty() {
        all_parts.push(serde_json::json!({ "kind": "text", "text": text_buf.trim() }));
    }
    all_parts.extend(parts);

    serde_json::json!({
        "role": "user",
        "parts": all_parts,
        "messageId": format!("msg-{}", next_request_id()),
        "kind": "message",
    })
}

/// Convert a `data:<mime>;base64,<data>` URL into an A2A file part.
fn data_url_to_file_part(url: &str) -> Option<serde_json::Value> {
    let rest = url.strip_prefix("data:")?;
    let (mime, b64) = rest.split_once(";base64,")?;
    Some(serde_json::json!({
        "kind": "file",
        "file": { "bytes": b64, "mimeType": mime },
    }))
}

/// Walk an A2A result (message / task / artifacts) and collect all text parts.
fn extract_a2a_text(result: &serde_json::Value) -> String {
    let mut out = String::new();
    collect_parts_text(result.get("parts"), &mut out);
    collect_parts_text(result.pointer("/message/parts"), &mut out);
    collect_parts_text(result.pointer("/status/message/parts"), &mut out);
    if let Some(artifacts) = result.get("artifacts").and_then(|v| v.as_array()) {
        for artifact in artifacts {
            collect_parts_text(artifact.get("parts"), &mut out);
        }
    }
    out
}

fn collect_parts_text(parts: Option<&serde_json::Value>, out: &mut String) {
    if let Some(arr) = parts.and_then(|v| v.as_array()) {
        for part in arr {
            // A2A uses {"kind":"text","text":...}; tolerate {"type":"text",...} too.
            if let Some(t) = part.get("text").and_then(|v| v.as_str()) {
                if !t.is_empty() {
                    if !out.is_empty() {
                        out.push('\n');
                    }
                    out.push_str(t);
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

#[cfg(desktop)]
fn messages_have_image(messages: &[serde_json::Value]) -> bool {
    messages.iter().any(|m| {
        m.get("content")
            .and_then(|c| c.as_array())
            .map(|items| {
                items
                    .iter()
                    .any(|i| i.get("type").and_then(|t| t.as_str()) == Some("image_url"))
            })
            .unwrap_or(false)
    })
}

/// Flatten a message sequence into a single role-labelled prompt string.
#[cfg(desktop)]
fn flatten_messages(messages: &[serde_json::Value]) -> String {
    let mut buf = String::new();
    for msg in messages {
        let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
        let label = match role {
            "system" => "System",
            "assistant" => "Assistant",
            _ => "User",
        };
        if let Some(s) = msg.get("content").and_then(|v| v.as_str()) {
            if !s.trim().is_empty() {
                buf.push_str(&format!("{label}: {}\n\n", s.trim()));
            }
        }
    }
    buf.trim().to_string()
}

fn next_request_id() -> u64 {
    static COUNTER: AtomicU64 = AtomicU64::new(1);
    let base = chrono::Utc::now().timestamp_millis() as u64;
    base.wrapping_add(COUNTER.fetch_add(1, Ordering::Relaxed))
}

/// Format context data into a readable text block for agent prompts.
pub fn format_context(context: &serde_json::Value) -> String {
    let sections: Vec<String> = [
        "skills", "routines", "goals", "learning", "streaks", "health", "checkups", "todos",
    ]
    .iter()
    .filter_map(|key| {
        let items = context.get(key)?.as_array()?;
        if items.is_empty() {
            return None;
        }
        let label = match *key {
            "skills" => "Skills",
            "routines" => "Routines",
            "goals" => "Goals",
            "learning" => "Learning",
            "streaks" => "Streaks",
            "health" => "Health (7-day avg)",
            "checkups" => "Recent Health Checkups",
            "todos" => "Pending Todos",
            _ => key,
        };
        let lines: Vec<String> = items
            .iter()
            .filter_map(|v| v.as_str().map(|s| format!("  - {s}")))
            .collect();
        Some(format!("{label}:\n{}", lines.join("\n")))
    })
    .collect();

    if sections.is_empty() {
        "No context available.".to_string()
    } else {
        sections.join("\n\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_transport_parse() {
        assert_eq!(Transport::parse("cli"), Transport::Cli);
        assert_eq!(Transport::parse("A2A"), Transport::A2a);
        assert_eq!(Transport::parse("gateway"), Transport::Gateway);
        assert_eq!(Transport::parse("anything-else"), Transport::A2a);
    }

    #[test]
    fn test_flatten_messages_labels_roles() {
        let messages = vec![
            json!({"role": "system", "content": "Be kind."}),
            json!({"role": "user", "content": "Hello"}),
        ];
        let out = flatten_messages(&messages);
        assert!(out.contains("System: Be kind."));
        assert!(out.contains("User: Hello"));
    }

    #[test]
    fn test_messages_have_image_detects_image_url() {
        let with = vec![json!({
            "role": "user",
            "content": [{"type": "image_url", "image_url": {"url": "data:image/png;base64,AAA"}}]
        })];
        let without = vec![json!({"role": "user", "content": "no image"})];
        assert!(messages_have_image(&with));
        assert!(!messages_have_image(&without));
    }

    #[test]
    fn test_data_url_to_file_part() {
        let part = data_url_to_file_part("data:image/png;base64,QUJD").unwrap();
        assert_eq!(part["kind"], "file");
        assert_eq!(part["file"]["mimeType"], "image/png");
        assert_eq!(part["file"]["bytes"], "QUJD");
        assert!(data_url_to_file_part("http://not-a-data-url").is_none());
    }

    #[test]
    fn test_build_a2a_message_text_and_image() {
        let messages = vec![
            json!({"role": "system", "content": "OCR system"}),
            json!({"role": "user", "content": [
                {"type": "text", "text": "Read this"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,XYZ"}}
            ]}),
        ];
        let msg = build_a2a_message(&messages);
        assert_eq!(msg["role"], "user");
        let parts = msg["parts"].as_array().unwrap();
        assert_eq!(parts[0]["kind"], "text");
        assert!(parts[0]["text"].as_str().unwrap().contains("OCR system"));
        assert!(parts[0]["text"].as_str().unwrap().contains("Read this"));
        assert_eq!(parts[1]["kind"], "file");
        assert_eq!(parts[1]["file"]["mimeType"], "image/jpeg");
    }

    #[test]
    fn test_extract_a2a_text_from_message_result() {
        let result = json!({
            "kind": "message",
            "parts": [{"kind": "text", "text": "Hello back"}]
        });
        assert_eq!(extract_a2a_text(&result), "Hello back");
    }

    #[test]
    fn test_extract_a2a_text_from_task_artifacts() {
        let result = json!({
            "kind": "task",
            "artifacts": [{"parts": [{"kind": "text", "text": "Artifact text"}]}]
        });
        assert_eq!(extract_a2a_text(&result), "Artifact text");
    }

    #[test]
    fn test_format_context_empty_returns_no_context() {
        assert_eq!(format_context(&json!({})), "No context available.");
    }

    #[test]
    fn test_format_context_with_skills_and_goals() {
        let context = json!({
            "skills": ["Rust", "TypeScript"],
            "goals": ["Ship v1.0"]
        });
        let result = format_context(&context);
        assert!(result.contains("Skills:"));
        assert!(result.contains("  - Rust"));
        assert!(result.contains("Goals:"));
        assert!(result.contains("  - Ship v1.0"));
    }

    #[test]
    fn test_format_context_skips_empty_sections() {
        let context = json!({"skills": ["Rust"], "goals": [], "todos": []});
        let result = format_context(&context);
        assert!(result.contains("Skills:"));
        assert!(!result.contains("Goals:"));
    }

    #[test]
    fn test_format_context_all_known_labels() {
        let context = json!({
            "skills": ["a"], "routines": ["b"], "goals": ["c"], "learning": ["d"],
            "streaks": ["e"], "health": ["f"], "checkups": ["g"], "todos": ["h"]
        });
        let result = format_context(&context);
        for label in [
            "Skills:",
            "Routines:",
            "Goals:",
            "Learning:",
            "Streaks:",
            "Health (7-day avg):",
            "Recent Health Checkups:",
            "Pending Todos:",
        ] {
            assert!(result.contains(label), "missing {label}");
        }
    }
}
