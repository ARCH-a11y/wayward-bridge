#!/usr/bin/env node
"use strict";
const fs = require("fs");

(async () => {
  const out = [];
  const src = fs.readFileSync("wayward-bridge.js", "utf8");

  out.push("=== все вхождения 'hooks' в коде ===");
  let i = -1, n = 0;
  while ((i = src.indexOf("hooks", i + 1)) >= 0 && n < 15) {
    n++;
    out.push("--- @" + i + " ---");
    out.push(src.slice(Math.max(0, i - 400), i + 400));
    out.push("");
  }

  out.push("");
  out.push("=== живые diagnostics с бриджа ===");
  try {
    const r = await fetch("http://127.0.0.1:8788/bridge/api/state");
    const j = await r.json();
    out.push("ключи состояния: " + Object.keys(j).join(", "));
    out.push("");
    out.push("diagnostics.game:");
    out.push(JSON.stringify(j.diagnostics && j.diagnostics.game, null, 1));
  } catch (e) {
    out.push("не смог обратиться к /bridge/api/state: " + e.message);
    out.push("(бридж должен быть запущен)");
  }

  fs.writeFileSync("wb-diagB.txt", out.join("\n"));
  console.log("wb-diagB.txt готов, " + out.join("\n").length + " символов");
})();