// wb-apply-g7b.js — нормализация стадии при чтении, возврат флага переезда, починка маркеров
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_VERIFY = "wb-verify.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 190));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. переезд сообщает об изменении ==");
rep(F_CHILD,
  '    function moveOutIfGrown(c) {\n' +
  '      if (c.stage === "youth") {\n' +
  '        if (!c.movedOut) { c.movedOut = true; c.home = pickHome(); }\n' +
  '      } else if (c.movedOut) {\n' +
  '        c.movedOut = false;\n' +
  '      }\n' +
  '      return c;\n' +
  '    }',
  '    function moveOutIfGrown(c) {\n' +
  '      if (c.stage === "youth") {\n' +
  '        if (!c.movedOut) { c.movedOut = true; c.home = pickHome(); return true; }\n' +
  '      } else if (c.movedOut) {\n' +
  '        c.movedOut = false;\n' +
  '        return true;\n' +
  '      }\n' +
  '      return false;\n' +
  '    }',
  "флаг изменения", "return true; }\n      } else if (c.movedOut) {");

console.log("== 2. нормализация при чтении ==");
rep(F_CHILD,
  '        if (c && !c.name) { c.name = pickName(s, c.sex); changed = true; }\n      }\n      return changed;',
  '        if (!c) continue;\n        if (!c.name) { c.name = pickName(s, c.sex); changed = true; }\n        if (moveOutIfGrown(c)) changed = true;\n      }\n      return changed;',
  "moveOutIfGrown в ensureNames", "if (moveOutIfGrown(c)) changed = true;");

console.log("== 3. маркеры под новый текст ==");
{
  const v = rd(F_VERIFY);
  let out = v, n = 0;
  if (out.indexOf('"function syncChildHome(c)"') >= 0) { out = out.split('"function syncChildHome(c)"').join('"function syncChildHome(force)"'); n++; }
  if (out.indexOf('"occ.nursery"') >= 0) { out = out.split('"occ.nursery"').join('"occ[room] = base"'); n++; }
  if (n) { wr(F_VERIFY, out); console.log("  + поправлено маркеров: " + n); }
  else console.log("  = уже: маркеры");
}

console.log("\n== синтаксис childstate ==");
try { new (require("vm").Script)(rd(F_CHILD)); console.log("  ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
console.log("\nГОТОВО.");