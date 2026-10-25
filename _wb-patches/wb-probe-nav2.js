"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== go_upstairs везде ===");
ctx("go_upstairs", 150, 300, 10);
console.log("=== hasRoom2 ===");
ctx("hasRoom2", 120, 260, 12);
console.log("=== elena_room ===");
ctx("elena_room", 120, 260, 8);
