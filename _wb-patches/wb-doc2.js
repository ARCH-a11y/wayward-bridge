// wb-doc2.js — освежить числа в CONTEXT, уточнить маркер, отметить «Внешность» сделанной
const fs = require('fs');
let bad = 0;
const rep = (file, pairs) => {
  const o = fs.readFileSync(file, 'utf8');
  let s = o;
  for (const [a, b, expect] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== (expect == null ? 1 : expect)) { bad++; console.log('MISS ' + file + ' :: ' + a + ' (' + n + ')'); continue; }
    s = s.split(a).join(b);
  }
  if (bad) return;
  fs.writeFileSync(file, s, 'utf8');
  console.log('ok ' + file + ': ' + o.length + ' -> ' + s.length);
};
rep('wb-verify.js', [['["Внешность: строка в разборе", "buildAppearanceRow", 2]', '["Внешность: строка в разборе", "function buildAppearanceRow(", 1]']]);
rep('CONTEXT.md', [
  ['194/194', '197/197', 3],
  ['1 863 288', '1 865 244', 2],
  ['«Внешность» в инспекторе: код в src/008 на месте, ждёт подтверждения в игре.', '«Внешность» в инспекторе — сделана: отдельная строка в разборе, второй после Quality (src/008, buildAppearanceRow).'],
]);
if (bad) { console.log('ЕСТЬ MISS'); process.exit(1); }
console.log('готово');