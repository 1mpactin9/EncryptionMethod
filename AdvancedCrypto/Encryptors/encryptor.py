import hashlib
import random
import time
import os


def generate_pseudo_random_hex_key(seed_data, length=32):
    seed_hash = hashlib.sha256(seed_data.encode()).hexdigest()
    random.seed(seed_hash)

    hex_chars = "0123456789abcdef"
    pseudo_random_key = ''.join(random.choice(hex_chars) for _ in range(length))
    return pseudo_random_key


def xor_cipher(data, key):
    key_bytes = key.encode('utf-8')
    key_length = len(key_bytes)
    return bytes([b ^ key_bytes[i % key_length] for i, b in enumerate(data)])


def encrypt_file(input_filename, output_filename, encryption_key_seed):
    try:
        with open(input_filename, 'rb') as f_in:
            plaintext = f_in.read()

        encryption_key = generate_pseudo_random_hex_key(encryption_key_seed)

        encrypted_data = xor_cipher(plaintext, encryption_key)

        with open(output_filename, 'wb') as f_out:
            f_out.write(encrypted_data)

        print(f"'{encryption_key_seed}'")

    except FileNotFoundError:
        print()
    except Exception as e:
        print()


def decrypt_file(input_filename, output_filename, encryption_key_seed):
    try:
        with open(input_filename, 'rb') as f_in:
            encrypted_data = f_in.read()

        encryption_key = generate_pseudo_random_hex_key(encryption_key_seed)
        decrypted_data = xor_cipher(encrypted_data, encryption_key)

        with open(output_filename, 'wb') as f_out:
            f_out.write(decrypted_data)

    except FileNotFoundError:
        print()
    except Exception as e:
        print()


if __name__ == "__main__":
    KEY_FILE = "secure.key"
    ENCRYPTED_FILE = f"{KEY_FILE}.encrypted"
    DECRYPTED_FILE = f"{KEY_FILE}.decrypted"

    base_seed = f"secret-seed-base-{time.time()}"
    key_seed = f"{base_seed}"
    key = generate_pseudo_random_hex_key(key_seed)
    ENCRYPTION_SEED = key

    print("Encryption Key: ")
    encrypt_file(KEY_FILE, ENCRYPTED_FILE, ENCRYPTION_SEED)
    decrypt_file(ENCRYPTED_FILE, DECRYPTED_FILE, ENCRYPTION_SEED)

