mod bwoc;
mod commands;
mod db;
mod embedder;
mod models;
mod search;
mod store;

use db::DbState;
use embedder::EmbedderState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            let conn = db::init_db(app_data_dir).expect("Failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));

            let embedder = EmbedderState::new().expect("Failed to initialize embedder");
            app.manage(embedder);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Skills
            commands::skills::list_skills,
            commands::skills::create_skill,
            commands::skills::update_skill,
            commands::skills::delete_skill,
            // Routines
            commands::routines::list_routines,
            commands::routines::create_routine,
            commands::routines::update_routine,
            commands::routines::delete_routine,
            commands::routines::get_routine_steps,
            commands::routines::add_routine_step,
            commands::routines::delete_routine_step,
            commands::routines::complete_routine,
            commands::routines::get_routine_logs,
            // Learning
            commands::learning::list_learning_items,
            commands::learning::create_learning_item,
            commands::learning::update_learning_item,
            commands::learning::delete_learning_item,
            // Goals
            commands::goals::list_goals,
            commands::goals::create_goal,
            commands::goals::update_goal,
            commands::goals::delete_goal,
            // Progress
            commands::progress::list_progress,
            commands::progress::create_progress_entry,
            commands::progress::get_dashboard_stats,
            commands::progress::get_life_balance,
            // Analytics
            commands::analytics::get_mood_habit_correlation,
            // Settings
            commands::settings::get_app_setting,
            commands::settings::set_app_setting,
            commands::settings::get_all_app_settings,
            commands::settings::reset_app_settings,
            commands::settings::test_bwoc_connection,
            commands::settings::is_mobile_platform,
            // RAG
            commands::rag::semantic_search,
            commands::rag::rebuild_embeddings,
            // Story LLM
            commands::story::generate_story,
            commands::story::save_story,
            commands::story::list_stories,
            commands::story::delete_story,
            // Journal
            commands::journal::list_journal_entries,
            commands::journal::create_journal_entry,
            commands::journal::update_journal_entry,
            commands::journal::delete_journal_entry,
            // Habits
            commands::habits::list_habits,
            commands::habits::create_habit,
            commands::habits::update_habit,
            commands::habits::delete_habit,
            commands::habits::toggle_habit,
            commands::habits::get_habit_logs,
            // AI (BWOC)
            commands::ai::ai_coach,
            commands::ai::ai_insights,
            commands::ai::ai_summarize,
            commands::ai::ai_chat,
            // Ledger
            commands::ledger::list_ledger_entries,
            commands::ledger::create_ledger_entry,
            commands::ledger::update_ledger_entry,
            commands::ledger::delete_ledger_entry,
            commands::ledger::get_ledger_summary,
            // Health
            commands::health::import_apple_health,
            commands::health::start_google_fit_auth,
            commands::health::complete_google_fit_auth,
            commands::health::sync_google_fit,
            commands::health::list_health_metrics,
            commands::health::get_health_summary,
            commands::health::list_health_syncs,
            commands::health::delete_health_data,
            // Todos
            commands::todos::list_todos,
            commands::todos::create_todo,
            commands::todos::update_todo,
            commands::todos::delete_todo,
            commands::todos::complete_todo,
            commands::todos::get_overdue_todos,
            commands::todos::get_today_todos,
            // OCR
            commands::ocr::ocr_extract,
            // Health Checkups
            commands::checkups::list_health_checkups,
            commands::checkups::create_health_checkup,
            commands::checkups::update_health_checkup,
            commands::checkups::delete_health_checkup,
            // Chat Conversations
            commands::chat::list_conversations,
            commands::chat::create_conversation,
            commands::chat::rename_conversation,
            commands::chat::delete_conversation,
            commands::chat::get_conversation_messages,
            commands::chat::save_chat_message,
            // Backup
            commands::backup::export_backup,
            commands::backup::import_backup,
            commands::backup::get_backup_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
