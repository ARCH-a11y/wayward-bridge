'use strict';
const fs = require('fs');
const W = 'src/012-src_server_workflows.js';
const I = 'src/024-src_server_index.js';
const G = 'src/016-src_server_game.js';
const U = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';

const P = [];
function pair(file, from, to, label) { P.push([file, from, to, label]); }

// 1. портрет больше не глушит LoRA, если попросили
pair(W,
  'const loras = args.portrait ? [] : (p.loras || []).filter((l) => l.enabled !== false && l.model);',
  'const loras = (args.keepLoras || !args.portrait ? (p.loras || []) : []).filter((l) => l.enabled !== false && l.model);',
  'loras при keepLoras');

// 2. сервер: черновик из запроса главнее сохранённого, LoRA первой в стеке
pair(I,
  'const pl = store.effective(heroine).partLora || {};',
  'const pl = Object.assign({}, store.effective(heroine).partLora || {}, (b && b.lora) || {});',
  'настройки lora из запроса');
pair(I,
  'if (pl.enabled !== false && partLoraModel) pipeLoras.push({ model: partLoraModel, strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });',
  'if (pl.enabled !== false && partLoraModel) pipeLoras.unshift({ model: partLoraModel, strength: Math.min(2, Number(pl.strength) || 0.9), enabled: true });',
  'lora первой в стеке');
pair(I,
  'const focus = String((store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";',
  'const focus = String((b && b.focus) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";',
  'фокус из запроса');
pair(I,
  'seed: Number(b && b.seed) || heroineSeed(heroine), width:',
  'seed: Number(b && b.seed) || heroineSeed(heroine), keepLoras: true, width:',
  'keepLoras в вызове');

// 3. клиент отдаёт черновик
pair(G,
  'body:JSON.stringify({heroine:hero,key:key,part:part,base:src.base,neg:src.neg,look:src.look,stage:src.stage,sex:src.sex,seed:im.style.display==="block"?(Date.now()%1e9):0})',
  'body:JSON.stringify((function(){ var c=(window.__WB_PART_CFG__&&window.__WB_PART_CFG__())||{}; return {heroine:hero,key:key,part:part,base:src.base,neg:src.neg,look:src.look,stage:src.stage,sex:src.sex,seed:im.style.display==="block"?(Date.now()%1e9):0,focus:(c.focus||{})[part]||"",lora:c.lora||null}; })())',
  'черновик в запросе превью');

// 4. меню отдаёт черновик наружу
pair(U,
  'function D(rel) {',
  'window.__WB_PART_CFG__ = function() {\n          return { focus: E(["partFocus"]) || {}, lora: { enabled: E(["partLora", "enabled"]) !== false, model: E(["partLora", "model"]), strength: E(["partLora", "strength"]), triggers: E(["partLora", "triggers"]) } };\n        };\n        function D(rel) {',
  'мост черновика');

// проверка
let bad = 0;
const files = {};
for (const [file] of P) if (!files[file]) files[file] = fs.readFileSync(file, 'utf8');
for (const [file, from, , label] of P) {
  const n = files[file].split(from).length - 1;
  if (n !== 1) {
    console.log('FAIL ' + label + ': совпадений ' + n + ', нужно 1');
    const i = files[file].indexOf(from.slice(0, 40));
    if (i >= 0) console.log('---\n' + files[file].slice(Math.max(0, i - 200), i + 260) + '\n---');
    bad = 1;
  } else console.log('ok   ' + label);
}
if (bad) process.exit(1);

for (const [file, from, to, label] of P) {
  files[file] = files[file].replace(from, () => to);
  fs.writeFileSync(file, files[file]);
  console.log('записано ' + label);
}

try {
  let v = fs.readFileSync(V, 'utf8');
  const a = '["Превью: раздел композиции"';
  const i = v.indexOf(a);
  if (i < 0) console.log('WARN якорь verify не найден');
  else {
    const e = v.indexOf('\n', i);
    v = v.slice(0, e) + '\n  ["Превью: lora в превью", "keepLoras", 2],\n  ["Превью: фокус из черновика", "b.focus", 1],' + v.slice(e);
    fs.writeFileSync(V, v);
    console.log('ok   маркеры verify');
  }
} catch (e) { console.log('WARN verify: ' + e.message); }