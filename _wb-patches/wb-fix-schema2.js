"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const p = "src/001-src_server_schema.js";
let s = fs.readFileSync(path.join(ROOT, p), "utf8");
const a = "pregnancy: { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool() },";
const b = "pregnancy: { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool(), revealDay: num(0, 1e9), forced: bool() },";
if (s.includes(b)) console.log("уже есть");
else if (!s.includes(a)) console.log("НЕ НАЙДЕН anchor");
else { fs.writeFileSync(path.join(ROOT, p), s.replace(a, b), "utf8"); console.log("ок"); }

let v = fs.readFileSync(path.join(ROOT, "wb-verify.js"), "utf8");
if (!v.includes("F5 схема pregnancy")) {
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  v = v.replace(mm[1], mm[1] + '  ["F5 схема pregnancy", "known: bool(), revealDay: num(0, 1e9)", 1],\n');
  fs.writeFileSync(path.join(ROOT, "wb-verify.js"), v, "utf8");
  console.log("маркер добавлен");
}
