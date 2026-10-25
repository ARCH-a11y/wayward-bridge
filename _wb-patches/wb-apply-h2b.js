const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');

const lineHit=`if (hit) return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + hit.rel, cached: true }, corsOf(req));`;
const iHit=t.indexOf(lineHit);
if(iHit<0){console.log('  ! НЕТ АНКОРА A');}
else{
  const after=t.slice(iHit+lineHit.length, iHit+lineHit.length+40);
  if(/^\s*\}\s*\/\/ H1y/.test(after)) console.log('  = A уже сделано');
  else { t=t.slice(0,iHit+lineHit.length)+`\n        }`+t.slice(iHit+lineHit.length); console.log('  + A: внешний if закрыт после media.pick'); }
}

const re=/(imagePath: "saved\/" \+ pe\.file, cached: true \}, corsOf\(req\)\);)\s*\}\s*\}/;
if(re.test(t)){ t=t.replace(re, `$1\n        }`); console.log('  + B: лишняя закрывающая скобка убрана'); }
else console.log('  = B: нечего убирать');

if(!t.includes('[wb] cached patron')){
  t=t.replace(`          const pe = library.latest(key);`, `          const pe = library.latest(key);\n          console.log("[wb] cached patron", String(key).slice(0,70));`);
  console.log('  + лог ветки патрона');
}