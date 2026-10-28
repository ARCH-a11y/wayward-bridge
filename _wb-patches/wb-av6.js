// wb-av6.js — строка «Negative · Внешность»: негатив из частей внешности отдельной строкой, с источниками
const fs = require('fs');
const P = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let bad = 0;
let s = fs.readFileSync(P, 'utf8');
const orig = s;

function sub(anchor, repl, name) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) { bad++; console.log('MISS ' + name + ': найдено=' + n); return; }
  s = s.replace(anchor, () => repl);
  console.log('ok ' + name);
}

// 1) negParts в expandHero
sub(
  '      if (!hero) return { base: "", negative: "", parts: [] };\n      const base = [], neg = [], parts = [];',
  '      if (!hero) return { base: "", negative: "", parts: [], negParts: [] };\n      const base = [], neg = [], parts = [], negParts = [];',
  'negParts объявлен');

// 2) негатив живота
sub(
  '          if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n          continue;',
  '          if (String(s.negative || "").trim()) { neg.push(String(s.negative).trim()); negParts.push({ kind: "section", id, tags: String(s.negative).trim() }); }\n          continue;',
  'негатив belly в negParts');

// 3) негатив части
sub(
  '        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n      }',
  '        if (String(s.negative || "").trim()) { neg.push(String(s.negative).trim()); negParts.push({ kind: "section", id, tags: String(s.negative).trim() }); }\n      }',
  'негатив части в negParts');

// 4) негатив карантина
sub(
  '        if (String(q.negative || "").trim()) neg.push(String(q.negative).trim());',
  '        if (String(q.negative || "").trim()) { neg.push(String(q.negative).trim()); negParts.push({ kind: "quarantine", id, tags: String(q.negative).trim() }); }',
  'негатив карантина в negParts');

// 5) negParts в return
sub(
  '        negative: [String(hero.negative || "").trim(), ...neg].filter(Boolean).join(", "),\n        parts\n      };',
  '        negative: [String(hero.negative || "").trim(), ...neg].filter(Boolean).join(", "),\n        parts,\n        negParts\n      };',
  'negParts в return');

// 6) сборка строки
sub(
  '    function composeNegative(input, positiveTags, explain, warnings, heroDef, heroEff, yours) {',
  [
    '    function buildAppearanceNegRow(heroine, defX, effX, origin) {',
    '      const parts = (effX && effX.negParts) || [];',
    '      const final = parts.flatMap((p) => splitTags(p.tags));',
    '      if (!final.length) return null;',
    '      const defParts = new Map(((defX && defX.negParts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));',
    '      const changes = [];',
    '      for (const p of parts) {',
    '        const def = defParts.get(p.kind + ":" + (p.id || ""));',
    '        if (def != null && def === p.tags) continue;',
    '        const path = p.kind === "quarantine" ? ["heroines", heroine, "quarantine", p.id || p.kind, "negative"] : ["heroines", heroine, "sections", p.id || p.kind, "negative"];',
    '        changes.push({ id: p.kind + "." + (p.id || p.kind), from: def || "", to: p.tags, source: origin(path) });',
    '      }',
    '      return {',
    '        label: "Внешность",',
    '        game: "",',
    '        final: joinTags(final),',
    '        changes,',
    '        negative: true,',
    '        rel: { path: ["prompts", "heroines", heroine, "sections"] }',
    '      };',
    '    }',
    '',
    '    function composeNegative(input, positiveTags, explain, warnings, heroDef, heroEff, yours) {'
  ].join('\n'),
  'buildAppearanceNegRow');

// 7) вставить строку перед «Character negative»
sub(
  '      const pipeKeys = new Set(splitTags(P.negative).map(tagKey));',
  '      const appearNegRow = buildAppearanceNegRow(input.heroine, heroDefX, heroEffX, origin);\n      if (appearNegRow) {\n        const cnIdx = rows.findIndex((r) => String(r.label).indexOf("Character negative") === 0);\n        rows.splice(cnIdx >= 0 ? cnIdx : 1, 0, appearNegRow);\n      }\n      const pipeKeys = new Set(splitTags(P.negative).map(tagKey));',
  'вставка строки в rows');

// 8) маркеры
let v = fs.readFileSync(V, 'utf8');
const vAnchor = '  ["Внешность: разметка частей", \'parts.push({ kind: "section"\', 2],';
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else {
  v = v.replace(vAnchor, () => vAnchor + '\n' +
    '  ["Внешность: негатив строкой", "buildAppearanceNegRow", 2],\n' +
    '  ["Внешность: негатив в rows", \'indexOf("Character negative")\', 1],\n' +
    '  ["Внешность: negParts части", \'negParts.push({ kind: "section"\', 2],');
  console.log('ok wb-verify: 3 маркера');
}

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');

const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('negParts: []', 1);
chk('negParts.push({ kind: "section"', 2);
chk('negParts.push({ kind: "quarantine"', 1);
chk('buildAppearanceNegRow', 2);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);