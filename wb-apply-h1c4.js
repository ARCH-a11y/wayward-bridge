// wb-apply-h1c4.js — X7 держит персонажей в комнатах
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

const QD_SEMI = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');";
const QD = QD_SEMI.slice(0, -1);

let g = rd(G);
if (has(g, "e.characters&&e.characters[f]")) console.log("= уже есть");
else {
  const add = "\n          .replace('n.has(f)&&(o[d].occupants.push(f),r.add(f))}', '(n.has(f)||e.characters&&e.characters[f])&&(o[d].occupants.push(f),r.add(f))}')";
  const from = has(g, QD_SEMI) ? QD_SEMI : QD;
  const to = has(g, QD_SEMI) ? QD + add + ";" : QD + add;
  g = rep(g, from, to, "X7 держит персонажей в комнатах");
  wr(G, g);
}

let v = rd(V);
if (has(v, "H1c: персонаж не вылетает из комнаты")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1c: визитёр не дублирует"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1c: персонаж не вылетает из комнаты", "e.characters&&e.characters[f]", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");