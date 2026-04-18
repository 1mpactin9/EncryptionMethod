# AutoTyper - Combined Optimized Build

This is the main folder containing the complete, production-ready Tampermonkey auto-typer for TypingClub. This build combines the best features from all previous development iterations into one unified script.

## Project Status

✅ **Complete and ready to use** - v2.0.0 combines:
- Full-featured UI from legacy AUTOTYPER_MAIN
- Robust typing engine from 01 Basic/InitialScript
- Smart compensating delay algorithm from 01 Basic/TertiaryScript

## Core Features

- Configurable target WPM with `minWPM`/`maxWPM` bounds
- Fake accuracy simulation (types wrong character → backspace → correct)
- **Smart compensating delay** ensures target WPM is hit even after errors
- Multiple speed patterns for human-like variation (fixed, random, wave, ramp, combo)
- Complete floating UI with Catppuccin Mocha theme
- Configuration persistence between sessions
- Menu scraping with automatic lesson filtering
- Multi-lesson queue with auto-advance
- Pause/Resume/Abort controls
- Live logging with export
- Automatic results parsing

## Installation

1. Install Tampermonkey or Violentmonkey browser extension
2. Open Tampermonkey → Create a new script
3. Copy the entire contents of `AUTOTYPER_MAIN.user.js` from this folder
4. Paste into the editor and save
5. Navigate to your TypingClub program page and the script will automatically load

## Usage

1. On the TypingClub program menu page, open the AutoTyper panel
2. Adjust WPM, accuracy, and other settings to your preference
3. Click **Crawl** to automatically find all incomplete typing lessons
4. Click **Start** to begin automatic processing
5. The script will auto-advance through all lessons in the queue
6. Results are logged in the stats panel and live log

## Limitations

- Only works on the **old TypingClub layout** with the token-based character display (`token span.token_unit`)
- Does not work on the new TypingClub layout (different DOM structure)
- Only processes lessons with the `e-qwerty` icon class (skips games, videos, etc.)

## File Overview

- `AUTOTYPER_MAIN.user.js` - The complete userscript
- `SPECS.md` - Technical specifications and architecture documentation
- `CHANGELOG.md` - Version history and notable changes
- `PROJECT.md` - This file - project overview and usage

## Active Todos

- [ ] Test on multiple TypingClub programs to confirm selector stability
- [ ] Add "start from specific lesson index" option
- [ ] Add dark/light theme toggle for UI

## Done

- ✅ Transfer all relevant code from legacy folders to main
- ✅ Merge smart compensation from 01 Basic into full UI script
- ✅ Add `minWPM`/`maxWPM` UI controls
- ✅ Write full technical specifications
- ✅ Write changelog
