// wb-apply-g6b2.js — home в реальные веса визитов (UCe/GCe) + починка теста
const fs = require("fs");
const F_GAME = "src/016-src_server_game.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 180));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

const html = fs.readFileSync("index.html", "utf8");
function showTable(name) {
  const i = html.indexOf(name + "={");
  if (i < 0) throw new Error("НЕ НАЙДЕНА таблица " + name + " в index.html");
  console.log("  " + name + ": " + html.slice(i, i + 140).replace(/\s+/g, " "));
  return i;
}
function valFor(name) {
  const i = showTable(name);
  const m = html.slice(i, i + 300).match(/same_town:([0-9.]+)/);
  return m ? m[1] : "1";
}
console.log("== 0. реальные веса визитов ==");
const uVal = valFor("UCe"), gVal = valFor("GCe");
console.log("  home = " + uVal + " / " + gVal + " (как same_town)");

console.log("== 1. хук: home в UCe/GCe ==");
rep(F_GAME,
  "        const kinHtml = html.replace('Fle={same_town:.7,day_ride:.35,far:.1}', 'Fle={home:.9,same_town:.7,day_ride:.35,far:.1}');",
  "        const kinHtml = html.replace('Fle={same_town:.7,day_ride:.35,far:.1}', 'Fle={home:.9,same_town:.7,day_ride:.35,far:.1}')\n" +
  "          .replace('UCe={', 'UCe={home:" + uVal + ",')\n" +
  "          .replace('GCe={', 'GCe={home:" + gVal + ",');",
  "home в UCe/GCe", "UCe={home:");

console.log("== 2. тест: домашний = дома ==");
rep(F_TEST,
  'ok("G6: живой и рядом", safe(g6p.json, ["person", "alive"]) === true && safe(g6p.json, ["person", "lives"]) === "same_town");',
  'ok("G6: живой и дома", safe(g6p.json, ["person", "alive"]) === true && safe(g6p.json, ["person", "lives"]) === "home");',
  "тест под lives=home", '"G6: живой и дома"');

console.log("== 3. маркер ==");
{
  const v = rd(F_VERIFY);
  if (v.indexOf('"G6b: вес home в визитах"') >= 0) console.log("  = уже: маркер");
  else {
    const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
    if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
    const at = m.index + m[0].length;
    wr(F_VERIFY, v.slice(0, at) + '\n  ["G6b: вес home в визитах", "UCe={home:", 1],' + v.slice(at));
    console.log("  + маркер");
  }
}
console.log("\nГОТОВО.");