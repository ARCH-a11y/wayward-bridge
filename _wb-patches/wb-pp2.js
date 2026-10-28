const fs=require('fs');
let v=fs.readFileSync('wb-verify.js','utf8');
const add=[
  '  ["Превью: фокус частей", "var PART_FOCUS = {", 1],\n',
  '  ["Превью: функция", "function partPreview(", 1],\n',
  '  ["Превью: роут", "/bridge/api/part-preview", 1],\n'
];
let added=0;
for(const a of add){
  const needle=a.match(/"(.+?)", \d/)[1];
  if(v.includes('"'+needle+'"')){ console.log('уже есть: '+needle); continue; }
  const idx=v.lastIndexOf('\n];');
  if(idx<0){ console.log('FAIL якорь ];'); process.exit(1); }
  v=v.slice(0,idx+1)+a+v.slice(idx+1);
  added++;
  console.log('ok '+needle);
}
fs.writeFileSync('wb-verify.js',v);
console.log('добавлено '+added);
try{
  let c=fs.readFileSync('CONTEXT.md','utf8');
  const before=(c.match(/216/g)||[]).length;
  c=c.replace(/216/g,'219');
  fs.writeFileSync('CONTEXT.md',c);
  console.log('CONTEXT 216->219: '+before);
}catch(e){ console.log('CONTEXT пропущен: '+e.message); }