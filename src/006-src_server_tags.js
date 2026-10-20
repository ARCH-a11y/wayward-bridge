// src/server/tags.js
var require_tags = __commonJS({
  "src/server/tags.js"(exports2, module2) {
    "use strict";
    function splitTags(text) {
      const out = [];
      let depth = 0, cur = "";
      for (const ch of String(text || "")) {
        if (ch === "(" || ch === "[" || ch === "{") depth++;
        else if ((ch === ")" || ch === "]" || ch === "}") && depth > 0) depth--;
        if (ch === "," && depth === 0) {
          if (cur.trim()) out.push(cur.trim());
          cur = "";
          continue;
        }
        if (ch === "\n" && depth === 0) {
          if (cur.trim()) out.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      if (cur.trim()) out.push(cur.trim());
      return out;
    }
    function tagKey(tag) {
      let t = String(tag || "").trim().toLowerCase();
      for (let i = 0; i < 3; i++) {
        const m = t.match(/^\((.*?)(?::\s*-?[0-9.]+)?\)$/) || t.match(/^\[(.*)\]$/);
        if (!m) break;
        t = m[1].trim();
      }
      return t.replace(/_/g, " ").replace(/\\([()])/g, "$1").replace(/\s+/g, " ").trim();
    }
    function joinTags(tags) {
      return tags.filter((t) => String(t || "").trim()).join(", ");
    }
    function dedupe(tags) {
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const t of tags) {
        const k = tagKey(t);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(t);
      }
      return out;
    }
    function replaceTags(tags, defaultText, overrideText, insertIfMissing) {
      const drop = new Set(splitTags(defaultText).map(tagKey).filter(Boolean));
      const add = splitTags(overrideText);
      const out = [];
      let inserted = false;
      for (const t of tags) {
        if (drop.has(tagKey(t))) {
          if (!inserted) {
            out.push(...add);
            inserted = true;
          }
          continue;
        }
        out.push(t);
      }
      if (!inserted && insertIfMissing) out.unshift(...add);
      return { tags: out, replaced: inserted };
    }
    function overlap(tags, text) {
      const want = splitTags(text).map(tagKey).filter(Boolean);
      if (!want.length) return 0;
      const have = new Set(tags.map(tagKey));
      return want.filter((k) => have.has(k)).length / want.length;
    }
    module2.exports = { splitTags, tagKey, joinTags, dedupe, replaceTags, overlap };
  }
});

