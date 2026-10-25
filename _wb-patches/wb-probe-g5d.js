// wb-probe-g5d.js — часть 4: роуты, очередь рендера, доступ к сейву игры
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

function g(file, re, max) {
  if (!fs.existsSync(file)) return console.log('(нет ' + file + ')');
  const L = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let n = 0;
  console.log('\n===== ' + file + ' :: /' + re + '/ =====');
  for (let i = 0; i < L.length && n < (max || 40); i++) {
    if (new RegExp(re).test(L[i])) { console.log(String(i + 1).padStart(5) + ': ' + L[i].trim().slice(0, 190)); n++; }
  }
  console.log('  ^ ' + n + (n >= (max || 40) ? '+' : ''));
}
function around(tok, ctx, max) {
  ctx = ctx || 150; max = max || 5;
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m, n = 0; const seen = new Set();
  console.log('\n--- index.html :: ' + tok + ' ---');
  while ((m = re.exec(src)) && n < max) {
    const a = Math.max(0, m.index - ctx), b = Math.min(src.length, m.index + tok.length + ctx);
    const snip = src.slice(a, b).replace(/\s+/g, ' ');
    const k = snip.slice(0, 45);
    if (seen.has(k)) continue;
    seen.add(k);
    console.log('@' + m.index + ' ...' + snip + '...');
    n++;
  }
  console.log('  ^ ' + n + (n >= max ? '+' : ''));
}
function lines(file, a, b) {
  const L = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  console.log('\n===== ' + file + ':' + a + '-' + b + ' =====');
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ': ' + L[i].slice(0, 190));
}

console.log('########## 1. РОУТЫ МОСТА ##########');
g('src/024-src_server_index.js', '"/bridge/api/', 90);
g('src/024-src_server_index.js', '"/api/image/generate|"/api/pack|"/images/', 20);
g('src/024-src_server_index.js', 'jobs\\.|new Job|enqueue|library\\.add|await render\\(|schedule', 30);

console.log('\n########## 2. library.add ##########');
lines('src/013-src_server_library.js', 1, 60);

console.log('\n########## 3. ГДЕ childstate ЛЕЖИТ В РОУТАХ ##########');
g('src/024-src_server_index.js', 'childstate', 40);

console.log('\n########## 4. ДОСТУП К СЕЙВУ ИГРЫ ##########');
around('localStorage.setItem', 120, 6);
around('indexedDB', 110, 4);
around('__WAYWARD_IMAGE_PACKS__', 200, 3);
around('persist', 100, 6);
around('saveGame', 120, 4);
around('characters[', 120, 4);