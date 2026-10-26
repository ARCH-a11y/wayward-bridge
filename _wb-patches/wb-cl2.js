// wb-cl2.js — снести 3 мёртвые .replace() в src/016 (дубли nn и дубль persons.filter)
const fs = require('fs');
const P = 'src/016-src_server_game.js';
const orig = fs.readFileSync(P, 'utf8');
const eol = orig.includes('\r\n') ? '\r\n' : '\n';
let lines = orig.split(/\r?\n/);
const before = lines.length;
let bad = 0;

const L120 = `.replace('var s=o(n);window.__WB_CARD__=__wc;r={...e.characters,[t]:s};', 'var s=o(n);window.__WB_CARD__=__wc;var r={...e.characters,[t]:s};')`;
const L121 = `.replace('var s=o(n);window.__WB_CARD__=__wc;var r={...e.characters,[t]:s};', 'var s=o(n);window.__WB_CARD__=__wc;if(t===e.primaryCharacterId&&s&&s.id!==t)console.warn("[wb] nn пишет чужую запись:",t,"<-",s.id,(new Error()).stack);var r={...e.characters,[t]:s};')`;

function findTrim(name, want, expect) {
  const hits = [];
  lines.forEach((l, i) => { if (l.trim() === want) hits.push(i); });
  if (hits.length !== expect) {
    bad++;
    console.log('MISS ' + name + ' найдено=' + hits.length + ' ожидалось=' + expect);
    hits.forEach(i => console.log('  стр ' + (i + 1) + ': ' + lines[i].trim()));
    return null;
  }
  console.log('OK ' + name + ' (стр ' + hits.map(i => i + 1).join(', ') + ')');
  return hits;
}

const a = findTrim('мёртвая nn-замена (r={...})', L120, 1);
const b = findTrim('мёртвая nn-замена (var r={...})', L121, 1);

const pf = [];
lines.forEach((l, i) => { if (l.includes(`return n?n.persons.filter(i=>s.has(cp(i))):[]`)) pf.push(i); });
if (pf.length !== 2) { bad++; console.log('MISS дубль persons.filter найдено=' + pf.length + ' ожидалось=2'); }
else if (lines[pf[0]].trim() !== lines[pf[1]].trim()) { bad++; console.log('MISS дубль persons.filter не идентичен'); }
else console.log('OK дубль persons.filter идентичен — удаляю второй (стр ' + (pf[1] + 1) + ')');

if (bad) { console.log('ЕСТЬ MISS — файл НЕ записан'); process.exit(1); }

const drop = new Set([a[0], b[0], pf[1]]);
lines = lines.filter((_, i) => !drop.has(i));
fs.writeFileSync(P, lines.join(eol), 'utf8');

const after = fs.readFileSync(P, 'utf8');
const cnt = (s) => after.split(s).length - 1;
let err = 0;
const check = (name, s, want) => { const n = cnt(s); if (n !== want) { err++; console.log('!! ' + name + ': ' + n + ' != ' + want); } else console.log('ok ' + name + ': ' + n); };
check('мёртвый якорь #1', `=__wc;r={...e.characters,[t]:s};`, 0);
check('мёртвый якорь #2', `=__wc;var r={...e.characters,[t]:s};`, 0);
check('persons.filter', `return n?n.persons.filter(i=>s.has(cp(i))):[]`, 1);
check('живой warn', `console.warn("[wb] nn`, 1);
console.log('---');
console.log('строк: ' + before + ' -> ' + after.split('\n').length + '   символов: ' + orig.length + ' -> ' + after.length);
if (err) process.exit(1);