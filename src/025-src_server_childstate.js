// src/server/childstate.js
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

    function prompt(dir) {
      var s = load(dir);
      var milk = (s.postpartum.milkUntilDay || 0) > (s.lastDay || 0);
      if (s.pregnancy && s.pregnancy.active) {
        var d = s.pregnancy.day;
        var stage = d < 10 ? "none" : d < 20 ? "slight" : d < 30 ? "visible" : "large";
        return { stage: stage, milk: milk };
      }
      return milk ? { stage: "none", milk: true } : null;
    }

    function current(dir) { return load(dir); }

    function set(dir, pt, patch) {
      var s = forPlaythrough(dir, pt);
      for (var k in patch) {
        if (patch[k] && typeof patch[k] === "object" && !Array.isArray(patch[k]) && s[k] && typeof s[k] === "object" && !Array.isArray(s[k])) {
          for (var j in patch[k]) s[k][j] = patch[k][j];
        } else {
          s[k] = patch[k];
        }
      }
      save(dir, s);
      return s;
    }

    module2.exports = { empty: empty, forPlaythrough: forPlaythrough, tick: tick, phase: phase, chance: chance, stageOf: stageOf, prompt: prompt, current: current, set: set };
  }
});
