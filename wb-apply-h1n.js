// wb-apply-h1n.js — вернуть запись жены, если её подменили
const fs = require("fs"), vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const V = "wb-verify.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}

const HEAL = `        // H1n: если запись жены подменили чужой — вернуть свою
        function healWife() {
          var s = window.__WB_STORE__;
          if (!s || !s.getState) return;
          var g = s.getState().state || {};
          var her = g.primaryCharacterId;
          var w = g.characters && g.characters[her];
          if (!w || !wifeBak) return;
          if (w.id === her && !w.wbChild && !w.wbSig) return;
          var bak = JSON.parse(wifeBak);
          s.setState(function(x) {
            var gg = x.state || {}, chars = Object.assign({}, gg.characters || {});
            chars[her] = bak;
            var st = {};
            for (var k in gg) st[k] = gg[k];
            st.characters = chars;
            return { state: st };
          });
        }
`;

let a = rd(A);
if (has(a, "function healWife()")) console.log("= уже есть");
else {
  a = rep(a, "        var kinBusy = {};", HEAL + "        var kinBusy = {};", "вставка healWife");
  a = rep(a, "            keepWife();", "            keepWife();\n            healWife();", "вызов в checkDay");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1n: подмену жены откатываем")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1i: жена не сирота"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1n: подмену жены откатываем", "function healWife()", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");