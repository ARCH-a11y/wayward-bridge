// wb-apply-g6b1.js — lives по стадии (дома/уехал) + вес home в весах родни
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_GAME = "src/016-src_server_game.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 180));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. переезд по стадии ==");
rep(F_CHILD,
  "    var STAGE_AGE = { infant: 15, child: 50, teen: 100, youth: 160 };",
  '    var STAGE_AGE = { infant: 15, child: 50, teen: 100, youth: 160 };\n' +
  '    // где ребёнок живёт: дома, пока не вырос; дальше — своё место\n' +
  '    function pickHome() {\n' +
  '      var r = Math.random();\n' +
  '      return r < 0.45 ? "same_town" : r < 0.8 ? "day_ride" : "far";\n' +
  '    }\n' +
  '    function moveOutIfGrown(c) {\n' +
  '      if (c.stage === "youth" && !c.movedOut) { c.movedOut = true; c.home = pickHome(); }\n' +
  '      return c;\n' +
  '    }',
  "pickHome/moveOutIfGrown", "function moveOutIfGrown(c)");

rep(F_CHILD,
  "          bornDay: day, stage: \"infant\", birth: outcome,\n          promoted: false,",
  "          bornDay: day, stage: \"infant\", birth: outcome,\n          promoted: false, movedOut: false, home: \"\",",
  "поля переезда при рождении", "movedOut: false, home: \"\",");

rep(F_CHILD,
  "      for (var i = 0; i < s.children.length; i++) s.children[i].stage = stageOf(day - s.children[i].bornDay);",
  "      for (var i = 0; i < s.children.length; i++) {\n" +
  "        var ch = s.children[i];\n" +
  "        ch.stage = stageOf(day - ch.bornDay);\n" +
  "        moveOutIfGrown(ch);\n" +
  "      }",
  "переезд в тике", "moveOutIfGrown(ch);");

rep(F_CHILD,
  "      c.stage = stageOf((s.lastDay || 0) - c.bornDay);\n      if (!c.name) c.name = pickName(s, c.sex);",
  "      c.stage = stageOf((s.lastDay || 0) - c.bornDay);\n      moveOutIfGrown(c);\n      if (!c.name) c.name = pickName(s, c.sex);",
  "переезд при правке", "moveOutIfGrown(c);\n      if (!c.name)");

rep(F_CHILD,
  '        lives: "same_town",',
  '        lives: c.movedOut ? (c.home || "same_town") : "home",',
  "lives по стадии", 'lives: c.movedOut ?');

rep(F_CHILD,
  "        stage: c.stage,\n        link:",
  "        stage: c.stage,\n        movedOut: !!c.movedOut,\n        lives: c.movedOut ? (c.home || \"same_town\") : \"home\",\n        link:",
  "поля в ответе personFor", "movedOut: !!c.movedOut,");

console.log("== 2. вес home у игры ==");
rep(F_GAME,
  "        const tag = '<script id=\"wayward-bridge\">' + this.bootstrap + '</script>\\n<script src=\"' + this.menuUrl + '\" defer></script>';",
  "        const kinHtml = html.replace('Fle={same_town:.7,day_ride:.35,far:.1}', 'Fle={home:.9,same_town:.7,day_ride:.35,far:.1}');\n" +
  "        if (kinHtml !== html && stillCompiles(original, kinHtml)) {\n" +
  "          html = kinHtml;\n" +
  "          hooks.kin = true;\n" +
  "        } else hooks.kin = false;\n" +
  "        console.log(\"[bridge]   kin home weight:\", hooks.kin ? \"installed\" : \"NOT FOUND\");\n" +
  "        const tag = '<script id=\"wayward-bridge\">' + this.bootstrap + '</script>\\n<script src=\"' + this.menuUrl + '\" defer></script>';",
  "хук веса home", "hooks.kin = true;");

console.log("== 3. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G6b: переезд по стадии", "function moveOutIfGrown(c)");
  put("G6b: домашний живёт дома", 'c.movedOut ? (c.home || "same_town") : "home"');
  put("G6b: вес home", "home:.9,same_town:.7");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 4. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G6b: домашний живёт дома") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- G6b1: дома vs уехал ---\n' +
'  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-home", patch: { children: [{ id: "h1", sex: "m", name: "Петер", bornDay: 1, stage: "child", look: LOOK }] } });\n' +
'  const g7p = await api("GET", "/bridge/api/childstate/person?playthrough=pt-home&childId=h1&her=elena");\n' +
'  ok("G6b: домашний живёт дома", safe(g7p.json, ["person", "lives"]) === "home" && safe(g7p.json, ["movedOut"]) === false);\n' +
'  await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-home", childId: "h1", patch: { stage: "youth" } });\n' +
'  const g7q = await api("GET", "/bridge/api/childstate/person?playthrough=pt-home&childId=h1&her=elena");\n' +
'  ok("G6b: вырос — переехал", safe(g7q.json, ["movedOut"]) === true && ["same_town", "day_ride", "far"].indexOf(safe(g7q.json, ["person", "lives"])) >= 0);\n' +
'  ok("G6b: домашний вне вылазок", safe(g7p.json, ["person", "lives"]) !== "same_town");\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 3 теста");
  }
}

console.log("\n== для следующего шага: тела весов и размещения ==");
{
  const src = fs.readFileSync("index.html", "utf8");
  ["VCe", "zCe", "cl", "aU", "Pt"].forEach(function (n) {
    const i = src.indexOf("function " + n + "(");
    if (i < 0) return console.log("### " + n + ": не найдено");
    console.log("### " + n + " @" + i + "\n" + src.slice(i, i + 600).replace(/\s+/g, " "));
  });
}
console.log("\nГОТОВО.");