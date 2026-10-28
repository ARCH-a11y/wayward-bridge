const fs=require("fs");
const g=JSON.parse(fs.readFileSync("wayward-bridge-data/game-snapshot.json","utf8"));
const cs=(g.prompts||{}).characters||null;
console.log("ключи снимка: "+Object.keys(g).join(","));
if(!cs) console.log("персонажей в снимке нет");
else for(const [id,c] of Object.entries(cs)) console.log(id+" | arch="+c.archetypeId+" | ga="+(c.generatedArchetype?JSON.stringify({id:c.generatedArchetype.id, base:String(c.generatedArchetype.imageBase||"").slice(0,60)}):"нет"));