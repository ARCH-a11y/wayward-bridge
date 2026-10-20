// wb-addons-schema.js — структура аддонов и код импортёра/экспортёра
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, 'wayward-bridge-data', 'addons');
const SRC = path.join(__dirname, 'src');

for (const f of fs.readdirSync(D)) {
  const s = fs.readFileSync(path.join(D, f), 'utf8');
  console.log('\n========== ' + f + '  (' + s.length + ' байт)');
  try {
    const j = JSON.parse(s);
    console.log('верхний уровень:', Array.isArray(j) ? 'массив, элементов ' + j.length : Object.keys(j).join(', '));
    console.log(JSON.stringify(j, null, 1).slice(0, 1400));
  } catch (e) {
    console.log('не JSON:', e.message);
    console.log(s.slice(0, 600));
  }
}

console.log('\n\n########## код: importer / presets / catalog');
for (const f of fs.readdirSync(SRC)) {
  if (!/importer|presets|catalog/i.test(f)) continue;
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  console.log('\n----- ' + f + ' (' + s.length + ' символов)');
  s.split(/\r?\n/).forEach((l, i) => {
    if (/addon|preset|export|import|JSON\.parse|writeFile/i.test(l)) {
      console.log((i + 1) + ': ' + l.trim().slice(0, 170));
    }
  });
}
