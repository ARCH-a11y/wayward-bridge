"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// модуль: молоко к концу срока + роды из set
let m = rd("src/025-src_server_childstate.js");
m = rep(m, '      if (s.pregnancy && s.pregnancy.active) {\n        var d = s.pregnancy.day;\n        var stage = d < 10 ? "none" : d < 20 ? "slight" : d < 30 ? "visible" : "large";',
           '      if (s.pregnancy && s.pregnancy.active) {\n        var d = s.pregnancy.day;\n        if (d >= 30) milk = true;\n        var stage = d < 10 ? "none" : d < 20 ? "slight" : d < 30 ? "visible" : "large";', "модуль молоко у срока");
m = rep(m, '      save(dir, s);\n      return s;\n    }\n\n    function prompt(dir)',
           '      if (s.pregnancy.active && s.pregnancy.day >= TERM) birth(s, s.lastDay || s.pregnancy.day, {});\n      save(dir, s);\n      return s;\n    }\n\n    function prompt(dir)', "модуль роды из set");
wr("src/025-src_server_childstate.js", m);

// клиент: статус молока у срока
let a = rd("src/019-src_server_assets.generated.js");
a = rep(a, 'cell("Молоко", post.milkUntilDay > ((cs && cs.lastDay) || 0) ? "да" : "нет")',
           'cell("Молоко", (post.milkUntilDay > ((cs && cs.lastDay) || 0) || (preg.active && preg.day >= 30)) ? "да" : "нет")', "клиент молоко");
wr("src/019-src_server_assets.generated.js", a);

// verify
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("G4 молоко у срока")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  wr("wb-verify.js", v.replace(mm[1], mm[1] +
    '  ["G4 молоко у срока", "if (d >= 30) milk = true;", 1],\n' +
    '  ["G4 роды из set", "s.pregnancy.day >= TERM) birth(s, s.lastDay", 1],\n'));
  log.push("verify: маркеры добавлены");
})();

// тест
(function () {
  const TF = "wb-test.js";
  let t = rd(TF);
  if (t.includes("G4: set доводит до родов")) { log.push("тест: уже есть"); return; }
  const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
  const NEW = [
    '  // --- G4: set доводит до родов, молоко у срока ---',
    '  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-setb", patch: { pregnancy: { active: true, day: 35 } } });',
    '  const stMilk = await api("POST", "/bridge/api/preview", { key: (hid || "x") + "__scene-taproom", ops: [] });',
    '  ok("G4: молоко у срока в positive", String((stMilk.json || {}).positive || "").includes("lactating breasts, milk"));',
    '  const stBirth = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-setb", patch: { pregnancy: { day: 40 } } });',
    '  ok("G4: set доводит до родов", (safe(stBirth.json, ["state", "children"]) || []).length >= 1 && safe(stBirth.json, ["state", "pregnancy", "active"]) === false);',
    '',
  ];
  t = t.replace(kill, NEW.join("\n") + kill);
  wr(TF, t);
  log.push("тест: добавлен");
})();

console.log(log.join("\n"));
