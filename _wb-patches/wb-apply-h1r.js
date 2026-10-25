// wb-apply-h1r.js — лог в патчере сущностей
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

const F = 'const n=e.characters[t];if(n)return{...e,characters:{...e.characters,[t]:{...n,...o}}};';
const T = 'const n=e.characters[t];if(n){if(t===e.primaryCharacterId&&o&&o.id&&o.id!==t)console.warn("[wb] патч жены чужой записью:",o.id,(new Error()).stack);return{...e,characters:{...e.characters,[t]:{...n,...o}}}};';

let g = rd(G);
if (has(g, "патч жены чужой записью")) console.log("= уже есть");
else {
  g = rep(g, F, T, "лог в патчере сущностей");
  wr(G, g);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(G)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");