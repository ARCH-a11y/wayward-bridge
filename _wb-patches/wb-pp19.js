const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub('      ass: "from behind, ass focus, presenting ass, spread ass, anus visible, arched back, looking back over shoulder, head out of frame, cropped head, hips filling frame",',
'      ass: "from below, ass focus, spread ass, asshole, facing viewer, puckered anus, spread anus, looking back, ceiling, hips filling frame, head out of frame",',"задница");
sub('      vagina: "pussy focus, spread pussy, labia, clitoris, front view, thighs apart, cropped head, close-up",',
'      vagina: "spread pussy, pussy focus, pussy, anus, clitoris, pubic hair, front view, close-up, cropped head",',"вагина");
sub('      body: "full body, standing, contrapposto, from front, arms at sides, feet visible",',
'      body: "full body, standing, contrapposto, from front, arms at sides, feet visible, pussy visible, pussy juice",',"тело");
fs.writeFileSync(f,s);