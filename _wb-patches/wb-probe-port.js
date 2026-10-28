const fs=require('fs'),path=require('path');
for(const f of fs.readdirSync('src')){
  if(!f.endsWith('.js')) continue;
  const p=path.join('src',f);
  fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{
    if(/\.listen\(|PORT\s*=|port = /.test(l)) console.log(p+':'+(i+1)+': '+l.trim().slice(0,160));
  });
}