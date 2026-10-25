// wb-find-addon-apply.js — где аддон применяется и валидируется
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src');
const RE = /wayward-addon|addon/i;

for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith('.js')) continue;
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  let hits = 0;
  s.split(/\r?\n/).forEach((l, i) => {
    if (RE.test(l)) { console.log(f + ':' + (i + 1) + '  ' + l.trim().slice(0, 170)); hits++; }
  });
  if (hits) console.log('   ^^^ всего строк: ' + hits + ' в ' + f + '\n');
}
