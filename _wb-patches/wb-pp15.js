const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const out = {};\n      const push = (part, tag) => { if (!tag) return; (out[part] = out[part] || []).push(tag); };',
'      const out = {}, negOut = {};\n      const push = (part, tag) => { if (!tag) return; (out[part] = out[part] || []).push(tag); };\n      const pushNeg = (part, text) => { if (!text) return; (negOut[part] = negOut[part] || []).push(text); };',"негатив-бакеты");
sub('      const res = {};\n      for (const k of Object.keys(out)) res[k] = out[k].join(", ");\n      return res;',
'      const qs = sec.quarantine || {};\n      for (const qid of Object.keys(qs)) {\n        const q = qs[qid] || {};\n        if (q.mode === "never") continue;\n        const qpart = classifyPart(qid);\n        const qt = String(q.tags || "").trim();\n        if (qt) qt.split(",").forEach((x) => push(qpart, x.trim()));\n        pushNeg(qpart, String(q.negative || "").trim());\n      }\n      const res = {}, neg = {};\n      for (const k of Object.keys(out)) res[k] = out[k].join(", ");\n      for (const k of Object.keys(negOut)) neg[k] = negOut[k].join(", ");\n      return { tags: res, neg };',"карантин");
sub([
'      const buckets = partTagBuckets(heroine);',
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const secPart = ((sec.sections || {})[part]) || {};',
'      const tags = String((b && b.tags) || buckets[part] || "").trim();',
'      const anchor = String(Object.values(buckets).join(", ")).trim();',
'      const negTags = String((b && b.negative) || secPart.negative || "").trim();',
'      if (!tags && !anchor) return { ok: false, error: "This part has no words to draw." };'
].join("\n"),[
'      const tb = partTagBuckets(heroine);',
'      const buckets = tb.tags;',
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const secPart = ((sec.sections || {})[part]) || {};',
'      const anchor = String(Object.values(buckets).join(", ")).trim();',
'      const hairTags = String(buckets.head || "").split(",").map((x) => x.trim()).filter((x) => /hair|skin|eye/.test(x)).join(", ");',
'      const full = part === "body" || part === "misc";',
'      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags].filter(Boolean).join(", ");',
'      const negTags = String((b && b.negative) || tb.neg[part] || secPart.negative || "").trim();',
'      if (!tags) return { ok: false, error: "This part has no words to draw." };'
].join("\n"),"теги части");
sub('const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", anchor, "medieval tavern interior background, warm candlelight, soft focus"].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "plain dark grey background, flat background"].filter(Boolean).join(", ");',"промпт");
sub('width: 512, height: 640','width: 640, height: 640',"квадрат");
sub('        const buf = await comfy.view(img);',
'        const buf = await comfy.view(img);\n        const pdir = path.join(DATA_DIR, "part-previews", heroine);\n        fs.mkdirSync(pdir, { recursive: true });\n        fs.writeFileSync(path.join(pdir, part + ".png"), buf);',"сохранение файла");
sub('      if (p === "/bridge/api/parts" && m === "POST") { const b = await readJson(req); const h = resolveHeroine(b && b.heroine); return send(res, 200, { ok: true, heroine: h, parts: partTagBuckets(h) }); }',
[
'      if (p === "/bridge/api/parts" && m === "POST") {',
'        const b = await readJson(req);',
'        const h = resolveHeroine(b && b.heroine);',
'        const t2 = partTagBuckets(h);',
'        const pv = {};',
'        try {',
'          const pdir2 = path.join(DATA_DIR, "part-previews", h);',
'          for (const f2 of fs.readdirSync(pdir2)) {',
'            if (!f2.endsWith(".png")) continue;',
'            pv[f2.slice(0, -4)] = "data:image/png;base64," + fs.readFileSync(path.join(pdir2, f2)).toString("base64");',
'          }',
'        } catch (e) {}',
'        return send(res, 200, { ok: true, heroine: h, parts: t2.tags, previews: pv });',
'      }'
].join("\n"),"роут частей");
fs.writeFileSync(f,s);
console.log("сервер готов");

const code=[
'var WB_PARTS=[["head","Head"],["mouth","Mouth"],["body","Body"],["breasts","Breasts"],["ass","Ass"],["vagina","Vagina"],["misc","Misc"],["belly","Belly"]];',
'function wbPHero(){ return String(window.__WB_CARD__||""); }',
'function wbPStyle(){ if(document.getElementById("wb-prev-css")) return; var st=document.createElement("style"); st.id="wb-prev-css"; st.textContent=".wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.wb-bc{position:relative;background:rgba(28,25,23,.75);border:1px solid #3f3a36;border-radius:6px;padding:6px}.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.wb-bi{width:100%;aspect-ratio:1/1;object-fit:cover;background:#1c1917;border-radius:4px;display:block}.wb-bg{position:absolute;left:6px;right:6px;top:22px;aspect-ratio:1/1;background:rgba(12,10,9,.86);color:#d6d3d1;font-size:.6rem;line-height:1.35;padding:6px;border-radius:4px;overflow:auto;opacity:0;transition:opacity .12s}.wb-bc:hover .wb-bg{opacity:1}.wb-bc.noimg .wb-bg{position:static;aspect-ratio:auto;opacity:1;background:none;padding:2px 0;margin:2px 0;max-height:2.4em}.wb-bb{width:100%;font-size:.65rem;padding:3px;border-radius:4px;background:#7c2d12;color:#fed7aa;border:0;cursor:pointer}.wb-bb[disabled]{opacity:.5}"; document.head.appendChild(st); }',
'function wbPCard(hero,part,label,tags,prev){',
'  var w=document.createElement("div"); w.className="wb-bc"+(prev?"":" noimg");',
'  var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label; w.appendChild(t);',
'  var im=document.createElement("img"); im.className="wb-bi"; im.alt=label; im.style.display="none"; w.appendChild(im);',
'  var g2=document.createElement("div"); g2.className="wb-bg"; g2.textContent=tags||"no tags"; w.appendChild(g2);',
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
if(start<0||end<0){ console.log("FAIL блок клиента"); process.exit(1); }
c=c.slice(0,start)+code+c.slice(end);
fs.writeFileSync(g,c);
console.log("клиент заменён");
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
vs=vs.replace('"wb-part-previews-v1"','"part-previews"');
fs.writeFileSync(v,vs);
console.log("verify обновлён");