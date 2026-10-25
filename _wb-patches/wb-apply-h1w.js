const fs=require('fs');
let bad=0;

// ---- 016: yN не навязывает ребёнку сцену жены ----
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
function rep(a,b,tag){ if(t.includes(b)){console.log('  = уже есть:',tag);return;} const i=t.indexOf(a); if(i<0){console.log('  ! НЕТ АНКОРА:',tag);bad++;return;} t=t.slice(0,i)+b+t.slice(i+a.length); console.log('  + ok:',tag); }

const yN=[
`.replace('o=ae(Ae=>wf(Ae.state).scene)', 'o=ae(Ae=>_(__wbV(Ae.state)).id===Ae.state.primaryCharacterId?wf(Ae.state).scene:void 0)')`,
`.replace('n=ae(Ae=>wf(Ae.state).sceneVariant)', 'n=ae(Ae=>_(__wbV(Ae.state)).id===Ae.state.primaryCharacterId?wf(Ae.state).sceneVariant:void 0)')`,
];
const anchor=`.replace('function _(e){const t=e.characters[e.primaryCharacterId];'`;
if(t.includes('wf(Ae.state).scene:void 0')){console.log('  = сцена yN уже есть');}
else{
  const i=t.indexOf(anchor);
  if(i<0){console.log('  ! нет строки .replace для _');bad++;}
  else{ t=t.slice(0,i)+yN.map(s=>`          ${s}\n`).join('')+t.slice(i); console.log('  + вставлены замены сцены yN'); }
}
if(bad===0){fs.writeFileSync(P,t);console.log('SRC OK');}else{console.log('НЕ ЗАПИСАНО, ошибок:',bad);}

// ---- 019: форс пересборки записей детей + расширенная чистка ----
const A='src/019-src_server_assets.generated.js';
let a=fs.readFileSync(A,'utf8');
function one(x,y,tag){
  if(!a.includes(x)){console.log('  ! НЕТ:',tag);return;}
  if(y && a.includes(y)){console.log('  = уже есть:',tag);return;}
  a=a.split(x).join(y);console.log('  + ok:',tag);
}
one(`+ (c.movedOut ? 1 : 0);`, `+ (c.movedOut ? 1 : 0) + "|v2";`, 'childSig -> v2 (пересборка один раз)');
one(`if (prev.notedMoments) ch.notedMoments = prev.notedMoments;`, ``, 'carry-over: не тащить чужую память');
one(`"intoxication"]`, `"intoxication","conditioning","firstsWithOthers","crossedLineHistory","intimateHistory","moments","anticipations","recentStimuli","recentThoughtIds","recentAgencyActions","recentContemptDeltas","actionMemory","actionAffinity","pendingPrompt","pendingReaction","daresAcceptedToday","onPatronLap","propositionPressure","cardsStake","marketTrip","outing","outingsTaken","stayedInHerBedNight","outfitReactedTo","unwornOutfits"]`, 'расширить список чистки');
fs.writeFileSync(A,a);console.log('019 записан');

// ---- verify: маркер ----
const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const h1t=`["H1t: портрет за выбором", "ae(Ae=>_(__wbV(Ae.state)))", 1],`;
if(v.includes(h1t) && !v.includes('H1w: ребёнок без чужой сцены')){
  v=v.replace(h1t, h1t+`\n["H1w: ребёнок без чужой сцены", "sceneVariant:void 0", 1],`);
  fs.writeFileSync(V,v);console.log('verify: маркер H1w добавлен');
}else console.log('verify: маркер H1w уже есть или H1t не найден');

// ---- docs ----
const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1w: ребёнок не в чужой сцене')){
    d+=`\n## H1w: ребёнок не рисуется в чужой сцене\n- \`yN\` подставлял в любого персонажа сцену главного через \`K8(t,{scene:wf(state).scene,...})\`. Теперь сцена подставляется только когда показан сам главный, иначе остаются сцена/задача персонажа.\n- \`childSig\` получил версию \`v2\`, чтобы существующие записи детей пересобрались один раз и подхватили чистку из H1v.\n- В чистку добавлены следы чужой жизни: conditioning, firstsWithOthers, intimateHistory, память действий, ожидания, вылазки.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H1w');
  }
}