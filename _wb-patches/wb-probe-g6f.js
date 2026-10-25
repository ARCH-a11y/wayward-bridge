// wb-probe-g6f.js — форма персонажа из конструктора, ключ картинки, триггер визитов
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function body(name, len) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return console.log("\n### " + name + ": НЕ НАЙДЕНО");
  console.log("\n### " + name + " @" + i + "\n" + src.slice(i, i + (len || 900)).replace(/\s+/g, " "));
}
function around(tok, ctx, max) {
  ctx = ctx || 260; max = max || 4;
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

console.log("########## 1. ФОРМА ПЕРСОНАЖА (конструктор жены) ##########");
body("FL", 2600);
body("Kde", 400);
around("imageKey:", 260, 6);
around("generatedArchetype:", 260, 5);

console.log("########## 2. ТРИГГЕР ВИЗИТОВ ##########");
body("ZCe", 700);
around("ZCe(", 260, 4);
around("XCe(", 220, 4);
body("Eo", 400);

console.log("########## 3. СОБЫТИЯ РОДНИ (форма when) ##########");
around("familyVisitEvents:[", 1400, 1);
around("relationClass:[", 200, 6);