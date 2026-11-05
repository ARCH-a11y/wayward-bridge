'use strict';
const fs = require('fs');
const F = 'src/019-src_server_assets.generated.js';
const V = 'wb-verify.js';
let L = fs.readFileSync(F, 'utf8').split(/\r?\n/);
const ORIG = L.slice();

function need(i, re, label) {
  if (!re.test(L[i] || '')) {
    console.log('FAIL ' + label + ' @' + (i + 1) + ': ' + JSON.stringify(L[i]));
    process.exit(1);
  }
  console.log('ok   ' + label + ' @' + (i + 1));
}
function find(re, from, label) {
  for (let i = from || 0; i < L.length; i++) if (re.test(L[i])) return i;
  console.log('FAIL ' + label + ': не найдено');
  process.exit(1);
}

// 1. Состояние сворачивается
const st = find(/out\.setAttribute\("data-sec", "state"\);/, 0, 'data-sec state');
const stRet = find(/^\s*return out;\s*$/, st, 'return out в stateSec');
L[stRet] = '          return foldable(out, "state");';
console.log('ok   состояние сворачивается');

// 2. Зацепки в bodySec
const b = find(/function bodySec\(\) \{/, 0, 'bodySec');
need(b + 1, /var id = S\.viewHeroine/, 'rb в bodySec');
need(b + 2, /var plOrder = \[/, 'plOrder');
need(b + 10, /loraCur = "pussy spec report/, 'loraCur');
need(b + 15, /class: "pcell"/, 'открытие блока lora');
need(b + 16, /LoRA отчёта/, 'блок lora');
need(b + 24, /class: "pcell"/, 'открытие блока композиции');
need(b + 25, /Композиция по частям/, 'блок композиции');
need(b + 32, /Поза, кадр и фон для превью/, 'подпись блока композиции');
need(b + 33, /^\s*\),\s*$/, 'закрытие блока композиции');
need(b + 34, /class: "pgrid"/, 'сетка внешности');

// 3. Вырезаем блоки
const loraHead = L.slice(b + 2, b + 11);
const compBlock = L.slice(b + 15, b + 34);
console.log('ok   срезано строк lora: ' + loraHead.length + ', композиции: ' + compBlock.length);
L.splice(b + 15, 19);
L.splice(b + 2, 9);

// 4. Внешность сворачивается
const bRet = find(/^\s*return out;\s*$/, b, 'return out в bodySec');
L[bRet] = '          return foldable(out, "body");';
need(bRet + 1, /^\s*\}\s*$/, 'закрытие bodySec');
console.log('ok   внешность сворачивается');

// 5. Новый раздел
const rep = ['        function reportSec() {'];
for (const s of loraHead) rep.push(s);
rep.push('          var out = sec(');
rep.push('            "Композиция Report",');
rep.push('            "#22d3ee",');
rep.push('            "Чем и как рисуется коллаж Body report: LoRA, её сила, триггеры и кадр для каждой части.",');
for (const s of compBlock) rep.push(s);
rep.push('          );');
rep.push('          out.setAttribute("data-sec", "report");');
rep.push('          return foldable(out, "report");');
rep.push('        }');
L.splice(bRet + 2, 0, ...rep);
console.log('ok   раздел Композиция Report: ' + rep.length + ' строк');

// 6. Хелпер сворачивания
const fold = [
  '        function foldable(out, key) {',
  '          S.fold = S.fold || {};',
  '          var d = document.createElement("details");',
  '          d.className = out.className + " fold";',
  '          d.open = S.fold[key] === undefined ? key !== "report" : !!S.fold[key];',
  '          var t = out.querySelector(".stitle");',
  '          var s = document.createElement("summary");',
  '          s.className = "stitle";',
  '          s.style.cssText = "cursor:pointer;user-select:none";',
  '          s.textContent = t ? t.textContent : "";',
  '          if (t) out.removeChild(t);',
  '          d.appendChild(s);',
  '          while (out.firstChild) d.appendChild(out.firstChild);',
  '          d.addEventListener("toggle", function() { S.fold[key] = d.open; });',
  '          return d;',
  '        }'
];
const b2 = find(/function bodySec\(\) \{/, 0, 'bodySec для хелпера');
L.splice(b2, 0, ...fold);
console.log('ok   хелпер сворачивания');

// 7. В список секций
const arr = find(/return \[charSec, stateSec\(\), passportSec\(\), bodySec\(\), quarantineSec\(\)/, 0, 'массив секций');
L[arr] = L[arr].replace('bodySec(), quarantineSec()', 'bodySec(), reportSec(), quarantineSec()');
need(arr, /bodySec\(\), reportSec\(\), quarantineSec\(\)/, 'массив секций с reportSec');

const out = L.join('\n');
if (out === ORIG.join('\n')) { console.log('FAIL ничего не изменилось'); process.exit(1); }
fs.writeFileSync(F, out);
console.log('записано');

// 8. Маркеры verify (мягко)
try {
  let v = fs.readFileSync(V, 'utf8');
  const i = v.indexOf('["Превью: фокус частей"');
  if (i < 0) console.log('WARN якорь verify не найден');
  else {
    const lineEnd = v.indexOf('\n', i);
    const add = '\n  ["Превью: раздел композиции", "function reportSec()", 1],' +
      '\n  ["Превью: внешность сворачивается", "return foldable(out, \\"body\\")", 1],' +
      '\n  ["Превью: состояние сворачивается", "return foldable(out, \\"state\\")", 1],';
    v = v.slice(0, lineEnd) + add + v.slice(lineEnd);
    fs.writeFileSync(V, v);
    console.log('ok   маркеры verify');
  }
} catch (e) { console.log('WARN verify: ' + e.message); }