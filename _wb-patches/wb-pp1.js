// wb-pp1.js — роут превью части тела
const fs = require('fs');
const F = 'src/024-src_server_index.js';
const V = 'wb-verify.js';
let t = fs.readFileSync(F, 'utf8');
let v = fs.readFileSync(V, 'utf8');

const a1 = `    var genAll = { running: false, stop: false, total: 0, done: 0, failed: 0, skipped: 0, message: "", startedAt: 0, etaMs: 0, heroine: "" };`;
const add1 = `    var PART_FOCUS = {
      base: "full body",
      head: "portrait, face focus",
      mouth: "portrait, close-up, mouth focus",
      body: "full body",
      breasts: "upper body, breasts focus",
      ass: "from behind, ass focus",
      vagina: "nude, pussy focus, close-up",
      misc: "full body"
    };
    async function partPreview(b) {
      const heroine = String(b && b.heroine || currentHeroine());
      const part = String(b && b.part || "body");
      const tags = String(b && b.tags || "").trim();
      if (!tags) return { ok: false, error: "This part has no words to draw." };
      const pipe = resolvePipeline(store.effective(heroine).pipeline);
      if (!await comfy.ping()) return { ok: false, error: explainComfyError("fetch failed", pipe) };
      const caps = await comfy.capabilities(true);
      const positive = [pipe.quality, "1girl, solo, simple background", PART_FOCUS[part] || "", tags].filter(Boolean).join(", ");
      const negative = String(b && b.negative || pipe.negative || "");
      try {
        const { graph } = buildGraph({ p: pipe, caps, positive, negative, seed: Date.now() % 1e9, width: 512, height: 640, portrait: true, noHires: true, noDetail: true, prefix: "wayward/part-preview", workflowDir: path.join(DATA_DIR, "workflows") });
        const id = await comfy.submit(graph);
        const img = await comfy.waitForImage(id, 5 * 60 * 1e3);
        if (!img) return { ok: false, error: "Cancelled." };
        const buf = await comfy.view(img);
        return { ok: true, image: "data:image/" + (path.extname(img.filename || ".png").slice(1) || "png") + ";base64," + buf.toString("base64") };
      } catch (e) {
        return { ok: false, error: explainComfyError(e.message, pipe, caps), raw: e.message };
      }
    }
${a1}`;

const a2 = `      if (p === "/bridge/api/test-pipeline" && m === "POST") return send(res, 200, await testPipeline(await readJson(req)));`;
const add2 = `${a2}
      if (p === "/bridge/api/part-preview" && m === "POST") return send(res, 200, await partPreview(await readJson(req)));`;

for (const [from, to, name] of [[a1, add1, 'функция'], [a2, add2, 'роут']]) {
  const n = t.split(from).length - 1;
  if (n !== 1) { console.log('MISS ' + name + ': ' + n + ', не записано'); process.exit(1); }
  t = t.replace(from, to);
  console.log('ok ' + name);
}
fs.writeFileSync(F, t, 'utf8');

const vm = `  ["B40 HANDLED_API", "const HANDLED_API = new Set([", 1],`;
const vn = v.split(vm).length - 1;
if (vn !== 1) { console.log('MISS verify HANDLED_API: ' + vn); process.exit(1); }
v = v.replace(vm, vm + `\n  ["P1 превью части: функция", "async function partPreview(b)", 1],\n  ["P1 превью части: роут", "/bridge/api/part-preview", 2],\n  ["P1 превью части: фокус", "var PART_FOCUS = {", 1],`);
fs.writeFileSync(V, v, 'utf8');
console.log('ok verify: маркеры');
console.log('partPreview: ' + (fs.readFileSync(F, 'utf8').split('partPreview').length - 1));