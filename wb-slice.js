#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const A = "_analysis";
const BR = path.join(A, "bridge");
const AS = path.join(BR, "assets");
fs.mkdirSync(BR, { recursive: true });

const rep = [];
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

const src = fs.readFileSync("wayward-bridge.js", "utf8");
const marks = [...src.matchAll(/^\/\/ src\/([^\r\n]+)$/gm)].map((m) => ({ name: m[1], at: m.index }));
rep.push("модулей: " + marks.length);

const parts = [];
for (let i = 0; i < marks.length; i++) {
  const from = marks[i].at;
  const to = i + 1 < marks.length ? marks[i + 1].at : src.length;
  const body = src.slice(from, to);
  const safe = marks[i].name.replace(/[\\/]/g, "__");
  const file = path.join(BR, String(i + 1).padStart(2, "0") + "-" + safe);
  parts.push({ name: marks[i].name, size: body.length, file, body });
  fs.writeFileSync(file, body);
}
parts.sort((a, b) => b.size - a.size);
rep.push("");
rep.push("=== модули ===");
for (const p of parts) rep.push(String(p.size).padStart(9) + "  " + p.name);

// база тегов и UI внутри assets.generated.js — разложить по переменным верхнего уровня
const big = parts.find((p) => p.size > 1e6);
if (big) {
  const s = big.body;
  const decls = [...s.matchAll(/^ {2,6}var ([A-Za-z_$][\w$]*) = /gm)].map((m) => ({ name: m[1], at: m.index }));
  fs.mkdirSync(AS, { recursive: true });
  const sub = [];
  for (let i = 0; i < decls.length; i++) {
    const from = decls[i].at;
    const to = i + 1 < decls.length ? decls[i + 1].at : s.length;
    const body = s.slice(from, to);
    const file = path.join(AS, String(i + 1).padStart(2, "0") + "-" + decls[i].name + ".js");
    fs.writeFileSync(file, body);
    sub.push({ name: decls[i].name, size: body.length, file });
  }
  sub.sort((a, b) => b.size - a.size);
  rep.push("");
  rep.push("=== " + big.name + " разобран на части ===");
  for (const p of sub) rep.push(String(p.size).padStart(9) + "  " + p.name);
  if (sub.length > 1) fs.rmSync(big.file);
}

// самопроверка: склеить обратно в исходном порядке и сверить хеш
const order = [...parts].sort((a, b) => (a.file < b.file ? -1 : 1));
const rebuilt = order.map((p) => fs.readFileSync(p.file, "utf8")).join("");
rep.push("");
rep.push("хеш исходника: " + hash(src));
rep.push("хеш склейки:   " + hash(rebuilt));
rep.push(hash(src) === hash(rebuilt) ? "разбор без потерь" : "РАСХОЖДЕНИЕ — разбор неверен");

fs.writeFileSync(path.join(A, "MAP.md"), "# Карта проекта\n\n" + rep.join("\n") + "\n");
fs.writeFileSync(path.join(A, "REPORT2.txt"), rep.join("\n"));
console.log(rep.join("\n"));