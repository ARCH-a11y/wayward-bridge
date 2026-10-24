// wb-apply-h1.js — H1: ребёнок становится персонажем сразу при рождении
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 200));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. при рождении уже персонаж ==");
rep(F_CHILD,
  '          promoted: false, movedOut: false, home: "",',
  '          promoted: true, movedOut: false, home: "",',
  "promoted при рождении", "promoted: true, movedOut: false");

console.log("== 2. запись ребёнка в characters ==");
rep(F_CLIENT,
  "        function syncChildHome(force) {",
  '        // ребёнок — персонаж игры: своя запись, свой shortname и imageBase из генов\n' +
  '        function childImageBase(c) {\n' +
  '          var t = [];\n' +
  '          if (c.sex === "m") t.push("1boy");\n' +
  '          t.push(c.stage === "infant" ? "baby, 1 year old" : c.stage === "child" ? "child, 7 years old" : c.stage === "teen" ? "teenager, 14 years old" : "young adult");\n' +
  '          if (c.lookText) t.push(c.lookText);\n' +
  '          t.push("medieval tavern background");\n' +
  '          return t.join(", ");\n' +
  '        }\n' +
  '        function syncChildCharacter() {\n' +
  '          var s = window.__WB_STORE__;\n' +
  '          if (!s || !s.getState) return;\n' +
  '          var cs = S.st && S.st.childstate;\n' +
  '          if (!cs || !(cs.children || []).length) return;\n' +
  '          var g0 = s.getState().state || {};\n' +
  '          var her = g0.primaryCharacterId;\n' +
  '          var tmpl = her && g0.characters && g0.characters[her];\n' +
  '          if (!tmpl) return;\n' +
  '          var kids = (cs.children || []).filter(function(c) { return !g0.characters || !g0.characters[c.id]; });\n' +
  '          if (!kids.length) return;\n' +
  '          s.setState(function(x) {\n' +
  '            var g = x.state || {};\n' +
  '            var chars = Object.assign({}, g.characters || {});\n' +
  '            kids.forEach(function(c) {\n' +
  '              if (chars[c.id]) return;\n' +
  '              var ch = JSON.parse(JSON.stringify(tmpl));\n' +
  '              ch.id = c.id;\n' +
  '              ch.name = c.name || (c.sex === "f" ? "Дочь" : "Сын");\n' +
  '              ch.archetypeId = "";\n' +
  '              ch.generatedArchetype = { id: "wbchild_" + c.id, shortname: "wbchild_" + c.id, name: ch.name, imageBase: childImageBase(c), imageNegative: "" };\n' +
  '              ch.outfit = "modest";\n' +
  '              ch.currentTask = "idle";\n' +
  '              ch.busyUntilSlot = 0;\n' +
  '              ch.relationship = { trust: 60, patronInteractionsEncouraged: 0 };\n' +
  '              ch.wbChild = true;\n' +
  '              chars[c.id] = ch;\n' +
  '            });\n' +
  '            var st = {};\n' +
  '            for (var k in g) st[k] = g[k];\n' +
  '            st.characters = chars;\n' +
  '            return { state: st };\n' +
  '          });\n' +
  '        }\n' +
  '        function syncChildHome(force) {',
  "syncChildCharacter", "function syncChildCharacter()");

rep(F_CLIENT,
  "            syncChildHome();\n            checkBelly();",
  "            syncChildHome();\n            syncChildCharacter();\n            checkBelly();",
  "вызов в checkDay", "syncChildHome();\n            syncChildCharacter();");

rep(F_CLIENT,
  "              if (j.state) S.st.childstate = j.state;\n              syncChildHome(true);",
  "              if (j.state) S.st.childstate = j.state;\n              syncChildHome(true);\n              syncChildCharacter();",
  "вызов при promote", "syncChildHome(true);\n              syncChildCharacter();");

console.log("== 3. удаление убирает и персонажа ==");
rep(F_CLIENT,
  "                st.visitingPeople = (g.visitingPeople || []).filter(function(e) { return e.personId !== key; });",
  "                st.visitingPeople = (g.visitingPeople || []).filter(function(e) { return e.personId !== key; });\n                if (g.characters && g.characters[c.id]) {\n                  var chars = Object.assign({}, g.characters);\n                  delete chars[c.id];\n                  st.characters = chars;\n                }",
  "удаление персонажа", "delete chars[c.id];");

console.log("== 4. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("H1: ребёнок персонаж с рождения", "promoted: true, movedOut: false");
  put("H1: запись в characters", "function syncChildCharacter()");
  put("H1: свой imageBase", "function childImageBase(c)");
  put("H1: удаление персонажа", "delete chars[c.id];");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 5. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("H1: ребёнок сразу персонаж") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- H1: персонаж с рождения ---\n' +
'  let h1;\n' +
'  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-h1", day: 1, ctx: { encounters: 1, force: true, father: "player" } });\n' +
'  for (let d = 2; d <= 41; d++) h1 = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-h1", day: d, ctx: { encounters: 0 } });\n' +
'  const h1kid = (safe(h1.json, ["state", "children"]) || [])[0] || {};\n' +
'  ok("H1: ребёнок сразу персонаж", h1kid.promoted === true && !!h1kid.name);\n' +
'  const h1p = await api("GET", "/bridge/api/childstate/person?playthrough=pt-h1&childId=" + h1kid.id + "&her=elena");\n' +
'  ok("H1: и сразу человек в родне", safe(h1p.json, ["person", "lives"]) === "home");\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 2 теста");
  }
}

console.log("\n== синтаксис ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  клиент: ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
try { new (require("vm").Script)(rd(F_CHILD)); console.log("  childstate: ок"); } catch (e) { throw new Error("СИНТАКСИС childstate: " + e.message); }

console.log("\n== где включается cid- (условие «рисуем не жену») ==");
{
  const html = rd("index.html");
  const i = html.indexOf("cid-");
  console.log(i < 0 ? "не найдено" : html.slice(Math.max(0, i - 1200), i + 300).replace(/\s+/g, " "));
}
console.log("\nГОТОВО.");