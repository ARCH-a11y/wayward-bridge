const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const start=c.indexOf("function wbChar(key){");
const end=c.indexOf("\\nfunction wbPCard(",start);
if(start<0||end<0){ console.log("FAIL границы"); process.exit(1); }
const fn=[
'function wbChar(key){',
'  try{',
'    var s=window.__WB_STORE__; if(!s||!s.getState) return null;',
'    var g2=(s.getState()||{}).state||{}, cs=g2.characters||{};',
'    var id=String(key||g2.primaryCharacterId||""); var ch=cs[id];',
'    if(!ch) return id?{ id:id, key:id, arch:"", base:"", neg:"" }:null;',
'    var ga=ch.generatedArchetype||null;',
'    var kk=ga&&ga.id?String(ga.id):(String(ch.archetypeId||"")||id);',
'    return { id:id, key:kk, arch:String(ch.archetypeId||""), base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"" };',
'  }catch(e){ return null; }',
'}'
].join("\\n");
c=c.slice(0,start)+fn+c.slice(end);
c=c.replace('body:JSON.stringify({heroine:ch.arch,key:ch.id,base:ch.base,neg:ch.neg})','body:JSON.stringify({heroine:ch.arch,key:ch.key,base:ch.base,neg:ch.neg})');
c=c.replace('k=String((j&&j.key)||ch.id);','k=String((j&&j.key)||ch.key);');
fs.writeFileSync(g,c);
console.log("ok wbChar переписан");
const i=c.indexOf("function wbChar(");
console.log(c.slice(i,i+700));