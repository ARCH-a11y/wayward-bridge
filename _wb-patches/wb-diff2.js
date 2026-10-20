#!/usr/bin/env node
"use strict";
const fs = require("fs");

const a = fs.readFileSync("wayward-bridge.new.js", "utf8").split("\n");
const b = fs.readFileSync("wayward-bridge.js", "utf8").split("\n");

let k = 0;
while (k < a.length && k < b.length && a[k] === b[k]) k++;
const d = a.length - b.length;
console.log("первое расхождение: строка " + k + ", сдвиг: " + d);

let bad = 0;
for (let i = k; i < b.length; i++) {
  if (a[i + d] !== b[i]) {
    bad++;
    if (bad <= 6) console.log("  ещё @" + i + ": " + JSON.stringify((b[i] || "").slice(0, 110)));
  }
}
console.log("расхождений помимо сдвига: " + bad);