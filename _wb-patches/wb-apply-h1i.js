// wb-apply-h1i.js — жена не считается сиротой
const fs = require("fs"), vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const V = "wb-verify.js";
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
if (has(a, "k !== her && chars[k].wbChild")) console.log("= уже есть");
else {
  a = rep(a, 'var dead = Object.keys(chars).filter(function(k) { return chars[k] && chars[k].wbChild === true && !live[k]; });',
    'var dead = Object.keys(chars).filter(function(k) { return k !== her && chars[k] && chars[k].wbChild === true && !live[k]; });',
    "жена вне сирот");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1i: жена не сирота")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1h: тихая ловушка"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1i: жена не сирота", "k !== her && chars[k].wbChild", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");