// wb-probe-g5.js — разведка: пайплайн картинок в моде + регистрация персонажей в игре
const fs = require('fs'), path = require('path');
const SRC = 'src';

console.log('===== A. ФАЙЛЫ src/ =====');
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort();
for (const f of files) {
  const s = fs.statSync(path.join(SRC, f)).size;
  const mark = /img|image|comfy|art|pic|visual|look|asset/i.test(f) ? '  <<<' : '';
  console.log(f.padEnd(48), String(s).padStart(9), mark);
}

console.log('\n===== B. СОВПАДЕНИЯ В src/ =====');
const KEYS = ['comfy','workflow','manifest','library','portrait','avatar','charKey','generate','base64','img','png','photo','render','prompt'];
for (const f of files) {
  const lines = fs.readFileSync(path.join(SRC, f), 'utf8').split(/\r?\n/);
  const hits = [];
  lines.forEach((l, i) => {
    const low = l.toLowerCase();
    if (KEYS.some(k => low.includes(k))) hits.push(String(i + 1).padStart(5) + ': ' + l.trim().slice(0, 150));
  });
  if (hits.length) {
    console.log('\n--- ' + f + ' (' + hits.length + ' совп.) ---');
    hits.slice(0, 45).forEach(h => console.log(h));
    if (hits.length > 45) console.log('   ... ещё ' + (hits.length - 45));
  }
}

console.log('\n===== C. index.html: токены персонажей =====');
const IDX = 'index.html';
if (fs.existsSync(IDX)) {
  const src = fs.readFileSync(IDX, 'utf8');
  const TOK = ['customWife','custom_wife','addCharacter','portrait','avatar','charImg','heroineImg','relation','daughter','kin','family','wife','sister','ageOf'];
  for (const t of TOK) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m, n = 0;
    const seen = new Set();
    while ((m = re.exec(src)) && n < 8) {
      const a = Math.max(0, m.index - 90), b = Math.min(src.length, m.index + t.length + 90);
      const snip = src.slice(a, b).replace(/\s+/g, ' ');
      const key = snip.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      console.log('[' + t + ' @' + m.index + '] ...' + snip + '...');
      n++;
    }
    console.log('  ^ ' + t + ': ' + n + (n >= 8 ? '+' : ''));
  }
} else {
  console.log('(index.html не найден в корне)');
}