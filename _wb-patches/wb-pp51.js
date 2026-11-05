'use strict';
const fs = require('fs');
const G = 'src/024-src_server_index.js';

const FROM = 'width: 640, height: 640, portrait: false, noHires: true, noDetail: true, prefix: "wayward/part-preview"';
const TO = 'width: (pipe.portrait && pipe.portrait.width) || 832, height: (pipe.portrait && pipe.portrait.height) || 1216, portrait: true, noHires: true, noDetail: true, prefix: "wayward/part-preview"';

const src = fs.readFileSync(G, 'utf8');
const n = src.split(FROM).length - 1;
if (n !== 1) {
  console.log('FAIL размер превью: совпадений ' + n + ', нужно 1');
  const i = src.indexOf(FROM);
  if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + FROM.length + 300) + '\n---');
  process.exit(1);
}
fs.writeFileSync(G, src.replace(FROM, () => TO));
console.log('ok размер как у основного');