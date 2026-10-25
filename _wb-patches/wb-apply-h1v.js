const fs=require('fs');
const A='src/019-src_server_assets.generated.js';
let a=fs.readFileSync(A,'utf8');
const anchor=`ch.busyUntilSlot = 0;`;
console.log('анкоров в файле:', a.split(anchor).length-1);
if(a.includes('H1v: не тащить')){console.log('  = уже есть');}
else{
  const i=a.indexOf(anchor);
  if(i<0){console.log('  ! НЕТ АНКОРА:',anchor);}
  else{
    const add=`\n          // H1v: не тащить «текущее» состояние жены\n          ["scene","sceneOverride","sceneVariant","sceneSetAtSlot","exposure","aftermathTags","aftermathFromPatron","aftermathFadeAt","lastResponse","lastResponseType","lastResponseSlot","lastActionDelta","lastActionDrive","innerThought","innerThoughtType","innerThoughtSlot","notedMoments","dailyState","taskTarget","locationUntilSlot","lastPatronContext","recentStimuli","recentThoughtIds","pendingPrompt","pendingReaction","soreness","orgasmsToday","sexLoadToday","sexStagesToday","lastSexStageSlot","lastSexStageLoad","lastOrgasmSlot","intoxication"].forEach(function(k) { delete ch[k]; });\n`;
    a=a.slice(0,i+anchor.length)+add+a.slice(i+anchor.length);
    fs.writeFileSync(A,a);
    console.log('  + ok: childRecord чистит унаследованное');
  }
}

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1v: ребёнок не наследует')){
    d+=`\n## H1v: ребёнок не наследует «текущее» жены\n- \`childRecord\` клонирует запись жены целиком, поэтому в ребёнка переезжали её сцена (\`sceneOverride\`), exposure, aftermath, память и мысли — отсюда «жена общается, а рисуется дочь».\n- После клонирования список текущих полей удаляется.\n\n## H5 (решение): промпт из события, а не из текущего состояния\n- Событие несёт \`characterId\`; для картинки берётся промпт внешности этого персонажа, а сцена и действие — из самого события.\n- События детей идут в ту же ленту; промпт собирается по персонажу события, а не по «текущему главному».\n- До этого картинка ребёнка берёт сцену из своей записи (после H1v — из \`currentTask\`, то есть idle в своей комнате).\n`;
    fs.writeFileSync(D,d);
    console.log('docs: дописал H1v/H5');
  }
}