//! Generic settings + query helpers shared across commands.
//!
//! This module holds backend-neutral persistence helpers. It carries no AI/LLM
//! transport logic — that lives in [`crate::bwoc`].

use rusqlite::Connection;

/// Read a single setting from the database, returning None if not found.
pub fn get_setting(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| {
        row.get(0)
    })
    .ok()
}

/// Read a setting that must exist and be non-empty, or return a user-facing error.
pub fn get_required_setting(conn: &Connection, key: &str) -> Result<String, String> {
    get_setting(conn, key)
        .filter(|v| !v.trim().is_empty())
        .ok_or_else(|| format!("Missing '{key}' setting. Configure it in Settings."))
}

/// Run a query and map each row to a String.
pub fn query_strings<F>(conn: &Connection, sql: &str, mut mapper: F) -> Result<Vec<String>, String>
where
    F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<String>,
{
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let results = stmt
        .query_map([], |row| mapper(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    results
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
            .unwrap();
        conn
    }

    #[test]
    fn test_get_setting_no_table_returns_none() {
        let conn = Connection::open_in_memory().unwrap();
        assert_eq!(get_setting(&conn, "any_key"), None);
    }

    #[test]
    fn test_get_setting_missing_key_returns_none() {
        let conn = setup_test_db();
        assert_eq!(get_setting(&conn, "nonexistent"), None);
    }

    #[test]
    fn test_get_setting_existing_key_returns_value() {
        let conn = setup_test_db();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)",
            ["api_key", "secret123"],
        )
        .unwrap();
        assert_eq!(get_setting(&conn, "api_key"), Some("secret123".to_string()));
    }

    #[test]
    fn test_get_required_setting_missing_key_returns_error() {
        let conn = setup_test_db();
        let result = get_required_setting(&conn, "bwoc_agent_id");
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("Missing 'bwoc_agent_id' setting"));
    }

    #[test]
    fn test_get_required_setting_empty_value_returns_error() {
        let conn = setup_test_db();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)",
            ["bwoc_agent_id", "   "],
        )
        .unwrap();
        assert!(get_required_setting(&conn, "bwoc_agent_id").is_err());
    }

    #[test]
    fn test_get_required_setting_valid_value_returns_ok() {
        let conn = setup_test_db();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)",
            ["bwoc_agent_id", "agent-growth-coach"],
        )
        .unwrap();
        assert_eq!(
            get_required_setting(&conn, "bwoc_agent_id").unwrap(),
            "agent-growth-coach"
        );
    }
}
