Wayward Bridge — служебные скрипты пропатченной сборки

РАБОЧИЕ ФАЙЛЫ В КОРНЕ
  wayward-bridge.js       рабочий бридж с патчами (его запускает батник)
  wayward-bridge.orig.js  чистый оригинал, для отката

ОТКАТ
  Copy-Item wayward-bridge.orig.js wayward-bridge.js -Force

ПЕРЕСБОРКА ИЗ ОРИГИНАЛА
  node _wb-patches\wb-apply-all.js wayward-bridge.orig.js
  node _wb-patches\wb-apply-all-fix.js
  node _wb-patches\wb-patchS.js wayward-bridge.new.js
  Copy-Item wayward-bridge.patchS.js wayward-bridge.js -Force

ПРОВЕРКИ (запускать из корня)
  node wb-verify.js                        все 36 правок на месте
  node wb-test.js                          19 поведенческих тестов (порт 8799, папка wb-test-data)
  node wayward-bridge.js --check-game .    совместимость с версией игры

ЧТО ЗАКРЫТО ПАТЧАМИ
  B2  лимит промпта 32000, обрезка по границе тега, счётчик символов
  B3  числа вне диапазона зажимаются вместо ошибки 400
  B5  __proto__ не подменяет прототип
  B6  undo не сбрасывает детект конфликтов
  B7  useSave двигает revision
  B8  уникальные имена бэкапов
  B9  writeAtomic без busy-wait
  B10 хайрез-фикс и апскейлер разведены
  B39 --check-game без пути
  B40 HANDLED_API в синхроне
  B43/B44 Ratings: кеш в памяти + компакция файла
  A   предупреждения об обрезке в UI
  B   баннер несовместимости с версией игры
  S   восстановление связи после рестарта бриджа
