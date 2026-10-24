// wb-apply-h1o.js — nn не подменяет персонажа во время записи
const fs = require("fs"), vm = require("vm");
const G = "src/016-src_server_game.js";
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

const F = 'function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n),';
const T = 'function nn(e,t,o){const n=e.characters[t];if(!n)return e;var __wc=window.__WB_CARD__;window.__WB_CARD__=t===e.primaryCharacterId?"":t;var s=o(n);window.__WB_CARD__=__wc;';

let g = rd(G);
if (has(g, "window.__WB_CARD__=t===e.primaryCharacterId")) console.log("= уже есть");
else {
  const qd = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}')";
  const semi = has(g, qd + ";");
  const add = "\n          .replace('" + F + "', '" + T + "')";
  g = rep(g, semi ? qd + ";" : qd, semi ? qd + add + ";" : qd + add, "nn не подменяет персонажа");
  wr(G, g);
}

let v = rd(V);
if (has(v, "H1o: запись не путает персонажей")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1n: подмену жены откатываем"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1o: запись не путает персонажей", "window.__WB_CARD__=t===e.primaryCharacterId", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");