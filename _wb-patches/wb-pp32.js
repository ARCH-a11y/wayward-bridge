const fs=require("fs");
const v="wb-verify.js";
let s=fs.readFileSync(v,"utf8");
const pairs=[
['"n===\\"body\\"&&u.jsx(WBBody,{hero:(function"','"n===\\"body\\"&&u.jsx(WBBody,{key:cardSel"'],
['"function wbPFill(el,hero)"','"function wbPFill(el,key)"']
];
for(const [a,b] of pairs){
  if(!s.includes(a)){ console.log("FAIL "+a); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+a);
}
fs.writeFileSync(v,s);