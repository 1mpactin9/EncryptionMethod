use rand::{rngs::OsRng, Rng};

const LOWERCASE: &[u8] = b"abcdefghijklmnopqrstuvwxyz";
const UPPERCASE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS: &[u8] = b"0123456789";
const SYMBOLS: &[u8] = b"!@#$%^&*()-_=+[]{}|;:,.<>/?";

pub struct GeneratorConfig {
    pub length: usize,
    pub use_lower: bool,
    pub use_upper: bool,
    pub use_numbers: bool,
    pub use_symbols: bool,
}

impl Default for GeneratorConfig {
    fn default() -> Self {
        Self { length: 16, use_lower: true, use_upper: true, use_numbers: true, use_symbols: true }
    }
}

pub fn generate_password(config: &GeneratorConfig) -> (String, f64) {
    let mut charset = Vec::new();
    if config.use_lower { charset.extend_from_slice(LOWERCASE); }
    if config.use_upper { charset.extend_from_slice(UPPERCASE); }
    if config.use_numbers { charset.extend_from_slice(NUMBERS); }
    if config.use_symbols { charset.extend_from_slice(SYMBOLS); }

    if charset.is_empty() {
        return ("".to_string(), 0.0);
    }

    let mut password = String::with_capacity(config.length);
    for _ in 0..config.length {
        let idx = OsRng.gen_range(0..charset.len());
        password.push(charset[idx] as char);
    }

    // Basic entropy estimate: log2(keyspace)
    let entropy = (config.length as f64) * (charset.len() as f64).log2();
    
    (password, entropy)
}