# Pre-Implementation Testing Guide
Follow these steps on a real TypingClub page in your browser, then fill in the results below.

---

## Table of Contents
1. [Delay & WPM Calculation Test](#1-delay--wpm-calculation-test)
2. [Click Simulation Test](#2-click-simulation-test)
3. [Page Detection Selector Test](#3-page-detection-selector-test)
4. [Star Detection & Silver Star Test](#4-star-detection--silver-star-test)
5. [Navigation Test](#5-navigation-test)
6. [Summary of Results](#6-summary-of-results)

---

## 1. Delay & WPM Calculation Test

### Tested lesson information
Total Characters: 273
Total Words (space-separated): 45
Standard Words (chars/5): 54.6
Spaces: 43

### Test Table
| Test # | Script Delay | Actual WPM | Error Rates  | Variation | Notes |
|--------|---------------|-------------|----------------|---------------|---------|
| 1 | 50 ms | 189 | 100% | - |
| 2 | 70 ms | 154 | 100% | - |
| 3 | 90 ms | 116 | 100% | - |
| 4 | 110 ms | 102 | 100% | - |
| 5 | 130 ms | 84 | 100% | - |
| 6 | 150 ms | 76 | 100% | - |
| 7 | 170 ms | 66 | 100% | - |
| 8 | 70 ms | 139 | F97% | - |
| 9 | 70 ms | 135 | F95% | - |
| 10 | 70 ms | 115 | F95% R85% | - |
| 11 | 40-100 ms | 148 | 100% | Random | 70.8 avg ms |
| 12 | 60-140 ms | 108 | 100% | Random | 100.7 avg ms |
| 13 | 40-120 ms | 133 | 100% | Ramp | - |
| 14 | 40-120 ms | 131 | 100% | Wave | - |

### Notes

**Syntax:** for Error Rates, F[]% is fake accuracy (typed wrong then fixed), R[]% is Real Accuracy (typed wrong and doesn't fix), these values are directly plugged in to \AutoTyper\01 Basic\Perferences.js

Fake and Real accuracy are generally 100% accurate, while some edits might be needed to make it calculate the total char and then implement if it isn't already in this way

---

## 2. Click Simulation Test

### Goal
Find which click simulation method works on TypingClub buttons.

### Steps
1. Navigate to a TypingClub program menu page (with list of levels)
2. Open DevTools Console
3. Try each method on a level button:

### Working Method ✓
```javascript
window.clickLesson = function(num) {
    const arena = document.querySelector('.lparena');
    if (!arena) return console.error("Could not find lesson area.");

    const numElements = Array.from(arena.querySelectorAll('.lsn_num'));
    const target = numElements.find(el => el.innerText.trim() === String(num));

    if (target) {
        const box = target.closest('.box-container');
        if (box) {
            const name = box.querySelector('.lsn_name')?.innerText || "";
            console.log(`Opening Lesson ${num}: ${name}`);
            box.click();
        }
    } else {
        console.warn(`Lesson ${num} not found.`);
    }
};

clickLesson()
```
this clicks a specific lesson in the menu page

```js
document.querySelector('.menu-btn').click();
```
this clicks the back to menu button, works for all lessons including completion pages

---

## 3. Page Detection Selector Test

```js
/**
 * edclub Page Detection Script
 * 
 * Instructions:
 * 1. Open DevTools (F12) -> Console.
 * 2. Paste this code and press Enter.
 * 3. It will report exactly which page you are currently on.
 */
(function() {
    function getPageName() {
        // 1. Menu Page
        if (document.querySelector('.lparena')) {
            return "Menu Page";
        }
        
        // 2. Lesson: Video Page
        if (document.querySelector('.LPVIDEO')) {
            return "Lesson Video Page";
        }
        
        // 3. Lesson: Unexecutable Page (Standard variant)
        if (document.getElementById('instruction')) {
            return "Lesson Unexecutable Page (Variant 1)";
        }
        
        // 4. Lesson: Game Page
        if (document.querySelector('.TPGAME')) {
            return "Lesson Game Page";
        }

        // 5. Theme Codder / Modern Layout (Executable vs. Unexecutable 2)
        if (document.querySelector('.TP_APP1.TPCMN') || document.body.classList.contains('theme-codder')) {
            if (document.querySelector('.classic-typing-container')) {
                return "Lesson Executable Page";
            } else {
                return "Lesson Unexecutable Page (Variant 2)";
            }
        }
        
        return "Unknown Page / Still Loading...";
    }

    const page = getPageName();
    console.log(`%c Current Page Identified: %c${page}`, 
                'color: #555; font-size: 1.1em;', 
                'color: #007bff; font-weight: bold; font-size: 1.2em;');
    
    // Store in global window for easy access in other scripts
    window.currentEdclubPage = page;
})();
```
this script can determine which page we are in, modify it if needed for the final version

Menu Page URL: https://[].typingclub.com/sportal/program-[].game
Lesson Page (May include all types): https://[].typingclub.com/sportal/program-[]/[].play

---

## 4. Star Detection & Silver Star Test

```js
(function() {
    const boxes = document.querySelectorAll('.box');
    const results = {}; // Using an object to map level numbers as keys
    
    Array.from(boxes).forEach((box, index) => {
        const num = box.querySelector('.lsn_num')?.textContent || (index + 1).toString();
        const name = box.querySelector('.lsn_name')?.textContent || 'Unknown';
        const starsEl = box.querySelector('.stars');
        const hasSilver = box.querySelector('.platinum-star') !== null;
        const isCompletedCheck = box.querySelector('.completion-check') !== null;
        const hasProgress = box.parentElement.classList.contains('has_progress');
        
        let starRating = ''; 
        let completedStatus = "not completed";

        if (hasSilver) {
            starRating = 6;
            completedStatus = "completed";
        } else if (starsEl) {
            const match = starsEl.className.match(/stars-(\d)/);
            if (match) {
                const val = parseInt(match[1]);
                if (val > 0) {
                    starRating = val;
                    completedStatus = "completed";
                } else if (isCompletedCheck || hasProgress) {
                    starRating = 0;
                    completedStatus = "completed";
                }
            }
        } else if (isCompletedCheck || hasProgress) {
            starRating = 0;
            completedStatus = "completed";
        }

        // Use level number as the key so it replaces the (index) column
        results[num] = { 
            name: name, 
            star: starRating, 
            completed: completedStatus 
        };
    });

    console.table(results);
})();
```
This outputs a table with level number: name, star:[], 'completed/not completed'
0 means completed (the green mark for video lessons)
1-5 is normal stars
6 means silver stars
star outputs ' ' if not completed

---

## 5. Different Lesson Selectors

```js
(function() {
    const boxes = Array.from(document.querySelectorAll('.box'));
    const grouped = {};
    let totalLessonsCounted = 0;

    boxes.forEach(box => {
        const icon = box.querySelector('.lesson_icon');
        const numEl = box.querySelector('.lsn_num');
        if (!icon || !numEl) return;

        const lessonNumber = numEl.innerText.trim();
        const classes = Array.from(icon.classList);
        const eClass = classes.find(c => c.startsWith('e-'));
        
        if (eClass) {
            const base = eClass.split('-')[1];
            const specificClass = classes.find(c => c.startsWith(`${base}-`) && c !== eClass);
            
            let identifier = eClass;
            if (specificClass) {
                identifier += ' ' + specificClass;
                if (base === 'qwerty') {
                    const parts = specificClass.split('-');
                    if (parts.length > 2 && (parts[1] === 'R' || parts[1] === 'C')) {
                        identifier = `${eClass} ${parts[0]}-${parts[2] || ''}`;
                    }
                }
            }
            
            if (!grouped[identifier]) grouped[identifier] = [];
            grouped[identifier].push(lessonNumber);
            totalLessonsCounted++;
        }
    });

    // Create the final text output
    let outputText = `TOTAL LESSONS FOUND: ${totalLessonsCounted}\n\n`;
    Object.entries(grouped).sort().forEach(([id, lessons]) => {
        outputText += `"${id}": lessons ${lessons.join(', ')}\n\n`;
    });

    // Option 1: Log to console (might still truncate in some browsers)
    console.log(outputText);

    // Option 2: "Download" as a file so you can see everything in Notepad
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_lessons.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("A file 'all_lessons.txt' has been downloaded with the complete list of 1182 lessons.");
})();
```

this script outputs, example:

```txt
TOTAL LESSONS FOUND: 1182

"e-cmn cmn-G3": lessons 34, 51, 83, 92, 106, 120, 133, 147, 155, 164, 170, 283, 322, 410, 448, 460, 528, 606, 619, 682, 736, 761, 798, 871, 892, 930, 983, 1032, 1103, 1136, 1160

"e-cmn cmn-Hand-l2": lessons 17, 32, 48, 79, 111, 129, 139, 154, 163, 176, 289, 295, 370, 414, 423, 437, 445, 494, 505, 595, 603, 669

"e-cmn cmn-Hand-r2": lessons 18, 33, 49, 80, 105, 116, 134, 146, 160, 169, 371, 439, 446, 490, 506, 597, 604, 670

"e-cmn cmn-celebration": lessons 1182

"e-cmn cmn-code": lessons 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 275, 276, 277, 278, 279, 280, 281, 282, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409

"e-cmn cmn-default": lessons 101, 102, 103, 104, 107, 108, 109, 112, 113, 114, 117, 118, 119, 121, 122, 123, 125, 126, 127, 130, 131, 132, 135, 136, 137, 364, 365, 366, 367, 499, 500, 501, 502, 663, 664, 665, 666, 823, 824, 825, 826, 827, 828, 829, 830, 831, 833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 1082, 1083, 1084, 1085, 1086, 1087

"e-cmn cmn-definition": lessons 348, 470, 537, 580, 629, 692, 746, 772, 820, 848, 870, 903, 929, 969, 995, 1018, 1041, 1077, 1091, 1114, 1159

"e-cmn cmn-drum": lessons 285, 286, 287, 288, 290, 291, 292, 293, 294, 296, 412, 413, 415, 416, 417, 418, 419, 420, 421, 422, 486, 487, 488, 489, 491, 492, 493, 495, 496, 497

"e-cmn cmn-dynamic": lessons 247, 284, 350, 411, 449, 472, 539, 582, 607, 631, 694, 748, 774, 799, 822, 850, 872, 905, 931, 950, 971, 997, 1020, 1043, 1079, 1093, 1116, 1161

"e-cmn cmn-fastest-typist4": lessons 178

"e-cmn cmn-game1": lessons 8, 15, 38, 45, 62, 74, 188, 206, 224, 234, 383, 551, 647, 662, 719, 725

"e-cmn cmn-game3": lessons 23, 50, 82, 99, 197, 215, 246, 310, 363, 485, 519

"e-cmn cmn-game4": lessons 110, 124, 138, 161, 177, 274, 297, 333, 395, 424, 471, 498, 538, 630, 693, 747, 773, 821, 832, 904, 942, 961, 996, 1007, 1042, 1171

"e-cmn cmn-game5": lessons 115, 128, 349, 569, 581, 788, 809, 849, 859, 883, 917, 949, 970, 1019, 1078, 1092, 1115, 1125, 1147, 1180

"e-cmn cmn-guide2": lessons 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928

"e-cmn cmn-home2": lessons 16

"e-cmn cmn-intro": lessons 1

"e-cmn cmn-practice": lessons 7, 11, 14, 21, 22, 26, 29, 31, 37, 41, 44, 47, 54, 59, 66, 71, 77, 81, 86, 87, 88, 89, 90, 91, 94, 95, 96, 97, 98, 100, 182, 183, 186, 187, 191, 192, 195, 196, 200, 201, 204, 205, 209, 210, 213, 214, 218, 219, 222, 223, 227, 228, 232, 233, 237, 238, 241, 242, 250, 251, 252, 253, 254, 255, 256, 257, 260, 300, 301, 304, 305, 306, 307, 308, 309, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 353, 354, 357, 358, 359, 360, 361, 362, 374, 375, 376, 377, 378, 379, 380, 381, 382, 426, 428, 430, 432, 434, 436, 438, 440, 442, 444, 451, 452, 453, 454, 455, 456, 457, 458, 459, 461, 462, 463, 464, 465, 466, 467, 468, 469, 475, 476, 479, 480, 481, 482, 483, 484, 509, 510, 513, 514, 515, 516, 517, 518, 521, 522, 523, 524, 525, 526, 527, 529, 530, 531, 532, 533, 534, 535, 536, 542, 543, 544, 545, 546, 547, 548, 549, 550, 584, 586, 588, 590, 592, 594, 596, 598, 600, 602, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 620, 621, 622, 623, 624, 625, 626, 627, 628, 634, 637, 640, 643, 646, 661, 674, 675, 676, 677, 678, 679, 680, 681, 684, 685, 688, 689, 690, 691, 697, 700, 703, 706, 709, 712, 715, 718, 722, 723, 724, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 789, 790, 791, 792, 793, 794, 795, 796, 797, 852, 853, 854, 855, 856, 857, 858, 861, 862, 863, 864, 865, 866, 867, 868, 869, 876, 877, 878, 879, 882, 885, 886, 887, 888, 889, 890, 891, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 933, 934, 935, 936, 937, 938, 939, 940, 941, 943, 944, 945, 946, 947, 948, 952, 953, 954, 955, 956, 957, 958, 959, 960, 963, 964, 965, 966, 967, 968, 975, 976, 977, 978, 979, 980, 981, 982, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1046, 1047, 1049, 1050, 1051, 1052, 1054, 1056, 1057, 1058, 1059, 1060, 1061, 1062, 1063, 1064, 1065, 1067, 1068, 1069, 1070, 1071, 1072, 1073, 1074, 1075, 1076, 1081, 1088, 1089, 1090, 1095, 1096, 1097, 1098, 1099, 1100, 1101, 1102, 1104, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112, 1113, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1126, 1127, 1128, 1129, 1130, 1131, 1132, 1133, 1134, 1135, 1137, 1138, 1139, 1140, 1141, 1142, 1143, 1144, 1145, 1146, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169, 1170, 1172, 1173, 1174, 1175, 1176, 1177, 1178, 1179, 1181

"e-cmn cmn-qwerty-history": lessons 63

"e-cmn cmn-sit-straight2": lessons 30

"e-cmn cmn-space-tab3": lessons 93

"e-cmn cmn-symbols": lessons 632, 635, 638, 641, 644

"e-cmn cmn-symbols2": lessons 248, 258, 477, 507, 511, 540, 695, 698, 701, 704, 707, 710, 713, 716

"e-cmn cmn-take-break": lessons 78

"e-cmn cmn-think-ideas2": lessons 46

"e-cmn cmn-tip": lessons 140, 141, 142, 143, 144, 145, 148, 149, 150, 151, 152, 153, 156, 157, 158, 159, 162, 165, 166, 167, 168, 171, 172, 173, 174, 175

"e-cmn cmn-travel1": lessons 55, 56, 60, 61, 67, 68, 72, 73, 84, 85, 229, 243, 244, 245, 368, 369, 425, 427, 429, 431, 433, 435, 441, 443, 447, 503, 504, 583, 585, 587, 589, 591, 593, 599, 601, 605, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 667, 668

"e-cmn cmn-video": lessons 179

"e-qwerty qwerty-A": lessons 193

"e-qwerty qwerty-C": lessons 230

"e-qwerty qwerty-DK": lessons 184

"e-qwerty qwerty-EI": lessons 211

"e-qwerty qwerty-FJ": lessons 180

"e-qwerty qwerty-GH": lessons 198

"e-qwerty qwerty-QP": lessons 220

"e-qwerty qwerty-RU": lessons 207

"e-qwerty qwerty-SL": lessons 189

"e-qwerty qwerty-TY": lessons 202

"e-qwerty qwerty-VM": lessons 225

"e-qwerty qwerty-WO": lessons 216

"e-qwerty qwerty-XB": lessons 239

"e-qwerty qwerty-ZN": lessons 235

"e-qwerty qwerty-a": lessons 12, 13

"e-qwerty qwerty-bn": lessons 75, 76

"e-qwerty qwerty-c": lessons 57, 58

"e-qwerty qwerty-caps": lessons 181, 185, 190, 194, 199, 203, 208, 212, 217, 221, 226, 231, 236, 240, 450, 520, 608, 671, 672, 673, 683, 686, 687, 749, 750, 775, 851, 860, 873, 874, 875, 880, 881, 884, 918, 932, 951, 962, 972, 973, 974, 984, 1021, 1044, 1045, 1048, 1053, 1055, 1066, 1080, 1094, 1117

"e-qwerty qwerty-co-zslash": lessons 69

"e-qwerty qwerty-dk": lessons 5, 6

"e-qwerty qwerty-ei": lessons 27, 28

"e-qwerty qwerty-fj": lessons 2, 3, 4

"e-qwerty qwerty-gh": lessons 19, 20

"e-qwerty qwerty-numbers": lessons 298, 299, 302, 303, 351, 352, 355, 356, 372, 373, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 737, 738, 739, 740, 741, 742, 743, 744, 745, 800, 801, 802, 803, 804, 805, 806, 807, 808, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017

"e-qwerty qwerty-qy": lessons 39, 40

"e-qwerty qwerty-r-symbols": lessons 473, 633, 636, 639, 642, 645, 660

"e-qwerty qwerty-ru": lessons 24, 25

"e-qwerty qwerty-sl": lessons 9, 10

"e-qwerty qwerty-symbols2": lessons 249, 259, 474, 478, 508, 512, 541, 696, 699, 702, 705, 708, 711, 714, 717, 721

"e-qwerty qwerty-symbols3": lessons 720

"e-qwerty qwerty-tp": lessons 42, 43

"e-qwerty qwerty-vm": lessons 52, 53

"e-qwerty qwerty-wo": lessons 35, 36

"e-qwerty qwerty-x": lessons 64, 65

"e-qwerty qwerty-z": lessons 70
```

the following is identifiers for each selector:

Executable = E,
Unexecutable (Any) = U

cmn-G3: U
cmn-Hand-l2: U
cmn-Hand-r2: U
cmn-celebration: U
cmn-code: E
cmn-default: U
cmn-definition: E
cmn-drum: E
cmn-dynamic: U
cmn-fastest-typist4: U
cmn-game1: U
cmn-game3: U
cmn-game4: U
cmn-game5: U
cmn-guide2: E
cmn-home2: U
cmn-intro: U
cmn-practice: E
cmn-qwerty-history: U
cmn-sit-straight2: U
cmn-space-tab3: U
cmn-symbols: U
cmn-symbols2: U
cmn-take-break: U
cmn-think-ideas2: U
cmn-tip: E
cmn-travel1: E
cmn-video: U
qwerty-A: U
qwerty-C: U
qwerty-DK: U
qwerty-EI: U
qwerty-FJ: U
qwerty-GH: U
qwerty-QP: U
qwerty-RU: U
qwerty-SL: U
qwerty-TY: U
qwerty-VM: U
qwerty-WO: U
qwerty-XB: U
qwerty-ZN: U
qwerty-a: U
qwerty-bn: U
qwerty-c: U
qwerty-caps: E
qwerty-co-zslash: U
qwerty-dk: U
qwerty-ei: U
qwerty-fj: U
qwerty-gh: U
qwerty-numbers: U
qwerty-qy: U
qwerty-r-symbols: U
qwerty-ru: U
qwerty-sl: U
qwerty-symbols2: E
qwerty-symbols3: E
qwerty-tp: U
qwerty-vm: U
qwerty-wo: U
qwerty-x: U
qwerty-z: E