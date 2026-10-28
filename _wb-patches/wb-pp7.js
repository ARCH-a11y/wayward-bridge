const fs=require("fs");
const g="src/016-src_server_game.js";
let s=fs.readFileSync(g,"utf8");
const i="src/024-src_server_index.js";
let srv=fs.readFileSync(i,"utf8");

const dbg=/dbg: \{[\s\S]*?\}, /;
if(!dbg.test(srv)){ console.log("FAIL dbg"); process.exit(1); }
srv=srv.replace(dbg,"");
fs.writeFileSync(i,srv);
console.log("ok dbg снят");

const code=[
'var WB_PARTS=[["head","Head"],["mouth","Mouth"],["body","Body"],["breasts","Breasts"],["ass","Ass"],["vagina","Vagina"],["misc","Misc"],["belly","Belly"]];',
'var WB_PK="wb-part-previews-v1";',
'function wbPStore(){ try{ return JSON.parse(localStorage.getItem(WB_PK)||"{}"); }catch(e){ return {}; } }',
'function wbPSave(o){ try{ localStorage.setItem(WB_PK,JSON.stringify(o)); }catch(e){} }',
'function wbPHero(){ return String(window.__WB_CARD__||""); }',
'function wbPStyle(){ if(document.getElementById("wb-prev-css")) return; var st=document.createElement("style"); st.id="wb-prev-css"; st.textContent=".wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}.wb-bc{background:rgba(28,25,23,.75);border:1px solid #3f3a36;border-radius:6px;padding:6px}.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.wb-bi{width:100%;aspect-ratio:4/5;object-fit:cover;background:#1c1917;border-radius:4px;display:block}.wb-bg{font-size:.6rem;color:#78716c;margin:4px 0;max-height:2.2em;overflow:hidden}.wb-bb{width:100%;font-size:.65rem;padding:3px;border-radius:4px;background:#7c2d12;color:#fed7aa;border:0;cursor:pointer}.wb-bb[disabled]{opacity:.5}"; document.head.appendChild(st); }',
'function wbPCard(hero,part,label,tags){',
'  var have=wbPStore()[hero]||{};',
'  var w=document.createElement("div"); w.className="wb-bc";',
'  var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label; w.appendChild(t);',
'  var im=document.createElement("img"); im.className="wb-bi"; im.alt=label; im.style.display="none"; w.appendChild(im);',
'  var g2=document.createElement("div"); g2.className="wb-bg"; g2.textContent=tags||"no tags"; g2.title=tags||""; w.appendChild(g2);',
'  var b=document.createElement("button"); b.className="wb-bb"; b.type="button"; b.textContent=have[part]?"Redraw":"Draw"; w.appendChild(b);',
'  if(have[part]){ im.src=have[part]; im.style.display="block"; }',
'  b.onclick=function(){',
'    b.disabled=true; b.textContent="Drawing...";',
'    fetch("/bridge/api/part-preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero,part:part})})',
'      .then(function(r){ return r.json(); })',
'      .then(function(j){',
'        if(j&&j.ok&&j.image){ im.src=j.image; im.style.display="block"; var s2=wbPStore(); s2[hero]=s2[hero]||{}; s2[hero][part]=j.image; wbPSave(s2); b.textContent="Redraw"; }',
'        else { g2.textContent=(j&&j.error)||"error"; b.textContent="Retry"; }',
'      })',
'      .catch(function(){ b.textContent="Retry"; })',
'      .then(function(){ b.disabled=false; });',
'  };',
'  return w;',
'}',
'function wbPFill(el){',
'  wbPStyle(); var hero=wbPHero(); el.textContent="";',
'  var cap=document.createElement("div"); cap.className="text-[0.7rem] text-stone-500 mb-2"; cap.textContent="Body previews"; el.appendChild(cap);',
'  if(!hero){ el.appendChild(document.createTextNode("No heroine selected.")); return; }',
'  var grid=document.createElement("div"); grid.className="wb-bp"; el.appendChild(grid);',
'  fetch("/bridge/api/parts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero})})',
'    .then(function(r){ return r.json(); })',
'    .then(function(j){ var p=(j&&j.parts)||{}; WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(hero,x[0],x[1],p[x[0]])); }); })',
'    .catch(function(){ grid.textContent="Bridge offline."; });',
'}',
'function WBBody(){',
'  var h=wbPHero();',
'  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el); } }});',
'}'
].join("\n");

const anchor="d=_(__wbV(h)),')";
if(!s.includes(anchor)){ console.log("FAIL якорь цепочки"); process.exit(1); }
const stripA='const $=u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"';
const add1="\n          .replace('"+stripA+"', '"+code.replace(/\n/g,"\\n").replace(/'/g,"\\'")+"\\n"+stripA.replace(/'/g,"\\'")+"')";
const tailA='children:"Encounters"})]}),n==="stats"&&u.jsx($He,{})';
const tailB='children:"Encounters"}),u.jsx(Mc,{active:n==="body",onClick:()=>s("body"),children:"Body"})]}),n==="body"&&u.jsx(WBBody,{}),n==="stats"&&u.jsx($He,{})';
const add2="\n          .replace('"+tailA+"', '"+tailB.replace(/'/g,"\\'")+"')";
s=s.replace(anchor, anchor+add1+add2);
fs.writeFileSync(g,s);
console.log("ok вкладка и компонента");

const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
const addv=[
'  ["Превью: вкладка Body", "children:\\"Body\\"", 1],\n',
'  ["Превью: ветка body", "n===\\"body\\"&&u.jsx(WBBody,{})", 1],\n',
'  ["Превью: компонента", "function WBBody()", 1],\n',
'  ["Превью: заполнение", "function wbPFill(el)", 1],\n',
'  ["Превью: хранилище", "wb-part-previews-v1", 1],\n'
].join("");
const k=vs.lastIndexOf("\n];");
if(k<0){ console.log("FAIL verify"); process.exit(1); }
vs=vs.slice(0,k+1)+addv+vs.slice(k+1);
fs.writeFileSync(v,vs);
console.log("ok verify +5");