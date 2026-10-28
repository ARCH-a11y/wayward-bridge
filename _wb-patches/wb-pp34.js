const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
function sub(a,b,label){
  if(!c.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  c=c.replace(a,b); console.log("ok "+label);
}
sub('    if(!c) return id?{ id:id, arch:"", base:"", neg:"" }:null;\\n    var ga=c.generatedArchetype||null;\\n    return { id:id, arch:String(c.archetypeId||""), base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||"") };',
'    var ga=c&&c.generatedArchetype||null;\\n    if(!c) return id?{ id:id, key:id, arch:"", base:"", neg:"" }:null;\\n    var kk=ga&&ga.id?String(ga.id):(String(c.archetypeId||"")||id);\\n    return { id:id, key:kk, arch:String(c.archetypeId||""), base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||"") };',"ключ по generatedArchetype");
sub('body:JSON.stringify({heroine:ch.arch,key:ch.id,base:ch.base,neg:ch.neg})','body:JSON.stringify({heroine:ch.arch,key:ch.key,base:ch.base,neg:ch.neg})',"ключ в запросе");
sub('k=String((j&&j.key)||ch.id);','k=String((j&&j.key)||ch.key);',"ключ в ответе");
fs.writeFileSync(g,c);