/*
--- TEST 5 REVISED: DOM SCRAPER FOR MENU PAGE ---
Purpose: Scrape ALL lesson info from the TypingClub menu page
Usage: Paste into browser console on the menu page (program-XXX.game)

Scrapes from: /html/body/div[1]/div[1]/div[3]/div/div[3]/div
  → <div class="lsnrow" name="row-X">
    → <div class="box-container" role="button" aria-label="...">

Extracts per lesson:
  - Lesson number (.lsn_num)
  - Lesson name (.lsn_name text or title)
  - Lesson icon type (.lesson_icon classes, e.g. e-qwerty qwerty-fj)
  - Star count (.stars class, e.g. stars-5)
  - Platinum/silver status (.platinum-star element present)
  - Lock status (.box-container class: is_unlocked, has_progress, etc.)
  - aria-label text (contains star count and lesson info)
  - row/section name (from <h2> inside .lsnrow)
*/

(() => {
  console.log("=".repeat(80));
  console.log("🧪 TEST 5 REVISED: DOM SCRAPER FOR MENU PAGE");
  console.log("=".repeat(80));

  // Check if on menu page
  const rowsContainer = document.querySelector('body > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div');
  if (!rowsContainer) {
    console.error("❌ Menu rows container not found.");
    console.error("   Expected: /html/body/div[1]/div[1]/div[3]/div/div[3]/div");
    console.error("   Make sure you're on the menu page (program-XXX.game)");
    return;
  }

  const rows = rowsContainer.querySelectorAll('.lsnrow');
  if (rows.length === 0) {
    console.error("❌ No .lsnrow elements found inside the container.");
    // Debug: show what IS there
    const children = Array.from(rowsContainer.children).map(c => ({
      tag: c.tagName,
      classes: c.className?.substring(0, 80) || '(none)',
      name: c.getAttribute('name') || '(none)',
      text: c.textContent?.trim()?.substring(0, 40) || '(empty)'
    }));
    console.log("Container children:");
    console.table(children);
    return;
  }

  const scrapedData = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    rowCount: rows.length,
    totalLessons: 0,
    rows: [],
    allLessons: [],
    uniqueLessonIcons: new Set(),
    uniqueStatuses: new Set(),
    uniqueStarCounts: new Set()
  };

  rows.forEach((row, rowIdx) => {
    const rowData = {
      index: rowIdx,
      name: row.getAttribute('name') || row.querySelector('h2')?.textContent?.trim() || '(unknown)',
      rowClass: row.className,
      lessons: []
    };

    const boxContainers = row.querySelectorAll('.box-container');
    if (boxContainers.length === 0) {
      console.warn(`⚠️  Row "${rowData.name}" has no .box-container lessons`);
    }

    boxContainers.forEach((container, lessonIdx) => {
      const lesson = {
        // From box-container
        index: lessonIdx + 1,
        globalIndex: scrapedData.totalLessons + 1,
        row: rowData.name,
        classes: Array.from(container.classList).join(' '),
        ariaLabel: container.getAttribute('aria-label') || '',
        tabindex: container.getAttribute('tabindex') || '',

        // Lesson name
        lessonName: container.querySelector('.lsn_name')?.textContent?.trim() ||
                    container.querySelector('.lsn_name')?.getAttribute('title')?.trim() ||
                    '(unknown)',

        // Lesson number
        lessonNum: container.querySelector('.lsn_num')?.textContent?.trim() || '(unknown)',

        // Lesson icon type (all classes on .lesson_icon)
        lessonIcon: container.querySelector('.lesson_icon')?.className?.trim() || '(none)',

        // Star count from .stars class (e.g. "stars stars-5" → 5)
        starClass: container.querySelector('.stars')?.className?.trim() || '(none)',

        // Platinum/silver status
        isPlatinum: container.querySelector('.platinum-star') !== null,
        platinumTitle: container.querySelector('.platinum-star')?.getAttribute('title') || '',

        // Parse aria-label for extra info
        parsedAriaLabel: null
      };

      // Extract status from box-container classes
      const boxClasses = Array.from(container.classList);
      lesson.isUnlocked = boxClasses.includes('is_unlocked');
      lesson.hasProgress = boxClasses.includes('has_progress');
      lesson.isLocked = boxClasses.includes('is_locked');
      lesson.isCompleted = boxClasses.includes('is_completed');

      // Track unique values
      scrapedData.uniqueLessonIcons.add(lesson.lessonIcon);
      scrapedData.uniqueStarCounts.add(lesson.starClass);

      if (lesson.isPlatinum) scrapedData.uniqueStatuses.add('platinum');
      if (lesson.isLocked) scrapedData.uniqueStatuses.add('locked');
      else if (lesson.isUnlocked) scrapedData.uniqueStatuses.add('unlocked');
      if (lesson.isCompleted) scrapedData.uniqueStatuses.add('completed');
      if (lesson.hasProgress) scrapedData.uniqueStatuses.add('has_progress');

      // Parse star count from class
      const starMatch = lesson.starClass.match(/stars-(\d)/);
      lesson.starCount = starMatch ? parseInt(starMatch[1]) : null;

      // Parse aria-label for star count
      const ariaStarMatch = lesson.ariaLabel.match(/(\d+)\s+star/);
      if (ariaStarMatch) {
        lesson.ariaStarCount = parseInt(ariaStarMatch[1]);
      }

      rowData.lessons.push(lesson);
      scrapedData.allLessons.push(lesson);
      scrapedData.totalLessons++;
    });

    scrapedData.rows.push(rowData);
  });

  // Convert sets to arrays for display
  scrapedData.uniqueLessonIcons = Array.from(scrapedData.uniqueLessonIcons);
  scrapedData.uniqueStatuses = Array.from(scrapedData.uniqueStatuses);
  scrapedData.uniqueStarCounts = Array.from(scrapedData.uniqueStarCounts);

  // Output results
  console.log("\n" + "=".repeat(80));
  console.log("📊 MENU PAGE SCRAPING RESULTS:");
  console.log("=".repeat(80));

  console.log(`\n--- Summary ---`);
  console.log(`Total Rows: ${scrapedData.rowCount}`);
  console.log(`Total Lessons: ${scrapedData.totalLessons}`);
  console.log(`URL: ${scrapedData.url}`);

  console.log(`\n--- Unique Lesson Icon Types (${scrapedData.uniqueLessonIcons.length}) ---`);
  console.table(scrapedData.uniqueLessonIcons.map((icon, i) => ({ Index: i + 1, IconClasses: icon })));

  console.log(`\n--- Unique Status Types ---`);
  console.table(scrapedData.uniqueStatuses.map((s, i) => ({ Index: i + 1, Status: s })));

  console.log(`\n--- Unique Star Count Classes ---`);
  console.table(scrapedData.uniqueStarCounts.map((s, i) => ({ Index: i + 1, Class: s })));

  // Row-by-row summary
  console.log(`\n--- Row Summary ---`);
  const rowSummary = scrapedData.rows.map(r => ({
    Row: r.name,
    Lessons: r.lessons.length,
    Platinum: r.lessons.filter(l => l.isPlatinum).length,
    Locked: r.lessons.filter(l => l.isLocked).length,
    StarClasses: [...new Set(r.lessons.map(l => l.starClass))].join(', ')
  }));
  console.table(rowSummary);

  // First few lessons detail
  console.log(`\n--- Detailed Lesson Info (first 5) ---`);
  scrapedData.allLessons.slice(0, 5).forEach(l => {
    console.log(`\n  #${l.globalIndex} [${l.row}] Lesson ${l.lessonNum}: ${l.lessonName}`);
    console.log(`    Icon: "${l.lessonIcon}"`);
    console.log(`    Stars: ${l.starClass} (count: ${l.starCount}), aria: ${l.ariaStarCount || '?'} stars`);
    console.log(`    Platinum: ${l.isPlatinum ? `YES (${l.platinumTitle})` : 'NO'}`);
    console.log(`    Status: ${l.isLocked ? 'locked' : 'unlocked'}, ${l.isCompleted ? 'completed' : 'not completed'}, ${l.hasProgress ? 'has_progress' : 'no progress'}`);
    console.log(`    Aria-label: "${l.ariaLabel}"`);
    console.log(`    Classes: ${l.classes}`);
  });

  // Full lesson table (compact)
  console.log(`\n--- All Lessons (Compact) ---`);
  const compactTable = scrapedData.allLessons.map(l => ({
    '#': l.globalIndex,
    Row: l.row.substring(0, 15),
    Num: l.lessonNum,
    Name: l.lessonName.substring(0, 25),
    Icon: l.lessonIcon,
    Stars: l.starCount !== null ? l.starCount : '?',
    Pt: l.isPlatinum ? 'Y' : 'N',
    Locked: l.isLocked ? 'Y' : 'N',
    AriaStars: l.ariaStarCount || '?'
  }));
  console.table(compactTable);

  window.scrapedMenuData = scrapedData;

  console.log("\n✅ Scraping complete!");
  console.log("\n📋 NEXT STEPS:");
  console.log("   1. Verify the scraped data matches what you see on the menu page");
  console.log("   2. Check if all lesson icon types and statuses are captured correctly");
  console.log("   3. Copy the full output into TEST_RESULTS_TEMPLATE.md");
  console.log("\n💡 Full data: window.scrapedMenuData");

})();
