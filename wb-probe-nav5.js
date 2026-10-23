"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== вызовы плиток M ===");
ctx("M\\(1\\)|M\\(2\\)|M\\(0\\)", 250, 350, 6);
console.log("=== начало рендера компонента ILe ===");
ctx("function ILe\\(\\)", 900, 1500, 1);
