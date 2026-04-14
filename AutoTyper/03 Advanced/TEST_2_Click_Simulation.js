/*
--- TEST 2: CLICK SIMULATION & NAVIGATION ---
Purpose: Test how to programmatically navigate TypingClub, trigger lessons, and detect page transitions
Usage: Paste into browser console on the TypingClub menu page (e.g., http://[].typingclub.com/sportal/program-[].game)

Instructions:
1. Navigate to a TypingClub menu/program page (where all lessons are listed)
2. Paste this script into the console
3. The script will test different click simulation methods
4. Observe the console output and fill in TEST_RESULTS_TEMPLATE.md

What this tests:
- Different methods to trigger clicks (dispatchEvent, .click(), etc.)
- Navigation between menu and lessons
- Page transition detection
- URL pattern detection
*/

(() => {
  console.log("=".repeat(80));
  console.log("🧪 TEST 2: CLICK SIMULATION & NAVIGATION");
  console.log("=".repeat(80));

  // Test 1: URL Analysis
  console.log("\n📍 CURRENT URL ANALYSIS:");
  console.log(`   Full URL: ${window.location.href}`);
  console.log(`   Protocol: ${window.location.protocol}`);
  console.log(`   Host: ${window.location.host}`);
  console.log(`   Pathname: ${window.location.pathname}`);
  console.log(`   Hash: ${window.location.hash}`);
  console.log(`   Search: ${window.location.search}`);

  // Detect page type from URL
  const detectPageTypeFromURL = () => {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    if (pathname.includes('/sportal/program-') && pathname.endsWith('.game')) {
      return { type: 'MENU_PAGE', confidence: 'HIGH', pattern: 'program-XXX.game' };
    }
    if (pathname.includes('/sportal/program-') && pathname.includes('.play')) {
      return { type: 'LESSON_PAGE', confidence: 'HIGH', pattern: 'program-XXX/YYY.play' };
    }
    if (pathname.includes('/sportal/')) {
      return { type: 'SPORTAL_PAGE', confidence: 'MEDIUM', pattern: 'sportal present' };
    }
    if (pathname.includes('typingclub.com')) {
      return { type: 'HOME/OTHER', confidence: 'LOW', pattern: 'typingclub domain' };
    }
    return { type: 'UNKNOWN', confidence: 'NONE', pattern: 'no match' };
  };

  const pageInfo = detectPageTypeFromURL();
  console.log(`\n🔍 DETECTED PAGE TYPE: ${pageInfo.type} (confidence: ${pageInfo.confidence})`);
  console.log(`   Pattern: ${pageInfo.pattern}`);

  // Test 2: Find Clickable Elements
  console.log("\n🖱️  FINDING CLICKABLE ELEMENTS:");
  
  const clickableSelectors = [
    'a', 'button', '[role="button"]', '.clickable', '.level', '.lesson',
    '[class*="level"]', '[class*="lesson"]', '[class*="click"]',
    '.game-item', '.program-item', '[data-level]', '[data-lesson]',
    '.stage', '.course', '.module'
  ];

  const foundElements = {};
  
  for (const selector of clickableSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        foundElements[selector] = {
          count: elements.length,
          sampleText: elements[0]?.textContent?.trim()?.substring(0, 50) || '(empty)',
          sampleHref: elements[0]?.href || elements[0]?.getAttribute('href') || '(none)',
          hasOnClick: typeof elements[0]?.onclick === 'function' || elements[0]?.getAttribute('onclick') !== null
        };
      }
    } catch (e) {
      // Invalid selector
    }
  }

  if (Object.keys(foundElements).length > 0) {
    console.log("   Found clickable elements:");
    console.table(foundElements);
  } else {
    console.log("   ⚠️  No standard clickable elements found with common selectors.");
    console.log("   Trying broader search...");
    
    // Search for elements with common lesson-related classes
    const allDivs = document.querySelectorAll('div[class]');
    const potentialLessons = [];
    
    for (const div of allDivs) {
      const className = div.className;
      if (typeof className === 'string' && 
          (className.toLowerCase().includes('level') || 
           className.toLowerCase().includes('lesson') ||
           className.toLowerCase().includes('stage') ||
           className.toLowerCase().includes('exercise'))) {
        potentialLessons.push({
          class: className.substring(0, 60),
          text: div.textContent?.trim()?.substring(0, 30) || '(empty)',
          hasChildren: div.children.length
        });
        
        if (potentialLessons.length >= 10) break;
      }
    }
    
    if (potentialLessons.length > 0) {
      console.log("   Potential lesson containers:");
      console.table(potentialLessons);
    }
  }

  // Test 3: Click Simulation Methods
  console.log("\n🔧 CLICK SIMULATION METHODS:");
  
  window.testClickMethods = (element) => {
    if (!element) {
      console.log("   Usage: testClickMethods(element)");
      console.log("   Example: testClickMethods(document.querySelector('a'))");
      console.log("   Or: testClickMethods(document.querySelectorAll('.level')[0])");
      return;
    }

    console.log(`\n   Testing click on: ${element.tagName} - ${element.textContent?.trim()?.substring(0, 30)}`);
    
    const methods = [
      {
        name: 'Native .click()',
        fn: () => { element.click(); }
      },
      {
        name: 'dispatchEvent MouseEvent',
        fn: () => {
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            isTrusted: false
          });
          element.dispatchEvent(event);
        }
      },
      {
        name: 'Trusted-like MouseEvent',
        fn: () => {
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            isTrusted: true
          });
          element.dispatchEvent(event);
        }
      },
      {
        name: 'jQuery trigger (if available)',
        fn: () => {
          if (window.jQuery) {
            $(element).trigger('click');
          } else {
            console.log('   jQuery not available');
          }
        }
      }
    ];

    console.log("   Methods defined. To test, call:");
    console.log("   testClickMethods(element).method0()  // Native .click()");
    console.log("   testClickMethods(element).method1()  // dispatchEvent MouseEvent");
    // etc.

    return {
      method0: methods[0].fn,
      method1: methods[1].fn,
      method2: methods[2].fn,
      method3: methods[3].fn
    };
  };

  // Test 4: Navigation Test
  console.log("\n🧭 NAVIGATION TEST:");
  
  window.testNavigateToLesson = (lessonIndex = 0) => {
    console.log(`\n   Attempting to navigate to lesson ${lessonIndex}...`);
    
    // Try common lesson selectors
    const lessonSelectors = [
      `.level:nth-of-type(${lessonIndex + 1})`,
      `.lesson:nth-of-type(${lessonIndex + 1})`,
      `[data-level]:nth-of-type(${lessonIndex + 1})`,
      'a.level', 'a.lesson',
      '.clickable:first-child',
      'a:first-child'
    ];

    for (const selector of lessonSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`   Found element with selector: ${selector}`);
        console.log(`   Element: ${element.tagName} - "${element.textContent?.trim()?.substring(0, 30)}"`);
        console.log(`   Href: ${element.href || element.getAttribute('href') || '(none)'}`);
        
        // Test different click methods
        console.log("\n   Testing native .click()...");
        element.click();
        
        // Wait and check if page changed
        setTimeout(() => {
          console.log(`\n   Current URL after click: ${window.location.href}`);
          const newPageInfo = detectPageTypeFromURL();
          console.log(`   Page type: ${newPageInfo.type}`);
        }, 2000);
        
        return element;
      }
    }
    
    console.log("   ⚠️  No lesson elements found with standard selectors.");
    console.log("   Please manually identify a lesson element and pass it to testClickMethods(element)");
    return null;
  };

  // Test 5: Page Change Detection
  console.log("\n👁️  PAGE CHANGE DETECTION TEST:");
  
  window.startPageChangeDetection = () => {
    let lastURL = window.location.href;
    let lastPageType = detectPageTypeFromURL().type;
    
    console.log("   🔍 Watching for page changes... (check console every 500ms)");
    console.log(`   Initial URL: ${lastURL}`);
    console.log(`   Initial Page Type: ${lastPageType}`);
    
    window.pageDetectionInterval = setInterval(() => {
      const currentURL = window.location.href;
      const currentPageType = detectPageTypeFromURL().type;
      
      if (currentURL !== lastURL) {
        console.log(`\n   🔄 PAGE CHANGE DETECTED!`);
        console.log(`   Old URL: ${lastURL}`);
        console.log(`   New URL: ${currentURL}`);
        console.log(`   Old Type: ${lastPageType}`);
        console.log(`   New Type: ${currentPageType}`);
        
        lastURL = currentURL;
        lastPageType = currentPageType;
      }
    }, 500);
    
    console.log("   Detection started. Navigate manually to test.");
    console.log("   Stop with: clearInterval(window.pageDetectionInterval)");
  };

  console.log("\n✅ Test 2 loaded successfully!");
  console.log("\n📋 AVAILABLE TEST FUNCTIONS:");
  console.log("   detectPageTypeFromURL()                          - Detect current page type");
  console.log("   testClickMethods(element)                        - Test different click methods on an element");
  console.log("   testNavigateToLesson(lessonIndex)                - Try to navigate to a lesson");
  console.log("   startPageChangeDetection()                       - Watch for page changes");
  
  console.log("\n⚠️  NEXT STEPS:");
  console.log("   1. Run: detectPageTypeFromURL()  and note the result");
  console.log("   2. Look at the 'Found clickable elements' table above");
  console.log("   3. Try: testNavigateToLesson(0)  to navigate to the first lesson");
  console.log("   4. Manually navigate around TypingClub and observe the console output");
  console.log("   5. Fill in your findings in TEST_RESULTS_TEMPLATE.md");

})();
