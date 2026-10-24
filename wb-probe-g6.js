// wb-probe-g6.js — разведка: доступ к стору игры, форма characters/circles, машинерия патча HTML
const fs = require("fs");
const src = fs.readFileSync("index.html", "utf8");

function lines(f, a, b) {
  if (!fs.existsSync(f)) return console.log("(нет " + f + ")");
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  console.log("\n===== " + f + ":" + a + "-" + b + " (всего " + L.length + ") =====");
  for (let i = a - 1; i < Math.min(b, L.length); i++) console.log(String(i + 1).padStart(5) + ": " + L[i].slice(0, 185));
}
function g(f, re, max) {
  if (!fs.existsSync(f)) return;
  const L = fs.readFileSync(f, "utf8").split(/\r?\n/);
  let n = 0;
  console.log("\n--- " + f + " :: /" + re + "/ ---");
  for (let i = 0; i < L.length && n < (max || 30); i++) if (new RegExp(re).test(L[i])) { console.log(String(i + 1).padStart(5) + ": " + L[i].trim().slice(0, 180)); n++; }
  console.log("  ^ " + n + (n >= (max || 30) ? "+" : ""));
}
function around(tok, ctx, max) {
  ctx = ctx || 150; max = max || 4;
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

console.log("########## 1. МАШИНЕРИЯ ПАТЧА HTML В МОДЕ ##########");
lines("src/016-src_server_game.js", 1, 150);
g("src/016-src_server_game.js", "function [a-zA-Z]+\\(html|HANDLED_API|hooks|api/|__WB", 45);

console.log("\n########## 2. ЕСТЬ ЛИ УЖЕ ДОСТУП К СЕЙВУ В МОДЕ ##########");
g("src/024-src_server_index.js", "useSave|localStorage|gameStore|__WB|characters|circles|save\\b", 40);
g("src/019-src_server_assets.generated.js", "useSave|localStorage|gameStore|__WB_STORE|characters|circles", 40);

console.log("\n########## 3. СТОР ИГРЫ ##########");
around("persist(", 160, 4);
around("getState", 120, 4);
around("setState", 120, 4);
around("subscribe", 110, 4);

console.log("\n########## 4. ФОРМА СОХРАНЕНИЯ ##########");
around("circles:", 200, 3);
around("characters:{", 200, 3);
around("function ok(", 200, 2);
around("function tk(", 300, 2);
around("XI=", 130, 2);