// wb-probe-g5e.js — часть 5: тела джобов, роутов рендера и расширяемых модулей
const fs = require('fs');
function lines(file, a, b) {
  if (!fs.existsSync(file)) return console.log('(нет ' + file + ')');
  const L = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  console.log('\n===== ' + file + ':' + a + '-' + b + ' =====');
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ': ' + L[i].slice(0, 200));
}
console.log('########## 1. ДЖОБЫ ##########');
lines('src/014-src_server_jobs.js', 1, 135);

console.log('\n########## 2. РОУТЫ РЕНДЕРА (образцы) ##########');
lines('src/024-src_server_index.js', 1110, 1210);

console.log('\n########## 3. ВХОД ИГРЫ /api/image/generate ##########');
lines('src/024-src_server_index.js', 1420, 1500);

console.log('\n########## 4. planRender / render ##########');
lines('src/024-src_server_index.js', 217, 340);

console.log('\n########## 5. РАСШИРЯЕМЫЕ МОДУЛИ ##########');
lines('src/026-src_server_looks.js', 1, 130);
lines('src/025-src_server_childstate.js', 95, 191);