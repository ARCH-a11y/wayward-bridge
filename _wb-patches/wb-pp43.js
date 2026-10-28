const fs=require("fs");
const f="src/024-src_server_index.js";
let s=fs.readFileSync(f,"utf8");
function sub(a,b,label){
  if(!s.includes(a)){ console.log("FAIL "+label); process.exit(1); }
  s=s.replace(a,b); console.log("ok "+label);
}
sub([
'      const rawTags = String(raw || "").trim();',
'      if (rawTags) {',
'        rawTags.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'        const res2 = {};',
'        for (const k of Object.keys(out)) res2[k] = out[k].join(", ");',
'        return { tags: res2, neg: {} };',
'      }',
'      const sections = sec.sections || {};'
].join("\n"),
'      const sections = sec.sections || {};',"убрать ранний возврат");
sub('      const base = String(sec.base || "").trim();\n      if (!anySection && base) base.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));',
'      const base = String(sec.base || "").trim();\n      if (!anySection) {\n        const fill = String(raw || "").trim() || base;\n        if (fill) fill.split(",").forEach((x) => push(classifyPart(x.trim()), x.trim()));\n      }',"внешность только без секций");
sub('    function resolveHeroine(id) {',
[
'    function resolveHeroine(id, arch) {',
'      const has = (x) => { const w = String(x || "").trim(); return w && ((store.effective(w).prompts || {}).heroines || {})[w] ? w : ""; };',
'      const byKey = has(id);',
'      if (byKey) return byKey;',
'      const byArch = has(arch);',
'      if (byArch) return byArch;',
'      return currentHeroine();',
'    }',
'    function resolveHeroineOld(id) {'
].join("\n"),"резолв по ключу и архетипу");
sub('      const heroine = resolveHeroine(b && b.heroine);','      const heroine = resolveHeroine(b && b.key, b && b.heroine);',"героиня превью");
sub('        const h = resolveHeroine(b && b.heroine);','        const h = resolveHeroine(b && b.key, b && b.heroine);',"героиня частей");
fs.writeFileSync(f,s);