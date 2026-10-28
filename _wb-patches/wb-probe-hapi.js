const fs=require('fs'),path=require('path');
const root='src';
let hits=0;
for(const f of fs.readdirSync(root)){
  if(!f.endsWith('.js')) continue;
  const p=path.join(root,f);
  const lines=fs.readFileSync(p,'utf8').split('\n');
  lines.forEach((l,i)=>{
    if(/HANDLED_API/.test(l)){
      hits++;
      console.log('=== '+p+' : '+(i+1));
      for(let k=Math.max(0,i-4);k<=Math.min(lines.length-1,i+4);k++)
        console.log((k+1)+': '+lines[k].slice(0,220));
      console.log('');
    }
  });
}
console.log('всего вхождений: '+hits);