// wb-av15.js — маркер для parts у негатива
const fs = require('fs');
const V = 'wb-verify.js';
let v = fs.readFileSync(V, 'utf8');
const vm = `  ["Внешность: негатив строкой", "buildAppearanceNegRow", 2],`;
const n = v.split(vm).length - 1;
if (n !== 1) { console.log('MISS verify: ' + n + ', не записано'); process.exit(1); }
v = v.replace(vm, vm + `\n  ["Внешность: parts у негатива", "parts: r.parts || null", 1],`);
fs.writeFileSync(V, v, 'utf8');
console.log('ok verify: маркер');
console.log('parts у негатива в verify: ' + (fs.readFileSync(V, 'utf8').split('parts: r.parts || null').length - 1));