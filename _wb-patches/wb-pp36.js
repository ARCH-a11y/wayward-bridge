const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const sections = sec.sections || {};',
[
'      const rawTags = String(raw || "").trim();',
'      if (rawTags) {',
'        rawTags.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'        const res2 = {};',
'        for (const k of Object.keys(out)) res2[k] = out[k].join(", ");',
'        return { tags: res2, neg: {} };',
'      }',
'      const sections = sec.sections || {};'
].join("\n"),"ранний возврат по внешности героини");
sub([
'      const base = String(sec.base || "").trim();',
'      const rawTags = String(raw || "").trim();',
'      if (rawTags) rawTags.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'      else if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));'
].join("\n"),
[
'      const base = String(sec.base || "").trim();',
'      if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));'
].join("\n"),"убрать дубль raw");
fs.writeFileSync(f,s);