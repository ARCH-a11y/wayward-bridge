const fs=require('fs');
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
let bad=0;
function rep(a,b,tag){ if(t.includes(b)){console.log('  = уже есть:',tag);return;} if(!t.includes(a)){console.log('  ! НЕТ АНКОРА:',tag);bad++;return;} t=t.replace(a,b); console.log('  + ok:',tag); }

rep(
`'function __wbV(e){const t=(window.__WB_CARD__&&e.characters[window.__WB_CARD__])||e.characters[e.primaryCharacterId];return t===e.characters[e.primaryCharacterId]?e:{...e,primaryCharacterId:t.id}}function _(e){const t=e.characters[e.primaryCharacterId];'`,
`'function __wbV(e){const c=e.wbCard||window.__WB_CARD__;if(!c||!e.characters[c])return e;return e.characters[c]===e.characters[e.primaryCharacterId]?e:{...e,primaryCharacterId:c}}function _(e){const t=e.characters[e.primaryCharacterId];'`,
'__wbV читает выбор из state.wbCard');

rep(
`onClick:function(){window.__WB_CARD__=id;setCard(id);}`,
`onClick:function(){window.__WB_CARD__=id;setCard(id);var __s=window.__WB_STORE__;if(__s&&__s.setState)__s.setState(function(x){var g=x.state||{},n={},k;for(k in g)n[k]=g[k];n.wbCard=id;return{state:n};});}`,
'клик пишет выбор в стор (перерисовка всех)');

if(bad===0){fs.writeFileSync(P,t);console.log('SRC OK');}else console.log('НЕ ЗАПИСАНО, ошибок:',bad);

const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
if(v.includes('"window.__WB_CARD__&&e.characters[window.__WB_CARD__]"')){
  v=v.replace('"window.__WB_CARD__&&e.characters[window.__WB_CARD__]"','"e.wbCard||window.__WB_CARD__"');
  console.log('verify: маркер H1d обновлён');
}
const h2e=`["H2e: панель vitals за выбором", "const t=__wbV(ae(U=>U.state))", 1],`;
if(v.includes(h2e) && !v.includes('H2f: выбор в сторе')){
  v=v.replace(h2e, h2e+`\n["H2f: выбор в сторе", "n.wbCard=id", 1],`);
  console.log('verify: маркер H2f добавлен');
}
fs.writeFileSync(V,v);

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H2f: выбор в сторе')){
    d+=`\n## H2f: выбор хранится в стейте\n- Выбор жил в глобальной \`window.__WB_CARD__\` и менялся только локальным стейтом \`$G\`, поэтому соседние компоненты (панель \`AG\`) не перерисовывались на клик — подхватывали выбор лишь при чужой перерисовке.\n- Теперь клик пишет \`state.wbCard\`, а \`__wbV\` читает его из стейта: перерисовываются все подписчики, панель переключается сразу.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H2f');
  }
}