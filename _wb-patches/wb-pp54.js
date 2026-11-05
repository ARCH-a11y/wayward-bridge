'use strict';
const fs = require('fs');
const I = 'src/024-src_server_index.js';
const U = 'src/019-src_server_assets.generated.js';

const E_FROM = /function bodySec\(\) \{\n\s*var id = S\.viewHeroine, rb = \["prompts", "heroines", id\];/;
const E_TO = 'function bodySec() {\n          var id = S.viewHeroine, rb = ["prompts", "heroines", id];\n          var plOrder = ["Anima", "Illustrious", "NoobAI", "Pony", "SDXL", "Flux", "SD 1.5", "SD 2.1", "Unknown"];\n          function partLoraItems() {\n            return [{ value: "", label: "None", group: "" }].concat(modelItems("lora", function(f) {\n              var b = String(f.base || "").split(",")[0].trim();\n              return plOrder.indexOf(b) >= 0 ? b : "Unknown";\n            }));\n          }\n          var loraCur = E(["app", "partLora", "model"]);\n          if (loraCur === undefined) loraCur = "pussy spec report_ILL-v2.1.safetensors";';

const F_FROM = /h\("input", \{ type: "text", value: String\(E\(\["app","partLora","model"\]\)[^\n]*?\}\),/;
const F_TO = 'picker(partLoraItems(), String(loraCur || ""), function(v){ edit(["app","partLora","model"], v); render(); }, { width: 460, style: "flex:1;min-width:0", dirty: isDirty(["app","partLora","model"]) }),';

const NEW = [
  '      const partLoraModel = String(pl.model === undefined ? "pussy spec report_ILL-v2.1.safetensors" : pl.model).trim();',
  '      if (pl.enabled !== false && partLoraModel) pipeLoras.push({ model: partLoraModel, strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });',
  '      const partTrig = pl.enabled !== false && partLoraModel ? String(pl.triggers === undefined ? "pussy report, stats, hexagon stats, character profile, photo \\\\(object\\\\), pussy" : pl.triggers).trim() : "";'
];

let ok = true;
const u0 = fs.readFileSync(U, 'utf8');
for (const [from, , label] of [[E_FROM, E_TO, 'E список lora'], [F_FROM, F_TO, 'F picker']]) {
  const m = u0.match(new RegExp(from.source, 'g'));
  const n = m ? m.length : 0;
  console.log((n === 1 ? 'ok   ' : 'MISS ') + label + ' -> ' + n);
  if (n !== 1) ok = false;
}

const src = fs.readFileSync(I, 'utf8');
const lines = src.split('\n');
const hits = [];
lines.forEach((l, i) => {
  if (l.startsWith('      const partTrig = ') || l.startsWith('      if (pl.enabled !== false) pipeLoras.push(')) hits.push(i);
});
console.log((hits.length === 2 ? 'ok   ' : 'MISS ') + 'G две строки -> ' + hits.length);
if (hits.length !== 2) {
  ok = false;
  const base = lines.findIndex((l) => l.indexOf('const loraTrig') >= 0);
  console.log('---\n' + lines.slice(Math.max(0, base - 4), Math.max(0, base - 4) + 14).join('\n') + '\n---');
}
if (!ok) { console.log('не записано'); process.exit(1); }

let u = u0;
for (const [from, to, label] of [[E_FROM, E_TO, 'E'], [F_FROM, F_TO, 'F']]) { u = u.replace(from, () => to); console.log('ok   применено ' + label); }
fs.writeFileSync(U, u);

const outLines = lines.slice();
outLines.splice(hits[0], 2, NEW[0], NEW[1], NEW[2]);
fs.writeFileSync(I, outLines.join('\n'));
console.log('ok   применено G');
console.log('записано');