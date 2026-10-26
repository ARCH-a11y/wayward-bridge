// wb-av1.js — строка «Внешность» в разборе промпта: отдельная строка, второй в списке,
// с тегами и источником. Патчит src/008 + маркеры в wb-verify.js. Запись только если все якоря на месте.
const fs = require('fs');
const P = 'src/008-src_server_prompt.js';
const V = 'wb-verify.js';
let bad = 0;

const orig = fs.readFileSync(P, 'utf8');
const eol = orig.includes('\r\n') ? '\r\n' : '\n';
let s = orig;

function sub(anchor, repl, name) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) {
    bad++;
    console.log('MISS ' + name + ': найдено=' + n);
    const at = s.indexOf(anchor);
    if (at >= 0) console.log('   ' + JSON.stringify(s.slice(Math.max(0, at - 70), at + 130)));
    return;
  }
  s = s.replace(anchor, () => repl);
  console.log('ok ' + name);
}

// 1) expandHero отдаёт разбивку по частям
sub(
  '      if (!hero) return { base: "", negative: "" };\n      const base = [], neg = [];',
  '      if (!hero) return { base: "", negative: "", parts: [] };\n      const base = [], neg = [], parts = [];',
  'expandHero: parts объявлен');

sub(
  '      const bellyTag = child && child.stage && child.stage !== "none" ? BELLY_TAGS[child.stage] || "" : "";',
  '      if (String(hero.base || "").trim()) parts.push({ kind: "base", tags: String(hero.base).trim() });\n      const bellyTag = child && child.stage && child.stage !== "none" ? BELLY_TAGS[child.stage] || "" : "";',
  'expandHero: часть base');

sub(
  '          if (bellyTag) base.push(bellyTag);\n          if (String(s.tags || "").trim()) base.push(String(s.tags).trim());\n          if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n          continue;',
  '          if (bellyTag) { base.push(bellyTag); parts.push({ kind: "belly", id, tags: bellyTag }); }\n          if (String(s.tags || "").trim()) { base.push(String(s.tags).trim()); parts.push({ kind: "section", id, tags: String(s.tags).trim() }); }\n          if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n          continue;',
  'expandHero: часть belly');

sub(
  '        if (String(s.tags || "").trim()) base.push(String(s.tags).trim());\n        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n      }\n      if (!sawBelly && bellyTag) base.push(bellyTag);\n      if (child && child.milk) base.push("lactating breasts, milk");',
  '        if (String(s.tags || "").trim()) { base.push(String(s.tags).trim()); parts.push({ kind: "section", id, tags: String(s.tags).trim() }); }\n        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n      }\n      if (!sawBelly && bellyTag) { base.push(bellyTag); parts.push({ kind: "belly", id: "belly", tags: bellyTag }); }\n      if (child && child.milk) { base.push("lactating breasts, milk"); parts.push({ kind: "milk", tags: "lactating breasts, milk" }); }',
  'expandHero: части section/belly/milk');

sub(
  '        if (String(q.tags || "").trim()) base.push(String(q.tags).trim());',
  '        if (String(q.tags || "").trim()) { base.push(String(q.tags).trim()); parts.push({ kind: "quarantine", id, when: q.when, tags: String(q.tags).trim() }); }',
  'expandHero: часть quarantine');

sub(
  '        negative: [String(hero.negative || "").trim(), ...neg].filter(Boolean).join(", ")\n      };',
  '        negative: [String(hero.negative || "").trim(), ...neg].filter(Boolean).join(", "),\n        parts\n      };',
  'expandHero: parts в return');

// 2) сборка строки
sub(
  '    function compose(input) {',
  [
    '    function buildAppearanceRow(heroine, defX, effX, notes, origin) {',
    '      const final = splitTags((effX && effX.base) || (defX && defX.base) || "");',
    '      const hasNotes = !!(notes && notes.length);',
    '      if (!final.length && !hasNotes) return null;',
    '      const defParts = new Map(((defX && defX.parts) || []).map((p) => [p.kind + ":" + (p.id || ""), p.tags]));',
    '      const changes = [];',
    '      for (const p of (effX && effX.parts) || []) {',
    '        const def = defParts.get(p.kind + ":" + (p.id || ""));',
    '        if (def != null && def === p.tags) continue;',
    '        const isBase = p.kind === "base";',
    '        const path = isBase ? ["heroines", heroine, "base"] : ["heroines", heroine, "sections", p.id || p.kind, "tags"];',
    '        changes.push({',
    '          id: isBase ? "base" : p.kind + "." + (p.id || p.kind),',
    '          from: def || "",',
    '          to: p.tags,',
    '          source: origin(path),',
    '          rel: { path: ["prompts", ...path] }',
    '        });',
    '      }',
    '      return {',
    '        label: "Внешность",',
    '        game: (defX && defX.base) || "",',
    '        final: joinTags(final),',
    '        changes,',
    '        rel: changes.length ? changes[0].rel : { path: ["prompts", "heroines", heroine, "base"] },',
    '        note: hasNotes ? notes.join("; ") : ""',
    '      };',
    '    }',
    '',
    '    function compose(input) {'
  ].join('\n'),
  'buildAppearanceRow');

// 3) убрать старую строку-хвост и поставить новую второй
sub(
  '      if (notes.length) explain.push({ label: "Внешность", note: notes.join("; ") });',
  '      // строка «Внешность» ставится ниже, второй после Quality tags (см. buildAppearanceRow)',
  'убрать старую строку Внешность');

sub(
  '      if (!usingParts) warnings.push("The game did not send prompt parts for this picture',
  '      const appearRow = buildAppearanceRow(heroine, heroDefX, heroEffX, notes, origin);\n      if (appearRow) explain.splice(1, 0, appearRow);\n      if (!usingParts) warnings.push("The game did not send prompt parts for this picture',
  'вставка строки второй');

// 4) маркеры verify
let v = fs.readFileSync(V, 'utf8');
const vAnchor = '  ["H1o: запись не путает персонажей", "nn пишет чужую запись", 1],';
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else {
  v = v.replace(vAnchor, () => vAnchor + '\n' +
    '  ["Внешность: строка в разборе", "buildAppearanceRow", 2],\n' +
    '  ["Внешность: вставка второй", "explain.splice(1, 0, appearRow)", 1],\n' +
    "  [\"Внешность: разметка частей\", 'parts.push({ kind: \"section\"', 2],");
  console.log('ok wb-verify: 3 маркера');
}

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }

fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');

const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (needle, want) => { const n = a.split(needle).length - 1; if (n !== want) { err++; console.log('!! ' + needle + ': ' + n + ' != ' + want); } else console.log('ok ' + needle + ': ' + n); };
chk('buildAppearanceRow', 2);
chk('explain.splice(1, 0, appearRow)', 1);
chk('parts.push({ kind: "section"', 2);
chk('parts.push({ kind: "quarantine"', 1);
chk('if (notes.length) explain.push({ label: "Внешность"', 0);
console.log('---');
console.log('src/008: ' + orig.length + ' -> ' + a.length + ' символов');
if (err) process.exit(1);