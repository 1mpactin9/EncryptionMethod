/*
--- LESSON TESTER SCRIPT ---
Purpose: Test ALL lessons on the menu page to determine which are auto-completeable.
         Logs failed lessons with their icon classes for exclusion.
Usage: Paste into browser console on the TypingClub menu page.

How it works:
1. Scrapes all lessons from the menu page
2. Clicks each lesson one by one
3. Waits 5 seconds for typing engine to appear
4. If .token span.token_unit found → PASS
5. If not found → FAIL (logs icon class, name, reason)
6. Returns to menu and repeats for next lesson
7. Outputs a final report with all failed lesson icons to skip

Output: Full report in console + stored in window.lessonTestResults
*/

(() => {
  console.log("=".repeat(80));
  console.log("🧪 LESSON TESTER: Testing all lessons for auto-compatibility");
  console.log("=".repeat(80));

  // Scrape lessons
  function scrapeLessons() {
    const container = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
    if (!container) {
      console.error("❌ Menu container not found. Must be on menu page.");
      return [];
    }
    const rows = container.querySelectorAll('.lsnrow');
    const lessons = [];
    let globalIndex = 0;
    rows.forEach(row => {
      const rowName = row.getAttribute('name') || row.querySelector('h2')?.textContent?.trim() || 'unknown';
      row.querySelectorAll('.box-container').forEach(el => {
        globalIndex++;
        lessons.push({
          globalIndex,
          row: rowName,
          name: el.querySelector('.lsn_name')?.textContent?.trim() || el.querySelector('.lsn_name')?.getAttribute('title')?.trim() || 'unknown',
          num: el.querySelector('.lsn_num')?.textContent?.trim() || '?',
          iconClass: el.querySelector('.lesson_icon')?.className?.trim() || '(none)',
          isPlatinum: el.querySelector('.platinum-star') !== null,
          starClass: el.querySelector('.stars')?.className?.trim() || '(none)',
          element: el,
        });
      });
    });
    return lessons;
  }

  // Detect if typing engine is present
  function hasTypingEngine() {
    return document.querySelector('input[aria-hidden="true"]') !== null &&
           document.querySelectorAll('.token span.token_unit').length > 0;
  }

  // Detect if results page
  function hasResults() {
    return document.querySelector('.performance-results') !== null ||
           document.querySelector('div[tabindex="3"]')?.textContent?.includes('wpm');
  }

  // Navigate back to menu
  function goToMenu() {
    const menuLink = document.querySelector('a[href*="program-"][href*=".game"]');
    if (menuLink) {
      menuLink.click();
      return true;
    }
    window.history.back();
    return true;
  }

  // Wait for condition
  function waitFor(condition, timeoutMs = 8000) {
    return new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        if (condition()) { resolve(true); return; }
        if (Date.now() - start > timeoutMs) { resolve(false); return; }
        setTimeout(check, 100);
      };
      check();
    });
  }

  // Sleep
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runTest() {
    const lessons = scrapeLessons();
    if (lessons.length === 0) return;

    // DEBUG: Show what icon classes we actually found
    const iconCounts = {};
    lessons.forEach(l => {
      iconCounts[l.iconClass] = (iconCounts[l.iconClass] || 0) + 1;
    });
    console.log('\n🔍 DEBUG: Icon classes found:');
    console.table(Object.entries(iconCounts).sort((a, b) => b[1] - a[1]).map(([icon, count]) => ({ icon, count, isE_qwerty: icon.startsWith('e-qwerty') })));

    // Pre-filter: skip games, videos. INCLUDE completed lessons too — we need to test all e-qwerty icons
    const testable = lessons.filter(l => {
      if (l.iconClass.includes('cmn-game') || l.iconClass.includes('cmn-G3')) return false;
      if (l.iconClass.includes('cmn-video')) return false;
      if (!l.iconClass.includes('e-qwerty')) return false;
      return true;
    });

    console.log(`\n📋 Found ${lessons.length} total lessons, testing ${testable.length} e-qwerty lessons (includes completed)`);
    console.log(`⏱️  This will take approximately ${(testable.length * 10 / 60).toFixed(1)} minutes.\n`);

    const results = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      total: testable.length,
      allTotal: lessons.length,
      passed: [],
      failed: [],
      skipped: [],
      failedIcons: new Set(),
    };

    for (let i = 0; i < testable.length; i++) {
      const lesson = testable[i];
      const progress = `[${i + 1}/${testable.length}]`;

      // Click lesson
      lesson.element.click();
      console.log(`${progress} 🧪 Testing #${lesson.globalIndex}: "${lesson.name}" (icon: ${lesson.iconClass})...`);

      // Wait for typing engine or results
      await sleep(2000); // initial load delay

      const typingFound = await waitFor(hasTypingEngine, 6000);

      if (typingFound) {
        const charCount = document.querySelectorAll('.token span.token_unit').length;
        console.log(`${progress} ✅ PASS — ${charCount} characters found`);
        results.passed.push({
          index: lesson.globalIndex,
          name: lesson.name,
          icon: lesson.iconClass,
          chars: charCount,
        });
      } else if (hasResults()) {
        // Auto-completed instantly (very short lesson)
        console.log(`${progress} ✅ PASS — Lesson completed instantly`);
        results.passed.push({
          index: lesson.globalIndex,
          name: lesson.name,
          icon: lesson.iconClass,
          chars: 0,
        });
      } else {
        console.log(`${progress} ❌ FAIL — No typing engine found. Icon: ${lesson.iconClass}`);
        results.failed.push({
          index: lesson.globalIndex,
          name: lesson.name,
          icon: lesson.iconClass,
          row: lesson.row,
          reason: 'no_typing_engine_after_6s',
        });
        results.failedIcons.add(lesson.iconClass);
      }

      // Navigate back to menu
      goToMenu();
      await sleep(2000); // wait for menu to load

      // Verify we're back on menu
      const isMenu = document.querySelector('.lsnrow') !== null;
      if (!isMenu) {
        console.warn(`⚠️  Not back on menu after lesson #${lesson.globalIndex}. Retrying navigation...`);
        goToMenu();
        await sleep(3000);
      }
    }

    // Convert sets to arrays
    results.failedIcons = Array.from(results.failedIcons);

    // Output report
    console.log("\n" + "=".repeat(80));
    console.log("📊 LESSON TEST REPORT");
    console.log("=".repeat(80));

    console.log(`\nTotal Lessons (all): ${lessons.length}`);
    console.log(`🧪 Tested: ${testable.length}`);
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⏭️  Skipped (platinum): ${results.skipped.length}`);

    console.log(`\n--- Failed Lesson Icons (ADD TO SKIP LIST) ---`);
    if (results.failedIcons.length > 0) {
      console.log(results.failedIcons.join(', '));
    } else {
      console.log('(None)');
    }

    console.log(`\n--- Failed Lessons Detail ---`);
    if (results.failed.length > 0) {
      console.table(results.failed.map(f => ({
        '#': f.index,
        Name: f.name.substring(0, 30),
        Icon: f.icon,
        Row: f.row,
        Reason: f.reason,
      })));
    } else {
      console.log('(All lessons passed!)');
    }

    console.log(`\n--- Passed Lessons (first 10) ---`);
    console.table(results.passed.slice(0, 10).map(p => ({
      '#': p.index,
      Name: p.name.substring(0, 30),
      Icon: p.icon,
      Chars: p.chars,
    })));
    if (results.passed.length > 10) {
      console.log(`... and ${results.passed.length - 10} more`);
    }

    console.log(`\n--- Skip Icons Config String ---`);
    const skipString = results.failedIcons.join(',');
    console.log(`Copy this to the script's skipIcons config:`);
    console.log(`'${skipString}'`);

    window.lessonTestResults = results;

    console.log("\n✅ Testing complete!");
    console.log("Full results: window.lessonTestResults");
  }

  runTest();

})();
