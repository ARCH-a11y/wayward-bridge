const fs=require('fs');
const f='src/024-src_server_index.js';
let s=fs.readFileSync(f,'utf8');
const a='{ ok: true, heroine: h, parts: partTagBuckets(h) }';
const b='{ ok: true, heroine: h, base: String(((((store.effective(h).prompts || {}).heroines || {})[h]) || {}).base || ""), parts: partTagBuckets(h) }';
if(!s.includes(a)){ console.log('FAIL'); process.exit(1); }
s=s.replace(a,b);
fs.writeFileSync(f,s);
console.log('ok debug base');