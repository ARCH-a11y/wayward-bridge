# CONTEXT.md — Wayward Bridge

## Что это
Локальный Node.js мод-сервер. Патчит локальный index.html игры Wayward в памяти,
перехватывает промпт-части игры, гонит генерацию в ComfyUI через UI настроек.
Игра локальная, single-player, не обновляется автоматически.

## Инварианты — не ломать
- index.html: 3 127 879 символов, sha256 c6f38cd4b6..., оригинал не трогаем
- wayward-bridge.js — рабочий файл, 42 патча; wayward-bridge.orig.js — чистый откат
- tools в _wb-patches, там же отчёты патчей
- settings paths: ТОЛЬКО layer, heroine, saves, app, picks
- патч-скрипт обязан требовать РОВНО 1 совпадение regex; при MISS — отчёт с ±300 символов
- после каждого патча: wb-verify.js + wb-test.js

## Карта
- wayward-bridge.js (1 786 775 символов, 25 модулей) — артефакт, грузится игрой
- src/server/assets.generated.js (1 462 600) — 82% бандла; TAGS_GZ_B64 1 114 218 (62%)
- TAGS_GZ_B64 → 1 426 888 символов / 81 218 тегов
- src/ORDER.txt + build.js — конкат-сборка, побайтово идентична
- wb-verify.js (36 проверок), wb-test.js (19 тестов, порт 8799, данные wb-test-data)
- цепочка пересборки: wb-apply-all.js → wb-apply-all-fix.js → wb-patchS.js

## Ловушки (уже наступали)
- setAt существует ДВАЖДЫ: store.js и items.js — править оба
- флаг баннера — customWives, НЕ builder
- сломанный якорь addCustomWives: },k.id)}),!1,!1]
- CSS меню живёт в shadow root → баннер на body только inline styles
- sparse storage: значение = дефолту → пути нет в settings.json
- __proto__ как id героини — объект {base:'...'}, не строка
- hooks: parts / store / customWives / partsBroken

## Задачи
- [ ] git init + baseline-42 (в работе)
- [ ] починка таксономии тегов (91.4% в other)
- [ ] wb-split.js → src/, побайтовая проверка
- [ ] Aider + Venice GLM 5.3 Flash
- [ ] список багов от юзера
- [ ] волна 1: лок внешности, автоизбранное, индикатор стоимости
- [ ] волна 2: карточки патронов/архетипы через joinedPatronIds, гардероб со слотами
- [ ] волна 3: хроника, слухи/репутация, сюжетные арки
- [ ] волна 4: локальная ЛЛМ → часть Narration

## Отклонено
origin/token (B30), хардненинг хрупких regex (B33–B38), профили качества,
хоткеи, массовое редактирование промптов, ночная очередь.


## Репа
- root: C:\Users\arch4\Downloads\Wayward
- origin: https://github.com/ARCH-a11y/wayward-bridge (ветка main)
- baseline: коммит 2bf0611, verify 36/36, tests 19/19

## Цикл правки
1. правим ТОЛЬКО в src/, бандл не трогаем руками
2. node build.js — пересборка
3. node -c wayward-bridge.js — синтаксис
4. node wb-verify.js — 36/36
5. node wb-test.js — 19/19
6. тест в игре

Все имена в src/ORDER.txt обязаны существовать (build.js падает с MISSING FILE).
Блоб TAGS_GZ_B64/ALIASES_GZ_B64 живёт в src/000-tags-blob.js и в контекст агента не грузится.

