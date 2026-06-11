use crate::bwoc;
use crate::commands::constants::{
    CHAT_SYSTEM, COACH_SYSTEM, INSIGHTS_SYSTEM, LIMIT_CONTEXT_SKILLS, MAX_TOKENS_CHAT,
    MAX_TOKENS_COACH, MAX_TOKENS_INSIGHTS, MAX_TOKENS_SUMMARIZE, SUMMARIZE_SYSTEM, TEMP_CHAT,
    TEMP_COACH, TEMP_INSIGHTS, TEMP_SUMMARIZE,
};
use crate::db::DbState;
use crate::models::{AiResponse, ChatMessageInput};
use crate::store;
use tauri::State;

#[tauri::command]
pub async fn ai_coach(
    state: State<'_, DbState>,
    question: Option<String>,
) -> Result<AiResponse, String> {
    let cfg = bwoc::bwoc_config(&state)?;
    let context = build_context(&state)?;
    let context_block = bwoc::format_context(&context);

    let q = question
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| {
            "Based on my current progress, what should I focus on next?".to_string()
        });

    let user_prompt = format!("{q}\n\nMy current self-development context:\n{context_block}");

    let messages = vec![
        serde_json::json!({"role": "system", "content": COACH_SYSTEM}),
        serde_json::json!({"role": "user", "content": user_prompt}),
    ];

    let (content, returned_model) =
        bwoc::send_message(&cfg, &messages, TEMP_COACH, MAX_TOKENS_COACH).await?;
    Ok(AiResponse {
        content,
        model: returned_model,
    })
}

#[tauri::command]
pub async fn ai_insights(state: State<'_, DbState>) -> Result<AiResponse, String> {
    let cfg = bwoc::bwoc_config(&state)?;
    let context = build_context(&state)?;
    let context_block = bwoc::format_context(&context);

    let user_prompt =
        format!("Analyze my self-development data and provide insights:\n\n{context_block}");

    let messages = vec![
        serde_json::json!({"role": "system", "content": INSIGHTS_SYSTEM}),
        serde_json::json!({"role": "user", "content": user_prompt}),
    ];

    let (content, returned_model) =
        bwoc::send_message(&cfg, &messages, TEMP_INSIGHTS, MAX_TOKENS_INSIGHTS).await?;
    Ok(AiResponse {
        content,
        model: returned_model,
    })
}

#[tauri::command]
pub async fn ai_summarize(
    state: State<'_, DbState>,
    period: Option<String>,
) -> Result<AiResponse, String> {
    let cfg = bwoc::bwoc_config(&state)?;
    let context = build_context(&state)?;
    let context_block = bwoc::format_context(&context);

    let period = period.unwrap_or_else(|| "weekly".to_string());
    let user_prompt = format!(
        "Write a {period} progress summary based on my self-development data:\n\n{context_block}"
    );

    let messages = vec![
        serde_json::json!({"role": "system", "content": SUMMARIZE_SYSTEM}),
        serde_json::json!({"role": "user", "content": user_prompt}),
    ];

    let (content, returned_model) =
        bwoc::send_message(&cfg, &messages, TEMP_SUMMARIZE, MAX_TOKENS_SUMMARIZE).await?;
    Ok(AiResponse {
        content,
        model: returned_model,
    })
}

#[tauri::command]
pub async fn ai_chat(
    state: State<'_, DbState>,
    messages: Vec<ChatMessageInput>,
) -> Result<AiResponse, String> {
    let cfg = bwoc::bwoc_config(&state)?;
    let context = build_context(&state)?;
    let context_block = bwoc::format_context(&context);

    let system_content = if context_block == "No context available." {
        CHAT_SYSTEM.to_string()
    } else {
        format!("{CHAT_SYSTEM}\n\nUser's current self-development data:\n{context_block}")
    };

    let mut llm_messages = vec![serde_json::json!({"role": "system", "content": system_content})];
    for msg in &messages {
        llm_messages.push(serde_json::json!({"role": msg.role, "content": msg.content}));
    }

    let (content, returned_model) =
        bwoc::send_message(&cfg, &llm_messages, TEMP_CHAT, MAX_TOKENS_CHAT).await?;
    Ok(AiResponse {
        content,
        model: returned_model,
    })
}

fn build_context(state: &State<DbState>) -> Result<serde_json::Value, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let skills = store::query_strings(
        &conn,
        &format!("SELECT name, category, current_level, target_level FROM skills ORDER BY updated_at DESC LIMIT {LIMIT_CONTEXT_SKILLS}"),
        |row| {
            Ok(format!(
                "{} ({}) — level {}/{}",
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i32>(2)?,
                row.get::<_, i32>(3)?,
            ))
        },
    )?;

    let routines = store::query_strings(
        &conn,
        "SELECT name, frequency, COALESCE(description, '') FROM routines WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10",
        |row| {
            let desc: String = row.get(2)?;
            Ok(if desc.trim().is_empty() {
                format!("{} ({})", row.get::<_, String>(0)?, row.get::<_, String>(1)?)
            } else {
                format!("{} ({}) — {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?, desc.trim())
            })
        },
    )?;

    let goals = store::query_strings(
        &conn,
        "SELECT title, status, COALESCE(target_date, '') FROM goals ORDER BY created_at DESC LIMIT 10",
        |row| {
            let date: String = row.get(2)?;
            let mut line = format!("{} [{}]", row.get::<_, String>(0)?, row.get::<_, String>(1)?);
            if !date.trim().is_empty() {
                line.push_str(&format!(" target {}", date.trim()));
            }
            Ok(line)
        },
    )?;

    let learning = store::query_strings(
        &conn,
        "SELECT title, item_type, status FROM learning_items ORDER BY created_at DESC LIMIT 10",
        |row| {
            Ok(format!(
                "{} [{} / {}]",
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        },
    )?;

    let streaks = store::query_strings(
        &conn,
        "SELECT r.name, COUNT(l.id) as completions FROM routines r LEFT JOIN routine_logs l ON r.id = l.routine_id WHERE l.completed_at >= datetime('now', '-7 days') GROUP BY r.id ORDER BY completions DESC LIMIT 5",
        |row| {
            Ok(format!(
                "{}: {} completions this week",
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
            ))
        },
    )?;

    let health = store::query_strings(
        &conn,
        "SELECT metric_type, ROUND(AVG(value), 1), unit, COUNT(*) \
         FROM health_metrics \
         WHERE recorded_at >= datetime('now', '-7 days') \
         GROUP BY metric_type \
         ORDER BY metric_type",
        |row| {
            Ok(format!(
                "{}: avg {} {} ({} readings)",
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
            ))
        },
    )?;

    let todos = store::query_strings(
        &conn,
        "SELECT title, priority, COALESCE(due_date, 'no deadline'), status \
         FROM todos WHERE status NOT IN ('completed', 'cancelled') \
         ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, due_date ASC NULLS LAST \
         LIMIT 10",
        |row| {
            let due: String = row.get(2)?;
            let overdue = if due != "no deadline" {
                // Simple check: if due_date < today
                " (may be overdue)"
            } else {
                ""
            };
            Ok(format!(
                "{} [{}] due {}{}",
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                due,
                overdue,
            ))
        },
    )?;

    let checkups = store::query_strings(
        &conn,
        "SELECT title, checkup_date, category, results \
         FROM health_checkups \
         ORDER BY checkup_date DESC \
         LIMIT 5",
        |row| {
            Ok(format!(
                "{} ({}) [{}]: {}",
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        },
    )?;

    Ok(serde_json::json!({
        "skills": skills,
        "routines": routines,
        "goals": goals,
        "learning": learning,
        "streaks": streaks,
        "health": health,
        "checkups": checkups,
        "todos": todos,
    }))
}
