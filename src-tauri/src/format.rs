use crate::error::VaultError;
use std::io::{Read, Write};

pub const MAGIC:[u8; 4] =[0x56, 0x4C, 0x54, 0x01]; // "VLT\x01"
pub const VAULT_VERSION: u16 = 1;
pub const ARGON2_ID_VARIANT: u8 = 0x02;

#[derive(Debug, Clone)]
pub struct VaultHeader {
    pub magic:[u8; 4],
    pub version: u16,
    pub argon2_version: u16,
    pub argon2_variant: u8,
    pub salt: [u8; 32],
    pub m_cost: u32,
    pub t_cost: u32,
    pub p_cost: u32,
}

impl VaultHeader {
    /// Validates KDF params before use (Phase 1, Step 4)
    pub fn validate(&self) -> Result<(), VaultError> {
        if self.magic != MAGIC { return Err(VaultError::InvalidMagic); }
        if self.version != VAULT_VERSION { return Err(VaultError::UnsupportedVersion); }
        if self.argon2_variant != ARGON2_ID_VARIANT { return Err(VaultError::InvalidArgonVariant); }
        
        if self.m_cost < 32768 { return Err(VaultError::ParamsTooWeak); }
        if self.m_cost > 2 * 1024 * 1024 { return Err(VaultError::ParamsTooLarge); }
        if self.t_cost < 1 || self.t_cost > 10 { return Err(VaultError::ParamsTooLarge); }
        if self.p_cost != 1 { return Err(VaultError::ParamsTooLarge); /* Or clamp */ }
        
        Ok(())
    }

    /// Serializes exactly the header bytes for AAD1
    pub fn as_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(51);
        buf.extend_from_slice(&self.magic);
        buf.extend_from_slice(&self.version.to_le_bytes());
        buf.extend_from_slice(&self.argon2_version.to_le_bytes());
        buf.push(self.argon2_variant);
        buf.extend_from_slice(&self.salt);
        buf.extend_from_slice(&self.m_cost.to_le_bytes());
        buf.extend_from_slice(&self.t_cost.to_le_bytes());
        buf.extend_from_slice(&self.p_cost.to_le_bytes());
        buf
    }

    pub fn from_reader(mut reader: impl Read) -> Result<Self, VaultError> {
        let mut header = VaultHeader {
            magic: [0; 4],
            version: 0,
            argon2_version: 0,
            argon2_variant: 0,
            salt: [0; 32],
            m_cost: 0,
            t_cost: 0,
            p_cost: 0,
        };

        reader.read_exact(&mut header.magic)?;
        
        let mut u16_buf =[0; 2];
        reader.read_exact(&mut u16_buf)?; header.version = u16_from_le(u16_buf);
        reader.read_exact(&mut u16_buf)?; header.argon2_version = u16_from_le(u16_buf);
        
        let mut u8_buf = [0; 1];
        reader.read_exact(&mut u8_buf)?; header.argon2_variant = u8_buf[0];
        
        reader.read_exact(&mut header.salt)?;
        
        let mut u32_buf =[0; 4];
        reader.read_exact(&mut u32_buf)?; header.m_cost = u32_from_le(u32_buf);
        reader.read_exact(&mut u32_buf)?; header.t_cost = u32_from_le(u32_buf);
        reader.read_exact(&mut u32_buf)?; header.p_cost = u32_from_le(u32_buf);

        header.validate()?;
        Ok(header)
    }
}

// Helpers
fn u16_from_le(bytes:[u8; 2]) -> u16 { u16::from_le_bytes(bytes) }
fn u32_from_le(bytes: [u8; 4]) -> u32 { u32::from_le_bytes(bytes) }