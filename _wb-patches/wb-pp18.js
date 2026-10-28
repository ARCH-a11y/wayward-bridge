const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      breasts: "close-up, head out of frame, cropped head, chest filling frame, bare breasts, nipples visible",',
'      breasts: "close-up, head out of frame, cropped head, chest filling frame, bare breasts, nipples visible",',"breasts без изменений");
sub('      ass: "close-up, head out of frame, cropped head, hips filling frame, from behind, bent over",',
'      ass: "from behind, ass focus, presenting ass, spread ass, anus visible, arched back, looking back over shoulder, head out of frame, cropped head, hips filling frame",',"задница");
sub('      vagina: "extreme close-up, cropped head, pussy filling frame, front view, spread legs",',
'      vagina: "pussy focus, spread pussy, labia, clitoris, front view, thighs apart, cropped head, close-up",',"вагина");
sub('      body: "full body, standing, from front, completely nude",',
'      body: "full body, standing, contrapposto, from front, arms at sides, feet visible",',"тело");
sub('      belly: "close-up, cropped head, midriff filling frame, navel, from front"',
'      belly: "belly focus, midriff filling frame, navel, from front, cropped head"',"живот");
sub('      const miscTags = full ? "" : String(buckets.misc || "").trim();',
'      const miscTags = full ? "" : String(buckets.misc || "").trim();\n      const loras = (String(sec.base || "").match(/<[^>]+>/g) || []).join(", ");\n      const bellyExtra = part === "belly" ? String(childstatePrompt(store.dataDir) || "").trim() : "";',"lora и живот");
sub('      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags].filter(Boolean).join(", ");',
'      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra].filter(Boolean).join(", ");',"теги");
sub('const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background"].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background", loras].filter(Boolean).join(", ");',"lora в промпт");
fs.writeFileSync(f,s);
const v="wb-verify.js";
let vs=fs.readFileSync(v,"utf8");
const add='  ["Превью: lora героини", "const loras = (String(sec.base || \\"\\").match", 1],\n';
const k=vs.lastIndexOf("\n];");
vs=vs.slice(0,k+1)+add+vs.slice(k+1);
fs.writeFileSync(v,vs);
console.log("ok verify +1");