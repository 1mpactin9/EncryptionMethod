(async () => {
    console.log("🚀 Starting Advanced Refined Autotyper...");

    // --- CONFIGURATION ---
    const minWPM = 90;       // Lowest speed cap
    const maxWPM = 110;      // Highest speed cap
    const targetWPM = 95;    // The average speed to aim for
    
    // Accuracy Settings
    // fakeAccuracy: 98 means 2% of the time it will type wrong -> backspace -> correct
    const fakeAccuracy = 98; 
    const realAccuracy = 100; // Final result is always 100% correct (errors are fixed)

    // --- HELPER FUNCTIONS ---

    // 1. Calculate delay in ms based on WPM
    // Formula: 1 WPM = 5 keystrokes per minute. 
    // ms_per_char = 60000 / (WPM * 5) = 12000 / WPM
    const calculateDelay = () => {
        // Base delay for target WPM
        const baseDelay = 12000 / targetWPM;
        
        // Calculate bounds
        const minDelay = 12000 / maxWPM;
        const maxDelay = 12000 / minWPM;

        // Add randomness (Humanize)
        // We sway the delay slightly but try to stick to the target average
        let randomVariation = (Math.random() * 40) - 20; // +/- 20ms jitter
        let finalDelay = baseDelay + randomVariation;

        // Clamp values so we don't go faster than maxWPM or slower than minWPM
        return Math.max(minDelay, Math.min(finalDelay, maxDelay));
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const getRandomWrongChar = (correctChar) => {
        const possible = "abcdefghijklmnopqrstuvwxyz";
        let char = possible.charAt(Math.floor(Math.random() * possible.length));
        // Ensure we don't accidentally type the correct char as a "mistake"
        return char === correctChar ? (char === 'a' ? 'b' : 'a') : char;
    };

    // 2. Identify the hidden input field
    const inputField = document.querySelector('input[aria-hidden="true"]') || document.activeElement;

    if (!inputField) return console.error("❌ Input target not found.");

    // 3. Extract characters
    const getChars = () => {
        const tokens = Array.from(document.querySelectorAll(".token span.token_unit"));
        return tokens.map((el) => {
            // Check for Enter
            if (el.querySelector("._enter") || el.classList.contains("_enter")) return "\n";
            let text = el.textContent;
            // Normalize spaces
            if (!text || text === "\u00A0" || text.charCodeAt(0) === 160) return " ";
            return text[0];
        }).filter((c) => c !== undefined);
    };

    const characters = getChars();
    if (characters.length === 0) return console.error("❌ No characters found to type.");

    // 4. Typing Logic (Enhanced for Backspace)
    const forceType = async (char) => {
        inputField.focus();

        const isEnter = char === "\n";
        const isSpace = char === " " || char === "\u00A0";
        const isBackspace = char === "Backspace";

        let eventKey = char;
        let eventCode = `Key${char.toUpperCase()}`;
        let eventKeyCode = char.charCodeAt(0);
        let inputType = "insertText";

        // Map special keys
        if (isEnter) { eventKey = "Enter"; eventCode = "Enter"; eventKeyCode = 13; }
        if (isSpace) { eventKey = " "; eventCode = "Space"; eventKeyCode = 32; }
        if (isBackspace) { 
            eventKey = "Backspace"; 
            eventCode = "Backspace"; 
            eventKeyCode = 8; 
            inputType = "deleteContentBackward";
        }

        const eventOptions = {
            key: eventKey,
            code: eventCode,
            keyCode: eventKeyCode,
            which: eventKeyCode,
            bubbles: true,
            cancelable: true,
            isTrusted: true // Try to simulate trusted event (often ignored by browser but good practice)
        };

        // Step A: Keydown
        inputField.dispatchEvent(new KeyboardEvent("keydown", eventOptions));

        // Step B: Input (Update Value)
        if (!isEnter) {
            if (isBackspace) {
                // Remove last character
                inputField.value = inputField.value.slice(0, -1);
            } else {
                // Add character
                inputField.value += (isSpace ? " " : char);
            }
            
            inputField.dispatchEvent(new InputEvent("input", {
                data: isBackspace ? null : (isSpace ? " " : char),
                inputType: inputType,
                bubbles: true
            }));
        }

        // Step C: Keyup
        inputField.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
    };

    // 5. Main Execution Loop
    for (const char of characters) {
        
        // --- ACCURACY ALGORITHM ---
        // Check if we should trigger a fake error
        // If random number (0-100) is greater than fakeAccuracy (e.g., 98), make a mistake.
        const shouldError = (Math.random() * 100) > fakeAccuracy;

        if (shouldError) {
            // 1. Type Wrong (Random character)
            const wrongChar = getRandomWrongChar(char);
            await forceType(wrongChar);
            
            // Wait standard typing delay
            await sleep(calculateDelay());

            // 2. Clear (Backspace)
            await forceType("Backspace");

            // Wait standard typing delay (simulating reaction time to fix)
            await sleep(calculateDelay());
        }

        // --- CORRECT TYPING ---
        // Type the correct character
        await forceType(char);

        // Wait calculated delay to match targetWPM
        await sleep(calculateDelay());
    }

    console.log("🏁 Lesson Complete: " + targetWPM + " WPM Target Hit.");
})();