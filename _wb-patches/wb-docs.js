"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
function rep(file, a, b, tag) {
  let s = rd(file);
  if (s.includes(b)) { log.push(tag + ": уже есть"); return; }
  if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return; }
  wr(file, s.replace(a, b));
  log.push(tag + ": ок");
}

const H = "_analysis/HANDOFF.md", C = "CONTEXT.md";

// HANDOFF: числа
rep(H, "36 проверок, ждём 36/36", "70 проверок, ждём 70/70", "HANDOFF verify");
rep(H, "19 тестов на порту 8799, ждём 0 FAIL", "43 теста на порту 8799, ждём 0 FAIL", "HANDOFF test");

// HANDOFF: текущая задача
rep(H,
  "Волна 1.1 — разбор описания героини на блоки по частям тела + карантин «громких» тегов.",
  "Блок «беременность и дети»: Ф1–Ф3 готовы, Ф4–Ф5 в работе. Волна 1.1 закрыта.",
  "HANDOFF текущая задача");
rep(H,
  "Статус: схема готова, сборка готова, добавлены маркеры и функциональный тест.",
  "Идём ВНЕ очереди: пункты 1–6 глобального порядка (инспектор, превью частей, баг pipeline, гардероб, слой событий, стирка/печати/магия) ждут. Реально verify 70/70, тесты 43/43.",
  "HANDOFF статус");

// CONTEXT: числа и baseline
rep(C, "- wb-verify.js (36 проверок), wb-test.js (19 тестов, порт 8799, данные wb-test-data)",
       "- wb-verify.js (70 проверок), wb-test.js (43 теста, порт 8799, данные wb-test-data)",
       "CONTEXT verify/test");
rep(C, "- baseline: коммит 2bf0611, verify 36/36, tests 19/19",
       "- baseline: коммит 2bf0611; текущее verify 70/70, tests 43/43",
       "CONTEXT baseline");

// CONTEXT: задачи — отметить сделанное
rep(C, "- [ ] git init + baseline-42 (в работе)", "- [x] git init + baseline-42", "CONTEXT git init");
rep(C, "- [ ] wb-split.js → src/, побайтовая проверка", "- [x] wb-split.js → src/, побайтовая проверка", "CONTEXT split");
rep(C, "- [ ] Aider + Venice GLM 5.3 Flash", "- [x] Aider + Venice GLM 5.3 Flash", "CONTEXT aider");

// CONTEXT: добавить блок «Сейчас»
(function () {
  let c = rd(C);
  if (c.includes("## Сейчас")) { log.push("CONTEXT сейчас: уже есть"); return; }
  const nl = c.includes("\r\n") ? "\r\n" : "\n";
  c += nl + "## Сейчас" + nl +
    "Блок «беременность и дети»: Ф1–Ф3 готовы (схема childstate, модуль src/025, тик дня, живот 8-й частью, секция «Состояние»), Ф4–Ф5 в работе." + nl +
    "Идём вне очереди — пункты 1–6 плана (инспектор, превью частей, баг pipeline, гардероб, слой событий, стирка/печати/магия) ждут." + nl +
    "Первый в очереди при возврате: строка «Внешность» в инспекторе (решение в HANDOFF)." + nl +
    "verify 70/70, тесты 43/43." + nl;
  wr(C, c);
  log.push("CONTEXT сейчас: добавлен");
})();

console.log(log.join("\n"));
