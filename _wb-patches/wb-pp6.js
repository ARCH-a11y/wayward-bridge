const fs=require('fs');
const f='src/024-src_server_index.js';
let s=fs.readFileSync(f,'utf8');
const a='base: String(((((store.effective(h).prompts || {}).heroines || {})[h]) || {}).base || "")';
const b='dbg: { base: String(((((store.effective(h).prompts || {}).heroines || {})[h]) || {}).base || ""), secs: Object.keys(((((store.effective(h).prompts || {}).heroines || {})[h]) || {}).sections || {}), lvl: (store.effective(h).prompts || {}).heroines ? Object.keys((store.effective(h).prompts || {}).heroines) : null }';
if(!s.includes(a)){ console.log('FAIL'); process.exit(1); }
s=s.replace(a,b);
fs.writeFileSync(f,s);
console.log('ok debug secs');