// src/server/comfy.js
var require_comfy = __commonJS({
  "src/server/comfy.js"(exports2, module2) {
    "use strict";
    var Comfy = class {
      constructor(getUrl) {
        this.getUrl = getUrl;
        this.caps = null;
        this.capsAt = 0;
        this.capsError = "";
        this.online = false;
        this.ws = null;
        this.clientId = "wayward-bridge-" + Math.random().toString(36).slice(2, 10);
        this.progress = /* @__PURE__ */ new Map();
      }
      base() {
        return String(this.getUrl() || "http://127.0.0.1:8188").replace(/\/+$/, "");
      }
      async request(p, opts = {}, timeoutMs = 15e3) {
        const res = await fetch(this.base() + p, Object.assign({ signal: AbortSignal.timeout(timeoutMs) }, opts));
        return res;
      }
      async json(p, opts, timeoutMs) {
        const res = await this.request(p, opts, timeoutMs);
        let data = null;
        try {
          data = await res.json();
        } catch (_) {
        }
        return { ok: res.ok, status: res.status, data };
      }
      async ping() {
        try {
          const r = await this.request("/system_stats", {}, 2500);
          this.online = r.ok;
        } catch (_) {
          this.online = false;
        }
        if (this.online) this.connectWs();
        return this.online;
      }
      /** What this ComfyUI can do: model lists, sampler lists and optional nodes. */
      async capabilities(force) {
        if (!force && this.caps && Date.now() - this.capsAt < 6e4) return this.caps;
        try {
          const { ok, data } = await this.json("/object_info", {}, 2e4);
          if (!ok || !data) throw new Error("object_info failed");
          const req = (node, key) => {
            const spec = (((data[node] || {}).input || {}).required || {})[key];
            return Array.isArray(spec) && Array.isArray(spec[0]) ? spec[0].map(String) : [];
          };
          const firstClass = (...names) => names.find((n) => data[n]) || "";
          this.caps = {
            models: {
              checkpoint: [.../* @__PURE__ */ new Set([...req("CheckpointLoaderSimple", "ckpt_name"), ...req("CheckpointLoader", "ckpt_name")])],
              unet: req("UNETLoader", "unet_name"),
              clip: req("CLIPLoader", "clip_name"),
              vae: req("VAELoader", "vae_name"),
              lora: [.../* @__PURE__ */ new Set([...req("LoraLoader", "lora_name"), ...req("LoraLoaderModelOnly", "lora_name")])],
              upscale: req("UpscaleModelLoader", "model_name"),
              detector: req("UltralyticsDetectorProvider", "model_name")
            },
            samplers: req("KSampler", "sampler_name"),
            schedulers: req("KSampler", "scheduler"),
            nodes: {
              teacache: firstClass("AnimaTeaCache", "Anima TeaCache (BSS)"),
              donut: firstClass("DonutSDXLTeaCache", "DonutTeaCache"),
              easycache: firstClass("EasyCache", "EasyCacheNode"),
              // face / hand fix (ComfyUI Impact Pack + Impact Subpack)
              faceDetailer: firstClass("FaceDetailer"),
              detectorProvider: firstClass("UltralyticsDetectorProvider")
            },
            inputs: Object.fromEntries(["AnimaTeaCache", "Anima TeaCache (BSS)", "DonutSDXLTeaCache", "DonutTeaCache", "EasyCache", "EasyCacheNode", "FaceDetailer"].filter((n) => data[n]).map((n) => [n, Object.keys(Object.assign({}, (data[n].input || {}).required, (data[n].input || {}).optional))]))
          };
          this.capsAt = Date.now();
          this.capsError = "";
          this.online = true;
        } catch (e) {
          this.capsError = String(e && e.message || e);
          if (!this.caps) this.caps = null;
        }
        return this.caps;
      }
      connectWs() {
        if (this.ws || typeof WebSocket === "undefined") return;
        try {
          const url = this.base().replace(/^http/, "ws") + "/ws?clientId=" + this.clientId;
          const ws = new WebSocket(url);
          this.ws = ws;
          ws.onmessage = (ev) => {
            if (typeof ev.data !== "string") return;
            let msg;
            try {
              msg = JSON.parse(ev.data);
            } catch (_) {
              return;
            }
            if (msg.type === "progress" && msg.data && msg.data.prompt_id) this.progress.set(msg.data.prompt_id, { value: msg.data.value, max: msg.data.max });
          };
          ws.onclose = ws.onerror = () => {
            this.ws = null;
          };
        } catch (_) {
          this.ws = null;
        }
      }
      async submit(graph) {
        const { ok, status, data } = await this.json("/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: graph, client_id: this.clientId })
        }, 3e4);
        if (!ok) {
          let detail = data && data.error && (data.error.message || data.error.details) || "HTTP " + status;
          const ne = data && data.node_errors;
          if (ne && typeof ne === "object") {
            detail += " \u2014 " + Object.entries(ne).map(([id, e]) => id + " " + (e && e.class_type || "") + ": " + (e && e.errors || []).map((x) => x.details || x.message).join("; ")).join(" | ");
          }
          throw new Error("ComfyUI refused the workflow: " + detail);
        }
        return data.prompt_id;
      }
      /** Wait for the first saved image of a prompt. */
      async waitForImage(promptId, timeoutMs, isCancelled) {
        const deadline = Date.now() + timeoutMs;
        let delay = 250;
        while (Date.now() < deadline) {
          if (isCancelled && isCancelled()) return null;
          const { ok, data } = await this.json("/history/" + encodeURIComponent(promptId), {}, 1e4).catch(() => ({ ok: false }));
          const entry = ok && data && data[promptId];
          if (entry) {
            if (entry.status && entry.status.status_str === "error") {
              if (isCancelled && isCancelled()) return null;
              const msgs = (entry.status.messages || []).map((m) => m && m[1] && (m[1].exception_message || m[1].message) || "").filter(Boolean).join("; ");
              throw new Error("ComfyUI failed while drawing: " + (msgs || "unknown error"));
            }
            const imgs = Object.values(entry.outputs || {}).flatMap((node) => node.images || []).filter((x) => x && x.filename);
            const img = imgs.find((x) => (x.type || "output") === "output") || imgs[0];
            if (img) return img;
            if (entry.status && entry.status.completed) throw new Error("ComfyUI finished without a picture (the workflow needs a Save Image node).");
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(1e3, delay + 150);
        }
        throw new Error("ComfyUI did not finish within " + Math.round(timeoutMs / 1e3) + "s");
      }
      /** Put a picture into ComfyUI's input folder (for image-to-video). Returns its name there. */
      async upload(buf, name) {
        const form = new FormData();
        form.append("image", new Blob([buf], { type: "image/png" }), name);
        form.append("overwrite", "true");
        const res = await this.request("/upload/image", { method: "POST", body: form }, 6e4);
        if (!res.ok) throw new Error("ComfyUI did not accept the picture upload (HTTP " + res.status + ")");
        const j = await res.json().catch(() => ({}));
        return j.subfolder ? j.subfolder + "/" + j.name : j.name || name;
      }
      /** Wait for the first output of a prompt of any kind (images, gifs, videos). */
      async waitForOutput(promptId, timeoutMs, isCancelled) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          if (isCancelled && isCancelled()) return null;
          const { ok, data } = await this.json("/history/" + encodeURIComponent(promptId), {}, 1e4).catch(() => ({ ok: false }));
          const entry = ok && data && data[promptId];
          if (entry) {
            if (entry.status && entry.status.status_str === "error") {
              const msgs = (entry.status.messages || []).map((m) => m && m[1] && (m[1].exception_message || m[1].message) || "").filter(Boolean).join("; ");
              if (isCancelled && isCancelled()) return null;
              throw new Error("ComfyUI failed: " + (msgs || "unknown error"));
            }
            for (const node of Object.values(entry.outputs || {})) {
              const out = (node.gifs || node.videos || node.images || [])[0];
              if (out && out.filename) return out;
            }
            if (entry.status && entry.status.completed) throw new Error("The workflow finished without saving anything (needs a Save / Video Combine node).");
          }
          await new Promise((r) => setTimeout(r, 1e3));
        }
        throw new Error("ComfyUI did not finish within " + Math.round(timeoutMs / 1e3) + "s");
      }
      async view(img) {
        const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || "", type: img.type || "output" });
        const res = await this.request("/view?" + q, {}, 3e4);
        if (!res.ok) throw new Error("Could not download the image from ComfyUI (HTTP " + res.status + ")");
        return Buffer.from(await res.arrayBuffer());
      }
      async cancel(promptId) {
        try {
          await this.json("/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: [promptId] }) });
        } catch (_) {
        }
        try {
          const { data } = await this.json("/queue");
          const running = data && data.queue_running || [];
          if (running.some((r) => r && r[1] === promptId)) await this.request("/interrupt", { method: "POST" });
        } catch (_) {
        }
      }
    };
    module2.exports = { Comfy };
  }
});

