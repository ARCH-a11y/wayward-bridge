// wb-diag.js — что реально в сборке и как отдаётся меню
const fs = require("fs");
const b = fs.readFileSync("wayward-bridge.js", "utf8");

console.log("== 1. есть ли новые куски в сборке ==");
["function checkBelly()", "function mirrorChild()", "function loadChildFromSave(pt)", "function syncChildHome(force)",
 "st.wbChild = cs;", "__WB_PACK_RESET__", "checkBelly();", "loadChildFromSave(pt);", "mirrorChild();", "syncChildHome();"
].forEach(function (t) {
  const n = b.split(t).length - 1;
  console.log((n ? "  ok  " : "  НЕТ ") + n + " ×  " + t);
});

console.log("\n== 2. checkDay целиком ==");
const i = b.indexOf("function checkDay()");
console.log(i < 0 ? "НЕ НАЙДЕНА" : b.slice(i, i + 2800));

console.log("\n== 3. как отдаётся меню (версия в URL) ==");
["menuUrl", "?v=", "VERSION", "menu.js"].forEach(function (t) {
  const L = b.split(/\r?\n/);
  L.forEach(function (l, k) { if (l.indexOf(t) >= 0 && l.length < 200) console.log(String(k + 1).padStart(6) + ": " + l.trim()); });
  console.log("  --- " + t);
});