"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const p = "src/025-src_server_childstate.js";
let s = fs.readFileSync(path.join(ROOT, p), "utf8");
const a = '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false };';
const b = '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false, motherLook: s.pregnancy.motherLook || null, fatherLook: s.pregnancy.fatherLook || null };';
if (s.includes(b)) console.log("уже есть");
else if (!s.includes(a)) console.log("НЕ НАЙДЕН anchor");
else { fs.writeFileSync(path.join(ROOT, p), s.replace(a, b), "utf8"); console.log("ок"); }
