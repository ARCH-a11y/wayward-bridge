// wb-doc1.js — актуализировать CONTEXT.md, переписать HANDOFF.md, завести docs/STATE.md
const fs = require('fs');
let bad = 0;

// ---------- CONTEXT.md: точечные правки ----------
const PC = 'CONTEXT.md';
const cOrig = fs.readFileSync(PC, 'utf8');
const cEol = cOrig.includes('\r\n') ? '\r\n' : '\n';
let cl = cOrig.split(/\r?\n/);

const pairs = [
  ['- wayward-bridge.js — рабочий файл, 42 патча; wayward-bridge.orig.js — чистый откат',
   '- wayward-bridge.js — собранный артефакт (src/ + build.js, 29 файлов); wayward-bridge.orig.js — чистый откат'],
  ['- wayward-bridge.js (1 786 775 символов, 25 модулей) — артефакт, грузится игрой',
   '- wayward-bridge.js (1 863 288 символов, 29 файлов) — артефакт, грузится игрой'],
  ['- src/server/assets.generated.js (1 462 600) — 82% бандла; TAGS_GZ_B64 1 114 218 (62%)',
   '- src/019-src_server_assets.generated.js — основная масса бандла; блоб TAGS_GZ_B64 в src/000-tags-blob.js'],
  ['- wb-verify.js (70 проверок), wb-test.js (43 теста, порт 8799, данные wb-test-data)',
   '- wb-verify.js (194 проверки), wb-test.js (91 тест, порт 8799, данные wb-test-data)'],
  ['- цепочка пересборки: wb-apply-all.js → wb-apply-all-fix.js → wb-patchS.js',
   '- пересборка: node build.js (src/ORDER.txt → wayward-bridge.js)'],
  ['- baseline: коммит 2bf0611; текущее verify 70/70, tests 43/43',
   '- baseline: коммит 2bf0611; текущее verify 194/194, tests 91/91'],
  ['3. node -c wayward-bridge.js — синтаксис',
   `3. node -e "new (require('vm').Script)(require('fs').readFileSync('wayward-bridge.js','utf8'))" — синтаксис`],
  ['4. node wb-verify.js — 36/36', '4. node wb-verify.js — 194/194'],
  ['5. node wb-test.js — 19/19', '5. node wb-test.js — 91/91'],
];

for (const p of pairs) {
  const hits = [];
  cl.forEach((l, i) => { if (l.trim() === p[0]) hits.push(i); });
  if (hits.length !== 1) { bad++; console.log('MISS CONTEXT найдено=' + hits.length + ' :: ' + p[0].slice(0, 70)); continue; }
  const ind = cl[hits[0]].match(/^\s*/)[0];
  cl[hits[0]] = ind + p[1];
  console.log('ok CONTEXT :: ' + p[1].slice(0, 70));
}

// ---------- CONTEXT.md: Задачи — отметить закрытое и поставить H3 ----------
const anchor = '- [ ] список багов от юзера';
const ai = cl.findIndex(l => l.trim() === anchor);
if (ai < 0) { bad++; console.log('MISS CONTEXT: якорь Задачи'); }
else {
  cl.splice(ai + 1, 0,
    '- [x] блок «беременность и дети» (Ф1–Ф5, G3–G7, H1–H2): ребёнок — персонаж с рождения, карточка, родня, портрет',
    '- [ ] H3: свои комнаты и занятия ребёнка, игры и разговоры; свои события в общем фиде (H5)');
  console.log('ok CONTEXT :: Задачи обновлены');
}

// ---------- CONTEXT.md: раздел «Сейчас» ----------
const nowOld = [
  'Блок «беременность и дети»: Ф1–Ф3 готовы (схема childstate, модуль src/025, тик дня, живот 8-й частью, секция «Состояние»), Ф4–Ф5 в работе.',
  'Идём вне очереди — пункты 1–6 плана (инспектор, превью частей, баг pipeline, гардероб, слой событий, стирка/печати/магия) ждут.',
  'Первый в очереди при возврате: строка «Внешность» в инспекторе (решение в HANDOFF).',
  'verify 70/70, тесты 43/43.',
];
const nowNew = [
  'Блок «беременность и дети» закрыт: Ф1–Ф5, G3–G7, H1–H2. Ребёнок с рождения — полноценный персонаж:',
  'своя запись, карточка, портрет, родня, комната; удаление чистит ребёнка, человека, ребро родства и занятость.',
  'Выбор карточки реактивен (state.wbCard + вид __wbV). Диагностика и мёртвый код вычищены.',
  'Дальше по плану: H3 — свои комнаты/занятия ребёнка, игры и разговоры (статы растут только на child/teen),',
  'свои события в общем фиде (H5), блок стандартных событий героини. Вне очереди ждут пункты 1–6 плана.',
  '«Внешность» в инспекторе: код в src/008 на месте, ждёт подтверждения в игре.',
  'verify 194/194, тесты 91/91, бандл 1 863 288 символов.',
];
const ni = cl.findIndex(l => l.trim() === '## Сейчас');
if (ni < 0) { bad++; console.log('MISS CONTEXT: нет раздела Сейчас'); }
else {
  const got = cl.slice(ni + 1, ni + 5).map(l => l.trim());
  const okAll = nowOld.every((s, k) => got[k] === s);
  if (!okAll) { bad++; console.log('MISS CONTEXT: раздел Сейчас не совпал'); got.forEach((g, k) => console.log('  ' + k + ': ' + g.slice(0, 80))); }
  else { cl.splice(ni + 1, 4, ...nowNew); console.log('ok CONTEXT :: раздел Сейчас переписан'); }
}

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(PC, cl.join(cEol), 'utf8');

// ---------- HANDOFF.md: переписать ----------
const handoff = [
'# HANDOFF.md — состояние и решения',
'',
'## Решение: строка «Внешность» в инспекторе промпта',
'Восстановлено из истории aider (.aider.chat.history.md) — в CONTEXT этого решения не было.',
'',
'Суть: в разборе промпта должна быть отдельная строка с тегами внешности.',
'- `expandHero` (src/008-src_server_prompt.js, ~стр. 80) собирает список тегов внешности;',
'- в `explain` (там же, ~стр. 313) добавляется строка:',
'  `explain.push({ label: "Внешность", note: notes.join("; ") })`.',
'',
'Где смотреть в игре: мод-меню → вкладка **Prompt inspector** (id `inspector`, цвет #c4b5fd) →',
'выбрать нарисованную за сессию картинку → в разборе должна быть строка «Внешность».',
'',
'Статус: код на месте, ждёт подтверждения в игре.',
'',
'## Состояние на конец сессии',
'Закрыто: блок «беременность и дети» — Ф1–Ф5, G3–G7, H1–H2. Ребёнок с рождения полноценный персонаж:',
'своя запись, карточка, портрет, родня, своя комната; удаление чистит ребёнка, человека, ребро родства,',
'занятость комнаты и запись персонажа. Выбор карточки реактивен (state.wbCard, вид __wbV).',
'Чистка: сняты логи `[wb] gen` / `[wb] cached patron`; снесены 3 мёртвые .replace() в src/016 и мёртвые',
'lastChars / lastWifeBad / lastWifeId; маркеры H1f и H1h перевешены на живые якоря',
'(wifeBak = JSON.stringify(w), healWife();). Одноразовые скрипты живут в _wb-patches.',
'Следующий шаг: H3 — свои комнаты и занятия ребёнка, игры и разговоры (статы растут только на child/teen),',
'свои события в общем фиде (H5), блок стандартных событий героини.',
'',
'verify 194/194, tests 91/91, бандл 1 863 288 символов.',
'',
'## Грабли этой сессии',
'- `Get-Content` без BOM читает UTF-8 как CP1251, поэтому `-match по кириллице` даёт ложный ноль.',
'  Для поиска: `[IO.File]::ReadAllLines($p, [Text.Encoding]::UTF8)`.',
'- Скрипты с кириллицей сохранять через `[IO.File]::WriteAllText(..., UTF8Encoding($false))`.',
'- verify матчит подстроки и не ловит синтаксис — обязателен vm.Script-чек на wayward-bridge.js.',
'- В цепочке .replace() в src/016 якоря применяются последовательно: сработавшая замена убивает якорь',
'  следующей. Мёртвые якоря искать симуляцией цепочки на index.html, а не глазами.',
''
].join('\n');
fs.writeFileSync('HANDOFF.md', handoff, 'utf8');

// ---------- docs/STATE.md ----------
if (!fs.existsSync('docs')) fs.mkdirSync('docs');
const state = [
'# STATE.md — сид для новой сессии',
'Подробности — в CONTEXT.md и HANDOFF.md; здесь только вход.',
'',
'## Где мы',
'Wayward Bridge — локальный Node-мод к игре Wayward. Репа: C:\\\\Users\\\\arch4\\\\Downloads\\\\Wayward,',
'origin https://github.com/ARCH-a11y/wayward-bridge, ветка main.',
'Правим ТОЛЬКО в src/, бандл собирает node build.js.',
'',
'## Что закрыто',
'Блок «беременность и дети»: ребёнок — полноценный персонаж с рождения (запись, карточка, портрет,',
'родня, комната), выбор карточки реактивен, удаление чистит всё. Логи и мёртвый код вычищены.',
'',
'## Что дальше',
'H3: свои комнаты и занятия ребёнка; игры и разговоры (статы растут только на child/teen);',
'свои события в общем фиде (H5); блок стандартных событий героини.',
'Затем пункты 1–6 плана из CONTEXT.',
'',
'## Инварианты',
'- index.html не трогаем; игровой код патчим цепочкой .replace() в src/016, якоря берём из index.html.',
'- Патч-скрипт: ровно 1 совпадение, при MISS — отчёт с ±300 символов и файл НЕ пишется.',
'- После патча: node build.js → vm.Script-чек → node wb-verify.js (194/194) → node wb-test.js (91/91) → коммит.',
'- Одноразовые скрипты — в _wb-patches. Кириллица — UTF-8 без BOM.',
''
].join('\n');
fs.writeFileSync('docs/STATE.md', state, 'utf8');

// ---------- самопроверка ----------
const a = fs.readFileSync(PC, 'utf8');
let err = 0;
const chk = (sub, want) => { const n = a.split(sub).length - 1; if (n !== want) { err++; console.log('!! ' + sub + ': ' + n + ' != ' + want); } else console.log('ok ' + sub + ': ' + n); };
chk('70/70', 0); chk('43/43', 0); chk('36/36', 0); chk('19/19', 0);
chk('194/194', 3); chk('91/91', 2);
console.log('--- файлы ---');
for (const f of [PC, 'HANDOFF.md', 'docs/STATE.md']) console.log(f + ': ' + fs.readFileSync(f, 'utf8').length + ' байт');
console.log('--- контроль src/008 ---');
const p8 = fs.readFileSync('src/008-src_server_prompt.js', 'utf8');
console.log('Внешность: ' + (p8.split('Внешность').length - 1) + '   expandHero: ' + (p8.split('expandHero').length - 1));
if (err) process.exit(1);