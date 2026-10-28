const fs=require("fs");
const i="src/024-src_server_index.js";
let srv=fs.readFileSync(i,"utf8");
const g="src/016-src_server_game.js";
let s=fs.readFileSync(g,"utf8");
function sub(str,a,b,label){
  if(!str.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  return str.replace(a,b);
}
srv=sub(srv,"    async function partPreview(b) {",[
'    function resolveHeroine(id) {',
'      const want = String(id || "").trim();',
'      if (want) {',
'        const list = ((store.effective(want).prompts || {}).heroines || {});',
'        if (list[want]) return want;',
'      }',
'      return currentHeroine();',
'    }',
'    async function partPreview(b) {'
].join("\n"),"resolveHeroine");
srv=sub(srv,"      const heroine = String(b && b.heroine || currentHeroine());","      const heroine = resolveHeroine(b && b.heroine);","героиня превью");
srv=sub(srv,"const h = String(b && b.heroine || currentHeroine());","const h = resolveHeroine(b && b.heroine);","героиня частей");
fs.writeFileSync(i,srv);
console.log("ok сервер");
s=sub(s,"function wbPFill(el){","function wbPFill(el,hero){","сигнатура fill");
s=sub(s,"  wbPStyle(); var hero=wbPHero(); el.textContent=\"\";","  wbPStyle(); el.textContent=\"\";","hero из аргумента");
s=sub(s,".then(function(j){ var p=(j&&j.parts)||{}; WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(hero,x[0],x[1],p[x[0]])); }); })",
".then(function(j){ var p=(j&&j.parts)||{}; var real=String((j&&j.heroine)||hero||\"\"); WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(real,x[0],x[1],p[x[0]])); }); })","настоящий id");
s=sub(s,[
'function WBBody(){',
'  var h=wbPHero();',
'  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el); } }});'
].join("\n"),[
'function WBBody(props){',
'  var h=String((props&&props.hero)||wbPHero()||"");',
'  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el,h); } }});'
].join("\n"),"пропс hero");
s=sub(s,'n==="body"&&u.jsx(WBBody,{})','n==="body"&&u.jsx(WBBody,{hero:cardSel})',"ветка с hero");
fs.writeFileSync(g,s);
console.log("ok клиент");
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
const add='  ["Превью: id героини разрешается", "function resolveHeroine(id)", 1],\n';
const k=vs.lastIndexOf("\n];");
vs=vs.slice(0,k+1)+add+vs.slice(k+1);
fs.writeFileSync(v,vs);
console.log("ok verify +1");