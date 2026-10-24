// wb-apply-h1d.js — карточка: переключение на ребёнка
const fs = require("fs"), vm = require("vm");
const G = "src/016-src_server_game.js";
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

const R1F = 'function _(e){const t=e.characters[e.primaryCharacterId];';
const R1T = 'function _(e){const t=(window.__WB_CARD__&&e.characters[window.__WB_CARD__])||e.characters[e.primaryCharacterId];';
const R2F = '[i,l]=Z.useState(null),h=ae(E=>E.state),d=_(h),';
const R2T = '[i,l]=Z.useState(null),[cardSel,setCard]=Z.useState(window.__WB_CARD__||""),h=ae(E=>E.state),d=_(h),';
const R3F = 'const $=u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"';
const PRE = 'const __wbKids=(window.__WB_KIDS__&&window.__WB_KIDS__())||[],__wbCard=function(lbl,id){return u.jsx("button",{type:"button",className:"px-1.5 py-0.5 rounded border text-[0.65rem] "+(cardSel===id?"border-amber-600 bg-amber-900/40 text-amber-200":"border-stone-700 text-stone-400 hover:text-stone-200"),onClick:function(){window.__WB_CARD__=id;setCard(id);},children:lbl},id||"wife")};';
const SW = '__wbKids.length?u.jsx("div",{className:"flex flex-wrap gap-1 mb-2",children:[__wbCard(h.characters[h.primaryCharacterId].name,"")].concat(__wbKids.map(function(c){return __wbCard(c.name,c.id)}))}):null,';
const R3T = PRE + ' const $=u.jsxs(u.Fragment,{children:[' + SW + 'u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"';

const KIDS = `        window.__WB_KIDS__ = function() {
          var cs = S.st && S.st.childstate;
          return ((cs && cs.children) || []).map(function(c) { return { id: c.id, name: c.name || (c.sex === "m" ? "Сын" : "Дочь"), stage: c.stage }; });
        };
`;

let g = rd(G);
if (has(g, "window.__WB_CARD__&&e.characters")) console.log("= уже есть");
else {
  const qd = "          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}')";
  const add = "\n          .replace('" + R1F + "', '" + R1T + "')" +
              "\n          .replace('" + R2F + "', '" + R2T + "')" +
              "\n          .replace('" + R3F + "', '" + R3T + "')";
  const semi = has(g, qd + ";");
  g = rep(g, semi ? qd + ";" : qd, semi ? qd + add + ";" : qd + add, "карточка: выбор персонажа");
  wr(G, g);
}

let a = rd(A);
if (has(a, "window.__WB_KIDS__ = function")) console.log("= список детей уже есть");
else {
  a = rep(a, "        window.__WB_KINLABEL__ = function(id) {", KIDS + "        window.__WB_KINLABEL__ = function(id) {", "список детей наружу");
  wr(A, a);
}

let v = rd(V);
if (has(v, "H1d: карточка уважает выбор")) console.log("= маркеры есть");
else {
  const lines = v.split("\n");
  const i = lines.findIndex(function(l) { return l.indexOf('"H1c: комнату чистят от id"') >= 0; });
  if (i < 0) { console.log("  !! нет маркера-якоря"); bad = true; }
  else {
    lines.splice(i + 1, 0,
      '  ["H1d: карточка уважает выбор", "window.__WB_CARD__&&e.characters[window.__WB_CARD__]", 1],',
      '  ["H1d: переключатель персонажей", "__wbCard(h.characters", 1],',
      '  ["H1d: список детей наружу", "window.__WB_KIDS__ = function", 1],');
    wr(V, lines.join("\n"));
    console.log("  + маркеры");
  }
}

console.log("== синтаксис ==");
[G, A].forEach(function(p) {
  try { new vm.Script(rd(p)); console.log("  ок: " + p); } catch (e) { console.log("  !! " + p + ": " + e.message); bad = true; }
});
console.log(bad ? "\nПРЕРВАНО." : "\nГОТОВО.");