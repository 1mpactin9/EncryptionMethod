# AutoTyper Technical Specifications

## Project Overview

AutoTyper is a Tampermonkey/Violentmonkey userscript for automatically completing typing lessons on the **old TypingClub** layout (token-based character display). It simulates human typing with configurable WPM, accuracy (fake errors), and smart delay compensation that ensures the target WPM is hit even when time is lost to error correction.

## Key Features

- **Configurable WPM Control**: Target WPM with configurable `minWPM` and `maxWPM` bounds
- **Accuracy Simulation**: Configurable fake error rate that types wrong characters, backspaces, and corrects them to match target accuracy
- **Smart Compensating Delay**: Dynamically adjusts typing speed to hit target WPM even after errors consume extra time
- **Human-like Variation**: Multiple speed patterns (fixed, random, wave, ramp, rampDown, weighted combo)
- **Full UI Control**: Catppuccin Mocha themed floating control panel with sliders for all settings
- **Configuration Persistence**: All settings saved between page reloads via Tampermonkey storage
- **Menu Scraping**: Automatically crawls the menu to find all incomplete typing lessons
- **Lesson Queueing**: Process multiple lessons automatically with auto-advance
- **Pause/Resume/Abort**: Full control over execution
- **Live Logging**: Real-time log panel with export capability
- **Results Parsing**: Automatically extracts and displays achieved WPM and accuracy from results page

## Architecture / Module Breakdown

### 1. Configuration & State (`config`, `state`)
- `DEFAULT_CONFIG` - Default values for all settings
- `config` - Current configuration (defaults merged with loaded from storage)
- `state` - Runtime state (running, paused, queue, stats, `targetEndTime` for compensation)

### 2. Logger
- Logs to both console and UI panel
- Maintains circular buffer of last 200 lines
- Supports different log levels (info, ok, warn, error, lesson, fail)
- Export capability to clipboard/console

### 3. Config Persistence
- `saveConfig()` - Saves all config values to `GM_setValue`
- `loadConfig()` - Loads saved config from `GM_getValue`
- Automatically includes all new config keys (like `minWPM`, `maxWPM`)

### 4. Speed Pattern Engine + Smart Compensation

#### Speed Patterns
- `fixed` - Constant base delay
- `random` - Random 50%-150% variation on each character
- `wave` - Sinusoidal variation for natural speed changes
- `ramp` - Gradually speeds up over time
- `rampDown` - Gradually slows down over time
- `combo` - Weighted random selection from multiple patterns (e.g., `random:30,wave:40,ramp:30`)

#### Smart Compensating Delay Algorithm

The problem with static delay: When you add fake errors (wrong char + backspace + correct), this consumes extra time. The average WPM drifts lower than the target because the extra time isn't compensated.

**Solution:** Calculate the total target duration at the start based on character count and target WPM, then dynamically adjust each subsequent delay to stay on track.

Formula:
```
Target Duration = (totalChars × 12000) / targetWPM
targetEndTime = Date.now() + targetDurationMs

For each character:
  timeRemaining = targetEndTime - Date.now()
  charsLeft = remaining characters
  neededDelay = timeRemaining / charsLeft
  Add ±10% jitter for human variation
  Clamp between minDelay (12000/maxWPM) and maxDelay (12000/minWPM)
  Use neededDelay for current character
```

This automatically:
- Speeds up if we're behind schedule (from extra error time)
- Slows down if we're ahead of schedule
- Never exceeds the configured `minWPM`/`maxWPM` bounds

**WPM to ms Conversion:**
- 1 WPM = 5 words per minute = 5 characters per word × 1 word = 25 keystrokes per minute
- `ms per char = 60000 / (WPM × 5) = 12000 / WPM`

### 5. Typing Engine

**Character Extraction (`extractChars()`):**
```javascript
- Query: document.querySelectorAll(".token span.token_unit")
- Check: if element contains ._enter → return "\n"
- Check: if text is empty or non-breaking space (\u00A0, charCode 160) → return " "
- Otherwise: return first character of textContent
- Filter: remove undefined entries
```

**Robust `forceType()`:**
Full event sequence that works even when sites block simple event simulation:
1. Focus input field
2. Create KeyboardEvent with full properties: `key`, `code`, `keyCode`, `which`, `bubbles`, `cancelable`, `isTrusted`
3. Dispatch `keydown` event
4. Update `input.value` **explicitly** (add char or handle backspace)
5. Dispatch `input` event with correct `data` and `inputType`
6. Dispatch `keyup` event

Special handling:
- **Enter**: Generates Enter key event (no value update since site handles newline)
- **Space**: Converts everything to regular literal space
- **Backspace**: Removes last character from input.value, sets correct inputType

### 6. Page Detection
Detects current page type:
- `MENU` - Program menu (URL matches `/program-\d+\.game/`)
- `RESULTS` - Results page (detected via `.performance-results` or WPM text)
- `TYPING` - Active typing lesson (input exists and characters found)
- `SPECIAL` - Special content (video, info, games) → skip

### 7. Menu Scraper
Scrapes all lessons from menu:
- Extracts global index, name, number, icon class, star count, platinum status
- Filtering: only keeps `e-qwerty` icon class (actual typing lessons)
- Skips: `cmn-video`, `cmn-game`, `cmn-G3`, already completed (5-star/platinum)

### 8. Results Parser
Extracts from results page:
- Achieved WPM
- Target accuracy
- Real accuracy
- Duration

### 9. Lesson Executor
- Clicks lesson, waits for typing page to load
- Initializes `targetEndTime` for smart compensation
- Main loop: for each character, maybe inject fake error → type correct → delay with compensation
- Waits for results page, parses results

### 10. Lesson Runner
- Processes lesson queue sequentially
- Auto-advances to next lesson after completion
- Handles navigation back to menu

### 11. UI
Floating Catppuccin Mocha themed panel:
- Sliders: Target WPM, Min WPM, Max WPM, Target Accuracy, Fake Error Rate
- Text input: Speed Pattern, Lesson List
- Buttons: Crawl, Start, Stop, Pause/Resume, Save, Export Log
- Stats display: Completed, Failed, Last WPM, Last Accuracy, Current Lesson
- Live log panel

## DOM Selectors Reference

| Selector | Purpose |
|----------|---------|
| `input[aria-hidden="true"]` | Hidden input field where events are dispatched |
| `.token span.token_unit` | Individual character containers in the lesson |
| `._enter` | Class indicating an Enter/newline |
| `.lesson_icon` | Lesson icon element in menu |
| `e-qwerty` | Icon class for typing lessons (kept) |
| `cmn-video`, `cmn-game`, `cmn-G3` | Icon classes for non-typing content (skipped) |
| `.stars` | Star rating element in menu |
| `platinum-star` | Platinum star indicates fully completed lesson |
| `.lsnrow` | Menu row container |
| `.box-container` | Individual lesson box container |
| `.performance-results` | Results page container |
| `div[tabindex="3"]` | Results text container |

## Special Character Handling

| Character/Case | Handling |
|----------------|----------|
| `\u00A0` (non-breaking space) | Converted to regular space `" "` |
| `._enter` class | Returned as `"\n"`, generates Enter key event |
| `Backspace` | Used for correcting fake errors, removes last character from input.value |
| Empty text | Treated as space |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetWPM` | number | 90 | Target average WPM to hit |
| `minWPM` | number | 80 | Minimum allowed WPM (slowest speed) |
| `maxWPM` | number | 100 | Maximum allowed WPM (fastest speed) |
| `targetAccuracy` | number | 97 | Target accuracy percentage |
| `errorRate` | number | 0.05 | Fake error probability (0.05 = 5% = 95% accuracy) |
| `fakeErrorChars` | string | `qwertyuiopasdfghjklzxcvbnm` | Characters to pick for fake errors |
| `keepFocus` | boolean | true | Warn when tab loses focus during typing |
| `autoAdvance` | boolean | true | Automatically advance to next lesson after completion |
| `speedPatterns` | string | `fixed` | Speed pattern name or combo |
| `lessonList` | string | (empty) | Comma-separated lesson indices to process |
| `lessonListCrawled` | string | (empty) | Cached lesson list from last crawl |
| `skipIcons` | string | `cmn-video` | Icon classes to always skip |

## Speed Patterns Documentation

### Single Patterns
- `fixed` - Constant speed, no variation
- `random` - Random variation between 50% and 150% of base delay
- `wave` - Sinusoidal wave pattern for natural speed variation
- `ramp` - Gradually speeds up over the course of the lesson
- `rampDown` - Gradually slows down over the course of the lesson

### Combo Patterns
Format: `pattern:weight,pattern:weight,...`

Example: `random:30,wave:40,ramp:30`

- Weights are relative percentages
- On each character, randomly selects a pattern based on weight
- Combines multiple variation patterns for more natural output

## How Smart Compensation Works with Speed Patterns

The algorithm:
1. Speed pattern gives a base delay
2. Smart compensation adjusts that base delay based on how much time is left
3. Result is clamped to `minWPM`/`maxWPM` bounds
4. 10% jitter added for extra human variation

This means you get the best of both worlds:
- The natural human variation from speed patterns
- The guaranteed target average WPM from smart compensation (even with errors)

## Permissions

- `@grant GM_setValue` - Required for config persistence
- `@grant GM_getValue` - Required for config persistence
- `@run-at document-end` - Ensure DOM is loaded before initialization
- `@match https://*.typingclub.com/*` - Only runs on TypingClub
