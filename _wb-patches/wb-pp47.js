'use strict';
const fs = require('fs');
const G = 'src/016-src_server_game.js';

const C_FROM = '\\n  var cap=document.createElement("div"); cap.className="text-[0.7rem] text-stone-500 mb-2"; cap.textContent="Body previews"; el.appendChild(cap);';
const D_FROM = '\\n      cap.textContent="["+k+"] arch="+real+" base="+String(ch.base||"").length+" look="+(ch.look?"yes":"no")+" st="+ch.stage;';

const src = fs.readFileSync(G, 'utf8');
for (const [from, label] of [[C_FROM, 'узел подписи'], [D_FROM, 'текст подписи']]) {
  const n = src.split(from).length - 1;
  if (n !== 1) {
    const i = src.indexOf(from);
    console.log('FAIL ' + label + ': совпадений ' + n + ', нужно 1');
    if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + from.length + 300) + '\n---');
    process.exit(1);
  }
}
let res = src.replace(C_FROM, () => '').replace(D_FROM, () => '');
if (res.includes('cap.textContent')) { console.log('FAIL: остались обращения к cap'); process.exit(1); }
fs.writeFileSync(G, res);
console.log('ok подпись снята');