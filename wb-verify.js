#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = process.argv[2] || "wayward-bridge.js";
const src = fs.readFileSync(FILE, "utf8");

// [название, подстрока, минимум вхождений]
const CHECKS = [
  ["B2  лимит 32000", "max = 32e3", 1],
  ["B2  обрезка по запятой", "var cutAt = (s, max)", 1],
  ["B2  счётчик", "cnt.textContent = n + \" / \" + LIM", 1],
  ["B2  стиль счётчика", "\".cnt.over{color:#ff8080", 1],
  ["B3  clamp чисел", "Math.min(hi, Math.max(lo,", 1],
  ["B5  setAt (обе копии)", "Object.defineProperty(o, p[p.length - 1]", 2],
  ["B5  clean", "Object.defineProperty(out, k,", 1],
  ["B5  __proto__ не режется", "__proto__\" || k === \"constructor", 0],
  ["B7  useSave + revision", "this.revision = (this.revision || 0) + 1;", 1],
  ["B8  уникальные бэкапы", "Math.random().toString(36).slice(2, 7)", 1],
  ["B9  writeAtomic без спина", "Atomics.wait(new Int32Array", 1],
  ["B10 ноды хайреза 70/71", "g[\"70\"] = { class_type: \"UpscaleModelLoader\"", 1],
  ["B10a upscaler живой", "upscaler: pick(f.upscaler, \"\")", 1],
  ["B10b защита от затирания", "graph && graph[\"70\"]", 1],
  ["B39 --check-game без пути", "args[\"check-game\"] === true", 1],
  ["B40 HANDLED_API", "HANDLED_API = [\"/api/image-file\"", 1],
  ["B43 Ratings кеш", "if (this.cache) return this.cache;", 1],
  ["B44 Ratings компакция", "if (++this.pending >= 2e3) this.compact();", 1],
  ["A1  shapeDiff", "function shapeDiff(sent, kept)", 1],
  ["A2  массив warnings", "const warnings = this.lastWarnings = [];", 1],
  ["A3  сбор расхождений", "if (_d) warnings.push(Object.assign({ path: key }, _d));", 1],
  ["A4  warnings в ответе", "warnings: store.lastWarnings || []", 1],
  ["A5  показ в меню", "Сохранено, но обрезано", 1],
  ["B1  баннер", "function compatBanner()", 1],
  ["B2  ключ customWives", "g.hooks.customWives === false", 1],
  ["B2  старый ключ убран", "g.hooks.builder === false", 0],
  ["B2  partsBroken", "g.hooks.partsBroken === true", 1],
  ["B3  отладка наружу", "window.__wbCompatDebug", 1],
  ["B4  инлайн-стиль", "el.style.cssText = \"position:fixed", 1],
  ["B5  свежая диагностика", "if (bad.length && Date.now() - (window.__wbCompatAt || 0) > 2500)", 1],
  ["S1  пинг-роут (сервер+клиент)", "\"/bridge/api/ping\"", 2],
  ["S2  onopen", "es.onopen = function()", 1],
  ["S2  onerror", "es.onerror = function()", 1],
  ["S3  bridgePing", "function bridgePing()", 1],
  ["S3  страховочный опрос", "document.visibilityState === \"visible\"", 1],
  ["S4  офлайн-баннер", "нет связи с бриджем", 1],
];

let bad = 0;
for (const [name, needle, min] of CHECKS) {
  const n = src.split(needle).length - 1;
  const ok = min === 0 ? n === 0 : n >= min;
  if (!ok) { bad++; console.log("НЕТ   " + name + "  (найдено " + n + ", надо " + (min === 0 ? "0" : "≥" + min) + ")"); }
  else console.log("ок    " + name + (n > 1 ? "  (вхождений: " + n + ")" : ""));
}
console.log("");
console.log(bad ? bad + " проверок не прошло" : "файл полный — все " + CHECKS.length + " проверок пройдены");