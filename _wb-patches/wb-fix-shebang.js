// wb-fix-shebang.js ? ????????? shebang + "use strict" ? ?????? ????-?????
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src');
const ORDER = path.join(SRC, 'ORDER.txt');

let order = fs.readFileSync(ORDER, 'utf8').split(/\r?\n/).filter(Boolean);
if (order[0] !== '000-tags-blob') { console.error('ORDER[0] ?? 000-tags-blob, ?', order[0]); process.exit(1); }

const first = path.join(SRC, order[1]);
const s = fs.readFileSync(first, 'utf8');

const m = s.match(/^(#![^\n]*\n)((?:[ \t]*\/\/[^\n]*\n)*)([ \t]*"use strict";[ \t]*\n)/);
if (!m) { console.error('MISS: ?? ????? shebang/use strict ?', order[1]); process.exit(1); }
const head = m[0];
console.log('??????????? ????:', JSON.stringify(head));

fs.writeFileSync(first + '.shebang-bak', s);
fs.writeFileSync(first, s.slice(head.length));

const blobPath = path.join(SRC, '000-tags-blob.js');
fs.writeFileSync(blobPath, head + fs.readFileSync(blobPath, 'utf8'));

console.log('OK: ???? ????????? ? 000-tags-blob.js, ??', order[1], '??????');
console.log('?????? ????? ?????????? ???:');
console.log(JSON.stringify(fs.readFileSync(blobPath, 'utf8').slice(0, 160)));
