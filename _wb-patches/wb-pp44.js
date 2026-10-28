const fs=require("fs");
const v="wb-verify.js";
let s=fs.readFileSync(v,"utf8");
const a='"function resolveHeroine(id)"';
const b='"function resolveHeroine(id, arch)"';
if(!s.includes(a)){ console.log("FAIL"); process.exit(1); }
s=s.replace(a,b);
fs.writeFileSync(v,s);
console.log("ok маркер");