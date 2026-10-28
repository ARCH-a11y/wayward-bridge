const fs=require("fs");
const s=fs.readFileSync("src/016-src_server_game.js","utf8");
let i=-1;
while((i=s.indexOf("Encounters",i+1))>=0){
  console.log("=== @"+i);
  console.log(s.slice(Math.max(0,i-500),i+260));
  console.log("");
}
console.log("--- якорь полосы @7098:");
console.log(s.slice(6900,7350));