'use strict';
const fs = require('fs');
const G = 'src/016-src_server_game.js';
const V = 'wb-verify.js';

const A_FROM = '\\nfunction wbPFill(el,key){\\n  wbPStyle(); el.textContent="";\\n  var grid=document.createElement("div"); grid.className="wb-bp"; el.appendChild(grid);';
const A_TO = '\\nfunction wbPFill(el,key,which){\\n  wbPStyle(); el.textContent="";\\n  var onlyBody=which==="body";\\n  var grid=document.createElement("div"); grid.className="wb-bp"+(onlyBody?"":" wb-bp--grid"); el.appendChild(grid);';

const B_FROM = 'WB_PARTS.forEach(function(x){ var t=x[0]==="head"||x[0]==="breasts" ? [p[x[0]],misc].filter(Boolean).join(", ") : p[x[0]]; grid.appendChild(wbPCard(real,k,x[0],x[1],t,pv[x[0]],ch)); });';
const B_TO = 'WB_PARTS.forEach(function(x){ if(onlyBody?x[0]!=="body":x[0]==="body") return; var t=x[0]==="head"||x[0]==="breasts" ? [p[x[0]],misc].filter(Boolean).join(", ") : p[x[0]]; grid.appendChild(wbPCard(real,k,x[0],x[1],t,pv[x[0]],ch)); });';

const C_FROM = '})]}),tab==="body"?u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==k){ el.dataset.wbH=k; wbPFill(el,k); } }}):u.jsx("div",{className:"text-[0.75rem] text-stone-500"},"Report is not built yet.")]});\\n}';
const C_TO = '})]}),tab==="body"?u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!=="body|"+k){ el.dataset.wbH="body|"+k; wbPFill(el,k,"body"); } }}):u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!=="rest|"+k){ el.dataset.wbH="rest|"+k; wbPFill(el,k,"rest"); } }})]});\\n}';

const D_FROM = '.wb-bp{display:grid;grid-template-columns:1fr;gap:12px;max-width:100%}';
const D_TO = '.wb-bp{display:grid;grid-template-columns:1fr;gap:12px;max-width:100%}.wb-bp--grid{grid-template-columns:repeat(2,1fr);gap:8px}';

const E_FROM = '.wb-bp .wb-bc .wb-bi{aspect-ratio:2/3}';
const E_TO = '.wb-bp .wb-bc .wb-bi{aspect-ratio:2/3}.wb-bp--grid .wb-bc .wb-bi{aspect-ratio:1/1}';

const V_FROM = '["Превью: заполнение", "function wbPFill(el,key)", 1],';
const V_TO = '["Превью: заполнение", "function wbPFill(el,key,which)", 1],';

const PLAN = [
  [G, [[A_FROM, A_TO, 'параметр набора'], [B_FROM, B_TO, 'фильтр частей'], [C_FROM, C_TO, 'обе вкладки рисуют'], [D_FROM, D_TO, 'две колонки'], [E_FROM, E_TO, 'квадрат в сетке']]],
  [V, [[V_FROM, V_TO, 'маркер заполнения']]]
];

const out = [];
for (const [file, pairs] of PLAN) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [from, , label] of pairs) {
    const n = src.split(from).length - 1;
    if (n !== 1) {
      console.log('FAIL ' + file + ' / ' + label + ': совпадений ' + n + ', нужно 1');
      const i = src.indexOf(from);
      const at = i >= 0 ? i : src.indexOf('tab==="body"?');
      if (at >= 0) console.log('---\n' + src.slice(Math.max(0, at - 400), at + 400) + '\n---');
      process.exit(1);
    }
  }
  let res = src;
  for (const [from, to, label] of pairs) { res = res.replace(from, () => to); console.log('ok ' + label); }
  out.push([file, res]);
}
for (const [file, res] of out) fs.writeFileSync(file, res);
console.log('записано');