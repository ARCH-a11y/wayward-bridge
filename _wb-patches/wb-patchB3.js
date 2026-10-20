#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchB3.js";
const REPORT = "wb-patchB3-report.txt";

const NEW_FN = `function compatBanner() {
  try {
    var el = document.getElementById("wb-compat");
    var d = typeof S !== "undefined" && S && S.st && S.st.diagnostics ? S.st.diagnostics : null;
    var g = d && d.game ? d.game : null;
    var bad = [];
    if (d && !g) bad.push("index.html игры не читается");
    if (g && g.hooks) {
      if (g.hooks.parts === false) bad.push("хук частей промпта (PARTS)");
      if (g.hooks.store === false) bad.push("доступ к стору игры (STORE)");
      if (g.hooks.customWives === false) bad.push("кнопка создания своей героини");
      if (g.hooks.partsBroken === true) bad.push("хук частей промпта собран, но ломает игру");
    }
    var tbl = g && g.tables ? g.tables : g && g.catalog ? g.catalog.found : null;
    if (Array.isArray(tbl) && tbl.length) bad.push("не найдено таблиц промптов: " + tbl.length);
    if (tbl && !Array.isArray(tbl) && typeof tbl === "object") {
      var miss = Object.keys(tbl).filter(function(k) {
        return !tbl[k];
      });
      if (miss.length) bad.push("не найдено таблиц промптов: " + miss.length + " (" + miss.slice(0, 4).join(", ") + ")");
    }
    window.__wbCompatDebug = { hasState: !!d, hasGame: !!g, hooks: g && g.hooks ? g.hooks : null, bad: bad.slice() };
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
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = "⚠ Мод не совместим с текущей версией игры: " + bad.join(", ") + ". Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
  } catch (e) {
    try {
      console.warn("[wb-compat] ошибка:", e);
    } catch (_) {
    }
  }
}`;

const PATCHES = [
  { id: "B3-инструментовка", why: "баннер пишет отладку в window.__wbCompatDebug и не глотает исключения",
    find: 'function compatBanner\\(\\) \\{[\\s\\S]*?\\n        \\}',
    replace: NEW_FN },

  { id: "B3-z-index", why: "баннер поверх любых слоёв игры",
    find: 'z-index:9999;background:#3a1414',
    replace: 'z-index:2147483647;background:#3a1414' },
];

const MARKERS = [
  ["отладка наружу", "window.__wbCompatDebug"],
  ["try/catch", 'console.warn("[wb-compat] ошибка:"'],
  ["таблицы как объект", "var tbl = g && g.tables ? g.tables :"],
  ["z-index", "z-index:2147483647"],
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