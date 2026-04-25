use subtle::ConstantTimeEq;
use crate::errors::CryptoError;

pub fn verify_mac_constant_time(expected: &[u8; 32], actual: &[u8; 32]) -> Result<(), CryptoError> {
    if bool::from(expected.ct_eq(actual)) {
        Ok(())
    } else {
        Err(CryptoError::HandshakeFailed(HandshakeFailed::TranscriptMismatch))
    }
}
