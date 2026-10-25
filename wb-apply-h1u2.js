const fs=require('fs');
const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const broken = `["H1h: тихая ловушка", "lastWifeId", 1] characters:\\"", 1],`;
if(v.includes(broken)){
  v=v.split(broken).join(`["H1h: тихая ловушка", "lastWifeId", 1],`);
  fs.writeFileSync(V,v);
  console.log('H1h починен');
}else{
  console.log('! не нашёл сломанный кусок, вот строки с H1h:');
  v.split('\n').filter(l=>l.includes('H1h')).forEach(l=>console.log(JSON.stringify(l)));
}