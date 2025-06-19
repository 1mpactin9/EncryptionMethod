import base64
import random
import string
from colorama import init, Fore, Style
import sys

init()

class SimpleEncryption:
    def __init__(self):
        self.key_length = 16
        self.char_set = string.ascii_letters + string.digits + "!@#$%^&*"
        
    def generate_key(self) -> str:
        return ''.join(random.choices(self.char_set, k=self.key_length))
    
    def custom_encode(self, data: bytes) -> str:
        b64 = base64.b64encode(data).decode('utf-8')
        replacements = {
            '+': '-plus-',
            '/': '-slash-',
            '=': '-equals-',
            '|': '-pipe-',
            '>': '-gt-',
            '<': '-lt-',
            ';': '-semi-',
            '&': '-and-',
            '$': '-dollar-'
        }
        for old, new in replacements.items():
            b64 = b64.replace(old, new)
        return b64
    
    def custom_decode(self, encoded: str) -> bytes:
        replacements = {
            '-plus-': '+',
            '-slash-': '/',
            '-equals-': '=',
            '-pipe-': '|',
            '-gt-': '>',
            '-lt-': '<',
            '-semi-': ';',
            '-and-': '&',
            '-dollar-': '$'
        }
        for old, new in replacements.items():
            encoded = encoded.replace(old, new)
        return base64.b64decode(encoded)
    
    def encrypt(self, message: str, key: str = None) -> tuple[str, str]:
        if key is None:
            key = self.generate_key()

        message_bytes = message.encode('utf-8')
        key_bytes = key.encode('utf-8')

        encrypted_bytes = bytearray()
        for i in range(len(message_bytes)):
            encrypted_bytes.append(message_bytes[i] ^ key_bytes[i % len(key_bytes)])

        encrypted = self.custom_encode(encrypted_bytes)
        return encrypted, key
    
    def decrypt(self, encrypted_message: str, key: str) -> str:
        try:
            encrypted_bytes = self.custom_decode(encrypted_message)
            key_bytes = key.encode('utf-8')

            decrypted_bytes = bytearray()
            for i in range(len(encrypted_bytes)):
                decrypted_bytes.append(encrypted_bytes[i] ^ key_bytes[i % len(key_bytes)])
            
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            return f"Decryption failed"

def print_panel(title: str, content: str = "", color: Fore = Fore.WHITE):
    width = 70
    print(f"\n{color}{'=' * width}")
    print(f"  {Style.BRIGHT}{title}{Style.RESET_ALL}")
    if content:
        print(f"{color}{content}")
    print(f"{'=' * width}{Style.RESET_ALL}\n")

def main():
    encryptor = SimpleEncryption()
    
    while True:
        print_panel("SIMPLE ENCRYPTION SYSTEM", 
                   "SIMPLE Encryption & Decryption System",
                   Fore.CYAN)
        
        print(f"{Fore.GREEN}1. {Fore.WHITE}Encrypt a message")
        print(f"{Fore.GREEN}2. {Fore.WHITE}Decrypt a message")
        print(f"{Fore.GREEN}3. {Fore.WHITE}Exit")
        
        choice = input(f"\n{Fore.CYAN}Choose an option (1-3): {Style.RESET_ALL}")
        
        if choice == '1':
            print_panel("ENCRYPTION", "Enter your message below:", Fore.BLUE)
            
            message = input(f"{Fore.WHITE}Message: {Style.RESET_ALL}")
            encrypted, key = encryptor.encrypt(message)
            
            print_panel("ENCRYPTION RESULT", Fore.GREEN)
            print(f"{Fore.CYAN}Encrypted Message: {Style.RESET_ALL}{encrypted}")
            print(f"{Fore.RED}Encryption Key: {Style.RESET_ALL}{key}")
            print(f"\n{Fore.YELLOW}Important INFO.{Style.RESET_ALL}")
            
        elif choice == '2':
            print_panel("DECRYPTION", "Enter the encrypted message and key:", Fore.MAGENTA)
            
            encrypted = input(f"{Fore.WHITE}Encrypted message: {Style.RESET_ALL}")
            key = input(f"{Fore.WHITE}Encryption key: {Style.RESET_ALL}")
            
            decrypted = encryptor.decrypt(encrypted, key)
            print_panel("DECRYPTION RESULT", Fore.GREEN)
            print(f"{Fore.CYAN}Decrypted Message: {Style.RESET_ALL}{decrypted}")
            
        elif choice == '3':
            break
            
        input(f"\n{Fore.GREEN}Press Enter to continue...{Style.RESET_ALL}")
        print("\n" * 2)

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    main()
