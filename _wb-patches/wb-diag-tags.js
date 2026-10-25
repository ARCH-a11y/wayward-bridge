// wb-diag-tags.js
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'src');

for (const f of fs.readdirSync(SRC)) {
  const p = path.join(SRC, f);
  if (!fs.statSync(p).isFile()) continue;
  const s = fs.readFileSync(p, 'utf8');

  // 1. ???? ?? ?????? ???
  let i = s.indexOf('TAGS_GZ_B64'), n = 0;
  while (i !== -1 && n < 8) {
    console.log('NAME', f, '@', i, JSON.stringify(s.slice(Math.max(0, i - 70), i + 70)));
    i = s.indexOf('TAGS_GZ_B64', i + 1); n++;
  }

  // 2. ????? ??????? base64-???????? ???????
  const runs = s.match(/[A-Za-z0-9+/=]{4000,}/g);
  if (runs) for (const blob of runs) {
    const at = s.indexOf(blob);
    console.log('BLOB', f, 'len=' + blob.length, '@', at);
    console.log('  BEFORE:', JSON.stringify(s.slice(Math.max(0, at - 140), at)));
    console.log('  AFTER :', JSON.stringify(s.slice(at + blob.length, at + blob.length + 140)));
  }

  // 3. ????? ????? ???????????? ??????? ????????
  const forms = {
    dq: /(TAGS_GZ_B64\s*=\s*)(["'])([A-Za-z0-9+/=\r\n]{1000,}?)\2/,
    bt: /(TAGS_GZ_B64\s*=\s*)(`)([A-Za-z0-9+/=\r\n]{1000,}?)`/,
    any: /TAGS_GZ_B64\s*=\s*/,
    arrow: /TAGS_GZ_B64\s*:\s*/,
  };
  for (const [k, re] of Object.entries(forms)) {
    const m = s.match(re);
    if (m) console.log('FORM', k, 'MATCH in', f, 'len=' + m[0].length);
  }
}
console.log('--- ???? ????????');
