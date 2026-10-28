const fs=require('fs'),path=require('path');
for(const f of fs.readdirSync('src')){
  if(!f.endsWith('.js')) continue;
  const p=path.join('src',f);
  const lines=fs.readFileSync(p,'utf8').split('\n');
  lines.forEach((l,i)=>{ if(/BODY_PARTS|PART_LABELS/.test(l)) console.log(p+':'+(i+1)+': '+l.trim().slice(0,240)); });
}