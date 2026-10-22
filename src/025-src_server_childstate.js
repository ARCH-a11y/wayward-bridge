// src/025-src_server_childstate.js
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
