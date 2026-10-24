// wb-probe-h1.js — форма персонажа, ключ картинки, действия ГГ, гейтинг событий
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function body(name, len) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return console.log("\n### " + name + ": НЕ НАЙДЕНО");
  console.log("\n### " + name + " @" + i + "\n" + src.slice(i, i + (len || 900)).replace(/\s+/g, " "));
}
function around(tok, ctx, max) {
  ctx = ctx || 220; max = max || 4;
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

console.log("########## 1. ФОРМА ПЕРСОНАЖА ##########");
body("q3e", 2200);
body("VQ", 700);
body("M_e", 400);

console.log("\n########## 2. КЛЮЧ КАРТИНКИ ##########");
around("task-", 250, 4);
around("outfit-", 250, 4);
around("shortname", 180, 6);
around("key:", 150, 8);

console.log("\n########## 3. ДЕЙСТВИЯ ГГ ##########");
around("talk_to_wife", 220, 4);
around("scene_action", 200, 4);
around("characterId", 150, 5);

console.log("\n########## 4. ГЕЙТИНГ СОБЫТИЙ ##########");
around("stage:", 150, 5);
around("kind:", 130, 6);