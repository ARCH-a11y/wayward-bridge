#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchB5.js";
const REPORT = "wb-patchB5-report.txt";

const PATCHES = [
  { id: "B5-свежая-диагностика", why: "пока баннер висит, диагностика перезапрашивается напрямую",
    find: 'if \\(!bad\\.length\\) \\{\\s*\\n\\s*if \\(el\\) el\\.remove\\(\\);\\s*\\n\\s*return;\\s*\\n\\s*\\}',
    replace: 'if (bad.length && Date.now() - (window.__wbCompatAt || 0) > 2500) {\n      window.__wbCompatAt = Date.now();\n      fetch("/bridge/api/state").then(function(r) {\n        return r.json();\n      }).then(function(j) {\n        if (j && j.diagnostics && typeof S !== "undefined" && S && S.st) S.st.diagnostics = j.diagnostics;\n      }).catch(function() {\n      });\n    }\n    if (!bad.length) {\n      if (el) el.remove();\n      return;\n    }' },
];

const MARKERS = [
  ["перезапрос диагностики", 'fetch("/bridge/api/state")'],
  ["защита от частых запросов", "window.__wbCompatAt"],
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