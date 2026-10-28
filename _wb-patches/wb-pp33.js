const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='n==="body"&&u.jsx(WBBody,{key:cardSel||""}):null;return (it&&it.archetypeId)||cardSel||"";})()}),n==="stats"&&u.jsx($He,{})';
const b='n==="body"&&u.jsx(WBBody,{key:cardSel||""}),n==="stats"&&u.jsx($He,{})';
if(!c.includes(a)){ console.log("FAIL"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok ветка восстановлена");