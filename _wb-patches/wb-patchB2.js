#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchB2.js";
const REPORT = "wb-patchB2-report.txt";

const PATCHES = [
  { id: "B1b-правильный-ключ", why: "флаг называется customWives, добавлен partsBroken",
    find: 'if \\(g\\.hooks\\.builder === false\\) bad\\.push\\("кнопка создания своей героини"\\);',
    replace: 'if (g.hooks.customWives === false) bad.push("кнопка создания своей героини");\n            if (g.hooks.partsBroken === true) bad.push("хук частей промпта собран, но ломает игру");' },

  { id: "B1c-устойчивая-проверка-таблиц", why: "таблицы ищутся в любой из возможных форм",
    find: 'if \\(g && g\\.tables && Array\\.isArray\\(g\\.tables\\.missing\\) && g\\.tables\\.missing\\.length\\) \\{\\s*\\n\\s*bad\\.push\\("не найдено таблиц промптов: " \\+ g\\.tables\\.missing\\.length\\);\\s*\\n\\s*\\}',
    replace: 'var _miss = (g && g.tables && g.tables.missing) || (g && g.missingTables) || (g && g.catalog && g.catalog.missing) || (g && g.tables && g.tables.found) || (g && g.catalog && g.catalog.found) || null;\n          if (Array.isArray(_miss) && _miss.length) bad.push("не найдено таблиц промптов: " + _miss.length);\n          if (_miss && !Array.isArray(_miss) && typeof _miss === "object") {\n            var _m = Object.keys(_miss).filter(function(k) {\n              return !_miss[k];\n            });\n            if (_m.length) bad.push("не найдено таблиц промптов: " + _m.length + " (" + _m.slice(0, 4).join(", ") + ")");\n          }' },
];

const MARKERS = [
  ["B1b ключ customWives", 'g.hooks.customWives === false'],
  ["B1b partsBroken", 'g.hooks.partsBroken === true'],
  ["B1c поиск таблиц", 'var _miss = (g && g.tables && g.tables.missing)'],
];

let src;
try { src = fs.readFileSync(FILE, "utf8"); }
catch (e) { console.error("Не нашёл " + FILE); process.exit(1); }

const log = [];
let out = src, ok = 0, miss = 0;

for (const p of PATCHES) {
  const re = new RegExp(p.find, "g");
  const n = (out.match(re) || []).length;
  if (n === 1) {
    out = out.replace(re, p.replace);
    ok++;
    log.push("OK    " + p.id + "  — " + p.why);
  } else {
    miss++;
    log.push("MISS  " + p.id + "  (найдено " + n + ")  — " + p.why);
  }
}

log.push("");
log.push("=== самопроверка ===");
let bad = 0;
for (const [name, needle] of MARKERS) {
  const n = out.split(needle).length - 1;
  if (n === 0) { bad++; log.push("НЕТ   " + name); }
  else log.push("ок    " + name);
}
const oldKey = out.split('g.hooks.builder === false').length - 1;
log.push(oldKey === 0 ? "ок    старый ключ builder убран" : "НЕТ   старый ключ builder ещё в коде");

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Применено: " + ok + ", пропущено: " + miss + ", проверок не прошло: " + bad);