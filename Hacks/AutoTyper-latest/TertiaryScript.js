(async () => {
    console.log("🚀 Starting Smart-Compensating Autotyper...");

    // --- CONFIGURATION ---
    const minWPM = 90;       
    const maxWPM = 110;      
    const targetWPM = 95;    
    
    // Accuracy: 98 means 2% of chars will trigger a "mistake -> backspace -> fix" cycle
    const fakeAccuracy = 98; 

    // --- SETUP & CALCULATIONS ---

    // 1. Identify Input
    const inputField = document.querySelector('input[aria-hidden="true"]') || document.activeElement;
    if (!inputField) return console.error("❌ Input target not found.");

    // 2. Extract Characters (Using your improved logic)
    const getChars = () => {
        return Array.from(
            document.querySelectorAll(".token span.token_unit"),
            (el) => {
                // Handle Enter key visualization
                if (el.firstChild?.classList?.contains("_enter") || el.classList.contains("_enter")) return "\n";
                const char = el.textContent[0];
                return char === "\u00A0" ? " " : char;
            }
        );
    };

    const characters = getChars(); // This is an array of characters
    const totalChars = characters.length;

    if (totalChars === 0) return console.error("❌ No characters found.");

    // 3. Calculate Target Duration
    // Formula: (Chars / 5) = Words.  Words / WPM = Minutes.  Minutes * 60000 = ms.
    // Simplified: (Chars * 12000) / WPM
    const targetDurationMs = (totalChars * 12000) / targetWPM;
    const startTime = Date.now();
    const targetEndTime = startTime + targetDurationMs;

    // Helper: Sleep
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Helper: Calculate dynamic delay to stay on track
    const getNextDelay = (charsLeft) => {
        const now = Date.now();
        const timeRemaining = targetEndTime - now;
        
        // If we are out of time, go as fast as minDelay allows
        if (timeRemaining <= 0) return 12000 / maxWPM;

        // Calculate needed speed to finish on time
        let neededDelay = timeRemaining / charsLeft;

        // Clamp values between Min/Max WPM to prevent robotic bursts
        const minDelay = 12000 / maxWPM; // Fastest allowed
        const maxDelay = 12000 / minWPM; // Slowest allowed

        // Add slight human jitter (+/- 10%)
        const jitter = neededDelay * (0.9 + Math.random() * 0.2);

        return Math.max(minDelay, Math.min(jitter, maxDelay));
    };

    // 4. Typing Engine
    const forceType = async (char) => {
        inputField.focus();
        
        // Event mapping
        const isEnter = char === "\n";
        const isSpace = char === " ";
        const isBackspace = char === "Backspace";

        let eventKey = char;
        let eventCode = `Key${char.toUpperCase()}`;
        let eventKeyCode = char.charCodeAt(0);
        
        if (isEnter) { eventKey = "Enter"; eventCode = "Enter"; eventKeyCode = 13; }
        if (isSpace) { eventKey = " "; eventCode = "Space"; eventKeyCode = 32; }
        if (isBackspace) { eventKey = "Backspace"; eventCode = "Backspace"; eventKeyCode = 8; }

        const eventOpts = { 
            key: eventKey, code: eventCode, keyCode: eventKeyCode, which: eventKeyCode, 
            bubbles: true, cancelable: true, isTrusted: true 
        };

        // Dispatch Events
        inputField.dispatchEvent(new KeyboardEvent("keydown", eventOpts));
        
        if (!isEnter) {
            if (isBackspace) {
                inputField.value = inputField.value.slice(0, -1);
            } else {
                inputField.value += char;
            }
            inputField.dispatchEvent(new InputEvent("input", {
                data: isBackspace ? null : char,
                inputType: isBackspace ? "deleteContentBackward" : "insertText",
                bubbles: true
            }));
        }
        
        inputField.dispatchEvent(new KeyboardEvent("keyup", eventOpts));
    };

    // 5. Main Loop
    for (let i = 0; i < totalChars; i++) {
        const trueChar = characters[i];
        const charsLeft = totalChars - i;

        // --- ACCURACY LOGIC ---
        // Check if we should fake an error
        const shouldError = (Math.random() * 100) > fakeAccuracy;

        if (shouldError) {
            // Type wrong char
            const wrongChar = trueChar === 'a' ? 'z' : 'a'; // Simple wrong char
            await forceType(wrongChar);
            
            // Wait a small "reaction" time (this eats into our time bank!)
            await sleep(getNextDelay(charsLeft + 2)); // +2 acts as a buffer for the fix operations

            // Backspace
            await forceType("Backspace");
            await sleep(Math.random() * 50 + 30); // Fast backspace
        }

        // --- CORRECT TYPING ---
        await forceType(trueChar);

        // --- DYNAMIC DELAY ---
        // Recalculate delay required to hit targetWPM based on time lost/gained
        const delay = getNextDelay(charsLeft - 1);
        await sleep(delay);
    }

    console.log(`🏁 Done! Targeted ${targetWPM} WPM.`);
})();