// ==UserScript==
// @name         TypingClub AutoTyper
// @namespace    https://github.com/AutoTyper
// @version      1.0.0
// @description  Auto-complete TypingClub lessons with configurable WPM, accuracy, and speed patterns
// @match        https://*.typingclub.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // CONFIG & STATE
  // ============================================================

  const DEFAULT_CONFIG = {
    targetWPM: 90,
    targetAccuracy: 97,
    errorRate: 0.05,          // fake error rate (0-1)
    fakeErrorChars: 'qwertyuiopasdfghjklzxcvbnm',
    keepFocus: true,
    autoAdvance: true,
    speedPatterns: 'fixed',   // 'fixed', 'random', 'wave', 'ramp', or combo like 'random:30,wave:40,ramp:30'
    lessonList: '',            // comma-separated lesson global indices (e.g., "50,51,52")
    lessonListCrawled: '',     // auto-populated by crawler
    skipIcons: 'cmn-video',    // icon classes to always skip
  };

  let config = { ...DEFAULT_CONFIG, ...loadConfig() };
  let state = {
    running: false,
    paused: false,
    currentLessonIndex: -1,
    lessonQueue: [],
    completedLessons: [],
    failedLessons: [],
    totalCharsTyped: 0,
    totalErrors: 0,
    startTime: null,
    lessonStartTime: null,
    abortController: null,
    speedPatternState: {},
  };

  // ============================================================
  // LOGGER — console + UI panel
  // ============================================================

  const LOG_PREFIX = '🤖 AutoTyper';
  const logBuffer = []; // stores last 200 log lines

  const Logger = {
    _output(level, tag, msg) {
      const ts = new Date().toLocaleTimeString();
      const line = `[${ts}] ${level} ${tag}: ${msg}`;
      // Always log to console
      if (level === '❌') console.error(LOG_PREFIX, line);
      else if (level === '⚠️') console.warn(LOG_PREFIX, line);
      else console.log(LOG_PREFIX, line);
      // Buffer for UI
      logBuffer.push({ ts, level, tag, msg });
      if (logBuffer.length > 200) logBuffer.shift();
      // Update UI log panel if it exists
      this._updateUI();
    },
    info(tag, msg) { this._output('ℹ️', tag, msg); },
    ok(tag, msg) { this._output('✅', tag, msg); },
    warn(tag, msg) { this._output('⚠️', tag, msg); },
    error(tag, msg) { this._output('❌', tag, msg); },
    lesson(num, icon, status, detail) {
      this._output('📘', `LESSON #${num}`, `icon=${icon} status=${status} ${detail}`);
    },
    fail(num, icon, aria, reason) {
      this._output('💥', `FAIL #${num}`, `icon="${icon}" aria="${aria}" reason=${reason}`);
    },
    _updateUI() {
      const el = document.getElementById('at-log');
      if (!el) return;
      el.textContent = logBuffer.slice(-50).map(l => `${l.level} ${l.tag}: ${l.msg}`).join('\n');
      el.scrollTop = el.scrollHeight;
    },
    export() { return JSON.stringify(logBuffer, null, 2); },
  };

  // ============================================================
  // CONFIG PERSISTENCE
  // ============================================================

  function saveConfig() {
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      GM_setValue(key, config[key]);
    });
  }

  function loadConfig() {
    const loaded = {};
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      const val = GM_getValue(key);
      if (val !== undefined) loaded[key] = val;
    });
    return loaded;
  }

  // ============================================================
  // SPEED PATTERN ENGINE
  // ============================================================

  function getBaseDelay() {
    // WPM = (chars/5) / timeMin  →  timePerChar = 5 / (WPM * 60) seconds
    return (5 / (config.targetWPM * 60)) * 1000; // ms per character
  }

  const SpeedPatterns = {
    fixed: {
      getNext(base, index, total) { return base; },
    },
    random: {
      getNext(base, index, total) {
        return base * (0.5 + Math.random()); // 50%-150% of base
      },
    },
    wave: {
      state: { phase: 0 },
      getNext(base, index, total) {
        this.state.phase += 0.1;
        const factor = 0.7 + 0.3 * Math.sin(this.state.phase);
        return base * factor;
      },
      reset() { this.state.phase = 0; },
    },
    ramp: {
      state: { start: 0 },
      getNext(base, index, total) {
        if (this.state.start === 0) this.state.start = Date.now();
        const elapsed = (Date.now() - this.state.start) / 1000;
        const factor = Math.min(1.5, 0.5 + elapsed * 0.05); // ramps up over time
        return base * factor;
      },
      reset() { this.state.start = 0; },
    },
    rampDown: {
      state: { start: 0 },
      getNext(base, index, total) {
        if (this.state.start === 0) this.state.start = Date.now();
        const elapsed = (Date.now() - this.state.start) / 1000;
        const factor = Math.max(0.5, 1.5 - elapsed * 0.05);
        return base * factor;
      },
      reset() { this.state.start = 0; },
    },
  };

  // Parse combo pattern: "random:30,wave:40,ramp:30" → weighted selection
  function parseComboPattern(str) {
    const parts = str.split(',').map(p => p.trim());
    const patterns = [];
    let totalWeight = 0;
    for (const part of parts) {
      const [name, weight] = part.split(':');
      const w = parseFloat(weight) || 33;
      if (SpeedPatterns[name]) {
        patterns.push({ name, weight: w, cumulative: 0 });
        totalWeight += w;
      }
    }
    let cumulative = 0;
    patterns.forEach(p => {
      cumulative += p.weight / totalWeight;
      p.cumulative = cumulative;
    });
    return {
      type: 'combo',
      patterns,
      getNext(base, index, total) {
        const r = Math.random();
        const chosen = this.patterns.find(p => r <= p.cumulative) || this.patterns[this.patterns.length - 1];
        return SpeedPatterns[chosen.name].getNext(base, index, total);
      },
      reset() {
        this.patterns.forEach(p => {
          if (SpeedPatterns[p.name].reset) SpeedPatterns[p.name].reset();
        });
      },
    };
  }

  function getPattern() {
    if (config.speedPatterns.includes(',')) {
      return parseComboPattern(config.speedPatterns);
    }
    return SpeedPatterns[config.speedPatterns] || SpeedPatterns.fixed;
  }

  // ============================================================
  // TYPING ENGINE
  // ============================================================

  function getInput() {
    return document.querySelector('input[aria-hidden="true"]');
  }

  function getCharElements() {
    return document.querySelectorAll('.token span.token_unit');
  }

  function dispatchKeyEvent(input, key) {
    const down = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    const up = new KeyboardEvent('keyup', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(down);
    input.dispatchEvent(up);
  }

  async function typeCharacter(input, key, delay) {
    if (!state.running || state.paused) return;
    dispatchKeyEvent(input, key);
    state.totalCharsTyped++;
    await sleep(delay);
  }

  function shouldFakeError() {
    return Math.random() < config.errorRate;
  }

  function getRandomErrorChar() {
    const chars = config.fakeErrorChars;
    return chars[Math.floor(Math.random() * chars.length)];
  }

  // ============================================================
  // PAGE DETECTION
  // ============================================================

  function detectPage() {
    const url = window.location.href;

    // Menu page
    if (url.match(/program-\d+\.game/)) {
      return 'MENU';
    }

    // Results page (URL same as lesson, detect via DOM)
    if (document.querySelector('.performance-results') ||
        document.querySelector('div[tabindex="3"]')?.textContent?.includes('wpm')) {
      return 'RESULTS';
    }

    // Typing lesson
    if (getInput() && getCharElements().length > 0) {
      return 'TYPING';
    }

    // Special (video, info, etc.)
    return 'SPECIAL';
  }

  // ============================================================
  // MENU SCRAPER
  // ============================================================

  function scrapeMenuLessons() {
    const container = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
    if (!container) {
      Logger.error('Scraper', 'Menu container not found');
      return [];
    }

    const rows = container.querySelectorAll('.lsnrow');
    const lessons = [];
    let globalIndex = 0;

    rows.forEach((row, rowIdx) => {
      const rowName = row.getAttribute('name') || row.querySelector('h2')?.textContent?.trim() || `row-${rowIdx}`;
      const boxContainers = row.querySelectorAll('.box-container');

      boxContainers.forEach((container) => {
        globalIndex++;
        const iconEl = container.querySelector('.lesson_icon');
        const iconClass = iconEl?.className?.trim() || '';
        const starsEl = container.querySelector('.stars');
        const starClass = starsEl?.className?.trim() || '';
        const starMatch = starClass.match(/stars-(\d)/);
        const starCount = starMatch ? parseInt(starMatch[1]) : null;
        const isPlatinum = container.querySelector('.platinum-star') !== null;
        const ariaLabel = container.getAttribute('aria-label') || '';
        const lessonName = container.querySelector('.lsn_name')?.textContent?.trim() ||
                           container.querySelector('.lsn_name')?.getAttribute('title')?.trim() || '';
        const lessonNum = container.querySelector('.lsn_num')?.textContent?.trim() || '';
        const tabindex = container.getAttribute('tabindex') || '';
        const classes = Array.from(container.classList);

        // Determine if auto-completeable
        // ONLY e-qwerty lessons (typing, review, caps, numbers, symbols) are confirmed working
        // Games (cmn-game, cmn-G3) do NOT work — excluded
        // NOTE: iconClass is "lesson_icon e-qwerty qwerty-fj" so use .includes() not .startsWith()
        const isAutoCompleteable = iconClass.includes('e-qwerty');

        const shouldSkip = iconClass.includes('cmn-video') ||
                           iconClass.includes('cmn-game') ||
                           iconClass.includes('cmn-G3') ||
                           (!isAutoCompleteable);

        lessons.push({
          globalIndex,
          row: rowName,
          name: lessonName,
          num: lessonNum,
          iconClass,
          starCount,
          isPlatinum,
          ariaLabel,
          tabindex,
          isAutoCompleteable,
          shouldSkip,
          element: container,
        });
      });
    });

    return lessons;
  }

  // ============================================================
  // LESSON CRAWL (populate lesson list)
  // ============================================================

  function crawlLessons() {
    const lessons = scrapeMenuLessons();
    if (lessons.length === 0) {
      Logger.error('Crawl', 'No lessons found');
      return;
    }

    // Filter: only auto-completeable, non-skipped, non-platinum, non-5-star lessons
    const workable = lessons.filter(l =>
      l.isAutoCompleteable && !l.shouldSkip && !l.isPlatinum && l.starCount !== 5
    );

    const indices = workable.map(l => l.globalIndex).join(',');
    config.lessonListCrawled = indices;
    config.lessonList = indices;
    saveConfig();

    UI.updateLessonListText(indices);
    Logger.ok('Crawl', `Found ${lessons.length} total, ${workable.length} workable lessons`, {
      total: lessons.length,
      workable: workable.length,
      skipped: lessons.filter(l => !l.isAutoCompleteable || l.shouldSkip).length,
      platinum: lessons.filter(l => l.isPlatinum).length,
    });
  }

  // ============================================================
  // RESULTS PARSER
  // ============================================================

  function parseResults() {
    const tabindex3 = document.querySelector('div[tabindex="3"]');
    if (!tabindex3) return null;

    const text = tabindex3.textContent;
    const wpmMatch = text.match(/speed\s+of\s+(\d+)\s+wpm/);
    const accMatch = text.match(/accuracy\s+was\s+(\d+)%/);
    const realAccMatch = text.match(/real\s+accuracy\s+of\s+(\d+)%/);
    const durationMatch = text.match(/in\s+(\d+)\s+seconds/);

    return {
      wpm: wpmMatch ? parseInt(wpmMatch[1]) : null,
      accuracy: accMatch ? parseInt(accMatch[1]) : null,
      realAccuracy: realAccMatch ? parseInt(realAccMatch[1]) : null,
      duration: durationMatch ? parseInt(durationMatch[1]) + 's' : null,
      rawText: text,
    };
  }

  // ============================================================
  // LESSON EXECUTOR
  // ============================================================

  async function executeLesson(lessonData, signal) {
    Logger.info('Lesson', `Starting lesson #${lessonData.globalIndex}: ${lessonData.name}`, {
      icon: lessonData.iconClass,
      stars: lessonData.starCount,
      platinum: lessonData.isPlatinum,
    });

    // Click the lesson
    lessonData.element.click();
    Logger.info('Lesson', `Clicked lesson element`);

    // Wait for page to load (poll for typing or special detection)
    let attempts = 0;
    const maxAttempts = 60; // 6 seconds at 100ms intervals

    while (attempts < maxAttempts) {
      if (signal.aborted) { Logger.warn('Lesson', 'Aborted'); return false; }
      if (state.paused) { await sleep(200); continue; }

      const page = detectPage();

      if (page === 'SPECIAL') {
        // Check if it has .token span.token_unit but we missed it
        if (getCharElements().length === 0) {
          Logger.warn('Lesson', `Detected SPECIAL page — no typing engine. Icon: ${lessonData.iconClass}`, {
            lessonNum: lessonData.num,
            name: lessonData.name,
            icon: lessonData.iconClass,
            ariaLabel: lessonData.ariaLabel,
          });

          // Log failed lesson icon to skip list
          if (!config.skipIcons.includes(lessonData.iconClass)) {
            config.skipIcons += ',' + lessonData.iconClass;
            saveConfig();
          }
          state.failedLessons.push({
            index: lessonData.globalIndex,
            name: lessonData.name,
            icon: lessonData.iconClass,
            reason: 'SPECIAL_PAGE_NO_TYPING',
          });

          return false;
        }
      }

      if (page === 'TYPING') break;
      if (page === 'RESULTS') {
        // Already completed (redirected instantly)
        Logger.ok('Lesson', 'Lesson already completed');
        return true;
      }

      await sleep(100);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      Logger.error('Lesson', `Timeout waiting for typing engine. Icon: ${lessonData.iconClass}`);
      state.failedLessons.push({
        index: lessonData.globalIndex,
        name: lessonData.name,
        icon: lessonData.iconClass,
        reason: 'TIMEOUT_WAITING_TYPING_ENGINE',
      });
      return false;
    }

    // Type the lesson
    const input = getInput();
    if (!input) {
      Logger.error('Lesson', 'No input element found');
      return false;
    }

    const pattern = getPattern();
    pattern.reset();
    const baseDelay = getBaseDelay();
    const chars = getCharElements();
    state.lessonStartTime = Date.now();

    Logger.info('Typing', `Typing ${chars.length} characters at ~${config.targetWPM} WPM (base delay: ${baseDelay.toFixed(1)}ms)`);

    for (let i = 0; i < chars.length; i++) {
      if (signal.aborted) { Logger.warn('Typing', 'Aborted'); return false; }
      if (state.paused) { await sleep(200); i--; continue; }

      // Check if lesson completed mid-typing (results appeared)
      if (detectPage() === 'RESULTS') {
        Logger.ok('Typing', `Lesson completed early at char ${i}/${chars.length}`);
        return true;
      }

      const delay = pattern.getNext(baseDelay, i, chars.length);

      // Decide: normal char or fake error
      if (shouldFakeError()) {
        await typeCharacter(input, getRandomErrorChar(), delay);
      } else {
        // Get the expected character from the lesson
        const charEl = chars[i];
        const expectedKey = charEl?.textContent?.trim() || ' ';
        await typeCharacter(input, expectedKey, delay);
      }
    }

    Logger.ok('Typing', `Finished typing ${chars.length} characters`);

    // Wait for results to appear
    let resultAttempts = 0;
    while (resultAttempts < 100) {
      if (signal.aborted) return false;
      if (state.paused) { await sleep(200); continue; }

      if (detectPage() === 'RESULTS') break;
      await sleep(100);
      resultAttempts++;
    }

    if (resultAttempts >= 100) {
      Logger.warn('Results', 'Results page did not appear');
      return false;
    }

    // Parse results
    const results = parseResults();
    if (results) {
      Logger.ok('Results', `WPM: ${results.wpm}, Accuracy: ${results.accuracy}%, Real: ${results.realAccuracy}%, Duration: ${results.duration}`);

      // Log to global stats
      UI.updateStats(results);
    }

    return true;
  }

  // ============================================================
  // LESSON RUNNER
  // ============================================================

  async function runLessonQueue() {
    if (state.lessonQueue.length === 0) {
      Logger.warn('Runner', 'No lessons in queue');
      return;
    }

    state.running = true;
    state.startTime = Date.now();
    state.abortController = new AbortController();
    const signal = state.abortController.signal;

    Logger.info('Runner', `Starting run with ${state.lessonQueue.length} lessons`);
    UI.updateRunState(true);

    while (state.lessonQueue.length > 0 && state.running) {
      const lessonIndex = state.lessonQueue[0];
      state.currentLessonIndex = lessonIndex;

      // Find the lesson element
      const lessons = scrapeMenuLessons();
      const lessonData = lessons.find(l => l.globalIndex === lessonIndex);

      if (!lessonData) {
        Logger.error('Runner', `Lesson #${lessonIndex} not found in DOM`);
        state.lessonQueue.shift();
        UI.removeFromList(lessonIndex);
        continue;
      }

      if (lessonData.isPlatinum || lessonData.starCount === 5) {
        Logger.info('Runner', `Lesson #${lessonIndex} already done (platinum=${lessonData.isPlatinum}, stars=${lessonData.starCount}), skipping`);
        state.lessonQueue.shift();
        state.completedLessons.push(lessonIndex);
        UI.removeFromList(lessonIndex);
        continue;
      }

      const success = await executeLesson(lessonData, signal);

      if (success) {
        state.completedLessons.push(lessonIndex);
        UI.removeFromList(lessonIndex);
        Logger.ok('Runner', `Lesson #${lessonIndex} completed`);
      } else {
        state.failedLessons.push({
          index: lessonIndex,
          name: lessonData.name,
          icon: lessonData.iconClass,
          reason: 'EXECUTION_FAILED',
        });
        Logger.warn('Runner', `Lesson #${lessonIndex} failed`);
      }

      state.lessonQueue.shift();

      // If running and auto-advance enabled, navigate back to menu for next lesson
      if (state.running && state.lessonQueue.length > 0 && config.autoAdvance) {
        await navigateToMenu(signal);
      }

      // Small delay between lessons
      if (state.running && state.lessonQueue.length > 0) {
        await sleep(1000);
      }
    }

    state.running = false;
    state.currentLessonIndex = -1;
    UI.updateRunState(false);
    Logger.info('Runner', `Run complete. Completed: ${state.completedLessons.length}, Failed: ${state.failedLessons.length}`);
  }

  async function navigateToMenu(signal) {
    // Try clicking the back button or navigating to menu URL
    const menuLink = document.querySelector('a[href*="program-"][href*=".game"]');
    if (menuLink) {
      Logger.info('Nav', 'Clicking menu link to return to menu page');
      menuLink.click();
      // Wait for menu to load
      let attempts = 0;
      while (attempts < 50) {
        if (signal.aborted) return;
        if (detectPage() === 'MENU') return;
        await sleep(100);
        attempts++;
      }
      Logger.warn('Nav', 'Menu did not load after 5 seconds');
    } else {
      // Fallback: reload and navigate
      Logger.warn('Nav', 'No menu link found, using history.back()');
      window.history.back();
      await sleep(2000);
    }
  }

  // ============================================================
  // FLOATING UI
  // ============================================================

  const UI = {
    panel: null,
    elements: {},

    createPanel() {
      if (this.panel) return;

      this.panel = document.createElement('div');
      this.panel.id = 'autotyper-panel';
      this.panel.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 999999;
        background: #1e1e2e; color: #cdd6f4; font-family: 'Segoe UI', sans-serif;
        font-size: 13px; border-radius: 12px; padding: 16px; width: 320px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4); max-height: 90vh; overflow-y: auto;
        border: 1px solid #45475a;
      `;

      this.panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;font-size:16px;color:#89b4fa;">🤖 AutoTyper</h3>
          <button id="at-minimize" style="background:none;border:none;color:#6c7086;cursor:pointer;font-size:16px;">─</button>
        </div>

        <div id="at-body">
          <!-- WPM Control -->
          <div style="margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;color:#a6adc8;">
              Target WPM: <span id="at-wpm-val" style="color:#89b4fa;">${config.targetWPM}</span>
            </label>
            <input type="range" id="at-wpm" min="20" max="200" value="${config.targetWPM}"
              style="width:100%;accent-color:#89b4fa;">
          </div>

          <!-- Accuracy Control -->
          <div style="margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;color:#a6adc8;">
              Target Accuracy: <span id="at-acc-val" style="color:#a6e3a1;">${config.targetAccuracy}%</span>
            </label>
            <input type="range" id="at-acc" min="80" max="100" value="${config.targetAccuracy}"
              style="width:100%;accent-color:#a6e3a1;">
          </div>

          <!-- Error Rate -->
          <div style="margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;color:#a6adc8;">
              Fake Error Rate: <span id="at-err-val" style="color:#f9e2af;">${(config.errorRate * 100).toFixed(0)}%</span>
            </label>
            <input type="range" id="at-err" min="0" max="20" value="${config.errorRate * 100}"
              style="width:100%;accent-color:#f9e2af;">
          </div>

          <!-- Speed Pattern -->
          <div style="margin-bottom:10px;">
            <label style="color:#a6adc8;display:block;margin-bottom:4px;">Speed Pattern:</label>
            <input type="text" id="at-pattern" value="${config.speedPatterns}"
              style="width:100%;padding:6px 8px;background:#313244;border:1px solid #45475a;border-radius:6px;color:#cdd6f4;font-size:12px;"
              placeholder="fixed, random, wave, ramp, or combo: random:30,wave:40,ramp:30">
            <div style="font-size:10px;color:#6c7086;margin-top:2px;">
              Presets: fixed | random | wave | ramp | rampDown | combo: random:30,wave:40,ramp:30
            </div>
          </div>

          <!-- Lesson List -->
          <div style="margin-bottom:10px;">
            <label style="color:#a6adc8;display:block;margin-bottom:4px;">Lesson Numbers (comma-separated):</label>
            <textarea id="at-lessons" rows="3"
              style="width:100%;padding:6px 8px;background:#313244;border:1px solid #45475a;border-radius:6px;color:#cdd6f4;font-size:12px;resize:vertical;"
              placeholder="e.g., 50,51,52,53">${config.lessonList}</textarea>
          </div>

          <!-- Buttons Row 1 -->
          <div style="display:flex;gap:6px;margin-bottom:8px;">
            <button id="at-crawl" style="flex:1;padding:8px;background:#585b70;color:#cdd6f4;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
              🔍 Crawl
            </button>
            <button id="at-start" style="flex:1;padding:8px;background:#a6e3a1;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">
              ▶ Start
            </button>
            <button id="at-stop" style="flex:1;padding:8px;background:#f38ba8;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;" disabled>
              ⏹ Stop
            </button>
          </div>

          <!-- Buttons Row 2 -->
          <div style="display:flex;gap:6px;margin-bottom:10px;">
            <button id="at-pause" style="flex:1;padding:6px;background:#fab387;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:11px;" disabled>
              ⏸ Pause
            </button>
            <button id="at-save" style="flex:1;padding:6px;background:#74c7ec;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:11px;">
              💾 Save
            </button>
            <button id="at-export-log" style="flex:1;padding:6px;background:#cba6f7;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:11px;">
              📋 Export Log
            </button>
          </div>

          <!-- Stats -->
          <div style="background:#313244;border-radius:8px;padding:10px;font-size:12px;margin-bottom:10px;">
            <div style="color:#a6adc8;margin-bottom:6px;font-weight:600;">Stats</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
              <div>Completed: <span id="at-stat-done" style="color:#a6e3a1;">0</span></div>
              <div>Failed: <span id="at-stat-fail" style="color:#f38ba8;">0</span></div>
              <div>Last WPM: <span id="at-stat-wpm" style="color:#89b4fa;">—</span></div>
              <div>Last Acc: <span id="at-stat-acc" style="color:#f9e2af;">—</span></div>
            </div>
            <div style="margin-top:6px;font-size:10px;color:#6c7086;" id="at-current-lesson">
              Current: None
            </div>
          </div>

          <!-- Log Panel -->
          <div style="background:#181825;border-radius:8px;padding:8px;font-size:10px;">
            <div style="color:#a6adc8;margin-bottom:4px;font-weight:600;font-size:11px;">📋 Live Log</div>
            <pre id="at-log" style="color:#cdd6f4;margin:0;max-height:150px;overflow-y:auto;font-family:'Consolas',monospace;white-space:pre-wrap;word-break:break-all;">Waiting for activity...</pre>
          </div>
        </div>
      `;

      document.body.appendChild(this.panel);
      this.bindEvents();
    },

    bindEvents() {
      // WPM slider
      const wpmSlider = document.getElementById('at-wpm');
      wpmSlider.addEventListener('input', () => {
        config.targetWPM = parseInt(wpmSlider.value);
        document.getElementById('at-wpm-val').textContent = config.targetWPM;
      });

      // Accuracy slider
      const accSlider = document.getElementById('at-acc');
      accSlider.addEventListener('input', () => {
        config.targetAccuracy = parseInt(accSlider.value);
        document.getElementById('at-acc-val').textContent = config.targetAccuracy + '%';
      });

      // Error rate slider
      const errSlider = document.getElementById('at-err');
      errSlider.addEventListener('input', () => {
        config.errorRate = parseInt(errSlider.value) / 100;
        document.getElementById('at-err-val').textContent = errSlider.value + '%';
      });

      // Pattern input
      const patternInput = document.getElementById('at-pattern');
      patternInput.addEventListener('change', () => {
        config.speedPatterns = patternInput.value.trim() || 'fixed';
      });

      // Lesson list textarea
      const lessonInput = document.getElementById('at-lessons');
      lessonInput.addEventListener('change', () => {
        config.lessonList = lessonInput.value.trim();
      });

      // Crawl button
      document.getElementById('at-crawl').addEventListener('click', () => {
        if (detectPage() !== 'MENU') {
          Logger.error('UI', 'Must be on menu page to crawl lessons');
          alert('Must be on the menu page to crawl lessons.');
          return;
        }
        crawlLessons();
      });

      // Start button
      document.getElementById('at-start').addEventListener('click', () => {
        this.parseLessonQueue();
        if (state.lessonQueue.length === 0) {
          Logger.error('UI', 'No lessons in queue. Crawl lessons or enter lesson numbers.');
          alert('No lessons in queue. Click "Crawl" on the menu page or enter lesson numbers.');
          return;
        }
        runLessonQueue();
      });

      // Stop button
      document.getElementById('at-stop').addEventListener('click', () => {
        state.running = false;
        if (state.abortController) state.abortController.abort();
        Logger.warn('UI', 'Run stopped by user');
      });

      // Pause button
      document.getElementById('at-pause').addEventListener('click', () => {
        state.paused = !state.paused;
        document.getElementById('at-pause').textContent = state.paused ? '▶ Resume' : '⏸ Pause';
        Logger.info('UI', state.paused ? 'Paused' : 'Resumed');
      });

      // Save button
      document.getElementById('at-save').addEventListener('click', () => {
        saveConfig();
        Logger.ok('UI', 'Configuration saved');
      });

      // Minimize button
      document.getElementById('at-minimize').addEventListener('click', () => {
        const body = document.getElementById('at-body');
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      });

      // Export log button
      document.getElementById('at-export-log').addEventListener('click', () => {
        const text = Logger.export();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => Logger.ok('UI', 'Log copied to clipboard'));
        } else {
          Logger.info('UI', 'Log exported to console');
          console.log(text);
        }
      });
    },

    updateLessonListText(text) {
      const el = document.getElementById('at-lessons');
      if (el) el.value = text;
    },

    updateRunState(running) {
      document.getElementById('at-start').disabled = running;
      document.getElementById('at-stop').disabled = !running;
      document.getElementById('at-pause').disabled = !running;
      document.getElementById('at-crawl').disabled = running;
    },

    updateStats(results) {
      if (results) {
        document.getElementById('at-stat-wpm').textContent = results.wpm ?? '—';
        document.getElementById('at-stat-acc').textContent = (results.accuracy ?? '—') + (results.accuracy ? '%' : '');
      }
      document.getElementById('at-stat-done').textContent = state.completedLessons.length;
      document.getElementById('at-stat-fail').textContent = state.failedLessons.length;
    },

    removeFromList(lessonIndex) {
      const el = document.getElementById('at-lessons');
      if (!el) return;
      const parts = el.value.split(',').map(s => s.trim()).filter(s => s);
      const filtered = parts.filter(p => parseInt(p) !== lessonIndex);
      el.value = filtered.join(',');
      config.lessonList = el.value;
    },

    parseLessonQueue() {
      const text = document.getElementById('at-lessons')?.value || config.lessonList;
      state.lessonQueue = text.split(',')
        .map(s => s.trim())
        .filter(s => s && !isNaN(parseInt(s)))
        .map(s => parseInt(s));
    },
  };

  // ============================================================
  // FOCUS KEEPER
  // ============================================================

  if (config.keepFocus) {
    setInterval(() => {
      if (state.running && document.hidden) {
        Logger.warn('Focus', 'Tab lost focus! WPM will be affected. Click the tab to refocus.');
      }
    }, 5000);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Add floating toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '🤖';
  toggleBtn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 999998;
    width: 48px; height: 48px; border-radius: 50%; background: #89b4fa;
    color: #1e1e2e; border: none; font-size: 22px; cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  toggleBtn.addEventListener('click', () => {
    if (!UI.panel) {
      UI.createPanel();
    } else {
      UI.panel.style.display = UI.panel.style.display === 'none' ? 'block' : 'none';
    }
  });
  document.body.appendChild(toggleBtn);

  // Auto-show panel on first load
  setTimeout(() => {
    UI.createPanel();
    Logger.info('Init', 'AutoTyper loaded. Click the 🤖 button to open controls.');
  }, 1000);

})();
