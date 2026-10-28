const fs=require("fs");
const g="src/016-src_server_game.js";
let s=fs.readFileSync(g,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub("function wbPFill(el){","function wbPFill(el,hero){","сигнатура fill");
sub("  wbPStyle(); var hero=wbPHero(); el.textContent=\"\";","  wbPStyle(); el.textContent=\"\";","hero из аргумента");
sub(".then(function(j){ var p=(j&&j.parts)||{}; WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(hero,x[0],x[1],p[x[0]])); }); })",
".then(function(j){ var p=(j&&j.parts)||{}; var real=String((j&&j.heroine)||hero||\"\"); WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(real,x[0],x[1],p[x[0]])); }); })","настоящий id");
sub("function WBBody(){\\n  var h=wbPHero();\\n  return u.jsx(\"div\",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el); } }});",
"function WBBody(props){\\n  var h=String((props&&props.hero)||wbPHero()||\"\");\\n  return u.jsx(\"div\",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el,h); } }});","пропс hero");
sub('n==="body"&&u.jsx(WBBody,{})','n==="body"&&u.jsx(WBBody,{hero:cardSel})',"ветка с hero");
fs.writeFileSync(g,s);
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
if(!vs.includes("function resolveHeroine(id)")){
  const k=vs.lastIndexOf("\n];");
  vs=vs.slice(0,k+1)+'  ["Превью: id героини разрешается", "function resolveHeroine(id)", 1],\n'+vs.slice(k+1);
  fs.writeFileSync(v,vs);
  console.log("ok verify +1");
} else console.log("verify уже есть");