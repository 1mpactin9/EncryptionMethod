/*
--- TEST 4: WPM & ACCURACY EXTRACTOR (RESULTS PAGE) ---
Purpose: Extract actual WPM and accuracy from the TypingClub results page
Usage: Paste into browser console on a lesson results/completion page

This is the ONLY useful part from the original Test 4.
Everything else (star counting on results page) is not needed.
*/

(() => {
  console.log("🧪 TEST 4: WPM & ACCURACY EXTRACTOR");

  const tabindex3 = document.querySelector('div[tabindex="3"]');
  if (!tabindex3) {
    console.error("❌ Not on a results page. Looking for div[tabindex='3']");
    return;
  }

  const text = tabindex3.textContent;
  const wpmMatch = text.match(/speed\s+of\s+(\d+)\s+wpm/);
  const accMatch = text.match(/accuracy\s+was\s+(\d+)%/);
  const realAccMatch = text.match(/real\s+accuracy\s+of\s+(\d+)%/);
  const durationMatch = text.match(/in\s+(\d+)\s+seconds/);

  const results = {
    wpm: wpmMatch ? parseInt(wpmMatch[1]) : null,
    accuracy: accMatch ? parseInt(accMatch[1]) : null,
    realAccuracy: realAccMatch ? parseInt(realAccMatch[1]) : null,
    duration: durationMatch ? parseInt(durationMatch[1]) + 's' : null,
    rawText: text
  };

  console.log("\n--- Results Page Stats ---");
  console.table(results);
  console.log(`\nRaw text: "${results.rawText}"`);
  window.lastResultsStats = results;
})();
