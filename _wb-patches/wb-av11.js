// wb-av11.js — не показывать пустую строку Character negative, когда её теги ушли в строку «Внешность»
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
  '      const shared = splitTags(P.negative).filter((t) => !pipeRow.tags.includes(t) && tags.some((u) => tagKey(u) === tagKey(t)));',
  '      for (let i = rows.length - 1; i >= 0; i--) {\n        const lb = String(rows[i].label);\n        if (lb.indexOf("Character negative") === 0 && !rows[i].tags.length) rows.splice(i, 1);\n      }\n      const shared = splitTags(P.negative).filter((t) => !pipeRow.tags.includes(t) && tags.some((u) => tagKey(u) === tagKey(t)));',
  'убрать пустую Character negative');

let v = fs.readFileSync(V, 'utf8');
const vAnchor = '  ["Внешность: tags у негатива", "tags: [],\\n        changes,", 1],';
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else { v = v.replace(vAnchor, () => vAnchor + '\n  ["Внешность: пустая CN убрана", "!rows[i].tags.length) rows.splice(i, 1)", 1],'); console.log('ok wb-verify: маркер'); }

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');
const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('!rows[i].tags.length) rows.splice(i, 1)', 1);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);