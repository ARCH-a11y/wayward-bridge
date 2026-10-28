const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const tb = partTagBuckets(heroine, b && b.base);',
'      const rawBase = String((b && b.base) || "").trim() || (b && b.look ? looksDescribe(b.look, b.stage, b.sex) : "");\n      const tb = partTagBuckets(heroine, rawBase);',"внешность ребёнка в превью");
sub('        const t2 = partTagBuckets(h, b && b.base);',
'        const rawBase2 = String((b && b.base) || "").trim() || (b && b.look ? looksDescribe(b.look, b.stage, b.sex) : "");\n        const t2 = partTagBuckets(h, rawBase2);',"внешность ребёнка в частях");
fs.writeFileSync(f,s);

const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
function subc(a,b,label){
  if(!c.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  c=c.replace(a,b); console.log("ok "+label);
}
subc('return { id:id, key:kk, arch:ch?String(ch.archetypeId||""):"", base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"" };',
'return { id:id, key:kk, arch:ch?String(ch.archetypeId||""):"", base:ga?String(ga.imageBase||""):"", neg:ga?String(ga.imageNegative||""):"", look:(ch&&ch.look)||null, stage:String((ch&&ch.stage)||""), sex:String((ch&&ch.sex)||"f") };',"поля ребёнка");
subc('function wbPCard(hero,key,part,label,tags,prev,base,neg){','function wbPCard(hero,key,part,label,tags,prev,src){',"аргумент src");
subc('body:JSON.stringify({heroine:hero,key:key,part:part,base:base,neg:neg,seed:im.style.display==="block"?(Date.now()%1e9):0})',
'body:JSON.stringify({heroine:hero,key:key,part:part,base:src.base,neg:src.neg,look:src.look,stage:src.stage,sex:src.sex,seed:im.style.display==="block"?(Date.now()%1e9):0})',"src в запросе");
subc('body:JSON.stringify({heroine:ch.arch,key:ch.key,base:ch.base,neg:ch.neg})',
'body:JSON.stringify({heroine:ch.arch,key:ch.key,base:ch.base,neg:ch.neg,look:ch.look,stage:ch.stage,sex:ch.sex})',"src в частях");
subc('wbPCard(real,k,x[0],x[1],p[x[0]],pv[x[0]],ch.base,ch.neg)','wbPCard(real,k,x[0],x[1],p[x[0]],pv[x[0]],ch)',"передача src");
fs.writeFileSync(g,c);