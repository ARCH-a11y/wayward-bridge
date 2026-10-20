# Формат аддонов Wayward Bridge

Аддон — частичный патч настроек, накладываемый оверлеем. Живёт в
wayward-bridge-data/addons/. Управляется кнопками UI и HTTP API.

## Оболочка
{
  "format": "wayward-addon",
  "version": 1,
  "name": "<имя>",
  "description": "",
  "layer": { ...частичное дерево настроек... },
  "heroine": { "<id>": { ...переопределения по героине... } }
}

## Семантика
- settings.addons — упорядоченный стек имён файлов, порядок задаёт setAddonStack.
- Если один item (путь промпта) есть в нескольких аддонах, выигрывает последний в стеке.
- settings.picks закрепляет конкретный аддон за конкретным item.
- Секция heroine переопределяет по героине: heroine.<id>.<rel>.
- Валидация: format обязан быть "wayward-addon", иначе 400.
- Содержимое layer прогоняется через clean(LAYER, layer) — лишние ключи отсекаются.

## Что можно класть в layer

### layer.prompts.outfits.<имя>
{ "tags": "...", "negative": "...", "boldness": 0..100 }

### layer.prompts.patrons
{ "quality": "...", "negative": "...", "archetypes": [ { "label": "...", "tags": "..." } ] }

### layer.prompts.heroines.<id>
{ "base": "...", "negative": "...", "name": "..." }

### layer.pipeline
{
  "family": "<семейство>",
  "families": { "<семейство>": {
    checkpoint, unet, clip, vae, useCheckpointVae,
    sampler, scheduler, clipSkip,
    turbo: { enabled, steps, cfg },
    quality, negative,
    loras: [ { model, strength, enabled, words[], removed[], groups[], only[], trigger[] } ]
  } }
}

## API
- GET    /bridge/api/addons/<file>        выгрузка файла
- POST   /bridge/api/addons/import        загрузка
- POST   /bridge/api/addons/create        создать из layer
- POST   /bridge/api/addons/<file>/merge  влить layer в существующий
- POST   /bridge/api/addons/stack         задать порядок стека
- POST   /bridge/api/addons/preview       показать, что затронет
- DELETE /bridge/api/addons/<file>        удалить

## Допустимые префиксы настроек
layer, heroine, saves, app, picks

## Бэкап
Формат wayward-bridge-backup содержит settings, presets и все файлы addons.

## Наследие
Старые паки конвертируются из каталога "add-on packs" (addonPacksDir).
