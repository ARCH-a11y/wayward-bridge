const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='cap.textContent="Body previews ["+k+"] arch="+real;';
const b='cap.textContent="["+k+"] arch="+real+" base="+String(ch.base||"").length+" look="+(ch.look?"yes":"no")+" st="+ch.stage;';
if(!c.includes(a)){ console.log("FAIL"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok подпись с данными");