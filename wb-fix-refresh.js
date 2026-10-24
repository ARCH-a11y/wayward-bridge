"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const p = "src/019-src_server_assets.generated.js";
let s = fs.readFileSync(path.join(ROOT, p), "utf8");
const log = [];
const rep = (a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return; } s = s.replace(a, b); log.push(tag + ": ок"); };

rep(
  '            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function(j) {\n              if (j && j.state) S.st.childstate = j.state;\n              render();\n            });',
  '            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function() {\n              return api("GET", "/bridge/api/state");\n            }).then(function(r) { if (r && r.json) setState(r.json); render(); });',
  "stateSec set: перезапрос");

rep(
  'onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function(j) { if (j && j.state) S.st.childstate = j.state; render(); }); }',
  'onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function() { return api("GET", "/bridge/api/state"); }).then(function(r) { if (r && r.json) setState(r.json); render(); }); }',
  "reroll: перезапрос");

fs.writeFileSync(path.join(ROOT, p), s, "utf8");
console.log(log.join("\n"));
