// wb-apply-g6a.js — G6a: ребёнок становится роднёй в игре (имя, человек, ребро, кнопка)
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_INDEX = "src/024-src_server_index.js";
const F_CLIENT = "src/019-src_server_assets.generated.js";
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

console.log("== 1. имена детей ==");
rep(F_CHILD,
  "    function birth(s, day, ctx) {",
  '    var NAMES_F = ["Анна", "Марта", "Эльза", "Грета", "Лиза", "Майя", "Роза", "Хельга", "Ингрид", "Беата", "Клара", "Соня"];\n' +
  '    var NAMES_M = ["Ганс", "Петер", "Клаус", "Отто", "Ларс", "Матс", "Эрик", "Юрген", "Дитер", "Бруно", "Феликс", "Томас"];\n' +
  '    function pickName(s, sex) {\n' +
  '      var pool = sex === "f" ? NAMES_F : NAMES_M, used = {};\n' +
  '      for (var i = 0; i < s.children.length; i++) used[s.children[i].name] = 1;\n' +
  '      for (var t = 0; t < 40; t++) { var n = pool[Math.floor(Math.random() * pool.length)]; if (!used[n]) return n; }\n' +
  '      return pool[0];\n' +
  '    }\n\n' +
  '    function birth(s, day, ctx) {',
  "имена", "function pickName(");

rep(F_CHILD,
  '      for (var i = 0; i < n; i++) {\n' +
  '        s.children.push({\n' +
  '          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),\n' +
  '          sex: Math.random() < 0.5 ? "f" : "m",\n' +
  '          fatherId: s.pregnancy.fatherId || "",\n' +
  '          bornDay: day, stage: "infant", birth: outcome,\n' +
  '          look: looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook)\n' +
  '        });\n' +
  '      }',
  '      for (var i = 0; i < n; i++) {\n' +
  '        var sx = Math.random() < 0.5 ? "f" : "m";\n' +
  '        s.children.push({\n' +
  '          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),\n' +
  '          sex: sx,\n' +
  '          name: pickName(s, sx),\n' +
  '          fatherId: s.pregnancy.fatherId || "",\n' +
  '          bornDay: day, stage: "infant", birth: outcome,\n' +
  '          promoted: false,\n' +
  '          look: looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook)\n' +
  '        });\n' +
  '      }',
  "имя и promoted при рождении", "name: pickName(s, sx),");

console.log("== 2. человек и ребро ==");
rep(F_CHILD,
  "    module2.exports = { empty: empty,",
  '    // человек для круга героини: ребро parent_of от char:<her> к person:<id>\n' +
  '    function personFor(dir, pt, childId, her) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var c = childById(s, childId);\n' +
  '      if (!c) return null;\n' +
  '      var pid = "wb" + c.id;\n' +
  '      var person = {\n' +
  '        id: pid,\n' +
  '        name: c.name || (c.sex === "f" ? "Дочь" : "Сын"),\n' +
  '        sex: c.sex === "m" ? "m" : "f",\n' +
  '        generation: 1,\n' +
  '        alive: true,\n' +
  '        lives: "same_town",\n' +
  '        circle: 0.7,\n' +
  '        warmth: 0.8,\n' +
  '        strictness: 0.4,\n' +
  '        past: "good",\n' +
  '        presence: 0.6,\n' +
  '        regard: 0.6,\n' +
  '        belief: { rung: "nothing", sinceDay: 0, thinksHeKnows: false },\n' +
  '        attributes: { strength: 30, deftness: 40, vigor: 45, wit: 45, composure: 40, charm: 50, openness: 50, confidence: 50 },\n' +
  '        wbChild: true,\n' +
  '        wbBornDay: c.bornDay\n' +
  '      };\n' +
  '      return {\n' +
  '        person: person,\n' +
  '        personId: pid,\n' +
  '        name: person.name,\n' +
  '        stage: c.stage,\n' +
  '        link: { kind: "parent_of", from: "char:" + (her || pt), to: "person:" + pid }\n' +
  '      };\n' +
  '    }\n\n' +
  '    function promote(dir, pt, childId, her) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var c = childById(s, childId);\n' +
  '      if (!c) return null;\n' +
  '      var pl = personFor(dir, pt, childId, her);\n' +
  '      c.promoted = { at: s.lastDay || 0, personId: pl.personId };\n' +
  '      save(dir, s);\n' +
  '      pl.state = s;\n' +
  '      return pl;\n' +
  '    }\n\n' +
  '    module2.exports = { empty: empty,',
  "personFor/promote", "function personFor(dir, pt, childId, her)");

rep(F_CHILD,
  "setImage: setImage };",
  "setImage: setImage, personFor: personFor, promote: promote };",
  "экспорт childstate", "personFor: personFor");

console.log("== 3. роуты ==");
rep(F_INDEX,
  "imagePrompt: childstateImagePrompt, setImage: childstateSetImage } = require_childstate();",
  "imagePrompt: childstateImagePrompt, setImage: childstateSetImage, personFor: childstatePerson, promote: childstatePromote } = require_childstate();",
  "require", "childstatePerson");

(function routes() {
  const src = rd(F_INDEX);
  if (src.indexOf('"/bridge/api/childstate/person"') >= 0) { console.log("  = уже: роуты"); return; }
  const a = src.indexOf('"/bridge/api/childstate/image"');
  if (a < 0) throw new Error("НЕ НАЙДЕН роут image");
  const close = src.indexOf("\n      }\n", a);
  if (close < 0) throw new Error("НЕ НАЙДЕН конец блока image");
  const at = close + "\n      }\n".length;
  const code = '' +
'      if (p === "/bridge/api/childstate/person" && m === "GET") {\n' +
'        const pt = String(url.searchParams.get("playthrough") || "");\n' +
'        const id = String(url.searchParams.get("childId") || "");\n' +
'        const her = String(url.searchParams.get("her") || "");\n' +
'        const pl = childstatePerson(store.dataDir, pt, id, her);\n' +
'        if (!pl) return send(res, 404, { error: "Нет такого ребёнка." });\n' +
'        return send(res, 200, pl);\n' +
'      }\n' +
'      if (p === "/bridge/api/childstate/promote" && m === "POST") {\n' +
'        const body = await readJson(req);\n' +
'        const pt = String(body.playthrough || "");\n' +
'        const id = String(body.childId || "");\n' +
'        const her = String(body.her || "");\n' +
'        const pl = childstatePromote(store.dataDir, pt, id, her);\n' +
'        if (!pl) return send(res, 404, { error: "Нет такого ребёнка." });\n' +
'        return send(res, 200, Object.assign({ ok: true }, pl, { state: withChildLook(pl.state) }));\n' +
'      }\n';
  wr(F_INDEX, src.slice(0, at) + code + src.slice(at));
  console.log("  + роуты person/promote");
})();

console.log("== 4. клиент ==");
rep(F_CLIENT,
  '"#" + (i + 1) + " " + (c.sex === "f" ? "девочка" : "мальчик")',
  '"#" + (i + 1) + " " + (c.name ? c.name + " — " : "") + (c.sex === "f" ? "девочка" : "мальчик")',
  "имя в карточке", "c.name ? c.name");

rep(F_CLIENT,
  '}, "портрет")),',
  '}, "портрет"), (c.stage === "teen" || c.stage === "youth") ? h("button", { type: "button", class: "link", title: "Сделать персонажем игры", onclick: function() { promoteChild(c, pt); } }, c.promoted ? "персонаж" : "в персонажа") : null),',
  "кнопка в персонажа", "promoteChild(c, pt)");

rep(F_CLIENT,
  "        function checkDay() {",
  '        function promoteChild(c, pt) {\n' +
  '          var store = window.__WB_STORE__;\n' +
  '          if (!store || !store.getState) { say("Игра не отдала стор — обнови страницу.", false); return; }\n' +
  '          api("POST", "/bridge/api/childstate/promote", { playthrough: pt, childId: c.id }).then(function(j) {\n' +
  '            if (!j || !j.person) { say((j && j.error) || "Не вышло.", false); return; }\n' +
  '            try {\n' +
  '              store.setState(function(x) {\n' +
  '                var g = x.state || {}, her = g.primaryCharacterId;\n' +
  '                if (!her) return {};\n' +
  '                var circles = Object.assign({}, g.circles || {});\n' +
  '                var base = circles[her] ? Object.assign({}, circles[her]) : { of: her, home: "same_town", persons: [], links: [] };\n' +
  '                var persons = (base.persons || []).slice(), links = (base.links || []).slice();\n' +
  '                if (!persons.some(function(p) { return p.id === j.person.id; })) persons.push(j.person);\n' +
  '                var lk = { kind: j.link.kind, from: "char:" + her, to: j.link.to };\n' +
  '                if (!links.some(function(l) { return l.kind === lk.kind && l.from === lk.from && l.to === lk.to; })) links.push(lk);\n' +
  '                circles[her] = Object.assign({}, base, { persons: persons, links: links });\n' +
  '                var st = {};\n' +
  '                for (var k in g) st[k] = g[k];\n' +
  '                st.circles = circles;\n' +
  '                return { state: st };\n' +
  '              });\n' +
  '              if (j.state) S.st.childstate = j.state;\n' +
  '              say((c.name || "Ребёнок") + " теперь " + (c.sex === "f" ? "дочь" : "сын") + " в игре.", true);\n' +
  '              render();\n' +
  '            } catch (e) { say("Стор не принял: " + e.message, false); }\n' +
  '          });\n' +
  '        }\n' +
  '        function checkDay() {',
  "promoteChild", "function promoteChild(");

console.log("== 5. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G6: имена детей", "function pickName(");
  put("G6: имя при рождении", "name: pickName(s, sx),");
  put("G6: человек для ребёнка", "function personFor(dir, pt, childId, her)");
  put("G6: пометка promoted", "c.promoted = { at:");
  put("G6: роут person", "/bridge/api/childstate/person");
  put("G6: роут promote", "/bridge/api/childstate/promote");
  put("G6: кнопка в персонажа", "Сделать персонажем игры");
  put("G6: имя в карточке", "c.name ? c.name");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 6. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G6: человек для ребёнка") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- G6: ребёнок становится роднёй ---\n' +
'  const g6set = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-pers", patch: { children: [{ id: "q1", sex: "f", name: "Анна", bornDay: 1, stage: "teen", look: LOOK }] } });\n' +
'  ok("G6: ребёнок с именем", safe(g6set.json, ["state", "children", 0, "name"]) === "Анна");\n' +
'  const g6p = await api("GET", "/bridge/api/childstate/person?playthrough=pt-pers&childId=q1&her=elena");\n' +
'  ok("G6: человек для ребёнка", g6p.status === 200 && safe(g6p.json, ["person", "name"]) === "Анна" && safe(g6p.json, ["person", "sex"]) === "f");\n' +
'  ok("G6: ребро parent_of от героини", safe(g6p.json, ["link", "kind"]) === "parent_of" && safe(g6p.json, ["link", "from"]) === "char:elena" && String(safe(g6p.json, ["link", "to"]) || "").indexOf("person:") === 0);\n' +
'  ok("G6: живой и рядом", safe(g6p.json, ["person", "alive"]) === true && safe(g6p.json, ["person", "lives"]) === "same_town");\n' +
'  ok("G6: атрибуты и regard", typeof safe(g6p.json, ["person", "attributes", "wit"]) === "number" && typeof safe(g6p.json, ["person", "regard"]) === "number");\n' +
'  const g6pr = await api("POST", "/bridge/api/childstate/promote", { playthrough: "pt-pers", childId: "q1", her: "elena" });\n' +
'  ok("G6: пометка promoted", safe(g6pr.json, ["state", "children", 0, "promoted", "personId"]) === safe(g6p.json, ["personId"]));\n' +
'  const g6no = await api("GET", "/bridge/api/childstate/person?playthrough=pt-pers&childId=нет");\n' +
'  ok("G6: нет ребёнка -> 404", g6no.status === 404);\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 7 тестов");
  }
}
console.log("\nГОТОВО.");