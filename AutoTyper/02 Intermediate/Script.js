// ==UserScript==
// @name         TypingClub AutoTyper
// @namespace    https://typingclub.com/
// @version      1.0.2
// @author       B****
// @match        *://*.typingclub.com/*
// @match        *://*.edclub.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // SECTION 1: CONSTANTS & STATE
  // ============================================================

  const EXECUTABLE_SELECTORS = new Set([
    'cmn-code', 'cmn-definition', 'cmn-drum', 'cmn-guide2',
    'cmn-practice', 'cmn-tip', 'cmn-travel1',
    'qwerty-caps', 'qwerty-symbols2', 'qwerty-symbols3', 'qwerty-z'
  ]);

  const COMMON_WORDS = new Set([
    'a','an','the','is','it','in','on','at','to','do','go','be','he','she',
    'we','or','if','of','as','up','no','so','my','by','me','hi','ok','yes','no'
  ]);

  const state = {
    running: false,
    stopping: false,
    queue: [],        // array of lesson numbers
    scrapeData: {},   // lessonNum -> { name, star, completed }
    currentLessonIdx: 0,
    abortController: null,
    uiVisible: true,
    panelX: null,
    panelY: null,
    scriptNavigating: false, // true while the script itself is clicking .menu-btn or navigating
    liveConfig: null,        // updated live when user changes WPM/accuracy inputs
    completedLessons: new Set(), // lessons finished this session — auto-removed from queue textarea
  };

  // ============================================================
  // SECTION 2: LOGGING
  // ============================================================

  const LOG_LEVELS = { ERROR: '🔴 ERROR', WARNING: '🟡 WARNING', SUCCESS: '🟢 SUCCESS', INFO: '🔵 INFO', SKIP: '⚪ SKIP', PROGRESS: '🔄 PROGRESS' };
  const logBuffer = [];

  function log(level, message) {
    const now = new Date();
    const ts = now.toLocaleString('en-US', { hour12: false });
    const entry = `[${ts}] ${LOG_LEVELS[level] || level}: ${message}`;
    logBuffer.push(entry);
    console.log(`[AutoTyper] ${entry}`);
    appendLogToUI(entry, level);
  }

  // ============================================================
  // SECTION 3: PAGE DETECTION
  // ============================================================

  function detectPage() {
    if (document.querySelector('.lparena')) return 'MENU';
    if (document.querySelector('.LPVIDEO')) return 'VIDEO';
    if (document.getElementById('instruction')) return 'UNEXECUTABLE_1';
    if (document.querySelector('.TPGAME')) return 'GAME';
    if (document.querySelector('.TP_APP1.TPCMN') || document.body.classList.contains('theme-codder')) {
      if (document.querySelector('.classic-typing-container')) return 'EXECUTABLE';
      return 'UNEXECUTABLE_2';
    }
    if (document.querySelector('.stars-box')) return 'RESULTS';
    return 'UNKNOWN';
  }

  function isMenuPage() { return detectPage() === 'MENU'; }
  function isExecutablePage() { return detectPage() === 'EXECUTABLE'; }
  function isResultsPage() { return detectPage() === 'RESULTS' || !!document.querySelector('.stars-box'); }

  // ============================================================
  // SECTION 4: LESSON ICON EXECUTABILITY CHECK
  // ============================================================

  function getLessonExecutability(boxEl) {
    const icon = boxEl.querySelector('.lesson_icon');
    if (!icon) return false;
    const classes = Array.from(icon.classList);
    const eClass = classes.find(c => c.startsWith('e-'));
    if (!eClass) return false;
    const base = eClass.split('-')[1]; // 'cmn' or 'qwerty'
    const specificClass = classes.find(c => c.startsWith(`${base}-`) && c !== eClass);
    if (!specificClass) return false;
    const key = specificClass.replace(`${base}-`, '');
    const fullKey = `${base}-${key}`;
    // Check against executable set
    for (const exec of EXECUTABLE_SELECTORS) {
      if (fullKey === exec || specificClass.includes(exec.split('-').slice(1).join('-'))) return true;
    }
    return false;
  }

  // ============================================================
  // SECTION 5: SCRAPING
  // ============================================================

  function scrapeLessons(minLesson, maxLesson, redoThreshold) {
    const boxes = document.querySelectorAll('.box');
    const results = {};

    Array.from(boxes).forEach((box, index) => {
      const numEl = box.querySelector('.lsn_num');
      const num = numEl ? parseInt(numEl.textContent.trim()) : index + 1;
      if (isNaN(num) || num < minLesson || num > maxLesson) return;

      const name = box.querySelector('.lsn_name')?.textContent.trim() || 'Unknown';
      const starsEl = box.querySelector('.stars');
      const hasSilver = !!box.querySelector('.platinum-star');
      const isCompletedCheck = !!box.querySelector('.completion-check');
      const hasProgress = box.parentElement?.classList.contains('has_progress');

      let starRating = null;
      let completed = false;

      if (hasSilver) {
        starRating = 6; completed = true;
      } else if (starsEl) {
        const match = starsEl.className.match(/stars-(\d)/);
        if (match) {
          const val = parseInt(match[1]);
          if (val > 0) { starRating = val; completed = true; }
          else if (isCompletedCheck || hasProgress) { starRating = 0; completed = true; }
        }
      } else if (isCompletedCheck || hasProgress) {
        starRating = 0; completed = true;
      }

      // Executability check
      const executable = getLessonExecutability(box);

      results[num] = { name, star: starRating, completed, executable };
    });

    // Filter based on redo threshold
    // redoThreshold: 0 = only uncompleted, 1-5 = redo if star <= threshold, 6 = redo all
    const queue = [];
    Object.entries(results).forEach(([numStr, data]) => {
      const num = parseInt(numStr);
      if (!data.executable) return; // skip unexecutable in queue
      if (!data.completed) { queue.push(num); return; }
      if (redoThreshold === 6) { queue.push(num); return; }
      if (redoThreshold === 0) return; // only incomplete
      // star is 0-6, redo if star < redoThreshold (e.g. threshold=5 means redo if < 5)
      if (data.star !== null && data.star < redoThreshold) { queue.push(num); return; }
    });

    queue.sort((a, b) => a - b);
    state.scrapeData = results;
    return queue;
  }

  // ============================================================
  // SECTION 6: NAVIGATION
  // ============================================================

  function goToMenu() {
    // If already on menu page, do nothing
    if (isMenuPage()) return true;
    state.scriptNavigating = true;
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
      menuBtn.click();
      setTimeout(() => { state.scriptNavigating = false; }, 500);
      return true;
    }
    // fallback: navigate to program menu by URL pattern
    const match = location.href.match(/^(https?:\/\/[^/]+\/sportal\/program-\d+)/);
    if (match) { location.href = match[1] + '.game'; return true; }
    state.scriptNavigating = false;
    return false;
  }

  function clickLesson(num) {
    const arena = document.querySelector('.lparena');
    if (!arena) { log('ERROR', 'Could not find lesson area (.lparena)'); return false; }
    const numElements = Array.from(arena.querySelectorAll('.lsn_num'));
    const target = numElements.find(el => el.innerText.trim() === String(num));
    if (!target) { log('WARNING', `Lesson ${num} not found on menu page`); return false; }
    const box = target.closest('.box-container') || target.closest('.box');
    if (!box) { log('WARNING', `Could not find box container for lesson ${num}`); return false; }
    const name = box.querySelector('.lsn_name')?.innerText || '';
    log('INFO', `Navigating to Lesson ${num}: ${name}`);
    box.click();
    return true;
  }

  // ============================================================
  // SECTION 7: WPM ↔ DELAY FORMULA
  // Fitted from test data: delay ≈ 10800 / wpm (approx inverse linear)
  // Additional calibration: accuracy affects effective speed
  // ============================================================

  function wpmToDelay(wpm) {
    // From test data fit: ~10800 / wpm gives average ms delay
    return Math.round(10800 / Math.max(wpm, 10));
  }

  function getWordComplexity(word) {
    // Simple heuristic: common short words = 0.8x delay, long/uncommon = 1.2x
    if (!word || word.length === 0) return 1.0;
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    if (COMMON_WORDS.has(lower)) return 0.8;
    if (lower.length <= 3) return 0.85;
    if (lower.length >= 8) return 1.15;
    // Check for double letters or complex combos
    if (/(.)\1/.test(lower)) return 1.1;
    return 1.0;
  }

  // ============================================================
  // SECTION 8: TYPING ENGINE
  // ============================================================

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getRandomWrongChar(correctChar) {
    const possible = 'abcdefghijklmnopqrstuvwxyz';
    let c = possible.charAt(Math.floor(Math.random() * possible.length));
    return c === correctChar ? (c === 'a' ? 'b' : 'a') : c;
  }

  async function typeChar(inputField, char) {
    inputField.focus();
    const isEnter = char === '\n';
    const isSpace = char === ' ';
    const isBackspace = char === 'Backspace';

    let eventKey = char, eventCode = `Key${char.toUpperCase()}`, eventKeyCode = char.charCodeAt(0);
    if (isEnter)     { eventKey = 'Enter';     eventCode = 'Enter';     eventKeyCode = 13; }
    if (isSpace)     { eventKey = ' ';         eventCode = 'Space';     eventKeyCode = 32; }
    if (isBackspace) { eventKey = 'Backspace';  eventCode = 'Backspace'; eventKeyCode = 8; }

    const opts = { key: eventKey, code: eventCode, keyCode: eventKeyCode, which: eventKeyCode, bubbles: true, cancelable: true, isTrusted: true };
    inputField.dispatchEvent(new KeyboardEvent('keydown', opts));
    if (!isEnter) {
      if (isBackspace) { inputField.value = inputField.value.slice(0, -1); }
      else { inputField.value += char; }
      inputField.dispatchEvent(new InputEvent('input', {
        data: isBackspace ? null : char,
        inputType: isBackspace ? 'deleteContentBackward' : 'insertText',
        bubbles: true,
      }));
    }
    inputField.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function getChars() {
    return Array.from(document.querySelectorAll('.token span.token_unit'), el => {
      if (el.firstChild?.classList?.contains('_enter') || el.classList.contains('_enter')) return '\n';
      const char = el.textContent[0];
      return char === '\u00A0' ? ' ' : char;
    });
  }

  async function runTypingSession(cfg, abortSignal) {
    // cfg: { wpm, variation, realAccuracy, fakeAccuracy }
    const inputField = document.querySelector('input[aria-hidden="true"]') || document.activeElement;
    if (!inputField) { log('ERROR', 'Could not find input field'); return false; }

    const characters = getChars();
    if (characters.length === 0) { log('ERROR', 'No characters found to type'); return false; }

    const baseDelay = wpmToDelay(cfg.wpm);
    const variationMs = wpmToDelay(Math.max(cfg.wpm - cfg.variation, 10)) - baseDelay; // how many ms variation adds

    // Build word boundaries for complexity multiplier
    const text = characters.join('');
    const words = text.split(' ');

    // Map character index -> complexity multiplier
    const complexityMap = [];
    let ci = 0;
    for (const word of words) {
      const mult = getWordComplexity(word);
      for (let j = 0; j < word.length; j++) { complexityMap[ci++] = mult; }
      if (ci < characters.length) complexityMap[ci++] = 0.7; // spaces are fast
    }

    log('PROGRESS', `Starting lesson — ${characters.length} chars, target ${cfg.wpm} WPM, base delay ${baseDelay}ms`);

    const startTime = Date.now();
    let charsTyped = 0;

    for (let i = 0; i < characters.length; i++) {
      if (abortSignal?.aborted) { log('WARNING', 'Typing aborted by stop signal'); return false; }

      const char = characters[i];
      const mult = complexityMap[i] ?? 1.0;

      // Re-read config live so user changes apply immediately
      const liveCfg = getConfig();
      const liveBase = wpmToDelay(liveCfg.wpm);
      const liveVariationMs = wpmToDelay(Math.max(liveCfg.wpm - liveCfg.variation, 10)) - liveBase;

      // Ramp: start slower, end at target speed
      const progress = i / characters.length;
      const ramp = progress < 0.1 ? 0.7 + progress * 3 : progress > 0.9 ? 0.9 + (progress - 0.9) * 1.5 : 1.0;

      // Variation: random wave around base
      const wave = (Math.random() - 0.5) * 2 * Math.abs(liveVariationMs);
      const delay = Math.max(30, Math.round(liveBase * mult * ramp + wave));

      // Real accuracy: type wrong char and DON'T fix it
      if (Math.random() * 100 > liveCfg.realAccuracy) {
        await typeChar(inputField, getRandomWrongChar(char));
        await sleep(delay);
        charsTyped++;
        continue;
      }

      // Fake accuracy: type wrong char then backspace
      if (Math.random() * 100 > liveCfg.fakeAccuracy) {
        await typeChar(inputField, getRandomWrongChar(char));
        await sleep(delay);
        await typeChar(inputField, 'Backspace');
        await sleep(delay + 50);
      }

      await typeChar(inputField, char);
      await sleep(delay);
      charsTyped++;
    }

    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const estimatedWPM = Math.round((charsTyped / 5) / elapsed);
    log('SUCCESS', `Typing session complete — Estimated WPM: ${estimatedWPM}, Chars: ${charsTyped}`);
    return true;
  }

  // ============================================================
  // SECTION 9: RESULTS SCRAPING
  // ============================================================

  function scrapeResults() {
    const text = document.querySelector('.TP_APP1.TPCMN')?.innerText || '';
    if (!text) return null;
    const getMatch = (regex, idx = 1) => (text.match(regex) || [])[idx] || 'N/A';
    return {
      lesson: document.querySelector('.lesson-title')?.innerText.trim() || 'Unknown',
      score: document.querySelector('.stars-box')?.innerText.replace(/YOUR SCORE/gi, '').trim().split('\n')[0] || 'N/A',
      stars: getMatch(/earned (\d+) stars/i),
      accuracy: getMatch(/accuracy was ([\d%]+)/i),
      realAccuracy: getMatch(/real accuracy of ([\d%]+)/i),
      wpm: getMatch(/speed of (\d+) wpm/i),
      duration: getMatch(/in (\d+ seconds|[\d:]+)/i),
    };
  }

  // ============================================================
  // SECTION 10: WAIT HELPERS
  // ============================================================

  function waitForElement(selector, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeoutMs);
    });
  }

  function waitForPage(pageType, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      if (detectPage() === pageType) return resolve();
      const obs = new MutationObserver(() => {
        if (detectPage() === pageType) { obs.disconnect(); resolve(); }
      });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for page: ${pageType}`)); }, timeoutMs);
    });
  }

  function waitForResults(timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      if (isResultsPage()) return resolve();
      const obs = new MutationObserver(() => {
        if (isResultsPage()) { obs.disconnect(); resolve(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error('Timeout waiting for results page')); }, timeoutMs);
    });
  }

  // ============================================================
  // SECTION 11: MAIN AUTOMATION LOOP
  // ============================================================

  async function runAutomation() {
    const cfg = getConfig();
    state.abortController = new AbortController();
    const sig = state.abortController.signal;

    log('INFO', `Automation started — Queue: [${state.queue.join(', ')}]`);
    log('INFO', `Config: WPM=${cfg.wpm}, Variation=${cfg.variation}, RealAcc=${cfg.realAccuracy}%, FakeAcc=${cfg.fakeAccuracy}%`);

    for (let i = state.currentLessonIdx; i < state.queue.length; i++) {
      if (sig.aborted || !state.running) break;
      state.currentLessonIdx = i;

      const lessonNum = state.queue[i];
      updateQueueHighlight(i);

      // --- Ensure we are on menu page (skip if already on lesson via Enter navigation) ---
      const currentPage = detectPage();
      let pageType;
      if (currentPage === 'EXECUTABLE') {
        // We arrived here via Enter key from previous lesson — skip menu navigation
        log('INFO', `Lesson ${lessonNum}: already on executable page (via Enter), typing now`);
        pageType = 'EXECUTABLE';
      } else {
        if (!isMenuPage()) {
          log('INFO', `Not on menu page. Navigating back to menu...`);
          goToMenu();
          try { await waitForPage('MENU', 15000); }
          catch { log('ERROR', `Failed to reach menu page. Stopping.`); break; }
          await sleep(800);
        }

        // --- Click the lesson ---
        const clicked = clickLesson(lessonNum);
        if (!clicked) { log('SKIP', `Lesson ${lessonNum}: could not click, skipping`); continue; }

        // --- Wait for lesson page to load ---
        await sleep(2000);
        await new Promise(r => setTimeout(r, 1000));
        pageType = detectPage();
      }

      log('INFO', `Lesson ${lessonNum}: page detected as "${pageType}"`);

      if (pageType !== 'EXECUTABLE') {
        log('SKIP', `Lesson ${lessonNum}: not executable (${pageType}), skipping`);
        removeFromQueueTextarea(lessonNum);
        continue;
      }

      // --- Run typing ---
      const success = await runTypingSession(cfg, sig);
      if (!success) { if (!state.running) break; continue; }

      // --- Wait for results ---
      log('PROGRESS', `Lesson ${lessonNum}: waiting for results screen...`);
      try {
        await waitForResults(90000);
      } catch {
        log('WARNING', `Lesson ${lessonNum}: results page didn't appear, moving on`);
        continue;
      }

      await sleep(1500); // let results render
      const results = scrapeResults();
      if (results) {
        log('SUCCESS', `Lesson ${lessonNum} complete — WPM: ${results.wpm}, Accuracy: ${results.accuracy} (Real: ${results.realAccuracy}), Stars: ${results.stars}, Duration: ${results.duration}`);
      }

      // Mark lesson as completed and remove from queue textarea
      state.completedLessons.add(lessonNum);
      removeFromQueueTextarea(lessonNum);

      // --- Press Enter to continue if next lesson is sequential ---
      const nextLesson = state.queue[i + 1];
      if (nextLesson && nextLesson === lessonNum + 1) {
        log('INFO', `Next lesson (${nextLesson}) is sequential — pressing Enter to continue`);
        await sleep(600);
        // Dispatch Enter on the document (results screen listens for this)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keyup',  { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        // Wait up to 8s for the page to transition away from results into the next lesson
        const transitioned = await new Promise(resolve => {
          const start = Date.now();
          const check = setInterval(() => {
            const pg = detectPage();
            if (pg === 'EXECUTABLE' || pg === 'MENU' || pg === 'VIDEO' || pg === 'GAME' || pg === 'UNEXECUTABLE_1' || pg === 'UNEXECUTABLE_2') {
              clearInterval(check);
              resolve(pg);
            }
            if (Date.now() - start > 8000) { clearInterval(check); resolve(null); }
          }, 200);
        });
        if (!transitioned) {
          log('WARNING', `Enter key did not navigate to lesson ${nextLesson} — falling back to menu`);
          goToMenu();
          try { await waitForPage('MENU', 15000); }
          catch { log('ERROR', 'Failed to return to menu after Enter fallback'); break; }
          await sleep(800);
        } else if (transitioned === 'EXECUTABLE') {
          log('INFO', `Entered lesson ${nextLesson} via Enter key`);
          // Already on the lesson, loop continues naturally
        } else if (transitioned === 'MENU') {
          // Landed on menu — will be handled at top of next loop iteration
          await sleep(500);
        } else {
          log('SKIP', `Lesson ${nextLesson}: page after Enter is "${transitioned}", skipping`);
          // Don't navigate away — let next loop iteration handle it
        }
      } else {
        // Go back to menu for next
        await sleep(500);
        goToMenu();
        try { await waitForPage('MENU', 15000); }
        catch { log('ERROR', 'Failed to return to menu'); break; }
        await sleep(800);
      }
    }

    if (state.running) {
      log('SUCCESS', `Automation complete! Processed ${state.currentLessonIdx + 1} of ${state.queue.length} lessons`);
    }
    stopAutomation();
  }

  function stopAutomation() {
    state.running = false;
    state.abortController?.abort();
    updateStartStopBtn(false);
    log('INFO', 'Automation stopped');
  }

  // ============================================================
  // SECTION 12: CONFIG READER
  // ============================================================

  function readConfigFromUI() {
    return {
      wpm: parseInt(document.getElementById('at-wpm')?.value) || 80,
      variation: parseInt(document.getElementById('at-variation')?.value) || 10,
      realAccuracy: parseFloat(document.getElementById('at-real-acc')?.value) || 100,
      fakeAccuracy: parseFloat(document.getElementById('at-fake-acc')?.value) || 98,
    };
  }

  // Returns live config — always reflects latest user-edited values
  function getConfig() {
    return state.liveConfig || readConfigFromUI();
  }

  // ============================================================
  // SECTION 12b: QUEUE TEXTAREA HELPERS
  // ============================================================

  function removeFromQueueTextarea(lessonNum) {
    const box = document.getElementById('at-queue-box');
    if (!box) return;
    const current = box.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    const updated = current.filter(n => n !== lessonNum);
    box.value = updated.join(', ');
    updateQueueIndicator(updated.length);
  }

  // ============================================================
  // SECTION 13: UI
  // ============================================================

  function buildUI() {
    // Remove existing panel
    document.getElementById('at-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'at-panel';
    panel.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700&display=swap');

        #at-panel {
          position: fixed;
          z-index: 2147483647;
          bottom: 24px;
          right: 24px;
          width: 320px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          background: #0d0d0f;
          border: 1px solid #2a2a35;
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset;
          color: #c8c8d4;
          overflow: hidden;
          user-select: none;
        }
        #at-panel * { box-sizing: border-box; }

        #at-titlebar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: linear-gradient(135deg, #13131a 0%, #1a1a25 100%);
          border-bottom: 1px solid #2a2a35;
          cursor: move;
          gap: 8px;
        }
        #at-titlebar .at-logo {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #7c6fff;
          text-transform: uppercase;
        }
        #at-titlebar .at-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #555;
          flex: 1;
          text-align: center;
        }
        #at-titlebar .at-minimize {
          background: none; border: none; cursor: pointer;
          color: #555; font-size: 16px; padding: 0; line-height: 1;
          transition: color 0.2s;
        }
        #at-titlebar .at-minimize:hover { color: #c8c8d4; }

        #at-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        #at-body.hidden { display: none; }

        .at-row { display: flex; gap: 8px; align-items: center; }
        .at-col { display: flex; flex-direction: column; gap: 4px; flex: 1; }

        .at-label {
          font-size: 10px; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase; color: #555;
        }

        .at-input {
          background: #17171f; border: 1px solid #2a2a35; border-radius: 6px;
          color: #e0e0f0; font-family: 'JetBrains Mono', monospace; font-size: 12px;
          padding: 6px 8px; width: 100%; outline: none;
          transition: border-color 0.2s;
        }
        .at-input:focus { border-color: #7c6fff; }

        .at-divider { height: 1px; background: #2a2a35; margin: 2px 0; }

        .at-btn {
          border: none; border-radius: 7px; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
          padding: 8px 12px; transition: all 0.2s; flex: 1; text-align: center;
          letter-spacing: 0.5px;
        }
        #at-btn-start {
          background: linear-gradient(135deg, #7c6fff, #5c4fe0);
          color: #fff; box-shadow: 0 2px 12px rgba(124,111,255,0.4);
        }
        #at-btn-start:hover { box-shadow: 0 4px 20px rgba(124,111,255,0.6); transform: translateY(-1px); }
        #at-btn-start.running {
          background: linear-gradient(135deg, #ff4f6f, #c0392b);
          box-shadow: 0 2px 12px rgba(255,79,111,0.4);
        }
        #at-btn-restart {
          background: #1e1e2c; border: 1px solid #2a2a35; color: #888;
        }
        #at-btn-restart:hover { border-color: #7c6fff; color: #c8c8d4; }

        #at-btn-scrap {
          background: #1a1a25; border: 1px solid #2a2a35; color: #7c6fff;
          font-size: 11px; padding: 6px 10px;
        }
        #at-btn-scrap:hover { background: #7c6fff22; border-color: #7c6fff; }

        .at-queue-box {
          background: #17171f; border: 1px solid #2a2a35; border-radius: 6px;
          color: #e0e0f0; font-family: 'JetBrains Mono', monospace; font-size: 11px;
          padding: 6px 8px; width: 100%; resize: vertical; min-height: 48px; max-height: 100px;
          outline: none; transition: border-color 0.2s;
        }
        .at-queue-box:focus { border-color: #7c6fff; }

        .at-scrap-row { display: flex; gap: 6px; align-items: flex-end; }
        .at-scrap-range { display: flex; gap: 4px; align-items: center; }
        .at-scrap-range .at-input { width: 54px; }
        .at-scrap-range span { color: #444; font-size: 11px; }

        #at-log-container {
          background: #0a0a0f; border: 1px solid #1e1e28; border-radius: 6px;
          height: 120px; overflow-y: auto; padding: 6px 8px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          line-height: 1.6; color: #666;
        }
        .at-log-entry { display: block; }
        .at-log-entry.ERROR   { color: #ff6b6b; }
        .at-log-entry.WARNING { color: #ffd166; }
        .at-log-entry.SUCCESS { color: #06d6a0; }
        .at-log-entry.INFO    { color: #74b9ff; }
        .at-log-entry.SKIP    { color: #636e72; }
        .at-log-entry.PROGRESS { color: #a29bfe; }

        .at-log-controls {
          display: flex; justify-content: space-between; align-items: center;
        }
        .at-log-clear {
          background: none; border: none; cursor: pointer;
          color: #444; font-size: 10px; font-family: 'JetBrains Mono', monospace;
          padding: 0; transition: color 0.2s;
        }
        .at-log-clear:hover { color: #ff6b6b; }
        .at-log-download {
          background: none; border: none; cursor: pointer;
          color: #444; font-size: 10px; font-family: 'JetBrains Mono', monospace;
          padding: 0; transition: color 0.2s;
        }
        .at-log-download:hover { color: #06d6a0; }

        .at-queue-indicator {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #555;
        }
        .at-queue-indicator span { color: #7c6fff; }
      </style>

      <div id="at-titlebar">
        <span class="at-logo">AutoTyper</span>
        <span class="at-status" id="at-status-text">IDLE</span>
        <button class="at-minimize" id="at-minimize-btn">▾</button>
      </div>

      <div id="at-body">

        <!-- Main Controls -->
        <div class="at-row">
          <button class="at-btn" id="at-btn-start">▶ Start</button>
          <button class="at-btn" id="at-btn-restart">↺ Menu</button>
        </div>

        <div class="at-divider"></div>

        <!-- WPM Settings -->
        <div class="at-row">
          <div class="at-col">
            <label class="at-label">Target WPM</label>
            <input class="at-input" id="at-wpm" type="number" min="20" max="300" value="80" />
          </div>
          <div class="at-col">
            <label class="at-label">Variation ±</label>
            <input class="at-input" id="at-variation" type="number" min="0" max="60" value="10" />
          </div>
        </div>

        <!-- Accuracy Settings -->
        <div class="at-row">
          <div class="at-col">
            <label class="at-label">Real Acc %</label>
            <input class="at-input" id="at-real-acc" type="number" min="0" max="100" value="100" step="0.1"/>
          </div>
          <div class="at-col">
            <label class="at-label">Fake Acc %</label>
            <input class="at-input" id="at-fake-acc" type="number" min="0" max="100" value="98" step="0.1"/>
          </div>
        </div>

        <div class="at-divider"></div>

        <!-- Scrap Controls -->
        <div class="at-scrap-row">
          <div class="at-col">
            <label class="at-label">Lesson Range</label>
            <div class="at-scrap-range">
              <input class="at-input" id="at-scrap-min" type="number" min="1" value="1" placeholder="1"/>
              <span>—</span>
              <input class="at-input" id="at-scrap-max" type="number" min="1" value="1200" placeholder="1200"/>
            </div>
          </div>
          <div class="at-col" style="max-width:80px">
            <label class="at-label">Redo ≤★</label>
            <input class="at-input" id="at-redo-threshold" type="number" min="0" max="6" value="0"/>
          </div>
        </div>
        <button class="at-btn" id="at-btn-scrap" style="width:100%">⟳ Scrape Menu Page</button>

        <!-- Queue -->
        <div style="display:flex;align-items:center;justify-content:space-between">
          <label class="at-label">Queue</label>
          <span class="at-queue-indicator" id="at-queue-indicator">0 lessons</span>
        </div>
        <textarea class="at-queue-box" id="at-queue-box" placeholder="Lesson numbers separated by commas, e.g. 1, 2, 5, 10"></textarea>

        <div class="at-divider"></div>

        <!-- Log -->
        <div class="at-log-controls">
          <label class="at-label">Log</label>
          <div style="display:flex;gap:10px">
            <button class="at-log-download" id="at-log-download">↓ export</button>
            <button class="at-log-clear" id="at-log-clear">✕ clear</button>
          </div>
        </div>
        <div id="at-log-container"></div>

      </div>
    `;

    document.body.appendChild(panel);

    // ---- Drag ----
    const titlebar = panel.querySelector('#at-titlebar');
    let dragging = false, ox = 0, oy = 0;
    titlebar.addEventListener('mousedown', e => {
      dragging = true;
      ox = e.clientX - panel.getBoundingClientRect().left;
      oy = e.clientY - panel.getBoundingClientRect().top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = e.clientX - ox, ny = e.clientY - oy;
      nx = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, nx));
      ny = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, ny));
      panel.style.left = nx + 'px'; panel.style.top = ny + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });

    // ---- Minimize ----
    const body = panel.querySelector('#at-body');
    const minBtn = panel.querySelector('#at-minimize-btn');
    minBtn.addEventListener('click', () => {
      const collapsed = body.classList.toggle('hidden');
      minBtn.textContent = collapsed ? '▸' : '▾';
    });

    // ---- Start/Stop ----
    document.getElementById('at-btn-start').addEventListener('click', () => {
      if (state.running) {
        stopAutomation();
      } else {
        // Parse queue from textarea — completed lessons have already been removed from it
        const raw = document.getElementById('at-queue-box').value;
        const parsed = raw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (parsed.length === 0) { log('ERROR', 'Queue is empty. Scrape first or enter lesson numbers.'); return; }
        state.queue = parsed;
        state.currentLessonIdx = 0;
        state.liveConfig = readConfigFromUI(); // snapshot current UI values as starting config
        state.running = true;
        updateStartStopBtn(true);
        setStatus('RUNNING');
        runAutomation().catch(e => { log('ERROR', `Automation error: ${e.message}`); stopAutomation(); });
      }
    });

    // ---- Restart (go to menu) ----
    document.getElementById('at-btn-restart').addEventListener('click', () => {
      stopAutomation();
      if (!isMenuPage()) {
        goToMenu();
      } else {
        log('INFO', 'Already on menu page — no redirect needed');
      }
    });

    // ---- Scrap ----
    document.getElementById('at-btn-scrap').addEventListener('click', () => {
      if (!isMenuPage()) { log('ERROR', 'Must be on the menu page to scrape.'); return; }
      const min = parseInt(document.getElementById('at-scrap-min').value) || 1;
      const max = parseInt(document.getElementById('at-scrap-max').value) || 9999;
      const redo = parseInt(document.getElementById('at-redo-threshold').value) ?? 0;
      log('PROGRESS', `Scraping lessons ${min}–${max}, redo threshold ≤${redo} stars...`);
      const queue = scrapeLessons(min, max, redo);
      document.getElementById('at-queue-box').value = queue.join(', ');
      updateQueueIndicator(queue.length);
      log('SUCCESS', `Scraped ${Object.keys(state.scrapeData).length} lessons. ${queue.length} added to queue.`);
    });

    // ---- Queue box manual edit ----
    document.getElementById('at-queue-box').addEventListener('input', () => {
      const raw = document.getElementById('at-queue-box').value;
      const parsed = raw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      updateQueueIndicator(parsed.length);
    });

    // ---- Live config: debounced input on WPM/accuracy fields ----
    // Only apply after user stops typing for 800ms (avoids applying "8" when typing "80")
    let configDebounceTimer = null;
    const configInputIds = ['at-wpm', 'at-variation', 'at-real-acc', 'at-fake-acc'];
    configInputIds.forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        clearTimeout(configDebounceTimer);
        configDebounceTimer = setTimeout(() => {
          const newCfg = readConfigFromUI();
          state.liveConfig = newCfg;
          if (state.running) {
            log('INFO', `Config updated live — WPM: ${newCfg.wpm}, Variation: ±${newCfg.variation}, RealAcc: ${newCfg.realAccuracy}%, FakeAcc: ${newCfg.fakeAccuracy}%`);
          }
        }, 800);
      });
    });

    // ---- Log clear ----
    document.getElementById('at-log-clear').addEventListener('click', () => {
      document.getElementById('at-log-container').innerHTML = '';
      logBuffer.length = 0;
    });

    // ---- Log download ----
    document.getElementById('at-log-download').addEventListener('click', () => {
      const blob = new Blob([logBuffer.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `autotyper_log_${Date.now()}.txt`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ---- UI update helpers ----

  function appendLogToUI(entry, level) {
    const container = document.getElementById('at-log-container');
    if (!container) return;
    const el = document.createElement('span');
    el.className = `at-log-entry ${level}`;
    el.textContent = entry + '\n';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function updateStartStopBtn(running) {
    const btn = document.getElementById('at-btn-start');
    if (!btn) return;
    btn.textContent = running ? '■ Stop' : '▶ Start';
    btn.classList.toggle('running', running);
  }

  function setStatus(text) {
    const el = document.getElementById('at-status-text');
    if (el) el.textContent = text;
  }

  function updateQueueIndicator(count) {
    const el = document.getElementById('at-queue-indicator');
    if (el) el.innerHTML = `<span>${count}</span> lessons`;
  }

  function updateQueueHighlight(idx) {
    const indicator = document.getElementById('at-queue-indicator');
    if (!indicator) return;
    setStatus(`#${state.queue[idx]} (${idx + 1}/${state.queue.length})`);
  }

  // ============================================================
  // SECTION 14: STOP ON USER INTERFERENCE
  // ============================================================

  function setupInterferenceDetection() {
    // Stop if user manually clicks menu button while running (but not if the script is doing it)
    document.addEventListener('click', (e) => {
      if (!state.running) return;
      if (state.scriptNavigating) return; // script itself is navigating, ignore
      const menuBtn = e.target.closest('.menu-btn');
      if (menuBtn) { log('WARNING', 'User clicked menu button — stopping automation'); stopAutomation(); }
    }, true);

    // Stop on real user keyboard input in the typing area
    // isTrusted is true for real user events, false for script-dispatched events
    document.addEventListener('keydown', (e) => {
      if (!state.running) return;
      if (!e.isTrusted) return;
      const typingInput = document.querySelector('input[aria-hidden="true"]');
      if (typingInput && e.target === typingInput) {
        log('WARNING', 'User keyboard input detected — stopping automation');
        stopAutomation();
      }
    }, true);
  }

  // ============================================================
  // SECTION 15: INIT
  // ============================================================

  function init() {
    // Only run on TypingClub program pages
    if (!location.href.includes('typingclub.com') && !location.href.includes('edclub.com')) return;
    buildUI();
    setupInterferenceDetection();
    log('INFO', `AutoTyper initialized — Page: ${detectPage()} — ${location.href}`);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();