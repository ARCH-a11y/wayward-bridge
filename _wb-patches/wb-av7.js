// wb-av7.js — страховка: падение строк «Внешность» не должно ломать генерацию, стек уходит в консоль
const fs = require('fs');
const P = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let bad = 0;
let s = fs.readFileSync(P, 'utf8');
const orig = s;

function sub(anchor, repl, name) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) { bad++; console.log('MISS ' + name + ': найдено=' + n); return; }
  s = s.replace(anchor, () => repl);
  console.log('ok ' + name);
}

sub(
  '      const appearRow = buildAppearanceRow(heroine, heroDefX, heroEffX, notes, origin);\n      if (appearRow) explain.splice(1, 0, appearRow);',
  '      try { const appearRow = buildAppearanceRow(heroine, heroDefX, heroEffX, notes, origin); if (appearRow) explain.splice(1, 0, appearRow); } catch (e) { console.error("[wb] Внешность: упал разбор:", e && e.stack || e); }',
  'страховка позитивной строки');

sub(
  '      const appearNegRow = buildAppearanceNegRow(input.heroine, heroDefX, heroEffX, origin);\n      if (appearNegRow) {\n        const cnIdx = rows.findIndex((r) => String(r.label).indexOf("Character negative") === 0);\n        rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, appearNegRow);\n      }',
  '      try { const r0 = buildAppearanceNegRow(input.heroine, heroDefX, heroEffX, origin); if (r0) { const cnIdx = rows.findIndex((r) => String(r.label).indexOf("Character negative") === 0); rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, r0); console.log("[wb] негатив внешности: частей=" + ((r0.changes || []).length)); } } catch (e) { console.error("[wb] негатив внешности: упал разбор:", e && e.stack || e); }',
  'страховка негативной строки');

let v = fs.readFileSync(V, 'utf8');
const vAnchor = '  ["Внешность: негатив в rows", \'indexOf("Character negative")\', 1],';
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else { v = v.replace(vAnchor, () => vAnchor + '\n  ["Внешность: страховка негатива", "негатив внешности: упал разбор", 1],'); console.log('ok wb-verify: маркер'); }

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');
const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('try { const appearRow = buildAppearanceRow', 1);
chk('try { const r0 = buildAppearanceNegRow', 1);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);