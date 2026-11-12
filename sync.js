/*
 * 傳訊 · 同步層（Firebase 版）
 * 原網站把所有資料存在 localforage（IndexedDB）和 localStorage。
 * 這裡在原始碼啟動前把雲端（你自己的 Firebase Firestore）的資料寫回本地，
 * 啟動後把每次本地改動上傳。其他裝置有更新時，回到頁面會自動重新整理。
 * 不修改原網站的任何程式碼。在網址後面加 #sync 可以開啟同步設定。
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
  veil.innerHTML = '<div class="cx-v-in"><div class="cx-v-t">傳訊</div><div class="cx-v-s" id="cx-v-s">正在同步…</div></div>';
  var vs = document.createElement('style');
  vs.textContent = '#cx-veil{position:fixed;inset:0;z-index:2147483600;background:#0b0b0c;color:#f2f2f2;display:flex;align-items:center;justify-content:center;font-family:"Noto Serif TC", "Noto Serif SC",serif}' +
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
    if (blockedUntilReload[id] && !(st === 'lf' && isMsgKey(k))) {
      // 這個頁面拿的是舊資料：不要把舊資料當成新的傳上去，重新整理時從雲端拿回最新的
      var mb = META[id] || (META[id] = { st: st, k: k }); mb.h = '#stale'; delete mb.dirty; saveMeta(); return;
    }
    dirty[id] = { st: st, k: k, t: Date.now() };
    var m = META[id] || (META[id] = { st: st, k: k });
    m.dirty = Date.now(); lss('__cx_meta', JSON.stringify(META));
    if (!db) return;
    clearTimeout(timers[id]); timers[id] = setTimeout(function () { upload(id); }, DEBOUNCE);
  }
  async function readLocal(st, k) { return st === 'lf' ? await lfGet(k) : lsg(k); }
  async function upload(id) {
    var bk = META[id] && META[id].st === 'lf' && isMsgKey(META[id].k);
    if (!db || (blockedUntilReload[id] && !bk)) return;
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
        var s = await serialize(d.st, raw), h = hash(s), isMsg = d.st === 'lf' && isMsgKey(d.k), mine = raw;
        if (h !== m.h || isMsg) {
          /* 先看雲端：如果別的裝置在這之後改過，不能直接蓋掉 */
          var rs = null; try { rs = await db.doc(P.kv + '/' + id).get(); } catch (e0) {}
          var rd = rs && rs.exists ? rs.data() : null;
          if (rd && rd.h !== h) {
            if (isMsg) {
              var c = RCACHE[id], R = (c && c.h === rd.h) ? c.v : (rd.del ? [] : await deserialize('lf', await fetchValue(rd)));
              var merged = mergeMsgs(BASE[id], raw, R);
              if (merged !== raw) {
                raw = merged; await lfSet(d.k, raw); s = await serialize(d.st, raw); h = hash(s);
                if (pending() || started) { needReload = true; if (document.visibilityState === 'visible') showPill('已合併其他裝置的訊息 · 點此重新整理', 0, reloadNow); }
              }
              if (h === rd.h) { m.h = h; m.p = rd.p || []; RCACHE[id] = { h: h, v: raw }; setBase(id, mine); }
            } else if (rd.h !== m.h && rd.dev !== DEV) {
              // 別的裝置比較新：以雲端為準，這台的舊資料不上傳
              blockedUntilReload[id] = true; m.h = '#stale'; delete m.dirty; saveMeta();
              running[id] = false; onRemoteChanged([id]); return;
            }
          }
        }
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
          if (isMsg) { RCACHE[id] = { h: h, v: raw }; setBase(id, mine); }
        }
      }
      if (!dirty[id]) delete m.dirty;
      saveMeta();
    } catch (e) {
      console.warn('[cx] upload', id, e);
      dirty[id] = dirty[id] || d;
      if (e && e.code === 'resource-exhausted') showPill('Firebase 今日免費額度已用完，明天會繼續同步', 6000);
      else if (e && e.code === 'permission-denied') showPill('Firebase 拒絕寫入，請檢查規則（見使用說明）', 6000);
      else if (e && e.code === 'invalid-argument') showPill('有內容過大未能同步', 4000);
      else { showPill('同步失敗，稍後重試', 3000); setTimeout(function () { upload(id); }, 8000); }
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
  function statusIdle() { if (!pending() && pill.textContent === '同步失敗，稍後重試') pill.hidden = true; }
  async function flushAll(maxMs) {
    var ids = Object.keys(dirty); ids.forEach(function (id) { clearTimeout(timers[id]); upload(id); });
    var end = Date.now() + (maxMs || 3000);
    while (pending() && Date.now() < end) await sleep(150);
  }

  /* ---------- 聊天紀錄合併：兩台裝置的訊息都留下，不會被舊資料整個蓋掉 ---------- */
  var BASE = {}, RCACHE = {};
  function msgIdList(arr) { var a = []; (Array.isArray(arr) ? arr : []).forEach(function (x) { if (x && x.id != null) a.push(String(x.id)); }); return a; }
  function setBase(id, arr) { var l = msgIdList(arr); BASE[id] = new Set(l); try { lfSet('__cx_base_' + id, l); } catch (e) {} }
  function tkey(x) { var t = x && x.timestamp, v = t instanceof Date ? t.getTime() : (t && typeof t === 'object' && t.__cxD) || Date.parse(t); return isFinite(v) && v ? v : (Number(x && x.id) || 0); }
  function mergeMsgs(B, L, R) {
    if (!Array.isArray(L)) return L; if (!Array.isArray(R)) return L;
    B = B || new Set();
    var inL = new Map(), inR = new Map(), add = [], changed = false;
    L.forEach(function (x) { if (x && x.id != null) inL.set(String(x.id), x); });
    R.forEach(function (x) { if (x && x.id != null) inR.set(String(x.id), x); });
    // 別的裝置刪掉的（以前同步過、雲端已沒有）
    var out = L.filter(function (x) { if (!x || x.id == null) return true; var k = String(x.id); if (B.has(k) && !inR.has(k)) { changed = true; return false; } return true; });
    // 別的裝置新增的（這台沒刪過的）
    R.forEach(function (x) { if (!x || x.id == null) return; var k = String(x.id); if (!inL.has(k) && !B.has(k)) add.push(x); });
    if (!add.length) return changed ? out : L;
    out = out.concat(add).map(function (x, i) { return [x, i]; });
    out.sort(function (a, b) { return (tkey(a[0]) - tkey(b[0])) || (a[1] - b[1]); });
    return out.map(function (a) { return a[0]; });
  }
  async function seedBase() {
    var ks = []; try { ks = await lfKeys(); } catch (e) {}
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i]; if (!isMsgKey(k)) continue;
      var id = keyId('lf', k), m = META[id];
      try {
        if (m && m.dirty) { var b = await lfGet('__cx_base_' + id); if (Array.isArray(b)) BASE[id] = new Set(b); }
        else { var v = await lfGet(k); BASE[id] = new Set(msgIdList(v)); if (m && m.h) RCACHE[id] = { h: m.h, v: v }; }
      } catch (e) {}
    }
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
      if (meta.st === 'lf' && isMsgKey(meta.k)) { RCACHE[id] = { h: meta.h, v: val }; if (!started) setBase(id, val); }
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
    imgLayer();
  }

  /* ---------- 表情包瘦身：聊天裡同一張圖只存一份 ----------
     存檔時把訊息裡的圖片換成「cximg:編號」，圖片本身另外存一份 cxImg_編號；
     讀檔時再換回原本的圖片，所以網站其他地方看到的都跟原本一樣。 */
  var IMGP = 'cxImg_';
  function imgOn() { return lsg('cxImgDedupe') === '1'; }
  function imgHash(s) { var a = 2166136261, b = 5381; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); a ^= c; a = Math.imul(a, 16777619); b = Math.imul(b, 33) ^ c; } return (a >>> 0).toString(36) + (b >>> 0).toString(36) + s.length.toString(36); }
  function isMsgKey(k) { return typeof k === 'string' && /_chatMessages$/.test(k); }
  function isStkKey(k) { return typeof k === 'string' && /_(stickerLibrary|myStickerLibrary)$/.test(k); }
  function imgLayer() {
    var imgMap = new Map(), imgCache = {}, known = {}, chain = {};
    var setW = localforage.setItem, rmW = localforage.removeItem;
    async function pack(src) {
      if (typeof src !== 'string' || src.length < 2000 || src.indexOf('data:') !== 0) return src;
      var h = imgMap.get(src); if (!h) { h = imgHash(src); imgMap.set(src, h); }
      if (!imgCache[h]) imgCache[h] = src;
      if (!known[h]) { var ex = await lfGet(IMGP + h); if (ex == null) await setW(IMGP + h, src); known[h] = 1; }
      return 'cximg:' + h;
    }
    async function packMsgs(arr) {
      var out = new Array(arr.length);
      for (var i = 0; i < arr.length; i++) {
        var m = arr[i], c = m;
        if (m && typeof m === 'object') {
          var im = m.image ? await pack(m.image) : m.image;
          var ri = m.replyTo && m.replyTo.image ? await pack(m.replyTo.image) : null;
          if (im !== m.image || (ri && ri !== m.replyTo.image)) {
            c = Object.assign({}, m); c.image = im;
            if (ri && ri !== m.replyTo.image) c.replyTo = Object.assign({}, m.replyTo, { image: ri });
          }
        }
        out[i] = c;
      }
      return out;
    }
    async function unpack(ref) {
      if (typeof ref !== 'string' || ref.indexOf('cximg:') !== 0) return ref;
      var h = ref.slice(6);
      if (!imgCache[h]) { var v = await lfGet(IMGP + h); if (typeof v === 'string') { imgCache[h] = v; imgMap.set(v, h); known[h] = 1; } }
      return imgCache[h] || null;
    }
    async function unpackMsgs(arr) {
      if (!Array.isArray(arr)) return arr;
      for (var i = 0; i < arr.length; i++) {
        var m = arr[i]; if (!m || typeof m !== 'object') continue;
        if (typeof m.image === 'string' && m.image.indexOf('cximg:') === 0) { m.image = await unpack(m.image); if (!m.image && !m.text) m.text = '［圖片遺失］'; }
        if (m.replyTo && typeof m.replyTo.image === 'string' && m.replyTo.image.indexOf('cximg:') === 0) m.replyTo.image = await unpack(m.replyTo.image);
      }
      return arr;
    }
    /* 表情包庫：每個聊天室的表情包也只存一份 */
    async function packList(arr) {
      var out = new Array(arr.length);
      for (var i = 0; i < arr.length; i++) {
        var x = arr[i];
        if (typeof x === 'string') out[i] = await pack(x);
        else if (x && typeof x === 'object' && typeof x.src === 'string') { var ps = await pack(x.src); out[i] = ps === x.src ? x : Object.assign({}, x, { src: ps }); }
        else out[i] = x;
      }
      return out;
    }
    async function unpackList(arr) {
      if (!Array.isArray(arr)) return arr;
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var x = arr[i];
        if (typeof x === 'string' && x.indexOf('cximg:') === 0) { var v = await unpack(x); if (v) out.push(v); }
        else if (x && typeof x === 'object' && typeof x.src === 'string' && x.src.indexOf('cximg:') === 0) { var v2 = await unpack(x.src); if (v2) out.push(Object.assign({}, x, { src: v2 })); }
        else out.push(x);
      }
      return out;
    }
    function hasRefs(arr) { return Array.isArray(arr) && arr.some(function (m) { return m && typeof m.image === 'string' && m.image.indexOf('cximg:') === 0; }); }
    localforage.setItem = function (k, v, cb) {
      var stk = isStkKey(k);
      if (!(isMsgKey(k) || stk) || !Array.isArray(v) || !imgOn()) return setW(k, v, cb);
      var job = (chain[k] || Promise.resolve()).then(function () { return stk ? packList(v) : packMsgs(v); }).then(function (pv) { return setW(k, pv); }).then(function () { if (cb) cb(null, v); return v; });
      chain[k] = job.catch(function () {});
      return job;
    };
    localforage.getItem = function (k, cb) {
      var p = lfGet(k);
      if (isMsgKey(k)) p = p.then(unpackMsgs); else if (isStkKey(k)) p = p.then(unpackList);
      if (cb) p.then(function (v) { cb(null, v); }, function (e) { cb(e); });
      return p;
    };
    async function msgKeys() { var ks = []; try { ks = await lfKeys(); } catch (e) {} return ks.filter(isMsgKey); }
    async function refKeys() { var ks = []; try { ks = await lfKeys(); } catch (e) {} return ks.filter(function (k) { return isMsgKey(k) || isStkKey(k); }); }
    async function resaveAll() {
      var ks = await refKeys();
      for (var i = 0; i < ks.length; i++) { var v = await localforage.getItem(ks[i]); if (Array.isArray(v)) await localforage.setItem(ks[i], v); }
    }
    async function gc() {
      var used = {}, ks = await refKeys(), all = [];
      for (var i = 0; i < ks.length; i++) { var raw = await lfGet(ks[i]); (Array.isArray(raw) ? raw : []).forEach(function (m) { [typeof m === 'string' ? m : null, m && m.src, m && m.image, m && m.replyTo && m.replyTo.image].forEach(function (x) { if (typeof x === 'string' && x.indexOf('cximg:') === 0) used[x.slice(6)] = 1; }); }); }
      try { all = (await lfKeys()).filter(function (k) { return k.indexOf(IMGP) === 0; }); } catch (e) {}
      var n = 0; for (var j = 0; j < all.length; j++) { var h = all[j].slice(IMGP.length); if (!used[h]) { await rmW(all[j]); delete known[h]; delete imgCache[h]; n++; } }
      return n;
    }
    async function stats() {
      var ks = await msgKeys(), raw = 0, refs = 0, store = 0, n = 0;
      for (var i = 0; i < ks.length; i++) { var v = await lfGet(ks[i]); try { raw += JSON.stringify(v || []).length * 2; } catch (e) {} if (hasRefs(v)) refs++; }
      var all = []; try { all = (await lfKeys()).filter(function (k) { return k.indexOf(IMGP) === 0; }); } catch (e) {}
      for (var j = 0; j < all.length; j++) { var x = await lfGet(all[j]); if (typeof x === 'string') { store += x.length * 2; n++; } }
      return { on: imgOn(), chat: raw, store: store, images: n };
    }
    localforage.getRawItem = function (k) { return lfGet(k); };
    window.__cxImg = {
      on: imgOn, stats: stats, gc: gc,
      enable: async function () { localStorage.setItem('cxImgDedupe', '1'); await resaveAll(); await gc(); },
      disable: async function () { localStorage.setItem('cxImgDedupe', '0'); await resaveAll(); await gc(); },
      refKeys: refKeys
    };
    // 已經開了瘦身的話，把舊的表情包庫也改成只存一份（每台裝置做一次）
    setTimeout(async function () {
      if (!imgOn() || lsg('__cx_stk_packed') === '1') return;
      try {
        var ks = (await refKeys()).filter(isStkKey);
        for (var i = 0; i < ks.length; i++) { var v = await localforage.getItem(ks[i]); if (Array.isArray(v)) await localforage.setItem(ks[i], v); }
        lss('__cx_stk_packed', '1');
      } catch (e) { console.warn('[cx] stk pack', e); }
    }, 9000);
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
  async function reloadNow() { showPill('正在載入其他裝置的更新…'); await flushAll(3000); location.reload(); }
  function onRemoteChanged(ids) {
    ids.forEach(function (id) { if (!(META[id] && META[id].st === 'lf' && isMsgKey(META[id].k))) blockedUntilReload[id] = true; });
    needReload = true;
    if (document.visibilityState === 'visible' && Date.now() - visibleSince < 5000) { reloadNow(); return; }
    if (document.visibilityState === 'visible') showPill('其他裝置有新內容 · 點此重新整理', 0, reloadNow);
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

  /* ---------- connection: Firebase config + sync key, shared as one 連線碼 ---------- */
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
    '.cx-set h1{font:600 22px/1.3 "Noto Serif TC", "Noto Serif SC",serif;letter-spacing:.3em;margin:0 0 6px}.cx-set .sub{font-size:13px;opacity:.6;margin:0 0 22px;line-height:1.6}' +
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
      function done(l) { history.replaceState(null, '', location.pathname + location.search); veil.innerHTML = '<div class="cx-v-in"><div class="cx-v-t">傳訊</div><div class="cx-v-s" id="cx-v-s">正在同步…</div></div>'; resolve(l); }
      function home() {
        box.innerHTML = '<h1>傳訊 · 同步</h1><p class="sub">電腦和手機用同一個「連線碼」，資料就會自動同步。</p>' +
          (current ? '<h2>這臺裝置已連線</h2><p>把下面的連線碼發給自己，在另一臺裝置上貼上即可。</p><div class="code" id="cx-cur"></div><button id="cx-copy">複製連線碼</button><button class="pri" id="cx-keep">繼續使用</button><button id="cx-off">斷開這臺裝置的同步</button><hr>' : '') +
          '<h2>已經有連線碼（第二臺裝置）</h2><textarea id="cx-in" placeholder="貼上 CX1. 開頭的連線碼"></textarea><div class="err" id="cx-e1"></div><button class="pri" id="cx-join">連線</button>' +
          '<hr><h2>第一次設定（第一臺裝置）</h2><p>貼上 Firebase 網頁應用的 firebaseConfig（整段複製過來即可，見使用說明）。</p><textarea id="cx-cfg" placeholder="const firebaseConfig = { apiKey: ..., projectId: ... }"></textarea><div class="err" id="cx-e2"></div><button id="cx-make">建立連線碼</button>' +
          '<hr><button id="cx-skip">先不同步，只用這臺裝置</button>';
        if (current) {
          box.querySelector('#cx-cur').textContent = current.raw;
          box.querySelector('#cx-copy').onclick = function () { copy(current.raw, this); };
          box.querySelector('#cx-keep').onclick = function () { done(current); };
          box.querySelector('#cx-off').onclick = function () { try { lsRemove.call(LS, '__cx_link'); } catch (e) {} lss('__cx_local', '1'); done(null); };
        }
        box.querySelector('#cx-join').onclick = function () {
          var l = readLink(box.querySelector('#cx-in').value);
          if (!l) { box.querySelector('#cx-e1').textContent = '連線碼不正確，請完整複製（以 CX1. 開頭）。'; return; }
          switchTo(l);
        };
        box.querySelector('#cx-make').onclick = function () {
          var c = parseConfig(box.querySelector('#cx-cfg').value);
          if (!c) { box.querySelector('#cx-e2').textContent = '沒有讀到 apiKey 和 projectId，請把 firebaseConfig 整段複製過來。'; return; }
          var l = readLink(makeLink(c, newKey()));
          box.innerHTML = '<h1>連線碼已建立</h1><p class="sub">這臺裝置會把現有資料上傳。請把連線碼發給自己（例如用聊天軟體），在手機上開啟同一個網址，選「已經有連線碼」貼上。</p>' +
            '<div class="code" id="cx-new"></div><button id="cx-copy2">複製連線碼</button><button class="pri" id="cx-go">開始使用</button>' +
            '<p style="margin-top:14px">連線碼等於你的資料鑰匙，不要公開分享。之後在網址後面加 <b>#sync</b> 可以再次檢視。</p>';
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
        var ok = function () { btn.textContent = '已複製'; setTimeout(function () { btn.textContent = '複製連線碼'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () { sel(); }); else sel();
        function sel() { var c = box.querySelector('.code'); var r = document.createRange(); r.selectNodeContents(c); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = '已選中，請手動複製'; }
      }
      home();
    });
  }
  window.addEventListener('hashchange', function () { if (location.hash === '#sync') location.reload(); });

  async function boot() {
    await wrapLF();
    try { await seedBase(); } catch (e) { console.warn('[cx] base', e); }
    var link = readLink(lsg('__cx_link'));
    if (location.hash === '#sync' || (!link && !lsg('__cx_local'))) { link = await setupScreen(link); }
    if (!link) { veil.remove(); loadScripts(); return; }
    var offline = navigator.onLine === false;
    var giveUp = setTimeout(function () { if (!started) { showPill(offline ? '離線中，使用本機資料，連網後自動同步' : '暫時連不上同步，先用本機資料', 5000); loadScripts(); } }, offline ? 300 : 15000);
    window.addEventListener('online', function () { Object.keys(META).forEach(function (id) { if (META[id].dirty) markDirty(META[id].st, META[id].k); }); });
    try {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(link.c);
      db = app.firestore();
    } catch (e) { console.warn('[cx] firebase', e); clearTimeout(giveUp); showPill('Firebase 設定有誤，在網址後加 #sync 重新設定', 8000); loadScripts(); return; }
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
        if (started) { needReload = needReload || todo.length > 0; if (todo.length) showPill('其他裝置有新內容 · 點此重新整理', 0, reloadNow); }
        else { loadScripts(); showPill('已同步', 1500); }
        return;
      }
      if (!started || (snap.metadata && snap.metadata.hasPendingWrites)) return;
      for (var c of snap.docChanges()) {
        if (c.type === 'removed') continue;
        var x = c.doc.data(); if (x.dev === DEV) continue; // this device's own write coming back
        try { if (await applyRemote(c.doc.id, x)) changed.push(c.doc.id); } catch (e) { console.warn('[cx] apply', c.doc.id, e); }
      }
      if (changed.length) onRemoteChanged(changed);
    }, function (e) {
      console.warn('[cx] listen', e); clearTimeout(giveUp);
      showPill(e && e.code === 'permission-denied' ? 'Firebase 拒絕訪問，請檢查規則（見使用說明）' : '同步連線中斷，重新整理頁面可重連', 0, function () { location.reload(); });
      loadScripts();
    });
  }
  boot();
})();
