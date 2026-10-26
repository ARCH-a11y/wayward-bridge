// wb-av4.js — строка «Внешность»: Edit на корень sections, без дублей в Base, диагностика, точный маркер
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

// 1) собрать теги внешности и их ключи
sub(
  '      const partOv = E.parts || {};\n      const out = [];',
  '      const partOv = E.parts || {};\n      const out = [];\n      const appearTags = splitTags(heroEffX.base || "");\n      const appearKeys = new Set(appearTags.map(tagKey));',
  'appearTags/appearKeys');

// 2) грубая правка base больше не пишется в строку Base (части её покрывают)
sub(
  '              changes.push({ id: heroine, from: heroDefX.base, to: heroEffX.base, source: origin(["heroines", heroine, "base"]) });\n',
  '',
  'убрать грубую правку base');

// 3) вырезать теги внешности из остальных строк, пустые строки убрать
sub(
  '      const positiveTags = dedupe([...head, ...out.flatMap((p) => p.tags), ...ruleAdded]);',
  '      if (appearKeys.size) {\n        for (const p of out) p.tags = p.tags.filter((t) => !appearKeys.has(tagKey(t)));\n        for (let i = out.length - 1; i >= 0; i--) if (!out[i].tags.length && !out[i].changes.length) out.splice(i, 1);\n      }\n      const positiveTags = dedupe([...head, ...appearTags, ...out.flatMap((p) => p.tags), ...ruleAdded]);',
  'вырезание из остальных строк');

// 4) внешность в yours (иначе уедет из негатива)
sub(
  '      for (const t of splitTags(P.quality)) yours.add(tagKey(t));',
  '      for (const t of splitTags(P.quality)) yours.add(tagKey(t));\n      for (const t of appearTags) yours.add(tagKey(t));',
  'yours: теги внешности');

// 5) свой путь правки для quarantine
sub(
  '        const isBase = p.kind === "base";\n        const path = isBase ? ["heroines", heroine, "base"] : ["heroines", heroine, "sections", p.id || p.kind, "tags"];',
  '        const isBase = p.kind === "base";\n        const path = isBase ? ["heroines", heroine, "base"] : p.kind === "quarantine" ? ["heroines", heroine, "quarantine", p.id || p.kind, "tags"] : ["heroines", heroine, "sections", p.id || p.kind, "tags"];',
  'путь для quarantine');

// 6) с правок снять rel — он нестандартный, Edit смотрит на строку
sub(
  '          source: origin(path),\n          rel: { path: ["prompts", ...path] }\n        });',
  '          source: origin(path)\n        });',
  'снять rel с правок');

// 7) rel строки — на корень sections
sub(
  '        rel: changes.length ? changes[0].rel : { path: ["prompts", "heroines", heroine, "base"] },',
  '        rel: { path: ["prompts", "heroines", heroine, "sections"] },',
  'rel строки на sections');

// 8) final строки — строго из eff
sub(
  '      const final = splitTags((effX && effX.base) || (defX && defX.base) || "");',
  '      const final = splitTags((effX && effX.base) || "");',
  'final строки из eff');

// 9) диагностика
sub(
  '      if (!final.length && !hasNotes) return null;',
  '      if (!final.length && !hasNotes) { console.log("[wb] Внешность: строки нет (нет тегов и заметок)"); return null; }',
  'лог пустой строки');

sub(
  '      return {\n        label: "Внешность",',
  '      console.log("[wb] Внешность: тегов=" + final.length + ", правок=" + changes.length + ", заметок=" + (hasNotes ? 1 : 0));\n      return {\n        label: "Внешность",',
  'лог сборки строки');

// 10) verify: точный маркер + новые
let v = fs.readFileSync(V, 'utf8');
const mOld = '  ["Внешность: строка в разборе", "buildAppearanceRow", 2],';
if (v.split(mOld).length - 1 !== 1) { bad++; console.log('MISS wb-verify: старый маркер'); }
else { v = v.replace(mOld, () => '  ["Внешность: строка в разборе", "function buildAppearanceRow(", 1],'); console.log('ok wb-verify: маркер уточнён'); }

const vAnchor = "  [\"Внешность: разметка частей\", 'parts.push({ kind: \"section\"', 2],";
if (v.split(vAnchor).length - 1 !== 1) { bad++; console.log('MISS wb-verify: якорь'); }
else {
  v = v.replace(vAnchor, () => vAnchor + '\n' +
    '  ["Внешность: диагностика", "[wb] Внешность", 2],\n' +
    '  ["Внешность: не дублируется", "appearKeys.has(tagKey(t))", 1],\n' +
    '  ["Внешность: теги в positive", "...head, ...appearTags, ...out.flatMap", 1],\n' +
    "  [\"Внешность: rel на секции\", 'rel: { path: [\"prompts\", \"heroines\", heroine, \"sections\"] },', 1],");
  console.log('ok wb-verify: 4 маркера');
}

if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }
fs.writeFileSync(P, s, 'utf8');
fs.writeFileSync(V, v, 'utf8');

const a = fs.readFileSync(P, 'utf8');
let err = 0;
const chk = (n, w) => { const c = a.split(n).length - 1; if (c !== w) { err++; console.log('!! ' + n + ': ' + c + ' != ' + w); } else console.log('ok ' + n + ': ' + c); };
chk('changes.push({ id: heroine, from: heroDefX.base', 0);
chk('appearKeys.size', 1);
chk('...head, ...appearTags,', 1);
chk('for (const t of appearTags) yours.add', 1);
chk('rel: changes.length ? changes[0].rel', 0);
chk('[wb] Внешность', 2);
chk('"sections"] },', 1);
console.log('src/008: ' + orig.length + ' -> ' + a.length);
if (err) process.exit(1);