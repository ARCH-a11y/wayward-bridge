const fs=require("fs");
const s=fs.readFileSync("src/024-src_server_index.js","utf8");
s.split("\n").forEach((l,i)=>{ if(/DATA_DIR\s*=|var fs|require\("fs"\)/.test(l)) console.log((i+1)+": "+l.trim().slice(0,160)); });