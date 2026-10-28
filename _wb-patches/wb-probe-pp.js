const fs=require('fs');
const lines=fs.readFileSync('src/024-src_server_index.js','utf8').split('\n');
for(let k=485;k<525;k++) console.log((k+1)+': '+lines[k]);
console.log('--- settings');
try{ console.log(fs.readFileSync('wayward-bridge-data/settings.json','utf8').slice(0,400)); }catch(e){ console.log(e.message); }