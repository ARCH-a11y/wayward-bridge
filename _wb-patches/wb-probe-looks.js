const fs=require('fs'),path=require('path');
for(const f of fs.readdirSync('src')){
  if(!f.endsWith('.js')) continue;
  const p=path.join('src',f);
  const s=fs.readFileSync(p,'utf8');
  if(/require_looks|LOOKS_SCALE|lookVocab/.test(s)){
    console.log('### '+p);
    s.split('\n').forEach((l,i)=>{ if(/require_looks|LOOKS_SCALE|lookVocab|var LOOKS|child:|adult:/.test(l)) console.log('  '+(i+1)+': '+l.trim().slice(0,200)); });
  }
}