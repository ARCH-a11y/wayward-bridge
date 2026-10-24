#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

const PORT = 8799;
const DATA = path.resolve("wb-test-data");
const BASE = "http://127.0.0.1:" + PORT;
const B = (p) => path.join(DATA, p);

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("PASS  " + n)) : (fail++, console.log("FAIL  " + n + (x ? "  → " + x : "")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (o, p) => p.reduce((a, k) => (a == null ? undefined : a[k]), o);
const W = (r) => (((r || {}).json || {}).warnings) || [];

async function api(method, url, body) {
  const r = await fetch(BASE + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch (_) {}
  return { status: r.status, json: j };
}
const rev = async () => (await api("GET", "/bridge/api/state")).json.revision;
const patch = async (p, v) => api("PATCH", "/bridge/api/settings", { revision: await rev(), ops: [{ path: p, value: v }] });
function readSettings() { try { return JSON.parse(fs.readFileSync(B("settings.json"), "utf8")); } catch (_) { return {}; } }

function findNumber(o, p) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === "number") return p.concat(k);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const r = findNumber(v, p.concat(k));
      if (r) return r;
    }
  }
  return null;
}

function startBridge() {
  const c = spawn(process.execPath, ["wayward-bridge.js", "--data", DATA, "--port", String(PORT), "--game", "."], { stdio: ["ignore", "pipe", "pipe"] });
  c.log = "";
  c.stdout.on("data", (d) => { c.log += d; });
  c.stderr.on("data", (d) => { c.log += d; });
  return c;
}
async function waitUp(c) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(BASE + "/bridge/api/ping"); if (r.ok) return true; } catch (_) {}
    await sleep(250);
  }
  return false;
}

(async () => {
  fs.rmSync(DATA, { recursive: true, force: true });
  fs.mkdirSync(DATA, { recursive: true });

  let c = startBridge();
  const up = await waitUp(c);
  ok("бридж поднимается", up, (c.log || "").slice(-300));
  if (!up) { c.kill(); process.exit(1); }

  const st = await api("GET", "/bridge/api/state");
  ok("GET /state отвечает с revision", st.status === 200 && typeof (st.json || {}).revision === "number");

  // 1. длинный промпт
  const long = "alpha, bravo, charlie, delta, echo, foxtrot, golf, hotel, india, juliet, ".repeat(700);
  const r1 = await patch(["layer", "prompts", "heroines", "pippa", "base"], long);
  ok("длинный промпт: сохранён", r1.status === 200, "status " + r1.status);
  ok("длинный промпт: предупреждение пришло", W(r1)[0] && W(r1)[0].kind === "string", JSON.stringify(W(r1)).slice(0, 160));
  const saved = String(safe(readSettings(), ["layer", "prompts", "heroines", "pippa", "base"]) || "");
  ok("длинный промпт: обрезан до лимита", saved.length <= 32000 && saved.length > 30000, "длина " + saved.length);
  ok("длинный промпт: тег не разорван", long.slice(0, saved.length + 1).endsWith(",") || saved.endsWith("juliet"), JSON.stringify(saved.slice(-20)));

  // 2. числовое поле — путь берём из defaults
  const rel = findNumber((st.json || {}).defaults || {}, []);
  console.log("  числовое поле найдено по пути: " + JSON.stringify(rel));
  ok("в defaults есть числовое поле", !!rel, "ключи defaults: " + Object.keys((st.json || {}).defaults || {}).join(", "));
  if (rel) {
    const numPath = ["layer"].concat(rel);
    const r2 = await patch(numPath, 99999);
    const w2 = W(r2).find((x) => x.kind === "number");
    ok("число зажимается, а не отклоняется", r2.status === 200 && !!w2, "status " + r2.status + " " + JSON.stringify(r2.json).slice(0, 140));
    ok("число: зажато до верхней границы", !!(w2 && w2.from === 99999 && w2.to < 99999), JSON.stringify(W(r2)).slice(0, 160));
  }

  // 3. __proto__ как идентификатор героини — значение объект
  const r3 = await patch(["layer", "prompts", "heroines", "__proto__"], { base: "zzz" });
  ok("__proto__: принят", r3.status === 200, "status " + r3.status + " " + JSON.stringify(r3.json).slice(0, 140));
  const hp = safe(readSettings(), ["layer", "prompts", "heroines"]);
  ok("__proto__: своё свойство", !!(hp && Object.prototype.hasOwnProperty.call(hp, "__proto__")));
  ok("__proto__: значение читается", !!(hp && hp["__proto__"] && hp["__proto__"].base === "zzz"));
  ok("__proto__: прототип не подменён", !!(hp && Object.getPrototypeOf(hp) === Object.prototype));

  // 4. устаревший revision → 409
  const stale = await rev();
  await patch(["layer", "prompts", "heroines", "pippa", "base"], "x");
  const r4 = await api("PATCH", "/bridge/api/settings", { revision: stale, ops: [{ path: ["layer", "prompts", "heroines", "pippa", "base"], value: "y" }] });
  ok("устаревший revision → 409", r4.status === 409, "status " + r4.status);

  // 5. уникальность имён бэкапов
  const bdir = B("backups");
  const before = fs.existsSync(bdir) ? fs.readdirSync(bdir) : [];
  for (const v of ["b1", "b2", "b3"]) await patch(["layer", "prompts", "heroines", "pippa", "base"], v);
  const after = fs.existsSync(bdir) ? fs.readdirSync(bdir) : [];
  const fresh = after.filter((x) => !before.includes(x));
  ok("бэкапы с уникальными именами", fresh.length >= 3 && new Set(fresh).size === fresh.length, "новых: " + fresh.length + ", уникальных: " + new Set(fresh).size);

  // 5b. секции и карантин героини
  const st2 = await api("GET", "/bridge/api/state");
  const heroines2 = (((st2.json || {}).defaults || {}).prompts || {}).heroines || {};
  const hid = Object.keys(heroines2).find((k) => /^[A-Za-z0-9_.' -]{1,80}$/.test(k));
  ok("секции: героиня найдена в defaults", !!hid, "героини: " + Object.keys(heroines2).slice(0, 8).join(", "));
  if (hid) {
    const outfits2 = (((st2.json || {}).defaults || {}).prompts || {}).outfits || {};
    const oid = Object.keys(outfits2).find((k) => /^[A-Za-z0-9_.' -]{1,80}$/.test(k));
    ok("секции: наряд найден в defaults", !!oid, "наряды: " + Object.keys(outfits2).slice(0, 8).join(", "));
    if (oid) {
      const keyBase = hid + "__scene-taproom";
      const keyOut = keyBase + "__outfit-" + oid;
      const pv = (k) => api("POST", "/bridge/api/preview", { key: k, ops: [] });
      const pos = (r) => String((r.json || {}).positive || "");
      const rSec = await patch(["layer", "prompts", "heroines", hid, "sections", "head", "tags"], "zzz_test_head");
      ok("секции: PATCH принят", rSec.status === 200, "status " + rSec.status + " " + JSON.stringify(W(rSec)).slice(0, 140));
      const pSec = await pv(keyBase);
      ok("секции: тег секции попал в positive", pSec.status === 200 && pos(pSec).includes("zzz_test_head"), pos(pSec).slice(0, 140));
      const rQ = await patch(["layer", "prompts", "heroines", hid, "quarantine", "vagtest"], { tags: "zzz_test_q", when: "vagina_visible", mode: "auto" });
      ok("карантин: PATCH принят", rQ.status === 200, "status " + rQ.status + " " + JSON.stringify(W(rQ)).slice(0, 140));
      await patch(["layer", "prompts", "outfits", oid, "tags"], "zzz_outfit_plain");
      const pOff = await pv(keyOut);
      ok("карантин: без ключевых слов тега нет", pOff.status === 200 && !pos(pOff).includes("zzz_test_q"), pos(pOff).slice(0, 140));
      await patch(["layer", "prompts", "outfits", oid, "tags"], "zzz_outfit_plain, nude");
      const pOn = await pv(keyOut);
      ok("карантин: при условии тег появился", pOn.status === 200 && pos(pOn).includes("zzz_test_q"), pos(pOn).slice(0, 140));
      const rBack = await api("PATCH", "/bridge/api/settings", { revision: await rev(), ops: [
        { path: ["layer", "prompts", "heroines", hid, "sections", "head", "tags"], delete: true },
        { path: ["layer", "prompts", "heroines", hid, "quarantine", "vagtest"], delete: true },
        { path: ["layer", "prompts", "outfits", oid, "tags"], delete: true },
      ] });
      ok("секции/карантин: откат выполнен", rBack.status === 200, "status " + rBack.status);
      const pClean = await pv(keyOut);
      ok("после отката тестовых тегов нет", pClean.status === 200 && !pos(pClean).includes("zzz_test") && !pos(pClean).includes("zzz_outfit"), pos(pClean).slice(0, 140));
    }
  }

  // 6. --check-game без пути
  let cg = "";
  try { cg = execFileSync(process.execPath, ["wayward-bridge.js", "--check-game"], { encoding: "utf8" }); } catch (e) { cg = "ОШИБКА: " + e.message; }
  ok("--check-game без пути работает", cg.includes("maintainer report"), cg.slice(0, 120));

  // 7. переживание перезапуска
  c.kill();
  await sleep(700);
  c = startBridge();
  ok("бридж перезапускается", await waitUp(c), (c.log || "").slice(-300));
  ok("после перезапуска /state отвечает", (await api("GET", "/bridge/api/state")).status === 200);
  const hp2 = safe(readSettings(), ["layer", "prompts", "heroines"]);
  ok("__proto__ пережил перезапуск", !!(hp2 && Object.prototype.hasOwnProperty.call(hp2, "__proto__") && hp2["__proto__"] && hp2["__proto__"].base === "zzz"));

  // --- F1: childstate tick ---
  const csId = "pt-test-1";
  const rDay1 = await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 1, ctx: {} });
  ok("childstate: роут отвечает", rDay1.status === 200 && !!rDay1.json && !!rDay1.json.state);
  ok("childstate: lastDay записан", safe(rDay1.json, ["state", "lastDay"]) === 1);
  const cycA = safe(rDay1.json, ["state", "cycle", "day"]);
  await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 8, ctx: {} });
  const rDay15 = await api("POST", "/bridge/api/childstate/tick", { playthrough: csId, day: 15, ctx: {} });
  const cycB = safe(rDay15.json, ["state", "cycle", "day"]);
  ok("childstate: цикл сдвигается по дням", typeof cycB === "number" && cycB !== cycA);

  const chNo = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-no", day: 1, ctx: { encounters: 1, force: false } });
  ok("childstate: force=false -> нет беременности", safe(chNo.json, ["state", "pregnancy", "active"]) === false);

  const chYes = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: 1, ctx: { encounters: 1, force: true, patronId: "p1" } });
  ok("childstate: force=true -> беременность и отец", safe(chYes.json, ["state", "pregnancy", "active"]) === true && safe(chYes.json, ["state", "pregnancy", "fatherId"]) === "p1");
  let rBirth;
  for (let d = 2; d <= 41; d++) rBirth = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-yes", day: d, ctx: { encounters: 0 } });
  const birthKids = safe(rBirth.json, ["state", "children"]) || [];
  ok("childstate: роды дали ребёнка", birthKids.length >= 1 && safe(rBirth.json, ["state", "pregnancy", "active"]) === false);
  ok("childstate: послеродовой блок выставлен", (safe(rBirth.json, ["state", "postpartum", "blockUntilDay"]) || 0) > 41);

  const chGrp = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-grp", day: 1, ctx: { encounters: 1, force: true, patronId: "p1", group: true } });
  ok("childstate: группа -> отец пуст", safe(chGrp.json, ["state", "pregnancy", "fatherId"]) === "");

  // --- F2: живот и молоко в промпте ---
  if (hid) {
    const f2Id = "pt-f2";
    await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: 1, ctx: { encounters: 1, force: true, patronId: "p1" } });
    await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: 21, ctx: { encounters: 0 } });
    const keyF2 = hid + "__scene-taproom";
    const pBelly = await api("POST", "/bridge/api/preview", { key: keyF2, ops: [] });
    const posBelly = String((pBelly.json || {}).positive || "");
    ok("F2: тег живота (visible) в positive", pBelly.status === 200 && posBelly.includes("small pregnant belly"), posBelly.slice(0, 140));
    for (let d = 22; d <= 41; d++) await api("POST", "/bridge/api/childstate/tick", { playthrough: f2Id, day: d, ctx: { encounters: 0 } });
    const pMilk = await api("POST", "/bridge/api/preview", { key: keyF2, ops: [] });
    const posMilk = String((pMilk.json || {}).positive || "");
    ok("F2: тег молока после родов", pMilk.status === 200 && posMilk.includes("lactating breasts, milk"), posMilk.slice(0, 140));
    ok("F2: после родов живот ушёл", !posMilk.includes("small pregnant belly"));
  }

  // --- F3: роут set (кнопки меню) ---
  if (hid) {
    const setR = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { active: true, day: 22 } } });
    ok("F3: set зачинает", safe(setR.json, ["state", "pregnancy", "active"]) === true && safe(setR.json, ["state", "pregnancy", "day"]) === 22);
    const pvS = await api("POST", "/bridge/api/preview", { key: hid + "__scene-taproom", ops: [] });
    ok("F3: set -> живот в positive", String((pvS.json || {}).positive || "").includes("small pregnant belly"));
    const setK = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { known: true } } });
    ok("F3: set known", safe(setK.json, ["state", "pregnancy", "known"]) === true);
    const setOff = await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-set", patch: { pregnancy: { active: false } } });
    const pvOff = await api("POST", "/bridge/api/preview", { key: hid + "__scene-taproom", ops: [] });
    ok("F3: прервать убирает живот", safe(setOff.json, ["state", "pregnancy", "active"]) === false && !String((pvOff.json || {}).positive || "").includes("small pregnant belly"));
  }

  // --- F4: роды с риском ---
  let rHard;
  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hard", day: 1, ctx: { encounters: 1, force: true } });
  for (let d = 2; d <= 41; d++) rHard = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hard", day: d, ctx: { encounters: 0, birthForce: "hard" } });
  ok("F4: исход родов записан", safe(rHard.json, ["state", "lastBirth", "outcome"]) === "hard");
  ok("F4: тяжёлые роды — длиннее блок", (safe(rHard.json, ["state", "postpartum", "blockUntilDay"]) || 0) >= 76);
  let rSmooth;
  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-smooth", day: 1, ctx: { encounters: 1, force: true } });
  for (let d = 2; d <= 41; d++) rSmooth = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-smooth", day: d, ctx: { encounters: 0, birthForce: "smooth" } });
  ok("F4: гладкие роды — короткий блок", (safe(rSmooth.json, ["state", "postpartum", "blockUntilDay"]) || 0) === 61);
  // --- F5: сокрытие и желание цели ---
  const cLow = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-low", day: 1, ctx: { encounters: 1, force: true, trust: 20 } });
  ok("F5: низкое доверие -> скрывает", safe(cLow.json, ["state", "pregnancy", "known"]) === false);
  let cR;
  for (let d = 2; d <= 17; d++) cR = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-low", day: d, ctx: { encounters: 0, trust: 20, revealForce: false } });
  ok("F5: на 16 дне вынужденное раскрытие", safe(cR.json, ["state", "pregnancy", "known"]) === true && safe(cR.json, ["state", "pregnancy", "forced"]) === true);
  const cHi = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hi", day: 1, ctx: { encounters: 1, force: true, trust: 80 } });
  ok("F5: высокое доверие -> знает сразу", safe(cHi.json, ["state", "pregnancy", "known"]) === true);
  ok("F5: желание цели при доверии", safe(cHi.json, ["state", "childWish", "targetId"]) === "player");
  // --- G: внешность ребёнка и фильтры ---
  const LOOK = { hair: "black", hairType: "wavy", eyes: "green", skin: "fair", face: "oval", build: "slim", bust: "full", hips: "wide" };
  const setKid = async (stage) => { await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-look", patch: { children: [{ id: "k1", sex: "f", fatherId: "p1", bornDay: 1, stage: stage, look: LOOK }] } }); const r = await api("GET", "/bridge/api/state"); return String(safe(r.json, ["childstate", "children", 0, "lookText"]) || ""); };
  const lkInf = await setKid("infant");
  ok("G: младенец — без груди/бёдер", lkInf.includes("hair") && lkInf.includes("green eyes") && !lkInf.includes("breasts"));
  const lkTeen = await setKid("teen");
  ok("G: подросток — budding", lkTeen.includes("budding breasts"));
  const lkAdult = await setKid("adult");
  ok("G: взрослая — грудь/бёдра", lkAdult.includes("full breasts") && lkAdult.includes("wide hips"));
  let rL;
  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-gene", day: 1, ctx: { encounters: 1, force: true, father: "player" } });
  for (let d = 2; d <= 41; d++) rL = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-gene", day: d, ctx: { encounters: 0 } });
  const kid0 = (safe(rL.json, ["state", "children"]) || [])[0] || {};
  ok("G: у ребёнка есть look", !!(kid0.look && kid0.look.hair && kid0.look.eyes));
  c.kill();
  await sleep(300);
  fs.rmSync(DATA, { recursive: true, force: true });

  console.log("");
  console.log("PASS: " + pass + ", FAIL: " + fail);
  process.exit(fail ? 1 : 0);
})();
