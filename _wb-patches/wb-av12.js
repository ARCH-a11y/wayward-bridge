// wb-av12.js — инспектор: Edit у «Внешности» открывает поля по частям
const fs = require('fs');
const files = {};
const get = (f) => (files[f] !== undefined ? files[f] : (files[f] = fs.readFileSync(f, 'utf8')));
const plan = [];
const rep = (f, from, to, label) => plan.push({ f, from, to, label });
const S8 = 'src/008-src_server_prompt.js';
const S19 = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';

// 1. положительная строка: список частей с путями на листья
rep(S8,
`      const defParts = new Map(((defX && defX.parts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));
      const changes = [];`,
`      const defParts = new Map(((defX && defX.parts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));
      const parts = ((effX && effX.parts) || []).map((p) => ({
        id: p.kind === "base" ? "base" : p.kind + "." + (p.id || p.kind),
        path: ["prompts", "heroines", heroine].concat(p.kind === "base" ? ["base"] : p.kind === "quarantine" ? ["quarantine", p.id || p.kind, "tags"] : ["sections", p.id || p.kind, "tags"]),
        from: defParts.get(p.kind + ":" + (p.id || "")) || ""
      }));
      const changes = [];`,
"008: части положительной строки");

rep(S8,
`        final: joinTags(final),
        changes,
        rel: { path: ["prompts", "heroines", heroine, "sections"] },`,
`        final: joinTags(final),
        changes,
        parts,
        rel: { path: ["prompts", "heroines", heroine, "sections"], kind: "appear" },`,
"008: kind у положительной строки");

// 2. негативная строка: то же, лист negative
rep(S8,
`      const defParts = new Map(((defX && defX.negParts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));
      const changes = [];`,
`      const defParts = new Map(((defX && defX.negParts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));
      const parts = ((effX && effX.negParts) || []).map((p) => ({
        id: p.kind === "quarantine" ? "quarantine." + (p.id || p.kind) : p.kind + "." + (p.id || p.kind),
        path: ["prompts", "heroines", heroine].concat(p.kind === "quarantine" ? ["quarantine", p.id || p.kind, "negative"] : ["sections", p.id || p.kind, "negative"]),
        from: defParts.get(p.kind + ":" + (p.id || "")) || ""
      }));
      const changes = [];`,
"008: части негативной строки");

rep(S8,
`        tags: [],
        changes,
        keys: new Set(final.map(tagKey)),
        negative: true,
        rel: { path: ["prompts", "heroines", heroine, "sections"] }`,
`        tags: [],
        changes,
        parts,
        keys: new Set(final.map(tagKey)),
        negative: true,
        rel: { path: ["prompts", "heroines", heroine, "sections"], kind: "appear" }`,
"008: kind у негативной строки");

// 3. клиент: ветка на каждый part, до общего пути
rep(S19, String.raw`          } else if (path) {
            parts.push(promptBox(path.slice(1).join(" \u203A ").replace(/_/g, " "), path, { height: "46px" }));
          }`,
String.raw`          } else if (rel && rel.kind === "appear") {
            parts.push(h("div", { class: "note" }, "Each part below is one piece of the look. What you type replaces that part in every picture that has it; clearing it removes the part."));
            (e.parts || []).forEach(function(p) {
              parts.push(promptBox(String(p.id || "").replace(/_/g, " "), p.path, { height: "46px", gameValue: p.from }));
            });
          } else if (path) {
            parts.push(promptBox(path.slice(1).join(" \u203A ").replace(/_/g, " "), path, { height: "46px" }));
          }`,
"019: ветка appear в редакторе");

// 4. маркеры
rep(V,
`  ["Внешность: rel на секции", 'rel: { path: ["prompts", "heroines", heroine, "sections"] },', 1],`,
`  ["Внешность: rel на секции", 'rel: { path: ["prompts", "heroines", heroine, "sections"], kind: "appear" },', 1],
  ["Внешность: части для правки", "const parts = ((effX && effX.parts) || []).map", 1],
  ["Внешность: ветка appear", 'rel.kind === "appear"', 1],
  ["Внешность: поле на часть", "promptBox(String(p.id ||", 1],
  ["Внешность: путь листа", '["sections", p.id || p.kind, "tags"]', 1],
  ["Внешность: негатив листа", '["sections", p.id || p.kind, "negative"]', 1],`,
"verify: маркеры");

// проверка якорей
let bad = 0;
for (const p of plan) {
  const n = get(p.f).split(p.from).length - 1;
  if (n !== 1) { console.log('MISS ' + p.label + ': ' + n); bad++; }
}
if (bad) { console.log('не записано, промахов: ' + bad); process.exit(1); }
for (const p of plan) { files[p.f] = get(p.f).replace(p.from, p.to); console.log('ok ' + p.label); }
for (const f of Object.keys(files)) fs.writeFileSync(f, files[f], 'utf8');

// самопроверка
const need = [
  [S8, 'const parts = ((effX && effX.parts) || []).map'],
  [S8, 'const parts = ((effX && effX.negParts) || []).map'],
  [S8, 'kind: "appear"'],
  [S19, 'rel.kind === "appear"'],
  [S19, 'p.path, { height: "46px", gameValue: p.from }'],
  [V, "Внешность: негатив листа"]
];
let miss = 0;
for (const [f, n] of need) {
  const c = fs.readFileSync(f, 'utf8').split(n).length - 1;
  if (!c) { console.log('SELF MISS ' + n); miss++; }
}
console.log('частей в 008: ' + (fs.readFileSync(S8, 'utf8').split('path: ["prompts", "heroines", heroine].concat').length - 1));
console.log('ветка в 019: ' + (fs.readFileSync(S19, 'utf8').split('rel.kind === "appear"').length - 1));
console.log('размеры: 008 ' + fs.statSync(S8).size + ', 019 ' + fs.statSync(S19).size + ', verify ' + fs.statSync(V).size);
console.log(miss ? 'САМОПРОВЕРКА ПРОВАЛЕНА: ' + miss : 'самопроверка ок');