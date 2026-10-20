// src/server/prompt.js
var require_prompt = __commonJS({
  "src/server/prompt.js"(exports2, module2) {
    "use strict";
    var { splitTags, tagKey, joinTags, dedupe, replaceTags, overlap } = require_tags();
    var { exposureMask } = require_keyparse();
    function identify(tags, table, preferId) {
      let best = null;
      for (const [id, v] of Object.entries(table || {})) {
        const list = Array.isArray(v) ? v : [v];
        list.forEach((text, index) => {
          if (!String(text || "").trim()) return;
          let score = overlap(tags, text);
          if (id === preferId) score += 0.05;
          if (score >= 0.6 && (!best || score > best.score)) best = { id, index, text, score };
        });
      }
      return best;
    }
    function applyRule(tags, r) {
      const keys = new Set(splitTags(r.find).map(tagKey).filter(Boolean));
      if (!keys.size) return null;
      const add = splitTags(r.replace);
      const out = [];
      let hit = false;
      for (const t of tags) {
        if (keys.has(tagKey(t))) {
          if (!hit) out.push(...add);
          hit = true;
          continue;
        }
        out.push(t);
      }
      return hit ? dedupe(out) : null;
    }
    function allRules(E, origin) {
      const tag = (list, path) => (Array.isArray(list) ? list : []).filter((r) => r && r.on !== false).map((r) => Object.assign({}, r, { src: origin(path) }));
      return [...tag(E.rulesAll, ["rulesAll"]), ...tag(E.rules, ["rules"])];
    }
    function variantAt(list, index) {
      if (!Array.isArray(list) || !list.length) return "";
      return String(list[(index % list.length + list.length) % list.length] || "");
    }
    function swapSlot(tags, defTable, effTable, preferId, origin, pathPrefix, forceIndex) {
      const hit = identify(tags, defTable, preferId);
      if (!hit) return { tags, change: null };
      const effEntry = effTable && effTable[hit.id];
      const idx = forceIndex != null && Number.isFinite(Number(forceIndex)) && hit.id === preferId ? Number(forceIndex) : hit.index;
      const next = Array.isArray(effEntry) ? variantAt(effEntry, idx) : String(effEntry == null ? hit.text : effEntry);
      const list = Array.isArray(effEntry) ? effEntry : Array.isArray(defTable[hit.id]) ? defTable[hit.id] : null;
      const rel = { path: ["prompts", ...pathPrefix, hit.id], index: list ? (idx % list.length + list.length) % list.length : null };
      if (tagKey(next) === tagKey(hit.text) && next.trim() === String(hit.text).trim()) return { tags, change: null, id: hit.id, rel };
      const r = replaceTags(tags, hit.text, next, false);
      if (!r.replaced) return { tags, change: null, id: hit.id, rel };
      return { tags: r.tags, id: hit.id, rel, change: { id: hit.id, from: hit.text, to: next, source: origin([...pathPrefix, hit.id]) } };
    }
    var SECTION_ORDER = ["head", "mouth", "body", "breasts", "ass", "vagina", "misc"];
    function orderedKeys(obj) {
      const keys = Object.keys(obj || {});
      return [...SECTION_ORDER.filter((k) => keys.includes(k)), ...keys.filter((k) => !SECTION_ORDER.includes(k))];
    }
    function sectionSignals(parsed, D, E) {
      const eo = (E.outfits || {})[parsed.outfit] || {}, dO = (D.outfits || {})[parsed.outfit] || {};
      const expo = (E.exposure || {})[parsed.exposure] || (D.exposure || {})[parsed.exposure] || "";
      const mask = exposureMask(parsed.exposure);
      return {
        outfit: [eo.tags, dO.tags].filter(Boolean).join(", "),
        exposure: [expo, mask].filter(Boolean).join(", "),
        scene: [parsed.scene, parsed.lookFocus, parsed.task, parsed.room].filter(Boolean).join(", ")
      };
    }
    function condFires(cond, signals) {
      if (!cond || !Array.isArray(cond.keywords) || !cond.keywords.length) return false;
      const src = (Array.isArray(cond.sources) && cond.sources.length) ? cond.sources : ["outfit", "exposure", "scene"];
      const hay = src.map((s) => signals[s] || "").join(", ").toLowerCase();
      if (!hay) return false;
      return cond.keywords.some((k) => hay.includes(String(k).toLowerCase()));
    }
    function expandHero(hero, signals, conds, notes) {
      if (!hero) return { base: "", negative: "" };
      const base = [], neg = [];
      for (const id of orderedKeys(hero.sections)) {
        const s = hero.sections[id];
        if (!s || s.on === false) continue;
        if (String(s.tags || "").trim()) base.push(String(s.tags).trim());
        if (String(s.negative || "").trim()) neg.push(String(s.negative).trim());
      }
      for (const id of orderedKeys(hero.quarantine)) {
        const q = hero.quarantine[id];
        if (!q || q.mode === "never") continue;
        const fire = q.mode === "always" || condFires((conds || {})[q.when], signals);
        if (!fire) continue;
        if (String(q.tags || "").trim()) base.push(String(q.tags).trim());
        if (String(q.negative || "").trim()) neg.push(String(q.negative).trim());
        if (notes) notes.push("quarantine." + id + " включён (условие " + q.when + ")");
      }
      return {
        base: [String(hero.base || "").trim(), ...base].filter(Boolean).join(", "),
        negative: [String(hero.negative || "").trim(), ...neg].filter(Boolean).join(", ")
      };
    }
    function compose(input) {
      const { parsed, heroine, defaults: D, prompts: E, pipeline: P } = input;
      const origin = input.origin || (() => "your settings");
      const explain = [];
      const warnings = [];
      if (parsed.kind === "patron") return composePatron(input, explain, warnings);
      const usingParts = Array.isArray(input.parts) && input.parts.length > 0;
      const parts = usingParts ? input.parts.map((p) => ({ label: String(p.label || ""), tags: splitTags(p.tags) })) : [{ label: "Prompt", tags: splitTags(input.gamePrompt) }];
      const heroDef = (D.heroines || {})[heroine] || {};
      const heroEff = (E.heroines || {})[heroine] || {};
      const signals = sectionSignals(parsed, D, E);
      const conds = E.conditions || D.conditions || {};
      const notes = [];
      const heroDefX = expandHero(heroDef, signals, conds, notes);
      const heroEffX = expandHero(heroEff, signals, conds, notes);
      const outfitId = parsed.outfit;
      const mask = exposureMask(parsed.exposure);
      const partOv = E.parts || {};
      const out = [];
      for (const part of parts) {
        let tags = part.tags;
        const before = joinTags(tags);
        const changes = [];
        const label = part.label;
        const all = !usingParts;
        let rel = null;
        const took = (r) => {
          if (r && r.rel && !rel) rel = r.rel;
          return r;
        };
        if (label === "Quality" || all) {
          const ov = partOv.Quality;
          if (label === "Quality") {
            if (ov && ov.mode === "off") tags = [];
            else if (ov && ov.mode === "replace") {
              tags = splitTags(ov.text);
              changes.push({ id: "Quality", to: ov.text, source: origin(["parts", "Quality"]) });
            } else if (!(ov && ov.mode === "game")) {
              tags = [];
            }
          } else if (input.gameQuality) {
            tags = replaceTags(tags, input.gameQuality, "", false).tags;
          }
        }
        if (label === "Base" && heroine) rel = { path: ["prompts", "heroines", heroine, "base"] };
        if (label === "Outfit" && outfitId) rel = { path: ["prompts", "outfits", outfitId, "tags"] };
        if (label === "Exposure" && mask) rel = { path: ["prompts", "exposure", mask] };
        if (label === "Base" || all) {
          if (heroEffX.base != null && heroEffX.base.trim() !== String(heroDefX.base || "").trim()) {
            const r = replaceTags(tags, heroDefX.base || "", heroEffX.base, label === "Base");
            if (r.replaced || label === "Base") {
              tags = r.tags;
              changes.push({ id: heroine, from: heroDefX.base, to: heroEffX.base, source: origin(["heroines", heroine, "base"]) });
            }
          }
        }
        if ((label === "Outfit" || all) && outfitId) {
          const d = ((D.outfits || {})[outfitId] || {}).tags || "";
          const e = ((E.outfits || {})[outfitId] || {}).tags;
          if (e != null && e.trim() !== d.trim()) {
            const r = replaceTags(tags, d, e, false);
            if (r.replaced) {
              tags = r.tags;
              changes.push({ id: outfitId, from: d, to: e, source: origin(["outfits", outfitId, "tags"]) });
            } else if (overlap(tags, e) >= 0.8) changes.push({ id: outfitId + " (already in the game's prompt)", from: d, to: e, source: origin(["outfits", outfitId, "tags"]) });
          }
        }
        if (label === "Scene" || all) {
          const sceneId = parsed.scene ? parsed.abed && (D.scenes || {})[parsed.scene + "_bed"] ? parsed.scene + "_bed" : String(parsed.scene) : null;
          const r = took(swapSlot(tags, D.scenes, E.scenes, sceneId, origin, ["scenes"], input.forceVariant ? parsed.variant : null));
          tags = r.tags;
          if (r.change) changes.push(r.change);
        }
        if (label === "Task" || label === "Pose" || all) {
          const r = took(swapSlot(tags, D.tasks, E.tasks, parsed.task, origin, ["tasks"]));
          tags = r.tags;
          if (r.change) changes.push(r.change);
        }
        if (label === "Focus" && parsed.kind === "look" || all) {
          const r = took(swapSlot(tags, D.looks, E.looks, parsed.lookFocus, origin, ["looks"], input.forceVariant ? parsed.variant : null));
          tags = r.tags;
          if (r.change) changes.push(r.change);
        }
        if (label === "Reaction" && parsed.kind === "look" || all) {
          const r = took(swapSlot(tags, D.reactions, E.reactions, parsed.lookReaction, origin, ["reactions"]));
          tags = r.tags;
          if (r.change) changes.push(r.change);
        }
        if (label === "Mood" || all) {
          const dm = D.moods || {}, em = E.moods || {};
          let r = { change: null };
          if (parsed.scene) {
            const own = (D.expressions || {})[parsed.scene] != null ? String(parsed.scene) : String(parsed.scene).replace(/^patron_/, "");
            r = took(swapSlot(tags, D.expressions, E.expressions, own, origin, ["expressions"]));
            tags = r.tags;
            if (r.change) changes.push(r.change);
            if (!r.change && !r.id) {
              r = took(swapSlot(tags, dm.patron, em.patron, null, origin, ["moods", "patron"]));
              tags = r.tags;
              if (r.change) changes.push(r.change);
            }
          }
          if (!r.change && !r.id) {
            r = took(swapSlot(tags, dm.scene, em.scene, parsed.mood, origin, ["moods", "scene"]));
            tags = r.tags;
            if (r.change) changes.push(r.change);
          }
          if (!r.change) {
            r = took(swapSlot(tags, dm.work, em.work, null, origin, ["moods", "work"]));
            tags = r.tags;
            if (r.change) changes.push(r.change);
          }
        }
        if ((label === "Room" || all) && parsed.room) {
          const roomId = parsed.abed && (D.rooms || {}).in_bed ? "in_bed" : parsed.room;
          const d = (D.rooms || {})[roomId] || {}, e = (E.rooms || {})[roomId] || {};
          const score = (text) => {
            const ks2 = splitTags(text).map(tagKey);
            if (!ks2.length) return 0;
            const have = new Set(tags.map(tagKey));
            return ks2.filter((k2) => have.has(k2)).length / ks2.length;
          };
          const ks = ["detail", "short"].filter((k2) => d[k2]);
          const k = ks.sort((a, b) => score(d[b]) - score(d[a]))[0];
          if (k && score(d[k]) >= 0.5) {
            rel = { path: ["prompts", "rooms", roomId, k] };
            if (e[k] != null && String(e[k]).trim() !== String(d[k]).trim()) {
              const r = replaceTags(tags, d[k], e[k], false);
              if (r.replaced) {
                tags = r.tags;
                changes.push({ id: roomId + " (" + (k === "detail" ? "long" : "short") + " text)", from: d[k], to: e[k], source: origin(["rooms", roomId, k]) });
              }
            }
          } else if (label === "Room" && !tags.length && e.detail && !d.detail) {
            tags = splitTags(e.detail);
            changes.push({ id: roomId, to: e.detail, source: origin(["rooms", roomId, "detail"]) });
          }
        }
        if (label === "Exposure" && mask && (E.exposure || {})[mask] != null) {
          const text = E.exposure[mask];
          tags = splitTags(text);
          changes.push({ id: mask, from: before, to: text, source: origin(["exposure", mask]) });
        }
        if (usingParts && partOv[label] && label !== "Quality") {
          const ov = partOv[label];
          if (ov.mode === "off") {
            tags = [];
            changes.push({ id: label, to: "(removed)", source: origin(["parts", label]) });
          } else if (ov.mode === "replace") {
            tags = splitTags(ov.text);
            changes.push({ id: label, to: ov.text, source: origin(["parts", label]) });
          }
        }
        if (!rel && usingParts && label !== "Quality") rel = { path: ["prompts", "parts", label], kind: "part" };
        out.push({ label, game: before, tags, changes, rel: usingParts ? rel : null });
      }
      let head = splitTags(P.quality);
      const rules = allRules(E, origin);
      const ruleSrc = origin(["rules"]);
      const posRules = rules.filter((r) => (r.target || "positive") === "positive");
      const ruleLabel = (r) => r.find.trim() ? r.find.trim() + " \u2192 " + (r.replace.trim() || "(removed)") : "+ " + r.replace.trim();
      const runRules = (tags, label, changes) => {
        for (const r of posRules) {
          if (!r.find.trim() || r.part && r.part !== label) continue;
          const x = applyRule(tags, r);
          if (x) {
            tags = x;
            changes.push({ id: "tag rule: " + ruleLabel(r), to: r.replace, source: r.src });
          }
        }
        return tags;
      };
      const headChanges = [];
      head = runRules(head, "Quality tags", headChanges);
      for (const p of out) p.tags = runRules(p.tags, p.label, p.changes);
      const ruleAdded = [], addedSrc = [];
      for (const r of posRules) {
        if (r.find.trim() || !r.replace.trim()) continue;
        const target = r.part ? r.part === "Quality tags" ? null : out.find((p) => p.label === r.part) : null;
        if (r.part === "Quality tags") {
          head = dedupe([...head, ...splitTags(r.replace)]);
          headChanges.push({ id: "tag rule: " + ruleLabel(r), to: r.replace, source: r.src });
        } else if (target) {
          target.tags = dedupe([...target.tags, ...splitTags(r.replace)]);
          target.changes.push({ id: "tag rule: " + ruleLabel(r), to: r.replace, source: r.src });
        } else if (!r.part) {
          ruleAdded.push(...splitTags(r.replace));
          if (!addedSrc.includes(r.src)) addedSrc.push(r.src);
        }
      }
      const positiveTags = dedupe([...head, ...out.flatMap((p) => p.tags), ...ruleAdded]);
      const yours = /* @__PURE__ */ new Set();
      for (const p of out) for (const c of p.changes) for (const t of splitTags(c.to)) yours.add(tagKey(t));
      for (const t of splitTags(P.quality)) yours.add(tagKey(t));
      const negative = composeNegative(input, positiveTags, explain, warnings, heroDef, heroEff, yours);
      if (usingParts) for (const p of out) explain.push({ label: p.label, game: p.game, final: joinTags(p.tags), changes: p.changes, rel: p.rel });
      else for (const c of categorize(out[0] || { tags: [], changes: [], game: "" }, input, heroDef, heroEff)) explain.push(c);
      if (ruleAdded.length) explain.push({ label: "Tag rules", game: "", final: joinTags(ruleAdded), changes: [{ id: "added", to: joinTags(ruleAdded), source: addedSrc.join(", ") || ruleSrc }], rel: { path: ["prompts", "rules"], kind: "rules" } });
      if (notes.length) explain.push({ label: "Внешность", note: notes.join("; ") });
      explain.unshift({
        label: "Quality tags",
        game: input.gameQuality || "",
        final: joinTags(head),
        rel: { path: ["pipeline", "families", P.family || "anima", "quality"] },
        changes: (P.qualityIsDefault ? [] : [{ id: "pipeline", to: joinTags(head), source: "Your settings \u2014 Pipeline & models (all heroines)" }]).concat(headChanges),
        note: P.qualityIsDefault ? "Pipeline & models: " + (P.family || "") + " default quality tags (they replace the game's)" : ""
      });
      if (!usingParts) warnings.push("The game did not send prompt parts for this picture, so edits were matched against the whole prompt (the parts below are worked out from your prompt tables).");
      return { positive: joinTags(positiveTags), negative, explain, warnings, usingParts };
    }
    function categorize(part, input, heroDef, heroEff) {
      const { parsed, defaults: D, prompts: E } = input;
      const texts = (label, list) => ({ label, keys: new Set(list.flatMap((t) => splitTags(t)).map(tagKey)) });
      const arr = (x) => Array.isArray(x) ? x : x == null ? [] : [x];
      const mask = exposureMask(parsed.exposure);
      const rid = parsed.abed && (D.rooms || {}).in_bed ? "in_bed" : parsed.room;
      const room = (k) => [((D.rooms || {})[rid] || {})[k], ((E.rooms || {})[rid] || {})[k]];
      const cats = [
        texts("Quality", [input.gameQuality || ""]),
        texts("Base", [heroDef.base, heroEff.base]),
        texts("Outfit", [((D.outfits || {})[parsed.outfit] || {}).tags, ((E.outfits || {})[parsed.outfit] || {}).tags]),
        texts("Exposure", [mask ? (E.exposure || {})[mask] : ""]),
        texts("Scene", parsed.scene ? [...arr((D.scenes || {})[parsed.scene]), ...arr((E.scenes || {})[parsed.scene]), ...arr((D.scenes || {})[parsed.scene + "_bed"]), ...arr((E.scenes || {})[parsed.scene + "_bed"])] : []),
        texts("Focus", parsed.lookFocus ? [...arr((D.looks || {})[parsed.lookFocus]), ...arr((E.looks || {})[parsed.lookFocus])] : []),
        texts("Reaction", parsed.lookReaction ? [(D.reactions || {})[parsed.lookReaction], (E.reactions || {})[parsed.lookReaction]] : []),
        texts("Task", parsed.task ? [(D.tasks || {})[parsed.task], (E.tasks || {})[parsed.task]] : []),
        texts("Mood", parsed.scene ? [...Object.values(E.expressions || {}), ...Object.values(D.expressions || {}), ...Object.values((E.moods || {}).patron || {}), ...Object.values((E.moods || {}).work || {})] : parsed.mood ? [((D.moods || {}).scene || {})[parsed.mood], ((E.moods || {}).scene || {})[parsed.mood]] : [...Object.values((E.moods || {}).work || {}), ...Object.values((D.moods || {}).work || {})]),
        texts("Room", [...room("detail"), ...room("short")])
      ];
      const buckets = /* @__PURE__ */ new Map();
      for (const t of part.tags) {
        const k = tagKey(t);
        const c = cats.find((x) => x.keys.has(k));
        const label = c ? c.label : "Other (game)";
        if (!buckets.has(label)) buckets.set(label, []);
        buckets.get(label).push(t);
      }
      const order = [...cats.map((c) => c.label), "Other (game)"];
      const out = order.filter((l) => buckets.has(l)).map((label) => ({ label, game: "", final: joinTags(buckets.get(label)), changes: [] }));
      for (const ch of part.changes || []) {
        const words = new Set(splitTags(ch.to).map(tagKey));
        let best = null, bestN = 0;
        for (const o of out) {
          const n = splitTags(o.final).filter((t) => words.has(tagKey(t))).length;
          if (n > bestN) {
            best = o;
            bestN = n;
          }
        }
        (best || out[out.length - 1] || { changes: [] }).changes.push(ch);
      }
      return out.length ? out : [{ label: "Prompt", game: part.game, final: joinTags(part.tags), changes: part.changes || [] }];
    }
    function composeNegative(input, positiveTags, explain, warnings, heroDef, heroEff, yours) {
      const { parsed, defaults: D, prompts: E, pipeline: P } = input;
      const origin = input.origin || (() => "your settings");
      const signals = sectionSignals(parsed, D, E);
      const conds = E.conditions || D.conditions || {};
      const heroDefX = expandHero(heroDef, signals, conds);
      const heroEffX = expandHero(heroEff, signals, conds);
      const original = splitTags(input.gameNegative);
      const have = new Set(original.map(tagKey));
      const share = (text) => {
        const ks = splitTags(text).map(tagKey).filter(Boolean);
        return ks.length ? ks.filter((k) => have.has(k)).length / ks.length : 0;
      };
      const G = input.gameNegatives || { base: "", extras: [] };
      const DN = D.negatives || {}, EN = E.negatives || {};
      const src = [];
      const put = (label, def, eff, path, opts) => {
        def = String(def || "");
        eff = eff == null ? def : String(eff);
        const changed = eff.trim() !== def.trim();
        src.push(Object.assign({ label, def, eff, changed, path, keys: new Set(splitTags(def).map(tagKey).filter(Boolean)), present: share(def) >= (opts && opts.always ? 0.5 : 0.75) }, opts || {}));
      };
      put("Game: base negative (every picture)", G.base || DN.base, EN.base, ["prompts", "negatives", "base"], { always: true, yourLabel: "Base negative" });
      put("Character negative" + (heroEffX.negative != null && String(heroEffX.negative).trim() !== String(heroDefX.negative || "").trim() ? "" : " (game)"), heroDefX.negative, heroEffX.negative, ["prompts", "heroines", input.heroine, "negative"], { always: true });
      if (parsed.outfit) {
        const d = ((D.outfits || {})[parsed.outfit] || {}).negative || "";
        put("Outfit negative", d, ((E.outfits || {})[parsed.outfit] || {}).negative, ["prompts", "outfits", parsed.outfit, "negative"]);
      }
      const labels = Object.fromEntries((G.extras || []).map((x) => [x.id, x.label]));
      for (const [id, def] of Object.entries(DN.extras || {})) put("Game: " + (labels[id] || id), def, (EN.extras || {})[id], ["prompts", "negatives", "extras", id]);
      const within = (a, b) => a.keys.size && b.keys.size > a.keys.size && [...a.keys].every((k) => b.keys.has(k));
      for (const x of src) if (x.present && src.some((o) => o !== x && o.present && within(x, o))) x.present = false;
      for (const x of src) x.on = x.present || x.always && x.changed;
      let tags = original.slice();
      for (const x of src) {
        if (!x.changed || !x.on) continue;
        const keep = /* @__PURE__ */ new Set();
        for (const o of src) if (o !== x && o.on) for (const t of splitTags(o.eff)) keep.add(tagKey(t));
        const drop = new Set(splitTags(x.def).map(tagKey).filter((k) => !keep.has(k)));
        const add = splitTags(x.eff);
        const out = [];
        let ins = false;
        for (const t of tags) {
          if (drop.has(tagKey(t))) {
            if (!ins) {
              out.push(...add);
              ins = true;
            }
            continue;
          }
          out.push(t);
        }
        tags = ins ? out : [...out, ...add];
        x.change = { id: x.path[x.path.length - 1] === "negative" ? x.path[x.path.length - 2] : x.path[x.path.length - 1], to: x.eff || "(removed)", source: origin(x.path.slice(1)) };
      }
      const yourNeg = new Set(splitTags(P.negative).map(tagKey));
      for (const x of src) if (x.changed && x.on) for (const t of splitTags(x.eff)) yourNeg.add(tagKey(t));
      let cleanup = null;
      if (yours && yours.size) {
        const dropped = tags.filter((t) => yours.has(tagKey(t)) && !yourNeg.has(tagKey(t)));
        if (dropped.length) {
          const drop = new Set(dropped.map(tagKey));
          tags = tags.filter((t) => !drop.has(tagKey(t)));
          cleanup = { id: "removed " + dropped.join(", "), to: "", source: "Your prompt asks for these, so they were taken out of the game's negative" };
        }
      }
      tags = dedupe([...tags, ...splitTags(P.negative)]);
      const ruleChanges = [], ruleAdded = [];
      for (const r of allRules(E, origin).filter((r2) => r2.target === "negative")) {
        if (r.find.trim()) {
          const x = applyRule(tags, r);
          if (x) {
            tags = x;
            ruleAdded.push(...splitTags(r.replace));
            ruleChanges.push({ id: "tag rule: " + r.find.trim() + " \u2192 " + (r.replace.trim() || "(removed)"), to: r.replace, source: r.src });
          }
        } else if (r.replace.trim()) {
          tags = dedupe([...tags, ...splitTags(r.replace)]);
          ruleAdded.push(...splitTags(r.replace));
          ruleChanges.push({ id: "tag rule: + " + r.replace.trim(), to: r.replace, source: r.src });
        }
      }
      const rows = [];
      const fam = P.family || "anima";
      rows.push({ label: "Tag rules", keys: new Set(ruleAdded.map(tagKey)), changes: ruleChanges, tags: [], rel: { path: ["prompts", "rules"], kind: "rules" } });
      for (const x of src) if (x.on) rows.push({ label: x.changed ? (x.yourLabel || x.label.replace(/^Game: /, "").replace(/ \(game\)$/, "")) + " (yours)" : x.label, keys: new Set(splitTags(x.eff).map(tagKey)), changes: x.change ? [x.change] : [], tags: [], rel: { path: x.path } });
      const pipeKeys = new Set(splitTags(P.negative).map(tagKey));
      const pipeRow = {
        label: P.negativeIsDefault ? "Pipeline & models: " + fam + " default negative" : "Pipeline & models: your negative",
        keys: pipeKeys,
        tags: [],
        rel: { path: ["pipeline", "families", fam, "negative"] },
        changes: P.negativeIsDefault ? [] : [{ id: "pipeline", to: P.negative, source: "Your settings \u2014 Pipeline & models (all heroines)" }]
      };
      rows.push(pipeRow);
      const other = { label: "Game: other", keys: /* @__PURE__ */ new Set(), changes: [], tags: [] };
      for (const t of tags) {
        const k = tagKey(t);
        (rows.find((r) => r.keys.has(k)) || other).tags.push(t);
      }
      const shared = splitTags(P.negative).filter((t) => !pipeRow.tags.includes(t) && tags.some((u) => tagKey(u) === tagKey(t)));
      if (shared.length) pipeRow.note = "also in it, listed above: " + shared.join(", ");
      if (cleanup) (rows[1] || other).changes.push(cleanup);
      const pos = new Set(positiveTags.map(tagKey));
      const clash = tags.filter((t) => pos.has(tagKey(t)));
      if (clash.length) warnings.push("In both the prompt and the negative prompt: " + clash.join(", "));
      for (const r of [...rows, other]) if (r.tags.length || r.changes.length) explain.push({ label: "Negative \xB7 " + r.label, game: "", final: joinTags(r.tags), changes: r.changes, note: r.note, negative: true, rel: r.rel || null });
      return joinTags(tags);
    }
    function composePatron(input, explain, warnings) {
      const { parsed, defaults: D, prompts: E } = input;
      const origin = input.origin || (() => "your settings");
      const dp = D.patrons || {}, ep = E.patrons || {};
      const name = String(parsed.patron || "").toLowerCase();
      const named = (ep.named || {})[name];
      let tags = splitTags(input.gamePrompt);
      const changes = [];
      if (ep.quality != null && ep.quality.trim() !== String(dp.quality || "").trim()) {
        const r = replaceTags(tags, dp.quality || "", ep.quality, true);
        tags = r.tags;
        changes.push({ id: "quality", to: ep.quality, source: origin(["patrons", "quality"]) });
      }
      if (named && named.prompt) {
        const q = splitTags(ep.quality || dp.quality || "");
        tags = [...q, ...splitTags(named.prompt)];
        changes.push({ id: name, to: named.prompt, source: origin(["patrons", "named", name]) });
      } else {
        const defs = (dp.archetypes || []).map((a) => a.tags);
        const effs = (ep.archetypes || []).map((a) => a.tags);
        const hit = identify(tags, Object.fromEntries(defs.map((t, i) => [String(i), t])));
        if (hit && effs[hit.id] != null && effs[hit.id].trim() !== hit.text.trim()) {
          tags = replaceTags(tags, hit.text, effs[hit.id], false).tags;
          changes.push({ id: (dp.archetypes[hit.id] || {}).label || "archetype", to: effs[hit.id], source: origin(["patrons", "archetypes"]) });
        }
      }
      let neg = input.gameNegative || "";
      if (named && named.negative) neg = named.negative;
      else if (ep.negative != null && ep.negative.trim() !== String(dp.negative || "").trim()) neg = ep.negative;
      const positive = joinTags(dedupe(tags));
      explain.push({ label: "Patron portrait", game: input.gamePrompt || "", final: positive, changes, rel: named ? { path: ["prompts", "patrons", "named", name, "prompt"] } : null });
      const negSrc = named && named.negative ? origin(["patrons", "named", name]) : neg !== (input.gameNegative || "") ? origin(["patrons", "negative"]) : "";
      explain.push({ label: "Negative \xB7 " + (negSrc ? "Patron negative" : "Game: patron portrait negative"), game: input.gameNegative || "", final: neg, changes: negSrc ? [{ id: named && named.negative ? name : "patrons", to: neg, source: negSrc }] : [], negative: true, rel: { path: named && named.negative ? ["prompts", "patrons", "named", name, "negative"] : ["prompts", "patrons", "negative"] } });
      return { positive, negative: neg, explain, warnings, usingParts: false };
    }
    var NUDE_SCENES = /* @__PURE__ */ new Set(["facial", "patron_facial", "finish_on_stomach", "finish_on_chest", "finish_on_back"]);
    var BATH_SCENES = /* @__PURE__ */ new Set(["bath_attendant", "bath_attendant_wash_chest", "bath_attendant_wash_body", "bath_attendant_handjob"]);
    function noExposure(parsed) {
      const outfit = String(parsed.outfit || ""), scene = String(parsed.scene || "");
      return outfit === "naked" || outfit === "nude" || String(parsed.finishOutfit || "") === "nude" || NUDE_SCENES.has(scene) || BATH_SCENES.has(scene);
    }
    function synthesize(parsed, heroine, E) {
      E = E || {};
      const v = Number(parsed.variant) || 0;
      const hero = (E.heroines || {})[heroine] || {};
      const heroX = expandHero(hero, sectionSignals(parsed, {}, E), E.conditions || {});
      const outfit = (E.outfits || {})[parsed.outfit] || {};
      const mask = exposureMask(parsed.exposure);
      const room = (E.rooms || {})[parsed.room] || {};
      const parts = [{ label: "Base", tags: heroX.base || "" }];
      if (outfit.tags) parts.push({ label: "Outfit", tags: outfit.tags });
      if (mask && (E.exposure || {})[mask] && !noExposure(parsed)) parts.push({ label: "Exposure", tags: E.exposure[mask] });
      const sid = parsed.scene && parsed.abed && (E.scenes || {})[parsed.scene + "_bed"] ? parsed.scene + "_bed" : parsed.scene;
      if (parsed.scene) parts.push({ label: "Scene", tags: variantAt([].concat((E.scenes || {})[sid] || []), v) });
      else if (parsed.lookFocus) {
        parts.push({ label: "Focus", tags: variantAt([].concat((E.looks || {})[parsed.lookFocus] || []), v) });
        if (parsed.lookReaction) parts.push({ label: "Reaction", tags: String((E.reactions || {})[parsed.lookReaction] || "") });
      } else if (parsed.task) parts.push({ label: "Task", tags: String((E.tasks || {})[parsed.task] || "") });
      const sceneMood = parsed.scene ? (E.expressions || {})[parsed.scene] || (E.expressions || {})[String(parsed.scene).replace(/^patron_/, "")] : "";
      if (sceneMood) parts.push({ label: "Mood", tags: String(sceneMood) });
      else if (parsed.mood && !parsed.scene) parts.push({ label: "Mood", tags: String(((E.moods || {}).scene || {})[parsed.mood] || "") });
      else parts.push({ label: "Mood", tags: String(((E.moods || {}).work || {}).content || "") });
      const rm = parsed.abed && (E.rooms || {}).in_bed ? E.rooms.in_bed : room;
      if (parsed.room) parts.push({ label: "Room", tags: (parsed.scene ? rm.short : rm.detail) || rm.detail || rm.short || "" });
      const negative = [heroX.negative, mask ? "" : outfit.negative].filter(Boolean).join(", ");
      return { parts: parts.filter((x) => String(x.tags || "").trim()), negative };
    }
    module2.exports = { synthesize, compose, identify, noExposure };
  }
});

