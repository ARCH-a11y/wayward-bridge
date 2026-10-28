const fs=require("fs");
const s=fs.readFileSync("src/024-src_server_index.js","utf8");
let n=0,i=-1;
while((i=s.indexOf("function partTagBuckets(",i+1))>=0){ n++; console.log("=== @"+i); console.log(s.slice(i,i+700)); console.log(""); }
console.log("определений: "+n);