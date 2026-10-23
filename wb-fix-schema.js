"use strict";
const fs = require("fs"), path = require("path");
const p = "src/001-src_server_schema.js";
let s = fs.readFileSync(path.join(__dirname, p), "utf8");
const a = "      postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) }\n    };";
const b = "      postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) },\n      lastBirth: { day: num(0, 1e9), outcome: str(), count: num(0, 10) }\n    };";
if (s.includes("lastBirth: { day: num(0, 1e9)")) console.log("уже есть");
else if (!s.includes(a)) console.log("НЕ НАЙДЕН anchor");
else { fs.writeFileSync(path.join(__dirname, p), s.replace(a, b), "utf8"); console.log("ок"); }
