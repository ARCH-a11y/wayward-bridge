// src/server/media.js
var require_media = __commonJS({
  "src/server/media.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var os = require("os");
    var path = require("path");
    var { spawn, execSync } = require("child_process");
    var IMG_RE = /\.(png|jpe?g|webp|gif)$/i;
    var seg = (s, fb) => String(s || "").replace(/[^a-zA-Z0-9_\-]+/g, "_").slice(0, 80) || fb || "unknown";
    var Media = class {
      constructor(getApp, dataDir) {
        this.getApp = getApp;
        this.dataDir = dataDir;
      }
      /** ComfyUI's output folder, when it is set and really there (else the data folder is used). */
      outDir() {
        const o = String(this.getApp().comfyOutputDir || "").trim();
        try {
          return o && path.isAbsolute(o) && fs.statSync(o).isDirectory() ? o : "";
        } catch (_) {
          return "";
        }
      }
      savedRoot() {
        const o = this.outDir();
        return o ? path.join(o, "saved-scenes") : path.join(this.dataDir, "saved-scenes");
      }
      gifDir() {
        const o = this.outDir();
        return o ? path.join(o, "GIFs") : path.join(this.dataDir, "GIFs");
      }
      /** Folder names for a picture key, as the old mod named them. */
      variation(parsed, heroine) {
        const scene = parsed.scene || (parsed.lookFocus ? "look_" + parsed.lookFocus : "") || (parsed.task ? "task_" + parsed.task : "");
        return { heroine: seg(heroine, "pippa"), scene: seg(scene), outfit: seg(parsed.outfit || "modest"), room: seg(parsed.room || "taproom"), mood: seg(parsed.mood || "shy") };
      }
      variationDir(v) {
        return path.join(this.savedRoot(), v.heroine, v.scene, v.outfit, v.room, v.mood);
      }
      save(buf, ext, parsed, heroine) {
        const v = this.variation(parsed, heroine);
        const dir = this.variationDir(v);
        fs.mkdirSync(dir, { recursive: true });
        const name = freeName(dir, [v.heroine, v.scene, v.outfit, v.room, v.mood, Date.now()].join("-"), ext || ".png");
        fs.writeFileSync(path.join(dir, name), buf);
        return { rel: path.relative(this.savedRoot(), path.join(dir, name)).split(path.sep).join("/"), v };
      }
      // ---- favourites (starred saved pictures): saved-scenes/.favourites.json { rel: true }
      favFile() {
        return path.join(this.savedRoot(), ".favourites.json");
      }
      favs() {
        const f = this.favFile();
        let m = 0;
        try {
          m = fs.statSync(f).mtimeMs;
        } catch (_) {
          return {};
        }
        if (this._favs && this._favs.f === f && this._favs.m === m) return Object.assign({}, this._favs.v);
        let v = {};
        try {
          v = JSON.parse(fs.readFileSync(f, "utf8")) || {};
        } catch (_) {
        }
        this._favs = { f, m, v };
        return Object.assign({}, v);
      }
      setFav(rel, on) {
        const f = this.favs();
        if (on) f[rel] = true;
        else delete f[rel];
        fs.mkdirSync(this.savedRoot(), { recursive: true });
        fs.writeFileSync(this.favFile(), JSON.stringify(f, null, 1));
        this._favs = null;
      }
      /** Heroines that have saved pictures, with how many. */
      heroines() {
        let names = [];
        try {
          names = fs.readdirSync(this.savedRoot());
        } catch (_) {
          return [];
        }
        return names.filter((n) => !n.startsWith(".")).map((n) => ({ heroine: n, count: listDeep(path.join(this.savedRoot(), n)).length })).filter((x) => x.count);
      }
      /** Every saved picture of one scene of a heroine, with its outfit / room / mood. */
      browse(heroine, scene) {
        const dir = path.join(this.savedRoot(), seg(heroine, "pippa"), seg(scene));
        const favs = this.favs();
        return listDeep(dir).map((fp) => {
          const rel = path.relative(this.savedRoot(), fp).split(path.sep).join("/");
          const parts = rel.split("/");
          let at = 0;
          try {
            at = fs.statSync(fp).mtimeMs;
          } catch (_) {
          }
          return { rel, outfit: parts[2] || "", room: parts[3] || "", mood: parts[4] || "", fav: !!favs[rel], at };
        }).sort((a, b) => b.fav - a.fav || a.rel.localeCompare(b.rel));
      }
      remove(rel) {
        const fp = this.filePath(rel);
        if (!fp || !IMG_RE.test(fp) || !fs.existsSync(fp)) return false;
        fs.rmSync(fp, { force: true });
        if (this.favs()[rel]) this.setFav(rel, false);
        return true;
      }
      /** Move a saved picture to another outfit / room / mood folder of the same scene. */
      move(rel, to) {
        const fp = this.filePath(rel);
        if (!fp || !IMG_RE.test(fp) || !fs.existsSync(fp)) throw new Error("That saved picture is gone.");
        const parts = rel.split("/");
        if (parts.length < 6) throw new Error("Not a saved scene picture.");
        const v = { heroine: parts[0], scene: parts[1], outfit: seg(to.outfit || parts[2]), room: seg(to.room || parts[3]), mood: seg(to.mood || parts[4]) };
        const dir = this.variationDir(v);
        fs.mkdirSync(dir, { recursive: true });
        const name = freeName(dir, [v.heroine, v.scene, v.outfit, v.room, v.mood, Date.now()].join("-"), path.extname(fp));
        const dest = path.join(dir, name);
        fs.renameSync(fp, dest);
        const nrel = path.relative(this.savedRoot(), dest).split(path.sep).join("/");
        if (this.favs()[rel]) {
          this.setFav(rel, false);
          this.setFav(nrel, true);
        }
        let d = path.dirname(fp);
        for (let i = 0; i < 3; i++) {
          try {
            if (!fs.readdirSync(d).length) {
              fs.rmdirSync(d);
              d = path.dirname(d);
            } else break;
          } catch (_) {
            break;
          }
        }
        return nrel;
      }
      /** How many saved pictures one outfit / room / mood combination has (for "fill gaps"). */
      countFor(parsed, heroine) {
        return listFiles(this.variationDir(this.variation(parsed, heroine))).length;
      }
      /** A saved picture for this key: same outfit/room/mood first, else any of the scene. */
      pick(parsed, heroine) {
        if (!parsed || parsed.kind === "patron") return null;
        const v = this.variation(parsed, heroine);
        if (v.scene === "unknown") return null;
        let files = listFiles(this.variationDir(v));
        if (!files.length) files = listDeep(path.join(this.savedRoot(), v.heroine, v.scene));
        if (!files.length) return null;
        const favs = this.favs();
        const relOf = (fp2) => path.relative(this.savedRoot(), fp2).split(path.sep).join("/");
        const weights = files.map((fp2) => favs[relOf(fp2)] ? 4 : 1);
        let r = Math.random() * weights.reduce((a, b) => a + b, 0), fp = files[files.length - 1];
        for (let i = 0; i < files.length; i++) {
          r -= weights[i];
          if (r < 0) {
            fp = files[i];
            break;
          }
        }
        return { fp, rel: relOf(fp) };
      }
      /** Every saved picture of this key's scene: same outfit/room/mood first (oldest first), then the rest. */
      list(parsed, heroine) {
        if (!parsed || parsed.kind === "patron") return [];
        const v = this.variation(parsed, heroine);
        if (v.scene === "unknown") return [];
        const rel = (fp) => path.relative(this.savedRoot(), fp).split(path.sep).join("/");
        const exact = listFiles(this.variationDir(v)).sort();
        const have = new Set(exact);
        const rest = listDeep(path.join(this.savedRoot(), v.heroine, v.scene)).filter((fp) => !have.has(fp)).sort();
        const favs = this.favs();
        return [...exact.map((fp) => ({ rel: rel(fp), exact: true, fav: !!favs[rel(fp)] })), ...rest.map((fp) => ({ rel: rel(fp), exact: false, fav: !!favs[rel(fp)] }))];
      }
      filePath(rel) {
        const root = path.resolve(this.savedRoot());
        const fp = path.resolve(root, rel);
        return fp.startsWith(root + path.sep) ? fp : null;
      }
      scenes(heroine) {
        const dir = path.join(this.savedRoot(), seg(heroine, "pippa"));
        const out = [];
        let names = [];
        try {
          names = fs.readdirSync(dir);
        } catch (_) {
          return out;
        }
        for (const n of names) {
          const fp = path.join(dir, n);
          try {
            if (!fs.statSync(fp).isDirectory()) continue;
          } catch (_) {
            continue;
          }
          const count = listDeep(fp).length;
          if (count) out.push({ scene: n, count });
        }
        return out.sort((a, b) => a.scene.localeCompare(b.scene));
      }
      clear(heroine, scene, filters) {
        const h = seg(heroine, "pippa");
        if (!scene) {
          let n2 = 0;
          for (const s of this.scenes(h)) n2 += this.clear(h, s.scene);
          return n2;
        }
        filters = filters || {};
        let dir = path.join(this.savedRoot(), h, seg(scene));
        const want = [filters.outfit, filters.room, filters.mood].map((x) => x ? seg(x) : "");
        let n = 0;
        const walk = (d, depth) => {
          if (depth === 3) {
            n += deleteTree(d);
            return;
          }
          let names = [];
          try {
            names = fs.readdirSync(d);
          } catch (_) {
            return;
          }
          for (const name of names) {
            const fp = path.join(d, name);
            let st;
            try {
              st = fs.statSync(fp);
            } catch (_) {
              continue;
            }
            if (!st.isDirectory()) {
              if (!want.some(Boolean) && IMG_RE.test(name)) {
                fs.rmSync(fp, { force: true });
                n++;
              }
              continue;
            }
            if (want[depth] && want[depth] !== name) continue;
            walk(fp, depth + 1);
          }
          try {
            if (!fs.readdirSync(d).length) fs.rmdirSync(d);
          } catch (_) {
          }
        };
        walk(dir, 0);
        return n;
      }
      // ------------------------------------------------------------ ffmpeg
      /** Where ffmpeg is (remembered for a minute: looking it up on PATH can take seconds and blocks). */
      ffmpeg() {
        const conf = String(this.getApp().ffmpegPath || "").trim().replace(/^['"]|['"]$/g, "");
        const c = this._ff;
        if (c && c.conf === conf && Date.now() - c.at < 6e4) return c.bin;
        const bin = this.findFfmpeg(conf);
        this._ff = { conf, bin, at: Date.now() };
        return bin;
      }
      findFfmpeg(conf) {
        const cand = [];
        if (conf) cand.push(conf);
        if (process.env.FFMPEG) cand.push(process.env.FFMPEG);
        if (process.env.FFMPEG_PATH) cand.push(process.env.FFMPEG_PATH);
        const pf = process.env.ProgramFiles || "C:\\Program Files";
        cand.push(path.join(pf, "ffmpeg", "bin", "ffmpeg.exe"), "C:\\ffmpeg\\bin\\ffmpeg.exe", "C:\\ffmpeg\\ffmpeg.exe");
        const local = process.env.LOCALAPPDATA;
        if (local) cand.push(path.join(local, "Microsoft", "WinGet", "Links", "ffmpeg.exe"));
        const home = process.env.USERPROFILE || process.env.HOME;
        if (home) cand.push(path.join(home, "scoop", "shims", "ffmpeg.exe"));
        for (const c of cand) {
          try {
            const st = fs.statSync(c);
            if (st.isFile()) return c;
            if (st.isDirectory()) {
              for (const h of ["ffmpeg.exe", "ffmpeg", "bin/ffmpeg.exe", "bin/ffmpeg"]) if (fs.existsSync(path.join(c, h))) return path.join(c, h);
            }
          } catch (_) {
          }
        }
        try {
          const out = execSync(process.platform === "win32" ? "where ffmpeg" : "command -v ffmpeg", { encoding: "utf8", timeout: 4e3, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
          const line = out.split(/\r?\n/).map((x) => x.trim()).find(Boolean);
          if (line && fs.existsSync(line)) return line;
        } catch (_) {
        }
        return "";
      }
      runFfmpeg(args) {
        const bin = this.ffmpeg();
        if (!bin) return Promise.reject(new Error("ffmpeg not found. Set Config \u2192 ffmpeg path to the full ffmpeg.exe file."));
        return new Promise((resolve, reject) => {
          const child = spawn(bin, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
          let err = "";
          child.stderr.on("data", (d) => {
            err += d;
            if (err.length > 2e4) err = err.slice(-8e3);
          });
          child.on("error", reject);
          child.on("close", (code) => code === 0 ? resolve() : reject(new Error("ffmpeg: " + (err.trim().split("\n").slice(-3).join(" ") || "exit " + code))));
        });
      }
      /** Any video or GIF -> looping GIF at `fps`, `seconds` long. */
      async toGif(buf, ext, fps, seconds) {
        const id = "wb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
        const src = path.join(os.tmpdir(), id + (ext || ".mp4"));
        const dst = path.join(os.tmpdir(), id + "-out.gif");
        fs.writeFileSync(src, buf);
        try {
          await this.runFfmpeg(["-y", "-i", src, "-t", String(seconds), "-vf", "fps=" + fps + ",scale=trunc(iw/2)*2:trunc(ih/2)*2,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0", dst]);
          const out = fs.readFileSync(dst);
          if (out.slice(0, 3).toString("ascii") !== "GIF") throw new Error("ffmpeg did not write a GIF");
          return out;
        } finally {
          fs.rmSync(src, { force: true });
          fs.rmSync(dst, { force: true });
        }
      }
      /**
       * Picture -> GIF with ComfyUI's image-to-video (WAN 2.2, as in the old mod).
       * opts: { comfy, buf, prompt, negative, fps, seconds, workflowDir, isCancelled }
       */
      async makeGif(opts) {
        const { comfy } = opts;
        const fps = Math.max(1, Math.min(30, Number(opts.fps) || 8));
        const seconds = Math.max(1, Math.min(10, Number(opts.seconds) || 3));
        const graph = loadI2V(opts.workflowDir);
        const name = await comfy.upload(opts.buf, "wayward_i2v_" + Date.now() + ".png");
        const ff = !!this.ffmpeg();
        const dims = pngSize(opts.buf);
        const nodes = Object.entries(graph);
        const byClass = (re) => nodes.filter(([, n]) => n && re.test(String(n.class_type || "")));
        for (const [, n] of byClass(/^LoadImage$/)) n.inputs.image = name;
        for (const [, n] of byClass(/ImageToVideo/i)) {
          const nIn = n.inputs;
          if ("length" in nIn) nIn.length = Math.round(seconds * 16 / 4) * 4 + 1;
          if (dims && "width" in nIn && "height" in nIn) {
            const budget = (Number(nIn.width) || 400) * (Number(nIn.height) || 608);
            const k = Math.sqrt(budget / (dims.w * dims.h));
            nIn.width = Math.max(128, Math.round(dims.w * k / 16) * 16);
            nIn.height = Math.max(128, Math.round(dims.h * k / 16) * 16);
          }
          const setText = (ref, text) => {
            const t = Array.isArray(ref) && graph[ref[0]];
            if (t && t.inputs && "text" in t.inputs && text != null) t.inputs.text = text;
          };
          setText(nIn.positive, opts.prompt);
          if (opts.negative) setText(nIn.negative, opts.negative);
        }
        for (const [, n] of byClass(/KSampler/)) {
          if ("noise_seed" in n.inputs && n.inputs.add_noise !== "disable") n.inputs.noise_seed = Math.floor(Math.random() * 1e15);
          if ("seed" in n.inputs) n.inputs.seed = Math.floor(Math.random() * 1e15);
        }
        for (const [, n] of byClass(/VideoCombine/i)) {
          n.inputs.format = "image/gif";
          n.inputs.frame_rate = ff ? 16 : fps;
          n.inputs.filename_prefix = "GIFs/wayward";
          n.inputs.loop_count = 0;
        }
        const id = await comfy.submit(graph);
        const out = await comfy.waitForOutput(id, 30 * 60 * 1e3, opts.isCancelled);
        if (!out) throw new Error("cancelled");
        const buf = await comfy.view(out);
        const ext = path.extname(out.filename || "").toLowerCase();
        let gif;
        if (buf.slice(0, 3).toString("ascii") === "GIF") gif = ff ? await this.toGif(buf, ".gif", fps, seconds) : buf;
        else if (ff) gif = await this.toGif(buf, ext || ".mp4", fps, seconds);
        else throw new Error("The workflow made a video, and turning it into a GIF needs ffmpeg (Config \u2192 ffmpeg path).");
        try {
          fs.mkdirSync(this.gifDir(), { recursive: true });
          fs.writeFileSync(path.join(this.gifDir(), "wayward_" + Date.now() + ".gif"), gif);
        } catch (_) {
        }
        return gif;
      }
    };
    function freeName(dir, stem, ext) {
      let name = stem + ext, n = 2;
      while (fs.existsSync(path.join(dir, name))) name = stem + "-" + n++ + ext;
      return name;
    }
    function listFiles(dir) {
      try {
        return fs.readdirSync(dir).filter((n) => IMG_RE.test(n)).map((n) => path.join(dir, n));
      } catch (_) {
        return [];
      }
    }
    function listDeep(dir) {
      const out = [];
      let names = [];
      try {
        names = fs.readdirSync(dir);
      } catch (_) {
        return out;
      }
      for (const n of names) {
        const fp = path.join(dir, n);
        let st;
        try {
          st = fs.statSync(fp);
        } catch (_) {
          continue;
        }
        if (st.isDirectory()) out.push(...listDeep(fp));
        else if (IMG_RE.test(n)) out.push(fp);
      }
      return out;
    }
    function deleteTree(dir) {
      let n = 0;
      let names = [];
      try {
        names = fs.readdirSync(dir);
      } catch (_) {
        return 0;
      }
      for (const name of names) {
        const fp = path.join(dir, name);
        let st;
        try {
          st = fs.statSync(fp);
        } catch (_) {
          continue;
        }
        if (st.isDirectory()) n += deleteTree(fp);
        else {
          try {
            fs.unlinkSync(fp);
            n++;
          } catch (_) {
          }
        }
      }
      try {
        fs.rmdirSync(dir);
      } catch (_) {
      }
      return n;
    }
    function pngSize(buf) {
      if (buf && buf.length > 24 && buf.readUInt32BE(0) === 2303741511) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
      return null;
    }
    function loadI2V(workflowDir) {
      for (const n of ["gif.json", "i2v.json", "wan2.2_img2vid_gguf.json"]) {
        const fp = workflowDir && path.join(workflowDir, n);
        if (fp && fs.existsSync(fp)) {
          try {
            return JSON.parse(fs.readFileSync(fp, "utf8"));
          } catch (e) {
            throw new Error("Workflow " + n + " is not valid JSON: " + e.message);
          }
        }
      }
      return JSON.parse(JSON.stringify(require_wan_i2v()));
    }
    module2.exports = { Media, pngSize };
  }
});

