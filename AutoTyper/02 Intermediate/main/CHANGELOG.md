# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-18

### Added
- Combined all best features from 01 Basic and 02 Intermediate/legacy into one unified script
- **Smart compensating delay algorithm** that dynamically adjusts to hit target WPM even after errors consume extra time
- Added `minWPM`/`maxWPM` configuration bounds with UI sliders for precise speed control
- Complete Catppuccin Mocha-themed floating UI panel with all controls
- Configuration persistence via `GM_setValue`/`GM_getValue` - settings survive page reloads
- Menu scraping with intelligent lesson filtering:
  - Automatically finds all typing lessons
  - Skips games, videos, and already completed (5-star/platinum) lessons
- Multi-lesson queue with auto-advance to next lesson automatically
- Pause/Resume/Abort controls for full execution control
- Live logging panel with clipboard export capability for debugging
- Results parsing - automatically extracts achieved WPM and accuracy from results page
- Focus warning notifies when tab loses focus (which affects timing)

### Changed
- Replaced incomplete `dispatchKeyEvent`-only typing with robust `forceType` from InitialScript featuring:
  - Complete `keydown` → `input.value` update → `input` event → `keyup` sequence
  - Explicit `input.value` updates for reliability even when events are blocked
  - Full event properties (key, code, keyCode, which, bubbles, cancelable, isTrusted)
  - Proper handling for all special cases (Enter, Space, Backspace, non-breaking spaces)
- Improved character extraction with proper handling for:
  - `_enter` class detection for newline/enter
  - Non-breaking spaces (`\u00A0`) converted consistently to regular spaces
  - Empty text elements handled correctly
- Merged speed patterns with smart compensation - you get both human-like variation patterns AND accurate target WPM through dynamic compensation
- UI updated with modern Catppuccin color scheme for better readability

### Fixed
- **WPM drift** caused by extra time consumed by fake error + backspace cycles is now fixed by dynamic compensation - the algorithm automatically speeds up to catch up
- **Inconsistent character extraction** fixed by the robust method from InitialScript that handles all edge cases
- **Incomplete keyboard event simulation** that could be blocked by page JavaScript is fixed by explicitly updating the input value before sending the input event
- Missing UI controls for WPM bounds - now fully configurable via sliders

## Notes
- This version combines all tested features from previous iterations into one production-ready script
- Only works on the old TypingClub layout with token-based character display
- Requires Tampermonkey or Violentmonkey userscript manager
