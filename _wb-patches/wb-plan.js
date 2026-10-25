"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const p = "_analysis/HANDOFF.md";
let s = fs.readFileSync(path.join(ROOT, p), "utf8");
if (s.includes("Бэклог — проверить")) { console.log("уже есть"); process.exit(0); }
const nl = s.includes("\r\n") ? "\r\n" : "\n";
s += nl + "## Бэклог — проверить" + nl +
  "- [ ] Скрытые черты (latentTraits: romance_starved, wants_to_be_corrupted, latent_submissive и др.) сейчас фиксируются при создании героини. Цель: сделать развивающимися — меняются от событий и опыта. Сначала проверить: где игра их роллит, где хранит, можно ли менять по ходу прохождения. Связано с Ф5 (желание цели толкают именно эти черты)." + nl;
fs.writeFileSync(path.join(ROOT, p), s, "utf8");
console.log("добавлено");
