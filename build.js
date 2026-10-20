// build.js — склейка src/*.js в wayward-bridge.js (порядок из src/ORDER.txt)
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const order = fs.readFileSync(path.join(dir, 'ORDER.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
let out = '';
for (const f of order) out += fs.readFileSync(path.join(dir, f), 'utf8');
fs.writeFileSync(path.join(__dirname, 'wayward-bridge.js'), out, 'utf8');
console.log('собрано ' + out.length + ' символов из ' + order.length + ' файлов');
