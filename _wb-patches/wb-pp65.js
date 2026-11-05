'use strict';
const fs = require('fs');
const F = 'src/024-src_server_index.js';
const from = '[String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags,';
const to = '[String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : part === "mouth" ? String(buckets.head || "").trim() : hairTags,';
const t = fs.readFileSync(F, 'utf8');
const n = t.split(from).length - 1;
if (n !== 1) { console.log('FAIL голова в рот: ' + n); process.exit(1); }
fs.writeFileSync(F, t.replace(from, () => to));
console.log('ok   голова идёт в промпт рта');