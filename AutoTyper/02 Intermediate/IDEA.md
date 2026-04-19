before making, these information need to be tested before starting for the completion of the script
1. test how does delay&accuracy work with the wpm using example script with different variable settings
2. scraping scripts, how does clicking works, understand the logic for simulating clicks, record different activations
3. dtection script for patterns of the current page, something else, menu, level, level completion page
4. different game icon detection for scraping
5. silver star and 5 star difference in code for scraping

script procedure
initilize:
1. detect current page
2. goto menu page
	1. example: http://qsiszsc.typingclub.com/sportal/program-177.game
	2. http://[].typingclub.com/sportal/program-[].game
3. scrap level information
	1. level number
	2. completed?
	3. completed stars (0-6) 6 represents silvver star which is better than 5
	4. level url (doesn't record url i think it simulates a click to go to page)

UI:
1. Start/Stop (toggle button), any user input that affects the automation will stop the script, such as keyboard inputs within levels, mouse clicking onto interactive buttons that affects the procedure
	1. goes to level by order of scrapped info, stops if nothing in scrapped info, wrong format, couldn't go to level page, currently not in menu page (with all the lessons listed), output error or warning for issues that doesn't affect usage
	2. background detection to see whether if this is a level page (by check url format)
	3. quick check if this level works with the script, or by detecting if this level s game or video or customized level for typing, url format (if needed): https://[].typingclub.com/sportal/program-[]/[].play
	4. after these quick checks that doesn't necessarily affect the overall speed of completion, it activates the script (which is modified for wpm and accuracy parameters)
	5. after completion, detected by page change? it enters ENTER key if the next level regarding queue is right after the one currently on, if not it goes back to menu page and navigates to the next queue level
	6. repeat this process
	7. stopping it will immediately stop, no redirecting back to menu page, just stops everything
2. Restart
	1. goes back to menu page
3. WPM and accuracy parameters
	1. Global WPM
		1. this is the speed
		2. which is converted to delays between each keys regarding to a reverse of the real formula for the actual engine to calculate in consider of real and fake accuracy, also starting and ending with different speeds affect the final speed
		3. the very final wpm no matter what should be this value when finishing levels
		4. logging should be included for estimated wpm, real and fake accuracy after each level, the actual one in the page (scrapped after each level), should also be included
	2. Varying
		1. how much wpm it varies from the global wpm, which determines the minimum wpm when typing slow and the maximum wpm when typing fast
		2. the higher the value the more unstable the wpm is
		3. the wpm engine also changes between words, meaning typing easier words are faster and slightly slower for uncommon word combinations, basic weight engine
		4. global monitor to ensure after everything the wpm ends up with the global one
	3. Real Accuracy
	4. Fake Accuracy
4. Scrap Button + Scrapped Info (text bar, opens an alternative bigger text bar, with level numbers separated with commas, editable)
	1. clicking scrap activates
	2. scraps the page within specific values for non-game (script doesn't work) level numbers
5. Scrap parameters
	1. what specific range (it determines how much it complete) (range selection+value)
	2. whether if it redo 4 or less star lessons (selection+value) 0-5 (doesn't include silver stars if the value is set to 5)
6. Logging
	1. Full logging
	2. perfessional logging format
	3. date + indicate (ERROR, WARNING, SUCCESS, IN PROGRESS,... something like that): specific-info