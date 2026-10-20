#!/usr/bin/env node
"use strict";
const fs = require("fs");

const src = fs.readFileSync("wayward-bridge.js", "utf8");
const pats = ["EventSource", "onerror", "onopen", "onmessage", 'addEventListener("state"', "setInterval(", 'api("GET"', "/bridge/api/state"];
const out = [];

for (const p of pats) {
  let i = -1, n = 0;
  while ((i = src.indexOf(p, i + 1)) >= 0 && n < 8) {
    n++;
    out.push("========== " + p + "  @" + i + " ==========");
    out.push(src.slice(Math.max(0, i - 450), i + 750));
    out.push("");
  }
}

fs.writeFileSync("wb-dump7.txt", out.join("\n"));
console.log("wb-dump7.txt готов, " + out.join("\n").length + " символов");