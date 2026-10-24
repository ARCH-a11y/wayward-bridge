// wb-probe-g6b.js — разведка: готовый код работы со стором, форма персонажа/круга/локации
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function lines(f, a, b) {
  if (!fs.existsSync(f)) return console.log("(нет " + f + ")");
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("\n===== " + f + ":" + a + "-" + b + " =====");
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ": " + L[i].slice(0, 185));
}
function around(tok, ctx, max) {
  ctx = ctx || 170; max = max || 4;
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  let m, n = 0; const seen = new Set();
  console.log("\n--- index.html :: " + tok + " ---");
  while ((m = re.exec(src)) && n < max) {
    const a = Math.max(0, m.index - ctx), b = Math.min(src.length, m.index + tok.length + ctx);
    const snip = src.slice(a, b).replace(/\s+/g, " ");
    const k = snip.slice(0, 45);
    if (seen.has(k)) continue;
    seen.add(k);
    console.log("@" + m.index + " ..." + snip + "...");
    n++;
  }
  console.log("  ^ " + n + (n >= max ? "+" : ""));
}
function body(name, len) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return console.log("\n### " + name + ": НЕ НАЙДЕНО");
  console.log("\n### " + name + " @" + i + "\n" + src.slice(i, i + (len || 1200)).replace(/\s+/g, " "));
}

console.log("########## 1. ГОТОВЫЙ КОД РАБОТЫ СО СТОРОМ (клиент) ##########");
lines("src/019-src_server_assets.generated.js", 545, 700);
lines("src/019-src_server_assets.generated.js", 700, 850);

console.log("\n########## 2. ФОРМА ПЕРСОНАЖА И КРУГА ##########");
around("occupants", 190, 6);
around("persons:[", 200, 4);
around("relation:", 140, 6);
around("primaryCharacterId", 140, 5);
around("locations:", 220, 3);

console.log("\n########## 3. ГЕНЕРАЦИЯ РОДНИ И СВЯЗЕЙ ##########");
body("Vle", 2000);
body("Sie", 900);
body("OQ", 600);
body("zO", 700);
around("class Tie", 400, 2);
around("of:e.herId", 200, 3);