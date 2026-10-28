const fs=require('fs');
const f='src/024-src_server_index.js';
let s=fs.readFileSync(f,'utf8');
function sub(a,b,label){
  if(!s.includes(a)){ console.log('FAIL '+label); process.exit(1); }
  s=s.replace(a,b); console.log('ok '+label);
}
const cls=[
'    var PART_WORDS = [',
'      ["breasts", ["breast", "nipple", "areola", "bust", "boob", "cleavage"]],',
'      ["ass", ["ass", "butt", "anus", "anal", "glute"]],',
'      ["vagina", ["pussy", "vagina", "labia", "clit", "pubic", "pubis", "mons", "vulva"]],',
'      ["mouth", ["lip", "mouth", "teeth", "tongue"]],',
'      ["head", ["hair", "eye", "eyebrow", "lash", "face", "nose", "ear", "freckle", "mole", "cheek", "ahoge", "bangs", "ponytail", "braid", "fringe", "iris"]],',
'      ["belly", ["belly", "pregnan", "navel", "waist"]],',
'      ["body", ["hip", "thigh", "leg", "build", "tall", "short", "slim", "curvy", "shoulder", "arm", "hand", "foot", "ankle", "calf", "muscular", "chubby", "plump", "skin"]]',
'    ];',
'    function classifyPart(tag) {',
'      const t = String(tag || "").toLowerCase();',
'      if (!t || t.indexOf(":") >= 0 || t.charAt(0) === "<") return "misc";',
'      for (const [part, words] of PART_WORDS) for (const w of words) if (t.indexOf(w) >= 0) return part;',
'      return "misc";',
'    }',
'    function partTagBuckets(heroine) {',
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const out = {};',
'      const push = (part, tag) => { if (!tag) return; (out[part] = out[part] || []).push(tag); };',
'      const sections = sec.sections || {};',
'      let anySection = false;',
'      for (const id of Object.keys(sections)) {',
'        const t = String((sections[id] || {}).tags || "").trim();',
'        if (!t) continue;',
'        anySection = true;',
'        t.split(",").forEach((x) => push(id, x.trim()));',
'      }',
'      const base = String(sec.base || "").trim();',
'      if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'      const res = {};',
'      for (const k of Object.keys(out)) res[k] = out[k].join(", ");',
'      return res;',
'    }'
].join('\n');
sub('    async function partPreview(b) {', cls+'\n    async function partPreview(b) {', 'классификатор');
sub([
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const secPart = ((sec.sections || {})[part]) || {};',
'      const partTags = part === "base" ? String(sec.base || "") : String(secPart.tags || "");',
'      const tags = String((b && b.tags) || partTags || "").trim();',
'      const negTags = String((b && b.negative) || (part === "base" ? "" : (secPart.negative || "")) || "").trim();'
].join('\n'), [
'      const buckets = partTagBuckets(heroine);',
'      const sec = (((store.effective(heroine).prompts || {}).heroines || {})[heroine]) || {};',
'      const secPart = ((sec.sections || {})[part]) || {};',
'      const tags = String((b && b.tags) || buckets[part] || "").trim();',
'      const negTags = String((b && b.negative) || secPart.negative || "").trim();'
].join('\n'), 'теги из частей');
sub('      if (p === "/bridge/api/part-preview" && m === "POST")',
'      if (p === "/bridge/api/parts" && m === "POST") { const b = await readJson(req); const h = String(b && b.heroine || currentHeroine()); return send(res, 200, { ok: true, heroine: h, parts: partTagBuckets(h) }); }\n      if (p === "/bridge/api/part-preview" && m === "POST")', 'роут частей');
fs.writeFileSync(f,s);
const v='wb-verify.js';
let vs=fs.readFileSync(v,'utf8');
const add=[
'  ["Превью: классификатор", "function classifyPart(tag)", 1],\n',
'  ["Превью: части героини", "function partTagBuckets(heroine)", 1],\n',
'  ["Превью: роут частей", "/bridge/api/parts", 1],\n'
].join('');
const i=vs.lastIndexOf('\n];');
if(i<0){ console.log('FAIL verify якорь'); process.exit(1); }
vs=vs.slice(0,i+1)+add+vs.slice(i+1);
fs.writeFileSync(v,vs);
console.log('ok verify +3');