const fs=require('fs');
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
const anchor=`.replace('function _(e){const t=e.characters[e.primaryCharacterId];'`;
const line=`.replace('const t=ae(U=>U.state),o=At(U=>U.statDetailPinned)', 'const t=__wbV(ae(U=>U.state)),o=At(U=>U.statDetailPinned)')`;
if(t.includes('const t=__wbV(ae(U=>U.state))')) console.log('  = уже есть');
else{
  const i=t.indexOf(anchor);
  if(i<0) console.log('  ! нет строки .replace для _');
  else { t=t.slice(0,i)+`          ${line}\n`+t.slice(i); fs.writeFileSync(P,t); console.log('  + ok: AG берёт персонажа через вид'); }
}

const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const h1w=`["H1w: ребёнок без чужой сцены", "sceneVariant:void 0", 1],`;
if(v.includes(h1w) && !v.includes('H2e: панель vitals за выбором')){
  v=v.replace(h1w, h1w+`\n["H2e: панель vitals за выбором", "const t=__wbV(ae(U=>U.state))", 1],`);
  fs.writeFileSync(V,v); console.log('verify: маркер H2e добавлен');
}else console.log('verify: маркер H2e уже есть или H1w не найден');

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H2e: панель vitals за выбором')){
    d+=`\n## H2e: панель vitals следует за выбором\n- Панель \`AG\` (Energy/Mood/Arousal/Allure/Wellbeing, Feelings, Intimate, Wants, Memory) читала главного напрямую через \`_(t)\`.\n- Теперь она берёт стор через \`__wbV(...)\`, поэтому при выбранном ребёнке показывает её поля.\n`;
    fs.writeFileSync(D,d); console.log('docs: дописал H2e');
  }
}