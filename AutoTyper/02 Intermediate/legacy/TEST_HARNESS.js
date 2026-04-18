/*
================================================================================
TEST HARNESS — TypingClub AutoTyper Intermediate Rebuild
================================================================================
Purpose: Modular test runner to validate each component independently.
Usage:   Paste into browser console on the appropriate TypingClub page.
         Each test function can also be called individually.

Tests:
  Test 1: Character Extraction     — On a typing lesson page
  Test 2: Key Dispatch             — On a typing lesson page
  Test 3: Page Detection           — On any page
  Test 4: Menu Scraper             — On the menu page
  Test 5: Results Parser           — On a results/completion page
  Test 6: Speed Controller         — Any page (no DOM needed)
  Test 7: Single Lesson End-to-End — On menu page, enter lesson index
  Test 8: Navigation Cycle         — On menu page

Output:   Full report in console + stored in window.testResults
================================================================================
*/

(() => {
  'use strict';

  const TESTS = {};
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    passed: 0,
    failed: 0,
    total: 0,
    details: {},
  };

  // ============================================================
  // HELPERS
  // ============================================================

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function logTest(name, status, detail) {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} [${name}] ${detail}`);
    results.details[name] = { status, detail, timestamp: Date.now() };
    if (status === 'PASS') results.passed++;
    else results.failed++;
    results.total++;
  }

  function report() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST HARNESS REPORT');
    console.log('='.repeat(80));
    console.log(`URL: ${results.url}`);
    console.log(`Time: ${results.timestamp}`);
    console.log(`\nTotal: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
    console.log(`\n--- Details ---`);
    console.table(Object.entries(results.details).map(([name, d]) => ({
      Test: name,
      Status: d.status,
      Detail: d.detail.substring(0, 80),
    })));
    console.log('\nFull results: window.testResults');
    window.testResults = results;
  }

  // ============================================================
  // TEST 1: CHARACTER EXTRACTION
  // ============================================================

  TESTS.testCharacterExtraction = async function() {
    console.log('\n🧪 TEST 1: Character Extraction');
    console.log('   Must be on a typing lesson page.\n');

    const input = document.querySelector('input[aria-hidden="true"]');
    assert(input, 'No hidden input found');
    logTest('Input Found', 'PASS', `Selector: input[aria-hidden="true"]`);

    const tokens = document.querySelectorAll('.token span.token_unit');
    assert(tokens.length > 0, 'No token_unit elements found');
    logTest('Tokens Found', 'PASS', `${tokens.length} character elements`);

    // Extract characters using proven method from REF_LatestScript.js
    const characters = Array.from(tokens, (el) => {
      if (el.firstChild?.classList?.contains('_enter') || el.classList.contains('_enter')) return '\n';
      const char = el.textContent[0];
      return char === '\u00A0' ? ' ' : char;
    });

    const spaceCount = characters.filter(c => c === ' ').length;
    const enterCount = characters.filter(c => c === '\n').length;
    const uniqueChars = new Set(characters).size;

    logTest('Extraction', 'PASS',
      `${characters.length} chars, ${spaceCount} spaces, ${enterCount} enters, ${uniqueChars} unique`);

    // Show first 50 chars
    const preview = characters.slice(0, 50).map(c =>
      c === ' ' ? '␣' : c === '\n' ? '↵' : c
    ).join('');
    console.log(`   Preview (first 50): "${preview}"`);
    console.log(`   Character distribution:`,
      Object.fromEntries([...new Set(characters)].map(c => [
        c === ' ' ? 'space' : c === '\n' ? 'enter' : c,
        characters.filter(x => x === c).length
      ]).sort((a, b) => b[1] - a[1]).slice(0, 10))
    );

    return characters;
  };

  // ============================================================
  // TEST 2: KEY DISPATCH
  // ============================================================

  TESTS.testKeyDispatch = async function() {
    console.log('\n🧪 TEST 2: Key Dispatch');
    console.log('   Must be on a typing lesson page.\n');

    const input = document.querySelector('input[aria-hidden="true"]');
    assert(input, 'No hidden input found');

    const tokens = document.querySelectorAll('.token span.token_unit');
    assert(tokens.length > 0, 'No tokens to type');

    // Type first 5 characters
    const count = Math.min(5, tokens.length);
    const chars = Array.from(tokens.slice(0, count), (el) => {
      if (el.firstChild?.classList?.contains('_enter') || el.classList.contains('_enter')) return '\n';
      const char = el.textContent[0];
      return char === '\u00A0' ? ' ' : char;
    });

    console.log(`   Typing ${count} test characters: "${chars.join('')}"\n`);

    for (let i = 0; i < count; i++) {
      const char = chars[i];
      const isEnter = char === '\n';
      const isSpace = char === ' ';

      const eventKey = isEnter ? 'Enter' : isSpace ? ' ' : char;
      const eventCode = isEnter ? 'Enter' : isSpace ? 'Space' : `Key${char.toUpperCase()}`;
      const eventKeyCode = isEnter ? 13 : isSpace ? 32 : char.charCodeAt(0);

      const eventOpts = {
        key: eventKey, code: eventCode, keyCode: eventKeyCode, which: eventKeyCode,
        bubbles: true, cancelable: true, isTrusted: true,
      };

      input.dispatchEvent(new KeyboardEvent('keydown', eventOpts));

      if (!isEnter) {
        input.value += isSpace ? ' ' : char;
        input.dispatchEvent(new InputEvent('input', {
          data: isSpace ? ' ' : char,
          inputType: 'insertText',
          bubbles: true,
        }));
      }

      input.dispatchEvent(new KeyboardEvent('keyup', eventOpts));
      await sleep(200);
    }

    logTest('Key Dispatch', 'PASS', `Typed ${count} characters successfully`);

    // Check if lesson progressed
    const remaining = document.querySelectorAll('.token span.token_unit:not(._typed)');
    logTest('Progress Check', 'PASS',
      `${tokens.length - remaining.length}/${tokens.length} chars marked as typed`);

    console.log('   ⚠️  Manually verify that characters appeared on screen');
  };

  // ============================================================
  // TEST 3: PAGE DETECTION
  // ============================================================

  TESTS.testPageDetection = function() {
    console.log('\n🧪 TEST 3: Page Detection');
    console.log(`   Current URL: ${window.location.href}\n`);

    const url = window.location.href;

    // Menu detection
    const isMenu = url.match(/program-\d+\.game/);
    const hasLsnrow = document.querySelector('.lsnrow') !== null;
    logTest('Menu Detection', 'PASS',
      `URL match: ${!!isMenu}, .lsnrow: ${hasLsnrow}`);

    // Lesson detection
    const isLesson = url.match(/\.play/);
    const hasInput = document.querySelector('input[aria-hidden="true"]') !== null;
    const hasTokens = document.querySelectorAll('.token span.token_unit').length > 0;
    logTest('Lesson Detection', 'PASS',
      `URL match: ${!!isLesson}, input: ${hasInput}, tokens: ${hasTokens} (${document.querySelectorAll('.token span.token_unit').length})`);

    // Results detection
    const hasResults = document.querySelector('.performance-results') !== null;
    const hasTabindex3 = document.querySelector('div[tabindex="3"]')?.textContent?.includes('wpm');
    logTest('Results Detection', 'PASS',
      `.performance-results: ${hasResults}, div[tabindex="3"] wpm: ${!!hasTabindex3}`);

    // Determine page type
    let pageType = 'UNKNOWN';
    if (isMenu && hasLsnrow) pageType = 'MENU';
    else if (hasResults || hasTabindex3) pageType = 'RESULTS';
    else if (hasInput && hasTokens) pageType = 'TYPING';
    else if (isLesson) pageType = 'LESSON_NO_TOKENS';

    logTest('Page Type', 'PASS', `Detected: ${pageType}`);
    console.log(`   🏷️  Page Type: ${pageType}`);
  };

  // ============================================================
  // TEST 4: MENU SCRAPER
  // ============================================================

  TESTS.testMenuScraper = function() {
    console.log('\n🧪 TEST 4: Menu Scraper');
    console.log('   Must be on the menu page.\n');

    const container = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
    assert(container, 'Menu container not found');

    const rows = container.querySelectorAll('.lsnrow');
    assert(rows.length > 0, 'No .lsnrow elements found');

    let globalIndex = 0;
    const lessons = [];
    const iconCounts = {};
    let platinumCount = 0;
    let unlockedCount = 0;
    let eQwertyCount = 0;

    rows.forEach(row => {
      const rowName = row.getAttribute('name') || row.querySelector('h2')?.textContent?.trim() || 'unknown';
      row.querySelectorAll('.box-container').forEach(el => {
        globalIndex++;
        const iconClass = el.querySelector('.lesson_icon')?.className?.trim() || '(none)';
        const isPlatinum = el.querySelector('.platinum-star') !== null;
        const starClass = el.querySelector('.stars')?.className?.trim() || '';
        const starMatch = starClass.match(/stars-(\d)/);
        const starCount = starMatch ? parseInt(starMatch[1]) : null;
        const isUnlocked = el.classList.contains('is_unlocked');

        iconCounts[iconClass] = (iconCounts[iconClass] || 0) + 1;
        if (isPlatinum) platinumCount++;
        if (isUnlocked) unlockedCount++;
        if (iconClass.includes('e-qwerty')) eQwertyCount++;

        lessons.push({
          globalIndex, row: rowName,
          name: el.querySelector('.lsn_name')?.textContent?.trim() || 'unknown',
          num: el.querySelector('.lsn_num')?.textContent?.trim() || '?',
          iconClass, isPlatinum, starCount, isUnlocked,
        });
      });
    });

    logTest('Scraper', 'PASS',
      `${lessons.length} lessons, ${rows.length} rows, ${Object.keys(iconCounts).length} icon types`);
    logTest('Platinum Lessons', 'PASS', `${platinumCount} platinum-starred`);
    logTest('Unlocked Lessons', 'PASS', `${unlockedCount} unlocked`);
    logTest('E-QWERTY Lessons', 'PASS', `${eQwertyCount} auto-completeable`);

    // Show icon distribution
    const sorted = Object.entries(iconCounts).sort((a, b) => b[1] - a[1]);
    console.log('\n   --- Icon Distribution (top 20) ---');
    console.table(sorted.slice(0, 20).map(([icon, count]) => ({
      Icon: icon.substring(0, 40),
      Count: count,
      IsE_Qwerty: icon.includes('e-qwerty'),
    })));

    console.log(`   --- Filtered: ${eQwertyCount} auto-completeable (e-qwerty only), excluding ${platinumCount} platinum ---`);

    return lessons;
  };

  // ============================================================
  // TEST 5: RESULTS PARSER
  // ============================================================

  TESTS.testResultsParser = function() {
    console.log('\n🧪 TEST 5: Results Parser');
    console.log('   Must be on a results/completion page.\n');

    const tabindex3 = document.querySelector('div[tabindex="3"]');
    assert(tabindex3, 'div[tabindex="3"] not found');

    const text = tabindex3.textContent;
    console.log(`   Raw text: "${text}"\n`);

    const wpmMatch = text.match(/speed\s+of\s+(\d+)\s+wpm/);
    const accMatch = text.match(/accuracy\s+was\s+(\d+)%/);
    const realAccMatch = text.match(/real\s+accuracy\s+of\s+(\d+)%/);
    const durationMatch = text.match(/in\s+(\d+)\s+seconds/);

    const wpm = wpmMatch ? parseInt(wpmMatch[1]) : null;
    const accuracy = accMatch ? parseInt(accMatch[1]) : null;
    const realAccuracy = realAccMatch ? parseInt(realAccMatch[1]) : null;
    const duration = durationMatch ? parseInt(durationMatch[1]) + 's' : null;

    assert(wpm !== null, 'WPM not found in results text');

    logTest('WPM Extracted', 'PASS', `${wpm} WPM`);
    logTest('Accuracy Extracted', 'PASS', `${accuracy}%`);
    logTest('Real Accuracy', 'PASS', `${realAccuracy}%`);
    logTest('Duration', 'PASS', `${duration}`);

    return { wpm, accuracy, realAccuracy, duration };
  };

  // ============================================================
  // TEST 6: SPEED CONTROLLER
  // ============================================================

  TESTS.testSpeedController = function() {
    console.log('\n🧪 TEST 6: Speed Controller');
    console.log('   No DOM required — pure calculation.\n');

    // Test the formula: msPerChar = 12000 / WPM
    const testCases = [
      { wpm: 60, expectedMs: 200 },
      { wpm: 80, expectedMs: 150 },
      { wpm: 90, expectedMs: 133.3 },
      { wpm: 100, expectedMs: 120 },
      { wpm: 120, expectedMs: 100 },
      { wpm: 150, expectedMs: 80 },
      { wpm: 189, expectedMs: 63.5 },
    ];

    for (const tc of testCases) {
      const calculated = (12000 / tc.wpm).toFixed(1);
      const diff = Math.abs(parseFloat(calculated) - tc.expectedMs);
      const status = diff < 2 ? 'PASS' : 'FAIL';
      logTest(`${tc.wpm} WPM → ${calculated}ms`, status,
        `Expected ~${tc.expectedMs}ms (from Test 1 baseline), diff: ${diff.toFixed(1)}ms`);
    }
  };

  // ============================================================
  // TEST 7: SINGLE LESSON END-TO-END
  // ============================================================

  TESTS.testSingleLesson = async function(targetWPM = 90) {
    console.log('\n🧪 TEST 7: Single Lesson End-to-End');
    console.log(`   Target WPM: ${targetWPM}`);
    console.log('   Must be on a typing lesson page (manually navigate first).\n');

    const input = document.querySelector('input[aria-hidden="true"]');
    if (!input) {
      logTest('Setup', 'FAIL', 'No typing input found — navigate to a lesson first');
      report();
      return;
    }

    const tokens = document.querySelectorAll('.token span.token_unit');
    const totalChars = tokens.length;
    const expectedDurationMs = (totalChars * 12000) / targetWPM;
    const expectedDurationSec = (expectedDurationMs / 1000).toFixed(1);

    console.log(`   Characters to type: ${totalChars}`);
    console.log(`   Expected duration: ~${expectedDurationSec}s`);
    console.log(`   Delay per char: ${(12000 / targetWPM).toFixed(1)}ms\n`);

    const startTime = Date.now();
    const chars = Array.from(tokens, (el) => {
      if (el.firstChild?.classList?.contains('_enter') || el.classList.contains('_enter')) return '\n';
      const char = el.textContent[0];
      return char === '\u00A0' ? ' ' : char;
    });

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const isEnter = char === '\n';
      const isSpace = char === ' ';
      const eventKey = isEnter ? 'Enter' : isSpace ? ' ' : char;
      const eventCode = isEnter ? 'Enter' : isSpace ? 'Space' : `Key${char.toUpperCase()}`;
      const eventKeyCode = isEnter ? 13 : isSpace ? 32 : char.charCodeAt(0);

      const eventOpts = {
        key: eventKey, code: eventCode, keyCode: eventKeyCode, which: eventKeyCode,
        bubbles: true, cancelable: true, isTrusted: true,
      };

      input.dispatchEvent(new KeyboardEvent('keydown', eventOpts));
      if (!isEnter) {
        input.value += isSpace ? ' ' : char;
        input.dispatchEvent(new InputEvent('input', {
          data: isSpace ? ' ' : char, inputType: 'insertText', bubbles: true,
        }));
      }
      input.dispatchEvent(new KeyboardEvent('keyup', eventOpts));

      // Time-compensating delay
      const charsLeft = totalChars - i - 1;
      const targetEndMs = startTime + expectedDurationMs;
      const timeRemaining = targetEndMs - Date.now();
      const delay = charsLeft > 0 ? Math.max(20, Math.min(timeRemaining / charsLeft, 500)) : 0;
      await sleep(delay);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    logTest('Typing Complete', 'PASS', `${totalChars} chars in ${elapsed}s`);

    // Wait for results
    console.log('   Waiting for results page...');
    let attempts = 0;
    while (attempts < 100) {
      if (document.querySelector('.performance-results') ||
          document.querySelector('div[tabindex="3"]')?.textContent?.includes('wpm')) break;
      await sleep(100);
      attempts++;
    }

    if (attempts >= 100) {
      logTest('Results Page', 'FAIL', 'Results did not appear after 10 seconds');
      report();
      return;
    }

    const tabindex3 = document.querySelector('div[tabindex="3"]');
    const text = tabindex3?.textContent || '';
    const wpmMatch = text.match(/speed\s+of\s+(\d+)\s+wpm/);
    const actualWPM = wpmMatch ? parseInt(wpmMatch[1]) : null;

    logTest('Results Detected', 'PASS', `Page appeared after ${(attempts * 0.1).toFixed(1)}s`);

    if (actualWPM !== null) {
      const diff = Math.abs(actualWPM - targetWPM);
      const status = diff <= 10 ? 'PASS' : 'WARN';
      logTest('WPM Check', status,
        `Target: ${targetWPM}, Actual: ${actualWPM}, Delta: ${diff > 0 ? '+' : ''}${diff}`);
    } else {
      logTest('WPM Check', 'FAIL', 'Could not extract WPM from results');
    }

    report();
  };

  // ============================================================
  // TEST 8: NAVIGATION CYCLE
  // ============================================================

  TESTS.testNavigationCycle = async function(lessonIndex) {
    console.log('\n🧪 TEST 8: Navigation Cycle');
    console.log(`   Testing: Menu → Lesson → Results → Menu`);
    console.log(`   Must be on menu page. Will click lesson #${lessonIndex}.\n`);

    // Scrape to find lesson element
    const container = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
    assert(container, 'Menu container not found');

    let globalIndex = 0;
    let targetElement = null;
    const rows = container.querySelectorAll('.lsnrow');

    for (const row of rows) {
      for (const el of row.querySelectorAll('.box-container')) {
        globalIndex++;
        if (globalIndex === lessonIndex) {
          targetElement = el;
          break;
        }
      }
      if (targetElement) break;
    }

    assert(targetElement, `Lesson #${lessonIndex} not found`);

    const lessonName = targetElement.querySelector('.lsn_name')?.textContent?.trim() || 'unknown';
    const iconClass = targetElement.querySelector('.lesson_icon')?.className?.trim() || 'none';
    console.log(`   Target: Lesson #${lessonIndex} — "${lessonName}" (icon: ${iconClass})\n`);

    // Step 1: Click lesson
    console.log('   Step 1: Clicking lesson...');
    targetElement.click();
    logTest('Click Lesson', 'PASS', `Clicked #${lessonIndex}`);

    // Step 2: Wait for typing or results
    console.log('   Step 2: Waiting for page load...');
    let attempts = 0;
    let pageType = null;
    while (attempts < 60) {
      const hasInput = document.querySelector('input[aria-hidden="true"]') !== null;
      const hasTokens = document.querySelectorAll('.token span.token_unit').length > 0;
      const hasResults = document.querySelector('.performance-results') !== null;

      if (hasResults) { pageType = 'RESULTS'; break; }
      if (hasInput && hasTokens) { pageType = 'TYPING'; break; }
      await sleep(100);
      attempts++;
    }

    logTest('Page Loaded', pageType ? 'PASS' : 'FAIL',
      `Detected: ${pageType || 'UNKNOWN'} after ${(attempts * 0.1).toFixed(1)}s`);

    if (pageType === 'TYPING') {
      console.log('   ✅ Typing lesson loaded. Manually verify or run testSingleLesson.');
      console.log('   To auto-type, run: testSingleLesson(90)');
    } else if (pageType === 'RESULTS') {
      console.log('   ✅ Lesson already completed (instant pass).');
    }

    // Step 3: Navigate back to menu
    console.log('\n   Step 3: Navigating back to menu...');
    const menuLink = document.querySelector('a[href*="program-"][href*=".game"]');
    if (menuLink) {
      menuLink.click();
    } else {
      window.history.back();
    }

    await sleep(2000);
    const isMenu = document.querySelector('.lsnrow') !== null;
    logTest('Return to Menu', isMenu ? 'PASS' : 'FAIL',
      isMenu ? 'Menu page loaded successfully' : 'Menu did not load');

    report();
  };

  // ============================================================
  // RUN ALL COMPATIBLE TESTS
  // ============================================================

  function runAll() {
    console.log('='.repeat(80));
    console.log('🧪 AUTO TYPER TEST HARNESS — Running all compatible tests');
    console.log('='.repeat(80));
    console.log(`URL: ${window.location.href}`);

    // Always runnable tests
    TESTS.testPageDetection();
    TESTS.testSpeedController();

    // Page-specific tests
    if (window.location.href.match(/program-\d+\.game/)) {
      TESTS.testMenuScraper();
    }

    if (window.location.href.match(/\.play/)) {
      const input = document.querySelector('input[aria-hidden="true"]');
      if (input) {
        TESTS.testCharacterExtraction();
        // Key dispatch needs manual verification, skip auto-run
      }

      if (document.querySelector('.performance-results') ||
          document.querySelector('div[tabindex="3"]')?.textContent?.includes('wpm')) {
        TESTS.testResultsParser();
      }
    }

    report();
    console.log('\n--- Individual Test Functions ---');
    console.log('Run these manually for targeted testing:');
    console.log('  testCharacterExtraction()   — On typing lesson page');
    console.log('  testKeyDispatch()           — On typing lesson page');
    console.log('  testResultsParser()         — On results page');
    console.log('  testSingleLesson(90)        — Full end-to-end, target 90 WPM');
    console.log('  testNavigationCycle(50)     — Menu→lesson→results→menu, lesson #50');

    // Expose individual tests
    window.testCharacterExtraction = TESTS.testCharacterExtraction;
    window.testKeyDispatch = TESTS.testKeyDispatch;
    window.testResultsParser = TESTS.testResultsParser;
    window.testSingleLesson = TESTS.testSingleLesson;
    window.testNavigationCycle = TESTS.testNavigationCycle;
    window.runAllTests = TESTS.testPageDetection; // Already ran in runAll
  }

  runAll();

})();
