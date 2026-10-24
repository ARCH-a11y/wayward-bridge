// wb-probe-g7.js — кэш картинок: isStale, сброс пака, принудительная перерисовка
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function body(name, len) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return console.log("\n### " + name + ": НЕ НАЙДЕНО");
  console.log("\n### " + name + " @" + i + "\n" + src.slice(i, i + (len || 700)).replace(/\s+/g, " "));
}
function around(tok, ctx, max) {
  ctx = ctx || 250; max = max || 4;
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
function g(file, re, max) {
  const L = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let n = 0;
  console.log("\n--- " + file + " :: /" + re + "/ ---");
  for (let i = 0; i < L.length && n < (max || 25); i++) if (new RegExp(re).test(L[i])) { console.log(String(i + 1).padStart(5) + ": " + L[i].trim().slice(0, 175)); n++; }
  console.log("  ^ " + n + (n >= (max || 25) ? "+" : ""));
}

console.log("########## 1. isStale и свежесть пака (мод) ##########");
g("src/024-src_server_index.js", "isStale|redrawChanged|freshImages", 30);
around("function isStale", 500, 2);

console.log("\n########## 2. ПАК И КЭШ В ИГРЕ ##########");
body("Hp", 500);
around("qD()", 260, 4);
around("I_=null", 220, 3);
around("jm=null", 220, 3);
around("bypassCache", 200, 5);
around("forceVariant", 200, 4);

console.log("\n########## 3. ПРИНУДИТЕЛЬНАЯ ПЕРЕРИСОВКА (клиент мода) ##########");
g("src/019-src_server_assets.generated.js", "redrawCurrent|WBPIC|wb:generate|useImage|bypassCache", 30);
around("WBPIC=", 600, 2);