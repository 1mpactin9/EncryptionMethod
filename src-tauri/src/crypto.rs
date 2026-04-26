use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use rand::{rngs::OsRng, RngCore};
use secrecy::{ExposeSecret, SecretVec};

use crate::error::VaultError;
use crate::format::VaultHeader;
use crate::memory::SecureKey;

/// Derives the master key from the password and header params.
pub fn derive_master_key(password: &str, header: &VaultHeader) -> Result<SecureKey, VaultError> {
    let params = Params::new(
        header.m_cost,
        header.t_cost,
        header.p_cost,
        Some(32), // 32-byte output
    ).map_err(|_| VaultError::CryptoError("Invalid Argon2 parameters"))?;

    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        params,
    );

    let mut master_key_bytes =[0u8; 32];
    argon2.hash_password_into(password.as_bytes(), &header.salt, &mut master_key_bytes)
        .map_err(|_| VaultError::CryptoError("Failed to derive master key"))?;

    Ok(SecureKey::new(master_key_bytes))
}

/// Generates a fresh 24-byte random nonce using the OS RNG.
pub fn generate_xnonce() -> XNonce {
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);
    *XNonce::from_slice(&nonce_bytes)
}

/// Encrypts the payload using XChaCha20-Poly1305 with AAD.
pub fn encrypt_blob(key: &SecureKey, plaintext: &[u8], aad: &[u8]) -> Result<(XNonce, Vec<u8>), VaultError> {
    let cipher = XChaCha20Poly1305::new(key.expose().into());
    let nonce = generate_xnonce();
    
    let payload = Payload { msg: plaintext, aad };
    
    let ciphertext = cipher.encrypt(&nonce, payload)
        .map_err(|_| VaultError::CryptoError("Encryption failed"))?;
        
    Ok((nonce, ciphertext))
}

/// Decrypts the payload.
pub fn decrypt_blob(key: &SecureKey, nonce: &XNonce, ciphertext: &[u8], aad: &[u8]) -> Result<Vec<u8>, VaultError> {
    let cipher = XChaCha20Poly1305::new(key.expose().into());
    let payload = Payload { msg: ciphertext, aad };
    
    cipher.decrypt(nonce, payload)
        .map_err(|_| VaultError::CryptoError("Decryption/Authentication failed"))
}