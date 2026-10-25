const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');
const before=t.length;

const re=/(console\.log\("\[wb\] gen"[\s\S]*?)\s*if \(nextSeed\.has\(key\)\) \{/;
const canon=`console.log("[wb] gen", JSON.stringify({ k: String(key).slice(0,70), bypass: !!body.bypassCache, saved: !!(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled), lib: !!library.latest(key), pk: (parseImageKey(key) || {}).kind }));
        if (store.settings.app.savedMedia && store.settings.app.savedMedia.enabled && !body.bypassCache) {
          const hit = media.pick(parsedKey, heroineOf(parsedKey, heroineIds()));
          if (hit) return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + hit.rel, cached: true }, corsOf(req));
        }
        // H1y/H2b: патроны вне media.pick — готовый портрет берём из библиотеки
        if (!body.bypassCache && /^patron_/i.test(key)) {
          const pe = library.latest(key);
          if (pe && pe.file) { console.log("[wb] cached patron", String(key).slice(0,70)); return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + pe.file, cached: true }, corsOf(req)); }
        }
        if (nextSeed.has(key)) {`;

if(!re.test(t)){console.log('  ! регион не найден');}
else{
  t=t.replace(re, canon);
  fs.writeFileSync(P,t);
  const chk=fs.readFileSync(P,'utf8');
  console.log('  + ok. cached patron в файле:', chk.includes('cached patron'), '| длина:', before, '->', chk.length);
}