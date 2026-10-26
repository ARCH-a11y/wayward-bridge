// wb-cl1.js — снять диагностику [wb] gen и [wb] cached patron из src/024-src_server_index.js
const fs = require('fs');
const P = 'src/024-src_server_index.js';
const before = fs.readFileSync(P, 'utf8');
let s = before;
let bad = 0;

function one(name, re, flags, repl) {
  const hits = (s.match(new RegExp(re, flags)) || []).length;
  if (hits !== 1) {
    bad++;
    const i = s.search(new RegExp(re, flags.replace('g', '')));
    console.log('MISS ' + name + ' hits=' + hits);
    console.log(i < 0 ? '  (совпадений нет)' : '  ' + JSON.stringify(s.slice(Math.max(0, i - 300), i + 300)));
    return;
  }
  s = s.replace(new RegExp(re, flags), repl);
  console.log('OK ' + name);
}

one('лог gen',
    '^[ \\t]*console\\.log\\("\\[wb\\] gen".*?\\);[ \\t]*\\r?\\n', 'gm', '');
one('лог cached patron',
    'console\\.log\\("\\[wb\\] cached patron",[^;]*\\);[ \\t]*', 'g', '');

if (bad) { console.log('ЕСТЬ MISS — файл НЕ записан'); process.exit(1); }
if (s.includes('[wb] gen')) { console.log('!! [wb] gen остался'); process.exit(1); }
if (s.includes('cached patron')) { console.log('!! cached patron остался'); process.exit(1); }

fs.writeFileSync(P, s, 'utf8');

const after = fs.readFileSync(P, 'utf8');
console.log('---');
console.log('длина: ' + before.length + ' -> ' + after.length + '  строк: ' +
  before.split('\n').length + ' -> ' + after.split('\n').length);
const j = after.indexOf('if (pe && pe.file)');
console.log('патрон-ветка: ' + JSON.stringify(after.slice(j, j + 210)));
const k = after.indexOf('library.latest(key)');
console.log('library.latest: ' + JSON.stringify(after.slice(Math.max(0, k - 150), k + 60)));