"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== возврат в таверну ===");
ctx("function Ume\\(", 20, 400, 1);
console.log("=== где решается экран по локации ===");
ctx("=== \\\"elena_room\\\"", 200, 220, 12);
