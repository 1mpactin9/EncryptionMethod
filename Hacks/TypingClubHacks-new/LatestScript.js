(async () => {
  console.log("🚀 Starting Manual Control Autotyper...");

  // --- CONFIGURATION (EDIT THESE) ---

  // SPEED SETTINGS (in milliseconds)
  // Lower numbers = Faster. Higher numbers = Slower.
  const minDelay = 30; // Fastest allowed speed between keys
  const maxDelay = 150; // Slowest allowed speed between keys
  const targetDelay = 70; // The average speed you want to maintain

  // ACCURACY SETTINGS
  // realAccuracy: 95 means 5% of characters will be TYPED WRONG and LEFT WRONG.
  const realAccuracy = 95;

  // fakeAccuracy: 90 means 10% of the *correct* characters will be mistyped, then backspaced, then fixed.
  const fakeAccuracy = 90;

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

  // --- TYPING ENGINE ---

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

    // 1. CHECK REAL ACCURACY (Permanent Errors)
    // If this fails, we type a wrong letter and MOVE ON (do not fix it).
    if (Math.random() * 100 > realAccuracy) {
      const wrongChar = getRandomWrongChar(char);
      await forceType(wrongChar);
      await sleep(getHumanDelay());
      continue; // Skip to the next character loop (leaving the error behind)
    }

    // 2. CHECK FAKE ACCURACY (Corrected Errors)
    // If this fails, we type wrong -> wait -> backspace -> wait -> type correct.
    if (Math.random() * 100 > fakeAccuracy) {
      const wrongChar = getRandomWrongChar(char);

      // Type wrong
      await forceType(wrongChar);
      await sleep(getHumanDelay());

      // Backspace
      await forceType("Backspace");
      await sleep(getHumanDelay() + 50); // Little extra delay for "realization"
    }

    // 3. TYPE CORRECTLY
    await forceType(char);
    await sleep(getHumanDelay());
  }

  console.log("🏁 Typing Complete.");
})();
