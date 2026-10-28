// wb-probe-insp.js — сигнатура buildGraph и поля pipeline
const fs = require('fs');
const lines = fs.readFileSync('src/012-src_server_workflows.js', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (!/function buildGraph|portrait|noHires|noDetail/.test(lines[i])) continue;
  console.log(String(i + 1).padStart(5) + '| ' + lines[i].slice(0, 170));
}