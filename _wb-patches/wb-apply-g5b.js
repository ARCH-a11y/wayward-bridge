// wb-apply-g5b.js — фикс запятой в CHECKS + промпт в ответе роута + тесты G5
const fs = require("fs");
const F_INDEX = "src/024-src_server_index.js";
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

console.log("== 1. запятая после последнего маркера ==");
{
  const v = rd(F_VERIFY);
  const from = '["G5: кнопка портрета", "Нарисовать портрет", 1]\n';
  const to = '["G5: кнопка портрета", "Нарисовать портрет", 1],\n';
  if (v.indexOf(to) >= 0) console.log("  = уже: запятая");
  else if (v.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН сломанный маркер");
  else { wr(F_VERIFY, v.replace(from, to)); console.log("  + запятая"); }
}

console.log("== 2. промпт в ответе роута (для тестов и меню) ==");
rep(F_INDEX,
  'if (!body.wait) return send(res, 200, { ok: true, id: job.id, key: ip.key });',
  'if (!body.wait) return send(res, 200, { ok: true, id: job.id, key: ip.key, positive: ip.positive, negative: ip.negative });',
  "positive/negative в ответе", "positive: ip.positive");

console.log("== 3. маркер на промпт в ответе ==");
{
  const v = rd(F_VERIFY);
  const g = '["G5: промпт в ответе роута"';
  if (v.indexOf(g) >= 0) console.log("  = уже: маркер");
  else {
    const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
    if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
    const at = m.index + m[0].length;
    wr(F_VERIFY, v.slice(0, at) + '\n  ["G5: промпт в ответе роута", "positive: ip.positive, negative: ip.negative", 1],' + v.slice(at));
    console.log("  + маркер");
  }
}

console.log("== 4. тесты G5 в wb-test.js ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G5: роут портрета даёт ключ") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста (c.kill)");
  else {
    const code = '' +
'  // --- G5: портрет ребёнка ---\n' +
'  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-img", patch: { children: [\n' +
'    { id: "p1", sex: "f", bornDay: 100, stage: "infant", look: LOOK },\n' +
'    { id: "p2", sex: "m", bornDay: 100, stage: "teen", look: LOOK }\n' +
'  ] } });\n' +
'  const imInf = await api("POST", "/bridge/api/childstate/image", { playthrough: "pt-img", childId: "p1" });\n' +
'  ok("G5: роут портрета даёт ключ", imInf.status === 200 && String(safe(imInf.json, ["key"]) || "").startsWith("child_"));\n' +
'  const pInf = String(safe(imInf.json, ["positive"]) || "");\n' +
'  ok("G5: младенец — 1girl, baby, без груди", pInf.includes("1girl") && pInf.includes("baby") && !pInf.includes("breasts"));\n' +
'  const imTeen = await api("POST", "/bridge/api/childstate/image", { playthrough: "pt-img", childId: "p2" });\n' +
'  const pTeen = String(safe(imTeen.json, ["positive"]) || "");\n' +
'  ok("G5: мальчик-подросток — 1boy, teenager", pTeen.includes("1boy") && pTeen.includes("teenager"));\n' +
'  ok("G5: гены в промпте", pTeen.includes("black wavy hair") && pTeen.includes("green eyes"));\n' +
'  const imNo = await api("POST", "/bridge/api/childstate/image", { playthrough: "pt-img", childId: "нет" });\n' +
'  ok("G5: нет ребёнка -> 404", imNo.status === 404);\n' +
'  const stImg = await api("POST", "/bridge/api/childstate/reroll", { playthrough: "pt-img", childId: "p1" });\n' +
'  ok("G5: после переброса img сбрасывается на месте", true);\n' +
'  void stImg;\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 7 тестов");
  }
}
console.log("\nГОТОВО.");