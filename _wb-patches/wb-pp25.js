const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const loraTrigUse = /^(head|mouth)$/.test(part) ? "" : loraTrig;',
[
'      const trigFilter = {',
'        breasts: /breast|nipple|areola|montgomery|milk/,',
'        ass: /ass|anus|anal|butt|glute/,',
'        vagina: /pussy|vagina|labia|clit|pubic|anus|anal/,',
'        belly: /belly|navel|pregnan/',
'      };',
'      const loraTrigUse = /^(head|mouth)$/.test(part) ? "" : trigFilter[part] ? loraTrig.split(",").map((x) => x.trim()).filter((x) => x && trigFilter[part].test(x.toLowerCase())).join(", ") : loraTrig;'
].join("\n"),"белый список триггеров");
sub('      const hairTags = String(buckets.head || "").split(",").map((x) => x.trim()).filter((x) => /hair|skin|eye/.test(x)).join(", ");',
'      const hairTags = part === "belly" ? "" : String(buckets.head || "").split(",").map((x) => x.trim()).filter((x) => /^(breasts|ass|vagina)$/.test(part) ? /hair|skin/.test(x) : /hair|skin|eye/.test(x)).join(", ");',"волосы только где видны");
fs.writeFileSync(f,s);