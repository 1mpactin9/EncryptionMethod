# encrypt_secret_store.py
import os
import getpass
import json
import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet

# --- Configuration ---
SOURCE_SECRET_FILE = "secret_bundle.poem"
ENCRYPTED_STORE_FILE = "secret_store.encrypted"
# PBKDF2 parameters for deriving a key from the password.
# Higher iterations increase security.
PBKDF2_ITERATIONS = 480000
SALT_SIZE = 16  # bytes


def encrypt_the_secret_store():
    """
    Encrypts the 'secret_bundle.poem' file using a user-provided password.
    This creates a new encrypted file and securely deletes the original.
    """
    # 1. Check for the source file
    if not os.path.exists(SOURCE_SECRET_FILE):
        print(f"Error: The source secret file '{SOURCE_SECRET_FILE}' was not found.")
        print("Please generate it first using 'generate_secret.py'.")
        return

    # 2. Get a strong password from the user securely
    print("You will now create a password to encrypt your secret store.")
    print("!!! YOU MUST REMEMBER THIS PASSWORD. IT CANNOT BE RECOVERED. !!!")
    password = getpass.getpass("Enter a strong password: ")
    password_verify = getpass.getpass("Verify password: ")

    if password != password_verify:
        print("\nPasswords do not match. Operation cancelled.")
        return

    if not password:
        print("\nPassword cannot be empty. Operation cancelled.")
        return

    print("\nPassword confirmed. Starting encryption...")

    # 3. Read the content of the secret file
    try:
        with open(SOURCE_SECRET_FILE, 'rb') as f:
            secret_content = f.read()
    except Exception as e:
        print(f"Error reading '{SOURCE_SECRET_FILE}': {e}")
        return

    # 4. Derive a strong encryption key from the password
    # A salt is random data that makes dictionary/rainbow table attacks much harder.
    salt = os.urandom(SALT_SIZE)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # Fernet keys are 32 bytes
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
        backend=default_backend()
    )
    # The key is derived from the password bytes
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    print("Step 1: Strong encryption key derived from password.")

    # 5. Encrypt the content using the derived key
    f = Fernet(key)
    encrypted_content = f.encrypt(secret_content)
    print("Step 2: Secret file content has been encrypted.")

    # 6. Save the salt and encrypted content to the new store file.
    # The salt is not secret, but it's required for decryption, so we store it
    # with the ciphertext.
    try:
        with open(ENCRYPTED_STORE_FILE, 'wb') as f:
            f.write(salt)
            f.write(encrypted_content)
        print(f"Step 3: Encrypted store saved to '{ENCRYPTED_STORE_FILE}'.")
    except Exception as e:
        print(f"Error writing to '{ENCRYPTED_STORE_FILE}': {e}")
        return

    # 7. Securely delete the original plaintext secret file
    print(f"\nEncryption successful. The original file '{SOURCE_SECRET_FILE}' will now be deleted.")
    try:
        # For simplicity, we use os.remove. For higher security, a more
        # thorough file shredding utility could be used.
        os.remove(SOURCE_SECRET_FILE)
        print(f"Successfully deleted '{SOURCE_SECRET_FILE}'.")
    except Exception as e:
        print(f"Error deleting original file: {e}")
        print("Please delete it manually for your security!")

    print("\n--- Process Complete ---")
    print(f"Your secrets are now secured in '{ENCRYPTED_STORE_FILE}'.")


if __name__ == "__main__":
    encrypt_the_secret_store()
