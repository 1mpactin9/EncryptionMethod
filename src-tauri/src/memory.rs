use memsec::{mlock, munlock};
use std::ptr::NonNull;
use zeroize::Zeroize;

/// A securely allocated 32-byte key that is memory-locked and zeroized on drop.
pub struct SecureKey {
    inner: [u8; 32],
}

impl SecureKey {
    pub fn new(data: [u8; 32]) -> Self {
        let mut key = Self { inner: data };
        // Attempt to lock memory to prevent swapping to disk.
        // We log on failure but continue, as requested.
        unsafe {
            if !mlock(key.inner.as_mut_ptr(), 32) {
                eprintln!("Warning: Failed to mlock SecureKey. OS limits may be preventing it.");
            }
        }
        key
    }

    pub fn expose(&self) -> &[u8; 32] {
        &self.inner
    }
}

impl Drop for SecureKey {
    fn drop(&mut self) {
        self.inner.zeroize();
        unsafe {
            // Unlocking memory on drop
            let _ = munlock(self.inner.as_mut_ptr(), 32);
        }
    }
}