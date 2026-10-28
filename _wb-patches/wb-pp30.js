const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('    function partTagBuckets(heroine) {\n      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};\n      const out = {}, negOut = {};',
'    function partTagBuckets(heroine, raw) {\n      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};\n      const out = {}, negOut = {};',"подпись с raw");
sub('      const base = String(sec.base || "").trim();\n      if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'      const base = String(sec.base || "").trim();\n      const rawTags = String(raw || "").trim();\n      if (rawTags) rawTags.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));\n      else if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',"внешность с клиента");
sub('      const key = String((b && b.key) || heroine);\n      const tb = partTagBuckets(heroine);',
'      const key = String((b && b.key) || heroine);\n      const tb = partTagBuckets(heroine, b && b.base);',"raw в превью");
sub('      const negTags = String((b && b.negative) || tb.neg[part] || secPart.negative || "").trim();',
'      const negTags = String((b && b.negative) || (b && b.neg) || tb.neg[part] || secPart.negative || "").trim();',"негатив с клиента");
sub('        const t2 = partTagBuckets(h);','        const t2 = partTagBuckets(h, b && b.base);',"raw в частях");
fs.writeFileSync(f,s);

const code=[
'var WB_PARTS=[["head","Head"],["mouth","Mouth"],["body","Body"],["breasts","Breasts"],["ass","Ass"],["vagina","Vagina"],["belly","Belly"]];',
'function wbPStyle(){ if(document.getElementById("wb-prev-css")) return; var st=document.createElement("style"); st.id="wb-prev-css"; st.textContent=".wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.wb-bc{background:rgba(28,25,23,.75);border:1px solid #3f3a36;border-radius:6px;padding:6px}.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.wb-iw{position:relative}.wb-bi{width:100%;aspect-ratio:1/1;object-fit:cover;background:#1c1917;border-radius:4px;display:block}.wb-bg{position:absolute;left:0;right:0;bottom:0;max-height:60%;overflow:auto;background:rgba(10,9,8,.93);color:#d6d3d1;font-size:.6rem;line-height:1.35;padding:4px 6px;border-radius:0 0 4px 4px;opacity:0;transition:opacity .12s}.wb-bc:hover .wb-bg{opacity:1}.wb-bc.noimg .wb-bg{position:static;opacity:1;background:none;padding:2px 0;margin:2px 0;max-height:2.4em}.wb-bb{width:100%;margin-top:4px;font-size:.65rem;padding:3px;border-radius:4px;background:#7c2d12;color:#fed7aa;border:0;cursor:pointer}.wb-bb[disabled]{opacity:.5}"; document.head.appendChild(st); }',
'function wbChar(key){',
'  try{',
'    var s=window.__WB_STORE__; if(!s||!s.getState) return null;',
'    var g=(s.getState()||{}).state||{}, cs=g.characters||{};',
'    var id=String(key||g.primaryCharacterId||""); var c=cs[id];',
'    if(!c) return id?{ id:id, arch:"", base:"", neg:"" }:null;',
'    var ga=c.generatedArchetype||null;',
'    return { id:id, arch:String(c.archetypeId||""), base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"" };',
'  }catch(e){ return null; }',
'}',
'function wbPCard(hero,key,part,label,tags,prev,base,neg){',
'  var w=document.createElement("div"); w.className="wb-bc"+(prev?"":" noimg");',
'  var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label; w.appendChild(t);',
'  var iw=document.createElement("div"); iw.className="wb-iw"; w.appendChild(iw);',
'  var im=document.createElement("img"); im.className="wb-bi"; im.alt=label; im.style.display="none"; iw.appendChild(im);',
'  var g2=document.createElement("div"); g2.className="wb-bg"; g2.textContent=tags||"no tags"; iw.appendChild(g2);',
'  var b=document.createElement("button"); b.className="wb-bb"; b.type="button"; b.textContent=prev?"Redraw":"Draw"; w.appendChild(b);',
'  if(prev){ im.src=prev; im.style.display="block"; }',
'  b.onclick=function(){',
'    b.disabled=true; b.textContent="Drawing...";',
'    fetch("/bridge/api/part-preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero,key:key,part:part,base:base,neg:neg,seed:im.style.display==="block"?(Date.now()%1e9):0})})',
'      .then(function(r){ return r.json(); })',
'      .then(function(j){',
'        if(j&&j.ok&&j.image){ im.src=j.image; im.style.display="block"; w.className="wb-bc"; b.textContent="Redraw"; }',
'        else { g2.textContent=(j&&j.error)||"error"; b.textContent="Retry"; }',
'      })',
'      .catch(function(){ b.textContent="Retry"; })',
'      .then(function(){ b.disabled=false; });',
'  };',
'  return w;',
'}',
'function wbPFill(el,key){',
'  wbPStyle(); el.textContent="";',
'  var cap=document.createElement("div"); cap.className="text-[0.7rem] text-stone-500 mb-2"; cap.textContent="Body previews"; el.appendChild(cap);',
'  var grid=document.createElement("div"); grid.className="wb-bp"; el.appendChild(grid);',
'  var ch=wbChar(key);',
'  if(!ch||!ch.id){ grid.textContent="No heroine selected."; return; }',
'  fetch("/bridge/api/parts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:ch.arch,key:ch.id,base:ch.base,neg:ch.neg})})',
'    .then(function(r){ return r.json(); })',
'    .then(function(j){',
'      var p=(j&&j.parts)||{}, pv=(j&&j.previews)||{}, real=String((j&&j.heroine)||ch.arch||""), k=String((j&&j.key)||ch.id);',
'      WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(real,k,x[0],x[1],p[x[0]],pv[x[0]],ch.base,ch.neg)); });',
'    })',
'    .catch(function(){ grid.textContent="Bridge offline."; });',
'}',
'function WBBody(props){',
'  var k=String((props&&props.key)||"");',
'  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==k){ el.dataset.wbH=k; wbPFill(el,k); } }});',
'}'
].join("\\n");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const start=c.indexOf("var WB_PARTS=");
const end=c.indexOf("\\nconst $=u.jsxs",start);
if(start<0||end<0){ console.log("FAIL клиент"); process.exit(1); }
c=c.slice(0,start)+code+c.slice(end);
c=c.replace(/n==="body"&&u\.jsx\(WBBody,\{[^}]*\}\)/,'n==="body"&&u.jsx(WBBody,{key:cardSel||""})');
fs.writeFileSync(g,c);
console.log("клиент заменён");