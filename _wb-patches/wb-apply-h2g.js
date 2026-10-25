const fs=require('fs');
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
const anchor=`.replace('function _(e){const t=e.characters[e.primaryCharacterId];'`;
const line=`.replace('h=e.phase==="prep"&&!Tt(e),d=_(e),', 'h=e.phase==="prep"&&!Tt(e),d=_(__wbV(e)),')`;
if(t.includes('d=_(__wbV(e))')) console.log('  = уже есть');
else{
  const i=t.indexOf(anchor);
  if(i<0) console.log('  ! нет строки .replace для _');
  else { t=t.slice(0,i)+`          ${line}\n`+t.slice(i); fs.writeFileSync(P,t); console.log('  + ok: sLe получает вид вместо жены'); }
}

const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const h2f=`["H2f: выбор в сторе", "n.wbCard=id", 1],`;
if(v.includes(h2f) && !v.includes('H2g: sLe за выбором')){
  v=v.replace(h2f, h2f+`\n["H2g: sLe за выбором", "d=_(__wbV(e))", 1],`);
  fs.writeFileSync(V,v); console.log('verify: маркер H2g добавлен');
}else console.log('verify: маркер H2g уже есть или H2f не найден');

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H2g: колонка sLe за выбором')){
    d+=`\n## H2g: колонка sLe следует за выбором\n- Родитель \`MLe\` передавал в \`sLe\` жену (\`d=_(e)\`), поэтому блоки «how she seems» и цитата \`lastResponse\` оставались жениными.\n- Теперь передаётся вид: \`d=_(__wbV(e))\`.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H2g');
  }
}