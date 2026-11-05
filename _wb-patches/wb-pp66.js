'use strict';
const fs = require('fs');
const F = 'src/024-src_server_index.js';
const from = 'const focus = [PART_FOCUS[part] || "", String((b && (b.prompt || b.focus)) || pp.text || "").trim()].filter(Boolean).join(", ");';
const to = 'const comp = part === "body" ? String((b && (b.prompt || b.focus)) || pp.text || "").trim() : "";\n      const focus = [PART_FOCUS[part] || "", comp].filter(Boolean).join(", ");';
const t = fs.readFileSync(F, 'utf8');
const n = t.split(from).length - 1;
if (n !== 1) { console.log('FAIL композиция только body: ' + n); process.exit(1); }
fs.writeFileSync(F, t.replace(from, () => to));
console.log('ok   композиция только для body');