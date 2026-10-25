// wb-apply-g7h.js — скобка кнопки ✕ и маркер
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

console.log("== 1. скобка кнопки ✕ ==");
rep(F_CLIENT,
  '}, "✕") : null),',
  '}, "✕")),',
  "убрать лишний : null", '}, "✕")),');

console.log("== 2. маркер ==");
{
  const v = rd(F_VERIFY);
  const from = '"\\"дом\\") : null),"';
  const to = '"\\"дом\\") : null,"';
  if (v.indexOf(to) >= 0 && v.indexOf(from) < 0) console.log("  = уже: маркер");
  else if (v.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН маркер кнопки дом");
  else { wr(F_VERIFY, v.split(from).join(to)); console.log("  + маркер поправлен"); }
}

console.log("\n== синтаксис клиента ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
console.log("\nГОТОВО.");