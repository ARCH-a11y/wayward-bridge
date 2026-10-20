// src/server/lora-info.js
var require_lora_info = __commonJS({
  "src/server/lora-info.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var GENERIC = /* @__PURE__ */ new Set(["1girl", "1boy", "solo", "looking at viewer", "simple background", "white background", "masterpiece", "best quality", "smile", "blush", "open mouth", "closed mouth", "upper body", "full body", "standing", "sitting"]);
    function findLoraFile(modelsDir, model) {
      if (!modelsDir || !model) return "";
      const rel = String(model).replace(/\\/g, "/");
      const dirs = ["loras", "lora", "Lora", "LoRA", ""];
      for (const d of dirs) {
        const fp = path.join(modelsDir, d, rel);
        if (fs.existsSync(fp)) return fp;
      }
      return "";
    }
    function readHeader(fp) {
      const fd = fs.openSync(fp, "r");
      try {
        const lenBuf = Buffer.alloc(8);
        fs.readSync(fd, lenBuf, 0, 8, 0);
        const len = Number(lenBuf.readBigUInt64LE(0));
        if (!len || len > 100 * 1024 * 1024) return null;
        const buf = Buffer.alloc(len);
        fs.readSync(fd, buf, 0, len, 8);
        return JSON.parse(buf.toString("utf8"));
      } finally {
        fs.closeSync(fd);
      }
    }
    function loraInfo(modelsDir, model) {
      const fp = findLoraFile(modelsDir, model);
      if (!fp) return { found: false, tags: [], sidecar: "", error: modelsDir ? "LoRA file not found under " + modelsDir : "Set the ComfyUI models folder in Settings to read LoRA tags." };
      let sidecar = "";
      try {
        const txt = fp.replace(/\.[^.]+$/, ".txt");
        if (fs.existsSync(txt)) sidecar = fs.readFileSync(txt, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0] || "";
      } catch (_) {
      }
      const counts = /* @__PURE__ */ new Map();
      let baseModel = "";
      try {
        const head = readHeader(fp);
        const meta = head && head.__metadata__ || {};
        baseModel = meta.ss_base_model_version || meta["modelspec.architecture"] || "";
        const freq = meta.ss_tag_frequency ? JSON.parse(meta.ss_tag_frequency) : {};
        for (const bucket of Object.values(freq)) {
          for (const [tag, n] of Object.entries(bucket || {})) {
            const t = String(tag).trim();
            if (!t) continue;
            counts.set(t, (counts.get(t) || 0) + Number(n || 0));
          }
        }
      } catch (_) {
      }
      const tags = [...counts.entries()].filter(([t]) => !GENERIC.has(t.toLowerCase().replace(/_/g, " "))).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([tag, count]) => ({ tag, count }));
      return { found: true, file: fp, sidecar, baseModel, tags };
    }
    module2.exports = { loraInfo };
  }
});

