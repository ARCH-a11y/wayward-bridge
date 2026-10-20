#!/usr/bin/env node
"use strict";
const fs = require("fs");

const a = fs.readFileSync("wayward-bridge.new.js", "utf8").split("\n");
const b = fs.readFileSync("wayward-bridge.js", "utf8").split("\n");

console.log("строк: new=" + a.length + ", work=" + b.length);

let k = 0;
while (k < a.length && k < b.length && a[k] === b[k]) k++;
console.log("первое расхождение: строка " + k);
console.log("");

for (let t = k; t < Math.min(k + 10, a.length); t++) {
  console.log("new [" + t + "] " + JSON.stringify((a[t] || "").slice(0, 130)));
}
console.log("");
for (let t = k; t < Math.min(k + 10, b.length); t++) {
  console.log("work[" + t + "] " + JSON.stringify((b[t] || "").slice(0, 130)));
}