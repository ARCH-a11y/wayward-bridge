// src/server/keyparse.js
var require_keyparse = __commonJS({
  "src/server/keyparse.js"(exports2, module2) {
    "use strict";
    function parseImageKey(key) {
      key = String(key || "");
      if (/^patron_/i.test(key)) {
        return { kind: "patron", patron: key.slice(7).replace(/_ov$/, ""), key };
      }
      const parts = key.split("__");
      if (parts.length < 2 || !parts[0] || parts[0].includes("-")) return { kind: "other", key };
      const out = { kind: null, key, character: parts[0], variant: 0 };
      for (const seg of parts.slice(1)) {
        const i = seg.indexOf("-");
        if (i < 0) continue;
        const k = seg.slice(0, i), v = seg.slice(i + 1);
        switch (k) {
          case "cid":
            out.characterId = v;
            break;
          case "scene":
            out.kind = "scene";
            out.scene = v;
            break;
          case "look":
            out.kind = "look";
            out.lookFocus = v;
            break;
          case "reaction":
            out.lookReaction = v;
            break;
          case "task":
            out.kind = "task";
            out.task = v;
            break;
          case "outfit":
            out.outfit = v;
            break;
          case "room":
            out.room = v;
            break;
          case "abed":
            out.abed = v === "1";
            break;
          case "mood":
            out.mood = v;
            break;
          case "exp":
            out.exposure = v;
            break;
          case "fin":
            out.finishOutfit = v;
            break;
          case "aft":
            out.aftermath = v;
            break;
          case "grp":
            out.groupBoys = Number(v) || 0;
            break;
          case "gslot":
            out.groupSlots = v;
            break;
          case "v":
            out.variant = Number(v) || 0;
            break;
          default:
            break;
        }
      }
      if (!out.kind) out.kind = "other";
      return out;
    }
    function heroineOf(parsed, heroineIds) {
      const c = String(parsed && parsed.character || "").toLowerCase();
      for (const id of heroineIds) {
        const k = String(id).toLowerCase();
        if (c === k || c.startsWith(k + "_") || k.startsWith(c + "_")) return id;
      }
      return c;
    }
    var EXPOSURE_BITS = ["bodiceUnlaced", "topPulledDown", "topRemoved", "skirtUp", "skirtRemoved", "pantiesAside", "pantiesRemoved"];
    function exposureMask(v) {
      const s = String(v || "").replace(/[^01]/g, "");
      return s ? s.padEnd(7, "0").slice(0, 7) : "";
    }
    module2.exports = { parseImageKey, heroineOf, exposureMask, EXPOSURE_BITS };
  }
});

