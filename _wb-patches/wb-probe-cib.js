const fs=require("fs");
const s=fs.readFileSync("src/019-src_server_assets.generated.js","utf8");
const i=s.indexOf("function childImageBase(");
console.log(s.slice(i,i+900));