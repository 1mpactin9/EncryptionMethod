# generate_secret.py
import os
import json
import hashlib
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# --- Configuration ---
# These settings should match the ones in your main tool.
SECRET_FILE_NAME = "secret_bundle.poem"
KEY_BITS = 4096
PUBLIC_EXPONENT = 65537
SECRET_PEPPER = "A_SECRET_PEPPER_FOR_THE_POEM"

def generate_secret_file():
    """
    Generates a new secret bundle containing a public/private RSA key pair
    and other miscellaneous data to obfuscate its purpose. This is the
    foundational secret required for all encryption and decryption operations.
    """
    # Check if the file already exists to prevent accidental overwriting.
    if os.path.exists(SECRET_FILE_NAME):
        print(f"Warning: Secret file '{SECRET_FILE_NAME}' already exists.")
        overwrite = input("Do you want to overwrite it? This will make all previously encrypted data unreadable. (y/n): ").lower()
        if overwrite != 'y':
            print("Operation cancelled.")
            return

    print(f"Generating new {KEY_BITS}-bit RSA key pair. This may take a moment...")
    private_key = rsa.generate_private_key(
        public_exponent=PUBLIC_EXPONENT,
        key_size=KEY_BITS,
        backend=default_backend()
    )
    public_key = private_key.public_key()

    # Serialize keys into PEM format (a standard text-based format)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    # Create a bundle with keys and obfuscating data
    secret_bundle = {
        "title": "The Raven's Cipher",
        "private_key_pem": private_pem,
        "public_key_pem": public_pem,
        "internal_pepper": hashlib.sha256(SECRET_PEPPER.encode()).hexdigest(),
        "metadata": {
            "version": "1.0",
            "author": "Edgar Allan Poe (simulation)",
            "notes": "Once upon a midnight dreary, while I pondered, weak and weary..."
        }
    }

    # Save the bundle to the secret file
    with open(SECRET_FILE_NAME, 'w') as f:
        json.dump(secret_bundle, f, indent=4)
    print(f"\nSuccess! Secret file '{SECRET_FILE_NAME}' generated.")
    print("!!! IMPORTANT: Protect this file. It contains your private key and is required for all future operations. !!!")

if __name__ == "__main__":
    # This block runs when the script is executed directly
    try:
        generate_secret_file()
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

