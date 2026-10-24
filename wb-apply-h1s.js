const fs=require('fs');
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
let bad=0;

function rep(a,b,tag){
  if(t.includes(b)){console.log('  = уже есть:',tag);return;}
  const i=t.indexOf(a);
  if(i<0){console.log('  ! НЕТ АНКОРА:',tag);bad++;return;}
  t=t.slice(0,i)+b+t.slice(i+a.length);
  console.log('  + ok:',tag);
}

console.log('h1s: убираем подмену _ из игры, карточка читает вид через __wbV');

rep(`'function _(e){const t=(window.__WB_CARD__&&e.characters[window.__WB_CARD__])||e.characters[e.primaryCharacterId];'`,
    `'function __wbV(e){const t=(window.__WB_CARD__&&e.characters[window.__WB_CARD__])||e.characters[e.primaryCharacterId];return t===e.characters[e.primaryCharacterId]?e:{...e,primaryCharacterId:t.id}}function _(e){const t=e.characters[e.primaryCharacterId];'`,
    'новый вид __wbV + чистый _ (старая подстрока сохранена для маркеров)');

rep(`'[i,l]=Z.useState(null),[cardSel,setCard]=Z.useState(window.__WB_CARD__||""),h=ae(E=>E.state),d=_(h),'`,
    `'[i,l]=Z.useState(null),[cardSel,setCard]=Z.useState(window.__WB_CARD__||""),h=ae(E=>E.state),d=_(__wbV(h)),'`,
    '$G: d=_(__wbV(h))');

const tabs=[
 [`function $He(){const e=ae(k=>k.state),`,`function $He(){const e=__wbV(ae(k=>k.state)),`],
 [`function IHe(){const e=ae(i=>i.state),`,`function IHe(){const e=__wbV(ae(i=>i.state)),`],
 [`function NHe(){const e=ae(s=>s.state),`,`function NHe(){const e=__wbV(ae(s=>s.state)),`],
 [`function jHe(){const e=ae(h=>h.state),`,`function jHe(){const e=__wbV(ae(h=>h.state)),`],
 [`function AHe(){const e=ae(l=>l.state),`,`function AHe(){const e=__wbV(ae(l=>l.state)),`],
 [`function PHe(){const e=ae(a=>a.state),`,`function PHe(){const e=__wbV(ae(a=>a.state)),`],
];

const anchor=`.replace('function _(e){const t=e.characters[e.primaryCharacterId];'`;
if(t.includes(`function $He(){const e=__wbV(`)){console.log('  = замены табов уже есть');}
else{
  const i=t.indexOf(anchor);
  if(i<0){console.log('  ! не нашёл строку .replace для _');bad++;}
  else{
    const ins=tabs.map(([a,b])=>`          .replace('${a}', '${b}')\n`).join('');
    t=t.slice(0,i)+ins+t.slice(i);
    console.log('  + вставлены замены 6 табов');
  }
}

if(bad===0){fs.writeFileSync(P,t);console.log('SRC OK');}else{console.log('НЕ ЗАПИСАНО, ошибок:',bad);}

const V='wb-verify.js';
if(fs.existsSync(V)){
  let v=fs.readFileSync(V,'utf8');
  let n1=v.split(`h=ae(E=>E.state),d=_(h),`).length-1;
  if(n1>0)v=v.split(`h=ae(E=>E.state),d=_(h),`).join(`d=_(__wbV(h)),`);
  let n2=v.split(`d=_(h)`).length-1;
  if(n2>0)v=v.split(`d=_(h)`).join(`d=_(__wbV(h))`);
  if(n1+n2>0){fs.writeFileSync(V,v);console.log('verify: поправил маркеры x'+(n1+n2));}
  else console.log('verify: маркеров с d=_(h) нет');
}

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1s: подмена выбора')){
    d+=`\n## H1s: подмена выбора — только в карточке\n- \`_\` больше не патчится: игра всегда видит настоящего primary.\n- \`__wbV(state)\` — вид: \`{...state, primaryCharacterId: __WB_CARD__}\` если выбор задан, иначе сам state.\n- Карточка ($G + 6 табов) читает стор через \`__wbV(...)\`, поэтому подмена не выходит за её пределы.\n- Почему: глобальная подмена \`_\` травила любой код игры, который считал \`_(state)\` вне \`nn\`.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H1s');
  }
}