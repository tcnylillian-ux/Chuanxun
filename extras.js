/*
 * 傳訊 · 加購功能
 *  潮汐（經期紀錄）、番茄鐘、陪伴中心（一起聽歌／看影片／看小說）、紅包、狀態檢測、
 *  拼字卡模式、主動來信。
 * 全部資料存在 localforage（和原網站其他功能一樣），所以會跟著同步。
 * 部分功能概念參考「渡念」（小紅書 @我要學英語），程式為重新撰寫。
 */
(function () {
  'use strict';

  /* ================= 共用 ================= */
  var X = null;
  var DEF = {
    combine: { on: false, min: 2, max: 3, joins: ['，', '…', '、'] },
    letters: { freq: 'off', next: null },
    rp: { chance: 0.03, list: [] },
    pomo: { focus: 25, short: 5, long: 15, every: 4, toChat: true, run: null, log: {},
      lines: {
        focus: ['加油，我陪著你', '專心一點喔，我在旁邊看著', '你可以的', '寫完就抱抱', '不准偷看手機', '我也在努力', '安靜陪你'],
        rest: ['休息一下，喝口水', '伸個懶腰', '來，靠著我休息', '眼睛閉一下', '做得很好'],
        done: ['好棒！', '今天也很努力', '獎勵一個抱抱', '辛苦了', '我為你驕傲']
      } },
    status: { cooldown: 5, last: null, history: [], fields: [
      { n: '心情', t: 'pct' }, { n: '想你程度', t: 'pct', min: 60 },
      { n: '正在做', t: 'opt', o: ['想你', '睡覺', '吃飯', '發呆', '工作', '看你的照片', '打遊戲', '洗澡'] },
      { n: '在哪裡', t: 'opt', o: ['家裡', '路上', '公司', '咖啡店', '床上', '你心裡'] },
      { n: '精神', t: 'pct' }, { n: '想對你說', t: 'card' }
    ] },
    period: { list: [], days: {}, cycle: 28, len: 5, care: true, cared: {} },
    link: { on: true, i: 0, next: 0, every: 'h1', list: null },
    diary: { on: true, time: '22:00', entries: [] },
    hang: { on: true, min: 5, max: 30, say: true, lines: null },
    comp: { books: [], lines: {
      listen: ['這首好好聽', '這段旋律好喜歡', '跟你一起聽歌真好', '副歌要來了', '單曲循環吧', '你也喜歡這首嗎？', '想抱著你一起聽'],
      watch: ['哈哈哈哈', '這裡好好笑', '緊張死了', '這個演員好好看', '不准看別人，看我', '好感動', '抱緊我'],
      read: ['讀到哪了？', '這段寫得好好', '你看得好快', '我也想知道後面怎樣', '這個角色好可愛', '累了就休息一下', '看書的樣子好認真']
    }, history: [] }
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fill(d, def) { for (var k in def) { if (d[k] === undefined || d[k] === null && def[k] !== null) d[k] = clone(def[k]); else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof d[k] === 'object') fill(d[k], def[k]); } return d; }
  function key(k) { return getStorageKey(k || 'cxExtras'); }
  function ready() { try { return typeof getStorageKey === 'function' && !!SESSION_ID; } catch (e) { return false; } }
  async function load() { var d = null; try { d = await localforage.getItem(key()); } catch (e) {} X = fill(d && typeof d === 'object' ? d : {}, DEF); return X; }
  var saving = Promise.resolve();
  function save() { saving = saving.then(function () { return localforage.setItem(key(), X); }).catch(function () { toast('儲存失敗', 'error'); }); return saving; }
  function pname() { return (typeof settings !== 'undefined' && settings.partnerName) || '夢角'; }
  function myname() { return (typeof settings !== 'undefined' && settings.myName) || '我'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t, type) { if (typeof showNotification === 'function') showNotification(t, type || 'info'); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a && a.length ? a[Math.floor(Math.random() * a.length)] : ''; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { d = d instanceof Date ? d : new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function diffDays(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 864e5); }
  function fmtTime(t) { var d = new Date(t); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function cards() {
    var pool = (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) ? customReplies : [];
    try { var off = new Set(JSON.parse(localStorage.getItem('disabledReplyItems') || '[]')); pool = pool.filter(function (x) { return !off.has(x); }); } catch (e) {}
    return pool.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
  }
  function line(list) { var c = cards(); return (c.length && Math.random() < 0.3) ? pick(c) : (pick(list) || pick(c)); }
  function sysNotify(title, body, tag) { if (window.__cxNotify) window.__cxNotify(title, body, tag); }
  function sound() { if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} } }
  function partnerSays(text) {
    if (!text || typeof addMessage !== 'function') return;
    addMessage({ id: Date.now() + Math.floor(Math.random() * 1000), sender: pname(), text: text, timestamp: new Date(), status: 'received', favorited: false, note: null, type: 'normal' });
    sound();
    if (typeof window._sendPartnerNotification === 'function') window._sendPartnerNotification(pname(), text);
  }
  function iSay(text) { if (typeof addMessage === 'function') addMessage({ id: Date.now(), sender: 'user', text: text, timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' }); }
  function sysSay(text) { if (typeof addMessage === 'function') addMessage({ id: Date.now() + 7, text: text, timestamp: new Date(), type: 'system' }); }
  function confirmAsync(m) { return window.__cxConfirm ? window.__cxConfirm(m) : Promise.resolve(window.confirm(m)); }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.cx-modal .modal-content{max-height:88vh;display:flex;flex-direction:column}' +
    '.cx-modal .modal-buttons,#qa-modal .modal-buttons{margin-top:6px;margin-bottom:12px;padding-bottom:env(safe-area-inset-bottom,0px)}' +
    '.cx-body{overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;padding:2px 2px 8px}' +
    '.cx-sec{display:flex;flex-direction:column;gap:8px}.cx-sec h4{margin:4px 0 0;font-size:12px;font-weight:600;color:var(--text-secondary);letter-spacing:.05em}' +
    '.cx-row{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--text-primary)}.cx-row>span:first-child{flex:1;min-width:0}' +
    '.cx-row input[type=number]{width:70px;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:8px;padding:6px 8px;font:inherit;text-align:center}' +
    '.cx-in,.cx-ta,.cx-sel{width:100%;box-sizing:border-box;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px}' +
    '.cx-ta{min-height:90px;resize:vertical;line-height:1.6}' +
    '.cx-btns{display:flex;gap:8px;flex-wrap:wrap}.cx-btns>button{flex:1;min-width:0}' +
    '.cx-btn{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;cursor:pointer}' +
    '.cx-btn.pri{background:var(--accent-color);border-color:var(--accent-color);color:#fff;font-weight:600}' +
    '.cx-btn.warn{color:#d9534f;border-color:#d9534f;background:none}' +
    '.cx-btn:disabled{opacity:.45;cursor:default}' +
    '.cx-chips{display:flex;flex-wrap:wrap;gap:6px}.cx-chips button{min-width:40px;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:6px 12px;font:inherit;font-size:14px;cursor:pointer}' +
    '.cx-chips button.on{background:var(--accent-color);border-color:var(--accent-color);color:#fff}' +
    '.cx-card{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:14px;padding:14px}' +
    '.cx-muted{font-size:12px;color:var(--text-secondary);line-height:1.6}' +
    '.cx-say{display:flex;gap:10px;align-items:flex-start}.cx-say .av{width:34px;height:34px;border-radius:50%;background:var(--secondary-bg);flex:none;overflow:hidden;display:grid;place-items:center;color:var(--accent-color)}.cx-say .av img{width:100%;height:100%;object-fit:cover}' +
    '.cx-say .b{background:var(--secondary-bg);border:1px solid var(--border-color);border-radius:4px 14px 14px 14px;padding:9px 12px;font-size:14px;line-height:1.6;color:var(--text-primary);word-break:break-word}' +
    '.cx-say .n{font-size:11px;color:var(--text-secondary);margin-bottom:3px}' +
    '.cx-tabs{display:flex;gap:6px;padding:4px;background:var(--primary-bg);border-radius:12px}.cx-tabs button{flex:1;border:none;background:none;padding:8px 4px;border-radius:9px;font:inherit;font-size:13px;color:var(--text-secondary);cursor:pointer}' +
    '.cx-tabs button.on{background:var(--secondary-bg);color:var(--text-primary);box-shadow:0 1px 3px rgba(0,0,0,.08)}' +
    '.cx-big{font-size:56px;font-weight:300;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:.02em;color:var(--text-primary);line-height:1.1}' +
    '.cx-phase{text-align:center;font-size:13px;color:var(--accent-color);letter-spacing:.2em}' +
    '.cx-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cx-stat div{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:12px;padding:10px 6px;text-align:center}' +
    '.cx-stat b{display:block;font-size:20px;color:var(--text-primary);font-variant-numeric:tabular-nums}.cx-stat span{font-size:11px;color:var(--text-secondary)}' +
    '.cx-list{display:flex;flex-direction:column;gap:6px}.cx-li{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--primary-bg);border:1px solid var(--border-color);border-radius:12px;font-size:14px;color:var(--text-primary)}' +
    '.cx-li>div{flex:1;min-width:0}.cx-li .s{font-size:11px;color:var(--text-secondary);margin-top:2px}.cx-li button{flex:none}' +
    '.cx-x{border:none;background:none;color:var(--text-secondary);cursor:pointer;width:30px;height:30px}' +
    '.cx-badge{margin-left:auto;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e5534b;color:#fff;font-size:11px;line-height:18px;text-align:center}' +
    /* calendar */
    '.cx-cal-h{display:flex;align-items:center;justify-content:space-between}.cx-cal-h b{font-size:15px;color:var(--text-primary)}' +
    '.cx-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}' +
    '.cx-cal .w{font-size:11px;color:var(--text-secondary);padding:4px 0}' +
    '.cx-cal button{aspect-ratio:1;max-width:100%;border:1px solid transparent;border-radius:50%;background:none;font:inherit;font-size:13px;color:var(--text-primary);cursor:pointer;padding:0;font-variant-numeric:tabular-nums}' +
    '.cx-cal button.o{color:var(--text-secondary);opacity:.35}' +
    '.cx-cal button.per{background:#e86a7a;color:#fff}.cx-cal button.pred{border:1.5px dashed #e86a7a;color:#e86a7a}' +
    '.cx-cal button.fer{background:rgba(155,120,210,.16)}.cx-cal button.ovu{background:#9b78d2;color:#fff}' +
    '.cx-cal button.today{box-shadow:0 0 0 2px var(--accent-color) inset}.cx-cal button.sel{outline:2px solid var(--text-primary);outline-offset:1px}' +
    '.cx-legend{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--text-secondary)}.cx-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}' +
    '.cx-hero{text-align:center;padding:6px 0}.cx-hero b{display:block;font-size:22px;color:var(--text-primary);margin-top:2px}.cx-hero span{font-size:12px;color:var(--text-secondary)}' +
    /* red packet */
    '.cx-rp{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:linear-gradient(135deg,#e2574c,#c9382f);color:#fff;cursor:pointer;border:none;width:100%;text-align:left;font:inherit}' +
    '.cx-rp.done{opacity:.6}.cx-rp .i{font-size:26px}.cx-rp b{display:block;font-size:14px}.cx-rp span{font-size:11px;opacity:.85}' +
    '.cx-open{position:fixed;inset:0;z-index:2147483300;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.cx-open .p{width:min(300px,100%);border-radius:18px;background:linear-gradient(180deg,#e2574c,#b9322a);color:#fde9c9;text-align:center;padding:30px 20px 24px;box-shadow:0 20px 50px rgba(0,0,0,.4)}' +
    '.cx-open .p .who{font-size:14px;opacity:.9}.cx-open .p .note{font-size:17px;margin:12px 0 22px;line-height:1.5;color:#fff}' +
    '.cx-open .p .amt{font-size:40px;color:#ffe2a8;font-weight:600;font-variant-numeric:tabular-nums}.cx-open .p .coin{width:78px;height:78px;border-radius:50%;margin:0 auto;background:#f4c76b;color:#b9322a;font-size:28px;font-weight:700;display:grid;place-items:center;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25)}' +
    '.cx-open .p .close{margin-top:18px;background:none;border:none;color:#fde9c9;font:inherit;cursor:pointer;opacity:.8}' +
    '@keyframes cxspin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}.cx-open .coin.spin{animation:cxspin .6s linear infinite}' +
    /* status */
    '.cx-meter{height:8px;border-radius:4px;background:var(--secondary-bg);overflow:hidden}.cx-meter i{display:block;height:100%;background:var(--accent-color);border-radius:4px;transition:width .8s ease}' +
    '.cx-kv{display:flex;flex-direction:column;gap:10px}.cx-kv .k{display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:4px}.cx-kv .k b{color:var(--text-primary);font-weight:600}' +
    '@keyframes cxpulse{0%,100%{opacity:.35}50%{opacity:1}}.cx-scan{text-align:center;color:var(--accent-color);animation:cxpulse 1s infinite;padding:30px 0;font-size:14px}' +
    /* companion */
    '.cx-hub{display:grid;grid-template-columns:1fr;gap:8px}.cx-hub button{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;border-radius:14px;border:1px solid var(--border-color);background:var(--primary-bg);font:inherit;color:var(--text-primary);cursor:pointer}' +
    '.cx-hub i{font-size:20px;color:var(--accent-color);width:28px;text-align:center}.cx-hub b{display:block;font-size:15px}.cx-hub span{font-size:12px;color:var(--text-secondary)}' +
    '.cx-player audio,.cx-player video{width:100%;border-radius:12px;background:#000;display:block}.cx-player iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000;display:block}' +
    '.cx-stage{position:relative;overflow:hidden;border-radius:12px}.cx-dm{position:absolute;white-space:nowrap;font-size:15px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;animation:cxdm 8s linear forwards}' +
    '@keyframes cxdm{from{transform:translateX(0)}to{transform:translateX(calc(-100vw - 100%))}}' +
    '.cx-feed{display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto}' +
    '.cx-reader{font-size:var(--cx-fs,17px);line-height:1.9;color:var(--text-primary);white-space:pre-wrap;word-break:break-word;font-family:var(--font-family,serif);padding:4px 2px}' +
    '.cx-reader h3{font-size:1.1em;margin:0 0 12px;text-align:center}' +
    '.cx-float{position:sticky;bottom:0;margin-top:8px}' +
    '#cx-link{order:4;display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:2px;cursor:pointer;line-height:1}' +
    '#cx-link .hs{display:flex;gap:2px}#cx-link .hs i{width:7px;height:7px;background:var(--text-secondary);opacity:.25;clip-path:path("M3.5 6.6 0.6 3.7A1.7 1.7 0 0 1 3.5 1.3 1.7 1.7 0 0 1 6.4 3.7Z")}' +
    '#cx-link .hs i.on{background:#e86a7a;opacity:1}#cx-link .tx{font-size:9px;color:var(--text-secondary);white-space:nowrap}' +
    '@keyframes cxbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}#cx-link.lv5 .hs i.on{animation:cxbeat 1.6s ease-in-out infinite}#cx-link.lv5 .hs i.on:nth-child(2){animation-delay:.1s}#cx-link.lv5 .hs i.on:nth-child(3){animation-delay:.2s}#cx-link.lv5 .hs i.on:nth-child(4){animation-delay:.3s}#cx-link.lv5 .hs i.on:nth-child(5){animation-delay:.4s}' +
    '@media (prefers-reduced-motion:reduce){#cx-link .hs i{animation:none!important}.cx-dm,.cx-scan,.cx-open .coin.spin{animation:none}}';
  document.head.appendChild(css);

  /* ---------- modal factory ---------- */
  function makeModal(id, icon, title) {
    var m = document.createElement('div'); m.className = 'modal cx-modal'; m.id = id;
    m.innerHTML = '<div class="modal-content"><div class="modal-title"><i class="fas ' + icon + '"></i><span>' + title + '</span></div><div class="cx-body"></div>' +
      '<div class="modal-buttons"><button class="modal-btn modal-btn-secondary" data-x="back"><i class="fas fa-arrow-left"></i> 返回</button><button class="modal-btn modal-btn-secondary" data-x="close">關閉</button></div></div>';
    document.body.appendChild(m);
    var o = { el: m, body: m.querySelector('.cx-body'), onBack: null, onClose: null };
    o.open = function () { showModal(m); };
    o.close = function () { hideModal(m); if (o.onClose) o.onClose(); };
    o.isOpen = function () { return m.style.display === 'flex'; };
    m.querySelector('[data-x=close]').onclick = o.close;
    m.querySelector('[data-x=back]').onclick = function () {
      if (o.onBack && o.onBack() === true) return;
      o.close(); var adv = document.getElementById('advanced-modal'); if (adv) showModal(adv);
    };
    m.addEventListener('click', function (e) { if (e.target === m) o.close(); });
    return o;
  }
  function addEntry(id, icon, label, fn) {
    if (document.getElementById(id)) return;
    var anchor = document.getElementById('qa-function') || document.getElementById('envelope-function');
    var list = anchor ? anchor.parentNode : document.querySelector('#advanced-modal .settings-item-list');
    if (!list) return;
    var el = document.createElement('div'); el.className = 'settings-item'; el.id = id;
    el.innerHTML = '<i class="fas ' + icon + '"></i><span>' + label + '</span>';
    el.addEventListener('click', async function () { var adv = document.getElementById('advanced-modal'); if (adv) hideModal(adv); await load(); fn(); });
    list.appendChild(el);
  }
  function partnerAvatar() { var img = document.querySelector('#partner-avatar img'); return img ? '<img src="' + esc(img.src) + '" alt="">' : '<i class="fas fa-user"></i>'; }
  function sayHtml(text) { return '<div class="cx-say"><div class="av">' + partnerAvatar() + '</div><div><div class="n">' + esc(pname()) + '</div><div class="b">' + esc(text) + '</div></div></div>'; }

  /* ================= 拼字卡模式 ================= */
  function buildCombos(pool, n) {
    var c = X.combine, out = [], joins = c.joins && c.joins.length ? c.joins : ['，'];
    var lo = Math.max(1, Math.min(+c.min || 2, 6)), hi = Math.max(lo, Math.min(+c.max || 3, 6));
    for (var i = 0; i < n; i++) {
      var k = Math.round(rnd(lo, hi)), parts = [], guard = 0;
      while (parts.length < Math.min(k, pool.length) && guard++ < 50) { var p = pick(pool); if (parts.indexOf(p) < 0) parts.push(p); }
      var s = parts[0];
      for (var j = 1; j < parts.length; j++) s += pick(joins) + parts[j];
      out.push(s);
    }
    return out;
  }
  function replyGroups() { return Array.isArray(window.customReplyGroups) ? window.customReplyGroups.filter(function (g) { return g && g.name && Array.isArray(g.items); }) : []; }
  function comboGroups() {
    var names = replyGroups().map(function (g) { return g.name; });
    if (!Array.isArray(X.combine.groups)) return names.indexOf('拼字卡短句') >= 0 ? ['拼字卡短句'] : [];
    return X.combine.groups.filter(function (n) { return names.indexOf(n) >= 0; });
  }
  function comboPool() {
    var sel = comboGroups();
    if (sel.length) {
      var seen = {}, out = [];
      replyGroups().forEach(function (g) { if (sel.indexOf(g.name) >= 0) g.items.forEach(function (t) { t = String(t || '').trim(); if (t && !seen[t]) { seen[t] = 1; out.push(t); } }); });
      return out;
    }
    var off = {}; replyGroups().forEach(function (g) { if (g.disabled) g.items.forEach(function (t) { off[t] = 1; }); });
    return cards().filter(function (t) { return !off[t]; });
  }
  function wrapReply() {
    if (typeof window.simulateReply !== 'function' || window.simulateReply.__cx) return;
    var orig = window.simulateReply;
    var wrapped = function () {
      var saved = null;
      try {
        if (X && X.combine.on && typeof customReplies !== 'undefined') {
          var pool = comboPool();
          if (pool.length >= 2) { saved = customReplies; customReplies = buildCombos(pool, 40); }
        }
      } catch (e) { saved = null; }
      try { return orig.apply(this, arguments); }
      finally { if (saved) customReplies = saved; maybePartnerPacket(); }
    };
    wrapped.__cx = true;
    window.simulateReply = wrapped;
  }

  /* ================= 主動來信 ================= */
  var LETTER_FREQ = { off: { label: '不要主動寄信' }, d2: { label: '常常（1～2 天一封）', min: 1, max: 2 }, d4: { label: '偶爾（3～5 天一封）', min: 3, max: 5 }, d7: { label: '很少（大約一週一封）', min: 6, max: 8 } };
  function scheduleLetter(from) {
    var f = LETTER_FREQ[X.letters.freq];
    X.letters.next = (f && f.min) ? (from || Date.now()) + rnd(f.min, f.max) * 864e5 : null;
  }
  async function letterTick() {
    if (X.letters.freq === 'off') return false;
    if (!X.letters.next) { scheduleLetter(); return true; }
    if (Date.now() < X.letters.next) return false;
    if (!cards().length || typeof loadEnvelopeData !== 'function' || typeof generateEnvelopeReplyText !== 'function') return false;
    var at = X.letters.next, id = 'auto_' + Math.round(at).toString(36);
    await loadEnvelopeData();
    if (!envelopeData.inbox.some(function (l) { return l.id === id; })) {
      var letter = { id: id, refId: null, originalContent: '', content: generateEnvelopeReplyText(), receivedTime: Date.now(), isNew: true, auto: true };
      envelopeData.inbox.push(letter);
      saveEnvelopeData();
      sound();
      if (typeof showEnvelopeReplyPopup === 'function') { try { showEnvelopeReplyPopup(letter); } catch (e) {} }
      sysNotify(pname(), '寄了一封信給你 💌', 'letter');
    }
    scheduleLetter();
    return true;
  }

  /* ================= 紅包 ================= */
  var RP_NOTES = ['恭喜發財，大吉大利', '給你買奶茶', '乖乖的獎勵', '想你了', '今天也要開心', '零花錢'];
  var RP_AMOUNTS = [5.2, 13.14, 52, 66.66, 88.88, 99.99, 520];
  function money(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function unopened() { return X ? X.rp.list.filter(function (p) { return p.from === 'him' && !p.opened; }).length : 0; }
  function maybePartnerPacket() {
    if (!X || !(X.rp.chance > 0) || Math.random() >= X.rp.chance) return;
    setTimeout(async function () {
      await load();
      var amt = Math.random() < 0.6 ? pick(RP_AMOUNTS) : Math.round(rnd(1, 200) * 100) / 100;
      var p = { id: 'rp' + Date.now().toString(36), from: 'him', amount: amt, note: pick(RP_NOTES), at: Date.now(), opened: false };
      X.rp.list.push(p); await save();
      partnerSays('🧧 紅包｜' + p.note + '（點這則訊息領取）');
      refreshBadge();
    }, 6000 + Math.random() * 6000);
  }
  async function rpTick() {
    var now = Date.now(), changed = false;
    X.rp.list.forEach(function (p) {
      if (p.from === 'me' && !p.opened && p.openAt && now >= p.openAt) {
        p.opened = true; p.openedAt = now; changed = true;
        sysSay(pname() + ' 領取了你的紅包');
        if (p.reply) setTimeout(function () { partnerSays(p.reply); }, 1200);
      }
    });
    return changed;
  }
  var rpM = null;
  function rpOpen() {
    if (!rpM) {
      rpM = makeModal('cx-rp-modal', 'fa-gift', '紅包');
      rpM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.amt) { rpM.body.querySelector('#cx-rp-amt').value = b.dataset.amt; return; }
        if (b.id === 'cx-rp-send') {
          var amt = parseFloat(rpM.body.querySelector('#cx-rp-amt').value), note = rpM.body.querySelector('#cx-rp-note').value.trim() || '恭喜發財，大吉大利';
          if (!(amt > 0) || amt > 99999) { toast('請輸入金額', 'warning'); return; }
          var p = { id: 'rp' + Date.now().toString(36), from: 'me', amount: amt, note: note, at: Date.now(), opened: false, openAt: Date.now() + rnd(8e3, 90e3), reply: pick(cards()) || '謝謝寶貝' };
          X.rp.list.push(p); await save();
          iSay('🧧 紅包｜' + note);
          toast('紅包已送出', 'success'); rpRender(); return;
        }
        if (b.dataset.open) { openPacket(b.dataset.open); return; }
      });
    }
    rpM.onBack = null; rpRender(); rpM.open();
  }
  function rpRender() {
    var list = X.rp.list.slice().sort(function (a, b) { return b.at - a.at; });
    var got = X.rp.list.filter(function (p) { return p.from === 'him' && p.opened; }).reduce(function (s, p) { return s + p.amount; }, 0);
    var sent = X.rp.list.filter(function (p) { return p.from === 'me'; }).reduce(function (s, p) { return s + p.amount; }, 0);
    var h = '<div class="cx-sec"><h4>發紅包給 ' + esc(pname()) + '</h4><input class="cx-in" id="cx-rp-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="金額">' +
      '<div class="cx-chips">' + [5.2, 13.14, 52, 520, 1314].map(function (a) { return '<button data-amt="' + a + '">' + a + '</button>'; }).join('') + '</div>' +
      '<input class="cx-in" id="cx-rp-note" maxlength="30" placeholder="恭喜發財，大吉大利"><button class="cx-btn pri" id="cx-rp-send">🧧 塞進紅包</button></div>' +
      '<div class="cx-stat"><div><b>' + unopened() + '</b><span>待領取</span></div><div><b>' + money(got) + '</b><span>收到</span></div><div><b>' + money(sent) + '</b><span>送出</span></div></div>' +
      '<div class="cx-sec"><h4>紅包記錄</h4><div class="cx-list">';
    if (!list.length) h += '<div class="cx-muted">還沒有紅包。' + esc(pname()) + ' 聊天時偶爾也會發紅包給你。</div>';
    list.forEach(function (p) {
      var mine = p.from === 'me';
      h += '<button class="cx-rp' + (p.opened ? ' done' : '') + '"' + (!mine && !p.opened ? ' data-open="' + p.id + '"' : '') + '><span class="i">🧧</span><div><b>' + esc(p.note) + '</b><span>' +
        (mine ? '送給 ' + esc(pname()) + ' · ¥' + money(p.amount) + (p.opened ? ' · 已被領取' : ' · 等待領取') : esc(pname()) + ' 送的 · ' + (p.opened ? '已領取 ¥' + money(p.amount) : '點一下領取')) + ' · ' + fmtTime(p.at) + '</span></div></button>';
    });
    rpM.body.innerHTML = h + '</div></div>';
  }
  function openPacket(id) {
    var p = X.rp.list.find(function (x) { return x.id === id; }); if (!p) return;
    var o = document.createElement('div'); o.className = 'cx-open';
    o.innerHTML = '<div class="p"><div class="who">' + esc(pname()) + ' 的紅包</div><div class="note">' + esc(p.note) + '</div>' +
      (p.opened ? '<div class="amt">¥' + money(p.amount) + '</div>' : '<button class="coin">開</button>') + '<div><button class="close">關閉</button></div></div>';
    document.body.appendChild(o);
    o.querySelector('.close').onclick = function () { o.remove(); };
    o.addEventListener('click', function (e) { if (e.target === o) o.remove(); });
    var coin = o.querySelector('.coin');
    if (coin) coin.onclick = async function () {
      coin.classList.add('spin');
      setTimeout(async function () {
        p.opened = true; p.openedAt = Date.now(); await save();
        coin.outerHTML = '<div class="amt">¥' + money(p.amount) + '</div>';
        sysSay('你領取了 ' + pname() + ' 的紅包 ¥' + money(p.amount));
        refreshBadge(); if (rpM && rpM.isOpen()) rpRender();
      }, 900);
    };
  }
  // tap a red-packet message in the chat to open it
  document.addEventListener('click', async function (e) {
    var msg = e.target.closest && e.target.closest('#chat-container [data-msg-id]'); if (!msg) return;
    if ((msg.textContent || '').indexOf('🧧 紅包｜') < 0) return;
    await load();
    var mine = msg.classList.contains('sent');
    var waiting = X.rp.list.filter(function (p) { return p.from === 'him' && !p.opened; });
    if (!mine && waiting.length) openPacket(waiting[waiting.length - 1].id); else rpOpen();
  });

  /* ================= 番茄鐘 ================= */
  var pomoM = null, pomoTimer = null, pomoLine = '';
  function phaseLen(ph) { return (ph === 'focus' ? X.pomo.focus : ph === 'long' ? X.pomo.long : X.pomo.short) * 60e3; }
  function phaseName(ph) { return ph === 'focus' ? '專 注 中' : ph === 'long' ? '長 休 息' : '短 休 息'; }
  function leftMs() { var r = X.pomo.run; if (!r) return phaseLen('focus'); return r.paused ? r.left : Math.max(0, r.endAt - Date.now()); }
  function fmtMs(ms) { var s = Math.ceil(ms / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  async function pomoAdvance() {
    var r = X.pomo.run; if (!r || r.paused || Date.now() < r.endAt) return false;
    if (r.phase === 'focus') {
      var d = ymd(new Date()), lg = X.pomo.log[d] || (X.pomo.log[d] = { n: 0, min: 0 });
      lg.n++; lg.min += Math.round(phaseLen('focus') / 60e3); r.count = (r.count || 0) + 1;
      var done = line(X.pomo.lines.done);
      sysNotify(pname(), '專注完成！' + done, 'pomo');
      if (X.pomo.toChat) partnerSays('🍅 ' + done); else sound();
      r.phase = (r.count % (X.pomo.every || 4) === 0) ? 'long' : 'short';
    } else {
      sysNotify(pname(), '休息結束，我們繼續吧', 'pomo'); sound();
      r.phase = 'focus';
    }
    r.endAt = Date.now() + phaseLen(r.phase); pomoLine = line(X.pomo.lines[r.phase === 'focus' ? 'focus' : 'rest']);
    return true;
  }
  function pomoOpen() {
    if (!pomoM) {
      pomoM = makeModal('cx-pomo-modal', 'fa-clock', '番茄鐘');
      pomoM.onClose = function () { clearInterval(pomoTimer); };
      pomoM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return; var r = X.pomo.run;
        if (b.dataset.p === 'start') {
          if (!r) X.pomo.run = { phase: 'focus', endAt: Date.now() + phaseLen('focus'), count: 0 };
          else if (r.paused) { r.endAt = Date.now() + r.left; r.paused = false; delete r.left; }
          pomoLine = line(X.pomo.lines[X.pomo.run.phase === 'focus' ? 'focus' : 'rest']);
        } else if (b.dataset.p === 'pause' && r) { r.left = leftMs(); r.paused = true; }
        else if (b.dataset.p === 'skip' && r) { r.paused = false; r.endAt = Date.now() - 1; await pomoAdvance(); }
        else if (b.dataset.p === 'reset') { X.pomo.run = null; pomoLine = ''; }
        else if (b.dataset.p === 'set') { pomoM.view = 'set'; pomoRender(); return; }
        else if (b.dataset.p === 'saveset') {
          ['focus', 'short', 'long', 'every'].forEach(function (k) { var v = parseInt(pomoM.body.querySelector('#cx-pm-' + k).value, 10); if (v > 0 && v < 1000) X.pomo[k] = v; });
          X.pomo.toChat = pomoM.body.querySelector('#cx-pm-chat').checked;
          ['focus', 'rest', 'done'].forEach(function (k) { var t = pomoM.body.querySelector('#cx-pm-l-' + k).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (t.length) X.pomo.lines[k] = t; });
          pomoM.view = 'main'; await save(); toast('已儲存', 'success'); pomoRender(); return;
        } else return;
        await save(); pomoRender();
      });
      pomoM.onBack = function () { if (pomoM.view === 'set') { pomoM.view = 'main'; pomoRender(); return true; } };
    }
    pomoM.view = 'main';
    if (!pomoLine) pomoLine = line(X.pomo.lines.focus);
    pomoRender(); pomoM.open();
    clearInterval(pomoTimer);
    pomoTimer = setInterval(async function () {
      if (!pomoM.isOpen()) { clearInterval(pomoTimer); return; }
      if (await pomoAdvance()) { await save(); pomoRender(); return; }
      var t = pomoM.body.querySelector('.cx-big'); if (t) t.textContent = fmtMs(leftMs());
    }, 500);
  }
  function pomoRender() {
    var b = pomoM.body, P = X.pomo;
    if (pomoM.view === 'set') {
      b.innerHTML = '<div class="cx-sec"><h4>時間（分鐘）</h4>' +
        [['focus', '專注'], ['short', '短休息'], ['long', '長休息'], ['every', '幾個番茄後長休息']].map(function (k) { return '<label class="cx-row"><span>' + k[1] + '</span><input type="number" id="cx-pm-' + k[0] + '" min="1" value="' + P[k[0]] + '"></label>'; }).join('') +
        '<label class="qa-chk"><input type="checkbox" id="cx-pm-chat"' + (P.toChat ? ' checked' : '') + '>完成時 ' + esc(pname()) + ' 在聊天裡誇你</label></div>' +
        '<div class="cx-sec"><h4>陪伴的話（每行一句，也會混一些你的字卡）</h4>' +
        [['focus', '專注時'], ['rest', '休息時'], ['done', '完成時']].map(function (k) { return '<div class="cx-muted">' + k[1] + '</div><textarea class="cx-ta" id="cx-pm-l-' + k[0] + '">' + esc(P.lines[k[0]].join('\n')) + '</textarea>'; }).join('') +
        '</div><button class="cx-btn pri" data-p="saveset">儲存</button>';
      return;
    }
    var r = P.run, running = r && !r.paused, today = P.log[ymd(new Date())] || { n: 0, min: 0 };
    var week = 0; for (var i = 0; i < 7; i++) { var w = P.log[ymd(new Date(Date.now() - i * 864e5))]; if (w) week += w.n; }
    b.innerHTML = '<div class="cx-phase">' + (r ? phaseName(r.phase) + (r.paused ? ' · 暫停' : '') : '準 備 專 注') + '</div><div class="cx-big">' + fmtMs(leftMs()) + '</div>' +
      sayHtml(pomoLine || '準備好了嗎？我們開始吧') +
      '<div class="cx-btns">' + (running ? '<button class="cx-btn" data-p="pause">暫停</button>' : '<button class="cx-btn pri" data-p="start">' + (r ? '繼續' : '開始專注') + '</button>') +
      (r ? '<button class="cx-btn" data-p="skip">跳過</button><button class="cx-btn" data-p="reset">重置</button>' : '') + '</div>' +
      '<div class="cx-stat"><div><b>' + today.n + '</b><span>今天番茄</span></div><div><b>' + today.min + '</b><span>今天分鐘</span></div><div><b>' + week + '</b><span>近 7 天番茄</span></div></div>' +
      '<button class="qa-link" data-p="set" style="align-self:center">時間與陪伴的話設定</button>' +
      '<div class="cx-muted" style="text-align:center">關掉視窗也會繼續計時，時間到會通知你</div>';
  }
  setInterval(async function () { // keep timing while the window is closed
    if (!ready() || !X || !X.pomo.run || (pomoM && pomoM.isOpen())) return;
    if (await pomoAdvance()) save();
  }, 5000);
  var pomoLineTimer = setInterval(function () { if (pomoM && pomoM.isOpen() && X.pomo.run && !X.pomo.run.paused) { pomoLine = line(X.pomo.lines[X.pomo.run.phase === 'focus' ? 'focus' : 'rest']); var bb = pomoM.body.querySelector('.cx-say .b'); if (bb) bb.textContent = pomoLine; } }, 4 * 60e3);

  /* ================= 狀態檢測 ================= */
  var stM = null;
  function stOpen() {
    if (!stM) {
      stM = makeModal('cx-status-modal', 'fa-heart-pulse', '狀態檢測');
      stM.onBack = function () { if (stM.view !== 'main') { stM.view = 'main'; stRender(); return true; } };
      stM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s === 'scan') {
          var wait = X.status.last ? X.status.last.at + X.status.cooldown * 60e3 - Date.now() : 0;
          if (wait > 0) { toast('檢測冷卻中，' + Math.ceil(wait / 60e3) + ' 分鐘後再試', 'info'); return; }
          stM.body.innerHTML = '<div class="cx-scan">正在連接 ' + esc(pname()) + ' 的狀態…</div>';
          setTimeout(async function () {
            var res = { at: Date.now(), v: X.status.fields.map(function (f) {
              var v;
              if (f.t === 'pct') v = Math.round(rnd(+f.min || 10, 100));
              else if (f.t === 'opt') v = pick(f.o || []);
              else v = pick(cards()) || '想你';
              return { n: f.n, t: f.t, v: v };
            }) };
            X.status.last = res; X.status.history.unshift(res); X.status.history = X.status.history.slice(0, 30);
            await save(); stRender();
          }, 1600);
          return;
        }
        if (b.dataset.s === 'hist') { stM.view = 'hist'; stRender(); return; }
        if (b.dataset.s === 'edit') { stM.view = 'edit'; stRender(); return; }
        if (b.dataset.s === 'add') { stCollect(); X.status.fields.push({ n: '新項目', t: 'pct' }); stRender(); return; }
        if (b.dataset.rm !== undefined) { stCollect(); X.status.fields.splice(+b.dataset.rm, 1); stRender(); return; }
        if (b.dataset.s === 'saveedit') { stCollect(); var cd = parseInt(stM.body.querySelector('#cx-st-cd').value, 10); if (cd >= 0) X.status.cooldown = cd; await save(); stM.view = 'main'; toast('已儲存', 'success'); stRender(); return; }
        if (b.dataset.s === 'share' && X.status.last) {
          iSay('📡 狀態檢測\n' + X.status.last.v.map(function (r) { return r.n + '：' + (r.t === 'pct' ? r.v + '%' : r.v); }).join('\n'));
          toast('已傳到聊天', 'success');
        }
      });
      stM.body.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.ft !== undefined) { stCollect(); stRender(); } });
    }
    stM.view = 'main'; stRender(); stM.open();
  }
  function stCollect() {
    if (stM.view !== 'edit') return;
    stM.body.querySelectorAll('[data-fi]').forEach(function (row) {
      var i = +row.dataset.fi, f = X.status.fields[i]; if (!f) return;
      f.n = row.querySelector('[data-fn]').value.trim() || '項目';
      f.t = row.querySelector('[data-ft]').value;
      var o = row.querySelector('[data-fo]'); if (o) f.o = o.value.split(/[,，、\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
    });
  }
  function stRender() {
    var b = stM.body, S = X.status;
    if (stM.view === 'hist') {
      b.innerHTML = '<div class="cx-list">' + (S.history.length ? S.history.map(function (r) { return '<div class="cx-li"><div>' + r.v.map(function (x) { return esc(x.n) + ' ' + esc(x.t === 'pct' ? x.v + '%' : x.v); }).join('｜') + '<div class="s">' + fmtTime(r.at) + '</div></div></div>'; }).join('') : '<div class="cx-muted">還沒有記錄</div>') + '</div>';
      return;
    }
    if (stM.view === 'edit') {
      var types = { pct: '百分比', opt: '從選項抽', card: '從字卡抽一句' };
      b.innerHTML = '<label class="cx-row"><span>兩次檢測至少間隔（分鐘）</span><input type="number" id="cx-st-cd" min="0" value="' + S.cooldown + '"></label><div class="cx-list">' +
        S.fields.map(function (f, i) {
          return '<div class="cx-card" data-fi="' + i + '" style="display:flex;flex-direction:column;gap:6px"><div class="cx-row"><input class="cx-in" data-fn value="' + esc(f.n) + '" maxlength="12"><button class="cx-x" data-rm="' + i + '" aria-label="刪除"><i class="fas fa-xmark"></i></button></div>' +
            '<select class="cx-sel" data-ft="' + i + '">' + Object.keys(types).map(function (k) { return '<option value="' + k + '"' + (f.t === k ? ' selected' : '') + '>' + types[k] + '</option>'; }).join('') + '</select>' +
            (f.t === 'opt' ? '<input class="cx-in" data-fo placeholder="選項，用逗號分開" value="' + esc((f.o || []).join('，')) + '">' : '') + '</div>';
        }).join('') + '</div><button class="qa-new" data-s="add"><i class="fas fa-plus"></i> 新增項目</button><button class="cx-btn pri" data-s="saveedit">儲存</button>';
      return;
    }
    var last = S.last, h = '';
    if (last) {
      h += '<div class="cx-card"><div class="cx-kv">' + last.v.map(function (r) {
        if (r.t === 'pct') return '<div><div class="k"><span>' + esc(r.n) + '</span><b>' + r.v + '%</b></div><div class="cx-meter"><i style="width:' + r.v + '%"></i></div></div>';
        return '<div class="k"><span>' + esc(r.n) + '</span><b>' + esc(r.v) + '</b></div>';
      }).join('') + '</div><div class="cx-muted" style="margin-top:10px">' + fmtTime(last.at) + ' 檢測 · 僅供娛樂</div></div>';
    } else h += '<div class="cx-muted" style="text-align:center;padding:20px 0">看看 ' + esc(pname()) + ' 現在怎麼樣</div>';
    h += '<button class="cx-btn pri" data-s="scan">開始檢測</button><div class="cx-btns">' + (last ? '<button class="cx-btn" data-s="share">傳到聊天</button>' : '') + '<button class="cx-btn" data-s="hist">記錄</button><button class="cx-btn" data-s="edit">編輯項目</button></div>';
    b.innerHTML = h;
  }

  /* ================= 潮汐（經期紀錄） ================= */
  var CARE_START = ['肚子痛不痛？我幫你揉揉', '記得喝熱水，不准吃冰的', '今天乖乖休息，我陪你', '要不要抱抱？', '暖暖包貼好了嗎？'];
  var CARE_DAY = ['今天還痛嗎？', '多睡一點，我在', '想吃什麼甜的？我買給你', '辛苦了，抱抱'];
  var CARE_SOON = ['你的那個好像快來了，記得帶衛生棉', '這幾天別吃冰的喔，快到了', '快到那幾天了，要好好照顧自己'];
  function periods() {
    var today = ymd(new Date());
    return X.period.list.slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; }).map(function (p) {
      var end = p.end || (diffDays(p.start, today) < X.period.len + 7 ? today : addDays(p.start, X.period.len - 1));
      if (end < p.start) end = p.start;
      return { start: p.start, end: end, open: !p.end };
    });
  }
  function pStats() {
    var ps = periods(), cyc = [], len = [];
    for (var i = 1; i < ps.length; i++) { var c = diffDays(ps[i - 1].start, ps[i].start); if (c >= 15 && c <= 60) cyc.push(c); }
    ps.forEach(function (p) { if (!p.open) len.push(diffDays(p.start, p.end) + 1); });
    var avg = function (a, d) { a = a.slice(-6); return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : d; };
    return { ps: ps, cycle: avg(cyc, X.period.cycle), len: avg(len, X.period.len), n: ps.length };
  }
  function pMap() {
    var st = pStats(), map = {}, today = ymd(new Date());
    st.ps.forEach(function (p) { for (var d = p.start; d <= p.end; d = addDays(d, 1)) map[d] = 'per'; });
    var last = st.ps[st.ps.length - 1];
    if (last) {
      var next = addDays(last.start, st.cycle);
      while (!last.open && diffDays(next, today) > 10) next = addDays(next, st.cycle); // a few days late stays late; long gaps roll forward
      for (var k = 0; k < 4; k++) {
        var s = addDays(next, k * st.cycle);
        for (var j = 0; j < st.len; j++) { var d2 = addDays(s, j); if (!map[d2]) map[d2] = 'pred'; }
        var ov = addDays(s, -14);
        for (var f = -5; f <= 1; f++) { var d3 = addDays(ov, f); if (!map[d3]) map[d3] = f === 0 ? 'ovu' : 'fer'; }
      }
      // ovulation for the current cycle too
      var ov0 = addDays(last.start, st.cycle - 14);
      for (var g = -5; g <= 1; g++) { var d4 = addDays(ov0, g); if (!map[d4]) map[d4] = g === 0 ? 'ovu' : 'fer'; }
      st.next = next;
    }
    st.map = map; return st;
  }
  function pHero(st) {
    var today = ymd(new Date()), cur = st.ps.filter(function (p) { return today >= p.start && today <= p.end; })[0];
    if (cur) return { t: '經期第 ' + (diffDays(cur.start, today) + 1) + ' 天', s: cur.open ? '結束那天記得點「這天結束」' : '' };
    if (!st.ps.length) return { t: '還沒有記錄', s: '點日期，記下月經開始的那天' };
    var d = diffDays(today, st.next);
    if (st.map[today] === 'ovu') return { t: '今天可能是排卵日', s: '下次經期約 ' + d + ' 天後' };
    if (d <= 0) return { t: '可能晚了 ' + (-d) + ' 天', s: '來了記得記錄' };
    return { t: '距離下次經期約 ' + d + ' 天', s: '預計 ' + st.next.slice(5).replace('-', '月') + '日' };
  }
  var pM = null, pMonth = null, pSel = null;
  function pOpen() {
    if (!pM) {
      pM = makeModal('cx-period-modal', 'fa-droplet', '潮汐 · 經期紀錄');
      pM.onBack = function () { if (pM.view !== 'main') { pM.view = 'main'; pRender(); return true; } };
      pM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m) { pMonth.setMonth(pMonth.getMonth() + (+b.dataset.m)); pRender(); return; }
        if (b.dataset.d) { pSel = b.dataset.d; pRender(); return; }
        if (b.dataset.a === 'start') { await pStart(pSel); return; }
        if (b.dataset.a === 'end') { await pEnd(pSel); return; }
        if (b.dataset.a === 'clear') { await pClear(pSel); return; }
        if (b.dataset.flow !== undefined || b.dataset.pain !== undefined) {
          var day = X.period.days[pSel] || (X.period.days[pSel] = {});
          if (b.dataset.flow !== undefined) day.flow = day.flow === b.dataset.flow ? '' : b.dataset.flow;
          if (b.dataset.pain !== undefined) day.pain = day.pain === b.dataset.pain ? '' : b.dataset.pain;
          await save(); pRender(); return;
        }
        if (b.dataset.a === 'stats') { pM.view = 'stats'; pRender(); return; }
        if (b.dataset.a === 'savestats') {
          var c = parseInt(pM.body.querySelector('#cx-p-cyc').value, 10), l = parseInt(pM.body.querySelector('#cx-p-len').value, 10);
          if (c >= 15 && c <= 60) X.period.cycle = c; if (l >= 1 && l <= 15) X.period.len = l;
          X.period.care = pM.body.querySelector('#cx-p-care').checked;
          await save(); toast('已儲存', 'success'); pM.view = 'main'; pRender(); return;
        }
      });
    }
    pM.view = 'main'; pMonth = new Date(); pMonth.setDate(1); pSel = ymd(new Date()); pRender(); pM.open();
  }
  async function pStart(d) {
    var today = ymd(new Date());
    if (d > today) { toast('不能記錄未來的日期', 'warning'); return; }
    X.period.list = X.period.list.filter(function (p) { var e = p.end || addDays(p.start, X.period.len + 6); return !(d >= p.start && d <= e) && p.start !== d; });
    X.period.list.push({ start: d, end: null });
    var careKey = 's' + d;
    if (X.period.care && diffDays(d, today) <= 1 && !X.period.cared[careKey]) { X.period.cared[careKey] = 1; setTimeout(function () { partnerSays(pick(CARE_START)); }, 1500); }
    await save(); pRender();
  }
  async function pEnd(d) {
    var ps = X.period.list.filter(function (p) { return p.start <= d; }).sort(function (a, b) { return a.start < b.start ? 1 : -1; });
    var p = ps[0]; if (!p || diffDays(p.start, d) > 15) { toast('先記錄這次月經開始的日子', 'warning'); return; }
    p.end = d; await save(); pRender();
  }
  async function pClear(d) {
    var before = X.period.list.length;
    X.period.list = X.period.list.filter(function (p) { return p.start !== d; });
    X.period.list.forEach(function (p) { if (p.end === d) p.end = null; });
    delete X.period.days[d];
    if (X.period.list.length !== before) toast('已刪除這次記錄', 'success');
    await save(); pRender();
  }
  function pRender() {
    var b = pM.body, st = pMap();
    if (pM.view === 'stats') {
      var rows = st.ps.slice().reverse().slice(0, 8).map(function (p, i, arr) {
        var next = st.ps[st.ps.indexOf(p) + 1];
        return '<div class="cx-li"><div>' + p.start.slice(5).replace('-', '/') + ' 開始<div class="s">經期 ' + (diffDays(p.start, p.end) + 1) + ' 天' + (p.open ? '（進行中）' : '') + (next ? ' · 週期 ' + diffDays(p.start, next.start) + ' 天' : '') + '</div></div></div>';
      }).join('');
      b.innerHTML = '<div class="cx-stat"><div><b>' + st.cycle + '</b><span>平均週期（天）</span></div><div><b>' + st.len + '</b><span>平均經期（天）</span></div><div><b>' + st.n + '</b><span>記錄次數</span></div></div>' +
        '<div class="cx-sec"><h4>最近幾次</h4><div class="cx-list">' + (rows || '<div class="cx-muted">還沒有記錄</div>') + '</div></div>' +
        '<div class="cx-sec"><h4>預設值（記錄不夠多時用來預測）</h4><label class="cx-row"><span>週期天數</span><input type="number" id="cx-p-cyc" min="15" max="60" value="' + X.period.cycle + '"></label>' +
        '<label class="cx-row"><span>經期天數</span><input type="number" id="cx-p-len" min="1" max="15" value="' + X.period.len + '"></label>' +
        '<label class="qa-chk"><input type="checkbox" id="cx-p-care"' + (X.period.care ? ' checked' : '') + '>' + esc(pname()) + ' 會在經期前後關心你</label></div>' +
        '<button class="cx-btn pri" data-a="savestats">儲存</button><div class="cx-muted">預測只是依記錄推算，僅供參考，不能用來避孕或診斷。</div>';
      return;
    }
    var hero = pHero(st), today = ymd(new Date()), y = pMonth.getFullYear(), mo = pMonth.getMonth();
    var first = new Date(y, mo, 1), startDow = first.getDay(), days = new Date(y, mo + 1, 0).getDate();
    var h = '<div class="cx-hero"><span>今天</span><b>' + esc(hero.t) + '</b><span>' + esc(hero.s) + '</span></div>' +
      '<div class="cx-cal-h"><button class="cx-x" data-m="-1" aria-label="上個月"><i class="fas fa-chevron-left"></i></button><b>' + y + ' 年 ' + (mo + 1) + ' 月</b><button class="cx-x" data-m="1" aria-label="下個月"><i class="fas fa-chevron-right"></i></button></div>' +
      '<div class="cx-cal">' + ['日', '一', '二', '三', '四', '五', '六'].map(function (w) { return '<div class="w">' + w + '</div>'; }).join('');
    for (var i = 0; i < startDow; i++) h += '<div></div>';
    for (var d = 1; d <= days; d++) {
      var k = y + '-' + pad(mo + 1) + '-' + pad(d), cls = st.map[k] || '';
      if (k === today) cls += ' today'; if (k === pSel) cls += ' sel';
      h += '<button class="' + cls + '" data-d="' + k + '">' + d + '</button>';
    }
    h += '</div><div class="cx-legend"><span><i style="background:#e86a7a"></i>經期</span><span><i style="border:1.5px dashed #e86a7a"></i>預測</span><span><i style="background:#9b78d2"></i>排卵日</span><span><i style="background:rgba(155,120,210,.3)"></i>易孕期</span></div>';
    var sel = pSel, inPer = st.map[sel] === 'per', isStart = X.period.list.some(function (p) { return p.start === sel; }), day = X.period.days[sel] || {};
    h += '<div class="cx-card" style="display:flex;flex-direction:column;gap:10px"><b style="font-size:14px;color:var(--text-primary)">' + (+sel.slice(5, 7)) + '月' + (+sel.slice(8)) + '日' + (sel === today ? '（今天）' : '') + '</b><div class="cx-btns">' +
      (!inPer ? '<button class="cx-btn pri" data-a="start">月經這天來了</button>' : '') +
      (inPer && !isStart ? '<button class="cx-btn" data-a="end">這天結束</button>' : '') +
      (isStart ? '<button class="cx-btn warn" data-a="clear">刪除這次記錄</button>' : '') + '</div>';
    if (inPer) {
      h += '<div class="cx-muted">流量</div><div class="cx-chips">' + ['少', '中', '多'].map(function (f) { return '<button data-flow="' + f + '" class="' + (day.flow === f ? 'on' : '') + '">' + f + '</button>'; }).join('') + '</div>' +
        '<div class="cx-muted">痛經</div><div class="cx-chips">' + ['不痛', '輕微', '中等', '很痛'].map(function (f) { return '<button data-pain="' + f + '" class="' + (day.pain === f ? 'on' : '') + '">' + f + '</button>'; }).join('') + '</div>';
    }
    h += '</div><button class="qa-link" data-a="stats" style="align-self:center">週期分析與設定</button>';
    b.innerHTML = h;
  }
  function periodCare() {
    if (!X.period.care) return false;
    var st = pMap(), today = ymd(new Date()), cur = st.ps.filter(function (p) { return today >= p.start && today <= p.end && p.open; })[0], changed = false;
    if (cur && today !== cur.start && !X.period.cared['d' + today] && diffDays(cur.start, today) < 4) { X.period.cared['d' + today] = 1; partnerSays(pick(CARE_DAY)); changed = true; }
    if (!cur && st.next && diffDays(today, st.next) === 2 && !X.period.cared['n' + st.next]) { X.period.cared['n' + st.next] = 1; partnerSays(pick(CARE_SOON)); changed = true; }
    var keys = Object.keys(X.period.cared); if (keys.length > 120) keys.sort().slice(0, keys.length - 120).forEach(function (k) { delete X.period.cared[k]; });
    return changed;
  }

  /* ================= 陪伴中心 ================= */
  var cM = null, cState = {}, cTimer = null;
  function compOpen() {
    if (!cM) {
      cM = makeModal('cx-comp-modal', 'fa-headphones', '陪伴中心');
      cM.onBack = function () { if (cM.view !== 'hub') { compStop(); cM.view = cM.view === 'reader' ? 'books' : 'hub'; compRender(); return true; } };
      cM.onClose = compStop;
      cM.body.addEventListener('click', compClick);
      cM.body.addEventListener('change', compChange);
    }
    cM.view = 'hub'; compRender(); cM.open();
  }
  function compStop() {
    clearInterval(cTimer); cTimer = null;
    var media = cM && cM.body.querySelector('audio,video'); if (media) { try { media.pause(); } catch (e) {} }
    if (cState.url && cState.url.indexOf('blob:') === 0) URL.revokeObjectURL(cState.url);
    if (cState.started) {
      var mins = Math.max(1, Math.round((Date.now() - cState.started) / 60e3));
      X.comp.history.unshift({ k: cState.kind, t: cState.title, at: cState.started, min: mins }); X.comp.history = X.comp.history.slice(0, 40); save();
    }
    cState = {};
  }
  function ytId(u) { var m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/.exec(u); return m && m[1]; }
  function bvId(u) { var m = /(BV[0-9A-Za-z]{10})/.exec(u); return m && m[1]; }
  function compRender() {
    var b = cM.body, v = cM.view, p = esc(pname());
    if (v === 'hub') {
      b.innerHTML = '<div class="cx-hub"><button data-c="listen"><i class="fas fa-music"></i><div><b>一起聽歌</b><span>和 ' + p + ' 一起聽一首歌</span></div></button>' +
        '<button data-c="watch"><i class="fas fa-film"></i><div><b>一起看影片</b><span>邊看邊聽 ' + p + ' 的彈幕</span></div></button>' +
        '<button data-c="books"><i class="fas fa-book-open"></i><div><b>一起看小說</b><span>上傳 txt，和 ' + p + ' 共讀</span></div></button></div>' +
        (X.comp.history.length ? '<div class="cx-sec"><h4>最近一起做的事</h4><div class="cx-list">' + X.comp.history.slice(0, 6).map(function (h) { return '<div class="cx-li"><div>' + ({ listen: '🎵 ', watch: '🎬 ', read: '📖 ' }[h.k] || '') + esc(h.t) + '<div class="s">' + fmtTime(h.at) + ' · ' + h.min + ' 分鐘</div></div></div>'; }).join('') + '</div></div>' : '');
      return;
    }
    if (v === 'listen' || v === 'watch') {
      var isV = v === 'watch';
      b.innerHTML = '<div class="cx-sec"><h4>' + (isV ? '選一部影片' : '選一首歌') + '</h4>' +
        '<label class="cx-btn" style="text-align:center"><i class="fas fa-folder-open"></i> 從手機／電腦選檔案<input type="file" id="cx-c-file" accept="' + (isV ? 'video/*' : 'audio/*') + '" hidden></label>' +
        '<div class="cx-muted" style="text-align:center">或貼上連結' + (isV ? '（YouTube、Bilibili 或影片檔網址）' : '（mp3 等音樂檔網址）') + '</div>' +
        '<input class="cx-in" id="cx-c-url" placeholder="https://"><input class="cx-in" id="cx-c-title" placeholder="' + (isV ? '影片名稱（可不填）' : '歌名（可不填）') + '" maxlength="40">' +
        '<button class="cx-btn pri" data-c="go">' + (isV ? '🎬 邀請 ' + p + ' 一起看' : '🎵 邀請 ' + p + ' 一起聽') + '</button>' +
        '<div class="cx-muted">選的檔案只在這次播放，不會上傳或同步。請只播放你有權使用的內容。</div></div>';
      return;
    }
    if (v === 'room') {
      var k = cState.kind, media = '';
      if (cState.embed) media = '<div class="cx-stage"><iframe src="' + esc(cState.embed) + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>';
      else if (k === 'watch') media = '<div class="cx-stage"><video src="' + esc(cState.url) + '" controls playsinline></video></div>';
      else media = '<audio src="' + esc(cState.url) + '" controls></audio>';
      b.innerHTML = '<div class="cx-muted" style="text-align:center">' + (k === 'watch' ? '🎬 和 ' : '🎵 和 ') + p + ' 一起' + (k === 'watch' ? '看' : '聽') + '《' + esc(cState.title) + '》</div>' +
        '<div class="cx-player">' + media + '</div><div class="cx-feed" id="cx-feed">' + sayHtml(k === 'watch' ? '來了來了，我準備好了' : '好啊，一起聽') + '</div>' +
        '<label class="qa-chk"><input type="checkbox" id="cx-c-chat"' + (cState.toChat ? ' checked' : '') + '>把 ' + p + ' 說的話也傳到聊天</label>';
      compLive();
      return;
    }
    if (v === 'books') {
      var books = X.comp.books;
      b.innerHTML = '<div class="cx-sec"><h4>我的書架</h4><div class="cx-list">' + (books.length ? books.map(function (bk) {
        return '<div class="cx-li"><div><b style="font-weight:600">' + esc(bk.title) + '</b><div class="s">第 ' + (bk.ch + 1) + ' / ' + bk.n + ' 章</div></div><button class="cx-btn" data-book="' + bk.id + '">繼續讀</button><button class="cx-x" data-delbook="' + bk.id + '" aria-label="刪除"><i class="fas fa-trash"></i></button></div>';
      }).join('') : '<div class="cx-muted">書架是空的，上傳一本 txt 開始共讀吧</div>') + '</div></div>' +
        '<label class="cx-btn" style="text-align:center"><i class="fas fa-file-arrow-up"></i> 上傳 txt<input type="file" id="cx-c-txt" accept=".txt,text/plain" hidden></label>' +
        '<details><summary class="cx-muted" style="cursor:pointer">或貼上文字</summary><div class="cx-sec" style="margin-top:8px"><input class="cx-in" id="cx-c-btitle" placeholder="書名" maxlength="40"><textarea class="cx-ta" id="cx-c-btext" placeholder="把內容貼在這裡"></textarea><button class="cx-btn pri" data-c="paste">加入書架</button></div></details>' +
        '<div class="cx-muted">請只匯入你有權閱讀的文字，書會存在你的裝置並同步，只有你看得到。</div>';
      return;
    }
    if (v === 'reader') {
      var bk2 = cState.book, chap = cState.chapters[bk2.ch] || { t: '', body: '' };
      b.innerHTML = '<div class="cx-btns"><select class="cx-sel" id="cx-c-ch">' + cState.chapters.map(function (c, i) { return '<option value="' + i + '"' + (i === bk2.ch ? ' selected' : '') + '>' + esc(c.t || ('第 ' + (i + 1) + ' 節')) + '</option>'; }).join('') + '</select></div>' +
        '<div class="cx-btns"><button class="cx-btn" data-c="fs-">A−</button><button class="cx-btn" data-c="fs+">A＋</button></div>' +
        '<div class="cx-reader" style="--cx-fs:' + (X.comp.fs || 17) + 'px"><h3>' + esc(chap.t) + '</h3>' + esc(chap.body) + '</div>' +
        '<div class="cx-btns"><button class="cx-btn" data-c="prev"' + (bk2.ch <= 0 ? ' disabled' : '') + '>← 上一章</button><button class="cx-btn" data-c="next"' + (bk2.ch >= cState.chapters.length - 1 ? ' disabled' : '') + '>下一章 →</button></div>' +
        '<div class="cx-float" id="cx-feed">' + sayHtml(cState.say || line(X.comp.lines.read)) + '</div>';
      setTimeout(function () { var body = cM.body; if (cState.scroll) body.scrollTop = cState.scroll * (body.scrollHeight - body.clientHeight); cState.scroll = 0; }, 30);
      compLive();
    }
  }
  function compSay(text) {
    var feed = cM.body.querySelector('#cx-feed'); if (!feed) return;
    if (cState.kind === 'read') { feed.innerHTML = sayHtml(text); cState.say = text; }
    else { feed.insertAdjacentHTML('beforeend', sayHtml(text)); feed.scrollTop = feed.scrollHeight; }
    if (cState.kind === 'watch') {
      var stage = cM.body.querySelector('.cx-stage');
      if (stage) { var d = document.createElement('div'); d.className = 'cx-dm'; d.textContent = text; d.style.top = (8 + Math.random() * 60) + '%'; d.style.left = '100%'; stage.appendChild(d); setTimeout(function () { d.remove(); }, 8500); }
    }
    if (cState.toChat && cState.kind !== 'read') partnerSays(text);
  }
  function compLive() {
    clearInterval(cTimer);
    var lines = X.comp.lines[cState.kind === 'watch' ? 'watch' : cState.kind === 'read' ? 'read' : 'listen'];
    var gap = cState.kind === 'watch' ? [15, 40] : cState.kind === 'read' ? [90, 180] : [35, 80], next = Date.now() + rnd(gap[0], gap[1]) * 1000;
    cTimer = setInterval(function () {
      if (!cM.isOpen()) return;
      var media = cM.body.querySelector('audio,video');
      if (media && media.paused) { next = Date.now() + rnd(gap[0], gap[1]) * 1000; return; }
      if (Date.now() >= next) { compSay(line(lines)); next = Date.now() + rnd(gap[0], gap[1]) * 1000; }
    }, 1000);
  }
  function startRoom(kind, url, title, embed) {
    cState = { kind: kind, url: url, title: title || (kind === 'watch' ? '一部影片' : '一首歌'), embed: embed || null, started: Date.now(), toChat: false };
    iSay((kind === 'watch' ? '🎬 一起看《' : '🎵 一起聽《') + cState.title + '》吧');
    cM.view = 'room'; compRender();
  }
  async function compClick(e) {
    var b = e.target.closest('button'); if (!b) return; var c = b.dataset.c;
    if (c === 'listen' || c === 'watch' || c === 'books') { cM.view = c; compRender(); return; }
    if (c === 'go') {
      var kind = cM.view, url = cM.body.querySelector('#cx-c-url').value.trim(), title = cM.body.querySelector('#cx-c-title').value.trim();
      if (!/^https?:\/\//.test(url)) { toast('請選一個檔案，或貼上 https:// 開頭的連結', 'warning'); return; }
      var embed = null;
      if (kind === 'watch') { var y = ytId(url), bv = bvId(url); if (y) embed = 'https://www.youtube.com/embed/' + y + '?autoplay=1&playsinline=1'; else if (bv) embed = 'https://player.bilibili.com/player.html?bvid=' + bv + '&autoplay=1'; }
      startRoom(kind, url, title || (embed ? '' : decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/\.[a-z0-9]+$/i, '').slice(0, 40)), embed); return;
    }
    if (c === 'paste') {
      var t = cM.body.querySelector('#cx-c-btext').value, n = cM.body.querySelector('#cx-c-btitle').value.trim() || '未命名的書';
      if (t.trim().length < 20) { toast('內容太短了', 'warning'); return; }
      await addBook(n, t); return;
    }
    if (b.dataset.book) { await openBook(b.dataset.book); return; }
    if (b.dataset.delbook) {
      if (!(await confirmAsync('從書架刪除這本書？'))) return;
      var id = b.dataset.delbook; X.comp.books = X.comp.books.filter(function (x) { return x.id !== id; });
      try { await localforage.removeItem(key('cxBook_' + id)); } catch (er) {}
      await save(); compRender(); return;
    }
    if (c === 'prev' || c === 'next') { cState.book.ch += c === 'next' ? 1 : -1; cState.say = line(X.comp.lines.read); bookSave(); compRender(); cM.body.scrollTop = 0; return; }
    if (c === 'fs-' || c === 'fs+') { X.comp.fs = Math.max(13, Math.min(26, (X.comp.fs || 17) + (c === 'fs+' ? 1 : -1))); save(); var r = cM.body.querySelector('.cx-reader'); if (r) r.style.setProperty('--cx-fs', X.comp.fs + 'px'); }
  }
  async function compChange(e) {
    var t = e.target;
    if (t.id === 'cx-c-file' && t.files[0]) { var f = t.files[0]; startRoom(cM.view, URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, '').slice(0, 40)); return; }
    if (t.id === 'cx-c-chat') { cState.toChat = t.checked; return; }
    if (t.id === 'cx-c-ch') { cState.book.ch = +t.value; cState.say = line(X.comp.lines.read); bookSave(); compRender(); cM.body.scrollTop = 0; return; }
    if (t.id === 'cx-c-txt' && t.files[0]) {
      var file = t.files[0];
      if (file.size > 15e6) { toast('檔案太大（超過 15MB）', 'warning'); return; }
      var buf = await file.arrayBuffer(), text = new TextDecoder('utf-8').decode(buf);
      if ((text.match(/�/g) || []).length > 20) { try { text = new TextDecoder('gb18030').decode(buf); } catch (er) {} }
      if ((text.match(/�/g) || []).length > 20) { try { text = new TextDecoder('big5').decode(buf); } catch (er) {} }
      await addBook(file.name.replace(/\.[^.]+$/, ''), text);
    }
  }
  function splitChapters(text) {
    text = text.replace(/\r\n?/g, '\n');
    var re = /^[ \t　]*(第[0-9０-９零〇一二三四五六七八九十百千兩两]+[章回節节卷集部篇].{0,30}|序章|楔子|尾聲|尾声|後記|后记|番外.{0,20})[ \t]*$/gm, idx = [], m;
    while ((m = re.exec(text))) idx.push({ at: m.index, t: m[1].trim() });
    var out = [];
    if (idx.length >= 2) {
      if (idx[0].at > 50) out.push({ t: '開始', body: text.slice(0, idx[0].at).trim() });
      idx.forEach(function (c, i) { var end = i + 1 < idx.length ? idx[i + 1].at : text.length; out.push({ t: c.t, body: text.slice(c.at + text.slice(c.at).indexOf('\n') + 1 || c.at, end).trim() }); });
    } else {
      for (var i = 0, n = 1; i < text.length; n++) { var end2 = Math.min(text.length, i + 6000); var nl = text.lastIndexOf('\n', end2); if (nl > i + 2000 && end2 < text.length) end2 = nl; out.push({ t: '第 ' + n + ' 節', body: text.slice(i, end2).trim() }); i = end2; }
    }
    return out.filter(function (c) { return c.body || c.t; });
  }
  async function addBook(title, text) {
    var ch = splitChapters(text); if (!ch.length) { toast('讀不到內容', 'warning'); return; }
    var id = 'b' + Date.now().toString(36);
    try { await localforage.setItem(key('cxBook_' + id), { title: title, chapters: ch }); } catch (e) { toast('書太大，存不下', 'error'); return; }
    X.comp.books.unshift({ id: id, title: title, n: ch.length, ch: 0, at: Date.now() }); await save();
    toast('已加入書架，共 ' + ch.length + ' 章', 'success'); await openBook(id);
  }
  async function openBook(id) {
    var meta = X.comp.books.find(function (x) { return x.id === id; }); if (!meta) return;
    var data = null; try { data = await localforage.getItem(key('cxBook_' + id)); } catch (e) {}
    if (!data || !data.chapters) { toast('這本書的內容還沒同步到這台裝置', 'warning'); return; }
    cState = { kind: 'read', title: meta.title, book: meta, chapters: data.chapters, started: Date.now(), scroll: meta.scroll || 0 };
    cM.view = 'reader'; compRender();
  }
  var bookSaveT = null;
  function bookSave() { clearTimeout(bookSaveT); bookSaveT = setTimeout(function () { if (cState.book) { var body = cM.body; cState.book.scroll = body.scrollHeight > body.clientHeight ? body.scrollTop / (body.scrollHeight - body.clientHeight) : 0; cState.book.at = Date.now(); save(); } }, 1500); }
  document.addEventListener('scroll', function (e) { if (cM && e.target === cM.body && cM.view === 'reader') bookSave(); }, true);

  /* ================= 連結狀態 ================= */
  var LINKS = [['共鳴中', 5], ['連結穩定', 4], ['心意相通', 5], ['夢境相連', 5], ['心跳同頻', 4], ['能量交匯', 4], ['正在連接…', 3], ['努力靠近中', 3], ['訊號微弱', 1], ['頻率校準中', 3], ['斷斷續續', 2], ['正在搜尋…', 2], ['若有若無', 1], ['努力中…', 2]];
  var LINK_EVERY = { m15: ['10～20 分鐘', 10, 20], m45: ['30～60 分鐘', 30, 60], h1: ['1～2 小時', 60, 120], h3: ['2～3 小時', 120, 180] };
  function linkList() { var l = Array.isArray(X.link.list) && X.link.list.length ? X.link.list : LINKS; return l; }
  function linkNext() { var e = LINK_EVERY[X.link.every] || LINK_EVERY.h1; X.link.next = Date.now() + rnd(e[1], e[2]) * 60e3; }
  function linkTick() {
    var L = linkList();
    if (X.link.i >= L.length) X.link.i = 0;
    if (Date.now() < (X.link.next || 0)) return false;
    var i; do { i = Math.floor(Math.random() * L.length); } while (i === X.link.i && L.length > 1);
    X.link.i = i; linkNext(); return true;
  }
  function linkRender() {
    var host = document.querySelector('#partner-status'); if (!host) return;
    var el = document.getElementById('cx-link');
    if (!X.link.on) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'cx-link'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.addEventListener('click', function (e) { e.stopPropagation(); var L = linkList()[X.link.i] || linkList()[0]; toast('與 ' + pname() + ' 的連結：' + L[0] + '（' + L[1] + ' / 5）· ' + fmtLeft(X.link.next - Date.now()) + '更新', 'info'); });
      host.parentNode.insertBefore(el, host.nextSibling);
    }
    var L = linkList()[X.link.i] || linkList()[0], hearts = '';
    for (var k = 1; k <= 5; k++) hearts += '<i class="' + (k <= L[1] ? 'on' : '') + '"></i>';
    el.className = 'lv' + L[1]; el.title = '連結狀態：' + L[0];
    el.innerHTML = '<span class="hs">' + hearts + '</span><span class="tx">' + esc(L[0]) + '</span>';
  }
  function fmtLeft(ms) { var m = Math.max(1, Math.round(ms / 60e3)); return m < 60 ? '約 ' + m + ' 分鐘後' : '約 ' + Math.round(m / 6) / 10 + ' 小時後'; }

  /* ================= 他的日記 ================= */
  var MOODS = ['開心', '想你', '有點累', '平靜', '甜甜的', '想見你', '安心', '有點寂寞'];
  var WEATHERS = ['晴', '多雲', '小雨', '陰', '起風', '晴轉多雲'];
  var SKIP_GROUPS = ['日期暗號', '身體部位', '顏文字', '連結暗號', '月份'];
  function diaryPool() {
    var off = {}; replyGroups().forEach(function (g) { if (g.disabled || SKIP_GROUPS.indexOf(g.name) >= 0) g.items.forEach(function (t) { off[t] = 1; }); });
    return cards().filter(function (t) { return !off[t] && t.length >= 3; });
  }
  function diaryText() {
    var pool = diaryPool(); if (pool.length < 3) return '';
    var n = Math.round(rnd(4, 8)), used = [], out = '';
    for (var i = 0; i < n && used.length < pool.length; i++) {
      var t; do { t = pick(pool); } while (used.indexOf(t) >= 0); used.push(t);
      var end = /[。！？!?…~～)）✧]$/.test(t) ? '' : (Math.random() < 0.15 ? '……' : Math.random() < 0.2 ? '！' : '。');
      out += t + end + (Math.random() < 0.3 && i < n - 1 ? '\n' : '');
    }
    return out;
  }
  function diaryDue() { var p = (X.diary.time || '22:00').split(':'), d = new Date(); d.setHours(+p[0] || 0, +p[1] || 0, 0, 0); return d.getTime(); }
  function diaryUnread() { return X ? X.diary.entries.filter(function (e) { return !e.read; }).length : 0; }
  function diaryTick() {
    if (!X.diary.on) return false;
    var today = ymd(new Date());
    if (Date.now() < diaryDue() || X.diary.entries.some(function (e) { return e.d === today; })) return false;
    var text = diaryText(); if (!text) return false;
    // answer yesterday's note, if you left one
    var last = X.diary.entries.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; })[0];
    if (last && last.note && !last.reply) last.reply = pick(diaryPool()) || '看到了';
    X.diary.entries.push({ d: today, at: Date.now(), mood: pick(MOODS), weather: pick(WEATHERS), text: text, read: false });
    if (X.diary.entries.length > 400) X.diary.entries = X.diary.entries.slice(-400);
    sound(); toast(pname() + ' 寫好今天的日記了', 'success'); sysNotify(pname(), '寫好今天的日記了 📔', 'diary');
    return true;
  }
  var dM = null;
  function diaryOpen() {
    if (!dM) {
      dM = makeModal('cx-diary-modal', 'fa-book', pname() + ' 的日記');
      dM.body.addEventListener('change', async function (e) {
        var t = e.target;
        if (t.id === 'cx-d-on') X.diary.on = t.checked;
        else if (t.id === 'cx-d-time' && /^\d{2}:\d{2}$/.test(t.value)) X.diary.time = t.value;
        else return;
        await save(); diaryRender();
      });
      dM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.note) {
          var en = X.diary.entries.find(function (x) { return x.d === b.dataset.note; }); var inp = dM.body.querySelector('#cx-dn-' + b.dataset.note);
          var v = inp ? inp.value.trim() : ''; if (!en || !v) return;
          en.note = v; en.noteAt = Date.now(); delete en.reply; await save(); toast(pname() + ' 明天寫日記時會看到', 'success'); diaryRender(); return;
        }
        if (b.dataset.deld) {
          if (!(await confirmAsync('刪除這篇日記？'))) return;
          X.diary.entries = X.diary.entries.filter(function (x) { return x.d !== b.dataset.deld; }); await save(); diaryRender(); refreshBadge();
        }
      });
    }
    dM.el.querySelector('.modal-title span').textContent = pname() + ' 的日記';
    diaryRender(); dM.open();
    var changed = false; X.diary.entries.forEach(function (e) { if (!e.read) { e.read = true; changed = true; } });
    if (changed) { save(); refreshBadge(); }
  }
  function diaryRender() {
    var D = X.diary, list = D.entries.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; }), today = ymd(new Date());
    var has = list.length && list[0].d === today;
    var h = '<div class="cx-card" style="display:flex;flex-direction:column;gap:8px"><label class="qa-chk"><input type="checkbox" id="cx-d-on"' + (D.on ? ' checked' : '') + '>每天固定時間寫一篇</label>' +
      '<label class="cx-row"><span>每天幾點收到</span><input type="time" id="cx-d-time" value="' + esc(D.time) + '" class="cx-in" style="width:auto"></label>' +
      '<div class="cx-muted">' + (!D.on ? '已暫停' : has ? '今天的已經寫好了，明天 ' + esc(D.time) + ' 再來看' : '今天的日記 ' + esc(D.time) + ' 寫好') + '。日記從你的字卡裡寫，你可以在下面留言，' + esc(pname()) + ' 寫下一篇時會回你。</div></div>';
    if (!list.length) h += '<div class="cx-muted" style="text-align:center;padding:16px 0">還沒有日記</div>';
    list.forEach(function (e) {
      var dt = parseYmd(e.d), wk = '日一二三四五六'.charAt(dt.getDay());
      h += '<div class="cx-card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:15px;color:var(--text-primary)">' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日 星期' + wk + '</b><span class="cx-muted">' + esc(e.weather) + ' · ' + esc(e.mood) + '</span></div>' +
        '<div style="font-size:15px;line-height:1.9;color:var(--text-primary);white-space:pre-wrap;word-break:break-word;font-family:var(--font-family,serif)">' + esc(e.text) + '</div>';
      if (e.note) h += '<div class="cx-muted" style="border-left:2px solid var(--accent-color);padding-left:8px">我：' + esc(e.note) + (e.reply ? '<br>' + esc(pname()) + '：' + esc(e.reply) : '') + '</div>';
      else h += '<div class="qa-own" style="margin-top:0"><input type="text" id="cx-dn-' + e.d + '" placeholder="留言給 ' + esc(pname()) + '" maxlength="100"><button data-note="' + e.d + '">留言</button></div>';
      h += '<div class="qa-meta" style="margin-top:0"><span></span><span><button data-deld="' + e.d + '">刪除</button></span></div></div>';
    });
    dM.body.innerHTML = h;
  }

  /* ================= 回覆與來信設定 ================= */
  var sM = null;
  var JOINS = ['，', '…', '、', '～', '。', '！', '/', '　'];
  function setOpen() {
    if (!sM) {
      sM = makeModal('cx-set-modal', 'fa-wand-magic-sparkles', '回覆與來信');
      sM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.j !== undefined) { var j = b.dataset.j, i = X.combine.joins.indexOf(j); if (i >= 0) X.combine.joins.splice(i, 1); else X.combine.joins.push(j); await save(); setRender(); return; }
        if (b.dataset.cg !== undefined) { var cur = comboGroups(), n = b.dataset.cg; if (n === '') cur = []; else { var ix = cur.indexOf(n); if (ix >= 0) cur.splice(ix, 1); else cur.push(n); } X.combine.groups = cur; await save(); setRender(); return; }
        if (b.dataset.a === 'savelink') {
          var rows = sM.body.querySelector('#cx-link-list').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
            var m = /^(.*?)[\s　]*([1-5１-５])$/.exec(x); var lv = m ? +String(m[2]).replace(/[１-５]/, function (c) { return c.charCodeAt(0) - 0xFF10; }) : 3; var t = (m ? m[1] : x).trim().slice(0, 12);
            return t ? [t, lv] : null; }).filter(Boolean);
          if (!rows.length) { toast('至少要一個狀態', 'warning'); return; }
          X.link.list = rows; X.link.i = 0; X.link.next = 0; linkTick(); await save(); linkRender(); setRender(); toast('已儲存 ' + rows.length + ' 個狀態', 'success'); return;
        }
        if (b.dataset.a === 'savehang') { var hl = sM.body.querySelector('#cx-hang-lines').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (!hl.length) { toast('至少要一句', 'warning'); return; } X.hang.lines = hl; await save(); setRender(); toast('已儲存 ' + hl.length + ' 句', 'success'); return; }
        if (b.dataset.a === 'resethang') { X.hang.lines = null; await save(); setRender(); return; }
        if (b.dataset.a === 'resetlink') { X.link.list = null; X.link.next = 0; linkTick(); await save(); linkRender(); setRender(); return; }
        if (b.dataset.a === 'linknow') { X.link.next = 0; linkTick(); await save(); linkRender(); var L = linkList()[X.link.i]; toast('現在：' + L[0], 'success'); return; }
        if (b.dataset.a === 'preview') { var pool = comboPool(); var out = pool.length >= 2 ? buildCombos(pool, 3) : []; sM.body.querySelector('#cx-prev').innerHTML = out.length ? out.map(function (x) { return sayHtml(x); }).join('') : '<div class="cx-muted">字卡至少要 2 張</div>'; }
      });
      sM.body.addEventListener('change', async function (e) {
        var t = e.target;
        if (t.id === 'cx-cb-on') X.combine.on = t.checked;
        else if (t.id === 'cx-cb-min') X.combine.min = Math.max(1, Math.min(6, parseInt(t.value, 10) || 2));
        else if (t.id === 'cx-cb-max') X.combine.max = Math.max(1, Math.min(6, parseInt(t.value, 10) || 3));
        else if (t.id === 'cx-lt') { X.letters.freq = t.value; scheduleLetter(); }
        else if (t.id === 'cx-rpc') X.rp.chance = parseFloat(t.value) || 0;
        else if (t.id === 'cx-link-on') { X.link.on = t.checked; linkRender(); }
        else if (t.id === 'cx-link-every') { X.link.every = t.value; linkNext(); }
        else if (t.id === 'cx-hang-on') X.hang.on = t.checked;
        else if (t.id === 'cx-hang-say') X.hang.say = t.checked;
        else if (t.id === 'cx-hang-min') { X.hang.min = Math.max(1, Math.min(600, parseInt(t.value, 10) || 5)); if (X.hang.max < X.hang.min) X.hang.max = X.hang.min; }
        else if (t.id === 'cx-hang-max') { X.hang.max = Math.max(1, Math.min(600, parseInt(t.value, 10) || 30)); if (X.hang.min > X.hang.max) X.hang.min = X.hang.max; }
        else if (t.id === 'cx-hang-lines') return;
        else if (t.id === 'cx-link-list') return;
        else return;
        if (X.combine.max < X.combine.min) X.combine.max = X.combine.min;
        await save(); setRender();
      });
    }
    setRender(); sM.open();
  }
  function setRender() {
    var c = X.combine, nxt = X.letters.next;
    sM.body.innerHTML = '<div class="cx-sec"><h4>拼字卡模式</h4><label class="qa-chk"><input type="checkbox" id="cx-cb-on"' + (c.on ? ' checked' : '') + '>開啟：每次回覆抽好幾張字卡接成一句話</label>' +
      '<label class="cx-row"><span>最少幾張</span><input type="number" id="cx-cb-min" min="1" max="6" value="' + c.min + '"></label>' +
      '<label class="cx-row"><span>最多幾張</span><input type="number" id="cx-cb-max" min="1" max="6" value="' + c.max + '"></label>' +
      '<div class="cx-muted">連接符號（可多選，每次隨機用一個）</div><div class="cx-chips">' + JOINS.map(function (j) { return '<button data-j="' + esc(j) + '" class="' + (c.joins.indexOf(j) >= 0 ? 'on' : '') + '">' + (j === '　' ? '空格' : esc(j)) + '</button>'; }).join('') + '</div>' +
      '<div class="cx-muted">用哪些分組來拼（不選就用全部字卡；關掉的分組也能拿來拼）</div><div class="cx-chips">' +
      '<button data-cg="" class="' + (comboGroups().length ? '' : 'on') + '">全部字卡</button>' +
      replyGroups().map(function (g) { return '<button data-cg="' + esc(g.name) + '" class="' + (comboGroups().indexOf(g.name) >= 0 ? 'on' : '') + '">' + esc(g.name) + '</button>'; }).join('') + '</div>' +
      '<div class="cx-muted">現在可以抽的字卡：' + comboPool().length + ' 張</div>' +
      '<button class="cx-btn" data-a="preview">預覽看看</button><div id="cx-prev" class="cx-list"></div></div>' +
      '<div class="cx-sec"><h4>主動來信</h4><select class="cx-sel" id="cx-lt">' + Object.keys(LETTER_FREQ).map(function (k) { return '<option value="' + k + '"' + (X.letters.freq === k ? ' selected' : '') + '>' + LETTER_FREQ[k].label + '</option>'; }).join('') + '</select>' +
      (X.letters.freq !== 'off' && nxt ? '<div class="cx-muted">下一封大約在 ' + fmtTime(nxt) + ' 寄到信封投遞</div>' : '<div class="cx-muted">' + esc(pname()) + ' 會用你的字卡寫信，自己寄到「信封投遞」</div>') + '</div>' +
      '<div class="cx-sec"><h4>連結狀態</h4><label class="qa-chk"><input type="checkbox" id="cx-link-on"' + (X.link.on ? ' checked' : '') + '>在 ' + esc(pname()) + ' 的頭像下面顯示連結狀態</label>' +
      '<label class="cx-row"><span>多久變一次</span><select class="cx-sel" id="cx-link-every" style="width:auto">' + Object.keys(LINK_EVERY).map(function (k) { return '<option value="' + k + '"' + (X.link.every === k ? ' selected' : '') + '>' + LINK_EVERY[k][0] + '</option>'; }).join('') + '</select></label>' +
      '<div class="cx-muted">狀態文字，一行一個，後面寫幾顆心（1～5），例如「共鳴中 5」。沒寫數字就是 3 顆。</div>' +
      '<textarea class="cx-ta" id="cx-link-list" style="min-height:160px">' + esc(linkList().map(function (x) { return x[0] + ' ' + x[1]; }).join('\n')) + '</textarea>' +
      '<div class="cx-btns"><button class="cx-btn pri" data-a="savelink">儲存狀態</button><button class="cx-btn" data-a="resetlink">恢復預設</button><button class="cx-btn" data-a="linknow">現在換一個</button></div></div>' +
      '<div class="cx-sec"><h4>' + esc(pname()) + ' 發紅包給你</h4><select class="cx-sel" id="cx-rpc">' + [[0, '不要發'], [0.03, '偶爾'], [0.08, '常常']].map(function (o) { return '<option value="' + o[0] + '"' + (Math.abs(X.rp.chance - o[0]) < 1e-6 ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="cx-sec"><h4>' + esc(pname()) + ' 自己掛電話</h4><label class="qa-chk"><input type="checkbox" id="cx-hang-on"' + (X.hang.on ? ' checked' : '') + '>通話中 ' + esc(pname()) + ' 會在隨機的時間自己掛斷（關掉就只有你能掛）</label>' +
      '<label class="cx-row"><span>最快幾分鐘後</span><input type="number" id="cx-hang-min" min="1" max="600" value="' + X.hang.min + '"></label>' +
      '<label class="cx-row"><span>最慢幾分鐘後</span><input type="number" id="cx-hang-max" min="1" max="600" value="' + X.hang.max + '"></label>' +
      '<label class="qa-chk"><input type="checkbox" id="cx-hang-say"' + (X.hang.say ? ' checked' : '') + '>掛斷前先說一句話</label>' +
      '<div class="cx-muted">掛斷前會說的話，一行一句，每次隨機挑一句</div><textarea class="cx-ta" id="cx-hang-lines">' + esc(hangLines().join('\n')) + '</textarea>' +
      '<div class="cx-btns"><button class="cx-btn pri" data-a="savehang">儲存這些話</button><button class="cx-btn" data-a="resethang">恢復預設</button></div></div>';
  }

  /* ================= 角標 + 定時 ================= */
  function refreshBadge() {
    window.__cxExtraBadge = unopened() + diaryUnread();
    var de = document.getElementById('cx-diary-entry');
    if (de) { var db2 = de.querySelector('.cx-badge'), dn = diaryUnread(); if (dn && !db2) { db2 = document.createElement('span'); db2.className = 'cx-badge'; de.appendChild(db2); } if (db2) { if (dn) db2.textContent = dn; else db2.remove(); } }
    var el = document.getElementById('cx-rp-entry');
    if (el) { var bd = el.querySelector('.cx-badge'), n = unopened(); if (n && !bd) { bd = document.createElement('span'); bd.className = 'cx-badge'; el.appendChild(bd); } if (bd) { if (n) bd.textContent = n; else bd.remove(); } }
    if (typeof window.__cxBadge === 'function') window.__cxBadge();
  }
  var ticking = false;
  async function tick() {
    if (!ready() || ticking) return; ticking = true;
    try {
      await load(); wrapReply();
      var ch = false;
      if (await letterTick()) ch = true;
      if (await rpTick()) ch = true;
      if (periodCare()) ch = true;
      if (linkTick()) ch = true;
      if (diaryTick()) ch = true;
      if (ch) await save();
      refreshBadge(); linkRender();
    } catch (e) { console.warn('[cx extras]', e); }
    ticking = false;
  }

  /* ================= 通話：他自己掛電話 ================= */
  var HANG_LINES = ['我先去忙了，晚點再打給你', '要睡了，晚安', '有人找我，先掛囉', '手機快沒電了', '今天先聊到這裡，愛你', '我去洗澡了，等等再說'];
  function hangLines() { var l = X && X.hang && X.hang.lines; return (l && l.length) ? l : HANG_LINES; }
  var hangAt = 0, hangFired = false, wasConn = false;
  function callConnected() {
    var w = document.getElementById('call-window'), p = document.getElementById('call-mini-pill'), c = document.getElementById('call-connecting-state');
    var active = !!((w && w.classList.contains('visible')) || (p && p.classList.contains('visible')));
    return active && !(c && c.classList.contains('visible'));
  }
  function hangWatch() {
    if (!X || !X.hang) return;
    var conn = callConnected();
    if (conn && !wasConn) { var mn = Math.max(1, +X.hang.min || 5), mx = Math.max(mn, +X.hang.max || 30); hangAt = Date.now() + rnd(mn, mx) * 60000; hangFired = false; }
    if (!conn) hangAt = 0;
    wasConn = conn;
    if (conn && X.hang.on && hangAt && !hangFired && Date.now() >= hangAt) {
      hangFired = true;
      var say = X.hang.say ? pick(hangLines()) : '';
      if (say) partnerSays(say);
      setTimeout(function () {
        if (!callConnected()) return;
        if (window.callFeature && window.callFeature.endCall) window.callFeature.endCall();
        toast(pname() + ' 掛斷了電話');
        sysNotify(pname() + ' 掛斷了電話', say || '通話結束', 'cx-hang');
      }, say ? 1800 : 0);
    }
  }
  setInterval(hangWatch, 3000);

  /* 修正：電腦用滑鼠點通話視窗右上角按鈕沒反應（拖動功能把滑鼠抓走了） */
  document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('#call-window-header button')) e.stopPropagation();
  }, true);

  (function credit() {
    var h = Array.prototype.find.call(document.querySelectorAll('h3,h4'), function (x) { return /特別鳴謝/.test(x.textContent); });
    if (h && !document.getElementById('cx-credit')) { var c = document.createElement('p'); c.id = 'cx-credit'; c.style.cssText = 'font-size:12px;opacity:.75;margin-top:8px'; c.textContent = '潮汐、番茄鐘、陪伴中心、紅包、狀態檢測、拼字卡、主動來信的功能靈感來自「渡念」（小紅書 @我要學英語），程式為重新撰寫。'; h.parentNode.appendChild(c); }
  })();
  addEntry('cx-diary-entry', 'fa-book', '他的日記', diaryOpen);
  addEntry('cx-period-entry', 'fa-droplet', '潮汐', pOpen);
  addEntry('cx-pomo-entry', 'fa-clock', '番茄鐘', pomoOpen);
  addEntry('cx-comp-entry', 'fa-headphones', '陪伴中心', compOpen);
  addEntry('cx-rp-entry', 'fa-gift', '紅包', rpOpen);
  addEntry('cx-status-entry', 'fa-heart-pulse', '狀態檢測', stOpen);
  addEntry('cx-set-entry', 'fa-wand-magic-sparkles', '回覆與來信', setOpen);
  setTimeout(tick, 3000);
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
})();
