// wb-apply-h1p.js — вернуть объявление r в nn
const fs = require("fs"), vm = require("vm");
const G = "src/016-src_server_game.js";
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

const NNF = 'function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n),';
const NNT = 'function nn(e,t,o){const n=e.characters[t];if(!n)return e;var __wc=window.__WB_CARD__;window.__WB_CARD__=t===e.primaryCharacterId?"":t;var s=o(n);window.__WB_CARD__=__wc;';
const NNL = "          .replace('" + NNF + "', '" + NNT + "')";
const F2 = 'var s=o(n);window.__WB_CARD__=__wc;r={...e.characters,[t]:s};';
const T2 = 'var s=o(n);window.__WB_CARD__=__wc;var r={...e.characters,[t]:s};';

let g = rd(G);
if (has(g, "var r={...e.characters,[t]:s};'")) console.log("= уже поправлено");
else {
  g = rep(g, NNL, NNL + "\n          .replace('" + F2 + "', '" + T2 + "')", "порядок объявлений в nn");
  wr(G, g);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");