const fs=require('fs');
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
let bad=0;
function rep(a,b,tag){ if(t.includes(b)){console.log('  = уже есть:',tag);return;} const i=t.indexOf(a); if(i<0){console.log('  ! НЕТ АНКОРА:',tag);bad++;return;} t=t.slice(0,i)+b+t.slice(i+a.length); console.log('  + ok:',tag); }

rep(
`'function nn(e,t,o){const n=e.characters[t];if(!n)return e;var __wc=window.__WB_CARD__;window.__WB_CARD__=t===e.primaryCharacterId?"":t;var s=o(n);window.__WB_CARD__=__wc;'`,
`'function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n);if(t===e.primaryCharacterId&&s&&s.id!==t)console.warn("[wb] nn пишет чужую запись:",t,"<-",s.id);var r={...e.characters,[t]:s};'`,
'nn: без снятия подмены, только ловушка');

const yN=[
`.replace('ae(Ae=>e8(_(Ae.state)))', 'ae(Ae=>e8(_(__wbV(Ae.state))))')`,
`.replace('ae(Ae=>_(Ae.state))', 'ae(Ae=>_(__wbV(Ae.state)))')`,
];
const anchor=`.replace('function _(e){const t=e.characters[e.primaryCharacterId];'`;
if(t.includes('ae(Ae=>_(__wbV(Ae.state)))')){console.log('  = yN уже есть');}
else{
  const i=t.indexOf(anchor);
  if(i<0){console.log('  ! не нашёл строку .replace для _');bad++;}
  else{
    t=t.slice(0,i)+yN.map(s=>`          ${s}\n`).join('')+t.slice(i);
    console.log('  + вставлены замены yN');
  }
}

if(bad===0){fs.writeFileSync(P,t);console.log('SRC OK');}else{console.log('НЕ ЗАПИСАНО, ошибок:',bad);}

const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const h1o=`["H1o: запись не путает персонажей", "nn пишет чужую запись", 1],`;
if(v.includes(h1o) && !v.includes('H1t: портрет за выбором')){
  v=v.replace(h1o, h1o+`\n["H1t: портрет за выбором", "ae(Ae=>_(__wbV(Ae.state)))", 1],`);
  fs.writeFileSync(V,v); console.log('verify: добавлен маркер H1t');
}else console.log('verify: маркер H1t уже есть или H1o не найден');