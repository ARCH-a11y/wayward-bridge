// src/server/childstate.js
var require_childstate = __commonJS({
  "src/server/childstate.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var { writeAtomic } = require_store();
    var looks = require_looks();

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
        pregnancy: { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false },
        childWish: { mode: "none", targetId: "" },
        children: [],
        postpartum: { blockUntilDay: 0, milkUntilDay: 0 },
        lastBirth: { day: 0, outcome: "", count: 0 }
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
      if (ensureNames(s)) save(dir, s);
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
      if (s.childWish.mode === "target") base *= 1.1;
      var fk = ctx.father || ctx.patronId;
      if (s.childWish.targetId && fk) base *= fk === s.childWish.targetId ? 1.5 : 0.6;
      return Math.max(0, Math.min(0.95, base));
    }

    function stageOf(age) {
      return age < 30 ? "infant" : age < 75 ? "child" : age < 135 ? "teen" : "youth";
    }

    var NAMES_F = ["Анна", "Марта", "Эльза", "Грета", "Лиза", "Майя", "Роза", "Хельга", "Ингрид", "Беата", "Клара", "Соня"];
    var NAMES_M = ["Ганс", "Петер", "Клаус", "Отто", "Ларс", "Матс", "Эрик", "Юрген", "Дитер", "Бруно", "Феликс", "Томас"];
    // у детей, рождённых до появления имён, имя добирается при первом же обращении
    function ensureNames(s) {
      var changed = false;
      for (var i = 0; i < s.children.length; i++) {
        var c = s.children[i];
        if (c && !c.name) { c.name = pickName(s, c.sex); changed = true; }
      }
      return changed;
    }

    function pickName(s, sex) {
      var pool = sex === "f" ? NAMES_F : NAMES_M, used = {};
      for (var i = 0; i < s.children.length; i++) used[s.children[i].name] = 1;
      for (var t = 0; t < 40; t++) { var n = pool[Math.floor(Math.random() * pool.length)]; if (!used[n]) return n; }
      return pool[0];
    }

    function birth(s, day, ctx) {
      ctx = ctx || {};
      var risk = 0.30;
      if (ctx.healer) risk -= 0.12;
      if (Number(ctx.trust) > 60) risk -= 0.08;
      risk = Math.max(0.05, Math.min(0.6, risk));
      var outcome = ctx.birthForce;
      if (outcome !== "smooth" && outcome !== "hard" && outcome !== "bad") {
        outcome = Math.random() < risk ? (Math.random() < 0.35 ? "bad" : "hard") : "smooth";
      }
      var block = outcome === "smooth" ? BLOCK : outcome === "hard" ? 35 : 50;
      var milk = outcome === "smooth" ? MILK : outcome === "hard" ? 30 : 40;
      var n = Math.random() < TWINS * (1 + (ctx.boost || 0)) ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var sx = Math.random() < 0.5 ? "f" : "m";
        s.children.push({
          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),
          sex: sx,
          name: pickName(s, sx),
          fatherId: s.pregnancy.fatherId || "",
          bornDay: day, stage: "infant", birth: outcome,
          promoted: false,
          look: looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook)
        });
      }
      s.pregnancy = { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false, motherLook: s.pregnancy.motherLook || null, fatherLook: s.pregnancy.fatherLook || null };
      s.postpartum.blockUntilDay = day + block;
      s.postpartum.milkUntilDay = day + milk;
      s.lastBirth = { day: day, outcome: outcome, count: n };
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
        if (s.pregnancy.day >= TERM) birth(s, day, ctx);
      }

      for (var i = 0; i < s.children.length; i++) s.children[i].stage = stageOf(day - s.children[i].bornDay);

      if (s.pregnancy.active && !s.pregnancy.known) {
        var tr = Number(ctx.trust || 0);
        if (s.pregnancy.day >= 16) {
          s.pregnancy.known = true; s.pregnancy.forced = true; s.pregnancy.revealDay = day;
        } else if (typeof ctx.revealForce === "boolean" ? ctx.revealForce : Math.random() < (0.12 + tr / 200)) {
          s.pregnancy.known = true; s.pregnancy.revealDay = day;
        }
      }

      if (s.childWish.mode === "none" && s.children.length === 0 && !s.pregnancy.active && Number(ctx.trust || 0) >= 60) {
        s.childWish.mode = "target"; s.childWish.targetId = "player";
      }

      if (!s.pregnancy.active && day > (s.postpartum.blockUntilDay || 0) && ctx.encounters) {
        var p = chance(s, ctx);
        var hit = typeof ctx.force === "boolean" ? ctx.force : Math.random() < p;
        if (hit) {
          s.pregnancy.active = true;
          s.pregnancy.day = 0;
          s.pregnancy.known = Number(ctx.trust || 0) >= 50;
          s.pregnancy.fatherId = (ctx.father || ctx.patronId) && !ctx.group ? String(ctx.father || ctx.patronId) : "";
          s.pregnancy.motherLook = ctx.motherLook || looks.random();
          s.pregnancy.fatherLook = ctx.fatherLook || null;
        }
      }

      if (s.pregnancy.active && s.pregnancy.day >= TERM) birth(s, s.lastDay || s.pregnancy.day, {});
      save(dir, s);
      return s;
    }

    function prompt(dir) {
      var s = load(dir);
      var milk = (s.postpartum.milkUntilDay || 0) > (s.lastDay || 0);
      if (s.pregnancy && s.pregnancy.active) {
        var d = s.pregnancy.day;
        if (d >= 30) milk = true;
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
      if (s.pregnancy.active && s.pregnancy.day >= TERM) birth(s, s.lastDay || s.pregnancy.day, {});
      save(dir, s);
      return s;
    }

    function rerollLook(dir, pt, childId) {
      var s = forPlaythrough(dir, pt);
      for (var i = 0; i < s.children.length; i++) {
        if (s.children[i].id === childId) { s.children[i].look = looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook); s.children[i].img = null; }
      }
      save(dir, s);
      return s;
    }

    function childById(s, id) {
      for (var i = 0; i < s.children.length; i++) if (s.children[i].id === id) return s.children[i];
      return null;
    }

    // промпт портрета: ключ child_<id>, гены и стадия ребёнка
    function imagePrompt(dir, pt, childId) {
      var s = forPlaythrough(dir, pt);
      var c = childById(s, childId);
      if (!c) return null;
      var p = looks.portraitPrompt(c.look, { sex: c.sex, stage: c.stage });
      return { key: "child_" + c.id, positive: p.positive, negative: p.negative, sex: c.sex, stage: c.stage };
    }

    function setImage(dir, pt, childId, rec) {
      var s = forPlaythrough(dir, pt);
      var c = childById(s, childId);
      if (!c) return null;
      c.img = rec;
      save(dir, s);
      return s;
    }

    // человек для круга героини: ребро parent_of от char:<her> к person:<id>
    function personFor(dir, pt, childId, her) {
      var s = forPlaythrough(dir, pt);
      var c = childById(s, childId);
      if (!c) return null;
      var pid = "wb" + c.id;
      var person = {
        id: pid,
        name: c.name || (c.sex === "f" ? "Дочь" : "Сын"),
        sex: c.sex === "m" ? "m" : "f",
        generation: 1,
        alive: true,
        lives: "same_town",
        circle: 0.7,
        warmth: 0.8,
        strictness: 0.4,
        past: "good",
        presence: 0.6,
        regard: 0.6,
        belief: { rung: "nothing", sinceDay: 0, thinksHeKnows: false },
        attributes: { strength: 30, deftness: 40, vigor: 45, wit: 45, composure: 40, charm: 50, openness: 50, confidence: 50 },
        wbChild: true,
        wbBornDay: c.bornDay
      };
      return {
        person: person,
        personId: pid,
        name: person.name,
        stage: c.stage,
        link: { kind: "parent_of", from: "char:" + (her || pt), to: "person:" + pid }
      };
    }

    function promote(dir, pt, childId, her) {
      var s = forPlaythrough(dir, pt);
      var c = childById(s, childId);
      if (!c) return null;
      var pl = personFor(dir, pt, childId, her);
      c.promoted = { at: s.lastDay || 0, personId: pl.personId };
      save(dir, s);
      pl.state = s;
      return pl;
    }

    var STAGE_AGE = { infant: 15, child: 50, teen: 100, youth: 160 };
    // правка одного ребёнка: имя, стадия, возраст (стадия и bornDay держатся согласованно)
    function patchChild(dir, pt, childId, patch) {
      var s = forPlaythrough(dir, pt);
      var c = childById(s, childId);
      if (!c) return null;
      patch = patch || {};
      if (typeof patch.name === "string" && patch.name.trim()) c.name = patch.name.trim().slice(0, 24);
      if (typeof patch.stage === "string" && STAGE_AGE[patch.stage] != null) c.bornDay = (s.lastDay || 0) - STAGE_AGE[patch.stage];
      if (typeof patch.bornDay === "number" && isFinite(patch.bornDay)) c.bornDay = Math.round(patch.bornDay);
      if (c.bornDay > (s.lastDay || 0)) c.bornDay = s.lastDay || 0;
      c.stage = stageOf((s.lastDay || 0) - c.bornDay);
      if (!c.name) c.name = pickName(s, c.sex);
      save(dir, s);
      return s;
    }

    module2.exports = { empty: empty, forPlaythrough: forPlaythrough, tick: tick, phase: phase, chance: chance, stageOf: stageOf, prompt: prompt, current: current, set: set, rerollLook: rerollLook, imagePrompt: imagePrompt, setImage: setImage, personFor: personFor, promote: promote, patchChild: patchChild };
  }
});
