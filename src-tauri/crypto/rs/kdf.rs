use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::Zeroizing;
use crate::errors::CryptoError;

pub fn derive_subkeys(
    ikm: &[u8],
    salt: Option<&[u8; 32]>,
    labels: &[&[u8]]
) -> Result<Vec<Zeroizing<Vec<u8>>>, CryptoError> {
    let salt_bytes = salt.map(|s| s.as_ref()).unwrap_or(&[]);
    let hk = Hkdf::<Sha256>::new(Some(salt_bytes), ikm);

    let mut subkeys = Vec::with_capacity(labels.len());

    for info in labels {
        let mut okm = Zeroizing::new(vec![0u8; 32]);
        hk.expand(info, &mut okm).map_err(|_| CryptoError::KdfFailed("HKDF expand failed".into()))?;
        subkeys.push(okm);
    }

    Ok(subkeys)
}
