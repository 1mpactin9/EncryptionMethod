#[test]
fn test_bit_flip_resistance() {
    // 1. Create a valid vault
    let temp_path = "fuzz_test.dat";
    let password = "correct_password";
    let vault = Vault::create(temp_path, password).unwrap();
    
    // 2. Read the file bytes
    let mut file_bytes = std::fs::read(temp_path).expect("Read vault");
    
    // 3. Flip a random bit in the ciphertext or nonce area
    // (Everything after byte 51 is nonce1, enc_key, nonce2, or data)
    let len = file_bytes.len();
    file_bytes[len - 1] ^= 0x01; 
    
    // 4. Write corrupted file back
    std::fs::write(temp_path, file_bytes).unwrap();
    
    // 5. Attempting to load MUST fail with CryptoError, never return garbage
    let result = Vault::load(temp_path, password);
    assert!(result.is_err());
    println!("Corrupted bit caught by AEAD: {:?}", result.err());
}