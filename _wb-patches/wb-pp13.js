const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('    function resolveHeroine(id) {',[
'    function heroineSeed(id) {',
'      let h = 2166136261;',
'      const str = String(id || "");',
'      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }',
'      return Math.abs(h) % 1e9;',
'    }',
'    function resolveHeroine(id) {'
].join("\n"),"сид героини");
sub('const tags = String((b && b.tags) || buckets[part] || Object.values(buckets).join(", ") || "").trim();',
'const tags = String((b && b.tags) || buckets[part] || "").trim();\n      const anchor = String(Object.values(buckets).join(", ")).trim();',"якорь внешности");
sub('if (!tags) return { ok: false, error: "This part has no words to draw." };',
'if (!tags && !anchor) return { ok: false, error: "This part has no words to draw." };',"проверка пустоты");
sub('const positive = [pipe.quality, "1girl, solo, simple background", PART_FOCUS[part] || "", tags].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, simple background", anchor, PART_FOCUS[part] || ""].filter(Boolean).join(", ");',"промпт с якорем");
sub('seed: Date.now() % 1e9','seed: Number(b && b.seed) || heroineSeed(heroine)',"сид");
fs.writeFileSync(f,s);
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
function subc(a,b,label){
  if(!c.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  c=c.replace(a,b); console.log("ok "+label);
}
subc("minmax(148px,1fr)","minmax(210px,1fr)","сетка шире");
subc('body:JSON.stringify({heroine:hero,part:part})','body:JSON.stringify({heroine:hero,part:part,seed:have[part]?(Date.now()%1e9):0})',"сид на Redraw");
fs.writeFileSync(g,c);