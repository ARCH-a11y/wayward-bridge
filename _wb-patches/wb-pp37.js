const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('    function partTagBuckets(heroine) {','    function partTagBuckets(heroine, raw) {',"сигнатура с raw");
sub('      const pushNeg = (part, text) => { if (!text) return; (negOut[part] = negOut[part] || []).push(text); };',
[
'      const pushNeg = (part, text) => { if (!text) return; (negOut[part] = negOut[part] || []).push(text); };',
'      const rawTags = String(raw || "").trim();',
'      if (rawTags) {',
'        rawTags.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'        const res2 = {};',
'        for (const k of Object.keys(out)) res2[k] = out[k].join(", ");',
'        return { tags: res2, neg: {} };',
'      }'
].join("\n"),"ранний возврат по внешности героини");
fs.writeFileSync(f,s);