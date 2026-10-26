// wb-cl3.js — убрать мёртвые lastChars/lastWifeBad/lastWifeId, перевесить маркеры H1f/H1h на живые подстроки
const fs = require('fs');
const P19 = 'src/019-src_server_assets.generated.js';
const PV = 'wb-verify.js';
let bad = 0;

// --- 1) src/019: удалить мёртвое объявление ---
const s19 = fs.readFileSync(P19, 'utf8');
const eol = s19.includes('\r\n') ? '\r\n' : '\n';
let l19 = s19.split(/\r?\n/);
const decl = `var lastChars = "", lastWifeBad = 0, lastWifeId = "";`;
const dHit = [];
l19.forEach((l, i) => { if (l.trim() === decl) dHit.push(i); });
if (dHit.length !== 1) { bad++; console.log('MISS объявление найдено=' + dHit.length); }
else console.log('OK объявление (стр ' + (dHit[0] + 1) + ')');

for (const pair of [[`снимок жены`, `wifeBak = JSON.stringify(w)`, 1], [`вызов отката`, `healWife();`, 1]]) {
  const n = s19.split(pair[1]).length - 1;
  if (n !== pair[2]) { bad++; console.log('MISS якорь "' + pair[0] + '": ' + n + ' != ' + pair[2]); }
  else console.log('ok якорь "' + pair[0] + '": ' + n);
}
if (bad) { console.log('ЕСТЬ MISS — ничего не записано'); process.exit(1); }

l19 = l19.filter((_, i) => i !== dHit[0]);
fs.writeFileSync(P19, l19.join(eol), 'utf8');

// --- 2) wb-verify: перевесить маркеры ---
let v = fs.readFileSync(PV, 'utf8');
const veol = v.includes('\r\n') ? '\r\n' : '\n';
let lv = v.split(/\r?\n/);

function replaceBySub(sub, newTrim, name) {
  const hits = [];
  lv.forEach((l, i) => { if (l.includes(sub)) hits.push(i); });
  if (hits.length !== 1) { bad++; console.log('MISS ' + name + ' найдено=' + hits.length); return; }
  const indent = lv[hits[0]].match(/^\s*/)[0];
  lv[hits[0]] = indent + newTrim;
  console.log('OK ' + name + ' (стр ' + (hits[0] + 1) + ')');
}

replaceBySub(`"lastChars", 1]`, `["H1f: снимок жены", "wifeBak = JSON.stringify(w)", 1],`, 'маркер H1f');
replaceBySub(`"lastWifeId", 1]`, `["H1h: откат вызывается", "healWife();", 1],`, 'маркер H1h');

if (bad) { console.log('ЕСТЬ MISS в wb-verify — файл НЕ записан'); process.exit(1); }
fs.writeFileSync(PV, lv.join(veol), 'utf8');

// --- 3) самопроверка ---
const a19 = fs.readFileSync(P19, 'utf8');
const av = fs.readFileSync(PV, 'utf8');
let err = 0;
const chk = (sub, hay, want) => { const n = hay.split(sub).length - 1; if (n !== want) { err++; console.log('!! ' + sub + ': ' + n + ' != ' + want); } else console.log('ok ' + sub + ': ' + n); };
chk('lastChars', a19, 0);
chk('lastWifeBad', a19, 0);
chk('lastWifeId', a19, 0);
chk('wifeBak = JSON.stringify(w)', a19, 1);
chk('healWife();', a19, 1);
console.log('--- wb-verify ---');
console.log('lastChars: ' + (av.split('lastChars').length - 1) + '   lastWifeId: ' + (av.split('lastWifeId').length - 1));
console.log('строк src/019: ' + s19.split('\n').length + ' -> ' + a19.split('\n').length);
if (err) process.exit(1);