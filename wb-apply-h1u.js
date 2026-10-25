const fs=require('fs');
const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const m=v.match(/\["H1h:[^\]]*\]/);
if(m){
  console.log('H1h было:',m[0]);
  v=v.replace(m[0],'["H1h: тихая ловушка", "lastWifeId", 1]');
  fs.writeFileSync(V,v);
  console.log('H1h -> lastWifeId');
}else console.log('! строка H1h не найдена');