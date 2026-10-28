// wb-av16.js — ключ возврата негативной строки: parts
const fs = require('fs');
const F = 'src/008-src_server_prompt.js';
let t = fs.readFileSync(F, 'utf8');
const from = `        tags: [],
        changes,
        partRows,
        keys: new Set(final.map(tagKey)),`;
const to = `        tags: [],
        changes,
        parts: partRows,
        keys: new Set(final.map(tagKey)),`;
const n = t.split(from).length - 1;
if (n !== 1) { console.log('MISS: ' + n + ', не записано'); process.exit(1); }
t = t.replace(from, to);
fs.writeFileSync(F, t, 'utf8');
console.log('ok 008: parts: partRows');
console.log('partRows в 008: ' + (fs.readFileSync(F, 'utf8').split('partRows').length - 1));