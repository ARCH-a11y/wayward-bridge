// wb-apply-h1m.js — keepWife не доверяет чужой записи
const fs = require("fs"), vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}

let a = rd(A);
if (has(a, "w.id === her")) console.log("= уже есть");
else {
  a = rep(a, "          var w = g.characters[her];\n          if (w) { wifeBak = JSON.stringify(w); return; }",
    "          var w = g.characters[her];\n          if (w && w.id === her) { wifeBak = JSON.stringify(w); return; }\n          if (w) return;", "бэкап только от своей записи");
  a = rep(a, "            chars[her] = JSON.parse(wifeBak);",
    "            var wb2 = JSON.parse(wifeBak);\n            wb2.id = her;\n            chars[her] = wb2;", "при восстановлении id свой");
  wr(A, a);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");