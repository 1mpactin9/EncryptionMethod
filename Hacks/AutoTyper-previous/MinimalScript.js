// This script types for you automatically on TypingClub:
// 1. Open the website
// 2. Go into a level
// 3. Open Console (F12) Google Development Tools
// 4. Paste the script and press ENTER

const initialStartDelay = 1500;
let minDelay = 45;
let maxDelay = 50;

const minKeyEventDelay = 10;
const maxKeyEventDelay = 30;

const accuracyPercentage = 98;
const progressLogInterval = 15;

const enableDetailedLogging = false;
window.stopAutoTyper = false;

function handleUserInputStop(event) {
  window.stopAutoTyper = true;
  window.removeEventListener("keydown", handleUserInputStop);
}

window.addEventListener("keydown", handleUserInputStop);
const keyOverrides = {
  [String.fromCharCode(160)]: " ",
};

function getTargetCharacters() {
  const els = Array.from(document.querySelectorAll(".token span.token_unit"));
  const chrs = els
    .map((el) => {
      if (el.firstChild?.classList?.contains("_enter")) {
        return "\n";
      }
      let text = el.textContent[0];
      return text;
    })
    .map((c) => (keyOverrides.hasOwnProperty(c) ? keyOverrides[c] : c));
  return chrs;
}

function getActiveCharElement() {
  return document.querySelector(".token span.token_unit.token_unit--active");
}

function getCharIndexInDOM(element) {
  const els = Array.from(document.querySelectorAll(".token span.token_unit"));
  return els.indexOf(element);
}

let useInternalApi = false;
async function recordKey(chr) {
  if (useInternalApi) {
    window.core.record_keydown_time(chr);
  } else {
    const activeElement = document.activeElement;
    const targetElement =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA")
        ? activeElement
        : document.body;
    simulateDOMKey(chr, targetElement);
  }
}

function simulateDOMKey(chr, el) {
  try {
    const keyDownEvent = new KeyboardEvent("keydown", {
      key: chr,
      code: `Key${chr.toUpperCase()}`,
      charCode: chr.charCodeAt(0),
      keyCode: chr.charCodeAt(0),
      which: chr.charCodeAt(0),
      bubbles: true,
      cancelable: true,
      isTrusted: true,
    });
    el.dispatchEvent(keyDownEvent);

    const keyPressEvent = new KeyboardEvent("keypress", {
      key: chr,
      code: `Key${chr.toUpperCase()}`,
      charCode: chr.charCodeAt(0),
      keyCode: chr.charCodeAt(0),
      which: chr.charCodeAt(0),
      bubbles: true,
      cancelable: true,
      isTrusted: true,
    });
    el.dispatchEvent(keyPressEvent);

    const keyUpEvent = new KeyboardEvent("keyup", {
      key: chr,
      code: `Key${chr.toUpperCase()}`,
      charCode: chr.charCodeAt(0),
      keyCode: chr.charCodeAt(0),
      which: chr.charCodeAt(0),
      bubbles: true,
      cancelable: true,
      isTrusted: true,
    });
    el.dispatchEvent(keyUpEvent);
  } catch (e) {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getRandomIncorrectChar() {
  const minAscii = 33; // '!'
  const maxAscii = 126; // '~'
  let charCode;
  do {
    charCode = Math.floor(Math.random() * (maxAscii - minAscii + 1)) + minAscii;
  } while (String.fromCharCode(charCode) === " ");
  return String.fromCharCode(charCode);
}

async function autoPlay() {
  await sleep(initialStartDelay);

  if (window.core && window.core.record_keydown_time) {
    useInternalApi = true;
  } else {
    useInternalApi = false;
  }

  const chrs = getTargetCharacters();

  if (!chrs || chrs.length === 0) {
    window.removeEventListener("keydown", handleUserInputStop);
    return;
  }

  const totalCharacters = chrs.length;
  let intendedCharactersProcessed = 0;
  let intentionalErrorsIntroduced = 0;
  const startTime = Date.now();

  for (let i = 0; i < totalCharacters; ++i) {
    if (window.stopAutoTyper) {
      break;
    }

    const correctChar = chrs[i];
    intendedCharactersProcessed++;
    const shouldMakeError = Math.random() * 100 > accuracyPercentage;

    if (shouldMakeError) {
      intentionalErrorsIntroduced++;
      const incorrectChar = getRandomIncorrectChar();

      await recordKey(incorrectChar);
    } else {
      await recordKey(correctChar);
    }

    if (
      intendedCharactersProcessed % progressLogInterval === 0 ||
      i === totalCharacters - 1
    ) {
      // Log on last character too
      const currentTime = Date.now();
      const elapsedTimeInSeconds = (currentTime - startTime) / 1000;

      const currentSpeedWPM =
        elapsedTimeInSeconds > 0
          ? intendedCharactersProcessed / 5 / (elapsedTimeInSeconds / 60)
          : 0;
      const currentAccuracy =
        intendedCharactersProcessed > 0
          ? ((intendedCharactersProcessed - intentionalErrorsIntroduced) /
              intendedCharactersProcessed) *
            100
          : 100;
    }

    if (i < totalCharacters - 1) {
      await sleep(Math.random() * (maxDelay - minDelay) + minDelay);
    }
  }

  const endTime = Date.now();
  const totalElapsedTimeInSeconds = (endTime - startTime) / 1000;

  const finalSpeedWPM =
    totalElapsedTimeInSeconds > 0
      ? intendedCharactersProcessed / 5 / (totalElapsedTimeInSeconds / 60)
      : 0;
  const finalAccuracy =
    intendedCharactersProcessed > 0
      ? ((intendedCharactersProcessed - intentionalErrorsIntroduced) /
          intendedCharactersProcessed) *
        100
      : 100;

  window.removeEventListener("keydown", handleUserInputStop);
}

autoPlay();

// Credits to https://gist.github.com/Domiii/52cf49d780ec8c9f01771973c36197af
// This script adds typing speed and typing accuracy control as well as a better key event simulation
// Formatted with Prettier
// -Bruno