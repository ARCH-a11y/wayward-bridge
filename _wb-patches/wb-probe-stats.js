const fs=require('fs');
const s=fs.readFileSync('index.html','utf8');
function find(re,label,max){
  let n=0,m; const r=new RegExp(re.source,'g');
  while((m=r.exec(s)) && n<max){
    n++; console.log('=== '+label+' @'+m.index);
    console.log(s.slice(Math.max(0,m.index-260), m.index+320).replace(/\n/g,'\\n'));
    console.log('');
  }
  console.log('--- '+label+': '+n);
}
find(/n==="stats"/,'stats',6);
find(/==="encounters"/,'encounters',4);