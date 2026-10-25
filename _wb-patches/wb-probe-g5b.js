// wb-probe-g5b.js — часть 2: реестр картинок игры + модель persons/родства
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

function body(name, len) {
  len = len || 1300;
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) { console.log('\n### ' + name + ': НЕ НАЙДЕНО'); return; }
  console.log('\n### ' + name + ' @' + i + '\n' + src.slice(i, i + len).replace(/\s+/g, ' '));
}
function around(tok, ctx, max) {
  ctx = ctx || 170; max = max || 5;
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
function lines(file, a, b) {
  if (!fs.existsSync(file)) return console.log('\n(нет ' + file + ')');
  const L = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  console.log('\n===== ' + file + ':' + a + '-' + b + ' =====');
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ': ' + L[i].slice(0, 200));
}

console.log('########## 1. РЕЕСТР КАРТИНОК ИГРЫ ##########');
body('QOe', 1500);
body('Wb', 900);
around('imageType', 150, 6);
around('imagePath', 150, 6);
around('talentName', 130, 5);
around('/api/image/generate', 260, 3);

console.log('\n########## 2. МОДЕЛЬ ЛЮДЕЙ / РОДСТВА ##########');
around('persons', 150, 6);
around('household', 150, 5);
around('addPerson', 150, 4);
around('partnerType', 120, 4);
body('a5', 500);
body('cp', 400);

console.log('\n########## 3. ФАЙЛЫ МОДА ##########');
lines('src/013-src_server_library.js', 100, 140);
lines('src/016-src_server_game.js', 175, 215);
lines('src/019-src_server_assets.generated.js', 20, 60);