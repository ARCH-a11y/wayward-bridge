"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const TF = "wb-test.js";
let t = rd(TF);

const start = "  // --- F1: childstate tick ---\n";
const i = t.indexOf(start);
if (i < 0) { console.log("блок не найден"); process.exit(1); }

const after = '  console.log("");\n  console.log("PASS: ';
const j = t.indexOf(after);
if (j < 0 || j < i) { console.log("хвост не найден"); process.exit(1); }

const block = t.slice(i, j);
t = t.slice(0, i) + t.slice(j);

const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
if (!t.includes(kill)) { console.log("финальный c.kill не найден"); process.exit(1); }
t = t.replace(kill, block + kill);

wr(TF, t);
console.log("тест: блок перенесён перед финальным c.kill()");
