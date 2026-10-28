// wb-probe-insp.js — что происходит с rows между вставкой и отправкой
const fs = require('fs');
const SRC = 'src/008-src_server_prompt.js';
const A = 524, B = 556;
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
for (let i = A; i <= Math.min(B, lines.length - 1); i++) console.log(String(i + 1).padStart(6) + '| ' + lines[i]);