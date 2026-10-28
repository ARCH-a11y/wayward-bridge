const fs=require("fs");
const lines=fs.readFileSync("src/024-src_server_index.js","utf8").split("\n");
for(let k=168;k<200;k++) console.log((k+1)+": "+lines[k]);
console.log("---");
for(let k=245;k<262;k++) console.log((k+1)+": "+lines[k]);