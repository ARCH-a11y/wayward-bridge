#!/usr/bin/env node
"use strict";
const fs = require("fs");

const f = "wayward-bridge.new.js";
let s = fs.readFileSync(f, "utf8");
const before = s.length;

s = s.replace(/(el\.style\.cssText = "[^"]*";)(\s*\n\s*)\1/, "$1");
s = s.replace(/(if \(!el\.getBoundingClientRect\(\)\.height\)[^\n]*;)(\s*\n\s*)\1/, "$1");

fs.writeFileSync(f, s);
console.log("было " + before + ", стало " + s.length + ", убрано " + (before - s.length) + " символов");