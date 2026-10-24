// wb-apply-h1c.js — ребёнок в своей комнате как персонаж, без двойной строки
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

const KIN = `        // H1c: родство для строки ребёнка в панели
        window.__WB_KINLABEL__ = function(id) {
          var cs = S.st && S.st.childstate;
          var c = ((cs && cs.children) || []).filter(function(x) { return x.id === id; })[0];
          if (!c) return "";
          return c.sex === "m" ? "her son" : "her daughter";
        };
`;

let a = rd(A);
if (has(a, "__WB_KINLABEL__")) console.log("= уже есть");
else {
  a = rep(a, "        var kinBusy = {};", KIN + "        var kinBusy = {};", "метка родства");
  a = rep(a, "              occ[room] = base.filter(function(v) { return pids.indexOf(v) < 0; }).concat([pid]);",
    "              occ[room] = base.filter(function(v) { return pids.indexOf(v) < 0 && v !== c.id; }).concat([pid, c.id]);",
    "ребёнок занимает комнату как персонаж");
  a = rep(a, "return n?n.persons.filter(i=>s.has(cp(i))):[]",
    "return n?n.persons.filter(i=>s.has(cp(i))&&!(i.wbChild&&s.has(i.id.slice(2)))):[]",
    "человек не дублирует персонажа");
  a = rep(a, "truncate max-w-[10rem] ${i.text}`,children:t.name})",
    "truncate max-w-[10rem] ${i.text}`,children:t.wbChild&&window.__WB_KINLABEL__?t.name+\" · \"+window.__WB_KINLABEL__(e):t.name})",
    "родство в строке");
  a = rep(a, "occupants: (o || []).filter(function(v) { return v !== pid; })",
    "occupants: (o || []).filter(function(v) { return v !== pid && v !== c.id; })",
    "уборка комнаты при удалении");
  a = rep(a, "occupants: o.filter(function(v) { return !staleOcc(v); })",
    "occupants: o.filter(function(v) { return !staleOcc(v) && dead.indexOf(v) < 0; })",
    "уборка комнаты у сирот");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1c: ребёнок в своей комнате")) console.log("= маркеры уже есть");
else {
  const anc = '"function normalizeChildPerson()", 1],';
  const add = ["  [\"H1c: ребёнок в своей комнате\", \"concat([pid, c.id])\", 1],",
               "  [\"H1c: нет двойной строки\", \"!(i.wbChild&&s.has(i.id.slice(2)))\", 1],",
               "  [\"H1c: родство в строке\", \"__WB_KINLABEL__\", 2],",
               "  [\"H1c: уборка комнаты\", \"v !== pid && v !== c.id\", 1]"].join("\n");
  v = rep(v, anc, anc + "\n" + add, "маркеры");
  wr(V, v);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");