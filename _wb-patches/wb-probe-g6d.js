// wb-probe-g6d.js — атрибуты/фильтры родни, чтобы человек ребёнка был «живым» для игры
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function body(name, len) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return console.log("\n### " + name + ": НЕ НАЙДЕНО");
  console.log("\n### " + name + " @" + i + "\n" + src.slice(i, i + (len || 800)).replace(/\s+/g, " "));
}
function around(tok, ctx, max) {
  ctx = ctx || 300; max = max || 3;
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  let m, n = 0; const seen = new Set();
  console.log("\n--- " + tok + " ---");
  while ((m = re.exec(src)) && n < max) {
    const a = Math.max(0, m.index - ctx), b = Math.min(src.length, m.index + tok.length + ctx);
    const snip = src.slice(a, b).replace(/\s+/g, " ");
    const k = snip.slice(0, 50);
    if (seen.has(k)) continue;
    seen.add(k);
    console.log("@" + m.index + " ..." + snip + "...");
    n++;
  }
  console.log("  ^ " + n + (n >= max ? "+" : ""));
}

console.log("########## 1. ГЕНЕРАЦИЯ АТРИБУТОВ И ВЫБОР РОДНИ ##########");
body("Rp", 700);
body("W2", 600);
body("$M", 250);
body("Uve", 200);
body("t1", 300);
body("yR", 400);

console.log("\n########## 2. ТАБЛИЦЫ ГЕНЕРАЦИИ ##########");
around("qle=", 320, 2);
around("Fle=", 320, 2);
around("Ule=", 320, 2);
around("ux=", 320, 2);

console.log("\n########## 3. ПРИСУТСТВИЕ В ЛОКАЦИЯХ ##########");
around(".occupants.push", 260, 5);
around("occupants:[...", 260, 4);
around("W2(", 200, 6);