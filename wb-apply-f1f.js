"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const TF = "wb-test.js";
let t = rd(TF);

const start = "  // --- F1: childstate tick ---\n";
const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
const i = t.indexOf(start), k = t.indexOf(kill);
if (i < 0 || k < 0 || k < i) { console.log("не нашёл границы блока"); process.exit(1); }

const NEW = [
  '  // --- F1: childstate tick ---',
  '  const csId = "pt-test-1";',
  '  const rDay1 = await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 1, ctx: {} });',
  '  ok("childstate: роут отвечает", rDay1.status === 200 && !!rDay1.json && !!rDay1.json.state);',
  '  ok("childstate: lastDay записан", safe(rDay1.json, ["state", "lastDay"]) === 1);',
  '  const cycA = safe(rDay1.json, ["state", "cycle", "day"]);',
  '  await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 8, ctx: {} });',
  '  const rDay15 = await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 15, ctx: {} });',
  '  const cycB = safe(rDay15.json, ["state", "cycle", "day"]);',
  '  ok("childstate: цикл сдвигается по дням", typeof cycB === "number" && cycB !== cycA);',
  '',
  '  const chNo = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-no", day: 1, ctx: { encounters: 1, force: false } });',
  '  ok("childstate: force=false -> нет беременности", safe(chNo.json, ["state", "pregnancy", "active"]) === false);',
  '',
  '  const chYes = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: 1, ctx: { encounters: 1, force: true, patronId: "p1" } });',
  '  ok("childstate: force=true -> беременность и отец", safe(chYes.json, ["state", "pregnancy", "active"]) === true && safe(chYes.json, ["state", "pregnancy", "fatherId"]) === "p1");',
  '  let rBirth;',
  '  for (let d = 2; d <= 41; d++) rBirth = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: d, ctx: { encounters: 0 } });',
  '  const birthKids = safe(rBirth.json, ["state", "children"]) || [];',
  '  ok("childstate: роды дали ребёнка", birthKids.length >= 1 && safe(rBirth.json, ["state", "pregnancy", "active"]) === false);',
  '  ok("childstate: послеродовой блок выставлен", (safe(rBirth.json, ["state", "postpartum", "blockUntilDay"]) || 0) > 41);',
  '',
  '  const chGrp = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-grp", day: 1, ctx: { encounters: 1, force: true, patronId: "p1", group: true } });',
  '  ok("childstate: группа -> отец пуст", safe(chGrp.json, ["state", "pregnancy", "fatherId"]) === "");',
  '',
];

t = t.slice(0, i) + NEW.join("\n") + "\n" + t.slice(k);
wr(TF, t);
console.log("тест: блок перестроен (без чередования прохождений)");
