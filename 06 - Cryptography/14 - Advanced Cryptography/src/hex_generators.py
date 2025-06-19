import secrets
import hashlib
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


# --- General Utility for Hex Conversion ---
def bytes_to_hex_string(byte_data: bytes) -> str:
    """Converts bytes to a hexadecimal string."""
    return byte_data.hex()


def hex_string_to_bytes(hex_str: str) -> bytes:
    """Converts a hexadecimal string to bytes."""
    return bytes.fromhex(hex_str)


# --- 1. Cryptographically Secure PRNG (CSPRNG) based on AES in Counter Mode (CTR_DRBG) ---
class AesCtrDrbgGenerator:
    """
    A conceptual implementation of an AES-CTR-DRBG for generating secure pseudorandom hex strings.
    In a real-world CSPRNG, continuous entropy reseeding would be crucial.
    """

    def __init__(self, key_length_bytes: int = 32):  # AES-256 uses 32-byte key
        # The 'key_aes' is the secret, unpredictable seed for the DRBG.
        self.key_aes = secrets.token_bytes(key_length_bytes)
        # The 'counter_aes' is incremented for each block generated.
        self.counter_aes = 0
        # The 'nonce_aes' (Initialization Vector in CTR mode) adds uniqueness.
        self.nonce_aes = secrets.token_bytes(16)  # 16 bytes for AES block size

    def generate_hex(self, desired_length_bytes: int) -> str:
        """
        [Direct Generation 1/5] Generates a cryptographically secure random hex string.
        """
        cipher_instance = Cipher(algorithms.AES(self.key_aes), modes.CTR(self.nonce_aes), backend=default_backend())
        encryptor = cipher_instance.encryptor()

        # Calculate number of 16-byte blocks needed
        blocks_needed = (desired_length_bytes + 15) // 16

        generated_bytes = b''
        for _ in range(blocks_needed):
            # In a real CTR_DRBG, the counter management is more rigid (e.g., NIST SP 800-90A)
            # This is a simplified representation of the counter increment.
            counter_block = self.counter_aes.to_bytes(16, 'big')  # Pad counter to 16 bytes
            encrypted_block = encryptor.update(counter_block)
            generated_bytes += encrypted_block
            self.counter_aes += 1  # Increment for next block

        return bytes_to_hex_string(generated_bytes[:desired_length_bytes])


def csprng_pseudo_inverse_hex(output_hex_str: str) -> str:
    """
    [Pseudo Inverse Generation 1/5] Explains why inverse generation is computationally impossible
    for an AES-CTR-DRBG without the secret key.
    """
    return (
        "CSPRNG Inverse Generation (Conceptual): Computationally infeasible.\n"
        "To 'inverse generate' means to find the secret key_aes and nonce_aes (or the input counter state)\n"
        "that would produce a given output_hex_str. This is equivalent to breaking the AES algorithm\n"
        "or predicting the secret key, which is considered intractable for a well-implemented CSPRNG."
    )


def csprng_pseudo_reverse_hex(current_hex_str: str, known_params_str: str = "") -> str:
    """
    [Pseudo Reverse Generation 1/5] Explains why reverse generation is computationally impossible
    for an AES-CTR-DRBG without the secret key.
    """
    return (
        "CSPRNG Reverse Generation (Conceptual): Computationally infeasible.\n"
        "To 'reverse generate' means to determine previous output blocks from a current output_hex_str\n"
        "without knowing the secret key_aes and the exact internal state (counter_aes, nonce_aes).\n"
        "This property is known as 'forward secrecy' and is a design goal of CSPRNGs; a compromise of the\n"
        "current state should not allow past outputs to be reconstructed."
    )


# --- 2. True Random Number Generator (TRNG) via Physical Entropy Source ---
class PhysicalTrngGenerator:
    """
    Utilizes the operating system's true random number generator (TRNG)
    (e.g., /dev/urandom on Linux) for true randomness.
    """

    def generate_hex(self, desired_length_bytes: int) -> str:
        """
        [Direct Generation 2/5] Generates a truly random hex string using the OS's entropy source.
        """
        return bytes_to_hex_string(os.urandom(desired_length_bytes))


def trng_pseudo_inverse_hex(output_hex_str: str) -> str:
    """
    [Pseudo Inverse Generation 2/5] Explains why inverse generation is not applicable for a TRNG.
    """
    return (
        "TRNG Inverse Generation (Conceptual): Not applicable.\n"
        "True Random Number Generators draw from non-deterministic physical phenomena.\n"
        "There is no 'input' or mathematical function to invert to produce a specific random output.\n"
        "Each generated bit is fundamentally unpredictable."
    )


def trng_pseudo_reverse_hex(current_hex_str: str) -> str:
    """
    [Pseudo Reverse Generation 2/5] Explains why reverse generation is not applicable for a TRNG.
    """
    return (
        "TRNG Reverse Generation (Conceptual): Not applicable.\n"
        "For a True Random Number Generator, there is no internal state or deterministic algorithm\n"
        "to 'reverse'. Each output is independent and unpredictable, meaning past outputs cannot\n"
        "be reconstructed from current ones."
    )


# --- 3. Quantum Random Number Generator (QRNG) Output Hashing ---
class QrngHashedGenerator:
    """
    Simulates a QRNG by using os.urandom as a source of high-quality entropy,
    then repeatedly hashes it to extend and obfuscate the randomness.
    """

    def __init__(self):
        # Initial quantum-like entropy for the state
        self.state_qrng = os.urandom(32)  # Initial 256 bits

    def generate_hex(self, desired_length_bytes: int) -> str:
        """
        [Direct Generation 3/5] Generates a hex string by repeatedly hashing a "quantum" state.
        """
        generated_hex_str = ""
        while len(generated_hex_str) < desired_length_bytes * 2:  # 2 hex chars per byte
            # Hash the current state to produce a new block of "randomness"
            hashed_output = hashlib.sha256(self.state_qrng).digest()
            generated_hex_str += bytes_to_hex_string(hashed_output)

            # Update the internal state for the next iteration using the hash output itself
            self.state_qrng = hashed_output  # Strong forward secrecy

        return generated_hex_str[:desired_length_bytes * 2]


def qrng_hashed_pseudo_inverse_hex(output_hex_str: str) -> str:
    """
    [Pseudo Inverse Generation 3/5] Explains why inverse generation is computationally impossible
    for QRNG output hashing.
    """
    return (
        "QRNG Hashed Inverse Generation (Conceptual): Computationally infeasible.\n"
        "Due to the one-way (preimage resistance) property of cryptographic hash functions (SHA256),\n"
        "it is impossible to deduce the original 'quantum' state that led to a given hashed output."
    )


def qrng_hashed_pseudo_reverse_hex(current_hex_str: str, known_state_info: str = "") -> str:
    """
    [Pseudo Reverse Generation 3/5] Explains why reverse generation is computationally impossible
    for QRNG output hashing.
    """
    return (
        "QRNG Hashed Reverse Generation (Conceptual): Computationally infeasible.\n"
        "Even if the current internal state of the generator were known, the cryptographic hash\n"
        "function (SHA256) used to update the state is one-way. This prevents deriving previous\n"
        "states or generated outputs from current information, ensuring strong forward secrecy."
    )


# --- 4. Chaotic System with Obfuscated State and High-Dimensional Output Mapping ---
class ChaoticHexObfuscatedGenerator:
    """
    A conceptual generator based on a chaotic system (Logistic Map) with state obfuscation
    via hashing. Real-world chaotic RNGs require arbitrary precision arithmetic.
    """

    def __init__(self, initial_float_seed: float = None):
        # 'chaos_x' is the sensitive initial condition of the chaotic map (0 < x < 1)
        if initial_float_seed is None:
            # Using secrets to get a high-entropy initial float for demonstration
            self.chaos_x = int.from_bytes(secrets.token_bytes(8), 'big') / (2 ** 64)  # Float representation
        else:
            self.chaos_x = initial_float_seed

        # 'chaos_r' is the chaotic parameter (e.g., 3.999... for logistic map)
        self.chaos_r = 3.999999999999999  # Close to 4 for maximal chaos

        # 'obfuscation_key' is a secret key mixed into the output for added complexity
        self.obfuscation_key = secrets.token_bytes(16)

    def _iterate_logistic_map(self):
        """Internal function to advance the chaotic logistic map."""
        # x_n+1 = r * x_n * (1 - x_n)
        self.chaos_x = self.chaos_r * self.chaos_x * (1 - self.chaos_x)
        # Keep x within (0, 1) bounds to prevent floating point issues leading to collapse
        self.chaos_x = max(1e-18, min(1 - 1e-18, self.chaos_x))  # Small epsilon to avoid 0 or 1

    def generate_hex(self, desired_length_bytes: int) -> str:
        """
        [Direct Generation 4/5] Generates a hex string using a chaotic map with hashing.
        """
        generated_bytes = b''
        while len(generated_bytes) < desired_length_bytes:
            self._iterate_logistic_map()

            # Convert the chaotic float state to bytes with sufficient precision for hashing
            # This conversion and hashing is the primary obfuscation step
            state_bytes_for_hash = str(self.chaos_x).encode('utf-8')

            # Hash the chaotic state mixed with the secret obfuscation key
            # This makes direct reversal of the map incredibly hard without the key
            mixed_hash_result = hashlib.sha256(state_bytes_for_hash + self.obfuscation_key).digest()
            generated_bytes += mixed_hash_result

            # Evolve the obfuscation key subtly based on the hash (conceptual for added complexity)
            self.obfuscation_key = hashlib.sha256(self.obfuscation_key + mixed_hash_result).digest()[:16]

        return bytes_to_hex_string(generated_bytes[:desired_length_bytes])


def chaotic_pseudo_inverse_hex(output_hex_str: str) -> str:
    """
    [Pseudo Inverse Generation 4/5] Explains why inverse generation is practically impossible
    for a chaotic system with obfuscation.
    """
    return (
        "Chaotic System Inverse Generation (Conceptual): Practically impossible.\n"
        "Even with perfect knowledge of the chaotic map, its extreme sensitivity to initial conditions\n"
        "(butterfly effect) means any tiny error in the output or parameters would lead to a vastly\n"
        "different inverse. Furthermore, the one-way hashing step (SHA256) with an obfuscation_key\n"
        "makes finding the original internal chaotic state computationally infeasible without the key."
    )


def chaotic_pseudo_reverse_hex(current_hex_str: str, current_chaos_state_info: str = "") -> str:
    """
    [Pseudo Reverse Generation 4/5] Explains why reverse generation is practically impossible
    for a chaotic system with obfuscation.
    """
    return (
        "Chaotic System Reverse Generation (Conceptual): Practically impossible.\n"
        "Reversing a chaotic map (like the logistic map) involves solving for its previous state,\n"
        "which can have multiple solutions. This ambiguity, combined with the extreme sensitivity\n"
        "to floating-point precision loss over iterations and the one-way hashing with a secret\n"
        "obfuscation_key, makes backtracking the sequence computationally intractable."
    )


# --- 5. One-Way Function Composition with Seed Expansion ---
class OneWayFunctionCompositionGenerator:
    """
    Constructs a PRNG by repeatedly applying a strong one-way function (SHA512)
    to an evolving internal state that is expanded and transformed.
    """

    def __init__(self, initial_state_length_bytes: int = 64):  # SHA512 output is 64 bytes
        # The 'current_owf_state' is the internal evolving state
        self.current_owf_state = secrets.token_bytes(initial_state_length_bytes)

    def generate_hex(self, desired_length_bytes: int) -> str:
        """
        [Direct Generation 5/5] Generates a hex string by composing one-way functions.
        """
        generated_bytes = b''
        while len(generated_bytes) < desired_length_bytes:
            # Apply a strong one-way hash function (SHA512) to the current state
            # This generates a new block of unpredictable output and the next state component
            new_hash_output = hashlib.sha512(self.current_owf_state).digest()

            # Use a portion of the hash as output
            output_chunk = new_hash_output[:min(16, len(new_hash_output))]  # Take first 16 bytes or less
            generated_bytes += output_chunk

            # Update the internal state for the next iteration using the full hash output,
            # ensuring good mixing and forward secrecy.
            self.current_owf_state = hashlib.sha512(self.current_owf_state + new_hash_output).digest()

        return bytes_to_hex_string(generated_bytes[:desired_length_bytes])


def oneway_pseudo_inverse_hex(output_hex_str: str) -> str:
    """
    [Pseudo Inverse Generation 5/5] Explains why inverse generation is computationally impossible
    for a one-way function composition generator.
    """
    return (
        "One-Way Function Inverse Generation (Conceptual): Computationally impossible.\n"
        "This generator's security relies on the preimage resistance of the underlying\n"
        "cryptographic hash function (SHA512). Given an output hex string, it is computationally\n"
        "infeasible to find the specific internal state that produced it, thus preventing inverse generation."
    )


def oneway_pseudo_reverse_hex(current_hex_str: str, current_state_snapshot: str = "") -> str:
    """
    [Pseudo Reverse Generation 5/5] Explains why reverse generation is computationally impossible
    for a one-way function composition generator.
    """
    return (
        "One-Way Function Reverse Generation (Conceptual): Computationally impossible.\n"
        "The state update mechanism uses a one-way function. Even if the current internal state\n"
        "(`current_owf_state`) is known, it is computationally infeasible to reverse the hashing\n"
        "process to derive the previous state or previous outputs. This guarantees strong forward secrecy."
    )


# --- Main demonstration and routing ---
def main():
    """
    Demonstrates the usage of each advanced HEX generator type.
    """
    print("--- Demonstrating Advanced Nearly Impossible to Reverse HEX Generators ---")
    output_length = 16  # Desired output length in bytes (32 hex characters)

    # 1. CSPRNG (AES-CTR-DRBG)
    print("\n--- 1. CSPRNG (AES-CTR-DRBG) ---")
    aes_drbg_instance = AesCtrDrbgGenerator()
    generated_aes_hex = aes_drbg_instance.generate_hex(output_length)
    print(f"Direct Generation: {generated_aes_hex}")
    print(csprng_pseudo_inverse_hex(generated_aes_hex))
    print(csprng_pseudo_reverse_hex(generated_aes_hex))

    # 2. True Random Number Generator (TRNG)
    print("\n--- 2. True Random Number Generator (TRNG) ---")
    trng_instance = PhysicalTrngGenerator()
    generated_trng_hex = trng_instance.generate_hex(output_length)
    print(f"Direct Generation: {generated_trng_hex}")
    print(trng_pseudo_inverse_hex(generated_trng_hex))
    print(trng_pseudo_reverse_hex(generated_trng_hex))

    # 3. Quantum Random Number Generator (QRNG) Output Hashing
    print("\n--- 3. QRNG Output Hashing ---")
    qrng_hash_instance = QrngHashedGenerator()
    generated_qrng_hex = qrng_hash_instance.generate_hex(output_length)
    print(f"Direct Generation: {generated_qrng_hex}")
    print(qrng_hashed_pseudo_inverse_hex(generated_qrng_hex))
    print(qrng_hashed_pseudo_reverse_hex(generated_qrng_hex))

    # 4. Chaotic System with Obfuscated State
    print("\n--- 4. Chaotic System with Obfuscated State ---")
    chaotic_gen_instance = ChaoticHexObfuscatedGenerator()
    generated_chaotic_hex = chaotic_gen_instance.generate_hex(output_length)
    print(f"Direct Generation: {generated_chaotic_hex}")
    print(chaotic_pseudo_inverse_hex(generated_chaotic_hex))
    print(chaotic_pseudo_reverse_hex(generated_chaotic_hex))

    # 5. One-Way Function Composition
    print("\n--- 5. One-Way Function Composition ---")
    owf_comp_instance = OneWayFunctionCompositionGenerator()
    generated_owf_hex = owf_comp_instance.generate_hex(output_length)
    print(f"Direct Generation: {generated_owf_hex}")
    print(oneway_pseudo_inverse_hex(generated_owf_hex))
    print(oneway_pseudo_reverse_hex(generated_owf_hex))


# --- How to Integrate into Other Stuff ---
"""
Integration Notes:

1.  **Direct Generation:**
    * For applications requiring strong security (e.g., cryptographic keys, salts, nonces, session tokens), use `AesCtrDrbgGenerator` or `PhysicalTrngGenerator`. Initialize the class once and then call `generate_hex()` whenever a new random hex string is needed.
    * Example: `my_key = AesCtrDrbgGenerator().generate_hex(32)`
    * For simulations or non-security-critical applications where high quality and unpredictability are still desired (e.g., generating unique IDs for data, procedural content in games), the `QrngHashedGenerator` or `ChaoticHexObfuscatedGenerator` could be considered, but generally, a well-seeded CSPRNG is preferred for most purposes.

2.  **Handling "Pseudo Inverse/Reverse":**
    * The `_pseudo_inverse_hex` and `_pseudo_reverse_hex` functions are primarily for conceptual understanding and explaining limitations. They are not meant to be called for actual "inversion" or "reversal" as that is the property we are aiming to prevent.
    * In a real application, you would *not* expect these functions to return a meaningful prior state or input. Their purpose is to convey the impossibility.

3.  **Dependency Management:**
    * The `cryptography` library requires `pip install cryptography`.
    * `os` and `hashlib` are standard Python libraries.
    * `secrets` is a standard Python library (Python 3.6+).

4.  **Error Handling and Robustness:**
    * For production systems, consider adding more robust error handling (e.g., for `os.urandom` failures on systems with low entropy).
    * Ensure proper seeding of any PRNGs. For CSPRNGs, rely on the operating system's robust entropy sources (as `os.urandom` does).

5.  **Performance vs. Security:**
    * TRNGs (`PhysicalTrngGenerator`) can be slower as they rely on physical phenomena.
    * CSPRNGs (`AesCtrDrbgGenerator`) offer a good balance of speed and cryptographic strength.
    * The conceptual chaotic and one-way function generators can vary in performance depending on the complexity of their internal operations.

6.  **State Management:**
    * For stateful generators (like `AesCtrDrbgGenerator`, `QrngHashedGenerator`, `ChaoticHexObfuscatedGenerator`, `OneWayFunctionCompositionGenerator`), an instance should be maintained throughout the application's lifecycle to ensure a continuous and long sequence of random numbers. Avoid re-instantiating them repeatedly unless you explicitly desire a new, independent sequence from a fresh seed each time.
"""

if __name__ == "__main__":
    main()
