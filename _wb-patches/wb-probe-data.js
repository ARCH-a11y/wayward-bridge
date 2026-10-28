const fs=require('fs'),path=require('path');
const dir='wayward-bridge-data';
console.log('файлы: '+fs.readdirSync(dir).join(', '));
for(const f of fs.readdirSync(dir)){
  if(!/prompt|state|layer|default/i.test(f)) continue;
  const p=path.join(dir,f);
  if(!fs.statSync(p).isFile()) continue;
  let j; try{ j=JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ console.log(f+': не json'); continue; }
  const h=(j.prompts&&j.prompts.heroines)||j.heroines;
  if(!h){ console.log(f+': нет heroines'); continue; }
  console.log('=== '+f+' героини: '+Object.keys(h).join(', '));
  for(const [id,v] of Object.entries(h)){
    const sec=v.sections||{};
    console.log('  '+id+' секции: '+Object.keys(sec).map(k=>k+'('+String((sec[k]||{}).tags||'').length+')').join(' ')+' base:'+String(v.base||'').length);
  }
}