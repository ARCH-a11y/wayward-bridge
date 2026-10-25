// wb-key-check.js — проверка ключа и поиск точного id модели
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = (env.match(/OPENAI_API_KEY\s*=\s*(.+)/) || [])[1]?.trim();
if (!key) { console.error('в .env нет OPENAI_API_KEY'); process.exit(1); }
console.log('ключ:', key.slice(0, 6) + '...' + key.slice(-4), '| длина:', key.length);

fetch('https://api.venice.ai/api/v1/models', { headers: { Authorization: 'Bearer ' + key } })
  .then(async r => {
    console.log('HTTP', r.status);
    const j = await r.json();
    if (j.error) { console.log('ошибка:', JSON.stringify(j.error)); return; }
    const ids = (j.data || []).map(m => m.id);
    console.log('моделей доступно:', ids.length);
    const glm = ids.filter(i => /glm|z-ai/i.test(i));
    console.log('похожие на GLM:', glm.length ? glm.join(', ') : 'нет');
    const flash = ids.filter(i => /flash/i.test(i));
    console.log('похожие на flash:', flash.length ? flash.slice(0, 20).join(', ') : 'нет');
  })
  .catch(e => console.log('сеть/ошибка:', e.message));
