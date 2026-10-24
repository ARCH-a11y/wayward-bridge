// wb-probe-g6c.js — форма персонажа из конструктора жены, запись occupants, класс Tie
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

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
function lines(f, a, b) {
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("\n===== " + f + ":" + a + "-" + b + " =====");
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ": " + L[i].slice(0, 185));
}

console.log("########## 1. КЛАСС Tie (как считаются отношения) ##########");
around("class Tie", 2400, 1);

console.log("\n########## 2. ПЕРСОНАЖ ИЗ КОНСТРУКТОРА ЖЕНЫ ##########");
around("wayward-custom-wives", 700, 3);
around("archetypeId", 250, 5);

console.log("\n########## 3. КТО ПИШЕТ occupants ##########");
around("occupants:", 220, 6);
around(".occupants", 160, 6);

console.log("\n########## 4. ПРИСУТСТВИЕ РОДНИ ##########");
around("presence", 170, 5);
around("parent_of", 170, 5);