#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patched4.js";
const REPORT = "wb-patch4-report.txt";

const RATINGS_NEW = `var Ratings = class {
  constructor(dataDir) {
    this.file = path.join(dataDir, "ratings.jsonl");
    this.cache = null;
    this.pending = 0;
  }
  all() {
    if (this.cache) return this.cache;
    let text = "";
    try {
      text = fs.readFileSync(this.file, "utf8");
    } catch (_) {
      return this.cache = [];
    }
    const out = [];
    for (const l of text.split("\\n").slice(-3e3)) {
      if (!l.trim()) continue;
      try {
        out.push(JSON.parse(l));
      } catch (_) {
      }
    }
    return this.cache = out;
  }
  add(verdict, key, prompt2, negative, file) {
    if (!prompt2) return;
    const all = this.all();
    if (file && all.some((r) => r.file === file && r.verdict === verdict)) return;
    const rec = { at: Date.now(), verdict, key: String(key || ""), file: String(file || ""), prompt: String(prompt2), negative: String(negative || "") };
    all.push(rec);
    if (all.length > 3e3) all.splice(0, all.length - 3e3);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(rec) + "\\n");
      if (++this.pending >= 2e3) this.compact();
    } catch (_) {
    }
  }
  compact() {
    try {
      const keep = this.all().map((r) => JSON.stringify(r)).join("\\n") + "\\n";
      const tmp = this.file + ".tmp";
      fs.writeFileSync(tmp, keep);
      fs.renameSync(tmp, this.file);
      this.pending = 0;
    } catch (_) {
    }
  }
  counts() {
    const a = this.all();
    return { good: a.filter((r) => r.verdict === "good").length, bad: a.filter((r) => r.verdict === "bad").length };
  }
};
    function suggestions(`;

const PATCHES = [
  { id: "B43-B44-ratings",
    why: "Ratings не читает файл на каждую оценку и не растёт бесконечно",
    find: 'var Ratings = class \\{[\\s\\S]*?\\n    \\};\\n    function suggestions\\(',
    replace: RATINGS_NEW,
    probe: 'class Ratings' },

  { id: "B10a-upscaler-live",
    why: "опция upscaler перестаёт быть мёртвой",
    find: 'upscaler: "",\\s*\\n\\s*// the 2\\.0 upscaler option became the hi-res fix',
    replace: 'upscaler: pick(f.upscaler, ""),\n        // the 2.0 upscaler option became the hi-res fix',
    probe: 'the 2\\.0 upscaler option' },

  { id: "B10b-upscaler-no-clobber",
    why: "апскейлер не затирает результат хайрез-фикса",
    find: 'if \\(p\\.upscaler && !args\\.portrait\\) \\{',
    replace: 'if (p.upscaler && !args.portrait && !(typeof g !== "undefined" && g && g["70"]) && !(typeof graph !== "undefined" && graph && graph["70"])) {',
    probe: 'p\\.upscaler &&' },
];

let src;
try { src = fs.readFileSync(FILE, "utf8"); }
catch (e) { console.error("Не нашёл " + FILE); process.exit(1); }

const log = [];
let out = src, ok = 0, miss = 0;

for (const p of PATCHES) {
  const re = new RegExp(p.find, "g");
  const hits = out.match(re) || [];
  if (hits.length === 1) {
    out = out.replace(re, p.replace);
    ok++;
    log.push("OK    " + p.id + "  — " + p.why);
  } else {
    miss++;
    log.push("MISS  " + p.id + "  (совпадений: " + hits.length + ")  — " + p.why);
    const m = new RegExp(p.probe, "g").exec(src);
    if (m) log.push("      контекст: " + JSON.stringify(src.slice(Math.max(0, m.index - 400), m.index + 400)));
    log.push("");
  }
}

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Применено: " + ok + ", не найдено: " + miss);

const anchors = ["!args.portrait", "p.upscaler", "autoDelete"];
const d = [];
for (const a of anchors) {
  const i = out.indexOf(a);
  d.push("========== " + a + " @ " + i + " ==========");
  d.push(i < 0 ? "(не найдено)" : out.slice(Math.max(0, i - 300), i + 1100));
  d.push("");
}
fs.writeFileSync("wb-dump4.txt", d.join("\n"));
console.log("wb-dump4.txt готов");