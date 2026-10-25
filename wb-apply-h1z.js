const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');
const anchor=`if (store.settings.app.savedMedia && store.settings.app.savedMedia.enabled && !body.bypassCache) {`;
const log=`console.log("[wb] gen", JSON.stringify({ k: String(key).slice(0,70), bypass: !!body.bypassCache, saved: !!(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled), lib: !!library.latest(key), pk: (parseImageKey(key) || {}).kind }));`;
if(t.includes('[wb] gen')){console.log('  = уже есть');}
else if(!t.includes(anchor)){console.log('  ! НЕТ АНКОРА');}
else{ t=t.replace(anchor, log+'\n        '+anchor); fs.writeFileSync(P,t); console.log('  + ok: диагностика генерации'); }