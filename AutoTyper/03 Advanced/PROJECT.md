# 📋 READ THIS FIRST
**EVERY TIME YOU START WORKING ON THIS PROJECT:**
1. Read this document completely before doing anything
2. Keep it updated after every response
3. Reference it before making decisions
4. Never assume — everything here is from hard-won testing

---

# TAMPERMONKEY AUTOTYPER FOR TYPINGCLUB - PROJECT DOCUMENTATION

## PROJECT GOAL
Build a comprehensive Tampermonkey userscript for TypingClub that:
- Scrapes lesson lists from the menu page
- Auto-completes lessons at a target WPM
- Detects page types (menu, typing lesson, results, video/special)
- Controls WPM and accuracy via configurable settings
- Logs all activity
- Has a floating UI for controls
- Handles special lesson types (pre-typing lessons, hold-key lessons)
- Detects when typing is required vs. auto-completeable
- Navigates between lessons automatically

---

## KEY KNOWLEDGE (DO NOT MODIFY)

### WPM Formula (CONFIRMED)
- TypingClub uses **chars/5** as word count
- **WPM = (chars / 5) / (totalTimeMin)**
- Verified: 54.6 chars/5 / 0.4707 min = 116 WPM at 90ms delay

### Delay-to-WPM Baseline (from Test 1)
| Delay | WPM |
|-------|-----|
| 50ms  | 189 |
| 70ms  | 154 |
| 90ms  | 116 |
| 110ms | 102 |
| 130ms | 84  |
| 150ms | 76  |
| 170ms | 66  |

- **Target WPM ~90**: ~90-95ms delay (interpolated)
- **Variable vs Fixed**: Variable delay produces WPM within ±10 of fixed delay at same average. Pattern (random/ramp/wave) doesn't significantly matter.
- **Error Penalty**: Real errors cost ~4x more than fake errors. 5% real + 5% fake at 70ms = 115 WPM (-39 WPM). 5% fake only = 135 WPM (-19 WPM).
- **Focus Loss**: WPM drops when browser tab loses focus. Script must keep window focused.

### Typing Engine (from Perferences.js)
- **Input selector**: `input[aria-hidden="true"]`
- **Character elements**: `.token span.token_unit`
- Working code dispatches `keydown` and `keyup` events on the hidden input
- The site's actual input handling code is in `Perferences.js`

### Page Detection
- **Menu page**: URL pattern `program-XXX.game`, contains `.lsnrow` elements
- **Typing lesson**: URL pattern `program-XXX/lessonID.play`, has `.token span.token_unit`
- **Results page**: Same URL as lesson (doesn't change!). Detect via `.performance-results`, `.stars-box`, `div[tabindex="3"]` containing "wpm"
- **Video/special lessons**: Need further detection (hold-key, pre-typing)

---

## DOM STRUCTURES

### Menu Page
```
/html/body/div[1]/div[1]/div[3]/div/div[3]/div
  └── <div class="lsnrow active" name="row-0">
        <h2 role="heading">Home Row</h2>
        └── <div class="box-container is_unlocked has_progress" role="button"
              aria-label="Lesson 1, Introduction to Typing." tabindex="101">
              <div class="box">
                <div class="lsn_name" title="Introduction to Typing">Introduction to Typing</div>
                <div class="lsn_num">1</div>
                <div class="boxicon">
                  <div class="lesson_icon e-cmn cmn-intro"></div>
                </div>
                <div class="completion-check"></div>
              </div>
            </div>
              ↓ (next lesson)
              <div class="box-container is_unlocked has_progress" role="button"
                   aria-label="Lesson 2, Keys f & j.You currently have 5 stars in this lesson."
                   tabindex="102">
                <div class="box">
                  <div class="lsn_name" title="Keys f & j">Keys f & j</div>
                  <span title="perfect score" class="platinum-star"></span>
                  <div class="lsn_num">2</div>
                  <div class="boxicon">
                    <div class="lesson_icon e-qwerty qwerty-fj"></div>
                  </div>
                  <div class="stars stars-5"></div>
                </div>
              </div>
```

**Per lesson extractable data:**
- **Row/section name**: `name` attribute on `.lsnrow`, or `<h2>` text
- **Lesson name**: `.lsn_name` text or `title` attribute
- **Lesson number**: `.lsn_num` text
- **Lesson icon**: `.lesson_icon` → all class names (e.g., `e-cmn cmn-intro`, `e-qwerty qwerty-fj`)
- **Star count**: `.stars` class → `stars-X` where X is 0-5
- **Platinum/silver**: `.platinum-star` element present (title="perfect score")
- **Lock status**: `.box-container` classes: `is_unlocked`, `is_locked`, `has_progress`, `is_completed`
- **aria-label**: Contains lesson info + star count text
- **tabindex**: Numeric identifier

### Typing Lesson Page
```
input[aria-hidden="true"]         ← hidden input to dispatch key events
.token span.token_unit             ← character elements to type
```

### Results Page (URL DOES NOT CHANGE from lesson page)
- **Container**: `.performance-results`
- **Star display**: `.stars-box` with `div#star-0` through `div#star-4`
- **Stats text**: `div[tabindex="2"]` → `"Lesson finished. You have earned 5 stars, Your score is 7000"`
- **WPM/accuracy text**: `div[tabindex="3"]` → `"your accuracy was 100%, with real accuracy of 97% and speed of 44 wpm in 78 seconds."`
- **Score**: `div` with `transform-origin: center bottom`
- **Requirements text**: `div[tabindex="4"]`
- **Silver badge**: `.new-highscore` (present only on silver)
- **WPM visual gauge**: `circle.j` with `stroke-dasharray`/`stroke-dashoffset`
- **Detection strategy**: Poll DOM for `.performance-results` or `div[tabindex="3"]` containing "wpm" — URL alone cannot detect transition

### Star Detection (Results Page)
- `yellow-star.png` = **background footprint SVG** — ALWAYS present on all results pages
- `platinum-star.png` = **animated overlay** — present ONLY on silver/high-score lessons
- **Silver detection**: `<image xlink:href="/m/anims/result-star/platinum-star.png">` anywhere on page
- **Access xlink:href**: Must use `getAttribute('xlink:href')` or `getAttributeNS()` — CSS selectors fail on namespaced attributes
- Note: Star detection on results page is NOT needed for the main script. Only WPM/accuracy extraction matters.

---

## URL PATTERNS
- **Menu**: `https://[school].typingclub.com/sportal/program-177.game`
- **Lesson**: `https://[school].typingclub.com/sportal/program-177/50428.play`
- **Results**: **Same URL as lesson** (no redirect)

---

## LESSON ICON CLASSIFICATION (from Test 5)

**78 unique icon types** scraped from program-177.game (1182 lessons, 314 rows)

### Classification by prefix/pattern

| Icon Pattern | Example | Type | Auto-Complete? | Notes |
|---|---|---|---|---|
| `e-qwerty qwerty-*` | `qwerty-fj`, `qwerty-dk`, `qwerty-sl` | **Normal typing** | ✅ Yes | Standard letter-key lessons |
| `e-qwerty qwerty-R-*` | `qwerty-R-fj`, `qwerty-R-dk` | **Review** | ✅ Yes | Review of previous keys |
| `e-qwerty qwerty-C-*` | `qwerty-C-FJ`, `qwerty-C-DK` | **Caps/Shift** | ⚠️ Test | Requires shift/caps key presses |
| `e-qwerty qwerty-numbers` | `qwerty-numbers` | **Number row** | ✅ Probably | Number row typing |
| `e-qwerty qwerty-R-symbols*` | `qwerty-R-symbols2`, `qwerty-r-symbols` | **Symbols** | ⚠️ Test | Symbol/shift combinations |
| `cmn-video` | `cmn-video` | **Video lesson** | ❌ SKIP | Cannot auto-complete |
| `cmn-game1`-`cmn-game5`, `cmn-G3` | `cmn-game1`, `cmn-G3` | **Games** | ⚠️ Test | Different mechanics |
| `cmn-practice` | `cmn-practice` | **Practice** | ✅ Probably | Practice sessions |
| `cmn-intro`, `cmn-home2`, `cmn-Hand-*`, `cmn-sit-straight2`, `cmn-think-ideas2`, `cmn-travel1`, `cmn-qwerty-history`, `cmn-take-break`, `cmn-space-tab3`, `cmn-default`, `cmn-tip`, `cmn-fastest-typist4`, `cmn-dynamic`, `cmn-symbols2`, `cmn-code`, `cmn-drum`, `cmn-definition`, `cmn-guide2`, `cmn-symbols`, `cmn-celebration` | Various | **Info/Special** | ⚠️ Test | Informational, posture, tips |

### Key decisions for main script:
- **Auto-complete**: All `e-qwerty` prefix lessons (typing, review, caps, symbols, numbers)
- **Skip**: `cmn-video` (can't type through video)
- **Test first**: `cmn-game*`, `cmn-practice`, `cmn-space-tab3`, `cmn-code`, `cmn-drum`, `cmn-definition`
- **Probably skip**: All `cmn-*` info lessons (posture, tips, history, celebrations, guides)

---

## TESTS COMPLETED

### Test 1: Delay/WPM Calibration ✅
- **File**: `TEST_1_Delay_WPM.js`
- **Purpose**: Establish delay-to-WPM mapping
- **Results**: See baseline table above

### Test 2: Click/Navigation ✅
- **File**: `TEST_2_Click_Simulation.js`
- **Purpose**: Test click methods, navigation, URL patterns
- **Results**: URL patterns confirmed, clickable elements found

### Test 3: Page Detection ✅
- **File**: `TEST_3_Page_Detection.js`
- **Purpose**: Detect page types (menu, lesson, results, video)
- **Bug fixed**: `id_patterns` → `idPatterns` (typo causing silent failure)
- **Results**: Menu page detected with HIGH confidence, ~1185 `[role="button"]` elements

### Test 4: WPM/Accuracy Extractor ✅
- **File**: `TEST_4_Star_Detection.js` (repurposed)
- **Purpose**: Extract WPM and accuracy from results page
- **Removed**: All star detection on completion page (useless for main script)
- **Kept**: `div[tabindex="3"]` parsing for WPM, accuracy, real accuracy, duration

### Test 5: Menu Page DOM Scraper ✅
- **File**: `TEST_5_DOM_Scraper.js`
- **Purpose**: Scrape all lessons from menu page (names, icons, stars, status)
- **Results**: Successfully scraped 314 rows, 1182 lessons from program-177.game
  - 78 unique lesson icon types found
  - 3 status types: `unlocked`, `has_progress`, `platinum`
  - Star classes: `(none)`, `stars-0`, `stars-1`, `stars-5`
  - See "Lesson Icon Classification" section below for full breakdown

---

## BUGS & FIXES

### 6. Crawl includes game lessons and 5-star completed lessons (FIXED)
- **Cause**: `isAutoCompleteable` included `cmn-game` and `cmn-G3` which don't work. Crawl only checked `isPlatinum`, not `starCount === 5`.
- **Fix**: Changed `isAutoCompleteable` to ONLY `iconClass.startsWith('e-qwerty')`. Added `starCount !== 5` filter to crawl and runner.

### 7. Logger not visible / no logging feature (FIXED)
- **Cause**: Logger used complex method chaining. No UI-visible log output.
- **Fix**: Simplified Logger to direct `_output()` method. Added live log panel in UI (`<pre id="at-log">`). Added 📋 Export Log button.

### 1. Test 3 produced no output
- **Cause**: Variable declared as `idPatterns` but referenced as `id_patterns` on line 73
- **Fix**: Changed `id_patterns` → `idPatterns`

### 2. Test 4 silver detection broken
- **Cause**: `querySelectorAll('image[xlink\\:href]')` doesn't work — colon in `xlink:href` is a namespaced attribute
- **Fix**: Query all `<image>` elements and use `getAttribute('xlink:href')` or `getAttributeNS('http://www.w3.org/1999/xlink', 'href')`

### 3. Test 4 showed both yellow and platinum stars
- **Cause**: `yellow-star.png` is the background footprint SVG (always present). `platinum-star.png` is the animated overlay.
- **Fix**: Yellow is irrelevant background. Only check for `platinum-star.png` presence → silver
- **Resolution**: Entire results-page star detection removed from main script (useless). Only WPM/accuracy extraction kept.

### 4. [TO BE FIXED] Test 3 still needs manual navigation behavior testing
- Still needs: behavior when navigating between page types

### 5. [TODO] Special lesson types need detection
- Pre-typing lessons, hold-key lessons, click-specific lessons
- Need typing detection: determine if a lesson requires manual input

---

## TODO LIST

### Immediate
- [x] Run Test 5 on menu page and collect results
- [x] Define UI requirements (lesson list textbox, crawl button, WPM slider, pattern selector)
- [x] Build main Tampermonkey script
- [x] Build lesson tester script (test all lessons, log failures)
- [ ] Test main script on actual lessons
- [ ] Run lesson tester and collect failed icons

### Main Script Requirements
- [x] Floating UI with WPM/accuracy controls
- [x] Lesson list textbox (comma-separated lesson IDs)
- [x] Crawl button to auto-populate lesson list from menu page
- [x] Speed pattern selector (fixed, random, wave, ramp, custom combo)
- [x] Menu page scraper to build lesson list
- [x] Lesson click + auto-complete engine
- [x] WPM-controlled typing simulation (from Test 1 data)
- [x] Results page detection (DOM polling, not URL)
- [x] WPM/accuracy verification after each lesson
- [x] Special lesson detection (timeout + no progress → skip + log icon)
- [x] Advanced logging (detailed output for failures: icon, error type, DOM state)
- [x] On-lesson-complete: remove from list, auto-advance to next
- [x] Logging system
- [x] Auto-navigation between lessons

### Testing Needed
- [ ] Test on actual lesson completion (verify WPM matches predictions)
- [ ] Test special lesson types
- [ ] Test navigation between menu → lesson → results → menu → next lesson
- [ ] Test floating UI in Tampermonkey
- [ ] Test focus loss behavior (keep window focused)

---

## ARCHITECTURE PLAN FOR MAIN SCRIPT

```
// USER CONFIG (floating UI)
{
  targetWPM: adjustable via UI slider/input,
  accuracy: adjustable via UI,
  errorRate: adjustable (fake errors only),
  speedPattern: configurable — wave, random, ramp, or custom combo,
  lessonList: text box — user enters lesson IDs (comma-separated) or clicks "Crawl" to auto-populate,
  onLessonComplete: remove completed lesson from list, auto-advance to next,
  advancedLogging: detailed console output for failures (lesson icon, error type, DOM state)
}

// MODULES
1. Floating UI (settings panel, lesson list textbox, crawl button, start/stop, stats, WPM slider, pattern selector)
2. Lesson Crawler (scrapes menu page, filters auto-completeable lessons, populates lesson list)
3. Page Detector (menu vs lesson vs results vs special — DOM polling, not URL)
4. Typing Engine (dispatch key events at controlled WPM with configurable speed patterns)
5. Results Parser (extract WPM/accuracy from div[tabindex="3"], compare to targets)
6. Navigation (click lessons, detect completion, remove from list, advance)
7. Special Lesson Detector (detect if lesson has no typing engine after timeout, log icon, skip)
8. Lesson Tester (separate test script — runs through all lessons, logs which fail, outputs icon codes to avoid)
9. Logger (record every action, result, failure with full context)

// LESSON CRAWL FILTER
- Include: e-qwerty* lessons (typing, review, caps, numbers, symbols)
- Include: cmn-practice, cmn-game* (test first)
- Skip: cmn-video (can't type)
- Skip: cmn-* info lessons (intro, tips, posture, history, etc.)
- After crawl: user can manually remove any from the list

// SPECIAL LESSON DETECTION
- After clicking lesson, wait X seconds for .token span.token_unit to appear
- If not found, log: lesson number, icon class, aria-label, timeout duration
- Attempt typed characters — if no progress after Y chars, skip
- Add failed lesson icon to skip list for future runs

// SPEED PATTERNS
- Fixed: constant delay
- Random: delay ± variance
- Wave: slow → fast → slow cycle
- Ramp: start fast, gradually slow (or vice versa)
- Custom combo: user chains multiple patterns (e.g., "random 30% + wave 40% + ramp 30%")
```

---

## SCRIPT FILES
- `PROJECT.md` - This file (project documentation)
- `AUTOTYPER_MAIN.user.js` - **Main Tampermonkey script** (floating UI, crawler, typing engine, auto-advance)
- `LESSON_TESTER.js` - **Lesson tester** (tests all lessons, logs failed icons to skip)
- `TEST_1_Delay_WPM.js` - WPM calibration test ✅
- `TEST_2_Click_Simulation.js` - Click/navigation test ✅
- `TEST_3_Page_Detection.js` - Page type detection ✅
- `TEST_4_Star_Detection.js` - WPM/accuracy extractor (repurposed) ✅
- `TEST_5_DOM_Scraper.js` - Menu page scraper ✅
- `TEST_5_RESULTS.md` - Full Test 5 console output
- `TEST_RESULTS_TEMPLATE.md` - Consolidated test results
- `Perferences.js` - Working typing engine reference

---

*Last updated: 2026-04-14*
