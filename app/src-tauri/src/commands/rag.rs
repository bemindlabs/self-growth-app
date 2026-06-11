use crate::db::DbState;
use crate::models::SearchResult;
use tauri::State;

#[cfg(not(any(target_os = "ios", target_os = "android")))]
use crate::embedder::EmbedderState;

#[cfg(any(target_os = "ios", target_os = "android"))]
use crate::bwoc;

// ---------------------------------------------------------------------------
// Desktop: local embeddings via fastembed
// ---------------------------------------------------------------------------

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[tauri::command]
pub fn semantic_search(
    db_state: State<DbState>,
    embedder_state: State<EmbedderState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let limit = limit.unwrap_or(10);

    let query_embedding = embedder_state.embed(&query).map_err(|e| e.to_string())?;

    search_with_embedding(&db_state, &query_embedding, limit)
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[tauri::command]
pub fn rebuild_embeddings(
    db_state: State<DbState>,
    embedder_state: State<EmbedderState>,
) -> Result<u32, String> {
    use sha2::{Digest, Sha256};

    let conn = db_state.0.lock().map_err(|e| e.to_string())?;
    let mut count = 0u32;

    for (table, sql) in EMBED_QUERIES {
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let items: Vec<(i64, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        for (id, text) in &items {
            let hash = format!(
                "{:x}",
                Sha256::new().chain_update(text.as_bytes()).finalize()
            );
            if !embedding_exists(&conn, table, *id, &hash) {
                let emb = embedder_state.embed(text).map_err(|e| e.to_string())?;
                upsert_embedding(&conn, table, *id, &hash, &emb).map_err(|e| e.to_string())?;
                count += 1;
            }
        }
    }

    Ok(count)
}

// ---------------------------------------------------------------------------
// Mobile: LLM-powered semantic search (no embedding provider needed)
// ---------------------------------------------------------------------------

#[cfg(any(target_os = "ios", target_os = "android"))]
#[tauri::command]
pub async fn semantic_search(
    db_state: State<'_, DbState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let limit = limit.unwrap_or(10);
    let cfg = bwoc::bwoc_config(&db_state)?;

    // Collect all searchable items from DB
    let items = {
        let conn = db_state.0.lock().map_err(|e| e.to_string())?;
        collect_all_items(&conn)?
    };

    if items.is_empty() {
        return Ok(vec![]);
    }

    // Build a numbered list for the LLM
    let item_list: String = items
        .iter()
        .enumerate()
        .map(|(i, (table, id, text))| format!("{}. [{}:{}] {}", i + 1, table, id, text))
        .collect::<Vec<_>>()
        .join("\n");

    let system = "You are a search ranking system. Given a query and a numbered list of items, return ONLY the numbers of the most relevant items in order of relevance, separated by commas. Return at most the requested number of results. If nothing is relevant, return \"none\". Do not explain.";
    let user_prompt =
        format!("Query: {query}\nReturn top {limit} relevant items.\n\nItems:\n{item_list}");

    let messages = vec![
        serde_json::json!({"role": "system", "content": system}),
        serde_json::json!({"role": "user", "content": user_prompt}),
    ];

    let (response, _) =
        bwoc::send_message(&cfg, &messages, 0.0, 100)
            .await?;

    // Parse the LLM response — extract numbers
    let indices: Vec<usize> = response
        .replace("none", "")
        .split(|c: char| !c.is_ascii_digit())
        .filter_map(|s| s.parse::<usize>().ok())
        .filter(|&n| n >= 1 && n <= items.len())
        .collect();

    let conn = db_state.0.lock().map_err(|e| e.to_string())?;
    let results: Vec<SearchResult> = indices
        .iter()
        .take(limit)
        .enumerate()
        .map(|(rank, &idx)| {
            let (table, id, _) = &items[idx - 1];
            let (title, description) = fetch_source_info(&conn, table, *id);
            SearchResult {
                source_table: table.clone(),
                source_id: *id,
                title,
                description,
                score: 1.0 - (rank as f32 * 0.1), // descending relevance score
            }
        })
        .collect();

    Ok(results)
}

#[cfg(any(target_os = "ios", target_os = "android"))]
#[tauri::command]
pub async fn rebuild_embeddings(_db_state: State<'_, DbState>) -> Result<u32, String> {
    // Mobile uses LLM-based ranking at search time — no pre-built index needed
    Ok(0)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/// Queries used to collect text for embedding/search from each table.
const EMBED_QUERIES: &[(&str, &str)] = &[
    ("skills", "SELECT id, name || ' (' || category || ')' FROM skills"),
    ("learning_items", "SELECT id, title || ' ' || COALESCE(description, '') FROM learning_items"),
    ("routines", "SELECT id, name || ' ' || COALESCE(description, '') FROM routines"),
    ("health_daily",
     "SELECT CAST(julianday(date(recorded_at)) AS INTEGER) as id, \
      'Health on ' || date(recorded_at) || ': ' || \
      GROUP_CONCAT(metric_type || ' ' || CAST(ROUND(SUM(value), 1) AS TEXT) || ' ' || unit, ', ') \
      FROM health_metrics \
      GROUP BY date(recorded_at) \
      ORDER BY date(recorded_at) DESC \
      LIMIT 90"),
    ("todos", "SELECT id, title || ' ' || COALESCE(description, '') || CASE WHEN due_date IS NOT NULL THEN ' due ' || due_date ELSE '' END || ' [' || priority || ']' FROM todos WHERE status NOT IN ('completed', 'cancelled')"),
    ("ledger", "SELECT id, entry_type || ': ' || title || ' ' || CAST(amount AS TEXT) || ' ' || currency || ' [' || category || '] ' || entry_date || ' ' || COALESCE(description, '') FROM ledger_entries ORDER BY entry_date DESC LIMIT 100"),
    ("health_checkups", "SELECT id, title || ' (' || checkup_date || ') [' || category || '] ' || results || ' ' || COALESCE(notes, '') FROM health_checkups ORDER BY checkup_date DESC"),
];

#[allow(dead_code)]
fn collect_all_items(conn: &rusqlite::Connection) -> Result<Vec<(String, i64, String)>, String> {
    let mut items = Vec::new();
    for (table, sql) in EMBED_QUERIES {
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let rows: Vec<(i64, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        for (id, text) in rows {
            items.push((table.to_string(), id, text));
        }
    }
    Ok(items)
}

fn search_with_embedding(
    db_state: &State<DbState>,
    query_embedding: &[f32],
    limit: usize,
) -> Result<Vec<SearchResult>, String> {
    let conn = db_state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, source_table, source_id, embedding FROM embeddings")
        .map_err(|e| e.to_string())?;

    let mut scored: Vec<(String, i64, f32)> = stmt
        .query_map([], |row| {
            let source_table: String = row.get(1)?;
            let source_id: i64 = row.get(2)?;
            let blob: Vec<u8> = row.get(3)?;
            Ok((source_table, source_id, blob))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|(table, id, blob)| {
            let embedding = bytes_to_f32(&blob);
            let score = crate::search::cosine_similarity(query_embedding, &embedding);
            (table, id, score)
        })
        .collect();

    scored.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(limit);

    let results: Vec<SearchResult> = scored
        .into_iter()
        .filter(|(_, _, score)| *score > 0.1)
        .map(|(table, id, score)| {
            let (title, description) = fetch_source_info(&conn, &table, id);
            SearchResult {
                source_table: table,
                source_id: id,
                title,
                description,
                score,
            }
        })
        .collect();

    Ok(results)
}

fn bytes_to_f32(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
        .collect()
}

fn f32_to_bytes(floats: &[f32]) -> Vec<u8> {
    floats.iter().flat_map(|f| f.to_le_bytes()).collect()
}

fn embedding_exists(conn: &rusqlite::Connection, table: &str, id: i64, hash: &str) -> bool {
    conn.query_row(
        "SELECT COUNT(*) > 0 FROM embeddings WHERE source_table = ?1 AND source_id = ?2 AND content_hash = ?3",
        rusqlite::params![table, id, hash],
        |row| row.get::<_, bool>(0),
    )
    .unwrap_or(false)
}

fn upsert_embedding(
    conn: &rusqlite::Connection,
    table: &str,
    id: i64,
    hash: &str,
    embedding: &[f32],
) -> rusqlite::Result<()> {
    let blob = f32_to_bytes(embedding);
    conn.execute(
        "INSERT INTO embeddings (source_table, source_id, content_hash, embedding, updated_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(source_table, source_id) DO UPDATE SET
            content_hash = excluded.content_hash,
            embedding = excluded.embedding,
            updated_at = excluded.updated_at",
        rusqlite::params![table, id, hash, blob],
    )?;
    Ok(())
}

fn fetch_source_info(
    conn: &rusqlite::Connection,
    table: &str,
    id: i64,
) -> (String, Option<String>) {
    match table {
        "skills" => conn
            .query_row("SELECT name, category FROM skills WHERE id = ?1", [id], |row| {
                Ok((row.get::<_, String>(0)?, Some(row.get::<_, String>(1)?)))
            })
            .unwrap_or(("Unknown".to_string(), None)),
        "learning_items" => conn
            .query_row("SELECT title, description FROM learning_items WHERE id = ?1", [id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
            })
            .unwrap_or(("Unknown".to_string(), None)),
        "routines" => conn
            .query_row("SELECT name, description FROM routines WHERE id = ?1", [id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
            })
            .unwrap_or(("Unknown".to_string(), None)),
        "health_daily" => {
            // id is julian day number — find the matching date and build summary
            let result: Result<(String, String), _> = conn.query_row(
                "SELECT date(recorded_at), \
                 GROUP_CONCAT(metric_type || ': ' || CAST(ROUND(SUM(value),1) AS TEXT) || ' ' || unit, ', ') \
                 FROM health_metrics \
                 WHERE CAST(julianday(date(recorded_at)) AS INTEGER) = ?1 \
                 GROUP BY date(recorded_at)",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            );
            match result {
                Ok((date, summary)) => (format!("Health - {}", date), Some(summary)),
                Err(_) => ("Health data".to_string(), None),
            }
        }
        "todos" => conn
            .query_row(
                "SELECT title, description || CASE WHEN due_date IS NOT NULL THEN ' (due ' || due_date || ')' ELSE '' END FROM todos WHERE id = ?1",
                [id],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?)),
            )
            .unwrap_or(("Unknown".to_string(), None)),
        "ledger" => conn
            .query_row(
                "SELECT title, entry_type || ' ' || CAST(amount AS TEXT) || ' ' || currency || ' [' || category || '] ' || entry_date FROM ledger_entries WHERE id = ?1",
                [id],
                |row| Ok((row.get::<_, String>(0)?, Some(row.get::<_, String>(1)?))),
            )
            .unwrap_or(("Unknown".to_string(), None)),
        "health_checkups" => conn
            .query_row(
                "SELECT title || ' (' || checkup_date || ')', results FROM health_checkups WHERE id = ?1",
                [id],
                |row| Ok((row.get::<_, String>(0)?, Some(row.get::<_, String>(1)?))),
            )
            .unwrap_or(("Unknown".to_string(), None)),
        _ => ("Unknown".to_string(), None),
    }
}
