'use strict';
const fs = require('fs');
const S = 'src/001-src_server_schema.js';
const I = 'src/024-src_server_index.js';
const U = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';

const DEF_MODEL = 'pussy spec report_ILL-v2.1.safetensors';
const DEF_TRIG = 'pussy report, stats, hexagon stats, character profile, photo \\\\(object\\\\), pussy';

const A_FROM = '        shortcuts: bool(),\n        loraMemory\n      },';
const A_TO = '        shortcuts: bool(),\n        loraMemory,\n        partLora: { enabled: bool(), model: str(400), strength: num(-2, 2), triggers: str(4e3) }\n      },';

const B_FROM = '      const loraTrig = [...new Set(pipeLoras.flatMap((l) => loraWords(l)))].join(", ");';
const B_TO = B_FROM + '\n      const pl = store.settings.app.partLora || {};\n      const partTrig = String(pl.triggers || "' + DEF_TRIG + '").trim();\n      if (pl.enabled !== false) pipeLoras.push({ model: String(pl.model || "' + DEF_MODEL + '").trim(), strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });';

const C_FROM = 'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background", loras].filter(Boolean).join(", ");';
const C_TO = 'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, partTrig, "solid dark background, plain background", loras].filter(Boolean).join(", ");';

const D_FROM = '            "Описание героини собирается из частей и уходит в промпт.",\n            h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {';
const D_TO = '            "Описание героини собирается из частей и уходит в промпт.",\n            h("div", { class: "pcell" },\n              h("div", { class: "phead" }, h("span", { class: "plab" }, "LoRA отчёта"), (function(){ var c = h("input", { type: "checkbox", checked: E(["app","partLora","enabled"]) !== false, onchange: function(){ edit(["app","partLora","enabled"], c.checked); render(); } }); return c; })()),\n              h("div", { style: "display:flex;gap:6px;margin:4px 0" },\n                h("input", { type: "text", value: String(E(["app","partLora","model"]) || "' + DEF_MODEL + '"), placeholder: "путь к LoRA", style: "flex:1;min-width:0;padding:4px;background:#1c1917;color:#e7e5e4;border:1px solid #57534e;border-radius:4px;font-size:.7rem", oninput: function(e){ edit(["app","partLora","model"], e.target.value); e.target.classList.add("dirty"); } }),\n                h("input", { type: "number", step: "0.05", min: "0", max: "2", value: String(E(["app","partLora","strength"]) || 0.9), style: "width:64px;padding:4px;background:#1c1917;color:#e7e5e4;border:1px solid #57534e;border-radius:4px;font-size:.7rem", oninput: function(e){ edit(["app","partLora","strength"], Number(e.target.value)); } })\n              ),\n              promptBox("триггеры", ["app","partLora","triggers"], { height: "40px" }),\n              h("div", { style: "color:#a8a29e;font-size:.65rem" }, "Только для превью частей. Нужна LoRA «pussy spec report» (Illustrious).")\n            ),\n            h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {';

const V_FROM = '  ["Превью: лоры из настроек", "const pipeLoras = (pipe.loras || [])", 1],';
const V_TO = V_FROM + '\n  ["Превью: lora настройка", "LoRA отчёта", 1],\n  ["Превью: lora в промпте", "settings.app.partLora", 1],';

const PLAN = [
  [S, [[A_FROM, A_TO, 'схема app.partLora']]],
  [I, [[B_FROM, B_TO, 'подмешивание lora'], [C_FROM, C_TO, 'триггеры в positive']]],
  [U, [[D_FROM, D_TO, 'поле настройки в меню']]],
  [V, [[V_FROM, V_TO, 'маркеры']]]
];

const out = [];
for (const [file, pairs] of PLAN) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [from, , label] of pairs) {
    const n = src.split(from).length - 1;
    if (n !== 1) {
      console.log('FAIL ' + file + ' / ' + label + ': совпадений ' + n + ', нужно 1');
      const i = src.indexOf(from);
      if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + from.length + 300) + '\n---');
      process.exit(1);
    }
  }
  let res = src;
  for (const [from, to, label] of pairs) { res = res.replace(from, () => to); console.log('ok ' + label); }
  out.push([file, res]);
}
for (const [file, res] of out) fs.writeFileSync(file, res);
console.log('записано');