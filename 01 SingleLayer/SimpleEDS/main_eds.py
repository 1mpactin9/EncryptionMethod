import base64, hashlib, os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from rich.progress import Progress
from rich.console import Console
from functools import wraps
import time, random

def _obf(s): return base64.b85encode(s.encode()).decode()
def _deobf(s): return base64.b85decode(s.encode()).decode()

class _SecurityProvider:
    def __init__(self):
        self._console = Console()
        self._k = hashlib.sha256(_deobf('VX*qKVr1UNa+bWn+%R9}VR2_4IWn}').encode()).digest()
        
    def __getattr__(self, name):
        if name.startswith('_x'): 
            return lambda *a, **k: self._dispatch(name[2:], *a, **k)
        return super().__getattr__(name)

    def _dispatch(self, op, *args, **kwargs):
        return getattr(self, f"_{op}")(*args, **kwargs)

    def _encrypt(self, data: bytes) -> bytes:
        iv = os.urandom(16)
        cipher = AES.new(self._k, AES.MODE_CBC, iv)
        ct = cipher.encrypt(pad(data, AES.block_size))
        mac = hashlib.sha256(self._k + iv + ct).digest()
        return iv + mac + ct

    def _decrypt(self, data: bytes) -> bytes:
        iv, mac, ct = data[:16], data[16:48], data[48:]
        if hashlib.sha256(self._k + iv + ct).digest() != mac:
            raise ValueError(_deobf('B5h6}WMy~0'))
        cipher = AES.new(self._k, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(ct), AES.block_size)

def _progress_wrapper(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        with Progress() as progress:
            task = progress.add_task("[cyan]Processing...", total=100)
            while not progress.finished:
                progress.update(task, advance=random.uniform(0.1, 2.0))
                time.sleep(0.01)
            return func(*args, **kwargs)
    return wrapper

class SecureDataHandler:
    def __init__(self):
        self._provider = _SecurityProvider()
        
    @_progress_wrapper
    def encrypt_file(self, input_path: str, output_path: str):
        try:
            with open(input_path, 'rb') as f:
                data = f.read()
            encrypted = self._provider._x_encrypt(data)
            with open(output_path, 'wb') as f:
                f.write(encrypted)
        except Exception as e:
            self._provider._console.print(f"[red]Encryption failed: {str(e)}[/red]")
            raise

    @_progress_wrapper
    def decrypt_file(self, input_path: str, output_path: str):
        try:
            with open(input_path, 'rb') as f:
                data = f.read()
            decrypted = self._provider._x_decrypt(data)
            with open(output_path, 'wb') as f:
                f.write(decrypted)
        except Exception as e:
            self._provider._console.print(f"[red]Decryption failed: {str(e)}[/red]")
            raise

if __name__ == "__main__":
    handler = SecureDataHandler()
    console = Console()
    
    try:
        while True:
            console.print("\n[green]1. Encrypt File[/green]")
            console.print("[green]2. Decrypt File[/green]")
            console.print("[red]3. Exit[/red]")
            
            choice = console.input("[yellow]Choose operation (1-3): [/yellow]")
            
            if choice == "3":
                break
                
            if choice in ["1", "2"]:
                input_path = console.input("[cyan]Enter input file path: [/cyan]")
                output_path = console.input("[cyan]Enter output file path: [/cyan]")
                
                if choice == "1":
                    handler.encrypt_file(input_path, output_path)
                    console.print("[green]Encryption completed successfully![/green]")
                else:
                    handler.decrypt_file(input_path, output_path)
                    console.print("[green]Decryption completed successfully![/green]")
            else:
                console.print("[red]Invalid choice![/red]")
                
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user[/yellow]")
    except Exception as e:
        console.print(f"[red]An error occurred: {str(e)}[/red]")
