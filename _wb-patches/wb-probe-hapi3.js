const fs=require('fs');
function show(p,re,ctx){
  const lines=fs.readFileSync(p,'utf8').split('\n');
  console.log('### '+p);
  lines.forEach((l,i)=>{ if(re.test(l)){
    for(let k=Math.max(0,i-(ctx||3));k<=Math.min(lines.length-1,i+(ctx||3));k++) console.log((k+1)+': '+lines[k].slice(0,200));
    console.log('');
  }});
}
show('src/024-src_server_index.js',/part-preview|PART_FOCUS/,3);
show('wb-verify.js',/HANDLED_API|MARKERS|^\s*\[/,1);