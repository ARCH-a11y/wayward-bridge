"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const TF = "wb-test.js";
let t = rd(TF);
if (t.includes("F2: тег живота")) { console.log("F2-тест уже есть"); process.exit(0); }

const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
if (!t.includes(kill)) { console.log("не найден финальный c.kill"); process.exit(1); }

const NEW = [
  '  // --- F2: живот и молоко в промпте ---',
  '  if (hid) {',
  '    const f2Id = "pt-f2";',
  '    await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: 1, ctx: { encounters: 1, force: true, patronId: "p1" } });',
  '    await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: 21, ctx: { encounters: 0 } });',
  '    const keyF2 = hid + "__scene-taproom";',
  '    const pBelly = await api("POST", "/bridge/api/preview", { key: keyF2, ops: [] });',
  '    const posBelly = String((pBelly.json || {}).positive || "");',
  '    ok("F2: тег живота (visible) в positive", pBelly.status === 200 && posBelly.includes("small pregnant belly"), posBelly.slice(0, 140));',
  '    for (let d = 22; d <= 41; d++) await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: d, ctx: { encounters: 0 } });',
  '    const pMilk = await api("POST", "/bridge/api/preview", { key: keyF2, ops: [] });',
  '    const posMilk = String((pMilk.json || {}).positive || "");',
  '    ok("F2: тег молока после родов", pMilk.status === 200 && posMilk.includes("lactating breasts, milk"), posMilk.slice(0, 140));',
  '    ok("F2: после родов живот ушёл", !posMilk.includes("small pregnant belly"));',
  '  }',
  '',
];

t = t.replace(kill, NEW.join("\n") + "\n" + kill);
wr(TF, t);
console.log("F2-тест добавлен");
