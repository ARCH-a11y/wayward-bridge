'use strict';
const fs = require('fs');
const I = 'src/024-src_server_index.js';
const G = 'src/016-src_server_game.js';

const P = [
  [I,
   'const part = String(b && b.part || "body");',
   'const part = String(b && b.part || "body");\n      console.log("[wb-prev-srv] part=" + part + " focus=" + JSON.stringify(b && b.focus) + " lora=" + JSON.stringify(b && b.lora && b.lora.model));',
   'лог сервера'],
  [G,
   'fetch("/bridge/api/part-preview",{method:"POST"',
   'var __d=(window.__WB_PART_CFG__&&window.__WB_PART_CFG__())||{}; console.log("[wb-prev-cli] part="+part+" cfg="+(typeof window.__WB_PART_CFG__)+" focus="+JSON.stringify(__d.focus)); fetch("/bridge/api/part-preview",{method:"POST"',
   'лог клиента']
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