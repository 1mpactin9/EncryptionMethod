// Step 01: Why doesn't the previous one work?
// The Keyboard Simulation Event was somehow blocked and unable to trigger the key press

// Test Code (Get Target Characters):
// const keyOverrides = {[String.fromCharCode(160)]: ' '};
// function getTargetCharacters() {
//     const elements = Array.from(document.querySelectorAll('.token span.token_unit'));
//     return elements.map(el => {
//         if (el.firstChild?.classList?.contains('_enter')){return 'ENTER';}
//         let char = el.textContent[0];
//         return keyOverrides.hasOwnProperty(char) ? keyOverrides[char] : char;});}
// const characters = getTargetCharacters();
// console.log(characters.join(''));

// This Code does work, successfully extracting the text from the .token spawn.token_unit elements
// Lets see if we can trigger key events manually, or somehow bypass the event blocking

// Step 02: Trouble Shooting
// It is actually much simpler then simulating key press
// TypingClub seems to just be blocking API inputs:
// if (window.core && window.core.record_keydown_time){useInternalApi=true;}
// Instead of API + DOM Simulation (Enhanced) or API Only (Original)

// Why not try the simplest method of 
// const target = document.activeElement;
// if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
//     target.value += 's';
//     target.dispatchEvent(new Event('input', { bubbles: true }));}

// IT WORKS!!!
// Let me simply add more features like realistic speed model and accuracy control...