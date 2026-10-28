const fs=require("fs");
const s=fs.readFileSync("src/024-src_server_index.js","utf8");
const i=s.indexOf("function partTagBuckets(");
console.log(s.slice(i,i+1200));