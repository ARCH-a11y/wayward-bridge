// wb-av8.js — починить падение генерации: у строки «Negative · Внешность» нет keys
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

// 1) добавить keys строке негатива
sub(
  '        game: "",\n        final: joinTags(final),\n        changes,\n        negative: true,',
  '        game: "",\n        final: joinTags(final),\n        changes,\n        keys: new Set(final.map(tagKey)),\n        negative: true,',
  'keys у строки негатива');

// 2) страховка в цикле раскладки: не падать, если у строки нет keys
sub(
  '        (rows.find((r) => r.keys.has(k)) || other).tags.push(t);',
  '        (rows.find((r) => r.keys && r.keys.has(k)) || other).tags.push(t);',
  'страховка цикла раскладки');

// 3) маркер
let v = fs.readFileSync(V, 'utf8');
const vAnchor = '  ["Внешность: негатив строкой", "buildAppearanceNegRow", 2],';
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else { v = v.replace(vAnchor, () => vAnchor + '\n  ["Внешность: keys у негатива", "keys: new Set(final.map(tagKey))", 1],'); console.log('ok wb-verify: маркер'); }

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');
const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('keys: new Set(final.map(tagKey))', 1);
chk('r.keys && r.keys.has(k)', 1);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);