use tauri::State;

use crate::bwoc;
use crate::db::DbState;
use crate::models::{GenerateStoryInput, SaveStoryInput, Story, StoryGenerationResult};
use crate::store;

const STORY_SYSTEM: &str = "You write vivid, emotionally clear stories that stay grounded in provided context. Use the context as inspiration and factual anchors, but do not invent claims about the user's saved data that are not supported. If context is thin, keep the story more universal than specific.";

#[tauri::command]
pub async fn generate_story(
    state: State<'_, DbState>,
    input: GenerateStoryInput,
) -> Result<StoryGenerationResult, String> {
    let cfg = bwoc::bwoc_config(&state)?;

    let context_summary = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        let skills = store::query_strings(
            &conn,
            "SELECT name, category, current_level, target_level FROM skills ORDER BY updated_at DESC, name ASC LIMIT 5",
            |row| {
                Ok(format!(
                    "Skill: {} ({}) — level {}/{}",
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i32>(2)?,
                    row.get::<_, i32>(3)?,
                ))
            },
        )?;

        let learning = store::query_strings(
            &conn,
            "SELECT title, item_type, status, COALESCE(description, '') FROM learning_items ORDER BY created_at DESC LIMIT 5",
            |row| {
                let desc: String = row.get(3)?;
                Ok(if desc.trim().is_empty() {
                    format!("Learning: {} [{} / {}]", row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?)
                } else {
                    format!("Learning: {} [{} / {}] — {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, desc.trim())
                })
            },
        )?;

        let routines = store::query_strings(
            &conn,
            "SELECT name, frequency, COALESCE(description, '') FROM routines WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5",
            |row| {
                let desc: String = row.get(2)?;
                Ok(if desc.trim().is_empty() {
                    format!("Routine: {} ({})", row.get::<_, String>(0)?, row.get::<_, String>(1)?)
                } else {
                    format!("Routine: {} ({}) — {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?, desc.trim())
                })
            },
        )?;

        let goals = store::query_strings(
            &conn,
            "SELECT title, status, COALESCE(description, ''), COALESCE(target_date, '') FROM goals ORDER BY created_at DESC LIMIT 5",
            |row| {
                let desc: String = row.get(2)?;
                let date: String = row.get(3)?;
                let mut line = format!("Goal: {} [{}]", row.get::<_, String>(0)?, row.get::<_, String>(1)?);
                if !date.trim().is_empty() { line.push_str(&format!(" target {}", date.trim())); }
                if !desc.trim().is_empty() { line.push_str(&format!(" — {}", desc.trim())); }
                Ok(line)
            },
        )?;

        let mut items = Vec::new();
        items.extend(skills);
        items.extend(learning);
        items.extend(routines);
        items.extend(goals);

        if items.is_empty() {
            items.push("No tracked skills, learning items, routines, or goals yet.".to_string());
        }

        items
    };

    let tone = input.tone.unwrap_or_else(|| "encouraging".to_string());
    let prompt = input.prompt.unwrap_or_else(|| {
        "Write a short personal growth story inspired by the current context.".to_string()
    });

    let length_instruction = "Write a balanced story in about 3-4 paragraphs.";

    let context_block = context_summary
        .iter()
        .enumerate()
        .map(|(i, item)| format!("{}. {}", i + 1, item))
        .collect::<Vec<_>>()
        .join("\n");

    let user_prompt = format!(
        "Write a {tone} story based on this request: {prompt}\n\n{length_instruction}\n\nIf relevant, naturally weave in the grounded context below.\n\nContext:\n{context_block}"
    );

    let messages = vec![
        serde_json::json!({"role": "system", "content": STORY_SYSTEM}),
        serde_json::json!({"role": "user", "content": user_prompt}),
    ];

    let (story, returned_model) = bwoc::send_message(&cfg, &messages, 0.9, 700).await?;

    Ok(StoryGenerationResult {
        story,
        model: returned_model,
        provider: "bwoc".to_string(),
        context_summary,
    })
}

#[tauri::command]
pub fn save_story(state: State<DbState>, data: SaveStoryInput) -> Result<Story, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO stories (prompt, tone, story, model, provider, context_summary) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![data.prompt, data.tone, data.story, data.model, data.provider, data.context_summary],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, prompt, tone, story, model, provider, context_summary, created_at FROM stories WHERE id = ?1",
        [id],
        |row| Ok(Story {
            id: row.get(0)?, prompt: row.get(1)?, tone: row.get(2)?, story: row.get(3)?,
            model: row.get(4)?, provider: row.get(5)?, context_summary: row.get(6)?, created_at: row.get(7)?,
        }),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_stories(state: State<DbState>) -> Result<Vec<Story>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, prompt, tone, story, model, provider, context_summary, created_at FROM stories ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let stories = stmt
        .query_map([], |row| {
            Ok(Story {
                id: row.get(0)?,
                prompt: row.get(1)?,
                tone: row.get(2)?,
                story: row.get(3)?,
                model: row.get(4)?,
                provider: row.get(5)?,
                context_summary: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(stories)
}

#[tauri::command]
pub fn delete_story(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM stories WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
