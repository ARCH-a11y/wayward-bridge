#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchS.js";
const REPORT = "wb-patchS-report.txt";

const PATCHES = [
  { id: "S1-пинг-роут", why: "лёгкий эндпоинт для проверки связи и revision",
    find: 'if \\(p === "/bridge/api/state" && m === "GET"\\) return send\\(res, 200, stateFor\\(\\)\\);',
    replace: 'if (p === "/bridge/api/state" && m === "GET") return send(res, 200, stateFor());\n      if (p === "/bridge/api/ping" && m === "GET") return send(res, 200, { ok: true, revision: store.revision });' },

  { id: "S2-реакция-на-сокет", why: "перезапрос состояния при восстановлении и обрыве SSE",
    find: 'var es = new EventSource\\("/bridge\\/api\\/events"\\);',
    replace: 'var es = new EventSource("/bridge/api/events");\n          es.onopen = function() {\n            bridgePing();\n          };\n          es.onerror = function() {\n            if (es.readyState === 2) return;\n            setTimeout(function() {\n              bridgePing();\n            }, 1500);\n          };' },

  { id: "S3-страховочный-опрос", why: "раз в 10 секунд сверка revision, подъём после рестарта бриджа",
    find: 'function refresh\\(\\) \\{\\s*\\n\\s*return api\\("GET", "\\/bridge\\/api\\/state"\\)\\.then\\(setState\\)\\.catch\\(function\\(e\\) \\{\\s*\\n\\s*say\\(e\\.message, false\\);\\s*\\n\\s*\\}\\);\\s*\\n\\s*\\}',
    replace: 'function refresh() {\n          return api("GET", "/bridge/api/state").then(setState).catch(function(e) {\n            say(e.message, false);\n          });\n        }\n        function bridgePing() {\n          return api("GET", "/bridge/api/ping").then(function(j) {\n            if (window.__wbOffline) {\n              window.__wbOffline = false;\n              refresh();\n              return;\n            }\n            if (j && S.st && typeof j.revision === "number" && j.revision !== S.st.revision) refresh();\n          }).catch(function() {\n            window.__wbOffline = true;\n          });\n        }\n        setInterval(function() {\n          if (document.visibilityState === "visible") bridgePing();\n        }, 1e4);' },

  { id: "S4-индикатор-офлайна", why: "баннер говорит, что бридж недоступен",
    find: 'if \\(d && !g\\) bad\\.push\\("index\\.html игры не читается"\\);',
    replace: 'if (d && !g) bad.push("index.html игры не читается");\n    if (window.__wbOffline) bad.push("нет связи с бриджем — запусти Start-Wayward-Bridge.bat");' },

  { id: "S5-убрать-дубль-B5", why: "блок перезапроса диагностики дублировался",
    find: '(if \\(bad\\.length && Date\\.now\\(\\) - \\(window\\.__wbCompatAt \\|\\| 0\\) > 2500\\) \\{[\\s\\S]*?\\n    \\})\\n    \\1',
    replace: '$1' },
];

const MARKERS = [
  ["пинг-роут", '"/bridge/api/ping"'],
  ["onopen", "es.onopen = function()"],
  ["onerror", "es.onerror = function()"],
  ["bridgePing", "function bridgePing()"],
  ["опрос", "document.visibilityState === \"visible\""],
  ["офлайн-баннер", "нет связи с бриджем"],
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
  else log.push("ок    " + name + (n > 1 ? "  (вхождений: " + n + ")" : ""));
}

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Применено: " + ok + ", пропущено: " + miss + ", проверок не прошло: " + bad);