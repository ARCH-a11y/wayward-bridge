const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const pipeLoras = (pipe.loras || []).filter((l) => l.enabled !== false && l.model);',
'      const pipeLoras = (pipe.loras || []).filter((l) => l.enabled !== false && l.model).map((l) => Object.assign({}, l, { strength: Math.min(1, (Number(l.strength) || 1) * 0.7) }));',"сила лоры для превью");
sub('      const cropNeg = /^(breasts|ass|vagina)$/.test(part) ? "face, full face, head" : "";',
'      const cropNeg = /^(breasts|ass|vagina)$/.test(part) ? "face, full face, head" : /^(head|mouth)$/.test(part) ? "spread legs, pussy, anus, full body" : "";',"негатив головы");
sub('      ass: "from below, ass focus, spread ass, asshole, facing viewer, puckered anus, spread anus, looking back, ceiling, hips filling frame, head out of frame",',
'      ass: "from below, ass focus, spread ass, asshole, facing viewer, puckered anus, spread anus, hips filling frame, head out of frame",',"задница плотнее");
fs.writeFileSync(f,s);