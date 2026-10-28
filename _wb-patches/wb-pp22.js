const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const block=[
'      const pipeLoras = (pipe.loras || []).filter((l) => l.enabled !== false && l.model);',
'      const loraTrig = [...new Set(pipeLoras.flatMap((l) => loraWords(l)))].join(", ");',
'      '
].join("\n");
const pIdx=s.indexOf("async function partPreview(b) {");
if(pIdx<0){ console.log("FAIL функция"); process.exit(1); }
const first=s.indexOf(block);
if(first>=0 && first<pIdx){ s=s.slice(0,first)+s.slice(first+block.length); console.log("ok снято из чужой функции"); }
const p2=s.indexOf("async function partPreview(b) {");
const anchor="      const pipe = resolvePipeline(store.effective(heroine).pipeline);\n";
const at=s.indexOf(anchor,p2);
if(at<0){ console.log("FAIL место"); process.exit(1); }
s=s.slice(0,at+anchor.length)+block+s.slice(at+anchor.length);
fs.writeFileSync(f,s);
console.log("ok внутри partPreview");
const q=s.indexOf("async function partPreview(b) {");
console.log(s.slice(q,q+700));