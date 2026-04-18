# Test Results Template

**Instructions:** Run each test script on TypingClub and fill in the results below. Copy this template and fill it out for each test you run.

---

## General Information

**Date:** April 14, 2026

**TypingClub Version:** Old

**Browser:** [Chrome/Edge/Firefox?]

**Program URL:** https://qsiszsc.typingclub.com/sportal/program-177/50572.play

---

## TEST 1: Controlled Delay to WPM Calibration

**IMPORTANT:** Use the SAME lesson for ALL tests. Do not switch lessons.

**Instructions:** Run `TEST_1_Delay_WPM.js` on a lesson page. The script will first analyze the lesson (count words, characters, keystrokes). Then run the test phases below. **Reload the lesson page between each test** to reset.

### Phase 0: Lesson Content Analysis

After running the script once, it will output the lesson analysis. Copy it here:

```
Total Characters: 273
Total Words (space-separated): 45
Standard Words (chars/5): 54.6
Lines: 1 (I think it will say 1 regardless)
Spaces: 43
Correct Keystrokes (no errors): 273
Keystrokes per error (wrong + backspace): +2
```

### Phase 1: Fixed Delay, 100% Accuracy (Baseline)

**Run each test, reload page between each. This establishes the clean delay→WPM mapping.**

| Delay (ms) | Expected WPM (theoretical) | Actual WPM (from page) | Elapsed Time | Notes |
|------------|---------------------------|------------------------|--------------|-------|
| 50ms | 240 | 189 | 17.39s | Fast |
| 70ms | 171.4 | 154 | 21.34s | Medium-fast |
| 90ms | 133.3 | 116 | 28.24s | Medium |
| 110ms | ETT30.0s | 102 | 32.08s | Medium-slow |
| 130ms | ETT35.5 | 84 | 39.05s | Slow |
| 150ms | 80 | 76 | 42.99s | Very slow |
| 170ms | ETT46.4s | 66 | 49.70s | Extra slow |

Expected WPM doesn't show for some, I will enter Estimated Total Time (ETT)

Also for 90 and 110, the WPM started going high up at the very very start, but then started slowing declining until the end. For 150 and 170 the WPM were very close, just one or two varying.

What I have noticed, consistent speed equals higher WPM, inconsistent equals slightly slower, WPM will lower if I lose focus on the window (prob it slows when I change, doesn't happen if I don't), just observation don't really take in mind, might mess up

### Phase 2: Fixed Delay with Errors

**Measures WPM penalty from mistakes. Uses same delay, varies error rate.**

| Delay (ms) | Error Rate | Actual WPM | Errors Made | Notes |
|------------|-----------|------------|-------------|-------|
| 70ms | 97% | 139 | 10 fake errors | |
| 70ms | 95% | 135 | 14 fake errors | |
| 70ms | 95% fake 85% real | 115 | 14 real 27 fake | |
| 110ms | 5% (~95% accuracy) | [FILL IN] | [from script] | Slower base |???

### Phase 3: Variable Delay

**Measures WPM impact of speed fluctuation within a lesson.**

| Min Delay | Max Delay | Pattern | Actual WPM | Avg Delay Used | Notes |
|-----------|-----------|---------|------------|----------------|-------|
| 40ms | 100ms | random | 148 | 70.8 | Avg should be ~70ms |
| 60ms | 140ms | random | 108 | 100.7 | Avg should be ~100ms |
| 40ms | 120ms | ramp (slow→fast→slow) | 133 | 80 | |
| 40ms | 120ms | wave (alternating) | 131 | 80.4 | Personally think that the WPM is slightly dependent on the very last wpm speed |

### Key Observations

**How much does each error type affect WPM?**
- 3% fake errors (delay 70): 154 WPM (baseline) → 139 WPM = **-15 WPM penalty** (10 fake errors)
- 5% fake errors (delay 70): 154 WPM (baseline) → 135 WPM = **-19 WPM penalty** (14 fake errors)
- 5% real + 4.75% fake (delay 70): 154 WPM (baseline) → 115 WPM = **-39 WPM penalty** (14 real + 27 fake errors)

**Real errors are MUCH more costly than fake errors** because the wrong character stays typed, requiring the user to manually correct or accept the error.

**How does variable delay compare to fixed delay at the same average?**
- Variable avg 70.8ms vs Fixed 70ms: 148 WPM vs 154 WPM = **-6 WPM** (variable is slightly slower)
- Variable avg 100.7ms vs Fixed ~110ms: 108 WPM vs 102 WPM = **+6 WPM** (variable is slightly faster here)
- Variable avg 80ms (ramp) vs Fixed ~80ms interpolated (~125 WPM): 133 WPM = **+8 WPM** (ramp is faster)
- Variable avg 80.4ms (wave) vs Fixed ~80ms interpolated (~125 WPM): 131 WPM = **+6 WPM** (wave is faster)

**Conclusion:** Variable delay produces WPM very close to fixed delay at the same average, within ±10 WPM. Ramp and wave patterns may give slightly higher WPM than random variation.

**Does the ramp pattern (slow start, fast middle, slow end) affect WPM differently than random?**
Ramp (133 WPM) and wave (131 WPM) performed nearly identically at avg ~80ms. Both were slightly better than random at similar averages. This suggests patterned variation is fine to use.

**What is TypingClub's actual "word" definition?**
- Lesson has 273 chars, 54.6 "standard words" (chars/5), and 45 real words (space-separated)
- At 90ms delay (28.24s), actual WPM = 116. If using chars/5: 54.6 / (28.24/60) = 116.0 ✅ **Matches exactly!**
- **TypingClub uses the standard definition: 1 word = 5 characters (including spaces).**

**What I have noticed:**
- Consistent speed equals higher WPM, inconsistent equals slightly slower
- WPM will lower if I lose focus on the window (prob it slows when I change tab, doesn't happen if I stay focused)
- WPM started going high at the very start for 90ms and 110ms tests, then slowly declined until the end (TypingClub calculates running average, so early speed affects the final number)
- For 150ms and 170ms, WPM values were very close (76 vs 66), only 1-2 varying

---

## TEST 2: Click Simulation & Navigation

**Instructions:** Run `TEST_2_Click_Simulation.js` on the menu page and follow the console instructions.

### URL Pattern Detection

**Menu Page URL Pattern:**
```
https://[school].typingclub.com/sportal/program-[programID].game
```

Confirmed: `https://qsiszsc.typingclub.com/sportal/program-177.game`

**Lesson Page URL Pattern:**
```
https://[school].typingclub.com/sportal/program-[programID]/[lessonID].play
```

Confirmed: `https://qsiszsc.typingclub.com/sportal/program-177/50572.play`

Note: The programID (177) and lessonID (50572) are arbitrary numbers, not sequential. Navigation is done by clicking elements on the menu page, not by constructing URLs manually.

**Other URL Patterns Observed:**
None yet.

### Clickable Elements

**Did the script find clickable lesson elements?** YES

**What the script found:**

| Selector | Count | Sample Text | Has Onclick |
|----------|-------|-------------|-------------|
| `a` | 13 | 'Jump to Main Content' | false |
| `button` | 1 | 'Toggle navigation' | true |
| `[role="button"]` | 1185 | 'Typing | Grade 8' | true |
| `[class*="level"]` | 1 | 'Jump to Main ContentToggle navigationTypingClubHom' | false |
| `[class*="lesson"]` | 1187 | '43% progress|2,481 stars|2,014,338 pointstake plac' | false |

Note: The `[role="button"]` selector found 1185 elements, and `[class*="lesson"]` found 1187 elements. These are likely wrapping each individual lesson item. The script did not narrow down to specific lesson links yet.

**Selector that will likely work for lessons:** `[role="button"]` or `[class*="lesson"]` — need to filter by clicking on the specific lesson element (tested manually below).

### Navigation Behavior

**When clicking a lesson link, what happens?**
[NEEDS MANUAL TESTING - run `testNavigateToLesson(0)` in console and observe]

**How do you navigate back to menu from a lesson?**
[NEEDS MANUAL TESTING - complete a lesson or press back, observe behavior]

**Page Change Detection:**
- Does the URL change immediately when navigating? [NEEDS TESTING]
- Is there a loading screen? [NEEDS TESTING]
- How long does navigation take? [NEEDS TESTING]

**Additional Notes:**
The menu page at `program-177.game` was detected as MENU_PAGE with HIGH confidence. The page has ~1185 `[role="button"]` elements which likely include all lessons. The script's `testNavigateToLesson(0)` and `testClickMethods(element)` functions still need to be manually tested to determine which click method works for navigation.

<div role="button" aria-label="Lesson 1, Introduction to Typing." tabindex="101" class="box-container is_unlocked has_progress"><div class="box"><div class="lsn_name " title="Introduction to Typing">Introduction to Typing</div><div class="lsn_num">1</div><div class="boxicon"><div class="lesson_icon e-cmn cmn-intro"></div></div><div class="completion-check"></div></div></div>

<div role="button" aria-label="Lesson 2, Keys f &amp; j.You currently have 5 stars in this lesson." tabindex="102" class="box-container is_unlocked has_progress"><div class="box"><div class="lsn_name " title="Keys f &amp; j">Keys f &amp; j</div><span title="perfect score" class="platinum-star"></span><div class="lsn_num">2</div><div class="boxicon"><div class="lesson_icon e-qwerty qwerty-fj"></div></div><div class="stars stars-5"></div></div></div>

... can you gen a script that scraps all types of class="lesson_icon", so I can identify the lessons that work to auto filter out lessons that the script doesn't work in

---

## TEST 3: Page Detection

**Instructions:** Run `TEST_3_Page_Detection.js` on each different page type (menu, lesson, results, video, home).

### Menu Page

**Run script on menu page and paste output below:**
```
﻿
VM11217:386 
(index)
tag
text
href
role
0	'A'	'Jump to Main Content'	'(none)'	'navigation'
1	'BUTTON'	'Toggle navigation'	'(none)'	'(none)'
2	'A'	'TypingClub'	'(none)'	'(none)'
3	'A'	'Home'	'(none)'	'menuitem'
4	'A'	'Stats'	'(none)'	'menuitem'
5	'A'	'Badges'	'(none)'	'menuitem'
6	'A'	'Typing | Grade 8'	'https://qsiszsc.typingclub.com/sportal/program-177.game#'	'button'
7	'A'	'Scoreboard'	'(none)'	'menuitem'
8	'A'	'English'	'https://qsiszsc.typingclub.com/sportal/program-177.game#'	'button'
9	'A'	'Yanhong (Bruno)'	'https://qsiszsc.typingclub.com/sportal/program-177.game#'	'menuitem'
10	'A'	'Table of Contents'	'(none)'	'(none)'
11	'A'	'(empty)'	'(none)'	'menuitem'
12	'A'	'(empty)'	'(none)'	'button'
13	'DIV'	'Introduction to Typing1'	'(none)'	'button'
14	'DIV'	'Keys f & j2'	'(none)'	'button'
Array(15)
VM11217:389 
--- PAGE CLASSIFICATION ---
VM11217:390 🏷️  Page Type: MENU_PAGE
VM11217:391 🎯 Confidence: 80%
VM11217:392 📝 Reasons:
VM11217:393    • URL matches program-XXX.game pattern
VM11217:393    • Found 3 menu indicator(s)
VM11217:393    • Found links to program/lesson pages
VM11217:394 
Supporting Evidence:
VM11217:395 
(index)
isGame
isPlay
isSportal
isProgram
Value
urlPatterns	true	false	true	true	
lessonIndicatorCount					0
menuIndicatorCount					3
videoIndicatorCount					2
gameIndicatorCount					1
formElementCount					0
Object
VM11217:400 
✅ Analysis complete!
VM11217:401 
📋 NEXT STEPS:
VM11217:402    1. Navigate to each page type (menu, lesson, results, video, home)
VM11217:403    2. Run this script on each page
VM11217:404    3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md
VM11217:405    4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables
VM11217:406 
💡 The full analysis object is stored in: window.lastPageAnalysis
VM11217:407    You can inspect it with: console.table(window.lastPageAnalysis)
undefined
console.table(window.lastPageAnalysis)
VM11221:1 
(index)
full
protocol
host
pathname
hash
search
Value
viewport
og:url
og:type
og:title
og:description
og:image
og:image:height
og:image:width
og:image:alt
twitter:site
twitter:card
twitter:domain
twitter:url
url	'https://qsiszsc.typingclub.com/sportal/program-177.game'	'https:'	'qsiszsc.typingclub.com'	'/sportal/program-177.game'	''	''														
title							'edclub'													
meta								'width=device-width, initial-scale=1.0'	'https://www.edclub.com'	'website'	'Learn, teach, create! edclub'	'The highest quality free courses through the most awesome learning platform.'	'https://www.edclub.com/m/website/banner-edclub8.png'	'630'	'1200'	'edclub banner'	'@typingclub'	'summary_large_image'	'edclub.com'	'https://www.edclub.com'
dom																				
classification																				
Object
classification
: 
{pageType: 'MENU_PAGE', confidence: '80%', reasons: Array(3), supportedBy: {…}}
dom
: 
{uniqueClasses: Array(1), uniqueIds: Array(0), formElements: Array(0), interactiveElements: Array(15), lessonIndicators: Array(0), …}
meta
: 
{viewport: 'width=device-width, initial-scale=1.0', og:url: 'https://www.edclub.com', og:type: 'website', og:title: 'Learn, teach, create! edclub', og:description: 'The highest quality free courses through the most awesome learning platform.', …}
title
: 
"edclub"
url
: 
{full: 'https://qsiszsc.typingclub.com/sportal/program-177.game', protocol: 'https:', host: 'qsiszsc.typingclub.com', pathname: '/sportal/program-177.game', hash: '', …}
[[Prototype]]
: 
Object
```

**Key Identifiers for Menu Pages:**
- URL pattern: [fill in]
- Unique CSS classes: [list any unique classes]
- Key elements present: [describe]

### Lesson Page

**Run script on a lesson page and paste output below:**
```
📊 PAGE ANALYSIS RESULTS:
VM11349:345 
--- URL Information ---
VM11349:346 
(index)
Value
full	'https://qsiszsc.typingclub.com/sportal/program-177/50428.play'
protocol	'https:'
host	'qsiszsc.typingclub.com'
pathname	'/sportal/program-177/50428.play'
hash	''
search	''
Object
VM11349:348 
--- Page Title ---
VM11349:349 edclub
VM11349:351 
--- Meta Tags ---
VM11349:353 
(index)
Value
viewport	'width=device-width, initial-scale=1.0'
og:url	'https://www.edclub.com'
og:type	'website'
og:title	'Learn, teach, create! edclub'
og:description	'The highest quality free courses through the most awesome learning platform.'
og:image	'https://www.edclub.com/m/website/banner-edclub8.png'
og:image:height	'630'
og:image:width	'1200'
og:image:alt	'edclub banner'
twitter:site	'@typingclub'
twitter:card	'summary_large_image'
twitter:domain	'edclub.com'
twitter:url	'https://www.edclub.com'
twitter:title	'Learn, teach, create! edclub'
twitter:description	'The highest quality free courses through the most awesome learning platform.'
twitter:image	'https://www.edclub.com/m/website/banner-edclub8.png'
twitter:alt	'edclub banner'
Object
VM11349:358 
--- DOM Analysis ---
VM11349:359 
Lesson Indicators (7 found):
VM11349:361 
(index)
selector
count
sampleClass
0	'.token_unit'	176	'token_unit _clr'
1	'.token'	36	'token _fcs'
2	'.cursor'	1	'cursor normal_cursor'
3	'.line'	9	'line'
4	'[class*="token"]'	212	'token _fcs'
5	'[class*="cursor"]'	1	'cursor normal_cursor'
6	'[class*="text"]'	2	'htext lesson-title'
Array(7)
VM11349:364 
Menu Indicators (3 found):
VM11349:366 
(index)
selector
count
sampleText
0	'[class*="menu"]'	1	'(empty)'
1	'[class*="lesson"]'	1	'Lesson 486: own'
2	'[class*="level"]'	1	'Lesson 486: ownYanhong (Bruno)Start TypingStart Ty'
Array(3)
VM11349:369 
Game Indicators (1 found):
VM11349:371 
(index)
selector
count
sampleClass
0	'[class*="play"]'	1	'typable mono_standard hide_extras play_mode linified'
Array(1)
VM11349:374 
Video Indicators (1 found):
VM11349:376 
(index)
selector
count
sampleSrc
0	'iframe'	13	'about:blank'
Array(1)
VM11349:379 
Form Elements (1 found):
VM11349:381 
(index)
tag
type
name
ariaHidden
class
0	'INPUT'	'text'	'(none)'	'true'	''
Array(1)
VM11349:384 
Interactive Elements (2 found):
VM11349:386 
(index)
tag
text
href
role
0	'A'	'Hide ×'	'(none)'	'(none)'
1	'A'	'Hide ×'	'(none)'	'(none)'
Array(2)
VM11349:389 
--- PAGE CLASSIFICATION ---
VM11349:390 🏷️  Page Type: LESSON_PAGE
VM11349:391 🎯 Confidence: 90%
VM11349:392 📝 Reasons:
VM11349:393    • URL contains .play
VM11349:393    • Found 7 lesson indicator(s)
VM11349:393    • Found input field (likely typing input)
VM11349:394 
Supporting Evidence:
VM11349:395 
(index)
isGame
isPlay
isSportal
isProgram
Value
urlPatterns	false	true	true	true	
lessonIndicatorCount					7
menuIndicatorCount					3
videoIndicatorCount					1
gameIndicatorCount					1
formElementCount					1
Object
VM11349:400 
✅ Analysis complete!
VM11349:401 
📋 NEXT STEPS:
VM11349:402    1. Navigate to each page type (menu, lesson, results, video, home)
VM11349:403    2. Run this script on each page
VM11349:404    3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md
VM11349:405    4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables
VM11349:406 
💡 The full analysis object is stored in: window.lastPageAnalysis
VM11349:407    You can inspect it with: console.table(window.lastPageAnalysis)
undefined
prebid.335dd72….js:2 
 POST https://ib.adnxs.com/ut/v3/prebid net::ERR_TIMED_OUT
console.table(window.lastPageAnalysis)
VM11353:1 
(index)
full
protocol
host
pathname
hash
search
Value
viewport
og:url
og:type
og:title
og:description
og:image
og:image:height
og:image:width
og:image:alt
twitter:site
twitter:card
twitter:domain
twitter:url
url	'https://qsiszsc.typingclub.com/sportal/program-177/50428.play'	'https:'	'qsiszsc.typingclub.com'	'/sportal/program-177/50428.play'	''	''														
title							'edclub'													
meta								'width=device-width, initial-scale=1.0'	'https://www.edclub.com'	'website'	'Learn, teach, create! edclub'	'The highest quality free courses through the most awesome learning platform.'	'https://www.edclub.com/m/website/banner-edclub8.png'	'630'	'1200'	'edclub banner'	'@typingclub'	'summary_large_image'	'edclub.com'	'https://www.edclub.com'
dom																				
classification																				
Object
classification
: 
{pageType: 'LESSON_PAGE', confidence: '90%', reasons: Array(3), supportedBy: {…}}
dom
: 
{uniqueClasses: Array(2), uniqueIds: Array(0), formElements: Array(1), interactiveElements: Array(2), lessonIndicators: Array(7), …}
meta
: 
{viewport: 'width=device-width, initial-scale=1.0', og:url: 'https://www.edclub.com', og:type: 'website', og:title: 'Learn, teach, create! edclub', og:description: 'The highest quality free courses through the most awesome learning platform.', …}
title
: 
"edclub"
url
: 
{full: 'https://qsiszsc.typingclub.com/sportal/program-177/50428.play', protocol: 'https:', host: 'qsiszsc.typingclub.com', pathname: '/sportal/program-177/50428.play', hash: '', …}
[[Prototype]]
: 
Object
```

**Key Identifiers for Lesson Pages:**
- URL pattern: [fill in]
- Typing input selector: [e.g., `input[aria-hidden="true"]`]
- Character display selector: [e.g., `.token span.token_unit`]
- Key elements present: [describe]

### Results/Completion Page

**Run script on a results page and paste output below:**
```
📊 PAGE ANALYSIS RESULTS:
VM11509:345 
--- URL Information ---
VM11509:346 
(index)
Value
full	'https://qsiszsc.typingclub.com/sportal/program-177/50428.play'
protocol	'https:'
host	'qsiszsc.typingclub.com'
pathname	'/sportal/program-177/50428.play'
hash	''
search	''
Object
VM11509:348 
--- Page Title ---
VM11509:349 edclub
VM11509:351 
--- Meta Tags ---
VM11509:353 
(index)
Value
viewport	'width=device-width, initial-scale=1.0'
og:url	'https://www.edclub.com'
og:type	'website'
og:title	'Learn, teach, create! edclub'
og:description	'The highest quality free courses through the most awesome learning platform.'
og:image	'https://www.edclub.com/m/website/banner-edclub8.png'
og:image:height	'630'
og:image:width	'1200'
og:image:alt	'edclub banner'
twitter:site	'@typingclub'
twitter:card	'summary_large_image'
twitter:domain	'edclub.com'
twitter:url	'https://www.edclub.com'
twitter:title	'Learn, teach, create! edclub'
twitter:description	'The highest quality free courses through the most awesome learning platform.'
twitter:image	'https://www.edclub.com/m/website/banner-edclub8.png'
twitter:alt	'edclub banner'
Object
VM11509:358 
--- DOM Analysis ---
VM11509:359 
Lesson Indicators (1 found):
VM11509:361 
(index)
selector
count
sampleClass
0	'[class*="text"]'	2	'htext lesson-title'
Array(1)
VM11509:364 
Menu Indicators (3 found):
VM11509:366 
(index)
selector
count
sampleText
0	'[class*="menu"]'	1	'(empty)'
1	'[class*="lesson"]'	1	'Lesson 486: own'
2	'[class*="level"]'	1	'Lesson finished. You have earned 5 stars, Your sco'
Array(3)
VM11509:369 
Game Indicators (0 found):
VM11509:374 
Video Indicators (1 found):
VM11509:376 
(index)
selector
count
sampleSrc
0	'iframe'	13	'about:blank'
Array(1)
VM11509:379 
Form Elements (0 found):
VM11509:384 
Interactive Elements (4 found):
VM11509:386 
(index)
tag
text
href
role
0	'A'	'Hide ×'	'(none)'	'(none)'
1	'A'	'Hide ×'	'(none)'	'(none)'
2	'BUTTON'	'Try again'	'(none)'	'(none)'
3	'BUTTON'	'→Press Enter'	'(none)'	'(none)'
Array(4)
VM11509:389 
--- PAGE CLASSIFICATION ---
VM11509:390 🏷️  Page Type: LESSON_PAGE
VM11509:391 🎯 Confidence: 80%
VM11509:392 📝 Reasons:
VM11509:393    • URL contains .play
VM11509:393    • Found 1 lesson indicator(s)
VM11509:393    • Page mentions WPM and accuracy
VM11509:394 
Supporting Evidence:
VM11509:395 
(index)
isGame
isPlay
isSportal
isProgram
Value
urlPatterns	false	true	true	true	
lessonIndicatorCount					1
menuIndicatorCount					3
videoIndicatorCount					1
gameIndicatorCount					0
formElementCount					0
Object
VM11509:400 
✅ Analysis complete!
VM11509:401 
📋 NEXT STEPS:
VM11509:402    1. Navigate to each page type (menu, lesson, results, video, home)
VM11509:403    2. Run this script on each page
VM11509:404    3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md
VM11509:405    4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables
VM11509:406 
💡 The full analysis object is stored in: window.lastPageAnalysis
VM11509:407    You can inspect it with: console.table(window.lastPageAnalysis)
undefined
console.table(window.lastPageAnalysis)
VM11513:1 
(index)
full
protocol
host
pathname
hash
search
Value
viewport
og:url
og:type
og:title
og:description
og:image
og:image:height
og:image:width
og:image:alt
twitter:site
twitter:card
twitter:domain
twitter:url
url	'https://qsiszsc.typingclub.com/sportal/program-177/50428.play'	'https:'	'qsiszsc.typingclub.com'	'/sportal/program-177/50428.play'	''	''														
title							'edclub'													
meta								'width=device-width, initial-scale=1.0'	'https://www.edclub.com'	'website'	'Learn, teach, create! edclub'	'The highest quality free courses through the most awesome learning platform.'	'https://www.edclub.com/m/website/banner-edclub8.png'	'630'	'1200'	'edclub banner'	'@typingclub'	'summary_large_image'	'edclub.com'	'https://www.edclub.com'
dom																				
classification																				
Object
classification
: 
{pageType: 'LESSON_PAGE', confidence: '80%', reasons: Array(3), supportedBy: {…}}
dom
: 
{uniqueClasses: Array(3), uniqueIds: Array(4), formElements: Array(0), interactiveElements: Array(4), lessonIndicators: Array(1), …}
meta
: 
{viewport: 'width=device-width, initial-scale=1.0', og:url: 'https://www.edclub.com', og:type: 'website', og:title: 'Learn, teach, create! edclub', og:description: 'The highest quality free courses through the most awesome learning platform.', …}
title
: 
"edclub"
url
: 
{full: 'https://qsiszsc.typingclub.com/sportal/program-177/50428.play', protocol: 'https:', host: 'qsiszsc.typingclub.com', pathname: '/sportal/program-177/50428.play', hash: '', …}
[[Prototype]]
: 
Object
```

**Key Identifiers for Results Pages:**
- URL pattern: **Stays the same as lesson page** (e.g., `.../program-177/50428.play` — no change)
- WPM display selector:
  - Visual WPM: `.performance-results .st10 span` (contains `<span>40</span><span>wpm</span>`)
  - Hidden text: `div[tabindex="3"]` → `"your accuracy was 100%, with real accuracy of 97% and speed of 44 wpm in 78 seconds."`
- Accuracy display selector:
  - Visual accuracy: SVG `<text>` with text "real accuracy" + sibling `<text>` with `"97%"`
  - Circle progress: `circle.l` (stroke-dashoffset shows accuracy percentage)
  - Hidden text in `div[tabindex="3"]` also contains accuracy
- Key elements present:
  - `.performance-results` — main results container
  - `.stars-box` — star display container (with `div#star-0` through `div#star-4`)
  - `div[tabindex="2"]` — `"Lesson finished. You have earned 5 stars, Your score is 3734"`
  - `div[tabindex="3"]` — hidden text with full stats sentence
  - `div[tabindex="4"]` — hidden text with lesson requirements
  - SVG performance circles with `stroke-dasharray`/`stroke-dashoffset` for visual gauges
  - `.new-highscore` — present only when silver star achieved
  - Score display: `div` with `transform-origin: center bottom` containing the score number (e.g., `3734`)
- **Detection strategy:** Since URL doesn't change, detect results page by checking for `.performance-results` element, `.stars-box`, or `div[tabindex="3"]` containing "wpm" text

### Video/Custom Lesson Page (if applicable)

**Run script on a video lesson page and paste output below:**
```
﻿
VM12293:392 📝 Reasons:
VM12293:393    • URL contains .play
VM12293:393    • Found 1 lesson indicator(s)
VM12293:394 
Supporting Evidence:
VM12293:395 
(index)
isGame
isPlay
isSportal
isProgram
Value
urlPatterns	false	true	true	true	
lessonIndicatorCount					1
menuIndicatorCount					3
videoIndicatorCount					3
gameIndicatorCount					1
formElementCount					0
Object
VM12293:400 
✅ Analysis complete!
VM12293:401 
📋 NEXT STEPS:
VM12293:402    1. Navigate to each page type (menu, lesson, results, video, home)
VM12293:403    2. Run this script on each page
VM12293:404    3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md
VM12293:405    4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables
VM12293:406 
💡 The full analysis object is stored in: window.lastPageAnalysis
VM12293:407    You can inspect it with: console.table(window.lastPageAnalysis)
undefined
console.table(window.lastPageAnalysis)
VM12297:1 
(index)
full
protocol
host
pathname
hash
search
Value
viewport
og:url
og:type
og:title
og:description
og:image
og:image:height
og:image:width
og:image:alt
twitter:site
twitter:card
twitter:domain
twitter:url
url	'https://qsiszsc.typingclub.com/sportal/program-177/49919.play'	'https:'	'qsiszsc.typingclub.com'	'/sportal/program-177/49919.play'	''	''														
title							'edclub'													
meta								'width=device-width, initial-scale=1.0'	'https://www.edclub.com'	'website'	'Learn, teach, create! edclub'	'The highest quality free courses through the most awesome learning platform.'	'https://www.edclub.com/m/website/banner-edclub8.png'	'630'	'1200'	'edclub banner'	'@typingclub'	'summary_large_image'	'edclub.com'	'https://www.edclub.com'
dom																				
classification																				
Object
classification
: 
{pageType: 'LESSON_PAGE', confidence: '70%', reasons: Array(2), supportedBy: {…}}
dom
: 
{uniqueClasses: Array(1), uniqueIds: Array(1), formElements: Array(0), interactiveElements: Array(15), lessonIndicators: Array(1), …}
meta
: 
{viewport: 'width=device-width, initial-scale=1.0', og:url: 'https://www.edclub.com', og:type: 'website', og:title: 'Learn, teach, create! edclub', og:description: 'The highest quality free courses through the most awesome learning platform.', …}
title
: 
"edclub"
url
: 
{full: 'https://qsiszsc.typingclub.com/sportal/program-177/49919.play', protocol: 'https:', host: 'qsiszsc.typingclub.com', pathname: '/sportal/program-177/49919.play', hash: '', …}
[[Prototype]]
: 
Object
```
VIDEO

```
📊 PAGE ANALYSIS RESULTS:
VM12338:345 
--- URL Information ---
VM12338:346 
(index)
Value
full	'https://qsiszsc.typingclub.com/sportal/program-177/49926.play'
protocol	'https:'
host	'qsiszsc.typingclub.com'
pathname	'/sportal/program-177/49926.play'
hash	''
search	''
Object
VM12338:348 
--- Page Title ---
VM12338:349 edclub
VM12338:351 
--- Meta Tags ---
VM12338:353 
(index)
Value
viewport	'width=device-width, initial-scale=1.0'
og:url	'https://www.edclub.com'
og:type	'website'
og:title	'Learn, teach, create! edclub'
og:description	'The highest quality free courses through the most awesome learning platform.'
og:image	'https://www.edclub.com/m/website/banner-edclub8.png'
og:image:height	'630'
og:image:width	'1200'
og:image:alt	'edclub banner'
twitter:site	'@typingclub'
twitter:card	'summary_large_image'
twitter:domain	'edclub.com'
twitter:url	'https://www.edclub.com'
twitter:title	'Learn, teach, create! edclub'
twitter:description	'The highest quality free courses through the most awesome learning platform.'
twitter:image	'https://www.edclub.com/m/website/banner-edclub8.png'
twitter:alt	'edclub banner'
Object
VM12338:358 
--- DOM Analysis ---
VM12338:359 
Lesson Indicators (1 found):
VM12338:361 
(index)
selector
count
sampleClass
0	'[class*="text"]'	2	'htext lesson-title'
Array(1)
VM12338:364 
Menu Indicators (3 found):
VM12338:366 
(index)
selector
count
sampleText
0	'[class*="menu"]'	1	'(empty)'
1	'[class*="lesson"]'	1	'(empty)'
2	'[class*="level"]'	1	'Yanhong (Bruno)Hide ×'
Array(3)
VM12338:369 
Game Indicators (2 found):
VM12338:371 
(index)
selector
count
sampleClass
0	'.game'	1	'hdrlt game '
1	'[class*="game"]'	1	'hdrlt game '
Array(2)
VM12338:374 
Video Indicators (1 found):
VM12338:376 
(index)
selector
count
sampleSrc
0	'iframe'	13	'about:blank'
Array(1)
VM12338:379 
Form Elements (0 found):
VM12338:384 
Interactive Elements (1 found):
VM12338:386 
(index)
tag
text
href
role
0	'A'	'Hide ×'	'(none)'	'(none)'
Array(1)
VM12338:389 
--- PAGE CLASSIFICATION ---
VM12338:390 🏷️  Page Type: LESSON_PAGE
VM12338:391 🎯 Confidence: 70%
VM12338:392 📝 Reasons:
VM12338:393    • URL contains .play
VM12338:393    • Found 1 lesson indicator(s)
VM12338:394 
Supporting Evidence:
VM12338:395 
(index)
isGame
isPlay
isSportal
isProgram
Value
urlPatterns	false	true	true	true	
lessonIndicatorCount					1
menuIndicatorCount					3
videoIndicatorCount					1
gameIndicatorCount					2
formElementCount					0
Object
VM12338:400 
✅ Analysis complete!
VM12338:401 
📋 NEXT STEPS:
VM12338:402    1. Navigate to each page type (menu, lesson, results, video, home)
VM12338:403    2. Run this script on each page
VM12338:404    3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md
VM12338:405    4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables
VM12338:406 
💡 The full analysis object is stored in: window.lastPageAnalysis
VM12338:407    You can inspect it with: console.table(window.lastPageAnalysis)
undefined
console.table(window.lastPageAnalysis)
VM12342:1 
(index)
full
protocol
host
pathname
hash
search
Value
viewport
og:url
og:type
og:title
og:description
og:image
og:image:height
og:image:width
og:image:alt
twitter:site
twitter:card
twitter:domain
twitter:url
url	'https://qsiszsc.typingclub.com/sportal/program-177/49926.play'	'https:'	'qsiszsc.typingclub.com'	'/sportal/program-177/49926.play'	''	''														
title							'edclub'													
meta								'width=device-width, initial-scale=1.0'	'https://www.edclub.com'	'website'	'Learn, teach, create! edclub'	'The highest quality free courses through the most awesome learning platform.'	'https://www.edclub.com/m/website/banner-edclub8.png'	'630'	'1200'	'edclub banner'	'@typingclub'	'summary_large_image'	'edclub.com'	'https://www.edclub.com'
dom																				
classification																				
Object
classification
: 
{pageType: 'LESSON_PAGE', confidence: '70%', reasons: Array(2), supportedBy: {…}}
dom
: 
{uniqueClasses: Array(1), uniqueIds: Array(1), formElements: Array(0), interactiveElements: Array(1), lessonIndicators: Array(1), …}
meta
: 
{viewport: 'width=device-width, initial-scale=1.0', og:url: 'https://www.edclub.com', og:type: 'website', og:title: 'Learn, teach, create! edclub', og:description: 'The highest quality free courses through the most awesome learning platform.', …}
title
: 
"edclub"
url
: 
{full: 'https://qsiszsc.typingclub.com/sportal/program-177/49926.play', protocol: 'https:', host: 'qsiszsc.typingclub.com', pathname: '/sportal/program-177/49926.play', hash: '', …}
[[Prototype]]
: 
Object
```
GAMEs are powered by http://phaser.io

**Key Identifiers for Video Lessons:**
- URL pattern: [fill in]
- How to detect it's NOT a typing lesson? [describe]

### Additional Notes

**Can you reliably distinguish between:**
- Menu vs Lesson page?
- Lesson vs Results page?
- Typing lesson vs Video/Custom lesson? mainly through detecting the "lesson icon" as i have mentioned before, there are also some lessons that are special (includes a pre typing lesson thing, or special clicking such as holding and specific key and type), so the script doesn't work, there should also be a typing detection, ask me for more if needed

---

## TEST 5: DOM Scraper

**Instructions:** Run `TEST_5_DOM_Scraper.js` on the menu page.

### Scraping Results

✅ **Successfully scraped: 314 rows, 1182 lessons** from `program-177.game`

**Full output:** See `TEST_5_RESULTS.md`

### Summary

| Metric | Value |
|--------|-------|
| Total Rows | 314 |
| Total Lessons | 1182 |
| Unique Icon Types | 78 |
| Status Types Found | 3 (`unlocked`, `has_progress`, `platinum`) |
| Star Classes | `(none)`, `stars-0`, `stars-1`, `stars-5` |

### Icon Classification (78 types)

All icon types found on `.lesson_icon` elements:

```
e-cmn cmn-intro              e-qwerty qwerty-fj             e-qwerty qwerty-R-fj
e-qwerty qwerty-dk           e-qwerty qwerty-R-dk           e-cmn cmn-practice
e-cmn cmn-game1              e-qwerty qwerty-sl             e-qwerty qwerty-R-sl
e-qwerty qwerty-a            e-qwerty qwerty-R-a            e-cmn cmn-home2
e-cmn cmn-Hand-l2            e-cmn cmn-Hand-r2              e-qwerty qwerty-gh
e-qwerty qwerty-R-gh         e-cmn cmn-game3                e-qwerty qwerty-ru
e-qwerty qwerty-R-ru         e-qwerty qwerty-ei             e-qwerty qwerty-R-ei
e-cmn cmn-sit-straight2      e-cmn cmn-G3                   e-qwerty qwerty-wo
e-qwerty qwerty-R-wo         e-qwerty qwerty-qy             e-qwerty qwerty-R-qy
e-qwerty qwerty-tp           e-qwerty qwerty-R-tp           e-cmn cmn-think-ideas2
e-qwerty qwerty-vm           e-qwerty qwerty-R-vm           e-cmn cmn-travel1
e-qwerty qwerty-c            e-qwerty qwerty-R-c            e-cmn cmn-qwerty-history
e-qwerty qwerty-x            e-qwerty qwerty-R-x            e-qwerty qwerty-co-zslash
e-qwerty qwerty-R-z          e-qwerty qwerty-bn             e-qwerty qwerty-R-bn
e-cmn cmn-take-break         e-cmn cmn-space-tab3           e-cmn cmn-default
e-cmn cmn-game4              e-cmn cmn-game5                e-cmn cmn-tip
e-cmn cmn-fastest-typist4    e-cmn cmn-video                e-qwerty qwerty-C-FJ
e-qwerty qwerty-R-caps       e-qwerty qwerty-C-DK           e-qwerty qwerty-C-SL
e-qwerty qwerty-C-A          e-qwerty qwerty-C-GH           e-qwerty qwerty-C-TY
e-qwerty qwerty-C-RU         e-qwerty qwerty-C-EI           e-qwerty qwerty-C-WO
e-qwerty qwerty-C-QP         e-qwerty qwerty-C-VM           e-qwerty qwerty-C-C
e-qwerty qwerty-C-ZN         e-qwerty qwerty-C-XB           e-cmn cmn-dynamic
e-cmn cmn-symbols2           e-qwerty qwerty-R-symbols2     e-cmn cmn-code
e-cmn cmn-drum               e-qwerty qwerty-numbers        e-qwerty qwerty-R-numbers
e-cmn cmn-definition         e-qwerty qwerty-r-symbols      e-cmn cmn-guide2
e-cmn cmn-symbols            e-qwerty qwerty-R-symbols3     e-cmn cmn-celebration
```

### Key Observations

1. **No `is_locked` or `is_completed` classes** found — only `is_unlocked` and `has_progress`
2. **Platinum detection works**: `.platinum-star` element detected correctly on perfect-score lessons
3. **Star count extraction works**: `.stars-X` class maps correctly to star count (0, 1, 5)
4. **aria-label parsing works**: Contains lesson info + "You currently have X stars in this lesson" text
5. **Row structure is consistent**: Each `.lsnrow` has `name="row-X"` and contains 1-4 lessons

### Auto-Complete Classification

| Category | Icon Prefix | Decision |
|----------|------------|----------|
| **Normal typing** | `e-qwerty qwerty-*` | ✅ Auto-complete |
| **Review** | `e-qwerty qwerty-R-*` | ✅ Auto-complete |
| **Caps/Shift** | `e-qwerty qwerty-C-*` | ⚠️ Test first |
| **Numbers** | `e-qwerty qwerty-numbers` | ✅ Probably auto-complete |
| **Symbols** | `e-qwerty qwerty-R-symbols*` | ⚠️ Test first |
| **Video** | `cmn-video` | ❌ SKIP |
| **Games** | `cmn-game*`, `cmn-G3` | ⚠️ Test first |
| **Practice** | `cmn-practice` | ✅ Probably auto-complete |
| **Info/Special** | `cmn-*` (intro, tips, posture, etc.) | ⚠️ Test first |

### Data Verification

| Field | Accurate? | Notes |
|-------|-----------|-------|
| Lesson count | ✅ YES | 314 rows, 1182 lessons verified |
| Lesson numbers | ✅ YES | `.lsn_num` text accurate |
| Completion status | ✅ YES | `platinum-star` presence = completed/perfect |
| Star ratings | ✅ YES | `.stars-X` class matches visible stars |
| Lesson URLs | ✅ YES | Lesson tabindex/aria-label correct |
| Non-game detection | ✅ YES | Icon classification working |

### Additional Notes

- All lessons on this menu are `is_unlocked` — may differ on other programs
- First 50 rows (rows 0-49) are mostly completed with `stars-5` and `platinum`
- Rows 50-160 are mostly `stars-0` (not yet attempted)
- Rows 160-314 are mixed with varying completion
- Row 313 has only 1 lesson with `name="row-313"` (no `.stars` element)
- [ ] Some lessons missing
- [ ] Wrong star counts
- [ ] Missing completion status
- [ ] Can't distinguish game vs non-game
- [ ] Other: [describe]

### Required Fixes

**What needs to be fixed or improved in the scraper?**
[List any issues]

### Additional Notes

[Any other observations about scraping]

---

## Overall Observations

### WPM Engine

**Based on Test 1 results, what delay settings produce ~90 WPM?**
[Your target WPM and corresponding delays]

**How should the WPM engine handle:**
- Varying speed within a lesson? [describe preference]
- Error correction (typos + backspace)? [describe]
- Starting/ending speed? [describe]

### Navigation Flow

**Ideal automation flow:**
1. [Step 1 - e.g., Detect current page]
2. [Step 2]
3. [etc.]

**Known issues or edge cases:**
- [Issue 1]
- [Issue 2]

### UI Requirements

**What controls do you need in the floating overlay?**
- [ ] Start/Stop toggle
- [ ] Restart button
- [ ] WPM input
- [ ] Varying WPM input
- [ ] Real Accuracy input
- [ ] Fake Accuracy input
- [ ] Scrap button
- [ ] Range selection
- [ ] Star redo threshold (redo lessons with ≤X stars)
- [ ] Logging display toggle
- [ ] Other: [list]

### Logging Format

**What events should be logged?**
- [ ] Page changes
- [ ] Lesson start/complete
- [ ] WPM/Accuracy results
- [ ] Errors and warnings
- [ ] Scraping results
- [ ] Navigation actions
- [ ] Other: [list]

---

## Screenshots (Optional but Helpful)

**Menu Page:**
[Attach or describe]

**Lesson Page:**
[Attach or describe]

**Results Page:**
[Attach or describe]

**Star Appearance:**
[Describe or attach how stars look - gold, silver, filled, empty, etc.]
