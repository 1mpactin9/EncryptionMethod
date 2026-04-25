use ed25519_dalek::{ SigningKey, VerifyingKey, Signer, Verifier, Signature };
use x25519_dalek::{ StaticSecret, PublicKey, SharedSecret };
use rand_core::OsRng;
use crate::errors::CryptoError;

pub struct Identity {
    pub sign_key: Secret<SigningKey>,
    pub dh_key: Secret<StaticSecret>,
}

impl Identity {
    pub fn generate() -> Self {
        use secrecy::ExposeSecret;
        let sign_key = SigningKey::generate(&mut OsRng);
        let dh_key = StaticSecret::random_from_rng(OsRng);

        Self {
            sign_key: Secret::new(sign_key),
            dh_key: Secret::new(dh_key),
        }
    }

    pub fn sign(&self, msg: &[u8]) -> Result<[u8; 64], CryptoError> {
        use secrecy::ExposeSecret;
        let sig: Signature = self.sign_key.expose_secret().sign(msg);
        Ok(sig.to_bytes())
    }

    pub fn dh(&self, peer_pub: &PublicKey) -> Result<SharedSecret, CryptoError> {
        use secrecy::ExposeSecret;
        Ok(self.dh_key.expose_secret().diffie_hellman(peer_pub))
    }
}
