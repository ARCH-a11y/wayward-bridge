"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- 008: промпт ---
let p8 = rd("src/008-src_server_prompt.js");
p8 = rep(p8,
  '    var SECTION_ORDER = ["head", "mouth", "body", "breasts", "ass", "vagina", "misc"];',
  '    var SECTION_ORDER = ["head", "mouth", "body", "breasts", "ass", "vagina", "misc", "belly"];\n' +
  '    var BELLY_TAGS = { slight: "slightly rounded belly", visible: "small pregnant belly, navel showing", large: "large pregnant belly, near term" };',
  "008 SECTION_ORDER+BELLY_TAGS");

p8 = rep(p8,
  '    function expandHero(hero, signals, conds, notes) {\n' +
  '      if (!hero) return { base: "", negative: "" };\n' +
  '      const base = [], neg = [];\n' +
  '      for (const id of orderedKeys(hero.sections)) {\n' +
  '        const s = hero.sections[id];\n' +
  '        if (!s || s.on === false) continue;\n' +
  '        if (String(s.tags || "").trim()) base.push(String(s.tags).trim());\n' +
  '        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n' +
  '      }',
  '    function expandHero(hero, signals, conds, notes, child) {\n' +
  '      if (!hero) return { base: "", negative: "" };\n' +
  '      const base = [], neg = [];\n' +
  '      const bellyTag = child && child.stage && child.stage !== "none" ? BELLY_TAGS[child.stage] || "" : "";\n' +
  '      let sawBelly = false;\n' +
  '      for (const id of orderedKeys(hero.sections)) {\n' +
  '        const s = hero.sections[id];\n' +
  '        if (!s || s.on === false) continue;\n' +
  '        if (id === "belly") {\n' +
  '          sawBelly = true;\n' +
  '          if (bellyTag) base.push(bellyTag);\n' +
  '          if (String(s.tags || "").trim()) base.push(String(s.tags).trim());\n' +
  '          if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n' +
  '          continue;\n' +
  '        }\n' +
  '        if (String(s.tags || "").trim()) base.push(String(s.tags).trim());\n' +
  '        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());\n' +
  '      }\n' +
  '      if (!sawBelly && bellyTag) base.push(bellyTag);\n' +
  '      if (child && child.milk) base.push("lactating breasts, milk");',
  "008 expandHero");

p8 = rep(p8,
  '      const notes = [];\n      const heroDefX = expandHero(heroDef, signals, conds, notes);\n      const heroEffX = expandHero(heroEff, signals, conds, notes);',
  '      const notes = [];\n      const child = input.child || null;\n      const heroDefX = expandHero(heroDef, signals, conds, notes, child);\n      const heroEffX = expandHero(heroEff, signals, conds, notes, child);',
  "008 compose");

p8 = rep(p8,
  '      const heroDefX = expandHero(heroDef, signals, conds);\n      const heroEffX = expandHero(heroEff, signals, conds);',
  '      const heroDefX = expandHero(heroDef, signals, conds, null, input.child || null);\n      const heroEffX = expandHero(heroEff, signals, conds, null, input.child || null);',
  "008 composeNegative");

p8 = rep(p8, '    function synthesize(parsed, heroine, E) {', '    function synthesize(parsed, heroine, E, child) {', "008 synthesize sig");
p8 = rep(p8, '      const heroX = expandHero(hero, sectionSignals(parsed, {}, E), E.conditions || {});', '      const heroX = expandHero(hero, sectionSignals(parsed, {}, E), E.conditions || {}, null, child || null);', "008 synthesize call");
wr("src/008-src_server_prompt.js", p8);

// --- модуль: prompt() ---
let m = rd("src/025-src_server_childstate.js");
if (m.includes("function prompt(dir)")) log.push("модуль prompt: уже есть");
else {
  const a = "    module2.exports = {";
  if (!m.includes(a)) log.push("модуль prompt: НЕ НАЙДЕН exports");
  else {
    const fn = '    function prompt(dir) {\n' +
      '      var s = load(dir);\n' +
      '      var milk = (s.postpartum.milkUntilDay || 0) > (s.lastDay || 0);\n' +
      '      if (s.pregnancy && s.pregnancy.active) {\n' +
      '        var d = s.pregnancy.day;\n' +
      '        var stage = d < 10 ? "none" : d < 20 ? "slight" : d < 30 ? "visible" : "large";\n' +
      '        return { stage: stage, milk: milk };\n' +
      '      }\n' +
      '      return milk ? { stage: "none", milk: true } : null;\n' +
      '    }\n\n';
    m = m.replace(a, fn + a);
    m = m.replace("stageOf: stageOf };", "stageOf: stageOf, prompt: prompt };");
    wr("src/025-src_server_childstate.js", m);
    log.push("модуль prompt: добавлен");
  }
}

// --- 024: require, child, передача ---
let i24 = rd("src/024-src_server_index.js");
i24 = rep(i24,
  'var { forPlaythrough: childstateFor, tick: childstateTick } = require_childstate();',
  'var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt } = require_childstate();',
  "024 require");
i24 = rep(i24, '      const synth = !req.prompt &&', '      const child = childstatePrompt(store.dataDir);\n      const synth = !req.prompt &&', "024 child");
i24 = rep(i24, 'synthesize(parsed, heroine, eff.prompts) : null', 'synthesize(parsed, heroine, eff.prompts, child) : null', "024 synthesize call");
i24 = rep(i24, '        origin: originFn(heroine)\n      });', '        origin: originFn(heroine),\n        child\n      });', "024 compose child");
wr("src/024-src_server_index.js", i24);

// --- verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F2 belly в SECTION_ORDER")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F2 belly в SECTION_ORDER", "\\"misc\\", \\"belly\\"]", 1],',
    '  ["F2 таблица стадий", "BELLY_TAGS", 1],',
    '  ["F2 инъекция живота", "bellyTag", 1],',
    '  ["F2 молоко", "lactating breasts, milk", 1],',
    '  ["F2 стадия из childstate", "function prompt(dir)", 1],',
    '  ["F2 передача в compose", "childstatePrompt(store.dataDir)", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
