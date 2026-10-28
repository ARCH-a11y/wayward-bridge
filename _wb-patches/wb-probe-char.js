const fs=require("fs");
const s=fs.readFileSync("src/016-src_server_game.js","utf8");
const i=s.indexOf("function wbChar(");
console.log(s.slice(i,i+600));