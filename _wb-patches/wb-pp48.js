'use strict';
const fs = require('fs');
const G = 'src/016-src_server_game.js';

const E_FROM = '.wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}';
const E_TO = '.wb-bp{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-items:start}';

const F_FROM = '.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}';
const F_TO = '.wb-pl{font-size:.62rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.06em;margin:0 0 4px;padding:2px 6px;border:1px solid #3f3a36;border-radius:4px;background:rgba(10,9,8,.6);display:inline-block}';

const BI = '.wb-bi{width:100%;aspect-ratio:1/1;object-fit:cover;background:#1c1917;border-radius:4px;display:block}';
const G_TO = BI + '.wb-shot--full{grid-column:1/2;grid-row:1/4}.wb-shot--close{grid-column:2/4}.wb-shot--misc{grid-column:4/5}.wb-bc.wb-shot--full .wb-bi{aspect-ratio:9/16}.wb-bc.wb-shot--close .wb-bi{aspect-ratio:4/3}';

const H_FROM = 'var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label;';
const H_TO = 'var t=document.createElement("div"); t.className="wb-pl"; t.textContent=label;';

const I_FROM = 'var w=document.createElement("div"); w.className="wb-bc"+(prev?"":" noimg");';
const I_TO = 'var w=document.createElement("div"); w.className="wb-bc "+(part==="body"?"wb-shot--full":part==="misc"?"wb-shot--misc":"wb-shot--close")+(prev?"":" noimg");';

const PAIRS = [
  [E_FROM, E_TO, 'сетка коллажа'],
  [F_FROM, F_TO, 'табличка'],
  [BI, G_TO, 'плитки полного роста и планов'],
  [H_FROM, H_TO, 'класс таблички'],
  [I_FROM, I_TO, 'класс плитки по части']
];

const src = fs.readFileSync(G, 'utf8');
for (const [from, , label] of PAIRS) {
  const n = src.split(from).length - 1;
  if (n !== 1) {
    const i = src.indexOf(from);
    console.log('FAIL ' + label + ': совпадений ' + n + ', нужно 1');
    if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + from.length + 300) + '\n---');
    process.exit(1);
  }
}
let res = src;
for (const [from, to, label] of PAIRS) { res = res.replace(from, () => to); console.log('ok ' + label); }
fs.writeFileSync(G, res);
console.log('записано');