use crate::db::DbState;
use crate::store;
use crate::models::{HealthMetric, HealthSummary, HealthSync};
use tauri::State;

// ---------------------------------------------------------------------------
// Apple Health XML Import
// ---------------------------------------------------------------------------

/// Mapping from HealthKit type identifiers to our unified metric types.
fn map_apple_health_type(hk_type: &str) -> Option<(&'static str, &'static str)> {
    match hk_type {
        "HKQuantityTypeIdentifierStepCount" => Some(("steps", "count")),
        "HKQuantityTypeIdentifierHeartRate" => Some(("heart_rate", "bpm")),
        "HKQuantityTypeIdentifierBodyMass" => Some(("weight_kg", "kg")),
        "HKQuantityTypeIdentifierActiveEnergyBurned" => Some(("calories_burned", "kcal")),
        "HKQuantityTypeIdentifierDistanceWalkingRunning"
        | "HKQuantityTypeIdentifierDistanceCycling" => Some(("distance_m", "m")),
        "HKQuantityTypeIdentifierAppleExerciseTime" => Some(("active_minutes", "min")),
        _ => None,
    }
}

/// Parse Apple Health date format "2024-01-15 08:30:00 -0700" to ISO 8601.
fn parse_apple_date(s: &str) -> String {
    // The export format is "YYYY-MM-DD HH:MM:SS ±HHMM"
    // Convert to "YYYY-MM-DDTHH:MM:SS" (drop timezone for simplicity, keep local time)
    if let Some(space_tz) = s.rfind(' ') {
        let without_tz = &s[..space_tz];
        without_tz.replace(' ', "T")
    } else {
        s.replace(' ', "T")
    }
}

#[tauri::command]
pub async fn import_apple_health(
    state: State<'_, DbState>,
    file_path: String,
) -> Result<HealthSync, String> {
    use quick_xml::events::Event;
    use quick_xml::reader::Reader;
    use std::io::BufReader;

    // Create sync record
    let sync_id = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO health_syncs (source, sync_type) VALUES ('apple_health', 'full_import')",
            [],
        )
        .map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };

    let file = std::fs::File::open(&file_path).map_err(|e| format!("Failed to open file: {e}"))?;
    let buf_reader = BufReader::with_capacity(64 * 1024, file);
    let mut reader = Reader::from_reader(buf_reader);
    reader.config_mut().trim_text(true);

    let mut buf = Vec::new();
    let mut records_added: i64 = 0;
    let mut batch: Vec<BatchRow> = Vec::new();
    let batch_size = 1000;

    // Also handle sleep and workouts from <Record> elements
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) | Ok(Event::Start(ref e)) => {
                let name = e.name();
                let name_bytes = name.as_ref();

                if name_bytes == b"Record" {
                    let mut hk_type = String::new();
                    let mut value_str = String::new();
                    let mut start_date = String::new();
                    let mut end_date = String::new();

                    for attr in e.attributes().flatten() {
                        match attr.key.as_ref() {
                            b"type" => hk_type = String::from_utf8_lossy(&attr.value).to_string(),
                            b"value" => {
                                value_str = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            b"startDate" => {
                                start_date = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            b"endDate" => {
                                end_date = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            _ => {}
                        }
                    }

                    // Handle sleep analysis separately
                    if hk_type == "HKCategoryTypeIdentifierSleepAnalysis" {
                        if let (Ok(start), Ok(end)) = (
                            chrono::NaiveDateTime::parse_from_str(
                                start_date
                                    .rsplit_once(' ')
                                    .map(|(d, _)| d)
                                    .unwrap_or(&start_date),
                                "%Y-%m-%d %H:%M:%S",
                            ),
                            chrono::NaiveDateTime::parse_from_str(
                                end_date
                                    .rsplit_once(' ')
                                    .map(|(d, _)| d)
                                    .unwrap_or(&end_date),
                                "%Y-%m-%d %H:%M:%S",
                            ),
                        ) {
                            let duration_min = (end - start).num_minutes() as f64;
                            if duration_min > 0.0 {
                                let recorded = parse_apple_date(&start_date);
                                let end_iso = parse_apple_date(&end_date);
                                batch.push((
                                    "sleep_minutes".to_string(),
                                    "min".to_string(),
                                    duration_min,
                                    recorded,
                                    Some(end_iso),
                                    None,
                                ));
                            }
                        }
                    } else if let Some((metric_type, unit)) = map_apple_health_type(&hk_type) {
                        if let Ok(value) = value_str.parse::<f64>() {
                            let recorded = parse_apple_date(&start_date);
                            let end_iso = if end_date.is_empty() {
                                None
                            } else {
                                Some(parse_apple_date(&end_date))
                            };
                            batch.push((
                                metric_type.to_string(),
                                unit.to_string(),
                                value,
                                recorded,
                                end_iso,
                                None,
                            ));
                        }
                    }
                } else if name_bytes == b"Workout" {
                    let mut activity_type = String::new();
                    let mut duration_str = String::new();
                    let mut start_date = String::new();
                    let mut end_date = String::new();

                    for attr in e.attributes().flatten() {
                        match attr.key.as_ref() {
                            b"workoutActivityType" => {
                                activity_type = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            b"duration" => {
                                duration_str = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            b"startDate" => {
                                start_date = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            b"endDate" => {
                                end_date = String::from_utf8_lossy(&attr.value).to_string()
                            }
                            _ => {}
                        }
                    }

                    if let Ok(duration) = duration_str.parse::<f64>() {
                        let recorded = parse_apple_date(&start_date);
                        let end_iso = if end_date.is_empty() {
                            None
                        } else {
                            Some(parse_apple_date(&end_date))
                        };
                        let workout_name = activity_type
                            .strip_prefix("HKWorkoutActivityType")
                            .unwrap_or(&activity_type)
                            .to_string();
                        let metadata =
                            serde_json::json!({ "workout_type": workout_name }).to_string();
                        batch.push((
                            "workout".to_string(),
                            "min".to_string(),
                            duration,
                            recorded,
                            end_iso,
                            Some(metadata),
                        ));
                    }
                }

                // Flush batch
                if batch.len() >= batch_size {
                    let added = flush_batch(&state, &batch)?;
                    records_added += added;
                    batch.clear();
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("XML parse error: {e}")),
            _ => {}
        }
        buf.clear();
    }

    // Flush remaining
    if !batch.is_empty() {
        let added = flush_batch(&state, &batch)?;
        records_added += added;
    }

    // Update sync record
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE health_syncs SET status = 'completed', records_added = ?1, completed_at = datetime('now') WHERE id = ?2",
        rusqlite::params![records_added, sync_id],
    ).map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, source, sync_type, records_added, records_updated, started_at, completed_at, status, error_message FROM health_syncs WHERE id = ?1",
        [sync_id],
        |row| Ok(HealthSync {
            id: row.get(0)?,
            source: row.get(1)?,
            sync_type: row.get(2)?,
            records_added: row.get(3)?,
            records_updated: row.get(4)?,
            started_at: row.get(5)?,
            completed_at: row.get(6)?,
            status: row.get(7)?,
            error_message: row.get(8)?,
        }),
    ).map_err(|e| e.to_string())
}

/// Batch type: (metric_type, unit, value, recorded_at, end_at, metadata)
type BatchRow = (String, String, f64, String, Option<String>, Option<String>);

#[allow(clippy::type_complexity)]
fn flush_batch(state: &State<DbState>, batch: &[BatchRow]) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let mut count = 0i64;

    for (metric_type, unit, value, recorded_at, end_at, metadata) in batch {
        let result = tx.execute(
            "INSERT OR REPLACE INTO health_metrics (source, metric_type, value, unit, recorded_at, end_at, metadata)
             VALUES ('apple_health', ?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![metric_type, value, unit, recorded_at, end_at, metadata],
        );
        if result.is_ok() {
            count += 1;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(count)
}

// ---------------------------------------------------------------------------
// Google Fit OAuth + Sync
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_FIT_SCOPES: &str = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.sleep.read";

#[tauri::command]
pub fn start_google_fit_auth(state: State<DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let client_id = store::get_required_setting(&conn, "gfit_client_id")?;

    let redirect_uri = "urn:ietf:wg:oauth:2.0:oob";

    let url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        GOOGLE_AUTH_URL,
        urlencoding(&client_id),
        urlencoding(redirect_uri),
        urlencoding(GOOGLE_FIT_SCOPES),
    );

    Ok(url)
}

fn urlencoding(s: &str) -> String {
    s.replace(' ', "%20")
        .replace(':', "%3A")
        .replace('/', "%2F")
        .replace('?', "%3F")
        .replace('&', "%26")
        .replace('=', "%3D")
        .replace('+', "%2B")
}

#[tauri::command]
pub async fn complete_google_fit_auth(
    state: State<'_, DbState>,
    auth_code: String,
) -> Result<(), String> {
    let (client_id, client_secret) = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let id = store::get_required_setting(&conn, "gfit_client_id")?;
        let secret = store::get_required_setting(&conn, "gfit_client_secret")?;
        (id, secret)
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", auth_code.as_str()),
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("redirect_uri", "urn:ietf:wg:oauth:2.0:oob"),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| format!("Token exchange failed: {e}"))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Token exchange error: {text}"));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    let access_token = data["access_token"].as_str().unwrap_or("").to_string();
    let refresh_token = data["refresh_token"].as_str().unwrap_or("").to_string();

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    set_setting(&conn, "gfit_access_token", &access_token)?;
    if !refresh_token.is_empty() {
        set_setting(&conn, "gfit_refresh_token", &refresh_token)?;
    }

    Ok(())
}

fn set_setting(conn: &rusqlite::Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

/// Refresh access token using refresh token.
async fn refresh_google_token(state: &State<'_, DbState>) -> Result<String, String> {
    let (client_id, client_secret, refresh_token) = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let id = store::get_required_setting(&conn, "gfit_client_id")?;
        let secret = store::get_required_setting(&conn, "gfit_client_secret")?;
        let token = store::get_required_setting(&conn, "gfit_refresh_token")?;
        (id, secret, token)
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", &client_secret),
            ("refresh_token", &refresh_token),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Token refresh failed: {e}"))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Token refresh error: {text}"));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let access_token = data["access_token"]
        .as_str()
        .ok_or("No access_token in refresh response")?
        .to_string();

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    set_setting(&conn, "gfit_access_token", &access_token)?;

    Ok(access_token)
}

fn map_google_fit_type(data_type: &str) -> Option<(&'static str, &'static str)> {
    match data_type {
        "com.google.step_count.delta" => Some(("steps", "count")),
        "com.google.heart_rate.bpm" => Some(("heart_rate", "bpm")),
        "com.google.weight" => Some(("weight_kg", "kg")),
        "com.google.calories.expended" => Some(("calories_burned", "kcal")),
        "com.google.distance.delta" => Some(("distance_m", "m")),
        "com.google.active_minutes" => Some(("active_minutes", "min")),
        _ => None,
    }
}

#[tauri::command]
pub async fn sync_google_fit(
    state: State<'_, DbState>,
    days_back: Option<i64>,
) -> Result<HealthSync, String> {
    let days = days_back.unwrap_or(30);

    // Create sync record
    let sync_id = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO health_syncs (source, sync_type) VALUES ('google_fit', 'incremental')",
            [],
        )
        .map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };

    // Get or refresh access token
    let access_token = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        store::get_setting(&conn, "gfit_access_token").filter(|t| !t.is_empty())
    };

    let token = match access_token {
        Some(t) => t,
        None => refresh_google_token(&state).await?,
    };

    let now = chrono::Utc::now();
    let start = now - chrono::Duration::days(days);
    let start_millis = start.timestamp_millis();
    let end_millis = now.timestamp_millis();

    let data_types = [
        "com.google.step_count.delta",
        "com.google.heart_rate.bpm",
        "com.google.weight",
        "com.google.calories.expended",
        "com.google.distance.delta",
        "com.google.active_minutes",
    ];

    let aggregate_by: Vec<serde_json::Value> = data_types
        .iter()
        .map(|dt| serde_json::json!({ "dataTypeName": dt }))
        .collect();

    let body = serde_json::json!({
        "aggregateBy": aggregate_by,
        "bucketByTime": { "durationMillis": 86400000 },
        "startTimeMillis": start_millis,
        "endTimeMillis": end_millis,
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Google Fit API error: {e}"))?;

    if resp.status().as_u16() == 401 {
        // Token expired, refresh and retry once
        let new_token = refresh_google_token(&state).await?;
        let resp = client
            .post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
            .bearer_auth(&new_token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Google Fit API error: {e}"))?;

        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            let conn = state.0.lock().map_err(|e| e.to_string())?;
            conn.execute(
                "UPDATE health_syncs SET status = 'failed', error_message = ?1, completed_at = datetime('now') WHERE id = ?2",
                rusqlite::params![text, sync_id],
            ).map_err(|e| e.to_string())?;
            return Err(format!("Google Fit error after refresh: {text}"));
        }

        let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
        let records_added = process_google_fit_response(&state, &data)?;
        return finalize_sync(&state, sync_id, records_added);
    }

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE health_syncs SET status = 'failed', error_message = ?1, completed_at = datetime('now') WHERE id = ?2",
            rusqlite::params![text, sync_id],
        ).map_err(|e| e.to_string())?;
        return Err(format!("Google Fit error: {text}"));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let records_added = process_google_fit_response(&state, &data)?;
    finalize_sync(&state, sync_id, records_added)
}

fn process_google_fit_response(
    state: &State<DbState>,
    data: &serde_json::Value,
) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let mut count = 0i64;

    if let Some(buckets) = data["bucket"].as_array() {
        for bucket in buckets {
            let start_millis = bucket["startTimeMillis"]
                .as_str()
                .and_then(|s| s.parse::<i64>().ok())
                .or_else(|| bucket["startTimeMillis"].as_i64())
                .unwrap_or(0);

            let recorded_at = chrono::DateTime::from_timestamp_millis(start_millis)
                .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S").to_string())
                .unwrap_or_default();

            if recorded_at.is_empty() {
                continue;
            }

            if let Some(datasets) = bucket["dataset"].as_array() {
                for dataset in datasets {
                    let data_type = dataset["dataSourceId"].as_str().unwrap_or("");

                    // Extract the data type name from the dataSourceId
                    let type_name = data_type
                        .split(':')
                        .find(|s| s.starts_with("com.google."))
                        .unwrap_or(data_type);

                    if let Some((metric_type, unit)) = map_google_fit_type(type_name) {
                        if let Some(points) = dataset["point"].as_array() {
                            for point in points {
                                if let Some(values) = point["value"].as_array() {
                                    if let Some(val) = values.first() {
                                        let value = val["fpVal"]
                                            .as_f64()
                                            .or_else(|| val["intVal"].as_i64().map(|i| i as f64))
                                            .unwrap_or(0.0);

                                        if value > 0.0 {
                                            let point_start = point["startTimeNanos"]
                                                .as_str()
                                                .and_then(|s| s.parse::<i64>().ok())
                                                .map(|ns| {
                                                    chrono::DateTime::from_timestamp_nanos(ns)
                                                        .format("%Y-%m-%dT%H:%M:%S")
                                                        .to_string()
                                                })
                                                .unwrap_or_else(|| recorded_at.clone());

                                            let _ = tx.execute(
                                                "INSERT OR REPLACE INTO health_metrics (source, metric_type, value, unit, recorded_at)
                                                 VALUES ('google_fit', ?1, ?2, ?3, ?4)",
                                                rusqlite::params![metric_type, value, unit, point_start],
                                            );
                                            count += 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(count)
}

fn finalize_sync(
    state: &State<DbState>,
    sync_id: i64,
    records_added: i64,
) -> Result<HealthSync, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE health_syncs SET status = 'completed', records_added = ?1, completed_at = datetime('now') WHERE id = ?2",
        rusqlite::params![records_added, sync_id],
    ).map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, source, sync_type, records_added, records_updated, started_at, completed_at, status, error_message FROM health_syncs WHERE id = ?1",
        [sync_id],
        |row| Ok(HealthSync {
            id: row.get(0)?,
            source: row.get(1)?,
            sync_type: row.get(2)?,
            records_added: row.get(3)?,
            records_updated: row.get(4)?,
            started_at: row.get(5)?,
            completed_at: row.get(6)?,
            status: row.get(7)?,
            error_message: row.get(8)?,
        }),
    ).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Health Query Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_health_metrics(
    state: State<DbState>,
    metric_type: Option<String>,
    days: Option<i64>,
    source: Option<String>,
) -> Result<Vec<HealthMetric>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let days = days.unwrap_or(30);
    let interval = format!("-{} days", days);

    let mut sql = String::from(
        "SELECT id, source, metric_type, value, unit, recorded_at, end_at, metadata, created_at FROM health_metrics WHERE recorded_at >= datetime('now', ?1)"
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(interval)];

    if let Some(ref mt) = metric_type {
        sql.push_str(" AND metric_type = ?2");
        params.push(Box::new(mt.clone()));
    }
    if let Some(ref src) = source {
        let param_idx = params.len() + 1;
        sql.push_str(&format!(" AND source = ?{param_idx}"));
        params.push(Box::new(src.clone()));
    }

    sql.push_str(" ORDER BY recorded_at DESC LIMIT 500");

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let metrics = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(HealthMetric {
                id: row.get(0)?,
                source: row.get(1)?,
                metric_type: row.get(2)?,
                value: row.get(3)?,
                unit: row.get(4)?,
                recorded_at: row.get(5)?,
                end_at: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(metrics)
}

#[tauri::command]
pub fn get_health_summary(state: State<DbState>) -> Result<Vec<HealthSummary>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT DISTINCT metric_type FROM health_metrics ORDER BY metric_type")
        .map_err(|e| e.to_string())?;

    let metric_types: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut summaries = Vec::new();

    for mt in &metric_types {
        // Latest value and unit
        let latest: Option<(f64, String)> = conn
            .query_row(
                "SELECT value, unit FROM health_metrics WHERE metric_type = ?1 ORDER BY recorded_at DESC LIMIT 1",
                [mt],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();

        let (latest_value, unit) = match latest {
            Some(v) => v,
            None => continue,
        };

        // 7-day average
        let avg_7d: Option<f64> = conn
            .query_row(
                "SELECT AVG(value) FROM health_metrics WHERE metric_type = ?1 AND recorded_at >= datetime('now', '-7 days')",
                [mt],
                |row| row.get(0),
            )
            .ok()
            .flatten();

        // 30-day average
        let avg_30d: Option<f64> = conn
            .query_row(
                "SELECT AVG(value) FROM health_metrics WHERE metric_type = ?1 AND recorded_at >= datetime('now', '-30 days')",
                [mt],
                |row| row.get(0),
            )
            .ok()
            .flatten();

        // Trend: compare recent 7d avg vs prior 7d avg
        let prior_7d_avg: Option<f64> = conn
            .query_row(
                "SELECT AVG(value) FROM health_metrics WHERE metric_type = ?1 AND recorded_at >= datetime('now', '-14 days') AND recorded_at < datetime('now', '-7 days')",
                [mt],
                |row| row.get(0),
            )
            .ok()
            .flatten();

        let trend = match (avg_7d, prior_7d_avg) {
            (Some(curr), Some(prev)) if prev > 0.0 => {
                let change = (curr - prev) / prev;
                if change > 0.05 {
                    "up".to_string()
                } else if change < -0.05 {
                    "down".to_string()
                } else {
                    "stable".to_string()
                }
            }
            _ => "stable".to_string(),
        };

        summaries.push(HealthSummary {
            metric_type: mt.clone(),
            latest_value,
            unit,
            avg_7d,
            avg_30d,
            trend,
        });
    }

    Ok(summaries)
}

#[tauri::command]
pub fn list_health_syncs(state: State<DbState>) -> Result<Vec<HealthSync>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, source, sync_type, records_added, records_updated, started_at, completed_at, status, error_message FROM health_syncs ORDER BY started_at DESC LIMIT 20"
        )
        .map_err(|e| e.to_string())?;

    let syncs = stmt
        .query_map([], |row| {
            Ok(HealthSync {
                id: row.get(0)?,
                source: row.get(1)?,
                sync_type: row.get(2)?,
                records_added: row.get(3)?,
                records_updated: row.get(4)?,
                started_at: row.get(5)?,
                completed_at: row.get(6)?,
                status: row.get(7)?,
                error_message: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(syncs)
}

#[tauri::command]
pub fn delete_health_data(state: State<DbState>, source: Option<String>) -> Result<u64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let count = if let Some(src) = source {
        conn.execute("DELETE FROM health_metrics WHERE source = ?1", [&src])
            .map_err(|e| e.to_string())?
    } else {
        conn.execute("DELETE FROM health_metrics", [])
            .map_err(|e| e.to_string())?
    };

    Ok(count as u64)
}
