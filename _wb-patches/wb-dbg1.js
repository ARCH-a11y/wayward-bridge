// wb-dbg1.js — временная диагностика частей у негативной строки
const fs = require('fs');
const S8 = 'src/008-src_server_prompt.js';
const S19 = 'src/019-src_server_assets.generated.js';
let a = fs.readFileSync(S8, 'utf8');
let b = fs.readFileSync(S19, 'utf8');

const f1 = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, parts: r.parts || null, rel: r.rel || null });`;
const t1 = String.raw`      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) { if (/Внешность/.test(String(r.label))) console.log("[wb] neg row:", r.label, "parts:", r.parts ? r.parts.length : "null", "rel:", r.rel && r.rel.kind); explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, parts: r.parts || null, rel: r.rel || null }); }`;

const f2 = String.raw`          } else if (rel && rel.kind === "appear") {
            parts.push(h("div", { class: "note" }, "Each part below is one piece of the look. What you type replaces that part in every picture that has it; clearing it removes the part."));`;
const t2 = String.raw`          } else if (rel && rel.kind === "appear") {
            parts.push(h("div", { class: "note", style: "color:#f87171" }, "[wb] parts=" + (e.parts ? e.parts.length : "null") + " rel=" + (rel && rel.kind)));
            parts.push(h("div", { class: "note" }, "Each part below is one piece of the look. What you type replaces that part in every picture that has it; clearing it removes the part."));`;

for (const [f, from, to, name] of [[S8, f1, t1, '008'], [S19, f2, t2, '019']]) {
  const src = f === S8 ? a : b;
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('MISS ' + name + ': ' + n + ', не записано'); process.exit(1); }
  if (f === S8) a = a.replace(from, to); else b = b.replace(from, to);
  console.log('ok ' + name);
}
fs.writeFileSync(S8, a, 'utf8');
fs.writeFileSync(S19, b, 'utf8');
console.log('записано');