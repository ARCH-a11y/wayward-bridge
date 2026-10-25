// wb-probe-state2.js — доверие, эмоции, цикл, счётчик дня
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
console.log('=== bodyNote (все состояния)');
ctx('bodyNote', 14, 130, 170);
console.log('\n=== цикл');
ctx('ovulat', 6, 110, 130);
ctx('menstru', 6, 110, 130);
ctx('cycle', 8, 110, 130);
console.log('\n=== relationship / доверие / эмоции');
ctx('relationship', 6, 60, 260);
ctx('trust', 8, 90, 130);
console.log('\n=== архетипы и латентные черты');
ctx('latentTraits', 4, 80, 200);
ctx('honesty', 5, 80, 140);
console.log('\n=== счётчики дня и времени');
for (const w of ['dayCount','dayIndex','daysPassed','advanceDay','nextDay','dayNumber','weekday','timeOfDay','hourOfDay','"day"','"day:','day:']) {
  const n = (s.match(new RegExp(w.replace(/"/g, ''), 'g')) || []).length;
  console.log('  ' + w + ' = ' + n);
}
console.log('\n=== поля сейва, которые уже использует мод');
for (const w of ['wbPlaythrough','traitsAtGeneration','growthRates','primaryCharacterId','joinedPatronIds','namedPatronNames','archetypeId']) {
  const n = (s.match(new RegExp(w, 'g')) || []).length;
  console.log('  ' + w + ' = ' + n);
}
