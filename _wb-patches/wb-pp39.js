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
'    var id=String(key||g2.wbCard||g2.primaryCharacterId||"");',
'    if(!id) return null;',
'    var ch=Array.isArray(cs)?cs.find(function(x){return x.id===id;}):cs[id];',
'    var ga=ch&&ch.generatedArchetype||null;',
'    var kk=ga&&ga.id?String(ga.id):(ch?String(ch.archetypeId||""):"")||id;',
'    return { id:id, key:kk, arch:ch?String(ch.archetypeId||""):"", base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"" };',
'  }catch(e){ return null; }',
'}'
].join("\\n");
c=c.slice(0,start)+fn+c.slice(end);
c=c.replace('key:cardSel||""','key:String((h&&h.wbCard)||"")');
fs.writeFileSync(g,c);
console.log("ok ключ из wbCard");