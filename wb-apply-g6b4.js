// wb-apply-g6b4.js — скобки кнопки «дом»
const fs = require("fs");
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 200));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. тернарник кнопки ==");
rep(F_CLIENT,
  '"в персонажа"), c.promoted ? h("button"',
  '"в персонажа") : null, c.promoted ? h("button"',
  "закрыть тернарник до новой кнопки", '"в персонажа") : null, c.promoted ?');

rep(F_CLIENT,
  '}, "дом") : null) : null),',
  '}, "дом") : null),',
  "убрать лишнюю скобку", '"дом") : null),');

console.log("== 2. маркер ==");
{
  const v = rd(F_VERIFY);
  if (v.indexOf('"G6b: кнопка дом в карточке"') >= 0) console.log("  = уже: маркер");
  else {
    const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
    if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
    const at = m.index + m[0].length;
    wr(F_VERIFY, v.slice(0, at) + '\n  ["G6b: кнопка дом в карточке", "\\"дом\\") : null),", 1],' + v.slice(at));
    console.log("  + маркер");
  }
}

console.log("== 3. синтаксис исходника клиента ==");
{
  const src = rd(F_CLIENT);
  try { new (require("vm").Script)(src); console.log("  исходник клиента: синтаксис ок"); }
  catch (e) { throw new Error("СИНТАКСИС КЛИЕНТА: " + e.message); }
}
console.log("\nГОТОВО.");