// wb-probe-g5c.js — часть 3: API родства, форма circles, доступ к стору игры
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

function body(name, len) {
  len = len || 600;
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) { console.log('\n### ' + name + ': НЕ НАЙДЕНО'); return; }
  console.log('\n### ' + name + ' @' + i + '\n' + src.slice(i, i + len).replace(/\s+/g, ' '));
}
function around(tok, ctx, max) {
  ctx = ctx || 160; max = max || 5;
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m, n = 0; const seen = new Set();
  console.log('\n--- ' + tok + ' ---');
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
function grepFile(file, tok, ctx, max) {
  if (!fs.existsSync(file)) return console.log('\n(нет ' + file + ')');
  const s = fs.readFileSync(file, 'utf8');
  ctx = ctx || 130; max = max || 5;
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m, n = 0;
  console.log('\n--- ' + file + ' :: ' + tok + ' ---');
  while ((m = re.exec(s)) && n < max) {
    const a = Math.max(0, m.index - ctx), b = Math.min(s.length, m.index + tok.length + ctx);
    console.log('...' + s.slice(a, b).replace(/\s+/g, ' ') + '...');
    n++;
  }
  console.log('  ^ ' + n + (n >= max ? '+' : ''));
}

console.log('########## 1. API РОДСТВА ##########');
['Nn', 'Sr', 'r5', 'Gd', 'i5', 'hf', 'iae', 'mf', 'a1', 'y5', 'cp'].forEach(n => body(n, 500));
around('cp=', 130, 3);

console.log('\n########## 2. ФОРМА circles / regard ##########');
around('circles', 170, 8);
around('regard', 130, 5);
around('relation:', 150, 6);

console.log('\n########## 3. МОДУЛЬ her-people ##########');
around('her-people', 300, 3);
around('familyVisitEvents', 220, 3);
around('householdStrictness', 260, 2);

console.log('\n########## 4. ДОСТУП К СТОРУ ИГРЫ ##########');
around('__WB', 140, 6);
around('window.__', 110, 6);
body('Eh', 400);
body('Cs', 300);

console.log('\n########## 5. СТАТИКА /images/ (мост) ##########');
grepFile('src/024-src_server_index.js', '"/images/"', 160, 5);
grepFile('src/024-src_server_index.js', 'api/pack', 200, 4);