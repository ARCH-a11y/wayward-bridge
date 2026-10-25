const fs=require('fs');
const P='src/024-src_server_index.js';
let t=fs.readFileSync(P,'utf8');
const anchor=`if (hit) return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + hit.rel, cached: true }, corsOf(req));`;
const add=`\n        // H1y: патроны исключены из media.pick — добираем точным ключом из библиотеки\n        if (store.settings.app.savedMedia && store.settings.app.savedMedia.enabled && !body.bypassCache && /^patron_/i.test(key)) {\n          const pe = library.latest(key);\n          if (pe && pe.file) return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + pe.file, cached: true }, corsOf(req));\n        }`;
if(t.includes('H1y: патроны исключены')){console.log('  = уже есть');}
else if(!t.includes(anchor)){console.log('  ! НЕТ АНКОРА');}
else{ t=t.replace(anchor, anchor+add); fs.writeFileSync(P,t); console.log('  + ok: патрон берётся из библиотеки'); }

const V='wb-verify.js';
let v=fs.readFileSync(V,'utf8');
const h1w=`["H1w: ребёнок без чужой сцены", "sceneVariant:void 0", 1],`;
if(v.includes(h1w) && !v.includes('H1y: патрон из кэша')){
  v=v.replace(h1w, h1w+`\n["H1y: патрон из кэша", "pe && pe.file", 1],`);
  fs.writeFileSync(V,v);console.log('verify: маркер H1y добавлен');
}else console.log('verify: маркер H1y уже есть или H1w не найден');

const D='docs/children.md';
if(fs.existsSync(D)){
  let d=fs.readFileSync(D,'utf8');
  if(!d.includes('H1y: портреты патронов не перерисовываются')){
    d+=`\n## H1y: портреты патронов переиспользуются\n- \`media.pick\` намеренно возвращает null для патронов, поэтому ранний возврат «файл уже есть» для них не работал и каждая отрисовка шла в генерацию (в \`saved/patrons/\` копились файлы).\n- Добавлен точный поиск по ключу через \`library.latest(key)\` — только когда не выставлен \`bypassCache\` (то есть при явном реролле всё равно рисуем заново).\n`;
    fs.writeFileSync(D,d);console.log('docs: дописал H1y');
  }
}