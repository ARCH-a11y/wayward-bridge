const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
const focus=[
'    var PART_FOCUS = {',
'      base: "full body, standing, completely nude",',
'      head: "face focus, portrait, close-up on face, looking at viewer",',
'      mouth: "extreme close-up on mouth, open mouth, tongue out, showing teeth, parted lips",',
'      body: "full body, standing, from front, wide hips, narrow waist, completely nude",',
'      breasts: "close-up on breasts, upper body, bare breasts, nipples visible",',
'      ass: "close-up on ass, from behind, bent over, looking back over shoulder",',
'      vagina: "extreme close-up on pussy, front view, spread legs, bare",',
'      misc: "full body, standing",',
'      belly: "close-up on belly, midriff, navel, from front"',
'    };'
].join("\n");
const oldFocus=[
'    var PART_FOCUS = {',
'      base: "full body",',
'      head: "portrait, face focus",',
'      mouth: "portrait, close-up, mouth focus",',
'      body: "full body",',
'      breasts: "upper body, breasts focus",',
'      ass: "from behind, ass focus",',
'      vagina: "nude, pussy focus, close-up",',
'      misc: "full body"',
'    };'
].join("\n");
sub(oldFocus,focus,"фокусы");
sub('const positive = [pipe.quality, "1girl, solo, simple background", anchor, PART_FOCUS[part] || ""].filter(Boolean).join(", ");',
'const positive = [pipe.quality, "1girl, solo, completely nude", PART_FOCUS[part] || "", anchor, "medieval tavern interior background, warm candlelight, soft focus"].filter(Boolean).join(", ");',"промпт");
sub('const negative = [negTags, String(pipe.negative || "")].filter(Boolean).join(", ");',
'const negative = [negTags, "clothes, dress, skirt, shirt, pants, underwear, bra, panties", String(pipe.negative || "")].filter(Boolean).join(", ");',"негатив одежды");
fs.writeFileSync(f,s);
const g="src/016-src_server_game.js";
let c=fs.readFileSync(g,"utf8");
function subc(a,b,label){
  if(!c.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  c=c.replace(a,b); console.log("ok "+label);
}
subc('function wbPCard(hero,part,label,tags){','function wbPCard(hero,part,label,tags,alt){',"аргумент alt");
subc('var have=wbPStore()[hero]||{};','var have=wbPStore()[hero]||wbPStore()[alt]||{};',"чтение по обоим ключам");
subc('s2[hero]=s2[hero]||{}; s2[hero][part]=j.image; wbPSave(s2);',
's2[hero]=s2[hero]||{}; s2[hero][part]=j.image; if(alt&&alt!==hero){ s2[alt]=s2[alt]||{}; s2[alt][part]=j.image; } wbPSave(s2);',"запись по обоим ключам");
subc('grid.appendChild(wbPCard(real,x[0],x[1],p[x[0]]))','grid.appendChild(wbPCard(real,x[0],x[1],p[x[0]],hero))',"передача alt");
fs.writeFileSync(g,c);