// wb-apply-g7d.js — недостающие куски g7 + диагностика меню и зеркала
const fs = require("fs");
const F_GAME = "src/016-src_server_game.js";
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 190));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. сброс пака наружу ==");
rep(F_GAME,
  "          .replace('GCe={', 'GCe={home:\" + gVal + \"');",
  "          .replace('GCe={', 'GCe={home:\" + gVal + \"')\n" +
  "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');",
  "выставить qD", "__WB_PACK_RESET__");

console.log("== 2. проверка фигуры ==");
rep(F_CLIENT,
  "        function mirrorChild() {",
  '        // фигура: стадия живота + молоко; на смене — сброс пака и перерисовка\n' +
  '        function bellySig(cs) {\n' +
  '          if (!cs) return "";\n' +
  '          var p = cs.pregnancy || {}, d = p.active ? (p.day || 0) : -1;\n' +
  '          var st = !p.active ? "none" : d < 10 ? "none" : d < 20 ? "slight" : d < 30 ? "visible" : "large";\n' +
  '          var milk = !!((cs.postpartum && (cs.postpartum.milkUntilDay || 0) > (cs.lastDay || 0)) || (p.active && d >= 30));\n' +
  '          return st + (milk ? "+milk" : "");\n' +
  '        }\n' +
  '        var lastBelly = "";\n' +
  '        function checkBelly() {\n' +
  '          var cs = S.st && S.st.childstate;\n' +
  '          if (!cs) return;\n' +
  '          var sig = bellySig(cs);\n' +
  '          if (sig === lastBelly) return;\n' +
  '          var was = lastBelly;\n' +
  '          lastBelly = sig;\n' +
  '          if (!was) return;\n' +
  '          try { if (window.__WB_PACK_RESET__) window.__WB_PACK_RESET__(); } catch (e) {}\n' +
  '          var key = S.st.lastKey;\n' +
  '          if (!key || /^patron_/.test(key)) return;\n' +
  '          api("POST", "/bridge/api/redraw", { key: key, wait: true }).then(function(r) {\n' +
  '            if (r && r.image) WBPIC.useImage(r.image, key);\n' +
  '            say("Фигура изменилась — картинка перерисована.", true);\n' +
  '          }).catch(function() {});\n' +
  '        }\n' +
  '        function mirrorChild() {',
  "bellySig/checkBelly", "function checkBelly()");

rep(F_CLIENT,
  "            syncChildHome();\n            if (!day || day === lastTickDay) return;",
  "            syncChildHome();\n            checkBelly();\n            if (!day || day === lastTickDay) return;",
  "вызов в checkDay", "syncChildHome();\n            checkBelly();");

rep(F_CLIENT,
  'if (j && j.state && j.state.children && j.state.children.length) grantNursery();',
  'if (j && j.state) { S.st.childstate = j.state; checkBelly(); }\n              if (j && j.state && j.state.children && j.state.children.length) grantNursery();',
  "тик обновляет фигуру", "S.st.childstate = j.state; checkBelly();");

console.log("== 3. диагностика зеркала ==");
rep(F_CLIENT,
  "          if (!cs || !s || !s.getState) return;\n          var sig = JSON.stringify(cs);",
  "          if (!cs || !s || !s.getState) { window.__WB_MIRROR_ERR__ = !cs ? \"нет childstate\" : \"нет стора\"; return; }\n          var sig = JSON.stringify(cs);",
  "причина пропуска зеркала", "__WB_MIRROR_ERR__");

rep(F_CLIENT,
  "            st.wbChild = cs;\n            return { state: st };\n          });\n        }",
  "            st.wbChild = cs;\n            return { state: st };\n          });\n          window.__WB_MIRROR_OK__ = (window.__WB_MIRROR_OK__ || 0) + 1;\n        }",
  "счётчик успешных зеркал", "__WB_MIRROR_OK__");

console.log("== 4. метка версии меню ==");
rep(F_CLIENT,
  "          if (S.open && !isTyping()) render();\n          paintButton();\n        }",
  '          if (S.open && !isTyping()) render();\n' +
  '          paintButton();\n' +
  '          window.__WB_MENU_REV__ = "g7d";\n' +
  '          window.__WB_DBG__ = { st: function() { return S.st; }, mirrorChild: mirrorChild, checkBelly: checkBelly, loadChildFromSave: loadChildFromSave, syncChildHome: syncChildHome };\n' +
  '        }',
  "метка меню и отладка", "__WB_MENU_REV__");

console.log("== 5. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G7: сброс пака наружу", "__WB_PACK_RESET__");
  put("G7: подпись фигуры", "function bellySig(cs)");
  put("G7: перерисовка на смене фигуры", "function checkBelly()");
  put("G7: метка меню", "__WB_MENU_REV__");
  put("G7: счётчик зеркала", "__WB_MIRROR_OK__");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("\n== 6. как считается MENU_HASH ==");
{
  const bjs = rd("build.js");
  const i = bjs.indexOf("MENU_HASH");
  console.log(i < 0 ? "не найден" : bjs.slice(Math.max(0, i - 450), i + 250));
}
console.log("\n== синтаксис клиента ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
console.log("\nГОТОВО.");