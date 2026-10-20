#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchB4.js";
const REPORT = "wb-patchB4-report.txt";

const STYLE = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer';

const PATCHES = [
  { id: "B4-инлайн-стили", why: "баннер не зависит от инжектированного CSS",
    find: 'el\\.textContent = "⚠ Мод не совместим',
    replace: 'el.style.cssText = "' + STYLE + '";\n    el.textContent = "⚠ Мод не совместим' },

  { id: "B4-запасной-родитель", why: "если body не даёт высоты — вешаем на documentElement",
    find: '\\(document\\.body \\|\\| document\\.documentElement\\)\\.appendChild\\(el\\);',
    replace: '(document.body || document.documentElement).appendChild(el);\n      if (!el.getBoundingClientRect().height) (document.documentElement || document.body).appendChild(el);' },
];

const MARKERS = [
  ["инлайн-стиль", 'el.style.cssText = "position:fixed'],
  ["запасной родитель", "if (!el.getBoundingClientRect().height)"],
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

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Применено: " + ok + ", пропущено: " + miss + ", проверок не прошло: " + bad);