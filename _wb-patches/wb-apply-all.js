#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.orig.js";
const OUT = "wayward-bridge.new.js";
const REPORT = "wb-apply-all-report.txt";

const RATINGS_NEW = `var Ratings = class {
  constructor(dataDir) {
    this.file = path.join(dataDir, "ratings.jsonl");
    this.cache = null;
    this.pending = 0;
  }
  all() {
    if (this.cache) return this.cache;
    let text = "";
    try {
      text = fs.readFileSync(this.file, "utf8");
    } catch (_) {
      return this.cache = [];
    }
    const out = [];
    for (const l of text.split("\\n").slice(-3e3)) {
      if (!l.trim()) continue;
      try {
        out.push(JSON.parse(l));
      } catch (_) {
      }
    }
    return this.cache = out;
  }
  add(verdict, key, prompt2, negative, file) {
    if (!prompt2) return;
    const all = this.all();
    if (file && all.some((r) => r.file === file && r.verdict === verdict)) return;
    const rec = { at: Date.now(), verdict, key: String(key || ""), file: String(file || ""), prompt: String(prompt2), negative: String(negative || "") };
    all.push(rec);
    if (all.length > 3e3) all.splice(0, all.length - 3e3);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(rec) + "\\n");
      if (++this.pending >= 2e3) this.compact();
    } catch (_) {
    }
  }
  compact() {
    try {
      const keep = this.all().map((r) => JSON.stringify(r)).join("\\n") + "\\n";
      const tmp = this.file + ".tmp";
      fs.writeFileSync(tmp, keep);
      fs.renameSync(tmp, this.file);
      this.pending = 0;
    } catch (_) {
    }
  }
  counts() {
    const a = this.all();
    return { good: a.filter((r) => r.verdict === "good").length, bad: a.filter((r) => r.verdict === "bad").length };
  }
};
    function suggestions(`;

const SHAPEDIFF = `function shapeDiff(sent, kept) {
      if (typeof sent === "string" && typeof kept === "string" && sent.length > kept.length) return { kind: "string", from: sent.length, to: kept.length };
      if (typeof sent === "number" && typeof kept === "number" && sent !== kept) return { kind: "number", from: sent, to: kept };
      if (Array.isArray(sent) && Array.isArray(kept) && sent.length > kept.length) return { kind: "array", from: sent.length, to: kept.length };
      if (sent && kept && typeof sent === "object" && typeof kept === "object" && !Array.isArray(sent) && !Array.isArray(kept)) {
        const dropped = Object.keys(sent).filter((k) => !Object.prototype.hasOwnProperty.call(kept, k));
        if (dropped.length) return { kind: "keys", count: dropped.length, dropped: dropped.slice(0, 8) };
      }
      return null;
    }`;

const CLIENT_WARN = `            if (j.warnings && j.warnings.length) {
              var _w = j.warnings;
              var _t = _w.slice(0, 5).map(function(x) {
                if (x.kind === "string") return x.path + ": обрезано с " + x.from + " до " + x.to;
                if (x.kind === "array") return x.path + ": осталось " + x.to + " из " + x.from;
                if (x.kind === "number") return x.path + ": " + x.from + " → " + x.to;
                if (x.kind === "keys") return x.path + ": выброшено ключей " + x.count;
                return x.path;
              });
              setTimeout(function() {
                say("Сохранено, но обрезано (" + _w.length + "): " + _t.join(" · ") + (_w.length > 5 ? " …" : ""), false);
              }, 0);
              try {
                console.warn("[Wayward Bridge] при сохранении обрезано:", _w);
              } catch (e) {
              }
            }`;

const BANNER = `setInterval(checkActiveHeroine, 3e3);
        setInterval(compatBanner, 3e3);
        function compatBanner() {
          var el = document.getElementById("wb-compat");
          var d = S.st && S.st.diagnostics ? S.st.diagnostics : null;
          var g = d ? d.game : null;
          var bad = [];
          if (d && !g) bad.push("index.html игры не читается");
          if (g && g.hooks) {
            if (g.hooks.parts === false) bad.push("хук частей промпта (PARTS)");
            if (g.hooks.store === false) bad.push("доступ к стору игры (STORE)");
            if (g.hooks.builder === false) bad.push("кнопка создания своей героини");
          }
          if (g && g.tables && Array.isArray(g.tables.missing) && g.tables.missing.length) {
            bad.push("не найдено таблиц промптов: " + g.tables.missing.length);
          }
          if (!bad.length) {
            if (el) el.remove();
            return;
          }
          if (!el) {
            el = document.createElement("div");
            el.id = "wb-compat";
            el.title = "Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
            el.addEventListener("click", function() {
              el.remove();
            });
            document.body.appendChild(el);
          }
          el.textContent = "⚠ Мод не совместим с текущей версией игры: " + bad.join(", ") + ". Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
        }`;

const NEW_FN = `function compatBanner() {
  try {
    var el = document.getElementById("wb-compat");
    var d = typeof S !== "undefined" && S && S.st && S.st.diagnostics ? S.st.diagnostics : null;
    var g = d && d.game ? d.game : null;
    var bad = [];
    if (d && !g) bad.push("index.html игры не читается");
    if (g && g.hooks) {
      if (g.hooks.parts === false) bad.push("хук частей промпта (PARTS)");
      if (g.hooks.store === false) bad.push("доступ к стору игры (STORE)");
      if (g.hooks.customWives === false) bad.push("кнопка создания своей героини");
      if (g.hooks.partsBroken === true) bad.push("хук частей промпта собран, но ломает игру");
    }
    var tbl = g && g.tables ? g.tables : g && g.catalog ? g.catalog.found : null;
    if (Array.isArray(tbl) && tbl.length) bad.push("не найдено таблиц промптов: " + tbl.length);
    if (tbl && !Array.isArray(tbl) && typeof tbl === "object") {
      var miss = Object.keys(tbl).filter(function(k) {
        return !tbl[k];
      });
      if (miss.length) bad.push("не найдено таблиц промптов: " + miss.length + " (" + miss.slice(0, 4).join(", ") + ")");
    }
    window.__wbCompatDebug = { hasState: !!d, hasGame: !!g, hooks: g && g.hooks ? g.hooks : null, bad: bad.slice() };
    if (bad.length && Date.now() - (window.__wbCompatAt || 0) > 2500) {
      window.__wbCompatAt = Date.now();
      fetch("/bridge/api/state").then(function(r) {
        return r.json();
      }).then(function(j) {
        if (j && j.diagnostics && typeof S !== "undefined" && S && S.st) S.st.diagnostics = j.diagnostics;
      }).catch(function() {
      });
    }
    if (!bad.length) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "wb-compat";
      el.title = "Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
      el.addEventListener("click", function() {
        el.remove();
      });
      (document.body || document.documentElement).appendChild(el);
      if (!el.getBoundingClientRect().height) (document.documentElement || document.body).appendChild(el);
    }
    el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer";
    el.textContent = "⚠ Мод не совместим с текущей версией игры: " + bad.join(", ") + ". Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
  } catch (e) {
    try {
      console.warn("[wb-compat] ошибка:", e);
    } catch (_) {
    }
  }
}`;

const PATCHES = [
  { id: "B2-str-32000", find: 'var str = \\(max = 8e3\\) => \\(v\\) => typeof v === "string" && v\\.length <= max \\? String\\(v\\) : void 0;',
    replace: 'var cutAt = (s, max) => {\n      if (s.length <= max) return s;\n      const head = s.slice(0, max);\n      const c = head.lastIndexOf(",");\n      if (c > max * 0.5) return head.slice(0, c).replace(/[\\s,]+$/, "");\n      const w = head.search(/\\s\\S*$/);\n      return w > 0 ? head.slice(0, w).trim() : head;\n    };\n    var str = (max = 32e3) => (v) => typeof v === "string" ? cutAt(v, max) : void 0;' },
  { id: "B3-num-clamp", find: 'Number\\.isFinite\\((\\w+)\\) && \\1 >= lo && \\1 <= hi \\? \\1 : void 0', replace: 'Number.isFinite($1) ? Math.min(hi, Math.max(lo, $1)) : void 0' },
  { id: "B2-counter", find: 'if \\(opts\\.isChar\\) ta\\._isChar = true;',
    replace: 'if (opts.isChar) ta._isChar = true;\n          var cnt = h("span", { class: "cnt" });\n          var LIM = opts.single ? 4e3 : 32e3;\n          var syncCnt = function() {\n            var n = ta.value.length;\n            cnt.textContent = n + " / " + LIM;\n            cnt.classList.toggle("over", n > LIM);\n          };\n          ta.addEventListener("input", syncCnt);\n          syncCnt();' },
  { id: "B2-counter-mount", find: 'opts\\.noDefaultHint \\? null : hint\\);', replace: 'opts.noDefaultHint ? null : hint, cnt);' },
  { id: "B2-counter-css", find: '"\\.addonrow\\{border-color:rgba\\(var\\(--acr\\),\\.35\\);background:rgba\\(var\\(--acr\\),\\.05\\)\\}",',
    replace: '".addonrow{border-color:rgba(var(--acr),.35);background:rgba(var(--acr),.05)}",\n            ".cnt{float:right;font-size:11px;opacity:.55;font-variant-numeric:tabular-nums}",\n            ".cnt.over{color:#ff8080;opacity:1;font-weight:600}",' },
  { id: "B5-setAt-proto", expect: 2, find: 'o\\[p\\[p\\.length - 1\\]\\] = v;', replace: 'Object.defineProperty(o, p[p.length - 1], { value: v, writable: true, enumerable: true, configurable: true });' },
  { id: "B5-clean-skip", find: 'if \\(k === "__proto__" \\|\\| k === "constructor" \\|\\| k === "prototype"\\) continue;', replace: '' },
  { id: "B5-clean-def", find: 'if \\(c !== void 0\\) out\\[k\\] = c;', replace: 'if (c !== void 0) Object.defineProperty(out, k, { value: c, writable: true, enumerable: true, configurable: true });' },
  { id: "B7-useSave-revision", find: 'this\\.activeSave = saveId;\\s*\\n\\s*writeAtomic\\(this\\.file, JSON\\.stringify\\(this\\.settings, null, 2\\) \\+ "\\\\n"\\);',
    replace: 'this.activeSave = saveId;\n        this.revision = (this.revision || 0) + 1;\n        writeAtomic(this.file, JSON.stringify(this.settings, null, 2) + "\\n");' },
  { id: "B8-backup-unique", find: 'toISOString\\(\\)\\.replace\\(/\\[:\\.\\]/g, "-"\\)', replace: 'toISOString().replace(/[:.]/g, "-") + "-" + Math.random().toString(36).slice(2, 7)' },
  { id: "B6-undo-changed", find: 'this\\.changed\\.clear\\(\\);', replace: '/* changed не чистим: после undo устаревший клиент должен получить 409 */' },
  { id: "B9-writeAtomic-sleep", find: 'while \\(Date\\.now\\(\\) < until\\) \\{\\s*\\}', replace: 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, until - Date.now()));' },
  { id: "B39-check-game-bool", find: 'String\\(args\\["check-game"\\]\\)', replace: '(args["check-game"] === true ? "." : String(args["check-game"]))' },
  { id: "B40-handled-api", find: 'HANDLED_API = \\[', replace: 'HANDLED_API = ["/api/image-file",' },
  { id: "B10-hires-node-ids",
    find: 'g\\["50"\\] = \\{ class_type: "UpscaleModelLoader", inputs: \\{ model_name: pickModel\\(caps && caps\\.models && caps\\.models\\.upscale, hr\\.model\\) \\} \\};\\s*\\n\\s*g\\["51"\\] = \\{ class_type: "ImageUpscaleWithModel", inputs: \\{ upscale_model: \\["50", 0\\], image: img \\} \\};\\s*\\n\\s*img = \\["51", 0\\];',
    replace: 'g["70"] = { class_type: "UpscaleModelLoader", inputs: { model_name: pickModel(caps && caps.models && caps.models.upscale, hr.model) } };\n        g["71"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["70", 0], image: img } };\n        img = ["71", 0];' },
  { id: "B10a-upscaler-live", find: 'upscaler: "",\\s*\\n\\s*// the 2\\.0 upscaler option became the hi-res fix', replace: 'upscaler: pick(f.upscaler, ""),\n        // the 2.0 upscaler option became the hi-res fix' },
  { id: "B10b-upscaler-guard", find: 'if \\(p\\.upscaler && !args\\.portrait\\) \\{', replace: 'if (p.upscaler && !args.portrait && !(typeof g !== "undefined" && g && g["70"]) && !(typeof graph !== "undefined" && graph && graph["70"])) {' },
  { id: "B43-B44-ratings", find: 'var Ratings = class \\{[\\s\\S]*?\\n    \\};\\n    function suggestions\\(', replace: RATINGS_NEW },

  { id: "A1-shapeDiff", find: '"src/server/store\\.js"\\(exports2, module2\\) \\{\\s*"use strict";', replace: '"src/server/store.js"(exports2, module2) {\n    "use strict";\n    ' + SHAPEDIFF },
  { id: "A2-warnings-array", find: 'const next = clone\\(this\\.settings\\);\\s*\\n\\s*const touched = \\[\\];', replace: 'const warnings = this.lastWarnings = [];\n        const next = clone(this.settings);\n        const touched = [];' },
  { id: "A3-collect", find: 'const value = clean\\(v, op\\.value\\);\\s*\\n\\s*if \\(value === void 0\\) throw httpError\\(400, "Invalid value for " \\+ key\\);',
    replace: 'const value = clean(v, op.value);\n          if (value === void 0) throw httpError(400, "Invalid value for " + key);\n          const _d = shapeDiff(op.value, value);\n          if (_d) warnings.push(Object.assign({ path: key }, _d));' },
  { id: "A4-route-warnings", find: 'const r = store\\.patch\\(body\\.ops, body\\.revision\\);\\s*\\n\\s*return send\\(res, 200, Object\\.assign\\(r, \\{ state: stateFor\\(\\) \\}\\)\\);',
    replace: 'const r = store.patch(body.ops, body.revision);\n        return send(res, 200, Object.assign(r, { state: stateFor(), warnings: store.lastWarnings || [] }));' },
  { id: "A5-client-show", find: 'setState\\(j\\.state\\);\\s*\\n\\s*if \\(renamed\\) syncNamesToGame\\(\\);', replace: 'setState(j.state);\n            if (renamed) syncNamesToGame();\n' + CLIENT_WARN },

  { id: "B1-banner", find: 'setInterval\\(checkActiveHeroine, 3e3\\);', replace: BANNER },
  { id: "B2-banner-css", find: '"\\.cnt\\.over\\{color:#ff8080;opacity:1;font-weight:600\\}",',
    replace: '".cnt.over{color:#ff8080;opacity:1;font-weight:600}",\n            "#wb-compat{position:fixed;top:0;left:0;right:0;z-index:9999;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer}",' },
  { id: "B2-fix-key", find: 'if \\(g\\.hooks\\.builder === false\\) bad\\.push\\("кнопка создания своей героини"\\);',
    replace: 'if (g.hooks.customWives === false) bad.push("кнопка создания своей героини");\n            if (g.hooks.partsBroken === true) bad.push("хук частей промпта собран, но ломает игру");' },
  { id: "B2-fix-tables", find: 'if \\(g && g\\.tables && Array\\.isArray\\(g\\.tables\\.missing\\) && g\\.tables\\.missing\\.length\\) \\{\\s*\\n\\s*bad\\.push\\("не найдено таблиц промптов: " \\+ g\\.tables\\.missing\\.length\\);\\s*\\n\\s*\\}',
    replace: 'var _miss = (g && g.tables && g.tables.missing) || (g && g.missingTables) || (g && g.catalog && g.catalog.missing) || (g && g.tables && g.tables.found) || (g && g.catalog && g.catalog.found) || null;\n          if (Array.isArray(_miss) && _miss.length) bad.push("не найдено таблиц промптов: " + _miss.length);\n          if (_miss && !Array.isArray(_miss) && typeof _miss === "object") {\n            var _m = Object.keys(_miss).filter(function(k) {\n              return !_miss[k];\n            });\n            if (_m.length) bad.push("не найдено таблиц промптов: " + _m.length + " (" + _m.slice(0, 4).join(", ") + ")");\n          }' },
  { id: "B3-instrument", find: 'function compatBanner\\(\\) \\{[\\s\\S]*?\\n        \\}', replace: NEW_FN },
  { id: "B3-z-index", find: 'z-index:9999;background:#3a1414', replace: 'z-index:2147483647;background:#3a1414' },
  { id: "B4-inline-style", find: 'el\\.textContent = "⚠ Мод не совместим', replace: 'el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer";\n    el.textContent = "⚠ Мод не совместим' },
  { id: "B4-parent-fallback", find: '\\(document\\.body \\|\\| document\\.documentElement\\)\\.appendChild\\(el\\);', replace: '(document.body || document.documentElement).appendChild(el);\n      if (!el.getBoundingClientRect().height) (document.documentElement || document.body).appendChild(el);' },
  { id: "B5-fresh-diag", find: 'if \\(!bad\\.length\\) \\{\\s*\\n\\s*if \\(el\\) el\\.remove\\(\\);\\s*\\n\\s*return;\\s*\\n\\s*\\}',
    replace: 'if (bad.length && Date.now() - (window.__wbCompatAt || 0) > 2500) {\n      window.__wbCompatAt = Date.now();\n      fetch("/bridge/api/state").then(function(r) {\n        return r.json();\n      }).then(function(j) {\n        if (j && j.diagnostics && typeof S !== "undefined" && S && S.st) S.st.diagnostics = j.diagnostics;\n      }).catch(function() {\n      });\n    }\n    if (!bad.length) {\n      if (el) el.remove();\n      return;\n    }' },
];

let src;
try { src = fs.readFileSync(FILE, "utf8"); }
catch (e) { console.error("Не нашёл " + FILE); process.exit(1); }

const log = [];
let out = src, ok = 0, miss = 0;

for (const p of PATCHES) {
  const re = new RegExp(p.find, "g");
  const n = (out.match(re) || []).length;
  const want = p.expect || 1;
  if (n === want) {
    out = out.replace(re, p.replace);
    ok++;
    log.push("OK    " + p.id);
  } else {
    miss++;
    log.push("MISS  " + p.id + "  (найдено " + n + ", ожидалось " + want + ")");
  }
}

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Патчей: " + PATCHES.length + ", применено: " + ok + ", пропущено: " + miss);
console.log("Итог:  " + OUT);