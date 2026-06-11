use rusqlite::{Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_data_dir: PathBuf) -> SqlResult<Connection> {
    std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");
    let db_path = app_data_dir.join("self-growth.db");
    let conn = Connection::open(db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> SqlResult<()> {
    // Create migrations table if it doesn't exist
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    let migrations: Vec<(&str, &str)> = vec![
        ("001_initial", include_str!("../migrations/001_initial.sql")),
        (
            "002_new_features",
            include_str!("../migrations/002_new_features.sql"),
        ),
        (
            "003_health_integration",
            include_str!("../migrations/003_health_integration.sql"),
        ),
        ("004_ledger", include_str!("../migrations/004_ledger.sql")),
        ("005_todos", include_str!("../migrations/005_todos.sql")),
        (
            "006_health_checkups",
            include_str!("../migrations/006_health_checkups.sql"),
        ),
        (
            "007_chat_conversations",
            include_str!("../migrations/007_chat_conversations.sql"),
        ),
        (
            "008_habit_identity",
            include_str!("../migrations/008_habit_identity.sql"),
        ),
        (
            "009_bwoc_migration",
            include_str!("../migrations/009_bwoc_migration.sql"),
        ),
    ];

    for (name, sql) in migrations {
        let already_applied: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM _migrations WHERE name = ?1",
            [name],
            |row| row.get(0),
        )?;

        if !already_applied {
            conn.execute_batch(sql)?;
            conn.execute("INSERT INTO _migrations (name) VALUES (?1)", [name])?;
        }
    }

    Ok(())
}
