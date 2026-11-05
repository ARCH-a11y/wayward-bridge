'use strict';
const fs = require('fs');
const I = 'src/024-src_server_index.js';
const G = 'src/016-src_server_game.js';
const U = 'src/019-src_server_assets.generated.js';

const P = [
  [I,
   'const part = String(b && b.part || "body");\n      console.log("[wb-prev-srv] part=" + part + " focus=" + JSON.stringify(b && b.focus) + " lora=" + JSON.stringify(b && b.lora && b.lora.model));',
   'const part = String(b && b.part || "body");',
   'снять лог сервера'],
  [G,
   'var __d=(window.__WB_PART_CFG__&&window.__WB_PART_CFG__())||{}; console.log("[wb-prev-cli] part="+part+" cfg="+(typeof window.__WB_PART_CFG__)+" focus="+JSON.stringify(__d.focus)); fetch("/bridge/api/part-preview",{method:"POST"',
   'fetch("/bridge/api/part-preview",{method:"POST"',
   'снять лог клиента'],
  [I,
   'if (pl.enabled !== false && partLoraModel) pipeLoras.unshift({ model: partLoraModel, strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });',
   'const usePartLora = pl.enabled !== false && partLoraModel && part === "body";\n      if (usePartLora) pipeLoras.unshift({ model: partLoraModel, strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });',
   'lora только для body'],
  [I,
   'const partTrig = pl.enabled !== false && partLoraModel ? String(',
   'const partTrig = usePartLora ? String(',
   'триггеры только для body'],
  [I,
   'const focus = String((b && (b.focusMap ? b.focusMap[part] : b.focus)) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";',
   'const focus = String((b && (b.focusMap ? b.focusMap[part] : b.focus)) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";\n      const miscFocus = full ? "" : String((b && b.focusMap && b.focusMap.misc) || (store.effective(heroine).partFocus || {}).misc || "").trim();',
   'композиция Разного рядом'],
  [I,
   'const positive = [pipe.quality, "1girl, solo, completely nude", focus, tags, partTrig,',
   'const positive = [pipe.quality, "1girl, solo, completely nude", focus, miscFocus, tags, partTrig,',
   'Разное в промпте'],
  [U,
   'Только для превью частей. Нужна LoRA «pussy spec report» (Illustrious).',
   'Только для превью тела (Body report). Нужна LoRA «pussy spec report» (Illustrious).',
   'подпись про область']
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