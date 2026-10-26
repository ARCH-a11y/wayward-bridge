// wb-dump1.js — разведка: какие .replace() в src/016 реально срабатывают
const fs = require('fs');
const src = fs.readFileSync('src/016-src_server_game.js', 'utf8');
let html = fs.readFileSync('index.html', 'utf8');
const html0 = html.length;

const lineOf = (i) => src.slice(0, i).split('\n').length;

function readLit(s, i) {
  const q = s[i];
  if (q === "'" || q === '"' || q === '`') {
    let j = i + 1, out = q;
    while (j < s.length) {
      if (s[j] === '\\') { out += s[j] + s[j + 1]; j += 2; continue; }
      out += s[j];
      if (s[j] === q) { j++; break; }
      j++;
    }
    return { text: out, end: j };
  }
  if (q === '/') {
    let j = i + 1, out = '/';
    while (j < s.length) {
      if (s[j] === '\\') { out += s[j] + s[j + 1]; j += 2; continue; }
      if (s[j] === '/') { out += '/'; j++; break; }
      out += s[j]; j++;
    }
    while (j < s.length && /[a-z]/i.test(s[j])) { out += s[j]; j++; }
    return { text: out, end: j };
  }
  return null;
}

const rows = [];
let idx = 0;
while (true) {
  const i = src.indexOf('.replace(', idx);
  if (i < 0) break;
  idx = i + 9;
  let j = i + 9;
  while (j < src.length && /\s/.test(src[j])) j++;
  const row = { line: lineOf(i), anchor: null, re: null, repl: null, note: null };
  rows.push(row);
  const a = readLit(src, j);
  if (!a) { row.note = 'аргумент не литерал'; continue; }
  row.anchor = a.text;
  j = a.end;
  while (j < src.length && /\s/.test(src[j])) j++;
  if (src[j] !== ',') { row.note = 'после якоря не запятая'; continue; }
  j++;
  while (j < src.length && /\s/.test(src[j])) j++;
  const b = readLit(src, j);
  if (!b) { row.note = 'замена не литерал'; continue; }
  try { row.re = eval(a.text); row.repl = eval(b.text); } catch (e) { row.note = 'eval: ' + e.message; }
}

let dead = 0;
for (const r of rows) {
  if (!r.re) continue;
  let hits = 0;
  try {
    if (typeof r.re === 'string') hits = html.split(r.re).length - 1;
    else hits = (html.match(r.re) || []).length;
  } catch (e) { r.note = 'match: ' + e.message; }
  r.hits = hits;
  if (hits > 0) { try { html = html.replace(r.re, r.repl); } catch (e) { r.note = 'replace: ' + e.message; } }
  else dead++;
}

const show = (r) => 'стр ' + r.line + '  ' + (r.note ? '[' + r.note + ']' : 'hits=' + r.hits) + '  ' +
  String(r.anchor).replace(/\n/g, '\\n').slice(0, 110);

console.log('всего .replace(): ' + rows.length + '   не сработало: ' + dead);
console.log('index.html: ' + html0 + ' -> ' + html.length);
console.log('--- НЕ СРАБОТАЛИ ---');
rows.filter(r => r.re && r.hits === 0).forEach(r => console.log(show(r)));
console.log('--- с nn( ---');
rows.filter(r => r.anchor && r.anchor.includes('nn(')).forEach(r => console.log(show(r)));
console.log('--- lastChars / lastWife ---');
for (const f of fs.readdirSync('src')) {
  if (!f.endsWith('.js')) continue;
  const t = fs.readFileSync('src/' + f, 'utf8');
  t.split('\n').forEach((ln, i) => { if (/lastChars|lastWifeBad|lastWifeId/.test(ln)) console.log(f + ':' + (i + 1) + ': ' + ln.trim()); });
}
console.log('--- function nn( в index.html: ' + (fs.readFileSync('index.html', 'utf8').match(/function nn\(/g) || []).length);