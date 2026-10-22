// wb-probe-state.js — что игра и мод знают про беременность, доверие, время
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
const WORDS = ['pregnan','belly','fertilit','conceiv','children','child','baby','infant','birth','lactat','trust','shame','cheat','advanceDay','nextDay','milk'];
const TARGETS = ['index.html'];
for (const f of fs.readdirSync(path.join(ROOT, 'src'))) if (f.endsWith('.js')) TARGETS.push(path.join('src', f));

for (const f of TARGETS) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const parts = [];
  for (const w of WORDS) {
    const n = (s.match(new RegExp(w, 'gi')) || []).length;
    if (n) parts.push(w + '=' + n);
  }
  if (!parts.length) continue;
  console.log('\n=== ' + f);
  console.log(parts.join('  '));
  if (f === 'index.html') {
    for (const w of ['pregnan','belly','fertilit','children','trust','shame']) {
      const re = new RegExp(w, 'gi'); let m, k = 0;
      while ((m = re.exec(s)) && k < 3) {
        console.log('  [' + w + '] ' + JSON.stringify(s.slice(Math.max(0, m.index - 90), m.index + 90)));
        k++;
      }
    }
  }
}
