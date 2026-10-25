// wb-tags-probe.js ? ????????? tags.txt, ??? ???????
const fs = require('fs'), path = require('path');

function walk(dir, name, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, name, out);
    else if (e.name === name) out.push(p);
  }
  return out;
}

const hits = walk(__dirname, 'tags.txt');
console.log('?????? tags.txt ???????:', hits.length);

for (const p of hits) {
  const s = fs.readFileSync(p, 'utf8');
  const lines = s.split(/\r?\n/);
  console.log('\n===', p);
  console.log('????????:', s.length, '| ?????:', lines.length, '| ??????:', lines.filter(l => !l.trim()).length);

  console.log('--- HEAD 30 ---');
  console.log(lines.slice(0, 30).join('\n'));
  console.log('--- TAIL 30 ---');
  console.log(lines.slice(-30).join('\n'));

  const numPrefix = {}, numSuffix = {};
  for (const l of lines) {
    const a = l.match(/^(\d)\s/); if (a) numPrefix[a[1]] = (numPrefix[a[1]] || 0) + 1;
    const b = l.match(/\s(\d+)\s*$/); if (b) numSuffix.n = (numSuffix.n || 0) + 1;
  }
  console.log('????? ? ???????? ?????????:', JSON.stringify(numPrefix));
  console.log('????? ? ?????? ? ?????:', JSON.stringify(numSuffix));
  console.log('??????? ? ?????:', (s.match(/,/g) || []).length);
}
