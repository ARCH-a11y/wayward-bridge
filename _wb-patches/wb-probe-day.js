// wb-probe-day.js — где в игре живёт счётчик дня и переход дня
const fs=require('fs'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function ctx(word,before,after,n){const re=new RegExp(word,'g');let m,k=0;
  while((m=re.exec(s))&&k<n){console.log('['+word+'] '+JSON.stringify(s.slice(Math.max(0,m.index-before),m.index+after)));k++;}}
console.log('len',s.length);
['dayCount','dayIndex','nextDay','advanceDay','timeOfDay','weekday','newDay','dailyState'].forEach(w=>{console.log('== '+w);ctx(w,90,110,6);});
console.log('== store');
ctx('zustand|createStore|__WB_STORE__',80,140,4);
