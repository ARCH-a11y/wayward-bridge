// wb-av14.js — сохранить части негативной строки при переносе в разбор
const fs = require('fs');
const F = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let t = fs.readFileSync(F, 'utf8');
let v = fs.readFileSync(V, 'utf8');

const from = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, rel: r.rel || null });`;
const to = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, parts: r.parts || null, rel: r.rel || null });`;

const n = t.split(from).length - 1;
if (n !== 1) { console.log('MISS строка 554: ' + n + ', не записано'); process.exit(1); }
t = t.replace(from, to);
fs.writeFileSync(F, t, 'utf8');
console.log('ok 008: parts в негативной строке');

const vm = `  ["Внешность: негатив в rows", "rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, r0)", 2],`;
const vn = v.split(vm).length - 1;
if (vn !== 1) { console.log('MISS verify: ' + vn); process.exit(1); }
v = v.replace(vm, vm + `\n  ["Внешность: parts у негатива", "parts: r.parts || null", 1],`);
fs.writeFileSync(V, v, 'utf8');
console.log('ok verify: маркер');

const chk = fs.readFileSync(F, 'utf8');
console.log('parts у негатива: ' + (chk.split('parts: r.parts || null').length - 1));
console.log('размер 008: ' + fs.statSync(F).size);