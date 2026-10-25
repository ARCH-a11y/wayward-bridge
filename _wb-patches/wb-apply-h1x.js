const fs=require('fs');
const A='src/019-src_server_assets.generated.js';
let a=fs.readFileSync(A,'utf8');
function cut(x,tag){ if(!a.includes(x)){console.log('  = уже нет:',tag);return;} a=a.split(x).join(''); console.log('  + убрано:',tag); }
function swap(x,y,tag){ if(a.includes(y)){console.log('  = уже есть:',tag);return;} if(!a.includes(x)){console.log('  ! НЕТ:',tag);return;} a=a.split(x).join(y); console.log('  + ok:',tag); }

swap(`"|v2"`, `"|v3"`, 'childSig -> v3 (пересборка записей)');
cut(`if (prev.feelings) ch.feelings = prev.feelings;`, 'carry-over: feelings');
cut(`if (prev.relationship) ch.relationship = prev.relationship;`, 'carry-over: relationship');
cut(`if (prev.intoxication) ch.intoxication = prev.intoxication;`, 'carry-over: intoxication');
fs.writeFileSync(A,a);
console.log('019 записан');

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1x: перенос только stats')){
    d+=`\n## H1x: у ребёнка переносится только stats\n- При пересборке \`childRecord\` переносит из предыдущей записи только \`stats\`; \`feelings\`, \`relationship\`, \`notedMoments\`, \`intoxication\` больше не тянутся из жениной копии.\n- \`childSig\` -> \`v3\`, чтобы существующие записи пересобрались один раз.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H1x');
  }
}