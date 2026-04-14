/*
--- TEST 3: PAGE DETECTION & PATTERN RECOGNITION ---
Purpose: Detect and classify different page types on TypingClub
Usage: Paste into browser console on any TypingClub page

Instructions:
1. Navigate to different TypingClub pages (menu, lesson, results, home, etc.)
2. Paste this script on each page
3. The script will output detailed page classification info
4. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md

What this tests:
- URL pattern recognition
- DOM structure analysis
- Unique elements per page type
- Detecting: Menu page, Lesson page, Results page, Video page, Custom level, Home page
*/

(() => {
  console.log("=".repeat(80));
  console.log("🧪 TEST 3: PAGE DETECTION & PATTERN RECOGNITION");
  console.log("=".repeat(80));

  // Comprehensive page analysis
  const analyzePage = () => {
    const analysis = {
      url: {
        full: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        hash: window.location.hash,
        search: window.location.search,
      },
      title: document.title,
      meta: {},
      dom: {
        uniqueClasses: [],
        uniqueIds: [],
        formElements: [],
        interactiveElements: [],
        lessonIndicators: [],
        gameIndicators: [],
        videoIndicators: [],
        menuIndicators: [],
      },
      classification: {}
    };

    // Extract meta information
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        analysis.meta[name] = content.substring(0, 100);
      }
    });

    // Scan body classes
    const bodyClasses = Array.from(document.body.classList);
    analysis.dom.uniqueClasses = bodyClasses.filter((v, i, a) => a.indexOf(v) === i);

    // Scan for unique ID patterns
    const allElements = document.querySelectorAll('[id]');
    const idPatterns = new Set();
    allElements.forEach(el => {
      const id = el.id;
      if (id.match(/lesson|level|stage|course|game|play|result|menu|program/i)) {
        idPatterns.add(id);
      }
    });
    analysis.dom.uniqueIds = Array.from(idPatterns).slice(0, 20);

    // Form elements (input fields)
    const inputs = document.querySelectorAll('input, textarea');
    analysis.dom.formElements = Array.from(inputs).map(el => ({
      tag: el.tagName,
      type: el.type || '(none)',
      name: el.name || '(none)',
      ariaHidden: el.getAttribute('aria-hidden'),
      class: Array.from(el.classList).join(' ').substring(0, 50)
    })).slice(0, 10);

    // Interactive elements
    const interactive = document.querySelectorAll('button, a, [role="button"], [onclick]');
    analysis.dom.interactiveElements = Array.from(interactive).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim()?.substring(0, 40) || '(empty)',
      href: el.href || el.getAttribute('href') || '(none)',
      role: el.getAttribute('role') || '(none)'
    })).slice(0, 15);

    // Lesson indicators
    const lessonSelectors = [
      '.token_unit', '.token', '.cursor', '.word', '.line',
      '[class*="token"]', '[class*="cursor"]', '[class*="word"]',
      '.game-text', '.lesson-text', '[class*="text"]'
    ];
    lessonSelectors.forEach(sel => {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          analysis.dom.lessonIndicators.push({
            selector: sel,
            count: found.length,
            sampleClass: found[0]?.className?.substring(0, 60)
          });
        }
      } catch (e) {}
    });

    // Game indicators
    const gameSelectors = [
      '.game', '.game-area', '.play-area', '[class*="game"]',
      '[class*="play"]', '.stage', '.exercise', '[data-game]'
    ];
    gameSelectors.forEach(sel => {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          analysis.dom.gameIndicators.push({
            selector: sel,
            count: found.length,
            sampleClass: found[0]?.className?.substring(0, 60)
          });
        }
      } catch (e) {}
    });

    // Video indicators
    const videoSelectors = [
      'video', 'iframe', '[class*="video"]', '[class*="player"]',
      '.youtube', '.vimeo', '[class*="embed"]'
    ];
    videoSelectors.forEach(sel => {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          analysis.dom.videoIndicators.push({
            selector: sel,
            count: found.length,
            sampleSrc: found[0]?.src || found[0]?.getAttribute('src') || '(none)'
          });
        }
      } catch (e) {}
    });

    // Menu indicators
    const menuSelectors = [
      '.menu', '.lesson-list', '.level-list', '[class*="menu"]',
      '[class*="list"]', '[class*="lesson"]', '[class*="level"]',
      '.program', '.course-map', '[class*="program"]'
    ];
    menuSelectors.forEach(sel => {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          analysis.dom.menuIndicators.push({
            selector: sel,
            count: found.length,
            sampleText: found[0]?.textContent?.trim()?.substring(0, 50) || '(empty)'
          });
        }
      } catch (e) {}
    });

    return analysis;
  };

  // Classify page type based on analysis
  const classifyPage = (analysis) => {
    const { url, title, dom } = analysis;
    const pathname = url.pathname.toLowerCase();
    const titleLower = title.toLowerCase();
    const allClasses = dom.uniqueClasses.join(' ').toLowerCase();
    const allText = document.body?.textContent?.toLowerCase() || '';

    let pageType = 'UNKNOWN';
    let confidence = 0;
    let reasons = [];

    // Check for LESSON page
    const lessonSignals = [];
    
    if (pathname.includes('.play')) {
      lessonSignals.push('URL contains .play');
      confidence += 40;
    }
    if (dom.lessonIndicators.length > 0) {
      lessonSignals.push(`Found ${dom.lessonIndicators.length} lesson indicator(s)`);
      confidence += 30;
    }
    if (dom.formElements.some(el => el.ariaHidden === 'true' || el.type === 'text')) {
      lessonSignals.push('Found input field (likely typing input)');
      confidence += 20;
    }
    if (allText.includes('wpm') && allText.includes('accuracy')) {
      lessonSignals.push('Page mentions WPM and accuracy');
      confidence += 10;
    }

    if (confidence >= 50) {
      pageType = 'LESSON_PAGE';
      reasons = lessonSignals;
      confidence = Math.min(confidence, 100);
    }

    // Check for MENU page
    if (pageType === 'UNKNOWN') {
      confidence = 0;
      const menuSignals = [];
      
      if (pathname.includes('.game') && pathname.includes('program-')) {
        menuSignals.push('URL matches program-XXX.game pattern');
        confidence += 40;
      }
      if (dom.menuIndicators.length > 0) {
        menuSignals.push(`Found ${dom.menuIndicators.length} menu indicator(s)`);
        confidence += 20;
      }
      if (dom.interactiveElements.filter(el => el.href && el.href.includes('program-')).length > 0) {
        menuSignals.push('Found links to program/lesson pages');
        confidence += 20;
      }
      if (titleLower.includes('program') || titleLower.includes('course') || titleLower.includes('lesson list')) {
        menuSignals.push('Title mentions program/course/lessons');
        confidence += 10;
      }

      if (confidence >= 50) {
        pageType = 'MENU_PAGE';
        reasons = menuSignals;
        confidence = Math.min(confidence, 100);
      }
    }

    // Check for RESULTS page
    if (pageType === 'UNKNOWN') {
      confidence = 0;
      const resultSignals = [];
      
      if (titleLower.includes('result') || titleLower.includes('complete') || titleLower.includes('summary')) {
        resultSignals.push('Title mentions result/complete/summary');
        confidence += 30;
      }
      if (allText.includes('your result') || allText.includes('lesson complete') || allText.includes('summary')) {
        resultSignals.push('Page mentions result/complete/summary');
        confidence += 30;
      }
      if (dom.uniqueClasses.some(c => c.toLowerCase().includes('result') || c.toLowerCase().includes('complete'))) {
        resultSignals.push('Found result/complete CSS classes');
        confidence += 20;
      }
      if (allText.match(/\d+\s*words?\s*per\s*minute/i) || allText.match(/accuracy\s*:\s*\d+/i)) {
        resultSignals.push('Page shows WPM or accuracy stats');
        confidence += 20;
      }

      if (confidence >= 50) {
        pageType = 'RESULTS_PAGE';
        reasons = resultSignals;
        confidence = Math.min(confidence, 100);
      }
    }

    // Check for VIDEO page
    if (pageType === 'UNKNOWN') {
      confidence = 0;
      const videoSignals = [];
      
      if (dom.videoIndicators.length > 0) {
        videoSignals.push(`Found ${dom.videoIndicators.length} video indicator(s)`);
        confidence += 50;
      }
      if (titleLower.includes('video') || titleLower.includes('watch') || titleLower.includes('tutorial')) {
        videoSignals.push('Title mentions video/watch/tutorial');
        confidence += 20;
      }
      if (allText.includes('video') || allText.includes('watch this')) {
        videoSignals.push('Page mentions video content');
        confidence += 20;
      }

      if (confidence >= 50) {
        pageType = 'VIDEO_PAGE';
        reasons = videoSignals;
        confidence = Math.min(confidence, 100);
      }
    }

    // Check for HOME/LANDING page
    if (pageType === 'UNKNOWN') {
      confidence = 0;
      const homeSignals = [];
      
      if (url.pathname === '/' || url.pathname === '') {
        homeSignals.push('Root path detected');
        confidence += 30;
      }
      if (titleLower.includes('typingclub') && !titleLower.includes('program') && !titleLower.includes('lesson')) {
        homeSignals.push('Generic TypingClub title');
        confidence += 20;
      }
      if (dom.interactiveElements.filter(el => el.href && el.href.includes('sportal')).length > 2) {
        homeSignals.push('Multiple links to sportal pages');
        confidence += 20;
      }

      if (confidence >= 40) {
        pageType = 'HOME_OR_LANDING';
        reasons = homeSignals;
        confidence = Math.min(confidence, 100);
      }
    }

    analysis.classification = {
      pageType: pageType,
      confidence: `${confidence}%`,
      reasons: reasons,
      supportedBy: {
        urlPatterns: {
          isGame: pathname.includes('.game'),
          isPlay: pathname.includes('.play'),
          isSportal: pathname.includes('/sportal/'),
          isProgram: pathname.includes('program-'),
        },
        lessonIndicatorCount: dom.lessonIndicators.length,
        menuIndicatorCount: dom.menuIndicators.length,
        videoIndicatorCount: dom.videoIndicators.length,
        gameIndicatorCount: dom.gameIndicators.length,
        formElementCount: dom.formElements.length,
      }
    };

    return analysis;
  };

  // Run analysis
  const analysis = analyzePage();
  const classified = classifyPage(analysis);

  // Output results
  console.log("\n📊 PAGE ANALYSIS RESULTS:");
  console.log("\n--- URL Information ---");
  console.table(classified.url);

  console.log("\n--- Page Title ---");
  console.log(classified.title);

  console.log("\n--- Meta Tags ---");
  if (Object.keys(classified.meta).length > 0) {
    console.table(classified.meta);
  } else {
    console.log('(no relevant meta tags)');
  }

  console.log("\n--- DOM Analysis ---");
  console.log(`\nLesson Indicators (${classified.dom.lessonIndicators.length} found):`);
  if (classified.dom.lessonIndicators.length > 0) {
    console.table(classified.dom.lessonIndicators);
  }

  console.log(`\nMenu Indicators (${classified.dom.menuIndicators.length} found):`);
  if (classified.dom.menuIndicators.length > 0) {
    console.table(classified.dom.menuIndicators);
  }

  console.log(`\nGame Indicators (${classified.dom.gameIndicators.length} found):`);
  if (classified.dom.gameIndicators.length > 0) {
    console.table(classified.dom.gameIndicators);
  }

  console.log(`\nVideo Indicators (${classified.dom.videoIndicators.length} found):`);
  if (classified.dom.videoIndicators.length > 0) {
    console.table(classified.dom.videoIndicators);
  }

  console.log(`\nForm Elements (${classified.dom.formElements.length} found):`);
  if (classified.dom.formElements.length > 0) {
    console.table(classified.dom.formElements);
  }

  console.log(`\nInteractive Elements (${classified.dom.interactiveElements.length} found):`);
  if (classified.dom.interactiveElements.length > 0) {
    console.table(classified.dom.interactiveElements);
  }

  console.log("\n--- PAGE CLASSIFICATION ---");
  console.log(`🏷️  Page Type: ${classified.classification.pageType}`);
  console.log(`🎯 Confidence: ${classified.classification.confidence}`);
  console.log(`📝 Reasons:`);
  classified.classification.reasons.forEach(reason => console.log(`   • ${reason}`));
  console.log("\nSupporting Evidence:");
  console.table(classified.classification.supportedBy);

  // Make analysis available for manual inspection
  window.lastPageAnalysis = classified;
  
  console.log("\n✅ Analysis complete!");
  console.log("\n📋 NEXT STEPS:");
  console.log("   1. Navigate to each page type (menu, lesson, results, video, home)");
  console.log("   2. Run this script on each page");
  console.log("   3. Copy the output for each page type into TEST_RESULTS_TEMPLATE.md");
  console.log("   4. Pay special attention to the 'Lesson Indicators' and 'Menu Indicators' tables");
  console.log("\n💡 The full analysis object is stored in: window.lastPageAnalysis");
  console.log("   You can inspect it with: console.table(window.lastPageAnalysis)");

})();
