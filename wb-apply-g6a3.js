// wb-apply-g6a3.js — pt передаётся в patchChild явно
const fs = require("fs");
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 180));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. pt в patchChild ==");
rep(F_CLIENT,
  "        function patchChild(id, patch) {",
  "        function patchChild(id, patch, pt) {",
  "сигнатура", "function patchChild(id, patch, pt) {");

rep(F_CLIENT, "patchChild(c.id, { name: this.value });", "patchChild(c.id, { name: this.value }, pt);", "вызов: имя", "patchChild(c.id, { name: this.value }, pt);");
rep(F_CLIENT, "patchChild(c.id, { stage: this.value });", "patchChild(c.id, { stage: this.value }, pt);", "вызов: стадия", "patchChild(c.id, { stage: this.value }, pt);");
rep(F_CLIENT, "patchChild(c.id, { bornDay: (c.bornDay || 0) - 30 });", "patchChild(c.id, { bornDay: (c.bornDay || 0) - 30 }, pt);", "вызов: взросление", "patchChild(c.id, { bornDay: (c.bornDay || 0) - 30 }, pt);");

console.log("== 2. маркер ==");
{
  const v = rd(F_VERIFY);
  if (v.indexOf('"G6: pt в правке ребёнка"') >= 0) console.log("  = уже: маркер");
  else {
    const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
    if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
    const at = m.index + m[0].length;
    wr(F_VERIFY, v.slice(0, at) + '\n  ["G6: pt в правке ребёнка", "function patchChild(id, patch, pt)", 1],' + v.slice(at));
    console.log("  + маркер");
  }
}
console.log("\nГОТОВО.");