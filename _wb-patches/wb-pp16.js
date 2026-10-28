const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
const block=[
'        const pdir = path.join(DATA_DIR, "part-previews", heroine);',
'        fs.mkdirSync(pdir, { recursive: true });',
'        fs.writeFileSync(path.join(pdir, part + ".png"), buf);',
'        '
].join("\n");
const pIdx=s.indexOf("async function partPreview(b) {");
if(pIdx<0){ console.log("FAIL функция"); process.exit(1); }
const first=s.indexOf(block);
if(first<0){ console.log("FAIL блок"); process.exit(1); }
if(first<pIdx){
  s=s.slice(0,first)+s.slice(first+block.length);
  console.log("ok снято из testPipeline");
} else console.log("в testPipeline не было");
const p2=s.indexOf("async function partPreview(b) {");
const anchor="        const buf = await comfy.view(img);\n";
const at=s.indexOf(anchor,p2);
if(at<0){ console.log("FAIL место вставки"); process.exit(1); }
s=s.slice(0,at+anchor.length)+block+s.slice(at+anchor.length);
fs.writeFileSync(f,s);
console.log("ok вставлено в partPreview");