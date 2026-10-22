"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const log = [];
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

// 1. схема: валидатор CHILDSTATE + подключение в LAYER
const SF = "src/001-src_server_schema.js";
let s = rd(SF);
if (s.includes("var CHILDSTATE")) log.push("схема: CHILDSTATE уже есть");
else {
  const m = s.match(/(^[ \t]*)var LAYER = \{/m);
  if (!m) log.push("схема: НЕ НАЙДЕН 'var LAYER = {'");
  else {
    const ind = m[1];
    const def = [
      "var CHILDSTATE = {",
      "  playthrough: str(),",
      "  lastDay: num(0, 1e9),",
      "  cycle: { on: bool(), day: num(0, 1e5), length: num(0, 400), window: num(0, 400) },",
      "  pregnancy: { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool() },",
      "  childWish: { mode: str(), targetId: str() },",
      "  children: (v) => Array.isArray(v) ? v : void 0,",
      "  postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) }",
      "};",
      "",
    ].map(l => (l ? ind + l : l)).join("\n");
    s = s.replace(/(^[ \t]*)var LAYER = \{/m, def + m[1] + "var LAYER = {");
    s = s.replace("var LAYER = { prompts: PROMPTS, pipeline: PIPELINE };",
                  "var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE };");
    wr(SF, s);
    log.push("схема: CHILDSTATE добавлен, подключён в LAYER");
  }
}

// 2. verify: записи в CHECKS
const VF = "wb-verify.js";
let v = rd(VF);
if (v.includes("childstate-модуль")) log.push("verify: уже есть");
else {
  const m = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!m) log.push("verify: НЕ НАЙДЕН CHECKS");
  else {
    const add = [
      '  ["F1 childstate-модуль", "function childstateTick", 1],',
      '  ["F1 файл состояния", "childstate.json", 1],',
      '  ["F1 привязка к прохождению", "s.playthrough !== playthrough", 1],',
      '  ["F1 childstate в схеме", "var CHILDSTATE", 1],',
      '  ["F1 childstate в LAYER", "childstate: CHILDSTATE", 1],',
    ].join("\n") + "\n";
    v = v.replace(m[1], m[1] + add);
    wr(VF, v);
    log.push("verify: записи добавлены");
  }
}
console.log(log.join("\n"));
