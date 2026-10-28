const fs=require('fs');
const lines=fs.readFileSync('src/026-src_server_looks.js','utf8').split('\n');
for(let k=0;k<84;k++) console.log((k+1)+': '+lines[k].slice(0,200));