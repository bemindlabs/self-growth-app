use crate::bwoc::{self, Transport};
use crate::db::DbState;
use serde::Serialize;
use tauri::State;

#[tauri::command]
pub fn get_app_setting(state: State<DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row("SELECT value FROM settings WHERE key = ?1", [&key], |row| {
        row.get::<_, String>(0)
    });

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_app_setting(state: State<DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_all_app_settings(state: State<DbState>) -> Result<Vec<(String, String)>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings ORDER BY key")
        .map_err(|e| e.to_string())?;

    let settings = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(settings)
}

#[tauri::command]
pub fn reset_app_settings(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM settings", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// True when the app is running on a mobile platform (iOS/Android), where the
/// CLI transport is unavailable. Used by the UI to hide desktop-only options.
#[tauri::command]
pub fn is_mobile_platform() -> bool {
    cfg!(mobile)
}

#[derive(Debug, Serialize)]
pub struct ConnectionTestResult {
    pub ok: bool,
    /// "cli" | "a2a" | "gateway"
    pub transport: String,
    pub agent: String,
    /// Reachability detail (endpoint, status code, or CLI snapshot).
    pub detail: Option<String>,
    pub error: Option<String>,
}

/// Probe the configured BWOC agent without invoking the LLM.
#[tauri::command]
pub async fn test_bwoc_connection(
    state: State<'_, DbState>,
) -> Result<ConnectionTestResult, String> {
    let cfg = bwoc::bwoc_config(&state)?;
    let agent = cfg.agent_id.clone();

    match cfg.transport {
        Transport::A2a => {
            if cfg.agent_url.is_empty() {
                return Ok(ConnectionTestResult {
                    ok: false,
                    transport: "a2a".into(),
                    agent,
                    detail: None,
                    error: Some("No agent URL configured.".into()),
                });
            }
            let client = reqwest::Client::new();
            let mut req = client
                .get(&cfg.agent_url)
                .timeout(std::time::Duration::from_secs(5));
            if !cfg.token.is_empty() {
                req = req.bearer_auth(&cfg.token);
            }
            match req.send().await {
                // Any HTTP response (even 405 on a POST-only endpoint) proves reachability.
                Ok(resp) => Ok(ConnectionTestResult {
                    ok: resp.status().as_u16() < 500,
                    transport: "a2a".into(),
                    agent,
                    detail: Some(format!("{} → HTTP {}", cfg.agent_url, resp.status())),
                    error: None,
                }),
                Err(e) => Ok(ConnectionTestResult {
                    ok: false,
                    transport: "a2a".into(),
                    agent,
                    detail: Some(cfg.agent_url),
                    error: Some(format!("Connection failed: {e}")),
                }),
            }
        }
        #[cfg(mobile)]
        Transport::Cli => Ok(ConnectionTestResult {
            ok: false,
            transport: "cli".into(),
            agent,
            detail: None,
            error: Some("The CLI transport is desktop-only. Use 'a2a' on mobile.".into()),
        }),
        #[cfg(desktop)]
        Transport::Cli => {
            let agent_arg = agent.clone();
            let workspace = cfg.workspace_path.clone();
            let output = tauri::async_runtime::spawn_blocking(move || {
                let mut cmd = std::process::Command::new("bwoc");
                cmd.arg("status").arg(&agent_arg);
                if !workspace.is_empty() {
                    cmd.arg("--workspace").arg(&workspace);
                }
                cmd.output()
            })
            .await
            .map_err(|e| e.to_string())?;

            match output {
                Ok(out) if out.status.success() => Ok(ConnectionTestResult {
                    ok: true,
                    transport: "cli".into(),
                    agent,
                    detail: Some(
                        String::from_utf8_lossy(&out.stdout)
                            .lines()
                            .take(3)
                            .collect::<Vec<_>>()
                            .join(" · "),
                    ),
                    error: None,
                }),
                Ok(out) => Ok(ConnectionTestResult {
                    ok: false,
                    transport: "cli".into(),
                    agent,
                    detail: None,
                    error: Some(String::from_utf8_lossy(&out.stderr).trim().to_string()),
                }),
                Err(e) => Ok(ConnectionTestResult {
                    ok: false,
                    transport: "cli".into(),
                    agent,
                    detail: None,
                    error: Some(format!("Failed to launch 'bwoc': {e}")),
                }),
            }
        }
        Transport::Gateway => Ok(ConnectionTestResult {
            ok: false,
            transport: "gateway".into(),
            agent,
            detail: None,
            error: Some(
                "Native gateway transport not yet available — use 'a2a' with a hosted URL.".into(),
            ),
        }),
    }
}
