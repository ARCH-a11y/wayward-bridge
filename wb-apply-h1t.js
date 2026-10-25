const fs=require('fs');
let bad=0;

// ---------- 016: nn без мёртвого снятия подмены + yN за выбором ----------
const P='src/016-src_server_game.js';
let t=fs.readFileSync(P,'utf8');
function rep(a,b,tag){ if(t.includes(b)){console.log('  = уже есть:',tag);return;} const i=t.indexOf(a); if(i<0){console.log('  ! НЕТ АНКОРА:',tag);bad++;return;} t=t.slice(0,i)+b+t.slice(i+a.length); console.log('  + ok:',tag); }

rep(
`'function nn(e,t,o){const n=e.characters[t];if(!n)return e;var __wc=window.__WB_CARD__;window.__WB_CARD__=t===e.primaryCharacterId?"":t;var s=o(n);window.__WB_CARD__=__wc;'`,
`'function nn(e,t,o){const n=e.characters[t];if(!n)return e;const s=o(n);if(t===e.primaryCharacterId&&s&&s.id!==t)console.warn("[wb] nn пишет чужую запись:",t,"<-",s.id);var r={...e.characters,[t]:s};'`,
'nn: без снятия подмены, только ловушка');

rep(`ae(Ae=>e8(_(Ae.state)))`,`ae(Ae=>e8(_(__wbV(Ae.state))))`,'yN: e8(_(__wbV(...)))');
rep(`ae(Ae=>_(Ae.state))`,`ae(Ae=>_(__wbV(Ae.state)))`,'yN: _(__wbV(...))');

if(bad===0){fs.writeFileSync(P,t);console.log('SRC OK');}else{console.log('НЕ ЗАПИСАНО, ошибок:',bad);}

// ---------- 019: снять ловушки ----------
const A='src/019-src_server_assets.generated.js';
let a=fs.readFileSync(A,'utf8');
let badA=0;
function del(x,tag){ const i=a.indexOf(x); if(i<0){console.log('  = уже нет:',tag);return;} a=a.slice(0,i)+a.slice(i+x.length); console.log('  + удалено:',tag); }

del(`            var __ks = Object.keys(g.characters || {}).join(",") + "|" + (g.characters && g.characters.wife ? (g.characters.wife.wbChild ? "W" : "-") : "X");`, '__ks');
del(`            if (__ks !== lastChars) { lastChars = __ks; console.warn("[wb] characters:", __ks); }`, 'ловушка characters');
del(`            var __wid = g.characters && g.characters.wife ? g.characters.wife.id : "";`, '__wid');
del(`            if (__wid !== lastWifeId) { lastWifeId = __wid; console.warn("[wb] чужой id у жены:", __wid, (new Error()).stack); }`, 'ловушка чужой id');
del(`              var __tag = c.id + "|" + her; window.wbSeen = window.wbSeen || {};`, '__tag');
del(`              if (!window.wbSeen[__tag]) { window.wbSeen[__tag] = 1; console.warn("[wb] клон под ключом:", __tag, "| children:", (cs.children || []).map(function(x) { return x.id; }).join(",")); }`, 'ловушка клон под ключом');
del(`          if (c.id === "wife") console.warn("[wb] childRecord под ключом wife");`, 'childRecord под ключом wife');

if(badA===0){fs.writeFileSync(A,a);console.log('019 OK');}else{console.log('019 НЕ ЗАПИСАНО, ошибок:',badA);}

// ---------- verify: маркер H1o переводим на ловушку ----------
const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
if(v.includes('window.__WB_CARD__=t===e.primaryCharacterId')){
  v=v.split('window.__WB_CARD__=t===e.primaryCharacterId').join('nn пишет чужую запись');
  fs.writeFileSync(V,v);console.log('verify: маркер H1o -> nn пишет чужую запись');
}else console.log('verify: маркер H1o уже поправлен');

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1t: чистка диагностики')){
    d+=`\n## H1t: чистка диагностики и портрет за выбором\n- В \`nn\` осталось только \`console.warn\` про чужую запись; снятие подмены убрано как мёртвое.\n- Ловушки \`characters\` / \`чужой id\` / \`клон под ключом\` / \`childRecord под ключом wife\` сняты, строка \`var lastChars...\` оставлена под маркер H1f.\n- \`yN\` читает персонажа через \`_(__wbV(...))\`, поэтому портрет следует за выбором в карточке.\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H1t');
  }
}