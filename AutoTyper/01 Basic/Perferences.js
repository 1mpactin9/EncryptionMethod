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
  // --- CONFIGURATION ---
  // SPEED SETTINGS (target is affected by min and max)
  const minDelay = 60; // SHORTEST DELAY BETWEEN KEYS
  const maxDelay = 140; // LONGEST DELAY BETWEEN KEYS
  const targetDelay = 120; // AVERAGE DELAY BETWEEN KEYS
  // ACCURACY SETTINGS (1% ERROR)
  const realAccuracy = 100; // IN PERCENTAGE
  const fakeAccuracy = 99; // IN PERCENTAGE

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const dynamicDelay = () => {
    const variation = Math.random() * 40 - 20;
    let delay = targetDelay + variation;

    return Math.max(minDelay, Math.min(delay, maxDelay));
  };

  const getRandomWrongChar = (correctChar) => {
    const possible = "abcdefghijklmnopqrstuvwxyz";
    let char = possible.charAt(Math.floor(Math.random() * possible.length));
    return char === correctChar ? (char === "a" ? "b" : "a") : char;
  };

  const inputField =
    document.querySelector('input[aria-hidden="true"]') ||
    document.activeElement;
  if (!inputField) return;

  const getChars = () => {
    return Array.from(
      document.querySelectorAll(".token span.token_unit"),
      (el) => {
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
  if (characters.length === 0) return;

  const Type = async (char) => {
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

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (Math.random() * 100 > realAccuracy) {
      const wrongChar = getRandomWrongChar(char);
      await Type(wrongChar);
      await sleep(dynamicDelay());
      continue;
    }
    if (Math.random() * 100 > fakeAccuracy) {
      const wrongChar = getRandomWrongChar(char);
      await Type(wrongChar);
      await sleep(dynamicDelay());
      await Type("Backspace");
      await sleep(dynamicDelay() + 50);
    }
    await Type(char);
    await sleep(dynamicDelay());
  }
})();

// This is V4 of New TypingClub Autotyper
// This Script provides control over speed and accuracy
// The Script Fails on the Newest Version of TypingClub, use the old version
// The Script still works in December 22, 2025
// -Bruno