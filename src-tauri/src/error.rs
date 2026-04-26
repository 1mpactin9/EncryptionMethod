use thiserror::Error;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("Invalid magic bytes - not a valid vault file")]
    InvalidMagic,
    #[error("Unsupported vault version")]
    UnsupportedVersion,
    #[error("Unsupported Argon2 variant (must be Argon2id)")]
    InvalidArgonVariant,
    #[error("Argon2 parameters too weak (m_cost < 32768)")]
    ParamsTooWeak,
    #[error("Argon2 parameters implausibly large - DoS guard triggered")]
    ParamsTooLarge,
    #[error("Cryptographic operation failed: {0}")]
    CryptoError(&'static str),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Bincode(#[from] bincode::Error),
}