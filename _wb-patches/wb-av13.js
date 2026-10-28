// wb-av13.js — переименовать список частей в негативном строителе
const fs = require('fs');
const F = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let t = fs.readFileSync(F, 'utf8');
let v = fs.readFileSync(V, 'utf8');

const a1 = `      const parts = ((effX && effX.negParts) || []).map((p) => ({`;
const a2 = `        tags: [],
        changes,
        parts,
        keys: new Set(final.map(tagKey)),`;

const n1 = t.split(a1).length - 1;
const n2 = t.split(a2).length - 1;
if (n1 !== 1 || n2 !== 1) { console.log('MISS: ' + n1 + ' / ' + n2 + ', не записано'); process.exit(1); }

t = t.replace(a1, `      const partRows = ((effX && effX.negParts) || []).map((p) => ({`);
t = t.replace(a2, `        tags: [],
        changes,
        partRows,
        keys: new Set(final.map(tagKey)),`);
fs.writeFileSync(F, t, 'utf8');
console.log('ok 008: негативный список переименован');

const vm = `  ["Внешность: части для правки", "const parts = ((effX && effX.parts) || []).map", 1],`;
if (v.split(vm).length - 1 !== 1) { console.log('MISS verify'); process.exit(1); }
v = v.replace(vm, vm + `\n  ["Внешность: негативные части", "const partRows = ((effX && effX.negParts) || []).map", 1],`);
fs.writeFileSync(V, v, 'utf8');
console.log('ok verify: маркер');

const chk = fs.readFileSync(F, 'utf8');
console.log('partRows: ' + (chk.split('partRows').length - 1));
console.log('parts в 008: ' + (chk.split('const parts =').length - 1));
console.log('размер 008: ' + fs.statSync(F).size);