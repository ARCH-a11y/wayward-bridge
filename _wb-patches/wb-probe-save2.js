const fs=require("fs");
const s=fs.readFileSync("wayward-bridge.js","utf8");
console.log(s.slice(1783150,1783500));
console.log("--- каталог есть: "+fs.existsSync("wayward-bridge-data/part-previews"));
try{ console.log("содержимое: "+fs.readdirSync("wayward-bridge-data/part-previews").join(",")); }catch(e){ console.log("нет каталога: "+e.message); }