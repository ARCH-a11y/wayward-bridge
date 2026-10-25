// wb-extract-tags.js ? ????? TAGS_GZ_B64 ? ALIASES_GZ_B64 ?? assets.generated
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src');
const ORDER = path.join(SRC, 'ORDER.txt');

const TARGET = fs.readdirSync(SRC).find(f => f.includes('assets.generated'));
if (!TARGET) { console.error('MISS: ??? assets.generated'); process.exit(1); }
const tpath = path.join(SRC, TARGET);
const orig = fs.readFileSync(tpath, 'utf8');
let src = orig;

const NAMES = ['TAGS_GZ_B64', 'ALIASES_GZ_B64'];
const blobs = {};

for (const nm of NAMES) {
  const re = new RegExp('(' + nm + ':\\s*)(["\'])([A-Za-z0-9+/=\\r\\n]{1000,}?)\\2');
  const m = src.match(re);
  if (!m) { console.error('MISS:', nm); process.exit(1); }
  if (m[3].length < 50000) { console.error('??????????: ' + nm + ' ????? ' + m[3].length); process.exit(1); }
  blobs[nm] = m[3];
  console.log(nm + ':', m[3].length, '????????');
  src = src.replace(re, '$1globalThis.__WB_' + nm);
}

fs.writeFileSync(tpath + '.bak', orig);
fs.writeFileSync(tpath, src);

let out = '';
for (const nm of NAMES) out += 'globalThis.__WB_' + nm + ' = "' + blobs[nm] + '";\n';
fs.writeFileSync(path.join(SRC, '000-tags-blob.js'), out);

let order = fs.readFileSync(ORDER, 'utf8').split(/\r?\n/).filter(Boolean);
if (!order.includes('000-tags-blob')) order.unshift('000-tags-blob');
fs.writeFileSync(ORDER, order.join('\n') + '\n');

console.log('OK:', TARGET, orig.length, '->', src.length, '????????');
console.log('ORDER.txt[0] =', order[0], '| ?????? ? ??????:', order.length);
console.log('????????? ???? ?????????? ?:', JSON.stringify(fs.readFileSync(path.join(SRC, order[1]), 'utf8').slice(0, 100)));
