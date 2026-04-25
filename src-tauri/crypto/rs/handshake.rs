use spake2::{ Spake2, Ed25519Group };
use x25519_dalek::{ EphemeralSecret, PublicKey };
use ring::pbkdf2;
use std::num::NonZeroU32;

pub fn hash_password(password: &[u8], salt: &[u8]) -> [u8; 32] {
    let mut pbkdf2_hash = [0u8; 32];
    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA256,
        NonZeroU32::new(100_000).unwrap(),
        salt,
        password,
        &mut pbkdf2_hash
    );
    pbkdf2_hash
}

pub fn start_spake2(
    hashed_password: &[u8],
    my_id: &[u8],
    peer_id: &[u8]
) -> (Spake2<Ed25519Group>, Vec<u8>) {
    Spake2::<Ed25519Group>::start_a(hashed_password, my_id, peer_id)
}

pub fn generate_ephemeral_dh() -> (EphemeralSecret, PublicKey) {
    let secret = EphemeralSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);
    (secret, public)
}
