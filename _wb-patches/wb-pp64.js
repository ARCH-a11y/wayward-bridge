'use strict';
const fs = require('fs');
const F = 'src/024-src_server_index.js';
const from = ': (pipe.portrait && pipe.portrait.width) || 512, height: part === "body" ? (pipe.scene && Math.max(pipe.scene.width, pipe.scene.height)) || 1216 : (pipe.portrait && pipe.portrait.height) || 512,';
const to = ': 900, height: part === "body" ? (pipe.scene && Math.max(pipe.scene.width, pipe.scene.height)) || 1216 : 900,';
const t = fs.readFileSync(F, 'utf8');
const n = t.split(from).length - 1;
if (n !== 1) { console.log('FAIL размер: ' + n); process.exit(1); }
fs.writeFileSync(F, t.replace(from, () => to));
console.log('ok   квадрат 900x900');