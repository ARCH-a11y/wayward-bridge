const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');
const old=`if (store.settings.app.savedMedia && store.settings.app.savedMedia.enabled && !body.bypassCache && /^patron_/i.test(key)) {`;
const neu=`if (!body.bypassCache && /^patron_/i.test(key)) {`;
if(t.includes(neu)){console.log('  = уже есть');}
else if(!t.includes(old)){console.log('  ! НЕТ АНКОРА');}
else{ t=t.replace(old,neu); fs.writeFileSync(P,t); console.log('  + ok: патрон переиспользуется независимо от галочки'); }

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H2a: патрон не зависит от галочки')){
    d+=`\n## H2a: портрет патрона переиспользуется всегда\n- Настройка «Use Saved Images/GIFs» выключена = «рисовать живьём каждый раз»; это штатный режим, а не баг.\n- У патрона ключ стабильный (без сцены/наряда/настроения), поэтому его портрет переиспользуется из библиотеки независимо от галочки; заново рисуется только при явном реролле (\`bypassCache\`).\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H2a');
  }
}