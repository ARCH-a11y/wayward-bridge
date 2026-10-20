#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const OUT = "wayward-bridge.patchA.js";
const REPORT = "wb-patchA-report.txt";

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

const PATCHES = [
  { id: "A1-shapeDiff", why: "хелпер сравнения «прислали / сохранили»",
    find: '"src/server/store\\.js"\\(exports2, module2\\) \\{\\s*"use strict";',
    replace: '"src/server/store.js"(exports2, module2) {\n    "use strict";\n    ' + SHAPEDIFF },

  { id: "A2-warnings-array", why: "массив предупреждений на время вызова patch",
    find: 'const next = clone\\(this\\.settings\\);\\s*\\n\\s*const touched = \\[\\];',
    replace: 'const warnings = this.lastWarnings = [];\n        const next = clone(this.settings);\n        const touched = [];' },

  { id: "A3-collect", why: "сбор предупреждений после clean",
    find: 'const value = clean\\(v, op\\.value\\);\\s*\\n\\s*if \\(value === void 0\\) throw httpError\\(400, "Invalid value for " \\+ key\\);',
    replace: 'const value = clean(v, op.value);\n          if (value === void 0) throw httpError(400, "Invalid value for " + key);\n          const _d = shapeDiff(op.value, value);\n          if (_d) warnings.push(Object.assign({ path: key }, _d));' },

  { id: "A4-route-warnings", why: "предупреждения уезжают клиенту вместе с состоянием",
    find: 'const r = store\\.patch\\(body\\.ops, body\\.revision\\);\\s*\\n\\s*return send\\(res, 200, Object\\.assign\\(r, \\{ state: stateFor\\(\\) \\}\\)\\);',
    replace: 'const r = store.patch(body.ops, body.revision);\n        return send(res, 200, Object.assign(r, { state: stateFor(), warnings: store.lastWarnings || [] }));' },

  { id: "A5-client-show", why: "меню показывает, что именно обрезано",
    find: 'setState\\(j\\.state\\);\\s*\\n\\s*if \\(renamed\\) syncNamesToGame\\(\\);',
    replace: 'setState(j.state);\n            if (renamed) syncNamesToGame();\n' + CLIENT_WARN },
];

const MARKERS = [
  ["A1 shapeDiff", "function shapeDiff(sent, kept)"],
  ["A2 warnings", "const warnings = this.lastWarnings = [];"],
  ["A3 сбор", "if (_d) warnings.push(Object.assign({ path: key }, _d));"],
  ["A4 роут", "warnings: store.lastWarnings || []"],
  ["A5 клиент", 'say("Сохранено, но обрезано'],
];

let src;
try { src = fs.readFileSync(FILE, "utf8"); }
catch (e) { console.error("Не нашёл " + FILE); process.exit(1); }

const log = [];
let out = src, ok = 0, miss = 0;

for (const p of PATCHES) {
  const re = new RegExp(p.find, "g");
  const n = (out.match(re) || []).length;
  if (n === 1) {
    out = out.replace(re, p.replace);
    ok++;
    log.push("OK    " + p.id + "  — " + p.why);
  } else {
    miss++;
    log.push("MISS  " + p.id + "  (найдено " + n + ")  — " + p.why);
    const i = out.indexOf(p.id.slice(3, 9));
    log.push("");
  }
}

log.push("");
log.push("=== самопроверка ===");
let bad = 0;
for (const [name, needle] of MARKERS) {
  const n = out.split(needle).length - 1;
  if (n === 0) { bad++; log.push("НЕТ   " + name); }
  else log.push("ок    " + name);
}

fs.writeFileSync(OUT, out);
fs.writeFileSync(REPORT, log.join("\n") + "\n");
console.log("Применено: " + ok + ", пропущено: " + miss + ", проверок не прошло: " + bad);
console.log("Итог:  " + OUT);
console.log("Отчёт: " + REPORT);