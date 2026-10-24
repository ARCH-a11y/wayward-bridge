// wb-apply-h1j.js — правка двух маркеров
const fs = require("fs");
const V = "wb-verify.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }

const lines = rd(V).split("\n");

let i = lines.findIndex(function(l) { return l.indexOf('"H1f: ловушка на жену"') >= 0; });
if (i < 0) { console.log("  !! нет маркера H1f"); bad = true; }
else if (lines[i].indexOf("жена пропала") < 0) console.log("= H1f уже правлен");
else { lines[i] = lines[i].split('"жена пропала"').join('"lastChars"'); console.log("  + H1f: подстрока -> lastChars"); }

let j = lines.findIndex(function(l) { return l.indexOf('"H1i: жена не сирота"') >= 0; });
if (j < 0) { console.log("  !! нет маркера H1i"); bad = true; }
else if (lines[j].indexOf("k !== her && chars[k].wbChild") < 0) console.log("= H1i уже правлен");
else { lines[j] = lines[j].split("k !== her && chars[k].wbChild").join("k !== her && chars[k] &&"); console.log("  + H1i: подстрока укорочена"); }

if (!bad) wr(V, lines.join("\n"));
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");