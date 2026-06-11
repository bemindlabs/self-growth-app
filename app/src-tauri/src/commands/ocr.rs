use crate::bwoc;
use crate::db::DbState;
use std::path::Path;
use tauri::State;

const OCR_SYSTEM: &str = "You are an OCR assistant. Extract all text from the provided image accurately. Preserve the structure — use markdown tables for tabular data, bullet points for lists, and headings for sections. For medical/lab results, extract each metric with its value, unit, and reference range if visible. Be thorough and precise.";

const RECEIPT_SYSTEM: &str = "You are a receipt scanner. Extract all items, amounts, and totals from the provided receipt image. Format as a markdown table with columns: Item, Amount. Include the total, date, and merchant name if visible.";

#[tauri::command]
pub async fn ocr_extract(
    state: State<'_, DbState>,
    image_path: String,
    mode: Option<String>,
) -> Result<String, String> {
    let cfg = bwoc::bwoc_config(&state)?;

    let path = Path::new(&image_path);
    if !path.exists() {
        return Err("Image file not found".to_string());
    }

    let image_data = std::fs::read(path).map_err(|e| format!("Failed to read image: {e}"))?;
    let base64 = base64_encode(&image_data);

    let mime = match path.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/jpeg",
    };

    let system_prompt = match mode.as_deref() {
        Some("receipt") => RECEIPT_SYSTEM,
        Some("lab") => "You are a medical lab result scanner. Extract all test results from the image. Format as a markdown table with columns: Test, Result, Unit, Reference Range, Status (Normal/High/Low). Be precise with numbers and units.",
        _ => OCR_SYSTEM,
    };

    let user_prompt = match mode.as_deref() {
        Some("receipt") => "Extract all items and amounts from this receipt.",
        Some("lab") => "Extract all lab test results from this medical document.",
        _ => "Extract all text from this image.",
    };

    let messages = vec![
        serde_json::json!({"role": "system", "content": system_prompt}),
        serde_json::json!({
            "role": "user",
            "content": [
                {"type": "text", "text": user_prompt},
                {"type": "image_url", "image_url": {"url": format!("data:{mime};base64,{base64}")}}
            ]
        }),
    ];

    let (content, _) = bwoc::send_message(&cfg, &messages, 0.1, 2000).await?;
    Ok(content)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}
