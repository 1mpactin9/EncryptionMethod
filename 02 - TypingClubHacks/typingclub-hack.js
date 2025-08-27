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
    console.log(`[AutoTyper] User key pressed (${event.key}). Stopping.`);
    window.stopAutoTyper = true;
    window.removeEventListener('keydown', handleUserInputStop);
}


window.addEventListener('keydown', handleUserInputStop);
const keyOverrides = {
  [String.fromCharCode(160)]: ' '
};


function getTargetCharacters() {
  const els = Array.from(document.querySelectorAll('.token span.token_unit'));
  const chrs = els
    .map(el => {
      if (el.firstChild?.classList?.contains('_enter')) {
        return '\n';
      }
      let text = el.textContent[0];
      return text;
    })
    .map(c => keyOverrides.hasOwnProperty(c) ? keyOverrides[c] : c);
  return chrs;
}


function getActiveCharElement() {
    return document.querySelector('.token span.token_unit.token_unit--active');
}


function getCharIndexInDOM(element) {
    const els = Array.from(document.querySelectorAll('.token span.token_unit'));
    return els.indexOf(element);
}


let useInternalApi = false;
async function recordKey(chr) {
    if (useInternalApi) {
        if (enableDetailedLogging) console.log(`[AutoTyper] Using internal API for "${chr}"`);
        window.core.record_keydown_time(chr);
    } else {
        if (enableDetailedLogging) console.log(`[AutoTyper] Using DOM simulation for "${chr}"`);
        const activeElement = document.activeElement;
        const targetElement = (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) ? activeElement : document.body;
        simulateDOMKey(chr, targetElement);
    }
}


function simulateDOMKey(chr, el) {
    try {
        const keyDownEvent = new KeyboardEvent('keydown', {
            key: chr,
            code: `Key${chr.toUpperCase()}`,
            charCode: chr.charCodeAt(0),
            keyCode: chr.charCodeAt(0),
            which: chr.charCodeAt(0),
            bubbles: true,
            cancelable: true,
            isTrusted: true
        });
        el.dispatchEvent(keyDownEvent);


        const keyPressEvent = new KeyboardEvent('keypress', {
            key: chr,
            code: `Key${chr.toUpperCase()}`,
            charCode: chr.charCodeAt(0),
            keyCode: chr.charCodeAt(0),
            which: chr.charCodeAt(0),
            bubbles: true,
            cancelable: true,
             isTrusted: true
        });
         el.dispatchEvent(keyPressEvent);


         const keyUpEvent = new KeyboardEvent('keyup', {
            key: chr,
            code: `Key${chr.toUpperCase()}`,
            charCode: chr.charCodeAt(0),
            keyCode: chr.charCodeAt(0),
            which: chr.charCodeAt(0),
            bubbles: true,
            cancelable: true,
             isTrusted: true
        });
         el.dispatchEvent(keyUpEvent);

    } catch (e) {
        console.error("[AutoTyper] Failed to simulate DOM key event:", e);
    }
}


function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}


function getRandomIncorrectChar() {
    const minAscii = 33; // '!'
    const maxAscii = 126; // '~'
    let charCode;
    do {
        charCode = Math.floor(Math.random() * (maxAscii - minAscii + 1)) + minAscii;
    } while (String.fromCharCode(charCode) === ' ');
    return String.fromCharCode(charCode);
}



async function autoPlay() {
  console.log(`[AutoTyper] Script loaded. Waiting for ${initialStartDelay}ms before starting...`);
  await sleep(initialStartDelay);


  if (window.core && window.core.record_keydown_time) {
      useInternalApi = true;
      console.log("[AutoTyper] TypingClub internal API detected. Using internal method for typing.");
  } else {
      useInternalApi = false;
      console.warn("[AutoTyper] TypingClub internal API not found. Falling back to DOM simulation. Error simulation will be simplified.");
  }


  const chrs = getTargetCharacters();

  if (!chrs || chrs.length === 0) {
      console.error("[AutoTyper] Could not find target characters. Make sure you are in a lesson and the page is fully loaded.");
      window.removeEventListener('keydown', handleUserInputStop);
      return;
  }

  const totalCharacters = chrs.length;
  let intendedCharactersProcessed = 0;
  let intentionalErrorsIntroduced = 0;
  const startTime = Date.now();

  console.log(`[AutoTyper] Starting to type ${totalCharacters} characters...`);
  console.log(`[AutoTyper] Target Accuracy: ${accuracyPercentage}%`);
  console.log(`[AutoTyper] Speed Range (between keyups): ${minDelay}-${maxDelay}ms`);
  console.log(`[AutoTyper] Error Simulation: Typing a single incorrect character when an error is intended.`);
  console.log(`[AutoTyper] Script will stop if you press any key.`);
  console.log(`[AutoTyper] To stop manually via console, type 'window.stopAutoTyper = true;'`);


  for (let i = 0; i < totalCharacters; ++i) {
    if (window.stopAutoTyper) {
        console.log("[AutoTyper] Stop requested. Stopping.");
        break;
    }

    const correctChar = chrs[i];
    intendedCharactersProcessed++;
    const shouldMakeError = Math.random() * 100 > accuracyPercentage;

    if (shouldMakeError) {
      intentionalErrorsIntroduced++;
      const incorrectChar = getRandomIncorrectChar();
      if (enableDetailedLogging) console.log(`[AutoTyper] Intentionally typing incorrect character: "${incorrectChar}" instead of "${correctChar}"`);


      await recordKey(incorrectChar);

    } else {
      await recordKey(correctChar);
    }


    if (intendedCharactersProcessed % progressLogInterval === 0 || i === totalCharacters - 1) { // Log on last character too
        const currentTime = Date.now();
        const elapsedTimeInSeconds = (currentTime - startTime) / 1000;

        const currentSpeedWPM = elapsedTimeInSeconds > 0 ? (intendedCharactersProcessed / 5) / (elapsedTimeInSeconds / 60) : 0;
        const currentAccuracy = intendedCharactersProcessed > 0 ? ((intendedCharactersProcessed - intentionalErrorsIntroduced) / intendedCharactersProcessed) * 100 : 100;


        console.log(`[AutoTyper] Progress: ${intendedCharactersProcessed}/${totalCharacters} characters processed | Intentional Errors: ${intentionalErrorsIntroduced} | Accuracy: ${currentAccuracy.toFixed(2)}% | Speed: ${currentSpeedWPM.toFixed(2)} WPM`);
    }



    if (i < totalCharacters - 1) {
        await sleep(Math.random() * (maxDelay - minDelay) + minDelay);
    }
  }

  const endTime = Date.now();
  const totalElapsedTimeInSeconds = (endTime - startTime) / 1000;

  const finalSpeedWPM = totalElapsedTimeInSeconds > 0 ? (intendedCharactersProcessed / 5) / (totalElapsedTimeInSeconds / 60) : 0;
  const finalAccuracy = intendedCharactersProcessed > 0 ? ((intendedCharactersProcessed - intentionalErrorsIntroduced) / intendedCharactersProcessed) * 100 : 100;


  console.log(`[AutoTyper] Auto-typing finished.`);
  console.log(`[AutoTyper] Final Stats: Total Characters Processed: ${intendedCharactersProcessed} | Intentional Errors: ${intentionalErrorsIntroduced} | Final Accuracy: ${finalAccuracy.toFixed(2)}% | Final Speed: ${finalSpeedWPM.toFixed(2)} WPM`);


  window.removeEventListener('keydown', handleUserInputStop);

}

autoPlay();
