// src/server/maintainer.js
var require_maintainer = __commonJS({
  "src/server/maintainer.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var { extractCatalog } = require_catalog();
    var { buildDefaultLayer } = require_defaults();
    var { flatten, diff } = require_updates();
    var { PART_LABELS } = require_schema();
    var HANDLED_API = ["/api/image-file",
      "/api/image/health",
      "/api/pack",
      "/api/image/generate",
      "/api/image/status",
      "/api/image/cancel",
      "/api/review/mark",
      "/api/image-hit",
      "/api/wife-image-counts",
      "/api/batch/enqueue",
      "/api/batch/status",
      "/api/batch/pause",
      "/api/batch/resume",
      "/api/batch/clear",
      "/api/video/check",
      "/api/video/generate",
      "/api/video/status"
    ];
    var IGNORED_API = {};
    var DOM_ANCHORS = [
      ["View image fullscreen", "button title: finds the game's picture box (picture buttons, progress, hover)"],
      ["Mark this image as good", 'thumbs up \u2192 "save current scene"'],
      ["Mark as bad and regenerate", 'thumbs down \u2192 "delete current scene" (title prefix)'],
      ["Add another variant of this state", '+ \u2192 "cycle scene variants" (title prefix)'],
      ["Turn this image into a video", "video button \u2192 GIF"],
      ["Video already exists for this image", "video button (second title) \u2192 GIF"],
      ["Copy prompt", "picture details panel: replaced with the prompt the bridge used"],
      ["What's wrong with this image?", "regenerate dialog the bridge answers silently"],
      ["Just regenerate", "button in that dialog"],
      ["The picture from this moment", "full-screen moment picture (alt text)"],
      ["There is no picture for this moment.", "empty moment picture"],
      ["bg-black/85", "class of the picture details panel"],
      ["bg-black/70", "class of the regenerate dialog backdrop"],
      ["bg-black/90", "class of the full-screen overlay"],
      ["absolute top-2 right-2", "class of the game's picture buttons (hidden until hover)"],
      ["absolute bottom-2 left-2", "class of the game's variant arrows (hidden until hover)"],
      ["Previous image variant", "variant arrows (aria-label)"],
      ["elena-image-variants-v1", 'localStorage key: scene variants ("cycle scene variants")'],
      ["wayward-custom-wives", "localStorage key: heroines from the builder"],
      ['name:"tavern-game"', "localStorage key of the game save: the menu reads the patrons in the tavern from it"],
      ["namedPatronNames", "game save field: named patrons (Scenes & NPCs > Named patrons)"],
      ["primaryCharacterId", "game save field: which character is the heroine in play (menu follows her)"],
      ["archetypeId:", "game save field: the heroine's base character (which heroine's settings are used)"],
      ["generatedArchetype", "game save field: builder / random heroine data (her id in picture keys)"],
      ["traitsAtGeneration", "game save field: rolled when a game starts; tells two playthroughs of the same heroine apart"],
      ["growthRates", "game save field: rolled when a game starts; tells two playthroughs of the same heroine apart"],
      ["startGameWithWifeArchetype:", "game function: starting a new game (the mod gives it a playthrough id)"],
      ["startGameWithPicks:", "game function: starting a new game with picks (the mod gives it a playthrough id)"],
      ["newGame:", "game function: quick new game (the mod gives it a playthrough id)"],
      ["Build Your Wife", 'builder title (renamed to "Build Your Own Heroine")'],
      ["imageKey", "React prop the picture buttons read the picture key from"],
      ["joinedPatronIds", "patron scene state used in the negative prompt"]
    ];
    function snippetsFor(src, needles, max) {
      const out = [];
      for (const n of needles) {
        let i = -1, k = 0;
        while ((i = src.indexOf(n, i + 1)) >= 0 && k < (max || 2)) {
          out.push({ needle: n, at: i, text: src.slice(Math.max(0, i - 220), i + 260) });
          k++;
        }
      }
      return out;
    }
    function partLabels(src) {
      const nm = src.match(/negativePrompt:([A-Za-z0-9_$]+),parts:/);
      if (!nm) return [];
      const start = Math.max(0, nm.index - 2e4);
      return [...new Set([...src.slice(start, nm.index).matchAll(/\{label:"([A-Za-z]+)",tags:/g)].map((m) => m[1]))];
    }
    function checkGame(html, opts) {
      opts = opts || {};
      const src = String(html || "");
      const { Game, PARTS_RE } = require_game();
      const items = [];
      const add = (area, name, ok, detail, look) => items.push({ area, name, ok: !!ok, detail: detail || "", look: look || [] });
      add("Hooks", "Prompt parts hook", PARTS_RE.test(src), "the picture function's return {key, prompt, negativePrompt, parts}", PARTS_RE.test(src) ? [] : snippetsFor(src, ["negativePrompt:", "parts:"], 3));
      const STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(\)\(([A-Za-z0-9_$]+)\(\(e,t\)=>\(\{state:/;
      add("Hooks", "Game store hook (renames, custom heroine picker test helpers)", STORE_RE.test(src), "const X=create()(persist((e,t)=>({state:", STORE_RE.test(src) ? [] : snippetsFor(src, ["=>({state:"], 3));
      let custom = false;
      try {
        custom = Game.addCustomWives(src) !== src;
      } catch (_) {
      }
      add("Hooks", "Custom heroines in the picker", custom, 'heroine picker with onOpenBuilder and the ",!1,!1]" placeholders', custom ? [] : snippetsFor(src, ["onOpenBuilder:", "wives)", "Build Your Wife"], 2));
      const cat = extractCatalog(src);
      for (const [k, v] of Object.entries(cat.found)) add("Prompt tables", k, v, v ? "" : "not found: the menu has no game defaults for it");
      add("Prompt tables", "heroine list", Object.keys(cat.heroines).length > 0, Object.keys(cat.heroines).join(", "));
      const pt = cat.patrons || {};
      add("Prompt tables", "patron portrait quality text", !!pt.quality, pt.quality ? "" : 'not found near the patron list (catalog.js, "Patron portraits")');
      add("Prompt tables", "patron portrait negative", !!pt.negative, pt.negative ? "" : 'not found (catalog.js, "Patron portraits")');
      add("Prompt tables", "patron looks", (pt.archetypes || []).length > 0, (pt.archetypes || []).length + " looks");
      add("Negatives", "base negative", !!cat.negatives.base, cat.negatives.base.slice(0, 120));
      const unlabeled = cat.negatives.extras.filter((x) => /^extra_\d+$/.test(x.id));
      add("Negatives", "situational extras all labelled", !unlabeled.length, unlabeled.length ? unlabeled.length + " new piece(s) need a label in catalog.js NEG_LABELS: " + unlabeled.map((x) => '"' + x.text.slice(0, 80) + '"').join(" | ") : cat.negatives.extras.length + " pieces");
      const known = /* @__PURE__ */ new Set(["Quality", "Base", "Outfit", "Exposure", "Scene", "Focus", "Reaction", "Task", "Pose", "Mood", "Room", ...PART_LABELS]);
      const labels = partLabels(src);
      const fresh = labels.filter((l) => !known.has(l));
      add("Prompt parts", "all part labels known", labels.length && !fresh.length, labels.length ? fresh.length ? "new: " + fresh.join(", ") + " (add to PART_LABELS in schema.js and menu.js, and to RULE_PARTS)" : labels.join(", ") : "no labels found");
      const used = [...new Set([...src.matchAll(/\/api\/[A-Za-z0-9_\-/]+/g)].map((m) => m[0]))].filter((p) => !/\/\//.test(p));
      const answered = (p) => HANDLED_API.includes(p.replace(/\/$/, "")) || HANDLED_API.some((h) => p.endsWith("/") ? h.startsWith(p) : p.startsWith(h + "/"));
      const missing = used.filter((p) => !answered(p) && !IGNORED_API[p]);
      add("Game API", "every path the game calls is answered", !missing.length, missing.length ? "not answered: " + missing.join(", ") : used.join(", "), missing.length ? snippetsFor(src, missing, 1) : []);
      for (const [p, why] of Object.entries(IGNORED_API)) if (used.includes(p)) add("Game API", p, true, "left alone: " + why);
      for (const [needle, what] of DOM_ANCHORS) {
        const ok = src.includes(needle);
        const word = ok ? "" : needle.split(/[^A-Za-z0-9/-]+/).filter((w) => w.length >= 5).sort((a, b) => b.length - a.length)[0];
        add("Page anchors", needle, ok, what + (ok ? "" : " (menu.js / index.js look for this text)"), word ? snippetsFor(src, [word], 3) : []);
      }
      const version = (src.match(/## \[(\d{4}-\d{2}-\d{2})\]/) || [])[1] || "";
      const ci = src.search(/## \[\d{4}-\d{2}-\d{2}\]/);
      let changelog = ci >= 0 ? src.slice(ci, ci + 3e3) : "";
      const next = changelog.slice(3).search(/## \[\d{4}-\d{2}-\d{2}\]/);
      changelog = (next >= 0 ? changelog.slice(0, next + 3) : changelog).split(/\\n|\n/).join("\n").replace(/[`"]\s*[,;)][\s\S]*$/, "");
      let changes = null;
      if (opts.against) {
        const a = flatten(buildDefaultLayer(extractCatalog(opts.against)).prompts), b = flatten(buildDefaultLayer(cat).prompts);
        changes = diff(a, b);
      } else if (opts.previousFlat) changes = diff(opts.previousFlat, flatten(buildDefaultLayer(cat).prompts));
      return { version, changelog, items, changes, catalog: cat, problems: items.filter((x) => !x.ok).length };
    }
    function toMarkdown(r, meta) {
      meta = meta || {};
      const L = [];
      L.push("# Wayward Bridge maintainer report", "");
      L.push("- Game version: " + (r.version || "unknown") + (meta.hash ? " (index.html " + meta.hash + ")" : ""));
      if (meta.bridge) L.push("- Bridge: " + meta.bridge);
      L.push("- Made: " + (/* @__PURE__ */ new Date()).toISOString());
      L.push("- Result: " + (r.problems ? "**" + r.problems + " problem(s)** \u2014 see \u2717 below" : "everything the mod depends on was found"), "");
      const areas = [...new Set(r.items.map((x) => x.area))];
      for (const a of areas) {
        L.push("## " + a, "");
        for (const x of r.items.filter((i) => i.area === a)) L.push("- " + (x.ok ? "\u2713" : "\u2717") + " **" + x.name + "**" + (x.detail ? " \u2014 " + x.detail : ""));
        L.push("");
      }
      const bad = r.items.filter((x) => !x.ok && x.look.length);
      if (bad.length) {
        L.push("## Where to look", "");
        for (const x of bad) {
          L.push("### " + x.name, "");
          for (const s of x.look) L.push("`" + s.needle + "` at " + s.at + ":", "```", s.text, "```", "");
        }
      }
      if (r.changes) {
        const c = r.changes;
        L.push("## Prompt changes since the older version", "", c.changed.length + " changed, " + c.added.length + " added, " + c.removed.length + " removed", "");
        for (const x of c.changed.slice(0, 150)) L.push("- changed `" + x.path + '`: "' + x.was + '" \u2192 "' + x.now + '"');
        for (const x of c.added.slice(0, 150)) L.push("- added `" + x.path + '`: "' + x.now + '"');
        for (const x of c.removed.slice(0, 150)) L.push("- removed `" + x.path + '`: "' + x.was + '"');
        L.push("");
      }
      if (r.changelog) L.push("## Game changelog (latest entry)", "", "```", r.changelog.trim(), "```", "");
      return L.join("\n");
    }
    function writeReport(dataDir, html, meta) {
      const dir = path.join(dataDir, "maintainer");
      fs.mkdirSync(dir, { recursive: true });
      const r = checkGame(html, { previousFlat: meta && meta.previousFlat });
      const md = toMarkdown(r, meta);
      const name = (r.version || "unknown") + "-" + (meta && meta.hash || "x");
      fs.writeFileSync(path.join(dir, name + ".md"), md);
      fs.writeFileSync(path.join(dir, "latest.md"), md);
      fs.writeFileSync(path.join(dir, name + "-tables.json"), JSON.stringify(r.catalog, null, 1));
      return { file: path.join(dir, name + ".md"), problems: r.problems };
    }
    function cli(args, bridgeVersion) {
      const read = (p) => {
        const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "index.html") : p;
        return fs.readFileSync(f, "utf8");
      };
      const html = read((args["check-game"] === true ? "." : String(args["check-game"])));
      const against = args.against ? read(String(args.against)) : null;
      const r = checkGame(html, { against });
      const md = toMarkdown(r, { bridge: bridgeVersion, hash: require("crypto").createHash("sha1").update(html).digest("hex").slice(0, 10) });
      if (args.out) {
        fs.writeFileSync(String(args.out), md);
        console.log("Report written to " + args.out + " (" + (r.problems ? r.problems + " problem(s)" : "all good") + ")");
      } else process.stdout.write(md + "\n");
      return r.problems ? 1 : 0;
    }
    module2.exports = { checkGame, toMarkdown, writeReport, cli, HANDLED_API };
  }
});

