# HANDOFF — состояние работ

Живой документ. Обновлять на каждой вехе. Новый чат/агент начинает отсюда.

## Что за проект
Wayward Bridge — локальный Node.js мод-сервер для игры Wayward. Патчит локальный
index.html в памяти, перехватывает промпт-части игры, гонит генерацию в ComfyUI.
Игра локальная, single-player, автообновления нет.

## Репа
- root: C:\Users\arch4\Downloads\Wayward
- origin: https://github.com/ARCH-a11y/wayward-bridge (ветка main)

## Обязательные команды
- node build.js          пересборка бандла из src/
- node -c wayward-bridge.js  синтаксис
- node wb-verify.js      36 проверок, ждём 36/36
- node wb-test.js        19 тестов на порту 8799, ждём 0 FAIL
- node wb-check-game.js --check-game

## Инварианты
- правим ТОЛЬКО в src/, wayward-bridge.js — производный артефакт
- все имена в src/ORDER.txt обязаны существовать
- переводы строк в src/ — LF (в .aider.conf.yml стоит line-endings: lf)
- BOM в src/ не нужен, он попадает в середину склейки
- settings paths: только layer, heroine, saves, app, picks
- патч-скрипт требует РОВНО 1 совпадение regex, при MISS печатает ±300 символов
- после каждой правки: build -> verify -> test -> тест в игре

## Текущая задача
Волна 1.1 — разбор описания героини на блоки по частям тела + карантин «громких» тегов.
Статус: схема готова, сборка готова, добавлены маркеры и функциональный тест.

Схема (layer.prompts.heroines.<id>):
- parts-эквивалент: sections.<head|mouth|body|breasts|ass|vagina|misc>.{tags,negative,on}
- quarantine.<id>.{tags,negative,when,mode} — mode: auto|always|never
- layer.prompts.conditions.<имя>.{sources,keywords} — vagina_visible, ass_visible, nipples_visible

Сборка: src/008-src_server_prompt.js, функции SECTION_ORDER, orderedKeys, sectionSignals,
condFires, expandHero. Подключены в compose, composeNegative, synthesize.

## Зачем карантин
Теги вроде pubic_hair, anal hair, вытянутые соски от LoRA перетягивают внимание модели
и ломают сцену (вагинальный секс рисуется анальным, соски проступают сквозь одежду).
Карантинные блоки включаются только когда условие сработало по тегам наряда,
тексту оголённости или ключу сцены.

## Следующие шаги
- [ ] UI-секция «Внешность»: карточки частей, превью, тумблеры, индикатор разработки
- [ ] Генератор аддона с одеждой из _analysis/tags4/05-clothes.txt
- [ ] Волна 1.2: карточки гостей, память, отношение гостя к героине
- [ ] Справочник по аддонам: _analysis/ADDON-SCHEMA.md

## Ловушки, на которые уже наступали
- setAt существует ДВАЖДЫ: store.js и items.js — править оба
- флаг баннера — customWives, НЕ builder
- сломанный якорь: },k.id)}),!1,!1]
- CSS меню в shadow root -> баннер только inline styles
- sparse storage: значение, равное дефолту, в settings.json не пишется
- __proto__ как id героини — объект, а не строка
- PROMPTS.parts (переопределения частей игры) и sections у героини — разные вещи

## Агент
aider + Venice API (openai/z-ai-glm-5-3-flash), ключ в .env, конфиг в .aider.conf.yml.
Запуск: aider CONTEXT.md @files, затем /drop 019.
Файл 019-src_server_assets.generated.js (88k токенов) и src/000-tags-blob.js держим вне контекста.
