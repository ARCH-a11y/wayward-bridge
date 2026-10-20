// src/server/items.js
var require_items = __commonJS({
  "src/server/items.js"(exports2, module2) {
    "use strict";
    var isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
    var SIMPLE = ["scenes", "looks", "tasks", "reactions", "expressions", "rooms", "parts"];
    var GLOBAL_ITEMS = { has: (item) => item === "rulesAll" };
    function itemPaths(item, heroine) {
      if (item === "character") return [["prompts", "heroines", heroine]];
      if (item === "clothing") return [["prompts", "outfits"], ["prompts", "exposure"]];
      if (item === "patrons") return [["prompts", "patrons", "quality"], ["prompts", "patrons", "negative"], ["prompts", "patrons", "archetypes"]];
      if (item === "pipeline") return [["pipeline"]];
      if (item === "negatives") return [["prompts", "negatives"]];
      if (item === "rules") return [["prompts", "rules"]];
      if (item === "rulesAll") return [["prompts", "rulesAll"]];
      const [sec, a, b] = item.split(".");
      if (sec === "named") return [["prompts", "patrons", "named", item.slice(6)]];
      if (sec === "moods" && a && b) return [["prompts", "moods", a, item.slice(("moods." + a + ".").length)]];
      if (SIMPLE.includes(sec) && a) return [["prompts", sec, item.slice(sec.length + 1)]];
      return [];
    }
    function itemOf(rel) {
      const [top, sec, a, b] = rel;
      if (top === "pipeline") return "pipeline";
      if (top !== "prompts" || !sec) return null;
      if (sec === "heroines") return "character";
      if (sec === "outfits" || sec === "exposure") return "clothing";
      if (sec === "negatives") return "negatives";
      if (sec === "rules") return "rules";
      if (sec === "rulesAll") return "rulesAll";
      if (sec === "patrons") return a === "named" ? b ? "named." + b : null : "patrons";
      if (sec === "moods") return a && b ? "moods." + a + "." + b : null;
      if (SIMPLE.includes(sec)) return a ? sec + "." + a : null;
      return null;
    }
    function addonItems(addon) {
      const out = /* @__PURE__ */ new Set();
      const visit = (layer) => {
        if (!isObj(layer)) return;
        const P = layer.prompts || {};
        if (isObj(P.heroines) && Object.keys(P.heroines).length) out.add("character");
        if (isObj(P.outfits) && Object.keys(P.outfits).length || isObj(P.exposure) && Object.keys(P.exposure).length) out.add("clothing");
        for (const sec of SIMPLE) for (const id of Object.keys(P[sec] || {})) out.add(sec + "." + id);
        for (const g of ["scene", "work", "patron"]) for (const id of Object.keys((P.moods || {})[g] || {})) out.add("moods." + g + "." + id);
        if (isObj(P.negatives) && Object.keys(P.negatives).length) out.add("negatives");
        if (Array.isArray(P.rules) && P.rules.length) out.add("rules");
        if (Array.isArray(P.rulesAll) && P.rulesAll.length) out.add("rulesAll");
        const pt = P.patrons || {};
        if (pt.quality != null || pt.negative != null || pt.archetypes != null) out.add("patrons");
        for (const n of Object.keys(pt.named || {})) out.add("named." + n);
        if (isObj(layer.pipeline) && Object.keys(layer.pipeline).length) out.add("pipeline");
      };
      if (!addon) return out;
      visit(addon.layer);
      for (const l of Object.values(addon.heroine || {})) visit(l);
      return out;
    }
    function getAt(o, p) {
      return p.reduce((x, k) => x == null ? void 0 : x[k], o);
    }
    function addonValue(addon, rel, heroine) {
      if (rel[1] === "heroines" && rel[0] === "prompts") {
        const pick = (layer) => {
          const H = getAt(layer, ["prompts", "heroines"]) || {};
          return H[heroine] || H[Object.keys(H)[0]];
        };
        const hl = addon.heroine && addon.heroine[heroine];
        return hl && getAt(hl, ["prompts", "heroines", heroine]) || pick(addon.layer) || hl && pick(hl);
      }
      const base = getAt(addon.layer, rel);
      const own = addon.heroine && addon.heroine[heroine] ? getAt(addon.heroine[heroine], rel) : void 0;
      if (own === void 0) return base;
      if (isObj(base) && isObj(own)) return Object.assign({}, base, own);
      return own;
    }
    module2.exports = { itemPaths, itemOf, addonItems, addonValue, GLOBAL_ITEMS };
  }
});

