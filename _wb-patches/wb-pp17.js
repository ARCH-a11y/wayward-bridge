const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
const of=[
'    var PART_FOCUS = {',
'      base: "full body, standing, completely nude",',
'      head: "face focus, portrait, close-up on face, looking at viewer",',
'      mouth: "extreme close-up on mouth, open mouth, tongue out, showing teeth, parted lips",',
'      body: "full body, standing, from front, wide hips, narrow waist, completely nude",',
'      breasts: "close-up on breasts, upper body, bare breasts, nipples visible",',
'      ass: "close-up on ass, from behind, bent over, looking back over shoulder",',
'      vagina: "extreme close-up on pussy, front view, spread legs, bare",',
'      misc: "full body, standing",',
'      belly: "close-up on belly, midriff, navel, from front"',
'    };'
].join("\n");
const nf=[
'    var PART_FOCUS = {',
'      base: "full body, standing, completely nude",',
'      head: "face focus, portrait, close-up on face, looking at viewer",',
'      mouth: "close-up on mouth, open mouth, tongue out, parted lips, showing teeth",',
'      body: "full body, standing, from front, completely nude",',
'      breasts: "close-up, head out of frame, cropped head, chest filling frame, bare breasts, nipples visible",',
'      ass: "close-up, head out of frame, cropped head, hips filling frame, from behind, bent over",',
'      vagina: "extreme close-up, cropped head, pussy filling frame, front view, spread legs",',
'      misc: "full body, standing",',
'      belly: "close-up, cropped head, midriff filling frame, navel, from front"',
'    };'
].join("\n");
sub(of,nf,"кадры");
sub('      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags].filter(Boolean).join(", ");',
'      const miscTags = full ? "" : String(buckets.misc || "").trim();\n      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags].filter(Boolean).join(", ");',"misc в части");
sub('const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "plain dark grey background, flat background"].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background"].filter(Boolean).join(", ");',"фон");
sub('const negative = [negTags, "clothes, dress, skirt, shirt, pants, underwear, bra, panties", String(pipe.negative || "")].filter(Boolean).join(", ");',
'const cropNeg = /^(breasts|ass|vagina)$/.test(part) ? "face, full face, head" : "";\n      const negative = [negTags, cropNeg, "clothes, dress, skirt, shirt, pants, underwear, bra, panties", String(pipe.negative || "")].filter(Boolean).join(", ");',"негатив кадра");
fs.writeFileSync(f,s);
console.log("сервер готов");

const code=[
'var WB_PARTS=[["head","Head"],["mouth","Mouth"],["body","Body"],["breasts","Breasts"],["ass","Ass"],["vagina","Vagina"],["belly","Belly"]];',
'function wbPHero(){ return String(window.__WB_CARD__||""); }',
'function wbPStyle(){ if(document.getElementById("wb-prev-css")) return; var st=document.createElement("style"); st.id="wb-prev-css"; st.textContent=".wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.wb-bc{background:rgba(28,25,23,.75);border:1px solid #3f3a36;border-radius:6px;padding:6px}.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.wb-iw{position:relative}.wb-bi{width:100%;aspect-ratio:1/1;object-fit:cover;background:#1c1917;border-radius:4px;display:block}.wb-bg{position:absolute;left:0;right:0;bottom:0;max-height:60%;overflow:auto;background:rgba(10,9,8,.93);color:#d6d3d1;font-size:.6rem;line-height:1.35;padding:4px 6px;border-radius:0 0 4px 4px;opacity:0;transition:opacity .12s}.wb-bc:hover .wb-bg{opacity:1}.wb-bc.noimg .wb-bg{position:static;opacity:1;background:none;padding:2px 0;margin:2px 0;max-height:2.4em}.wb-bb{width:100%;margin-top:4px;font-size:.65rem;padding:3px;border-radius:4px;background:#7c2d12;color:#fed7aa;border:0;cursor:pointer}.wb-bb[disabled]{opacity:.5}"; document.head.appendChild(st); }',
'function wbPCard(hero,part,label,tags,prev){',
'  var w=document.createElement("div"); w.className="wb-bc"+(prev?"":" noimg");',
'  var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label; w.appendChild(t);',
'  var iw=document.createElement("div"); iw.className="wb-iw"; w.appendChild(iw);',
'  var im=document.createElement("img"); im.className="wb-bi"; im.alt=label; im.style.display="none"; iw.appendChild(im);',
'  var g2=document.createElement("div"); g2.className="wb-bg"; g2.textContent=tags||"no tags"; iw.appendChild(g2);',
'  var b=document.createElement("button"); b.className="wb-bb"; b.type="button"; b.textContent=prev?"Redraw":"Draw"; w.appendChild(b);',
'  if(prev){ im.src=prev; im.style.display="block"; }',
'  b.onclick=function(){',
'    b.disabled=true; b.textContent="Drawing...";',
'    fetch("/bridge/api/part-preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero,part:part,seed:im.style.display==="block"?(Date.now()%1e9):0})})',
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
'function wbPFill(el,hero){',
'  wbPStyle(); el.textContent="";',
'  var cap=document.createElement("div"); cap.className="text-[0.7rem] text-stone-500 mb-2"; cap.textContent="Body previews"; el.appendChild(cap);',
'  var grid=document.createElement("div"); grid.className="wb-bp"; el.appendChild(grid);',
'  fetch("/bridge/api/parts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero})})',
'    .then(function(r){ return r.json(); })',
'    .then(function(j){',
'      var p=(j&&j.parts)||{}, pv=(j&&j.previews)||{}, real=String((j&&j.heroine)||hero||"");',
'      if(!real){ grid.textContent="No heroine selected."; return; }',
'      WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(real,x[0],x[1],p[x[0]],pv[x[0]])); });',
'    })',
'    .catch(function(){ grid.textContent="Bridge offline."; });',
'}',
'function WBBody(props){',
'  var h=String((props&&props.hero)||wbPHero()||"");',
'  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==h){ el.dataset.wbH=h; wbPFill(el,h); } }});',
'}'
].join("\\n");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const start=c.indexOf("var WB_PARTS=");
const end=c.indexOf("\\nconst $=u.jsxs",start);
if(start<0||end<0){ console.log("FAIL клиент"); process.exit(1); }
c=c.slice(0,start)+code+c.slice(end);
fs.writeFileSync(g,c);
console.log("клиент заменён");