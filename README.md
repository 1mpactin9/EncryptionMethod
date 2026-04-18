<div align="center">

# 🐍 Encryption Method

**A bundle of Ecnryption and Decryption scripts**

[![Python Version](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-important?style=flat-square)](#)

<p align="center">
    <a href="#quick-navigation">Shortcuts</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#disclaimer">Disclaimer</a>
</p>

</div>

## Quick Navigation

### Single Autotyper Script:
Page: [My Perferences.js](/AutoTyper/01%20Basic/Perferences.js)

**How to use?**

1. Open a lesson in Typing Club
2. Open DevTools
3. Go to console page
4. Paste in the script
5. Enter "allow pasting" if it doesn't allow pasting

DevTools: F12 or Ctrl+Shift+I or Three Dots > More Tools > Developer Tools

**Customization**

Within the script, changing the constants as shown in the script changes the speed and accuracy. The preset is aiming for around 90 WPM for [Typing Club](typingclub.com).

> [!IMPORTANT]
> Users MUST turn ofF block on error(s) feature in Typing Club to ensure consistency of fake accuracy implementation

> [!CAUTION]
> An accuracy config so low, would cause problems

### Automated Autotyper Script:
Page: [Tampermonkey Script.js](/AutoTyper/02%20Intermediate/)

**How to use?**

1. Install Tampermonkey browser extension
2. Enable permissions to run user scripts
3. Click the icon in extensions toolbar
4. Create new script
5. Paste the script into the newly opened tab
6. Ctrl+S to save
7. Go back to typing club menu page
8. The UI should show up
9. If not Enable userscripts
10. Modify settings, toggle Scrap or enter lessons manually
11. START!

> [!NOTE]
> The latest script has updated WPM-targeted calculation, changing the WPM variable directly indicates targeting WPMs, this may be slightly inaccurate due to the unpredictability of Typing Clubs WPM System

> [!CAUTION]
> I do not take responsbility if you over use this script, this script was created for fun and for learning, please use it at your own risks

## Features

This repository contains a comprehensive collection of encryption methods and tools, ranging from classical to quantum approaches:

### Single Layer Encryption
- **RSA Encryption**: Basic RSA encryption and decryption implementations
- **MARS Algorithm**: MARS encryption combined with AES for enhanced security
- **Custom EDS**: Custom encryption/decryption schemes
- **Simple EDS**: Simplified encryption/decryption systems

### Multi Layer Encryption
- **Customizable EDS**: Flexible encryption/decryption with customizable parameters
- **Customizable ES**: Enhanced security with customizable encryption schemes
- **Enhanced Visualization**: RSA-based encryption with visualization capabilities
- **Integrated 1 and 3**: Combined encryption methods (layers 1 and 3)
- **MLC EDS**: Multi-layer custom encryption/decryption system
- **MultiLayered EDS**: Advanced multi-layer encryption/decryption
- **PyCrypto 3 Layer**: Three-layer encryption using PyCrypto library

### Advanced Crypto
- **Encryptors**: Advanced encryption tools with key management
- **Generators**: Hex key generators for secure key creation
- **Secrets**: Secret generation and encryption utilities

### Quantum Computing
- **Quantum Encryption**: Quantum-resistant encryption implementations in Q#
- **Quantum Hashing**: Quantum hashing algorithms using VQE (Variational Quantum Eigensolver)
- **Quantum Demos**: Sample quantum encryption demonstrations

### Automation Tools
- **AutoTyper Scripts**: Automated typing scripts for typing club training (various versions from initial to latest)

### Experimental & Failed Attempts
- **Failed Implementations**: Documentation of unsuccessful encryption attempts (AES, Vaultic) for learning purposes

## Installation

```bash
# 1. Clone
git clone git@github.com:1mpactin9/EncryptionMethod.git

# 2. Enter directory
cd EncryptionMethod

# 3. Setup
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Disclaimer

Parts of this repository may have been generated or assisted by AI tools.
While efforts have been made to review and validate the content, it may contain errors or inaccuracies.

> [!CAUTION]
> Use at your own risk.