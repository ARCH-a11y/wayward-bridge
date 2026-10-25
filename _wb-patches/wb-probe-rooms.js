"use strict";
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function ctx(w, b, a, n) { const re = new RegExp(w, "g"); let m, k = 0; while ((m = re.exec(s)) && k < n) { console.log("[" + w + "] " + JSON.stringify(s.slice(Math.max(0, m.index - b), m.index + a))); k++; } }
console.log("=== флаги комнат ===");
ctx("backRoomReady", 130, 190, 6);
ctx("hasRoom2", 130, 190, 5);
console.log("=== локации ===");
ctx("_I=", 40, 320, 2);
ctx("back_room", 90, 150, 6);
console.log("=== навигация по комнатам ===");
ctx("hasBathhouse", 120, 170, 4);
