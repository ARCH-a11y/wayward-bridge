// wb-probe-tavern.js — как добавляются улучшения таверны (под детскую)
const fs=require('fs'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function ctx(word,before,after,n){const re=new RegExp(word,'g');let m,k=0;
  while((m=re.exec(s))&&k<n){console.log('['+word+'] '+JSON.stringify(s.slice(Math.max(0,m.index-before),m.index+after)));k++;}}
['back room','bathhouse','guest room','lodger','upgrade','improvement','buildRoom'].forEach(w=>{console.log('== '+w);ctx(w,90,140,6);});
