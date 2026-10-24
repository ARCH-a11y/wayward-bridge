// wb-apply-h1q.js — лог: кто пишет чужую запись в nn
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

const F2 = 'var s=o(n);window.__WB_CARD__=__wc;r={...e.characters,[t]:s};';
const T2 = 'var s=o(n);window.__WB_CARD__=__wc;var r={...e.characters,[t]:s};';
const L2 = "          .replace('" + F2 + "', '" + T2 + "')";
const T3 = 'var s=o(n);window.__WB_CARD__=__wc;if(t===e.primaryCharacterId&&s&&s.id!==t)console.warn("[wb] nn пишет чужую запись:",t,"<-",s.id,(new Error()).stack);var r={...e.characters,[t]:s};';

let g = rd(G);
if (has(g, "nn пишет чужую запись")) console.log("= уже есть");
else {
  g = rep(g, L2, L2 + "\n          .replace('" + T2 + "', '" + T3 + "')", "лог чужой записи в nn");
  wr(G, g);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");