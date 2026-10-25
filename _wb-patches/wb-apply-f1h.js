"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];

const F = "src/019-src_server_assets.generated.js";
let s = rd(F);

if (s.includes("dayEncounters")) log.push("клиент: encounters уже есть");
else {
  const a = "        var lastTickDay = 0;\n";
  const a2 = "        var lastTickDay = 0, dayEncounters = 0, prevPatron = false;\n";

  const b = "            var g = st.state || {};\n            var ds = g.dailyState;\n";
  const b2 = "            var g = st.state || {};\n" +
             "            var has = !!(g.activeScene && g.activeScene.patron);\n" +
             "            if (has && !prevPatron) dayEncounters++;\n" +
             "            prevPatron = has;\n" +
             "            var ds = g.dailyState;\n";

  const c = "              group: Array.isArray(pat.joinedPatronIds) && pat.joinedPatronIds.length > 0\n            };\n";
  const c2 = "              group: Array.isArray(pat.joinedPatronIds) && pat.joinedPatronIds.length > 0,\n" +
             "              encounters: dayEncounters\n            };\n            dayEncounters = 0;\n";

  if (!s.includes(a) || !s.includes(b) || !s.includes(c)) log.push("клиент: НЕ НАЙДЕН один из anchor");
  else {
    s = s.replace(a, a2).replace(b, b2).replace(c, c2);
    wr(F, s);
    log.push("клиент: encounters добавлен (счёт, сброс, отправка)");
  }
}

(function () {
  const VF = "wb-verify.js";
  let v = rd(VF);
  if (v.includes("F1 клиент: encounters")) { log.push("verify: маркеры уже есть"); return; }
  const m = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!m) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F1 клиент: encounters", "dayEncounters", 1],',
    '  ["F1 клиент: сброс счётчика", "dayEncounters = 0;", 1],',
  ].join("\n") + "\n";
  wr(VF, v.replace(m[1], m[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
