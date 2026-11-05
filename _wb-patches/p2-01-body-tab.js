'use strict';
const { run, load, save, marker, hasMarker, sliceElement } = require('./_lib');
const ID = 'body-tab';

run(ID, () => {
  const { file, src } = load();
  if (hasMarker(src, ID)) return 'already applied';

  const bm = /<([a-z0-9-]+)\b[^>]*\bdata-block\s*=\s*["']body["'][^>]*>/i.exec(src);
  if (!bm) throw new Error('body block not found');
  const [bs, be] = sliceElement(src, bm.index);
  const bodyHTML = src.slice(bs, be);
  let out = src.slice(0, bs) + src.slice(be);

  const sm = /<([a-z0-9-]+)\b[^>]*\bdata-block\s*=\s*["']stats["'][^>]*>/i.exec(out);
  if (!sm) throw new Error('stats container not found');
  const [ss, se] = sliceElement(out, sm.index);
  const openTag = /^<[^>]+>/.exec(out.slice(ss))[0];
  const inner = out.slice(ss + openTag.length, se - (`</${sm[1]}>`).length);

  const tabs = `${marker(ID)}
<nav class="wb-tabs" role="tablist">
  <button class="wb-tab is-active" role="tab" data-tab="stats">Stats</button>
  <button class="wb-tab" role="tab" data-tab="body">Body</button>
</nav>`;

  const rebuilt = `${openTag}${tabs}
<div class="wb-panel" role="tabpanel" data-panel="stats">${inner}</div>
<div class="wb-panel" role="tabpanel" data-panel="body" hidden>${bodyHTML}</div></${sm[1]}>`;

  out = out.slice(0, ss) + rebuilt + out.slice(se);

  if (!out.includes('data-wb="body-tab"')) {
    out = out.replace(/<\/body>/i, `<script data-wb="body-tab">(()=>{document.addEventListener('click',e=>{const b=e.target.closest('.wb-tab');if(!b)return;const root=b.closest('.wb-tabs').parentElement;root.querySelectorAll('.wb-tab').forEach(t=>t.classList.toggle('is-active',t===b));root.querySelectorAll('[data-panel]').forEach(p=>{p.hidden=p.dataset.panel!==b.dataset.tab;});});})();</script>\n</body>`);
  }

  save(file, out);
  return 'body moved into own tab under stats';
});