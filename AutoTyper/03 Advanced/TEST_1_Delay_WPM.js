/*
--- TEST 1 REVISED: CONTROLLED DELAY TO WPM CALIBRATION ---
Purpose: Map fixed delay values to resulting WPM in a controlled, predictable way
Usage: Paste into browser console on a TypingClub lesson page

IMPORTANT: Stay on the SAME lesson for all tests. Do not switch lessons.

Instructions:
1. Open a TypingClub lesson (pick ONE lesson and use it for ALL tests below)
2. Paste this script into the console
3. The script will FIRST analyze the lesson (count words, characters, keystrokes)
4. Then it runs typing tests with FIXED delays (no random variation, no errors for baseline)
5. After each run, note the WPM shown on the results page
6. Reload the lesson page between each test to reset

Design Philosophy:
- Phase 1: Fixed delay, 100% accuracy → establishes clean baseline WPM
- Phase 2: Fixed delay, with errors → measures WPM penalty from mistakes
- Phase 3: Variable delay → measures WPM impact of speed fluctuation
- The WPM formula should be: WPM ≈ (words / minutes) where words = chars/5
*/

(async () => {
  console.log("=".repeat(80));
  console.log("🧪 TEST 1 REVISED: CONTROLLED DELAY TO WPM CALIBRATION");
  console.log("=".repeat(80));

  // ==================== PHASE 0: LESSON ANALYSIS ====================
  console.log("\n📋 PHASE 0: Analyzing lesson content...\n");

  const getLessonContent = () => {
    const chars = Array.from(
      document.querySelectorAll(".token span.token_unit"),
      (el) => {
        if (el.firstChild?.classList?.contains("_enter") || el.classList.contains("_enter"))
          return "\n";
        const char = el.textContent[0];
        return char === "\u00A0" ? " " : char;
      }
    );

    if (chars.length === 0) {
      console.error("❌ No characters found. Make sure you're on a lesson page.");
      return null;
    }

    const text = chars.join('');
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charCount = chars.length;
    const lineCount = (text.match(/\n/g) || []).length;
    const spaceCount = (text.match(/ /g) || []).length;

    return {
      characters: chars,
      fullText: text,
      wordCount: wordCount,
      charCount: charCount,
      lineCount: lineCount,
      spaceCount: spaceCount,
      standardWords: (charCount / 5).toFixed(1),
      correctKeystrokes: charCount,
    };
  };

  const lesson = getLessonContent();
  if (!lesson) return;

  console.log("--- LESSON CONTENT ANALYSIS ---");
  console.log(`Total Characters: ${lesson.charCount}`);
  console.log(`Total Words (space-separated): ${lesson.wordCount}`);
  console.log(`Standard Words (chars/5): ${lesson.standardWords}`);
  console.log(`Lines: ${lesson.lineCount}`);
  console.log(`Spaces: ${lesson.spaceCount}`);
  console.log(`Correct Keystrokes (no errors): ${lesson.correctKeystrokes}`);
  console.log(`\nFirst 200 chars of lesson text:`);
  console.log(`"${lesson.fullText.substring(0, 200)}"`);

  // Calculate expected WPM for each delay
  console.log("\n--- THEORETICAL WPM CALCULATIONS (no errors, fixed delay) ---");
  console.log("Formula: WPM = (standardWords) / (totalDelayMs / 60000)");

  const testDelays = [50, 70, 90, 110, 130, 150, 170];
  const expectedWPMs = testDelays.map(delay => {
    const totalTimeMs = delay * lesson.charCount;
    const totalTimeMin = totalTimeMs / 60000;
    const standardWords = lesson.charCount / 5;
    const wpm = standardWords / totalTimeMin;
    return { delay, totalTimeMs: (totalTimeMs/1000).toFixed(1) + 's', expectedWPM: wpm.toFixed(1) };
  });

  console.table(expectedWPMs);

  console.log("\n⚠️  IMPORTANT: The WPM values above are THEORETICAL (no errors, fixed delay).");
  console.log("    TypingClub's actual WPM may differ slightly due to their word counting method,");
  console.log("    timing start/stop points, and rendering overhead.");

  // ==================== SHARED HELPERS ====================
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const setupTyping = () => {
    const inputField = document.querySelector('input[aria-hidden="true"]') || document.activeElement;
    if (!inputField) {
      console.error("❌ Input target not found.");
      return null;
    }
    return inputField;
  };

  // EXACT same Type function from Perferences.js
  const Type = async (inputField, char) => {
    inputField.focus();

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
      bubbles: true, cancelable: true, isTrusted: true,
    };

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
        bubbles: true,
      }));
    }
    inputField.dispatchEvent(new KeyboardEvent("keyup", eventOpts));
  };

  const getRandomWrongChar = (correctChar) => {
    const possible = "abcdefghijklmnopqrstuvwxyz";
    let char = possible.charAt(Math.floor(Math.random() * possible.length));
    return char === correctChar ? (char === "a" ? "b" : "a") : char;
  };

  // Detect WPM from results page
  const detectWPM = () => {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.children.length === 0) {
        const text = el.textContent.trim();
        if (text.match(/\d+\s*WPM/i)) {
          const match = text.match(/(\d+)/);
          if (match) return parseInt(match[1]);
        }
      }
    }
    return null;
  };

  // ==================== TEST RUNNERS ====================

  // EXACT same logic as Perferences.js but with fixed delay and configurable accuracy
  // realAccuracy: if roll fails, types wrong char and SKIPS correct char (real error)
  // fakeAccuracy: if roll fails, types wrong, backspace, then types correct (self-corrected)
  const typeWithAccuracy = async (inputField, characters, delay, realAccuracy, fakeAccuracy) => {
    let realErrors = 0;
    let fakeErrors = 0;
    let totalKeystrokes = 0;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Real error: type wrong, skip correct char
      if (Math.random() * 100 > realAccuracy) {
        const wrongChar = getRandomWrongChar(char);
        await Type(inputField, wrongChar);
        await sleep(delay);
        realErrors++;
        totalKeystrokes++;
        continue;
      }

      // Fake error: type wrong, backspace, then type correct
      if (Math.random() * 100 > fakeAccuracy) {
        const wrongChar = getRandomWrongChar(char);
        await Type(inputField, wrongChar);
        await sleep(delay);
        await Type(inputField, "Backspace");
        await sleep(delay + 50);
        fakeErrors++;
        totalKeystrokes += 2; // wrong + backspace
      }

      // Correct character
      await Type(inputField, char);
      await sleep(delay);
      totalKeystrokes++;
    }

    return { realErrors, fakeErrors, totalKeystrokes };
  };

  // Test Type A: Fixed delay, 100% accuracy (baseline)
  window.runTestFixed = async (delayMs) => {
    console.log(`\n🚀 Running FIXED delay test: ${delayMs}ms, 100% accuracy (no errors)`);
    console.log(`   Characters: ${lesson.charCount}`);
    console.log(`   Expected total time: ${((delayMs * lesson.charCount) / 1000).toFixed(1)}s`);
    const expected = expectedWPMs.find(e => e.delay === delayMs);
    console.log(`   Theoretical WPM: ${expected ? expected.expectedWPM : '?'} `);

    const inputField = setupTyping();
    if (!inputField) return;

    const startTime = Date.now();
    const result = await typeWithAccuracy(inputField, lesson.characters, delayMs, 100, 100);
    const elapsed = Date.now() - startTime;

    console.log(`\n✅ Typing complete in ${(elapsed/1000).toFixed(2)}s`);
    console.log(`   Keystrokes: ${result.totalKeystrokes} (base: ${lesson.charCount})`);
    console.log(`   Real errors: ${result.realErrors}, Fake errors: ${result.fakeErrors}`);

    const wpm = detectWPM();
    if (wpm) {
      console.log(`📊 Auto-detected WPM: ${wpm}`);
    } else {
      console.log(`⚠️  Could not auto-detect WPM. Please check manually and fill in the template.`);
    }
    console.log(`\n📝 Record in TEST_RESULTS_TEMPLATE.md: delay=${delayMs}ms, WPM=${wpm || 'MANUAL_CHECK'}`);
  };

  // Test Type B: Fixed delay, with errors (using EXACT Perferences.js logic)
  window.runTestWithErrors = async (delayMs, realAccuracy, fakeAccuracy) => {
    /*
    realAccuracy = 100 means 0% real errors (never types wrong without correction)
    realAccuracy = 95 means 5% real errors (types wrong and skips correct char)
    fakeAccuracy = 100 means 0% fake errors (never makes self-corrected typos)
    fakeAccuracy = 95 means 5% fake errors (types wrong, backspaces, then correct)

    IMPORTANT: fakeAccuracy only matters if realAccuracy check passes first.
    So with realAccuracy=100, fakeAccuracy=95: 0% real errors, ~5% fake errors
    With realAccuracy=95, fakeAccuracy=90: ~5% real errors, ~4.75% fake errors (95% * 10%)
    */
    console.log(`\n🚀 Running FIXED delay test with ERRORS: ${delayMs}ms`);
    console.log(`   realAccuracy=${realAccuracy}%, fakeAccuracy=${fakeAccuracy}%`);
    console.log(`   Expected real error rate: ${(100 - realAccuracy).toFixed(0)}%`);
    console.log(`   Expected fake error rate: ~${((realAccuracy/100) * (100 - fakeAccuracy)).toFixed(1)}%`);

    const inputField = setupTyping();
    if (!inputField) return;

    const startTime = Date.now();
    const result = await typeWithAccuracy(inputField, lesson.characters, delayMs, realAccuracy, fakeAccuracy);
    const elapsed = Date.now() - startTime;

    console.log(`\n✅ Typing complete in ${(elapsed/1000).toFixed(2)}s`);
    console.log(`   Keystrokes: ${result.totalKeystrokes} (base: ${lesson.charCount})`);
    console.log(`   Real errors: ${result.realErrors} (${(result.realErrors/lesson.charCount*100).toFixed(1)}%)`);
    console.log(`   Fake errors: ${result.fakeErrors} (${(result.fakeErrors/lesson.charCount*100).toFixed(1)}%)`);

    const wpm = detectWPM();
    if (wpm) {
      console.log(`📊 Auto-detected WPM: ${wpm}`);
    } else {
      console.log(`⚠️  Could not auto-detect WPM. Please check manually.`);
    }
    console.log(`\n📝 Record in TEST_RESULTS_TEMPLATE.md`);
  };

  // Test Type C: Variable delay (ramp up/down)
  window.runTestVariableDelay = async (minDelay, maxDelay, pattern = 'random') => {
    /*
    pattern: 'random' = random between min/max
             'ramp' = start slow, get fast, end slow
             'wave' = alternate slow/fast every 5 chars
    */
    console.log(`\n🚀 Running VARIABLE delay test: ${minDelay}ms - ${maxDelay}ms, pattern: ${pattern}`);

    const inputField = setupTyping();
    if (!inputField) return;

    const startTime = Date.now();
    const characters = lesson.characters;
    const totalChars = characters.length;
    let totalDelayMs = 0;
    let delaysUsed = [];

    for (let i = 0; i < totalChars; i++) {
      let delay;
      if (pattern === 'random') {
        // Same random variation as Perferences.js: +/- 20ms around target
        const target = (minDelay + maxDelay) / 2;
        const variation = Math.random() * (maxDelay - minDelay) - (maxDelay - minDelay) / 2;
        delay = Math.max(minDelay, Math.min(target + variation, maxDelay));
      } else if (pattern === 'ramp') {
        const progress = i / totalChars;
        const rampFactor = Math.abs(2 * progress - 1);
        delay = minDelay + rampFactor * (maxDelay - minDelay);
      } else if (pattern === 'wave') {
        const block = Math.floor(i / 5) % 2;
        delay = block === 0 ? maxDelay : minDelay;
      }

      delaysUsed.push(delay);
      totalDelayMs += delay;
      await Type(inputField, characters[i]);
      await sleep(delay);
    }

    const elapsed = Date.now() - startTime;
    const avgDelay = delaysUsed.reduce((a, b) => a + b, 0) / delaysUsed.length;

    console.log(`\n✅ Typing complete in ${(elapsed/1000).toFixed(2)}s`);
    console.log(`   Average delay used: ${avgDelay.toFixed(1)}ms`);
    console.log(`   Delay range: ${minDelay}ms - ${maxDelay}ms`);
    console.log(`   Pattern: ${pattern}`);

    const wpm = detectWPM();
    if (wpm) {
      console.log(`📊 Auto-detected WPM: ${wpm}`);
    } else {
      console.log(`⚠️  Could not auto-detect WPM. Please check manually.`);
    }
    console.log(`\n📝 Record in TEST_RESULTS_TEMPLATE.md`);
  };

  // ==================== RUN INSTRUCTIONS ====================
  console.log("\n" + "=".repeat(80));
  console.log("📋 TEST PLAN - RUN THESE IN ORDER (reload page between each):");
  console.log("=".repeat(80));

  console.log(`\n--- PHASE 1: FIXED DELAY, 100% ACCURACY (Baseline) ---`);
  console.log("Reload the lesson page between each test.");
  console.log("");
  console.log("  await runTestFixed(50);   // Fast");
  console.log("  await runTestFixed(70);   // Medium-fast");
  console.log("  await runTestFixed(90);   // Medium");
  console.log("  await runTestFixed(110);  // Medium-slow");
  console.log("  await runTestFixed(130);  // Slow");
  console.log("  await runTestFixed(150);  // Very slow");
  console.log("  await runTestFixed(170);  // Extra slow");

  console.log(`\n--- PHASE 2: FIXED DELAY, WITH ERRORS ---`);
  console.log("These use the SAME logic as Perferences.js (real + fake accuracy).");
  console.log("realAccuracy=100, fakeAccuracy=99 means ~1% fake errors (self-correct).");
  console.log("");
  console.log("  await runTestWithErrors(70, 100, 97);   // ~3% fake errors");
  console.log("  await runTestWithErrors(70, 100, 95);   // ~5% fake errors");
  console.log("  await runTestWithErrors(70, 95, 90);    // ~5% real + ~4.75% fake");
  console.log("  await runTestWithErrors(110, 100, 95);  // Slower + ~5% fake");

  console.log(`\n--- PHASE 3: VARIABLE DELAY ---`);
  console.log("");
  console.log("  await runTestVariableDelay(40, 100, 'random');   // Random, avg ~70ms");
  console.log("  await runTestVariableDelay(60, 140, 'random');   // Random, avg ~100ms");
  console.log("  await runTestVariableDelay(40, 120, 'ramp');     // Slow→Fast→Slow");
  console.log("  await runTestVariableDelay(40, 120, 'wave');     // Alternating blocks");

  console.log(`\n--- QUICK START (run this first to verify) ---`);
  console.log("  await runTestFixed(90);");
  console.log("");
  console.log("After running, fill in the actual WPM values in TEST_RESULTS_TEMPLATE.md");

})();
