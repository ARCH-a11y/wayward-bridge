// wb-key-test.js — минимальный вызов инференса + баланс
const fs = require('fs');
const key = (fs.readFileSync('.env', 'utf8').match(/OPENAI_API_KEY\s*=\s*(.+)/) || [])[1]?.trim();
if (!key) { console.error('нет OPENAI_API_KEY в .env'); process.exit(1); }

(async () => {
  const r = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'z-ai-glm-5-3-flash',
      messages: [{ role: 'user', content: 'ответь одним словом: работает?' }],
      max_tokens: 256,
    }),
  });
  console.log('HTTP', r.status);
  const j = await r.json();
  if (j.error) console.log('ошибка:', JSON.stringify(j.error));
  else console.log('ответ:', j.choices?.[0]?.message?.content, '| usage:', JSON.stringify(j.usage));

  const b = await fetch('https://api.venice.ai/api/v1/api_keys/rate_limits', {
    headers: { Authorization: 'Bearer ' + key },
  });
  console.log('balance HTTP', b.status);
  console.log(JSON.stringify(await b.json(), null, 2).slice(0, 900));
})();
