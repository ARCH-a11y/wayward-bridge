// wb-apply-h2b.js — у человека-ребёнка свои атрибуты и низкий regard
const fs = require("fs");
const vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const V = "wb-verify.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label, count) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  if (count && n !== count) { console.log("  !! якорь " + label + ": " + n + ", ждали " + count); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}

const FN = `        // H2b: у человека-ребёнка свои атрибуты и низкий regard, а не женины
        var CHILD_MULT2 = { infant: 0, child: 0.35, teen: 0.7, youth: 1 };
        var CHILD_ATTRS2 = ["strength", "deftness", "vigor", "wit", "composure", "charm", "honesty", "libido", "loyalty", "openness", "confidence"];
        function normalizeChildPerson() {
          var s = window.__WB_STORE__;
          if (!s || !s.getState) return;
          var cs = S.st && S.st.childstate;
          if (!cs) return;
          var g = s.getState().state || {};
          var her = g.primaryCharacterId;
          var cir = her && g.circles && g.circles[her];
          if (!cir || !(cir.persons || []).length) return;
          var stage = {};
          (cs.children || []).forEach(function(c) { stage["wb" + c.id] = c.stage; });
          var dirty = false;
          var persons = (cir.persons || []).map(function(p) {
            if (!p.wbChild || !stage[p.id]) return p;
            var st = stage[p.id];
            if (p.wbStage === st && p.regard === 0.1) return p;
            var m = CHILD_MULT2[st];
            if (m == null) m = 0.35;
            var np = Object.assign({}, p);
            np.wbStage = st;
            np.regard = 0.1;
            np.attributes = {};
            CHILD_ATTRS2.forEach(function(a) { np.attributes[a] = m <= 0 ? 0 : Math.round(m * 50); });
            dirty = true;
            return np;
          });
          if (!dirty) return;
          s.setState(function(x) {
            var gg = x.state || {}, cc = Object.assign({}, gg.circles || {});
            cc[her] = Object.assign({}, cir, { persons: persons });
            var out = {};
            for (var k in gg) out[k] = gg[k];
            out.circles = cc;
            return { state: out };
          });
        }
`;

let a = rd(A);
if (has(a, "function normalizeChildPerson(")) console.log("= уже есть");
else {
  a = rep(a, "        var kinBusy = {};", FN + "        var kinBusy = {};", "вставка normalizeChildPerson");
  a = rep(a, "            pruneChildCharacters();\n            syncChildCharacter();",
    "            pruneChildCharacters();\n            normalizeChildPerson();\n            syncChildCharacter();", "вызов в checkDay");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H2b: человек-ребёнок нормализован")) console.log("= маркер уже есть");
else {
  const anc = '"regard: 0.1,", 1],';
  v = rep(v, anc, anc + '\n  ["H2b: человек-ребёнок нормализован", "function normalizeChildPerson()", 1],', "маркер");
  wr(V, v);
}

console.log("== синтаксис ==");
try { new vm.Script(rd(A)); console.log("  ок"); } catch (e) { console.log("  !! " + e.message); bad = true; }
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");