"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// 024: хелпер с lookText, использование в stateFor и роутах
let i24 = rd("src/024-src_server_index.js");
if (!i24.includes("function withChildLook")) {
  const fn = '    function withChildLook(cs) {\n' +
    '      if (!cs || !cs.children) return cs;\n' +
    '      return Object.assign({}, cs, { children: cs.children.map(function (k) { return Object.assign({}, k, { lookText: looksDescribe(k.look, k.stage, k.sex) }); }) });\n' +
    '    }\n';
  i24 = i24.replace("    async function handleBridge(req, res, p, url) {", fn + "    async function handleBridge(req, res, p, url) {");
  log.push("024 withChildLook: добавлен");
} else log.push("024 withChildLook: уже есть");

i24 = rep(i24,
  '      childstate: (function () { var c = childstateCurrent(store.dataDir); if (c && c.children) c = Object.assign({}, c, { children: c.children.map(function (k) { return Object.assign({}, k, { lookText: looksDescribe(k.look, k.stage, k.sex) }); }) }); return c; })(),',
  '      childstate: withChildLook(childstateCurrent(store.dataDir)),', "024 stateFor lookText");
i24 = rep(i24, 'const cs2 = childstateSet(store.dataDir, String(body.playthrough || ""), body.patch || {});\n        return send(res, 200, { ok: true, state: cs2 });',
                'const cs2 = childstateSet(store.dataDir, String(body.playthrough || ""), body.patch || {});\n        return send(res, 200, { ok: true, state: withChildLook(cs2) });', "024 set lookText");
i24 = rep(i24, 'const cs3 = childstateReroll(store.dataDir, String(body.playthrough || ""), String(body.childId || ""));\n        return send(res, 200, { ok: true, state: cs3 });',
                'const cs3 = childstateReroll(store.dataDir, String(body.playthrough || ""), String(body.childId || ""));\n        return send(res, 200, { ok: true, state: withChildLook(cs3) });', "024 reroll lookText");
wr("src/024-src_server_index.js", i24);

// клиент: использовать j.state напрямую + say
let a = rd("src/019-src_server_assets.generated.js");
a = rep(a,
  '            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function() {\n              return api("GET", "/bridge/api/state");\n            }).then(function(r) { if (r && r.json) setState(r.json); render(); });',
  '            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function(j) { if (j && j.state) S.st.childstate = j.state; render(); });',
  "stateSec set: j.state");
a = rep(a,
  'onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function() { return api("GET", "/bridge/api/state"); }).then(function(r) { if (r && r.json) setState(r.json); render(); }); }',
  'onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function(j) { if (j && j.state) S.st.childstate = j.state; say("Внешность переброшена"); render(); }); }',
  "reroll: j.state");
wr("src/019-src_server_assets.generated.js", a);

// маркер
let v = rd("wb-verify.js");
v = v.replace('"childstate: (function () { var c = childstateCurrent"', '"childstate: withChildLook(childstateCurrent"');
if (!v.includes("G4 withChildLook")) v = v.replace(/(const CHECKS = \[[ \t]*\r?\n)/, "$1" + '  ["G4 withChildLook", "function withChildLook(cs)", 1],\n');
wr("wb-verify.js", v);
log.push("маркеры поправлены");

console.log(log.join("\n"));
