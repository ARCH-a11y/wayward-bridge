"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];

let v = rd("wb-verify.js");
v = v.replace('"childstate: childstateCurrent"', '"childstate: (function () { var c = childstateCurrent"');
wr("wb-verify.js", v);
log.push("маркер F3 поправлен");

const TF = "wb-test.js";
let t = rd(TF);
if (t.includes("G: младенец")) log.push("тест: уже есть");
else {
  const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
  const mk = (stage) => '  { id: "k1", sex: "f", fatherId: "p1", bornDay: 1, stage: "' + stage + '", look: { hair: "black", hairType: "wavy", eyes: "green", skin: "fair", face: "oval", build: "slim", bust: "full", hips: "wide" } }';
  const NEW = [
    '  // --- G: внешность ребёнка и фильтры ---',
    '  const LOOK = { hair: "black", hairType: "wavy", eyes: "green", skin: "fair", face: "oval", build: "slim", bust: "full", hips: "wide" };',
    '  const setKid = async (stage) => { await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-look", patch: { children: [{ id: "k1", sex: "f", fatherId: "p1", bornDay: 1, stage: stage, look: LOOK }] } }); const r = await api("GET", "/bridge/api/state"); return String(safe(r.json, ["childstate", "children", 0, "lookText"]) || ""); };',
    '  const lkInf = await setKid("infant");',
    '  ok("G: младенец — без груди/бёдер", lkInf.includes("hair") && lkInf.includes("green eyes") && !lkInf.includes("breasts"));',
    '  const lkTeen = await setKid("teen");',
    '  ok("G: подросток — budding", lkTeen.includes("budding breasts"));',
    '  const lkAdult = await setKid("adult");',
    '  ok("G: взрослая — грудь/бёдра", lkAdult.includes("full breasts") && lkAdult.includes("wide hips"));',
    '  let rL;',
    '  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-gene", day: 1, ctx: { encounters: 1, force: true, father: "player" } });',
    '  for (let d = 2; d <= 41; d++) rL = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-gene", day: d, ctx: { encounters: 0 } });',
    '  const kid0 = (safe(rL.json, ["state", "children"]) || [])[0] || {};',
    '  ok("G: у ребёнка есть look", !!(kid0.look && kid0.look.hair && kid0.look.eyes));',
    '',
  ];
  t = t.replace(kill, NEW.join("\n") + kill);
  wr(TF, t);
  log.push("тест: добавлен");
}

console.log(log.join("\n"));
