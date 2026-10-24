"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== функция доверия ===");
ctx("function Ue\\(", 20, 320, 1);
console.log("=== relationship ===");
ctx("relationship", 70, 180, 10);

