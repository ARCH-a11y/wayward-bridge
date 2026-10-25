// wb-apply-h1k.js — лог: под каким ключом пишется клон
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
if (has(a, "[wb] клон под ключом")) console.log("= уже есть");
else {
  a = rep(a, "              var ch = childRecord(c, tmpl, chars[c.id]);",
    "              var __tag = c.id + \"|\" + her; window.wbSeen = window.wbSeen || {};\n" +
    "              if (!window.wbSeen[__tag]) { window.wbSeen[__tag] = 1; console.warn(\"[wb] клон под ключом:\", __tag, \"| children:\", (cs.children || []).map(function(x) { return x.id; }).join(\",\")); }\n" +
    "              var ch = childRecord(c, tmpl, chars[c.id]);", "лог клона");
  wr(A, a);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");