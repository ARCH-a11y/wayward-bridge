const fs=require('fs'),path=require('path');
const d='wayward-bridge-data/addons';
for(const f of fs.readdirSync(d)){
  const p=path.join(d,f);
  const s=fs.readFileSync(p,'utf8');
  console.log('=== '+f+' ('+s.length+')');
  if(/section/i.test(s)){
    const j=JSON.parse(s);
    const h=(j.prompts&&j.prompts.heroines)||j.heroines||{};
    for(const [id,v] of Object.entries(h)){
      console.log('  героиня '+id+' base:'+String(v.base||'').length);
      for(const [k,sec] of Object.entries(v.sections||{})) console.log('    '+k+': '+String((sec||{}).tags||'').slice(0,80)+' | neg: '+String((sec||{}).negative||'').slice(0,40));
    }
  }
}