// wb-apply-h1f.js — ловушка на исчезновение жены
const fs = require("fs"), vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const V = "wb-verify.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label, count) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  if (count && n !== count) { console.log("  !! " + label + ": " + n + ", ждали " + count); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}

let a = rd(A);
if (has(a, "жена пропала")) console.log("= уже есть");
else {
  a = rep(a, "        var kinBusy = {};", "        var lastChars = \"\", lastWifeBad = 0;\n        var kinBusy = {};", "переменные ловушки");
  a = rep(a, "            loadChildFromSave(pt);",
    "            var __ks = Object.keys(g.characters || {}).join(\",\");\n" +
    "            if (__ks !== lastChars) { lastChars = __ks; if (__ks && __ks.indexOf(\"wife\") < 0) console.warn(\"[wb] жена пропала. characters =\", __ks, (new Error()).stack); }\n" +
    "            var __w = g.characters && g.characters[g.primaryCharacterId];\n" +
    "            if (__w && !lastWifeBad && (__w.wbChild || __w.wbSig)) { lastWifeBad = 1; console.warn(\"[wb] у жены появились служебные поля:\", Object.keys(__w).filter(function(k) { return /^wb/.test(k); }), (new Error()).stack); }\n" +
    "            loadChildFromSave(pt);", "ловушка в checkDay");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1f: ловушка на жену")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1e: запись жены не теряется"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1f: ловушка на жену", "жена пропала", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");