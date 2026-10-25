"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];

const F = "src/019-src_server_assets.generated.js";
let s = rd(F);

const FUNC = `        var lastTickDay = 0;
        function checkDay() {
          try {
            var s = window.__WB_STORE__;
            if (!s || !s.getState) return;
            var st = s.getState();
            if (!st || !st.started) return;
            var g = st.state || {};
            var ds = g.dailyState;
            var day = ds && typeof ds.day === "number" ? ds.day : 0;
            if (!day && typeof g.slot === "number") day = Math.floor(g.slot / 1440) + 1;
            if (!day || day === lastTickDay) return;
            var her = activeHer();
            var pt = her && her.save;
            if (!pt) return;
            lastTickDay = day;
            var sc = g.activeScene || {}, pat = sc.patron || {};
            var ctx = {
              patronId: String(pat.customerId || ""),
              group: Array.isArray(pat.joinedPatronIds) && pat.joinedPatronIds.length > 0
            };
            api("POST", "/bridge/api/childstate/tick", { playthrough: pt, day: day, ctx: ctx }).catch(function() {});
          } catch (e) {}
        }
`;

const hookAnchor = "        (function hookStore(tries) {";
if (s.includes("function checkDay()")) log.push("клиент: checkDay уже есть");
else if (!s.includes(hookAnchor)) log.push("клиент: НЕ НАЙДЕН anchor hookStore");
else { s = s.replace(hookAnchor, FUNC + hookAnchor); log.push("клиент: checkDay добавлен"); }

const subOld = "              s.subscribe(function() {\n                checkActiveHeroine();\n              });";
const subNew = "              s.subscribe(function() {\n                checkActiveHeroine();\n                checkDay();\n              });";
if (s.includes(subNew)) log.push("клиент: вызов в subscribe уже есть");
else if (!s.includes(subOld)) log.push("клиент: НЕ НАЙДЕН anchor subscribe");
else { s = s.replace(subOld, subNew); log.push("клиент: вызов в subscribe добавлен"); }

const ivAnchor = "        setInterval(checkActiveHeroine, 3e3);";
if (s.includes("setInterval(checkDay, 3e3)")) log.push("клиент: интервал уже есть");
else if (!s.includes(ivAnchor)) log.push("клиент: НЕ НАЙДЕН anchor setInterval");
else { s = s.replace(ivAnchor, ivAnchor + "\n        setInterval(checkDay, 3e3);"); log.push("клиент: интервал добавлен"); }

wr(F, s);

(function () {
  const VF = "wb-verify.js";
  let v = rd(VF);
  if (v.includes("F1 клиент: checkDay")) { log.push("verify: маркеры уже есть"); return; }
  const m = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!m) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F1 клиент: checkDay", "function checkDay()", 1],',
    '  ["F1 клиент: антидубль", "lastTickDay = day", 1],',
    '  ["F1 клиент: день из store", "g.dailyState", 1],',
    '  ["F1 клиент: интервал дня", "setInterval(checkDay, 3e3)", 1],',
  ].join("\n") + "\n";
  wr(VF, v.replace(m[1], m[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
