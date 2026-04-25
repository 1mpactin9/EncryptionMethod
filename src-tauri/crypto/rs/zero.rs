use secrecy::{ Secret, Zeroize };
use zeroize::Zeroizing;

#[derive(Clone, Zeroize)]
#[zeroize(drop)]
pub struct KeyMaterial(pub [u8; 32]);
pub type SharedSecretKey = Secret<KeyMaterial>;
pub type TempBuffer = Zeroizing<Vec<u8>>;
