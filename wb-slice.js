#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

// --- 2. база тегов по темам ---
const TOUT = "_analysis/tags";
fs.mkdirSync(TOUT, { recursive: true });

if (fs.existsSync("_analysis/tags.txt")) {
  const tags = fs.readFileSync("_analysis/tags.txt", "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  const RULES = [
    ["01-clothes", /\b(dress|skirt|shirt|blouse|jacket|coat|apron|corset|bra|panties|underwear|shorts|pants|jeans|stocking|thighhigh|socks|boots|shoes|heels|gloves|hat|cap|bonnet|ribbon|bow|scarf|cloak|cape|robe|kimono|yukata|swimsuit|bikini|leotard|bodysuit|vest|sweater|cardigan|hoodie|uniform|armor|belt|sash|jewelry|necklace|earring|choker|bracelet|veil|collar|frill|lace|silk|velvet|denim|plaid|striped|polka)/],
    ["02-body", /\b(hair|eye|breast|nipple|thigh|leg|arm|hand|finger|face|skin|navel|ass|hip|waist|shoulder|collarbone|neck|back|stomach|abs|muscular|plump|petite|tall|pale|tan|freckle|mole|blush|sweat|pube)/],
    ["03-pose", /\b(standing|sitting|kneeling|lying|on_back|on_side|on_stomach|crouch|squat|bend|lean|walk|run|jump|danc|spread|cross|stretch|reach|holding|hug|kiss|look|gaze|smil|frown|expression|cry|laugh|arms|hands)/],
    ["04-sex", /\b(sex|cum|penis|pussy|vagina|anal|oral|fellatio|cunnilingus|paizuri|handjob|fingering|masturbat|orgasm|penetrat|creampie|nude|topless|bottomless|areola|clitoris|testicl|erection|precum|semen|dildo|vibrator|condom|bukkake|gangbang|threesome|nsfw)/],
    ["05-place", /\b(room|tavern|inn|bar|kitchen|bath|bed|chair|table|window|door|floor|wall|street|garden|forest|field|mountain|sea|beach|sky|night|day|sunset|dawn|rain|snow|fire|lantern|candle)/],
    ["06-style", /\b(style|art|painting|sketch|anime|realistic|photo|render|lighting|shading|lineart|monochrome|greyscale|sepia|watercolor|oil|cel|chibi|retro|vintage|pixel)/],
  ];
  const buckets = new Map(RULES.map(([n]) => [n, []]));
  const other = [];
  for (const t of tags) {
    let hit = false;
    for (const [n, re] of RULES) if (re.test(t)) { buckets.get(n).push(t); hit = true; break; }
    if (!hit) other.push(t);
  }
  for (const [n, list] of buckets) fs.writeFileSync(path.join(TOUT, n + ".txt"), list.join("\n") + "\n");
  // остаток режем по 60k
  for (let i = 0; i * 60000 < other.length; i++) {
    fs.writeFileSync(path.join(TOUT, "99-other-" + (i + 1) + ".txt"), other.slice(i * 60000, (i + 1) * 60000).join("\n") + "\n");
  }
  console.log("теги разложены, всего " + tags.length);
  for (const [n, list] of buckets) console.log("  " + n + ": " + list.length);
  console.log("  остаток: " + other.length);
}

// --- 3. таблицы игры ---
const MDIR = "wayward-bridge-data/maintainer";
const GOUT = "_analysis/game-tables";
fs.mkdirSync(GOUT, { recursive: true });
if (fs.existsSync(MDIR)) {
  const cand = fs.readdirSync(MDIR).filter((f) => f.endsWith("-tables.json"));
  if (cand.length) {
    const src = path.join(MDIR, cand.sort().pop());
    const data = JSON.parse(fs.readFileSync(src, "utf8"));
    console.log("");
    console.log("таблицы из " + src);
    for (const [k, v] of Object.entries(data)) {
      const body = typeof v === "string" ? v : JSON.stringify(v, null, 2);
      fs.writeFileSync(path.join(GOUT, k.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json"), body + "\n");
      console.log("  " + k + ": " + body.length + " символов");
    }
  } else console.log("файл *-tables.json не найден в " + MDIR);
} else console.log("нет папки " + MDIR + " — запусти bridge --check-game хотя бы раз");