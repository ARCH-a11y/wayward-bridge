// wb-apply-h1c2.js — игровые правки H1c в 016 + запятая в маркерах
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

const R5F = 'return n?n.persons.filter(i=>s.has(cp(i))):[]';
const R5T = 'return n?n.persons.filter(i=>s.has(cp(i))&&!(i.wbChild&&s.has(i.id.slice(2)))):[]';
const LOF = 'truncate max-w-[10rem] ${i.text}`,children:t.name})';
const LOT = 'truncate max-w-[10rem] ${i.text}`,children:t.wbChild&&window.__WB_KINLABEL__?t.name+" · "+window.__WB_KINLABEL__(e):t.name})';

let g = rd(G);
if (has(g, "i.wbChild&&s.has(i.id.slice(2))")) console.log("= игровые правки уже есть");
else {
  const qd = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');";
  const add = "\n          .replace('" + R5F + "', '" + R5T + "')" +
              "\n          .replace('" + R5F + "', '" + R5T + "')" +
              "\n          .replace('" + LOF + "', '" + LOT + "');";
  g = rep(g, qd, qd.replace(/;\s*$/, "") + add, "правки r5 и lO в цепочке kinHtml");
  wr(G, g);
}

let v = rd(V);
const lines = v.split("\n");
const i = lines.findIndex(function(l) { return l.indexOf('"H1c: уборка комнаты"') >= 0; });
if (i < 0) { console.log("  !! маркер H1c: уборка комнаты не найден"); bad = true; }
else if (/,\s*$/.test(lines[i])) console.log("= запятая на месте");
else { lines[i] = lines[i] + ","; wr(V, lines.join("\n")); console.log("  + запятая в маркерах починена"); }

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");