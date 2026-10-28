const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const a='      const loraTrigUse = /^(head|mouth)$/.test(part) ? "" : trigFilter[part] ? loraTrig.split(",").map((x) => x.trim()).filter((x) => x && trigFilter[part].test(x.toLowerCase())).join(", ") : loraTrig;';
const b='      const loraTrigUse = /^(head|mouth)$/.test(part) || String(buckets[part] || "").trim() ? "" : trigFilter[part] ? loraTrig.split(",").map((x) => x.trim()).filter((x) => x && trigFilter[part].test(x.toLowerCase())).join(", ") : loraTrig;';
if(!s.includes(a)){ console.log("FAIL"); process.exit(1); }
s=s.replace(a,b);
fs.writeFileSync(f,s);
console.log("ok триггеры только как заполнитель");