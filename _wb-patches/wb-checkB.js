#!/usr/bin/env node
"use strict";
const fs = require("fs");

(async () => {
  const out = [];

  out.push("=== файлы wayward-bridge*.js ===");
  for (const f of fs.readdirSync(".").filter((x) => /^wayward-bridge.*\.js$/.test(x))) {
    out.push("  " + f + "  " + fs.statSync(f).size + " байт  " + fs.statSync(f).mtime.toISOString());
  }

  const b = fs.existsSync("wayward-bridge.js") ? fs.readFileSync("wayward-bridge.js", "utf8") : null;
  out.push("");
  out.push("=== wayward-bridge.js ===");
  if (!b) out.push("  ФАЙЛА НЕТ");
  else {
    out.push("  размер: " + b.length);
    out.push("  баннер в коде: " + (b.includes("function compatBanner") ? "да" : "НЕТ"));
    out.push("  правильный ключ customWives: " + (b.includes("g.hooks.customWives === false") ? "да" : "НЕТ"));
    out.push("  старый ключ builder: " + (b.includes("g.hooks.builder === false") ? "да" : "нет"));
    out.push("  partsBroken: " + (b.includes("partsBroken === true") ? "да" : "НЕТ"));
    out.push("  интервал: " + (b.includes("setInterval(compatBanner") ? "да" : "НЕТ"));
  }

  out.push("");
  out.push("=== index.html ===");
  if (!fs.existsSync("index.html")) out.push("  ФАЙЛА НЕТ");
  else {
    const h = fs.readFileSync("index.html", "utf8");
    out.push("  размер: " + h.length);
    out.push("  вхождений '},k.id)}),!1,!1]': " + (h.split("},k.id)}),!1,!1]").length - 1));
    out.push("  вхождений '},k.id)}),!1,!2]': " + (h.split("},k.id)}),!1,!2]").length - 1));
  }

  out.push("");
  out.push("=== живая диагностика (бридж должен быть запущен) ===");
  try {
    const r = await fetch("http://127.0.0.1:8788/bridge/api/state");
    const j = await r.json();
    out.push("  diagnostics.game:");
    out.push(JSON.stringify(j.diagnostics && j.diagnostics.game, null, 1));
  } catch (e) {
    out.push("  недоступно: " + e.message);
  }

  fs.writeFileSync("wb-checkB.txt", out.join("\n"));
  console.log(out.join("\n"));
})();