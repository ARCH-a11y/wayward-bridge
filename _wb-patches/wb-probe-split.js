const fs=require('fs');
const lines=fs.readFileSync('src/008-src_server_prompt.js','utf8').split('\n');
for(let k=95;k<190;k++) console.log((k+1)+': '+lines[k]);