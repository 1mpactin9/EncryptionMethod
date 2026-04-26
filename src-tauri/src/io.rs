use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

/// Rotates backups keeping exactly 5 snapshots (vault.dat + 4 backups).
pub fn rotate_backups(base_path: &Path) -> io::Result<()> {
    let bak4 = with_extension(base_path, "bak4");
    
    // vault.bak4 → overwrite with zeros + fsync, then delete
    if bak4.exists() {
        if let Ok(mut f) = OpenOptions::new().write(true).open(&bak4) {
            if let Ok(metadata) = f.metadata() {
                // Best-effort overwrite (won't bypass SSD wear-leveling, but fits Phase 4 spec)
                let zeros = vec![0u8; metadata.len() as usize];
                let _ = f.write_all(&zeros);
                let _ = f.sync_all();
            }
        }
        std::fs::remove_file(&bak4)?;
    }

    // Shift backups: 3->4, 2->3, 1->2
    for i in (1..=3).rev() {
        let src = with_extension(base_path, &format!("bak{}", i));
        let dst = with_extension(base_path, &format!("bak{}", i + 1));
        if src.exists() {
            std::fs::rename(src, dst)?;
        }
    }

    // vault.dat → vault.bak1
    if base_path.exists() {
        let bak1 = with_extension(base_path, "bak1");
        std::fs::rename(base_path, bak1)?;
    }

    Ok(())
}

/// Safely writes data to a temporary file, fsyncs, renames, and fsyncs the parent directory.
pub fn atomic_save(path: &Path, data: &[u8]) -> io::Result<()> {
    let tmp_path = path.with_extension("tmp");

    // 1. Write to vault.tmp
    let mut tmp_file = File::create(&tmp_path)?;
    tmp_file.write_all(data)?;
    
    // 2. fsync(file)
    tmp_file.sync_all()?;
    drop(tmp_file); // Close before renaming (important for Windows)

    // 3. Rename to vault.dat
    std::fs::rename(&tmp_path, path)?;

    // 4. fsync(parent directory) for rename durability on crash
    if let Some(parent) = path.parent() {
        if parent.is_dir() {
            // Note: Directory fsync works natively on Unix. 
            // On Windows, opening a directory for syncing requires special flags, 
            // so we gracefully ignore errors if it fails.
            if let Ok(dir_file) = File::open(parent) {
                let _ = dir_file.sync_all();
            }
        }
    }

    Ok(())
}

fn with_extension(path: &Path, ext: &str) -> PathBuf {
    let mut p = path.to_path_buf();
    p.set_extension(ext);
    p
}