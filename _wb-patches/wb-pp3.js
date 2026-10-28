const fs=require('fs');
const f='src/024-src_server_index.js';
let s=fs.readFileSync(f,'utf8');
const old=[
'      const heroine = String(b && b.heroine || currentHeroine());',
'      const part = String(b && b.part || "body");',
'      const tags = String(b && b.tags || "").trim();',
'      if (!tags) return { ok: false, error: "This part has no words to draw." };'
].join('\n');
const neu=[
'      const heroine = String(b && b.heroine || currentHeroine());',
'      const part = String(b && b.part || "body");',
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const secPart = ((sec.sections || {})[part]) || {};',
'      const partTags = part === "base" ? String(sec.base || "") : String(secPart.tags || "");',
'      const tags = String((b && b.tags) || partTags || "").trim();',
'      const negTags = String((b && b.negative) || (part === "base" ? "" : (secPart.negative || "")) || "").trim();',
'      if (!tags) return { ok: false, error: "This part has no words to draw." };'
].join('\n');
if(!s.includes(old)){ console.log('FAIL якорь тегов'); process.exit(1); }
s=s.replace(old,neu);
console.log('ok теги из стора');
const oldNeg='      const negative = String(b && b.negative || pipe.negative || "");';
const neuNeg='      const negative = [negTags, String(pipe.negative || "")].filter(Boolean).join(", ");';
if(!s.includes(oldNeg)){ console.log('FAIL якорь негатива'); process.exit(1); }
s=s.replace(oldNeg,neuNeg);
console.log('ok негатив');
fs.writeFileSync(f,s);