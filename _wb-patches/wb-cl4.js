// wb-cl4.js — снять диагностику строк «Внешность»; доки: закрыть пункт, счётчики, ловушка keys/tags
const fs = require('fs');
const P = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let bad = 0;

let s = fs.readFileSync(P, 'utf8');
const orig = s;
function sub(anchor, repl, name) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) { bad++; console.log('MISS ' + name + ': найдено=' + n); return; }
  s = s.replace(anchor, () => repl);
  console.log('ok ' + name);
}

sub(
  '      if (!final.length && !hasNotes) { console.log("[wb] Внешность: строки нет (нет тегов и заметок)"); return null; }',
  '      if (!final.length && !hasNotes) return null;',
  'снять лог пустой строки');

sub(
  '      console.log("[wb] Внешность: тегов=" + final.length + ", правок=" + changes.length + ", заметок=" + (hasNotes ? 1 : 0));\n',
  '',
  'снять лог сборки');

sub(
  'rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, r0); console.log("[wb] негатив внешности: частей=" + ((r0.changes || []).length)); }',
  'rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, r0); }',
  'снять лог негатива');

let v = fs.readFileSync(V, 'utf8');
const mOld = '  ["Внешность: диагностика", "[wb] Внешность", 2],';
if (v.split(mOld).length - 1 !== 1) { bad++; console.log('MISS wb-verify: маркер'); }
else { v = v.replace(mOld, () => '  ["Внешность: ошибки в консоль", "[wb] Внешность: упал разбор", 1],'); console.log('ok wb-verify: маркер'); }

// ---- доки ----
function lineEdit(file, pairs) {
  const o = fs.readFileSync(file, 'utf8');
  const eol = o.includes('\r\n') ? '\r\n' : '\n';
  const L = o.split(/\r?\n/);
  let miss = 0;
  for (const [a, b] of pairs) {
    const hits = [];
    L.forEach((l, i) => { if (l.trim() === a) hits.push(i); });
    if (hits.length !== 1) { miss++; bad++; console.log('MISS ' + file + ' :: ' + a.slice(0, 55) + ' (' + hits.length + ')'); continue; }
    L[hits[0]] = L[hits[0]].match(/^\s*/)[0] + b;
    console.log('ok ' + file + ' :: ' + b.slice(0, 55));
  }
  if (!miss) fs.writeFileSync(file, L.join(eol), 'utf8');
}

lineEdit('CONTEXT.md', [
  ['- wayward-bridge.js (1 863 288 символов, 29 файлов) — артефакт, грузится игрой',
   '- wayward-bridge.js (~1.87M символов, 29 файлов) — артефакт, грузится игрой'],
  ['- wb-verify.js (194 проверки), wb-test.js (91 тест, порт 8799, данные wb-test-data)',
   '- wb-verify.js (208 проверок), wb-test.js (91 тест, порт 8799, данные wb-test-data)'],
  ['- baseline: коммит 2bf0611; текущее verify 194/194, tests 91/91',
   '- baseline: коммит 2bf0611; текущее verify 208/208, tests 91/91'],
  ['4. node wb-verify.js — 194/194', '4. node wb-verify.js — 208/208'],
  ['«Внешность» в инспекторе: код в src/008 на месте, ждёт подтверждения в игре.',
   '«Внешность» в инспекторе: строка в позитиве (вторая) и «Negative · Внешность» в негативе, источники по частям, дублей в Base нет. Открыто: Edit на строке показывает [object Object] — путь ведёт на объект sections.'],
  ['verify 194/194, тесты 91/91, бандл 1 863 288 символов.',
   'verify 208/208, тесты 91/91.'],
  ['- hooks: parts / store / customWives / partsBroken',
   '- hooks: parts / store / customWives / partsBroken\n- синтетическая строка разбора обязана иметь keys (Set) и tags ([]): без них падает раскладка тегов (наступали дважды)'],
]);

lineEdit('docs/STATE.md', [
  ['- После патча: node build.js → vm.Script-чек → node wb-verify.js (194/194) → node wb-test.js (91/91) → коммит.',
   '- После патча: node build.js → vm.Script-чек → node wb-verify.js (208/208) → node wb-test.js (91/91) → коммит.'],
]);

const st = fs.readFileSync('docs/STATE.md', 'utf8');
const stEol = st.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync('docs/STATE.md', st.replace(/\s*$/, '') + stEol + stEol + [
  '## Точка возврата (2026-10-28)',
  'Закрыто: строки «Внешность» в разборе — позитивная (вторая) и «Negative · Внешность» в негативе,',
  'источники по частям, дублей в Base нет, пустая «Character negative» убирается.',
  'Открыто: Edit на строке «Внешность» показывает [object Object] — путь ведёт на объект sections,',
  'редактор печатает значение как строку. Проба готова: wb-probe-insp.js -> _analysis/insp-probe.txt.',
  'Дальше: починить Edit, затем H3.',
  'Проверки: verify 208/208, tests 91/91.',
  ''
].join(stEol), 'utf8');
console.log('ok docs/STATE.md: точка возврата');

if (bad) { console.log('ЕСТЬ MISS — код записан, доки частично'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');

const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('[wb] Внешность', 1);
chk('негатив внешности: упал разбор', 1);
chk('console.log("[wb] Внешность: тегов=', 0);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);