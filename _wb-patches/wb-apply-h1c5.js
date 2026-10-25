// wb-apply-h1c5.js — id ребёнка вычищается из чужих комнат
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
if (has(a, "cids.indexOf(v) < 0")) console.log("= уже есть");
else {
  a = rep(a, "            var locs = Object.assign({}, g.locations || {}), occ = {};",
    "            var cids = kids.map(function(c) { return c.id; });\n            var locs = Object.assign({}, g.locations || {}), occ = {};",
    "список id детей");
  a = rep(a, "var f = o.filter(function(v) { return pids.indexOf(v) < 0; });",
    "var f = o.filter(function(v) { return pids.indexOf(v) < 0 && cids.indexOf(v) < 0; });",
    "чистка id из чужих комнат");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1c: комнату чистят от id")) console.log("= маркер есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1c: персонаж не вылетает из комнаты"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else { lines.splice(i + 1, 0, '  ["H1c: комнату чистят от id", "cids.indexOf(v) < 0", 1],'); wr(V, lines.join("\n")); console.log("  + маркер"); }
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");