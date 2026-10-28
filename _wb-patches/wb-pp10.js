const fs=require("fs");
const v="wb-verify.js";
let s=fs.readFileSync(v,"utf8");
const pairs=[
['"n===\\"body\\"&&u.jsx(WBBody,{})"','"n===\\"body\\"&&u.jsx(WBBody,{hero:cardSel})"'],
['"function WBBody()"','"function WBBody(props)"'],
['"function wbPFill(el)"','"function wbPFill(el,hero)"']
];
for(const [a,b] of pairs){
  if(!s.includes(a)){ console.log("FAIL "+a); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+a);
}
fs.writeFileSync(v,s);