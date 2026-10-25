"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== переход (Gh) ===");
ctx("function Gh\\(", 20, 900, 1);
console.log("=== текущая локация (Fh) ===");
ctx("function Fh\\(", 20, 260, 1);
console.log("=== go_upstairs / go_to_back_room ===");
ctx("go_upstairs", 120, 260, 2);
console.log("=== кнопки комнат в UI ===");
ctx("upstairs_room_2", 200, 260, 5);
