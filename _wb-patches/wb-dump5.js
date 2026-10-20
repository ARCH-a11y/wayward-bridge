#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const src = fs.readFileSync(FILE, "utf8");

const anchors = [
  "patch(ops",
  "function clean(node",
  "store.patch(",
  '"/bridge/api/settings"',
  "function toast",
  "toast(",
  "notice",
  "setState(",
  "function api(",
  "api(",
  "S.st.revision",
];

const out = [];
for (const a of anchors) {
  const i = src.indexOf(a);
  out.push("========== " + a + "   @ " + i + " ==========");
  out.push(i < 0 ? "(не найдено)" : src.slice(Math.max(0, i - 600), i + 1600));
  out.push("");
}
fs.writeFileSync("wb-dump5.txt", out.join("\n"));
console.log("wb-dump5.txt готов, " + out.join("\n").length + " символов");