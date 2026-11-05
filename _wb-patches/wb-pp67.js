'use strict';
const fs = require('fs');
const F = 'src/024-src_server_index.js';
const from = 'const compNeg = String((b && b.negPrompt) || pp.negative || "").trim();';
const to = 'const compNeg = part === "body" ? String((b && b.negPrompt) || pp.negative || "").trim() : "";';
const t = fs.readFileSync(F, 'utf8');
const n = t.split(from).length - 1;
if (n !== 1) { console.log('FAIL негатив только body: ' + n); process.exit(1); }
fs.writeFileSync(F, t.replace(from, () => to));
console.log('ok   негатив композиции только для body');