"use strict";
const fs = require("fs"), path = require("path");
const p = "_analysis/HANDOFF.md";
let s = fs.readFileSync(path.join(__dirname, p), "utf8");
if (s.includes("Веха: Ф4 готов")) { console.log("уже есть"); process.exit(0); }
const nl = s.includes("\r\n") ? "\r\n" : "\n";
s += nl + "## Веха: Ф4 готов (роды, дети, детская)" + nl +
"- роды с риском: гладко/тяжело/плохо; лекарь и доверие снижают риск; тяжёлые — длиннее послеродовой блок" + nl +
"- дети в меню «Состояние»: пол, возраст, стадия, отец" + nl +
"- детская: локация (hl, K7, bO, карта признаков, je/De, mje, rF, плитка W, переход go_to_nursery) + запись в AP (покупка 150g) + автопостройка при родах" + nl +
"- ЛОВУШКА: для новой локации мало плитки — нужны mje (откуда можно вернуться) и rF (смежность комнат), иначе игрок застревает" + nl +
"- verify 81/81, тесты 46/46, проверено в игре" + nl +
"- дальше: Ф5 — сокрытие (wz) и желание цели (childWish)" + nl;
fs.writeFileSync(path.join(__dirname, p), s, "utf8");
console.log("добавлено");
