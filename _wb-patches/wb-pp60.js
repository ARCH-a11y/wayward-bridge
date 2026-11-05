'use strict';
const fs = require('fs');
const I = 'src/024-src_server_index.js';
const G = 'src/016-src_server_game.js';

const P = [
  [G,
   'focus:(c.focus||{})[part]||"",lora:c.lora||null',
   'focus:(c.focus||{})[part]||"",focusMap:c.focus||null,lora:c.lora||null',
   'клиент шлёт карту'],
  [I,
   'const focus = String((b && b.focus) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";',
   'const focus = String((b && (b.focusMap ? b.focusMap[part] : b.focus)) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";',
   'сервер берёт часть из карты']
];

const files = {};
for (const [f] of P) if (!files[f]) files[f] = fs.readFileSync(f, 'utf8');
let bad = 0;
for (const [f, from, , label] of P) {
  const n = files[f].split(from).length - 1;
  if (n !== 1) { console.log('FAIL ' + label + ': ' + n); bad = 1; } else console.log('ok   ' + label);
}
if (bad) process.exit(1);
for (const [f, from, to, label] of P) {
  files[f] = files[f].replace(from, () => to);
  fs.writeFileSync(f, files[f]);
  console.log('записано ' + label);
}