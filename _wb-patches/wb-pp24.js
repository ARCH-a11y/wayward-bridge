const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      const loraTrig = [...new Set(pipeLoras.flatMap((l) => loraWords(l)))].join(", ");',
'      const loraTrig = [...new Set(pipeLoras.flatMap((l) => loraWords(l)))].join(", ");\n      const loraTrigUse = /^(head|mouth)$/.test(part) ? "" : loraTrig;',"триггеры не для лица");
sub('      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra].filter(Boolean).join(", ").split(",").map((x) => x.trim()).filter((x) => x && x.charAt(0) !== "<").join(", ");',
'      const seen = new Set();\n      const tags = [String((b && b.tags) || (full ? anchor : buckets[part]) || "").trim(), full ? "" : hairTags, miscTags, bellyExtra, loraTrigUse].filter(Boolean).join(", ").split(",").map((x) => x.trim()).filter((x) => {\n        if (!x || x.charAt(0) === "<") return false;\n        const k = x.toLowerCase();\n        if (seen.has(k)) return false;\n        seen.add(k);\n        return true;\n      }).join(", ");',"убрать дубли");
sub('const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, loraTrig, "solid dark background, plain background", loras].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", tags, "solid dark background, plain background", loras].filter(Boolean).join(", ");',"промпт без дубля триггеров");
fs.writeFileSync(f,s);