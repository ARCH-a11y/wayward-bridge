const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');
const old=`imagePath: "saved/" + pe.file`;
const neu=`imagePath: "wb/" + pe.file`;
if(!t.includes(old)){console.log('  ! НЕТ АНКОРА');}
else{ t=t.replace(old,neu); fs.writeFileSync(P,t); console.log('  + ok: путь патрона через wb/'); }