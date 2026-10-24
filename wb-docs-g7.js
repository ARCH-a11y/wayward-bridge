// wb-docs-g7.js — дописать в HANDOFF/CONTEXT знания сессии G5–G7
const fs = require("fs");

const MARK = "## G5–G7: дети, родня, сейв (сессия 2026-10)";

const TEXT = [
MARK,
"",
"### Что сделано",
"- Портреты детей: `looks.portraitPrompt()`, роут `/bridge/api/childstate/image` (ключ `child_<id>`), кнопка и картинка в карточке. Флаг `noBelly` в `planRender`, чтобы живот матери не лез в портрет.",
"- Ребёнок как родня: при рождении — имя (`pickName`), ребро `{kind:\"parent_of\", from:\"char:<herId>\", to:\"person:<id>\"}` в `circles[herId]`.",
"- `lives`: `home`, пока живёт дома; при `youth` — переезд в `same_town|day_ride|far` (обратимо: возраст назад → домой).",
"- Быт: в фазе `service` ребёнок в таверне, иначе в детской (`syncChildHome`, подпись `homeSig`).",
"- `childstate` едет вместе с сейвом игры: зеркало `state.wbChild` (`mirrorChild`) + восстановление (`loadChildFromSave`, сейв главнее файла мода).",
"- Инвалидация кэша картинок при смене фигуры: `bellySig`/`checkBelly` + `window.__WB_PACK_RESET__`.",
"- Кнопки для тестов: `✕` (удалить ребёнка, чистит и родню) и `Убрать срок`.",
"",
"### Устройство игры (проверено)",
"- Родня: `circles[herId] = { of, home, persons:[], links:[] }`. Человек: `{id, name, sex, alive, lives, regard, presence, warmth, strictness, past, generation, belief, attributes}`. Узлы рёбер: `person:<id>` (`ln`), `char:<herId>` (`s5`).",
"- `Tie.relation(a,b)`: `parents(t) = into(\"parent_of\", t)`; если `parents(person)` содержит `char:herId` → `\"child\"`. Ярлык — `Iie.child=[\"daughter\",\"son\"]`, рендер — `Gd`.",
"- Визиты: `ZCe` (только фаза `service`) ставит человека в `taproom` через `Pt` и пишет в `visitingPeople`; `X7` держит `person:` в `occupants` **только** при наличии записи в `visitingPeople`; `QCe` убирает по `leaveAtSlot`.",
"- Веса визита — `UCe`/`GCe` (ключ по `lives`), `home` добавлен патчем. `Fle` влияет только на генерацию `presence`.",
"- Вылазка к родне: `Gr(e,\"kin\")` → `W2` берёт **одного** самого «весомого» (`$M = presence·(0.35+0.65·regard)`) среди `alive && Uve(lives)`, `Uve={same_town,day_ride}`.",
"- `Bne` (панель комнаты) собирает только `player`, `characters[id]`, `customers` — людей из `circles.persons` отбрасывает. Карта комнат и `dje` их показывают.",
"- `hEe` (класс родства для событий) не знает `child` → падает в `other`.",
"",
"### Кэш картинок",
"- Промпт живот учитывает (`planRender` → `childstatePrompt`), **ключ картинки — нет**.",
"- Пак игры мемоизируется (`I_`), сброс — `qD()`; выставлено как `window.__WB_PACK_RESET__`.",
"- `LPe` без `bypassCache` сначала спрашивает `Hp(key)`; `isStale` в `/api/pack` спасает только на перезагрузке страницы.",
"",
"### Диагностика (в браузере)",
"`window.__WB_MENU_REV__` (версия меню), `__WB_MIRROR_OK__`/`__WB_MIRROR_ERR__` (зеркало), `__WB_DBG__` (ручные вызовы), `__WB_PACK_RESET__`.",
"",
"### Грабли",
"- **verify не ловит синтаксис.** Обязательный шаг: `node -e \"new (require('vm').Script)(require('fs').readFileSync('wayward-bridge.js','utf8'))\"`.",
"- Вставка в `CHECKS` в начало массива требует запятой у последнего элемента, иначе он склеивается со следующим (был баг «НЕТ Н»: у строки брались её буквы).",
"- В патч-скриптах анкоры копировать из вывода probe, не по памяти; скрипт падает целиком на конкретном анкоре, и `build` после падения собирает **старое**.",
"- `pt` в клиентских хендлерах не в области видимости — передавать параметром.",
"- Порядок в `checkDay`: `loadChildFromSave` → `mirrorChild` → `syncChildHome` → `checkBelly`.",
"- Кириллица: сохранять скрипты через `[IO.File]::WriteAllText(..., UTF8Encoding($false))`.",
"",
"### Открытые задачи",
"1. `state.characters` для ребёнка — виден в панели комнаты, участник сцен, портрет в сцене.",
"2. Класс родства `child` + 2–3 дочерних события (`relationClass:[\"child\"]`).",
"3. Выбор, к кому ехать: хук на `W2` + селект в меню.",
"4. Развитие `latentTraits` во времени; внешность отца из карточек завсегдатаев; `Случайно` → `↻` у ГГ.",
"",
"### Счётчики на конец сессии",
"`wb-verify.js` — 156 проверок, `wb-test.js` — 86 тестов, оба зелёные.",
""
].join("\n");

function preview(f) {
  if (!fs.existsSync(f)) return console.log("(" + f + " нет)");
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("--- " + f + " (" + L.length + " строк) ---");
  console.log("начало: " + L.slice(0, 6).join(" | ").slice(0, 300));
  console.log("конец : " + L.slice(-6).join(" | ").slice(0, 300));
}
preview("HANDOFF.md");
preview("CONTEXT.md");

for (const f of ["HANDOFF.md", "CONTEXT.md"]) {
  let cur = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
  if (cur.indexOf(MARK) >= 0) {
    const i = cur.indexOf(MARK);
    const head = cur.slice(0, i);
    fs.writeFileSync(f, head + TEXT, "utf8");
    console.log("= обновлён раздел в " + f);
  } else {
    if (cur && !/\n$/.test(cur)) cur += "\n";
    fs.writeFileSync(f, cur + "\n" + TEXT, "utf8");
    console.log("+ добавлен раздел в " + f);
  }
}
console.log("\nГОТОВО.");