use arboard::Clipboard;
use std::thread;
use std::time::Duration;

pub fn copy_to_clipboard_with_timeout(secret: &str, timeout_secs: u64) -> Result<(), &'static str> {
    let mut clipboard = Clipboard::new().map_err(|_| "Failed to access clipboard")?;
    
    // Note: On Windows, advanced marking like ExcludeClipboardContentFromMonitorProcessing 
    // requires direct winapi calls. Using arboard covers cross-platform text insertion natively.
    clipboard.set_text(secret).map_err(|_| "Failed to copy to clipboard")?;
    
    let secret_copy = secret.to_string();

    // Spawn a detached thread to clear the clipboard after 10 seconds
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(timeout_secs));
        if let Ok(mut cb) = Clipboard::new() {
            // Only clear if the clipboard hasn't been overwritten by the user with something else
            if let Ok(current_text) = cb.get_text() {
                if current_text == secret_copy {
                    let _ = cb.set_text(""); // Wipe
                }
            }
        }
    });

    Ok(())
}