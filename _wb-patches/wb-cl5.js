// wb-cl5.js — снять диагностику, доки, счётчики
const fs = require('fs');
const S8 = 'src/008-src_server_prompt.js';
const S19 = 'src/019-src_server_assets.generated.js';
const C = 'CONTEXT.md';
const ST = 'docs/STATE.md';
let a = fs.readFileSync(S8, 'utf8');
let b = fs.readFileSync(S19, 'utf8');
let c = fs.readFileSync(C, 'utf8');
let s = fs.readFileSync(ST, 'utf8');

const f1 = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) { if (/Внешность/.test(String(r.label))) console.log("[wb] neg row:", r.label, "parts:", r.parts ? r.parts.length : "null", "rel:", r.rel && r.rel.kind); explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, parts: r.parts || null, rel: r.rel || null }); }`;
const t1 = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, parts: r.parts || null, rel: r.rel || null });`;
const f2 = `            parts.push(h("div", { class: "note", style: "color:#f87171" }, "[wb] parts=" + (e.parts ? e.parts.length : "null") + " rel=" + (rel && rel.kind)));\n`;
const t2 = ``;

const n1 = a.split(f1).length - 1, n2 = b.split(f2).length - 1;
if (n1 !== 1 || n2 !== 1) { console.log('MISS код: ' + n1 + ' / ' + n2 + ', не записано'); process.exit(1); }
a = a.replace(f1, t1); b = b.replace(f2, t2);
fs.writeFileSync(S8, a, 'utf8'); fs.writeFileSync(S19, b, 'utf8');
console.log('ok снята диагностика');

const before = c;
c = c.split('208 проверок').join('216 проверок').split('208/208').join('216/216');
console.log('ok CONTEXT счётчики: ' + (before === c ? 'без изменений' : 'обновлено'));

const lines = c.split('\n');
const at = lines.findIndex((l) => /текущее verify/.test(l));
if (at >= 0) {
  lines.splice(at + 1, 0, '- ловушка: негативная строка «Внешность» пересобирается в composeNegative (объект с фиксированным списком полей) — новые поля надо протаскивать явно; ключ возврата в строителе — parts, не имя переменной.');
  c = lines.join('\n');
  console.log('ok CONTEXT ловушка');
} else console.log('MISS CONTEXT ловушка');

s = s.trimEnd() + '\n\n- Инспектор «Внешность»: Edit открывает поля по каждой части (позитив и негатив), пути на листья tags/negative. Негативная строка несёт parts; ключ возврата — parts. verify 216/216, тесты 91/91.\n';
fs.writeFileSync(C, c, 'utf8'); fs.writeFileSync(ST, s, 'utf8');
console.log('ok docs/STATE');
console.log('208 в CONTEXT: ' + (fs.readFileSync(C, 'utf8').split('208').length - 1));
console.log('216 в CONTEXT: ' + (fs.readFileSync(C, 'utf8').split('216').length - 1));