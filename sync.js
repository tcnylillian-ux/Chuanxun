/*
 * 传讯 · 同步层（Firebase 版）
 * 原网站把所有数据存在 localforage（IndexedDB）和 localStorage。
 * 这里在原代码启动前把云端（你自己的 Firebase Firestore）的数据写回本地，
 * 启动后把每次本地改动上传。其他设备有更新时，回到页面会自动刷新。
 * 不修改原网站的任何代码。在网址后面加 #sync 可以打开同步设置。
 */
(function () {
  'use strict';
  var SCRIPTS = window.__CX_SCRIPTS || [];
  var LF_CONFIG = { driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE], name: 'ChatApp_V3', version: 1.0, storeName: 'chat_data', description: 'Storage for Chat App V3' };
  var SLICE = 150000, INLINE_MAX = 60000, DEBOUNCE = 1200;

  localforage.config(LF_CONFIG);

  var LS = window.localStorage;
  var lsGet = Storage.prototype.getItem, lsSet = Storage.prototype.setItem, lsRemove = Storage.prototype.removeItem, lsClear = Storage.prototype.clear, lsKey = Storage.prototype.key;
  function lsg(k) { try { return lsGet.call(LS, k); } catch (e) { return null; } }
  function lss(k, v) { try { lsSet.call(LS, k, v); } catch (e) { console.warn('[cx] ls write', k, e); } }
  // localforage copies the driver's methods onto itself once ready, so capture and wrap only after ready()
  var lfSet, lfGet, lfRemove, lfClear, lfKeys;

  /* ---------- small helpers ---------- */
  function hash(str) {
    var h1 = 0x811c9dc5 | 0, h2 = 0x9747b28c | 0;
    for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822519); }
    return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') + str.length.toString(36));
  }
  function keyId(st, k) { return st + '-' + hash(st + ':' + k).slice(0, 16); }
  function skip(k) { return typeof k !== 'string' || k.indexOf('__cx_') === 0; }
  var DEV = lsg('__cx_dev'); if (!DEV) { DEV = Math.random().toString(36).slice(2, 10); lss('__cx_dev', DEV); }
  var META = {}; try { META = JSON.parse(lsg('__cx_meta') || '{}') || {}; } catch (e) { META = {}; }
  var metaTimer = null;
  function saveMeta() { clearTimeout(metaTimer); metaTimer = setTimeout(function () { lss('__cx_meta', JSON.stringify(META)); }, 300); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function blobToDataUrl(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); }); }
  function dataUrlToBlob(u) {
    var m = /^data:([^,;]+)?((?:;[^,;]+)*?)(;base64)?,([\s\S]*)$/.exec(u); if (!m) return null;
    var mime = m[1] || 'application/octet-stream';
    if (!m[3]) return new Blob([decodeURIComponent(m[4])], { type: mime });
    var bin = atob(m[4].replace(/\s/g, '')); var a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime });
  }

  /* ---------- UI: loading veil + status pill ---------- */
  var veil = document.createElement('div');
  veil.id = 'cx-veil';
  veil.innerHTML = '<div class="cx-v-in"><div class="cx-v-t">传讯</div><div class="cx-v-s" id="cx-v-s">正在同步…</div></div>';
  var vs = document.createElement('style');
  vs.textContent = '#cx-veil{position:fixed;inset:0;z-index:2147483600;background:#0b0b0c;color:#f2f2f2;display:flex;align-items:center;justify-content:center;font-family:"Noto Serif SC",serif}' +
    '.cx-v-in{text-align:center}.cx-v-t{font-size:26px;letter-spacing:.5em;margin-left:.5em}.cx-v-s{margin-top:14px;font-size:12px;opacity:.6;letter-spacing:.1em;font-variant-numeric:tabular-nums}' +
    '#cx-pill{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:2147483500;background:rgba(20,20,22,.9);color:#fff;font:12px/1 -apple-system,"PingFang SC",sans-serif;padding:9px 14px;border-radius:99px;border:none;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:calc(100% - 32px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}' +
    '#cx-pill[hidden]{display:none}';
  document.head.appendChild(vs);
  document.body.appendChild(veil);
  function veilText(t) { var e = document.getElementById('cx-v-s'); if (e) e.textContent = t; }
  var pill = document.createElement('button'); pill.id = 'cx-pill'; pill.type = 'button'; pill.hidden = true;
  document.body.appendChild(pill);
  var pillTimer = null, pillAction = null;
  function showPill(text, ms, action) {
    pill.textContent = text; pill.hidden = false; pillAction = action || null; clearTimeout(pillTimer);
    if (ms) pillTimer = setTimeout(function () { pill.hidden = true; }, ms);
  }
  pill.onclick = function () { if (pillAction) pillAction(); else pill.hidden = true; };

  /* ---------- encoding ---------- */
  var db = null, P = null;
  async function enc(v) {
    if (v === null || v === undefined) return v;
    if (typeof v !== 'object') return v;
    if (v instanceof Date) return { __cxD: v.getTime() };
    if (v instanceof Blob) return { __cxBlob: await blobToDataUrl(v), t: v.type };
    if (v instanceof ArrayBuffer) return { __cxAB: await blobToDataUrl(new Blob([v])) };
    if (Array.isArray(v)) { var a = new Array(v.length); for (var i = 0; i < v.length; i++) a[i] = await enc(v[i]); return a; }
    var o = {}; for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = await enc(v[k]); return o;
  }
  async function dec(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) { var a = new Array(v.length); for (var i = 0; i < v.length; i++) a[i] = await dec(v[i]); return a; }
    if (typeof v.__cxD === 'number') return new Date(v.__cxD);
    if (typeof v.__cxBlob === 'string') return dataUrlToBlob(v.__cxBlob);
    if (typeof v.__cxAB === 'string') return await dataUrlToBlob(v.__cxAB).arrayBuffer();
    var o = {}; for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = await dec(v[k]); return o;
  }
  async function serialize(st, raw) {
    if (st === 'lf') return JSON.stringify({ v: await enc(raw) });
    var parsed; try { parsed = JSON.parse(raw); } catch (e) { parsed = undefined; }
    if (parsed !== undefined && parsed !== null && typeof parsed === 'object') return JSON.stringify({ j: await enc(parsed) });
    return JSON.stringify({ s: await enc(raw) });
  }
  async function deserialize(st, str) {
    var o = JSON.parse(str);
    if (st === 'lf') return await dec(o.v);
    if ('j' in o) return JSON.stringify(await dec(o.j));
    var s = await dec(o.s); return s == null ? '' : String(s);
  }

  /* ---------- upload ---------- */
  var dirty = {};   // id -> {st,k,t}
  var timers = {}, running = {}, again = {};
  var blockedUntilReload = {}; // keys changed remotely while the app holds stale state
  function markDirty(st, k) {
    if (skip(k)) return;
    var id = keyId(st, k);
    dirty[id] = { st: st, k: k, t: Date.now() };
    var m = META[id] || (META[id] = { st: st, k: k });
    m.dirty = Date.now(); lss('__cx_meta', JSON.stringify(META));
    if (!db) return;
    clearTimeout(timers[id]); timers[id] = setTimeout(function () { upload(id); }, DEBOUNCE);
  }
  async function readLocal(st, k) { return st === 'lf' ? await lfGet(k) : lsg(k); }
  async function upload(id) {
    if (!db || blockedUntilReload[id]) return;
    if (running[id]) { again[id] = true; return; }
    var d = dirty[id] || (META[id] && { st: META[id].st, k: META[id].k }); if (!d) return;
    running[id] = true; delete dirty[id];
    try {
      var raw = await readLocal(d.st, d.k), m = META[id] || (META[id] = { st: d.st, k: d.k });
      var exists = d.st === 'lf' ? raw !== null && raw !== undefined : raw !== null;
      var t = Date.now();
      if (!exists) {
        if (m.h !== '') { await db.doc(P.kv + '/' + id).set({ st: d.st, k: d.k, h: '', del: true, t: t, dev: DEV }); gcLater(id, m.p || [], []); m.h = ''; m.p = []; }
      } else {
        var s = await serialize(d.st, raw), h = hash(s);
        if (h !== m.h) {
          var body = { st: d.st, k: d.k, h: h, t: t, dev: DEV };
          var parts = [];
          if (s.length <= INLINE_MAX) body.v = s;
          else {
            for (var i = 0; i < s.length; i += SLICE) parts.push(s.slice(i, i + SLICE));
            var ids = parts.map(function (x) { return id + '_' + hash(x).slice(0, 16); });
            var have = {}; (m.p || []).forEach(function (x) { have[x] = 1; });
            for (var j = 0; j < parts.length; j++) if (!have[ids[j]]) await db.doc(P.kp + '/' + ids[j]).set({ s: parts[j] });
            body.p = ids;
          }
          await db.doc(P.kv + '/' + id).set(body);
          gcLater(id, m.p || [], body.p || []);
          m.h = h; m.p = body.p || [];
        }
      }
      if (!dirty[id]) delete m.dirty;
      saveMeta();
    } catch (e) {
      console.warn('[cx] upload', id, e);
      dirty[id] = dirty[id] || d;
      if (e && e.code === 'resource-exhausted') showPill('Firebase 今日免费额度已用完，明天会继续同步', 6000);
      else if (e && e.code === 'permission-denied') showPill('Firebase 拒绝写入，请检查规则（见使用说明）', 6000);
      else if (e && e.code === 'invalid-argument') showPill('有内容过大未能同步', 4000);
      else { showPill('同步失败，稍后重试', 3000); setTimeout(function () { upload(id); }, 8000); }
    }
    running[id] = false;
    if (again[id]) { again[id] = false; upload(id); }
    statusIdle();
  }
  function gcLater(id, oldP, newP) {
    var keep = {}; newP.forEach(function (x) { keep[x] = 1; });
    var drop = oldP.filter(function (x) { return !keep[x]; }); if (!drop.length) return;
    setTimeout(function () {
      var cur = {}; ((META[id] && META[id].p) || []).forEach(function (x) { cur[x] = 1; });
      drop.forEach(function (x) { if (!cur[x]) db.doc(P.kp + '/' + x).delete().catch(function () {}); });
    }, 60000);
  }
  function pending() { for (var k in timers) if (dirty[k]) return true; for (var r in running) if (running[r]) return true; return false; }
  function statusIdle() { if (!pending() && pill.textContent === '同步失败，稍后重试') pill.hidden = true; }
  async function flushAll(maxMs) {
    var ids = Object.keys(dirty); ids.forEach(function (id) { clearTimeout(timers[id]); upload(id); });
    var end = Date.now() + (maxMs || 3000);
    while (pending() && Date.now() < end) await sleep(150);
  }

  /* ---------- download / apply ---------- */
  async function fetchValue(meta) {
    if (typeof meta.v === 'string') return meta.v;
    var ps = await Promise.all((meta.p || []).map(function (x) { return db.doc(P.kp + '/' + x).get(); }));
    var out = '';
    for (var i = 0; i < ps.length; i++) { if (!ps[i].exists) throw new Error('missing part'); out += ps[i].data().s; }
    if (hash(out) !== meta.h) throw new Error('hash mismatch');
    return out;
  }
  async function applyRemote(id, meta) {
    var m = META[id] || (META[id] = { st: meta.st, k: meta.k });
    if (meta.h === m.h) return false;
    if (m.dirty && m.dirty > (meta.t || 0)) return false; // local edit is newer; it will upload
    if (meta.del) {
      if (meta.st === 'lf') await lfRemove(meta.k); else { try { lsRemove.call(LS, meta.k); } catch (e) {} }
    } else {
      var str = await fetchValue(meta), val = await deserialize(meta.st, str);
      if (meta.st === 'lf') await lfSet(meta.k, val); else lss(meta.k, val);
    }
    m.h = meta.del ? '' : meta.h; m.p = meta.p || []; delete m.dirty; delete dirty[id];
    saveMeta(); return true;
  }

  /* ---------- wrap writes ---------- */
  async function wrapLF() {
    try { await localforage.ready(); } catch (e) { console.warn('[cx] storage', e); }
    lfSet = localforage.setItem.bind(localforage); lfGet = localforage.getItem.bind(localforage);
    lfRemove = localforage.removeItem.bind(localforage); lfClear = localforage.clear.bind(localforage); lfKeys = localforage.keys.bind(localforage);
  localforage.setItem = function (k, v, cb) { var p = lfSet(k, v, cb); p.then(function () { markDirty('lf', k); }, function () {}); return p; };
    localforage.removeItem = function (k, cb) { var p = lfRemove(k, cb); p.then(function () { markDirty('lf', k); }, function () {}); return p; };
    localforage.clear = function (cb) {
      var p = lfClear(cb);
      p.then(function () { Object.keys(META).forEach(function (id) { if (META[id].st === 'lf') markDirty('lf', META[id].k); }); }, function () {});
      return p;
    };
  }
  localforage.config = function () { return true; };
  Storage.prototype.setItem = function (k, v) { lsSet.call(this, k, v); if (this === LS) markDirty('ls', String(k)); };
  Storage.prototype.removeItem = function (k) { lsRemove.call(this, k); if (this === LS) markDirty('ls', String(k)); };
  Storage.prototype.clear = function () {
    if (this !== LS) return lsClear.call(this);
    var keep = { __cx_dev: lsg('__cx_dev'), __cx_meta: lsg('__cx_meta'), __cx_link: lsg('__cx_link'), __cx_local: lsg('__cx_local') }, keys = [];
    for (var i = 0; i < LS.length; i++) { var k = lsKey.call(LS, i); if (!skip(k)) keys.push(k); }
    lsClear.call(LS);
    for (var kk in keep) if (keep[kk] != null) lss(kk, keep[kk]);
    keys.forEach(function (k) { markDirty('ls', k); });
    Object.keys(META).forEach(function (id) { if (META[id].st === 'ls') markDirty('ls', META[id].k); });
  };

  /* ---------- start the original app ---------- */
  var started = false;
  function loadScripts() {
    if (started) return; started = true;
    var i = 0;
    (function next() {
      if (i >= SCRIPTS.length) {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
        window.dispatchEvent(new Event('load'));
        setTimeout(function () { veil.remove(); }, 120);
        return;
      }
      var s = document.createElement('script'); s.src = SCRIPTS[i++]; s.async = false;
      s.onload = next; s.onerror = function () { console.error('[cx] failed', s.src); next(); };
      document.body.appendChild(s);
    })();
  }

  /* ---------- remote updates after start ---------- */
  var visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
  var needReload = false;
  async function reloadNow() { showPill('正在载入其他设备的更新…'); await flushAll(3000); location.reload(); }
  function onRemoteChanged(ids) {
    ids.forEach(function (id) { blockedUntilReload[id] = true; });
    needReload = true;
    if (document.visibilityState === 'visible' && Date.now() - visibleSince < 5000) { reloadNow(); return; }
    if (document.visibilityState === 'visible') showPill('其他设备有新内容 · 点此刷新', 0, reloadNow);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { visibleSince = 0; flushAll(2500); }
    else { visibleSince = Date.now(); if (needReload) reloadNow(); }
  });
  window.addEventListener('pagehide', function () { flushAll(1500); });

  /* ---------- boot ---------- */
  async function uploadLocalOnly(remoteIds) {
    // keys that exist only on this device (e.g. first use, or offline edits) go up
    var keys = []; try { keys = await lfKeys(); } catch (e) {}
    keys.forEach(function (k) { var id = keyId('lf', k); if (!remoteIds[id] && !skip(k)) markDirty('lf', k); });
    for (var i = 0; i < LS.length; i++) { var k = lsKey.call(LS, i); var id = keyId('ls', k); if (!skip(k) && !remoteIds[id]) markDirty('ls', k); }
    Object.keys(META).forEach(function (id) { if (META[id].dirty) markDirty(META[id].st, META[id].k); });
  }

  /* ---------- connection: Firebase config + sync key, shared as one 连接码 ---------- */
  function b64e(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; return decodeURIComponent(escape(atob(str))); }
  function makeLink(c, k) { return 'CX1.' + b64e(JSON.stringify({ c: c, k: k })); }
  function readLink(str) {
    if (!str) return null; str = String(str).trim().replace(/\s+/g, '');
    if (str.indexOf('CX1.') !== 0) return null;
    try { var o = JSON.parse(b64d(str.slice(4))); if (o && o.c && o.c.apiKey && o.c.projectId && /^[A-Za-z0-9]{24,}$/.test(o.k)) { o.raw = str; return o; } } catch (e) {}
    return null;
  }
  function parseConfig(text) {
    var c = {}, re = /["']?(apiKey|authDomain|projectId|storageBucket|messagingSenderId|appId|measurementId|databaseURL)["']?\s*:\s*["']([^"']+)["']/g, m;
    while ((m = re.exec(text))) c[m[1]] = m[2];
    return c.apiKey && c.projectId ? c : null;
  }
  function newKey() { var a = new Uint8Array(24); crypto.getRandomValues(a); var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', s = ''; for (var i = 0; i < a.length; i++) s += abc[a[i] % abc.length]; return s + Date.now().toString(36); }
  var setupCss = document.createElement('style');
  setupCss.textContent = '.cx-set{width:min(440px,100%);max-height:100%;overflow:auto;text-align:left;padding:24px max(18px,env(safe-area-inset-right,0px)) calc(24px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;box-sizing:border-box}' +
    '.cx-set h1{font:600 22px/1.3 "Noto Serif SC",serif;letter-spacing:.3em;margin:0 0 6px}.cx-set .sub{font-size:13px;opacity:.6;margin:0 0 22px;line-height:1.6}' +
    '.cx-set h2{font-size:14px;margin:22px 0 8px;font-weight:600}.cx-set p{font-size:13px;line-height:1.7;opacity:.8;margin:0 0 10px}' +
    '.cx-set textarea{width:100%;box-sizing:border-box;min-height:96px;border-radius:12px;border:1px solid #333;background:#151517;color:#eee;padding:10px 12px;font:13px/1.5 ui-monospace,Menlo,monospace;resize:vertical}' +
    '.cx-set button{margin-top:10px;width:100%;padding:12px;border-radius:12px;border:1px solid #444;background:#1c1c1f;color:#f2f2f2;font-size:15px;cursor:pointer}' +
    '.cx-set button.pri{background:#f2f2f2;color:#111;border-color:#f2f2f2;font-weight:600}.cx-set .err{color:#ff8a80;font-size:13px;min-height:1em;margin-top:8px}' +
    '.cx-set .code{word-break:break-all;background:#151517;border:1px solid #333;border-radius:12px;padding:12px;font:12px/1.5 ui-monospace,Menlo,monospace;user-select:all;-webkit-user-select:all}' +
    '.cx-set hr{border:none;border-top:1px solid #2a2a2e;margin:24px 0 0}';
  document.head.appendChild(setupCss);
  function setupScreen(current) {
    return new Promise(function (resolve) {
      var box = document.createElement('div'); box.className = 'cx-set';
      veil.innerHTML = ''; veil.appendChild(box); veil.style.overflow = 'auto';
      function done(l) { history.replaceState(null, '', location.pathname + location.search); veil.innerHTML = '<div class="cx-v-in"><div class="cx-v-t">传讯</div><div class="cx-v-s" id="cx-v-s">正在同步…</div></div>'; resolve(l); }
      function home() {
        box.innerHTML = '<h1>传讯 · 同步</h1><p class="sub">电脑和手机用同一个「连接码」，数据就会自动同步。</p>' +
          (current ? '<h2>这台设备已连接</h2><p>把下面的连接码发给自己，在另一台设备上粘贴即可。</p><div class="code" id="cx-cur"></div><button id="cx-copy">复制连接码</button><button class="pri" id="cx-keep">继续使用</button><button id="cx-off">断开这台设备的同步</button><hr>' : '') +
          '<h2>已经有连接码（第二台设备）</h2><textarea id="cx-in" placeholder="粘贴 CX1. 开头的连接码"></textarea><div class="err" id="cx-e1"></div><button class="pri" id="cx-join">连接</button>' +
          '<hr><h2>第一次设置（第一台设备）</h2><p>粘贴 Firebase 网页应用的 firebaseConfig（整段复制过来即可，见使用说明）。</p><textarea id="cx-cfg" placeholder="const firebaseConfig = { apiKey: ..., projectId: ... }"></textarea><div class="err" id="cx-e2"></div><button id="cx-make">建立连接码</button>' +
          '<hr><button id="cx-skip">先不同步，只用这台设备</button>';
        if (current) {
          box.querySelector('#cx-cur').textContent = current.raw;
          box.querySelector('#cx-copy').onclick = function () { copy(current.raw, this); };
          box.querySelector('#cx-keep').onclick = function () { done(current); };
          box.querySelector('#cx-off').onclick = function () { try { lsRemove.call(LS, '__cx_link'); } catch (e) {} lss('__cx_local', '1'); done(null); };
        }
        box.querySelector('#cx-join').onclick = function () {
          var l = readLink(box.querySelector('#cx-in').value);
          if (!l) { box.querySelector('#cx-e1').textContent = '连接码不正确，请完整复制（以 CX1. 开头）。'; return; }
          switchTo(l);
        };
        box.querySelector('#cx-make').onclick = function () {
          var c = parseConfig(box.querySelector('#cx-cfg').value);
          if (!c) { box.querySelector('#cx-e2').textContent = '没有读到 apiKey 和 projectId，请把 firebaseConfig 整段复制过来。'; return; }
          var l = readLink(makeLink(c, newKey()));
          box.innerHTML = '<h1>连接码已建立</h1><p class="sub">这台设备会把现有数据上传。请把连接码发给自己（例如用聊天软件），在手机上打开同一个网址，选「已经有连接码」粘贴。</p>' +
            '<div class="code" id="cx-new"></div><button id="cx-copy2">复制连接码</button><button class="pri" id="cx-go">开始使用</button>' +
            '<p style="margin-top:14px">连接码等于你的数据钥匙，不要公开分享。之后在网址后面加 <b>#sync</b> 可以再次查看。</p>';
          box.querySelector('#cx-new').textContent = l.raw;
          box.querySelector('#cx-copy2').onclick = function () { copy(l.raw, this); };
          box.querySelector('#cx-go').onclick = function () { switchTo(l); };
        };
        box.querySelector('#cx-skip').onclick = function () { lss('__cx_local', '1'); done(current || null); };
      }
      function switchTo(l) {
        var prev = current && current.raw;
        lss('__cx_link', l.raw); try { lsRemove.call(LS, '__cx_local'); } catch (e) {}
        if (prev && prev !== l.raw) { META = {}; lss('__cx_meta', '{}'); history.replaceState(null, '', location.pathname + location.search); location.reload(); return; }
        if (!prev) { META = {}; lss('__cx_meta', '{}'); }
        done(l);
      }
      function copy(t, btn) {
        var ok = function () { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制连接码'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () { sel(); }); else sel();
        function sel() { var c = box.querySelector('.code'); var r = document.createRange(); r.selectNodeContents(c); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = '已选中，请手动复制'; }
      }
      home();
    });
  }
  window.addEventListener('hashchange', function () { if (location.hash === '#sync') location.reload(); });

  async function boot() {
    await wrapLF();
    var link = readLink(lsg('__cx_link'));
    if (location.hash === '#sync' || (!link && !lsg('__cx_local'))) { link = await setupScreen(link); }
    if (!link) { veil.remove(); loadScripts(); return; }
    var offline = navigator.onLine === false;
    var giveUp = setTimeout(function () { if (!started) { showPill(offline ? '离线中，使用本机数据，连网后自动同步' : '暂时连不上同步，先用本机数据', 5000); loadScripts(); } }, offline ? 300 : 15000);
    window.addEventListener('online', function () { Object.keys(META).forEach(function (id) { if (META[id].dirty) markDirty(META[id].st, META[id].k); }); });
    try {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(link.c);
      db = app.firestore();
    } catch (e) { console.warn('[cx] firebase', e); clearTimeout(giveUp); showPill('Firebase 设置有误，在网址后加 #sync 重新设置', 8000); loadScripts(); return; }
    P = { kv: 'sync/' + link.k + '/kv', kp: 'sync/' + link.k + '/kp' };
    var first = true;
    db.collection(P.kv).onSnapshot(async function (snap) {
      if (first && snap.metadata.fromCache) return;
      var docs = snap.docs, changed = [], remoteIds = {};
      if (first) {
        first = false;
        var todo = docs.filter(function (d) { var x = d.data(); remoteIds[d.id] = 1; return !META[d.id] || META[d.id].h !== x.h; });
        for (var i = 0; i < todo.length; i++) {
          veilText('正在同步 ' + (i + 1) + ' / ' + todo.length);
          try { await applyRemote(todo[i].id, todo[i].data()); } catch (e) { console.warn('[cx] apply', todo[i].id, e); }
        }
        await uploadLocalOnly(remoteIds);
        clearTimeout(giveUp);
        if (started) { needReload = needReload || todo.length > 0; if (todo.length) showPill('其他设备有新内容 · 点此刷新', 0, reloadNow); }
        else { loadScripts(); showPill('已同步', 1500); }
        return;
      }
      if (!started) return;
      for (var c of snap.docChanges()) {
        if (c.type === 'removed') continue;
        var x = c.doc.data(); if (x.dev === DEV && META[c.doc.id] && META[c.doc.id].h === x.h) continue;
        try { if (await applyRemote(c.doc.id, x)) changed.push(c.doc.id); } catch (e) { console.warn('[cx] apply', c.doc.id, e); }
      }
      if (changed.length) onRemoteChanged(changed);
    }, function (e) {
      console.warn('[cx] listen', e); clearTimeout(giveUp);
      showPill(e && e.code === 'permission-denied' ? 'Firebase 拒绝访问，请检查规则（见使用说明）' : '同步连接中断，刷新页面可重连', 0, function () { location.reload(); });
      loadScripts();
    });
  }
  boot();
})();
