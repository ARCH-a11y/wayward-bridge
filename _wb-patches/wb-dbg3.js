const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='var p=(j&&j.parts)||{}, pv=(j&&j.previews)||{}, real=String((j&&j.heroine)||ch.arch||""), k=String((j&&j.key)||ch.key);';
const b=a+'\\n      cap.textContent="Body previews ["+k+"] arch="+real;';
if(!c.includes(a)){ console.log("FAIL"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok подпись с ключом");