use serde::{Deserialize, Serialize};

pub const DATA_VERSION: u16 = 1;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Entry {
    pub name: String,
    pub secret: String,
    // Add more fields (e.g., username, URL, notes) as needed later
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct VaultData {
    pub entries: Vec<Entry>,
}