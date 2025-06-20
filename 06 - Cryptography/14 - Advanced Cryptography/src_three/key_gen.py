import hashlib
import random
import time


def generate_pseudo_random_hex_key(seed_data, length=64):
    """
    Generates a deterministic, pseudo-random hexadecimal key from seed data.

    This function uses a combination of the seed data and a SHA-256 hash
    to create a seeded random number generator. This ensures that the same
    seed will always produce the same "random" key, fulfilling the requirement
    for a pseudo-inverse or reverse randomizer.

    Args:
        seed_data (str): A string to seed the random number generator.
        length (int): The desired length of the hexadecimal key.

    Returns:
        str: A hexadecimal string of the specified length.
    """
    # Use SHA-256 to create a secure, fixed-size hash from the seed data
    seed_hash = hashlib.sha256(seed_data.encode()).hexdigest()

    # Seed the random number generator with the hash
    random.seed(seed_hash)

    # Generate random hex characters
    hex_chars = "0123456789abcdef"
    pseudo_random_key = ''.join(random.choice(hex_chars) for _ in range(length))

    return pseudo_random_key


def create_key_file_content():
    """
    Generates the complete, formatted content for the .key file.

    This function defines the permanent credentials and generates the five
    private keys using a deterministic approach. Each key is generated with
a
    unique seed based on the current time and an index, ensuring each key is
    unique but still reproducible if the initial conditions are known.

    Returns:
        str: The formatted string content for the .key file.
    """
    # --- Permanent Credentials ---
    username = "1mpactin9"
    password = "1mpactin9"

    # --- Generate 5 Private Keys ---
    # We use a base seed to make the key generation session-dependent but repeatable.
    # A combination of time and a fixed string is used for the seed.
    base_seed = f"secret-seed-base-{time.time()}"
    private_keys = []
    for i in range(5):
        # Create a unique seed for each key to ensure they are different
        key_seed = f"{base_seed}-{i}"
        key = generate_pseudo_random_hex_key(key_seed)
        private_keys.append(key)

    # --- Format the .key file content ---
    # Using a simple key-value format for easy parsing.
    # Includes metadata like creation time and version.

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
    # Generate the content for the .key file
    key_file_data = create_key_file_content()

    # Define the output filename
    output_filename = "secure.key"

    # Write the content to the .key file
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

