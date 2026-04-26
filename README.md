<div align="center">

# 🐍 Avaultic

<p align="center">
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#disclaimer">Disclaimer</a>
</p>
</div>

**VLT** is a:
- highly secure
- local-first

desktop password manager written in Tauri Typescript Frontend and Rust Backend. It is designed from the ground up with:
- strict cryptographic hygiene
- memory safety
- robust file system interactions.

Rather than reinventing the wheel, VLT utilizes state-of-the-art cryptographic primitives (Argon2id, XChaCha20-Poly1305) and enforces defensive programming paradigms to protect your data at rest, in transit, and in memory.


## Features
For **AutoTyper** please move to https://github.com/1mpactin9/AutoTyper

This repository contains a comprehensive collection of encryption methods and tools, ranging from classical to quantum approaches:

### Security Features:
- **Two-key design:** master key encrypts a vault key, so passwords can be changed instantly without re-encrypting everything.
- **XChaCha20-Poly1305:** uses large random nonces to avoid reuse vulnerabilities.
- **AAD chaining:** binds header, keys, and data to detect any tampering.
- **Memory safety:** keys are protected, zeroed on drop, and kept out of disk swapping.
- *Atomic writes:* temp file → fsync → rename ensures no corruption on crashes.
- **KDF limits:** validates Argon2id parameters to prevent weak or abusive settings.

## Installation
```bash
# 1. Clone
git clone git@github.com:1mpactin9/Encryption.git
# or
gh repo clone 1mpactin9/Encryption

# 2. Enter directory
cd Encryption

# 3. Setup
pnpm install
pnpm tauri dev
pnpm tauri build
```
or downloading an official Release from https://github.com/1mpactin9/Encryption/releases

## Disclaimer
Parts of this repository may have been generated or assisted by AI tools.
While efforts have been made to review and validate the content, it may contain errors or inaccuracies. Use at your own risk.