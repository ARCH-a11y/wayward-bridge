const fs=require("fs");
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
const a='if(!real){ grid.textContent="No heroine selected."; return; }';
const b='cap.textContent="Body previews ["+(real||hero||"?")+"]"; if(!real){ grid.textContent="No heroine selected."; return; }';
if(!c.includes(a)){ console.log("FAIL"); process.exit(1); }
c=c.replace(a,b);
fs.writeFileSync(g,c);
console.log("ok подпись с id");