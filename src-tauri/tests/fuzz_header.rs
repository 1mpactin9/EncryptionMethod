use vault_backend::format::VaultHeader;
use std::io::Cursor;

#[test]
fn fuzz_header_parsing() {
    // Generate 10,000 random byte sequences of the header length (51 bytes)
    for _ in 0..10000 {
        let mut data = [0u8; 51];
        rand::thread_rng().fill(&mut data);
        
        let cursor = Cursor::new(data);
        // This should NEVER panic. It should only return Err(VaultError).
        let _ = VaultHeader::from_reader(cursor);
    }
}

#[test]
fn test_dos_guard() {
    let mut data = [0u8; 51];
    // Set Magic and Version correctly to bypass initial checks
    data[0..4].copy_from_slice(&[0x56, 0x4C, 0x54, 0x01]);
    data[4..6].copy_from_slice(&1u16.to_le_bytes());
    
    // Set an insane m_cost (4GB) to try and trigger a DoS/Allocation attack
    let insane_m_cost = 4000000000u32;
    data[43..47].copy_from_slice(&insane_m_cost.to_le_bytes());

    let cursor = Cursor::new(data);
    let result = VaultHeader::from_reader(cursor);
    
    // It must return our specific ParamsTooLarge error, not attempt to allocate
    assert!(matches!(result, Err(vault_backend::error::VaultError::ParamsTooLarge)));
}