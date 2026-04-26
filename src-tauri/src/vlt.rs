use bincode::Options;
use rand::{rngs::OsRng, RngCore};
use std::path::{Path, PathBuf};
use chacha20poly1305::XNonce;
use std::io::Read;

use crate::crypto::{decrypt_blob, derive_master_key, encrypt_blob};
use crate::error::VaultError;
use crate::format::{VaultHeader, ARGON2_ID_VARIANT, MAGIC, VAULT_VERSION};
use crate::io::{atomic_save, rotate_backups};
use crate::memory::SecureKey;
use crate::models::{Entry, VaultData, DATA_VERSION};

pub struct Vault {
    pub file_path: PathBuf,
    pub header: VaultHeader,
    pub vault_key: SecureKey,
    pub data: VaultData,
}

impl Vault {
    /// Creates a brand new vault and automatically saves it.
    pub fn create(file_path: impl AsRef<Path>, master_password: &str) -> Result<Self, VaultError> {
        let mut salt = [0u8; 32];
        OsRng.fill_bytes(&mut salt);

        // These are the Phase 1 starting params. 
        // Later, we tune m_cost up to ~300ms.
        let header = VaultHeader {
            magic: MAGIC,
            version: VAULT_VERSION,
            argon2_version: 0x13,
            argon2_variant: ARGON2_ID_VARIANT,
            salt,
            m_cost: 65536, // 64 MB
            t_cost: 3,
            p_cost: 1,
        };

        // Generate a random internal Vault Key (32 bytes)
        let mut vk_bytes =[0u8; 32];
        OsRng.fill_bytes(&mut vk_bytes);
        let vault_key = SecureKey::new(vk_bytes);

        let mut vault = Self {
            file_path: file_path.as_ref().to_path_buf(),
            header,
            vault_key,
            data: VaultData::default(),
        };

        vault.save(master_password)?;
        Ok(vault)
    }

    /// Unlocks and loads an existing vault.
    pub fn load(file_path: impl AsRef<Path>, master_password: &str) -> Result<Self, VaultError> {
        let mut file = std::fs::File::open(file_path.as_ref())?;
        
        let header = VaultHeader::from_reader(&mut file)?;
        let master_key = derive_master_key(master_password, &header)?;

        // Read Nonce1 (24 bytes)
        let mut nonce1_bytes = [0u8; 24];
        file.read_exact(&mut nonce1_bytes)?;
        let nonce1 = *XNonce::from_slice(&nonce1_bytes);

        // Read Encrypted Vault Key (48 bytes: 32 key + 16 tag)
        let mut enc_vault_key = [0u8; 48];
        file.read_exact(&mut enc_vault_key)?;

        // Construct AAD1
        let aad1 = header.as_bytes();
        let vault_key_bytes = decrypt_blob(&master_key, &nonce1, &enc_vault_key, &aad1)?;
        let vault_key = SecureKey::new(vault_key_bytes.try_into().unwrap());

        // Construct AAD2 = AAD1 || NONCE1 || ENC_VAULT_KEY
        let mut aad2 = aad1;
        aad2.extend_from_slice(&nonce1_bytes);
        aad2.extend_from_slice(&enc_vault_key);

        // Read Nonce2 (24 bytes)
        let mut nonce2_bytes = [0u8; 24];
        file.read_exact(&mut nonce2_bytes)?;
        let nonce2 = *XNonce::from_slice(&nonce2_bytes);

        // Read remaining Encrypted Data
        let mut enc_data = Vec::new();
        file.read_to_end(&mut enc_data)?;

        // Decrypt data
        let decrypted_inner = decrypt_blob(&vault_key, &nonce2, &enc_data, &aad2)?;

        // Verify DATA_VERSION
        if decrypted_inner.len() < 2 {
            return Err(VaultError::CryptoError("Data payload too short"));
        }
        let data_version = u16::from_le_bytes([decrypted_inner[0], decrypted_inner[1]]);
        if data_version != DATA_VERSION {
            return Err(VaultError::UnsupportedVersion);
        }

        // Deserialize entries with size limit to prevent RAM exhaustion
        let bincode_options = bincode::DefaultOptions::new()
            .with_limit(10 * 1024 * 1024)
            .with_little_endian();

        let data: VaultData = bincode_options.deserialize(&decrypted_inner[2..])?;

        Ok(Self {
            file_path: file_path.as_ref().to_path_buf(),
            header,
            vault_key,
            data,
        })
    }

    /// Re-encrypts the vault and writes to disk atomically, rotating backups.
    pub fn save(&self, master_password: &str) -> Result<(), VaultError> {
        let master_key = derive_master_key(master_password, &self.header)?;

        // 1. Prepare AAD1
        let aad1 = self.header.as_bytes();

        // 2. Encrypt Vault Key
        let (nonce1, enc_vault_key) = encrypt_blob(&master_key, self.vault_key.expose(), &aad1)?;

        // 3. Prepare AAD2: AAD1 || NONCE1 || ENC_VAULT_KEY
        let mut aad2 = aad1.clone();
        aad2.extend_from_slice(nonce1.as_slice());
        aad2.extend_from_slice(&enc_vault_key);

        // 4. Prepare Data Blob (Prepend DATA_VERSION)
        let bincode_options = bincode::DefaultOptions::new()
            .with_little_endian();

        let mut inner_plaintext = DATA_VERSION.to_le_bytes().to_vec();
        inner_plaintext.extend(bincode_options.serialize(&self.data)?);

        // 5. Encrypt Data Blob
        let (nonce2, enc_data) = encrypt_blob(&self.vault_key, &inner_plaintext, &aad2)?;

        // 6. Assemble file bytes
        let mut final_bytes = aad1; // Header
        final_bytes.extend_from_slice(nonce1.as_slice());
        final_bytes.extend_from_slice(&enc_vault_key);
        final_bytes.extend_from_slice(nonce2.as_slice());
        final_bytes.extend_from_slice(&enc_data);

        // 7. Backup and Atomic Save
        rotate_backups(&self.file_path)?;
        atomic_save(&self.file_path, &final_bytes)?;

        Ok(())
    }
    
    /// Phase 1: Change master password. 
    /// Generates new salt, updates header, saves without modifying inner data payload.
    pub fn change_password(&mut self, new_password: &str) -> Result<(), VaultError> {
        // Generate entirely fresh salt
        OsRng.fill_bytes(&mut self.header.salt);
        
        // Save using the existing vault_key but a new master_password.
        // Because `vault_key` remains exactly the same, the actual encrypted data
        // inside `VaultData` just shifts under the new master encryption layer.
        self.save(new_password)
    }

    /// Add a new entry to the vault
    pub fn add_entry(&mut self, entry: Entry) {
        self.data.entries.push(entry);
    }
}