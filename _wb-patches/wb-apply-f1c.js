"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const log = [];
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const MODULE_SRC = `// src/server/childstate.js
var require_childstate = __commonJS({
  "src/server/childstate.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var { writeAtomic } = require_store();

    var FILE = "childstate.json";
    var TERM = 40;   // срок беременности, дней
    var CYCLE = 28;  // длина цикла
    var WINDOW = 4;  // фертильное окно
    var BLOCK = 20;  // послеродовой блок на зачатие
    var MILK = 25;   // лактация, дней
    var TWINS = 0.05;

    var cacheDir = null, cacheState = null;

    function empty() {
      return {
        playthrough: "", lastDay: 0,
        cycle: { on: true, day: 0, length: CYCLE, window: WINDOW },
        pregnancy: { active: false, day: 0, fatherId: "", known: false },
        childWish: { mode: "none", targetId: "" },
        children: [],
        postpartum: { blockUntilDay: 0, milkUntilDay: 0 }
      };
    }

    function filePath(dir) { return path.join(dir, FILE); }

    function load(dir) {
      if (cacheDir === dir && cacheState) return cacheState;
      var s;
      try { s = JSON.parse(fs.readFileSync(filePath(dir), "utf8")); }
      catch (e) { s = empty(); }
      cacheDir = dir; cacheState = s;
      return s;
    }

    function save(dir, s) {
      cacheDir = dir; cacheState = s;
      writeAtomic(filePath(dir), JSON.stringify(s, null, 2));
    }

    function forPlaythrough(dir, pt) {
      var s = load(dir);
      if (s.playthrough !== pt) { var f = empty(); f.playthrough = pt; save(dir, f); return f; }
      return s;
    }

    // фаза цикла: фертильное окно — середина
    function phase(s) {
      var mid = Math.floor(s.cycle.length / 2), half = Math.floor(s.cycle.window / 2);
      var d = s.cycle.day, diff = Math.abs(d - mid), dist = Math.min(diff, s.cycle.length - diff);
      return dist <= half ? "fertile" : "normal";
    }

    // шанс зачатия за день с модификаторами
    function chance(s, ctx) {
      var base = phase(s) === "fertile" ? 0.12 : 0.02;
      if (ctx.inside === false) base *= 0.35;
      if (ctx.contraceptives) base *= 0.25;
      if (ctx.boost) base *= 1 + Number(ctx.boost || 0);
      if (s.childWish.targetId && ctx.patronId) base *= ctx.patronId === s.childWish.targetId ? 1.5 : 0.6;
      return Math.max(0, Math.min(0.95, base));
    }

    function stageOf(age) {
      return age < 30 ? "infant" : age < 75 ? "child" : age < 135 ? "teen" : "youth";
    }

    function birth(s, day, boost) {
      var n = Math.random() < TWINS * (1 + (boost || 0)) ? 2 : 1;
      for (var i = 0; i < n; i++) {
        s.children.push({
          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),
          sex: Math.random() < 0.5 ? "f" : "m",
          fatherId: s.pregnancy.fatherId || "",
          bornDay: day, stage: "infant"
        });
      }
      s.pregnancy = { active: false, day: 0, fatherId: "", known: false };
      s.postpartum.blockUntilDay = day + BLOCK;
      s.postpartum.milkUntilDay = day + MILK;
      return n;
    }

    // тик дня: цикл, срок, рост детей, бросок зачатия
    function tick(dir, pt, day, ctx) {
      var s = forPlaythrough(dir, pt);
      if (!day || day <= s.lastDay) return s;
      var delta = s.lastDay ? day - s.lastDay : 1;
      s.lastDay = day;
      ctx = ctx || {};

      if (s.cycle.on) s.cycle.day = (s.cycle.day + delta) % s.cycle.length;

      if (s.pregnancy.active) {
        s.pregnancy.day += delta;
        if (s.pregnancy.day >= TERM) birth(s, day, ctx.boost);
      }

      for (var i = 0; i < s.children.length; i++) s.children[i].stage = stageOf(day - s.children[i].bornDay);

      if (!s.pregnancy.active && day > (s.postpartum.blockUntilDay || 0) && ctx.encounters) {
        var p = chance(s, ctx);
        var hit = typeof ctx.force === "boolean" ? ctx.force : Math.random() < p;
        if (hit) {
          s.pregnancy.active = true;
          s.pregnancy.day = 0;
          s.pregnancy.known = false;
          s.pregnancy.fatherId = ctx.patronId && !ctx.group ? String(ctx.patronId) : "";
        }
      }

      save(dir, s);
      return s;
    }

    module2.exports = { empty: empty, forPlaythrough: forPlaythrough, tick: tick, phase: phase, chance: chance, stageOf: stageOf };
  }
});
`;

// 1. модуль
wr("src/025-src_server_childstate.js", MODULE_SRC);
log.push("модуль перезаписан (обёртка, require_store, store.dataDir через параметр)");

// 2. ORDER: 025 сразу после 024
let ol = rd("src/ORDER.txt").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
ol = ol.filter(l => !/childstate/.test(l));
const i24 = ol.findIndex(l => /^024-/.test(l));
ol.splice(i24 >= 0 ? i24 + 1 : ol.length, 0, "025-src_server_childstate.js");
wr("src/ORDER.txt", ol.join("\n") + "\n");
log.push("ORDER.txt: 025 поставлен сразу после 024");

// 3. require + роуты в 024
const IF = "src/024-src_server_index.js";
let s = rd(IF);
if (s.includes("require_childstate()")) log.push("024: require уже есть");
else {
  const anchor = 'var { clean: cleanSchema, LAYER: LAYER_SCHEMA } = require_schema();';
  if (!s.includes(anchor)) log.push("024: НЕ НАЙДЕН anchor require_schema");
  else { s = s.replace(anchor, anchor + "\n    var { forPlaythrough: childstateFor, tick: childstateTick } = require_childstate();"); log.push("024: require добавлен"); }
}
if (s.includes("/bridge/api/childstate/tick")) log.push("024: роуты уже есть");
else {
  const ping = 'if (p === "/bridge/api/ping" && m === "GET") return send(res, 200, { ok: true, revision: store.revision });';
  if (!s.includes(ping)) log.push("024: НЕ НАЙДЕН anchor ping");
  else {
    const routes = [
      '      if (p === "/bridge/api/childstate" && m === "GET") {',
      '        return send(res, 200, childstateFor(store.dataDir, String(url.searchParams.get("playthrough") || "")));',
      "      }",
      '      if (p === "/bridge/api/childstate/tick" && m === "POST") {',
      "        const body = await readJson(req);",
      '        const cs = childstateTick(store.dataDir, String(body.playthrough || ""), Number(body.day) || 0, body.ctx || {});',
      "        return send(res, 200, { ok: true, state: cs });",
      "      }",
    ].join("\n");
    s = s.replace(ping, ping + "\n" + routes);
    log.push("024: роуты добавлены");
  }
}
wr(IF, s);

// 4. verify
(function () {
  const VF = "wb-verify.js";
  let v = rd(VF);
  if (v.includes("F1 роут childstate/tick")) { log.push("verify: маркеры уже есть"); return; }
  const m = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!m) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F1 модуль-обёртка", "var require_childstate = __commonJS", 1],',
    '  ["F1 тик: сдвиг цикла", "s.cycle.day = (s.cycle.day + delta) % s.cycle.length", 1],',
    '  ["F1 тик: бросок", "typeof ctx.force === \\"boolean\\"", 1],',
    '  ["F1 роут childstate/tick", "/bridge/api/childstate/tick", 1],',
    '  ["F1 роут childstate", "\\"/bridge/api/childstate\\" && m === \\"GET\\"", 1],',
  ].join("\n") + "\n";
  wr(VF, v.replace(m[1], m[1] + mk));
  log.push("verify: маркеры добавлены");
})();

// 5. тест
(function () {
  const TF = "wb-test.js";
  let t = rd(TF);
  if (t.includes("childstate: роут отвечает")) { log.push("тест: уже есть"); return; }
  const m = t.match(/(\n\s*console\.log\("\\nPASS:)/);
  if (!m) { log.push("тест: НЕ НАЙДЕН финальный PASS"); return; }
  const block = [
    "",
    "  // --- F1: childstate tick ---",
    '  const CS = "pt-test-1";',
    '  const t1 = await api("POST", "/bridge/api/childstate/tick", { playthrough: CS, day: 1, ctx: {} });',
    '  ok("childstate: роут отвечает", t1.status === 200 && !!t1.json && !!t1.json.state);',
    '  ok("childstate: lastDay записан", safe(t1.json, ["state", "lastDay"]) === 1);',
    '  const cyc1 = safe(t1.json, ["state", "cycle", "day"]);',
    '  await api("POST", "/bridge/api/childstate/tick", { playthrough: CS, day: 8, ctx: {} });',
    '  const t2 = await api("POST", "/bridge/api/childstate/tick", { playthrough: CS, day: 15, ctx: {} });',
    '  const cyc2 = safe(t2.json, ["state", "cycle", "day"]);',
    '  ok("childstate: цикл сдвигается по дням", typeof cyc2 === "number" && cyc2 !== cyc1);',
    '  const no = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-no", day: 1, ctx: { encounters: 1, force: false } });',
    '  ok("childstate: force=false -> нет беременности", safe(no.json, ["state", "pregnancy", "active"]) === false);',
    '  const yes = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: 1, ctx: { encounters: 1, force: true, patronId: "p1" } });',
    '  ok("childstate: force=true -> беременность и отец", safe(yes.json, ["state", "pregnancy", "active"]) === true && safe(yes.json, ["state", "pregnancy", "fatherId"]) === "p1");',
    '  const grp = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-grp", day: 1, ctx: { encounters: 1, force: true, patronId: "p1", group: true } });',
    '  ok("childstate: группа -> отец пуст", safe(grp.json, ["state", "pregnancy", "fatherId"]) === "");',
    '  let rb;',
    '  for (let d = 2; d <= 41; d++) rb = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: d, ctx: { encounters: 0 } });',
    '  const kids = safe(rb.json, ["state", "children"]) || [];',
    '  ok("childstate: роды дали ребёнка", kids.length >= 1 && safe(rb.json, ["state", "pregnancy", "active"]) === false);',
    '  ok("childstate: послеродовой блок выставлен", (safe(rb.json, ["state", "postpartum", "blockUntilDay"]) || 0) > 41);',
    "",
  ].join("\n");
  t = t.replace(m[1], block + m[1]);
  wr(TF, t);
  log.push("тест: блок добавлен");
})();

console.log(log.join("\n"));
