'use strict';
const fs = require('fs');
const S = 'src/001-src_server_schema.js';
const I = 'src/024-src_server_index.js';
const V = 'wb-verify.js';

function rep(file, from, to, label) {
  const t = fs.readFileSync(file, 'utf8');
  const n = t.split(from).length - 1;
  if (n !== 1) { console.log('FAIL ' + label + ': ' + n); process.exit(1); }
  fs.writeFileSync(file, t.replace(from, () => to));
  console.log('ok   ' + label);
}

rep(S, '\n    var PART_FOCUS_SCHEMA = { "*": str(4e3) };', '', 'PART_FOCUS_SCHEMA');
rep(S, ', partFocus: PART_FOCUS_SCHEMA', '', 'partFocus в LAYER');
rep(I, '(b && (b.prompt || b.focus))', '(b && b.prompt)', 'b.focus в сервере');
rep(V, '"return foldable(out, \\"body\\")", 1],\n  ["Превью: состояние сворачивается"', '"return foldable(out, \\"body\\")", 1],\n  ["Превью: состояние сворачивается"', 'проверка verify');

// маркер b.focus
try {
  let v = fs.readFileSync(V, 'utf8');
  if (v.indexOf('"b.focus", 1') >= 0) {
    v = v.replace('"b.focus", 1', '"b.prompt", 1');
    fs.writeFileSync(V, v);
    console.log('ok   маркер verify');
  } else console.log('WARN маркер b.focus не найден');
} catch (e) { console.log('WARN verify: ' + e.message); }

// лишний .bak
try {
  const b = 'src/019-src_server_assets.generated.js.bak';
  if (fs.existsSync(b)) { fs.unlinkSync(b); console.log('ok   удалён .bak'); }
} catch (e) { console.log('WARN .bak: ' + e.message); }

// контрольный обход
let left = 0;
for (const f of fs.readdirSync('src')) {
  fs.readFileSync('src/' + f, 'utf8').split('\n').forEach((l, n) => {
    if (/partFocus|PART_FOCUS_SCHEMA/.test(l)) { console.log('осталось ' + f + ':' + (n + 1) + '| ' + l.trim()); left++; }
  });
}
console.log(left ? 'осталось упоминаний: ' + left : 'упоминаний partFocus нет');