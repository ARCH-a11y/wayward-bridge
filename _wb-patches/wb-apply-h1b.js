// wb-apply-h1b.js — H1b: родня сама, уборка сирот, кнопка без гейта; H2: своя запись ребёнка
const fs = require("fs");
const vm = require("vm");
const A = "src/019-src_server_assets.generated.js";
const S = "src/025-src_server_childstate.js";
const V = "wb-verify.js";
const T = "wb-test.js";
let bad = false;
function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.writeFileSync(p, s, "utf8"); }
function has(s, x) { return s.indexOf(x) >= 0; }
function rep(src, from, to, label, count) {
  const n = src.split(from).length - 1;
  if (n === 0) { console.log("  !! нет якоря: " + label); bad = true; return src; }
  if (count && n !== count) { console.log("  !! якорь " + label + ": " + n + " вхождений, ждали " + count); bad = true; return src; }
  console.log("  + " + label + " (" + n + ")");
  return src.split(from).join(to);
}
function repl(src, re, to, label) {
  if (!re.test(src)) { console.log("  !! нет совпадения: " + label); bad = true; return src; }
  console.log("  + " + label);
  return src.replace(re, to);
}

const H2_FNS = `        // H2: у ребёнка своя запись, а не копия жены
        var CHILD_MULT = { infant: 0, child: 0.35, teen: 0.7, youth: 1 };
        var CHILD_ATTRS = ["strength", "deftness", "vigor", "wit", "composure", "charm", "honesty", "libido", "loyalty", "openness", "confidence"];
        function childSig(c) {
          return (c.stage || "") + "|" + (c.sex || "") + "|" + (c.lookText || "") + "|" + (c.movedOut ? 1 : 0);
        }
        function childRecord(c, tmpl, prev) {
          var ch = JSON.parse(JSON.stringify(tmpl));
          ch.id = c.id;
          ch.name = c.name || (c.sex === "f" ? "Дочь" : "Сын");
          ch.archetypeId = "";
          ch.generatedArchetype = { id: "wbchild_" + c.id, shortname: "wbchild_" + c.id, name: ch.name, imageBase: childImageBase(c), imageNegative: "" };
          ch.outfit = "modest";
          ch.currentTask = "idle";
          ch.busyUntilSlot = 0;
          ch.wbChild = true;
          ch.wbSig = childSig(c);
          var m = CHILD_MULT[c.stage];
          if (m == null) m = 0.35;
          var seed = 0, i;
          for (i = 0; i < c.id.length; i++) seed = (seed * 31 + c.id.charCodeAt(i)) % 997;
          ch.attributes = {};
          CHILD_ATTRS.forEach(function(a, k) {
            ch.attributes[a] = m <= 0 ? 0 : Math.round(m * (40 + ((seed + k * 37) % 21)));
          });
          ch.stats = { energy: 100, mood: 60, arousal: m <= 0 ? 0 : 10 };
          ch.selfConcept = { openness: m <= 0 ? 0 : Math.round(50 * m), confidence: m <= 0 ? 0 : Math.round(50 * m) };
          ch.traitsAtGeneration = { openness: 50, confidence: 50 };
          ch.growthRates = { openness: { increase: 1, decrease: 1 }, confidence: { increase: 1, decrease: 1 } };
          ch.lean = "custom";
          ch.leanMix = {};
          ch.picks = {};
          ch.skills = { hunting: 0, foraging: 0, brewing: 0, cooking: 0, serving: 0 };
          ch.feelings = [];
          ch.notedMoments = [];
          ch.latentTraits = [];
          ch.noticedLatentTraits = [];
          ch.affinities = { romantic: 1, oral: 1, vaginal: 1, anal: 1, breast: 1, exhibition: 1, dominance: 1, prostitution: 1, drinking: 0, taboo: 1 };
          ch.latitude = { byCategory: {} };
          ch.intoxication = { level: 0, drinksToday: 0, peakToday: 0, tolerance: 0 };
          ch.volatility = 0.5;
          ch.annoyance = 0;
          ch.relationship = { trust: 100, patronInteractionsEncouraged: 0 };
          if (prev && prev.wbSig) {
            if (prev.stats) ch.stats = prev.stats;
            if (prev.feelings) ch.feelings = prev.feelings;
            if (prev.notedMoments) ch.notedMoments = prev.notedMoments;
            if (prev.relationship) ch.relationship = prev.relationship;
            if (prev.intoxication) ch.intoxication = prev.intoxication;
          }
          return ch;
        }
`;

const KIN_FNS = `        // H1b: родня ребёнку создаётся сама, без кнопки
        var kinBusy = {};
        function ensureChildKin(pt) {
          var s = window.__WB_STORE__;
          if (!s || !s.getState) return;
          var cs = S.st && S.st.childstate;
          if (!cs || !(cs.children || []).length) return;
          var g = s.getState().state || {};
          var her = g.primaryCharacterId;
          if (!her) return;
          var have = {};
          ((g.circles && g.circles[her] && g.circles[her].persons) || []).forEach(function(p) { have[p.id] = 1; });
          var need = (cs.children || []).filter(function(c) { return !have["wb" + c.id] && !kinBusy[c.id]; });
          if (!need.length) return;
          need.forEach(function(c) {
            kinBusy[c.id] = 1;
            setTimeout(function() { delete kinBusy[c.id]; }, 2500);
            promoteChild(c, pt, true);
          });
        }
        // H1b: персонаж wbchild_ без ребёнка (удалён или приехал из старого сейва) убирается целиком
        function pruneChildCharacters() {
          var s = window.__WB_STORE__;
          if (!s || !s.getState) return;
          var cs = S.st && S.st.childstate;
          var live = {};
          ((cs && cs.children) || []).forEach(function(c) { live[c.id] = 1; });
          var g = s.getState().state || {};
          var her = g.primaryCharacterId;
          var chars = g.characters || {};
          function stalePid(pid) {
            if (typeof pid !== "string" || pid.indexOf("wb") !== 0) return false;
            return !live[pid.slice(2)];
          }
          function staleOcc(v) {
            if (typeof v !== "string" || v.indexOf("person:") !== 0) return false;
            return stalePid(v.slice(7));
          }
          var dead = Object.keys(chars).filter(function(k) { return chars[k] && chars[k].wbChild === true && !live[k]; });
          var stalePeople = (g.visitingPeople || []).filter(function(e) { return stalePid(e.personId); });
          var staleCirc = !!(her && g.circles && g.circles[her] && (g.circles[her].persons || []).some(function(p) { return stalePid(p.id); }));
          if (!dead.length && !stalePeople.length && !staleCirc) return;
          s.setState(function(x) {
            var gg = x.state || {}, st = {};
            for (var k in gg) st[k] = gg[k];
            if (dead.length) {
              var ch = Object.assign({}, gg.characters || {});
              dead.forEach(function(k2) { delete ch[k2]; });
              st.characters = ch;
            }
            st.visitingPeople = (gg.visitingPeople || []).filter(function(e) { return !stalePid(e.personId); });
            if (gg.locations) {
              var locs = {};
              Object.keys(gg.locations).forEach(function(k3) {
                var o = (gg.locations[k3] && gg.locations[k3].occupants) || [];
                locs[k3] = Object.assign({}, gg.locations[k3], { occupants: o.filter(function(v) { return !staleOcc(v); }) });
              });
              st.locations = locs;
            }
            if (her && gg.circles && gg.circles[her]) {
              var c1 = gg.circles[her], cc = Object.assign({}, gg.circles);
              cc[her] = Object.assign({}, c1, {
                persons: (c1.persons || []).filter(function(p) { return !stalePid(p.id); }),
                links: (c1.links || []).filter(function(l) { return !staleOcc(l.to) && !staleOcc(l.from); })
              });
              st.circles = cc;
            }
            return { state: st };
          });
        }
`;

console.log("== 1. H2: своя запись ребёнка ==");
let a = rd(A);
if (has(a, "function childRecord(")) console.log("  = уже есть");
else {
  a = rep(a, "        function syncChildCharacter() {", H2_FNS + "        function syncChildCharacter() {", "вставка childRecord/childSig");
  a = repl(a, /if \(chars\[c\.id\]\) return;[\s\S]*?ch\.wbChild = true;/,
    "var ch = childRecord(c, tmpl, chars[c.id]);", "клон -> childRecord");
  a = rep(a, "(cs.children || []).filter(function(c) { return !g0.characters || !g0.characters[c.id]; });",
    "(cs.children || []).filter(function(c) { var ex = g0.characters && g0.characters[c.id]; return !ex || ex.wbSig !== childSig(c); });",
    "пересборка при смене стадии");
}

console.log("== 2. H1b: автосоздание родни и уборка ==");
if (has(a, "function ensureChildKin(")) console.log("  = уже есть");
else {
  a = rep(a, "        function checkDay() {", KIN_FNS + "        function checkDay() {", "вставка ensureChildKin/prune");
  a = rep(a, "            loadChildFromSave(pt);\n            mirrorChild();\n            syncChildHome();\n            syncChildCharacter();\n            checkBelly();",
    "            loadChildFromSave(pt);\n            mirrorChild();\n            pruneChildCharacters();\n            syncChildCharacter();\n            ensureChildKin(pt);\n            syncChildHome();\n            checkBelly();",
    "порядок в checkDay");
}

console.log("== 3. H1b: кнопка без гейта по стадии ==");
a = rep(a, "        function promoteChild(c, pt) {", "        function promoteChild(c, pt, quiet) {", "тихий режим promote");
a = rep(a, "              syncChildHome(true);\n              syncChildCharacter();\n",
  "              syncChildHome(true);\n              syncChildCharacter();\n              if (quiet) return;\n", "выход без say/render");
a = rep(a, '(c.stage === "teen" || c.stage === "youth") ? h("button", ', 'h("button", ', "снятие гейта");
a = rep(a, ') : null, c.promoted ? h("button"', '), c.promoted ? h("button"', "склейка тернарника");
wr(A, a);

console.log("== 4. H2: regard ребёнка у человека ==");
let s = rd(S);
s = rep(s, "        presence: 0.6,\n        regard: 0.6,", "        presence: 0.6,\n        regard: 0.1,", "regard 0.6 -> 0.1");
wr(S, s);

console.log("== 5. маркеры ==");
let v = rd(V);
if (has(v, "H1b: автосоздание родни")) console.log("  = уже есть");
else {
  const anc = '"delete chars[c.id];", 1],';
  const add = ["  [\"H1b: автосоздание родни\", \"function ensureChildKin(pt)\", 1],",
               "  [\"H1b: уборка сирот\", \"function pruneChildCharacters()\", 1],",
               "  [\"H1b: зов из checkDay\", \"ensureChildKin(pt);\", 1],",
               "  [\"H1b: кнопка без гейта\", \"), c.promoted ? h(\", 1],",
               "  [\"H1b: защита от повторов\", \"kinBusy[c.id]\", 2],",
               "  [\"H2: своя запись ребёнка\", \"function childRecord(c, tmpl, prev)\", 1],",
               "  [\"H2: метка стадии\", \"function childSig(c)\", 1],",
               "  [\"H2: атрибуты заперты\", \"m <= 0 ? 0 :\", 1],",
               "  [\"H2: пустые чувства\", \"ch.latentTraits = [];\", 1],",
               "  [\"H2: regard ребёнка\", \"regard: 0.1,\", 1],"].join("\n");
  v = rep(v, anc, anc + "\n" + add, "вставка маркеров");
  wr(V, v);
}

console.log("== 6. тесты ==");
let t = rd(T);
let rl = 0;
t = t.split("\n").map(function(l) { if (l.indexOf("regard") >= 0 && l.indexOf("0.6") >= 0) { rl++; return l.split("0.6").join("0.1"); } return l; }).join("\n");
if (rl) console.log("  + тест: regard 0.6 -> 0.1 (" + rl + ")");
if (has(t, "H1b: promote младенца")) console.log("  = уже есть");
else {
  const anc2 = 'safe(h1p.json, ["person", "lives"]) === "home");';
  const add2 = ["  ok(\"H1b: promote младенца даёт родню\", !!(h1p.json.person && h1p.json.person.id === \"wb\" + h1kid.id));",
                "  ok(\"H1b: ребро parent_of на младенце\", h1p.json.link.kind === \"parent_of\" && h1p.json.link.from.indexOf(\"char:\") === 0);",
                "  ok(\"H2: regard ребёнка низкий\", h1p.json.person.regard <= 0.11);"].join("\n");
  t = rep(t, anc2, anc2 + "\n" + add2, "вставка тестов");
}
wr(T, t);

console.log("== синтаксис ==");
if (!bad) {
  [A, S].forEach(function(p) {
    try { new vm.Script(rd(p)); console.log("  ок: " + p); }
    catch (e) { console.log("  !! " + p + ": " + e.message); bad = true; }
  });
}
console.log(bad ? "\nПРЕРВАНО — смотри !! выше." : "\nГОТОВО.");