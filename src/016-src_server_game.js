// src/server/game.js
var require_game = __commonJS({
  "src/server/game.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var crypto = require("crypto");
    var { extractCatalog } = require_catalog();
    var MIME = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".webmanifest": "application/manifest+json",
      ".webp": "image/webp",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff2": "font/woff2",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".txt": "text/plain; charset=utf-8"
    };
    var PARTS_RE = /return\{key:([A-Za-z0-9_$]+),prompt:([A-Za-z0-9_$]+),negativePrompt:([A-Za-z0-9_$]+),parts:([A-Za-z0-9_$]+\.filter\([A-Za-z0-9_$]+=>[A-Za-z0-9_$]+\.tags\))/;
    function stillCompiles(before, after) {
      const vm = require("vm");
      const scripts = (html) => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.length > 1e3);
      const a = scripts(before), b = scripts(after);
      for (let i = 0; i < b.length; i++) {
        if (a[i] === b[i]) continue;
        let okBefore = true;
        try {
          new vm.Script(a[i] || "");
        } catch (_) {
          okBefore = false;
        }
        if (!okBefore) continue;
        try {
          new vm.Script(b[i]);
        } catch (_) {
          return false;
        }
      }
      return true;
    }
    function findGameDir(candidates) {
      for (const d of candidates) {
        if (!d) continue;
        try {
          if (fs.existsSync(path.join(d, "index.html"))) return path.resolve(d);
        } catch (_) {
        }
      }
      return "";
    }
    var Game = class {
      constructor(opts) {
        this.dir = "";
        this.bootstrap = opts.bootstrap;
        this.menuUrl = opts.menuUrl;
        this.privateDirs = (opts.privateDirs || []).map((d) => path.resolve(d));
        this.cache = null;
        this.catalog = null;
      }
      setDir(dir) {
        this.dir = dir ? path.resolve(dir) : "";
        this.cache = null;
      }
      indexFile() {
        return this.dir ? path.join(this.dir, "index.html") : "";
      }
      ok() {
        return !!this.dir && fs.existsSync(this.indexFile());
      }
      /** Read + patch index.html once per change of the file. */
      load() {
        if (!this.ok()) return null;
        const file = this.indexFile();
        const mtime = fs.statSync(file).mtimeMs;
        if (this.cache && this.cache.mtime === mtime) return this.cache;
        const original = fs.readFileSync(file, "utf8");
        const catalog = extractCatalog(original);
        const hooks = { parts: false, nursery: false };
        let html = original;
        if (PARTS_RE.test(html)) {
          html = html.replace(PARTS_RE, (m, k, p, n, parts) => "return{key:" + k + ",prompt:" + p + ",negativePrompt:" + n + ",parts:(window.__WB_PARTS__&&window.__WB_PARTS__(" + k + "," + parts + ")," + parts + ")");
          hooks.parts = true;
          if (!stillCompiles(original, html)) {
            console.warn("[bridge]   the prompt parts hook would break this game version; serving the game without it.");
            html = original;
            hooks.parts = false;
            hooks.partsBroken = true;
          }
        }
        const storeHtml = html.replace(STORE_RE, (m, a, b, c) => "const " + a + "=window.__WB_STORE__=" + b + "()(" + c + "((e,t)=>({state:");
        if (storeHtml !== html && stillCompiles(original, storeHtml)) {
          html = storeHtml;
          hooks.store = true;
        } else hooks.store = false;
        let pickHtml = addCustomWives(html);
        if (pickHtml !== html) pickHtml = pickHtml.replace('children:"Build Your Wife"', 'children:"Build Your Own Heroine"');
        if (pickHtml !== html && stillCompiles(original, pickHtml)) {
          html = pickHtml;
          hooks.customWives = true;
        } else hooks.customWives = false;
        const nurseryHtml = addNurseryNav(addNurseryRoom(addNursery(html)));
        if (nurseryHtml !== html && stillCompiles(original, nurseryHtml)) {
          html = nurseryHtml;
          hooks.nursery = true;
        } else hooks.nursery = false;
        const kinHtml = html.replace('Fle={same_town:.7,day_ride:.35,far:.1}', 'Fle={home:.9,same_town:.7,day_ride:.35,far:.1}')
          .replace('UCe={', 'UCe={home:.8,')
          .replace('GCe={', 'GCe={home:.5,')
          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}')
          .replace('function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n),', 'function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n);if(t===e.primaryCharacterId&&s&&s.id!==t)console.warn("[wb] nn пишет чужую запись:",t,"<-",s.id);var r={...e.characters,[t]:s};')
                    .replace('function $He(){const e=ae(k=>k.state),', 'function $He(){const e=__wbV(ae(k=>k.state)),')
          .replace('function IHe(){const e=ae(i=>i.state),', 'function IHe(){const e=__wbV(ae(i=>i.state)),')
          .replace('function NHe(){const e=ae(s=>s.state),', 'function NHe(){const e=__wbV(ae(s=>s.state)),')
          .replace('function jHe(){const e=ae(h=>h.state),', 'function jHe(){const e=__wbV(ae(h=>h.state)),')
          .replace('function AHe(){const e=ae(l=>l.state),', 'function AHe(){const e=__wbV(ae(l=>l.state)),')
          .replace('function PHe(){const e=ae(a=>a.state),', 'function PHe(){const e=__wbV(ae(a=>a.state)),')
          .replace('ae(Ae=>e8(_(Ae.state)))', 'ae(Ae=>e8(_(__wbV(Ae.state))))')
          .replace('ae(Ae=>_(Ae.state))', 'ae(Ae=>_(__wbV(Ae.state)))')
          .replace('o=ae(Ae=>wf(Ae.state).scene)', 'o=ae(Ae=>_(__wbV(Ae.state)).id===Ae.state.primaryCharacterId?wf(Ae.state).scene:void 0)')
          .replace('n=ae(Ae=>wf(Ae.state).sceneVariant)', 'n=ae(Ae=>_(__wbV(Ae.state)).id===Ae.state.primaryCharacterId?wf(Ae.state).sceneVariant:void 0)')
          .replace('const t=ae(U=>U.state),o=At(U=>U.statDetailPinned)', 'const t=__wbV(ae(U=>U.state)),o=At(U=>U.statDetailPinned)')
          .replace('h=e.phase==="prep"&&!Tt(e),d=_(e),', 'h=e.phase==="prep"&&!Tt(e),d=_(__wbV(e)),')
.replace('function _(e){const t=e.characters[e.primaryCharacterId];', 'function __wbV(e){const c=e.wbCard||window.__WB_CARD__;if(!c||!e.characters[c])return e;return e.characters[c]===e.characters[e.primaryCharacterId]?e:{...e,primaryCharacterId:c}}function _(e){const t=e.characters[e.primaryCharacterId];')
          .replace('[i,l]=Z.useState(null),h=ae(E=>E.state),d=_(h),', '[i,l]=Z.useState(null),[cardSel,setCard]=Z.useState(window.__WB_CARD__||""),h=ae(E=>E.state),d=_(__wbV(h)),')
          .replace('const $=u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"', 'var WB_PARTS=[["head","Head"],["mouth","Mouth"],["body","Body"],["breasts","Breasts"],["ass","Ass"],["vagina","Vagina"],["belly","Belly"]];\nfunction wbPStyle(){ if(document.getElementById("wb-prev-css")) return; var st=document.createElement("style"); st.id="wb-prev-css"; st.textContent=".wb-bp{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.wb-bc{background:rgba(28,25,23,.75);border:1px solid #3f3a36;border-radius:6px;padding:6px}.wb-bt{font-size:.65rem;color:#d6d3d1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.wb-iw{position:relative}.wb-bi{width:100%;aspect-ratio:1/1;object-fit:cover;background:#1c1917;border-radius:4px;display:block}.wb-bg{position:absolute;left:0;right:0;bottom:0;max-height:60%;overflow:auto;background:rgba(10,9,8,.93);color:#d6d3d1;font-size:.6rem;line-height:1.35;padding:4px 6px;border-radius:0 0 4px 4px;opacity:0;transition:opacity .12s}.wb-bc:hover .wb-bg{opacity:1}.wb-bc.noimg .wb-bg{position:static;opacity:1;background:none;padding:2px 0;margin:2px 0;max-height:2.4em}.wb-bb{width:100%;margin-top:4px;font-size:.65rem;padding:3px;border-radius:4px;background:#7c2d12;color:#fed7aa;border:0;cursor:pointer}.wb-bb[disabled]{opacity:.5}"; document.head.appendChild(st); }\nfunction wbChar(key){\n  try{\n    var s=window.__WB_STORE__; if(!s||!s.getState) return null;\n    var g2=(s.getState()||{}).state||{}, cs=g2.characters||{};\n    var id=String(key||g2.wbCard||g2.primaryCharacterId||"");\n    if(!id) return null;\n    var ch=Array.isArray(cs)?cs.find(function(x){return x.id===id;}):cs[id];\n    var ga=ch&&ch.generatedArchetype||null;\n    var kk=ga&&ga.id?String(ga.id):(ch?String(ch.archetypeId||""):"")||id;\n    return { id:id, key:kk, arch:ch?String(ch.archetypeId||""):"", base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"", look:(ch&&ch.look)||null, stage:String((ch&&ch.stage)||""), sex:String((ch&&ch.sex)||"f") };\n  }catch(e){ return null; }\n}\nfunction wbPCard(hero,key,part,label,tags,prev,src){\n  var w=document.createElement("div"); w.className="wb-bc"+(prev?"":" noimg");\n  var t=document.createElement("div"); t.className="wb-bt"; t.textContent=label; w.appendChild(t);\n  var iw=document.createElement("div"); iw.className="wb-iw"; w.appendChild(iw);\n  var im=document.createElement("img"); im.className="wb-bi"; im.alt=label; im.style.display="none"; iw.appendChild(im);\n  var g2=document.createElement("div"); g2.className="wb-bg"; g2.textContent=tags||"no tags"; iw.appendChild(g2);\n  var b=document.createElement("button"); b.className="wb-bb"; b.type="button"; b.textContent=prev?"Redraw":"Draw"; w.appendChild(b);\n  if(prev){ im.src=prev; im.style.display="block"; }\n  b.onclick=function(){\n    b.disabled=true; b.textContent="Drawing...";\n    fetch("/bridge/api/part-preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:hero,key:key,part:part,base:src.base,neg:src.neg,look:src.look,stage:src.stage,sex:src.sex,seed:im.style.display==="block"?(Date.now()%1e9):0})})\n      .then(function(r){ return r.json(); })\n      .then(function(j){\n        if(j&&j.ok&&j.image){ im.src=j.image; im.style.display="block"; w.className="wb-bc"; b.textContent="Redraw"; }\n        else { g2.textContent=(j&&j.error)||"error"; b.textContent="Retry"; }\n      })\n      .catch(function(){ b.textContent="Retry"; })\n      .then(function(){ b.disabled=false; });\n  };\n  return w;\n}\nfunction wbPFill(el,key){\n  wbPStyle(); el.textContent="";\n  var cap=document.createElement("div"); cap.className="text-[0.7rem] text-stone-500 mb-2"; cap.textContent="Body previews"; el.appendChild(cap);\n  var grid=document.createElement("div"); grid.className="wb-bp"; el.appendChild(grid);\n  var ch=wbChar(key);\n  if(!ch||!ch.id){ grid.textContent="No heroine selected."; return; }\n  fetch("/bridge/api/parts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({heroine:ch.arch,key:ch.key,base:ch.base,neg:ch.neg,look:ch.look,stage:ch.stage,sex:ch.sex})})\n    .then(function(r){ return r.json(); })\n    .then(function(j){\n      var p=(j&&j.parts)||{}, pv=(j&&j.previews)||{}, real=String((j&&j.heroine)||ch.arch||""), k=String((j&&j.key)||ch.key);\n      cap.textContent="["+k+"] arch="+real+" base="+String(ch.base||"").length+" look="+(ch.look?"yes":"no")+" st="+ch.stage;\n      var misc=String(p.misc||"").trim(); WB_PARTS.forEach(function(x){ var t=x[0]==="head"||x[0]==="breasts" ? [p[x[0]],misc].filter(Boolean).join(", ") : p[x[0]]; grid.appendChild(wbPCard(real,k,x[0],x[1],t,pv[x[0]],ch)); });\n    })\n    .catch(function(){ grid.textContent="Bridge offline."; });\n}\nfunction WBBody(props){\n  var k=String((props&&props.key)||"");\n  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==k){ el.dataset.wbH=k; wbPFill(el,k); } }});\n}\nconst $=u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"')
          .replace('children:"Encounters"})]}),n==="stats"&&u.jsx($He,{})', 'children:"Encounters"}),u.jsx(Mc,{active:n==="body",onClick:()=>s("body"),children:"Body"})]}),n==="body"&&u.jsx(WBBody,{key:String((h&&h.wbCard)||"")}),n==="stats"&&u.jsx($He,{})')
          .replace('const $=u.jsxs(u.Fragment,{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"', 'const __wbKids=(window.__WB_KIDS__&&window.__WB_KIDS__())||[],__wbCard=function(lbl,id){return u.jsx("button",{type:"button",className:"px-1.5 py-0.5 rounded border text-[0.65rem] "+(cardSel===id?"border-amber-600 bg-amber-900/40 text-amber-200":"border-stone-700 text-stone-400 hover:text-stone-200"),onClick:function(){window.__WB_CARD__=id;setCard(id);var __s=window.__WB_STORE__;if(__s&&__s.setState)__s.setState(function(x){var g=x.state||{},n={},k;for(k in g)n[k]=g[k];n.wbCard=id;return{state:n};});},children:lbl},id||"wife")}; const $=u.jsxs(u.Fragment,{children:[__wbKids.length?u.jsx("div",{className:"flex flex-wrap gap-1 mb-2",children:[__wbCard(h.characters[h.primaryCharacterId].name,"")].concat(__wbKids.map(function(c){return __wbCard(c.name,c.id)}))}):null,u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-3 border-b border-stone-700"')
          .replace('n.has(f)&&(o[d].occupants.push(f),r.add(f))}', '(n.has(f)||e.characters&&e.characters[f])&&(o[d].occupants.push(f),r.add(f))}')
          .replace('g=iU(e,d);return{', 'g=iU(e,d).filter(function(v){return !((v.person||v).wbChild)});return{')
          .replace('o=iU(t,e);return', 'o=iU(t,e).filter(function(v){return !((v.person||v).wbChild)});return')
          .replace('return n?n.persons.filter(i=>s.has(cp(i))):[]', 'return n?n.persons.filter(i=>s.has(cp(i))&&!(i.wbChild&&s.has(i.id.slice(2)))):[]')
          .replace('truncate max-w-[10rem] ${i.text}`,children:t.name})', 'truncate max-w-[10rem] ${i.text}`,children:t.wbChild&&window.__WB_KINLABEL__?t.name+" · "+window.__WB_KINLABEL__(e):t.name})');
        if (kinHtml !== html && stillCompiles(original, kinHtml)) {
          html = kinHtml;
          hooks.kin = true;
        } else hooks.kin = false;
        console.log("[bridge]   kin home weight:", hooks.kin ? "installed" : "NOT FOUND");
        const tag = '<script id="wayward-bridge">' + this.bootstrap + '</script>\n<script src="' + this.menuUrl + '" defer></script>';
        const firstScript = html.search(/<script\b/i);
        html = firstScript >= 0 ? html.slice(0, firstScript) + tag + "\n    " + html.slice(firstScript) : html.replace(/<\/head>/i, () => tag + "</head>");
        const version = (original.match(/## \[(\d{4}-\d{2}-\d{2})\]/) || [])[1] || "";
        this.cache = { mtime, html, original, catalog, hooks, version, hash: crypto.createHash("sha1").update(original).digest("hex").slice(0, 10) };
        this.catalog = catalog;
        console.log("[bridge] game loaded:", file, version ? "(changelog " + version + ")" : "");
        console.log("[bridge]   prompt parts hook:", hooks.parts ? "installed" : "NOT FOUND (edits match the whole prompt)");
        const missing = Object.entries(catalog.found).filter(([, v]) => !v).map(([k]) => k);
        console.log("[bridge]   game tables:", missing.length ? "missing " + missing.join(", ") : "all found");
        return this.cache;
      }
      /**
       * Serve a game file. Returns true if handled.
       * freshImages: hide the game's bundled art so every picture is drawn new.
       */
      serve(req, res, urlPath, freshImages, names) {
        if (!this.ok()) return false;
        if (urlPath === "/" || urlPath === "/index.html") {
          const c = this.load();
          let html = c.html;
          for (const [short, h] of Object.entries(c.catalog.heroines || {})) {
            const nu = names && names[short];
            if (!nu || nu === h.name) continue;
            const from = '{id:"' + h.archetype + '",name:' + JSON.stringify(h.name);
            html = html.split(from).join('{id:"' + h.archetype + '",name:' + JSON.stringify(String(nu)));
          }
          res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" });
          res.end(html);
          return true;
        }
        if (urlPath === "/sw.js") {
          res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
          res.end("self.addEventListener('install',function(){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});");
          return true;
        }
        if (freshImages && /^\/images(-[A-Za-z0-9_-]+)?\.js$/i.test(urlPath)) {
          res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
          res.end('/* bundled art hidden by Wayward Bridge: "Always draw new pictures" is on */');
          return true;
        }
        let rel;
        try {
          rel = decodeURIComponent(urlPath).replace(/^\/+/, "");
        } catch (_) {
          return false;
        }
        const fp = path.resolve(this.dir, rel);
        if (!fp.startsWith(this.dir + path.sep)) return false;
        if (this.privateDirs.some((d) => fp === d || fp.startsWith(d + path.sep))) return false;
        if (/^wayward-bridge(\.exe|\.js)?$/i.test(path.basename(fp))) return false;
        let st;
        try {
          st = fs.statSync(fp);
        } catch (_) {
          return false;
        }
        if (!st.isFile()) return false;
        res.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream", "Content-Length": st.size });
        fs.createReadStream(fp).pipe(res);
        return true;
      }
    };
    function addCustomWives(html) {
      const sig = /function ([A-Za-z0-9_$]+)\(\{onSelect:([A-Za-z0-9_$]+),onOpenBuilder:([A-Za-z0-9_$]+),onBack:([A-Za-z0-9_$]+)\}\)\{const\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]=[A-Za-z0-9_$]+\.useState\(null\),\[[A-Za-z0-9_$]+,[A-Za-z0-9_$]+\]=[A-Za-z0-9_$]+\.useState\([A-Za-z0-9_$]+\),([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)=>\9\.wives\)/;
      const m = sig.exec(html);
      if (!m) return html;
      const [, , , openBuilder, , sel, setSel, wives, store] = m;
      const start = m.index;
      const slice = html.slice(start, start + 2e4);
      const jm = slice.match(/return ([A-Za-z0-9_$]+)\.jsx\("div",\{className:"h-\[100dvh\]/);
      if (!jm) return html;
      const U = jm[1];
      const hole = slice.indexOf("},k.id)}),!1,!1]");
      if (hole < 0) return html;
      const rm = slice.match(/,([A-Za-z0-9_$]+)=[A-Za-z0-9_$]+\.find\(([A-Za-z0-9_$]+)=>\2\.id===[A-Za-z0-9_$]+\);return /);
      const rel = rm ? "((" + rm[1] + "&&" + rm[1] + '.label)||"wife").toLowerCase()' : '"wife"';
      const card = "w-full text-left rounded-lg border transition-all duration-150 overflow-hidden";
      const code = "..." + wives + ".map(c=>{const on=" + sel + '===c.id,nm=(c.inputs&&c.inputs.name)||"Custom",tg=(c.inputs&&c.inputs.customTagline)||(c.inputs&&c.inputs.age?"Age "+c.inputs.age+".":"");return ' + U + '.jsx("button",{onClick:()=>' + setSel + '(c.id),className:["group ' + card + '",on?"border-amber-500 bg-amber-950/60 shadow-amber-900/40 shadow-md":"border-stone-700 bg-stone-800/40 hover:border-stone-500 hover:bg-stone-800/70"].join(" "),children:' + U + '.jsxs("div",{className:"relative flex items-center min-h-[6rem]",children:[' + U + '.jsxs("div",{className:"flex-1 min-w-0 flex items-start gap-4 px-5 py-4 pr-32 sm:pr-44",children:[' + U + '.jsx("div",{className:["mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors",on?"border-amber-400 bg-amber-400":"border-stone-500"].join(" ")}),' + U + '.jsxs("div",{className:"flex-1 min-w-0",children:[' + U + '.jsxs("div",{className:"flex items-baseline gap-3 mb-1 flex-wrap",children:[' + U + '.jsx("span",{className:["font-semibold text-lg",on?"text-amber-300":"text-stone-200"].join(" "),children:nm}),' + U + '.jsx("span",{className:"text-[10px] uppercase tracking-wide text-violet-300 border border-violet-700 rounded px-1.5 py-0.5",children:"your own"}),tg?' + U + '.jsx("span",{className:"text-stone-500 text-sm italic",children:tg}):null]}),' + U + '.jsxs("div",{className:"flex gap-4 text-xs mt-1",children:[' + U + '.jsx("span",{role:"button",className:"text-stone-400 hover:text-amber-300 underline cursor-pointer",onClick:ev=>{ev.stopPropagation();' + openBuilder + '(c.id)},children:"Edit"}),' + U + '.jsx("span",{role:"button",className:"text-stone-500 hover:text-red-400 underline cursor-pointer",onClick:ev=>{ev.stopPropagation();if(window.confirm("Delete "+nm+"? Games already started with her are not affected, but she can no longer be picked for a new game.")){' + store + ".getState().remove(c.id);" + sel + "===c.id&&" + setSel + '(null)}},children:"Delete"})]})]})]}),c.portraitUrl?' + U + '.jsx("img",{src:c.portraitUrl,alt:"",className:"absolute inset-y-0 right-0 w-28 sm:w-40 h-full object-cover object-top"}):null]})},c.id)}),' + U + '.jsx("button",{onClick:()=>' + openBuilder + '(),className:"w-full rounded-lg border border-dashed border-stone-600 hover:border-amber-500 bg-stone-800/20 hover:bg-stone-800/50 px-5 py-4 text-left transition-colors",children:' + U + '.jsxs("div",{children:[' + U + '.jsx("div",{className:"font-semibold text-stone-200",children:"+ Build your own heroine"}),' + U + '.jsx("div",{className:"text-stone-500 text-sm",children:"Name, age, background, looks and tendencies, with a portrait drawn for her. She will be your "+' + rel + '+" (the choice above)."})]})},"wb-build")';
      const at = start + hole + "},k.id)}),".length;
      return html.slice(0, at) + code + html.slice(at + "!1,!1".length);
    }
    function addNursery(html) {
      const re = /const AP=\[\{id:"upgrade_interior"/;
      if (!re.test(html)) return html;
      return html.replace(re, 'const AP=[{id:"nursery",label:"Build a nursery",description:"A warm room off the landing: cribs, a rug, a small stove. Somewhere for a child to sleep.",cost:150,qualityBoost:0,logText:"The nursery is ready \u2014 cribs along the wall, a rug, a small stove. Now there is somewhere for a child to sleep."},{id:"upgrade_interior"');
    }
    function addNurseryRoom(html) {
      const R = [
        ['const hl=["taproom","back_room","bedroom","elena_room",', 'const hl=["taproom","back_room","bedroom","elena_room","nursery",'],
        ['elena_room:"her room",', 'elena_room:"her room",nursery:"the nursery",'],
        ['elena_room:"Her Room",', 'elena_room:"Her Room",nursery:"Nursery",'],
        ['elena_room:new Set(["bed","seating","shut_door"]),', 'elena_room:new Set(["bed","seating","shut_door"]),nursery:new Set(["bed","seating","shut_door"]),'],
        ['je=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse"]', 'je=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse","nursery"]'],
        ['De=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse"]', 'De=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse","nursery"]'],
        ['H==="elena_room"?g?{type:"knock_on_door"}:null:', 'H==="elena_room"?g?{type:"knock_on_door"}:null:H==="nursery"?nn?{type:"go_to_nursery"}:null:'],
        ['j=bt(e),E=H8(e);function R(H)', 'j=bt(e),E=H8(e),nn=!!(d&&d.qualityUpgrades&&d.qualityUpgrades.includes("nursery"));function R(H)'],
        [',g&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("elena_room")})', ',g&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("elena_room")}),nn&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("nursery")})'],
        ['case"go_to_bedroom":return L8(e);', 'case"go_to_bedroom":return L8(e);case"go_to_nursery":return N(Pt(e,fe,"nursery"),"You step into the nursery.");'],
        ['go_to_bedroom:2,', 'go_to_bedroom:2,go_to_nursery:1,'],
      ];
      let out = html, miss = 0;
      for (const [a, b] of R) { if (out.includes(a)) out = out.replace(a, b); else miss++; }
      if (miss) console.log("[bridge]   nursery: не найдено якорей " + miss + " из " + R.length);
      return out;
    }
    function addNurseryNav(html) {
      const R = [
        ['"bathroom","kitchen"]),wb=new Set(', '"bathroom","kitchen","nursery"]),wb=new Set('],
        ['taproom:new Set(["back_room","upstairs_hall","upstairs_room_2","bathroom","kitchen"])', 'taproom:new Set(["back_room","upstairs_hall","upstairs_room_2","bathroom","kitchen","nursery"])'],
        ['upstairs_room_2:new Set(["taproom"])}', 'upstairs_room_2:new Set(["taproom"]),nursery:new Set(["taproom"])}'],
      ];
      let out = html, miss = 0;
      for (const [a, b] of R) { if (out.includes(a)) out = out.replace(a, b); else miss++; }
      if (miss) console.log("[bridge]   nursery nav: не найдено якорей " + miss + " из " + R.length);
      return out;
    }
    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(\)\(([A-Za-z0-9_$]+)\(\(e,t\)=>\(\{state:/;
    Game.addCustomWives = addCustomWives;
    module2.exports = { Game, findGameDir, MIME, PARTS_RE, addCustomWives, addNursery, addNurseryRoom, addNurseryNav };
  }
});

