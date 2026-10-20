#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = "_analysis";
fs.mkdirSync(path.join(OUT, "bridge"), { recursive: true });

const rep = [];
const pct = (a, b) => ((a / b) * 100).toFixed(1) + "%";

function dataUrls(s) {
  const re = /data:([a-z0-9.+\/-]+);base64,/gi;
  const res = [];
  let m;
  while ((m = re.exec(s))) {
    let e = m.index + m[0].length;
    while (e < s.length && /[A-Za-z0-9+/=\s]/.test(s[e])) e++;
    res.push({ mime: m[1], len: e - (m.index + m[0].length) });
    re.lastIndex = e;
  }
  return res;
}

if (fs.existsSync("index.html")) {
  const s = fs.readFileSync("index.html", "utf8");
  rep.push("=== index.html ===");
  rep.push("символов: " + s.length + ", строк: " + s.split("\n").length);
  const d = dataUrls(s);
  const tot = d.reduce((a, x) => a + x.len, 0);
  rep.push("base64 data-URL: " + d.length + " шт, " + tot + " символов (" + pct(tot, s.length) + ")");
  const byMime = {};
  for (const x of d) byMime[x.mime] = (byMime[x.mime] || 0) + x.len;
  for (const k of Object.keys(byMime).sort((a, b) => byMime[b] - byMime[a])) {
    rep.push("   " + k + ": " + byMime[k] + " (" + pct(byMime[k], s.length) + ")");
  }
  const sc = [...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((x) => x[1].length);
  const st = [...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((x) => x[1].length);
  rep.push("<script>: " + sc.length + " блоков, " + sc.reduce((a, b) => a + b, 0) + " символов");
  rep.push("<style>: " + st.length + " блоков, " + st.reduce((a, b) => a + b, 0) + " символов");
  rep.push("");
}

if (fs.existsSync("wayward-bridge.js")) {
  const s = fs.readFileSync("wayward-bridge.js", "utf8");
  rep.push("=== wayward-bridge.js ===");
  rep.push("символов: " + s.length + ", строк: " + s.split("\n").length);
  const marks = [...s.matchAll(/^\/\/ src\/([^\r\n]+)$/gm)].map((m) => ({ name: m[1], at: m.index }));
  rep.push("модулей: " + marks.length);
  const rows = [];
  for (let i = 0; i < marks.length; i++) {
    const from = marks[i].at;
    const to = i + 1 < marks.length ? marks[i + 1].at : s.length;
    const body = s.slice(from, to);
    const safe = marks[i].name.replace(/[\\/]/g, "__");
    fs.writeFileSync(path.join(OUT, "bridge", String(i + 1).padStart(2, "0") + "-" + safe), body);
    rows.push({ name: marks[i].name, size: body.length });
  }
  rows.sort((a, b) => b.size - a.size);
  for (const r of rows) rep.push("   " + String(r.size).padStart(9) + "  " + r.name);
  const big = rows.filter((r) => r.size > 190000);
  rep.push("модулей крупнее лимита загрузки (190k): " + big.length);
  rep.push("");
}

fs.writeFileSync(path.join(OUT, "REPORT.txt"), rep.join("\n"));
fs.writeFileSync(path.join(OUT, "MAP.md"), "# Карта проекта\n\n" + rep.join("\n"));
console.log(rep.join("\n"));