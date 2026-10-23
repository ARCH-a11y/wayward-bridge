"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

let g = rd("src/016-src_server_game.js");
g = rep(g, "        const nurseryHtml = addNurseryRoom(addNursery(html));", "        const nurseryHtml = addNurseryNav(addNurseryRoom(addNursery(html)));", "016 вызов nav");

const FN = `    function addNurseryNav(html) {
      const R = [
        ['"bathroom","kitchen"]),wb=new Set(', '"bathroom","kitchen","nursery"]),wb=new Set('],
        ['taproom:new Set(["back_room","upstairs_hall","upstairs_room_2","bathroom","kitchen"])', 'taproom:new Set(["back_room","upstairs_hall","upstairs_room_2","bathroom","kitchen","nursery"])'],
        ['upstairs_room_2:new Set(["taproom"])}', 'upstairs_room_2:new Set(["taproom"]),nursery:new Set(["taproom"])}'],
      ];
      let out = html, miss = 0;
      for (const [a, b] of R) { if (out.includes(a)) out = out.replace(a, b); else miss++; }
      if (miss) console.log("[bridge]   nursery nav: не найдено якорей " + miss + " из " + R.length);
      return out;
    }
`;
g = rep(g, "    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;", FN + "    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;", "016 функция nav");
g = rep(g, "addNursery, addNurseryRoom };", "addNursery, addNurseryRoom, addNurseryNav };", "016 export nav");
wr("src/016-src_server_game.js", g);

(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F4 детская: возврат")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F4 детская: возврат", "\\"kitchen\\",\\"nursery\\"]),wb=new Set(", 1],',
    '  ["F4 детская: смежность", "nursery:new Set([\\"taproom\\"])", 1],',
    '  ["F4 детская: nav цепочка", "addNurseryNav(addNurseryRoom(", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
