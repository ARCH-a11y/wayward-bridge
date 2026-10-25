"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== компонент вокруг R(H) ===");
ctx("function R\\(H\\)", 1600, 900, 1);
console.log("=== где перебирается список комнат ===");
ctx("\\.map\\(R\\)", 200, 250, 4);
ctx("hl\\.map|hl\\.filter|hl\\.forEach|hl\\.includes", 120, 220, 8);
