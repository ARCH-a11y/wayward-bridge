const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const chk='      if (!tags) return { ok: false, error: "This part has no words to draw." };\n';
if(!s.includes(chk)){ console.log("FAIL проверка"); process.exit(1); }
s=s.replace(chk,"");
const at=s.indexOf("      }).join(\", \");", s.indexOf("const loraTrigUse = "));
if(at<0){ console.log("FAIL конец тегов"); process.exit(1); }
const end=s.indexOf("\n",at)+1;
s=s.slice(0,end)+chk+s.slice(end);
fs.writeFileSync(f,s);
console.log("ok проверка перенесена");
const q=s.indexOf("async function partPreview(b) {");
console.log(s.slice(q+900,q+1700));