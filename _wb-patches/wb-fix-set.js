"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const p = "src/025-src_server_childstate.js";
let s = fs.readFileSync(path.join(ROOT, p), "utf8");
const a = "      save(dir, s);\n      return s;\n    }\n\n    function rerollLook(dir, pt, childId) {";
const b = "      if (s.pregnancy.active && s.pregnancy.day >= TERM) birth(s, s.lastDay || s.pregnancy.day, {});\n      save(dir, s);\n      return s;\n    }\n\n    function rerollLook(dir, pt, childId) {";
if (s.includes(b)) console.log("уже есть");
else if (!s.includes(a)) console.log("НЕ НАЙДЕН anchor");
else { fs.writeFileSync(path.join(ROOT, p), s.replace(a, b), "utf8"); console.log("ок"); }
