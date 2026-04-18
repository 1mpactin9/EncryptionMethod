# 📋 AUTO TYPER — INTERMEDIATE REBUILD — MASTER PLAN

**READ THIS FIRST — EVERY TIME:**
1. Read this document completely before doing anything
2. Keep it updated after every response
3. Reference it before making decisions
4. Never assume — everything here is from hard-won testing

---

## PROJECT IDENTITY

| Field | Value |
|---|---|
| **Name** | TypingClub AutoTyper — Intermediate Rebuild |
| **Type** | Tampermonkey Userscript |
| **Target** | TypingClub Old Version (this does not change the url, it is within user interface) |
| **NOT Compatible** | New TypingClub version (blocks script injection only) |
| **Reference Files** | `REF_InitialScript.js` → `REF_LatestScript.js`, `REF_Perferences.js` |
| **Previous Version** | `03 Advanced/AUTOTYPER_MAIN.user.js` (v1.0.0, 931 lines) |
| **Goal** | Rebuild from scratch with proper testing, modular architecture, and comprehensive error handling |

---

## PART 1: HARD KNOWLEDGE (DO NOT MODIFY — FROM TESTING)

### 1.1 WPM Formula (CONFIRMED — Test 1)

```
WPM = (chars / 5) / (totalTimeMinutes)
msPerChar = (5 / (WPM * 60)) * 1000 = 12000 / WPM
```

**Verified:** 54.6 chars/5 / 0.4707 min = **116 WPM at 90ms delay** ✅

### 1.2 Delay-to-WPM Baseline (Test 1, Fixed Delay, 0% Errors)

| Delay | Actual WPM | Notes |
|-------|-----------|-------|
| 50ms  | 189 | Fast |
| 70ms  | 154 | Medium-fast |
| 90ms  | 116 | Medium — WPM starts high, declines to end |
| 110ms | 102 | Medium-slow |
| 130ms | 84  | Slow |
| 150ms | 76  | Very slow — WPM stable |
| 170ms | 66  | Extra slow — WPM stable |

**Key observations from Test 1:**
- Consistent speed = higher WPM; inconsistent = slightly slower
- WPM drops when browser tab loses focus (window blur)
- WPM starts high at lesson start, then slowly declines (running average effect)
- At 150ms and 170ms, WPM values were very consistent (only 1-2 variance)
- **Target WPM ~90**: ~90-95ms delay (interpolated)

### 1.3 Error Penalty Analysis (Test 1, Phase 2)

| Config | WPM | Penalty vs Baseline |
|--------|-----|---------------------|
| 70ms fixed, 0% error | 154 | baseline |
| 70ms, 3% fake (10 errors) | 139 | **-15 WPM** |
| 70ms, 5% fake (14 errors) | 135 | **-19 WPM** |
| 70ms, 5% real + 5% fake | 115 | **-39 WPM** |

**Critical:** Real errors cost ~4x more than fake errors because the wrong character stays typed.

### 1.4 Variable Delay vs Fixed (Test 1, Phase 3)

| Pattern | Avg Delay | WPM | vs Fixed |
|---------|-----------|-----|----------|
| Random (40-100ms) | 70.8ms | 148 | -6 vs 70ms fixed |
| Random (60-140ms) | 100.7ms | 108 | +6 vs 110ms fixed |
| Ramp (40-120ms) | 80ms | 133 | +8 vs interpolated |
| Wave (40-120ms) | 80.4ms | 131 | +6 vs interpolated |

**Conclusion:** Variable delay produces WPM within ±10 of fixed delay at same average. Pattern (random/ramp/wave) doesn't significantly matter.

### 1.5 TypingClub's Word Definition

- Lesson: 273 chars, 54.6 "standard words" (chars/5), 45 real words (space-separated)
- At 90ms delay (28.24s): 54.6 / (28.24/60) = **116.0 WPM** ✅ **Matches exactly**
- **TypingClub uses the standard definition: 1 word = 5 characters (including spaces)**

---

### 1.6 Typing Engine (from REF_Perferences.js)

```javascript
// Working typing engine
const input = document.querySelector('input[aria-hidden="true"]');
const chars = document.querySelectorAll('.token span.token_unit');

// Key dispatch (keydown + keyup on the hidden input)
input.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
input.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));

// Special handling for Enter, Space, Backspace
// Enter: code = "Enter", keyCode = 13
// Space: code = "Space", key = " ", keyCode = 32
// Backspace: code = "Backspace", keyCode = 8, inputType = "deleteContentBackward"
```

**Character extraction:**
```javascript
const char = el.textContent[0];
// Handle non-breaking space:
if (char === "\u00A0") return " ";
// Handle Enter:
if (el.firstChild?.classList?.contains("_enter") || el.classList.contains("_enter")) return "\n";
```

**Old version only:** The new version of TypingClub blocks these scripts. Only works on old version.

### 1.7 URL Patterns

| Page Type | URL Pattern | Notes |
|---|---|---|
| **Menu** | `https://[school].typingclub.com/sportal/program-177.game` | Contains `.lsnrow` elements |
| **Lesson** | `https://[school].typingclub.com/sportal/program-177/50428.play` | Has `.token span.token_unit` |
| **Results** | **SAME as lesson URL** | No URL change! Detect via DOM |

### 1.8 Page Detection Results (Test 3)

| Page Type | Detection Method | Confidence |
|---|---|---|
| **Menu** | URL `program-XXX.game` + `.lsnrow` elements | 80% |
| **Lesson** | URL `.play` + `input[aria-hidden="true"]` + `.token span.token_unit` | 90% |
| **Results** | `.performance-results` OR `div[tabindex="3"]` containing "wpm" | — |
| **Special** | Anything else (video, info, etc.) | — |

**Important:** Results page URL does NOT change. Must use DOM polling.

---

### 1.9 DOM Structures (VERIFIED)

#### Menu Page Structure
```
/html/body/div[1]/div[1]/div[3]/div/div[3]/div
  └── <div class="lsnrow active" name="row-0">
        <h2 role="heading">Home Row</h2>
        └── <div class="box-container is_unlocked has_progress"
              role="button" aria-label="Lesson 1, Introduction to Typing."
              tabindex="101">
              <div class="box">
                <div class="lsn_name" title="Introduction to Typing">Introduction to Typing</div>
                <div class="lsn_num">1</div>
                <div class="boxicon">
                  <div class="lesson_icon e-cmn cmn-intro"></div>
                </div>
                <div class="completion-check"></div>
              </div>
            </div>
```

**Per lesson extractable data:**
- **Row/section name**: `name` attribute on `.lsnrow`, or `<h2>` text
- **Lesson name**: `.lsn_name` text or `title` attribute
- **Lesson number**: `.lsn_num` text
- **Lesson icon**: `.lesson_icon` → all class names
- **Star count**: `.stars` class → `stars-X` where X is 0-5
- **Platinum/silver**: `.platinum-star` element present
- **Lock status**: `.box-container` classes: `is_unlocked`, `is_locked`, `has_progress`, `is_completed`
- **aria-label**: Contains lesson info + star count text
- **tabindex**: Numeric identifier (not global index)

#### Typing Lesson Page
```
input[aria-hidden="true"]         ← hidden input to dispatch key events
.token span.token_unit             ← character elements to type
```

#### Results Page
- **Container**: `.performance-results`
- **Stats text**: `div[tabindex="2"]` → `"Lesson finished. You have earned 5 stars, Your score is 7000"`
- **WPM/accuracy text**: `div[tabindex="3"]` → `"your accuracy was 100%, with real accuracy of 97% and speed of 44 wpm in 78 seconds."`
- **Detection strategy**: Poll DOM for `.performance-results` or `div[tabindex="3"]` containing "wpm"

---

### 1.10 Lesson Icon Classification (Test 5 — 78 unique types, 1182 lessons)

| Icon Pattern | Type | Auto-Complete? | Confidence |
|---|---|---|---|
| `e-qwerty qwerty-*` | Normal typing (fj, dk, sl, etc.) | ✅ YES | Tested & confirmed |
| `e-qwerty qwerty-R-*` | Review lessons | ✅ YES | Tested & confirmed |
| `e-qwerty qwerty-C-*` | Caps/Shift lessons | ⚠️ ASSUME YES | Not individually tested |
| `e-qwerty qwerty-numbers` | Number row | ⚠️ ASSUME YES | Not individually tested |
| `e-qwerty qwerty-R-symbols*` | Symbols | ⚠️ ASSUME YES | Not individually tested |
| `cmn-video` | Video lesson | ❌ SKIP | Confirmed cannot type |
| `cmn-game1`-`cmn-game5`, `cmn-G3` | Games | ❌ SKIP | Confirmed don't work |
| `cmn-practice` | Practice | ⚠️ UNTESTED | Probably works |
| All other `cmn-*` | Info/special/posture/tips | ❌ SKIP | Different mechanics |

**Current main script filter:** `isAutoCompleteable = iconClass.includes('e-qwerty')` only.

---

### 1.11 Menu Container Selector (VERIFIED — Test 5)

```javascript
// Exact selector that works:
const container = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
```

---

## PART 2: KNOWN BUGS & FIXES (HISTORY)

| # | Bug | Status | Fix |
|---|---|---|---|
| 1 | Test 3: `id_patterns` → `idPatterns` typo | ✅ Fixed | Variable name corrected |
| 2 | Test 4: `xlink:href` selector broken | ✅ Fixed | Use `getAttribute('xlink:href')` |
| 3 | Test 4: yellow-star always present | ✅ Fixed | Only check platinum-star.png |
| 4 | Test 3: Manual navigation behavior untested | 🔴 OPEN | Need to test menu→lesson→results→menu cycle |
| 5 | Special lesson detection incomplete | 🔴 OPEN | Pre-typing, hold-key, click-specific lessons |
| 6 | Crawl includes games + 5-star lessons | ✅ Fixed | Filter to `e-qwerty` only, exclude `starCount === 5` |
| 7 | Logger not visible in UI | ✅ Fixed | Direct `_output()` + `<pre id="at-log">` panel |

---

## PART 3: REFERENCE SCRIPT EVOLUTION

### REF_InitialScript.js (V4 — Initial attempt)
- **Issue:** Keyboard events blocked by newer TypingClub
- **Lesson learned:** Must use `input[aria-hidden="true"]` specifically

### REF_SecondaryScript.js (V4 — Manual control)
- **Improvement:** Added real accuracy + fake accuracy controls
- **Key feature:** Human-like delay variation (`getHumanDelay()`)
- **Working:** Confirmed working on old version

### REF_TertiaryScript.js (V4 — Refined)
- **Improvement:** Better space/Enter handling
- **Key insight:** `inputField.value` must be updated alongside events
- **Status:** Working but basic (fixed 100ms delay)

### REF_LatestScript.js (V4 — Advanced)
- **Improvement:** WPM-based config instead of delay
- **Key feature:** `calculateDelay()` converts targetWPM to ms
- **Accuracy:** Fake errors with backspace recovery
- **Status:** Working, 90-110 WPM range

### REF_Perferences.js (The typing engine reference)
- **Purpose:** Shows how TypingClub handles key input
- **Key selectors:** `input[aria-hidden="true"]`, `.token span.token_unit`
- **Events:** `keydown`, `input`, `keyup`
- **Note:** File name is intentional (site's actual file name)

---

## PART 4: WHAT THE CURRENT ADVANCED SCRIPT DOES WELL

The `AUTOTYPER_MAIN.user.js` (931 lines) in `03 Advanced` implements:
1. ✅ Floating UI (Catppuccin Mocha theme, draggable)
2. ✅ WPM/Accuracy/Error Rate sliders
3. ✅ Speed patterns (fixed, random, wave, ramp, rampDown, combo)
4. ✅ Menu scraper with lesson filtering
5. ✅ Crawl button to auto-populate lesson list
6. ✅ Lesson executor with typing engine
7. ✅ Results parser (WPM/accuracy extraction)
8. ✅ Auto-advance between lessons
9. ✅ Abort/Pause/Resume controls
10. ✅ Live log panel + export
11. ✅ GM_setValue/GM_getValue persistence
12. ✅ Special lesson detection + skip list

---

## PART 5: WHAT NEEDS IMPROVEMENT (REBUILD FOCUS)

### 5.1 Critical Gaps
| Issue | Impact | Priority |
|---|---|---|
| **No end-to-end testing** | Script may fail silently in production | 🔴 P0 |
| **Navigation between lessons untested** | Menu→lesson→results→menu chain may break | 🔴 P0 |
| **Special lesson types not handled** | Script hangs on videos, info, hold-key | 🟡 P1 |
| **Focus loss behavior untested** | WPM drops when tab is backgrounded | 🟡 P1 |
| **Character extraction unreliable** | `el.textContent.trim()` may miss special chars | 🟡 P1 |
| **No retry mechanism** | Single failure = lesson marked failed forever | 🟡 P1 |
| **No progress indicator during typing** | User has no visual feedback | 🟢 P2 |

### 5.2 Architecture Issues
| Issue | Impact | Priority |
|---|---|---|
| **Monolithic file** (931 lines, single IIFE) | Hard to test individual modules | 🟡 P1 |
| **ScrapeMenuLessons re-scrapes on every lesson** | Inefficient, DOM may change mid-run | 🟡 P1 |
| **No mock/test mode** | Can't test without being on TypingClub | 🟡 P1 |
| **UI hardcoded inline HTML** | Hard to maintain, no separation of concerns | 🟢 P2 |

---

## PART 6: REBUILD PLAN — PHASED APPROACH

### Phase 0: Foundation (DONE — this document)
- [x] Consolidate all test data
- [x] Document all known knowledge
- [x] Identify gaps and bugs
- [x] Define architecture

### Phase 1: Test Harness (NEW — must do first)
Create a test runner that can validate each module independently:
- [ ] `TEST_HARNESS.js` — Console-based test runner
- [ ] Mock DOM for offline testing
- [ ] Module-level test functions
- [ ] Results output to console + file

### Phase 2: Core Engine Rebuild
Rebuild the typing engine with improvements from reference scripts:
- [ ] **TypingEngine**: Use REF_LatestScript.js proven key dispatch
- [ ] **CharacterExtractor**: Handle Enter, Space, non-breaking space properly
- [ ] **SpeedController**: Time-compensating delay (like REF_LatestScript `getNextDelay`)
- [ ] **ErrorInjector**: Configurable fake error with backspace recovery

### Phase 3: Navigation & Flow
- [ ] **MenuScraper**: Robust lesson extraction
- [ ] **PageDetector**: DOM polling, not URL
- [ ] **Navigator**: Menu→lesson→results→menu cycle
- [ ] **ResultsParser**: WPM/accuracy extraction + validation
- [ ] **SpecialDetector**: Timeout-based detection for non-typing lessons

### Phase 4: UI & Controls
- [ ] Floating panel (keep Catppuccin theme)
- [ ] Lesson list with visual progress
- [ ] WPM live display during typing
- [ ] Exportable logs

### Phase 5: Testing Campaign
Run systematic tests on actual TypingClub:
- [ ] Test 6: End-to-end single lesson
- [ ] Test 7: Multi-lesson queue
- [ ] Test 8: Special lesson types
- [ ] Test 9: Focus loss behavior
- [ ] Test 10: WPM accuracy at various targets

---

## PART 7: TEST PLAN (DETAILED)

### Test 6: End-to-End Single Lesson
**Goal:** Verify complete lesson flow works
**Setup:** Manual lesson with known target WPM
**Steps:**
1. Navigate to a simple e-qwerty lesson (e.g., "Keys f & j")
2. Set target WPM = 90, errorRate = 0%
3. Start script
4. Verify: characters typed correctly, results show ~90 WPM
**Pass criteria:** WPM within ±10 of target, accuracy ≥ targetAccuracy
**Log output:** WPM, accuracy, chars typed, time elapsed

### Test 7: Multi-Lesson Queue
**Goal:** Verify queue processing + auto-advance
**Setup:** 3 consecutive e-qwerty lessons
**Steps:**
1. Enter "50,51,52" in lesson list
2. Start from menu page
3. Verify: each lesson completes, navigation returns to menu
**Pass criteria:** All 3 lessons complete, queue emptied, no hangs
**Log output:** Per-lesson WPM, pass/fail, navigation success

### Test 8: Special Lesson Types
**Goal:** Verify script skips non-typing lessons
**Setup:** Known cmn-video, cmn-game, cmn-intro lessons
**Steps:**
1. Crawl lessons (should auto-filter to e-qwerty only)
2. Manually add a known cmn-* lesson ID
3. Start script
4. Verify: special lessons detected, skipped, logged
**Pass criteria:** Special lessons skipped with icon logged, no hangs
**Log output:** Skipped lesson icon, name, reason

### Test 9: Focus Loss Behavior
**Goal:** Verify WPM impact when tab loses focus
**Steps:**
1. Run lesson at target WPM = 90
2. Mid-lesson, switch to another tab for 5 seconds
3. Switch back, let lesson complete
4. Verify: WPM recorded vs expected
**Pass criteria:** Script warns about focus loss, WPM impact logged
**Log output:** Focus loss event, WPM delta

### Test 10: WPM Accuracy Calibration
**Goal:** Verify delay-to-WPM conversion is correct
**Steps:**
1. Test at WPM targets: 60, 80, 100, 120, 150
2. Record actual WPM from results page
3. Compare to Test 1 baseline
**Pass criteria:** Actual WPM within ±10 of predicted (from Test 1 interpolation)
**Log output:** Target vs actual WPM table

---

## PART 8: MODULE ARCHITECTURE (TARGET)

```
AUTOTYPER_MAIN.user.js
├── Config          — defaults, load/save, validation
├── State           — running, paused, queue, stats
├── Logger          — console + UI panel, export
├── TypingEngine    — key dispatch, character extraction
├── SpeedController — delay calculation, speed patterns
├── ErrorInjector   — fake errors, backspace recovery
├── MenuScraper     — lesson extraction, filtering
├── PageDetector    — menu/lesson/results/special
├── Navigator       — click lessons, return to menu
├── ResultsParser   — WPM/accuracy extraction
├── SpecialDetector — timeout-based non-typing detection
├── LessonRunner    — queue processing, retry logic
├── UI              — floating panel, controls, stats
└── Init            — bootstrap, toggle button
```

---

## PART 9: SCRIPT FILES IN THIS FOLDER

| File | Purpose | Status |
|---|---|---|
| `PROJECT.md` | This file — master plan | ✅ Updated |
| `AUTOTYPER_MAIN.user.js` | Main Tampermonkey script (from Advanced) | ⚠️ Needs rebuild |
| `LESSON_TESTER.js` | Lesson tester script (from Advanced) | ✅ Working |
| `REF_InitialScript.js` | V4 initial attempt (reference) | 📖 Reference |
| `REF_SecondaryScript.js` | V4 manual control (reference) | 📖 Reference |
| `REF_TertiaryScript.js` | V4 refined (reference) | 📖 Reference |
| `REF_LatestScript.js` | V4 WPM-based (reference) | 📖 Reference |
| `REF_Perferences.js` | Typing engine reference | 📖 Reference |
| `TEST_1_Delay_WPM.js` | WPM calibration | ✅ Tested |
| `TEST_2_Click_Simulation.js` | Click/navigation test | ✅ Tested |
| `TEST_3_Page_Detection.js` | Page type detection | ✅ Tested |
| `TEST_4_Star_Detection.js` | WPM/accuracy extractor | ✅ Tested |
| `TEST_5_DOM_Scraper.js` | Menu scraper | ✅ Tested |
| `TEST_5_RESULTS.md` | Test 5 raw output | 📖 Data |
| `TEST_RESULTS_TEMPLATE.md` | Test results template | 📖 Template |

---

## PART 10: DECISION LOG

| Date | Decision | Reason |
|---|---|---|
| 2026-04-14 | Only `e-qwerty` lessons auto-completeable | Games (cmn-game, cmn-G3) confirmed not working |
| 2026-04-14 | Results detection via DOM, not URL | URL doesn't change after lesson completion |
| 2026-04-14 | Fake errors only (no real errors) | Real errors cost 4x more WPM |
| 2026-04-14 | Variable delay patterns acceptable | ±10 WPM vs fixed, pattern doesn't matter |
| 2026-04-15 | Rebuild in Intermediate, not patch Advanced | Need systematic testing from ground up |
| 2026-04-15 | Test harness must be built first | Can't trust code without validation |

---

## PART 11: IMMEDIATE TODO

### Right Now
- [ ] Review this plan and confirm approach
- [ ] Build TEST_HARNESS.js (modular test runner)
- [ ] Run Test 6 (single lesson end-to-end)

### This Session
- [ ] Fix character extraction (use REF_LatestScript proven method)
- [ ] Add time-compensating speed control (like REF_LatestScript)
- [ ] Test navigation cycle (menu→lesson→results→menu)

### Next Sessions
- [ ] Full testing campaign (Tests 6-10)
- [ ] Handle special lesson types properly
- [ ] Add retry mechanism for failed lessons
- [ ] Add live progress indicator

---

*Last updated: 2026-04-15 — Intermediate Rebuild Initiated*
