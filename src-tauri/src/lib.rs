mod cli;
mod clipboard;
mod crypto;
mod error;
mod format;
mod generator;
mod io;
mod memory;
mod models;
mod vlt;

use error::VaultError;
use generator::{generate_password, GeneratorConfig};
use models::{Entry, VaultData};
use vlt::Vault;
use secrecy::ExposeSecret;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntryDto {
    pub id: String,
    pub title: String,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
    pub category: String,
    pub updated_at: u64,
}

pub struct AppState {
    vault: Mutex<Option<Vault>>,
    vault_path: Mutex<PathBuf>,
}

impl AppState {
    fn new() -> Self {
        let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("vlt");
        std::fs::create_dir_all(&path).ok();
        path.push("vault.dat");

        Self {
            vault: Mutex::new(None),
            vault_path: Mutex::new(path),
        }
    }
}

#[tauri::command]
fn vault_exists(state: State<AppState>) -> Result<bool, String> {
    let path = state.vault_path.lock().unwrap();
    Ok(path.exists())
}

#[tauri::command]
fn create_vault(password: String, confirm_password: String, state: State<AppState>) -> Result<(), String> {
    if password != confirm_password {
        return Err("Passwords do not match".to_string());
    }
    if password.len() < 8 {
        return Err("Password must be at least 8 characters".to_string());
    }

    let path = state.vault_path.lock().unwrap();
    Vault::create(path.as_path(), &password).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn unlock_vault(password: String, state: State<AppState>) -> Result<Vec<EntryDto>, String> {
    let path = state.vault_path.lock().unwrap();
    let vault = Vault::load(path.as_path(), &password).map_err(|e| e.to_string())?;

    let entries: Vec<EntryDto> = vault
        .data
        .entries
        .iter()
        .enumerate()
        .map(|(i, e)| EntryDto {
            id: i.to_string(),
            title: e.name.clone(),
            username: e.name.clone(),
            password: e.secret.clone(),
            notes: None,
            category: "Login".to_string(),
            updated_at: chrono::Utc::now().timestamp_millis() as u64,
        })
        .collect();

    let mut vault_guard = state.vault.lock().unwrap();
    *vault_guard = Some(vault);

    Ok(entries)
}

#[tauri::command]
fn lock_vault(state: State<AppState>) -> Result<(), String> {
    let mut vault_guard = state.vault.lock().unwrap();
    *vault_guard = None;
    Ok(())
}

#[tauri::command]
fn add_entry(
    title: String,
    username: String,
    password: String,
    category: String,
    notes: Option<String>,
    master_password: String,
    state: State<AppState>,
) -> Result<EntryDto, String> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or_else(|| "Vault not unlocked".to_string())?;

    let entry = Entry {
        name: title.clone(),
        secret: password.clone(),
    };
    vault.add_entry(entry);
    vault.save(&master_password).map_err(|e| e.to_string())?;

    Ok(EntryDto {
        id: (vault.data.entries.len() - 1).to_string(),
        title,
        username,
        password,
        notes,
        category,
        updated_at: chrono::Utc::now().timestamp_millis() as u64,
    })
}

#[tauri::command]
fn list_entries(state: State<AppState>) -> Result<Vec<EntryDto>, String> {
    let vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_ref().ok_or_else(|| "Vault not unlocked".to_string())?;

    let entries: Vec<EntryDto> = vault
        .data
        .entries
        .iter()
        .enumerate()
        .map(|(i, e)| EntryDto {
            id: i.to_string(),
            title: e.name.clone(),
            username: e.name.clone(),
            password: e.secret.clone(),
            notes: None,
            category: "Login".to_string(),
            updated_at: chrono::Utc::now().timestamp_millis() as u64,
        })
        .collect();

    Ok(entries)
}

#[tauri::command]
fn search_entries(query: String, state: State<AppState>) -> Result<Vec<EntryDto>, String> {
    let entries = list_entries(state)?;
    let lower_query = query.to_lowercase();
    let filtered: Vec<EntryDto> = entries
        .into_iter()
        .filter(|e| e.title.to_lowercase().contains(&lower_query) || e.username.to_lowercase().contains(&lower_query))
        .collect();
    Ok(filtered)
}

#[tauri::command]
fn change_password(
    old_password: String,
    new_password: String,
    confirm_password: String,
    state: State<AppState>,
) -> Result<(), String> {
    if new_password != confirm_password {
        return Err("New passwords do not match".to_string());
    }
    if new_password.len() < 8 {
        return Err("New password must be at least 8 characters".to_string());
    }

    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or_else(|| "Vault not unlocked".to_string())?;

    // Verify old password by reloading
    let path = state.vault_path.lock().unwrap();
    let _verify = Vault::load(path.as_path(), &old_password).map_err(|e| e.to_string())?;

    vault.change_password(&new_password).map_err(|e| e.to_string())?;
    vault.save(&new_password).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Serialize)]
struct GeneratedPassword {
    password: String,
    entropy: f64,
}

#[tauri::command]
fn generate_password_cmd(
    length: usize,
    upper: bool,
    lower: bool,
    numbers: bool,
    symbols: bool,
) -> Result<GeneratedPassword, String> {
    let config = GeneratorConfig {
        length,
        use_upper: upper,
        use_lower: lower,
        use_numbers: numbers,
        use_symbols: symbols,
    };
    let (password, entropy) = generate_password(&config);
    Ok(GeneratedPassword { password, entropy })
}

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_clipboard() -> Result<(), String> {
    use arboard::Clipboard;
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text("").map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            vault_exists,
            create_vault,
            unlock_vault,
            lock_vault,
            add_entry,
            list_entries,
            search_entries,
            change_password,
            generate_password_cmd,
            copy_to_clipboard,
            clear_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
