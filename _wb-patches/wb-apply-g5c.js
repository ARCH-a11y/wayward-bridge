// wb-apply-g5c.js — сброс устаревшего портрета при перебросе внешности + честный тест
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 170));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. переброс сбрасывает устаревший портрет ==");
rep(F_CHILD,
  "s.children[i].look = looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook); }",
  "s.children[i].look = looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook); s.children[i].img = null; }",
  "сброс img при reroll", "s.children[i].img = null;");

console.log("== 2. маркер ==");
{
  const v = rd(F_VERIFY);
  if (v.indexOf('"G5: сброс портрета при reroll"') >= 0) console.log("  = уже: маркер");
  else {
    const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
    if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
    const at = m.index + m[0].length;
    wr(F_VERIFY, v.slice(0, at) + '\n  ["G5: сброс портрета при reroll", "s.children[i].img = null;", 1],' + v.slice(at));
    console.log("  + маркер");
  }
}

console.log("== 3. честный тест вместо true ==");
{
  const t = rd(F_TEST);
  if (t.indexOf("G5: переброс сбрасывает старый портрет") >= 0) console.log("  = уже: тест");
  else {
    const from =
      '  const stImg = await api("POST", "/bridge/api/childstate/reroll", { playthrough: "pt-img", childId: "p1" });\n' +
      '  ok("G5: после переброса img сбрасывается на месте", true);\n' +
      '  void stImg;';
    if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН слабый тест");
    const to =
      '  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-img", patch: { children: [{ id: "p1", sex: "f", stage: "infant", look: LOOK, img: { file: "x.png" } }] } });\n' +
      '  const stImg = await api("POST", "/bridge/api/childstate/reroll", { playthrough: "pt-img", childId: "p1" });\n' +
      '  ok("G5: переброс сбрасывает старый портрет", safe(stImg.json, ["state", "children", 0, "img"]) === null);';
    wr(F_TEST, t.replace(from, to));
    console.log("  + тест переписан");
  }
}
console.log("\nГОТОВО.");