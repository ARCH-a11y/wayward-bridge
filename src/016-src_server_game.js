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
          .replace('function qD(){jm=null,Ya=null,zs=null}', 'function qD(){jm=null,Ya=null,zs=null;I_=null;window.__WB_PACK_RESET__=qD}');
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

