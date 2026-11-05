'use strict';
const fs = require('fs');
const G = 'src/016-src_server_game.js';
const V = 'wb-verify.js';

const A_FROM = 'children:"Encounters"}),u.jsx(Mc,{active:n==="body",onClick:()=>s("body"),children:"Body"})]}),n==="body"&&u.jsx(WBBody,{key:String((h&&h.wbCard)||"")}),n==="stats"&&u.jsx($He,{})';
const A_TO = 'children:"Encounters"})]}),n==="stats"&&u.jsx(window.__WB_SPLIT__||WBBody,{key:String((h&&h.wbCard)||"")})';

const B_FROM = '\\nfunction WBBody(props){\\n  var k=String((props&&props.key)||"");\\n  return u.jsx("div",{ref:function(el){ if(el&&el.dataset.wbH!==k){ el.dataset.wbH=k; wbPFill(el,k); } }});\\n}';
const B_TO = B_FROM + '\\nif(!window.__WB_SPLIT__) window.__WB_SPLIT__=function WBSplit(props){\\n  var k=String((props&&props.key)||"");\\n  var S=window.__WB_STORE__, st=(S&&S.getState?S.getState():{}).state||{}, tab=st.wbBodyTab==="body"?"body":"stats";\\n  function go(v){ if(!S||!S.setState) return; S.setState(function(x){ var g=x.state||{}, n={}, q; for(q in g) n[q]=g[q]; n.wbBodyTab=v; return {state:n}; }); }\\n  return u.jsxs("div",{children:[u.jsxs("div",{className:"flex flex-wrap gap-x-1 gap-y-0.5 mb-2",children:[u.jsx(Mc,{key:"stats",active:tab==="stats",onClick:function(){go("stats")},children:"Stats"}),u.jsx(Mc,{key:"body",active:tab==="body",onClick:function(){go("body")},children:"Body"})]}),tab==="body"?u.jsx(WBBody,{key:k}):u.jsx($He,{})]});\\n};';

const V_FROM = '["Превью: ветка body", "n===\\"body\\"&&u.jsx(WBBody,{key:String", 1],';
const V_TO = '["Превью: ветка body", "n===\\"stats\\"&&u.jsx(window.__WB_SPLIT__||WBBody,{key:String", 1],';
const M_FROM = '  ["Превью: компонента", "function WBBody(props)", 1],';
const M_TO = M_FROM + '\n  ["Превью: подвкладки", "window.__WB_SPLIT__=function WBSplit(props)", 1],';

const PLAN = [
  [G, [[A_FROM, A_TO, 'полоса: Body убран из табов'], [B_FROM, B_TO, 'компонент под-вкладок']]],
  [V, [[V_FROM, V_TO, 'маркер ветки'], [M_FROM, M_TO, 'маркер подвкладок']]]
];

const out = [];
for (const [file, pairs] of PLAN) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [from, , label] of pairs) {
    const n = src.split(from).length - 1;
    if (n !== 1) {
      const i = src.indexOf(from);
      console.log('FAIL ' + file + ' / ' + label + ': совпадений ' + n + ', нужно 1');
      if (i >= 0) console.log('---\n' + src.slice(Math.max(0, i - 300), i + from.length + 300) + '\n---');
      process.exit(1);
    }
  }
  let res = src;
  for (const [from, to, label] of pairs) { res = res.replace(from, () => to); console.log('ok ' + label); }
  out.push([file, res]);
}
for (const [file, res] of out) fs.writeFileSync(file, res);
console.log('записано');