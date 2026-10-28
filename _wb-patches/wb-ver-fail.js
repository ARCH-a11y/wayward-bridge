const cp=require("child_process");
const out=cp.execSync("node wb-verify.js",{encoding:"utf8"});
out.split("\n").filter(l=>!l.trim().startsWith("\u043e\u043a")).forEach(l=>console.log(l));