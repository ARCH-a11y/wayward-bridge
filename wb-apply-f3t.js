"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const TF = "wb-test.js";
let t = rd(TF);
if (t.includes("F3: set зачинает")) { console.log("F3-тест уже есть"); process.exit(0); }

const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
if (!t.includes(kill)) { console.log("не найден финальный c.kill"); process.exit(1); }

const NEW = [
  '  // --- F3: роут set (кнопки меню) ---',
  '  if (hid) {',
  '    const setR = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { active: true, day: 22 } } });',
  '    ok("F3: set зачинает", safe(setR.json, ["state", "pregnancy", "active"]) === true && safe(setR.json, ["state", "pregnancy", "day"]) === 22);',
  '    const pvS = await api("POST", "/bridge/api/preview", { key: hid + "__scene-taproom", ops: [] });',
  '    ok("F3: set -> живот в positive", String((pvS.json || {}).positive || "").includes("small pregnant belly"));',
  '    const setK = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { known: true } } });',
  '    ok("F3: set known", safe(setK.json, ["state", "pregnancy", "known"]) === true);',
  '    const setOff = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { active: false } } });',
  '    const pvOff = await api("POST", "/bridge/api/preview", { key: hid + "__scene-taproom", ops: [] });',
  '    ok("F3: прервать убирает живот", safe(setOff.json, ["state", "pregnancy", "active"]) === false && !String((pvOff.json || {}).positive || "").includes("small pregnant belly"));',
  '  }',
  '',
];

t = t.replace(kill, NEW.join("\n") + "\n" + kill);
wr(TF, t);
console.log("F3-тест добавлен");
