'use strict';
const fs = require('fs');
const S = 'src/001-src_server_schema.js';
const I = 'src/024-src_server_index.js';
const G = 'src/016-src_server_game.js';
const U = 'src/019-src_server_assets.generated.js';

function rep(file, from, to, label) {
  const t = fs.readFileSync(file, 'utf8');
  const n = t.split(from).length - 1;
  if (n !== 1) { console.log('FAIL ' + label + ': ' + n); process.exit(1); }
  fs.writeFileSync(file, t.replace(from, () => to));
  console.log('ok   ' + label);
}

// 1. схема: своя пара полей композиции
rep(S,
  'var PART_FOCUS_SCHEMA = { "*": str(4e3) };',
  'var PART_FOCUS_SCHEMA = { "*": str(4e3) };\n    var PART_PROMPT = { text: str(4e3), negative: str(4e3) };',
  'схема partPrompt');
rep(S,
  'partLora: PART_LORA, partFocus: PART_FOCUS_SCHEMA };',
  'partLora: PART_LORA, partFocus: PART_FOCUS_SCHEMA, partPrompt: PART_PROMPT };',
  'partPrompt в LAYER');

// 2. сервер: один промпт + негатив, размеры по части
rep(I,
  'const focus = String((b && (b.focusMap ? b.focusMap[part] : b.focus)) || (store.effective(heroine).partFocus || {})[part] || "").trim() || PART_FOCUS[part] || "";\n      const miscFocus = full ? "" : String((b && b.focusMap && b.focusMap.misc) || (store.effective(heroine).partFocus || {}).misc || "").trim();',
  'const pp = store.effective(heroine).partPrompt || {};\n      const focus = String((b && (b.prompt || b.focus)) || pp.text || "").trim() || PART_FOCUS[part] || "";\n      const compNeg = String((b && b.negPrompt) || pp.negative || "").trim();',
  'композиция из partPrompt');
rep(I,
  'const positive = [pipe.quality, "1girl, solo, completely nude", focus, miscFocus, tags, partTrig,',
  'const positive = [pipe.quality, "1girl, solo, completely nude", focus, tags, partTrig,',
  'позитив');
rep(I,
  'const negative = [negTags, cropNeg,',
  'const negative = [negTags, cropNeg, compNeg,',
  'негатив');
rep(I,
  'width: (pipe.scene && Math.min(pipe.scene.width, pipe.scene.height)) || 832, height: (pipe.scene && Math.max(pipe.scene.width, pipe.scene.height)) || 1216, portrait: true,',
  'width: part === "body" ? (pipe.scene && Math.min(pipe.scene.width, pipe.scene.height)) || 832 : (pipe.portrait && pipe.portrait.width) || 512, height: part === "body" ? (pipe.scene && Math.max(pipe.scene.width, pipe.scene.height)) || 1216 : (pipe.portrait && pipe.portrait.height) || 512, portrait: true,',
  'размер по части');

// 3. клиент: шлём оба поля
rep(G,
  'focus:(c.focus||{})[part]||"",focusMap:c.focus||null,lora:c.lora||null',
  'prompt:(c.prompt||{}).text||"",negPrompt:(c.prompt||{}).negative||"",lora:c.lora||null',
  'клиент шлёт композицию');

// 4. мост черновика
rep(U,
  'return { focus: E(["partFocus"]) || {}, lora: {',
  'return { prompt: E(["partPrompt"]) || {}, lora: {',
  'мост композиции');

// 5. меню: вместо сетки частей — два поля
(function () {
  let L = fs.readFileSync(U, 'utf8').split('\n');
  const i = L.findIndex((l) => l.indexOf('Композиция по частям') >= 0);
  const j = L.findIndex((l, n) => n > i && l.indexOf('Пусто — значение по умолчанию') >= 0);
  if (i < 0 || j < 0) { console.log('FAIL блок композиции: ' + i + ' / ' + j); process.exit(1); }
  const pad = (L[i].match(/^\s*/) || [''])[0];
  const inner = pad + '  ';
  const block = [
    pad + 'h("div", { class: "phead" }, h("span", { class: "plab" }, "Композиция")),',
    pad + 'promptBox("поза, кадр, фон", ["partPrompt", "text"], { height: "40px" }),',
    pad + 'promptBox("негатив", ["partPrompt", "negative"], { height: "40px" }),',
    pad + 'h("div", { style: "color:#a8a29e;font-size:.65rem" }, "Поза, кадр и фон для превью. Пусто — значение по умолчанию.")'
  ];
  L.splice(i, j - i + 1, ...block);
  fs.writeFileSync(U, L.join('\n'));
  console.log('ok   меню: одно поле композиции + негатив');
})();

// 6. маркер verify
try {
  let v = fs.readFileSync('wb-verify.js', 'utf8');
  const a = '["Превью: фокус из черновика"';
  const i = v.indexOf(a);
  if (i < 0) console.log('WARN якорь verify не найден');
  else {
    const e = v.indexOf('\n', i);
    v = v.slice(0, e) + '\n  ["Превью: своя композиция", "partPrompt", 3],' + v.slice(e);
    fs.writeFileSync('wb-verify.js', v);
    console.log('ok   маркер verify');
  }
} catch (e) { console.log('WARN verify: ' + e.message); }