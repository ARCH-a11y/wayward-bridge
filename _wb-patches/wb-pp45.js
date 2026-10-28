const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='WB_PARTS.forEach(function(x){ grid.appendChild(wbPCard(real,k,x[0],x[1],p[x[0]],pv[x[0]],ch)); });';
const b='var misc=String(p.misc||"").trim(); WB_PARTS.forEach(function(x){ var t=x[0]==="head"||x[0]==="breasts" ? [p[x[0]],misc].filter(Boolean).join(", ") : p[x[0]]; grid.appendChild(wbPCard(real,k,x[0],x[1],t,pv[x[0]],ch)); });';
if(!c.includes(a)){ console.log("FAIL"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok misc в подписи карточек");