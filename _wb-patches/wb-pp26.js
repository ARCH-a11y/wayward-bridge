const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const block=[
'      const seen = new Set();',
'      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra, loraTrigUse].filter(Boolean).join(", ").split(",").map((x) => x.trim()).filter((x) => {',
'        if (!x || x.charAt(0) === "<") return false;',
'        const k = x.toLowerCase();',
'        if (seen.has(k)) return false;',
'        seen.add(k);',
'        return true;',
'      }).join(", ");'
].join("\n");
if(!s.includes(block)){ console.log("FAIL блок тегов"); process.exit(1); }
s=s.replace(block+"\n","");
const at=s.indexOf("      const loraTrigUse = ");
if(at<0){ console.log("FAIL loraTrigUse"); process.exit(1); }
const end=s.indexOf("\n",at)+1;
s=s.slice(0,end)+block+"\n"+s.slice(end);
fs.writeFileSync(f,s);
console.log("ok теги после лор");
const q=s.indexOf("async function partPreview(b) {");
console.log(s.slice(q,q+1500));