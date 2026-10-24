// wb-apply-g6b3.js — G6b2: домашний ребёнок живёт в детской (visitingPeople + occupants)
const fs = require("fs");
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";

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

console.log("== 1. поселение ребёнка в детскую ==");
rep(F_CLIENT,
  "        function promoteChild(c, pt) {",
  '        // ребёнок живёт дома: запись в visitingPeople + person: в occupants детской\n' +
  '        // (без записи в visitingPeople игра выбрасывает person: из комнат при синхронизации)\n' +
  '        function syncChildHome(c) {\n' +
  '          var store = window.__WB_STORE__;\n' +
  '          if (!store || !store.getState) { say("Игра не отдала стор.", false); return; }\n' +
  '          var her = (store.getState().state || {}).primaryCharacterId;\n' +
  '          if (!her) return;\n' +
  '          var pid = "person:wb" + c.id, key = "wb" + c.id;\n' +
  '          store.setState(function(x) {\n' +
  '            var g = x.state || {}, slot = g.slot || 0;\n' +
  '            var vp = (g.visitingPeople || []).filter(function(e) { return e.personId !== key; });\n' +
  '            var locs = Object.assign({}, g.locations || {}), occ = {};\n' +
  '            Object.keys(locs).forEach(function(k) {\n' +
  '              var o = locs[k] && locs[k].occupants;\n' +
  '              if (o && o.indexOf(pid) >= 0) occ[k] = o.filter(function(v) { return v !== pid; });\n' +
  '            });\n' +
  '            if (!c.movedOut) {\n' +
  '              vp.push({ of: her, personId: key, arrivedSlot: slot, leaveAtSlot: slot + 1e6, toSee: false, home: true });\n' +
  '              occ.nursery = (((locs.nursery && locs.nursery.occupants) || []).filter(function(v) { return v !== pid; })).concat([pid]);\n' +
  '            }\n' +
  '            Object.keys(occ).forEach(function(k) {\n' +
  '              locs[k] = Object.assign({}, locs[k] || { occupants: [] }, { occupants: occ[k] });\n' +
  '            });\n' +
  '            var st = {};\n' +
  '            for (var k2 in g) st[k2] = g[k2];\n' +
  '            st.visitingPeople = vp;\n' +
  '            st.locations = locs;\n' +
  '            return { state: st };\n' +
  '          });\n' +
  '        }\n' +
  '        function promoteChild(c, pt) {',
  "syncChildHome", "function syncChildHome(c)");

rep(F_CLIENT,
  "              if (j.state) S.st.childstate = j.state;\n              say((c.name || \"Ребёнок\") + \" теперь \" + (c.sex === \"f\" ? \"дочь\" : \"сын\") + \" в игре.\", true);",
  "              syncChildHome(c);\n              if (j.state) S.st.childstate = j.state;\n              say((c.name || \"Ребёнок\") + \" теперь \" + (c.sex === \"f\" ? \"дочь\" : \"сын\") + \" в игре.\", true);",
  "вызов при promote", "syncChildHome(c);\n              if (j.state)");

rep(F_CLIENT,
  '}, c.promoted ? "персонаж" : "в персонажа") : null),',
  '}, c.promoted ? "персонаж" : "в персонажа"), c.promoted ? h("button", { type: "button", class: "link", title: "Поселить в детскую / убрать после переезда", onclick: function() { syncChildHome(c); say("Место жительства обновлено"); render(); } }, "дом") : null) : null),',
  "кнопка «дом»", '"дом"');

console.log("== 2. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G6b: ребёнок живёт в детской", "function syncChildHome(c)");
  put("G6b: запись visitingPeople", "leaveAtSlot: slot + 1e6");
  put("G6b: поселение в детскую", "occ.nursery");
  put("G6b: кнопка дом", '"дом"');
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("\n== для справки: как рисуется карта комнат ==");
{
  const html = fs.readFileSync("index.html", "utf8");
  const i = html.indexOf("WHERE EVERYONE");
  if (i >= 0) console.log(html.slice(Math.max(0, i - 1500), i + 150).replace(/\s+/g, " "));
  else console.log("строка 'WHERE EVERYONE' не найдена — проверю иначе");
}
console.log("\nГОТОВО.");