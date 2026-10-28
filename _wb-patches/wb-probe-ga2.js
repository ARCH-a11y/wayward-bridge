const fs=require("fs");
const lines=fs.readFileSync("src/019-src_server_assets.generated.js","utf8").split("\n");
for(let k=630;k<700;k++) console.log((k+1)+": "+lines[k]);