// wb-apply-h1l.js — ловушка: чужой id в записи жены
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
if (has(a, "[wb] чужой id")) console.log("= уже есть");
else {
  a = rep(a, '        var lastChars = "", lastWifeBad = 0;', '        var lastChars = "", lastWifeBad = 0, lastWifeId = "";', "переменная");
  a = rep(a, '            if (__ks !== lastChars) { lastChars = __ks; console.warn("[wb] characters:", __ks); }',
    '            if (__ks !== lastChars) { lastChars = __ks; console.warn("[wb] characters:", __ks); }\n' +
    '            var __wid = g.characters && g.characters.wife ? g.characters.wife.id : "";\n' +
    '            if (__wid !== lastWifeId) { lastWifeId = __wid; console.warn("[wb] чужой id у жены:", __wid, (new Error()).stack); }', "ловушка на id");
  a = rep(a, '          ch.wbChild = true;', '          if (c.id === "wife") console.warn("[wb] childRecord под ключом wife");\n          ch.wbChild = true;', "лог childRecord");
  wr(A, a);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");