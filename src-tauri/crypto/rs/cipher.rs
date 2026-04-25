use chacha20poly1305::{ ChaCha20Poly1305, Key, Nonce, aead::{ Aead, KeyInit, Payload } };
use crate::errors::CryptoError;

pub fn encrypt_chacha(
    key: &[u8; 32],
    nonce: &[u8; 12],
    plaintext: &[u8],
    aad: &[u8]
) -> Result<Vec<u8>, CryptoError> {
    let cipher = ChaCha20Poly1305::new(Key::from_slice(key));
    let n = Nonce::from_slice(nonce);

    cipher
        .encrypt(n, Payload { msg: plaintext, aad })
        .map_err(|_| CryptoError::EncryptionFailed("ChaCha20 encryption failed".into()))
}
