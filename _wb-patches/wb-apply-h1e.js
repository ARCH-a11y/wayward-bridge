// wb-apply-h1e.js — страховка: запись жены не теряется
const fs = require("fs"), vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const V = "wb-verify.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label, count) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  if (count && n !== count) { console.log("  !! " + label + ": " + n + ", ждали " + count); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}

const KEEP = `        // H1e: страховка — если запись главного персонажа исчезла, вернуть её
        var wifeBak = "";
        function keepWife() {
          var s = window.__WB_STORE__;
          if (!s || !s.getState) return;
          var g = s.getState().state || {};
          var her = g.primaryCharacterId;
          if (!her || !g.characters) return;
          var w = g.characters[her];
          if (w) { wifeBak = JSON.stringify(w); return; }
          if (!wifeBak) return;
          s.setState(function(x) {
            var gg = x.state || {}, chars = Object.assign({}, gg.characters || {});
            chars[her] = JSON.parse(wifeBak);
            var st = {};
            for (var k in gg) st[k] = gg[k];
            st.characters = chars;
            return { state: st };
          });
        }
`;

let a = rd(A);
if (has(a, "function keepWife()")) console.log("= уже есть");
else {
  a = rep(a, "        var kinBusy = {};", KEEP + "        var kinBusy = {};", "вставка keepWife");
  a = rep(a, "            pruneChildCharacters();", "            keepWife();\n            pruneChildCharacters();", "вызов в checkDay");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1e: запись жены не теряется")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1d: список детей наружу"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1e: запись жены не теряется", "function keepWife()", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");