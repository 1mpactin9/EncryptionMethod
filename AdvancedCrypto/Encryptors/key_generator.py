import hashlib
import random
import time


def generate_pseudo_random_hex_key(seed_data, length=64):
    seed_hash = hashlib.sha256(seed_data.encode()).hexdigest()

    random.seed(seed_hash)

    hex_chars = "0123456789abcdef"
    pseudo_random_key = ''.join(random.choice(hex_chars) for _ in range(length))

    return pseudo_random_key


def create_key_file_content():
    username = ""
    password = ""

    base_seed = f"secret-seed-base-{time.time()}"
    private_keys = []
    for i in range(5):
        key_seed = f"{base_seed}-{i}"
        key = generate_pseudo_random_hex_key(key_seed)
        private_keys.append(key)

    file_content = []
    file_content.append("# --- Secure Key File ---")
    file_content.append(f"# Generated on: {time.ctime()}")
    file_content.append("# Version: 1.0")
    file_content.append("\n# --- Permanent User Credentials ---")
    file_content.append(f"USERNAME: {username}")
    file_content.append(f"PASSWORD: {password}")
    file_content.append("\n# --- Private Encryption Keys ---")

    for i, key in enumerate(private_keys):
        file_content.append(f"PRIVATE_KEY_{i + 1}: {key}")

    return "\n".join(file_content)


if __name__ == "__main__":
    key_file_data = create_key_file_content()

    output_filename = "secure.key"

    try:
        with open(output_filename, "w") as f:
            f.write(key_file_data)
        print(f"✅ Successfully generated key file: '{output_filename}'")
        print("\n--- File Content ---")
        print(key_file_data)
        print("\n--------------------")
    except IOError as e:
        print(f"❌ Error: Could not write to file '{output_filename}'.")
        print(f"   Reason: {e}")

