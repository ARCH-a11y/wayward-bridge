// wb-probe-state3.js — время, записи о гостях, механика сокрытия
const fs = require('fs'), path = require('path');
const s = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const seen = new Set();
function ctx(word, n, before, after) {
  const re = new RegExp(word, 'g'); let m, k = 0;
  while ((m = re.exec(s)) && k < n) {
    const frag = s.slice(Math.max(0, m.index - before), m.index + after);
    if (!seen.has(frag)) { seen.add(frag); console.log('[' + word + '] ' + JSON.stringify(frag)); k++; }
  }
}
console.log('=== время: slot и его рост');
ctx('slot:', 8, 70, 110);
ctx('slot +=', 5, 70, 110);
ctx('slot+=', 5, 70, 110);
ctx('Ff', 5, 60, 120);
console.log('\n=== dailyState и переход дня');
ctx('dailyState', 6, 120, 180);
ctx('day:', 8, 60, 110);
console.log('\n=== записи о гостях');
ctx('patronRecords', 6, 80, 200);
console.log('\n=== сокрытие и свидетель');
ctx('playerWitnessed', 6, 120, 140);
ctx('wz=', 3, 0, 700);
console.log('\n=== прочее');
ctx('milk', 3, 80, 120);
ctx('iZ', 4, 60, 90);
ctx('conceal', 5, 90, 130);
