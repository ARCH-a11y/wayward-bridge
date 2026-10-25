// wb-probe-g6e.js — визиты родни: планировщик, visitingPeople, размещение в комнатах
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

console.log("########## 1. КАК ИГРА РИСУЕТ ЛЮДЕЙ В КОМНАТЕ ##########");
body("Bne", 1600);
around('kind:"person"', 240, 4);

console.log("########## 2. ПЛАНИРОВЩИК ВИЗИТОВ ##########");
body("rEe", 1500);
body("jF", 900);
body("mEe", 700);
body("pEe", 300);
body("_Ee", 400);

console.log("########## 3. visitingPeople / размещение ##########");
around("visitingPeople", 260, 6);
around("J7(", 240, 4);
around("yI=", 200, 3);
around("pendingEvent", 200, 6);

console.log("########## 4. КТО ЦЕЛЬ ВЫЛАЗОК ##########");
around("Uve(", 200, 6);
around("W2(", 220, 6);
around("Gr(", 200, 5);