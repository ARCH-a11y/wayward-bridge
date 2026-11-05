'use strict';
const fs = require('fs');
const S = 'src/001-src_server_schema.js';
const I = 'src/024-src_server_index.js';
const U = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';

const A_FROM = '    var PART_LORA = { enabled: bool(), model: str(400), strength: num(-2, 2), triggers: str(4e3) };';
const A_TO = A_FROM + '\n    var PART_FOCUS_SCHEMA = { "*": str(4e3) };';

const B_FROM = '    var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE, player: PLAYER, partLora: PART_LORA };';
const B_TO = '    var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE, player: PLAYER, partLora: PART_LORA, partFocus: PART_FOCUS_SCHEMA };';

const C_FROM = '            ),\n            h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {';
const C_TO = '            ),\n            h("div", { class: "pcell" },\n              h("div", { class: "phead" }, h("span", { class: "plab" }, "Композиция по частям")),\n              h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {\n                return h("div", { class: "pcell" },\n                  h("div", { class: "phead" }, h("span", { class: "plab" }, p[1])),\n                  promptBox("поза, кадр, фон", ["partFocus", p[0]], { height: "40px" })\n                );\n              })),\n              h("div", { style: "color:#a8a29e;font-size:.65rem" }, "Поза, кадр и фон для превью этой части. Пусто — значение по умолчанию.")\n            ),\n            h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {';

const D_FROM = '      const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, partTrig, "solid dark background, plain background", loras].filter(Boolean).join(", ");';
const D_TO = '      const focus = String((store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";\n      const positive = [pipe.quality, "1girl, solo, completely nude", focus, tags, partTrig, "solid dark background, plain background", loras].filter(Boolean).join(", ");';

const E_FROM = '  ["Превью: lora в промпте", "effective(heroine).partLora", 1],';
const E_TO = E_FROM + '\n  ["Превью: композиция правится", "partFocus", 1],';

const PLAN = [
  [S, [[A_FROM, A_TO, 'схема композиции'], [B_FROM, B_TO, 'поле в слое']]],
  [U, [[C_FROM, C_TO, 'редактор композиции']]],
  [I, [[D_FROM, D_TO, 'фокус из слоя']]],
  [V, [[E_FROM, E_TO, 'маркер']]]
];

const out = [];
let bad = 0;
for (const [file, pairs] of PLAN) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [from, , label] of pairs) {
    const n = src.split(from).length - 1;
    console.log((n === 1 ? 'ok   ' : 'MISS ') + file + ' / ' + label + ' -> ' + n);
    if (n !== 1) {
      bad++;
      const i = src.indexOf(from);
      if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + from.length + 300) + '\n---');
    }
  }
  let res = src;
  for (const [from, to, label] of pairs) res = res.replace(from, () => to);
  out.push([file, res]);
}
if (bad) { console.log('не записано'); process.exit(1); }
for (const [file, res] of out) fs.writeFileSync(file, res);
console.log('записано');