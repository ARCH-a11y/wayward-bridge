"use strict";
const fs = require("fs"), path = require("path");
const p = "_analysis/HANDOFF.md";
let s = fs.readFileSync(path.join(__dirname, p), "utf8");
if (s.includes("Веха: Ф5 готов")) { console.log("уже есть"); process.exit(0); }
const nl = s.includes("\r\n") ? "\r\n" : "\n";
s += nl + "## Веха: Ф5 готов — блок «беременность и дети» закрыт" + nl +
"- сокрытие: при зачатии known = доверие >= 50; пока скрыто — бросок раскрытия от доверия; на 16 дне раскрытие вынужденное (forced)" + nl +
"- желание цели: при доверии >= 60 и без детей childWish.targetId = player; с целью шанс выше, с не-целью ниже" + nl +
"- доверие берётся из state.characters[primary].relationship.trust и уходит в ctx" + nl +
"- UI: тумблер желания и цель в «Состоянии»" + nl +
"- verify 93/93, тесты 50/50" + nl +
"### Дальше (по плану)" + nl +
"- внешность ребёнка: гены + фильтры по полу и стадии" + nl +
"- паспорт ГГ (наследование + промпт, когда игрок в кадре)" + nl +
"- промоушен ребёнка в персонажа (по умолчанию подросток)" + nl +
"- возврат к пунктам 1-6 (первый: строка «Внешность» в инспекторе)" + nl;
fs.writeFileSync(path.join(__dirname, p), s, "utf8");
console.log("добавлено");
