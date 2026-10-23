"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

let g = rd("src/016-src_server_game.js");

// новый патч локации детской, ставится в цепочку
g = rep(g, "        const nurseryHtml = addNursery(html);", "        const nurseryHtml = addNurseryRoom(addNursery(html));", "016 вызов комнаты");

const FN = `    function addNurseryRoom(html) {
      const R = [
        ['const hl=["taproom","back_room","bedroom","elena_room",', 'const hl=["taproom","back_room","bedroom","elena_room","nursery",'],
        ['elena_room:"her room",', 'elena_room:"her room",nursery:"the nursery",'],
        ['elena_room:"Her Room",', 'elena_room:"Her Room",nursery:"Nursery",'],
        ['elena_room:new Set(["bed","seating","shut_door"]),', 'elena_room:new Set(["bed","seating","shut_door"]),nursery:new Set(["bed","seating","shut_door"]),'],
        ['je=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse"]', 'je=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse","nursery"]'],
        ['De=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse"]', 'De=["taproom","back_room","upstairs_hall","upstairs_room_2","bedroom","bathhouse","nursery"]'],
        ['H==="elena_room"?g?{type:"knock_on_door"}:null:', 'H==="elena_room"?g?{type:"knock_on_door"}:null:H==="nursery"?nn?{type:"go_to_nursery"}:null:'],
        ['j=bt(e),E=H8(e);function R(H)', 'j=bt(e),E=H8(e),nn=!!(d&&d.qualityUpgrades&&d.qualityUpgrades.includes("nursery"));function R(H)'],
        [',g&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("elena_room")})', ',g&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("elena_room")}),nn&&u.jsx("div",{className:"flex-1 min-w-[5.5rem]",children:W("nursery")})'],
        ['case"go_to_bedroom":return L8(e);', 'case"go_to_bedroom":return L8(e);case"go_to_nursery":return N(Pt(e,fe,"nursery"),"You step into the nursery.");'],
        ['go_to_bedroom:2,', 'go_to_bedroom:2,go_to_nursery:1,'],
      ];
      let out = html, miss = 0;
      for (const [a, b] of R) { if (out.includes(a)) out = out.replace(a, b); else miss++; }
      if (miss) console.log("[bridge]   nursery: не найдено якорей " + miss + " из " + R.length);
      return out;
    }
`;

g = rep(g, "    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;", FN + "    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;", "016 функция комнаты");
g = rep(g, "module2.exports = { Game, findGameDir, MIME, PARTS_RE, addCustomWives, addNursery };",
             "module2.exports = { Game, findGameDir, MIME, PARTS_RE, addCustomWives, addNursery, addNurseryRoom };", "016 export");
wr("src/016-src_server_game.js", g);

// verify
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F4 детская: переход")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F4 детская: локация", "elena_room\\",\\"nursery\\",", 1],',
    '  ["F4 детская: подпись", "nursery:\\"the nursery\\"", 1],',
    '  ["F4 детская: переход", "go_to_nursery", 1],',
    '  ["F4 детская: плитка", "W(\\"nursery\\")", 1],',
    '  ["F4 детская: цепочка", "addNurseryRoom(addNursery(html))", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
