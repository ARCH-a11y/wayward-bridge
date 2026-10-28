const fs=require('fs');
const p='src/023-src_server_maintainer.js';
const lines=fs.readFileSync(p,'utf8').split('\n');
for(let k=0;k<Math.min(lines.length,70);k++) console.log((k+1)+': '+lines[k].slice(0,200));