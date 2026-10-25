// wb-apply-h1c3.js — человек-ребёнок не дублирует своего персонажа
const fs = require("fs"), vm = require("vm");
const G = "src/016-src_server_game.js";
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

const F = ".filter(function(v){return !((v.person||v).wbChild)})";
let g = rd(G);
if (has(g, "v.person||v).wbChild")) console.log("= уже есть");
else {
  const qd = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');";
  const add = "\n          .replace('g=iU(e,d);return{', 'g=iU(e,d)" + F + ";return{')" +
              "\n          .replace('o=iU(t,e);return', 'o=iU(t,e)" + F + ";return');";
  g = rep(g, qd, qd.replace(/;\s*$/, "") + add, "фильтр визитёров в RG и $Le");
  wr(G, g);
}

let v = rd(V);
if (has(v, "H1c: визитёр не дублирует")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1c: уборка комнаты"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1c: визитёр не дублирует", "v.person||v).wbChild", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");