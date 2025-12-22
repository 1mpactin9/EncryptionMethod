/*
--- AUTOTYPER FOR TYPINGCLUB.COM ---
This script automates typing on TypingClub with human-like speed and accuracy.
To use, paste this code into the browser console while on a TypingClub lesson page.

--- NOTES ---
- This design works as for in December 22, 2025
- This script only works in the old version of TypingClub
- The new version of TypingClub blocks such scripts
*/

(async () => {
  console.log("🚀 Starting Manual Control Autotyper...");

  // --- CONFIGURATION ---
  // SPEED SETTINGS (in milliseconds)
  const minDelay = 30; // SHORTEST DELAY BETWEEN KEYS
  const maxDelay = 150; // LONGEST DELAY BETWEEN KEYS
  const targetDelay = 70; // AVERAGE DELAY BETWEEN KEYS
  // ACCURACY SETTINGS
  const realAccuracy = 95; // IN PERCENTAGE
  const fakeAccuracy = 90; // IN PERCENTAGE

  // --- HELPERS ---
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Generates a delay that hovers around targetDelay but stays within min/max
  const getHumanDelay = () => {
    // Create some randomness (-20ms to +20ms around the target)
    const variation = Math.random() * 40 - 20;
    let delay = targetDelay + variation;

    // Clamp the result so it doesn't go outside min/max
    return Math.max(minDelay, Math.min(delay, maxDelay));
  };

  const getRandomWrongChar = (correctChar) => {
    const possible = "abcdefghijklmnopqrstuvwxyz";
    // prevent typing the correct char by accident
    let char = possible.charAt(Math.floor(Math.random() * possible.length));
    return char === correctChar ? (char === "a" ? "b" : "a") : char;
  };

  // --- SETUP ---
  const inputField =
    document.querySelector('input[aria-hidden="true"]') ||
    document.activeElement;
  if (!inputField) return console.error("❌ Input target not found.");

  // Improved Character Grabber (Based on your tip)
  const getChars = () => {
    return Array.from(
      document.querySelectorAll(".token span.token_unit"),
      (el) => {
        // Check if it is an enter key
        if (
          el.firstChild?.classList?.contains("_enter") ||
          el.classList.contains("_enter")
        )
          return "\n";
        const char = el.textContent[0];
        return char === "\u00A0" ? " " : char;
      }
    );
  };

  const characters = getChars();
  if (characters.length === 0) return console.error("❌ No characters found.");

  // --- TYPING ---
  const forceType = async (char) => {
    inputField.focus();

    const isEnter = char === "\n";
    const isSpace = char === " ";
    const isBackspace = char === "Backspace";

    let eventKey = char;
    let eventCode = `Key${char.toUpperCase()}`;
    let eventKeyCode = char.charCodeAt(0);

    if (isEnter) {
      eventKey = "Enter";
      eventCode = "Enter";
      eventKeyCode = 13;
    }
    if (isSpace) {
      eventKey = " ";
      eventCode = "Space";
      eventKeyCode = 32;
    }
    if (isBackspace) {
      eventKey = "Backspace";
      eventCode = "Backspace";
      eventKeyCode = 8;
    }

    const eventOpts = {
      key: eventKey,
      code: eventCode,
      keyCode: eventKeyCode,
      which: eventKeyCode,
      bubbles: true,
      cancelable: true,
      isTrusted: true,
    };

    inputField.dispatchEvent(new KeyboardEvent("keydown", eventOpts));

    if (!isEnter) {
      if (isBackspace) {
        inputField.value = inputField.value.slice(0, -1);
      } else {
        inputField.value += char;
      }
      inputField.dispatchEvent(
        new InputEvent("input", {
          data: isBackspace ? null : char,
          inputType: isBackspace ? "deleteContentBackward" : "insertText",
          bubbles: true,
        })
      );
    }

    inputField.dispatchEvent(new KeyboardEvent("keyup", eventOpts));
  };

  // --- MAIN LOOP ---
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];

    // 1. REAL ACCURACY
    if (Math.random() * 100 > realAccuracy) {
      const wrongChar = getRandomWrongChar(char);
      await forceType(wrongChar);
      await sleep(getHumanDelay());
      continue;
    }

    // 2. FAKE ACCURACY
    if (Math.random() * 100 > fakeAccuracy) {
      const wrongChar = getRandomWrongChar(char);

      // ERR
      await forceType(wrongChar);
      await sleep(getHumanDelay());

      // ERRVLD
      await forceType("Backspace");
      await sleep(getHumanDelay() + 50); // EXTRA DELAY
    }

    // VLD
    await forceType(char);
    await sleep(getHumanDelay());
  }

  console.log("🏁 Typing Complete.");
})();

// This is V4 of New TypingClub Autotyper
// This Script provides control over speed and accuracy
// The Script Fails on the Newest Version of TypingClub, use the old version
// The Script still works in December 22, 2025
// -Bruno