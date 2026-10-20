// build.js — склейка src/*.js в wayward-bridge.js (порядок из src/ORDER.txt)
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const order = fs.readFileSync(path.join(dir, 'ORDER.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
let out = '';
for (let f of order) { const fp = path.join(dir, f); const real = fs.existsSync(fp) ? fp : fp + '.js'; if (!fs.existsSync(real)) { console.error('MISSING FILE in ORDER.txt: ' + f); process.exit(1); } out += fs.readFileSync(real, 'utf8'); }
fs.writeFileSync(path.join(__dirname, 'wayward-bridge.js'), out, 'utf8');
console.log('собрано ' + out.length + ' символов из ' + order.length + ' файлов');
