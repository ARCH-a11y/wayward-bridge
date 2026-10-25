#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = "_analysis";
fs.mkdirSync(OUT, { recursive: true });
const rep = [];

// ---- разбор assets.generated.js ----
const dir = path.join(OUT, "bridge");
const file = fs.readdirSync(dir).find((f) => f.includes("assets.generated"));
if (file) {
  const s = fs.readFileSync(path.join(dir, file), "utf8");
  rep.push("=== " + file + " — " + s.length + " символов ===");

  const marks = [
    ["VERSION", s.indexOf("VERSION:")],
    ["BOOTSTRAP", s.indexOf("BOOTSTRAP:")],
    ["MENU", s.indexOf("MENU:")],
    ["CSS", s.indexOf("CSS:")],
    ["TAGS_GZ_B64", s.indexOf("TAGS_GZ_B64:")],
  ].filter(([, i]) => i >= 0);
  for (let i = 0; i < marks.length; i++) {
    const to = i + 1 < marks.length ? marks[i + 1][1] : s.length;
    rep.push("   " + String(to - marks[i][1]).padStart(9) + "  " + marks[i][0]);
  }

  // декодируем базу тегов
  const t = s.indexOf('TAGS_GZ_B64: "');
  if (t >= 0) {
    const from = t + 'TAGS_GZ_B64: "'.length;
    const to = s.indexOf('"', from);
    const b64 = s.slice(from, to);
    let txt = "";
    try {
      txt = zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf8");
    } catch (e) {
      try { txt = zlib.inflateSync(Buffer.from(b64, "base64")).toString("utf8"); } catch (_) { txt = ""; }
    }
    if (txt) {
      fs.writeFileSync(path.join(OUT, "tags.txt"), txt);
      rep.push("");
      rep.push("TAGS_GZ_B64 распакован: " + b64.length + " символов base64 -> " + txt.length + " символов текста");
      rep.push("записан в _analysis/tags.txt");
      rep.push("первые 300: " + JSON.stringify(txt.slice(0, 300)));
    } else {
      rep.push("TAGS_GZ_B64 не распаковался");
    }
  }
  rep.push("");
}

// ---- крупные строковые литералы в index.html ----
if (fs.existsSync("index.html")) {
  const s = fs.readFileSync("index.html", "utf8");
  rep.push("=== index.html: крупные строковые литералы ===");
  const re = /"((?:[^"\\]|\\.){300,})"/g;
  const found = [];
  let m;
  while ((m = re.exec(s))) found.push({ len: m[1].length, at: m.index, head: m[1].slice(0, 90) });
  found.sort((a, b) => b.len - a.len);
  rep.push("строк длиннее 300 символов: " + found.length + ", суммарно " + found.reduce((a, x) => a + x.len, 0) + " символов");
  for (const x of found.slice(0, 12)) {
    rep.push("   " + String(x.len).padStart(8) + "  @" + x.at + "  " + JSON.stringify(x.head));
  }

  // base64-подобные длинные строки
  const re2 = /"([A-Za-z0-9+/=]{200,})"/g;
  let tot = 0, n = 0;
  while ((m = re2.exec(s))) { tot += m[1].length; n++; }
  rep.push("");
  rep.push("base64-подобных строк (>=200): " + n + ", суммарно " + tot + " символов");
}

fs.writeFileSync(path.join(OUT, "REPORT2.txt"), rep.join("\n"));
console.log(rep.join("\n"));