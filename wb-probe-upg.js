"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(word, before, after, n) {
  const re = new RegExp(word, "g"); let m, k = 0;
  while ((m = re.exec(s)) && k < n) { console.log("[" + word + "] " + JSON.stringify(s.slice(Math.max(0, m.index - before), m.index + after))); k++; }
}
console.log("=== AP реестр ===");
ctx("const AP=|var AP=|AP=\\[", 60, 400, 3);
console.log("=== buy_quality_upgrade / XZ ===");
ctx("buy_quality_upgrade", 120, 260, 3);
ctx("qualityUpgrades", 120, 200, 6);
console.log("=== список апгрейдов ===");
ctx("upgrade_interior", 60, 220, 4);
ctx("buy_bathhouse", 80, 160, 3);
