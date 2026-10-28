const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='n==="body"&&u.jsx(WBBody,{hero:cardSel})';
const b='n==="body"&&u.jsx(WBBody,{hero:(function(){var cs=(h&&h.characters)||[];var it=cs.find?cs.find(function(x){return x.id===cardSel;}):null;return (it&&it.archetypeId)||cardSel||"";})()})';
if(!c.includes(a)){ console.log("FAIL ветка"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok резолв через archetypeId");
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
vs=vs.replace('"n===\\"body\\"&&u.jsx(WBBody,{hero:cardSel})"','"n===\\"body\\"&&u.jsx(WBBody,{hero:(function"');
fs.writeFileSync(v,vs);
console.log("verify обновлён");