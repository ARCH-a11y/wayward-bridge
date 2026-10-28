const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const a='const tags = String((b && b.tags) || buckets[part] || "").trim();';
const b='const tags = String((b && b.tags) || buckets[part] || Object.values(buckets).join(", ") || "").trim();';
if(!s.includes(a)){ console.log("FAIL"); process.exit(1); }
s=s.replace(a,b);
fs.writeFileSync(f,s);
console.log("ok откат на всю внешность");