// Step 01: Why doesn't the previous one work?
// The Keyboard Simulation Event was somehow blocked and unable to trigger the key press

// Test Code (Get Target Characters):
// const keyOverrides = {[String.fromCharCode(160)]: ' '};
// function getTargetCharacters() {
//     const elements = Array.from(document.querySelectorAll('.token span.token_unit'));
//     return elements.map(el => {
//         if (el.firstChild?.classList?.contains('_enter')){return 'ENTER';}
//         let char = el.textContent[0];
//         return keyOverrides.hasOwnProperty(char) ? keyOverrides[char] : char;});}
// const characters = getTargetCharacters();
// console.log(characters.join(''));

// This Code does work, successfully extracting the text from the .token spawn.token_unit elements
// Lets see if we can trigger key events manually, or somehow bypass the event blocking

// Step 02: Trouble Shooting
// It is actually much simpler then simulating key press
// TypingClub seems to just be blocking API inputs:
// if (window.core && window.core.record_keydown_time){useInternalApi=true;}
// Instead of API + DOM Simulation (Enhanced) or API Only (Original)

// Why not try the simplest method of 
// const target = document.activeElement;
// if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
//     target.value += 's';
//     target.dispatchEvent(new Event('input', { bubbles: true }));}

// IT WORKS!!!
// Let me simply add more features like realistic speed model and accuracy control...

(async () => {
    console.log("🚀 Starting Final Refined Autotyper...");

    // 1. Identify the hidden input field (Found in your Method A test)
    const inputField = document.querySelector('input[aria-hidden="true"]') || document.activeElement;
    
    // 2. Extract characters with improved logic for spaces and returns
    const getChars = () => {
        const tokens = Array.from(document.querySelectorAll('.token span.token_unit'));
        return tokens.map(el => {
            // Check for the Enter icon
            if (el.querySelector('._enter') || el.classList.contains('_enter')) return '\n';
            
            let text = el.textContent;
            // If text is empty or a non-breaking space, return a standard space
            if (!text || text === '\u00A0' || text.charCodeAt(0) === 160) return ' ';
            
            return text[0];
        }).filter(c => c !== undefined);
    };

    const characters = getChars();
    if (!inputField || characters.length === 0) return console.error("❌ Target not found.");

    // 3. Typing Logic with specific handling for Space and Enter
    const forceType = async (char) => {
        inputField.focus();
        
        const isEnter = char === '\n';
        const isSpace = char === ' ' || char === '\u00A0';
        
        const eventOptions = {
            key: isEnter ? 'Enter' : (isSpace ? ' ' : char),
            code: isEnter ? 'Enter' : (isSpace ? 'Space' : `Key${char.toUpperCase()}`),
            keyCode: isEnter ? 13 : (isSpace ? 32 : char.charCodeAt(0)),
            which: isEnter ? 13 : (isSpace ? 32 : char.charCodeAt(0)),
            bubbles: true
        };

        // Step A: Keydown
        inputField.dispatchEvent(new KeyboardEvent('keydown', eventOptions));

        // Step B: Update Content
        if (!isEnter) {
            // Important: For spaces, the value must be a literal space string
            inputField.value = isSpace ? ' ' : char; 
            inputField.dispatchEvent(new InputEvent('input', {
                data: isSpace ? ' ' : char,
                inputType: 'insertText',
                bubbles: true
            }));
        }

        // Step C: Keyup
        inputField.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
    };

    // 4. Loop with a safe speed (Adjust delay for faster/slower)
    // 100ms delay = ~120 WPM
    for (const char of characters) {
        await forceType(char);
        await new Promise(r => setTimeout(r, 100 + Math.random() * 20));
    }

    console.log("🏁 Lesson Complete with Spaces Fixed!");
})();

// Initial Setup, with the help of Gemini
// Lemme add the features