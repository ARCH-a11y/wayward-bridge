// wb-apply-h1c3b.js — дописать фильтр визитёров в цепочку 016
const fs = require("fs"), vm = require("vm");
const G = "src/016-src_server_game.js";
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

const F = ".filter(function(v){return !((v.person||v).wbChild)})";
const QD_SEMI = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');";
const QD = QD_SEMI.slice(0, -1);

let g = rd(G);
if (has(g, "v.person||v).wbChild")) console.log("= уже есть");
else {
  const add = "\n          .replace('g=iU(e,d);return{', 'g=iU(e,d)" + F + ";return{')" +
              "\n          .replace('o=iU(t,e);return', 'o=iU(t,e)" + F + ";return')";
  const from = has(g, QD_SEMI) ? QD_SEMI : QD;
  const to = has(g, QD_SEMI) ? QD + add + ";" : QD + add;
  g = rep(g, from, to, "фильтр визитёров в RG и $Le");
  wr(G, g);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");