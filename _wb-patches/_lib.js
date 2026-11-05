'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP = path.join(__dirname, '.backup');
const CANDIDATES = ['src/index.html', 'index.html', 'app/index.html', 'src/app.html'];

function findTarget() {
  for (const rel of CANDIDATES) {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) return p;
  }
  const stack = [ROOT];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/\.html?$/i.test(e.name)) {
        if (/data-block\s*=\s*["']body["']/i.test(fs.readFileSync(p, 'utf8'))) return p;
      }
    }
  }
  throw new Error('target html not found');
}

function load() {
  const file = findTarget();
  return { file, src: fs.readFileSync(file, 'utf8') };
}

function backupPath(file) {
  return path.join(BACKUP, path.relative(ROOT, file).replace(/[\\/]/g, '__'));
}

function save(file, src) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const b = backupPath(file);
  if (!fs.existsSync(b)) fs.writeFileSync(b, fs.readFileSync(file));
  fs.writeFileSync(file, src);
}

function restore(file) {
  const b = backupPath(file);
  if (!fs.existsSync(b)) throw new Error('no backup for ' + file);
  fs.copyFileSync(b, file);
}

const marker = (id) => `<!-- wb-patch:${id} -->`;
const hasMarker = (src, id) => src.includes(marker(id));

// [start, end) элемента с учётом вложенности одноимённых тегов
function sliceElement(src, startIdx) {
  const tag = /^<([a-zA-Z0-9-]+)/.exec(src.slice(startIdx))[1].toLowerCase();
  const re = new RegExp(`<${tag}\\b|</${tag}\\s*>`, 'gi');
  re.lastIndex = startIdx;
  let depth = 0, m;
  while ((m = re.exec(src))) {
    if (m[0][1] === '/') { if (--depth === 0) return [startIdx, m.index + m[0].length]; }
    else depth++;
  }
  throw new Error('unbalanced <' + tag + '>');
}

function run(id, fn) {
  try {
    console.log(`[${id}] ${fn()}`);
  } catch (e) {
    console.error(`[${id}] FAIL: ${e.message}`);
    process.exitCode = 1;
  }
}

module.exports = { ROOT, findTarget, load, save, restore, marker, hasMarker, sliceElement, run };