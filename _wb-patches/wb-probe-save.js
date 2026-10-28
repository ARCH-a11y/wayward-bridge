const fs=require("fs");
const s=fs.readFileSync("wayward-bridge.js","utf8");
let n=0,i=-1;
while((i=s.indexOf("part-previews",i+1))>=0){ n++; console.log("@"+i+": "+s.slice(i-90,i+90).replace(/\n/g," ")); }
console.log("всего: "+n);