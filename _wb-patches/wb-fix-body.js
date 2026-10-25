"use strict";
const fs = require("fs"), path = require("path");
const v = fs.readFileSync(path.join(__dirname, "wb-verify.js"), "utf8");
if (!v.includes("G3 BODY_PARTS: запятая")) {
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  fs.writeFileSync(path.join(__dirname, "wb-verify.js"),
    v.replace(mm[1], mm[1] + '  ["G3 BODY_PARTS: запятая", "\\"Разное\\"], [\\"belly\\"", 1],\n'), "utf8");
  console.log("маркер добавлен");
}
