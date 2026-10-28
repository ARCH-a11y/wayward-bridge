const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label,opt){
  if(!s.includes(a)){ if(opt){ console.log("пропуск "+label); return; } console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('const loras = (String(sec.base || "").match(/<[^>]+>/g) || []).join(", ");',
'const loras = (Object.values(buckets).join(", ").match(/<[^>]+>/g) || []).filter((v, i, a) => a.indexOf(v) === i).join(", ");',"лора из частей",1);
sub('      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra].filter(Boolean).join(", ");',
'      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra].filter(Boolean).join(", ").split(",").map((x) => x.trim()).filter((x) => x && x.charAt(0) !== "<").join(", ");',"вычистить лору",1);
sub('      const pipe = resolvePipeline(store.effective(heroine).pipeline);',
'      const pipe = resolvePipeline(store.effective(heroine).pipeline);\n      const pipeLoras = (pipe.loras || []).filter((l) => l.enabled !== false && l.model);\n      const loraTrig = [...new Set(pipeLoras.flatMap((l) => loraWords(l)))].join(", ");',"лors из настроек");
sub('const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background", loras].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, loraTrig, "solid dark background, plain background", loras].filter(Boolean).join(", ");',"триггеры в промпт");
sub('buildGraph({ p: pipe, caps, positive, negative,','buildGraph({ p: Object.assign({}, pipe, { loras: pipeLoras }), caps, positive, negative,',"лоры в граф");
sub('portrait: true, noHires: true, noDetail: true, prefix: "wayward/part-preview"','portrait: false, noHires: true, noDetail: true, prefix: "wayward/part-preview"',"сценический шаблон");
fs.writeFileSync(f,s);
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
vs=vs.replace('"const loras = (String(sec.base || \\"\\").match"','"const loras = (Object.values(buckets).join"');
if(!vs.includes("const pipeLoras = (pipe.loras || [])")){
  const k=vs.lastIndexOf("\n];");
  vs=vs.slice(0,k+1)+'  ["Превью: лоры из настроек", "const pipeLoras = (pipe.loras || [])", 1],\n'+vs.slice(k+1);
}
fs.writeFileSync(v,vs);
console.log("verify обновлён");