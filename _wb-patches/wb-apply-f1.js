"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

const MODULE_SRC = `// src/025-src_server_childstate.js
// Состояние цикла, беременности, желания ребёнка и детей.
// Живёт отдельно от слоя промптов: wayward-bridge-data/childstate.json
"use strict";

const CHILDSTATE_FILE = "childstate.json";

function childstateEmpty() {
  return {
    playthrough: "",
    lastDay: 0,
    cycle: { on: true, day: 0, length: 28, window: 4 },
    pregnancy: { active: false, day: 0, fatherId: "", known: false },
    childWish: { mode: "none", targetId: "" },
    children: [],
    postpartum: { blockUntilDay: 0, milkUntilDay: 0 },
  };
}

let childstateCache = null;

function childstatePath() {
  return path.join(DATA_DIR, CHILDSTATE_FILE);
}

function childstateRead() {
  if (childstateCache) return childstateCache;
  try {
    childstateCache = JSON.parse(fs.readFileSync(childstatePath(), "utf8"));
  } catch (e) {
    childstateCache = childstateEmpty();
  }
  return childstateCache;
}

function childstateWrite(s) {
  childstateCache = s;
  writeAtomic(childstatePath(), JSON.stringify(s, null, 2));
}

// Привязка к прохождению: сменилось — начинаем заново
function childstateFor(playthrough) {
  const s = childstateRead();
  if (s.playthrough !== playthrough) {
    const fresh = childstateEmpty();
    fresh.playthrough = playthrough;
    childstateWrite(fresh);
    return fresh;
  }
  return s;
}

// Тик дня. Пока только фиксирует день; цикл/срок/рост — следующим шагом.
function childstateTick(playthrough, day, ctx) {
  const s = childstateFor(playthrough);
  if (!day || day <= s.lastDay) return s;
  s.lastDay = day;
  childstateWrite(s);
  return s;
}
`;

const SCHEMA_BLOCK = `childstate: {
  playthrough: str(),
  lastDay: num(),
  cycle:      { on: bool(), day: num(), length: num(), window: num() },
  pregnancy:  { active: bool(), day: num(), fatherId: str(), known: bool() },
  childWish:  { mode: str(), targetId: str() },
  children:   [ { id: str(), sex: str(), fatherId: str(), bornDay: num(), stage: str() } ],
  postpartum: { blockUntilDay: num(), milkUntilDay: num() },
},`;

const DEFAULTS_BLOCK = `childstate: {
  playthrough: "",
  lastDay: 0,
  cycle:      { on: true, day: 0, length: 28, window: 4 },
  pregnancy:  { active: false, day: 0, fatherId: "", known: false },
  childWish:  { mode: "none", targetId: "" },
  children:   [],
  postpartum: { blockUntilDay: 0, milkUntilDay: 0 },
},`;

const MARKERS = [
  ["childstate в схеме", "childstate:"],
  ["childstate-модуль", "function childstateTick"],
  ["файл состояния", "childstate.json"],
  ["привязка к прохождению", "s.playthrough !== playthrough"],
];

const log = [];
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const has = p => fs.existsSync(path.join(ROOT, p));

let modFile = "src/025-src_server_childstate.js";
if (fs.existsSync(path.join(ROOT, "src"))) {
  const found = fs.readdirSync(path.join(ROOT, "src")).find(f => /childstate/.test(f));
  if (found) modFile = "src/" + found;
}
if (!has(modFile)) { wr(modFile, MODULE_SRC); log.push("создан " + modFile); }
else log.push("уже есть " + modFile);

let order = rd("src/ORDER.txt");
const oLines = order.split(/\r?\n/);
const bare = modFile.replace(/^src\//, "");
if (!oLines.includes(bare) && !oLines.includes(modFile)) {
  const useSrc = oLines.some(l => l.includes("src/"));
  const entry = useSrc ? modFile : bare;
  if (!order.endsWith("\n")) order += "\n";
  order += entry + "\n";
  wr("src/ORDER.txt", order);
  log.push("ORDER.txt: + " + entry);
} else log.push("ORDER.txt: строка уже есть");

function insertBeforePrompts(file, block, label) {
  if (!has(file)) { log.push(label + ": файл не найден"); return; }
  let s = rd(file);
  if (s.includes("childstate")) { log.push(label + ": уже есть"); return; }
  const m = s.match(/^([ \t]*)prompts\s*:/m);
  if (!m) { log.push(label + ": НЕ НАЙДЕН якорь 'prompts:' — вставить вручную"); return; }
  const ind = m[1];
  const blockIndented = block.split("\n").map(l => (l.trim() ? ind + l : l)).join("\n");
  s = s.replace(/(^[ \t]*prompts\s*:)/m, blockIndented + "\n$1");
  wr(file, s);
  log.push(label + ": childstate добавлен");
}
insertBeforePrompts("src/001-src_server_schema.js", SCHEMA_BLOCK, "схема");
insertBeforePrompts("src/004-src_server_defaults.js", DEFAULTS_BLOCK, "дефолты");

(function () {
  const file = "wb-verify.js";
  if (!has(file)) { log.push("wb-verify.js не найден"); return; }
  let s = rd(file);
  if (s.includes("childstate-модуль")) { log.push("verify: маркеры уже есть"); return; }
  const m = s.match(/(const\s+MARKERS\s*=\s*\[[ \t]*\r?\n)/);
  if (!m) { log.push("verify: НЕ НАЙДЕН MARKERS — добавить вручную"); return; }
  const mk = MARKERS.map(x => "  [" + JSON.stringify(x[0]) + ", " + JSON.stringify(x[1]) + "],").join("\n") + "\n";
  s = s.replace(m[1], m[1] + mk);
  wr(file, s);
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
