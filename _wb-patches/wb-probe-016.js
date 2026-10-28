const fs=require('fs');
const s=fs.readFileSync('src/016-src_server_game.js','utf8');
console.log('размер: '+s.length);
const i=s.indexOf('children:"Encounters"');
console.log('якорь encounters: '+i);
if(i>0) console.log(s.slice(i-600,i+400));
const j=s.indexOf('flex flex-wrap gap-x-1');
console.log('--- якорь полосы: '+j);