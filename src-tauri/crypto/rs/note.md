zeroize(drop) chaining: If you create a struct like HandshakeResult, make sure that struct also derives Zeroize and #[zeroize(drop)] if it holds raw key bytes, or verify that its members are wrapped in Secret<T> (which handles it automatically).

In lib.rs or cipher.rs, use conditional compilation for your hardware acceleration constraint:

```rs
#[cfg(all(any(target_arch = "x86", target_arch = "x86_64"), target_feature = "aes"))]
pub type DefaultCipher = Aes256Gcm;
#[cfg(not(all(any(target_arch = "x86", target_arch = "x86_64"), target_feature = "aes")))]
pub type DefaultCipher = ChaCha20Poly1305;
```

Implement standard From<hkdf::InvalidLength> and From<aead::Error> conversions into your CryptoError::Internal or CryptoError::DecryptionFailed inside your errors.rs file using the std::error::Error trait.