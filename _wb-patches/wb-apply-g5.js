// wb-apply-g5.js — G5: портреты детей (промпт по генам, роут, карточка, маркеры)
const fs = require("fs");
const S = "src/";
const F_LOOKS = S + "026-src_server_looks.js";
const F_CHILD = S + "025-src_server_childstate.js";
const F_INDEX = S + "024-src_server_index.js";
const F_CLIENT = S + "019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 170));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. looks.portraitPrompt ==");
rep(F_LOOKS,
  "    module2.exports = { random: random,",
  '    var AGE_TAGS = {\n' +
  '      infant: "baby, 1 year old, chubby cheeks, big round eyes",\n' +
  '      child: "child, 7 years old",\n' +
  '      teen: "teenager, 14 years old",\n' +
  '      youth: "young adult",\n' +
  '      adult: "adult"\n' +
  '    };\n' +
  '    // промпт портрета ребёнка: пол, возрастная стадия и его гены\n' +
  '    function portraitPrompt(look, opts) {\n' +
  '      opts = opts || {};\n' +
  '      var sex = opts.sex === "m" ? "m" : "f";\n' +
  '      var stage = opts.stage || "child";\n' +
  '      var t = [];\n' +
  '      t.push("masterpiece, best quality, " + (sex === "f" ? "1girl" : "1boy") + ", solo, portrait, upper body, looking at viewer");\n' +
  '      t.push(AGE_TAGS[stage] || AGE_TAGS.child);\n' +
  '      var d = describe(look, stage, sex);\n' +
  '      if (d) t.push(d);\n' +
  '      t.push("medieval tavern interior background, warm candlelight, soft focus");\n' +
  '      return { positive: t.join(", "), negative: "lowres, bad anatomy, bad hands, extra fingers, fewer fingers, text, watermark, signature, blurry, worst quality, low quality" };\n' +
  '    }\n' +
  '    module2.exports = { random: random,',
  "looks.portraitPrompt", "function portraitPrompt(");

rep(F_LOOKS,
  "describe: describe, SCALE: SCALE, FREE: FREE };",
  "describe: describe, portraitPrompt: portraitPrompt, SCALE: SCALE, FREE: FREE };",
  "экспорт portraitPrompt", "portraitPrompt: portraitPrompt");

console.log("== 2. childstate: imagePrompt / setImage ==");
rep(F_CHILD,
  "    module2.exports = { empty: empty,",
  '    function childById(s, id) {\n' +
  '      for (var i = 0; i < s.children.length; i++) if (s.children[i].id === id) return s.children[i];\n' +
  '      return null;\n' +
  '    }\n\n' +
  '    // промпт портрета: ключ child_<id>, гены и стадия ребёнка\n' +
  '    function imagePrompt(dir, pt, childId) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var c = childById(s, childId);\n' +
  '      if (!c) return null;\n' +
  '      var p = looks.portraitPrompt(c.look, { sex: c.sex, stage: c.stage });\n' +
  '      return { key: "child_" + c.id, positive: p.positive, negative: p.negative, sex: c.sex, stage: c.stage };\n' +
  '    }\n\n' +
  '    function setImage(dir, pt, childId, rec) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var c = childById(s, childId);\n' +
  '      if (!c) return null;\n' +
  '      c.img = rec;\n' +
  '      save(dir, s);\n' +
  '      return s;\n' +
  '    }\n\n' +
  '    module2.exports = { empty: empty,',
  "childstate.imagePrompt/setImage", "function imagePrompt(");

rep(F_CHILD,
  "rerollLook: rerollLook };",
  "rerollLook: rerollLook, imagePrompt: imagePrompt, setImage: setImage };",
  "экспорт childstate", "imagePrompt: imagePrompt");

console.log("== 3. index.js: require / noBelly / роут ==");
rep(F_INDEX,
  "rerollLook: childstateReroll } = require_childstate();",
  "rerollLook: childstateReroll, imagePrompt: childstateImagePrompt, setImage: childstateSetImage } = require_childstate();",
  "require childstate", "childstateImagePrompt");

rep(F_INDEX,
  "      const child = childstatePrompt(store.dataDir);",
  "      const child = req.noBelly ? null : childstatePrompt(store.dataDir);",
  "флаг noBelly", "req.noBelly ? null : childstatePrompt");

(function route() {
  let src = rd(F_INDEX);
  if (src.indexOf('"/bridge/api/childstate/image"') >= 0) { console.log("  = уже: роут портрета"); return; }
  const a = src.indexOf("childstateReroll(store.dataDir");
  if (a < 0) throw new Error("НЕ НАЙДЕН вызов childstateReroll");
  const close = src.indexOf("\n      }\n", a);
  if (close < 0) throw new Error("НЕ НАЙДЕН конец блока reroll");
  const at = close + "\n      }\n".length;
  const code = '' +
'      if (p === "/bridge/api/childstate/image" && m === "POST") {\n' +
'        const body = await readJson(req);\n' +
'        const pt = String(body.playthrough || "");\n' +
'        const id = String(body.childId || "");\n' +
'        const ip = childstateImagePrompt(store.dataDir, pt, id);\n' +
'        if (!ip) return send(res, 404, { error: "Нет такого ребёнка." });\n' +
'        if (body.wait && !comfy.online) return send(res, 503, { error: "ComfyUI выключен." });\n' +
'        const job = jobs.create({ talentId: ip.key, prompt: ip.positive, negativePrompt: ip.negative, width: 512, height: 512, bypassCache: true, noBelly: true, seed: body.seed }, "interactive");\n' +
'        if (!body.wait) return send(res, 200, { ok: true, id: job.id, key: ip.key });\n' +
'        await waitFor(job, 10 * 60 * 1e3);\n' +
'        if (job.status !== "completed") return send(res, 500, { error: job.error || "Не удалось нарисовать портрет." });\n' +
'        const e = library.latest(ip.key);\n' +
'        if (!e) return send(res, 500, { error: "Картинка не сохранилась." });\n' +
'        const cs = childstateSetImage(store.dataDir, pt, id, { file: e.file, url: "/images/wb/" + e.file.split("/").map(encodeURIComponent).join("/"), at: Date.now(), seed: e.seed, prompt: e.prompt });\n' +
'        return send(res, 200, { ok: true, image: "/images/wb/" + e.file, state: withChildLook(cs) });\n' +
'      }\n';
  wr(F_INDEX, src.slice(0, at) + code + src.slice(at));
  console.log("  + роут /bridge/api/childstate/image");
})();

console.log("== 4. клиент: кнопка и картинка в карточке ==");
rep(F_CLIENT,
  'say("Внешность переброшена"); render(); }); } }, "↻")),',
  'say("Внешность переброшена"); render(); }); } }, "↻"), h("button", { type: "button", class: "link", title: "Нарисовать портрет", onclick: function() { say("Рисую портрет…"); api("POST", "/bridge/api/childstate/image", { playthrough: pt, childId: c.id, wait: true }).then(function(j) { if (j && j.state) S.st.childstate = j.state; say(j && j.error ? j.error : "Портрет готов"); render(); }); } }, "портрет")),',
  "кнопка портрета", "Нарисовать портрет");

rep(F_CLIENT,
  '+ (c.lookText ? " — " + c.lookText : "")));',
  '+ (c.lookText ? " — " + c.lookText : "")), c.img && c.img.url ? h("img", { src: c.img.url, style: "display:block;width:100%;border-radius:6px;margin-top:4px" }) : null);',
  "картинка в карточке", "c.img && c.img.url");

console.log("== 5. маркеры verify ==");
(function verify() {
  let src = rd(F_VERIFY);
  if (src.indexOf("G5: промпт портрета ребёнка") >= 0) { console.log("  = уже: маркеры"); return; }
  const m = src.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS в wb-verify.js");
  const at = m.index + m[0].length;
  const code = "\n" + [
    '  ["G5: промпт портрета ребёнка", "function portraitPrompt(", 1],',
    '  ["G5: imagePrompt ребёнка", "function imagePrompt(dir, pt, childId)", 1],',
    '  ["G5: роут портрета ребёнка", "/bridge/api/childstate/image", 1],',
    '  ["G5: noBelly в planRender", "req.noBelly ? null : childstatePrompt", 1],',
    '  ["G5: img в карточке ребёнка", "c.img && c.img.url", 1],',
    '  ["G5: кнопка портрета", "Нарисовать портрет", 1]'
  ].join("\n");
  wr(F_VERIFY, src.slice(0, at) + code + src.slice(at));
  console.log("  + 6 маркеров");
})();

console.log("\n== формат wb-test.js (для тестов G5) ==");
{
  const L = rd("wb-test.js").split(/\r?\n/);
  console.log("--- первые 40 ---");
  console.log(L.slice(0, 40).map((l, i) => String(i + 1).padStart(4) + ": " + l.slice(0, 150)).join("\n"));
  console.log("--- последние 45 ---");
  console.log(L.slice(Math.max(0, L.length - 45)).map((l, i) => String(Math.max(0, L.length - 45) + i + 1).padStart(4) + ": " + l.slice(0, 150)).join("\n"));
}
console.log("\nГОТОВО. Дальше: node build.js && node wb-verify.js");