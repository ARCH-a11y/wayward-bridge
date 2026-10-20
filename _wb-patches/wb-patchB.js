#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchB.js";
const REPORT = "wb-patchB-report.txt";

const BANNER = `setInterval(checkActiveHeroine, 3e3);
        setInterval(compatBanner, 3e3);
        function compatBanner() {
          var el = document.getElementById("wb-compat");
          var d = S.st && S.st.diagnostics ? S.st.diagnostics : null;
          var g = d ? d.game : null;
          var bad = [];
          if (d && !g) bad.push("index.html игры не читается");
          if (g && g.hooks) {
            if (g.hooks.parts === false) bad.push("хук частей промпта (PARTS)");
            if (g.hooks.store === false) bad.push("доступ к стору игры (STORE)");
            if (g.hooks.builder === false) bad.push("кнопка создания своей героини");
          }
          if (g && g.tables && Array.isArray(g.tables.missing) && g.tables.missing.length) {
            bad.push("не найдено таблиц промптов: " + g.tables.missing.length);
          }
          if (!bad.length) {
            if (el) el.remove();
            return;
          }
          if (!el) {
            el = document.createElement("div");
            el.id = "wb-compat";
            el.title = "Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
            el.addEventListener("click", function() {
              el.remove();
            });
            document.body.appendChild(el);
          }
          el.textContent = "⚠ Мод не совместим с текущей версией игры: " + bad.join(", ") + ". Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
        }`;

const PATCHES = [
  { id: "B1-banner", why: "красный баннер, если хук или таблица отвалились",
    find: 'setInterval\\(checkActiveHeroine, 3e3\\);',
    replace: BANNER },

  { id: "B2-banner-css", why: "стиль баннера",
    find: '"\\.cnt\\.over\\{color:#ff8080;opacity:1;font-weight:600\\}",',
    replace: '".cnt.over{color:#ff8080;opacity:1;font-weight:600}",\n            "#wb-compat{position:fixed;top:0;left:0;right:0;z-index:9999;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer}",' },
];

const MARKERS = [
  ["B1 баннер", "function compatBanner()"],
  ["B1 интервал", "setInterval(compatBanner, 3e3);"],
  ["B1 проверка хуков", 'g.hooks.parts === false'],
  ["B2 стиль", "#wb-compat{position:fixed"],
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
console.log("Итог:  " + OUT);