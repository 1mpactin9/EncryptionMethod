# EncryptionMethod - Project Context

## Project Overview

**EncryptionMethod** is a comprehensive collection of encryption and decryption scripts ranging from classical to quantum approaches. The project serves as both a learning resource and a practical toolkit for various cryptographic techniques.

### Core Components

1. **Single Layer Encryption** (`01 SingleLayer/`) - Basic encryption implementations including RSA, MARS, and custom encryption/decryption schemes (EDS)
2. **Multi Layer Encryption** (`02 MultiLayer/`) - Advanced multi-layered encryption systems combining multiple algorithms (AES, DES, RSA, MARS, Base64, FPE)
3. **Advanced Crypto** (`03 Advanced/`) - Production-grade encryptors, key generators, and secret management tools with rich CLI interfaces
4. **Quantum Computing** (`04 Quantum/`) - Quantum-resistant encryption implementations in Q# with Qiskit integration
5. **Legacy** (`05 Legacy/`) - Older implementations and failed attempts (AES, Vaultic) kept for reference
6. **AutoTyper** (`AutoTyper/`) - Automated typing scripts for TypingClub (JavaScript-based browser automation)

### Technologies & Dependencies

- **Python 3.10+** (primary language for encryption scripts)
- **JavaScript** (AutoTyper browser scripts)
- **Q# / C#** (Quantum encryption modules)

**Key Libraries** (from `requirements.txt`):
- `cryptography` - Cryptographic primitives and algorithms
- `pycryptodome` - AES, DES, MARS, and other symmetric ciphers
- `rsa` - RSA public/private key operations
- `qiskit` - IBM quantum computing framework
- `torch` - PyTorch for potential ML-based features
- `rich`, `tqdm`, `colorama` - CLI formatting and progress bars
- `numpy` - Numerical computations

## Project Structure

```
EncryptionMethod/
├── 01 SingleLayer/
│   ├── CustomEDS/          # Custom encryption/decryption schemes
│   ├── MARS/               # MARS algorithm implementations
│   ├── RSA/                # RSA encryption/decryption
│   └── SimpleEDS/          # Simplified encryption systems
├── 02 MultiLayer/
│   ├── CustomizableEDS/    # Flexible multi-layer encryption
│   ├── CustomizableES/     # Enhanced security schemes
│   ├── EnhancedVisualization/  # RSA with visualization
│   ├── Integrated1And3/    # Combined encryption methods
│   ├── MLCEDS/             # Multi-layer custom EDS
│   ├── MultiLayeredEDS/    # Advanced multi-layer (MARS+RSA+AES+DES+Base64+FPE)
│   └── PyCrypto3Layer/     # Three-layer PyCrypto encryption
├── 03 Advanced/
│   ├── Encryptors/         # Advanced encryption with key management
│   ├── Generators/         # Hex key generators
│   ├── Secrets/            # Secret generation utilities
│   └── generation.md       # Specification for key-based encryption system
├── 04 Quantum/
│   ├── Demos/              # Quantum encryption demonstrations
│   ├── Encryption/         # Q# quantum encryption (quantum_encryption.qs)
│   └── Hash/               # Quantum hashing with VQE
├── 05 Legacy/
│   ├── AutoTyper/          # Older autotyper versions
│   ├── aes_encryption.py   # Legacy AES implementation
│   ├── aes_decryption.py   # Legacy AES decryption
│   └── vaultic.py          # Failed Vaultic attempt
├── AutoTyper/
│   ├── 01 Basic/           # Basic typing scripts (JavaScript)
│   ├── 02 Intermediate/    # Intermediate autotyper versions
│   └── 03 Advanced/        # Advanced Tampermonkey script
├── requirements.txt        # Python dependencies
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

## Building and Running

### Python Encryption Scripts

```bash
# Setup virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run individual scripts
python "01 SingleLayer/RSA/rsa_encryption.py"
python "02 MultiLayer/MultiLayeredEDS/multilayered_eds_encrypt.py"
python "03 Advanced/Encryptors/encryptor.py"
```

### Quantum Scripts (Q#)

```bash
# Requires .NET SDK and Q# Development Kit
# Navigate to quantum directory
cd "04 Quantum/Encryption"

# Run with dotnet
dotnet run
```

### AutoTyper Scripts (JavaScript)

**Basic Scripts:**
1. Open TypingClub lesson in browser
2. Open DevTools (F12 or Ctrl+Shift+I)
3. Go to Console tab
4. Paste the script and press Enter
5. Type "allow pasting" if prompted

**Advanced Tampermonkey Script:**
1. Install Tampermonkey browser extension
2. Create new user script
3. Paste the script from `AutoTyper/03 Advanced/`
4. Save (Ctrl+S)
5. Navigate to TypingClub - UI should appear
6. Configure settings and start

## Development Conventions

### Code Style
- Python scripts use standard naming conventions (snake_case for functions/variables)
- Files are typically named descriptively with underscores (e.g., `rsa_encryption.py`, `multilayered_eds_encrypt.py`)
- Each script is generally self-contained and runnable independently
- CLI interfaces use interactive prompts (`input()`) for user input

### Architecture Patterns
- **Single Responsibility**: Each script focuses on one encryption method or layer
- **Modular Design**: Encryption and decryption are typically in separate files
- **Layered Approach**: Multi-layer systems apply algorithms sequentially
- **Visual Feedback**: Use of `rich`, `tqdm`, and `colorama` for formatted output with progress indicators

### Key Management
- Advanced encryptors use seed-based key generation with pseudo-random hex keys
- Key files use `.key`, `.key.encrypted`, `.key.decrypted` extensions
- XOR cipher is used for simple file encryption in key management
- SHA-256 hashing for seed derivation

### Documentation
- Each major module contains its own README or Intro.md explaining usage
- Multi-layered systems include detailed explanation of encryption flow
- Legacy code is preserved (not deleted) for learning purposes

## Important Notes

- **Educational Purpose**: Some implementations are simplified or simulated (e.g., MARS uses AES interface, RSA uses basic transformations). These are for demonstration, not production use.
- **AI-Assisted**: Parts of the repository may have been generated or assisted by AI tools - review code before using in production
- **Not Production-Ready**: These scripts are for learning and experimentation. Use established, audited libraries for real-world security needs
- **AutoTyper Disclaimer**: The AutoTyper scripts are designed for TypingClub practice and may violate terms of service

## Common Tasks

### Adding a New Encryption Method
1. Create a new directory under the appropriate category (`01 SingleLayer/`, `02 MultiLayer/`, etc.)
2. Follow the naming convention: `{method}_encryption.py` and `{method}_decryption.py`
3. Include an `Intro.md` or `README.md` explaining the implementation
4. Use `rich`/`tqdm` for CLI output if user-facing

### Working with Multi-Layer Systems
- Multi-layer scripts typically encrypt/decrypt in sequence: AES → DES → RSA → MARS → Base64 → FPE
- Decryption reverses the order
- Each layer generates its own keys (stored in memory or temporary files)

### Key File Format (Advanced)
Per `generation.md` specification:
- `.key` files contain hex-encoded private keys
- Format includes 5 custom PRIVATE_KEYS, 1 USERNAME, 1 PASSWORD
- Keys are hex-encoded with extra metadata for parsing
