'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const RE = /body|stats|\u0441\u0442\u0430\u0442|\u0432\u043d\u0435\u0448|\u0447\u0430\u0441\u0442/i;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html?|js|css)$/i.test(e.name)) out.push(p);
  }
  return out;
}

for (const f of walk(ROOT, [])) {
  const rel = path.relative(ROOT, f);
  if (rel.startsWith('_wb-patches') || rel.startsWith('dist')) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const hits = [];
  lines.forEach((l, i) => { if (RE.test(l)) hits.push(i); });
  if (!hits.length) continue;
  console.log('\n=== ' + rel + '  (' + lines.length + ' \u0441\u0442\u0440\u043e\u043a, ' + hits.length + ' \u0441\u043e\u0432\u043f.)');
  for (const i of hits.slice(0, 40)) {
    const l = lines[i].trim().slice(0, 180);
    if (l) console.log(String(i + 1).padStart(5) + '| ' + l);
  }
  if (hits.length > 40) console.log('   ... \u0435\u0449\u0451 ' + (hits.length - 40));
}