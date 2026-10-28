const fs=require("fs");
const g="src/016-src_server_game.js";
let s=fs.readFileSync(g,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('  if(!hero){ el.appendChild(document.createTextNode("No heroine selected.")); return; }\\n',"","нет раннего выхода");
sub('var real=String((j&&j.heroine)||hero||""); ','var real=String((j&&j.heroine)||hero||""); if(!real){ grid.textContent="No heroine selected."; return; } ',"проверка после ответа");
fs.writeFileSync(g,s);