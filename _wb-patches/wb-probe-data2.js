const fs=require('fs'),path=require('path');
const dir='wayward-bridge-data';
console.log('addons: '+fs.readdirSync(path.join(dir,'addons')).join(', '));
const g=JSON.parse(fs.readFileSync(path.join(dir,'game-snapshot.json'),'utf8'));
console.log('snapshot ключи: '+Object.keys(g).slice(0,30).join(', '));
const h=(g.prompts&&g.prompts.heroines)||null;
if(h){ console.log('героини: '+Object.keys(h).join(', ')); for(const [id,v] of Object.entries(h)) console.log('  '+id+' base:'+String(v.base||'').length+' секции: '+Object.keys(v.sections||{}).join(' ')); }