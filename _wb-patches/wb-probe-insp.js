// wb-probe-insp.js — где игра и что в findGameDir
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync('src/016-src_server_game.js', 'utf8').split('\n');
for (let i = 49; i < 70; i++) console.log(String(i + 1).padStart(4) + '| ' + lines[i]);
console.log('---');
for (const e of fs.readdirSync('.')) {
  const st = fs.statSync(e);
  if (st.isDirectory()) { if (!/^(\.git|node_modules|src|_wb-patches|_analysis|_log|docs)$/.test(e)) console.log('dir  ' + e); }
  else if (/\.(html|js)$/.test(e) && st.size > 20000) console.log('file ' + e + '  ' + st.size);
}