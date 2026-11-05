'use strict';
const fs = require('fs');
const S = 'src/001-src_server_schema.js';
const I = 'src/024-src_server_index.js';
const U = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';

const A_FROM = '        loraMemory,\n        partLora: { enabled: bool(), model: str(400), strength: num(-2, 2), triggers: str(4e3) }\n      },';
const A_TO = '        loraMemory\n      },';

const B_FROM = '    var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE, player: PLAYER };';
const B_TO = '    var PART_LORA = { enabled: bool(), model: str(400), strength: num(-2, 2), triggers: str(4e3) };\n    var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE, player: PLAYER, partLora: PART_LORA };';

const C_FROM = /\["app", ?"partLora", ?/g;
const C_TO = '["partLora", ';

const D_FROM = 'const pl = store.settings.app.partLora || {};';
const D_TO = 'const pl = store.effective(heroine).partLora || {};';

const E_FROM = '["Превью: lora в промпте", "settings.app.partLora", 1],';
const E_TO = '["Превью: lora в промпте", "effective(heroine).partLora", 1],';

const PLAN = [
  [S, [[A_FROM, A_TO, 'убрать из app'], [B_FROM, B_TO, 'схема в слое']]],
  [U, [[C_FROM, C_TO, 'пути в меню']]],
  [I, [[D_FROM, D_TO, 'чтение из слоя']]],
  [V, [[E_FROM, E_TO, 'маркер']]]
];

const out = [];
let bad = 0;
for (const [file, pairs] of PLAN) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [from, , label] of pairs) {
    const re = from instanceof RegExp ? new RegExp(from.source, 'g') : null;
    const n = re ? (src.match(re) || []).length : src.split(from).length - 1;
    console.log((n >= 1 ? 'ok   ' : 'MISS ') + file + ' / ' + label + ' -> ' + n);
    if (n < 1) {
      bad++;
      const i = src.search(from);
      if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + 300) + '\n---');
    }
  }
  let res = src;
  for (const [from, to, label] of pairs) res = res.replace(from, () => to);
  out.push([file, res]);
}
if (bad) { console.log('не записано'); process.exit(1); }
for (const [file, res] of out) fs.writeFileSync(file, res);
console.log('записано');