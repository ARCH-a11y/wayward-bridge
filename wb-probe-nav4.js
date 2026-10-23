"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== продолжение компонента (M) ===");
ctx("function M\\(H\\)", 40, 1800, 1);
console.log("=== bO (подписи для подхода) ===");
ctx("bO=", 40, 320, 2);
console.log("=== карта подписей комнат ===");
ctx("Rental Room", 600, 200, 2);
