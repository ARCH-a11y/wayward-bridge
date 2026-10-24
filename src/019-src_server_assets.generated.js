// src/server/assets.generated.js
var require_assets_generated = __commonJS({
  "src/server/assets.generated.js"(exports2, module2) {
    module2.exports = {
      VERSION: "2.0",
      // In-page bootstrap (runs before the game). Edit freely.
      BOOTSTRAP: function wbBootstrap() {
        if (window.__WB_BOOT__) return;
        window.__WB_BOOT__ = true;
        var parts = {}, order = [], baseParts = {};
        window.__WB_PARTS__ = function(key, list) {
          try {
            if (!key || !list) return;
            if (!(key in parts)) order.push(key);
            parts[key] = list.map(function(p) {
              return { label: String(p.label || ""), tags: String(p.tags || "") };
            });
            baseParts[String(key).replace(/__v-\d+$/, "")] = parts[key];
            if (order.length > 400) delete parts[order.shift()];
          } catch (e) {
          }
        };
        var realFetch = window.fetch;
        window.fetch = function(input, init) {
          try {
            var url = typeof input === "string" ? input : input && input.url || "";
            if (init && String(init.method || "").toUpperCase() === "POST" && /\/api\/image\/generate(\?|$)/.test(url) && typeof init.body === "string") {
              var body = JSON.parse(init.body);
              var p = parts[body.talentId] || parts[String(body.talentId || "").replace(/__v-\d+$/, "")] || baseParts[String(body.talentId || "").replace(/__v-\d+$/, "")];
              var cyc = {};
              try {
                cyc = JSON.parse(localStorage.getItem("wb:cycled") || "{}") || {};
              } catch (e2) {
              }
              if (p || cyc[body.talentId]) {
                if (p) body.parts = p;
                if (cyc[body.talentId]) body.forceVariant = true;
                init = Object.assign({}, init, { body: JSON.stringify(body) });
              }
              window.dispatchEvent(new CustomEvent("wb:generate", { detail: { key: body.talentId } }));
            }
          } catch (e) {
          }
          return realFetch.call(this, input, init);
        };
      },
      // The in-game settings menu. Edit freely; restart the bridge and reload the page.
      MENU: function wbMenu() {
        "use strict";
        if (window.__WB_MENU__) return;
        window.__WB_MENU__ = true;
        var isObj = function(v) {
          return v && typeof v === "object" && !Array.isArray(v);
        };
        var clone = function(v) {
          return v === void 0 ? void 0 : JSON.parse(JSON.stringify(v));
        };
        var same = function(a, b) {
          return JSON.stringify(a) === JSON.stringify(b);
        };
        function merge(a, b) {
          if (!isObj(b)) return b === void 0 ? clone(a) : clone(b);
          var out = isObj(a) ? clone(a) : {};
          Object.keys(b).forEach(function(k) {
            out[k] = isObj(b[k]) ? merge(out[k], b[k]) : clone(b[k]);
          });
          return out;
        }
        function getAt(o, p) {
          for (var i = 0; i < p.length; i++) {
            if (o == null) return void 0;
            o = o[p[i]];
          }
          return o;
        }
        function setAt(o, p, v) {
          for (var i = 0; i < p.length - 1; i++) {
            if (!isObj(o[p[i]])) o[p[i]] = {};
            o = o[p[i]];
          }
          Object.defineProperty(o, p[p.length - 1], { value: v, writable: true, enumerable: true, configurable: true });
        }
        function delAt(o, p) {
          for (var i = 0; i < p.length - 1; i++) {
            if (!isObj(o[p[i]])) return;
            o = o[p[i]];
          }
          delete o[p[p.length - 1]];
        }
        function h(tag, props) {
          var el = document.createElement(tag);
          props = props || {};
          Object.keys(props).forEach(function(k) {
            var v = props[k];
            if (v == null || v === false) return;
            if (k === "class") el.className = v;
            else if (k === "style") el.style.cssText = v;
            else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
            else if (k === "value") el.value = v;
            else if (k === "checked") el.checked = !!v;
            else if (k === "text") el.textContent = v;
            else el.setAttribute(k, v === true ? "" : v);
          });
          for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
          return el;
        }
        function add(el, c) {
          if (c == null || c === false) return;
          if (Array.isArray(c)) {
            c.forEach(function(x) {
              add(el, x);
            });
            return;
          }
          el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
        }
        function api(method, url, body) {
          return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : void 0, credentials: "same-origin" }).then(function(r) {
            return r.json().catch(function() {
              return {};
            }).then(function(j) {
              if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
              return j;
            });
          });
        }
        function local(k, v) {
          try {
            if (v === void 0) return JSON.parse(localStorage.getItem("wb:" + k));
            localStorage.setItem("wb:" + k, JSON.stringify(v));
          } catch (e) {
            return void 0;
          }
        }
        var titleCase = function(s) {
          return String(s || "").replace(/_/g, " ").replace(/\b\w/g, function(c) {
            return c.toUpperCase();
          });
        };
        function splitTags(s) {
          return String(s || "").split(",").map(function(x) {
            return x.trim();
          }).filter(Boolean);
        }
        function tagKey(t) {
          return String(t || "").trim().toLowerCase().replace(/^\(+|\)+$/g, "").replace(/:\s*-?[\d.]+$/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
        }
        function uniq(list) {
          var seen = {};
          return list.filter(function(x) {
            var k = tagKey(x);
            if (!k || seen[k]) return false;
            seen[k] = 1;
            return true;
          });
        }
        var S = {
          st: null,
          open: false,
          tab: local("tab") || "heroines",
          target: "everyone",
          viewHeroine: "",
          ops: {},
          ver: 0,
          sel: {},
          filter: {},
          status: "",
          statusOk: true,
          models: null,
          presets: {},
          renders: [],
          render: null,
          preview: null
        };
        var FAMILIES = [["anima", "Anima / Z-Image (UNET + CLIP + VAE)"], ["illustrious", "Illustrious XL (SDXL checkpoint)"], ["pony", "Pony (SDXL checkpoint)"], ["noobai", "NoobAI (SDXL checkpoint)"]];
        var PART_LABELS = ["Quality", "Arousal", "Aftermath", "Gaze", "Intoxication", "Reaction", "Focus", "Narration", "Gender", "Group", "Pose", "FlashAnatomy"];
        var BODY_PARTS = [["head", "Голова"], ["mouth", "Рот"], ["body", "Тело"], ["breasts", "Грудь"], ["ass", "Задница"], ["vagina", "Вагина"], ["misc", "Разное"], ["belly", "Живот"], ];
        var SCENE_GROUPS = [
          ["Intimate", /^(kissing|groped_ass|groped_tits|fingered|self_pleasure)$/],
          ["Bath", /bath/],
          ["Moments", /^patron_moment_/],
          ["Patron social", /^patron_(chatting|flirting|touching|bold|groping|groping_lap|intimate|intimate_lap)$/],
          ["Patron sex", /^patron_/],
          ["Sex", /^(handjob|fingering|blowjob|titfuck|sex|sex_rough|anal|facial|finish_|clean_with_mouth|cum_in_mouth|grinding|lap_dance|thigh_job|mutual_touching|deepthroat|cunnilingus|face_sitting|sixty_nine|breast_worship|riding|standing_sex|anal_fingering)/]
        ];
        function sceneGroupOf(id) {
          if (/_bed$/.test(id)) return "In bed (patron scenes)";
          for (var i = 0; i < SCENE_GROUPS.length; i++) if (SCENE_GROUPS[i][1].test(id)) return SCENE_GROUPS[i][0];
          return "Other";
        }
        function draftLayer(base, prefix) {
          var out = clone(base || {});
          Object.keys(S.ops).forEach(function(k) {
            var op = S.ops[k];
            if (op.path.length <= prefix.length) return;
            for (var i = 0; i < prefix.length; i++) if (op.path[i] !== prefix[i]) return;
            var rel = op.path.slice(prefix.length);
            if (op.del) delAt(out, rel);
            else setAt(out, rel, clone(op.value));
          });
          return out;
        }
        function heroineName(id) {
          var y = getAt(effective(id), ["prompts", "heroines", id, "name"]);
          return y || getAt(S.st.defaults, ["prompts", "heroines", id, "name"]) || titleCase(id);
        }
        function heroines() {
          return S.st ? Object.keys(getAt(S.st.defaults, ["prompts", "heroines"]) || {}) : [];
        }
        function addonByFile(f) {
          return S.st.addons.filter(function(x) {
            return x.file === f;
          })[0];
        }
        var SIMPLE = ["scenes", "looks", "tasks", "reactions", "expressions", "rooms", "parts"];
        function itemPaths(item, hid) {
          if (item === "character") return [["prompts", "heroines", hid]];
          if (item === "clothing") return [["prompts", "outfits"], ["prompts", "exposure"]];
          if (item === "patrons") return [["prompts", "patrons", "quality"], ["prompts", "patrons", "negative"], ["prompts", "patrons", "archetypes"]];
          if (item === "pipeline") return [["pipeline"]];
          var sp = item.split(".");
          if (sp[0] === "named") return [["prompts", "patrons", "named", item.slice(6)]];
          if (sp[0] === "moods" && sp[1] && sp[2]) return [["prompts", "moods", sp[1], item.slice(("moods." + sp[1] + ".").length)]];
          if (SIMPLE.indexOf(sp[0]) >= 0 && sp[1]) return [["prompts", sp[0], item.slice(sp[0].length + 1)]];
          return [];
        }
        function itemOf(rel) {
          var top = rel[0], sec2 = rel[1], a = rel[2], b = rel[3];
          if (top === "pipeline") return "pipeline";
          if (top !== "prompts" || !sec2) return null;
          if (sec2 === "heroines") return "character";
          if (sec2 === "outfits" || sec2 === "exposure") return "clothing";
          if (sec2 === "patrons") return a === "named" ? b ? "named." + b : null : "patrons";
          if (sec2 === "moods") return a && b ? "moods." + a + "." + b : null;
          if (SIMPLE.indexOf(sec2) >= 0) return a ? sec2 + "." + a : null;
          return null;
        }
        function addonValue(a, rel, hid) {
          if (rel[0] === "prompts" && rel[1] === "heroines") {
            var pick = function(layer) {
              var H = getAt(layer, ["prompts", "heroines"]) || {};
              return H[hid] || H[Object.keys(H)[0]];
            };
            var hl = a.heroine && a.heroine[hid];
            return hl && getAt(hl, ["prompts", "heroines", hid]) || pick(a.layer) || hl && pick(hl);
          }
          var base = getAt(a.layer, rel), own = a.heroine && a.heroine[hid] ? getAt(a.heroine[hid], rel) : void 0;
          if (own === void 0) return base;
          if (isObj(base) && isObj(own)) return Object.assign({}, base, own);
          return own;
        }
        function picks() {
          return draftLayer(S.st.picks || {}, ["picks"]);
        }
        function scopeOf(item, hid) {
          return item === "rulesAll" ? "_all" : heroSave(hid) || hid;
        }
        function sourceOf(item, hid) {
          var P = picks(), sc = scopeOf(item, hid);
          var pk = P[sc] && P[sc][item];
          if (pk === "mine") return "mine";
          var a = pk && addonByFile(pk);
          if (a && (a.items || []).indexOf(item) >= 0) return pk;
          for (var i = S.st.stack.length - 1; i >= 0; i--) {
            var b = addonByFile(S.st.stack[i]);
            if (b && (b.items || []).indexOf(item) >= 0) return b.file;
          }
          return "mine";
        }
        var effCache = {};
        function effective(hid) {
          var k = (hid || "") + "@" + S.st.revision + "." + S.ver;
          if (effCache[k]) return effCache[k];
          if (Object.keys(effCache).length > 8) effCache = {};
          var defaults = S.st.defaults;
          var eff = merge(merge(defaults, draftLayer(S.st.you, ["layer"])), hid ? draftLayer(heroLayer(hid), heroPath(hid)) : {});
          var items = {};
          S.st.stack.forEach(function(f) {
            var a = addonByFile(f);
            (a && a.items || []).forEach(function(it) {
              items[it] = 1;
            });
          });
          var P = picks();
          [scopeOf("", hid), "_all"].forEach(function(sc) {
            Object.keys(P[sc] || {}).forEach(function(it) {
              if (P[sc][it] !== "mine") items[it] = 1;
            });
          });
          Object.keys(items).forEach(function(item) {
            if (item === "character" && !hid) return;
            var src = sourceOf(item, hid);
            if (src === "mine") return;
            var a = addonByFile(src);
            itemPaths(item, hid).forEach(function(rel) {
              var v = addonValue(a, rel, hid);
              if (v === void 0) return;
              setAt(eff, rel, isObj(v) ? merge(getAt(defaults, rel), v) : clone(v));
            });
          });
          effCache[k] = eff;
          return eff;
        }
        function E(rel) {
          return getAt(effective(S.viewHeroine), rel);
        }
        function D(rel) {
          return getAt(S.st.defaults, rel);
        }
        function shared(rel) {
          return getAt(merge(S.st.defaults, draftLayer(S.st.you, ["layer"])), rel);
        }
        function origin(rel) {
          var item = itemOf(rel), hid = S.viewHeroine;
          if (item) {
            var src = sourceOf(item, hid);
            if (src !== "mine") {
              var a = addonByFile(src);
              return { id: "addon", name: a ? a.name : src };
            }
          }
          if ((rel[0] === "prompts" || heroinePipe(rel)) && getAt(draftLayer(heroLayer(hid), heroPath(hid)), rel) !== void 0) return { id: "heroine", name: "yours" };
          if (getAt(draftLayer(S.st.you, ["layer"]), rel) !== void 0) return { id: "you", name: "shared" };
          return { id: "game", name: "Game" };
        }
        function heroinePipe(rel) {
          if (rel[0] !== "pipeline") return false;
          if (rel[1] === "family" || rel[1] === "teacache" || rel[1] === "sdxlCache") return true;
          return rel[1] === "families" && !(rel[3] === "quality" || rel[3] === "negative");
        }
        function tpath(rel) {
          if (rel[0] === "prompts" && (rel[1] === "rulesAll" || rel[1] === "conditions" || rel[1] === "negatives" && app("sharedNegatives"))) return ["layer"].concat(rel);
          if (rel[0] === "prompts" && rel[1] === "heroines" && rel[2]) return heroPath(rel[2]).concat(rel);
          return (rel[0] === "prompts" || heroinePipe(rel)) && S.viewHeroine ? heroPath(S.viewHeroine).concat(rel) : ["layer"].concat(rel);
        }
        function heroSave(hid) {
          var st = S.st, info = st.saveInfo || {}, saves = st.saves || {};
          if (!hid) return "";
          if (st.activeSave && saves[st.activeSave] && info[st.activeSave] && info[st.activeSave].heroine === hid) return st.activeSave;
          var best = "", at = -1;
          Object.keys(info).forEach(function(id) {
            var m = info[id];
            if (m && m.heroine === hid && saves[id] && (m.at || 0) > at) {
              best = id;
              at = m.at || 0;
            }
          });
          return best;
        }
        function heroPath(hid) {
          var id = heroSave(hid);
          return id ? ["saves", id] : ["heroine", hid];
        }
        function heroLayer(hid) {
          var id = heroSave(hid);
          return (id ? (S.st.saves || {})[id] : (S.st.heroineLayers || {})[hid]) || {};
        }
        function app(k) {
          var op = S.ops["app" + k];
          return op ? op.value : S.st.app[k];
        }
        var undoStack = [], redoStack = [], undoGroup = null, undoLast = { key: "", at: 0 };
        function remember(k) {
          if (S.undoing) return;
          var now = Date.now();
          redoStack = [];
          if (!undoGroup) {
            if (undoLast.key === k && now - undoLast.at < 1500 && undoStack.length) {
              undoLast.at = now;
              return;
            }
            undoGroup = { items: [], keys: {} };
            undoStack.push(undoGroup);
            if (undoStack.length > 200) undoStack.shift();
            setTimeout(function() {
              undoGroup = null;
            }, 0);
          }
          if (!undoGroup.keys[k]) {
            undoGroup.keys[k] = 1;
            undoGroup.items.push({ k, prev: S.ops[k] ? clone(S.ops[k]) : null });
          }
          undoLast = { key: undoGroup.items.length === 1 ? k : "", at: now };
        }
        function swapGroup(g) {
          var back = { items: g.items.map(function(it) {
            return { k: it.k, prev: S.ops[it.k] ? clone(S.ops[it.k]) : null };
          }), keys: g.keys };
          g.items.slice().reverse().forEach(function(it) {
            if (it.prev) S.ops[it.k] = it.prev;
            else delete S.ops[it.k];
          });
          undoLast = { key: "", at: 0 };
          undoGroup = null;
          S.ver++;
          return back;
        }
        function undoEdit() {
          var g = undoStack.pop();
          if (!g) {
            say("Nothing to undo.", true);
            return;
          }
          redoStack.push(swapGroup(g));
          say("Undid the last edit (" + g.items.length + " change" + (g.items.length > 1 ? "s" : "") + ").", true);
          render();
        }
        function redoEdit() {
          var g = redoStack.pop();
          if (!g) {
            say("Nothing to redo.", true);
            return;
          }
          undoStack.push(swapGroup(g));
          say("Redid the edit (" + g.items.length + " change" + (g.items.length > 1 ? "s" : "") + ").", true);
          render();
        }
        function clearUndo() {
          undoStack = [];
          redoStack = [];
          undoGroup = null;
          undoLast = { key: "", at: 0 };
        }
        function setDraft(path, value) {
          var k = path.join("");
          remember(k);
          S.ops[k] = { path, value: clone(value) };
          S.ver++;
          paintFooter();
        }
        function delDraft(path) {
          var k = path.join("");
          remember(k);
          S.ops[k] = { path, del: true };
          S.ver++;
          paintFooter();
        }
        function dropBelow(p) {
          var pre = p.join("") + "";
          Object.keys(S.ops).forEach(function(k) {
            if (k.indexOf(pre) === 0) {
              remember(k);
              delete S.ops[k];
            }
          });
        }
        function setPick(item, value) {
          var path = ["picks", scopeOf(item, S.viewHeroine), item];
          if (value) setDraft(path, value);
          else delDraft(path);
        }
        function edit(rel, value) {
          var item = itemOf(rel), hid = S.viewHeroine;
          if (item && sourceOf(item, hid) !== "mine") {
            var copies = item === "pipeline" ? pipeCopies(sourceOf(item, hid)) : itemPaths(item, hid).map(function(ip) {
              return [ip, clone(E(ip))];
            });
            setPick(item, "mine");
            copies.forEach(function(c) {
              var p = tpath(c[0]);
              dropBelow(p);
              remember(p.join(""));
              delete S.ops[p.join("")];
              if (c[1] !== void 0) setDraft(p, c[1]);
            });
          }
          var tp = tpath(rel);
          remember(tp.join(""));
          delete S.ops[tp.join("")];
          setDraft(tp, value);
        }
        function pipeCopies(file) {
          var out = [], a = addonByFile(file) || {};
          var theirs = merge(getAt(a.layer || {}, ["pipeline"]) || {}, getAt((a.heroine || {})[S.viewHeroine] || {}, ["pipeline"]) || {});
          (function walk(rel, v) {
            if (heroinePipe(rel) && (!isObj(v) || rel.length >= 4)) {
              out.push([rel, clone(E(rel))]);
              return;
            }
            if (isObj(v)) Object.keys(v).forEach(function(k) {
              walk(rel.concat(k), v[k]);
            });
          })(["pipeline"], theirs);
          return out;
        }
        function restore(rel) {
          var p = tpath(rel);
          dropBelow(p);
          if (p[0] === "heroine" || p[0] === "saves") {
            var d = D(rel), sh = shared(rel);
            if (same(d, sh) || d === void 0) delDraft(p);
            else setDraft(p, d);
          } else delDraft(p);
          var item = itemOf(rel);
          if (item && sourceOf(item, S.viewHeroine) !== "mine") setPick(item, "mine");
          if (!item && rel[0] === "prompts" && rel.length === 2) {
            S.st.addons.forEach(function(a) {
              (a.items || []).forEach(function(it) {
                if (itemOf(itemPaths(it, S.viewHeroine)[0] || []) === it && (itemPaths(it, S.viewHeroine)[0] || [])[1] === rel[1] && sourceOf(it, S.viewHeroine) !== "mine") setPick(it, "mine");
              });
            });
          }
        }
        function isDirty(rel) {
          return !!S.ops[tpath(rel).join("")];
        }
        function count() {
          return Object.keys(S.ops).length;
        }
        function save() {
          var ops = Object.keys(S.ops).map(function(k) {
            var o = S.ops[k];
            return o.del ? { path: o.path, delete: true } : { path: o.path, value: o.value };
          });
          if (!ops.length) {
            say("Nothing to save.", true);
            return Promise.resolve();
          }
          say("Saving\u2026", true);
          var renamed = ops.some(function(o) {
            return /(^|\u0001)prompts\u0001heroines\u0001[^\u0001]+(\u0001name)?$/.test(o.path.join("")) || o.path[0] === "picks";
          });
          return api("PATCH", "/bridge/api/settings", { ops, revision: S.st.revision }).then(function(j) {
            S.ops = {};
            S.ver++;
            clearUndo();
            setState(j.state);
            if (renamed) syncNamesToGame();
            if (j.warnings && j.warnings.length) {
              var _w = j.warnings;
              var _t = _w.slice(0, 5).map(function(x) {
                if (x.kind === "string") return x.path + ": обрезано с " + x.from + " до " + x.to;
                if (x.kind === "array") return x.path + ": осталось " + x.to + " из " + x.from;
                if (x.kind === "number") return x.path + ": " + x.from + " → " + x.to;
                if (x.kind === "keys") return x.path + ": выброшено ключей " + x.count;
                return x.path;
              });
              setTimeout(function() {
                say("Сохранено, но обрезано (" + _w.length + "): " + _t.join(" · ") + (_w.length > 5 ? " …" : ""), false);
              }, 0);
              try {
                console.warn("[Wayward Bridge] при сохранении обрезано:", _w);
              } catch (e) {
              }
            }
            var key = S.st.lastKey;
            if (S.st.app.redrawAfterSave !== false && WBPIC.redrawCurrent()) say("Saved. Redrawing the game's current picture with the new settings \u2014 it replaces the picture in the game and shows in the Prompt inspector.", true);
            else if (S.st.app.redrawAfterSave !== false && key && !/^patron_/.test(key)) {
              say("Saved. Redrawing the current picture with the new settings\u2026", true);
              api("POST", "/bridge/api/redraw", { key, wait: true }).then(function(r) {
                WBPIC.useImage(r.image);
                say("Saved and redrawn: the new picture is in the game and in the Prompt inspector.", true);
              }).catch(function() {
                say("Saved and applied. Pictures redraw with the new settings the next time the game shows them.", true);
              });
            } else say("Saved and applied. Pictures redraw with the new settings the next time the game shows them.", true);
          }).catch(function(e) {
            say("Not saved: " + e.message, false);
          });
        }
        function syncNamesToGame() {
          var store = window.__WB_STORE__;
          if (!store || !store.getState || !S.st) return 0;
          var n = 0;
          try {
            var prev = store.getState(), st = prev && prev.state;
            if (!st || !st.characters) return 0;
            var next = null;
            Object.keys(st.characters).forEach(function(k) {
              var c = st.characters[k];
              if (!c) return;
              var aid = String(c.archetypeId || "").toLowerCase();
              heroines().forEach(function(hid) {
                if (aid.split("_")[0] !== hid) return;
                var want = heroineName(hid);
                if (want && c.name !== want) {
                  next = next || Object.assign({}, st.characters);
                  next[k] = Object.assign({}, c, { name: want });
                  n++;
                }
              });
            });
            if (next) store.setState(function(p) {
              return Object.assign({}, p, { state: Object.assign({}, p.state, { characters: next }) });
            });
          } catch (e) {
            console.warn("[Settings UI Mod] rename in game", e);
          }
          return n;
        }
        function discard() {
          S.ops = {};
          S.ver++;
          clearUndo();
          say("Changes discarded.", true);
          render();
        }
        function setState(st) {
          var first = !S.st;
          S.st = st;
          effCache = {};
          if (first) setTimeout(syncNamesToGame, 1500);
          syncCustomWives();
          if (!S.viewHeroine || heroines().indexOf(S.viewHeroine) < 0) S.viewHeroine = st.activeHeroine || st.live && st.live.heroine || st.currentHeroine || heroines()[0] || "";
          if (S.open && !isTyping()) render();
          paintButton();
        }
        function customWivesNow() {
          try {
            var raw = JSON.parse(localStorage.getItem("wayward-custom-wives") || "null");
            return (raw && raw.state && raw.state.wives || []).map(function(w) {
              return { id: w.id, name: w.inputs && w.inputs.name || "" };
            });
          } catch (e) {
            return [];
          }
        }
        function syncCustomWives() {
          var list = customWivesNow(), sig = JSON.stringify(list);
          if (sig === S.wivesSig) return;
          var known = Object.keys(getAt(S.st.defaults, ["prompts", "heroines"]) || {}).filter(function(k) {
            return /^custom_/.test(k);
          }).sort().join(",");
          var mine = list.map(function(w) {
            return w.id;
          }).sort().join(",");
          var names = list.every(function(w) {
            return getAt(S.st.defaults, ["prompts", "heroines", w.id, "name"]) === w.name;
          });
          S.wivesSig = sig;
          if (known === mine && names) return;
          api("POST", "/bridge/api/custom-heroines", { list }).then(function(j) {
            S.st = j.state;
            effCache = {};
            if (S.open && !isTyping()) render();
          }).catch(function() {
            S.wivesSig = "";
          });
        }
        window.addEventListener("storage", function(e) {
          if (e.key === "wayward-custom-wives") syncCustomWives();
        });
        var lastArch = null;
        function activeHer() {
          try {
            var s = window.__WB_STORE__;
            if (!s || !s.getState) return null;
            var st = s.getState();
            if (!st || !st.started) return null;
            var g = st.state || {}, chars = g.characters || {};
            var c = chars[g.primaryCharacterId] || chars.wife || chars[Object.keys(chars)[0]];
            if (!c) return null;
            var ga = c.generatedArchetype;
            var roll = JSON.stringify([c.traitsAtGeneration || null, c.growthRates || null, ga ? ga.id : ""]);
            var hsh = 0;
            for (var i = 0; i < roll.length; i++) hsh = (hsh << 5) - hsh + roll.charCodeAt(i) | 0;
            var hsh2 = 0;
            for (var k = roll.length - 1; k >= 0; k--) hsh2 = (hsh2 << 7) + hsh2 + roll.charCodeAt(k) | 0;
            var rolled = c.traitsAtGeneration ? (hsh >>> 0).toString(36) + (hsh2 >>> 0).toString(36) : "";
            var save2 = typeof g.wbPlaythrough === "string" && /^[a-z0-9]{4,16}$/.test(g.wbPlaythrough) ? g.wbPlaythrough : "";
            return {
              archetype: String(c.archetypeId || ""),
              name: String(c.name || ""),
              save: save2,
              rolled,
              generated: ga ? { id: ga.id, shortname: ga.shortname, name: ga.name, imageBase: ga.imageBase, imageNegative: ga.imageNegative } : null
            };
          } catch (e) {
            return null;
          }
        }
        function setViewHeroine(h2, force) {
          if (!h2 || h2 === S.viewHeroine && !force) return;
          var was = S.viewHeroine;
          S.viewHeroine = h2;
          if (S.br && S.br.heroine === was) {
            S.br.heroine = h2;
            S.br.scene = "";
            S.br.files = null;
          }
          S.test = null;
          S.preview = null;
          if (!S.open) return;
          try {
            var a = root.activeElement;
            if (a && a.blur) a.blur();
          } catch (e) {
          }
          hideSug();
          closePopups();
          render();
        }
        var newGamePending = false, idChangePending = false;
        function assignNewSaveId() {
          var her = activeHer();
          if (!her) return false;
          newGamePending = true;
          idChangePending = true;
          var ok = stampPlaythrough(her);
          if (!ok) {
            newGamePending = false;
            idChangePending = false;
          }
          return ok;
        }
        function stampPlaythrough(her) {
          var id = newGamePending || !her.rolled ? "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5) : her.rolled.slice(0, 16);
          newGamePending = false;
          try {
            window.__WB_STORE__.setState(function(x) {
              var st = {};
              for (var k in x.state) st[k] = x.state[k];
              st.wbPlaythrough = id;
              return { state: st };
            });
          } catch (e) {
            return false;
          }
          return true;
        }
        function wrapNewGame(store) {
          try {
            var st = store.getState(), patch = {};
            ["newGame", "startGameWithWifeArchetype", "startGameWithPicks"].forEach(function(name) {
              var orig = st[name];
              if (typeof orig !== "function" || orig._wb) return;
              var w = function() {
                newGamePending = true;
                return orig.apply(this, arguments);
              };
              w._wb = true;
              patch[name] = w;
            });
            if (Object.keys(patch).length) store.setState(patch);
          } catch (e) {
          }
        }
        function checkActiveHeroine() {
          var her = activeHer();
          if (!her || !S.st) return;
          if (!her.save) {
            stampPlaythrough(her);
            return;
          }
          var a = her.archetype + "|" + (her.generated ? her.generated.id + "|" + her.generated.shortname : "") + "|" + her.save;
          if (a === lastArch) return;
          var first = lastArch === null;
          lastArch = a;
          her.first = first;
          if (idChangePending) {
            her.idChange = true;
            idChangePending = false;
          }
          api("POST", "/bridge/api/active-heroine", her).then(function(j) {
            if (a !== lastArch) return;
            if (!j || !j.heroine) return;
            if (j.reload && !count()) {
              say("Loading " + (her.name || heroineName(j.heroine)) + "'s settings \u2014 the page reloads once so every picture uses them\u2026", true);
              setTimeout(function() {
                location.reload();
              }, 900);
              return;
            }
            var saveChanged = (S.st.activeSave || "") !== (j.state.activeSave || "");
            S.st = j.state;
            effCache = {};
            S.ver++;
            var changed = S.viewHeroine !== j.heroine;
            setViewHeroine(j.heroine, saveChanged);
            if (j.reload) say("Save or discard your changes, then reload the page (F5): pictures already shown were drawn with the other save's settings.", false);
            paintButton();
            if (her.idChange) say("New save ID " + String(j.save || "").slice(String(j.save || "").indexOf(".") + 1) + ". Now save your game in its slot so the save keeps it.", true);
            else if (j.isNew && !first) say("New save of " + heroineName(j.heroine) + ": it starts with her most recent settings, and keeps its own from now on.", true);
            else if (changed && !first) say("Showing " + heroineName(j.heroine) + "'s settings \u2014 the heroine in play.", true);
          }).catch(function() {
            lastArch = null;
          });
        }
        var lastTickDay = 0, dayEncounters = 0, prevPatron = false;
        function grantNursery() {
          try {
            window.__WB_STORE__.setState(function(x) {
              var st = x.state || {}, tav = st.tavern || {};
              var q = (tav.qualityUpgrades || []).slice();
              if (q.indexOf("nursery") >= 0) return {};
              q.push("nursery");
              var ns = {};
              for (var k in st) ns[k] = st[k];
              ns.tavern = Object.assign({}, tav, { qualityUpgrades: q });
              return { state: ns };
            });
          } catch (e) {}
        }
        function checkDay() {
          try {
            var s = window.__WB_STORE__;
            if (!s || !s.getState) return;
            var st = s.getState();
            if (!st || !st.started) return;
            var g = st.state || {};
            var has = !!(g.activeScene && g.activeScene.patron);
            if (has && !prevPatron) dayEncounters++;
            prevPatron = has;
            var ds = g.dailyState;
            var day = ds && typeof ds.day === "number" ? ds.day : 0;
            if (!day && typeof g.slot === "number") day = Math.floor(g.slot / 1440) + 1;
            if (!day || day === lastTickDay) return;
            var her = activeHer();
            var pt = her && her.save;
            if (!pt) return;
            lastTickDay = day;
            var sc = g.activeScene || {}, pat = sc.patron || {};
            var ch = g.characters && g.characters[g.primaryCharacterId];
            var trust = ch && ch.relationship ? Number(ch.relationship.trust) : 0;
            var ctx = {
              patronId: String(pat.customerId || ""),
              group: Array.isArray(pat.joinedPatronIds) && pat.joinedPatronIds.length > 0,
              encounters: dayEncounters,
              trust: trust,
              father: String(pat.customerId || (sc.sex ? "player" : ""))
            };
            dayEncounters = 0;
            api("POST", "/bridge/api/childstate/tick", { playthrough: pt, day: day, ctx: ctx }).then(function(j) {
              if (j && j.state && j.state.children && j.state.children.length) grantNursery();
            }).catch(function() {});
          } catch (e) {}
        }
        (function hookStore(tries) {
          var s = window.__WB_STORE__;
          if (s && s.subscribe) {
            wrapNewGame(s);
            try {
              s.subscribe(function() {
                checkActiveHeroine();
                checkDay();
              });
            } catch (e) {
            }
            checkActiveHeroine();
            return;
          }
          if (tries < 60) setTimeout(function() {
            hookStore(tries + 1);
          }, 500);
        })(0);
        setInterval(checkActiveHeroine, 3e3);
        setInterval(checkDay, 3e3);
        setInterval(compatBanner, 3e3);
        function compatBanner() {
  try {
    var el = document.getElementById("wb-compat");
    var d = typeof S !== "undefined" && S && S.st && S.st.diagnostics ? S.st.diagnostics : null;
    var g = d && d.game ? d.game : null;
    var bad = [];
    if (d && !g) bad.push("index.html игры не читается");
    if (window.__wbOffline) bad.push("нет связи с бриджем — запусти Start-Wayward-Bridge.bat");
    if (g && g.hooks) {
      if (g.hooks.parts === false) bad.push("хук частей промпта (PARTS)");
      if (g.hooks.store === false) bad.push("доступ к стору игры (STORE)");
      if (g.hooks.customWives === false) bad.push("кнопка создания своей героини");
      if (g.hooks.partsBroken === true) bad.push("хук частей промпта собран, но ломает игру");
    }
    var tbl = g && g.tables ? g.tables : g && g.catalog ? g.catalog.found : null;
    if (Array.isArray(tbl) && tbl.length) bad.push("не найдено таблиц промптов: " + tbl.length);
    if (tbl && !Array.isArray(tbl) && typeof tbl === "object") {
      var miss = Object.keys(tbl).filter(function(k) {
        return !tbl[k];
      });
      if (miss.length) bad.push("не найдено таблиц промптов: " + miss.length + " (" + miss.slice(0, 4).join(", ") + ")");
    }
    window.__wbCompatDebug = { hasState: !!d, hasGame: !!g, hooks: g && g.hooks ? g.hooks : null, bad: bad.slice() };
    if (bad.length && Date.now() - (window.__wbCompatAt || 0) > 2500) {
      window.__wbCompatAt = Date.now();
      fetch("/bridge/api/state").then(function(r) {
        return r.json();
      }).then(function(j) {
        if (j && j.diagnostics && typeof S !== "undefined" && S && S.st) S.st.diagnostics = j.diagnostics;
      }).catch(function() {
      });
    }
    if (!bad.length) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "wb-compat";
      el.title = "Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
      el.addEventListener("click", function() {
        el.remove();
      });
      (document.body || document.documentElement).appendChild(el);
      if (!el.getBoundingClientRect().height) (document.documentElement || document.body).appendChild(el);
    }
    el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer";
    el.textContent = "⚠ Мод не совместим с текущей версией игры: " + bad.join(", ") + ". Клик — скрыть. Подробности: wayward-bridge-data/maintainer/latest.md";
  } catch (e) {
    try {
      console.warn("[wb-compat] ошибка:", e);
    } catch (_) {
    }
  }
}
        setInterval(function() {
          if (S.st) syncCustomWives();
        }, 3e3);
        function isTyping() {
          var a = root.activeElement;
          return !!(a && (a.tagName === "TEXTAREA" || a.tagName === "INPUT") && a.type !== "checkbox");
        }
        function refresh() {
          return api("GET", "/bridge/api/state").then(setState).catch(function(e) {
            say(e.message, false);
          });
        }
        function bridgePing() {
          return api("GET", "/bridge/api/ping").then(function(j) {
            if (window.__wbOffline) {
              window.__wbOffline = false;
              refresh();
              return;
            }
            if (j && S.st && typeof j.revision === "number" && j.revision !== S.st.revision) refresh();
          }).catch(function() {
            window.__wbOffline = true;
          });
        }
        setInterval(function() {
          if (document.visibilityState === "visible") bridgePing();
        }, 1e4);
        function loadModels(rescan) {
          return api("GET", "/bridge/api/models" + (rescan ? "?rescan=1" : "")).then(function(j) {
            S.models = j;
            if (S.open && !isTyping()) render();
            return j;
          }).catch(function() {
          });
        }
        function loadPresets() {
          return api("GET", "/bridge/api/presets").then(function(j) {
            S.presets = j.presets || {};
            if (S.open && !isTyping()) render();
          }).catch(function() {
          });
        }
        var host = document.createElement("div");
        host.id = "wayward-bridge-ui";
        host.style.cssText = "position:fixed;inset:auto;z-index:2147483000;";
        var root = host.attachShadow({ mode: "open" });
        var styleEl = document.createElement("style");
        styleEl.textContent = CSS();
        root.appendChild(styleEl);
        var btn = h("button", { class: "fab", title: "Settings UI Mod 2.0", onclick: function() {
          if (!btn._dragged) toggle();
        } }, h("span", { class: "dot" }), "Pippa");
        var overlay = h("div", { class: "overlay", onmousedown: function(e) {
          if (e.target === overlay) toggle(false);
        } });
        var layer2 = h("div", { class: "layer2" });
        root.appendChild(btn);
        root.appendChild(overlay);
        root.appendChild(layer2);
        (function mount() {
          if (!document.body) return setTimeout(mount, 50);
          document.body.appendChild(host);
        })();
        (function drag() {
          var pos = local("fab");
          if (pos) {
            btn.style.right = "auto";
            btn.style.bottom = "auto";
            btn.style.left = pos.x + "px";
            btn.style.top = pos.y + "px";
          }
          var sx, sy, ox, oy, moving = false;
          btn.addEventListener("pointerdown", function(e) {
            sx = e.clientX;
            sy = e.clientY;
            var r = btn.getBoundingClientRect();
            ox = r.left;
            oy = r.top;
            moving = true;
            btn._dragged = false;
            try {
              btn.setPointerCapture(e.pointerId);
            } catch (x) {
            }
          });
          btn.addEventListener("pointermove", function(e) {
            if (!moving) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (!btn._dragged && Math.abs(dx) + Math.abs(dy) < 6) return;
            btn._dragged = true;
            btn.style.right = "auto";
            btn.style.bottom = "auto";
            btn.style.left = Math.max(0, Math.min(window.innerWidth - 80, ox + dx)) + "px";
            btn.style.top = Math.max(0, Math.min(window.innerHeight - 34, oy + dy)) + "px";
          });
          btn.addEventListener("pointerup", function() {
            moving = false;
            if (btn._dragged) {
              var r = btn.getBoundingClientRect();
              local("fab", { x: Math.round(r.left), y: Math.round(r.top) });
              setTimeout(function() {
                btn._dragged = false;
              }, 0);
            }
          });
        })();
        function paintButton() {
          var on = S.st && S.st.diagnostics && S.st.diagnostics.comfy && S.st.diagnostics.comfy.online;
          btn.querySelector(".dot").className = "dot " + (on ? "on" : "off");
          btn.title = "Settings UI Mod 2.0 \u2014 ComfyUI " + (on ? "online" : "offline");
        }
        function toggle(force) {
          var open = force == null ? !S.open : force;
          if (!open && S.open && count()) {
            if (confirm("You have " + count() + " unsaved change" + (count() > 1 ? "s" : "") + ". Save and apply them now?\n\nOK = save \xB7 Cancel = keep them unsaved for later")) save();
          }
          S.open = open;
          overlay.style.display = S.open ? "flex" : "none";
          closePopups();
          hideSug();
          if (S.open) {
            loadTags();
            render();
            refresh();
            if (!S.models) loadModels(false);
            loadPresets();
            if (S.tab === "inspector") loadRenders();
          }
        }
        ["keydown", "keyup", "keypress"].forEach(function(t) {
          host.addEventListener(t, function(e) {
            if (S.open) e.stopPropagation();
          });
        });
        window.addEventListener("keydown", function(e) {
          if (S.open && (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z") && !isTyping()) {
            e.preventDefault();
            e.stopPropagation();
            undoEdit();
            return;
          }
          if (S.open && (e.ctrlKey || e.metaKey) && (e.shiftKey && (e.key === "z" || e.key === "Z") || e.key === "y" || e.key === "Y") && !isTyping()) {
            e.preventDefault();
            e.stopPropagation();
            redoEdit();
            return;
          }
          if (!S.open || e.key !== "Escape") return;
          if (sug.open || layer2.querySelector(".panel-pop,.shade")) return;
          e.stopPropagation();
          toggle(false);
        }, true);
        var statusEl = h("span", { class: "status" });
        var footCount = h("span", { class: "fcount" });
        var undoBtn = h("button", { type: "button", class: "link", title: "Undo the last edit (Ctrl+Z outside a text box)", onclick: function() {
          undoEdit();
        } }, "\u21B6 undo");
        var redoBtn = h("button", { type: "button", class: "link", title: "Redo the edit you just undid (Ctrl+Y or Ctrl+Shift+Z outside a text box)", onclick: function() {
          redoEdit();
        } }, "\u21B7 redo");
        function say(m, ok) {
          S.status = m;
          S.statusOk = ok !== false;
          statusEl.textContent = m;
          statusEl.style.color = S.statusOk ? "#4ade80" : "#f87171";
        }
        function paintFooter() {
          var n = count();
          undoBtn.style.display = undoStack.length ? "" : "none";
          redoBtn.style.display = redoStack.length ? "" : "none";
          footCount.textContent = n ? n + " unsaved change" + (n > 1 ? "s" : "") : "No unsaved changes";
          footCount.style.color = n ? "#fbbf24" : "#78716c";
        }
        function sec(title, color, intro) {
          var s = h("div", { class: "sec" }, h("div", { class: "stitle" }, title));
          if (intro) s.appendChild(h("div", { class: "note" }, intro));
          for (var i = 3; i < arguments.length; i++) add(s, arguments[i]);
          return s;
        }
        var NEUTRAL_BG = ["#57534e", "#44403c", "#292524", "#3f3f46"], DANGER_BG = ["#7f1d1d", "#9f1239", "#b91c1c", "#4c0519", "#7c2d12", "#991b1b"];
        function sbtn(label, bg, onclick, title) {
          var kind = bg === "transparent" ? " ghost" : !bg || NEUTRAL_BG.indexOf(bg) >= 0 ? " neutral" : DANGER_BG.indexOf(bg) >= 0 ? " danger" : " prim";
          return h("button", { class: "sbtn" + kind, type: "button", onclick, title }, label);
        }
        function row() {
          var r = h("div", { class: "row" });
          for (var i = 0; i < arguments.length; i++) add(r, arguments[i]);
          return r;
        }
        function lab(text) {
          return h("label", { class: "lab" }, text);
        }
        function badgeFor(rel) {
          var o = origin(rel);
          var cls = o.id === "game" ? "b-game" : o.id === "you" ? "b-you" : o.id === "heroine" ? "b-hero" : "b-addon";
          return h("span", { class: "badge " + cls, title: "Value comes from: " + o.name }, o.id === "game" ? "default" : o.name);
        }
        function promptBox(label, rel, opts) {
          opts = opts || {};
          var v = E(rel);
          var ta = h(opts.single ? "input" : "textarea", {
            class: "ta" + (isDirty(rel) ? " dirty" : ""),
            style: opts.height ? "height:" + opts.height : null,
            value: v == null ? "" : String(v),
            placeholder: opts.placeholder || "",
            spellcheck: "false",
            "data-tags": opts.tags === false ? null : "1",
            oninput: function() {
              edit(rel, ta.value);
              ta.classList.add("dirty");
              if (opts.oninput) opts.oninput(ta.value);
            }
          });
          if (opts.isChar) ta._isChar = true;
          var cnt = h("span", { class: "cnt" });
          var LIM = opts.single ? 4e3 : 32e3;
          var syncCnt = function() {
            var n = ta.value.length;
            cnt.textContent = n + " / " + LIM;
            cnt.classList.toggle("over", n > LIM);
          };
          ta.addEventListener("input", syncCnt);
          syncCnt();
          var def = opts.gameValue !== void 0 ? opts.gameValue : D(rel);
          var hint = typeof def === "string" && def.trim() && def.trim() !== String(v == null ? "" : v).trim() ? h("div", { class: "gamehint", title: def }, "Game default: " + def) : null;
          return h("div", { class: "field" }, label || opts.extra ? h("div", { class: "fh" }, label ? lab(label) : null, badgeFor(rel), opts.extra || null) : null, ta, opts.hint ? h("div", { class: "note" }, opts.hint) : null, opts.noDefaultHint ? null : hint, cnt);
        }
        function numBox(label, rel, opts) {
          opts = opts || {};
          var v = E(rel);
          var inp = h("input", {
            class: "inp num" + (isDirty(rel) ? " dirty" : ""),
            type: "number",
            step: opts.step || 1,
            min: opts.min,
            max: opts.max,
            value: v == null ? "" : v,
            oninput: function() {
              if (inp.value === "") return;
              var n = Number(inp.value);
              if (isFinite(n)) {
                edit(rel, n);
                inp.classList.add("dirty");
                if (opts.oninput) opts.oninput(n);
              }
            }
          });
          return h("div", { class: "mini" }, h("div", { class: "minilab" }, label), inp);
        }
        function checkBox(label, rel, onchange) {
          var cb = h("input", { type: "checkbox", checked: !!E(rel), onchange: function() {
            edit(rel, cb.checked);
            if (onchange) onchange(cb.checked);
          } });
          return h("label", { class: "cb" }, cb, " " + label);
        }
        function selectBox(rel, options, onchange, style) {
          var v = E(rel);
          var s = h(
            "select",
            { class: "sel" + (isDirty(rel) ? " dirty" : ""), style: style || null, onchange: function() {
              edit(rel, s.value);
              s.classList.add("dirty");
              if (onchange) onchange(s.value);
            } },
            options.map(function(o) {
              return h("option", { value: o[0], selected: String(o[0]) === String(v == null ? "" : v) }, o[1]);
            })
          );
          return s;
        }
        function listPick(rel, options) {
          var v = E(rel) == null ? "" : E(rel);
          return picker(options.map(function(o) {
            return { value: o[0], label: o[1] };
          }), v, function(nv) {
            edit(rel, nv);
            render();
          }, { folders: false, dirty: isDirty(rel), sortGroups: false });
        }
        function appCheck(label, key, hint) {
          var cb = h("input", { type: "checkbox", checked: !!app(key), onchange: function() {
            setDraft(["app", key], cb.checked);
          } });
          return h("div", { class: "field" }, h("label", { class: "cb" }, cb, " " + label), hint ? h("div", { class: "note" }, hint) : null);
        }
        function appText(label, key, placeholder, hint) {
          var inp = h("input", { class: "inp", value: app(key) || "", placeholder: placeholder || "", spellcheck: "false", oninput: function() {
            setDraft(["app", key], inp.value);
            inp.classList.add("dirty");
          } });
          return h("div", { class: "field" }, lab(label), inp, hint ? h("div", { class: "note" }, hint) : null);
        }
        function picker(items, value, onChange, opts) {
          opts = opts || {};
          var curItem = items.filter(function(i) {
            return String(i.value) === String(value);
          })[0];
          var b = h(
            "button",
            { type: "button", class: "pick" + (opts.dirty ? " dirty" : ""), title: curItem ? curItem.title || curItem.label : "" },
            h("span", { class: "pv" }, curItem ? curItem.label : value ? String(value) + (opts.missing ? " (not found)" : "") : opts.placeholder || "None"),
            curItem && curItem.active ? h("span", { class: "live" }, "\u25CF in game") : null,
            h("span", { class: "caret" }, "\u25BE")
          );
          b.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            openPicker(b, items, value, onChange, opts);
          });
          return h("div", { class: "pickwrap", style: opts.style || null }, b);
        }
        function closePopups() {
          layer2.querySelectorAll(".panel-pop").forEach(function(p) {
            p.remove();
          });
        }
        function openPicker(anchor, items, value, onChange, opts) {
          closePopups();
          var panel = h("div", { class: "panel-pop" });
          var q = h("input", { class: "inp", placeholder: "Search\u2026", style: "margin-bottom:6px" });
          var list = h("div", { class: "plist" });
          panel.appendChild(q);
          panel.appendChild(list);
          var cursor = -1;
          function choose(v) {
            panel.remove();
            onChange(v);
          }
          function item(it, indent) {
            return h(
              "button",
              { type: "button", class: "pitem" + (String(it.value) === String(value) ? " on" : ""), style: "padding-left:" + (6 + indent) + "px", title: it.title || it.label, "data-v": String(it.value), onclick: function(e) {
                e.stopPropagation();
                choose(it.value);
              } },
              it.short || it.label,
              it.active ? h("span", { class: "live" }, "\u25CF in game") : null
            );
          }
          function paint() {
            list.innerHTML = "";
            cursor = -1;
            var f = q.value.trim().toLowerCase();
            var shown = items.filter(function(it) {
              return !f || String(it.label).toLowerCase().indexOf(f) >= 0 || String(it.value).toLowerCase().indexOf(f) >= 0 || String(it.group || "").toLowerCase().indexOf(f) >= 0;
            });
            var groups = [], byGroup = {};
            shown.forEach(function(it) {
              var g = it.group || "";
              if (!byGroup[g]) {
                byGroup[g] = [];
                groups.push(g);
              }
              byGroup[g].push(it);
            });
            var last = /^(Other|Unknown|Ungrouped|Custom)$/;
            if (opts.sortGroups !== false) groups.sort(function(a, b) {
              if (!a) return -1;
              if (!b) return 1;
              if (last.test(a) !== last.test(b)) return last.test(a) ? 1 : -1;
              return a.localeCompare(b);
            });
            groups.forEach(function(g) {
              var its = byGroup[g];
              if (!g) {
                its.forEach(function(it) {
                  list.appendChild(item(it, 0));
                });
                return;
              }
              var d = h("details", { class: "pg" });
              d.open = !!f || its.some(function(it) {
                return String(it.value) === String(value) || it.active;
              }) || groups.length === 1;
              d.appendChild(h("summary", null, g + " (" + its.length + ")"));
              var folders = {}, order = [], loose = [];
              its.forEach(function(it) {
                var lbl = String(it.label).replace(/\\/g, "/"), cut = lbl.lastIndexOf("/");
                if (cut < 0 || opts.folders === false) {
                  loose.push(it);
                  return;
                }
                var fo = lbl.slice(0, cut);
                if (!folders[fo]) {
                  folders[fo] = [];
                  order.push(fo);
                }
                folders[fo].push(Object.assign({}, it, { short: lbl.slice(cut + 1) }));
              });
              loose.forEach(function(it) {
                d.appendChild(item(it, 12));
              });
              order.sort().forEach(function(fo) {
                var fd = h("details", { class: "pf" });
                fd.open = !!f || folders[fo].some(function(it) {
                  return String(it.value) === String(value);
                });
                fd.appendChild(h("summary", null, "\u{1F4C1} " + fo + " (" + folders[fo].length + ")"));
                folders[fo].forEach(function(it) {
                  fd.appendChild(item(it, 28));
                });
                d.appendChild(fd);
              });
              list.appendChild(d);
            });
            if (!shown.length) list.appendChild(h("div", { class: "note" }, "Nothing matches."));
          }
          function visible() {
            return Array.prototype.filter.call(list.querySelectorAll(".pitem"), function(b) {
              return b.offsetParent !== null;
            });
          }
          q.addEventListener("input", paint);
          q.addEventListener("keydown", function(e) {
            var vis = visible();
            if (e.key === "Escape") {
              e.stopPropagation();
              panel.remove();
            } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (!vis.length) return;
              cursor = (cursor + (e.key === "ArrowDown" ? 1 : -1) + vis.length) % vis.length;
              vis.forEach(function(b, i) {
                b.classList.toggle("cur", i === cursor);
              });
              vis[cursor].scrollIntoView({ block: "nearest" });
            } else if (e.key === "Enter") {
              e.preventDefault();
              var t = vis[cursor >= 0 ? cursor : 0];
              if (t) t.click();
            }
          });
          paint();
          layer2.appendChild(panel);
          var r = anchor.getBoundingClientRect();
          var w = Math.min(window.innerWidth - 16, Math.max(260, Math.min(r.width, 440)));
          panel.style.width = w + "px";
          panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
          var below = window.innerHeight - r.bottom - 12;
          var ht = Math.max(180, Math.min(360, below > 220 ? below : Math.floor(window.innerHeight * 0.5)));
          panel.style.maxHeight = ht + "px";
          panel.style.top = (below > 220 ? r.bottom + 4 : Math.max(8, r.top - ht - 4)) + "px";
          var on = list.querySelector(".pitem.on");
          if (on) on.scrollIntoView({ block: "center" });
          setTimeout(function() {
            q.focus();
          }, 0);
        }
        root.addEventListener("mousedown", function(e) {
          var path = e.composedPath ? e.composedPath() : [];
          if (!path.some(function(n) {
            return n.classList && (n.classList.contains("panel-pop") || n.classList.contains("pick"));
          })) closePopups();
        });
        function presetBar(kind, getData, applyData, color) {
          var store = S.presets && S.presets[kind] || {};
          var groupF = S.filter["pg:" + kind] || "";
          var groups = {};
          Object.keys(store).forEach(function(n) {
            groups[store[n].group || "Ungrouped"] = 1;
          });
          var gItems = [{ value: "", label: "All groups" }].concat(Object.keys(groups).sort().map(function(g) {
            return { value: g, label: g };
          }));
          var names = Object.keys(store).filter(function(n) {
            return !groupF || (store[n].group || "Ungrouped") === groupF;
          }).sort();
          var cur = S.sel["preset:" + kind] || "";
          if (cur && !store[cur]) cur = "";
          var pItems = [{ value: "", label: "None" }].concat(names.map(function(n) {
            return { value: n, label: n, group: store[n].group || "Ungrouped" };
          }));
          var nameInp = h("input", { class: "inp sm", placeholder: "Preset name", value: cur });
          var groupInp = h("input", { class: "inp sm", placeholder: "Group name", value: cur && store[cur] ? store[cur].group || "" : "" });
          return h(
            "div",
            { class: "presets" },
            h(
              "div",
              { class: "prow" },
              picker(gItems, groupF, function(v) {
                S.filter["pg:" + kind] = v;
                render();
              }, { width: 260, folders: false, style: "width:170px" }),
              picker(pItems, cur, function(v) {
                S.sel["preset:" + kind] = v;
                render();
              }, { width: 320, folders: false, style: "flex:1" })
            ),
            row(
              nameInp,
              groupInp,
              sbtn("Load", "#57534e", function() {
                if (!cur) return say("Choose a preset first.", false);
                applyData(store[cur].data);
                say('Loaded preset "' + cur + '". Save & Apply to keep it.', true);
                render();
              }),
              sbtn("Save As", color || "#7c3aed", function() {
                var n = nameInp.value.trim();
                if (!n) return say("Type a preset name.", false);
                api("POST", "/bridge/api/presets", { kind, name: n, group: groupInp.value.trim(), data: getData() }).then(function(j) {
                  S.presets = j.presets;
                  S.sel["preset:" + kind] = n;
                  say('Saved preset "' + n + '".', true);
                  render();
                }).catch(function(e) {
                  say(e.message, false);
                });
              }),
              sbtn("Delete", "#7f1d1d", function() {
                if (!cur || !confirm('Delete preset "' + cur + '"?')) return;
                api("DELETE", "/bridge/api/presets?kind=" + encodeURIComponent(kind) + "&name=" + encodeURIComponent(cur)).then(function(j) {
                  S.presets = j.presets;
                  S.sel["preset:" + kind] = "";
                  render();
                }).catch(function(e) {
                  say(e.message, false);
                });
              })
            )
          );
        }
        function applyMap(relPrefix, data) {
          (function walk(prefix, v) {
            if (isObj(v)) {
              Object.keys(v).forEach(function(k) {
                walk(prefix.concat(k), v[k]);
              });
              return;
            }
            if (!same(E(prefix), v)) edit(prefix, v);
          })(relPrefix, data);
        }
        var sug = { open: false, ta: null, items: [], i: 0, start: 0, end: 0, box: h("div", { class: "sug" }) };
        layer2.appendChild(sug.box);
        var TAGS = null;
        var ALIASES = null;
        function loadTags() {
          if (TAGS) return;
          TAGS = [];
          fetch("/bridge/api/tags").then(function(r) {
            return r.text();
          }).then(function(t) {
            TAGS = t.split("\n").filter(Boolean);
          }).catch(function() {
          });
          fetch("/bridge/api/tag-aliases").then(function(r) {
            return r.text();
          }).then(function(t) {
            ALIASES = t.split("\n").filter(Boolean).map(function(l) {
              var i = l.indexOf("	");
              return [l.slice(0, i), l.slice(i + 1)];
            });
          }).catch(function() {
          });
        }
        function caretXY(ta) {
          var cs = getComputedStyle(ta);
          var m = document.createElement("div");
          ["fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom", "borderTopWidth", "borderLeftWidth", "boxSizing", "width"].forEach(function(p) {
            m.style[p] = cs[p];
          });
          m.style.position = "fixed";
          m.style.left = "-9999px";
          m.style.top = "0";
          m.style.visibility = "hidden";
          m.style.borderStyle = "solid";
          m.style.whiteSpace = ta.tagName === "INPUT" ? "pre" : "pre-wrap";
          m.style.wordWrap = "break-word";
          m.style.overflow = "hidden";
          m.textContent = ta.value.slice(0, ta.selectionStart);
          var mark = document.createElement("span");
          mark.textContent = "\u200B";
          m.appendChild(mark);
          root.appendChild(m);
          var r = ta.getBoundingClientRect();
          var lh = parseFloat(cs.lineHeight) || 17;
          var x = r.left + mark.offsetLeft - ta.scrollLeft, y = r.top + mark.offsetTop - ta.scrollTop + lh;
          m.remove();
          return { x: Math.max(r.left, Math.min(x, r.right - 20)), y: Math.max(r.top + lh, Math.min(y + 2, r.bottom + 2)) };
        }
        function tokenAt(ta) {
          var pos = ta.selectionStart, text = ta.value;
          var start = Math.max(text.lastIndexOf(",", pos - 1), text.lastIndexOf("\n", pos - 1)) + 1;
          var endC = text.indexOf(",", pos);
          var nl = text.indexOf("\n", pos);
          if (endC < 0 || nl >= 0 && nl < endC) endC = nl >= 0 ? nl : text.length;
          return { start, end: endC, word: text.slice(start, pos).replace(/^\s+/, "") };
        }
        function showSug(ta) {
          loadTags();
          var tok = tokenAt(ta);
          var w = tok.word.toLowerCase().replace(/^\(+/, "").replace(/ /g, "_");
          if (w.length < 2 || !TAGS || !TAGS.length) return hideSug();
          var out = [], seen = {};
          var push = function(tag, alias) {
            if (seen[tag] || out.length >= 9) return;
            seen[tag] = 1;
            out.push({ tag, alias: alias || "" });
          };
          for (var i = 0; i < TAGS.length && out.length < 6; i++) if (TAGS[i].indexOf(w) === 0) push(TAGS[i]);
          if (ALIASES) {
            for (var a = 0; a < ALIASES.length && out.length < 8; a++) if (ALIASES[a][0].indexOf(w) === 0) push(ALIASES[a][1], ALIASES[a][0]);
          }
          for (var i2 = 0; i2 < TAGS.length && out.length < 9; i2++) if (TAGS[i2].indexOf(w) === 0) push(TAGS[i2]);
          for (var j = 0; j < TAGS.length && out.length < 9; j++) if (TAGS[j].indexOf(w) > 0) push(TAGS[j]);
          if (!out.length || out.length === 1 && out[0].tag === w && !out[0].alias) return hideSug();
          sug.open = true;
          sug.ta = ta;
          sug.items = out;
          sug.i = 0;
          sug.start = tok.start;
          sug.end = ta.selectionStart;
          paintSug();
          var p = caretXY(ta);
          sug.box.style.display = "block";
          sug.box.style.left = Math.max(4, Math.min(p.x, window.innerWidth - 300)) + "px";
          var hgt = sug.box.offsetHeight || 200;
          sug.box.style.top = (p.y + hgt + 8 > window.innerHeight ? Math.max(4, p.y - hgt - 22) : p.y) + "px";
        }
        function paintSug() {
          sug.box.innerHTML = "";
          sug.items.forEach(function(t, k) {
            sug.box.appendChild(h(
              "div",
              { class: "si" + (k === sug.i ? " on" : ""), onmousedown: function(e) {
                e.preventDefault();
                sug.i = k;
                acceptSug();
              } },
              h("span", { class: "sn" }, String(k + 1)),
              t.alias ? h("span", null, h("span", { class: "sal" }, t.alias.replace(/_/g, " ") + " \u2192 "), t.tag.replace(/_/g, " ")) : t.tag.replace(/_/g, " ")
            ));
          });
          sug.box.appendChild(h("div", { class: "shelp" }, "\u2191\u2193 choose \xB7 Enter/Tab insert \xB7 1\u20139 pick \xB7 Esc close"));
        }
        function hideSug() {
          sug.open = false;
          sug.ta = null;
          sug.box.style.display = "none";
        }
        function acceptSug() {
          var ta = sug.ta;
          if (!ta) return;
          var tag = sug.items[sug.i].tag.replace(/_/g, " ");
          var before = ta.value.slice(0, sug.start).replace(/,(\s*,)+\s*$/, ", "), after = ta.value.slice(sug.end);
          var lead = before && !/\s$/.test(before) ? " " : "";
          var sep = /^\s*,/.test(after) ? "" : after.trim() ? ", " : ", ";
          var ins = before + lead + tag + sep;
          ta.value = ins + after;
          ta.setSelectionRange(ins.length, ins.length);
          hideSug();
          sug.suppress = true;
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          sug.suppress = false;
          ta.focus();
        }
        root.addEventListener("keydown", function(e) {
          if (!sug.open || e.target !== sug.ta || e.isComposing || e.keyCode === 229) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            sug.i = (sug.i + (e.key === "ArrowDown" ? 1 : -1) + sug.items.length) % sug.items.length;
            paintSug();
          } else if (e.key === "Enter" || e.key === "Tab") acceptSug();
          else if (e.key === "Escape") hideSug();
          else if (/^[1-9]$/.test(e.key) && e.altKey) {
            var n = Number(e.key) - 1;
            if (n >= sug.items.length) return;
            sug.i = n;
            acceptSug();
          } else return;
          e.preventDefault();
          e.stopPropagation();
        }, true);
        function tagRange(text, ref) {
          var start = Math.max(text.lastIndexOf(",", ref - 1), text.lastIndexOf("\n", ref - 1)) + 1;
          var c = text.indexOf(",", ref), nl = text.indexOf("\n", ref);
          var end = c < 0 ? nl < 0 ? text.length : nl : nl >= 0 && nl < c ? nl : c;
          return [start, end];
        }
        root.addEventListener("keydown", function(e) {
          if (e.key !== "Backspace" && e.key !== "Delete") return;
          var ta = e.target;
          if (!ta || !ta.getAttribute || ta.getAttribute("data-tags") !== "1" || !app("tagDelete")) return;
          if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.isComposing || e.keyCode === 229 || ta.selectionStart !== ta.selectionEnd) return;
          if (sug.open && sug.ta === ta) return;
          var text = ta.value, pos = ta.selectionStart, ref;
          if (ta._typing != null) {
            var tr = tagRange(text, pos);
            if (tr[0] === ta._typing && pos >= tr[0] && pos <= tr[1] && (e.key === "Backspace" ? pos > tr[0] : pos < tr[1])) return;
          }
          if (e.key === "Backspace") {
            var left = text.slice(0, pos).replace(/[\s,]*$/, "");
            if (!left.length) return;
            ref = /[^\s,]/.test(text.charAt(pos - 1) || "") ? pos : left.length;
          } else {
            var lead = (text.slice(pos).match(/^[\s,]*/) || [""])[0].length;
            if (pos + lead >= text.length) return;
            ref = /[^\s,]/.test(text.charAt(pos) || "") && pos > 0 && /[^\s,]/.test(text.charAt(pos - 1)) ? pos : pos + lead;
            if (ref === pos + lead) ref = ref + 1;
          }
          var r = tagRange(text, ref);
          if (!text.slice(r[0], r[1]).trim()) return;
          e.preventDefault();
          e.stopPropagation();
          hideSug();
          var b = text.slice(0, r[0]).replace(/[\s,]*$/, ""), a = text.slice(r[1]).replace(/^[\s,]*/, "");
          ta.value = b && a ? b + ", " + a : b ? b + ", " : a;
          var caret = b ? b.length + 2 : 0;
          ta.setSelectionRange(caret, caret);
          sug.suppress = true;
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          sug.suppress = false;
        }, true);
        function tagSpan(text, pos) {
          var depth = 0, start = 0, end = text.length, i;
          for (i = 0; i < pos; i++) {
            var c = text[i];
            if (c === "(" || c === "[") depth++;
            else if ((c === ")" || c === "]") && depth > 0) depth--;
            else if ((c === "," || c === "\n") && depth === 0) start = i + 1;
          }
          depth = 0;
          for (i = 0; i < pos; i++) {
            var c2 = text[i];
            if (c2 === "(" || c2 === "[") depth++;
            else if ((c2 === ")" || c2 === "]") && depth > 0) depth--;
          }
          for (i = pos; i < text.length; i++) {
            var c3 = text[i];
            if (c3 === "(" || c3 === "[") depth++;
            else if ((c3 === ")" || c3 === "]") && depth > 0) depth--;
            else if ((c3 === "," || c3 === "\n") && depth === 0) {
              end = i;
              break;
            }
          }
          while (start < end && /\s/.test(text[start])) start++;
          while (end > start && /\s/.test(text[end - 1])) end--;
          return [start, end];
        }
        function reweight(tag, step) {
          var m = tag.match(/^\((.*):\s*(-?[0-9.]+)\)$/), core = tag, w = 1;
          if (m) {
            core = m[1];
            w = Number(m[2]) || 1;
          } else if (/^\((.*)\)$/.test(tag) && !/^\(.*\).*\(.*\)$/.test(tag)) {
            core = tag.slice(1, -1);
            w = 1.1;
          }
          w = Math.round((w + step) * 100) / 100;
          w = Math.max(0.1, Math.min(2, w));
          return Math.abs(w - 1) < 1e-3 ? core : "(" + core + ":" + w.toFixed(Math.round(w * 10) === w * 10 ? 1 : 2) + ")";
        }
        root.addEventListener("keydown", function(e) {
          if (!(e.ctrlKey || e.metaKey) || e.key !== "ArrowUp" && e.key !== "ArrowDown" || e.altKey || e.shiftKey) return;
          var ta = e.target;
          if (!ta || !ta.getAttribute || ta.getAttribute("data-tags") !== "1" || e.isComposing) return;
          var text = ta.value, r = tagSpan(text, ta.selectionStart);
          var tag = text.slice(r[0], r[1]);
          if (!tag.trim()) return;
          e.preventDefault();
          e.stopPropagation();
          hideSug();
          var nt = reweight(tag, e.key === "ArrowUp" ? 0.1 : -0.1);
          ta.value = text.slice(0, r[0]) + nt + text.slice(r[1]);
          var caret = r[0] + nt.length;
          ta.setSelectionRange(caret, caret);
          sug.suppress = true;
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          sug.suppress = false;
        }, true);
        root.addEventListener("input", function(e) {
          var t = e.target;
          if (!t || !t.getAttribute || t.getAttribute("data-tags") !== "1") return;
          if (sug.suppress) t._typing = null;
          else if (e.inputType && /^(insert|delete)/.test(e.inputType) && e.inputType !== "insertFromPaste") {
            var r = tagRange(t.value, t.selectionStart);
            t._typing = t.value.slice(r[0], r[1]).trim() ? r[0] : null;
          }
          if (!sug.suppress) showSug(t);
        }, true);
        root.addEventListener("mousedown", function(e) {
          if (e.target && e.target._typing != null) e.target._typing = null;
        }, true);
        root.addEventListener("keydown", function(e) {
          if (/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|PageUp|PageDown)$/.test(e.key) && e.target && e.target._typing != null && !sug.open) e.target._typing = null;
        }, true);
        root.addEventListener("focusout", function(e) {
          if (e.target && e.target._typing != null) e.target._typing = null;
        }, true);
        root.addEventListener("click", function(e) {
          if (sug.open && e.target === sug.ta) showSug(sug.ta);
        }, true);
        root.addEventListener("focusout", function(e) {
          if (e.target === sug.ta) setTimeout(function() {
            if (root.activeElement !== sug.ta) hideSug();
          }, 150);
        }, true);
        root.addEventListener("scroll", function(e) {
          if (sug.open && e.target !== sug.box) hideSug();
        }, true);
        function live() {
          return S.st && S.st.live || null;
        }
        function liveIds() {
          var l = live();
          if (!l) return {};
          var p = l.parsed || {}, out = { outfit: p.outfit, room: p.room, exposure: String(p.exposure || "").replace(/[^01]/g, ""), heroine: l.heroine };
          if (p.scene) out.scene = "scenes:" + (p.abed && E(["prompts", "scenes", p.scene + "_bed"]) ? p.scene + "_bed" : p.scene);
          else if (p.lookFocus) out.scene = "looks:" + p.lookFocus;
          else if (p.task) out.scene = "tasks:" + (p.task === "idle" && p.room === "bedroom" && E(["prompts", "tasks", "idle_bedroom"]) != null ? "idle_bedroom" : p.task);
          var lm = l.parts && l.parts.Mood ? l.parts.Mood : "";
          var match = function(group, path) {
            var tables = [getAt(S.st.defaults, path) || {}, E(path) || {}], hit = null;
            tables.forEach(function(t) {
              Object.keys(t).forEach(function(k) {
                if (!hit && lm && typeof t[k] === "string" && overlapKeys(lm, t[k]) >= 0.6) hit = group + ":" + k;
              });
            });
            return hit;
          };
          if (p.scene) {
            var own = E(["prompts", "expressions", p.scene]) != null ? p.scene : E(["prompts", "expressions", String(p.scene).replace(/^patron_/, "")]) != null ? String(p.scene).replace(/^patron_/, "") : "";
            out.mood = (lm ? match("patron", ["prompts", "moods", "patron"]) : null) || (own ? "expressions:" + own : null) || (lm ? match("work", ["prompts", "moods", "work"]) : null);
          } else if (p.mood) out.mood = "scene:" + p.mood;
          else if (lm) out.mood = match("work", ["prompts", "moods", "work"]);
          return out;
        }
        function overlapKeys(a, b) {
          var A = {};
          splitTags(a).forEach(function(t) {
            A[tagKey(t)] = 1;
          });
          var B = splitTags(b);
          if (!B.length) return 0;
          return B.filter(function(t) {
            return A[tagKey(t)];
          }).length / B.length;
        }
        function moodRel(v) {
          var p = String(v || ":").split(":");
          return p[0] === "expressions" ? ["prompts", "expressions", p[1]] : ["prompts", "moods", p[0], p[1]];
        }
        function moodItem(v) {
          var p = String(v || ":").split(":");
          return p[0] === "expressions" ? "expressions." + p[1] : "moods." + p[0] + "." + p[1];
        }
        function expSummary(mask) {
          mask = String(mask || "0000000");
          while (mask.length < 7) mask += "0";
          var top = mask[2] === "1" ? "topless" : mask[1] === "1" ? "top down" : mask[0] === "1" ? "bodice open" : "top covered";
          var skirt = mask[4] === "1" ? "skirt off" : mask[3] === "1" ? "skirt up" : "skirt down";
          var und = mask[6] === "1" ? "panties off" : mask[5] === "1" ? "panties aside" : "panties on";
          return top + ", " + skirt + ", " + und;
        }
        var TAB_ALIAS = { moods: ["scenes", "mood"], patrons: ["scenes", "named"], parts: ["heroines", "parts"] };
        function jump(tab, selKey, selVal) {
          if (selKey && selVal) S.sel[selKey] = selVal;
          if (TAB_ALIAS[tab]) {
            S.scrollTo = TAB_ALIAS[tab][1];
            tab = TAB_ALIAS[tab][0];
          } else if (tab === "scenes" && selKey === "scene") S.scrollTo = "scene";
          S.tab = tab;
          local("tab", tab);
          if (tab === "inspector") loadRenders();
          render();
        }
        var queueChip = h("button", { type: "button", class: "lchip qchip", style: "display:none", title: "What is being drawn and waiting (click to see or cancel)", onclick: function() {
          S.scrollTo = "queue";
          jump("inspector");
        } });
        function paintQueueChip() {
          var j = S.jobs || {}, items = j.items || [];
          var drawing = items.filter(function(x) {
            return x.status === "processing";
          }).length, waiting = items.length - drawing;
          var extra = (j.batchLeft || 0) + (j.genAll ? j.genAll.total - j.genAll.done : 0);
          if (!items.length && !extra) {
            queueChip.style.display = "none";
            return;
          }
          queueChip.style.display = "";
          queueChip.textContent = "\u23F3 " + (drawing ? "drawing " + drawing : "idle") + (waiting ? " \xB7 " + waiting + " waiting" : "") + (extra ? " \xB7 " + extra + " more queued" : "");
        }
        function liveBar() {
          var l = live();
          if (!l) return h("div", { class: "livebar" }, h("span", { class: "lk" }, "In game:"), " no picture yet \u2014 open a scene in the game, then reopen this menu.");
          var ids = liveIds(), p = l.parsed || {};
          var chip = function(k, v, tab, sk, sv) {
            return v ? h("button", { type: "button", class: "lchip", title: "Edit this", onclick: function() {
              jump(tab, sk, sv);
            } }, h("span", { class: "lk" }, k), v) : null;
          };
          var outfitName = p.outfit ? D(["prompts", "outfits", p.outfit, "name"]) || titleCase(p.outfit) : "";
          var kind = p.patron ? "patron" : p.scene ? "scene" : p.lookFocus ? "look" : p.task ? "task" : "";
          return h(
            "div",
            { class: "livebar" },
            h("span", { class: "lk" }, "In game:"),
            chip("heroine", l.heroine ? heroineName(l.heroine) : "", "heroines"),
            kind ? chip(kind, String(p.scene || p.lookFocus || p.task || p.patron).replace(/_/g, " "), kind === "patron" ? "patrons" : "scenes", "scene", ids.scene) : null,
            p.patron ? null : chip("outfit", outfitName, "heroines", "outfit", p.outfit),
            p.patron ? null : chip("exposure", ids.exposure && /1/.test(ids.exposure) ? expSummary(ids.exposure) : "covered", "heroines", "exposure", ids.exposure || "0000000"),
            chip("mood", ids.mood ? ids.mood.split(":")[1] : "", "moods", "mood", ids.mood),
            chip("room", p.room ? titleCase(p.room) : "", "locations", "room", p.room),
            h("span", { class: "grow" }),
            queueChip,
            h("button", { type: "button", class: "lchip ghost", title: "See how this prompt was built", onclick: function() {
              S.render = l.key;
              jump("inspector");
            } }, "inspect"),
            h("button", { type: "button", class: "lchip ghost", title: "Check what the game shows now", onclick: function() {
              refresh().then(function() {
                say("Live picture refreshed.", true);
              });
            } }, "\u21BB")
          );
        }
        var TABS = [
          ["heroines", "Heroines & outfits", "#a78bfa"],
          ["scenes", "Scenes & NPCs", "#2dd4bf"],
          ["locations", "Locations", "#fbbf24"],
          ["negatives", "Negatives & tag rules", "#fca5a5"],
          ["pipeline", "Pipeline & models", "#f472b6"],
          ["config", "Config", "#38bdf8"],
          ["inspector", "Prompt inspector", "#c4b5fd"]
        ];
        function render() {
          if (!S.st) {
            overlay.innerHTML = "";
            overlay.appendChild(h("div", { class: "box loading" }, h("div", { style: "color:#fbbf24;font-size:16px" }, "Loading settings\u2026")));
            return;
          }
          closePopups();
          hideSug();
          var oldBody = overlay.querySelector(".body");
          var scroll = oldBody ? oldBody.scrollTop : 0;
          var keepTab = overlay.getAttribute("data-tab") === S.tab;
          overlay.innerHTML = "";
          overlay.setAttribute("data-tab", S.tab);
          host.setAttribute("data-tab", TAB_ALIAS[S.tab] ? TAB_ALIAS[S.tab][0] : S.tab);
          var sv = heroSave(S.viewHeroine), svInfo = sv ? (S.st.saveInfo || {})[sv] || {} : null;
          var sid = sv ? sv.slice(sv.indexOf(".") + 1) : "";
          var whose = !sv ? heroineName(S.viewHeroine) + " only" : sv === S.st.activeSave ? heroineName(S.viewHeroine) + " in the save being played (save ID " + sid + "; each save keeps its own)" : heroineName(S.viewHeroine) + "'s most recently played save (save ID " + sid + (svInfo.name ? ", " + svInfo.name : "") + ")";
          var shared2 = "Prompt changes are saved for " + whose + '. Also saved per heroine: model family, models, sampler, which LoRAs, turbo and patron portraits. Shared by all heroines: LoRA trigger words & groups, picture sizes, quality tags, hi-res fix, face fix, GIF, Config, "All heroines" tag rules and (when ticked) game negatives.';
          var header = h(
            "div",
            { class: "header" },
            h(
              "div",
              { class: "hrow" },
              h("strong", { class: "brand" }, "Settings UI Mod 2.0"),
              h(
                "span",
                { class: "hctx" },
                h("span", { class: "hlab" }, "Heroine"),
                picker(heroines().map(function(id) {
                  return { value: id, label: heroineName(id), active: !!(live() && live().heroine === id) };
                }), S.viewHeroine, function(v) {
                  setViewHeroine(v);
                  render();
                }, { width: 240, style: "display:inline-block;min-width:150px;margin:0" })
              ),
              searchBox(),
              h("button", { class: "closer", title: "Close (Esc)", onclick: function() {
                toggle(false);
              } }, "\u2715")
            ),
            h("div", { class: "hnote", title: shared2 }, shared2)
          );
          var tabBar = h("div", { class: "tabbar" }, TABS.map(function(t) {
            var on = t[0] === S.tab;
            return h("button", { type: "button", class: "tab t-" + t[0] + (on ? " on" : ""), onclick: function() {
              S.tab = t[0];
              local("tab", t[0]);
              if (t[0] === "inspector") loadRenders();
              render();
            } }, h("span", { class: "tdot" }), t[1]);
          }));
          var body = h("div", { class: "body" });
          if (TAB_ALIAS[S.tab]) S.tab = TAB_ALIAS[S.tab][0];
          try {
            add(body, (VIEWS[S.tab] || VIEWS.heroines)());
          } catch (e) {
            add(body, h("div", { class: "err" }, "This tab failed to draw: " + e.message));
            console.error("[Wayward Bridge]", e);
          }
          var redraw = h("input", { type: "checkbox", checked: app("redrawAfterSave") !== false, onchange: function(e) {
            setDraft(["app", "redrawAfterSave"], e.target.checked);
          } });
          var footer = h(
            "div",
            { class: "footer" },
            h("div", { class: "fstat" }, statusEl, h("span", { class: "undoredo" }, footCount, undoBtn, redoBtn)),
            h(
              "div",
              { class: "factions" },
              h("label", { class: "cb small", title: "After saving, the picture the game is showing now is drawn again with the new settings. The new picture replaces it in the game and is listed in the Prompt inspector." }, redraw, h("span", { class: "rdl" }, " redraw current picture (in game & Prompt inspector)"), h("span", { class: "rds" }, " redraw current picture")),
              sbtn("Discard", "#44403c", function() {
                if (!count()) return say("Nothing to discard.", true);
                if (confirm("Throw away " + count() + " unsaved change(s)?")) discard();
              }),
              h("button", { type: "button", class: "apply", onclick: save }, "Save & Apply", h("span", { class: "apl" }, " to game"))
            )
          );
          var gu = S.st.gameUpdate;
          var updBar = gu ? h("button", { type: "button", class: "updbar", onclick: function() {
            S.scrollTo = "";
            jump("config");
          } }, "The game was updated: " + (gu.changed.length + gu.added.length + gu.removed.length) + " prompt changes" + ((gu.edits || []).length ? ", " + gu.edits.length + " of your edits to check" : "") + " \u2014 see Config \u203A Game update check") : null;
          overlay.appendChild(h("div", { class: "box" }, header, tabBar, updBar, liveBar(), body, footer));
          paintFooter();
          if (S.scrollTo) {
            var target = body.querySelector('[data-sec="' + S.scrollTo + '"]');
            S.scrollTo = "";
            if (target) setTimeout(function() {
              target.scrollIntoView({ block: "start" });
              target.classList.add("flash");
              setTimeout(function() {
                target.classList.remove("flash");
              }, 1200);
            }, 0);
          } else if (keepTab) body.scrollTop = scroll;
        }
        function flatPrompts() {
          var out = [];
          var walk = function(v, p) {
            if (typeof v === "string") {
              if (v.trim()) out.push({ path: p, text: v });
              return;
            }
            if (Array.isArray(v)) {
              v.forEach(function(x, i) {
                if (typeof x === "string") walk(x, p.concat(String(i)));
                else if (x && typeof x === "object") walk(x, p.concat(String(i)));
              });
              return;
            }
            if (v && typeof v === "object") Object.keys(v).forEach(function(k) {
              walk(v[k], p.concat(k));
            });
          };
          var P = E(["prompts"]) || {};
          Object.keys(P).forEach(function(sec2) {
            if (sec2 === "heroines") {
              var hp = (P.heroines || {})[S.viewHeroine] || {};
              walk({ base: hp.base, negative: hp.negative }, ["heroines", S.viewHeroine]);
              walk(hp.sections || {}, ["heroines", S.viewHeroine, "sections"]);
              walk(hp.quarantine || {}, ["heroines", S.viewHeroine, "quarantine"]);
              return;
            }
            walk(P[sec2], [sec2]);
          });
          return out.filter(function(x) {
            return !/^(name|group|mode)$/.test(x.path[x.path.length - 1]);
          });
        }
        function searchJump(p) {
          var sec2 = p[0], id = p[1];
          if (sec2 === "heroines") {
            S.scrollTo = "body";
            return jump("heroines");
          }
          if (sec2 === "outfits") return jump("heroines", "outfit", id);
          if (sec2 === "exposure") {
            S.sel.exposure = id;
            return jump("heroines");
          }
          if (sec2 === "parts") return jump("parts");
          if (sec2 === "scenes" || sec2 === "looks" || sec2 === "tasks") return jump("scenes", "scene", sec2 + ":" + id);
          if (sec2 === "reactions") return jump("scenes");
          if (sec2 === "expressions") return jump("moods", "mood", "expressions:" + id);
          if (sec2 === "moods") return jump("moods", "mood", id + ":" + p[2]);
          if (sec2 === "rooms") return jump("locations", "room", id);
          if (sec2 === "patrons") {
            if (id === "named") S.sel.named = p[2];
            return jump("patrons");
          }
          if (sec2 === "rules" || sec2 === "rulesAll") {
            S.scrollTo = "rules";
            return jump("negatives");
          }
          if (sec2 === "negatives") return jump("negatives");
          jump("heroines");
        }
        function searchLabel(p) {
          var names = { heroines: "Character", outfits: "Outfit", exposure: "Exposure", parts: "Heroine state", scenes: "Scene", looks: "Look", tasks: "Task", reactions: "Reaction", expressions: "Scene mood", moods: "Mood", rooms: "Location", patrons: "Patrons", negatives: "Game negative", rules: "Tag rule", rulesAll: "Tag rule (all heroines)" };
          var rest = p.slice(1).map(function(x) {
            return /^\d+$/.test(x) ? "variant " + (Number(x) + 1) : x.replace(/_/g, " ");
          });
          if (p[0] === "rules" || p[0] === "rulesAll") rest = ["rule " + (Number(p[1]) + 1), p[2]];
          return (names[p[0]] || p[0]) + " \u203A " + rest.join(" \u203A ");
        }
        function searchBox() {
          var inp = h("input", { class: "inp srch", placeholder: "Search prompts\u2026", spellcheck: "false", value: S.search || "", "data-tags": null });
          var pop = h("div", { class: "srchpop" });
          var paint = function() {
            var q = String(inp.value || "").trim().toLowerCase();
            S.search = inp.value;
            pop.innerHTML = "";
            if (q.length < 2) {
              pop.style.display = "none";
              return;
            }
            var words = q.split(/\s+/);
            var hits = flatPrompts().filter(function(x) {
              var hay = (x.text + " " + x.path.join(" ")).toLowerCase().replace(/_/g, " ");
              return words.every(function(w) {
                return hay.indexOf(w.replace(/_/g, " ")) >= 0;
              });
            });
            pop.style.display = "block";
            if (!hits.length) {
              pop.appendChild(h("div", { class: "note", style: "padding:6px" }, "Nothing found."));
              return;
            }
            hits.slice(0, 40).forEach(function(x, i) {
              var t = x.text, at = t.toLowerCase().indexOf(words[0]);
              var snip = at >= 0 ? (at > 40 ? "\u2026" : "") + t.slice(Math.max(0, at - 40), at) : t.slice(0, 80);
              var mid = at >= 0 ? t.slice(at, at + words[0].length) : "", tail = at >= 0 ? t.slice(at + words[0].length, at + words[0].length + 60) + (t.length > at + words[0].length + 60 ? "\u2026" : "") : "";
              pop.appendChild(h(
                "button",
                { type: "button", class: "srchit" + (i === 0 ? " cur" : ""), onclick: function() {
                  pop.style.display = "none";
                  searchJump(x.path);
                } },
                h("div", { class: "srchp" }, searchLabel(x.path)),
                h("div", { class: "srcht" }, snip, h("mark", null, mid), tail)
              ));
            });
            if (hits.length > 40) pop.appendChild(h("div", { class: "note", style: "padding:6px" }, hits.length - 40 + " more \u2014 type more words to narrow it down."));
          };
          inp.addEventListener("input", paint);
          inp.addEventListener("focus", paint);
          inp.addEventListener("keydown", function(e) {
            var items = pop.querySelectorAll(".srchit"), cur = pop.querySelector(".srchit.cur"), i = Array.prototype.indexOf.call(items, cur);
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (!items.length) return;
              if (cur) cur.classList.remove("cur");
              i = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
              items[i].classList.add("cur");
              items[i].scrollIntoView({ block: "nearest" });
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (cur) cur.click();
            } else if (e.key === "Escape") {
              e.stopPropagation();
              pop.style.display = "none";
              inp.blur();
            }
          });
          inp.addEventListener("blur", function() {
            setTimeout(function() {
              pop.style.display = "none";
            }, 200);
          });
          return h("div", { class: "srchwrap" }, inp, pop);
        }
        var VIEWS = {};
        VIEWS.heroines = function() {
          var id = S.viewHeroine, rb = ["prompts", "heroines", id];
          var ids = liveIds();
          var isCustom = /^custom_/.test(id);
          var charSec = sec(
            "Character prompts",
            "#a78bfa",
            "Main heroine \u2014 only one is active in a playthrough. Scene pictures use a shortened copy; the bridge puts your full prompt back." + (isCustom ? ` She was made with the game's "Build your own heroine": her game default is the description the game sends for her (it shows here once the game has drawn her). Change her name, looks and story in the game's builder (Edit on the heroine picker).` : ""),
            row(
              h("input", { class: "inp", style: "flex:1", value: E(rb.concat("name")) || "", placeholder: "Display name", oninput: function(e) {
                edit(rb.concat("name"), e.target.value);
              } }),
              h("span", { class: "note", style: "margin:0" }, "Her name in the game too (after Save & Apply)")
            ),
            presetBar("character", function() {
              return { base: E(rb.concat("base")) || "", negative: E(rb.concat("negative")) || "" };
            }, function(d) {
              applyMap(rb, { base: d.base || "", negative: d.negative || "" });
            }, "#7c3aed"),
            promptBox("imageBase", rb.concat("base"), { height: "90px", isChar: true, oninput: function() {
              paintTriggerChips();
            } }),
            promptBox("imageNegative", rb.concat("negative"), { height: "50px" }),
            row(sbtn("Restore default", "#57534e", function() {
              restore(rb.concat("base"));
              restore(rb.concat("negative"));
              restore(rb.concat("name"));
              render();
            }))
          );
          var trigSec = sec("LoRA trigger words", "#fbbf24", "Trigger words of the LoRAs in Pipeline & models. Click a word or group to add it to / remove it from " + heroineName(id) + "'s character prompt (faded = not in the prompt). Changing the LoRA swaps these.", triggerChipsArea("prompts"));
          var outDef = D(["prompts", "outfits"]) || {};
          var outEff = E(["prompts", "outfits"]) || {};
          var outIds = Object.keys(outEff);
          var curOut = S.sel.outfit && outEff[S.sel.outfit] ? S.sel.outfit : ids.outfit && outEff[ids.outfit] ? ids.outfit : outIds[0];
          S.sel.outfit = curOut;
          var ro = ["prompts", "outfits", curOut];
          var outItems = outIds.map(function(o) {
            var d = outDef[o] || outEff[o] || {};
            return { value: o, label: (d.name || titleCase(o)) + (d.boldness != null ? "  \xB7 boldness " + d.boldness : ""), group: d.group || "Custom", active: ids.outfit === o };
          });
          var outSec = sec(
            "Clothing / outfit prompts",
            "#34d399",
            "The game adds its own words for her state (disheveled, pulled down\u2026) around these; those stay.",
            picker(outItems, curOut, function(v) {
              S.sel.outfit = v;
              render();
            }, { width: 420, folders: false }),
            presetBar(
              "outfit",
              function() {
                var o = E(["prompts", "outfits"]) || {};
                var out = {};
                Object.keys(o).forEach(function(k) {
                  out[k] = { tags: o[k].tags || "", negative: o[k].negative || "" };
                });
                return { outfits: out, exposure: clone(E(["prompts", "exposure"]) || {}) };
              },
              function(d) {
                applyMap(["prompts", "outfits"], d && d.outfits || {});
                if (d && d.exposure) applyMap(["prompts", "exposure"], d.exposure);
              },
              "#059669"
            ),
            h("div", { class: "note" }, "Outfit presets also hold the exposure prompts below (one preset for both)."),
            curOut ? [promptBox("imageTags", ro.concat("tags"), { height: "70px" }), promptBox("negativeImageTags", ro.concat("negative"), { height: "45px", hint: "Used while she is covered." })] : null,
            row(
              sbtn("Reset outfit", "#57534e", function() {
                restore(ro.concat("tags"));
                restore(ro.concat("negative"));
                render();
              }),
              sbtn("Restore all outfits", "#44403c", function() {
                if (confirm("Restore every outfit to the game defaults?")) {
                  restore(["prompts", "outfits"]);
                  render();
                }
              })
            )
          );
          charSec.insertBefore(addonRow("character"), charSec.children[1]);
          outSec.insertBefore(addonRow("clothing", "Outfits and exposure presets come from one add-on together."), outSec.children[1]);
          return [charSec, stateSec(), passportSec(), bodySec(), quarantineSec(), trigSec, outSec, exposureSec(), partsSection()];
        };
        function exposureSec() {
          var ids = liveIds();
          var mask = S.sel.exposure || local("expmask") || ids.exposure || "0000000";
          mask = String(mask);
          while (mask.length < 7) mask += "0";
          mask = mask.slice(0, 7);
          S.sel.exposure = mask;
          var ch = { top: mask[2] === "1" ? "off" : mask[1] === "1" ? "down" : mask[0] === "1" ? "bodice" : "covered", skirt: mask[4] === "1" ? "off" : mask[3] === "1" ? "up" : "down", undie: mask[6] === "1" ? "off" : mask[5] === "1" ? "aside" : "on" };
          function toMask(c) {
            var b = [0, 0, 0, 0, 0, 0, 0];
            if (c.top === "bodice") b[0] = 1;
            if (c.top === "down") b[1] = 1;
            if (c.top === "off") b[2] = 1;
            if (c.skirt === "up") b[3] = 1;
            if (c.skirt === "off") {
              b[3] = 1;
              b[4] = 1;
            }
            if (c.undie === "aside") b[5] = 1;
            if (c.undie === "off") {
              b[5] = 1;
              b[6] = 1;
            }
            return b.join("");
          }
          function pick(m) {
            S.sel.exposure = m;
            local("expmask", m);
            render();
          }
          function choiceRow(label, key, opts) {
            return h("div", { class: "crow" }, h("div", { class: "clab" }, label), opts.map(function(o) {
              return h("button", { type: "button", class: "pill" + (ch[key] === o[0] ? " on" : ""), onclick: function() {
                var c = Object.assign({}, ch);
                c[key] = o[0];
                pick(toMask(c));
              } }, o[1]);
            }));
          }
          var rel = ["prompts", "exposure", mask];
          var seen = S.st.observed && S.st.observed.exposure && S.st.observed.exposure[mask] || ids.exposure === mask && live() && live().parts && live().parts.Exposure || "";
          var saved = Object.keys(E(["prompts", "exposure"]) || {}).filter(function(m) {
            return E(["prompts", "exposure", m]);
          }).sort();
          return sec(
            "Exposure presets",
            "#fb7185",
            null,
            h("div", { class: "callout" }, "The Top, Skirt and Underwear choices together make one exposure preset (an exp- code). The box is the prompt for the selected preset. Leave it empty to keep the game's words."),
            h("div", { class: "note", style: "color:#fb7185" }, ids.exposure && /1/.test(ids.exposure) ? "Current image: exp-" + ids.exposure + " \xB7 " + expSummary(ids.exposure) : "The current image has no exposure code (fully covered)."),
            choiceRow("Top", "top", [["covered", "Covered"], ["bodice", "Bodice open"], ["down", "Top down"], ["off", "Topless"]]),
            choiceRow("Skirt", "skirt", [["down", "Down"], ["up", "Up"], ["off", "Off"]]),
            choiceRow("Underwear", "undie", [["on", "On"], ["aside", "Aside"], ["off", "Off"]]),
            h(
              "div",
              { class: "crow" },
              h("div", { class: "clab" }, "Named"),
              [["Clothed", "0000000"], ["Cleavage", "1000000"], ["Breasts out", "0100000"], ["Skirt up", "0001000"], ["Exposed", "0101011"], ["Nude", "0011101"]].map(function(p) {
                return h("button", { type: "button", class: "pill" + (mask === p[1] ? " on" : ""), onclick: function() {
                  pick(p[1]);
                } }, p[0]);
              }),
              sbtn("Load exposure from current image", "#4c0519", function() {
                if (!ids.exposure) return say("The current image has no exp- code.", false);
                pick(ids.exposure);
              })
            ),
            h("div", { class: "code" }, (mask === "0000000" ? "no exp- code" : "exp-" + mask) + " \xB7 " + expSummary(mask) + (E(rel) ? " \xB7 has your prompt" : "") + (ids.exposure === mask ? " \xB7 \u25CF in game" : "")),
            mask === "0000000" ? h("div", { class: "note" }, "Fully covered: nothing to replace.") : promptBox("Prompt for this preset", rel, { height: "70px", gameValue: seen || "", hint: seen ? null : "The game's words for this preset show here once it has drawn one." }),
            saved.length ? h("div", { class: "note" }, "Presets you have written: ", saved.map(function(m) {
              return h("button", { type: "button", class: "pill sm" + (m === mask ? " on" : ""), title: expSummary(m), onclick: function() {
                pick(m);
              } }, m);
            })) : null,
            row(sbtn("Restore default", "#292524", function() {
              restore(rel);
              render();
            }), sbtn("Restore all to default", "#292524", function() {
              if (confirm("Clear all exposure prompts?")) {
                restore(["prompts", "exposure"]);
                render();
              }
            }))
          );
        }
        var triggerHosts = [];
        function famRel(k) {
          return ["pipeline", "families", E(["pipeline", "family"]) || "anima", k];
        }
        function loraList() {
          return clone(E(famRel("loras")) || []);
        }
        function scanItem(model) {
          var list = S.models && S.models.files && S.models.files.lora || [];
          var norm = String(model || "").replace(/\\/g, "/"), base = norm.split("/").pop();
          if (!base) return null;
          for (var i = 0; i < list.length; i++) if (list[i].name === norm) return list[i];
          for (var j = 0; j < list.length; j++) if (String(list[j].name).split("/").pop() === base) return list[j];
          return null;
        }
        function loraBase(m) {
          return String(m || "").replace(/\\/g, "/").split("/").pop().toLowerCase();
        }
        function libAll() {
          return app("loraMemory") || [];
        }
        function libFind(model) {
          if (!model) return null;
          var all = libAll(), b = loraBase(model);
          return all.filter(function(e) {
            return e.model === model;
          })[0] || all.filter(function(e) {
            return loraBase(e.model) === b;
          })[0] || null;
        }
        function libEdit(model, fn) {
          if (!model) return;
          var all = clone(libAll()), b = loraBase(model);
          var e = all.filter(function(x) {
            return x.model === model;
          })[0] || all.filter(function(x) {
            return loraBase(x.model) === b;
          })[0];
          if (!e) {
            e = { model, words: [], removed: [], groups: [] };
            all.push(e);
          }
          e.words = e.words || [];
          e.removed = e.removed || [];
          e.groups = e.groups || [];
          fn(e);
          setDraft(["app", "loraMemory"], all);
        }
        function detectedWords(l) {
          var it = scanItem(l.model), e = libFind(l.model) || {};
          var found = splitTags(it && it.trigger ? String(it.trigger).replace(/[\n|;]/g, ",") : "").concat(e.words || [], l.words || []);
          var removed = {};
          (e.removed || []).concat(l.removed || []).forEach(function(w) {
            removed[tagKey(w)] = 1;
          });
          return uniq(found.filter(function(w) {
            return !removed[tagKey(w)];
          }));
        }
        function groupsOf(l) {
          var e = libFind(l.model) || {}, out = clone(e.groups || []), names = {};
          out.forEach(function(g) {
            names[g.name.toLowerCase()] = 1;
            g.lib = true;
          });
          (l.groups || []).forEach(function(g) {
            if (!names[g.name.toLowerCase()]) out.push(clone(g));
          });
          return out;
        }
        var QUALITY = /^(masterpiece|best quality|high quality|good quality|highres|absurdres|newest|recent|amazing quality|very aesthetic|aesthetic|score \d( up)?|source anime|anime coloring|perfect anatomy|perfect body|detailed|ultra-detailed|extremely detailed)$/i;
        function charRel() {
          return ["prompts", "heroines", S.viewHeroine, "base"];
        }
        function hasPhrase(text, p) {
          var k = tagKey(p);
          return splitTags(text).some(function(t) {
            return tagKey(t) === k;
          });
        }
        function insertAfterQuality(text, phrases) {
          var toks = splitTags(text), i = 0;
          while (i < toks.length && QUALITY.test(tagKey(toks[i]))) i++;
          var addList = uniq(phrases.filter(function(p) {
            return !hasPhrase(text, p);
          }));
          toks.splice.apply(toks, [i, 0].concat(addList));
          return toks.join(", ");
        }
        function removePhrases(text, phrases) {
          var drop = {};
          phrases.forEach(function(p) {
            drop[tagKey(p)] = 1;
          });
          return splitTags(text).filter(function(t) {
            return !drop[tagKey(t)];
          }).join(", ");
        }
        function setCharPrompt(text) {
          edit(charRel(), text);
          overlay.querySelectorAll("textarea").forEach(function(t) {
            if (t._isChar) {
              t.value = text;
              t.classList.add("dirty");
            }
          });
          paintTriggerChips();
        }
        function togglePhrases(phrases) {
          var text = E(charRel()) || "";
          var allOn = phrases.every(function(p) {
            return hasPhrase(text, p);
          });
          setCharPrompt(allOn ? removePhrases(text, phrases) : insertAfterQuality(text, phrases));
          say((allOn ? "Removed " : "Added ") + phrases.join(", ") + (allOn ? " from " : " to ") + heroineName(S.viewHeroine) + "'s character prompt.", true);
        }
        function kindOf(p) {
          var n = tagKey(p);
          var look = /\b(hair|eye|eyes|skin|face|ear|ears|horn|horns|wing|wings|tail|mole|freckles|pupil|pupils|bangs|ponytail|twintails|braid|ahoge|sidelocks|blush|pale|fair|breasts)\b/;
          var outfit = /\b(dress|skirt|shirt|armor|armour|glove|gloves|boot|boots|shoe|shoes|crown|cape|cloak|uniform|outfit|costume|bodysuit|bikini|jacket|coat|hat|ribbon|jewelry|earring|earrings|sleeve|sleeves|pants|shorts|apron|scarf|belt|strap|straps|kimono|leotard|stockings|thighhighs|clothes|bodice)\b/;
          var isLook = look.test(n), isOutfit = outfit.test(n);
          if ((/[A-Z]/.test(String(p)) || /_|\(/.test(String(p))) && !isLook && !isOutfit) return "name";
          return isOutfit ? "outfit" : isLook ? "look" : "other";
        }
        function autoGroups(words) {
          var out = [], i = 0;
          while (i < words.length) {
            var k = kindOf(words[i]);
            if (k === "name" || k === "look" || k === "outfit") {
              var g = [words[i]], j = i + 1;
              while (j < words.length) {
                var k2 = kindOf(words[j]);
                if (k === "name" && k2 !== "other" || k2 === k) {
                  g.push(words[j]);
                  j++;
                } else break;
              }
              if (g.length >= 2) {
                out.push(g);
                i = j;
                continue;
              }
            }
            i++;
          }
          return out;
        }
        function triggerChipsArea(theme) {
          var hostEl = h("div", { class: "tgrid" });
          hostEl._theme = theme;
          triggerHosts = triggerHosts.filter(function(x) {
            return x.isConnected;
          });
          triggerHosts.push(hostEl);
          fillTriggerChips(hostEl);
          return hostEl;
        }
        function paintTriggerChips() {
          triggerHosts.forEach(function(x) {
            if (x.isConnected) fillTriggerChips(x);
          });
        }
        function fillTriggerChips(hostEl) {
          hostEl.innerHTML = "";
          var cls = hostEl._theme === "gen" ? "chip gen" : "chip";
          var text = E(charRel()) || "";
          var all = loraList();
          var list = all.filter(function(l) {
            return l.enabled !== false && l.model;
          });
          var words = uniq([].concat.apply([], list.map(detectedWords)));
          var col1 = h("div", null, h("div", { class: "tlab" }, "detected trigger words"));
          var col2 = h("div", null, h("div", { class: "tlab" }, "Trigger Groups"));
          if (!list.length) col1.appendChild(h("span", { class: "note" }, "No LoRA selected (Pipeline & models)."));
          else if (!words.length) col1.appendChild(h("span", { class: "note" }, S.models ? "None found \u2014 add words in Pipeline & models." : "Loading\u2026"));
          words.forEach(function(w) {
            var on = hasPhrase(text, w);
            col1.appendChild(h("span", { class: cls + (on ? "" : " off"), title: on ? "In the prompt \u2014 click to remove" : "Not in the prompt \u2014 click to add", onclick: function() {
              togglePhrases([w]);
            } }, w));
          });
          var groups = [];
          all.forEach(function(l, li) {
            if (l.model && l.enabled !== false) groupsOf(l).forEach(function(g) {
              groups.push({ l, li, g });
            });
          });
          groups.forEach(function(e) {
            var on = e.g.tags.length && e.g.tags.every(function(t) {
              return hasPhrase(text, t);
            });
            col2.appendChild(h(
              "span",
              { class: cls + " grp" + (on ? "" : " off"), title: (on ? "Click to remove: " : "Click to add: ") + e.g.tags.join(", ") + (list.length > 1 ? "\nLoRA: " + String(e.l.model).split("/").pop().replace(/\.[^.]+$/, "") : ""), onclick: function() {
                togglePhrases(e.g.tags);
              } },
              e.g.name,
              h("span", { class: "ged", title: "Edit this group", onclick: function(ev) {
                ev.stopPropagation();
                groupPopup(e.li, e.g.name);
              } }, "\u270E"),
              h("span", { class: "gx", title: "Delete this group", onclick: function(ev) {
                ev.stopPropagation();
                if (!e.g.lib) return say("This group comes with an add-on; it cannot be deleted here.", false);
                if (!confirm('Delete group "' + e.g.name + '" from ' + loraBase(e.l.model).replace(/\.[^.]+$/, "") + " (for every heroine)?")) return;
                libEdit(e.l.model, function(x) {
                  x.groups = x.groups.filter(function(g) {
                    return g.name.toLowerCase() !== e.g.name.toLowerCase();
                  });
                });
                paintTriggerChips();
              } }, "\xD7")
            ));
          });
          var ag = autoGroups(words);
          ag.forEach(function(g) {
            var on = g.every(function(t) {
              return hasPhrase(text, t);
            });
            col2.appendChild(h("span", { class: cls + " grp auto" + (on ? "" : " off"), title: "Detected group. " + (on ? "Click to remove" : "Click to add"), onclick: function() {
              togglePhrases(g);
            } }, g.join(", ")));
          });
          if (!groups.length && !ag.length) col2.appendChild(h("span", { class: "note" }, "None"));
          col2.appendChild(h("div", { style: "margin-top:4px" }, sbtn("Save group to LoRA", "#292524", function() {
            groupPopup();
          })));
          hostEl.appendChild(col1);
          hostEl.appendChild(col2);
        }
        function groupPopup(li, gname) {
          var all = loraList();
          if (!all.some(function(l) {
            return l.model;
          })) return say("Select a LoRA first (Pipeline & models).", false);
          var existing = li != null ? groupsOf(all[li]).filter(function(g) {
            return g.name === gname;
          })[0] || null : null;
          var first = li != null ? li : all.findIndex(function(l) {
            return l.model;
          });
          var pop = h("div", { class: "popup" });
          var lsel = h("select", { class: "sel", style: "width:100%" }, all.map(function(l, i) {
            return l.model ? h("option", { value: i, selected: i === first }, String(l.model).split("/").pop()) : null;
          }));
          var name = h("input", { class: "inp", placeholder: "Group name", value: existing ? existing.name : "" });
          var tags = h("textarea", { class: "ta", style: "height:90px", "data-tags": "1", placeholder: "Tags, comma separated.\nSeveral groups at once: one per line as  Name: tag, tag", value: existing ? existing.tags.join(", ") : "" });
          var shade = h("div", { class: "shade", onmousedown: function(e) {
            if (e.target === shade) close();
          } }, pop);
          function close() {
            shade.remove();
            hideSug();
          }
          pop.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && !sug.open) {
              e.stopPropagation();
              close();
            }
          });
          add(pop, [
            h("div", { class: "ptitle" }, existing ? "Edit Trigger Group" : "Save Trigger Group"),
            lab("LoRA"),
            lsel,
            lab("Name"),
            name,
            lab("Tags"),
            tags,
            row(h("span", { class: "grow" }), sbtn("Cancel", "#292524", close), sbtn("Save", "#92400e", function() {
              var lines = tags.value.split(/\n+/).map(function(x) {
                return x.trim();
              }).filter(Boolean);
              var parsed = lines.map(function(line) {
                var m = line.match(/^([^:,]{1,40}):\s*(.+)$/);
                var useLineName = m && (lines.length > 1 || !name.value.trim());
                var tg = splitTags(useLineName ? m[2] : line);
                return { name: (useLineName ? m[1].trim() : name.value.trim()) || tg[0], tags: tg };
              }).filter(function(g) {
                return g.tags.length;
              });
              if (!parsed.length) return say("Type at least one tag.", false);
              var cur = loraList(), target = cur[Number(lsel.value)];
              if (!target || !target.model) return say("Pick a LoRA.", false);
              if (existing && existing.lib && cur[li] && cur[li].model !== target.model) libEdit(cur[li].model, function(x) {
                x.groups = x.groups.filter(function(g) {
                  return g.name !== existing.name;
                });
              });
              libEdit(target.model, function(x) {
                if (existing && existing.lib) x.groups = x.groups.filter(function(g) {
                  return g.name !== existing.name;
                });
                parsed.forEach(function(g) {
                  var i = x.groups.findIndex(function(y) {
                    return y.name.toLowerCase() === g.name.toLowerCase();
                  });
                  if (i >= 0) x.groups[i] = g;
                  else x.groups.push(g);
                });
              });
              close();
              paintTriggerChips();
              say("Group saved for every heroine. Save & Apply to keep it.", true);
            }))
          ]);
          layer2.appendChild(shade);
          setTimeout(function() {
            name.focus();
          }, 30);
        }
        function sceneItems() {
          var ids = liveIds(), eff = E(["prompts"]) || {}, out = [];
          Object.keys(eff.scenes || {}).forEach(function(id) {
            out.push({ value: "scenes:" + id, label: id.replace(/_/g, "-"), group: sceneGroupOf(id), active: ids.scene === "scenes:" + id });
          });
          Object.keys(eff.looks || {}).forEach(function(id) {
            out.push({ value: "looks:" + id, label: "look-" + id, group: "Looks", active: ids.scene === "looks:" + id });
          });
          Object.keys(eff.tasks || {}).forEach(function(id) {
            out.push({ value: "tasks:" + id, label: "task-" + id.replace(/_/g, "-"), group: "Tasks", active: ids.scene === "tasks:" + id });
          });
          Object.keys(eff.reactions || {}).forEach(function(id) {
            out.push({ value: "reactions:" + id, label: "reaction-" + id, group: "Reactions" });
          });
          return out.sort(function(a, b) {
            return a.label.localeCompare(b.label);
          });
        }
        VIEWS.scenes = function() {
          var l = live(), ids = liveIds();
          var liveSec = sec(
            "Currently active image",
            "#5eead4",
            null,
            h("div", { class: "keyline" }, l ? l.key : "No picture yet \u2014 open a scene in the game, then reopen this menu."),
            l ? h("div", { class: "meta" }, ["character", "scene", "lookFocus", "lookReaction", "task", "outfit", "room", "mood", "exposure", "groupBoys", "finishOutfit", "aftermath", "patron", "variant"].map(function(k) {
              var v = l.parsed[k];
              if (v == null || v === "" || v === false || v === 0 && k !== "variant") return null;
              return [h("div", { class: "mk" }, k), h("div", null, k === "exposure" ? v + " \xB7 " + expSummary(v) : String(v))];
            })) : null,
            l ? row(
              sbtn("Edit scene", "#0f766e", function() {
                if (ids.scene) {
                  S.sel.scene = ids.scene;
                  S.filter.sceneGroup = "All";
                  render();
                }
              }),
              sbtn("Edit outfit", "#0f766e", function() {
                jump("heroines", "outfit", ids.outfit);
              }),
              sbtn("Edit room", "#0f766e", function() {
                jump("locations", "room", ids.room);
              }),
              sbtn("Edit mood", "#0f766e", function() {
                jump("moods", "mood", ids.mood);
              }),
              l.parsed.patron ? sbtn("Edit patron", "#0f766e", function() {
                jump("patrons", "named", String(l.parsed.patron).toLowerCase());
              }) : null,
              sbtn("Refresh live", "#0f766e", function() {
                refresh();
              })
            ) : null,
            l ? row(sbtn("Show prompt", "#57534e", function() {
              S.render = l.key;
              jump("inspector");
            })) : null
          );
          liveSec.setAttribute("data-sec", "live");
          var items = sceneItems();
          var g = S.filter.sceneGroup || "All";
          var groups = ["All"].concat(Object.keys(items.reduce(function(a, it) {
            a[it.group] = 1;
            return a;
          }, {})).sort());
          var shown = items.filter(function(it) {
            return g === "All" || it.group === g;
          });
          var cur = S.sel.scene && shown.some(function(i) {
            return i.value === S.sel.scene;
          }) ? S.sel.scene : ids.scene && shown.some(function(i) {
            return i.value === ids.scene;
          }) ? ids.scene : (shown[0] || {}).value;
          S.sel.scene = cur;
          var parts = String(cur || ":").split(":"), secName = parts[0], sid = parts[1];
          var rel = ["prompts", secName, sid];
          var editor = null;
          if (sid && Array.isArray(E(rel))) editor = variantsEditor(rel, ids.scene === cur);
          else if (sid) editor = promptBox("Prompt", rel, { height: "60px" });
          var sceneSec = sec(
            "Scene prompts",
            "#2dd4bf",
            "Act tags only. Location, mood and exposure come from their own settings. The game picks a variant per picture; your variant with the same number replaces it.",
            row(
              picker(groups.map(function(x) {
                return { value: x, label: x };
              }), g, function(v) {
                S.filter.sceneGroup = v;
                render();
              }, { width: 220, folders: false, style: "width:180px;margin:0" }),
              picker(shown, cur, function(v) {
                S.sel.scene = v;
                render();
              }, { width: 420, folders: false, style: "flex:1;margin:0" })
            ),
            activeLine("scene"),
            sid ? addonRow(secName + "." + sid) : null,
            editor,
            row(sbtn("Restore default", "#57534e", function() {
              restore(rel);
              render();
            }), sbtn("Restore all scenes", "#44403c", function() {
              if (confirm("Restore every scene, look, task and reaction to the game defaults?")) {
                ["scenes", "looks", "tasks", "reactions"].forEach(function(k) {
                  restore(["prompts", k]);
                });
                render();
              }
            })),
            h(
              "div",
              { class: "subsec" },
              h("div", { class: "note" }, "Scene presets (all scene tags at once)"),
              presetBar(
                "scene",
                function() {
                  var p = E(["prompts"]);
                  return { scenes: p.scenes, looks: p.looks, tasks: p.tasks, reactions: p.reactions, expressions: p.expressions };
                },
                function(d) {
                  ["scenes", "looks", "tasks", "reactions", "expressions"].forEach(function(k) {
                    if (d && d[k]) applyMap(["prompts", k], d[k]);
                  });
                },
                "#0f766e"
              )
            )
          );
          sceneSec.setAttribute("data-sec", "scene");
          var pat = patronSections();
          return [liveSec, moodSection(), sceneSec, pat[1], pat[0]];
        };
        function variantsEditor(rel, isLive) {
          var list = (E(rel) || [""]).slice();
          var game = D(rel) || [];
          var activeV = isLive && live() && live().parsed && live().parsed.variant != null ? Number(live().parsed.variant) % Math.max(1, list.length) : -1;
          var wrap = h("div", null);
          list.forEach(function(text, i) {
            var ta = h("textarea", {
              class: "ta" + (isDirty(rel) ? " dirty" : "") + (i === activeV ? " activeta" : ""),
              style: "height:48px",
              "data-tags": "1",
              spellcheck: "false",
              value: text,
              oninput: function() {
                list[i] = ta.value;
                edit(rel, list.slice());
                ta.classList.add("dirty");
              }
            });
            wrap.appendChild(h(
              "div",
              { class: "variant" },
              h(
                "div",
                { class: "vh" },
                h("span", { class: "lab" }, "Variant " + (i + 1)),
                i === activeV ? h("span", { class: "live" }, "\u25CF in game") : null,
                i === 0 ? badgeFor(rel) : null,
                h("span", { class: "grow" }),
                list.length > 1 ? h("button", { type: "button", class: "link danger", onclick: function() {
                  list.splice(i, 1);
                  edit(rel, list.slice());
                  render();
                } }, "delete variant") : null
              ),
              ta,
              game[i] != null && String(game[i]).trim() !== String(text).trim() ? h("div", { class: "gamehint", title: game[i] }, "Game default: " + game[i]) : null
            ));
          });
          wrap.appendChild(row(sbtn("Add variant", "#0f766e", function() {
            list.push("");
            edit(rel, list.slice());
            render();
          })));
          return wrap;
        }
        function activeLine(kind) {
          var l = live(), ids = liveIds();
          if (!l) return h("div", { class: "activebox" }, h("b", null, "Active in game: "), "no picture yet");
          var parts = l.parts || {}, p = l.parsed || {};
          if (kind === "mood") {
            var txt = (ids.mood ? E(moodRel(ids.mood)) : "") || parts.Mood || "";
            return h(
              "div",
              { class: "activebox" },
              h(
                "div",
                null,
                h("b", null, "Active mood: "),
                ids.mood ? ({ expressions: "scene mood", work: "mood meter", scene: "key mood", patron: "patron scene" }[ids.mood.split(":")[0]] || "") + " \xB7 " + ids.mood.split(":")[1].replace(/_/g, " ") : parts.Mood ? "not one of the mood prompts (made by the game)" : "(none on the current picture)",
                ids.mood ? h("button", { type: "button", class: "link", onclick: function() {
                  S.sel.mood = ids.mood;
                  render();
                } }, "show") : null
              ),
              txt ? h("div", { class: "activetxt" }, txt) : null
            );
          }
          var sc = ids.scene ? ids.scene.split(":") : null;
          var list = sc ? E(["prompts", sc[0], sc[1]]) : null;
          var n = Array.isArray(list) ? list.length : 1;
          var v = p.variant != null ? Number(p.variant) : 0;
          var label = sc ? (sc[0] === "scenes" ? "scene " : sc[0] === "looks" ? "look " : "task ") + sc[1].replace(/_/g, "-") : p.patron ? "patron portrait" : "unknown";
          var txt2 = (Array.isArray(list) ? list[v % n] : list) || parts.Scene || parts.Focus || parts.Task || "";
          return h(
            "div",
            { class: "activebox" },
            h(
              "div",
              null,
              h("b", null, "Active in game: "),
              label,
              Array.isArray(list) ? " \xB7 variant " + (v % n + 1) + " of " + n + (v >= n ? " (key v-" + v + ")" : "") : "",
              sc ? h("button", { type: "button", class: "link", onclick: function() {
                S.sel.scene = ids.scene;
                S.filter.sceneGroup = "All";
                render();
              } }, "show") : null
            ),
            txt2 ? h("div", { class: "activetxt" }, txt2) : null
          );
        }
        function moodSection() {
          var ids = liveIds();
          var eff = E(["prompts", "moods"]) || {}, ex = E(["prompts", "expressions"]) || {};
          var items = [];
          var addG = function(vals, group, prefix, labelFn) {
            Object.keys(vals || {}).forEach(function(id) {
              items.push({ value: prefix + ":" + id, label: labelFn ? labelFn(id) : id.replace(/_/g, " "), group, active: ids.mood === prefix + ":" + id });
            });
          };
          addG(ex, "Scene moods (each scene's own mood)", "expressions");
          addG(eff.work, "Mood meter (everyday pictures, and scenes without their own mood)", "work");
          addG(eff.scene, "Key moods (mood-smile / shy\u2026 on everyday pictures)", "scene");
          addG(eff.patron, "Patron scenes: reluctant / distressed", "patron", function(id) {
            return id.replace("_", " \u2014 ");
          });
          var cur = S.sel.mood && items.some(function(i) {
            return i.value === S.sel.mood;
          }) ? S.sel.mood : ids.mood && items.some(function(i) {
            return i.value === ids.mood;
          }) ? ids.mood : (items[0] || {}).value;
          S.sel.mood = cur;
          var rel = moodRel(cur), hasId = !!String(cur || ":").split(":")[1];
          var box = sec(
            "Mood prompts",
            "#2dd4bf",
            "In scenes the game uses the scene's own mood (Scene moods), or her mood meter when the scene has none; patron scenes she is not into use the reluctant / distressed moods. Everyday pictures use the mood meter, or a key mood (mood-smile\u2026).",
            activeLine("mood"),
            picker(items, cur, function(v) {
              S.sel.mood = v;
              render();
            }, { width: 420, folders: false, sortGroups: false }),
            hasId ? addonRow(moodItem(cur)) : null,
            hasId ? promptBox("Mood tags", rel, { height: "56px" }) : null,
            row(sbtn("Restore default", "#57534e", function() {
              restore(rel);
              render();
            }), sbtn("Restore all moods", "#44403c", function() {
              if (confirm("Restore all moods (scene moods too) to the game defaults?")) {
                restore(["prompts", "moods"]);
                restore(["prompts", "expressions"]);
                render();
              }
            })),
            h("div", { class: "subsec" }, h("div", { class: "note" }, "Mood presets"), presetBar("mood", function() {
              return { moods: E(["prompts", "moods"]), expressions: E(["prompts", "expressions"]) };
            }, function(d) {
              applyMap(["prompts", "moods"], d && d.moods || {});
              if (d && d.expressions) applyMap(["prompts", "expressions"], d.expressions);
            }, "#0f766e"))
          );
          box.setAttribute("data-sec", "mood");
          return box;
        }
        VIEWS.locations = function() {
          var ids = liveIds(), eff = E(["prompts", "rooms"]) || {}, def = D(["prompts", "rooms"]) || {};
          var known = ["taproom", "back_room", "upstairs_hall", "bedroom", "bathhouse", "in_bed", "bathroom", "kitchen", "cellar", "lounge", "market", "village", "wilds"];
          var all = Object.keys(eff);
          known.forEach(function(k) {
            if (all.indexOf(k) < 0) all.push(k);
          });
          if (ids.room && all.indexOf(ids.room) < 0) all.push(ids.room);
          var cur = S.sel.room && all.indexOf(S.sel.room) >= 0 ? S.sel.room : ids.room || all[0];
          S.sel.room = cur;
          var rel = ["prompts", "rooms", cur];
          var items = all.map(function(r) {
            return { value: r, label: r === "in_bed" ? "In bed (any room, scenes in bed)" : titleCase(r) + " (" + r + ")", group: def[r] ? "In the game" : "Extra rooms (your text only)", active: live() && live().parsed && live().parsed.abed ? r === "in_bed" : ids.room === r };
          });
          return sec(
            "Location prompts",
            "#fbbf24",
            '"Detail" is the background in everyday pictures, "short" in scene pictures.',
            picker(items, cur, function(v) {
              S.sel.room = v;
              render();
            }, { width: 380, folders: false }),
            addonRow("rooms." + cur),
            presetBar("location", function() {
              return { rooms: E(["prompts", "rooms"]) };
            }, function(d) {
              applyMap(["prompts", "rooms"], d && d.rooms || {});
            }, "#b45309"),
            promptBox("Detail", rel.concat("detail"), { height: "55px", hint: def[cur] && def[cur].detail ? null : "The game has no text for this room; yours fills an empty background." }),
            promptBox("Short", rel.concat("short"), { height: "36px" }),
            row(sbtn("Restore default", "#57534e", function() {
              restore(rel);
              render();
            }), sbtn("Restore all locations", "#44403c", function() {
              if (confirm("Restore all locations?")) {
                restore(["prompts", "rooms"]);
                render();
              }
            }))
          );
        };
        function tavernPatrons() {
          try {
            var raw = JSON.parse(localStorage.getItem("tavern-game") || "null");
            var st = raw && raw.state && (raw.state.state || raw.state);
            var list = (st && st.customers || []).map(function(c) {
              return String(c && c.name || "").toLowerCase();
            });
            (st && st.namedPatronNames || []).forEach(function(n) {
              list.push(String(n).toLowerCase());
            });
            return uniq(list.filter(Boolean));
          } catch (e) {
            return [];
          }
        }
        function patronSections() {
          var g = D(["prompts", "patrons"]) || {};
          var arch = clone(E(["prompts", "patrons", "archetypes"]) || []);
          var curA = Math.min(S.sel.arch || 0, Math.max(0, arch.length - 1));
          var named = E(["prompts", "patrons", "named"]) || {};
          var inRoom = tavernPatrons();
          var lp = live() && live().parsed && live().parsed.patron ? String(live().parsed.patron).toLowerCase() : "";
          var names = Object.keys(named);
          inRoom.forEach(function(n) {
            if (names.indexOf(n) < 0) names.push(n);
          });
          var curN = S.sel.named && names.indexOf(S.sel.named) >= 0 ? S.sel.named : lp && names.indexOf(lp) >= 0 ? lp : names[0];
          S.sel.named = curN;
          var newName = h("input", { class: "inp sm", placeholder: "Name as the game shows it" });
          var out = [
            sec(
              "NPC / patron portraits",
              "#14b8a6",
              "The small round pictures of the men in the room. Saved for " + heroineName(S.viewHeroine) + " only.",
              addonRow("patrons"),
              promptBox("Patron quality tags", ["prompts", "patrons", "quality"], { height: "45px" }),
              promptBox("Patron negative", ["prompts", "patrons", "negative"], { height: "45px" }),
              arch.length ? [
                lab("Patron archetype"),
                picker(arch.map(function(a, i) {
                  return { value: i, label: a.label || "Type " + (i + 1) };
                }), curA, function(v) {
                  S.sel.arch = Number(v);
                  render();
                }, { width: 320, folders: false }),
                (function() {
                  var ta = h("textarea", {
                    class: "ta" + (isDirty(["prompts", "patrons", "archetypes"]) ? " dirty" : ""),
                    style: "height:60px",
                    "data-tags": "1",
                    value: arch[curA].tags || "",
                    oninput: function() {
                      arch[curA].tags = ta.value;
                      edit(["prompts", "patrons", "archetypes"], arch);
                      ta.classList.add("dirty");
                    }
                  });
                  var gd = (g.archetypes || [])[curA];
                  return h(
                    "div",
                    { class: "field" },
                    h("div", { class: "fh" }, lab("Archetype tags"), badgeFor(["prompts", "patrons", "archetypes"])),
                    ta,
                    gd && gd.tags !== arch[curA].tags ? h("div", { class: "gamehint" }, "Game default: " + gd.tags) : null
                  );
                })()
              ] : null,
              row(sbtn("Restore defaults", "#57534e", function() {
                restore(["prompts", "patrons", "quality"]);
                restore(["prompts", "patrons", "negative"]);
                restore(["prompts", "patrons", "archetypes"]);
                render();
              }))
            ),
            sec(
              "Named patrons in the tavern",
              "#2dd4bf",
              "Give a specific man his own portrait, and keep the face you like. Each man keeps the same face every time he is drawn. Men in your saved game are listed too. The game keeps portraits it already drew this session; reload the page to see a changed one.",
              names.length ? picker(names.map(function(n) {
                return { value: n, label: titleCase(n), group: named[n] ? "With your prompt" : "In the tavern (no prompt yet)", active: n === lp };
              }), curN, function(v) {
                S.sel.named = v;
                render();
              }, { width: 320, folders: false }) : h("div", { class: "note" }, "No named patrons yet."),
              curN ? [
                addonRow("named." + curN),
                promptBox("Named patron prompt", ["prompts", "patrons", "named", curN, "prompt"], { height: "60px", placeholder: "1boy, \u2026" }),
                promptBox("Named patron negative", ["prompts", "patrons", "named", curN, "negative"], { height: "40px" }),
                faceRow(curN, named[curN] || {}),
                row(sbtn("Clear name override", "#57534e", function() {
                  restore(["prompts", "patrons", "named", curN]);
                  render();
                }))
              ] : null,
              row(newName, sbtn("Add name", "#0f766e", function() {
                var n = newName.value.trim().toLowerCase();
                if (!n) return;
                edit(["prompts", "patrons", "named", n], { prompt: "1boy, ", negative: "" });
                S.sel.named = n;
                render();
              }))
            )
          ];
          out[0].setAttribute("data-sec", "portraits");
          out[1].setAttribute("data-sec", "named");
          return out;
        }
        function faceRow(name, n) {
          S.faces = S.faces || {};
          var fk = S.viewHeroine + "/" + name;
          var tries = S.faces[fk] || [];
          var kept = n.seed != null ? Number(n.seed) : null;
          var rel = ["prompts", "patrons", "named", name, "seed"];
          var keep = function(seed) {
            edit(rel, seed);
            say("Face kept for " + titleCase(name) + " (unsaved). Save & Apply, then reload the page so the game draws his portrait again.", true);
            render();
          };
          return h(
            "div",
            { class: "field" },
            h("div", { class: "fh" }, lab("Face"), badgeFor(rel)),
            h("div", { class: "note" }, kept != null ? "Kept face: seed " + kept + ". Every portrait of him uses it." : "Every portrait of him uses the same face (worked out from his name) until you keep another one."),
            tries.length ? h("div", { class: "faces" }, tries.map(function(t) {
              return h(
                "div",
                { class: "face" + (kept === t.seed ? " on" : "") },
                h("img", { src: t.image, title: "seed " + t.seed }),
                kept === t.seed ? h("span", { class: "note", style: "margin:0;color:#4ade80" }, "kept") : sbtn("Keep this face", "#0f766e", function() {
                  keep(t.seed);
                })
              );
            })) : null,
            row(
              sbtn(S.faceBusy ? "Drawing a face\u2026" : "Try a new face", "#0f766e", function() {
                if (S.faceBusy) return;
                S.faceBusy = true;
                render();
                var seed = Math.floor(Math.random() * 1e15);
                api("POST", "/bridge/api/redraw", { key: "patron_" + name, seed, wait: true, heroine: S.viewHeroine }).then(function(j) {
                  S.faces[fk] = [{ image: j.image, seed }].concat(S.faces[fk] || []).slice(0, 8);
                }).catch(function(e) {
                  say("Could not draw a face: " + e.message, false);
                }).then(function() {
                  S.faceBusy = false;
                  if (S.open) render();
                });
              }, "Draws his portrait with a new face; keep it if you like it"),
              kept != null ? sbtn("Back to his name's face", "#57534e", function() {
                restore(rel);
                render();
              }) : null
            )
          );
        }
        function stateSec() {
          var her = activeHer();
          var pt = her && her.save || "";
          var cs = (S.st && S.st.childstate) || null;
          var preg = cs && cs.pregnancy || { active: false, day: 0, fatherId: "", known: false };
          var post = cs && cs.postpartum || { blockUntilDay: 0, milkUntilDay: 0 };
          var kids = cs && cs.children || [];
          var stage = !preg.active ? "нет" : preg.day < 10 ? "не видно" : preg.day < 20 ? "слегка" : preg.day < 30 ? "заметно" : "большой";
          function set(patch) {
            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function(j) { if (j && j.state) S.st.childstate = j.state; render(); });
          }
          function cell(label, val) {
            return h("div", { class: "pcell" },
              h("div", { class: "phead" }, h("span", { class: "plab" }, label)),
              h("div", { style: "padding:2px 4px;font-size:12px" }, val));
          }
          var out = sec(
            "Состояние",
            "#a78bfa",
            "Беременность, цикл и дети. Живёт отдельно от промптов.",
            h("div", { class: "pgrid" },
              cell("Стадия", stage),
              cell("Срок", preg.active ? preg.day + " / 40" : "—"),
              cell("Отец", preg.fatherId || "неизвестен"),
              cell("Знает", preg.known ? "да" : "нет"),
              cell("Цикл", cs && cs.cycle ? cs.cycle.day + " / " + cs.cycle.length : "—"),
              cell("Дети", String(kids.length)),
              cell("Молоко", (post.milkUntilDay > ((cs && cs.lastDay) || 0) || (preg.active && preg.day >= 30)) ? "да" : "нет"),
              cell("Желание", cs && cs.childWish ? (cs.childWish.mode || "нет") : "—")
            ),
            kids.length ? h("div", { class: "pgrid" }, kids.map(function(c, i) {
              var age = ((cs && cs.lastDay) || 0) - (c.bornDay || 0);
              return h("div", { class: "pcell" },
                h("div", { class: "phead" }, h("span", { class: "plab" }, "#" + (i + 1) + " " + (c.sex === "f" ? "девочка" : "мальчик")), h("button", { type: "button", class: "link", title: "Перебросить внешность", onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function(j) { if (j && j.state) S.st.childstate = j.state; say("Внешность переброшена"); render(); }); } }, "↻")),
                h("div", { style: "padding:2px 4px;font-size:12px" }, (c.stage || "?") + ", " + age + " дн" + (c.lookText ? " — " + c.lookText : "")));
            })) : null,
            row((function() {
              var cur = cs && cs.childWish ? cs.childWish.mode : "none";
              var sel = h("select", { class: "sel xs", onchange: function() { set({ childWish: { mode: sel.value } }); } },
                ["none", "target"].map(function(mm2) { return h("option", { value: mm2, selected: mm2 === cur }, mm2); }));
              var ti = h("input", { class: "sel xs", value: cs && cs.childWish ? (cs.childWish.targetId || "") : "", placeholder: "цель: player или id", onchange: function() { set({ childWish: { targetId: ti.value } }); } });
              return h("span", {}, sel, " ", ti);
            })()),
            row(
              sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }),
              sbtn("Прервать", "#57534e", function() { set({ pregnancy: { active: false, day: 0 } }); }),
              sbtn("+7 дней", "#0369a1", function() { set({ pregnancy: { day: Math.min(40, (preg.day || 0) + 7) } }); }),
              sbtn("Раскрыть", "#0f766e", function() { set({ pregnancy: { known: true } }); })
            )
          );
          out.setAttribute("data-sec", "state");
          return out;
        }
        function passportSec() {
          var rb = ["player", "look"];
          var V = (S.st && S.st.lookVocab) || { scale: {}, free: {} };
          var ALL = Object.assign({}, V.scale, V.free);
          var F = [["hair", "волосы"], ["hairType", "тип волос"], ["eyes", "глаза"], ["skin", "кожа"], ["face", "лицо"], ["build", "телосложение"], ["bust", "грудь"], ["hips", "бёдра"]];
          var out = sec(
            "ГГ (вы)",
            "#22d3ee",
            "Внешность игрока: наследуется детьми и уходит в промпт, когда вы в кадре.",
            h("div", { class: "pgrid" }, F.map(function(f) {
              var rel = rb.concat(f[0]);
              var cur = E(rel) || "";
              var sel = h("select", { class: "sel xs", onchange: function() { if (sel.value) edit(rel, sel.value); else restore(rel); } },
                [""].concat(ALL[f[0]] || []).map(function(v2) { return h("option", { value: v2, selected: v2 === cur }, v2 || "—"); }));
              return h("div", { class: "pcell" }, h("div", { class: "phead" }, h("span", { class: "plab" }, f[1]), badgeFor(rel)), sel);
            })),
            row(sbtn("Случайно", "#0e7490", function() {
              api("POST", "/bridge/api/player/random", {}).then(function() { return api("GET", "/bridge/api/state"); }).then(function(r) { if (r && r.json) setState(r.json); render(); });
            }))
          );
          out.setAttribute("data-sec", "passport");
          return out;
        }
        function bodySec() {
          var id = S.viewHeroine, rb = ["prompts", "heroines", id];
          var out = sec(
            "Внешность",
            "#f472b6",
            "Описание героини собирается из частей и уходит в промпт.",
            h("div", { class: "pgrid" }, BODY_PARTS.map(function(p) {
              var rel = rb.concat("sections", p[0]);
              var cb = h("input", { type: "checkbox", checked: E(rel.concat("on")) !== false, onchange: function() {
                edit(rel.concat("on"), cb.checked);
                render();
              } });
              return h(
                "div",
                { class: "pcell" },
                h("div", { class: "phead" }, h("span", { class: "plab" }, p[1]), badgeFor(rel), cb),
                promptBox("теги", rel.concat("tags"), { height: "52px" }),
                promptBox("негатив", rel.concat("negative"), { height: "40px" })
              );
            })),
            row(sbtn("Сбросить внешность", "#57534e", function() {
              BODY_PARTS.forEach(function(p) {
                restore(rb.concat("sections", p[0]));
              });
              render();
            }))
          );
          out.setAttribute("data-sec", "body");
          return out;
        }
        function quarantineSec() {
          var id = S.viewHeroine, rb = ["prompts", "heroines", id];
          var blocks = E(rb.concat("quarantine")) || {};
          var conds = Object.keys(E(["prompts", "conditions"]) || {});
          var out = sec(
            "Карантин",
            "#fb923c",
            "Теги отсюда попадают в промпт только когда сработало условие. Если условие не сработало — блок молчит.",
            h("div", { class: "pgrid" }, Object.keys(blocks).map(function(k) {
              var rel = rb.concat("quarantine", k);
              var curWhen = E(rel.concat("when")) || "";
              var whenList = conds.indexOf(curWhen) >= 0 ? conds : [curWhen].concat(conds);
              var whenSel = h("select", { class: "sel xs", title: "Условие (prompts.conditions), при котором блок попадает в промпт", onchange: function() {
                edit(rel.concat("when"), whenSel.value);
                whenSel.classList.add("dirty");
              } }, whenList.map(function(c) {
                return h("option", { value: c, selected: c === curWhen }, c || "(нет условия)");
              }));
              var curMode = E(rel.concat("mode")) || "auto";
              var modeSel = h("select", { class: "sel xs", title: "auto — по условию, always — всегда, never — никогда", onchange: function() {
                edit(rel.concat("mode"), modeSel.value);
                modeSel.classList.add("dirty");
              } }, ["auto", "always", "never"].map(function(m) {
                return h("option", { value: m, selected: m === curMode }, m);
              }));
              return h(
                "div",
                { class: "pcell" },
                h("div", { class: "phead" }, h("span", { class: "plab" }, k), badgeFor(rel), h("button", { type: "button", class: "link danger", title: "Убрать этот блок (вернуть к игровому умолчанию)", onclick: function() {
                  restore(rel);
                  render();
                } }, "\xD7")),
                row(whenSel, modeSel),
                promptBox("теги", rel.concat("tags"), { height: "48px" }),
                promptBox("негатив", rel.concat("negative"), { height: "36px" })
              );
            })),
            row(sbtn("Добавить блок", "#9a3412", function() {
              var n = prompt("Имя блока (латиницей, без пробелов):");
              if (!n) return;
              n = n.trim().replace(/[^A-Za-z0-9_.-]/g, "");
              if (!n) return;
              edit(rb.concat("quarantine", n), { tags: "", negative: "", when: conds[0] || "", mode: "auto" });
              render();
            }))
          );
          out.setAttribute("data-sec", "quarantine");
          return out;
        }
        function partsSection() {
          var eff = E(["prompts", "parts"]) || {};
          var lp = live() && live().parts || {};
          var hooked = !(S.st.diagnostics.game.hooks && S.st.diagnostics.game.hooks.parts === false);
          var out = sec(
            "Heroine State",
            "#f59e0b",
            'The game adds these parts by itself as the scene changes. Keep its words, use your own, or remove the part. "Live" is what the game sent for the current picture.',
            hooked ? null : h("div", { class: "err" }, "This game version did not expose its prompt parts, so these have no effect right now."),
            h("div", { class: "pgrid" }, PART_LABELS.map(function(label) {
              var rel = ["prompts", "parts", label];
              var v = eff[label] || null;
              var mode = v ? v.mode : "";
              var opts = label === "Quality" ? [["", "model's quality tags"], ["game", "keep the game's"], ["replace", "my text"], ["off", "remove"]] : [["", "game"], ["replace", "my text"], ["off", "remove"]];
              var shownMode = label !== "Quality" && mode === "game" ? "" : mode;
              var sel = h(
                "select",
                { class: "sel xs" + (isDirty(rel) ? " dirty" : ""), onchange: function() {
                  if (!sel.value) restore(rel);
                  else edit(rel, { mode: sel.value, text: v && v.text || (sel.value === "replace" ? lp[label] || "" : "") });
                  render();
                } },
                opts.map(function(o) {
                  return h("option", { value: o[0], selected: o[0] === shownMode }, o[1]);
                })
              );
              var txt = mode === "replace" ? h("textarea", {
                class: "ta" + (isDirty(rel) ? " dirty" : ""),
                style: "height:34px",
                "data-tags": "1",
                value: v.text || "",
                placeholder: "Your text for " + label,
                oninput: function(e) {
                  edit(rel, { mode: "replace", text: e.target.value });
                  e.target.classList.add("dirty");
                }
              }) : null;
              var liveText = label === "Quality" ? lp.Quality || "(game quality tags)" : lp[label] || "(none)";
              return h(
                "div",
                { class: "pcell" + (mode ? " set" : "") },
                h("div", { class: "phead" }, h("span", { class: "plab" }, label), addonMini("parts." + label), sel),
                h("div", { class: "plive", title: liveText }, h("span", { style: "color:#a8a29e" }, "Live: "), liveText),
                txt
              );
            })),
            row(sbtn("Restore default", "#292524", function() {
              if (confirm("Set every game part back to the game's words?")) {
                restore(["prompts", "parts"]);
                render();
              }
            }))
          );
          out.setAttribute("data-sec", "parts");
          return out;
        }
        function modelItems(kind, groupBy) {
          var files = S.models && S.models.files && S.models.files[kind] || [];
          return files.map(function(f) {
            var nm = String(f.name).replace(/\\/g, "/");
            return { value: f.name, label: nm, group: groupBy ? groupBy(f) : nm.indexOf("/") >= 0 ? "Folders" : "Files", title: nm + (f.base ? " \xB7 " + f.base : "") };
          });
        }
        function modelPick(kind, k, groupBy) {
          var rel = famRel(k), v = E(rel) || "";
          var fam = E(["pipeline", "family"]) || "anima", def = ((S.st.families || {})[fam] || {})[k];
          var items = [{ value: "", label: def ? "Default (" + def + ")" : "None", group: "" }].concat(modelItems(kind, groupBy));
          return picker(items, v, function(nv) {
            edit(rel, nv);
            render();
          }, { width: 520, dirty: isDirty(rel), missing: !!v && !!S.models && !items.some(function(i) {
            return i.value === v;
          }) });
        }
        function cacheStatus(kind) {
          var caps = S.st.caps, online = S.st.diagnostics.comfy.online;
          if (!online) return ["ComfyUI offline", "#f87171", false];
          if (!caps) return ["not checked yet", "#fbbf24", false];
          var cls = caps.nodes && caps.nodes[kind];
          return cls ? ["detected (" + cls + ")", "#4ade80", true] : ["not detected", "#f87171", false];
        }
        function checkCaches() {
          say("Checking ComfyUI\u2026", true);
          api("POST", "/bridge/api/comfy/refresh").then(function() {
            return refresh();
          }).then(function() {
            say("ComfyUI checked.", true);
          }).catch(function(e) {
            say(e.message, false);
          });
        }
        VIEWS.pipeline = function() {
          var fam = E(["pipeline", "family"]) || "anima";
          var famInfo = S.st.families && S.st.families[fam] || {};
          var isAnima = fam === "anima";
          var famSel = h(
            "select",
            { class: "sel big" + (isDirty(["pipeline", "family"]) ? " dirty" : ""), onchange: function() {
              edit(["pipeline", "family"], famSel.value);
              render();
              say("Switched to " + famSel.options[famSel.selectedIndex].text + ". Its own models and LoRAs are shown.", true);
            } },
            FAMILIES.map(function(f) {
              return h("option", { value: f[0], selected: f[0] === fam }, f[1]);
            })
          );
          var tea = function(k) {
            return ["pipeline", "teacache", k];
          }, sx = function(k) {
            return ["pipeline", "sdxlCache", k];
          };
          var ts = cacheStatus("teacache");
          var teaSec = sec(
            "Anima TeaCache \u2014 Optional",
            "#34d399",
            null,
            h("div", { class: "crowf" }, h("span", { class: "cstat", style: "color:" + ts[1] }, "TeaCache: " + ts[0]), sbtn("Check install", "transparent", checkCaches)),
            h("div", { class: "note", style: "color:#6ee7b7" }, "Anima only. Needs Anima TeaCache (BSS) in ComfyUI. Your settings are kept even when the node is missing; it is just skipped."),
            h(
              "div",
              { class: "crowf" + (ts[2] ? "" : " dim") },
              checkBox("On", tea("enabled")),
              selectBox(tea("version"), [["v1 (Legacy Fast)", "v1 fast"], ["v2 (Standard Precise)", "v2 precise"]]),
              selectBox(tea("device"), [["cuda", "cuda"], ["cpu", "cpu"]]),
              checkBox("Adaptive", tea("adaptive"))
            ),
            h("div", { class: "g5" + (ts[2] ? "" : " dim") }, numBox("Thresh", tea("threshold"), { step: 0.01 }), numBox("Early", tea("early"), { step: 0.05 }), numBox("Late", tea("late"), { step: 0.1 }), numBox("Start", tea("start"), { step: 0.01 }), numBox("End", tea("end"), { step: 0.01 }))
          );
          var mode = E(sx("mode")) || "donut", easy = mode === "easycache";
          var ss = cacheStatus(easy ? "easycache" : "donut");
          var sdxlSec = sec(
            "SDXL cache \u2014 Optional",
            "#38bdf8",
            null,
            h("div", { class: "crowf" }, h("span", { class: "cstat", style: "color:" + ss[1] }, (easy ? "EasyCache: " : "Donut: ") + ss[0]), sbtn("Check", "transparent", checkCaches)),
            h(
              "div",
              { class: "crowf" },
              checkBox("On", sx("enabled")),
              selectBox(sx("mode"), [["donut", "Donut"], ["easycache", "EasyCache"]], function() {
                render();
              }),
              easy ? checkBox("Verbose", sx("verbose")) : [selectBox(sx("preset"), [["balanced", "balanced"], ["conservative", "conservative"], ["aggressive", "aggressive"]]), selectBox(sx("device"), [["cuda", "cuda"], ["cpu", "cpu"]])]
            ),
            h("div", { class: "g3" + (ss[2] ? "" : " dim") }, easy ? [numBox("Reuse", sx("easyReuse"), { step: 0.01 }), numBox("Start", sx("easyStart"), { step: 0.01 }), numBox("End", sx("easyEnd"), { step: 0.01 })] : [numBox("Thresh", sx("threshold"), { step: 0.01 }), numBox("Start", sx("start"), { step: 0.01 }), numBox("End", sx("end"), { step: 0.01 })])
          );
          var pipeSec = sec(
            "PIPELINE \u2014 model family",
            "#f472b6",
            null,
            addonRow("pipeline", "The model family, models, sampler, which LoRAs, turbo and caches are saved for " + heroineName(S.viewHeroine) + " only; LoRA trigger words & groups, picture sizes, quality tags, the hi-res fix, face fix and GIF are shared by all heroines."),
            famSel,
            h("div", { class: "note" }, "Each pipeline remembers its own models, sampler, turbo, quality tags and LoRAs. Switching brings them back."),
            isAnima ? teaSec : sdxlSec,
            isAnima ? null : [lab("Checkpoint", "#f472b6"), modelPick("checkpoint", "checkpoint"), checkBox("Use VAE from checkpoint", famRel("useCheckpointVae"), function() {
              render();
            })]
          );
          var samplers = (S.st.caps && S.st.caps.samplers || []).map(function(x) {
            return [x, x];
          });
          var scheds = (S.st.caps && S.st.caps.schedulers || []).map(function(x) {
            return [x, x];
          });
          function addCurrent(list, v) {
            if (v && !list.some(function(o) {
              return o[0] === v;
            })) list.push([v, v + " (current)"]);
            return list;
          }
          var vaeOff = !isAnima && E(famRel("useCheckpointVae")) !== false;
          var comfySec = sec(
            "Model / sampler presets",
            "#fb923c",
            null,
            presetBar("model", function() {
              return { family: fam, settings: E(["pipeline", "families", fam]) };
            }, function(d) {
              if (d && d.family) {
                if (d.family !== fam) edit(["pipeline", "family"], d.family);
                applyMap(["pipeline", "families", d.family], d.settings || {});
              }
            }, "#ea580c"),
            h(
              "div",
              { class: "g2" },
              isAnima ? h("div", null, lab("unet", "#fb923c"), modelPick("unet", "unet")) : null,
              isAnima ? h("div", null, lab("clip", "#fb923c"), modelPick("clip", "clip")) : null,
              h("div", { class: vaeOff ? "dim" : "" }, lab("vae", "#fb923c"), modelPick("vae", "vae"), vaeOff ? h("div", { class: "note" }, 'Not used while "Use VAE from checkpoint" is on.') : null),
              h("div", null, lab("sampler", "#fb923c"), listPick(famRel("sampler"), addCurrent([["", "default (" + (famInfo.sampler || "?") + ")"]].concat(samplers), E(famRel("sampler"))))),
              h("div", null, lab("scheduler", "#fb923c"), listPick(famRel("scheduler"), addCurrent([["", "default (" + (famInfo.scheduler || "?") + ")"]].concat(scheds), E(famRel("scheduler"))))),
              isAnima ? null : h("div", null, lab("clip skip", "#fb923c"), numBox("1 = no skip, 2 = usual for anime models", famRel("clipSkip"), { min: 1, max: 12 }))
            ),
            !S.st.caps ? h("div", { class: "note", style: "color:#fbbf24" }, "Sampler and scheduler lists come from ComfyUI \u2014 start it and press Check.") : null
          );
          var turboSec = sec(
            "Turbo (steps / cfg override)",
            "#38bdf8",
            null,
            h("div", { class: "note", style: "color:#fbbf24" }, "When on, these steps and CFG are what get sent. When off, the pipeline default is used (" + famInfo.steps + " steps, CFG " + famInfo.cfg + "). Anima and turbo models burn above about CFG 3; turbo models want 4\u20138 steps."),
            h("div", { class: "crowf" }, checkBox("enabled", famRel("turbo").concat("enabled")), numBox("steps", famRel("turbo").concat("steps"), { min: 1, max: 200 }), numBox("cfg", famRel("turbo").concat("cfg"), { step: 0.1, min: 0, max: 30 }))
          );
          var shapeNote = h("div", { class: "note shapeinfo" });
          var paintShape = function() {
            var one = function(k, name) {
              var w = Number(E(["pipeline", k, "width"])) || 0, hh = Number(E(["pipeline", k, "height"])) || 0;
              if (!w || !hh) return name + ": \u2014";
              var mp = w * hh / 1e6, r = w / hh;
              var shape = Math.abs(r - 1) < 0.04 ? "square" : r > 1 ? "landscape" : "portrait (tall)";
              var fs = famSize(), r2 = w / hh;
              var warn = mp < fs.mp.lo ? k === "portrait" ? " \u2014 small: fine for the little circle, but " + fs.name + " draw best at about " + fs.mp.lo + "\u2013" + fs.mp.hi + " MP" : " \u2014 small: less detail" : mp > fs.mp.hi ? " \u2014 large: " + fs.name + " draw well up to about " + fs.mp.hi + " MP; bodies may come out stretched or doubled (use a smaller size + the hi-res fix)" : r2 < fs.ratio.min || r2 > fs.ratio.max ? " \u2014 a more extreme shape than " + fs.name + " handle well" : "";
              return name + ": " + w + " \xD7 " + hh + " = " + shape + ", " + mp.toFixed(2) + " MP" + warn;
            };
            var sw = Number(E(["pipeline", "scene", "width"])) || 0, sh = Number(E(["pipeline", "scene", "height"])) || 0;
            shapeNote.textContent = one("scene", "Scene") + "\n" + one("portrait", "Portrait") + (sw && sh && sh > sw ? "\nYour scene size is tall, but the game's picture box is made for landscape pictures (1216 \xD7 832): tall pictures make the box very tall." : "");
            shapeNote.style.color = /small|large|tall,|extreme/.test(shapeNote.textContent) ? "#fbbf24" : "#a8a29e";
          };
          var sizeSec = sec(
            "Picture size & quality tags",
            "#a78bfa",
            null,
            h("div", { class: "note", style: "color:#93c5fd" }, "How the game shows these sizes: a scene picture always fills the width of the game's picture box, so a bigger width does not make it bigger on screen. Width and height together set its shape (taller or wider) and how much detail ComfyUI draws. The game's box is made for 1216 \xD7 832 (landscape)."),
            (function() {
              var fs = famSize();
              return h("div", { class: "note", style: "color:#93c5fd" }, "For the selected pipeline (" + fs.name + "): sizes of about " + fs.mp.lo + "\u2013" + fs.mp.hi + " MP work well (best near " + fs.mp.best + " MP), and shapes up to about 1:" + Math.round(10 / fs.ratio.min) / 10 + " tall or " + Math.round(10 * fs.ratio.max) / 10 + ":1 wide. Bigger than that, bodies come out stretched or doubled; draw within it and use the hi-res fix to finish bigger.");
            })(),
            h("div", { class: "note", style: "color:#93c5fd" }, "Portraits (the patrons' faces) are shown as a small circle cut from the middle of the picture; clicking one shows the whole picture. A square size fits the circle; with a tall or wide size the edges are cut off in the circle."),
            h("div", { class: "g4" }, numBox("Scene width", ["pipeline", "scene", "width"], { step: 8, oninput: function() {
              paintShape();
            } }), numBox("Scene height", ["pipeline", "scene", "height"], { step: 8, oninput: function() {
              paintShape();
            } }), numBox("Portrait width", ["pipeline", "portrait", "width"], { step: 8, oninput: function() {
              paintShape();
            } }), numBox("Portrait height", ["pipeline", "portrait", "height"], { step: 8, oninput: function() {
              paintShape();
            } })),
            shapeNote,
            recommendBox(),
            promptBox("Quality tags for this pipeline (in front of every heroine picture)", famRel("quality"), { height: "40px", placeholder: famInfo.quality, noDefaultHint: true }),
            promptBox("Negative prompt for this pipeline", famRel("negative"), { height: "40px", placeholder: famInfo.negative, noDefaultHint: true }),
            row(sbtn("Restore defaults", "#57534e", function() {
              restore(["pipeline", "scene"]);
              restore(["pipeline", "portrait"]);
              restore(famRel("quality"));
              restore(famRel("negative"));
              render();
            }, "Picture sizes, quality tags and negative prompt back to their defaults"))
          );
          paintShape();
          return [pipeSec, testSection(), comfySec, loraSection(), turboSec, gifSection(), sizeSec, sceneSizeSection(), hiresSection(), detailSection()];
        };
        var RULE_PARTS = ["Quality tags", "Base", "Outfit", "Exposure", "Scene", "Focus", "Reaction", "Task", "Pose", "Mood", "Room", "Gender", "Group", "Gaze", "Narration", "FlashAnatomy", "Intoxication", "Arousal", "Aftermath"];
        function rulesNow(all) {
          return clone(E(["prompts", all ? "rulesAll" : "rules"]) || []);
        }
        function setRules(list, all) {
          edit(["prompts", all ? "rulesAll" : "rules"], list);
        }
        function addRule(r, all) {
          if (all === void 0) all = true;
          var list = rulesNow(all);
          list.push(Object.assign({ find: "", replace: "", target: "positive", part: "", on: true }, r || {}));
          setRules(list, all);
          return list.length - 1;
        }
        function rulesTable() {
          var rows = [];
          [true, false].forEach(function(all) {
            rulesNow(all).forEach(function(r, i) {
              rows.push({ r, i, all });
            });
          });
          if (!rows.length) return h("div", { class: "note", style: "color:#a8a29e" }, "No tag rules yet.");
          var dirty = isDirty(["prompts", "rules"]) || isDirty(["prompts", "rulesAll"]);
          return h(
            "table",
            { class: "rules" + (dirty ? " dirty" : "") },
            h("tr", null, h("th", null, "On"), h("th", null, "For"), h("th", null, "In"), h("th", null, "Part"), h("th", null, "Find these tags (any of them)"), h("th", null, "Replace with (empty = remove)"), h("th", null, "")),
            rows.map(function(x) {
              var r = x.r, i = x.i, all = x.all;
              var upd = function(k, v, redraw) {
                var l = rulesNow(all);
                if (!l[i]) return;
                l[i][k] = v;
                setRules(l, all);
                if (redraw) render();
              };
              var find = h("input", { class: "inp", value: r.find || "", placeholder: r.target === "negative" ? "e.g. 2girls, multiple girls" : "empty = always add", spellcheck: "false", "data-tags": "1", oninput: function() {
                upd("find", find.value);
                find.classList.add("dirty");
              } });
              var rep = h("input", { class: "inp", value: r.replace || "", placeholder: "(remove)", spellcheck: "false", "data-tags": "1", oninput: function() {
                upd("replace", rep.value);
                rep.classList.add("dirty");
              } });
              var on = h("input", { type: "checkbox", checked: r.on !== false, onchange: function() {
                upd("on", on.checked, true);
              } });
              var scope = h("select", { class: "sel", title: "Which heroines this rule is for", onchange: function() {
                var from = rulesNow(all), to = rulesNow(!all), item = from.splice(i, 1)[0];
                to.push(item);
                setRules(from, all);
                setRules(to, !all);
                render();
              } }, [["all", "All heroines"], ["one", heroineName(S.viewHeroine) + " only"]].map(function(o) {
                return h("option", { value: o[0], selected: (all ? "all" : "one") === o[0] }, o[1]);
              }));
              var tgt = h("select", { class: "sel", onchange: function() {
                upd("target", tgt.value, true);
              } }, [["positive", "Prompt"], ["negative", "Negative"]].map(function(o) {
                return h("option", { value: o[0], selected: (r.target || "positive") === o[0] }, o[1]);
              }));
              var part = r.target === "negative" ? h("span", { class: "note" }, "whole negative") : picker([{ value: "", label: "Any part" }].concat(RULE_PARTS.map(function(l) {
                return { value: l, label: l };
              })), r.part || "", function(v) {
                upd("part", v, true);
              }, { folders: false, sortGroups: false, width: 200 });
              return h(
                "tr",
                { class: r.on === false ? "off" : "" },
                h("td", null, on),
                h("td", null, scope),
                h("td", null, tgt),
                h("td", null, part),
                h("td", { style: "width:30%" }, find),
                h("td", { style: "width:30%" }, rep),
                h("td", null, sbtn("\u2715", "#44403c", function() {
                  var l = rulesNow(all);
                  l.splice(i, 1);
                  setRules(l, all);
                  render();
                }, "Delete this rule"))
              );
            })
          );
        }
        function learnSection() {
          var L = S.learn;
          if (!L) {
            S.learn = { loading: true };
            api("GET", "/bridge/api/learn").then(function(j) {
              S.learn = j;
              if (S.open && S.tab === "negatives" && !isTyping()) render();
            }).catch(function() {
              S.learn = { error: true };
            });
            L = S.learn;
          }
          var body;
          if (L.loading) body = h("div", { class: "note" }, "Looking at your ratings\u2026");
          else if (L.error) body = h("div", { class: "note" }, "Could not read your ratings.");
          else if (!L.enough) body = h("div", { class: "note", style: "color:#a8a29e" }, "Not enough ratings yet: " + L.good + " saved and " + L.bad + " deleted pictures so far (at least " + L.need + " of each needed). Thumbs up saves a picture, thumbs down deletes it; both are remembered here.");
          else {
            var item = function(x, kind) {
              return h(
                "div",
                { class: "learn" },
                h("b", null, x.tag),
                h("span", { class: "note", style: "margin:0 8px" }, kind === "prompt" ? "in " + x.inBad + " of " + L.bad + " deleted vs " + x.inGood + " of " + L.good + " saved" : "in the negative of " + x.inGood + " of " + L.good + " saved vs " + x.inBad + " of " + L.bad + " deleted"),
                h("span", { class: "grow" }),
                kind === "prompt" ? sbtn("Remove from prompt", "#a16207", function() {
                  addRule({ find: x.tag, replace: "", target: "positive", part: "" }, true);
                  say('Tag rule added (unsaved): remove "' + x.tag + '" from every prompt.', true);
                  render();
                }, "Adds a tag rule for all heroines; Save & Apply to keep it") : sbtn("Add to negative", "#9f1239", function() {
                  addRule({ find: "", replace: x.tag, target: "negative", part: "" }, true);
                  say('Tag rule added (unsaved): "' + x.tag + '" in every negative prompt.', true);
                  render();
                }, "Adds a tag rule for all heroines; Save & Apply to keep it"),
                sbtn("Ignore", "#44403c", function() {
                  api("POST", "/bridge/api/learn/ignore", { tag: x.tag }).then(function(j) {
                    S.learn = j;
                    render();
                  });
                }, "Do not suggest this tag again")
              );
            };
            body = h(
              "div",
              null,
              h("div", { class: "note" }, "From " + L.good + " saved and " + L.bad + " deleted pictures. A tag here only goes together with the pictures you deleted; it may not be the cause, so check before accepting."),
              L.prompt.length ? h("div", null, lab("Often in pictures you deleted"), L.prompt.map(function(x) {
                return item(x, "prompt");
              })) : h("div", { class: "note" }, "No prompt tag stands out in the pictures you deleted."),
              L.negative.length ? h("div", { style: "margin-top:8px" }, lab("In the negative prompt of pictures you saved, but not of ones you deleted"), L.negative.map(function(x) {
                return item(x, "negative");
              })) : null
            );
          }
          return sec("Suggestions from your ratings", "#86efac", null, body, row(sbtn("Look again", "#44403c", function() {
            S.learn = null;
            render();
          })));
        }
        function extraGroup(id) {
          return /^(patron_|no_man|one_patron|joined_)/.test(id) ? "Patron scenes" : /^exposure|^exposed|^covered/.test(id) ? "Clothes & exposure" : /^room_|^bath/.test(id) ? "Rooms & bath" : /^(reluctant|distressed)$/.test(id) ? "Her mood" : "Other";
        }
        VIEWS.negatives = function() {
          var nb = ["prompts", "negatives"];
          var extras = S.st.negativeExtras || [];
          var groups = {};
          extras.forEach(function(x) {
            var g = extraGroup(x.id);
            (groups[g] = groups[g] || []).push(x);
          });
          var negSec = sec(
            "The game's negative prompt",
            "#fca5a5",
            "The game builds every negative prompt from a base list plus extras for some situations. Edit or empty any of them (empty = the game adds nothing there). Your words only go in where the game would have put its own.",
            h("label", { class: "cb", title: "On: one set of game negatives for every heroine. Off: each heroine has her own (saved for the heroine selected at the top)." }, h("input", { type: "checkbox", checked: !!app("sharedNegatives"), onchange: function(e) {
              var on = e.target.checked, cur = clone(E(nb));
              setDraft(["app", "sharedNegatives"], on);
              if (on) {
                setDraft(["layer"].concat(nb), cur);
                Object.keys(S.st.heroineLayers || {}).forEach(function(hid) {
                  if (getAt(S.st.heroineLayers[hid], nb) !== void 0) delDraft(["heroine", hid].concat(nb));
                });
                Object.keys(S.st.saves || {}).forEach(function(id) {
                  if (getAt(S.st.saves[id], nb) !== void 0) delDraft(["saves", id].concat(nb));
                });
              }
              render();
            } }), " Same game negatives for all heroines"),
            row(sbtn("Restore all", "#57534e", function() {
              restore(nb);
              render();
            }, "Every game negative back to the game's text")),
            promptBox("Base negative (every heroine picture, minus words already in her description)", nb.concat("base"), { height: "60px" }),
            ["Patron scenes", "Clothes & exposure", "Rooms & bath", "Her mood", "Other"].filter(function(g) {
              return groups[g];
            }).map(function(g) {
              var open = S.negOpen && S.negOpen[g];
              var d = h(
                "details",
                { open: !!open, ontoggle: function() {
                  S.negOpen = S.negOpen || {};
                  S.negOpen[g] = d.open;
                } },
                h("summary", null, g + " (" + groups[g].length + ")" + (groups[g].some(function(x) {
                  return isDirty(nb.concat("extras", x.id)) || origin(nb.concat("extras", x.id)).id !== "game";
                }) ? " \u2014 changed" : "")),
                groups[g].map(function(x) {
                  return promptBox(x.label, nb.concat("extras", x.id), { height: "40px" });
                })
              );
              return d;
            }),
            h("div", { class: "note" }, "Also part of the negative prompt: the character negative and outfit negatives (Heroines & outfits), the model's negative prompt (Pipeline & models) and the patron negative (Scenes & NPCs)."),
            row(sbtn("Character & outfit negatives", "#44403c", function() {
              jump("heroines");
            }), sbtn("Model negative", "#44403c", function() {
              jump("pipeline");
            }))
          );
          var ruleSec = sec(
            "Tag rules",
            "#fcd34d",
            'For anything else: find tags anywhere in the finished prompt or negative prompt and replace or remove them, or (with "Find" empty) always add tags. "(2girls:1.3)", "2girls" and "2_girls" count as the same tag. Rules run last, after every other setting. "For" says whether a rule is for every heroine or only for ' + heroineName(S.viewHeroine) + ".",
            rulesTable(),
            row(
              sbtn("+ Add rule for the prompt", "#a16207", function() {
                addRule({ target: "positive" });
                render();
              }),
              sbtn("+ Add rule for the negative", "#9f1239", function() {
                addRule({ target: "negative" });
                render();
              }),
              sbtn("Restore (no rules)", "#57534e", function() {
                restore(["prompts", "rules"]);
                restore(["prompts", "rulesAll"]);
                render();
              })
            )
          );
          ruleSec.setAttribute("data-sec", "rules");
          return [negSec, ruleSec, learnSection()];
        };
        function famSize() {
          var fam = E(["pipeline", "family"]) || "anima";
          var f = S.st.families && S.st.families[fam] || {};
          return Object.assign({ mp: { lo: 0.6, best: 1, hi: 1.6 }, ratio: { min: 0.45, max: 2.2 }, name: "these models" }, f.size || {}, { family: fam });
        }
        function measurePictureBox() {
          var full = document.querySelector("button[title='View image fullscreen']");
          var host2 = full && (full.parentElement && full.parentElement.parentElement || full.parentElement);
          if (!host2) return null;
          var r = host2.getBoundingClientRect();
          if (r.width < 50) return null;
          var top = Math.max(0, r.top);
          return { w: Math.round(r.width), h: Math.max(200, Math.round(window.innerHeight - top - 12)), dpr: window.devicePixelRatio || 1 };
        }
        function recommendSize(box) {
          var fs = famSize();
          var want = box.w / box.h, ratio = Math.min(fs.ratio.max, Math.max(fs.ratio.min, want));
          var best = null;
          for (var w = 448; w <= 2048; w += 8) {
            var h2 = Math.round(w / ratio / 8) * 8;
            if (h2 < 448 || h2 > 2560) continue;
            var mp = w * h2 / 1048576, err = Math.abs(w / h2 - ratio) / ratio;
            var score = err * 6 + Math.abs(mp - fs.mp.best) / fs.mp.best;
            if (!best || score < best.score) best = { w, h: h2, score };
          }
          var target = Math.max(box.w * box.dpr, 1216);
          var scale = Math.round(Math.min(2, Math.max(1, target / best.w)) * 100) / 100;
          var hires = scale >= 1.1;
          var r8 = function(n) {
            return Math.round(n / 8) * 8;
          };
          return { w: best.w, h: best.h, scale: hires ? scale : 0, fw: hires ? r8(best.w * scale) : best.w, fh: hires ? r8(best.h * scale) : best.h, clamped: Math.abs(want - ratio) > 0.01, want, fs };
        }
        function recommendBox() {
          var box = measurePictureBox();
          var wrap = h("div", { class: "recbox" });
          var remeasure = sbtn("\u21BB measure again", "#14532d", function() {
            render();
          }, "Measure the game's picture box again (after resizing the window, for example)");
          if (!box) {
            wrap.appendChild(h("div", null, 'Recommended size: open a scene in the game so its picture box is on screen, then press "measure again".'));
            wrap.appendChild(row(remeasure, restoreSizeBtn()));
            return wrap;
          }
          var rec = recommendSize(box);
          var cur = { w: Number(E(["pipeline", "scene", "width"])), h: Number(E(["pipeline", "scene", "height"])), on: !!E(["pipeline", "hires", "enabled"]), scale: Number(E(["pipeline", "hires", "scale"])) || 1.5 };
          var same2 = cur.w === rec.w && cur.h === rec.h && (rec.scale ? cur.on && Math.abs(cur.scale - rec.scale) < 0.011 : true);
          wrap.appendChild(h(
            "div",
            null,
            h("b", null, "Recommended for your screen: "),
            "the picture box is " + box.w + " \xD7 " + box.h + " on screen" + (box.dpr !== 1 ? " (pixel ratio " + box.dpr + ")" : "") + ". ",
            "Draw at " + rec.w + " \xD7 " + rec.h + " (about " + (rec.w * rec.h / 1048576).toFixed(2) + " MP, a size " + rec.fs.name + " draw well: about " + rec.fs.mp.lo + "\u2013" + rec.fs.mp.hi + " MP)",
            rec.scale ? " with the hi-res fix at \xD7" + rec.scale + ": finished at " + rec.fw + " \xD7 " + rec.fh + "." : ", without the hi-res fix: that is already sharper than your screen shows it.",
            " Same shape as the box, without stretched bodies.",
            rec.clamped ? " The box is " + (rec.want < 1 ? "taller" : "wider") + " than " + rec.fs.name + " handle well, so the picture is a little " + (rec.want < 1 ? "shorter" : "narrower") + " than the box." : ""
          ));
          wrap.appendChild(row(
            same2 ? h("span", { style: "color:#4ade80" }, "\u2713 Your settings match this.") : sbtn("Fit picture to my screen", "#15803d", function() {
              applyRecommended(rec);
            }, "Fills in the recommended scene size and hi-res fix; Save & Apply to keep them"),
            remeasure,
            restoreSizeBtn()
          ));
          return wrap;
        }
        function applyRecommended(rec) {
          edit(["pipeline", "scene", "width"], rec.w);
          edit(["pipeline", "scene", "height"], rec.h);
          if (rec.scale) {
            edit(["pipeline", "hires", "enabled"], true);
            edit(["pipeline", "hires", "scale"], rec.scale);
            if (!E(["pipeline", "hires", "denoise"])) edit(["pipeline", "hires", "denoise"], 0.4);
          } else edit(["pipeline", "hires", "enabled"], false);
          say("Recommended size for your screen filled in: " + rec.w + " \xD7 " + rec.h + (rec.scale ? ", hi-res \xD7" + rec.scale + " \u2192 " + rec.fw + " \xD7 " + rec.fh : "") + " (unsaved). Save & Apply to use it.", true);
          render();
        }
        function restoreSizeBtn() {
          return sbtn("Restore defaults", "#57534e", function() {
            restore(["pipeline", "scene"]);
            restore(["pipeline", "hires"]);
            say("Scene size and hi-res fix back to their defaults (unsaved). Save & Apply to use them.", true);
            render();
          }, "Scene size back to the game's 1216 \xD7 832 and the hi-res fix back to off");
        }
        function testSection() {
          var t = S.test || {};
          var out = h("div");
          if (t.running) out.appendChild(h("div", { class: "note", style: "color:#fbbf24" }, "Drawing a 512 \xD7 512 test picture\u2026"));
          else if (t.result) {
            var r = t.result;
            (r.warnings || []).forEach(function(w) {
              out.appendChild(h("div", { class: "warnbox" }, w));
            });
            if (r.ok) out.appendChild(h("div", { class: "testok" }, h("img", { src: r.image, alt: "test picture" }), h("div", null, h("div", { style: "color:#4ade80;font-weight:600" }, "It works (" + Math.round(r.ms / 100) / 10 + " s, " + r.family + ")."), (r.notes || []).map(function(n) {
              return h("div", { class: "note" }, n);
            }), h("div", { class: "note" }, "Unsaved changes are not included: Save & Apply first to test them."))));
            else out.appendChild(h("div", { class: "err" }, r.error, r.raw && r.raw !== r.error ? h("div", { class: "was", style: "margin-top:4px" }, "ComfyUI said: " + r.raw) : null));
          }
          var hr = h("input", { type: "checkbox", checked: !!t.hires });
          return sec(
            "Test this pipeline",
            "#4ade80",
            "Draws one small test picture with the saved models, sampler and LoRAs, and says in plain words what is wrong if it fails.",
            row(sbtn("Test pipeline", "#15803d", function() {
              S.test = { running: true, hires: hr.checked };
              render();
              api("POST", "/bridge/api/test-pipeline", { heroine: S.viewHeroine, hires: hr.checked }).then(function(j) {
                S.test = { result: j, hires: hr.checked };
                if (S.open && S.tab === "pipeline") render();
              }).catch(function(e) {
                S.test = { result: { ok: false, error: e.message } };
                if (S.open && S.tab === "pipeline") render();
              });
            }), h("label", { class: "cb small" }, hr, " include the hi-res fix and face / hand fix")),
            out
          );
        }
        function sizeTargets() {
          var p = S.st.defaults.prompts || {}, out = [];
          Object.keys(p.scenes || {}).sort().forEach(function(id) {
            out.push({ value: id, label: id.replace(/_/g, " "), group: "Scenes" });
          });
          Object.keys(p.looks || {}).sort().forEach(function(id) {
            out.push({ value: "look_" + id, label: id.replace(/_/g, " "), group: "Looks" });
          });
          Object.keys(p.tasks || {}).sort().forEach(function(id) {
            out.push({ value: "task_" + id, label: id.replace(/_/g, " "), group: "Tasks" });
          });
          return out;
        }
        function sceneSizeSection() {
          var rel = ["pipeline", "sceneSizes"];
          var map = clone(E(rel) || {});
          var ids = Object.keys(map).sort();
          var setOne = function(id, k, v) {
            var m = clone(E(rel) || {});
            m[id] = Object.assign({}, m[id] || {}, (function() {
              var o = {};
              o[k] = v;
              return o;
            })());
            edit(rel, m);
          };
          var targets = sizeTargets();
          var liveId = (function() {
            var l = live();
            var p = l && l.parsed || {};
            return p.scene || (p.lookFocus ? "look_" + p.lookFocus : p.task ? "task_" + p.task : "");
          })();
          return sec(
            "Picture size for single scenes",
            "#a78bfa",
            "Some scenes look better in another shape (lying in bed, tall standing poses). A size here is used for that scene instead of the scene size above.",
            ids.length ? h(
              "table",
              { class: "rules" },
              h("tr", null, h("th", null, "Scene"), h("th", null, "Width"), h("th", null, "Height"), h("th", null, "")),
              ids.map(function(id) {
                var w = h("input", { class: "inp num", type: "number", step: 8, value: map[id].width || "", oninput: function() {
                  if (w.value) setOne(id, "width", Number(w.value));
                  w.classList.add("dirty");
                } });
                var hh = h("input", { class: "inp num", type: "number", step: 8, value: map[id].height || "", oninput: function() {
                  if (hh.value) setOne(id, "height", Number(hh.value));
                  hh.classList.add("dirty");
                } });
                return h("tr", null, h("td", null, id.replace(/_/g, " ")), h("td", null, w), h("td", null, hh), h("td", null, sbtn("\u2715", "#44403c", function() {
                  var m = clone(E(rel) || {});
                  delete m[id];
                  edit(rel, m);
                  render();
                }, "Use the normal scene size again")));
              })
            ) : h("div", { class: "note", style: "color:#a8a29e" }, "None: every scene uses the scene size."),
            row(
              picker(targets, "", function(v) {
                if (!v) return;
                var m = clone(E(rel) || {});
                var sc = E(["pipeline", "scene"]) || {};
                m[v] = m[v] || { width: sc.height || 832, height: sc.width || 1216 };
                edit(rel, m);
                render();
              }, { placeholder: "+ Add a scene\u2026", width: 280, style: "min-width:220px" }),
              liveId && !map[liveId] ? sbtn("+ The scene in game (" + liveId.replace(/_/g, " ") + ")", "#57534e", function() {
                var m = clone(E(rel) || {});
                var sc = E(["pipeline", "scene"]) || {};
                m[liveId] = { width: sc.height || 832, height: sc.width || 1216 };
                edit(rel, m);
                render();
              }) : null
            )
          );
        }
        function hiresSection() {
          var hr = function(k) {
            return ["pipeline", "hires", k];
          };
          var ups = (S.models && S.models.files && S.models.files.upscale || []).map(function(x) {
            return [x.name, x.name];
          });
          var sc = E(["pipeline", "scene"]) || {}, f = Number(E(hr("scale"))) || 1.5;
          var fs = famSize();
          return sec(
            "Hi-res fix",
            "#f472b6",
            "Draws at the picture size, scales it up, then lets the sampler add detail at the bigger size. Sharper pictures for about twice the drawing time. Scene pictures only." + (fs.family === "anima" ? " Anima / Z-Image models already draw up to about " + fs.mp.hi + " MP directly, so it is optional for them; with turbo settings (few steps) the second pass is quick." : " SDXL-type models draw best near 1 MP, so for big pictures draw near 1 MP and let this scale it up."),
            h("div", { class: "crowf" }, checkBox("enabled", hr("enabled")), numBox("scale \xD7", hr("scale"), { step: 0.05, min: 1.1, max: 2 }), numBox("denoise", hr("denoise"), { step: 0.05, min: 0.05, max: 1 }), numBox("steps (0 = half)", hr("steps"), { min: 0, max: 100 })),
            h("div", { class: "field" }, lab("Upscale model (optional; blank = simple resize)"), listPick(hr("model"), [["", "(none: simple resize)"]].concat(ups))),
            h("div", { class: "note" }, "With " + (sc.width || "?") + " \xD7 " + (sc.height || "?") + " and \xD7" + f + ": finished at about " + Math.round((sc.width || 0) * f / 8) * 8 + " \xD7 " + Math.round((sc.height || 0) * f / 8) * 8 + ". Denoise 0.3\u20130.5 keeps the picture and adds detail; higher changes it more.")
          );
        }
        function detailSection() {
          var dr = function(k) {
            return ["pipeline", "detail", k];
          };
          var caps = S.st.caps || {}, nodes = caps.nodes || {}, models = caps.models && caps.models.detector || [];
          var ok = !!(nodes.faceDetailer && nodes.detectorProvider);
          var opts = function(re) {
            return [["", "(automatic: first " + (re.source.indexOf("face") >= 0 ? "face" : "hand") + " model found)"]].concat(models.filter(function(m) {
              return re.test(m);
            }).concat(models.filter(function(m) {
              return !re.test(m);
            })).map(function(m) {
              return [m, m];
            }));
          };
          var status = !S.st.caps ? h("div", { class: "note", style: "color:#a8a29e" }, "ComfyUI not checked yet (Config \u203A Check ComfyUI).") : ok ? h("div", { class: "note", style: "color:#4ade80" }, "Impact Pack found \xB7 " + models.length + " detector model" + (models.length === 1 ? "" : "s") + (models.length ? "" : " \u2014 put face_yolov8m.pt / hand_yolov8s.pt in ComfyUI/models/ultralytics/bbox")) : h("div", { class: "note", style: "color:#f87171" }, "Needs ComfyUI Impact Pack (FaceDetailer) and Impact Subpack (UltralyticsDetectorProvider), plus detector models in ComfyUI/models/ultralytics/bbox (e.g. face_yolov8m.pt, hand_yolov8s.pt). Install them with ComfyUI Manager, restart ComfyUI and press Check ComfyUI in Config. Until then this is skipped.");
          return sec(
            "Face & hand fix",
            "#f472b6",
            "After a picture is drawn, faces (and hands) are found and redrawn at a higher resolution, so small faces and hands come out cleaner. Adds a few seconds per face / hand. Uses the same model, sampler and prompt as the picture, so it works with Anima and the SDXL-type pipelines alike.",
            status,
            h("div", { class: "crowf" }, checkBox("fix faces", dr("face")), checkBox("fix hands", dr("hands")), checkBox("also patron portraits", dr("portraits")), numBox("denoise", dr("denoise"), { step: 0.05, min: 0.05, max: 1 })),
            models.length ? h("div", { class: "g3" }, h("div", { class: "field" }, lab("Face detector"), listPick(dr("faceModel"), opts(/face/i))), h("div", { class: "field" }, lab("Hand detector"), listPick(dr("handModel"), opts(/hand/i)))) : null,
            h("div", { class: "note" }, "Denoise 0.3\u20130.5 cleans up the face and keeps it; higher changes the face more. The inspector notes when the fix ran."),
            row(sbtn("Restore defaults", "#57534e", function() {
              restore(["pipeline", "detail"]);
              render();
            }))
          );
        }
        function gifSection() {
          var g = function(k) {
            return ["pipeline", "gif", k];
          };
          var ff = S.ffmpeg;
          if (!ff) {
            S.ffmpeg = { checking: true };
            api("GET", "/bridge/api/ffmpeg-check").then(function(j) {
              S.ffmpeg = j;
              if (S.open && S.tab === "pipeline" && !isTyping()) render();
            }).catch(function() {
              S.ffmpeg = { found: false };
            });
            ff = S.ffmpeg;
          }
          var promptNow = E(g("prompt")) || "";
          return sec(
            "Output GIF",
            "#fbbf24",
            (E(g("seconds")) || 3) + " second looping GIF of each still picture (image-to-video in ComfyUI, then ffmpeg).",
            h("div", { class: "note", style: "color:#fb923c;font-weight:600" }, "Requires the proper ComfyUI workflow (WAN 2.2 image-to-video; your own can go in wayward-bridge-data\\workflows\\gif.json)."),
            h("div", { class: "note", style: "color:" + (ff.checking ? "#a8a29e" : ff.found ? "#4ade80" : "#f87171") }, ff.checking ? "ffmpeg: checking\u2026" : ff.found ? "ffmpeg: " + ff.path : "ffmpeg not found \u2014 set Config \u2192 ffmpeg path"),
            checkBox("Use current scene prompt", g("useScene")),
            promptBox("GIF / motion prompt (added when Convert to GIF is on)", g("prompt"), { height: "64px", placeholder: "e.g. gentle breathing, hair sway, looping animation, anime motion", noDefaultHint: true, oninput: function(v) {
              var a = overlay.querySelector(".gifactive");
              if (a) a.textContent = "Active GIF prompt: " + (v || "(none)");
            } }),
            h("div", { class: "note gifactive", style: "color:#fbbf24;white-space:pre-wrap" }, "Active GIF prompt: " + (promptNow || "(none)")),
            promptBox("GIF negative prompt (optional)", g("negative"), { height: "36px", noDefaultHint: true }),
            h("div", { class: "crowf" }, checkBox("Convert to GIF", g("enabled")), numBox("FPS", g("fps"), { min: 1, max: 30 }), numBox("Seconds", g("seconds"), { min: 1, max: 10, step: 0.5 })),
            h("div", { class: "note" }, "Convert to GIF turns every new scene picture into a GIF. The GIF button on the game's picture converts just that one. Copies go to the ComfyUI output folder's GIFs folder."),
            row(sbtn("Restore defaults", "#57534e", function() {
              restore(["pipeline", "gif"]);
              render();
            }))
          );
        }
        function loraSection() {
          var list = loraList();
          var q = (S.filter.lora || "").toLowerCase();
          var order = ["Anima", "Illustrious", "NoobAI", "Pony", "SDXL", "Flux", "SD 1.5", "SD 2.1", "Unknown"];
          function loraItems() {
            return modelItems("lora", function(f) {
              var b = String(f.base || "").split(",")[0].trim();
              return order.indexOf(b) >= 0 ? b : "Unknown";
            }).filter(function(it) {
              return !q || it.label.toLowerCase().indexOf(q) >= 0 || it.group.toLowerCase().indexOf(q) >= 0;
            });
          }
          function saveList(l2, msg) {
            edit(famRel("loras"), l2);
            if (msg) say(msg, true);
            render();
          }
          function slotEdit(i, fn, msg, noRender) {
            var L = loraList();
            if (!L[i]) return;
            fn(L[i], L);
            if (noRender) edit(famRel("loras"), L);
            else saveList(L, msg);
          }
          var search = h("input", { class: "inp sm", style: "width:200px", placeholder: "Filter LoRAs\u2026", value: S.filter.lora || "", onchange: function(e) {
            S.filter.lora = e.target.value;
            render();
          } });
          var slots = list.map(function(l, i) {
            var it = scanItem(l.model);
            var detected = detectedWords(l), removedOf = (libFind(l.model) || {}).removed || [];
            var ign = (it && it.ignored || []).filter(function(w) {
              return !detected.some(function(d) {
                return tagKey(d) === tagKey(w);
              });
            });
            var addSel = h(
              "select",
              { class: "sel xs", style: "max-width:110px", title: "Words the detector skipped: pick one to make it a trigger word", onchange: function(e) {
                var w = e.target.value;
                if (!w) return;
                libEdit(l.model, function(x) {
                  addWords(x, [w]);
                });
                say('Added "' + w + `" to this LoRA's trigger words (every heroine).`, true);
                render();
              } },
              [h("option", { value: "" }, "+ word" + (ign.length ? " (" + ign.length + ")" : ""))].concat(ign.map(function(w) {
                return h("option", { value: w }, w);
              }))
            );
            var remSel = h(
              "select",
              { class: "sel xs", style: "max-width:110px", title: "Remove a word from this LoRA (also takes it out of the character prompt)", onchange: function(e) {
                var w = e.target.value;
                if (!w) return;
                libEdit(l.model, function(x) {
                  x.removed = uniq(x.removed.concat([w]));
                  x.words = x.words.filter(function(y) {
                    return tagKey(y) !== tagKey(w);
                  });
                });
                setCharPrompt(removePhrases(E(charRel()) || "", [w]));
                render();
              } },
              [h("option", { value: "" }, "\u2212 word")].concat(detected.map(function(w) {
                return h("option", { value: w }, w);
              }))
            );
            var manual = h("input", { class: "inp xs", placeholder: "type a trigger word + Enter", style: "width:180px", onkeydown: function(e) {
              if (e.key === "Enter" && e.target.value.trim() && !sug.open) {
                var w = e.target.value.trim().replace(/,\s*$/, "");
                libEdit(l.model, function(x) {
                  addWords(x, splitTags(w));
                });
                say('Added "' + w + `" to this LoRA's trigger words (every heroine).`, true);
                render();
              }
            } });
            return h(
              "div",
              { class: "lslot" + (l.enabled === false ? " dim" : "") },
              h(
                "div",
                { class: "lrow" },
                h("input", { type: "checkbox", title: "Use this LoRA", checked: l.enabled !== false, onchange: function(e) {
                  var on = e.target.checked;
                  slotEdit(i, function(x) {
                    x.enabled = on;
                  });
                } }),
                picker([{ value: "", label: "None", group: "" }].concat(loraItems()), l.model, function(v) {
                  changeLora(i, v);
                }, { width: 560, style: "flex:1;min-width:0", missing: !!l.model && !!S.models && !it }),
                addSel,
                remSel,
                h("input", { class: "inp xs base", readonly: true, value: it && it.base || "\u2014", title: "preferred pipeline (from the file)" }),
                h("input", { class: "inp xs str", type: "number", step: 0.05, value: l.strength, title: "strength", onchange: function(e) {
                  var v = Number(e.target.value);
                  slotEdit(i, function(x) {
                    x.strength = v;
                  }, null, true);
                } })
              ),
              loraScopeRow(l, i, list),
              h("div", { class: "lrow2" }, l.model ? manual : null, removedOf.length ? h("span", { class: "note", style: "margin:0" }, "removed: ", removedOf.map(function(w) {
                return h("span", { class: "rem", title: "Click to bring this word back", onclick: function() {
                  libEdit(l.model, function(x) {
                    x.removed = x.removed.filter(function(y) {
                      return tagKey(y) !== tagKey(w);
                    });
                  });
                  render();
                } }, w + " \u21BA");
              })) : null)
            );
          });
          return sec(
            "LoRA models & trigger words",
            "#fb923c",
            "Heroine pictures only (not patron portraits). Which LoRAs are used is saved for " + heroineName(S.viewHeroine) + "; each LoRA's trigger words and groups are shared by every heroine. Picking a LoRA puts its trigger words into " + heroineName(S.viewHeroine) + `'s character prompt and takes the previous LoRA's words out. "+ only for\u2026" limits a LoRA to some scenes, looks, tasks or outfits; its words are then added to those pictures only.`,
            h(
              "div",
              { class: "lrow", style: "margin-bottom:6px" },
              search,
              sbtn("+", "#7c2d12", function() {
                var L = loraList();
                if (L.filter(function(x) {
                  return x.model;
                }).length >= 50) return say("50 LoRAs is the most one pipeline can use.", false);
                L.push({ model: "", strength: 1, enabled: true, words: [], removed: [], groups: [] });
                edit(famRel("loras"), L);
                render();
              }, "Add LoRA slot"),
              sbtn("\u2212", "#44403c", function() {
                var L = loraList();
                if (!L.length) return;
                var gone = L.pop();
                if (gone && gone.model) setCharPrompt(removePhrases(E(charRel()) || "", detectedWords(gone)));
                saveList(L, "Removed the last LoRA slot.");
              }, "Remove last LoRA slot"),
              h("span", { class: "grow" }),
              h("span", { class: "colh", style: "width:92px" }, "preferred pipeline"),
              h("span", { class: "colh", style: "width:64px" }, "strength")
            ),
            slots.length ? slots : h("div", { class: "note" }, "No LoRA. Press + to add one."),
            !S.st.app.modelsDir ? h("div", { class: "note", style: "color:#fbbf24" }, "Set the ComfyUI models folder in Config so LoRAs are grouped by base model and folder, and their trigger words are detected.") : null,
            triggerChipsArea("gen")
          );
        }
        function addWords(x, words) {
          var have = {};
          detectedWords(x).forEach(function(w) {
            have[tagKey(w)] = 1;
          });
          var back = {};
          words.forEach(function(w) {
            back[tagKey(w)] = 1;
          });
          x.removed = (x.removed || []).filter(function(y) {
            return !back[tagKey(y)];
          });
          var fresh = words.filter(function(w) {
            var k = tagKey(w);
            if (!k || have[k]) return false;
            have[k] = 1;
            return true;
          });
          x.words = (x.words || []).concat(fresh.filter(function(w) {
            return !(x.words || []).some(function(y) {
              return tagKey(y) === tagKey(w);
            });
          }));
        }
        function loraScopeTargets() {
          var p = S.st.defaults.prompts || {}, out = [];
          Object.keys(p.scenes || {}).sort().forEach(function(id) {
            out.push({ value: "scene:" + id, label: id.replace(/_/g, " "), group: "Scenes" });
          });
          Object.keys(p.looks || {}).sort().forEach(function(id) {
            out.push({ value: "look:" + id, label: id.replace(/_/g, " "), group: "Looks" });
          });
          Object.keys(p.tasks || {}).sort().forEach(function(id) {
            out.push({ value: "task:" + id, label: id.replace(/_/g, " "), group: "Tasks" });
          });
          Object.keys(p.outfits || {}).sort().forEach(function(id) {
            out.push({ value: "outfit:" + id, label: (p.outfits[id].name || id).replace(/_/g, " "), group: "Outfits" });
          });
          return out;
        }
        function loraScopeRow(l, i, list) {
          if (!l.model) return null;
          var only = l.only || [];
          var setOnly = function(next) {
            var was = only.length > 0, now = next.length > 0;
            var text = E(charRel()) || "";
            if (!was && now) edit(charRel(), removePhrases(text, detectedWords(l)));
            if (was && !now) edit(charRel(), insertAfterQuality(text, detectedWords(l)));
            var L = loraList();
            if (!L[i]) return;
            L[i].only = next;
            edit(famRel("loras"), L);
            render();
          };
          var label = function(o) {
            var k = o.split(":")[0], v = o.slice(k.length + 1);
            return (k === "outfit" ? "outfit " : k === "look" ? "look " : k === "task" ? "task " : "") + v.replace(/_/g, " ");
          };
          return h(
            "div",
            { class: "lrow2" },
            h("span", { class: "note", style: "margin:0" }, only.length ? "Only for:" : "For: every heroine picture"),
            only.map(function(o) {
              return h("span", { class: "acat", title: "Click to remove", style: "cursor:pointer", onclick: function() {
                setOnly(only.filter(function(x) {
                  return x !== o;
                }));
              } }, label(o) + " \u2715");
            }),
            picker(loraScopeTargets().filter(function(t) {
              return only.indexOf(t.value) < 0;
            }), "", function(v) {
              if (v) setOnly(only.concat([v]));
            }, { placeholder: "+ only for\u2026", width: 300, style: "min-width:120px;display:inline-block" }),
            only.length ? h("span", { class: "note", style: "margin:0" }, "Its trigger words are added to those pictures only.") : null
          );
        }
        function changeLora(i, model) {
          var list = loraList();
          var prev = list[i] || {};
          var text = E(charRel()) || "";
          if (prev.model) text = removePhrases(text, detectedWords(prev));
          var only = (prev.only || []).slice();
          list[i] = { model, strength: prev.strength == null ? 1 : prev.strength, enabled: true, only };
          edit(famRel("loras"), list);
          if (model && !only.length) text = insertAfterQuality(text, detectedWords(list[i]));
          edit(charRel(), text);
          say(model ? "Selected " + String(model).split("/").pop() + " \u2014 its trigger words were put in " + heroineName(S.viewHeroine) + "'s character prompt." : "LoRA cleared.", true);
          render();
        }
        VIEWS.config = function() {
          var d = S.st.diagnostics;
          var m = S.models || {};
          var counts = m.counts ? Object.keys(m.counts).map(function(k) {
            return k + ": " + m.counts[k];
          }).join(" \xB7 ") : "";
          var fileInp = h("input", { type: "file", accept: ".json", style: "display:none", onchange: function(e) {
            var f = e.target.files[0];
            if (!f) return;
            if (!confirm("Replace your settings with the ones in " + f.name + "? (You can undo this.)")) return;
            f.text().then(function(t) {
              return api("POST", "/bridge/api/import-old", { config: JSON.parse(t) });
            }).then(function(j) {
              S.ops = {};
              clearUndo();
              setState(j.state);
              say("Imported.", true);
            }).catch(function(err) {
              say("Could not import: " + err.message, false);
            });
          } });
          var tables = d.game.tables || {}, missing = Object.keys(tables).filter(function(k) {
            return !tables[k];
          });
          var r = app("retention") || {};
          function tr(a, b) {
            return h("tr", null, h("td", null, a), h("td", null, b));
          }
          return [
            updateSection(),
            sec(
              "ComfyUI",
              "#38bdf8",
              null,
              appText("ComfyUI address", "comfyUrl", "http://127.0.0.1:8188"),
              row(sbtn("Check ComfyUI", "#0284c7", checkCaches), h("span", { class: "note", style: "margin:0;color:" + (d.comfy.online ? "#4ade80" : "#f87171") }, d.comfy.online ? "online" : "offline"))
            ),
            sec(
              "ComfyUI models folder",
              "#38bdf8",
              "Point this at ComfyUI\\models (or the ComfyUI folder). It is scanned for checkpoints, UNETs, CLIPs, VAEs, LoRAs (with base model and trigger words) and upscalers.",
              appText("Folder path", "modelsDir", "F:\\ComfyUI\\models"),
              appText("Output folder", "comfyOutputDir", "F:\\ComfyUI\\output", "ComfyUI's output folder: saved scenes go in its saved-scenes folder and GIFs in its GIFs folder (like the old mod). Auto-delete also cleans its wayward folder. Blank: kept in wayward-bridge-data."),
              appText("ffmpeg path", "ffmpegPath", "C:\\ffmpeg\\bin\\ffmpeg.exe", "Full path to ffmpeg.exe (required for GIFs). Blank: looked for on PATH."),
              row(sbtn("Save path & scan", "#0284c7", function() {
                var v = app("modelsDir") || "";
                api("PATCH", "/bridge/api/settings", { ops: [{ path: ["app", "modelsDir"], value: v }] }).then(function(j) {
                  delete S.ops["appmodelsDir"];
                  setState(j.state);
                  return loadModels(true);
                }).then(function(mm) {
                  say(mm && mm.error ? mm.error : "Scanned.", !(mm && mm.error));
                }).catch(function(e) {
                  say(e.message, false);
                });
              }), sbtn("Scan again", "#57534e", function() {
                loadModels(true).then(function(mm) {
                  say(mm && mm.error ? mm.error : "Scanned.", !(mm && mm.error));
                });
              })),
              h("div", { class: "note" }, m.error ? m.error : counts)
            ),
            sec(
              "Auto-delete generated images",
              "#f59e0b",
              "When on, the oldest pictures are permanently deleted once there are more than the limit \u2014 in the bridge's picture library and in ComfyUI's output\\wayward folder (if the output folder above is set). Older versions of a scene go before the one the game shows. Pictures you saved with thumbs up are never auto-deleted. The Recycle Bin is not used.",
              h(
                "div",
                { class: "crowf" },
                h("label", { class: "cb" }, h("input", { type: "checkbox", checked: !!r.enabled, onchange: function(e) {
                  setDraft(["app", "retention"], Object.assign({}, app("retention") || {}, { enabled: e.target.checked }));
                } }), " Auto-delete"),
                h("span", { class: "note", style: "margin:0" }, "Max images"),
                h("input", { class: "inp num", type: "number", min: 1, value: r.maxImages || 100, onchange: function(e) {
                  setDraft(["app", "retention"], Object.assign({}, app("retention") || {}, { maxImages: Math.max(1, Number(e.target.value) || 100) }));
                } }),
                h("span", { class: "note", style: "margin:0" }, "Now: " + d.library.images + " pictures")
              )
            ),
            savedSection(),
            browseSection(),
            sec(
              "Prompt boxes",
              "#a78bfa",
              null,
              appCheck("Backspace / Delete remove whole tags", "tagDelete", "When on, Backspace deletes the whole tag before the cursor and Delete the whole tag after it (with its comma). The tag you are typing right now is deleted letter by letter as usual. Select text first to delete just part of another tag. Off by default."),
              h("div", { class: "note" }, "Ctrl+\u2191 / Ctrl+\u2193 on a tag raises / lowers its weight: blush \u2192 (blush:1.1) \u2192 (blush:1.2); back at 1.0 the brackets go away.")
            ),
            sec(
              "Speed & shortcuts",
              "#38bdf8",
              null,
              appCheck("Draw ahead while idle", "drawAhead", "While nothing is being drawn, scenes the game showed recently are drawn again in the background, so a fresh picture is ready (and shown at once) the next time the game asks for one. Pictures drawn ahead are thrown away when you change settings. Only while Use Saved Images/GIFs is off. Uses your graphics card while you play; off by default."),
              h("div", { class: "crowf" }, h("span", { class: "note", style: "margin:0" }, "Keep up to"), h("input", { class: "inp num", type: "number", min: 1, max: 10, value: app("drawAheadCount") || 3, onchange: function(e) {
                setDraft(["app", "drawAheadCount"], Math.max(1, Math.min(10, Number(e.target.value) || 3)));
              } }), h("span", { class: "note", style: "margin:0" }, "pictures ready")),
              appCheck("Keyboard shortcuts on the game's picture", "shortcuts", "Alt+G Generate new \xB7 Alt+S Same seed \xB7 Alt+\u2190 / Alt+\u2192 (or Alt+A / Alt+D) saved pictures \xB7 Alt+K save (thumbs up) \xB7 Alt+Delete (or Alt+X) delete (thumbs down) \xB7 Alt+P Show prompt \xB7 Alt+E Edit. Not while you type or while the menu is open.")
            ),
            addonsSec(),
            saveIdSection(),
            backupSection(),
            sec(
              "Server & defaults",
              "#38bdf8",
              null,
              row(sbtn("Restore all settings to default for " + heroineName(S.viewHeroine), "#7f1d1d", function() {
                if (!confirm("Restore every setting made only for " + heroineName(S.viewHeroine) + ", and her character prompt? (Save & Apply to confirm.)")) return;
                delDraft(heroPath(S.viewHeroine).concat("prompts"));
                delDraft(["layer", "prompts", "heroines", S.viewHeroine]);
                delDraft(["picks", scopeOf("", S.viewHeroine)]);
                render();
              }), sbtn("Restore ALL prompts to default", "#7f1d1d", function() {
                if (confirm("Restore every prompt for every heroine to the game defaults? Models and LoRAs stay. (Save & Apply to confirm.)")) {
                  delDraft(["layer", "prompts"]);
                  heroines().forEach(function(hh) {
                    if (S.st.heroineLayers[hh]) delDraft(["heroine", hh, "prompts"]);
                  });
                  Object.keys(S.st.saves || {}).forEach(function(id) {
                    delDraft(["saves", id, "prompts"]);
                  });
                  render();
                }
              })),
              row(
                sbtn("Undo last save", "#57534e", function() {
                  api("POST", "/bridge/api/undo").then(function(j) {
                    say(j.ok ? "Undone." : "Nothing to undo.", !!j.ok);
                    S.ops = {};
                    clearUndo();
                    setState(j.state);
                  });
                }),
                sbtn("Import an old config.json\u2026", "#57534e", function() {
                  fileInp.click();
                }),
                fileInp
              ),
              importPresetsRow(),
              S.st.legacy && Object.keys(S.st.legacy).length ? h("div", { class: "note" }, "Kept from your old settings but not used yet: " + Object.keys(S.st.legacy).join(", ") + ".") : null
            ),
            sec("Diagnostics", "#f87171", null, h(
              "table",
              { class: "diag" },
              tr("Bridge", d.version + " \xB7 Node " + d.node),
              tr("Game folder", d.game.dir || "not found"),
              tr("Game version", d.game.version || "unknown"),
              tr("Prompt parts hook", d.game.hooks && d.game.hooks.parts ? "installed" : "not found \u2014 edits are matched against the whole prompt"),
              tr("Game tables", missing.length ? "missing: " + missing.join(", ") : "all found"),
              tr("ComfyUI", (d.comfy.online ? "online" : "offline") + " at " + d.comfy.url + (d.comfy.error ? " (" + d.comfy.error + ")" : "")),
              tr("Picture library", d.library.images + " pictures for " + d.library.keys + " scenes"),
              tr("Data folder", d.dataDir)
            ))
          ];
        };
        function saveIdSection() {
          var her = activeHer(), info = S.st.saveInfo || {}, act = S.st.activeSave || "";
          var idOf = function(id) {
            return id.slice(id.indexOf(".") + 1);
          };
          var when = function(t) {
            try {
              return t ? new Date(t).toLocaleString() : "";
            } catch (e) {
              return "";
            }
          };
          var cur = act && info[act] ? info[act] : null;
          var assign = sbtn("Assign a new save ID", "#0f766e", function() {
            if (!her) return say("Load a save in the game first.", false);
            if (count()) return say("Save or discard your changes first.", false);
            if (!confirm("Give the save being played (" + (her.name || heroineName(S.viewHeroine)) + ") a new save ID?\n\nIts settings are copied to the new ID, so nothing changes in what you see. From then on it is separate from any other save that had the same ID.")) return;
            if (!assignNewSaveId()) say("Could not change the save ID.", false);
          }, "A new unique ID for the save being played; its settings come along");
          var rows = Object.keys(info).filter(function(id) {
            return (S.st.saves || {})[id];
          }).sort(function(a, b) {
            return (info[b].at || 0) - (info[a].at || 0);
          }).map(function(id) {
            var m = info[id];
            return h("tr", null, h("td", null, heroineName(m.heroine) + (m.name && m.name !== heroineName(m.heroine) ? " (" + m.name + ")" : "")), h("td", { style: "font-family:ui-monospace,monospace" }, idOf(id)), h("td", null, when(m.at)), h("td", { style: "color:#4ade80" }, id === act ? "being played" : ""));
          });
          return sec(
            "Save ID",
            "#38bdf8",
            "Every game carries its own save ID inside its saves (every slot, day autosave and exported file of that game), and each save ID keeps its own settings. If two different games ever share an ID (for example two saves made before save IDs existed, or a save copied and played on as a second game), load one of them and give it a new ID here.",
            her ? h("div", { class: "note", style: "color:#d6d3d1" }, "Save being played: " + (her.name || heroineName(S.viewHeroine)) + (cur ? " \u2014 save ID " + idOf(act) : her.save ? " \u2014 save ID " + her.save : "")) : h("div", { class: "note" }, "No save is being played (load one in the game to see or change its ID)."),
            row(assign),
            rows.length ? h("details", null, h("summary", null, "All saves the mod knows (" + rows.length + ")"), h("table", { class: "diag" }, h("tr", null, h("td", null, "Heroine"), h("td", null, "Save ID"), h("td", null, "Last played"), h("td", null, "")), rows)) : null
          );
        }
        function backupSection() {
          var B = S.bk;
          var inp = h("input", { type: "file", accept: ".json", style: "display:none", onchange: function(e) {
            var f = e.target.files[0];
            if (!f) return;
            f.text().then(function(t) {
              return api("POST", "/bridge/api/backup/preview", { content: t }).then(function(pv2) {
                S.bk = { name: f.name, content: t, pv: pv2, keep: true };
                render();
              });
            }).catch(function(err) {
              say("Could not read the backup: " + err.message, false);
            });
          } });
          var preview = null;
          if (B) {
            var pv = B.pv;
            var keep = h("input", { type: "checkbox", checked: B.keep !== false, onchange: function(e) {
              B.keep = e.target.checked;
            } });
            preview = h(
              "div",
              { class: "impbox" },
              h("b", null, B.name),
              h("div", { class: "note" }, "Made " + (pv.at ? new Date(pv.at).toLocaleString() : "?") + (pv.bridge ? " with " + pv.bridge : "") + ". Contains: settings for " + (pv.heroines.length ? pv.heroines.map(heroineName).join(", ") : "no single heroine") + (pv.sharedSections.length ? ", shared prompts (" + pv.sharedSections.join(", ") + ")" : "") + (pv.pipeline ? ", models & pipeline" : "") + ", " + pv.addons.length + " add-on(s), " + pv.presets + " preset(s), " + pv.rules + " tag rule(s)."),
              h("div", { class: "warnbox" }, "Restoring replaces all your settings, presets with the same kind, and add-ons with the same file name. Your current settings are kept as a backup: Config \u203A Undo last save brings them back."),
              pv.paths.length ? h("label", { class: "cb" }, keep, " Keep this computer's folders and ComfyUI address (" + pv.paths.map(function(x) {
                return x.key;
              }).join(", ") + " differ per PC)") : null,
              row(sbtn("Restore this backup", "#b91c1c", function() {
                if (count() && !confirm("You have unsaved changes; they will be lost. Restore anyway?")) return;
                api("POST", "/bridge/api/backup/restore", { content: B.content, keepPaths: B.keep !== false }).then(function(j) {
                  S.ops = {};
                  clearUndo();
                  S.bk = null;
                  setState(j.state);
                  say("Backup restored.", true);
                }).catch(function(err) {
                  say("Not restored: " + err.message, false);
                });
              }), sbtn("Cancel", "#44403c", function() {
                S.bk = null;
                render();
              }))
            );
          }
          return sec(
            "Backup & move to another PC",
            "#38bdf8",
            "One file with everything: settings for every heroine, models & LoRAs, tag rules, presets and add-ons (not the pictures themselves). Use it as a backup or to move to another computer.",
            row(h("a", { class: "sbtn", style: "background:#0369a1;text-decoration:none;color:#fff", href: "/bridge/api/backup", download: "" }, "Export everything"), sbtn("Import a backup\u2026", "#57534e", function() {
              inp.click();
            }), inp),
            preview
          );
        }
        function prettyPath(p) {
          return String(p).replace(/\.(\d+)$/, function(m, n) {
            return " \xB7 variant " + (Number(n) + 1);
          }).split(".").join(" \u203A ").replace(/_/g, " ");
        }
        function updateSection() {
          var u = S.st.gameUpdate;
          if (!u) return sec("Game update check", "#34d399", "When you put a new version of the game in its folder, this lists the prompts it changed, added or removed, and which of your edits were made for the old text.", h("div", { class: "note", style: "color:#4ade80" }, "No changes since the game version you last checked."));
          var item = function(x, kind) {
            return h(
              "div",
              { class: "upd" },
              h("b", null, prettyPath(x.path)),
              x.who ? h("span", { class: "note", style: "margin-left:6px" }, "(your edit, " + (x.who === "all heroines" ? "all heroines" : heroineName(x.who)) + ")") : null,
              x.yours != null ? h("div", { class: "was" }, "yours: " + x.yours) : null,
              x.was != null ? h("div", { class: "was" }, "game before: " + x.was) : null,
              kind !== "removed" && x.now ? h("div", { class: "was", style: "color:#a7f3d0" }, "game now: " + x.now) : null,
              x.gone ? h("div", { class: "was", style: "color:#fca5a5" }, "The game no longer uses this prompt, so your edit does nothing now.") : null
            );
          };
          var list = function(title, arr, kind, open) {
            return arr.length ? h("details", { open: !!open }, h("summary", null, title + " (" + arr.length + ")"), arr.slice(0, 300).map(function(x) {
              return item(x, kind);
            })) : null;
          };
          return sec(
            "Game update check",
            "#fbbf24",
            "The game changed from " + u.from + " to " + u.to + ". Your edits still apply; check the ones below in case the game's new text is better, or yours now misses something.",
            list("Your edits on prompts the game changed or removed", u.edits || [], "edits", true),
            list("Prompts the game changed", u.changed || [], "changed"),
            list("New prompts", u.added || [], "added"),
            list("Prompts the game removed", u.removed || [], "removed"),
            row(sbtn("Got it", "#15803d", function() {
              api("POST", "/bridge/api/game-update/ack").then(function(j) {
                setState(j.state);
                say("Noted. The next game update is compared with this version.", true);
              }).catch(function(e) {
                say(e.message, false);
              });
            }, "This game version becomes the one later updates are compared with"))
          );
        }
        function loadSaved() {
          return api("GET", "/bridge/api/saved?heroine=" + encodeURIComponent(S.viewHeroine)).then(function(j) {
            S.saved = j;
            if (S.open && S.tab === "config" && !isTyping()) render();
            return j;
          }).catch(function() {
          });
        }
        var genTimer = null;
        function pollGenAll() {
          api("GET", "/bridge/api/gen-all").then(function(j) {
            S.genAll = j.genAll;
            var el = overlay.querySelector(".genstatus");
            if (el) {
              el.textContent = genLine(j.genAll);
              el.style.color = j.genAll.running ? "#fbbf24" : j.genAll.failed ? "#f87171" : "#4ade80";
            }
            if (!j.genAll.running && genTimer) {
              clearInterval(genTimer);
              genTimer = null;
              loadSaved();
            }
          }).catch(function() {
          });
        }
        function eta(ms) {
          var t = Math.round(Math.max(0, ms || 0) / 1e3);
          if (t < 60) return t + "s";
          var m = Math.floor(t / 60);
          t %= 60;
          if (m < 60) return m + "m " + t + "s";
          return Math.floor(m / 60) + "h " + m % 60 + "m";
        }
        function genLine(g) {
          if (!g || !g.running && !g.total) return "";
          return (g.running ? "Running: " : "") + (g.message || "") + "  " + g.done + "/" + g.total + (g.running && g.etaMs ? "  ETA " + eta(g.etaMs) : "") + (g.failed ? "  failed " + g.failed : "") + (g.skipped ? "  (skipped " + g.skipped + " already saved)" : "");
        }
        function multi(label, items, key) {
          S.sel[key] = S.sel[key] || [];
          var sel = h(
            "select",
            { class: "sel multi", multiple: true, onchange: function() {
              S.sel[key] = Array.prototype.map.call(sel.selectedOptions, function(o) {
                return o.value;
              });
            } },
            items.map(function(it) {
              return h("option", { value: it, selected: S.sel[key].indexOf(it) >= 0 }, it);
            })
          );
          return h("div", { style: "min-width:0" }, h("div", { class: "minilab" }, label + " (Ctrl+click to exclude)"), sel);
        }
        function tiny(label, items, key) {
          return h(
            "div",
            { style: "min-width:0" },
            h("div", { class: "minilab" }, label),
            h("select", { class: "sel", style: "width:100%", onchange: function(e) {
              S.sel[key] = e.target.value;
            } }, [h("option", { value: "" }, "(any)")].concat(items.map(function(it) {
              return h("option", { value: it, selected: S.sel[key] === it }, it);
            })))
          );
        }
        function savedSection() {
          var sv = S.saved;
          if (!sv || sv.heroine !== S.viewHeroine) {
            if (!S.savedLoading) {
              S.savedLoading = true;
              loadSaved().then(function() {
                S.savedLoading = false;
              });
            }
            sv = sv || { scenes: [], lists: { scenes: [], outfits: [], rooms: [], moods: [] } };
          }
          var L = sv.lists || { scenes: [], outfits: [], rooms: [], moods: [] };
          var on = !!(app("savedMedia") || {}).enabled;
          var count2 = h("input", { class: "inp num", type: "number", min: 1, max: 20, value: S.sel.genCount || 5, onchange: function(e) {
            S.sel.genCount = Math.max(1, Math.min(20, Number(e.target.value) || 5));
          } });
          var vary = function(k, label) {
            if (S.sel[k] == null) S.sel[k] = true;
            return h("label", { class: "cb" }, h("input", { type: "checkbox", checked: !!S.sel[k], onchange: function(e) {
              S.sel[k] = e.target.checked;
            } }), " " + label);
          };
          var clearSel = h(
            "select",
            { class: "sel", style: "flex:1;min-width:160px", onchange: function(e) {
              S.sel.clearScene = e.target.value;
            } },
            [h("option", { value: "" }, heroineName(S.viewHeroine) + " \u2014 Select scene to clear")].concat((sv.scenes || []).map(function(x) {
              return h("option", { value: x.scene, selected: S.sel.clearScene === x.scene }, x.scene + " (" + x.count + ")");
            }))
          );
          var status = h("div", { class: "note genstatus", style: "color:" + (S.genAll && S.genAll.running ? "#fbbf24" : "#a8a29e") }, genLine(S.genAll));
          if (S.genAll && S.genAll.running && !genTimer) genTimer = setInterval(pollGenAll, 1500);
          return sec(
            "Saved scene images / GIFs",
            "#fbbf24",
            "Use Saved Images/GIFs reads saved-scenes / <heroine> / <scene> / <outfit> / <room> / <mood> /" + (sv.root ? " (in " + sv.root + ")" : "") + ".",
            h("div", { class: "note", style: "color:#93c5fd" }, "With Use Saved Images/GIFs on, the game shows a random saved picture of the scene instead of drawing one. The Generate new and Same seed buttons on the game's picture still draw a new picture. The \u2039 Saved \u203A arrows at the bottom right of the game's picture step through the saved pictures of the scene in order, wrapping around at the ends. Saving and Generate all scenes use the heroine selected at the top; pictures are kept per heroine."),
            h(
              "div",
              { class: "crowf" },
              h("label", { class: "cb" }, h("input", { type: "checkbox", checked: on, onchange: function(e) {
                setDraft(["app", "savedMedia"], { enabled: e.target.checked });
              } }), " Use Saved Images/GIFs"),
              sbtn("Save current image/GIF for active scene", "#7c2d12", function() {
                api("POST", "/bridge/api/saved/save", { key: S.st.lastKey }).then(function(j) {
                  say("Saved to " + j.folder + ".", true);
                  loadSaved();
                }).catch(function(e) {
                  say(e.message, false);
                });
              }),
              h("span", { class: "note", style: "margin:0" }, "per scene"),
              count2,
              sbtn("Generate all scenes", "#7c2d12", function() {
                var n = S.sel.genCount || 5;
                if (!confirm((S.sel.fillGaps ? "Fill every scene \xD7 outfit \xD7 room \xD7 mood up to " + n + " saved image(s)" : "Generate " + n + " image(s) for every scene \xD7 outfit \xD7 room \xD7 mood") + " for " + heroineName(S.viewHeroine) + "? That can be a very large batch. Continue?")) return;
                api("POST", "/bridge/api/gen-all", {
                  heroine: S.viewHeroine,
                  count: n,
                  fillGaps: !!S.sel.fillGaps,
                  varyOutfits: S.sel.varyO !== false,
                  varyRooms: S.sel.varyR !== false,
                  varyMoods: S.sel.varyM !== false,
                  excludeOutfits: S.sel.exO || [],
                  excludeRooms: S.sel.exR || [],
                  excludeMoods: S.sel.exM || [],
                  excludeScenes: S.sel.exS || []
                }).then(function(j) {
                  S.genAll = j.genAll;
                  say("Started " + j.genAll.total + " pictures for " + heroineName(S.viewHeroine) + ".", true);
                  if (genTimer) clearInterval(genTimer);
                  genTimer = setInterval(pollGenAll, 1500);
                  pollGenAll();
                }).catch(function(e) {
                  say("Generate-all failed: " + e.message, false);
                });
              }),
              sbtn("Stop", "#44403c", function() {
                api("POST", "/bridge/api/gen-all/stop").then(pollGenAll);
              })
            ),
            h(
              "div",
              { class: "crowf" },
              vary("varyO", "Vary outfits"),
              vary("varyR", "Vary rooms"),
              vary("varyM", "Vary moods"),
              h("label", { class: "cb", title: "Each combination is only filled up to the number per scene: one that already has saved pictures gets only the missing ones" }, h("input", { type: "checkbox", checked: !!S.sel.fillGaps, onchange: function(e) {
                S.sel.fillGaps = e.target.checked;
              } }), " Only fill gaps")
            ),
            h("div", { class: "g3" }, multi("Exclude outfits", L.outfits, "exO"), multi("Exclude rooms", L.rooms, "exR"), multi("Exclude moods", L.moods, "exM")),
            h("div", { style: "margin-top:6px" }, multi("Exclude scenes", L.scenes, "exS")),
            status,
            row(sbtn("Browse saved pictures \u2193", "#a16207", function() {
              S.scrollTo = "browse";
              render();
            }, "Star, move or delete saved pictures, for any heroine")),
            h("div", { class: "g3", style: "margin-top:8px" }, tiny("Clothes", L.outfits, "clearO"), tiny("Room", L.rooms, "clearR"), tiny("Mood", L.moods, "clearM")),
            row(
              clearSel,
              sbtn("Clear Saved Image", "#7c2d12", function() {
                var sc = S.sel.clearScene;
                if (!sc) return say("Pick a scene to clear.", false);
                var bits = [sc, S.sel.clearO, S.sel.clearR, S.sel.clearM].filter(Boolean);
                if (!confirm("Delete saved images for " + bits.join(" / ") + " on " + heroineName(S.viewHeroine) + "?")) return;
                api("POST", "/bridge/api/saved/clear", { heroine: S.viewHeroine, scene: sc, outfit: S.sel.clearO || "", room: S.sel.clearR || "", mood: S.sel.clearM || "" }).then(function(j) {
                  say("Cleared " + sc + " (" + j.removed + " files).", true);
                  loadSaved();
                }).catch(function(e) {
                  say(e.message, false);
                });
              }),
              sbtn("Clear all for this heroine", "#7c2d12", function() {
                if (!confirm("Delete ALL saved images/GIFs for " + heroineName(S.viewHeroine) + "?")) return;
                api("POST", "/bridge/api/saved/clear", { heroine: S.viewHeroine, all: true }).then(function(j) {
                  say("Cleared all (" + j.removed + " files).", true);
                  loadSaved();
                }).catch(function(e) {
                  say(e.message, false);
                });
              })
            )
          );
        }
        function browseSection() {
          var B = S.br = S.br || {};
          if (!B.heroine) B.heroine = S.viewHeroine;
          var load = function(what, url, then) {
            if (B["loading_" + what]) return;
            B["loading_" + what] = true;
            api("GET", url).then(function(j) {
              then(j);
              B["loading_" + what] = false;
              if (S.open && S.tab === "config" && !isTyping()) render();
            }).catch(function() {
              B["loading_" + what] = false;
            });
          };
          if (!B.heroines) load("h", "/bridge/api/saved/heroines", function(j) {
            B.heroines = j.heroines || [];
          });
          if (!B.scenes || B.scenesFor !== B.heroine) load("s", "/bridge/api/saved/scenes?heroine=" + encodeURIComponent(B.heroine), function(j) {
            B.scenes = j.scenes || [];
            B.lists = j.lists || {};
            B.scenesFor = j.heroine;
          });
          if (B.scene && (!B.files || B.filesFor !== B.heroine + "/" + B.scene)) load("f", "/bridge/api/saved/browse?heroine=" + encodeURIComponent(B.heroine) + "&scene=" + encodeURIComponent(B.scene), function(j) {
            B.files = j.files || [];
            B.filesFor = j.heroine + "/" + j.scene;
          });
          var reload = function() {
            B.heroines = null;
            B.scenes = null;
            B.files = null;
            loadSaved();
            render();
          };
          var counts = {};
          (B.heroines || []).forEach(function(x2) {
            counts[x2.heroine] = x2.count;
          });
          var ids = heroines().slice();
          Object.keys(counts).forEach(function(k) {
            if (ids.indexOf(k) < 0) ids.push(k);
          });
          var hPick = picker(
            ids.map(function(id) {
              return { value: id, label: heroineName(id) + " (" + (counts[id] || 0) + ")", active: !!(live() && live().heroine === id) };
            }),
            B.heroine,
            function(v) {
              B.heroine = v;
              B.scene = "";
              B.files = null;
              render();
            },
            { width: 260, style: "min-width:180px" }
          );
          var scenes = B.scenesFor === B.heroine ? B.scenes || [] : [];
          if (B.scene && !scenes.some(function(x2) {
            return x2.scene === B.scene;
          }) && B.scenesFor === B.heroine) B.scene = "";
          var sPick = picker(
            [{ value: "", label: scenes.length ? "\u2014 pick a scene \u2014" : "no saved pictures" }].concat(scenes.map(function(x2) {
              return { value: x2.scene, label: x2.scene.replace(/_/g, " ") + " (" + x2.count + ")" };
            })),
            B.scene || "",
            function(v) {
              B.scene = v;
              B.files = null;
              render();
            },
            { width: 280, style: "min-width:200px" }
          );
          var grid = null;
          if (B.scene && B.files && B.filesFor === B.heroine + "/" + B.scene) {
            var groups = {};
            B.files.forEach(function(f) {
              var g = [f.outfit, f.room, f.mood].join(" / ");
              (groups[g] = groups[g] || []).push(f);
            });
            grid = B.files.length ? Object.keys(groups).sort().map(function(g) {
              return h(
                "div",
                { class: "sbgroup" },
                h("div", { class: "lab" }, g.replace(/_/g, " ") + " (" + groups[g].length + ")"),
                h("div", { class: "sbgrid" }, groups[g].map(function(f) {
                  var moving = S.moveRel === f.rel;
                  return h(
                    "div",
                    { class: "sbitem" + (f.fav ? " fav" : "") },
                    h("img", { src: f.url, loading: "lazy", title: f.rel + "\n(click to open it full size)", onclick: function() {
                      window.open(f.url, "_blank");
                    } }),
                    h(
                      "div",
                      { class: "sbbar" },
                      h("button", { type: "button", class: "sbb" + (f.fav ? " on" : ""), title: f.fav ? "Unstar" : "Star: shown more often with Use Saved Images/GIFs", onclick: function() {
                        api("POST", "/bridge/api/saved/fav", { rel: f.rel, on: !f.fav }).then(function() {
                          B.files = null;
                          render();
                        });
                      } }, f.fav ? "\u2605" : "\u2606"),
                      h("button", { type: "button", class: "sbb", title: "Move to another outfit / room / mood of this scene", onclick: function() {
                        S.moveRel = moving ? "" : f.rel;
                        render();
                      } }, "move"),
                      h("button", { type: "button", class: "sbb", title: "Delete this saved picture", onclick: function() {
                        if (confirm("Delete this saved picture?")) api("POST", "/bridge/api/saved/delete", { rel: f.rel }).then(reload);
                      } }, "\u2715")
                    ),
                    moving ? moveBox(f, B.lists || {}, reload) : null
                  );
                }))
              );
            }) : h("div", { class: "note" }, "No saved pictures for this scene.");
          } else if (B.scene) grid = h("div", { class: "note" }, "Loading\u2026");
          var total = counts[B.heroine] || 0;
          var x = sec(
            "Browse saved pictures",
            "#facc15",
            "Saved pictures are kept per heroine (saved-scenes / <heroine> / <scene> / <outfit> / <room> / <mood>). Pick a heroine and a scene to see them. Star the ones you like (shown four times as often with Use Saved Images/GIFs), move one filed under the wrong outfit, room or mood, or delete it.",
            h(
              "div",
              { class: "crowf" },
              h("span", { class: "note", style: "margin:0" }, "Heroine"),
              hPick,
              h("span", { class: "note", style: "margin:0" }, "Scene"),
              sPick,
              sbtn("\u21BB", "#44403c", reload, "Look again (after Generate all scenes, for example)")
            ),
            h("div", { class: "note", style: "color:#a8a29e" }, heroineName(B.heroine) + ": " + total + " saved picture" + (total === 1 ? "" : "s") + " in " + scenes.length + " scene" + (scenes.length === 1 ? "" : "s") + "."),
            grid
          );
          x.classList.add("browsesec");
          x.setAttribute("data-sec", "browse");
          return x;
        }
        function moveBox(f, L, done) {
          var sel = function(list, cur, k) {
            return h("select", { class: "sel", onchange: function(e) {
              S.moveTo = S.moveTo || {};
              S.moveTo[k] = e.target.value;
            } }, (list || []).concat((list || []).indexOf(cur) < 0 ? [cur] : []).map(function(x) {
              return h("option", { value: x, selected: x === cur }, x.replace(/_/g, " "));
            }));
          };
          S.moveTo = { outfit: f.outfit, room: f.room, mood: f.mood };
          return h(
            "div",
            { class: "movebox" },
            sel(L.outfits, f.outfit, "outfit"),
            sel(L.rooms, f.room, "room"),
            sel(L.moods, f.mood, "mood"),
            sbtn("Move here", "#0f766e", function() {
              api("POST", "/bridge/api/saved/move", Object.assign({ rel: f.rel }, S.moveTo)).then(function() {
                S.moveRel = "";
                say("Moved.", true);
                done();
              }).catch(function(e) {
                say(e.message, false);
              });
            })
          );
        }
        function importPresetsRow() {
          var inp = h("input", { type: "file", accept: ".json", style: "display:none", onchange: function(e) {
            var f = e.target.files[0];
            if (!f) return;
            f.text().then(function(t) {
              return doImportPresets(JSON.parse(t));
            }).catch(function(err) {
              say("Could not import presets: " + err.message, false);
            });
          } });
          function doImportPresets(server) {
            var local2 = {};
            try {
              for (var i2 = 0; i2 < localStorage.length; i2++) {
                var k = localStorage.key(i2);
                if (/^wayward_.*preset/.test(k)) local2[k] = localStorage.getItem(k);
              }
            } catch (e) {
            }
            return api("POST", "/bridge/api/presets/import-old", { local: local2, server: server || {} }).then(function(j) {
              S.presets = j.presets || {};
              say("Imported " + j.imported + " old preset" + (j.imported === 1 ? "" : "s") + ".", true);
              render();
            });
          }
          var found = 0;
          try {
            for (var i = 0; i < localStorage.length; i++) if (/^wayward_.*presets$/.test(localStorage.key(i))) found++;
          } catch (e) {
          }
          return h(
            "div",
            null,
            row(
              sbtn("Import old presets from this browser", "#57534e", function() {
                doImportPresets(null).catch(function(e) {
                  say(e.message, false);
                });
              }, found ? "Found " + found + " preset lists the old mod kept in this browser" : "The old mod kept presets in the browser; none were found here"),
              sbtn("Import old presets.json\u2026", "#57534e", function() {
                inp.click();
              }),
              inp
            ),
            h("div", { class: "note" }, found ? "The old mod's presets were found in this browser (" + found + " lists)." : "No old presets in this browser. Use presets.json from the old mod's server folder.")
          );
        }
        var ADDON_GROUPS = [
          ["character", "Character prompt"],
          ["clothing", "Clothing & exposure"],
          ["scenes", "Scenes (incl. looks, tasks, reactions)"],
          ["moods", "Moods (incl. scene moods)"],
          ["rooms", "Locations"],
          ["parts", "Heroine State"],
          ["patrons", "Patron portraits & named patrons"],
          ["negatives", "Game negatives"],
          ["rules", "Tag rules"],
          ["pipeline", "Pipeline & models"]
        ];
        function groupData(g) {
          var P = E(["prompts"]) || {}, D0 = S.st.defaults.prompts || {}, hid = S.viewHeroine, out = { prompts: {} };
          var diff = function(cur, def) {
            return same(cur, def) ? void 0 : clone(cur);
          };
          var diffMap = function(cur, def) {
            var o = {};
            Object.keys(cur || {}).forEach(function(k) {
              var v = diff(cur[k], (def || {})[k]);
              if (v !== void 0) o[k] = v;
            });
            return o;
          };
          if (g === "character") {
            var hc = clone(P.heroines[hid] || {});
            out.prompts.heroines = {};
            out.prompts.heroines[hid] = hc;
          }
          if (g === "clothing") {
            out.prompts.outfits = diffMap(P.outfits, D0.outfits);
            out.prompts.exposure = clone(P.exposure || {});
          }
          if (g === "scenes") ["scenes", "looks", "tasks", "reactions"].forEach(function(k) {
            out.prompts[k] = diffMap(P[k], D0[k]);
          });
          if (g === "moods") {
            out.prompts.moods = { scene: diffMap((P.moods || {}).scene, (D0.moods || {}).scene), work: diffMap((P.moods || {}).work, (D0.moods || {}).work), patron: diffMap((P.moods || {}).patron, (D0.moods || {}).patron) };
            out.prompts.expressions = diffMap(P.expressions, D0.expressions);
          }
          if (g === "rooms") out.prompts.rooms = diffMap(P.rooms, D0.rooms);
          if (g === "parts") out.prompts.parts = clone(P.parts || {});
          if (g === "patrons") {
            var pt = P.patrons || {};
            out.prompts.patrons = { quality: pt.quality, negative: pt.negative, archetypes: pt.archetypes, named: clone(pt.named || {}) };
          }
          if (g === "negatives") {
            var dn = D0.negatives || {}, en = P.negatives || {};
            out.prompts.negatives = { extras: diffMap(en.extras, dn.extras) };
            if (!same(en.base, dn.base)) out.prompts.negatives.base = en.base;
          }
          if (g === "rules") out.prompts.rulesAll = clone((P.rulesAll || []).concat(P.rules || []));
          if (g === "pipeline") {
            delete out.prompts;
            out.pipeline = withLoraLibrary(clone(E(["pipeline"]) || {}));
          }
          return out;
        }
        function itemData(item) {
          var out = {}, hid = S.viewHeroine;
          itemPaths(item, hid).forEach(function(rel) {
            var v = E(rel);
            if (v !== void 0) setAt(out, rel, clone(v));
          });
          if (out.pipeline) withLoraLibrary(out.pipeline);
          return out;
        }
        function withLoraLibrary(pipe) {
          Object.keys(pipe.families || {}).forEach(function(f) {
            ((pipe.families[f] || {}).loras || []).forEach(function(l) {
              var e = libFind(l.model);
              if (!e) return;
              if ((e.words || []).length) l.words = clone(e.words);
              if ((e.removed || []).length) l.removed = clone(e.removed);
              if ((e.groups || []).length) l.groups = clone(e.groups);
            });
          });
          return pipe;
        }
        function addonsWith(item) {
          return S.st.addons.filter(function(a) {
            return (a.items || []).indexOf(item) >= 0;
          });
        }
        function itemLabel(item) {
          if (item === "character") return heroineName(S.viewHeroine) + "'s character prompt";
          if (item === "clothing") return "clothing & exposure";
          if (item === "pipeline") return "pipeline & models";
          if (item === "patrons") return "patron portraits";
          return item.replace(/^named\./, "patron ").replace(/\./g, " / ");
        }
        function addonSelect(item, small) {
          var src = sourceOf(item, S.viewHeroine), has = addonsWith(item), dirty = !!S.ops[["picks", scopeOf(item, S.viewHeroine), item].join("")];
          var sel = h(
            "select",
            { class: "sel xs addonsel" + (src !== "mine" ? " fromaddon" : "") + (dirty ? " dirty" : ""), title: "Where this prompt comes from (add-ons)", onchange: function() {
              var v = sel.value;
              if (v.indexOf("save:") === 0) {
                sel.value = src;
                saveItemToAddon(item, v.slice(5));
                return;
              }
              setPick(item, v);
              render();
              say(v === "mine" ? "Using your own " + itemLabel(item) + "." : 'Using add-on "' + (addonByFile(v) || {}).name + '" for ' + itemLabel(item) + ". Save & Apply to keep it.", true);
            } },
            h("option", { value: "mine", selected: src === "mine" }, small ? "mine" : "My settings"),
            has.map(function(a) {
              return h("option", { value: a.file, selected: src === a.file }, (small ? "" : "Add-on: ") + a.name + (S.st.stack.indexOf(a.file) >= 0 ? " \u2713" : ""));
            }),
            h("optgroup", { label: "Save this prompt into\u2026" }, h("option", { value: "save:" }, "a new add-on\u2026"), S.st.addons.map(function(a) {
              return h("option", { value: "save:" + a.file }, a.name);
            }))
          );
          return sel;
        }
        function addonRow(item, note) {
          var src = sourceOf(item, S.viewHeroine);
          return h(
            "div",
            { class: "addonrow" },
            h("span", { class: "lab", style: "margin:0" }, "Prompt from"),
            addonSelect(item),
            src !== "mine" ? h("span", { class: "note", style: "margin:0;color:#93c5fd" }, "Editing it makes your own copy; the add-on file stays as it is.") : note ? h("span", { class: "note", style: "margin:0" }, note) : null
          );
        }
        function addonMini(item) {
          return addonSelect(item, true);
        }
        function saveItemToAddon(item, file) {
          var layer = itemData(item);
          if (!file) {
            var name = prompt("Name of the new add-on (it will hold " + itemLabel(item) + "):", itemLabel(item));
            if (!name) return;
            api("POST", "/bridge/api/addons/create", { name, layer }).then(function(j) {
              setState(j.state);
              say('Created add-on "' + name + '" with ' + itemLabel(item) + ".", true);
            }).catch(function(e) {
              say(e.message, false);
            });
          } else {
            var a = addonByFile(file);
            if (!confirm("Put the current " + itemLabel(item) + ' into add-on "' + (a ? a.name : file) + '"? (Replaces what it had for this prompt.)')) return;
            api("POST", "/bridge/api/addons/" + encodeURIComponent(file) + "/merge", { layer }).then(function(j) {
              setState(j.state);
              say("Saved " + itemLabel(item) + ' into "' + (a ? a.name : file) + '".', true);
            }).catch(function(e) {
              say(e.message, false);
            });
          }
        }
        function addonSummary(a) {
          var items = a.items || [], out = [];
          var layers = [a.layer || {}].concat(Object.keys(a.heroine || {}).map(function(k) {
            return a.heroine[k];
          }));
          var count2 = function(pfx) {
            return items.filter(function(it) {
              return it.indexOf(pfx) === 0;
            });
          };
          var keysOf = function(sec2) {
            var set = {};
            layers.forEach(function(l) {
              Object.keys(getAt(l, ["prompts", sec2]) || {}).forEach(function(k) {
                set[k] = 1;
              });
            });
            return Object.keys(set);
          };
          if (items.indexOf("character") >= 0) {
            var hs = keysOf("heroines");
            out.push(["Character", null, hs.map(function(x2) {
              return x2 === "any" ? "any heroine" : heroineName(x2);
            }).join(", ")]);
          }
          if (items.indexOf("clothing") >= 0) {
            var o = keysOf("outfits"), x = keysOf("exposure");
            out.push(["Clothing", o.length, "Outfits: " + o.join(", ")]);
            if (x.length) out.push(["Exposure", x.length, x.join(", ")]);
          }
          var sc = count2("scenes.").concat(count2("looks."), count2("tasks."), count2("reactions."));
          if (sc.length) out.push(["Scenes", sc.length, sc.join(", ")]);
          var md = count2("moods.").concat(count2("expressions."));
          if (md.length) out.push(["Moods", md.length, md.join(", ")]);
          var rm = count2("rooms.");
          if (rm.length) out.push(["Locations", rm.length, rm.join(", ")]);
          var pt = count2("parts.");
          if (pt.length) out.push(["Heroine State", pt.length, pt.join(", ")]);
          var pa = (items.indexOf("patrons") >= 0 ? ["patrons"] : []).concat(count2("named."));
          if (pa.length) out.push(["Patrons", pa.length, pa.join(", ")]);
          if (items.indexOf("negatives") >= 0) {
            var ng = layers.reduce(function(n, l) {
              var x2 = getAt(l, ["prompts", "negatives"]) || {};
              return n + Object.keys(x2.extras || {}).length + (x2.base != null ? 1 : 0);
            }, 0);
            out.push(["Game negatives", ng, ""]);
          }
          if (items.indexOf("rules") >= 0 || items.indexOf("rulesAll") >= 0) {
            var nr = layers.reduce(function(n, l) {
              return n + (getAt(l, ["prompts", "rules"]) || []).length + (getAt(l, ["prompts", "rulesAll"]) || []).length;
            }, 0);
            out.push(["Tag rules", nr, ""]);
          }
          if (items.indexOf("pipeline") >= 0) {
            var pl = (a.layer || {}).pipeline || {}, fams = Object.keys(pl.families || {});
            var loras = fams.reduce(function(n, f) {
              return n + (pl.families[f].loras || []).length;
            }, 0);
            out.push(["Pipeline", null, (pl.family ? "Pipeline: " + pl.family + ". " : "") + (fams.length ? "Models for " + fams.join(", ") + ". " : "") + (loras ? loras + " LoRA(s)." : "")]);
          }
          if (!out.length) out.push(["Empty", null, ""]);
          return out;
        }
        function addonsSec() {
          var st = S.st, active = st.stack.slice();
          var setStack = function(files) {
            if (count()) return say("Save or discard your changes first.", false);
            api("POST", "/bridge/api/addons/stack", { files }).then(function(j) {
              setState(j.state);
            }).catch(function(e) {
              say(e.message, false);
            });
          };
          var fileInp = h("input", { type: "file", accept: ".json", multiple: true, style: "display:none", onchange: function(e) {
            var files = Array.prototype.slice.call(e.target.files || []);
            if (!files.length) return;
            S.importQueue = [];
            files.reduce(function(pr, f) {
              return pr.then(function() {
                return f.text().then(function(t) {
                  var nm = f.name.replace(/\.json$/i, "");
                  return api("POST", "/bridge/api/addons/preview", { name: nm, content: t, heroine: S.viewHeroine }).then(function(pv) {
                    S.importQueue.push({ name: nm, content: t, pv });
                  });
                }).catch(function(err) {
                  S.importQueue.push({ name: f.name, error: err.message });
                });
              });
            }, Promise.resolve()).then(function() {
              render();
            });
          } });
          var nameInp = h("input", { class: "inp sm", placeholder: "New add-on name" });
          S.sel.newAddon = S.sel.newAddon || { character: true };
          var picks2 = h("div", { class: "agroups" }, ADDON_GROUPS.map(function(g) {
            return h("label", { class: "cb" }, h("input", { type: "checkbox", checked: !!S.sel.newAddon[g[0]], onchange: function(e) {
              S.sel.newAddon[g[0]] = e.target.checked;
            } }), " " + g[1]);
          }));
          var queue = (S.importQueue || []).map(function(q, qi) {
            var drop = function() {
              S.importQueue.splice(qi, 1);
              render();
            };
            if (q.error) return h("div", { class: "impbox" }, h("b", null, q.name), h("div", { class: "err" }, q.error), row(sbtn("Close", "#44403c", drop)));
            var pv = q.pv;
            return h(
              "div",
              { class: "impbox" },
              h("div", null, h("b", null, pv.name), pv.description ? h("span", { class: "note", style: "margin-left:8px" }, pv.description) : null),
              h("div", { class: "acats" }, addonSummary({ items: pv.items, layer: pv.layer || {}, heroine: pv.heroine || {} }).map(function(c) {
                return h("span", { class: "acat" }, c[0] + (c[1] != null ? " " + c[1] : ""));
              })),
              h("div", { class: "note" }, "For " + heroineName(S.viewHeroine) + " it would change " + pv.changeCount + " prompt" + (pv.changeCount === 1 ? "" : "s") + (pv.added ? " (" + pv.added + " new)" : "") + "; " + pv.same + " are the same as yours." + (pv.rules ? " " + pv.rules + " tag rule(s)." : "") + (pv.pipeline ? " Pipeline & models: " + (pv.pipeline.family || "") + (pv.pipeline.families.length ? " (models for " + pv.pipeline.families.join(", ") + ")" : "") + "." : "") + " Nothing changes until you tick it in the list."),
              pv.changes.length ? h("details", null, h("summary", null, "Show the changes"), pv.changes.map(function(c) {
                return h("div", { class: "upd" }, h("b", null, prettyPath(c.path)), c.now ? h("div", { class: "was" }, "yours: " + c.now) : h("div", { class: "was" }, "new"), h("div", { class: "was", style: "color:#a7f3d0" }, "add-on: " + c.theirs));
              }), pv.changeCount > pv.changes.length ? h("div", { class: "note" }, "\u2026and " + (pv.changeCount - pv.changes.length) + " more") : null) : null,
              row(sbtn("Import", "#1d4ed8", function() {
                api("POST", "/bridge/api/addons/import", { name: q.name, content: q.content }).then(function(j) {
                  S.importQueue.splice(qi, 1);
                  setState(j.state);
                  say('Imported "' + pv.name + '". Tick it in the list to use it.', true);
                }).catch(function(err) {
                  say(err.message, false);
                });
              }), sbtn("Skip", "#44403c", drop))
            );
          });
          return sec(
            "Add-ons",
            "#93c5fd",
            'Use several add-ons at once. Ticked add-ons supply every prompt they contain (lowest in the list wins). Each prompt also has a "Prompt from" dropdown to take it from any add-on \u2014 a different one per prompt \u2014 or from your own settings.',
            queue,
            st.addons.length ? st.addons.slice().sort(function(a, b) {
              var ia = active.indexOf(a.file), ib = active.indexOf(b.file);
              return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
            }).map(function(a) {
              var idx = active.indexOf(a.file);
              return h(
                "div",
                { class: "addon" + (idx >= 0 ? " on" : "") },
                h("label", { class: "cb", title: "Use this add-on for every prompt it contains" }, h("input", { type: "checkbox", checked: idx >= 0, disabled: a.valid === false, onchange: function(e) {
                  setStack(e.target.checked ? active.concat([a.file]) : active.filter(function(f) {
                    return f !== a.file;
                  }));
                } }), " ", h("b", null, a.name)),
                h("span", { class: "grow" }),
                idx > 0 ? h("button", { type: "button", class: "link", onclick: function() {
                  var s2 = active.slice();
                  s2.splice(idx, 1);
                  s2.splice(idx - 1, 0, a.file);
                  setStack(s2);
                } }, "\u2191") : null,
                idx >= 0 && idx < active.length - 1 ? h("button", { type: "button", class: "link", onclick: function() {
                  var s2 = active.slice();
                  s2.splice(idx, 1);
                  s2.splice(idx + 1, 0, a.file);
                  setStack(s2);
                } }, "\u2193") : null,
                h("a", { class: "link", href: "/bridge/api/addons/" + encodeURIComponent(a.file), download: a.file }, "export"),
                h("button", { type: "button", class: "link danger", onclick: function() {
                  if (confirm('Delete add-on "' + a.name + '"?')) api("DELETE", "/bridge/api/addons/" + encodeURIComponent(a.file)).then(function(j) {
                    setState(j.state);
                  });
                } }, "delete"),
                h(
                  "div",
                  { class: "acats" },
                  addonSummary(a).map(function(c) {
                    return h("span", { class: "acat", title: c[2] || "" }, c[0] + (c[1] != null ? " " + c[1] : ""));
                  }),
                  a.description ? h("span", { class: "note", style: "margin:0" }, a.description) : null
                )
              );
            }) : h("div", { class: "note" }, "No add-ons yet."),
            h(
              "div",
              { class: "subsec" },
              h("div", { class: "note" }, "Create an add-on from the prompts you see now (for " + heroineName(S.viewHeroine) + "), with only the parts you tick:"),
              picks2,
              row(nameInp, sbtn("Create add-on", "#1d4ed8", function() {
                var n = nameInp.value.trim();
                if (!n) return say("Type a name for the add-on.", false);
                var layer = {};
                ADDON_GROUPS.forEach(function(g) {
                  if (S.sel.newAddon[g[0]]) layer = merge(layer, groupData(g[0]));
                });
                if (!Object.keys(layer).length) return say("Tick at least one part.", false);
                api("POST", "/bridge/api/addons/create", { name: n, layer }).then(function(j) {
                  setState(j.state);
                  say('Add-on "' + n + '" created.', true);
                }).catch(function(e) {
                  say(e.message, false);
                });
              }), sbtn("Import add-ons\u2026", "#57534e", function() {
                fileInp.click();
              }, "New add-ons, or the old mod's add-on pack files (add-on packs\\<type>\\*.json)"), fileInp)
            )
          );
        }
        function loadRenders() {
          return api("GET", "/bridge/api/renders").then(function(j) {
            var next = j.renders || [];
            var same2 = next.map(renderId).join("|") === (S.renders || []).map(renderId).join("|");
            S.renders = next;
            if (!same2 && S.open && S.tab === "inspector" && !isTyping()) render();
          }).catch(function() {
          });
        }
        function exEditor(e, neg) {
          var rel = e.rel || null, path = rel && rel.path, parts = [];
          var label = neg ? e.label.replace(/^Negative · /, "") : e.label;
          if (rel && rel.kind === "rules") parts.push(h("div", { class: "note" }, "These come from your tag rules."), sbtn("Open tag rules", "#a16207", function() {
            S.scrollTo = "rules";
            jump("negatives");
          }));
          else if (rel && rel.kind === "part") {
            var cur = E(path) || {};
            var ta = h("textarea", {
              class: "ta" + (isDirty(path) ? " dirty" : ""),
              style: "height:46px",
              spellcheck: "false",
              "data-tags": "1",
              value: cur.mode === "replace" ? cur.text || "" : e.final || "",
              oninput: function() {
                edit(path, { mode: "replace", text: ta.value });
                ta.classList.add("dirty");
              }
            });
            parts.push(
              h("div", { class: "note" }, 'The game makes the "' + label + '" part itself. What you type here replaces it in every picture that has it.'),
              ta,
              row(sbtn("Remove this part", "#7f1d1d", function() {
                edit(path, { mode: "off", text: "" });
                render();
              }), sbtn("Back to the game's", "#57534e", function() {
                restore(path);
                render();
              }))
            );
          } else if (rel && rel.index != null) {
            var list = clone(E(path) || D(path) || []);
            var ta2 = h("textarea", {
              class: "ta" + (isDirty(path) ? " dirty" : ""),
              style: "height:46px",
              spellcheck: "false",
              "data-tags": "1",
              value: list[rel.index] || "",
              oninput: function() {
                var l = clone(E(path) || D(path) || []);
                l[rel.index] = ta2.value;
                edit(path, l);
                ta2.classList.add("dirty");
              }
            });
            parts.push(
              h("div", { class: "note" }, path.slice(1).join(" \u203A ").replace(/_/g, " ") + " \u2014 variant " + (rel.index + 1) + " of " + list.length),
              ta2,
              (D(path) || [])[rel.index] ? h("div", { class: "gamehint" }, "Game default: " + D(path)[rel.index]) : null
            );
          } else if (path) {
            parts.push(promptBox(path.slice(1).join(" \u203A ").replace(/_/g, " "), path, { height: "46px" }));
          }
          var find = h("input", { class: "inp", placeholder: "find (e.g. " + (splitT(e.final)[0] || "tag") + ")", spellcheck: "false", "data-tags": "1" });
          var rep = h("input", { class: "inp", placeholder: "replace with (empty = remove)", spellcheck: "false", "data-tags": "1" });
          parts.push(
            h("div", { class: "note", style: "margin-top:8px" }, "Or add a tag rule" + (neg ? " for the negative prompt" : rel && rel.kind !== "rules" && RULE_PARTS.indexOf(label) >= 0 ? " for the " + label + " part" : "") + ":"),
            h("div", { class: "row" }, find, rep, sbtn("Add rule", "#a16207", function() {
              if (!find.value.trim() && !rep.value.trim()) return say("Type the tags to find (and what to put instead).", false);
              addRule({ find: find.value, replace: rep.value, target: neg ? "negative" : "positive", part: !neg && RULE_PARTS.indexOf(label) >= 0 && rel ? label : "" }, true);
              say('Tag rule added (unsaved). "Preview with current settings" shows the result.', true);
              render();
            }))
          );
          parts.push(h("div", { class: "note", style: "margin-top:6px" }, "Edits are drafts until Save & Apply."));
          return h("div", { class: "exedit" }, parts);
        }
        function splitT(t) {
          return String(t || "").split(",").map(function(x) {
            return x.trim();
          }).filter(Boolean);
        }
        function explainTable(ex, compareTo) {
          var before = {};
          (compareTo || []).forEach(function(e) {
            before[e.label] = e.final;
          });
          var pre = compareTo ? "pv:" : "cur:";
          function isNeg(e) {
            return e.negative || /^Negative/.test(e.label);
          }
          function rows(list2, neg2) {
            var out = [];
            list2.filter(function(e) {
              return (e.final || (e.changes || []).length) && isNeg(e) === neg2;
            }).forEach(function(e) {
              var ch = (e.changes || []).filter(function(c) {
                return c.source;
              });
              var diff = compareTo && before[e.label] !== e.final;
              var label = neg2 ? e.label.replace(/^Negative · /, "") : e.label;
              var key = pre + e.label, open = S.exOpen === key;
              var eb = h("button", { type: "button", class: "exbtn", title: "Change these words", onclick: function() {
                S.exOpen = open ? "" : key;
                render();
              } }, open ? "Close" : "Edit");
              out.push(h(
                "tr",
                { class: (ch.length ? "chg" : "") + (diff ? " diff" : "") },
                h("td", null, label, diff ? h("div", { class: "live", style: "margin:0;color:#fbbf24" }, "changed") : null, h("div", null, eb)),
                h("td", null, e.final || h("i", null, "(empty)"), ch.length && e.game ? h("div", { class: "was" }, "game: " + e.game) : null, diff && before[e.label] != null ? h("div", { class: "was" }, "now: " + before[e.label]) : null, e.note && neg2 ? h("div", { class: "was" }, e.note) : null),
                h("td", null, ch.length ? ch.map(function(c) {
                  return h("div", null, c.source + (c.id ? " \xB7 " + c.id : ""));
                }) : h("span", { class: "was" }, e.note && !neg2 ? e.note : neg2 ? /^Game/.test(label) ? "the game" : "" : "game prompt, unchanged"))
              ));
              if (open) out.push(h("tr", { class: "exrow" }, h("td", { colspan: 3 }, exEditor(e, neg2))));
            });
            return out;
          }
          var list = ex || [];
          var neg = rows(list, true);
          return h(
            "div",
            null,
            h("table", { class: "ex" }, h("tr", null, h("th", null, "Category"), h("th", null, "Final words"), h("th", null, "Changed by")), rows(list, false)),
            neg.length ? h("div", { class: "note", style: "margin:10px 0 4px;color:#fca5a5" }, "Negative prompt \u2014 where each word comes from (a word is listed under the first place it appears). Edit changes it at its source.") : null,
            neg.length ? h("table", { class: "ex" }, h("tr", null, h("th", null, "From"), h("th", null, "Words"), h("th", null, "Changed by")), neg) : null
          );
        }
        function renderId(r) {
          return r.key + "@" + r.at;
        }
        function draftOps() {
          return Object.keys(S.ops).map(function(k) {
            var o = S.ops[k];
            return o.del ? { path: o.path, delete: true } : { path: o.path, value: o.value };
          });
        }
        function queueSection() {
          var j = S.jobs || {}, items = j.items || [];
          if (!items.length && !j.batchLeft && !j.genAll && !(j.ahead && j.ahead.ready)) return null;
          var cancel = function(body) {
            api("POST", "/bridge/api/jobs/cancel", body).then(function(r) {
              S.jobs = r;
              render();
            }).catch(function(e) {
              say(e.message, false);
            });
          };
          var x = sec(
            "Drawing queue",
            "#c4b5fd",
            "What ComfyUI is drawing now and what is waiting. Cancel any of them." + (j.typicalMs ? " A picture takes about " + Math.round(j.typicalMs / 100) / 10 + " s lately." : ""),
            items.map(function(it) {
              var pct = it.step ? Math.round(100 * it.step.value / it.step.max) : it.estimate != null ? Math.round(100 * it.estimate) : 0;
              return h(
                "div",
                { class: "qrow", "data-qid": it.id },
                h("span", { class: "qst " + it.status }, it.status === "processing" ? "drawing" : "waiting"),
                h("span", { class: "qkey", title: it.key }, it.key.replace(/__/g, " \xB7 ")),
                h("span", { class: "note", style: "margin:0" }, it.kind),
                it.status === "processing" ? h("span", { class: "qbar" }, h("span", { style: "width:" + pct + "%" })) : null,
                it.status === "processing" ? h("span", { class: "note qpct", style: "margin:0" }, it.step ? "step " + it.step.value + "/" + it.step.max : it.estimate != null ? "~" + pct + "%" : "") : null,
                sbtn("Cancel", "#7f1d1d", function() {
                  cancel({ id: it.id });
                })
              );
            }),
            j.batchLeft ? h("div", { class: "qrow" }, h("span", { class: "qst" }, "queued"), h("span", { class: "qkey" }, j.batchLeft + " pictures the game asked to draw ahead"), sbtn("Cancel all", "#7f1d1d", function() {
              cancel({ what: "batch" });
            })) : null,
            j.genAll ? h("div", { class: "qrow" }, h("span", { class: "qst" }, "queued"), h("span", { class: "qkey" }, "Generate all scenes: " + j.genAll.done + " / " + j.genAll.total), sbtn("Stop", "#7f1d1d", function() {
              cancel({ what: "genall" });
            })) : null,
            j.ahead && j.ahead.ready ? h("div", { class: "qrow" }, h("span", { class: "qst" }, "ready"), h("span", { class: "qkey" }, j.ahead.ready + " picture(s) drawn ahead, waiting for the game to ask for them"), sbtn("Throw away", "#44403c", function() {
              cancel({ what: "ahead" });
            })) : null
          );
          x.setAttribute("data-sec", "queue");
          return x;
        }
        VIEWS.inspector = function() {
          var list = S.renders;
          var qsec = queueSection();
          if (!list.length) return [qsec, sec("Prompt inspector", "#c4b5fd", "Pictures drawn this session show up here with exactly how each prompt was built.", h("div", { class: "note" }, "Nothing drawn yet."))];
          var cur = list.filter(function(r) {
            return renderId(r) === S.render;
          })[0] || list.filter(function(r) {
            return r.key === S.render;
          })[0] || list[0];
          S.render = renderId(cur);
          var pv = S.preview && S.preview.id === S.render ? S.preview : null;
          var pvSec = pv ? sec(
            "With your current settings" + (pv.drafts ? " (including " + pv.drafts + " unsaved change" + (pv.drafts > 1 ? "s" : "") + ")" : ""),
            "#a78bfa",
            pv.positive === cur.positive && pv.negative === cur.negative ? "Same prompt as this picture: your settings would not change it." : "This is the prompt the picture would get now. Changed parts are marked.",
            (pv.warnings || []).map(function(w) {
              return h("div", { class: "warnbox" }, w);
            }),
            explainTable(pv.explain, cur.explain),
            h("details", { open: true }, h("summary", null, "Full prompt"), h("pre", null, pv.positive), h("pre", { class: "neg" }, pv.negative))
          ) : null;
          if (pvSec) pvSec.setAttribute("data-sec", "preview");
          return [
            qsec,
            h("div", { class: "thumbs" }, list.map(function(r) {
              var id = renderId(r);
              return h("button", {
                type: "button",
                class: "th" + (id === S.render ? " on" : ""),
                title: r.key + "\n" + new Date(r.at).toLocaleTimeString(),
                onclick: function() {
                  if (S.cmpPick) {
                    S.cmpPick = false;
                    if (id !== S.render) {
                      S.cmp = id;
                      S.scrollTo = "compare";
                    }
                    render();
                    return;
                  }
                  S.render = id;
                  S.preview = null;
                  S.cmp = null;
                  S.scrollTo = "picture";
                  render();
                }
              }, h("img", { src: r.image, loading: "lazy", draggable: "false" }));
            })),
            S.cmpPick ? h("div", { class: "note", style: "color:#fbbf24" }, "Click the picture to compare with (above).") : null,
            (function() {
              var x = sec("Picture", "#c4b5fd", null, h(
                "div",
                { class: "irow" },
                h("img", { class: "big", src: cur.image }),
                h(
                  "div",
                  { style: "min-width:0;flex:1" },
                  h("div", { class: "keyline" }, cur.key),
                  h("div", { class: "note" }, "Seed " + cur.seed + " \xB7 " + cur.family + " \xB7 " + Math.round((cur.ms || 0) / 100) / 10 + " s \xB7 " + new Date(cur.at).toLocaleTimeString() + (cur.usingParts ? "" : " \xB7 whole-prompt mode")),
                  (cur.warnings || []).map(function(w) {
                    return h("div", { class: "warnbox" }, w);
                  }),
                  row(
                    sbtn("Use this scene", "#0f766e", function() {
                      api("POST", "/bridge/api/use-picture", { key: cur.key, image: cur.image }).then(function(j) {
                        var shown = WBPIC.useImage(j.image, cur.key);
                        say(shown ? "This picture is now in the game's picture box (and is the one kept for " + cur.key + ")." : "Kept as the picture for " + cur.key + "; the game shows it when that scene comes up.", true);
                      }).catch(function(e) {
                        say(e.message, false);
                      });
                    }, "Show this picture in the game's picture box and keep it as the picture for its scene"),
                    sbtn("Preview with current settings", "#57534e", function() {
                      say("Working out the prompt with your current settings\u2026", true);
                      api("POST", "/bridge/api/preview", { key: cur.key, ops: draftOps() }).then(function(j) {
                        S.preview = Object.assign({ id: S.render }, j);
                        S.scrollTo = "preview";
                        render();
                        say("Preview ready below.", true);
                      }).catch(function(e) {
                        say(e.message, false);
                      });
                    }, "Show the prompt this picture would get with your settings now, unsaved changes included"),
                    sbtn("Draw again", "#6d28d9", function() {
                      api("POST", "/bridge/api/redraw", { key: cur.key }).then(function() {
                        say("Drawing\u2026 it shows here when done.", true);
                      }).catch(function(e) {
                        say(e.message, false);
                      });
                    }),
                    sbtn("Regen this seed", "#57534e", function() {
                      api("POST", "/bridge/api/redraw", { key: cur.key, seed: cur.seed }).then(function() {
                        say("Drawing with seed " + cur.seed + "\u2026", true);
                      }).catch(function(e) {
                        say(e.message, false);
                      });
                    }, "Same seed: see only what your setting changes did"),
                    /^patron_/i.test(cur.key) ? sbtn("Keep this face", "#0f766e", function() {
                      var nm = cur.key.slice(7).toLowerCase();
                      edit(["prompts", "patrons", "named", nm, "seed"], cur.seed);
                      say("Face kept for " + titleCase(nm) + " (unsaved). Save & Apply, then reload the page so the game draws his portrait again.", true);
                    }, "Every portrait of this man will use this face (seed)") : null
                  ),
                  row(
                    sbtn(S.cmpPick ? "Pick a picture above\u2026" : "Compare with\u2026", "#44403c", function() {
                      S.cmpPick = !S.cmpPick;
                      render();
                    }, "Show this picture next to another one, with the prompt differences"),
                    /^patron_/i.test(cur.key) ? null : sbtn(S.mcmp ? "Close model compare" : "Compare models\u2026", "#44403c", function() {
                      S.mcmp = !S.mcmp;
                      render();
                    }, "Draw this picture again with the same seed but another model or LoRA strength, and see both side by side"),
                    (function() {
                      var prev = list.filter(function(r) {
                        return r.key === cur.key && renderId(r) !== S.render;
                      })[0];
                      return prev ? sbtn("Compare with the previous one of this scene", "#44403c", function() {
                        S.cmp = renderId(prev);
                        S.scrollTo = "compare";
                        render();
                      }, "For example before / after Same seed") : null;
                    })()
                  ),
                  h("div", { class: "note" }, "Draw again and Regen use saved settings; Preview also shows unsaved changes.")
                )
              ));
              x.setAttribute("data-sec", "picture");
              return x;
            })(),
            S.mcmp && !/^patron_/i.test(cur.key) ? modelCompareSection(cur) : null,
            compareSection(cur, list.filter(function(r) {
              return renderId(r) === S.cmp;
            })[0]),
            pvSec,
            sec("How this prompt was built", "#c4b5fd", "Each category that went into the final prompt, in order, and what changed it.", explainTable(cur.explain), h("details", null, h("summary", null, "Full prompt"), h("pre", null, cur.positive), h("pre", { class: "neg" }, cur.negative)))
          ];
        };
        function modelCompareSection(cur) {
          if (!S.models) loadModels(false);
          var fam = E(["pipeline", "family"]) || "anima", isAnima = fam === "anima";
          var kind = isAnima ? "unet" : "checkpoint";
          var files = (S.models && S.models.files && S.models.files[kind] || []).map(function(x2) {
            return { value: x2.name, label: x2.name };
          });
          var M = S.mc = S.mc || { model: "", strengths: {}, lorasOff: false };
          var loras = (E(famRel("loras")) || []).filter(function(l) {
            return l.model && l.enabled !== false;
          });
          var curModel = E(famRel(kind)) || "";
          var busyNow = !!S.mcBusy;
          var x = sec(
            "Compare models",
            "#fbbf24",
            "Draws this picture again with the same seed (" + cur.seed + ") and only the model or LoRA strength changed, then shows both side by side. Your settings stay as they are.",
            h(
              "div",
              { class: "field" },
              lab((isAnima ? "UNET" : "Checkpoint") + " to try (now: " + (String(curModel).split("/").pop() || "none") + ")"),
              picker([{ value: "", label: "(same as now)" }].concat(files), M.model, function(v) {
                M.model = v;
                render();
              }, { width: 520 })
            ),
            loras.length ? h("div", { class: "field" }, lab("LoRA strengths to try"), loras.map(function(l) {
              var inp = h("input", { class: "inp num", type: "number", step: 0.05, value: M.strengths[l.model] != null ? M.strengths[l.model] : l.strength, onchange: function() {
                M.strengths[l.model] = Number(inp.value);
              } });
              return h("div", { class: "crowf" }, h("span", { class: "note", style: "margin:0;min-width:200px" }, String(l.model).split("/").pop() + " (now " + l.strength + ")"), inp);
            }), h("label", { class: "cb" }, h("input", { type: "checkbox", checked: !!M.lorasOff, onchange: function(e) {
              M.lorasOff = e.target.checked;
            } }), " without any LoRA")) : null,
            row(
              sbtn(busyNow ? "Drawing\u2026" : "Draw with the same seed", "#b45309", function() {
                if (S.mcBusy) return;
                var strengths = {};
                Object.keys(M.strengths).forEach(function(k) {
                  var l = loras.filter(function(x2) {
                    return x2.model === k;
                  })[0];
                  if (l && Number(M.strengths[k]) !== Number(l.strength)) strengths[k] = Number(M.strengths[k]);
                });
                var over = { lorasOff: !!M.lorasOff };
                if (M.model) over[kind] = M.model;
                if (Object.keys(strengths).length) over.loraStrength = strengths;
                if (!M.model && !over.lorasOff && !over.loraStrength) return say("Pick another model or change a LoRA strength first.", false);
                S.mcBusy = true;
                render();
                say("Drawing the comparison\u2026", true);
                var before = renderId(cur);
                api("POST", "/bridge/api/redraw", { key: cur.key, seed: cur.seed, wait: true, pipeOverride: over }).then(function() {
                  return api("GET", "/bridge/api/renders");
                }).then(function(j) {
                  S.renders = j.renders || [];
                  var made = S.renders.filter(function(r) {
                    return r.key === cur.key && renderId(r) !== before;
                  })[0];
                  S.render = before;
                  if (made) {
                    S.cmp = renderId(made);
                    S.scrollTo = "compare";
                  }
                  say("Comparison ready below (left: your settings, right: the one you tried).", true);
                }).catch(function(e) {
                  say("Comparison failed: " + e.message, false);
                }).then(function() {
                  S.mcBusy = false;
                  if (S.open) render();
                });
              }, "Draws one more picture with the same seed; it shows up next to this one"),
              sbtn("Close", "#44403c", function() {
                S.mcmp = false;
                render();
              })
            )
          );
          x.setAttribute("data-sec", "mcompare");
          return x;
        }
        function tkey(t) {
          var x = String(t).trim().toLowerCase();
          for (var i = 0; i < 3; i++) {
            var m = x.match(/^\((.*?)(?::\s*-?[0-9.]+)?\)$/) || x.match(/^\[(.*)\]$/);
            if (!m) break;
            x = m[1].trim();
          }
          return x.replace(/_/g, " ").replace(/\s+/g, " ");
        }
        function tagDiff(a, b) {
          var A = splitT(a), B = splitT(b), ka = {}, kb = {};
          A.forEach(function(t) {
            ka[tkey(t)] = 1;
          });
          B.forEach(function(t) {
            kb[tkey(t)] = 1;
          });
          return { onlyA: A.filter(function(t) {
            return !kb[tkey(t)];
          }), onlyB: B.filter(function(t) {
            return !ka[tkey(t)];
          }), same: A.filter(function(t) {
            return kb[tkey(t)];
          }).length };
        }
        function diffBlock(title, a, b) {
          var d = tagDiff(a, b);
          var chips = function(arr, cls) {
            return arr.length ? arr.map(function(t) {
              return h("span", { class: "dchip " + cls }, t);
            }) : h("span", { class: "note" }, "none");
          };
          return h(
            "div",
            { class: "field" },
            lab(title + " \u2014 " + d.same + " tags the same"),
            h("div", { class: "note", style: "margin:2px 0" }, "Only in the left picture:"),
            h("div", null, chips(d.onlyA, "da")),
            h("div", { class: "note", style: "margin:6px 0 2px" }, "Only in the right picture:"),
            h("div", null, chips(d.onlyB, "db"))
          );
        }
        function compareSection(a, b) {
          if (!a || !b) return null;
          var cap = function(r) {
            var mc = (r.warnings || []).filter(function(w) {
              return /^Compare models/.test(w);
            })[0];
            return h("div", { class: "note" }, r.key, h("br"), "Seed " + r.seed + " \xB7 " + new Date(r.at).toLocaleTimeString() + " \xB7 " + r.family, mc ? h("div", { style: "color:#fbbf24" }, mc.replace(/ \(this picture only.*$/, "")) : null);
          };
          var x = sec(
            "Compare",
            "#fbbf24",
            a.seed === b.seed ? "Same seed: any difference in the pictures comes from the prompt or setting changes below." : "Different seeds: the pictures differ partly by chance.",
            h("div", { class: "cmp" }, h("div", null, h("img", { src: a.image }), cap(a)), h("div", null, h("img", { src: b.image }), cap(b))),
            diffBlock("Prompt", a.positive, b.positive),
            diffBlock("Negative prompt", a.negative, b.negative),
            row(sbtn("Close compare", "#44403c", function() {
              S.cmp = null;
              render();
            }), sbtn("Swap", "#44403c", function() {
              var t = S.render;
              S.render = S.cmp;
              S.cmp = t;
              render();
            }))
          );
          x.setAttribute("data-sec", "compare");
          return x;
        }
        var WBPIC = (function() {
          var BAR_CSS = "position:absolute;top:38px;right:8px;z-index:8;display:flex;flex-wrap:wrap;gap:4px;max-width:calc(100% - 16px);justify-content:flex-end;pointer-events:auto;font:11px/1.3 system-ui,sans-serif;";
          var PILL_CSS = "position:absolute;bottom:8px;right:8px;z-index:8;display:flex;align-items:stretch;background:rgba(0,0,0,.5);border-radius:4px;overflow:hidden;font:12px/1 system-ui,sans-serif;transition:opacity .2s;";
          var PILLBTN_CSS = "background:none;border:0;color:rgba(255,255,255,.7);padding:4px 8px;cursor:pointer;font:12px/1 system-ui,sans-serif;white-space:nowrap;";
          var TOAST_CSS = "position:absolute;bottom:40px;right:8px;z-index:9;display:none;max-width:80%;background:rgba(0,0,0,.75);border:1px solid #44403c;border-radius:6px;padding:3px 8px;font:11px/1.3 system-ui,sans-serif;pointer-events:none;";
          var BTN_CSS = "background:rgba(0,0,0,.7);color:#fff;border:1px solid #44403c;border-radius:6px;padding:3px 7px;cursor:pointer;font:11px/1.3 system-ui,sans-serif;white-space:nowrap;";
          var busy = false;
          function fiberKey(el) {
            for (var hops = 0; el && hops < 6; hops++, el = el.parentElement) {
              var k = Object.keys(el).filter(function(x) {
                return x.indexOf("__reactFiber") === 0;
              })[0];
              var f = k && el[k], n = 0;
              while (f && n++ < 80) {
                var pr = f.memoizedProps || f.pendingProps || {};
                if (typeof pr.imageKey === "string" && pr.imageKey) return pr.imageKey;
                f = f.return;
              }
            }
            return "";
          }
          function imgOf(host2) {
            return host2 && host2.querySelector("img");
          }
          function fileOf(img) {
            var src = img && img.getAttribute("src") || "", i = src.indexOf("/images/wb/");
            if (i < 0) return "";
            try {
              return decodeURIComponent(src.slice(i + 11).split("?")[0]);
            } catch (e) {
              return src.slice(i + 11).split("?")[0];
            }
          }
          function srcOf(host2) {
            var img = imgOf(host2);
            return img && img.getAttribute("src") || "";
          }
          function keyOf(host2) {
            return fiberKey(imgOf(host2) || host2) || fiberKey(host2) || S.st && S.st.lastKey || "";
          }
          function btn2(label, title, fn) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = label;
            b.title = title;
            b.style.cssText = BTN_CSS;
            b.setAttribute("data-wb", "1");
            b.addEventListener("click", function(ev) {
              ev.preventDefault();
              ev.stopPropagation();
              if (!busy) fn(b);
            });
            return b;
          }
          function badge(bar) {
            return bar._toast || bar.querySelector("[data-wb-seed]");
          }
          function note(bar, text, color, ms) {
            var b = badge(bar);
            if (!b) return;
            clearTimeout(b._fade);
            clearTimeout(b._fade2);
            b.textContent = text;
            b.style.color = color || "#fbbf24";
            b.style.transition = "opacity .2s";
            b.style.opacity = "1";
            b.style.display = "block";
            if (/…$/.test(text) && !ms) return;
            b._fade = setTimeout(function() {
              b.style.transition = "opacity .6s";
              b.style.opacity = "0";
              b._fade2 = setTimeout(function() {
                b.style.display = "none";
              }, 650);
            }, ms || 4e3);
          }
          function flash(host2, bar, text, color, ms) {
            note(bar, text, color, ms || 1e4);
          }
          function cycleSaved(host2, bar, dir) {
            var key = keyOf(host2);
            if (!key) return note(bar, "no picture key", "#f87171");
            if (bar._savedBusy) return;
            bar._savedBusy = true;
            api("GET", "/bridge/api/saved/list?key=" + encodeURIComponent(key)).then(function(j) {
              var files = j.files || [];
              if (!files.length) return flash(host2, bar, "no saved pictures for this scene", "#a8a29e", 4e3);
              var img = imgOf(host2), cur = "";
              try {
                cur = img ? decodeURIComponent(img.getAttribute("src") || "") : "";
              } catch (e) {
                cur = img.getAttribute("src") || "";
              }
              var at = -1;
              files.forEach(function(f2, i) {
                if (cur.indexOf("/images/saved/" + f2.rel) >= 0) at = i;
              });
              if (at < 0 && bar._savedAt != null && bar._savedKey === key) at = Math.min(bar._savedAt, files.length - 1);
              var next = at < 0 ? dir < 0 ? files.length - 1 : 0 : (at + (dir < 0 ? -1 : 1) + files.length) % files.length;
              var f = files[next];
              bar._savedAt = next;
              bar._savedKey = key;
              showImage(host2, f.url, 30 * 60 * 1e3);
              bar._src = f.url;
              var lab2 = bar._pill && bar._pill.querySelector("[data-wb-savedlab]");
              if (lab2) lab2.textContent = "Saved " + (next + 1) + "/" + files.length + (f.fav ? " \u2605" : "");
              note(bar, "saved " + (next + 1) + " of " + files.length + (f.exact ? "" : " \xB7 other outfit/room/mood"), "#4ade80", 2500);
              paintBar(host2, bar);
            }).catch(function(e) {
              note(bar, "saved pictures: failed", "#f87171");
              bar.title = e.message;
            }).then(function() {
              bar._savedBusy = false;
            });
          }
          function setBusy(on) {
            busy = on;
            document.querySelectorAll("[data-wb-bar] button, [data-wb-saved] button").forEach(function(b) {
              b.style.opacity = on ? ".45" : "";
              b.style.pointerEvents = on ? "none" : "";
            });
            document.querySelectorAll("[data-wb-bar]").forEach(function(bar) {
              var host2 = bar.parentElement;
              if (host2) paintBar(host2, bar);
            });
          }
          function info(host2, bar) {
            var img = imgOf(host2), key = keyOf(host2), file = fileOf(img);
            if (!key && !file) return Promise.resolve({});
            return api("GET", "/bridge/api/picture?key=" + encodeURIComponent(key) + "&file=" + encodeURIComponent(file)).then(function(j) {
              bar._info = j;
              var sp = bar.querySelector("[data-wb-prompt]");
              if (sp) sp.title = "How this picture's prompt was built (Wayward Bridge)" + (j.seed != null ? "\nSeed " + j.seed + (j.kept ? " \xB7 saved" : "") : "");
              return j;
            }).catch(function() {
              return {};
            });
          }
          function showImage(host2, url, keepMs) {
            var img = imgOf(host2);
            if (!img) {
              img = document.createElement("img");
              img.alt = "The picture from this moment";
              img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain";
              host2.insertBefore(img, host2.firstChild);
              host2.querySelectorAll("div").forEach(function(d) {
                if (!d.childElementCount && /no picture for this moment|Loading…/.test(d.textContent)) d.remove();
              });
            }
            var cur = img.getAttribute("src") || "";
            var k = img._wbKeep;
            var undo = k && Date.now() < k.until ? k.undo : {};
            if (cur && cur !== url) undo[cur] = 1;
            delete undo[url];
            img._wbKeep = { url, undo, until: Date.now() + (keepMs || 15e3) };
            if (!img._wbObs) {
              img._wbObs = new MutationObserver(function() {
                var kk = img._wbKeep, src = img.getAttribute("src") || "";
                if (!kk || Date.now() > kk.until) {
                  img._wbKeep = null;
                  return;
                }
                if (src === kk.url) return;
                if (kk.undo[src]) {
                  img.setAttribute("src", kk.url);
                  return;
                }
                img._wbKeep = null;
              });
              img._wbObs.observe(img, { attributes: true, attributeFilter: ["src"] });
            }
            if (cur !== url) img.setAttribute("src", url);
          }
          function drawDirect(host2, bar, seed) {
            var key = keyOf(host2);
            if (!key) {
              note(bar, "no picture key", "#f87171");
              return;
            }
            setBusy(true);
            note(bar, seed ? "drawing (same seed)\u2026" : "drawing\u2026");
            api("POST", "/bridge/api/redraw", { key, seed: seed || void 0, wait: true }).then(function(j) {
              showImage(host2, j.image);
              note(bar, "seed " + j.seed, "#fbbf24");
            }).catch(function(e) {
              note(bar, "failed", "#f87171");
              bar.title = e.message;
            }).then(function() {
              setBusy(false);
            });
          }
          (function() {
            var st = document.createElement("style");
            st.textContent = "html.wb-quiet-regen div.fixed.inset-0.bg-black\\/70{opacity:0!important;pointer-events:none!important}[data-wb-pic]>div.absolute.top-2.right-2,[data-wb-pic]>div.absolute.bottom-2.left-2{transition:opacity .2s}[data-wb-hide]>div.absolute.top-2.right-2,[data-wb-hide]>div.absolute.bottom-2.left-2{opacity:0!important;pointer-events:none!important}";
            (document.head || document.documentElement).appendChild(st);
          })();
          function regenViaGame(host2, bar, label) {
            var regen = host2.querySelector("button[data-wb-regen]");
            if (!regen || regen.disabled) return false;
            document.documentElement.classList.add("wb-quiet-regen");
            regen._wbProgrammatic = true;
            regen.click();
            var tries = 0, t = setInterval(function() {
              var just = regenDialogButton("Just regenerate");
              if (just) {
                clearInterval(t);
                just.click();
                note(bar, label || "drawing\u2026");
                setTimeout(function() {
                  document.documentElement.classList.remove("wb-quiet-regen");
                }, 50);
              } else if (++tries > 40) {
                clearInterval(t);
                document.documentElement.classList.remove("wb-quiet-regen");
              }
            }, 40);
            return true;
          }
          function drawViaGame(host2, bar, seed) {
            var key = keyOf(host2);
            var go = function() {
              if (!regenViaGame(host2, bar, seed ? "drawing (same seed)\u2026" : "drawing\u2026")) drawDirect(host2, bar, seed);
            };
            if (!seed) return go();
            api("POST", "/bridge/api/next-seed", { key, seed }).then(function(j) {
              if (!j.ok) return note(bar, "no seed yet", "#f87171");
              go();
            });
          }
          function addBar(host2, opts) {
            var bar = document.createElement("div");
            bar.setAttribute("data-wb-bar", "1");
            bar.style.cssText = BAR_CSS + (opts.css || "") + "transition:opacity .2s;";
            bar.appendChild(btn2("Generate new", "Draw this picture again with a new seed (the old one stays in the history). Always draws a new picture, even with Use Saved Images/GIFs on.", function() {
              (opts.direct ? drawDirect : drawViaGame)(host2, bar, null);
            }));
            bar.appendChild(btn2("Same seed", "Draw it again with the same seed: only your setting changes show. Always draws a new picture, even with Use Saved Images/GIFs on.", function() {
              (opts.direct ? drawDirect : drawViaGame)(host2, bar, "same");
            }));
            var sp = btn2("Show prompt", "How this picture's prompt was built (Wayward Bridge)", function() {
              S.render = keyOf(host2);
              toggle(true);
              jump("inspector");
            });
            sp.setAttribute("data-wb-prompt", "1");
            bar.appendChild(sp);
            bar.appendChild(btn2("Edit", "Open this picture's prompts in Wayward Bridge", function() {
              refresh().then(function() {
                toggle(true);
                jump("scenes", "scene", liveIds().scene);
              });
            }));
            host2.appendChild(bar);
            var pill = document.createElement("div");
            pill.setAttribute("data-wb-saved", "1");
            pill.style.cssText = PILL_CSS + (opts.direct ? "bottom:12px;right:56px;" : "");
            var arrow = function(txt, title, dir) {
              var b = document.createElement("button");
              b.type = "button";
              b.textContent = txt;
              b.title = title;
              b.style.cssText = PILLBTN_CSS;
              b.addEventListener("click", function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                cycleSaved(host2, bar, dir);
              });
              return b;
            };
            var lab2 = document.createElement("button");
            lab2.type = "button";
            lab2.setAttribute("data-wb-savedlab", "1");
            lab2.textContent = "Saved";
            lab2.title = "Show the saved images/GIFs of this scene one after another (same outfit, room and mood first; after the last it starts again at the first). Works whether or not Use Saved Images/GIFs is on.";
            lab2.style.cssText = PILLBTN_CSS + "color:rgba(255,255,255,.85);padding:4px 8px;";
            lab2.addEventListener("click", function(ev) {
              ev.preventDefault();
              ev.stopPropagation();
              cycleSaved(host2, bar, 1);
            });
            pill.appendChild(arrow("\u2039", "Previous saved image/GIF (from the first it goes to the last)", -1));
            pill.appendChild(lab2);
            pill.appendChild(arrow("\u203A", "Next saved image/GIF (after the last it goes back to the first)", 1));
            host2.appendChild(pill);
            bar._pill = pill;
            var toast = document.createElement("div");
            toast.setAttribute("data-wb-seed", "1");
            toast.style.cssText = TOAST_CSS + (opts.direct ? "bottom:48px;right:56px;" : "");
            host2.appendChild(toast);
            bar._toast = toast;
            bar._hover = !!opts.direct;
            bar._direct = !!opts.direct;
            host2.addEventListener("pointerenter", function(e) {
              if (e.pointerType !== "touch") {
                bar._hover = true;
                paintBar(host2, bar);
              }
            });
            host2.addEventListener("pointerleave", function(e) {
              if (e.pointerType !== "touch") {
                bar._hover = false;
                paintBar(host2, bar);
              }
            });
            host2.addEventListener("pointerdown", function(e) {
              if (e.pointerType === "touch") {
                bar._hover = true;
                paintBar(host2, bar);
                clearTimeout(bar._touchT);
                bar._touchT = setTimeout(function() {
                  bar._hover = false;
                  paintBar(host2, bar);
                }, 6e3);
              }
            }, true);
            paintBar(host2, bar);
            info(host2, bar);
            return bar;
          }
          function paintBar(host2, bar) {
            var src = srcOf(host2), onSaved = /\/images\/saved\//.test(src);
            var showBar = bar._hover || busy;
            if (!bar._direct) {
              host2.setAttribute("data-wb-pic", "1");
              if (showBar) host2.removeAttribute("data-wb-hide");
              else host2.setAttribute("data-wb-hide", "1");
            }
            bar.style.opacity = showBar ? "1" : "0";
            bar.style.pointerEvents = showBar ? "auto" : "none";
            var pill = bar._pill;
            if (pill) {
              var showPill = bar._hover || onSaved;
              pill.style.opacity = showPill ? "1" : "0";
              pill.style.pointerEvents = showPill ? "auto" : "none";
              if (!onSaved) {
                var l = pill.querySelector("[data-wb-savedlab]");
                if (l && l.textContent !== "Saved") l.textContent = "Saved";
              }
            }
          }
          function renameGameButtons(host2, bar) {
            var up = host2.querySelector("button[title='Mark this image as good']");
            if (up && !up.dataset.wb) {
              up.dataset.wb = "1";
              up.title = "save current scene";
              up.setAttribute("aria-label", "save current scene");
              up.addEventListener("click", function() {
                var key = keyOf(host2), file = fileOf(imgOf(host2));
                api("POST", "/bridge/api/saved/save", { key, file, src: srcOf(host2), keep: true }).then(function(j) {
                  flash(host2, bar, (j.already ? "already saved \xB7 " : "saved \xB7 ") + j.folder, "#4ade80", 1e4);
                }).catch(function(e) {
                  note(bar, "not saved", "#f87171");
                  bar.title = e.message;
                });
              }, true);
            }
            var down = host2.querySelector("button[title^='Mark as bad and regenerate']");
            if (down && !down.dataset.wb) {
              down.dataset.wb = "1";
              down.setAttribute("data-wb-regen", "1");
              down.title = "delete current scene";
              down.setAttribute("aria-label", "delete current scene");
              down.addEventListener("click", function(ev) {
                if (down._wbProgrammatic) {
                  down._wbProgrammatic = false;
                  return;
                }
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                var key = keyOf(host2), file = fileOf(imgOf(host2));
                var isSaved = /\/images\/saved\//.test(srcOf(host2));
                if (!confirm(isSaved ? "Delete this SAVED picture from saved-scenes and draw a new one?" : "Delete the current scene picture and draw a new one?")) return;
                api("POST", "/bridge/api/picture/delete", { key, file, src: srcOf(host2) }).catch(function() {
                }).then(function() {
                  note(bar, "deleted \xB7 drawing\u2026", "#f87171");
                  if (!regenViaGame(host2, bar, "deleted \xB7 drawing\u2026")) drawDirect(host2, bar, null);
                });
              }, true);
            }
            var plus = host2.querySelector("button[title^='Add another variant of this state']");
            if (plus && !plus.dataset.wb) {
              plus.dataset.wb = "1";
              plus.title = "cycle scene variants";
              plus.setAttribute("aria-label", "cycle scene variants");
              plus.addEventListener("click", function(ev) {
                if (cycleVariant(host2, bar, plus)) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  ev.stopImmediatePropagation();
                }
              }, true);
            }
            var vid = host2.querySelector("button[title='Turn this image into a video'], button[title='Video already exists for this image']");
            if (vid && !vid.dataset.wb) {
              vid.dataset.wb = "1";
              vid.title = "Turn this image into a GIF";
              vid.setAttribute("aria-label", "Turn this image into a GIF");
              vid.addEventListener("click", function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                if (busy) return;
                var key = keyOf(host2), file = fileOf(imgOf(host2));
                setBusy(true);
                note(bar, "making GIF\u2026");
                api("POST", "/bridge/api/gif", { key, file, src: srcOf(host2) }).then(function(j) {
                  showImage(host2, j.image);
                  note(bar, "GIF ready", "#4ade80");
                }).catch(function(e) {
                  note(bar, "GIF failed", "#f87171");
                  bar.title = e.message;
                  say("GIF failed: " + e.message, false);
                }).then(function() {
                  setBusy(false);
                });
              }, true);
            }
          }
          function variantHook(el) {
            var k = el && Object.keys(el).filter(function(x) {
              return x.indexOf("__reactFiber") === 0;
            })[0];
            for (var f = k && el[k], n = 0; f && n < 80; f = f.return, n++) {
              for (var hk = f.memoizedState, m = 0; hk && typeof hk === "object" && m < 60; hk = hk.next, m++) {
                var v = hk.memoizedState;
                if (v && Array.isArray(v.variants) && typeof v.currentIdx === "number" && hk.queue && typeof hk.queue.dispatch === "function") return { state: v, dispatch: hk.queue.dispatch };
              }
            }
            return null;
          }
          function sceneOfKey(key) {
            var segs = String(key).split("__"), out = null;
            segs.forEach(function(sg) {
              var i = sg.indexOf("-");
              if (i < 0) return;
              var a = sg.slice(0, i), b = sg.slice(i + 1);
              if (a === "scene") out = ["scenes", b];
              else if (a === "look" && !out) out = ["looks", b];
            });
            return out;
          }
          function cycleVariant(host2, bar, plus) {
            var hk = variantHook(plus);
            if (!hk) return false;
            var st = hk.state, cur = st.variants[st.currentIdx] || keyOf(host2);
            var base = String(cur).replace(/__v-\d+$/, ""), v = Number((String(cur).match(/__v-(\d+)$/) || [])[1] || 0);
            var sc = sceneOfKey(cur), list = sc && S.st ? E(["prompts", sc[0], sc[1]]) : null;
            var n = Array.isArray(list) ? list.length : 0;
            if (n < 2) {
              note(bar, sc ? "this scene has one variant" : "no scene variants here", "#a8a29e");
              return true;
            }
            var next = (v + 1) % n, key2 = base + "__v-" + next;
            var variants = st.variants.indexOf(key2) >= 0 ? st.variants.slice() : st.variants.concat([key2]);
            var ns = { variants, currentIdx: variants.indexOf(key2) };
            try {
              var all = JSON.parse(localStorage.getItem("elena-image-variants-v1") || "{}") || {};
              all[base] = ns;
              localStorage.setItem("elena-image-variants-v1", JSON.stringify(all));
              if (key2 !== variants[0]) {
                var cyc = JSON.parse(localStorage.getItem("wb:cycled") || "{}") || {};
                cyc[key2] = 1;
                localStorage.setItem("wb:cycled", JSON.stringify(cyc));
              }
            } catch (e) {
            }
            hk.dispatch(ns);
            note(bar, "scene variant " + (next + 1) + " of " + n, "#5eead4");
            return true;
          }
          var UPE = { Quality: "#a8a29e", Base: "#fcd34d", Task: "#93c5fd", Event: "#fca5a5", Mood: "#86efac", Phase: "#d8b4fe", Archetype: "#fcd34d", Outfit: "#6ee7b7", Scene: "#5eead4", Room: "#fde68a", Exposure: "#fda4af", "Quality tags": "#a8a29e" };
          function patchDetails(host2) {
            var panels = host2.querySelectorAll("div.absolute.inset-0");
            Array.prototype.forEach.call(panels, function(pn) {
              if (pn.dataset.wb || !/bg-black\/85/.test(pn.className)) return;
              var copy = Array.prototype.filter.call(pn.querySelectorAll("button"), function(b) {
                return b.textContent === "Copy prompt";
              })[0];
              if (!copy) return;
              pn.dataset.wb = "1";
              var keySpan = pn.querySelector("span.font-mono");
              var file = fileOf(imgOf(host2)), key = keySpan && keySpan.textContent || keyOf(host2);
              var blocks = Array.prototype.filter.call(pn.children, function(c) {
                return c !== copy && c.tagName === "DIV";
              });
              var plusBlock = blocks[1], minusBlock = blocks[2];
              if (plusBlock) plusBlock.style.opacity = ".4";
              api("GET", "/bridge/api/explain?key=" + encodeURIComponent(key) + "&file=" + encodeURIComponent(file)).then(function(j) {
                if (keySpan) keySpan.textContent = j.key + (j.seed != null ? "  \xB7  seed " + j.seed : "");
                if (plusBlock) {
                  plusBlock.style.opacity = "";
                  plusBlock.innerHTML = "";
                  var head = document.createElement("div");
                  head.innerHTML = '<span style="color:#78716c;font-weight:700">+</span> <span style="color:#78716c">final prompt' + (j.drawn ? "" : " (with your current settings)") + " \u2014 Settings UI Mod</span>";
                  plusBlock.appendChild(head);
                  (j.explain || []).forEach(function(e) {
                    if (!e.final || e.negative || /^Negative/.test(e.label)) return;
                    var d = document.createElement("div");
                    d.style.cssText = "margin-left:12px;margin-top:2px";
                    var lb = document.createElement("span");
                    lb.style.cssText = "font-weight:700;color:" + (UPE[e.label] || "#a8a29e");
                    lb.textContent = e.label + ":";
                    var tx = document.createElement("span");
                    tx.style.color = "#d6d3d1";
                    tx.textContent = " " + e.final;
                    d.appendChild(lb);
                    d.appendChild(tx);
                    if ((e.changes || []).some(function(c) {
                      return c.source;
                    })) {
                      var ch = document.createElement("span");
                      ch.style.cssText = "color:#86efac;margin-left:6px";
                      ch.textContent = "(changed by " + e.changes.map(function(c) {
                        return c.source;
                      }).filter(Boolean).join(", ") + ")";
                      d.appendChild(ch);
                    }
                    plusBlock.appendChild(d);
                  });
                }
                if (minusBlock) {
                  var t = minusBlock.querySelectorAll("span")[1];
                  if (t) t.textContent = j.negative || "";
                  (j.explain || []).forEach(function(e) {
                    if (!e.final || !(e.negative || /^Negative/.test(e.label))) return;
                    var d = document.createElement("div");
                    d.style.cssText = "margin-left:12px;margin-top:2px;font-size:.92em";
                    var lb = document.createElement("span");
                    lb.style.cssText = "font-weight:700;color:#fca5a5";
                    lb.textContent = e.label.replace(/^Negative · /, "") + ":";
                    var tx = document.createElement("span");
                    tx.style.color = "#a8a29e";
                    tx.textContent = " " + e.final;
                    d.appendChild(lb);
                    d.appendChild(tx);
                    minusBlock.appendChild(d);
                  });
                }
                copy.addEventListener("click", function(ev) {
                  ev.stopPropagation();
                  ev.stopImmediatePropagation();
                  try {
                    navigator.clipboard.writeText(j.positive || "");
                  } catch (e2) {
                  }
                  copy.textContent = "Copied";
                  setTimeout(function() {
                    copy.textContent = "Copy prompt";
                  }, 1200);
                }, true);
              }).catch(function() {
                if (plusBlock) plusBlock.style.opacity = "";
              });
            });
          }
          function regenDialog() {
            var hs = document.querySelectorAll("h3");
            for (var i = 0; i < hs.length; i++) if (hs[i].textContent === "What's wrong with this image?") return hs[i].parentElement;
            return null;
          }
          function regenDialogButton(label) {
            var d = regenDialog();
            if (!d) return null;
            return Array.prototype.filter.call(d.querySelectorAll("button"), function(b) {
              return b.textContent === label;
            })[0] || null;
          }
          function scan() {
            document.querySelectorAll("button[title='View image fullscreen']").forEach(function(full) {
              var host2 = full.parentElement && full.parentElement.parentElement || full.parentElement;
              if (!host2) return;
              var bar = host2.querySelector("[data-wb-bar]") || addBar(host2, {});
              renameGameButtons(host2, bar);
              patchDetails(host2);
              var img = imgOf(host2), src = img ? img.getAttribute("src") : "";
              if (bar._src !== src) {
                bar._src = src;
                info(host2, bar);
                paintBar(host2, bar);
              }
            });
            document.querySelectorAll("div.fixed.inset-0").forEach(function(ov) {
              if (!/bg-black\/90/.test(ov.className) || ov.querySelector("[data-wb-bar]")) return;
              var pic = ov.querySelector("img[alt='The picture from this moment']");
              var missing = Array.prototype.some.call(ov.querySelectorAll("div"), function(d) {
                return !d.childElementCount && d.textContent === "There is no picture for this moment.";
              });
              if (!pic && !missing && !ov.querySelector("img")) return;
              var bar = addBar(ov, { direct: true, css: "top:10px;right:56px;" });
              bar.addEventListener("click", function(e) {
                e.stopPropagation();
              });
              if (missing) note(bar, "no picture yet \u2014 Generate new draws it", "#a8a29e");
            });
          }
          setInterval(function() {
            try {
              scan();
            } catch (e) {
            }
          }, 700);
          setInterval(function() {
            try {
              document.querySelectorAll("button[title='View image fullscreen']").forEach(function(full) {
                var host2 = full.parentElement && full.parentElement.parentElement || full.parentElement;
                if (!host2) return;
                patchDetails(host2);
                var open = Array.prototype.some.call(host2.querySelectorAll("div.absolute.inset-0"), function(d) {
                  return /bg-black\/85/.test(d.className);
                });
                var bar = host2.querySelector("[data-wb-bar]");
                if (bar) {
                  [bar, bar._pill, bar._toast].forEach(function(el) {
                    if (el) el.style.visibility = open ? "hidden" : "";
                  });
                }
              });
            } catch (e) {
            }
          }, 150);
          function useImage(url) {
            var full = document.querySelector("button[title='View image fullscreen']");
            var host2 = full && (full.parentElement && full.parentElement.parentElement || full.parentElement);
            if (!host2) return false;
            showImage(host2, url, 6e4);
            var bar = host2.querySelector("[data-wb-bar]");
            if (bar) {
              bar._src = null;
              note(bar, "picture from the Prompt inspector", "#5eead4");
            }
            return true;
          }
          function redrawCurrent(key) {
            var full = document.querySelector("button[title='View image fullscreen']");
            var host2 = full && (full.parentElement && full.parentElement.parentElement || full.parentElement);
            if (!host2 || /^patron_/.test(keyOf(host2))) return false;
            var bar = host2.querySelector("[data-wb-bar]") || addBar(host2, {});
            drawViaGame(host2, bar, null);
            return true;
          }
          window.addEventListener("keydown", function(e) {
            if (!e.altKey || e.ctrlKey || e.metaKey || S.open || !(S.st && S.st.app && S.st.app.shortcuts !== false)) return;
            var a = document.activeElement;
            if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return;
            var full = document.querySelector("button[title='View image fullscreen']");
            var host2 = full && (full.parentElement && full.parentElement.parentElement || full.parentElement);
            if (!host2) return;
            var bar = host2.querySelector("[data-wb-bar]");
            if (!bar) return;
            var c = e.code, done = true;
            if (c === "KeyG") drawViaGame(host2, bar, null);
            else if (c === "KeyS") drawViaGame(host2, bar, "same");
            else if (c === "ArrowLeft" || c === "KeyA") cycleSaved(host2, bar, -1);
            else if (c === "ArrowRight" || c === "KeyD") cycleSaved(host2, bar, 1);
            else if (c === "KeyK") {
              var up = host2.querySelector("button[aria-label='save current scene']");
              if (up) up.click();
              else done = false;
            } else if (c === "Delete" || c === "KeyX") {
              var dn = host2.querySelector("button[aria-label='delete current scene']");
              if (dn) dn.click();
              else done = false;
            } else if (c === "KeyP") {
              S.render = keyOf(host2);
              toggle(true);
              jump("inspector");
            } else if (c === "KeyE") {
              refresh().then(function() {
                toggle(true);
                jump("scenes", "scene", liveIds().scene);
              });
            } else done = false;
            if (done) {
              e.preventDefault();
              e.stopPropagation();
              bar._hover = true;
              paintBar(host2, bar);
              clearTimeout(bar._keyT);
              bar._keyT = setTimeout(function() {
                bar._hover = host2.matches(":hover");
                paintBar(host2, bar);
              }, 2500);
            }
          }, true);
          var jobsTimer = null;
          function pollJobs() {
            api("GET", "/bridge/api/jobs").then(function(j) {
              S.jobs = j;
              var active = (j.items || []).length > 0;
              document.querySelectorAll("[data-wb-bar]").forEach(function(bar) {
                var host2 = bar.parentElement;
                if (!host2) return;
                var key = keyOf(host2), it = (j.items || []).filter(function(x) {
                  return x.key === key || key && x.key.toLowerCase() === key.toLowerCase();
                })[0];
                var pb = bar._prog;
                if (!pb) {
                  pb = document.createElement("div");
                  pb.setAttribute("data-wb-prog", "1");
                  pb.style.cssText = "position:absolute;left:0;bottom:0;height:3px;width:0;background:#a78bfa;z-index:9;transition:width .6s;pointer-events:none";
                  host2.appendChild(pb);
                  bar._prog = pb;
                }
                if (!it) {
                  pb.style.width = "0";
                  pb.style.display = "none";
                  if (bar._progShown) {
                    bar._progShown = false;
                  }
                  return;
                }
                var pct = it.step ? it.step.value / it.step.max : it.estimate != null ? it.estimate : it.status === "processing" ? 0.05 : 0;
                pb.style.display = "block";
                pb.style.width = Math.round(pct * 100) + "%";
                var txt = it.status === "pending" ? "waiting to be drawn" + (it.position ? " (#" + (it.position + 1) + " in line)" : "") + "\u2026" : it.step ? "drawing\u2026 step " + it.step.value + " / " + it.step.max : "drawing\u2026 about " + Math.round(pct * 100) + "%";
                note(bar, txt, "#c4b5fd");
                bar._progShown = true;
              });
              if (S.open && S.tab === "inspector" && !isTyping()) {
                var sig = (j.items || []).map(function(x) {
                  return x.id + x.status;
                }).join("|") + "/" + (j.batchLeft || 0) + "/" + (j.genAll ? j.genAll.done : "") + "/" + (j.ahead ? j.ahead.ready : "");
                if (sig !== S.jobsSig) {
                  S.jobsSig = sig;
                  render();
                } else (j.items || []).forEach(function(x) {
                  var row2 = overlay.querySelector('[data-qid="' + x.id + '"]');
                  if (!row2) return;
                  var pct = x.step ? Math.round(100 * x.step.value / x.step.max) : x.estimate != null ? Math.round(100 * x.estimate) : 0;
                  var b = row2.querySelector(".qbar span");
                  if (b) b.style.width = pct + "%";
                  var t = row2.querySelector(".qpct");
                  if (t) t.textContent = x.step ? "step " + x.step.value + "/" + x.step.max : x.estimate != null ? "~" + pct + "%" : "";
                });
              }
              paintQueueChip();
              clearTimeout(jobsTimer);
              jobsTimer = setTimeout(pollJobs, active ? 1e3 : 4e3);
            }).catch(function() {
              clearTimeout(jobsTimer);
              jobsTimer = setTimeout(pollJobs, 5e3);
            });
          }
          setTimeout(pollJobs, 1500);
          window.addEventListener("wb:generate", function() {
            clearTimeout(jobsTimer);
            jobsTimer = setTimeout(pollJobs, 300);
          });
          return { useImage, redrawCurrent, pollJobs, refreshAll: function() {
            document.querySelectorAll("[data-wb-bar]").forEach(function(bar) {
              bar._src = null;
            });
          } };
        })();
        try {
          var es = new EventSource("/bridge/api/events");
          es.onopen = function() {
            bridgePing();
          };
          es.onerror = function() {
            if (es.readyState === 2) return;
            setTimeout(function() {
              bridgePing();
            }, 1500);
          };
          es.onmessage = function(ev) {
            var m;
            try {
              m = JSON.parse(ev.data);
            } catch (e) {
              return;
            }
            if (m.type === "settings" && S.st && m.revision > S.st.revision && !count()) refresh();
            if (m.type === "render") {
              if (S.open && S.tab === "inspector") loadRenders();
            }
          };
        } catch (e) {
        }
        window.addEventListener("wb:generate", function() {
          setTimeout(function() {
            if (!S.open) api("GET", "/bridge/api/state").then(function(st) {
              S.st = st;
              effCache = {};
              if (!count()) setViewHeroine(st.activeHeroine || st.live && st.live.heroine || S.viewHeroine);
              paintButton();
            }).catch(function() {
            });
          }, 400);
        });
        refresh();
        function CSS() {
          return [
            ":host{all:initial}",
            '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
            ".fab{position:fixed;right:16px;bottom:16px;z-index:2;background:#1c1917;color:#c4b5fd;border:1px solid #6d28d9;border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:0 4px 14px rgba(0,0,0,.5);touch-action:none;user-select:none}",
            ".fab:hover{background:#292524}.dot{width:8px;height:8px;border-radius:50%;background:#78716c}.dot.on{background:#34d399}.dot.off{background:#f87171}",
            ".overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.65);z-index:3;font:13px system-ui}",
            ".box{background:#1c1917;color:#f5f5f4;border:1px solid #44403c;border-radius:10px;width:96vw;max-width:780px;height:auto;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;container:wbbox / inline-size}",
            ".box.loading{height:auto;width:auto;padding:30px 40px}",
            ".header{display:flex;align-items:center;gap:14px;padding:10px 16px;background:#292524;border-bottom:1px solid #44403c;flex-wrap:wrap}",
            ".hctx{display:flex;align-items:center;gap:8px;color:#a8a29e;font-size:12px;flex:1;flex-wrap:wrap}",
            ".closer{background:none;border:none;color:#a8a29e;font-size:18px;cursor:pointer}.closer:hover{color:#fff}",
            ".tabbar{display:flex;flex-wrap:wrap;background:#1c1917;border-bottom:1px solid #44403c;padding:0 8px;flex-shrink:0}",
            ".tab{flex:1 1 auto;white-space:nowrap;cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;color:#a8a29e;padding:10px 8px;font:600 12.5px/1.2 system-ui}",
            ".tab.on{font-weight:700}.tab:hover{color:#e7e5e4}",
            ".livebar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 14px;background:#042f2e;border-bottom:1px solid #134e4a;font-size:12px;color:#a7f3d0;flex-shrink:0}",
            ".lchip{background:#0b3b38;border:1px solid #115e59;color:#e7e5e4;border-radius:999px;padding:2px 9px;font-size:12px;cursor:pointer}.lchip:hover{border-color:#5eead4}.lchip.ghost{background:transparent;color:#5eead4}",
            ".lk{color:#5eead4;margin-right:5px;font-size:11px}",
            ".body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px}",
            ".footer{display:flex;align-items:center;gap:6px 10px;padding:10px 16px;background:#292524;border-top:1px solid #44403c;flex-wrap:wrap;flex-shrink:0}",
            ".testok{display:flex;gap:12px;align-items:flex-start}.testok img{width:128px;height:128px;object-fit:cover;border-radius:6px;border:1px solid #44403c}",
            ".cmp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}.cmp img{width:100%;max-height:340px;object-fit:contain;background:#0c0a09;border-radius:6px;border:1px solid #44403c}.dchip{display:inline-block;border-radius:4px;padding:1px 6px;margin:2px 3px 0 0;font-size:11px}.dchip.da{background:#450a0a;color:#fecaca}.dchip.db{background:#052e16;color:#bbf7d0}",
            ".learn{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #292524;font-size:12px;flex-wrap:wrap}",
            ".browsesec{border-color:#a16207!important;background:linear-gradient(180deg,#1f1a0a,#1c1917 120px)!important}.sbgroup{margin-top:8px}.sbgrid{display:flex;flex-wrap:wrap;gap:6px}.sbitem{width:112px;background:#0c0a09;border:1px solid #44403c;border-radius:6px;overflow:hidden}.sbitem.fav{border-color:#fbbf24}.sbitem img{width:112px;height:112px;object-fit:cover;display:block;cursor:zoom-in}.sbbar{display:flex;justify-content:space-between;padding:2px}.sbb{background:none;border:0;color:#d6d3d1;cursor:pointer;font-size:12px;padding:2px 5px}.sbb.on{color:#fbbf24}.sbb:hover{color:#fff}.movebox{display:flex;flex-direction:column;gap:3px;padding:4px}.movebox .sel{font-size:11px;padding:2px}",
            ".srchwrap{position:relative}.srch{width:170px;padding:4px 8px;font-size:12px}.srchpop{display:none;position:absolute;right:0;top:100%;margin-top:4px;width:min(440px,90vw);max-height:360px;overflow:auto;background:#1c1917;border:1px solid #57534e;border-radius:6px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.6)}.srchit{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #292524;color:#e7e5e4;padding:5px 8px;cursor:pointer}.srchit:hover,.srchit.cur{background:#292524}.srchp{font-size:11px;color:#c4b5fd}.srcht{font-size:12px;color:#a8a29e;overflow-wrap:anywhere}.srcht mark{background:#854d0e;color:#fff;border-radius:2px}",
            ".impbox{border:1px solid #1d4ed8;background:#0b1530;border-radius:6px;padding:8px;margin-bottom:8px}",
            ".recbox{background:#052e16;border:1px solid #15803d;color:#bbf7d0;border-radius:6px;padding:8px 10px;margin:4px 0 8px;font-size:12px;line-height:1.5}.recbox b{color:#4ade80}",
            ".faces{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0}.face{display:flex;flex-direction:column;align-items:center;gap:4px}.face img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #44403c}.face.on img{border-color:#4ade80}",
            ".qrow{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #292524;font-size:12px}.qst{font-size:11px;border-radius:4px;padding:1px 6px;background:#292524;color:#a8a29e}.qst.processing{background:#4c1d95;color:#ede9fe}.qkey{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e7e5e4}.qbar{width:80px;height:5px;background:#292524;border-radius:3px;overflow:hidden}.qbar span{display:block;height:100%;background:#a78bfa}.qchip{color:#c4b5fd!important;border-color:#6d28d9!important}",
            ".updbar{display:block;width:100%;text-align:left;background:#422006;color:#fde68a;border:0;border-bottom:1px solid #92400e;padding:6px 16px;font-size:12px;cursor:pointer}.updbar:hover{background:#52280a}.upd{padding:5px 0;border-bottom:1px solid #292524;font-size:12px}",
            ".undoredo{display:inline-flex;gap:10px;white-space:nowrap;flex-wrap:nowrap}.fstat{display:flex;align-items:center;gap:10px;flex:1 1 120px;min-width:0;flex-wrap:wrap}.factions{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;white-space:nowrap;margin-left:auto}.factions .cb.small{white-space:nowrap}.rds{display:none}",
            "@container wbbox (max-width:600px){.rdl{display:none}.rds{display:inline}.factions{gap:6px}.factions .apply{padding:8px 12px}}",
            "@container wbbox (max-width:440px){.apl{display:none}.footer{padding:10px 10px}}",
            ".status{font-size:12px;color:#4ade80;flex:3 1 150px;min-width:0;max-height:32px;overflow:hidden;line-height:16px}.fcount{font-size:12px}.grow{flex:1}",
            ".apply{background:#7c3aed;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px}.apply:hover{background:#6d28d9}",
            ".sec{margin-bottom:14px;padding:12px;background:#0c0a09;border:1px solid #44403c;border-radius:8px}",
            ".sec .sec{background:#1c1917;margin-top:6px}",
            ".stitle{font-size:12px;font-weight:700;margin-bottom:8px}",
            ".subsec{margin-top:10px;padding-top:8px;border-top:1px solid #292524}",
            ".note{font-size:11px;color:#78716c;margin:0 0 6px;line-height:1.45}.shapeinfo{white-space:pre-line}",
            ".rules{width:100%;border-collapse:collapse;font-size:12px}.rules td{padding:3px 4px;vertical-align:top}.rules th{text-align:left;color:#a8a29e;font-weight:600;font-size:11px;padding:3px 4px}.rules .inp{width:100%}.rules tr.off .inp{opacity:.45}.rules .pickwrap{min-width:120px}",
            "table.ex{table-layout:fixed}.ex th:first-child{width:24%}.ex th:last-child{width:26%}.ex tr.exrow td{padding-top:0;color:#d6d3d1;width:auto;white-space:normal}.exedit .ta,.exedit .inp{width:100%;min-width:0;box-sizing:border-box}.exedit .row{flex-wrap:wrap}.exedit .row .inp{flex:1 1 200px}.exedit{max-width:100%;box-sizing:border-box;overflow-wrap:anywhere;background:#0c0a09;border:1px solid #44403c;border-radius:6px;padding:8px;margin-top:6px;white-space:normal}.exbtn{background:none;border:1px solid #57534e;color:#d6d3d1;border-radius:4px;font-size:11px;padding:1px 7px;cursor:pointer;margin-top:4px;display:inline-block}.exbtn:hover{border-color:#a78bfa;color:#fff}",
            ".gamehint{font-size:11px;color:#57534e;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
            ".callout{font-size:12px;color:#fb7185;background:#292524;border:1px solid #fb7185;border-radius:6px;padding:8px 10px;margin-bottom:8px;line-height:1.45}",
            ".field{margin-bottom:8px}.fh{display:flex;align-items:center;gap:6px;margin-bottom:3px}",
            ".lab{display:block;color:#a8a29e;font-size:11px;margin-bottom:3px}.fh .lab{margin:0}",
            ".badge{font-size:9.5px;padding:0 6px;border-radius:999px;border:1px solid;line-height:15px}",
            ".b-game{color:#78716c;border-color:#44403c}.b-you{color:#86efac;border-color:#166534}.b-addon{color:#93c5fd;border-color:#1e3a8a}.b-hero{color:#fcd34d;border-color:#92400e}",
            ".ta,.inp,.sel{background:#1c1917;color:#e7e5e4;border:1px solid #44403c;border-radius:6px;padding:7px 8px;font:12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;width:100%}",
            "textarea.ta{resize:vertical;height:80px;line-height:1.4;display:block}",
            ".sel{width:auto;font:12px system-ui;border-radius:4px;padding:5px 6px}.sel.big{width:100%;border-color:#f472b6;padding:8px;font-size:13px;margin-bottom:8px}.sel.xs{padding:3px 4px;font-size:11px}.sel.hero{border-color:#f59e0b;color:#fcd34d}",
            ".inp.sm{width:150px;font-family:system-ui}.inp.xs{padding:3px 5px;font-size:11px;width:auto}.inp.num{width:80px;font-family:system-ui}.inp.base{width:92px;text-align:center;color:#a8a29e;background:#292524}.inp.str{width:64px}",
            ".ta:focus,.inp:focus,.sel:focus{outline:none;border-color:#7c3aed}",
            ".dirty{border-color:#d97706 !important;box-shadow:0 0 0 1px rgba(217,119,6,.35)}",
            ".sbtn{color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px}.sbtn:hover{filter:brightness(1.2)}",
            ".sbtn.ghost{background:transparent;border:1px solid #38bdf8;padding:2px 8px;font-size:11px;color:#38bdf8}",
            ".row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}",
            ".prow{display:flex;gap:6px;align-items:center}.prow .pickwrap{margin:0}",
            ".cb{display:inline-flex;align-items:center;gap:5px;color:#e7e5e4;font-size:12px;cursor:pointer}.cb.small{font-size:11px;color:#a8a29e}",
            ".link{background:none;border:none;color:#a78bfa;cursor:pointer;font-size:11px;padding:0 3px;text-decoration:none}.link:hover{text-decoration:underline}.link.danger{color:#fca5a5}",
            ".err{color:#fca5a5;font-size:12px;margin:6px 0}",
            ".pickwrap{position:relative;margin-bottom:6px;min-width:0}",
            ".pick{width:100%;display:flex;align-items:center;gap:6px;text-align:left;background:#1c1917;color:#e7e5e4;border:1px solid #44403c;border-radius:4px;padding:7px 8px;font-size:12px;cursor:pointer}",
            ".pick:hover{border-color:#78716c}.pv{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.caret{color:#78716c}",
            ".live{color:#34d399;font-size:10px;margin-left:6px;white-space:nowrap}",
            ".panel-pop{position:fixed;z-index:50;background:#0c0a09;border:1px solid #44403c;border-radius:6px;padding:8px;box-shadow:0 12px 32px rgba(0,0,0,.55);display:flex;flex-direction:column;font:13px system-ui}",
            ".plist{overflow:auto}.pg summary{cursor:pointer;color:#fb923c;font-size:12px;font-weight:700;padding:4px 2px}.pf summary{cursor:pointer;color:#d6d3d1;font-size:11.5px;padding:3px 2px 3px 14px}",
            ".pitem{display:block;width:100%;text-align:left;background:transparent;color:#e7e5e4;border:0;padding:4px 6px;cursor:pointer;font-size:12px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pg summary,.pf summary{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pitem:hover,.pitem.cur{background:#292524}.pitem.on{color:#fb923c}",
            ".presets{margin:4px 0 8px}",
            ".chip{display:inline-flex;align-items:center;gap:6px;color:#f5f3ff;background:#5b21b6;border:1px solid #a78bfa;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700;cursor:pointer;margin:0 5px 5px 0}",
            ".chip.gen{color:#ffedd5;background:#9a3412;border-color:#fb923c}.chip.grp{border-radius:8px}.chip.auto{border-style:dashed}.chip.off{opacity:.42}",
            ".ged{color:#fbbf24;font-weight:700}.gx{color:#f87171;font-weight:700}",
            ".tgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;margin-top:6px}.tlab{color:#c4b5fd;font-size:11px;margin:6px 0 4px}",
            ".crow{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-bottom:4px}.clab{width:72px;color:#a8a29e;font-size:11px}",
            ".pill{border:1px solid #44403c;background:#1c1917;color:#e7e5e4;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;margin:0 2px 2px 0}.pill.on{background:#fb7185;color:#1c1917;border-color:#fb7185}.pill.sm{padding:1px 7px;font:11px ui-monospace,monospace}",
            ".code{font:12px ui-monospace,monospace;color:#e7e5e4;margin:6px 0}",
            ".keyline{font:12px ui-monospace,monospace;color:#a7f3d0;background:#042f2e;border:1px solid #134e4a;border-radius:6px;padding:8px;margin-bottom:8px;word-break:break-all}",
            ".meta{display:grid;grid-template-columns:110px 1fr;gap:3px 8px;font-size:12px;margin-bottom:8px}.mk{color:#5eead4;font-size:11px}",
            ".variant{margin-bottom:8px}.vh{display:flex;gap:8px;align-items:center;margin-bottom:2px}.vh .lab{margin:0}",
            ".mgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px}.moodrow{padding:4px 6px;border-radius:6px}.moodrow.activ{background:#042f2e}.moodrow.focus{outline:1px solid #2dd4bf}.mname{display:flex;align-items:center;font-size:12px;color:#e7e5e4;font-weight:600;margin-bottom:2px}.moodrow .field{margin:0}",
            ".pgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}.pcell{border:1px solid #292524;border-radius:6px;padding:6px 8px;min-width:0}.pcell.set{border-color:#92400e}",
            ".phead{display:flex;align-items:center;justify-content:space-between;gap:6px}.plab{color:#fbbf24;font-size:12px;font-weight:700}",
            ".plive{font-size:11px;color:#78716c;margin:3px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pcell textarea{margin-top:4px}",
            ".cstat{font-size:11px;font-weight:700}",
            ".crowf{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}",
            ".g5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:8px}",
            ".g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 12px;align-items:start}",
            ".mini{min-width:0}.minilab{color:#a8a29e;font-size:10px;margin-bottom:2px}.mini .inp.num{width:100%;padding:4px 6px;font-size:11px}.crowf .mini .inp.num{width:80px}",
            ".dim{opacity:.5}",
            ".addon{flex-wrap:wrap}.acats{flex-basis:100%;display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:2px}.acat{font-size:10.5px;color:#bfdbfe;background:#172554;border:1px solid #1e3a8a;border-radius:999px;padding:0 7px;line-height:17px}",
            ".activebox{background:#042f2e;border:1px solid #134e4a;border-radius:6px;padding:6px 8px;margin:0 0 8px;font-size:12px;color:#a7f3d0}.activebox b{color:#5eead4}.activetxt{font:11px ui-monospace,monospace;color:#d1fae5;margin-top:3px}",
            ".ta.activeta{border-color:#10b981}",
            ".addonrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 8px;padding:4px 8px;border:1px dashed #1e3a8a;border-radius:6px;background:#0b1220}",
            ".addonsel{max-width:240px;color:#bfdbfe}.addonsel.fromaddon{border-color:#3b82f6;background:#172554;color:#fff}.phead .addonsel{max-width:96px;margin-left:auto}",
            ".sel.multi{width:100%;height:88px;font:11px ui-monospace,monospace}",
            ".agroups{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin:4px 0 6px}",
            ".sec.flash{border-color:#2dd4bf;box-shadow:0 0 0 2px rgba(45,212,191,.35)}",
            ".lslot{border:1px solid #292524;border-radius:6px;padding:6px;margin-bottom:6px}.lrow{display:flex;gap:6px;align-items:center;min-width:0}.lrow .pickwrap{margin:0}.lrow2{display:flex;gap:8px;align-items:center;margin-top:5px;flex-wrap:wrap}",
            ".colh{color:#fb923c;font-size:10px;text-align:center;line-height:1.1}.rem{color:#fca5a5;cursor:pointer;margin-right:6px}",
            ".addon{display:flex;align-items:center;gap:8px;border:1px solid #292524;border-radius:6px;padding:6px 8px;margin-bottom:5px}.addon.on{border-color:#1e3a8a;background:#0f172a}",
            "table.diag td{padding:3px 12px 3px 0;vertical-align:top;font-size:12px;color:#e7e5e4}table.diag td:first-child{color:#a8a29e;white-space:nowrap}",
            ".thumbs{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px}.th{border:2px solid transparent;background:none;padding:0;border-radius:6px;cursor:pointer;flex-shrink:0}.th.on{border-color:#7c3aed}.th img{width:60px;height:60px;object-fit:cover;border-radius:4px;display:block}",
            ".irow{display:flex;gap:14px;align-items:flex-start}.big{width:200px;border-radius:8px;flex-shrink:0}",
            ".warnbox{color:#fbbf24;font-size:12px;background:#292114;border:1px solid #78350f;border-radius:6px;padding:6px 8px;margin:6px 0}",
            "table.ex{width:100%;border-collapse:collapse;font-size:12px;color:#d6d3d1}.ex th{text-align:left;color:#a8a29e;font-weight:600;border-bottom:1px solid #292524;padding:5px}.ex td{border-bottom:1px solid #1c1917;padding:5px;vertical-align:top}.ex td:first-child{color:#c4b5fd;width:24%;min-width:110px}.ex td:last-child{color:#86efac;width:26%;overflow-wrap:anywhere}.ex tr.chg td:nth-child(2){color:#fff}.was{color:#78716c;margin-top:2px}",
            "pre{white-space:pre-wrap;background:#1c1917;border:1px solid #292524;border-radius:6px;padding:8px;font-size:11.5px;color:#d6d3d1}pre.neg{color:#fca5a5}details summary{cursor:pointer;color:#a8a29e;font-size:12px;margin:6px 0}",
            ".layer2{position:fixed;inset:0;pointer-events:none;z-index:10}.layer2>*{pointer-events:auto}",
            ".sug{position:fixed;display:none;z-index:60;background:#1c1917;border:1px solid #fbbf24;border-radius:6px;padding:4px;min-width:200px;max-width:300px;box-shadow:0 8px 24px rgba(0,0,0,.5);font:12px/1.4 ui-monospace,monospace}",
            ".sal{color:#78716c}.si{padding:3px 8px;cursor:pointer;border-radius:4px;color:#e7e5e4;display:flex;gap:8px}.si.on{background:#44403c;color:#fff}.sn{color:#78716c;width:10px}.shelp{color:#57534e;font:10px system-ui;padding:3px 8px 1px;border-top:1px solid #292524;margin-top:3px}",
            ".shade{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}",
            ".popup{background:#1c1917;color:#e7e5e4;border:1px solid #44403c;border-radius:8px;padding:14px;width:min(460px,92vw);display:flex;flex-direction:column;gap:4px;box-shadow:0 12px 40px rgba(0,0,0,.45)}.ptitle{font-size:14px;font-weight:700;margin-bottom:4px;color:#fbbf24}",
            // ---- tab themes: each tab has its own colour; sections, buttons, focus and the save button follow it
            ":host{--ac:#e06aa8;--acd:#a8235a;--acr:224,106,168;--tint:#1a1117}",
            ":host([data-tab=heroines]){--ac:#e06aa8;--acd:#a8235a;--acr:224,106,168;--tint:#1a1117}",
            ":host([data-tab=scenes]){--ac:#26b8a6;--acd:#0d665e;--acr:38,184,166;--tint:#0e1716}",
            ":host([data-tab=locations]){--ac:#dba52a;--acd:#9a4708;--acr:219,165,42;--tint:#19150c}",
            ":host([data-tab=negatives]){--ac:#94c53a;--acd:#477010;--acr:148,197,58;--tint:#131710}",
            ":host([data-tab=pipeline]){--ac:#7079e0;--acd:#3c35b0;--acr:112,121,224;--tint:#10111c}",
            ":host([data-tab=config]){--ac:#33a6d9;--acd:#075985;--acr:51,166,217;--tint:#0c141a}",
            ":host([data-tab=inspector]){--ac:#e0647a;--acd:#a3112f;--acr:224,100,122;--tint:#1a1013}",
            ".t-heroines{--tc:#e06aa8}.t-scenes{--tc:#26b8a6}.t-locations{--tc:#dba52a}.t-negatives{--tc:#94c53a}.t-pipeline{--tc:#7079e0}.t-config{--tc:#33a6d9}.t-inspector{--tc:#e0647a}",
            ".box{border-color:rgba(var(--acr),.3);border-top:3px solid var(--acd);background:#1c1917;box-shadow:0 20px 60px rgba(0,0,0,.6)}",
            ".header{display:block;padding:10px 16px 8px;background:linear-gradient(180deg,rgba(var(--acr),.08),rgba(var(--acr),.02));border-bottom:1px solid rgba(var(--acr),.22)}",
            ".hrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.brand{color:var(--ac);font-size:14px;letter-spacing:.01em;white-space:nowrap}",
            ".hrow .closer{margin-left:auto}@container wbbox (max-width:520px){.hrow .srchwrap{order:5;flex-basis:100%}.hrow .srch{width:100%}.hctx{flex:0 1 auto}}",
            ".hctx{flex:1;gap:8px;flex-wrap:nowrap}.hlab{color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:.06em}",
            ".hnote{font-size:11px;color:#78716c;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:help}",
            ".tabbar{gap:1px;padding:6px 6px;background:#161412;border-bottom:1px solid rgba(var(--acr),.22)}",
            ".tab{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid transparent;border-radius:7px;padding:6px 4px;font-size:12px;color:#a8a29e;transition:background .12s,color .12s}",
            ".tab:hover{background:#292524;color:#f5f5f4}.tdot{width:6px;height:6px;border-radius:50%;background:var(--tc);opacity:.75;flex-shrink:0}",
            ".tab.on{color:var(--tc);background:rgba(var(--acr),.11);border-color:rgba(var(--acr),.38)}.tab.on .tdot{opacity:1;box-shadow:0 0 0 3px rgba(var(--acr),.25)}",
            ".livebar{background:rgba(var(--acr),.07);border-bottom:1px solid rgba(var(--acr),.18);color:#d6d3d1}.lk{color:var(--ac)}",
            ".lchip{background:#1c1917;border-color:rgba(var(--acr),.35)}.lchip:hover{border-color:var(--ac)}.lchip.ghost{color:var(--ac);background:transparent}",
            ".body{background:linear-gradient(180deg,var(--tint),#1c1917 240px);padding:16px}",
            ".sec{background:#0f0d0c;border:1px solid #2e2a27;border-left:3px solid var(--ac);border-radius:8px;padding:12px 14px;margin-bottom:12px}",
            ".stitle{color:var(--ac);font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #292524}",
            ".sec .sec{background:#171412;border:1px solid #2e2a27;border-left:2px solid rgba(var(--acr),.55);margin-top:8px;padding:10px 12px}",
            ".sec .sec .stitle{font-size:11px;border-bottom:0;padding-bottom:0;margin-bottom:6px}",
            ".sec.flash{border-color:var(--ac);box-shadow:0 0 0 2px rgba(var(--acr),.35)}",
            ".lab{color:#a8a29e}",
            ".sbtn{border:1px solid transparent;border-radius:5px;padding:5px 10px;font-weight:600;color:#fff}",
            ".sbtn.neutral{background:#3a3532;border-color:#4a4440;color:#e7e5e4}.sbtn.neutral:hover{background:#4a4440;filter:none}",
            ".sbtn.danger{background:#7f1d1d;border-color:#991b1b}.sbtn.prim{background:var(--acd);border-color:rgba(var(--acr),.6)}",
            ".sbtn.ghost{border-color:rgba(var(--acr),.7);color:var(--ac)}",
            ".apply{background:var(--acd);box-shadow:0 0 0 1px rgba(var(--acr),.5)}.apply:hover{background:var(--acd);filter:brightness(1.15)}",
            ".ta:focus,.inp:focus,.sel:focus,.pick:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 2px rgba(var(--acr),.18)}",
            ".sel.big{border-color:rgba(var(--acr),.7)}.link{color:var(--ac)}.pitem.on{color:var(--ac)}.pg summary{color:var(--ac)}",
            ".th.on{border-color:var(--ac)}.qbar span{background:var(--ac)}",
            ".footer{background:#1a1715;border-top:1px solid rgba(var(--acr),.22)}",
            ".browsesec{border-color:#2e2a27!important;border-left-color:var(--ac)!important;background:#0f0d0c!important}",
            ".addonrow{border-color:rgba(var(--acr),.35);background:rgba(var(--acr),.05)}",
            ".cnt{float:right;font-size:11px;opacity:.55;font-variant-numeric:tabular-nums}",
            ".cnt.over{color:#ff8080;opacity:1;font-weight:600}",
            "#wb-compat{position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a1414;border-bottom:1px solid #ff6b6b;color:#ffb4b4;font:12px/1.45 system-ui,sans-serif;padding:6px 12px;text-align:center;cursor:pointer}",
            "@media (max-width:720px){.g2,.tgrid,.mgrid,.pgrid{grid-template-columns:1fr}.g5{grid-template-columns:repeat(3,1fr)}.irow{flex-direction:column}.big{width:100%}}"
          ].join("\n");
        }
      },
      TAGS_GZ_B64: globalThis.__WB_TAGS_GZ_B64,
      ALIASES_GZ_B64: globalThis.__WB_ALIASES_GZ_B64
    };
  }
});

