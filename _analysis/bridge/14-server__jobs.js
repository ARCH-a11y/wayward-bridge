// src/server/jobs.js
var require_jobs = __commonJS({
  "src/server/jobs.js"(exports2, module2) {
    "use strict";
    var crypto = require("crypto");
    var Jobs = class {
      /** render(job) -> Promise<{ imagePath }> does the actual work. */
      constructor(render, onEvent) {
        this.render = render;
        this.onEvent = onEvent || (() => {
        });
        this.jobs = /* @__PURE__ */ new Map();
        this.active = 0;
        this.maxActive = 1;
        this.queue = [];
        this.batch = { items: [], total: 0, done: 0, errored: 0, paused: false, currentKey: "", lastError: "", jobId: "", startedAt: 0, times: [] };
      }
      create(req, priority) {
        const id = crypto.randomUUID();
        const job = { id, req, status: "pending", createdAt: Date.now(), priority: priority || "interactive", progress: null };
        this.jobs.set(id, job);
        this.queue.push(job);
        this.pump();
        return job;
      }
      get(id) {
        return this.jobs.get(id) || null;
      }
      /** Low-priority work ("draw ahead"): runs only when nothing else is waiting. */
      createLow(req) {
        const id = crypto.randomUUID();
        const job = { id, req, status: "pending", createdAt: Date.now(), priority: "ahead", progress: null };
        this.jobs.set(id, job);
        this.low = this.low || [];
        this.low.push(job);
        this.pump();
        return job;
      }
      /** A waiting low-priority job the game now needs: it moves into the normal queue. */
      promote(job) {
        if (!job || job.status !== "pending" || !this.low || !this.low.includes(job)) return;
        this.low = this.low.filter((j) => j !== job);
        job.priority = "interactive";
        this.queue.push(job);
        this.pump();
      }
      /** An interactive job for this picture key that is still waiting or drawing. */
      activeFor(key) {
        for (const j of this.jobs.values()) if (j.priority === "interactive" && j.req && j.req.talentId === key && !j.req.bypassCache && !j.req.saveTo && (j.status === "pending" || j.status === "processing")) return j;
        return null;
      }
      cancel(id) {
        const job = this.jobs.get(id);
        if (!job) return false;
        job.cancelled = true;
        if (job.status === "pending") {
          job.status = "error";
          job.error = "cancelled";
          this.queue = this.queue.filter((j) => j !== job);
          if (this.low) this.low = this.low.filter((j) => j !== job);
        }
        if (job.onCancel) job.onCancel();
        return true;
      }
      enqueueBatch(items, jobId, start) {
        if (!this.batch.jobId || this.batch.jobId !== jobId) {
          if (!jobId) this.batch = Object.assign(this.batch, { items: [], total: 0, done: 0, errored: 0, jobId: crypto.randomUUID(), startedAt: Date.now(), times: [], lastError: "" });
        }
        this.batch.items.push(...items);
        this.batch.total += items.length;
        if (start) this.batch.paused = false;
        this.pump();
        return this.batch.jobId;
      }
      batchControl(action) {
        if (action === "pause") this.batch.paused = true;
        else if (action === "resume") {
          this.batch.paused = false;
          this.pump();
        } else if (action === "clear") {
          this.batch.items = [];
          this.batch.total = this.batch.done;
        }
        return this.batchStatus();
      }
      batchStatus() {
        const b = this.batch;
        const avg = b.times.length ? b.times.reduce((x, y) => x + y, 0) / b.times.length : null;
        const left = b.items.length;
        return {
          running: !b.paused && (left > 0 || !!b.currentKey),
          paused: b.paused,
          done: b.done,
          total: b.total,
          errored: b.errored,
          etaSeconds: avg == null ? null : Math.round(avg * left / 1e3),
          currentKey: b.currentKey,
          lastError: b.lastError
        };
      }
      pump() {
        while (this.active < this.maxActive) {
          let job = this.queue.shift();
          if (!job && !this.batch.paused && this.batch.items.length) {
            const item = this.batch.items.shift();
            job = { id: crypto.randomUUID(), req: item, status: "pending", priority: "batch", createdAt: Date.now() };
            this.jobs.set(job.id, job);
            this.batch.currentKey = item.talentId || "";
          }
          if (!job && this.low && this.low.length) job = this.low.shift();
          if (!job) return;
          this.run(job);
        }
      }
      async run(job) {
        this.active++;
        job.status = "processing";
        job.startedAt = Date.now();
        this.onEvent({ type: "job", id: job.id, key: job.req.talentId, status: "processing" });
        try {
          const r = await this.render(job);
          if (job.cancelled) {
            job.status = "error";
            job.error = "cancelled";
          } else {
            Object.assign(job, r || {});
            job.status = "completed";
          }
        } catch (e) {
          job.status = "error";
          job.error = String(e && e.message || e);
          console.warn("[bridge] image failed", job.req.talentId, "-", job.error);
        }
        job.finishedAt = Date.now();
        if (job.priority === "batch") {
          const b = this.batch;
          if (job.status === "completed") {
            b.done++;
            b.times.push(job.finishedAt - job.startedAt);
            if (b.times.length > 20) b.times.shift();
          } else {
            b.errored++;
            b.done++;
            b.lastError = job.error;
          }
          b.currentKey = "";
        }
        this.onEvent({ type: "job", id: job.id, key: job.req.talentId, status: job.status, error: job.error });
        this.active--;
        this.sweep();
        this.pump();
      }
      sweep() {
        const cutoff = Date.now() - 15 * 60 * 1e3;
        for (const [id, j] of this.jobs) if (j.finishedAt && j.finishedAt < cutoff) this.jobs.delete(id);
      }
      /** Everything waiting or drawing, oldest first (for the queue panel). */
      activeJobs() {
        const out = [];
        for (const j of this.jobs.values()) if (j.status === "pending" || j.status === "processing") out.push(j);
        return out.sort((a, b) => (a.status === "processing" ? -1 : 0) - (b.status === "processing" ? -1 : 0) || a.createdAt - b.createdAt);
      }
      counts() {
        let processing = 0, pending = this.queue.length;
        for (const j of this.jobs.values()) if (j.status === "processing") processing++;
        return { processing, pending, batchLeft: this.batch.items.length };
      }
    };
    module2.exports = { Jobs };
  }
});

