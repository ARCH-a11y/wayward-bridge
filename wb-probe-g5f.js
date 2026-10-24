// wb-probe-g5f.js — часть 6: шапка childstate + клиентская карточка ребёнка
const fs = require('fs');
function lines(file, a, b) {
  const L = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  console.log('\n===== ' + file + ':' + a + '-' + b + ' =====');
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ': ' + L[i].slice(0, 190));
}
function window_(file, tok, before, after, max) {
  const s = fs.readFileSync(file, 'utf8');
  let at = -1, n = 0;
  console.log('\n===== ' + file + ' :: окно вокруг "' + tok + '" =====');
  while ((at = s.indexOf(tok, at + 1)) >= 0 && n < (max || 2)) {
    const a = Math.max(0, at - (before || 400)), b = Math.min(s.length, at + tok.length + (after || 800));
    console.log('\n--- @' + at + ' ---\n' + s.slice(a, b));
    n++;
  }
  console.log('  ^ ' + n + (n >= (max || 2) ? '+' : ''));
}

console.log('########## 1. ШАПКА CHILDSTATE (require looks) ##########');
lines('src/025-src_server_childstate.js', 1, 95);

console.log('\n########## 2. КЛИЕНТ: карточка ребёнка ##########');
window_('src/019-src_server_assets.generated.js', 'childstate/reroll', 900, 1200, 2);
window_('src/019-src_server_assets.generated.js', 'lookText', 500, 500, 3);