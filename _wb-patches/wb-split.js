// wb-split.js — раскладывает wayward-bridge.js на модули по маркерам "// src/..."
// Оригинал не трогает: делает копию .before-split.js. В конце самопроверка по хешу.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const FILE = 'wayward-bridge.js';
const BACKUP = 'wayward-bridge.before-split.js';
const SRC_DIR = 'src';
const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
console.log('исходник: ' + src.length + ' символов, sha256 ' + sha(src).slice(0, 16));

// 1. маркеры модулей
const re = /^\/\/ src\/\S+.*$/gm;
const marks = [];
let m;
while ((m = re.exec(src)) !== null) marks.push({ pos: m.index, banner: m[0] });
console.log('маркеров // src/ найдено: ' + marks.length);
if (marks.length < 10) { console.error('мало маркеров, стоп'); process.exit(1); }

// 2. нарезка по маркерам
const chunks = [];
if (marks[0].pos > 0) chunks.push({ name: '000-header', text: src.slice(0, marks[0].pos) });
for (let i = 0; i < marks.length; i++) {
  const from = marks[i].pos;
  const to = i + 1 < marks.length ? marks[i + 1].pos : src.length;
  const mod = marks[i].banner.slice(2).trim().split(/\s+/)[0];
  const name = String(i + 1).padStart(3, '0') + '-' + mod.replace(/[\\/]/g, '_').replace(/\.js$/, '');
  chunks.push({ name, text: src.slice(from, to), mod });
}

// 3. вынести TAGS_GZ_B64 в отдельный файл
const TAG_RE = /^.*\bTAGS_GZ_B64\s*=\s*"[^"]*";?\s*$/m;
const parts = [];
for (const c of chunks) {
  const t = TAG_RE.exec(c.text);
  if (t && t[0].length > 500000) {
    parts.push({ name: c.name + '-a', text: c.text.slice(0, t.index) });
    parts.push({ name: c.name + '-tags', text: t[0] });
    parts.push({ name: c.name + '-b', text: c.text.slice(t.index + t[0].length) });
    console.log('TAGS_GZ_B64 вынесен: ' + t[0].length + ' символов из ' + c.mod);
  } else parts.push(c);
}

// 4. запись
fs.copyFileSync(path.join(ROOT, FILE), path.join(ROOT, BACKUP));
fs.rmSync(path.join(ROOT, SRC_DIR), { recursive: true, force: true });
fs.mkdirSync(path.join(ROOT, SRC_DIR), { recursive: true });
for (const p of parts) fs.writeFileSync(path.join(ROOT, SRC_DIR, p.name + '.js'), p.text, 'utf8');
fs.writeFileSync(path.join(ROOT, SRC_DIR, 'ORDER.txt'), parts.map(p => p.name + '.js').join('\n') + '\n', 'utf8');

// 5. build.js
fs.writeFileSync(path.join(ROOT, 'build.js'), [
  "// build.js — склейка src/*.js в wayward-bridge.js (порядок из src/ORDER.txt)",
  "const fs = require('fs'), path = require('path');",
  "const dir = path.join(__dirname, 'src');",
  "const order = fs.readFileSync(path.join(dir, 'ORDER.txt'), 'utf8').split(/\\r?\\n/).filter(Boolean);",
  "let out = '';",
  "for (const f of order) out += fs.readFileSync(path.join(dir, f), 'utf8');",
  "fs.writeFileSync(path.join(__dirname, 'wayward-bridge.js'), out, 'utf8');",
  "console.log('собрано ' + out.length + ' символов из ' + order.length + ' файлов');",
  ""
].join('\n'), 'utf8');

// 6. самопроверка
let rebuilt = '';
for (const p of parts) rebuilt += p.text;
console.log('файлов: ' + parts.length);
console.log('крупнейшие:');
parts.map(p => [p.name, p.text.length]).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .forEach(x => console.log('  ' + x[0] + ': ' + x[1]));
if (rebuilt === src) console.log('OK: склейка совпала байт в байт, sha256 ' + sha(rebuilt).slice(0, 16));
else { console.error('FAIL: склейка не совпала!'); process.exit(1); }