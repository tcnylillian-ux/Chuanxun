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
    dice: { n: 1, opts: '' }, qz: { list: [] }, todo: { list: [] }, sleep: { cur: 0, log: [], with: 'cs', peek: [] }, health: { days: {}, goal: 8, remind: true, rd: {} },
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
    phone: { chance: 0.04, items: [], seen: null, unread: 0, notes: null, seeded: false },
    toss: { back: 0.35 },
    gchar: {},
    comp: { run: null, books: [], lines: {
      listen: ['這首好好聽', '這段旋律好喜歡', '跟你一起聽歌真好', '副歌要來了', '單曲循環吧', '你也喜歡這首嗎？', '想抱著你一起聽'],
      watch: ['哈哈哈哈', '這裡好好笑', '緊張死了', '這個演員好好看', '不准看別人，看我', '好感動', '抱緊我'],
      read: ['讀到哪了？', '這段寫得好好', '你看得好快', '我也想知道後面怎樣', '這個角色好可愛', '累了就休息一下', '看書的樣子好認真']
    }, history: [], invite: 'low', inviteNext: 0, noise: 'off', modeLines: null }
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
  function partnerSays(text, from) {
    if (!text || typeof addMessage !== 'function') return;
    var m = { id: Date.now() + Math.floor(Math.random() * 1000), sender: pname(), text: text, timestamp: new Date(), status: 'received', favorited: false, note: null, type: 'normal' };
    if (from) m.cxFrom = from;
    addMessage(m);
    sound();
    if (typeof window._sendPartnerNotification === 'function') window._sendPartnerNotification(from || pname(), text);
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
    '.cx-adv-tabs{display:flex;gap:3px;position:sticky;top:-1px;z-index:5;background:var(--secondary-bg);padding:6px 4px 0;margin-bottom:0}' +
    '.cx-adv-tabs button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 2px 6px;border:1px solid rgba(0,0,0,.08);border-bottom:0;border-radius:12px 12px 0 0;background:var(--tb,#f3e6ee);color:#6a5560;font:inherit;font-size:12px;cursor:pointer;position:relative;white-space:nowrap;transform:translateY(4px);transition:transform .15s}' +
    '.cx-adv-tabs button:nth-child(1){--tb:#fde2e4}.cx-adv-tabs button:nth-child(2){--tb:#dff3e4}.cx-adv-tabs button:nth-child(3){--tb:#ffe8d6}.cx-adv-tabs button:nth-child(4){--tb:#e2ecfb}.cx-adv-tabs button:nth-child(5){--tb:#ece6f6}' +
    '.cx-adv-tabs button span{font-size:18px;line-height:1.2}.cx-adv-tabs button.on{transform:none;font-weight:700;color:#4a3a42;box-shadow:0 -2px 6px rgba(0,0,0,.06)}' +
    '.cx-adv-paper{border-radius:0 0 14px 14px;padding:8px!important;background:repeating-linear-gradient(transparent 0 31px,rgba(150,120,140,.12) 31px 32px),var(--pp,#fffaf6)!important;border:1px solid rgba(0,0,0,.06);border-top:0}' +
    '.cx-adv-paper .settings-item{background:rgba(255,255,255,.75)!important;color:#4a3a42!important}.cx-adv-paper .settings-item i{color:#b06a86}' +
    '[data-theme="dark"] .cx-adv-tabs button{filter:brightness(.55) saturate(1.2);color:#fff}[data-theme="dark"] .cx-adv-tabs button.on{filter:brightness(.75) saturate(1.2)}[data-theme="dark"] .cx-adv-paper{background:repeating-linear-gradient(transparent 0 31px,rgba(255,255,255,.05) 31px 32px),var(--secondary-bg)!important}[data-theme="dark"] .cx-adv-paper .settings-item{background:var(--primary-bg)!important;color:var(--text-primary)!important}' +
    '.cx-adv-tabs .dot{position:absolute;top:5px;right:8px;width:8px;height:8px;border-radius:50%;background:#ff7b93;display:none}.cx-adv-tabs button.has .dot{display:block}.cx-tab-hide{display:none!important}' +
    '.cx-env-star{position:absolute;bottom:6px;right:36px;z-index:2;background:transparent;border:none;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;cursor:pointer;color:var(--text-secondary)}#env-fav-list .cx-env-star{right:8px}' +
    '.cx-env-star.on{color:#e0a52e}.cx-env-vstar{display:inline-flex;align-items:center;gap:4px}.cx-fav-count{background:#f2b544!important}' +
    '.env-tab-bar{flex-wrap:nowrap}.env-tab-bar .env-tab-btn{white-space:nowrap}' +
    '.cx-who-t{font-size:12px;color:var(--text-secondary);margin:2px 2px 6px}.cx-who{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
    '.cx-who button{display:flex;align-items:center;gap:8px;padding:3px 14px 3px 3px;border:1px solid var(--border-color);border-radius:99px;background:var(--primary-bg);color:var(--text-primary);font:inherit;font-size:13px;cursor:pointer}' +
    '.cx-who button.on{background:var(--accent-color);border-color:var(--accent-color);color:#fff}.cx-who .av{width:34px;height:34px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--secondary-bg);color:var(--accent-color);font-size:12px;flex:none;box-shadow:0 0 0 1px var(--border-color)}.cx-who .av img{width:100%;height:100%;object-fit:cover;object-position:center 35%}' +
    '.session-item:active{transform:translateX(5px)!important}.session-info:active{transform:scale(.97);transition:transform .1s}.session-action-btn:active{transform:scale(.9)!important}' +
    '.cx-cl-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--border-color);font-size:13px;color:var(--text-primary)}.cx-cl-row span:last-child{text-align:right;color:var(--text-secondary)}.cx-sec h4 small{font-weight:400;color:var(--text-secondary);margin-left:6px}' +
    '.cx-hp-sec{border:1px solid var(--border-color);border-radius:14px;padding:4px 12px;margin-top:10px;background:var(--primary-bg)}.cx-hp-sec summary{cursor:pointer;font-weight:600;padding:8px 0;color:var(--text-primary)}' +
    '.cx-hp-it{padding:8px 0;border-top:1px dashed var(--border-color)}.cx-hp-it .t{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--text-primary)}.cx-hp-it .d{font-size:13px;line-height:1.7;color:var(--text-secondary);margin-top:2px}' +
    '.cx-hp-go{flex:none;font:inherit;font-size:12px;font-weight:400;border:1px solid var(--accent-color);color:var(--accent-color);background:transparent;border-radius:99px;padding:2px 10px;cursor:pointer}' +
    '#stats-panel,#search-panel,#favorites-panel,#wordcloud-panel{flex:1 1 auto;min-height:0;overflow-y:auto}#stats-modal .modal-content{max-height:calc(100dvh - 40px)}' +
    '.cx-gchar{margin-top:14px}.cx-gc-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed var(--border-color)}' +
    '.cx-env-who{opacity:.9}#poke-modal .modal-btn{white-space:nowrap;min-width:72px}' +
    '.cx-dim{opacity:.4}.cx-call{cursor:pointer}.cx-call>i:first-child{color:var(--accent-color);width:22px;text-align:center}.cx-call.miss>i:first-child{color:#e46a7a}' +
    '.cx-flash{animation:cxFlash 1.8s ease}@keyframes cxFlash{0%,100%{background:transparent}20%,60%{background:rgba(var(--accent-color-rgb),.18)}}' +
    '.cx-toss{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cx-toss button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 2px;border:1px solid var(--border-color);border-radius:14px;background:var(--primary-bg);color:var(--text-primary);font:inherit;font-size:12px;cursor:pointer}.cx-toss svg{width:40px;height:40px}.cx-toss button:active{transform:scale(.94)}' +
    '.cx-fly{position:fixed;left:0;top:0;width:44px;height:44px;z-index:9999;pointer-events:none}.cx-fly svg{width:100%;height:100%}' +
    '.cx-splat{position:fixed;width:80px;height:80px;z-index:9998;pointer-events:none;animation:cxSplat .35s cubic-bezier(.2,1.6,.5,1)}.cx-splat svg{width:100%;height:100%}.cx-splat.out{transition:opacity .7s;opacity:0}' +
    '@keyframes cxSplat{from{transform:scale(.2)}to{transform:scale(1)}}' +
    '.cx-shake{animation:cxShake .6s}@keyframes cxShake{0%,100%{transform:none}20%{transform:translateX(-5px) rotate(-6deg)}40%{transform:translateX(5px) rotate(5deg)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}' +
    '.cx-phone{margin:0 auto;width:100%;max-width:300px;border:2px solid var(--text-primary);border-radius:28px;padding:10px 10px 14px;background:var(--primary-bg);box-shadow:0 6px 18px rgba(0,0,0,.08)}' +
    '.cx-phone-top{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-secondary);padding:0 8px 6px}.cx-phone-top .notch{width:70px;height:16px;border-radius:99px;background:var(--text-primary);opacity:.85}' +
    '.cx-phone-h{display:flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:6px 4px 8px;color:var(--text-primary)}.cx-phone-h i{color:#f2b544}.cx-phone-h small{font-weight:400;color:var(--text-secondary)}' +
    '.cx-phone-sort{margin-left:auto;display:flex;gap:4px}.cx-phone-sort button{font:inherit;font-size:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-secondary);border-radius:99px;padding:2px 8px;cursor:pointer}.cx-phone-sort button.on{background:var(--accent-color);border-color:var(--accent-color);color:#fff}' +
    '.cx-phone-list{display:flex;flex-direction:column;gap:8px;max-height:46vh;overflow-y:auto}' +
    '.cx-pi{background:var(--secondary-bg);border:1px solid var(--border-color);border-radius:14px;padding:10px 12px}.cx-pi .q{font-size:14px;line-height:1.6;color:var(--text-primary);word-break:break-word}' +
    '.cx-pi .m{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--text-secondary);margin-top:6px}.cx-pi .note{color:var(--accent-color)}' +
    '.cx-pi .act{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}.cx-pi .act button{font:inherit;font-size:11px;border:none;background:transparent;color:var(--text-secondary);cursor:pointer;padding:2px 6px}' +
    '.cx-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cx-modes button{display:flex;align-items:center;gap:8px;padding:12px;border:1px solid var(--border-color);border-radius:14px;background:var(--primary-bg);color:var(--text-primary);font:inherit;font-size:14px;cursor:pointer}.cx-modes span{font-size:20px}' +
    '.cx-mode{text-align:center;padding:6px 0 4px}.cx-mode .ic{font-size:40px}.cx-mode .t{font-size:14px;color:var(--text-secondary);margin-top:2px}.cx-mode .clock{font-size:40px;font-weight:600;letter-spacing:.05em;color:var(--text-primary);font-variant-numeric:tabular-nums}' +
    '.cx-note{font-size:12px;color:var(--text-primary);background:var(--secondary-bg);border-radius:8px;padding:6px 8px;margin-top:6px;white-space:pre-wrap}' +
    '.cx-inv{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.cx-inv-card{width:100%;max-width:320px;background:var(--secondary-bg);border-radius:22px;padding:22px 20px 16px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.25);animation:cxSplat .35s cubic-bezier(.2,1.4,.5,1)}' +
    '.cx-inv-card .av{width:64px;height:64px;border-radius:50%;margin:0 auto 10px;overflow:hidden;background:var(--primary-bg);display:grid;place-items:center;color:var(--accent-color);font-size:26px}.cx-inv-card .av img{width:100%;height:100%;object-fit:cover}' +
    '.cx-inv-card .t{font-weight:600;font-size:16px;color:var(--text-primary)}.cx-inv-card .q{font-size:14px;color:var(--text-secondary);margin:8px 0 14px;line-height:1.6}.cx-inv-card .cx-btns{justify-content:center}' +
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
      var ppl = groupPeople(), who = ppl.length > 1 ? pick(ppl).name : null;
      var tf = Math.random() < .3;
      var p = { id: 'rp' + Date.now().toString(36), type: tf ? 'tf' : 'rp', from: 'him', amount: amt, note: tf ? pick(['零花錢', '給妳買奶茶', '晚餐我請', '拿去買喜歡的']) : pick(RP_NOTES), at: Date.now(), opened: false };
      if (who) p.who = who;
      X.rp.list.push(p); await save();
      partnerSays(tf ? '💸 轉帳 $' + money(amt) + '｜' + p.note + '（點這則訊息收款）' : '🧧 紅包｜' + p.note + '（點這則訊息領取）', who);
      refreshBadge();
    }, 6000 + Math.random() * 6000);
  }
  async function rpTick() {
    var now = Date.now(), changed = false;
    X.rp.list.forEach(function (p) {
      if (p.type === 'lucky' && !p.opened) {
        p.shares.forEach(function (q) { if (!q.got && now >= q.at) { q.got = true; changed = true; sysSay(q.who + ' 搶到了 $' + money(q.amt)); } });
        if (p.shares.every(function (q) { return q.got; })) { p.opened = true; p.openedAt = now; var best = p.shares.slice().sort(function (a, b) { return b.amt - a.amt; })[0]; sysSay('🏆 手氣最佳：' + best.who + '（$' + money(best.amt) + '）'); var bw = best.who; setTimeout(function () { sayAs(bw, pickFor(bw) || '手氣最好的是我～'); }, 1500); }
        return;
      }
      if (p.from === 'me' && !p.opened && p.openAt && now >= p.openAt) {
        p.opened = true; p.openedAt = now; changed = true;
        sysSay((p.who || pname()) + (p.type === 'tf' ? (p.back ? ' 退還了你的轉帳' : ' 已收款 $' + money(p.amount)) : ' 領取了你的紅包'));
        if (p.reply) setTimeout(function () { sayAs(p.who, p.reply); }, 1200);
      }
    });
    return changed;
  }
  var rpM = null, rpTo = null, rpMode = 'rp';
  var TF_BACK = ['妳留著買好吃的，我的錢就是妳的錢。', '不用給我，乖。', '退給妳了，拿去買奶茶。'], TF_OK = ['收到了，謝謝寶貝。', '這麼大方？那我請妳吃飯。', '收下了，好好存起來給妳買禮物。'];
  function luckySplit(total, n) { var c = Math.round(total * 100), out = []; for (var i = 0; i < n - 1; i++) { var left = n - i, max = Math.max(1, Math.floor(c / left * 2) - 1), v = Math.max(1, Math.floor(Math.random() * max)); v = Math.min(v, c - (left - 1)); out.push(v); c -= v; } out.push(c); return out.map(function (v) { return v / 100; }); }
  function rpWho(p) { return p.who || pname(); }
  function rpOpen() {
    if (!rpM) {
      rpM = makeModal('cx-rp-modal', 'fa-gift', '紅包');
      bindChips(rpM.body, function (n) { rpTo = n; var h = rpM.body.querySelector('#cx-rp-h'); if (h) h.textContent = '發紅包給 ' + n; });
      rpM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.amt) { rpM.body.querySelector('#cx-rp-amt').value = b.dataset.amt; return; }
        if (b.dataset.rpm) { rpMode = b.dataset.rpm; rpRender(); return; }
        if (b.id === 'cx-rp-send') {
          var amt = parseFloat(rpM.body.querySelector('#cx-rp-amt').value), note = rpM.body.querySelector('#cx-rp-note').value.trim() || (rpMode === 'tf' ? '轉帳' : '恭喜發財，大吉大利');
          if (!(amt > 0) || amt > 99999) { toast('請輸入金額', 'warning'); return; }
          var to = groupOn() && rpTo && rpTo !== pname() ? rpTo : null;
          if (rpMode === 'lucky') {
            var ppl = groupPeople(), sh = luckySplit(amt, ppl.length), t0 = Date.now();
            if (amt < ppl.length * 0.01) { toast('金額太少，不夠分', 'warning'); return; }
            var pl = { id: 'rp' + t0.toString(36), type: 'lucky', from: 'me', amount: amt, note: note, at: t0, opened: false, shares: ppl.map(function (q, i) { return { who: q.name, amt: sh[i], at: t0 + rnd(5e3, 120e3), got: false }; }) };
            X.rp.list.push(pl); await save(); iSay('🧧 拼手氣紅包｜' + note + '（' + ppl.length + ' 人搶）'); toast('拼手氣紅包發出去了', 'success'); rpRender(); return;
          }
          var tf = rpMode === 'tf';
          var p = { id: 'rp' + Date.now().toString(36), type: tf ? 'tf' : 'rp', from: 'me', amount: amt, note: note, at: Date.now(), opened: false, openAt: Date.now() + (tf ? rnd(20e3, 180e3) : rnd(8e3, 90e3)), reply: pickFor(to) || '謝謝寶貝' };
          if (tf && Math.random() < .25) { p.back = true; p.reply = pick(TF_BACK); } else if (tf) p.reply = Math.random() < .5 ? pick(TF_OK) : p.reply;
          if (to) p.who = to;
          X.rp.list.push(p); await save();
          iSay(tf ? '💸 轉帳 $' + money(amt) + '｜' + note + (to ? '（給 ' + to + '）' : '') : '🧧 紅包｜' + note + (to ? '（給 ' + to + '）' : ''));
          toast(tf ? '轉帳送出，等他收款' : '紅包已送出', 'success'); rpRender(); return;
        }
        if (b.dataset.open) { openPacket(b.dataset.open); return; }
      });
    }
    rpM.onBack = null; rpTo = pname(); rpRender(); rpM.open();
  }
  function rpRender() {
    var list = X.rp.list.slice().sort(function (a, b) { return b.at - a.at; });
    var got = X.rp.list.filter(function (p) { return p.from === 'him' && p.opened; }).reduce(function (s, p) { return s + p.amount; }, 0);
    var sent = X.rp.list.filter(function (p) { return p.from === 'me'; }).reduce(function (s, p) { return s + p.amount; }, 0);
    var chips = whoChips('cx-rp-who', rpTo || pname());
    var pendTf = X.rp.list.filter(function (p) { return p.type === 'tf' && !p.opened; }).length;
    var modes = [['rp', '🧧 紅包'], ['tf', '💸 轉帳']].concat(groupOn() && groupPeople().length > 1 ? [['lucky', '🎲 拼手氣']] : []); if (!modes.some(function (m) { return m[0] === rpMode; })) rpMode = 'rp';
    var h = '<div class="cx-chips cx-rp-mode">' + modes.map(function (m) { return '<button data-rpm="' + m[0] + '" class="' + (rpMode === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<div class="cx-sec"><h4 id="cx-rp-h">' + (rpMode === 'lucky' ? '發給群裡所有人，隨機分' : (rpMode === 'tf' ? '轉帳給 ' : '發紅包給 ') + esc(rpTo || pname())) + '</h4>' + (rpMode === 'lucky' ? '' : chips) + '<input class="cx-in" id="cx-rp-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="金額">' +
      '<div class="cx-chips">' + [5.2, 13.14, 52, 520, 1314].map(function (a) { return '<button data-amt="' + a + '">' + a + '</button>'; }).join('') + '</div>' +
      '<input class="cx-in" id="cx-rp-note" maxlength="30" placeholder="' + (rpMode === 'tf' ? '備註（例如：晚餐錢）' : '恭喜發財，大吉大利') + '"><button class="cx-btn pri" id="cx-rp-send">' + (rpMode === 'tf' ? '💸 轉帳' : rpMode === 'lucky' ? '🎲 發拼手氣紅包' : '🧧 塞進紅包') + '</button></div>' +
      '<div class="cx-stat"><div><b>' + unopened() + '</b><span>待領取</span></div><div><b>' + pendTf + '</b><span>待收款</span></div><div><b>$' + money(got) + '</b><span>收到</span></div><div><b>$' + money(sent) + '</b><span>送出</span></div></div>' +
      '<div class="cx-sec"><h4>紅包記錄</h4><div class="cx-list">';
    if (!list.length) h += '<div class="cx-muted">還沒有紅包。' + esc(pname()) + ' 聊天時偶爾也會發紅包給你。</div>';
    list.forEach(function (p) {
      var mine = p.from === 'me';
      var tf = p.type === 'tf', lk = p.type === 'lucky';
      h += '<button class="cx-rp' + (p.opened ? ' done' : '') + '"' + (!mine && !p.opened ? ' data-open="' + p.id + '"' : '') + '><span class="i">' + (tf ? '💸' : lk ? '🎲' : '🧧') + '</span><div><b>' + esc(p.note) + '</b><span>' +
        (lk ? '拼手氣 $' + money(p.amount) + ' · ' + p.shares.filter(function (q) { return q.got; }).map(function (q) { return esc(q.who) + ' $' + money(q.amt); }).join('、') + (p.opened ? '' : ' · 還在搶') :
        mine ? (tf ? '轉帳給 ' : '送給 ') + esc(rpWho(p)) + ' · $' + money(p.amount) + (p.opened ? (tf ? (p.back ? ' · 已退還' : ' · 已收款') : ' · 已被領取') : (tf ? ' · 待收款' : ' · 等待領取')) : esc(rpWho(p)) + (tf ? ' 轉帳給妳 · ' : ' 送的 · ') + (p.opened ? '已' + (tf ? '收款' : '領取') + ' $' + money(p.amount) : tf ? '點一下收款' : '點一下領取')) + ' · ' + fmtTime(p.at) + '</span></div></button>';
    });
    rpM.body.innerHTML = h + '</div></div>';
  }
  function openPacket(id) {
    var p = X.rp.list.find(function (x) { return x.id === id; }); if (!p) return;
    var o = document.createElement('div'); o.className = 'cx-open';
    var tf = p.type === 'tf';
    o.innerHTML = '<div class="p' + (tf ? ' tf' : '') + '"><div class="who">' + esc(rpWho(p)) + (tf ? ' 轉帳給妳' : ' 的紅包') + '</div><div class="note">' + esc(p.note) + '</div>' +
      (p.opened ? '<div class="amt">$' + money(p.amount) + '</div>' : tf ? '<div class="amt">$' + money(p.amount) + '</div><button class="coin tfbtn">收款</button>' : '<button class="coin">開</button>') + '<div><button class="close">關閉</button></div></div>';
    document.body.appendChild(o);
    o.querySelector('.close').onclick = function () { o.remove(); };
    o.addEventListener('click', function (e) { if (e.target === o) o.remove(); });
    var coin = o.querySelector('.coin');
    if (coin) coin.onclick = async function () {
      coin.classList.add('spin');
      setTimeout(async function () {
        p.opened = true; p.openedAt = Date.now(); await save();
        coin.outerHTML = tf ? '<div class="note">已收款 ✓</div>' : '<div class="amt">$' + money(p.amount) + '</div>';
        sysSay(tf ? '你已收款 ' + rpWho(p) + ' 的轉帳 $' + money(p.amount) : '你領取了 ' + rpWho(p) + ' 的紅包 $' + money(p.amount));
        refreshBadge(); if (rpM && rpM.isOpen()) rpRender();
      }, 900);
    };
  }
  // tap a red-packet message in the chat to open it
  document.addEventListener('click', async function (e) {
    var msg = e.target.closest && e.target.closest('#chat-container [data-msg-id]'); if (!msg) return;
    if (!/🧧 紅包｜|💸 轉帳 /.test(msg.textContent || '')) return;
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
      cM.onBack = function () { if (cM.view === 'mode' && cState.started && !cState.ending) { cM.close(); return true; } if (cM.view !== 'hub') { compStop(); cM.view = cM.view === 'reader' ? 'books' : 'hub'; compRender(); return true; } };
      cM.onClose = compStop;
      cM.body.addEventListener('click', compClick);
      cM.body.addEventListener('change', compChange);
    }
    if (cState.kind === 'mode' && cState.started && !cState.ending) { cM.view = 'mode'; compRender(); cM.open(); modeLive(); pillUpdate(); return; }
    cM.view = 'hub'; compRender(); cM.open();
  }
  /* 陪伴模式關掉視窗後繼續計時：左下角的小膠囊 */
  var pillT = null;
  function pillUpdate() {
    var run = cState.kind === 'mode' && cState.started && !cState.ending, el = document.getElementById('cx-comp-pill');
    if (!run) { if (el) el.remove(); clearInterval(pillT); pillT = null; return; }
    if (!pillT) pillT = setInterval(pillUpdate, 1000);
    if (cM && cM.isOpen()) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('button'); el.id = 'cx-comp-pill'; el.type = 'button'; el.className = 'cx-comp-pill'; el.onclick = async function () { await load(); compOpen(); }; document.body.appendChild(el); }
    var s = Math.floor((Date.now() - cState.started) / 1000);
    el.innerHTML = MODES[cState.mode].e + ' ' + MODES[cState.mode].label + '中 <b>' + (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60) + '</b>';
    if (!pillT) pillT = setInterval(pillUpdate, 1000);
  }
  function compRestore() {
    var R = X.comp && X.comp.run;
    if (R && R.started && !(cState && cState.started) && MODES[R.mode]) { cState = { kind: 'mode', mode: R.mode, title: MODES[R.mode].label, started: R.started, toChat: !!R.toChat }; pillUpdate(); }
  }
  function compStop() {
    clearInterval(cTimer); cTimer = null;
    if (cState.kind === 'mode' && cState.started && !cState.ending && !cState.forceEnd) { setTimeout(pillUpdate, 60); return; } // 只是關掉視窗，陪伴繼續
    if (X.comp.run) { X.comp.run = null; save(); }
    setTimeout(pillUpdate, 0);
    var media = cM && cM.body.querySelector('audio,video'); if (media) { try { media.pause(); } catch (e) {} }
    if (cState.url && cState.url.indexOf('blob:') === 0) URL.revokeObjectURL(cState.url);
    noiseStop();
    if (cState.started) {
      var mins = Math.max(1, Math.round((Date.now() - cState.started) / 60e3));
      var isMode = cState.kind === 'mode';
      X.comp.history.unshift({ k: isMode ? cState.mode : cState.kind, t: cState.title, at: cState.started, min: mins, note: cState.note || '' }); X.comp.history = X.comp.history.slice(0, 200); save();
      if (isMode) { sysSay(MODES[cState.mode].e + ' ' + MODES[cState.mode].label + '了 ' + mins + ' 分鐘'); if (cState.toChat) partnerSays(MODES[cState.mode].end); }
    }
    cState = {};
  }
  function ytId(u) { var m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/.exec(u); return m && m[1]; }
  function bvId(u) { var m = /(BV[0-9A-Za-z]{10})/.exec(u); return m && m[1]; }
  function compRender() {
    var b = cM.body, v = cM.view, p = esc(pname());
    if (v === 'hub') {
      b.innerHTML = hubModes(p) + '<div class="cx-sec"><h4>一起做點什麼</h4>' + '<div class="cx-hub"><button data-c="listen"><i class="fas fa-music"></i><div><b>一起聽歌</b><span>和 ' + p + ' 一起聽一首歌</span></div></button>' +
        '<button data-c="watch"><i class="fas fa-film"></i><div><b>一起看影片</b><span>邊看邊聽 ' + p + ' 的彈幕</span></div></button>' +
        '<button data-c="books"><i class="fas fa-book-open"></i><div><b>一起看小說</b><span>上傳 txt，和 ' + p + ' 共讀</span></div></button></div>' + '</div>' +
        (X.comp.history.length ? '<div class="cx-sec"><h4>陪伴日記 <button class="qa-link" data-c="diary" style="float:right">全部 ' + X.comp.history.length + ' 則</button></h4><div class="cx-list">' + X.comp.history.slice(0, 4).map(function (h, i) { return histLi(h, i, false); }).join('') + '</div></div>' : '') +
        '<div class="cx-sec">' + hubInvite(p) + '<div class="cx-muted">' + p + ' 會在適合的時間約你讀書、工作、運動或睡覺</div></div>';
      return;
    }
    if (v === 'mode') { modeRender(b, p); return; }
    if (v === 'diary') { b.innerHTML = '<div class="cx-list">' + X.comp.history.map(function (h, i) { return histLi(h, i, cState.editNote === i); }).join('') + '</div>'; return; }
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
    if (b.dataset.m) { startMode(b.dataset.m); return; }
    if (c === 'mend') { clearInterval(cTimer); noiseStop(); cState.ending = true; if (X.comp.run) { X.comp.run = null; save(); } compRender(); return; }
    if (c === 'msave') { var nt = cM.body.querySelector('#cx-m-note'); cState.note = nt ? nt.value.trim() : ''; compStop(); cM.view = 'hub'; compRender(); toast('已寫進陪伴日記', 'success'); return; }
    if (c === 'diary') { cState.editNote = null; cM.view = 'diary'; compRender(); return; }
    if (b.dataset.editnote !== undefined) { var ei = +b.dataset.editnote; if (cM.view !== 'diary') cM.view = 'diary'; cState.editNote = ei; compRender(); var ta = cM.body.querySelector('#cx-hn-' + ei); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); } return; }
    if (b.dataset.savenote !== undefined) { var si = +b.dataset.savenote, tv = cM.body.querySelector('#cx-hn-' + si); if (X.comp.history[si] && tv) X.comp.history[si].note = tv.value.trim(); cState.editNote = null; await save(); compRender(); return; }
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
    if (t.id === 'cx-m-noise') { X.comp.noise = t.value; save(); noiseStart(t.value); return; }
    if (t.id === 'cx-inv-freq') { X.comp.invite = t.value; invSchedule(); await save(); toast(t.value === 'off' ? pname() + ' 不會主動約你了' : '好，' + pname() + ' 會找時間約你', 'success'); return; }
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
  var JOINS = ['', '，', '…', '、', '～', '。', '！', '/', '　'];
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
      '<div class="cx-muted">連接符號（可多選，每次隨機用一個）</div><div class="cx-chips">' + JOINS.map(function (j) { return '<button data-j="' + esc(j) + '" class="' + (c.joins.indexOf(j) >= 0 ? 'on' : '') + '">' + (j === '' ? '直接連起來' : j === '　' ? '空格' : esc(j)) + '</button>'; }).join('') + '</div>' +
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
    var phU = X ? (X.phone.unread || 0) : 0;
    window.__cxExtraBadge = unopened() + diaryUnread() + phU;
    var pe = document.getElementById('cx-phone-entry');
    if (pe) { var pb = pe.querySelector('.cx-badge'); if (phU && !pb) { pb = document.createElement('span'); pb.className = 'cx-badge'; pe.appendChild(pb); } if (pb) { if (phU) pb.textContent = phU; else pb.remove(); } }
    var de = document.getElementById('cx-diary-entry');
    if (de) { var db2 = de.querySelector('.cx-badge'), dn = diaryUnread(); if (dn && !db2) { db2 = document.createElement('span'); db2.className = 'cx-badge'; de.appendChild(db2); } if (db2) { if (dn) db2.textContent = dn; else db2.remove(); } }
    var el = document.getElementById('cx-rp-entry');
    if (el) { var bd = el.querySelector('.cx-badge'), n = unopened(); if (n && !bd) { bd = document.createElement('span'); bd.className = 'cx-badge'; el.appendChild(bd); } if (bd) { if (n) bd.textContent = n; else bd.remove(); } }
    if (typeof window.__cxBadge === 'function') window.__cxBadge();
    advDots();
  }
  var ticking = false;
  async function tick() {
    if (!ready() || ticking) return; ticking = true;
    try {
      await load(); wrapReply();
      var ch = false;
      if (await letterTick()) ch = true;
      if (await rpTick()) ch = true;
      if (await todoTick()) ch = true;
      if (await qzTick()) ch = true;
      compRestore(); sleepRestore();
      if (periodCare()) ch = true;
      if (healthTick()) ch = true;
      try { if (acTick()) ch = true; if (vtTick()) ch = true; } catch (e) { console.warn('[cx] acct/vote', e); }
      if (linkTick()) ch = true;
      if (diaryTick()) ch = true;
      if (phoneTick()) ch = true;
      if (inviteTick()) ch = true;
      try { envFixFrom(); } catch (e) {}
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

  /* ================= 通話紀錄 ================= */
  var clM = null, clF = 'all';
  function allMsgs() { try { return (typeof messages !== 'undefined' && Array.isArray(messages)) ? messages : []; } catch (e) { return []; } }
  function callList() { return allMsgs().filter(function (m) { return m && m.type === 'call-event'; }).slice().reverse(); }
  function callMissed(m) { return m.callIcon === 'fa-phone-slash' || /未接|拒絕|無法接聽|正在忙|錯過/.test(m.text || ''); }
  function durSec(d) { if (!d) return 0; var p = String(d).split(':').map(Number); if (p.some(isNaN)) return 0; return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : 0; }
  function fmtDur(s) { var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' 小時 ' + m + ' 分' : m ? m + ' 分 ' + (s % 60) + ' 秒' : (s % 60) + ' 秒'; }
  function jumpTo(id) {
    var el = null;
    document.querySelectorAll('.chat-container [data-id]').forEach(function (x) { if (String(x.dataset.id) === String(id)) el = x; });
    if (!el) { toast('這則在比較前面，往上捲一點就看得到'); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('cx-flash'); setTimeout(function () { el.classList.remove('cx-flash'); }, 1900);
  }
  function clOpen() {
    if (!clM) {
      clM = makeModal('cx-calllog-modal', 'fa-phone', '通話紀錄');
      clM.body.addEventListener('click', function (e) {
        var f = e.target.closest('[data-f]'); if (f) { clF = f.dataset.f; clRender(); return; }
        var r = e.target.closest('[data-mid]'); if (r) { var id = r.dataset.mid; clM.close(); setTimeout(function () { jumpTo(id); }, 300); }
      });
    }
    clF = 'all'; clRender(); clM.open();
  }
  function clRender() {
    var all = callList(), miss = all.filter(callMissed), ok = all.filter(function (m) { return !callMissed(m); });
    var tot = ok.reduce(function (s, m) { return s + durSec(m.callDetail); }, 0);
    var list = clF === 'ok' ? ok : clF === 'miss' ? miss : all;
    clM.body.innerHTML = '<div class="cx-stat"><div><b>' + all.length + '</b><span>全部通話</span></div><div><b>' + miss.length + '</b><span>未接／拒接</span></div><div><b>' + fmtDur(tot) + '</b><span>一起聊了</span></div></div>' +
      '<div class="cx-chips">' + [['all', '全部'], ['ok', '已接通'], ['miss', '未接']].map(function (x) { return '<button data-f="' + x[0] + '" class="' + (clF === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="cx-list">' + (list.length ? list.map(function (m) {
        var ms = callMissed(m);
        return '<div class="cx-li cx-call' + (ms ? ' miss' : '') + '" data-mid="' + esc(m.id) + '"><i class="fas ' + (ms ? 'fa-phone-slash' : 'fa-video') + '"></i><div>' + esc(String(m.text || '').replace(/ · .*/, '')) +
          '<div class="s">' + fmtTime(m.timestamp) + (m.callDetail && !ms ? ' · ' + esc(m.callDetail) : '') + '</div></div><i class="fas fa-chevron-right cx-dim"></i></div>';
      }).join('') : '<div class="cx-muted" style="text-align:center;padding:24px 0">還沒有通話紀錄</div>') + '</div>' +
      '<div class="cx-muted" style="text-align:center">點一通就會跳到聊天裡那一則</div>';
  }

  /* ================= 搞怪丟東西 ================= */
  var INK = '#4a4058';
  function svgWrap(inner, vb) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 48 48') + '" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }
  var TOSS = {
    heart: { n: '愛心', v: '丟了一顆愛心',
      icon: '<path d="M24 40 C10 30 5 22 7 15 C9 8 18 6 24 14 C30 6 39 8 41 15 C43 22 38 30 24 40 Z" fill="#f58fa6"/><path d="M14 16 q2 -4 6 -3" stroke="#fff" stroke-width="2.2" fill="none" opacity=".8"/>',
      splat: '<path d="M32 46 C20 38 16 32 17 26 C18 20 26 18 32 25 C38 18 46 20 47 26 C48 32 44 38 32 46 Z" fill="#f58fa6"/><path d="M12 20 C7 16 6 13 7 11 C8 9 11 8 12 11 C13 8 16 9 17 11 C18 13 17 16 12 20 Z" fill="#ffc2d1"/><path d="M52 16 C47 12 46 9 47 7 C48 5 51 4 52 7 C53 4 56 5 57 7 C58 9 57 12 52 16 Z" fill="#ffc2d1"/><path d="M14 52 C10 49 9 47 10 45 C11 43 13 43 14 45 C15 43 17 43 18 45 C19 47 18 49 14 52 Z" fill="#ffc2d1"/><path d="M52 50 C48 47 47 45 48 43 C49 41 51 41 52 43 C53 41 55 41 56 43 C57 45 56 47 52 50 Z" fill="#ffc2d1"/><path d="M32 8 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z" fill="#ffe08a" stroke-width="1.4"/>',
      say: ['接住了！我收下了', '你也太可愛了吧', '……被你砸得心跳好快', '這顆我要收好', '再丟一顆，我還要'] },
    tomato: { n: '番茄', v: '丟了番茄',
      icon: '<circle cx="24" cy="27" r="15" fill="#f0776a"/><path d="M24 13 L19 9 M24 13 L29 9 M24 13 L24 7 M24 13 L17 14 M24 13 L31 14" stroke="#5f9a5c" stroke-width="2.6" fill="none"/><path d="M15 24 q1.5 -4 5 -5" stroke="#fff" stroke-width="2.2" fill="none" opacity=".75"/>',
      splat: '<path d="M32 8 C38 14 46 8 48 16 C50 24 58 22 56 30 C54 38 60 44 52 48 C44 52 46 60 36 58 C28 56 24 62 18 56 C12 50 4 52 6 44 C8 36 2 32 8 26 C14 20 10 12 18 12 C24 12 26 4 32 8 Z" fill="#f0776a" fill-opacity=".9"/><circle cx="26" cy="30" r="2" fill="#ffe08a" stroke="none"/><circle cx="36" cy="26" r="2" fill="#ffe08a" stroke="none"/><circle cx="32" cy="38" r="2" fill="#ffe08a" stroke="none"/><path d="M20 56 q-1 6 -3 8 M44 54 q1 5 3 7" stroke="#f0776a" stroke-width="3" fill="none"/>',
      say: ['欸！番茄汁噴到眼睛了', '好啊你，敢丟我', '……我要報仇', '你完了', '我的臉！'] },
    egg: { n: '雞蛋', v: '丟了雞蛋',
      icon: '<ellipse cx="24" cy="26" rx="12" ry="15" fill="#fffaf0"/><path d="M17 20 q2 -5 6 -6" stroke="#e8dcc8" stroke-width="2" fill="none"/>',
      splat: '<path d="M30 6 C38 10 44 6 48 14 C52 22 60 26 56 34 C52 42 58 50 48 52 C40 54 38 62 30 58 C22 54 14 58 10 50 C6 42 2 36 8 28 C12 22 8 14 16 10 C22 8 24 2 30 6 Z" fill="#fffdf5" fill-opacity=".95"/><circle cx="31" cy="31" r="10" fill="#ffc94d"/><path d="M27 27 q2 -2 5 -2" stroke="#fff" stroke-width="2" fill="none"/><path d="M18 54 q-1 5 -2 8" stroke="#ffc94d" stroke-width="3" fill="none"/>',
      say: ['蛋黃流下來了……', '頭髮都黏住了啦', '你等著', '好腥……過來幫我擦'] },
    cake: { n: '蛋糕', v: '砸了蛋糕',
      icon: '<path d="M7 34 L41 34 L41 24 L7 17 Z" fill="#fbe3c4"/><path d="M7 17 L41 24 L41 20 Q24 9 7 13 Z" fill="#fff7fb"/><path d="M7 26 L41 30" stroke="#f4a7b9" stroke-width="2.6"/><circle cx="23" cy="11" r="3.4" fill="#e95b6b"/><path d="M23 8 q2 -4 5 -4" fill="none"/>',
      splat: '<path d="M30 4 C40 6 46 2 50 12 C54 20 62 24 58 34 C54 44 60 52 48 54 C38 56 34 62 26 58 C18 54 10 58 8 48 C6 40 0 34 6 26 C10 18 6 10 16 8 C22 6 22 2 30 4 Z" fill="#fff7fb"/><path d="M14 40 C20 34 26 44 32 38 C38 32 44 42 50 36" stroke="#f4a7b9" stroke-width="4" fill="none"/><circle cx="34" cy="22" r="5" fill="#e95b6b"/><circle cx="20" cy="26" r="2" fill="#a8d5a2" stroke="none"/><circle cx="44" cy="30" r="2" fill="#ffd36b" stroke="none"/>',
      say: ['……好甜', '浪費食物，罰你親我一下', '奶油在臉上，你幫我舔掉', '生日快樂？今天又不是我生日'] },
    water: { n: '一桶水', v: '潑了一桶水',
      icon: '<path d="M12 17 L36 17 L32 41 L16 41 Z" fill="#9cc3ea"/><ellipse cx="24" cy="17" rx="12" ry="4" fill="#d6e9f8"/><path d="M12 17 Q24 2 36 17" fill="none"/><path d="M16 26 L32 26" stroke="#d6e9f8" stroke-width="2"/>',
      splat: '<path d="M32 4 C36 14 30 16 32 22 C34 16 42 14 40 24" fill="none" stroke="#7fb0e0" stroke-width="3"/><path d="M14 16 C10 22 12 28 16 28 C20 28 22 22 14 16 Z" fill="#9cc3ea"/><path d="M48 12 C44 18 46 24 50 24 C54 24 56 18 48 12 Z" fill="#9cc3ea"/><path d="M8 40 C4 46 6 52 10 52 C14 52 16 46 8 40 Z" fill="#9cc3ea"/><path d="M54 38 C50 44 52 50 56 50 C60 50 62 44 54 38 Z" fill="#9cc3ea"/><path d="M30 46 C26 52 28 58 32 58 C36 58 38 52 30 46 Z" fill="#9cc3ea"/><path d="M20 34 q12 6 24 0" stroke="#7fb0e0" stroke-width="3" fill="none"/>',
      say: ['全濕了！', '冷死了，過來給我抱', '你是不是想看我濕透', '……我要換衣服了，你負責'] },
    pillow: { n: '枕頭', v: '丟了枕頭',
      icon: '<path d="M8 16 C8 11 12 12 24 12 C36 12 40 11 40 16 L40 32 C40 37 36 36 24 36 C12 36 8 37 8 32 Z" fill="#ffffff"/><path d="M8 16 l-3 -3 M40 16 l3 -3 M8 32 l-3 3 M40 32 l3 3" fill="none"/><path d="M18 22 q6 4 12 0" stroke="#e8dcf2" stroke-width="2" fill="none"/>',
      splat: '<path d="M32 6 L36 22 L52 18 L40 30 L54 42 L36 38 L32 56 L28 38 L10 42 L24 30 L12 18 L28 22 Z" fill="#fff3c4"/><path d="M8 10 q6 2 6 8 q-4 -2 -6 -8 Z M52 50 q6 2 6 8 q-4 -2 -6 -8 Z M50 6 q-2 6 2 10 q2 -6 -2 -10 Z" fill="#ffffff"/>',
      say: ['來啊，枕頭大戰', '哈哈哈哈好痛', '再丟我就親你喔', '你力氣好大'] }
  };
  var TOSS_BACK = ['換你了！', '接招！', '吃我這招', '看我的'];
  var HEART_BACK = ['也給你一顆', '還你一顆，加倍的', '接好喔'];
  var tM = null, tBusy = false, tTo = null;
  function tossOpen() {
    if (!tM) {
      tM = makeModal('cx-toss-modal', 'fa-face-grin-squint-tears', '搞怪');
      tM.body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-toss]'); if (!b) return;
        var k = b.dataset.toss; tM.close(); setTimeout(function () { tossAt(k, groupOn() ? tTo : null); }, 280);
      });
      bindChips(tM.body, function (n) { tTo = n; var t = tM.body.querySelector('.cx-toss-hint'); if (t) t.textContent = '選一個，朝 ' + n + ' 丟過去'; });
      tM.body.addEventListener('change', async function (e) { if (e.target.id === 'cx-toss-back') { X.toss.back = parseFloat(e.target.value) || 0; await save(); } });
    }
    var p = esc(pname()); if (!tTo || !groupPeople().some(function (x) { return x.name === tTo; })) tTo = pname();
    var chips = whoChips('cx-toss-who', tTo);
    tM.body.innerHTML = (chips ? '<div class="cx-who-t">丟誰</div>' + chips : '') + '<div class="cx-muted cx-toss-hint" style="text-align:center">選一個，朝 ' + esc(chips ? tTo : pname()) + ' 丟過去</div><div class="cx-toss">' +
      Object.keys(TOSS).map(function (k) { return '<button data-toss="' + k + '">' + svgWrap(TOSS[k].icon) + '<span>' + TOSS[k].n + '</span></button>'; }).join('') + '</div>' +
      '<label class="cx-row"><span>' + (chips ? '他們' : p) + ' 會不會丟回來</span><select class="cx-sel" id="cx-toss-back" style="width:auto">' +
      [[0, '不會'], [0.2, '偶爾'], [0.35, '有時'], [0.6, '常常']].map(function (o) { return '<option value="' + o[0] + '"' + (Math.abs((X.toss.back || 0) - o[0]) < 1e-6 ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
    tM.open();
  }
  function centerOf(sel, fb) {
    var el = document.querySelector(sel), r = el && el.getBoundingClientRect();
    if (r && r.width) return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el };
    return fb;
  }
  function fly(k, from, to, done) {
    var d = document.createElement('div'); d.className = 'cx-fly'; d.innerHTML = svgWrap(TOSS[k].icon);
    document.body.appendChild(d);
    var dx = to.x - from.x, dy = to.y - from.y, lift = Math.min(160, Math.abs(dy) * 0.35 + 60);
    var kf = [
      { transform: 'translate(' + (from.x - 22) + 'px,' + (from.y - 22) + 'px) rotate(0deg) scale(1)' },
      { transform: 'translate(' + (from.x + dx * 0.5 - 22) + 'px,' + (Math.min(from.y, to.y) - lift - 22) + 'px) rotate(260deg) scale(1.15)' },
      { transform: 'translate(' + (to.x - 22) + 'px,' + (to.y - 22) + 'px) rotate(520deg) scale(.9)' }
    ];
    var a = d.animate ? d.animate(kf, { duration: 720, easing: 'cubic-bezier(.35,.1,.55,1)' }) : null;
    var fin = function () { d.remove(); splat(k, to); if (done) done(); };
    if (a) a.onfinish = fin; else setTimeout(fin, 720);
  }
  function splat(k, at) {
    var s = document.createElement('div'); s.className = 'cx-splat'; s.innerHTML = svgWrap(TOSS[k].splat, '0 0 64 64');
    s.style.left = (at.x - 40) + 'px'; s.style.top = (at.y - 40) + 'px';
    document.body.appendChild(s);
    if (at.el) { at.el.classList.remove('cx-shake'); void at.el.offsetWidth; at.el.classList.add('cx-shake'); setTimeout(function () { at.el.classList.remove('cx-shake'); }, 700); }
    setTimeout(function () { s.classList.add('out'); }, 2600);
    setTimeout(function () { s.remove(); }, 3300);
  }
  function tossAt(k, who) {
    if (tBusy) return; tBusy = true;
    var tn = who || pname();
    var me = { x: window.innerWidth / 2, y: window.innerHeight - 90 };
    var him = centerOf('#partner-avatar', { x: 60, y: 90 });
    fly(k, me, him, function () {
      sysSay(myname() + ' 向 ' + tn + ' ' + TOSS[k].v);
      setTimeout(function () {
        sayAs(who, pick(TOSS[k].say));
        if (Math.random() < (X.toss.back || 0)) {
          var k2 = (k === 'heart' && Math.random() < 0.7) ? 'heart' : pick(Object.keys(TOSS));
          setTimeout(function () {
            sayAs(who, pick(k2 === 'heart' ? HEART_BACK : TOSS_BACK));
            setTimeout(function () {
              var from = centerOf('#partner-avatar', him), to = centerOf('#my-avatar', { x: window.innerWidth - 60, y: 90 });
              fly(k2, from, to, function () { sysSay(tn + ' 向 ' + myname() + ' ' + TOSS[k2].v); tBusy = false; });
            }, 900);
          }, 1600 + Math.random() * 1600);
        } else tBusy = false;
      }, 1200 + Math.random() * 1500);
    });
  }

  /* ================= TA 的手機 ================= */
  var PHONE_NOTES = ['好可愛', '存起來', '這句要記住', '截圖了', '偷偷存一下', '想你的時候拿出來看', '又在撒嬌', '笑死', '嘴硬', '這句我要記一輩子', '今天也好乖', '❤'];
  var phM = null, phSort = 'got', phWho = null;
  function phOwner(x) { return x.who || pname(); }
  function phoneNotes() { var l = X.phone.notes; return l && l.length ? l : PHONE_NOTES; }
  function userMsgs() {
    return allMsgs().filter(function (m) { return m && m.sender === 'user' && (!m.type || m.type === 'normal') && typeof m.text === 'string' && m.text.trim().length >= 2 && m.text.length <= 200; });
  }
  function phoneAdd(m) {
    if (X.phone.items.some(function (x) { return String(x.mid) === String(m.id); })) return false;
    var ppl = groupPeople(), it = { mid: m.id, text: m.text.trim(), at: +new Date(m.timestamp) || Date.now(), got: Date.now(), note: pick(phoneNotes()) };
    if (ppl.length > 1) it.who = pick(ppl).name;
    X.phone.items.unshift(it);
    X.phone.items = X.phone.items.slice(0, 300); X.phone.unread = (X.phone.unread || 0) + 1; return true;
  }
  function phoneTick() {
    var P = X.phone, u = userMsgs(); if (!u.length) return false;
    var last = u[u.length - 1].id, ch = false;
    if (!P.seeded) {
      P.seeded = true; ch = true;
      if (P.chance > 0) { var pool = u.slice(0, -1), n = Math.min(5, Math.round(pool.length * 0.03)); for (var i = 0; i < n; i++) phoneAdd(pick(pool)); }
    } else if (P.chance > 0) {
      var idx = -1; for (var j = u.length - 1; j >= 0; j--) { if (String(u[j].id) === String(P.seen)) { idx = j; break; } }
      var fresh = idx < 0 ? u.slice(-3) : u.slice(idx + 1);
      fresh.forEach(function (m) { if (Math.random() < P.chance && phoneAdd(m)) ch = true; });
    }
    if (String(P.seen) !== String(last)) { P.seen = last; ch = true; }
    return ch;
  }
  function phoneOpen() {
    if (!phM) {
      phM = makeModal('cx-phone-modal', 'fa-mobile-screen', 'TA 的手機');
      bindChips(phM.body, function (n) { phWho = n; phM.el.querySelector('.modal-title span').textContent = n + ' 的手機'; phoneRender(); });
      phM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.sort) { phSort = b.dataset.sort; phoneRender(); return; }
        if (b.dataset.del !== undefined) {
          if (!(await confirmAsync('從 ' + pname() + ' 的收藏裡刪掉這句？'))) return;
          var id = b.dataset.del; X.phone.items = X.phone.items.filter(function (x) { return String(x.mid) !== id; }); await save(); phoneRender(); return;
        }
        if (b.dataset.jump !== undefined) { var mid = b.dataset.jump; phM.close(); setTimeout(function () { jumpTo(mid); }, 300); return; }
        if (b.dataset.a === 'phsave') { var nl = phM.body.querySelector('#cx-ph-notes').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (!nl.length) { toast('至少要一句', 'warning'); return; } X.phone.notes = nl; await save(); toast('已儲存 ' + nl.length + ' 句', 'success'); return; }
        if (b.dataset.a === 'phreset') { X.phone.notes = null; await save(); phoneRender(); }
      });
      phM.body.addEventListener('change', async function (e) { if (e.target.id === 'cx-ph-ch') { X.phone.chance = parseFloat(e.target.value) || 0; await save(); } });
    }
    if (!phWho || !groupPeople().some(function (x) { return x.name === phWho; })) phWho = pname();
    if (!groupOn()) phWho = pname();
    phM.el.querySelector('.modal-title span').textContent = phWho + ' 的手機';
    X.phone.unread = 0; save(); refreshBadge();
    phoneRender(); phM.open();
  }
  function phoneRender() {
    var who = phWho || pname(), p = esc(who), items = X.phone.items.filter(function (x) { return !groupOn() || phOwner(x) === who; });
    if (phSort === 'at') items.sort(function (a, b) { return b.at - a.at; });
    var now = new Date();
    var pc = whoChips('cx-ph-who', who);
    phM.body.innerHTML = (pc ? '<div class="cx-who-t">看誰的手機</div>' + pc : '') + '<div class="cx-phone"><div class="cx-phone-top"><span>' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + '</span><span class="notch"></span><span><i class="fas fa-signal"></i> <i class="fas fa-battery-three-quarters"></i></span></div>' +
      '<div class="cx-phone-h"><i class="fas fa-star"></i> 收藏 <small>' + items.length + '</small><span class="cx-phone-sort"><button data-sort="got" class="' + (phSort === 'got' ? 'on' : '') + '">收藏時間</button><button data-sort="at" class="' + (phSort === 'at' ? 'on' : '') + '">說話時間</button></span></div>' +
      '<div class="cx-phone-list">' + (items.length ? items.map(function (x) {
        return '<div class="cx-pi"><div class="q">' + esc(x.text) + '</div><div class="m"><span class="note">✎ ' + esc(x.note) + '</span><span>' + fmtTime(phSort === 'at' ? x.at : x.got) + (phSort === 'at' ? ' 說的' : ' 收藏') + '</span></div>' +
          '<div class="act"><button data-jump="' + esc(x.mid) + '">看原文</button><button data-del="' + esc(x.mid) + '" aria-label="刪除"><i class="fas fa-trash"></i></button></div></div>';
      }).join('') : '<div class="cx-muted" style="text-align:center;padding:30px 10px">還沒有收藏<br>多跟 ' + p + ' 聊天，他會偷偷存下你說的話</div>') + '</div></div>' +
      '<div class="cx-sec"><h4>偷偷收藏的頻率</h4><select class="cx-sel" id="cx-ph-ch">' + [[0, '不要收藏'], [0.02, '偶爾'], [0.04, '有時'], [0.08, '常常']].map(function (o) { return '<option value="' + o[0] + '"' + (Math.abs(X.phone.chance - o[0]) < 1e-6 ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<div class="cx-muted">你在聊天裡說的話，' + (pc ? '他們' : p) + ' 有時會偷偷存進手機，還會寫一句小備註。</div>' +
      '<details><summary class="cx-muted" style="cursor:pointer">他寫的小備註（一行一句）</summary><textarea class="cx-ta" id="cx-ph-notes">' + esc(phoneNotes().join('\n')) + '</textarea>' +
      '<div class="cx-btns"><button class="cx-btn pri" data-a="phsave">儲存備註</button><button class="cx-btn" data-a="phreset">恢復預設</button></div></details></div>';
  }

  /* ================= 陪伴模式 + 他來約你 ================= */
  var MODES = {
    study: { e: '📚', label: '一起讀書', hours: [9, 23], gap: [180, 420],
      say: ['專心喔，我在旁邊陪你', '寫到哪了？', '累了就喝口水', '你認真的樣子好好看', '不准偷看手機', '再撐一下下', '我也在看書，陪你'],
      ask: ['要不要一起讀書？我陪你', '該念書囉，我陪你一起'], end: '辛苦了，今天也很努力' },
    work: { e: '💼', label: '一起工作', hours: [9, 19], gap: [180, 420],
      say: ['今天也辛苦了', '我在，慢慢來', '記得伸個懶腰', '忙完了要來找我', '加油，你最棒', '別太累了', '要不要休息五分鐘'],
      ask: ['一起努力工作吧，我陪你', '今天也一起上班吧'], end: '下班囉，過來讓我抱一下' },
    exercise: { e: '🏃', label: '一起運動', hours: [7, 21], gap: [60, 150],
      say: ['衝啊！', '再一組！', '記得補水', '流汗的樣子也好看', '呼吸跟上', '最後一下了', '好厲害，我好驕傲'],
      ask: ['走，一起去運動！', '動一動吧，我陪你'], end: '好棒！記得拉筋喔' },
    sleep: { e: '🌙', label: '一起睡覺', hours: [21, 25], gap: [60, 120],
      say: ['閉上眼睛', '我在這裡，不走', '晚安，做個好夢', '抱著你睡', '別滑手機了，乖', '睡吧，我守著你'],
      ask: ['該睡覺了，我陪你睡好不好？', '很晚了，我們一起睡吧'], end: '早安，睡得好嗎？' }
  };
  var DECLINE = ['好吧，那我等你', '下次一定要陪我喔', '哼，好啦', '那你忙，我在這裡'];
  var INV_GAP = { low: [18, 36], mid: [6, 12] };
  function modeOk(k, h) { var r = MODES[k].hours; return r[1] > 24 ? (h >= r[0] || h < r[1] - 24) : (h >= r[0] && h < r[1]); }
  function invSchedule() { var g = INV_GAP[X.comp.invite]; X.comp.inviteNext = g ? Date.now() + rnd(g[0], g[1]) * 3600e3 : 0; }
  function busyNow() { return callConnected() || !!(cState && cState.started) || !!document.getElementById('cx-inv'); }
  function inviteTick() {
    var C = X.comp; if (!INV_GAP[C.invite]) return false;
    if (!C.inviteNext) { invSchedule(); return true; }
    if (Date.now() < C.inviteNext) return false;
    var h = new Date().getHours(), ok = Object.keys(MODES).filter(function (k) { return modeOk(k, h); });
    if (!ok.length || busyNow()) { C.inviteNext = Date.now() + rnd(1, 3) * 3600e3; return true; }
    var k = pick(ok), ask = pick(MODES[k].ask);
    partnerSays(ask); showInvite(k, ask); invSchedule(); return true;
  }
  function showInvite(k, ask) {
    var o = document.createElement('div'); o.id = 'cx-inv'; o.className = 'cx-inv';
    o.innerHTML = '<div class="cx-inv-card"><div class="av">' + partnerAvatar() + '</div><div class="t">' + esc(pname()) + ' 約你' + MODES[k].label + ' ' + MODES[k].e + '</div><div class="q">「' + esc(ask) + '」</div>' +
      '<div class="cx-btns"><button class="cx-btn" data-i="no">下次吧</button><button class="cx-btn pri" data-i="yes">好啊</button></div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return; o.remove();
      if (b.dataset.i === 'yes') { await load(); compOpen(); startMode(k); }
      else setTimeout(function () { partnerSays(pick(DECLINE)); }, 1200);
    });
  }
  function modeLines(k) { var c = X.comp.modeLines && X.comp.modeLines[k]; return c && c.length ? c : MODES[k].say; }
  function startMode(k) {
    if (cState && cState.started) compStop();
    cState = { kind: 'mode', mode: k, title: MODES[k].label, started: Date.now(), toChat: false };
    X.comp.run = { mode: k, started: cState.started, toChat: false }; save();
    sysSay(MODES[k].e + ' 和 ' + pname() + ' ' + MODES[k].label + '中');
    cM.view = 'mode'; compRender(); modeLive();
  }
  function modeLive() {
    clearInterval(cTimer);
    var M = cState.mode, g = MODES[M].gap, said = 0, next = Date.now() + rnd(g[0], g[1]) * 1000;
    cTimer = setInterval(function () {
      if (!cState.started) return;
      if (!cM.isOpen()) { pillUpdate(); return; }
      var el = cM.body.querySelector('#cx-m-clock');
      if (el) { var s = Math.floor((Date.now() - cState.started) / 1000); el.textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); }
      if (M === 'sleep' && said >= 3) return;
      if (Date.now() >= next) { compSay(line(modeLines(M))); said++; next = Date.now() + rnd(g[0], g[1]) * 1000; }
    }, 1000);
  }
  var noise = null;
  function noiseStop() { if (!noise) return; try { noise.src.stop(); noise.ctx.close(); } catch (e) {} noise = null; }
  function noiseStart(kind) {
    noiseStop(); if (!kind || kind === 'off') return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var ctx = new AC(), len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; if (kind === 'white') d[i] = w * 0.2; else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var gain = ctx.createGain(); gain.gain.value = kind === 'white' ? 0.35 : 0.9;
    var node = src;
    if (kind === 'rain') { var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400; var nb = ctx.createBufferSource(); var b2 = ctx.createBuffer(1, len, ctx.sampleRate), d2 = b2.getChannelData(0); for (var j = 0; j < len; j++) d2[j] = (Math.random() * 2 - 1) * 0.12; nb.buffer = b2; nb.loop = true; var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; nb.connect(hp); hp.connect(lp); lp.connect(gain); nb.start(); }
    if (kind === 'waves') { var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.45; lfo.connect(lg); lg.connect(gain.gain); lfo.start(); }
    node.connect(gain); gain.connect(ctx.destination); src.start();
    noise = { ctx: ctx, src: src };
  }
  var NOISES = [['off', '不要'], ['white', '白噪音'], ['rain', '雨聲'], ['waves', '海浪']];
  function modeRender(b, p) {
    var M = MODES[cState.mode];
    if (cState.ending) {
      b.innerHTML = '<div class="cx-mode"><div class="ic">' + M.e + '</div><div class="t">' + M.label + '了 ' + Math.max(1, Math.round((Date.now() - cState.started) / 60e3)) + ' 分鐘</div></div>' +
        sayHtml(M.end) + '<div class="cx-sec"><h4>寫進陪伴日記</h4><textarea class="cx-ta" id="cx-m-note" placeholder="今天做了什麼、心情怎麼樣（可不填）" maxlength="300"></textarea><button class="cx-btn pri" data-c="msave">存進日記</button></div>';
      return;
    }
    b.innerHTML = '<div class="cx-mode"><div class="ic">' + M.e + '</div><div class="t">和 ' + p + ' ' + M.label + '中</div><div class="clock" id="cx-m-clock">00:00</div></div>' +
      '<div class="cx-feed" id="cx-feed">' + sayHtml(pick(modeLines(cState.mode))) + '</div>' +
      '<label class="cx-row"><span>背景聲</span><select class="cx-sel" id="cx-m-noise" style="width:auto">' + NOISES.map(function (n) { return '<option value="' + n[0] + '"' + ((X.comp.noise || 'off') === n[0] ? ' selected' : '') + '>' + n[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="qa-chk"><input type="checkbox" id="cx-c-chat"' + (cState.toChat ? ' checked' : '') + '>把 ' + p + ' 說的話也傳到聊天</label>' +
      '<button class="cx-btn pri" data-c="mend">結束陪伴</button>';
  }
  var KIND_ICON = { listen: '🎵 ', watch: '🎬 ', read: '📖 ', study: '📚 ', work: '💼 ', exercise: '🏃 ', sleep: '🌙 ' };
  function histLi(h, i, edit) {
    return '<div class="cx-li cx-hist"><div>' + (KIND_ICON[h.k] || '') + esc(h.t) + '<div class="s">' + fmtTime(h.at) + ' · ' + h.min + ' 分鐘</div>' +
      (edit ? '<textarea class="cx-ta" id="cx-hn-' + i + '" maxlength="300" style="min-height:70px;margin-top:6px">' + esc(h.note || '') + '</textarea><button class="cx-btn pri" data-savenote="' + i + '" style="margin-top:6px">儲存</button>'
        : (h.note ? '<div class="cx-note">' + esc(h.note) + '</div>' : '')) + '</div>' +
      (edit ? '' : '<button class="cx-x" data-editnote="' + i + '" aria-label="寫備註"><i class="fas fa-pen"></i></button>') + '</div>';
  }
  function hubModes(p) {
    return '<div class="cx-sec"><h4>陪伴模式</h4><div class="cx-modes">' + Object.keys(MODES).map(function (k) { return '<button data-m="' + k + '"><span>' + MODES[k].e + '</span>' + MODES[k].label + '</button>'; }).join('') + '</div></div>';
  }
  function hubInvite(p) {
    return '<label class="cx-row"><span>' + p + ' 主動來約你</span><select class="cx-sel" id="cx-inv-freq" style="width:auto">' + [['off', '不要'], ['low', '偶爾（一兩天一次）'], ['mid', '常常（一天幾次）']].map(function (o) { return '<option value="' + o[0] + '"' + (X.comp.invite === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
  }



  /* ================= 群聊：選對象（寫信、丟東西、拍一拍） ================= */
  function gcs() { try { return (typeof groupChatSettings !== 'undefined') ? groupChatSettings : null; } catch (e) { return null; } }
  function groupOn() { var g = gcs(); return !!(g && g.enabled && g.members && g.members.length); }
  function groupPeople() {
    var g = gcs(), list = [];
    if (!groupOn()) return list;
    var main = pname(), seen = {};
    g.members.forEach(function (m) { if (m && m.name && !seen[m.name]) { seen[m.name] = 1; list.push({ name: m.name, avatar: m.avatar || '' }); } });
    if (!seen[main]) list.unshift({ name: main, avatar: (document.querySelector('#partner-avatar img') || {}).src || '' });
    return list;
  }
  function replyGroup(gname) { var gs = window.customReplyGroups || []; for (var i = 0; i < gs.length; i++) { if (gs[i] && gs[i].name === gname && Array.isArray(gs[i].items) && gs[i].items.length) return gs[i].items; } return null; }
  function gcharOf(name) { var c = X && X.gchar && X.gchar[name]; return { on: c ? c.on !== false : true, group: (c && c.group) || name }; }
  /* 角色專屬字卡：限定時只由本人說；不限定就當一般字卡隨機分配 */
  function charGroup(name) { var c = gcharOf(name); return c.on ? replyGroup(c.group) : null; }
  function pickFor(name) {
    var own = name && groupOn() ? charGroup(name) : null, gen = name && groupOn() ? poolFor(name) : cards();
    if (own && own.length && (Math.random() < 0.6 || !gen.length)) return pick(own);
    return gen.length ? pick(gen) : '';
  }
  function charOfText(t) {
    if (!groupOn() || !t) return null;
    var ppl = groupPeople();
    for (var i = 0; i < ppl.length; i++) { var it = charGroup(ppl[i].name); if (it && it.indexOf(t) >= 0) return ppl[i].name; }
    return null;
  }
  /* 一般字卡：扣掉別的角色專屬的句子 */
  function poolFor(name) {
    var all = (typeof customReplies !== 'undefined' && customReplies) || [], other = {};
    groupPeople().forEach(function (p) { if (p.name !== name) (charGroup(p.name) || []).forEach(function (x) { other[x] = 1; }); });
    return all.filter(function (x) { return x && !other[x]; });
  }
  var pendingWho = null;
  function speakAs(name, ms) { pendingWho = { name: name, since: Date.now() - 5, until: Date.now() + (ms || 6 * 60e3), hit: false }; }
  function memberBy(name) { var g = gcs(); return g && g.members ? g.members.find(function (m) { return m.name === name; }) : null; }
  (function wrapSpeaker() {
    var orig = window.getGroupMemberForMessage;
    if (typeof orig !== 'function' || orig.__cx) return;
    var w = function (id) {
      if (!groupOn()) return orig(id);
      var key = String(id), msg = allMsgs().find(function (x) { return String(x.id) === key; });
      if (msg && msg.cxFrom) { var m0 = memberBy(msg.cxFrom); if (m0) return m0; }
      if (pendingWho && msg && msg.sender !== 'user' && (!msg.type || msg.type === 'normal') && Date.now() < pendingWho.until && Number(id) >= pendingWho.since) {
        var m1 = memberBy(pendingWho.name);
        if (m1) { msg.cxFrom = m1.name; if (!pendingWho.hit) { pendingWho.hit = true; pendingWho.until = Date.now() + 5000; } gfromSave(); return m1; }
      }
      var who = msg && charOfText(String(msg.text || '').trim());
      if (who) { var m2 = memberBy(who); if (m2) return m2; }
      return orig(id);
    };
    w.__cx = true; window.getGroupMemberForMessage = w;
  })();
  var gfT = null;
  function gfromSave() { clearTimeout(gfT); gfT = setTimeout(function () { try { if (typeof throttledSaveData === 'function') throttledSaveData(); else if (typeof saveData === 'function') saveData(); } catch (e) {} }, 800); }
  function sayAs(name, text) { partnerSays(text, name && groupOn() ? name : null); }
  function whoChips(id, sel) {
    var ppl = groupPeople(); if (ppl.length < 2) return '';
    return '<div class="cx-who" id="' + id + '">' + ppl.map(function (p) {
      return '<button type="button" data-who="' + esc(p.name) + '" class="' + (p.name === sel ? 'on' : '') + '"><span class="av">' + (p.avatar ? '<img src="' + esc(p.avatar) + '" alt="">' : esc(p.name.slice(0, 1))) + '</span>' + esc(p.name) + '</button>';
    }).join('') + '</div>';
  }
  function bindChips(root, onPick) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.cx-who [data-who]'); if (!b) return;
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      onPick(b.dataset.who);
    });
  }

  /* 群聊設定裡：角色專屬字卡要不要限定 */
  function gcharInit() {
    var sec = document.getElementById('group-members-section'); if (!sec || document.getElementById('cx-gchar')) return;
    var box = document.createElement('div'); box.id = 'cx-gchar'; box.className = 'cx-gchar';
    sec.appendChild(box);
    box.addEventListener('change', async function (e) {
      var t = e.target, n = t.dataset.gc || t.dataset.gg; if (!n) return;
      await load(); var c = X.gchar[n] || (X.gchar[n] = {});
      if (t.dataset.gc) c.on = t.checked; else c.group = t.value;
      await save(); gcharRender();
      try { renderMessages(); } catch (er) {}
    });
    var orig = window.renderGroupMembersList;
    if (typeof orig === 'function') window.renderGroupMembersList = function () { var r = orig.apply(this, arguments); try { gcharRender(); } catch (er) {} return r; };
    var gm = document.getElementById('group-chat-modal');
    if (gm) new MutationObserver(function () { if (gm.style.display && gm.style.display !== 'none') gcharRender(); }).observe(gm, { attributes: true, attributeFilter: ['style', 'class'] });
    gcharRender();
  }
  function gcharRender() {
    var box = document.getElementById('cx-gchar'), g = gcs(); if (!box || !X) return;
    var mem = (g && g.members || []).filter(function (m) { return m && m.name; });
    if (!mem.length) { box.innerHTML = ''; return; }
    var groups = (window.customReplyGroups || []).filter(function (x) { return x && x.name; });
    box.innerHTML = '<div class="settings-section-title"><span><i class="fas fa-user-tag"></i>角色專屬字卡</span></div>' +
      '<div class="cx-muted" style="margin:-4px 0 8px">勾起來：那組字卡只會由他本人說。不勾：那組字卡在群聊裡隨機分給大家說。</div>' +
      mem.map(function (m) {
        var c = gcharOf(m.name), has = !!replyGroup(c.group);
        return '<div class="cx-gc-row"><label class="qa-chk" style="flex:1;margin:0"><input type="checkbox" data-gc="' + esc(m.name) + '"' + (c.on && has ? ' checked' : '') + (has ? '' : ' disabled') + '>只由 ' + esc(m.name) + ' 說</label>' +
          '<select class="cx-sel" data-gg="' + esc(m.name) + '" style="width:auto;max-width:46%">' + (has ? '' : '<option value="">選字卡組</option>') +
          groups.map(function (x) { return '<option value="' + esc(x.name) + '"' + (x.name === c.group ? ' selected' : '') + '>' + esc(x.name) + '（' + (x.items || []).length + '）</option>'; }).join('') + '</select></div>';
      }).join('');
  }

  /* 寫信：寄給誰 */
  var envTo = null;
  function envWhoInit() {
    var form = document.getElementById('env-compose-form'), paper = form && form.querySelector('.env-compose-paper');
    if (!form || !paper || document.getElementById('cx-env-who-wrap')) return;
    var wrap = document.createElement('div'); wrap.id = 'cx-env-who-wrap'; form.insertBefore(wrap, paper);
    bindChips(wrap, function (n) { envTo = n; });
    var oo = window.openNewEnvelopeForm;
    if (typeof oo === 'function') window.openNewEnvelopeForm = function () {
      var r = oo.apply(this, arguments);
      envTo = pname();
      var h = whoChips('cx-env-who', envTo); wrap.innerHTML = h ? '<div class="cx-who-t">寄給</div>' + h : '';
      return r;
    };
    var sb = document.getElementById('send-envelope');
    if (sb) sb.addEventListener('click', function () {
      var to = groupOn() ? envTo : null, t0 = Date.now();
      setTimeout(function () {
        var d = envData(); if (!d || !to || to === pname()) return;
        var l = d.outbox[d.outbox.length - 1];
        if (l && !l.to && Number(String(l.id).split('_')[1]) >= t0 - 50) { l.to = to; try { saveEnvelopeData(); renderEnvelopeLists(); } catch (e) {} toast('信已寄給 ' + to + ' ✉️', 'success'); }
      }, 0);
    }, true);
    /* 回信：寄給誰就由誰回，用他自己的字卡 */
    if (typeof window.checkEnvelopeStatus === 'function') window.checkEnvelopeStatus = async function () {
      await loadEnvelopeData();
      var now = Date.now(), changed = false, last = null;
      envelopeData.outbox.forEach(function (letter) {
        if (letter.status === 'pending' && now >= letter.replyTime) {
          letter.status = 'replied';
          var from = letter.to || '';
          var il = { id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), refId: letter.id, originalContent: letter.content, content: from ? memberLetter(from) : generateEnvelopeReplyText(), receivedTime: Date.now(), isNew: true };
          if (from) il.from = from;
          envelopeData.inbox.push(il); last = il; changed = true;
          try { playSound('message'); } catch (e) {}
        }
      });
      if (changed) {
        saveEnvelopeData();
        if (last) {
          showEnvelopeReplyPopup(last);
          var pp = document.getElementById('envelope-reply-popup');
          if (pp && last.from) pp.innerHTML = pp.innerHTML.replace('Ta 給你寫了回信', esc(last.from) + ' 給你寫了回信');
          sysNotify((last.from || pname()) + ' 給你寫了回信', '💌 快去信箱看看', 'cx-env');
        }
      }
    };
    var ov = window.viewEnvLetter;
    window.viewEnvLetter = function (sec, id) {
      var r = ov.apply(this, arguments), l = envFind(sec, id);
      if (l && sec === 'outbox' && l.to) { var tl = document.getElementById('env-view-to-line'); if (tl) tl.textContent = '致 ' + l.to + '：'; }
      if (l && sec === 'inbox' && l.from) { var sn = document.getElementById('env-view-sign-name'); if (sn) sn.textContent = l.from; }
      return r;
    };
  }
  function memberLetter(name) {
    var own = charGroup(name) || [], gen = poolFor(name), n = 8 + Math.floor(Math.random() * 5), out = '';
    for (var i = 0; i < n; i++) {
      var src = own.length && (Math.random() < 0.55 || !gen.length) ? own : gen; if (!src.length) break;
      var ln = String(src[Math.floor(Math.random() * src.length)]).trim();
      out += ln + (/[。！？!?…~～」』）)♡❤]$/.test(ln) || /[\u2000-\u2BFF\uD83C-\uDBFF]$/.test(ln) ? '' : (Math.random() < 0.2 ? '！' : (Math.random() < 0.2 ? '......' : '。')));
    }
    return out || '……想你了。';
  }
  /* 開網站時原版先回了信的話，補上是誰回的 */
  function envFixFrom() {
    var d = envData(); if (!d) return false; var ch = false;
    d.inbox.forEach(function (il) {
      if (il.from || !il.refId) return;
      var o = d.outbox.find(function (x) { return x.id === il.refId; });
      if (o && o.to) { il.from = o.to; if (il.isNew) il.content = memberLetter(o.to); ch = true; }
    });
    if (ch) { try { saveEnvelopeData(); renderEnvelopeLists(); } catch (e) {} }
    return ch;
  }
  /* 信件列表上標出寄給誰／誰回的 */
  function envWhoLabels() {
    ['outbox', 'inbox'].forEach(function (sec) {
      var list = document.getElementById('env-' + sec + '-list'); if (!list) return;
      list.querySelectorAll('.env-letter-item').forEach(function (it) {
        var m = /viewEnvLetter\('(\w+)','([^']+)'\)/.exec(it.getAttribute('onclick') || ''); if (!m) return;
        var l = envFind(m[1], m[2]), who = l && (sec === 'outbox' ? l.to : l.from), h = it.querySelector('.env-letter-header-from');
        if (!who || !h || h.querySelector('.cx-env-who')) return;
        var s = document.createElement('span'); s.className = 'cx-env-who'; s.textContent = sec === 'outbox' ? ' · 給 ' + who : ' · ' + who; h.appendChild(s);
      });
    });
  }

  /* 拍一拍：拍誰（自定義只要打動作，名字會自動補上） */
  var pokeTo = null;
  var POKE_PH = '打動作就好，例如：抱抱、摸摸你的頭';
  function pokeCompose(raw, to) {
    var me = myname(), t = String(raw || '').replace(/[「」『』“”"]/g, '').replace(/\s+/g, ' ').trim();
    if (t.indexOf(me) === 0) t = t.slice(me.length).trim();
    if (!t) return me + ' 拍了拍 ' + to;
    t = t.replace(/對方|你|妳/g, to);
    var named = t.indexOf(to) >= 0 || groupPeople().some(function (p) { return p.name && t.indexOf(p.name) >= 0; });
    if (!named) t = t.length <= 3 ? t + to : '對' + to + t;
    return me + ' ' + t;
  }
  function pokeWhoInit() {
    var pm = document.getElementById('poke-modal'), inp = document.getElementById('poke-input'), sb = document.getElementById('send-poke');
    if (!pm || !inp || !sb || document.getElementById('cx-poke-who-wrap')) return;
    var wrap = document.createElement('div'); wrap.id = 'cx-poke-who-wrap'; inp.parentNode.insertBefore(wrap, inp);
    var prev = document.createElement('div'); prev.id = 'cx-poke-prev'; prev.className = 'cx-muted'; prev.style.cssText = 'margin:6px 2px 0;min-height:1.4em'; inp.parentNode.insertBefore(prev, inp.nextSibling);
    function showPrev() { var v = inp.value.trim(); prev.textContent = v ? '會顯示：' + pokeCompose(v, pokeTo || pname()) : ''; }
    inp.addEventListener('input', showPrev);
    bindChips(wrap, function (n) { pokeTo = n; showPrev(); });
    new MutationObserver(function () {
      var open = pm.style.display && pm.style.display !== 'none';
      if (open && !wrap.dataset.open) { wrap.dataset.open = '1'; pokeTo = pname(); inp.placeholder = POKE_PH; var h = whoChips('cx-poke-who', pokeTo); wrap.innerHTML = h ? '<div class="cx-who-t">拍誰</div>' + h : ''; showPrev(); }
      if (!open) delete wrap.dataset.open;
    }).observe(pm, { attributes: true, attributeFilter: ['style', 'class'] });
    sb.addEventListener('click', function () {
      var to = (groupOn() && pokeTo) ? pokeTo : pname();
      inp.value = pokeCompose(inp.value, to);
      if (groupOn()) speakAs(to);
      setTimeout(function () { prev.textContent = ''; }, 0);
    }, true);
  }

  /* 表情 › 拍一拍 的快捷動作：換成拍一拍庫裡的動作，「你」換成你拍的人 */
  var qpTo = null;
  function qpList() { var me = myname(); return ((typeof customPokes !== 'undefined' && customPokes) || []).filter(function (t) { return t && typeof t === 'string' && t.indexOf(me) < 0; }); }
  function qpText(t, to) {
    try { if (typeof window._sanitizePokeTextForDisplay === 'function') t = window._sanitizePokeTextForDisplay(t); } catch (e) {}
    return /你|妳|對方/.test(t) ? t.replace(/你|妳|對方/g, to) : t;
  }
  function qpDecorate(v) {
    var list = qpList(); if (!list.length) return;
    v.dataset.cx = '1';
    if (!qpTo || (groupOn() && !groupPeople().some(function (p) { return p.name === qpTo; })) || (!groupOn() && qpTo !== pname())) qpTo = pname();
    var title = Array.prototype.find.call(v.children, function (x) { return !x.className && /快捷動作/.test(x.textContent); });
    v.querySelectorAll('.poke-quick-item').forEach(function (x) { x.remove(); });
    var box = document.createElement('div'); box.id = 'cx-qp';
    var chips = whoChips('cx-qp-who', qpTo);
    if (title) title.after(box); else v.appendChild(box);
    function draw() {
      box.innerHTML = (chips ? whoChips('cx-qp-who', qpTo) : '') + list.map(function (t, i) { return '<div class="poke-quick-item" data-qp="' + i + '">' + esc(qpText(t, qpTo)) + '</div>'; }).join('');
    }
    draw();
    box.addEventListener('click', function (e) {
      var c = e.target.closest('.cx-who [data-who]');
      if (c) { e.stopPropagation(); qpTo = c.dataset.who; draw(); return; }
      var it = e.target.closest('[data-qp]'); if (!it) return;
      e.stopPropagation();
      var txt = myname() + ' ' + qpText(list[+it.dataset.qp], qpTo);
      try { txt = _formatPokeText(txt); } catch (e2) {}
      if (groupOn()) speakAs(qpTo);
      addMessage({ id: Date.now(), text: txt, timestamp: new Date(), type: 'system' });
      try { playSound('poke'); } catch (e3) {}
      var pk = document.getElementById('user-sticker-picker'); if (pk) pk.classList.remove('active');
      try { var d = settings.replyDelayMin + Math.random() * (settings.replyDelayMax - settings.replyDelayMin); setTimeout(simulateReply, d); } catch (e4) { try { setTimeout(simulateReply, 1500); } catch (e5) {} }
    });
  }
  (function qpInit() {
    var ca = document.getElementById('combo-content-area'); if (!ca) return;
    new MutationObserver(function () { var v = ca.querySelector('.poke-list-view'); if (v && !v.dataset.cx) qpDecorate(v); }).observe(ca, { childList: true, subtree: true });
    var s2 = document.createElement('style'); s2.textContent = '#cx-qp .cx-who{margin:0 0 8px}#cx-qp .poke-quick-item{margin-bottom:6px}';
    document.head.appendChild(s2);
  })();



  /* ================= 群聊設定改成每個聊天室各自一份 ================= */
  (function perSessionGroup() {
    var GKEY = 'groupChatSettings', FLAG = 'cxGcPerSession';
    function lsg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lss(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function sid() { try { return SESSION_ID || null; } catch (e) { return null; } }
    function plain(g) {
      return { enabled: !!g.enabled, showAvatar: g.showAvatar !== false, showName: g.showName !== false,
        members: (g.members || []).map(function (m) { return { name: m.name, id: m.id, avatarRef: m.avatarRef || (m.id ? 'gca_' + m.id : undefined) }; }) };
    }
    function apply(id) {
      var g = gcs(); if (!g) return;
      var raw = lsg(GKEY + '_' + id);
      if (!raw) {
        /* 第一次更新：現有的每個聊天室都先拿一份目前的設定，之後就各自獨立；新開的聊天室從關閉開始 */
        var base = lsg(GKEY);
        var data = lsg(FLAG) ? { enabled: false, showAvatar: true, showName: true, members: [] } : (base ? JSON.parse(base) : plain(g));
        if (!lsg(FLAG)) {
          var list = []; try { list = (typeof sessionList !== 'undefined' && sessionList) || []; } catch (e) {}
          list.forEach(function (x) { if (x && x.id && !lsg(GKEY + '_' + x.id)) lss(GKEY + '_' + x.id, JSON.stringify(data)); });
          lss(FLAG, '1');
        }
        raw = JSON.stringify(data); lss(GKEY + '_' + id, raw);
      }
      var d; try { d = JSON.parse(raw) || {}; } catch (e) { d = {}; }
      g.enabled = !!d.enabled; g.showAvatar = d.showAvatar !== false; g.showName = d.showName !== false;
      g.members = (d.members || []).map(function (m) { return { name: m.name, id: m.id, avatarRef: m.avatarRef, avatar: null }; });
      Promise.all(g.members.map(function (m) {
        var ref = m.avatarRef || (m.id ? 'gca_' + m.id : null); if (!ref || !window.localforage) return null;
        return localforage.getItem(ref).then(function (a) { m.avatar = a || null; }).catch(function () {});
      })).then(function () {
        try { if (typeof updateGroupModeUI === 'function') updateGroupModeUI(); } catch (e) {}
        try { if (typeof renderGroupMembersList === 'function') renderGroupMembersList(); } catch (e) {}
        try { if (typeof renderMessages === 'function') renderMessages(); } catch (e) {}
        syncToggles();
      });
      var os = window.saveGroupChatSettings;
      if (typeof os === 'function' && !os.__cx) {
        var w = function () { var r = os.apply(this, arguments); var cur = sid(); if (cur) lss(GKEY + '_' + cur, JSON.stringify(plain(gcs()))); return r; };
        w.__cx = true; window.saveGroupChatSettings = w;
      }
    }
    function syncToggles() {
      var g = gcs(); if (!g) return;
      [['group-chat-enabled-toggle', 'enabled'], ['group-show-avatar-toggle', 'showAvatar'], ['group-show-name-toggle', 'showName']].forEach(function (p) { var el = document.getElementById(p[0]); if (el && el.type === 'checkbox') el.checked = !!g[p[1]]; });
    }
    var tries = 0;
    (function wait() { var id = sid(); if (id) { try { apply(id); } catch (e) { console.warn('[cx] group per session', e); } return; } if (++tries < 150) setTimeout(wait, 200); })();
  })();

  /* ================= 整理空間（清圖片、清暫存） ================= */
  var clnM = null, clnInfo = null;
  function szOf(v) { if (v == null) return 0; var s = typeof v === 'string' ? v : JSON.stringify(v); return s ? s.length * 2 : 0; }
  function mb(b) { return b < 1048576 ? (b / 1024).toFixed(b < 102400 ? 1 : 0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
  function sessions() { try { return (typeof sessionList !== 'undefined' && sessionList) || []; } catch (e) { return []; } }
  function curSid() { try { return SESSION_ID; } catch (e) { return null; } }
  function pfx() { return window.APP_PREFIX || 'CHAT_APP_V3_'; }
  function stkSet(lists) { var set = {}; (lists || []).forEach(function (l) { (l || []).forEach(function (x) { var v = typeof x === 'string' ? x : (x && (x.src || x.url || x.data)); if (v) set[v] = 1; }); }); return set; }
  function curStickers() { var a = [], b = []; try { a = stickerLibrary || []; } catch (e) {} try { b = myStickerLibrary || []; } catch (e) {} return stkSet([a, b]); }
  async function sessStickers(sid) { var P = pfx(), a = null, b = null; try { a = await localforage.getItem(P + sid + '_stickerLibrary'); } catch (e) {} try { b = await localforage.getItem(P + sid + '_myStickerLibrary'); } catch (e) {} return stkSet([a, b]); }
  function imgBytes(arr, stk) { var n = 0, b = 0, sn = 0, sb = 0, u = {}, ub = 0; (arr || []).forEach(function (m) { if (m && typeof m.image === 'string' && m.image) { if (stk && stk[m.image]) { sn++; sb += m.image.length * 2; if (!u[m.image]) { u[m.image] = 1; ub += m.image.length * 2; } } else { n++; b += m.image.length * 2; } } }); return { n: n, b: b, sn: sn, sb: sb, su: Object.keys(u).length, sub: ub }; }
  function isStkKey(k) { return /_(stickerLibrary|myStickerLibrary)$/.test(k); }
  function stkSrc(x) { return typeof x === 'string' ? x : (x && x.src) || ''; }
  function isAnim(src) {
    if (/^data:image\/gif/i.test(src)) return true;
    try { var head = atob(src.split(',')[1].slice(0, 4000)); return /ANIM|acTL/.test(head); } catch (e) { return false; }
  }
  async function stkScan() {
    var ks = []; try { ks = (await localforage.keys()).filter(isStkKey); } catch (e) {}
    var n = 0, b = 0, gif = 0, seen = {};
    for (var i = 0; i < ks.length; i++) { var v = null; try { v = await localforage.getItem(ks[i]); } catch (e) {} (Array.isArray(v) ? v : []).forEach(function (x) { var s2 = stkSrc(x); if (!s2 || seen[s2]) return; seen[s2] = 1; n++; b += s2.length * 2; if (isAnim(s2)) gif++; }); }
    return { n: n, b: b, gif: gif, keys: ks };
  }
  function shrink(src) {
    return new Promise(function (res) {
      if (typeof src !== 'string' || src.indexOf('data:image/') !== 0 || src.length < 24000 || isAnim(src)) return res(src);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight, M = 240, sc = Math.min(1, M / Math.max(w, h));
          var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
          var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
          var alpha = false; try { var d = x.getImageData(0, 0, c.width, c.height).data; for (var i = 3; i < d.length; i += 16) if (d[i] < 250) { alpha = true; break; } } catch (e) { alpha = true; }
          var out = c.toDataURL('image/webp', .82);
          if (out.indexOf('data:image/webp') !== 0) out = alpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .84);
          res(out.length < src.length * .85 ? out : src);
        } catch (e) { res(src); }
      };
      img.onerror = function () { res(src); }; img.src = src;
    });
  }
  async function stkZip(btn) {
    var S = await stkScan(), map = {}, list = [], done = 0;
    for (var i = 0; i < S.keys.length; i++) { var v = await localforage.getItem(S.keys[i]); (Array.isArray(v) ? v : []).forEach(function (x) { var s2 = stkSrc(x); if (s2 && !(s2 in map)) { map[s2] = s2; list.push(s2); } }); }
    var mem = []; try { mem = mem.concat(stickerLibrary || [], myStickerLibrary || []); } catch (e) {}
    mem.forEach(function (x) { var s2 = stkSrc(x); if (s2 && !(s2 in map)) { map[s2] = s2; list.push(s2); } });
    for (var j = 0; j < list.length; j++) { map[list[j]] = await shrink(list[j]); done++; if (btn && done % 5 === 0) btn.textContent = '壓縮中 ' + done + ' / ' + list.length; }
    var changed = list.filter(function (k) { return map[k] !== k; }).length;
    if (!changed) return { changed: 0 };
    function conv(arr) { return (arr || []).map(function (x) { if (typeof x === 'string') return map[x] || x; if (x && x.src && map[x.src]) return Object.assign({}, x, { src: map[x.src] }); return x; }); }
    try { if (typeof stickerLibrary !== 'undefined') { var a = conv(stickerLibrary); stickerLibrary.length = 0; a.forEach(function (x) { stickerLibrary.push(x); }); } } catch (e) {}
    try { if (typeof myStickerLibrary !== 'undefined') { var b2 = conv(myStickerLibrary); myStickerLibrary.length = 0; b2.forEach(function (x) { myStickerLibrary.push(x); }); } } catch (e) {}
    try { (typeof messages !== 'undefined' ? messages : []).forEach(function (m) { if (m && typeof m.image === 'string' && map[m.image]) m.image = map[m.image]; }); } catch (e) {}
    var cur = curSid(), P = pfx();
    for (var k = 0; k < S.keys.length; k++) { if (S.keys[k].indexOf(P + cur + '_') === 0) continue; var v2 = await localforage.getItem(S.keys[k]); if (Array.isArray(v2)) await localforage.setItem(S.keys[k], conv(v2)); }
    var mk = []; try { mk = (await localforage.keys()).filter(function (x) { return /_chatMessages$/.test(x) && x.indexOf(P + cur + '_') !== 0; }); } catch (e) {}
    for (var q = 0; q < mk.length; q++) { var arr = await localforage.getItem(mk[q]), ch = false; (arr || []).forEach(function (m) { if (m && typeof m.image === 'string' && map[m.image]) { m.image = map[m.image]; ch = true; } }); if (ch) await localforage.setItem(mk[q], arr); }
    if (typeof saveData === 'function') await saveData();
    try { if (window.__cxImg) await window.__cxImg.gc(); } catch (e) {}
    try { if (typeof renderReplyLibrary === 'function') renderReplyLibrary(); } catch (e) {}
    return { changed: changed };
  }

  async function clnScan() {
    var keys = []; try { keys = await localforage.keys(); } catch (e) {}
    var P = pfx(), ids = {}; sessions().forEach(function (s) { if (s && s.id) ids[s.id] = s.name || s.id; });
    var used = {}; [localStorage.getItem('groupChatSettings')].concat(Object.keys(localStorage).filter(function (k) { return k.indexOf('groupChatSettings_') === 0; }).map(function (k) { return localStorage.getItem(k); })).forEach(function (raw) {
      try { (JSON.parse(raw || 'null') || { members: [] }).members.forEach(function (m) { if (m && m.id) used['gca_' + m.id] = 1; if (m && m.avatarRef) used[m.avatarRef] = 1; }); } catch (e) {}
    });
    var info = { total: 0, chats: [], img: { n: 0, b: 0, sn: 0, sb: 0 }, books: [], orphan: { keys: [], b: 0 }, avatars: { keys: [], b: 0 }, stickers: 0, cache: 0 };
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], v = null; try { v = await localforage.getItem(k); } catch (e) {}
      var b = (k.length * 2) + szOf(v); info.total += b;
      var m = k.indexOf(P) === 0 ? /^([a-z0-9]{10,30})_(.+)$/.exec(k.slice(P.length)) : null;
      if (m && !ids[m[1]] && !/^[A-Z]/.test(m[1])) { info.orphan.keys.push(k); info.orphan.b += b; continue; }
      if (m && m[2] === 'chatMessages' && Array.isArray(v)) { if (localforage.getRawItem) { try { var rv = await localforage.getRawItem(k); info.total += szOf(rv) - szOf(v); b = (k.length * 2) + szOf(rv); } catch (e) {} } var ib = imgBytes(v, m[1] === curSid() ? curStickers() : await sessStickers(m[1])); info.chats.push({ sid: m[1], name: ids[m[1]], b: b, n: v.length, img: ib }); info.img.n += ib.n; info.img.b += ib.b; info.img.sn += ib.sn; info.img.sb += ib.sb; continue; }
      if (m && /^cxBook_/.test(m[2])) { info.books.push({ key: k, sid: m[1], title: (v && v.title) || '未命名', b: b }); continue; }
      if (m && (m[2] === 'stickerLibrary' || m[2] === 'myStickerLibrary')) { info.stickers += b; continue; }
      if (/^gca_/.test(k) && !used[k]) { info.avatars.keys.push(k); info.avatars.b += b; }
    }
    try {
      if (window.caches) { var cn = await caches.keys(); for (var c = 0; c < cn.length; c++) { var ch = await caches.open(cn[c]), rq = await ch.keys(); for (var r = 0; r < rq.length; r++) { var res = await ch.match(rq[r]); if (res) { try { info.cache += (await res.clone().blob()).size; } catch (e) {} } } } }
    } catch (e) {}
    try { if (navigator.storage && navigator.storage.estimate) info.est = await navigator.storage.estimate(); } catch (e) {}
    try { info.stk = await stkScan(); } catch (e) { info.stk = { n: 0, b: 0, gif: 0, keys: [] }; }
    clnInfo = info; return info;
  }
  function clnOpen() {
    if (!clnM) {
      clnM = makeModal('cx-clean-modal', 'fa-broom', '整理空間');
      clnM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button[data-k]'); if (!b) return;
        var k = b.dataset.k;
        if (k === 'img') { await clnImages(); return; }
        if (k === 'stkzip') {
          if (!(await confirmAsync('壓縮表情庫裡比較大的表情包？會變小一點但看起來差不多，壓縮後不能還原。'))) return;
          b.disabled = true; b.textContent = '壓縮中……';
          var before = clnInfo && clnInfo.stk ? clnInfo.stk.b : 0, r = { changed: 0 };
          try { r = await stkZip(b); } catch (er) { console.warn(er); }
          var after = (await stkScan()).b;
          toast(r.changed ? '壓縮了 ' + r.changed + ' 張，表情庫從 ' + mb(before) + ' 變成 ' + mb(after) + ' 🗜' : '表情包都已經很小了，不用壓縮', 'success'); clnRefresh(); return;
        }
        if (k === 'orphan') { if (!(await confirmAsync('清掉已刪除聊天室留下的資料？'))) return; for (var i = 0; i < clnInfo.orphan.keys.length; i++) { try { await localforage.removeItem(clnInfo.orphan.keys[i]); } catch (er) {} } toast('已清除', 'success'); clnRefresh(); return; }
        if (k === 'avatars') { for (var j = 0; j < clnInfo.avatars.keys.length; j++) { try { await localforage.removeItem(clnInfo.avatars.keys[j]); } catch (er) {} } toast('已清除', 'success'); clnRefresh(); return; }
        if (k === 'slimOn' || k === 'slimOff') {
          var on = k === 'slimOn';
          if (!on && !(await confirmAsync('關掉表情包瘦身？每張圖會重新完整存回每一則訊息，空間會變大。'))) return;
          b.disabled = true; b.textContent = on ? '瘦身中……' : '還原中……';
          try { if (typeof saveData === 'function') await saveData(); await (on ? window.__cxImg.enable() : window.__cxImg.disable()); if (typeof saveData === 'function') await saveData(); } catch (er) { console.warn(er); }
          toast(on ? '瘦身完成 🪶' : '已關閉瘦身', 'success'); clnRefresh(); return;
        }
        if (k === 'cache') {
          if (!(await confirmAsync('清除網站暫存？下次打開會重新下載網站檔案（要連網），聊天資料不會受影響。'))) return;
          try { var cn = await caches.keys(); for (var c = 0; c < cn.length; c++) await caches.delete(cn[c]); } catch (er) {}
          toast('暫存已清除，重新整理後會重新下載', 'success'); clnRefresh(); return;
        }
        if (k === 'book') {
          if (!(await confirmAsync('刪掉這本書？'))) return;
          var key2 = b.dataset.key; try { await localforage.removeItem(key2); } catch (er) {}
          var bid = key2.split('cxBook_')[1]; if (X && X.comp) { X.comp.books = X.comp.books.filter(function (x) { return x.id !== bid; }); await save(); }
          toast('已刪除', 'success'); clnRefresh(); return;
        }
      });
    }
    clnM.body.innerHTML = '<div class="cx-muted" style="text-align:center;padding:30px 0"><i class="fas fa-spinner fa-spin"></i> 正在計算……</div>'; clnM.open();
    clnRefresh();
  }
  async function clnRefresh() {
    var I = await clnScan(); if (!clnM || !clnM.isOpen()) return;
    var SL = null; try { if (window.__cxImg) SL = await window.__cxImg.stats(); } catch (e) {}
    var est = I.est && I.est.quota ? '<div class="cx-muted">這台裝置實際用了 ' + mb(I.est.usage || 0) + '，瀏覽器最多可以給這個網站大約 ' + mb(I.est.quota) + '，空間很夠用。</div>' : '';
    var chatRows = I.chats.sort(function (a, b) { return b.b - a.b; }).map(function (c) {
      return '<div class="cx-cl-row"><span>' + esc(c.name || '聊天室') + (c.sid === curSid() ? '（目前）' : '') + '</span><span>' + c.n + ' 則 · ' + mb(c.b) + (c.img.n || c.img.sn ? '<br><small>照片 ' + c.img.n + ' 張 · ' + mb(c.img.b) + '　' + (window.__cxImg && window.__cxImg.on() ? '表情包 ' + c.img.sn + ' 則，其實只有 ' + c.img.su + ' 張不同的 · ' + mb(c.img.sub) : '表情包 ' + c.img.sn + ' 張 · ' + mb(c.img.sb)) + '</small>' : '') + '</span></div>';
    }).join('');
    var h = '<div class="cx-card">' + est + '</div>' +
      '<div class="cx-sec"><h4>各個聊天室</h4>' + (chatRows || '<div class="cx-muted">沒有聊天紀錄</div>') + '</div>' +
      '<div class="cx-sec"><h4>🖼 聊天裡的圖片 <small>照片 ' + I.img.n + ' 張 · ' + mb(I.img.b) + '　表情包 ' + I.img.sn + ' 張 · ' + mb(I.img.sb) + '</small></h4>' +
      '<div class="cx-muted">清掉圖片只會刪圖，文字訊息都會留著；只有圖片的訊息會變成「［圖片已清除］」。清了就救不回來，重要的可以先存到手機相簿。</div>' +
      '<label class="cx-row"><span>範圍</span><select class="cx-sel" id="cx-cl-scope" style="width:auto"><option value="cur">這個聊天室</option><option value="all">所有聊天室</option></select></label>' +
      '<label class="cx-row"><span>清哪些</span><select class="cx-sel" id="cx-cl-age" style="width:auto"><option value="30">30 天以前的</option><option value="7">7 天以前的</option><option value="0">全部</option></select></label>' +
      '<label class="qa-chk"><input type="checkbox" id="cx-cl-stk" checked>保留表情包（只清照片）</label>' +
      '<label class="qa-chk"><input type="checkbox" id="cx-cl-fav" checked>保留收藏的訊息裡的圖片</label>' +
      '<div class="cx-muted">表情包是用「表情庫裡有沒有這張」來認的；已經從表情庫刪掉的表情包，會被當成照片。</div>' +
      '<button class="cx-btn pri" data-k="img"' + (I.img.n || I.img.sn ? '' : ' disabled') + '>清除圖片</button></div>' +
      (SL ? '<div class="cx-sec"><h4>🪶 表情包瘦身 <small>' + (SL.on ? '已開啟' : '未開啟') + '</small></h4>' +
        '<div class="cx-muted">同一張表情包傳了很多次，原本每次都會完整存一份。開啟後同一張圖只存一份，聊天紀錄看起來完全一樣。之後新傳的也會自動這樣存。</div>' +
        (SL.on ? '<div class="cx-muted">現在實際只存了：聊天紀錄 ' + mb(SL.chat) + ' ＋ 不重複的圖片 ' + SL.images + ' 張 ' + mb(SL.store) + '</div><button class="cx-btn" data-k="slimOff">關閉瘦身</button>'
          : '<button class="cx-btn pri" data-k="slimOn">開啟表情包瘦身</button>') + '</div>' : '') +
      '<div class="cx-sec"><h4>🗜 壓縮表情包 <small>表情庫 ' + I.stk.n + ' 張 · ' + mb(I.stk.b) + (I.stk.gif ? '（動圖 ' + I.stk.gif + ' 張）' : '') + '</small></h4>' +
        '<div class="cx-muted">把表情庫裡比較大的靜態圖縮成適合聊天的大小（最長邊 240）。透明背景會保留；會動的 GIF 不會動到。聊天裡傳過的同一張也會一起換成小的。</div>' +
        '<button class="cx-btn pri" data-k="stkzip"' + (I.stk.n ? '' : ' disabled') + '>壓縮表情包</button></div>' +
      '<div class="cx-sec"><h4>📦 網站暫存 <small>' + mb(I.cache) + '</small></h4><div class="cx-muted">讓網站離線也能打開的檔案。清掉不影響任何聊天資料，下次打開會重新下載。</div><button class="cx-btn" data-k="cache"' + (I.cache ? '' : ' disabled') + '>清除暫存</button></div>' +
      '<div class="cx-sec"><h4>🗑 已刪除聊天室的殘留 <small>' + mb(I.orphan.b) + '</small></h4><div class="cx-muted">刪掉聊天室後沒清乾淨的資料。</div><button class="cx-btn" data-k="orphan"' + (I.orphan.keys.length ? '' : ' disabled') + '>清除殘留</button></div>' +
      '<div class="cx-sec"><h4>👤 沒在用的成員頭像 <small>' + I.avatars.keys.length + ' 張 · ' + mb(I.avatars.b) + '</small></h4><div class="cx-muted">已經刪掉的群組成員留下的頭像。</div><button class="cx-btn" data-k="avatars"' + (I.avatars.keys.length ? '' : ' disabled') + '>清除</button></div>' +
      '<div class="cx-sec"><h4>📖 書架 <small>' + I.books.length + ' 本 · ' + mb(I.books.reduce(function (s, x) { return s + x.b; }, 0)) + '</small></h4>' +
      (I.books.length ? I.books.map(function (bk) { return '<div class="cx-cl-row"><span>' + esc(bk.title) + '</span><span>' + mb(bk.b) + ' <button class="cx-btn" data-k="book" data-key="' + esc(bk.key) + '" style="padding:4px 10px;margin-left:6px">刪除</button></span></div>'; }).join('') : '<div class="cx-muted">書架是空的</div>') + '</div>' +
      (I.stickers ? '<div class="cx-muted">表情庫用了 ' + mb(I.stickers) + '，可以到「表情 & 拍一拍 › 管理表情庫」刪掉不用的。</div>' : '');
    clnM.body.innerHTML = h;
  }
  async function clnImages() {
    var scope = clnM.body.querySelector('#cx-cl-scope').value, days = +clnM.body.querySelector('#cx-cl-age').value, keepFav = clnM.body.querySelector('#cx-cl-fav').checked, keepStk = clnM.body.querySelector('#cx-cl-stk').checked;
    var cut = days ? Date.now() - days * 86400e3 : Infinity;
    if (!(await confirmAsync('確定清除' + (scope === 'all' ? '所有聊天室' : '這個聊天室') + (days ? ' ' + days + ' 天以前' : '全部') + '的聊天' + (keepStk ? '照片（表情包會保留）' : '圖片（包括表情包）') + '？清了就救不回來。'))) return;
    function strip(arr, stk) {
      var n = 0;
      (arr || []).forEach(function (m) {
        if (!m) return;
        var t = +new Date(m.timestamp) || 0;
        if (t >= cut || (keepFav && m.favorited)) return;
        if (typeof m.image === 'string' && m.image && !(keepStk && stk[m.image])) { m.image = null; if (!m.text) m.text = '［圖片已清除］'; n++; }
        if (m.replyTo && m.replyTo.image && !(keepStk && stk[m.replyTo.image])) m.replyTo.image = null;
      });
      return n;
    }
    var total = 0, P = pfx(), cur = curSid();
    total += strip(allMsgs(), curStickers());
    try { if (typeof saveData === 'function') await saveData(); else if (typeof throttledSaveData === 'function') throttledSaveData(); } catch (e) {}
    try { renderMessages(); } catch (e) {}
    if (scope === 'all') {
      var ss = sessions();
      for (var i = 0; i < ss.length; i++) {
        if (!ss[i] || ss[i].id === cur) continue;
        var k = P + ss[i].id + '_chatMessages', arr = null; try { arr = await localforage.getItem(k); } catch (e) {}
        if (Array.isArray(arr)) { var n = strip(arr, await sessStickers(ss[i].id)); if (n) { total += n; try { await localforage.setItem(k, arr); } catch (e) {} } }
      }
    }
    try { if (window.__cxImg) await window.__cxImg.gc(); } catch (e) {}
    toast(total ? '清掉了 ' + total + ' 張' + (keepStk ? '照片' : '圖片') : '沒有符合條件的圖片', total ? 'success' : 'info');
    clnRefresh();
  }
  /* 資料管理：加「整理空間」按鈕，並把「/ ~5 MB」換成實際可用空間 */
  (function dmHook() {
    function inject() {
      var card = document.querySelector('#data-modal .dm-storage-card'); if (!card || card.querySelector('#cx-clean-btn')) return;
      var b = document.createElement('button'); b.id = 'cx-clean-btn'; b.type = 'button'; b.className = 'cx-btn'; b.style.cssText = 'margin-top:10px;width:100%';
      b.innerHTML = '<i class="fas fa-broom"></i> 整理空間（清圖片、清暫存）'; b.addEventListener('click', clnOpen); card.appendChild(b);
      var lab = card.querySelector('#dm-storage-total');
      if (lab && navigator.storage && navigator.storage.estimate) new MutationObserver(function () {
        if (!/~5 MB/.test(lab.textContent)) return;
        var used = lab.textContent.split('/')[0].trim();
        navigator.storage.estimate().then(function (e) {
          if (!e || !e.quota) return;
          lab.textContent = used + ' · 可用約 ' + mb(e.quota);
          var bar = document.getElementById('dm-storage-bar');
          if (bar) { var pct = Math.min(100, (e.usage || 0) / e.quota * 100); bar.style.width = Math.max(2, pct).toFixed(1) + '%'; bar.style.background = pct > 80 ? 'linear-gradient(90deg,#FF3B30,#CC0000)' : 'linear-gradient(90deg,var(--accent-color),rgba(var(--accent-color-rgb),0.6))'; }
        }).catch(function () {});
      }).observe(lab, { childList: true, characterData: true, subtree: true });
    }
    var dm = document.getElementById('data-modal');
    if (dm) new MutationObserver(inject).observe(dm, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    inject();
  })();

  /* ================= 使用手冊 ================= */
  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(function (m) { if (getComputedStyle(m).display !== 'none') { try { hideModal(m); } catch (e) { m.style.display = 'none'; } } });
  }
  function goEntry(id) {
    closeAllModals();
    setTimeout(function () {
      var adv = document.getElementById('advanced-modal'); if (adv) showModal(adv);
      var el = document.getElementById(id); if (!el) return;
      if (el.dataset.cxTab) advShow(el.dataset.cxTab);
      setTimeout(function () { el.click(); }, 250);
    }, 200);
  }
  function goBtn(id) { closeAllModals(); setTimeout(function () { var b = document.getElementById(id); if (b) b.click(); }, 250); }
  function goCard(id) { closeAllModals(); setTimeout(function () { var s = document.getElementById('settings-modal'); if (s) showModal(s); setTimeout(function () { var c = document.getElementById(id); if (c) c.click(); }, 250); }, 200); }
  var HELP = [
    { s: '小窩與花園', items: [
      ['🏠 小窩', '上面最左邊的小房子。像手機桌面一樣，所有功能都排在裡面，還有花園狀態、他的狀態、最近的重要日。最下面可以勾「打開網站時先顯示小窩」。右上角「整理」或長按任何圖示，可以拖曳換位置；把一個圖示拖到另一個上面就變成資料夾，點開資料夾可以改名字，拖到框外就移出來。', ['fn', 'home']],
      ['花園', '在小窩裡。點空地買種子種下，或按「一鍵種植」把空地一次種滿，記得澆水（乾掉的土長得慢）。長好了點一下收成，放進倉庫可以賣錢或送給他。每天第一次進花園會收到他給的零用錢。「花束」頁有「花束配方」：花收齊了就能一鍵包好，比自己包的賣得更貴；也可以在「自己包」挑花、選包裝紙和緞帶。送給他時會傳一張花束的圖到聊天裡。「圖鑑」裡有每種花的花語。把某兩種花種在隔壁（上下左右），收成時有機會長出稀有色，像藍玫瑰、黑鬱金香，圖鑑裡會寫要怎麼配。天氣每兩小時變一次，下雨的時候花園和果園會自己澆水。花園下面的「佈置花園」可以買鞦韆、風車、玫瑰拱門這些小擺設，也可以換圍籬顏色。小窩首頁每天有三個「今日小任務」，完成後要回小窩才能領金幣，三個都做完還有額外獎勵。點預覽裡的花再點另一朵可以交換位置；沒送出去的花束也可以賣掉。', ['fn', 'garden']],
      ['果樹和廚房', '藍莓、檸檬、橘子、蘋果、梨子、桃子、葡萄、櫻桃、柿子都是果樹，種一次就可以一直收（收完過一陣子又會結果）。小麥長得很快。「廚房」裡用水果、小麥和食材櫃的雞蛋、牛奶、奶油、蜂蜜、糖做甜點和果醬，做好可以端給他（會傳一張甜點的圖）或賣掉，水果蛋糕最值錢。', ['fn', 'garden']],
      ['農場：花園、果園、牧場', '花園裡「農場」上面可以切換三塊地。花園和果園的畫面可以左右滑，最右邊可以用金幣買新的地（花圃第二塊 🪙400、第三塊 🪙900；果園第二塊 🪙500、第三塊 🪙1000）。花園種花和作物；果園種果樹；牧場養動物。牧場有雞、鴨子、乳牛、兔子、蜂箱五個圈，雞一開始就有，其他要用金幣蓋起來：鴨池 🪙120、養蜂場 🪙160、兔子窩 🪙180、牛棚 🪙250。蜂箱餵薰衣草會產蜂蜜。上面的「一鍵餵食」「一鍵撿蛋」可以一次照顧全部的動物。雞和鴨下蛋、乳牛擠牛奶（廚房可以做成奶油）、兔子吃胡蘿蔔，會叼花回來。用小麥（兔子用胡蘿蔔）或飼料袋餵牠們，吃飽了才會有東西收。點動物可以改名字，你不在的時候他也會幫忙餵。', ['fn', 'garden']],
      ['摸魚小貓', '小窩裡的小遊戲。左右拖動小貓接住小魚、薰衣草和愛心，躲開加班文件和鬧鐘。每 5 分換 1 枚花園金幣（一天最多 40）。', ['fn', 'home']],
      ['他會幫忙照顧', '你不在的時候，他會幫你澆水，偶爾偷摘一顆、在空地偷偷種薰衣草，聊天裡會告訴你（可以在花園的「紀錄」關掉）。群聊時是大家輪流來。', null],
      ['田裡有蟲', '點一下就抓走了，還會拿到 1 枚金幣。有蟲的那格不會長大。', null]
    ] },
    { s: '畫面上的按鈕', items: [
      ['左上角的頭像', '主角的頭像。點一下可以換頭像、改名字。', null],
      ['💬 會話管理', '開好幾個聊天室，每個聊天室的聊天紀錄、字卡、信件、群聊設定都是分開的。可以一個角色開一個，當私訊用。', ['btn', 'session-manager-btn']],
      ['👥 群聊設定', '打開群聊、加成員、設定角色專屬字卡。每個聊天室各自設定。', ['btn', 'group-chat-btn']],
      ['📰 今日公告', '每天的問候卡片。', ['btn', 'daily-greeting-btn']],
      ['🌙 切換主題', '白天／夜間模式。', null],
      ['📦 問題箱', '問他問題（給 A、B、C 選項），也可以回答他問你的問題。', ['btn', 'qa-top-btn']],
      ['⚙️ 設定', '外觀、聊天、高階功能、資料管理。', ['btn', 'settings-btn']],
      ['輸入框左邊的按鈕', '📹 視訊通話、🖼 傳圖片、😊 表情和拍一拍。', null],
      ['輸入框右邊的按鈕', '⋯ 展開更多、📚 批次傳送（一次打好幾句再送出）、➤ 傳送。', null]
    ] },
    { s: '高階功能是一本手帳', items: [
      ['五個索引頁', '設定 › 高階功能，上面五張彩色索引貼：📖 回憶、🌿 生活、💞 和哥哥、🎲 好玩、⚙️ 設定。點一張就翻到那一頁。有新東西的頁籤會出現小紅點。', null],
      ['合在一起的功能', '潮汐和睡眠在「健康小本」標題右邊；番茄鐘在「陪伴中心」標題右邊；骰子在「抉擇」裡；字卡評分在「他的日記」標題右邊。小窩首頁的圖示照樣可以直接點進去。', null]
    ] },
    { s: '📖 回憶', items: [
      ['他的日記', '每天固定時間收到一篇他寫的日記，可以在下面留言，他寫下一篇時會回你。標題右邊「⭐ 字卡評分」：他幫每張字卡打分數、寫短評。', ['entry', 'cx-diary-entry']],
      ['重要日', '紀念日倒數。', ['entry', 'anniversary-function']],
      ['心晴手帳', '記錄每天的心情。', ['entry', 'mood-function']],
      ['信封投遞（寫信）', '寫信給他，10～24 小時內回信。群聊裡可以選寄給誰，回信用他自己的字卡。每封信右下角的星星可以收藏。', ['entry', 'envelope-function']],
      ['通話紀錄', '每通電話打了多久、哪些沒接。點一通會跳回聊天裡那一則。', ['entry', 'cx-calllog-entry']],
      ['訊息統計', '總共聊了幾則、高頻詞、搜尋訊息、收藏、詞雲。', ['entry', 'stats-function']]
    ] },
    { s: '🌿 生活', items: [
      ['健康小本', '喝水、三餐、心情、不舒服（點一次記一次，可以記時間和程度），月曆和這週小結。標題右邊可以進「🩸 潮汐」（經期紀錄和預測）和「🌙 睡眠」（跟誰睡、睡多久、偷看手機）。哥哥會在 10、13、16、19 點提醒喝水吃飯。', ['entry', 'cx-health-entry']],
      ['記帳本', '像聊天一樣記帳：直接打「120 珍奶」「A$12 咖啡」「+500 薪水」就記好，會自動分類（點分類可以改），哥哥用字卡回你。上面可以設每月預算，會算出今天還能花多少。旅行可以按「＋」開新的一本（例如回台灣），台幣澳幣自動換算。', ['entry', 'cx-acct-entry']],
      ['花錢申請單', '在記帳本裡。想買東西先填：買什麼、多少錢、為什麼、有沒有替代品。兩個哥哥各審一票：都准就能買，都駁回就不買，一准一駁要冷靜一天。被駁回可以修改再申請；選「不買了」，省下的錢會記在統計裡。', ['entry', 'cx-acct-entry']],
      ['待辦', '待辦清單和節日提醒。', ['entry', 'cx-todo-entry']],
      ['陪伴中心', '一起聽歌、看影片、看小說，還有一起讀書、工作、運動、睡覺四種陪伴模式（有計時和白噪音）。標題右邊可以進「🍅 番茄鐘」。', ['entry', 'cx-comp-entry']]
    ] },
    { s: '💞 和哥哥', items: [
      ['問題箱', '問他問題、設定他多久回答（幾秒到 6 小時）。他回答之後，點別的選項可以幫他改答案，聊天裡會說「我改成…」。他也會用字卡問你問題。', ['entry', 'qa-function']],
      ['投票', '出題目、列選項（可以複選），兩個哥哥各自投票，投完附一張字卡當留言。你也可以投。點數字可以幫哥哥改票。', ['entry', 'cx-vote-entry']],
      ['紅包', '發紅包給他，或收他發的紅包。群聊裡可以選發給誰。這個月收到多少會顯示在記帳本的統計裡。', ['entry', 'cx-rp-entry']],
      ['TA 的手機', '他會偷偷收藏你說過的話，還寫一句小備註。群聊裡每個人有自己的手機。', ['entry', 'cx-phone-entry']]
    ] },
    { s: '🎲 好玩', items: [
      ['抉擇', '拋硬幣、隨機抽籤，還有骰子。', ['entry', 'decision-function']],
      ['問卷', '出一份問卷給他填。', ['entry', 'cx-quiz-entry']],
      ['搞怪', '朝他丟番茄、雞蛋、蛋糕、一桶水、枕頭或愛心，他會回話，有時還會丟回來。', ['entry', 'cx-toss-entry']],
      ['運勢 · 占卜', '每週運勢和占卜。', ['entry', 'fortune-lenormand-function']]
    ] },
    { s: '⚙️ 設定', items: [
      ['回覆與來信', '他主動來信、發紅包、連結狀態、自己掛電話的設定，都在這一頁。', ['entry', 'cx-set-entry']],
      ['自定義回覆（字卡）', '他回話用的句子都在這裡，可以分組、停用整組。', ['entry', 'custom-replies-function']],
      ['懸浮音樂播放器', '在聊天畫面放歌。', ['entry', 'music-player-toggle']],
      ['拍一拍', '點 😊 › 拍一拍。快捷動作點了直接送出；「自定義動作」只要打動作，想指定位置就打「你」。群聊裡上面可以選拍誰。', null],
      ['視訊通話', '點輸入框左邊的 📹。通話功能的開關在 設定 › 聊天設定 › 通話功能。', ['card', 'chat-settings']]
    ] },
    { s: '群聊', items: [
      ['怎麼開群聊', '群聊設定 › 打開群聊 › 新增成員（名字、頭像）。每個聊天室各自設定，關掉這裡不會影響別的聊天室。', ['btn', 'group-chat-btn']],
      ['角色專屬字卡', '群聊設定最下面。勾「只由 ○○ 說」，那組字卡就只會由他本人說；不勾就隨機分給大家。字卡組和成員同名會自動配對。', ['btn', 'group-chat-btn']],
      ['對誰做', '寫信、拍一拍、搞怪、紅包、TA 的手機，上面都有一排頭像可以選人。', null],
      ['頭像看起來怪怪的', '小圓圈只顯示圖片正中間。用手機相簿裁成正方形、臉放中間再上傳，最好看。', null]
    ] },
    { s: '同步、備份、空間', items: [
      ['同步', '電腦和手機用同一組連線碼，資料就會自動同步。上面跳出「其他裝置有新內容」時，點一下就會更新。想重新設定，在網址後面加 #sync。連線碼等於資料的鑰匙，不要給別人。', null],
      ['備份', '設定 › 資料管理 › 全量備份。更新網站或清空間之前，可以先匯出一份。', ['card', 'data-settings']],
      ['整理空間', '設定 › 資料管理 › 整理空間：表情包瘦身（同一張圖只存一份）、清聊天圖片、網站暫存、已刪除聊天室的殘留、沒在用的頭像、書架。', ['fn', 'clean']]
    ] },
    { s: '常見問題', items: [
      ['更新網站後看起來沒變', '等 1～2 分鐘再重新整理；手機上把網站關掉再打開。', null],
      ['收不到通知', '手機設定裡要允許通知。iPhone 要先「加入主畫面」，從主畫面打開才收得到。', null],
      ['手機很燙', '用省電版主題（奶霧紫 v10 之後的版本），把其他分頁關掉。', null],
      ['通話中不小心重新整理', '重新整理後會跳出「通話被重新整理打斷了」，可以選繼續通話或掛斷。超過 10 分鐘才回來的話，會直接留下一筆通話紀錄。', null],
      ['電腦上刪不掉會話', '已修好。刪除會連聊天紀錄一起刪，刪之前先確認。', ['btn', 'session-manager-btn']],
      ['視窗太長、按鈕不見', '大部分視窗都可以在裡面往下捲；關閉按鈕在最下面。', null]
    ] }
  ];
  var hpM = null;
  function helpOpen() {
    if (!hpM) {
      hpM = makeModal('cx-help-modal', 'fa-book-open', '使用手冊');
      hpM.body.addEventListener('input', function (e) { if (e.target.id === 'cx-hp-q') helpFilter(e.target.value); });
      hpM.body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-go]'); if (!b) return;
        var t = b.dataset.go, id = b.dataset.id;
        if (t === 'entry') goEntry(id); else if (t === 'btn') goBtn(id); else if (t === 'card') goCard(id);
        else if (t === 'fn' && id === 'clean') { closeAllModals(); setTimeout(clnOpen, 250); }
        else if (t === 'fn' && id === 'home' && window.__cxHome) { closeAllModals(); setTimeout(window.__cxHome.open, 250); }
        else if (t === 'fn' && id === 'garden' && window.__cxHome) { closeAllModals(); setTimeout(window.__cxHome.garden, 250); }
      });
    }
    hpM.body.innerHTML = '<input class="cx-in" id="cx-hp-q" type="search" placeholder="搜尋，例如：寫信、群聊、通話" autocomplete="off">' +
      HELP.map(function (sec, si) {
        return '<details class="cx-hp-sec"' + (si === 0 ? ' open' : '') + '><summary>' + esc(sec.s) + '</summary>' + sec.items.map(function (it) {
          return '<div class="cx-hp-it" data-q="' + esc((sec.s + it[0] + it[1]).toLowerCase()) + '"><div class="t">' + esc(it[0]) + (it[2] ? '<button type="button" class="cx-hp-go" data-go="' + it[2][0] + '" data-id="' + it[2][1] + '">帶我去 ›</button>' : '') + '</div><div class="d">' + esc(it[1]) + '</div></div>';
        }).join('') + '</details>';
      }).join('') + '<div class="cx-muted" id="cx-hp-none" style="display:none;text-align:center;padding:16px 0">找不到，換個關鍵字試試</div>';
    hpM.open();
  }
  function helpFilter(q) {
    q = String(q || '').trim().toLowerCase(); var any = false;
    hpM.body.querySelectorAll('.cx-hp-sec').forEach(function (sec) {
      var hit = 0;
      sec.querySelectorAll('.cx-hp-it').forEach(function (it) { var ok = !q || it.dataset.q.indexOf(q) >= 0; it.style.display = ok ? '' : 'none'; if (ok) hit++; });
      sec.style.display = hit ? '' : 'none'; if (q && hit) sec.open = true; if (hit) any = true;
    });
    hpM.body.querySelector('#cx-hp-none').style.display = any ? 'none' : '';
  }
  (function settingsHelpBtn() {
    var sm = document.getElementById('settings-modal'); if (!sm || document.getElementById('cx-help-btn')) return;
    var btns = sm.querySelector('.modal-buttons');
    var b = document.createElement('button'); b.id = 'cx-help-btn'; b.type = 'button'; b.className = 'cx-btn'; b.style.cssText = 'width:100%;margin-top:10px';
    b.innerHTML = '<i class="fas fa-book-open"></i> 使用手冊（找不到功能點這裡）';
    b.addEventListener('click', function () { closeAllModals(); setTimeout(helpOpen, 200); });
    if (btns) btns.parentNode.insertBefore(b, btns); else sm.querySelector('.modal-content').appendChild(b);
  })();

  /* ================= 信件收藏 ================= */
  function starSvg(on) { return '<svg width="15" height="15" viewBox="0 0 24 24" fill="' + (on ? '#f2b544' : 'none') + '" stroke="' + (on ? '#e0a52e' : 'currentColor') + '" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z"/></svg>'; }
  function envData() { try { return envelopeData; } catch (e) { return null; } }
  function envFind(sec, id) { var d = envData(); if (!d) return null; return (sec === 'outbox' ? d.outbox : d.inbox).find(function (l) { return String(l.id) === String(id); }); }
  function envFavList() {
    var d = envData(); if (!d) return [];
    return d.outbox.filter(function (l) { return l.fav; }).map(function (l) { return ['outbox', l]; })
      .concat(d.inbox.filter(function (l) { return l.fav; }).map(function (l) { return ['inbox', l]; }))
      .sort(function (a, b) { return (b[1].favAt || 0) - (a[1].favAt || 0); });
  }
  function envToggle(sec, id) {
    var l = envFind(sec, id); if (!l) return false;
    l.fav = !l.fav; if (l.fav) l.favAt = Date.now(); else delete l.favAt;
    try { saveEnvelopeData(); } catch (e) {}
    toast(l.fav ? '已收藏這封信 ⭐' : '已取消收藏', 'success');
    envRefresh(); return l.fav;
  }
  function envStars() {
    ['outbox', 'inbox'].forEach(function (sec) {
      var list = document.getElementById('env-' + sec + '-list'); if (!list) return;
      list.querySelectorAll('.env-letter-item').forEach(function (it) {
        var m = /viewEnvLetter\('(\w+)','([^']+)'\)/.exec(it.getAttribute('onclick') || ''); if (!m || it.querySelector('.cx-env-star')) return;
        var l = envFind(m[1], m[2]); if (!l) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'cx-env-star' + (l.fav ? ' on' : '');
        b.dataset.fs = m[1]; b.dataset.fid = m[2]; b.setAttribute('aria-label', l.fav ? '取消收藏' : '收藏'); b.innerHTML = starSvg(l.fav);
        it.appendChild(b);
      });
    });
  }
  function envFavRender() {
    var el = document.getElementById('env-fav-list'); if (!el) return;
    var all = envFavList(), cnt = document.getElementById('env-fav-count');
    if (cnt) { cnt.textContent = all.length || ''; cnt.style.display = all.length ? 'inline-block' : 'none'; }
    el.innerHTML = all.length ? all.map(function (p) {
      var sec = p[0], l = p[1], t = sec === 'outbox' ? l.sentTime : l.receivedTime, c = String(l.content || '');
      return '<div class="env-letter-item' + (sec === 'inbox' ? ' reply' : '') + '" onclick="viewEnvLetter(\'' + sec + '\',\'' + esc(l.id) + '\')"><div class="env-letter-header"><div class="env-letter-header-from">' + (sec === 'outbox' ? '我寄出的' + (l.to ? '（給 ' + esc(l.to) + '）' : '') : esc(l.from || pname()) + ' 的回信') + ' · ' + fmtTime(t) + '</div></div>' +
        '<div class="env-letter-body"><div class="env-letter-preview">' + esc(c.length > 60 ? c.slice(0, 60) + '…' : c) + '</div></div>' +
        '<button type="button" class="cx-env-star on" data-fs="' + sec + '" data-fid="' + esc(l.id) + '" aria-label="取消收藏">' + starSvg(true) + '</button></div>';
    }).join('') : '<div class="env-empty"><div style="font-size:30px">☆</div><div style="font-size:14px;font-weight:500;margin-top:4px;">還沒有收藏的信</div><div style="font-size:12px;margin-top:6px;opacity:.6;">在信上按右上角的星星就能收藏</div></div>';
  }
  function envViewStar() {
    var b = document.getElementById('cx-env-view-star'); if (!b) return;
    var l = null; try { l = envFind(editingEnvSection, editingEnvId); } catch (e) {}
    b.innerHTML = starSvg(l && l.fav) + '<span>' + (l && l.fav ? '已收藏' : '收藏') + '</span>';
  }
  function envRefresh() {
    try { if (typeof renderEnvelopeLists === 'function') renderEnvelopeLists(); } catch (e) {}
    envFavRender(); envViewStar();
  }
  function envInit() {
    var inboxBtn = document.getElementById('env-tab-inbox'), inboxSec = document.getElementById('env-inbox-section');
    if (!inboxBtn || !inboxSec || document.getElementById('env-tab-fav')) return;
    var tb = document.createElement('button'); tb.className = 'env-tab-btn'; tb.id = 'env-tab-fav'; tb.type = 'button';
    tb.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z"/></svg>收藏<span id="env-fav-count" class="env-badge cx-fav-count" style="display:none;"></span>';
    tb.addEventListener('click', function () { window.switchEnvTab('fav'); });
    inboxBtn.parentNode.appendChild(tb);
    var sec = document.createElement('div'); sec.id = 'env-fav-section'; sec.style.display = 'none'; sec.innerHTML = '<div id="env-fav-list"></div>';
    inboxSec.parentNode.insertBefore(sec, inboxSec.nextSibling);
    var orig = window.switchEnvTab;
    window.switchEnvTab = function (tab) {
      if (tab !== 'fav') { orig(tab); tb.classList.remove('active'); sec.style.display = 'none'; return; }
      orig('inbox');
      inboxBtn.classList.remove('active'); inboxSec.style.display = 'none';
      tb.classList.add('active'); sec.style.display = 'block'; envFavRender();
    };
    ['renderOutboxList', 'renderInboxList'].forEach(function (fn) {
      var o = window[fn]; if (typeof o !== 'function') return;
      window[fn] = function () { var r = o.apply(this, arguments); try { envStars(); envWhoLabels(); envFavRender(); } catch (e) {} return r; };
    });
    var body = inboxSec.parentNode;
    body.addEventListener('click', function (e) {
      var b = e.target.closest('.cx-env-star'); if (!b) return;
      e.stopPropagation(); e.preventDefault(); envToggle(b.dataset.fs, b.dataset.fid);
    }, true);
    var eb = document.getElementById('env-view-edit-btn');
    if (eb && !document.getElementById('cx-env-view-star')) {
      var vb = document.createElement('button'); vb.className = 'modal-btn modal-btn-secondary cx-env-vstar'; vb.id = 'cx-env-view-star'; vb.type = 'button';
      vb.addEventListener('click', function () { try { envToggle(editingEnvSection, editingEnvId); } catch (e) {} });
      eb.parentNode.insertBefore(vb, eb);
    }
    var ov = window.viewEnvLetter;
    if (typeof ov === 'function') window.viewEnvLetter = function () { var r = ov.apply(this, arguments); envViewStar(); return r; };
    envFavRender();
  }

  /* ================= 他的評分（字卡滿意度） ================= */
  var RT_BANDS = [
    { k: 'bad', n: '不滿意', lo: 1, hi: 3, w: 0.12, col: '#d9534f' },
    { k: 'meh', n: '湊合', lo: 4, hi: 6, w: 0.24, col: '#d39a2c' },
    { k: 'good', n: '滿意', lo: 7, hi: 9, w: 0.50, col: '#3f9e6a' },
    { k: 'great', n: '非常滿意', lo: 10, hi: 10, w: 0.14, col: '#8a63d2' }
  ];
  var RT_LINES = {
    bad: ['有點做作', '太不像我了', '太肉麻了', '語氣不對', '我才不會這樣說', '好尷尬', '這句誰寫的', '說不出口', '太正經了', '怪怪的'],
    meh: ['還行吧', '勉強可以', '普普通通', '偶爾說說', '有點平淡', '看心情', '不算差', '可以再改改', '湊合用'],
    good: ['挺像我的', '這句可以', '喜歡', '說得出口', '很自然', '是我會說的', '不錯', '順口', '對你就會這樣說'],
    great: ['就是這句', '完全是我', '最喜歡這張', '想天天說', '說到心裡了', '滿分', '這句留著', '好懂我']
  };
  var RT_PAGE = 60;
  var rt = { who: null, f: 'all', g: 'all', q: '', page: 0, view: 'list' }, rtM = null;
  function rtBand(s) { for (var i = 0; i < RT_BANDS.length; i++) if (s >= RT_BANDS[i].lo && s <= RT_BANDS[i].hi) return RT_BANDS[i]; return RT_BANDS[0]; }
  function rtLines(k) { var L = X.rate && X.rate.lines && X.rate.lines[k]; return (L && L.length) ? L : RT_LINES[k]; }
  function rtRoll() {
    var r = Math.random(), acc = 0, b = RT_BANDS[RT_BANDS.length - 1];
    for (var i = 0; i < RT_BANDS.length; i++) { acc += RT_BANDS[i].w; if (r < acc) { b = RT_BANDS[i]; break; } }
    var s = b.lo + Math.floor(Math.random() * (b.hi - b.lo + 1)), L = rtLines(b.k);
    return { s: s, c: L[Math.floor(Math.random() * L.length)] };
  }
  function rtStore() { if (!X.rate || typeof X.rate !== 'object') X.rate = { by: {}, lines: null }; if (!X.rate.by) X.rate.by = {}; return X.rate; }
  function rtMap(who) { var by = rtStore().by; who = who || rt.who || pname(); return by[who] || (by[who] = {}); }
  function rtCards() { var a = (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) ? customReplies : [], seen = {}, out = []; a.forEach(function (t) { if (typeof t === 'string' && t.trim() && !seen[t]) { seen[t] = 1; out.push(t); } }); return out; }
  function rtGroups() { return (window.customReplyGroups || []).filter(function (g) { return g && g.name && Array.isArray(g.items) && g.items.length; }); }
  function rtScope() {
    var all = rtCards();
    if (rt.g === 'all') return all;
    var g = rtGroups().find(function (x) { return String(x.id) === rt.g; });
    if (g) { var set = {}; g.items.forEach(function (t) { set[t] = 1; }); return all.filter(function (t) { return set[t]; }); }
    var inAny = {}; rtGroups().forEach(function (x) { x.items.forEach(function (t) { inAny[t] = 1; }); });
    return all.filter(function (t) { return !inAny[t]; });
  }
  function rtPrune() { var live = {}; rtCards().forEach(function (t) { live[t] = 1; }); var by = rtStore().by; Object.keys(by).forEach(function (w) { Object.keys(by[w]).forEach(function (t) { if (!live[t]) delete by[w][t]; }); }); }
  function rtSaveCards() {
    try { if (typeof throttledSaveData === 'function') throttledSaveData(); else if (typeof saveData === 'function') saveData(); } catch (e) {}
    try { var lib = document.getElementById('reply-library-modal'); if (typeof renderReplyLibrary === 'function' && (!lib || lib.style.display !== 'none')) renderReplyLibrary(); } catch (e) {}
  }
  function rtStars(s, col) { var h = ''; for (var i = 1; i <= 10; i++) h += '<i style="color:' + (i <= s ? col : 'var(--border-color)') + '">★</i>'; return h; }

  function rtOpen() {
    if (!rtM) {
      rtM = makeModal('cx-rate-modal', 'fa-star-half-stroke', '他的評分');
      rtM.onBack = function () { if (rt.view !== 'list') { rt.view = 'list'; rtRender(); return true; } };
      rtM.body.addEventListener('input', function (e) {
        if (e.target.id === 'cx-rt-q') { rt.q = e.target.value; rt.page = 0; clearTimeout(rtM.qT); rtM.qT = setTimeout(function () { rtList(); }, 200); }
      });
      rtM.body.addEventListener('change', function (e) { if (e.target.id === 'cx-rt-g') { rt.g = e.target.value; rt.page = 0; rtRender(); } });
      rtM.body.addEventListener('click', rtClick);
      bindChips(rtM.body, function (n) { rt.who = n; rt.page = 0; rtRender(); });
    }
    rt.view = 'list'; rt.page = 0;
    var ppl = groupPeople();
    if (!rt.who || (ppl.length && !ppl.some(function (p) { return p.name === rt.who; })) || (!ppl.length && rt.who !== pname())) rt.who = pname();
    rtPrune(); rtRender(); rtM.open();
  }
  function rtCounts(list, map) {
    var c = { all: list.length, none: 0 }; RT_BANDS.forEach(function (b) { c[b.k] = 0; });
    list.forEach(function (t) { var r = map[t]; if (!r) c.none++; else c[rtBand(r.s).k]++; });
    return c;
  }
  function rtRender() {
    if (rt.view === 'pick') return rtPickView();
    if (rt.view === 'lines') return rtLinesView();
    var map = rtMap(), scope = rtScope(), c = rtCounts(scope, map), gs = rtGroups();
    var h = whoChips('cx-rt-who', rt.who);
    if (h) h = '<div class="cx-who-t">誰來評分</div>' + h;
    h += '<div class="cx-rt-top"><input class="cx-in" id="cx-rt-q" type="search" placeholder="搜尋字卡…" autocomplete="off" value="' + esc(rt.q) + '">' +
      (gs.length ? '<select class="cx-in" id="cx-rt-g"><option value="all">全部字卡</option>' + gs.map(function (g) { return '<option value="' + esc(String(g.id)) + '"' + (rt.g === String(g.id) ? ' selected' : '') + '>' + esc(g.name) + '（' + g.items.length + '）</option>'; }).join('') + '<option value="none"' + (rt.g === 'none' ? ' selected' : '') + '>未分組</option></select>' : '') + '</div>';
    h += '<div class="cx-rt-acts"><button type="button" class="cx-btn pri" data-rt="fill"' + (c.none ? '' : ' disabled') + '>給未評分的打分' + (c.none ? '（' + c.none + '）' : '') + '</button>' +
      '<button type="button" class="cx-btn" data-rt="redo">全部重打</button><button type="button" class="cx-btn" data-rt="pick">讓他挑一挑</button></div>';
    h += '<div class="cx-muted">分數是隨機給的，不經過 AI，也不影響聊天裡抽字卡。只是讓你看看他喜不喜歡這張、要不要改。' +
      RT_BANDS.map(function (b) { return '<b style="color:' + b.col + '">' + (b.lo === b.hi ? b.lo : b.lo + '-' + b.hi) + ' ' + b.n + '</b>'; }).join(' / ') +
      '。要改要刪都是你決定。 <a href="#" data-rt="lines">改他的短評 ›</a></div>';
    var F = [['all', '全部'], ['none', '未評分']].concat(RT_BANDS.map(function (b) { return [b.k, b.n]; }));
    h += '<div class="cx-chips cx-rt-f">' + F.map(function (f) { return '<button type="button" data-rf="' + f[0] + '" class="' + (rt.f === f[0] ? 'on' : '') + '">' + f[1] + ' ' + c[f[0]] + '</button>'; }).join('') + '</div>';
    h += '<div id="cx-rt-list"></div>';
    rtM.body.innerHTML = h;
    rtList();
  }
  function rtFiltered() {
    var map = rtMap(), q = rt.q.trim().toLowerCase();
    var list = rtScope().filter(function (t) {
      var r = map[t];
      if (rt.f === 'none' ? r : (rt.f !== 'all' && (!r || rtBand(r.s).k !== rt.f))) return false;
      return !q || t.toLowerCase().indexOf(q) >= 0 || (r && r.c.toLowerCase().indexOf(q) >= 0);
    });
    if (rt.f !== 'all' && rt.f !== 'none') list.sort(function (a, b) { return map[a].s - map[b].s; });
    return list;
  }
  function rtList() {
    var box = rtM.body.querySelector('#cx-rt-list'); if (!box) return;
    var map = rtMap(), list = rtFiltered(), pages = Math.max(1, Math.ceil(list.length / RT_PAGE));
    if (rt.page >= pages) rt.page = pages - 1;
    var part = list.slice(rt.page * RT_PAGE, (rt.page + 1) * RT_PAGE);
    var off = new Set(); try { off = new Set(JSON.parse(localStorage.getItem('disabledReplyItems') || '[]')); } catch (e) {}
    var h = part.length ? part.map(function (t) {
      var r = map[t], b = r && rtBand(r.s);
      return '<div class="cx-rt-it" data-t="' + esc(t) + '"><div class="tx">' + esc(t) + (off.has(t) ? ' <span class="cx-rt-off">已遮蔽</span>' : '') + (b ? '<span class="tag" style="color:' + b.col + ';border-color:' + b.col + '">' + b.n + '</span>' : '<span class="tag">未評分</span>') + '</div>' +
        '<div class="row">' + (r ? '<span class="st">' + rtStars(r.s, b.col) + '</span><span class="sc">' + r.s + '/10</span><span class="cm">' + esc(r.c) + '</span>' : '<span class="cm">還沒打分</span>') +
        '<span class="op"><button type="button" data-ro="edit">改</button><button type="button" data-ro="re">' + (r ? '重打' : '打分') + '</button><button type="button" data-ro="del" class="del">刪</button></span></div></div>';
    }).join('') : '<div class="cx-muted" style="text-align:center;padding:24px 0">' + (rtCards().length ? '這裡沒有字卡' : '還沒有字卡，先到「自定義回覆」新增') + '</div>';
    if (pages > 1) h += '<div class="cx-rt-pg"><button type="button" class="cx-btn" data-rp="-1"' + (rt.page ? '' : ' disabled') + '>上一頁</button><span>' + (rt.page + 1) + ' / ' + pages + '</span><button type="button" class="cx-btn" data-rp="1"' + (rt.page < pages - 1 ? '' : ' disabled') + '>下一頁</button></div>';
    box.innerHTML = h;
  }
  function rtCardFind(t) { var a = customReplies, out = []; for (var i = 0; i < a.length; i++) if (a[i] === t) out.push(i); return out; }
  function rtEdit(t) {
    var nt = prompt('修改字卡：', t); if (nt === null) return; nt = nt.trim(); if (!nt || nt === t) return;
    rtCardFind(t).forEach(function (i) { customReplies[i] = nt; });
    (window.customReplyGroups || []).forEach(function (g) { if (Array.isArray(g.items)) g.items = g.items.map(function (x) { return x === t ? nt : x; }); });
    try { var off = JSON.parse(localStorage.getItem('disabledReplyItems') || '[]'); if (off.indexOf(t) >= 0) localStorage.setItem('disabledReplyItems', JSON.stringify(off.map(function (x) { return x === t ? nt : x; }))); } catch (e) {}
    var by = rtStore().by; Object.keys(by).forEach(function (w) { delete by[w][t]; });
    var r = rtRoll(); rtMap()[nt] = r; save(); rtSaveCards();
    toast(rt.who + '：「' + r.c + '」' + r.s + '/10', 'success'); rtRender();
  }
  function rtDel(t) {
    if (!confirm('刪除這張字卡？\n\n' + t)) return;
    rtCardFind(t).reverse().forEach(function (i) { customReplies.splice(i, 1); });
    (window.customReplyGroups || []).forEach(function (g) { if (Array.isArray(g.items)) g.items = g.items.filter(function (x) { return x !== t; }); });
    var by = rtStore().by; Object.keys(by).forEach(function (w) { delete by[w][t]; });
    save(); rtSaveCards(); toast('已刪除', 'success');
    if (rt.view === 'pick') rtPickView(); else rtRender();
  }
  function rtClick(e) {
    var a = e.target.closest('[data-rt]');
    if (a) {
      e.preventDefault(); var k = a.dataset.rt, map = rtMap(), scope = rtScope();
      if (k === 'fill') { var n = 0; scope.forEach(function (t) { if (!map[t]) { map[t] = rtRoll(); n++; } }); save(); toast(rt.who + ' 看完了 ' + n + ' 張', 'success'); rtRender(); }
      else if (k === 'redo') { if (!confirm('讓 ' + rt.who + ' 把' + (rt.g === 'all' ? '全部' : '這一組') + '字卡重新打分？')) return; scope.forEach(function (t) { map[t] = rtRoll(); }); save(); toast('重新打好了', 'success'); rtRender(); }
      else if (k === 'pick') { rt.view = 'pick'; rtPickView(); }
      else if (k === 'lines') { rt.view = 'lines'; rtLinesView(); }
      else if (k === 'lsave') {
        var L = {}; RT_BANDS.forEach(function (b) { var v = (rtM.body.querySelector('#cx-rtl-' + b.k).value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (v.length) L[b.k] = v; });
        rtStore().lines = Object.keys(L).length ? L : null; save(); toast('短評已儲存，下次打分會用', 'success'); rt.view = 'list'; rtRender();
      }
      else if (k === 'lreset') { rtStore().lines = null; save(); rtLinesView(); toast('已恢復預設', 'success'); }
      return;
    }
    var f = e.target.closest('[data-rf]'); if (f) { rt.f = f.dataset.rf; rt.page = 0; rtM.body.querySelectorAll('.cx-rt-f button').forEach(function (b) { b.classList.toggle('on', b === f); }); rtList(); return; }
    var p = e.target.closest('[data-rp]'); if (p) { rt.page += +p.dataset.rp; rtList(); var l = rtM.body.querySelector('#cx-rt-list'); if (l) l.scrollIntoView({ block: 'start' }); return; }
    var o = e.target.closest('[data-ro]'); if (!o) return;
    var t = o.closest('[data-t]').dataset.t, op = o.dataset.ro;
    if (op === 'edit') rtEdit(t);
    else if (op === 'del') rtDel(t);
    else if (op === 're') { var r = rtRoll(); rtMap()[t] = r; save(); if (rt.view === 'pick') rtPickView(); else { rtRender(); } toast(r.s + '/10 · ' + r.c, 'info'); }
    else if (op === 'keep') { var m = rtMap(); if (m[t]) { m[t].k = 1; save(); } rtPickView(); }
  }
  function rtPickView() {
    var map = rtMap(), scope = rtScope(), n = 0;
    scope.forEach(function (t) { if (!map[t]) { map[t] = rtRoll(); n++; } }); if (n) save();
    var sh = function (a) { return a.map(function (t) { return [t, Math.random()]; }).sort(function (x, y) { return map[x[0]].s - map[y[0]].s || x[1] - y[1]; }).map(function (x) { return x[0]; }); };
    var worst = sh(scope.filter(function (t) { return map[t].s <= 6 && !map[t].k; })).slice(0, 6);
    var best = sh(scope.filter(function (t) { return map[t].s >= 9; })).reverse().slice(0, 6);
    var row = function (t, bad) { var r = map[t], b = rtBand(r.s); return '<div class="cx-rt-it" data-t="' + esc(t) + '"><div class="tx">' + esc(t) + '</div><div class="row"><span class="sc" style="color:' + b.col + '">' + r.s + '/10</span><span class="cm">「' + esc(r.c) + '」</span><span class="op">' + (bad ? '<button type="button" data-ro="edit">改</button><button type="button" data-ro="keep">留著</button><button type="button" data-ro="del" class="del">刪</button>' : '') + '</span></div></div>'; };
    var h = sayHtml(worst.length ? '我翻了一下……這幾張不太像我會說的，你看看要不要改。' : '我都看過了，沒什麼不想說的。') +
      (worst.length ? '<div class="cx-rt-sec">他不太想說的</div>' + worst.map(function (t) { return row(t, true); }).join('') : '') +
      (best.length ? '<div class="cx-rt-sec">他最喜歡的</div>' + best.map(function (t) { return row(t, false); }).join('') : '') +
      '<div class="cx-muted" style="margin-top:10px">按「留著」他就不會再挑這張。按左下「返回」回到列表。</div>';
    rtM.body.innerHTML = h;
  }
  function rtLinesView() {
    var h = '<div class="cx-muted">每行一句。打分時會從這裡隨機挑一句當短評。</div>' + RT_BANDS.map(function (b) {
      return '<div class="cx-rt-sec" style="color:' + b.col + '">' + b.n + '（' + (b.lo === b.hi ? b.lo : b.lo + '–' + b.hi) + ' 分）</div><textarea class="cx-in" rows="4" id="cx-rtl-' + b.k + '">' + esc(rtLines(b.k).join('\n')) + '</textarea>';
    }).join('') + '<div class="cx-rt-acts"><button type="button" class="cx-btn pri" data-rt="lsave">儲存</button><button type="button" class="cx-btn" data-rt="lreset">恢復預設</button></div>';
    rtM.body.innerHTML = h;
  }
  (function rtCss() {
    var s = document.createElement('style'); s.id = 'cx-rate-css';
    s.textContent = '#cx-rate-modal .cx-who{margin-bottom:8px}.cx-rt-top,.cx-rt-acts,#cx-rt-list{flex-shrink:0}.cx-rt-top{display:flex;gap:8px;margin-bottom:8px}.cx-rt-top input{flex:1;min-width:0}.cx-rt-top select{flex:0 1 42%;min-width:0}' +
      '.cx-rt-acts{display:flex;gap:6px;margin:8px 0}.cx-rt-acts .cx-btn{flex:1 1 0;padding:9px 6px;font-size:13px;white-space:nowrap}.cx-rt-acts .cx-btn.pri{flex:1.4 1 0}' +
      '#cx-rate-modal .cx-muted a{color:var(--accent-color)}.cx-rt-f{margin:10px 0 4px;flex:0 0 auto;min-height:36px;padding-bottom:2px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.cx-rt-f::-webkit-scrollbar{display:none}.cx-rt-f button{flex:0 0 auto;font-size:13px;padding:5px 11px}' +
      '.cx-rt-it{padding:10px 2px;border-bottom:1px solid var(--border-color)}.cx-rt-it .tx{font-size:15px;line-height:1.5;color:var(--text-primary);word-break:break-word}' +
      '.cx-rt-it .tag{float:right;margin-left:8px;font-size:11px;border:1px solid var(--border-color);border-radius:99px;padding:1px 8px;color:var(--text-secondary)}.cx-rt-off{font-size:11px;color:var(--text-secondary)}' +
      '.cx-rt-it .row{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap}.cx-rt-it .st{letter-spacing:-1px;font-size:11px}.cx-rt-it .st i{font-style:normal}' +
      '.cx-rt-it .cm{flex:1;min-width:60px}.cx-rt-it .op{display:flex;gap:2px;margin-left:auto}.cx-rt-it .op button{border:0;background:none;color:var(--accent-color);font:inherit;font-size:13px;padding:4px 8px;cursor:pointer}.cx-rt-it .op .del{color:#d9534f}' +
      '.cx-rt-pg{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0}.cx-rt-pg .cx-btn{padding:7px 14px}.cx-rt-sec{font-weight:600;font-size:13px;margin:14px 0 4px;color:var(--text-primary)}' +
      '#cx-rate-modal textarea{width:100%;box-sizing:border-box;resize:vertical;font-size:14px}';
    document.head.appendChild(s);
  })();

  /* ================= 高階功能分頁 ================= */
  var ADV_TABS = [
    ['mem', '📖', '回憶', ['cx-diary-entry', 'anniversary-function', 'mood-function', 'envelope-function', 'cx-calllog-entry', 'stats-function']],
    ['life', '🌿', '生活', ['cx-health-entry', 'cx-acct-entry', 'cx-todo-entry', 'cx-comp-entry']],
    ['us', '💞', '和哥哥', ['qa-function', 'cx-vote-entry', 'cx-rp-entry', 'cx-phone-entry']],
    ['fun', '🎲', '好玩', ['decision-function', 'cx-quiz-entry', 'cx-toss-entry', 'fortune-lenormand-function']],
    ['set', '⚙️', '設定', ['cx-set-entry', 'custom-replies-function', 'music-player-toggle', 'cx-help-entry']]
  ];
  var ADV_HIDE = ['cx-period-entry', 'cx-sleep-entry', 'cx-pomo-entry', 'cx-dice-entry', 'cx-rate-entry', 'cx-status-entry'];
  var advList = null, advBar = null;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function advTabs() {
    var a = document.getElementById('qa-function') || document.getElementById('envelope-function');
    advList = a && a.parentNode; if (!advList || document.getElementById('cx-adv-tabs')) return;
    advBar = document.createElement('div'); advBar.id = 'cx-adv-tabs'; advBar.className = 'cx-adv-tabs';
    advBar.innerHTML = ADV_TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '<i class="dot"></i></button>'; }).join('');
    advList.parentNode.insertBefore(advBar, advList); advList.classList.add('cx-adv-paper');
    ADV_TABS.forEach(function (t) { t[3].forEach(function (id) { var el = document.getElementById(id); if (el && el.parentNode === advList) { el.dataset.cxTab = t[0]; advList.appendChild(el); } }); });
    Array.prototype.forEach.call(advList.children, function (el) { if (!el.dataset.cxTab) el.dataset.cxTab = ADV_HIDE.indexOf(el.id) >= 0 ? 'hide' : 'set'; });
    advBar.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) advShow(b.dataset.t); });
    var adv = document.getElementById('advanced-modal');
    if (adv) new MutationObserver(function () { if (adv.style.display !== 'none') advDots(); }).observe(adv, { attributes: true, attributeFilter: ['style', 'class'] });
    var t0 = lsGet('cxAdvTab'); advShow(ADV_TABS.some(function (t) { return t[0] === t0; }) ? t0 : 'life');
  }
  function advShow(t) {
    if (!advList) return; lsSet('cxAdvTab', t);
    Array.prototype.forEach.call(advBar.children, function (b) { b.classList.toggle('on', b.dataset.t === t); if (b.dataset.t === t) advList.style.setProperty('--pp', getComputedStyle(b).getPropertyValue('--tb')); });
    Array.prototype.forEach.call(advList.children, function (el) { el.classList.toggle('cx-tab-hide', (el.dataset.cxTab || 'set') !== t); });
    advDots();
  }
  function advDots() {
    if (!advBar) return;
    Array.prototype.forEach.call(advBar.children, function (b) {
      var on = Array.prototype.some.call(advList.children, function (el) { return el.dataset.cxTab === b.dataset.t && el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner') && (el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner').textContent || '').trim() && el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner').style.display !== 'none'; });
      b.classList.toggle('has', on && !b.classList.contains('on'));
    });
  }

  /* 群聊：他主動拍一拍時，隨機由一位成員來拍（不含「系統」、也不含字卡組被停用的角色） */
  function pokeMembers() {
    if (!groupOn()) return [];
    var off = {}; (window.customReplyGroups || []).forEach(function (g) { if (g && g.disabled) off[g.name] = 1; });
    return groupPeople().filter(function (p) { return p.name && p.name.indexOf('系統') < 0 && !off[p.name]; });
  }
  function pokePoolFor(name) {
    var all = (typeof customPokes !== 'undefined' && customPokes) || [], gs = (window.customPokeGroups || []).filter(function (g) { return g && !g.disabled && Array.isArray(g.items) && g.items.length; });
    var own = gs.find(function (g) { return g.name === name; });
    if (own) { var o = own.items.filter(function (t) { return all.indexOf(t) >= 0; }); if (o.length) return o; }
    var other = {}; gs.forEach(function (g) { if (g.name !== name && pokeMembers().some(function (p) { return p.name === g.name; })) g.items.forEach(function (t) { other[t] = 1; }); });
    var pool = all.filter(function (t) { return t && !other[t]; });
    return pool.length ? pool : all;
  }
  (function wrapPartnerPoke() {
    var tries = 0;
    (function install() {
      var orig = window._triggerPartnerPoke;
      if (typeof orig !== 'function') { if (++tries < 40) setTimeout(install, 500); return; }
      if (orig.__cx) return;
      var w = function () {
        var ppl = pokeMembers();
        if (ppl.length < 1) return orig.apply(this, arguments);
        var who = ppl[Math.floor(Math.random() * ppl.length)].name, pool = pokePoolFor(who);
        if (!pool.length) return orig.apply(this, arguments);
        var act = pool[Math.floor(Math.random() * pool.length)];
        try { if (typeof window._sanitizePokeTextForDisplay === 'function') act = window._sanitizePokeTextForDisplay(act); } catch (e) {}
        var txt = who + ' ' + act;
        try { if (typeof window._formatPartnerPokeText === 'function') txt = window._formatPartnerPokeText(txt); } catch (e) {}
        addMessage({ id: Date.now(), text: txt, timestamp: new Date(), type: 'system' });
        try { playSound('partner_poke'); } catch (e) {}
        try { var ti = document.getElementById('typing-indicator-wrapper'); if (ti) ti.style.display = 'none'; } catch (e) {}
      };
      w.__cx = true; window._triggerPartnerPoke = w;
    })();
  })();

  /* 電腦版：橫向一排的按鈕（字卡分組等）可以用滑鼠滾輪或按住拖曳左右移動 */
  (function hScroll() {
    function rowOf(el) {
      for (var n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
        if (n.scrollWidth > n.clientWidth + 2) { var ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return n; }
      }
      return null;
    }
    document.addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var r = rowOf(e.target); if (!r) return; var oy = getComputedStyle(r).overflowY; if ((oy === 'auto' || oy === 'scroll') && r.scrollHeight > r.clientHeight + 2) return;
      var max = r.scrollWidth - r.clientWidth;
      if ((e.deltaY < 0 && r.scrollLeft <= 0) || (e.deltaY > 0 && r.scrollLeft >= max - 1)) return;
      r.scrollLeft += e.deltaY; e.preventDefault();
    }, { passive: false });
    var drag = null;
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      var r = rowOf(e.target); if (!r || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      drag = { r: r, x: e.clientX, l: r.scrollLeft, moved: false };
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      drag.moved = true; drag.r.scrollLeft = drag.l - dx; drag.r.style.cursor = 'grabbing'; e.preventDefault();
    });
    document.addEventListener('pointerup', function () {
      if (!drag) return; var d = drag; drag = null; d.r.style.cursor = '';
      if (d.moved) { var stop = function (ev) { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', stop, true); setTimeout(function () { document.removeEventListener('click', stop, true); }, 0); }
    });
  })();

  /* 修正：電腦用滑鼠點通話視窗右上角按鈕沒反應（拖動功能把滑鼠抓走了） */
  document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('#call-window-header button')) e.stopPropagation();
  }, true);

  (function credit() {
    var h = Array.prototype.find.call(document.querySelectorAll('h3,h4'), function (x) { return /特別鳴謝/.test(x.textContent); });
    if (h && !document.getElementById('cx-credit')) { var c = document.createElement('p'); c.id = 'cx-credit'; c.style.cssText = 'font-size:12px;opacity:.75;margin-top:8px'; c.textContent = '潮汐、番茄鐘、陪伴中心、紅包、狀態檢測、拼字卡、主動來信的功能靈感來自「渡念」（小紅書 @我要學英語）；搞怪、TA 的手機、通話紀錄、陪伴模式與邀約的點子參考自「字卡傳訊」二改版（小紅書 @滚筒洗衣机）與「ZY」。程式皆為重新撰寫。'; h.parentNode.appendChild(c); }
  })();
  (function css2() { if (document.getElementById('cx-css-v107')) return; var st = document.createElement('style'); st.id = 'cx-css-v107'; st.textContent =
    '.cx-chips button.on{background:var(--accent-color,#c9a77f);color:#fff;border-color:transparent}.cx-dice-show{display:flex;align-items:center;justify-content:center;gap:10px;min-height:90px;font-size:64px;line-height:1;color:var(--text-primary)}.cx-dice-show b{font-size:15px;margin-left:6px}.cx-dice-show.roll span{animation:cxroll .65s ease-in-out}@keyframes cxroll{0%{transform:rotate(0)}50%{transform:rotate(200deg) scale(.8)}100%{transform:rotate(360deg)}}' +
    '.cx-qz-card{padding:16px;border-radius:14px;background:linear-gradient(135deg,#fff6ec,#f5ecfa);border:1px solid var(--border-color);text-align:center;font-size:15px}.cx-qz-it,.cx-td{position:relative;padding:10px 32px 10px 12px;border-radius:12px;background:var(--secondary-bg,#fafafa);border:1px solid var(--border-color);font-size:13px;display:flex;flex-direction:column;gap:3px}.cx-qz-it span{color:var(--accent-color);font-weight:600}.cx-qz-it .del,.cx-td .del{position:absolute;right:6px;top:6px;border:0;background:none;color:#aaa;font-size:16px}' +
    '.cx-td{flex-direction:row;align-items:center;gap:10px}.cx-td>div{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.cx-td small{font-size:11px;color:var(--text-secondary)}.cx-td small.late{color:#d0605a}.cx-td .ck{width:24px;height:24px;border-radius:50%;border:2px solid var(--accent-color,#c9a77f);background:#fff;color:#fff;flex-shrink:0;font-size:13px}.cx-td.done .ck{background:var(--accent-color,#c9a77f)}.cx-td.done b{text-decoration:line-through;opacity:.5}.cx-td .d{min-width:44px;text-align:center;font-weight:700;color:var(--accent-color)}' +
    '.cx-sl-top{align-items:center;text-align:center}.cx-sl-top .big{font-size:48px}.cx-sl-bars{display:flex;gap:6px;align-items:flex-end;height:120px;padding:6px 4px;border-radius:12px;background:var(--secondary-bg,#fafafa)}.cx-sl-bars>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:10px;color:var(--text-secondary)}.cx-sl-bars i{display:block;width:70%;border-radius:6px 6px 2px 2px;background:#b7a6dc}.cx-sl-bars i.low{background:#e9a3a0}' +
    '.cx-comp-pill{position:fixed;left:12px;bottom:86px;z-index:9990;border:0;border-radius:99px;padding:8px 14px;background:#fffaf2f2;color:#6b5848;box-shadow:0 4px 14px #0003;font-size:13px}.cx-comp-pill b{margin-left:4px;font-variant-numeric:tabular-nums}' +
    '.cx-sl-lock{position:fixed;inset:0;z-index:100001;background:linear-gradient(#1b2142,#2d3366 55%,#4a3f6e);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:12vh 20px 0;overflow:hidden;user-select:none;-webkit-user-select:none}.cx-sl-lock[hidden]{display:none}' +
    '.cx-sl-lock .sky i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;animation:cxtw 3s ease-in-out infinite}.cx-sl-lock .sky i:nth-child(1){left:12%;top:10%}.cx-sl-lock .sky i:nth-child(2){left:30%;top:22%;animation-delay:.6s}.cx-sl-lock .sky i:nth-child(3){left:70%;top:8%;animation-delay:1.2s}.cx-sl-lock .sky i:nth-child(4){left:85%;top:28%;animation-delay:.3s}.cx-sl-lock .sky i:nth-child(5){left:50%;top:35%;animation-delay:2s}.cx-sl-lock .sky i:nth-child(6){left:20%;top:42%;animation-delay:1.6s}.cx-sl-lock .sky i:nth-child(7){left:62%;top:46%;animation-delay:.9s}.cx-sl-lock .sky i:nth-child(8){left:90%;top:52%;animation-delay:2.4s}@keyframes cxtw{50%{opacity:.2}}' +
    '.cx-sl-lock .moon{font-size:38px}.cx-sl-lock .clk{font-size:64px;font-weight:300;letter-spacing:2px;font-variant-numeric:tabular-nums;margin-top:6px}.cx-sl-lock .dur{font-size:13px;opacity:.75}.cx-sl-lock .say{margin-top:18px;background:#ffffff22;border-radius:16px;padding:10px 16px;font-size:14px;max-width:300px;text-align:center}' +
    '.cx-sl-lock .bed{position:absolute;left:0;right:0;bottom:0;height:42vh}.cx-sl-lock .heads{position:absolute;left:50%;bottom:14vh;transform:translateX(-50%);display:flex;align-items:flex-end}.cx-sl-lock .heads img{height:24vh;max-height:200px;margin:0 -3vh;filter:brightness(.92)}.cx-sl-lock .heads img{transform:rotate(40deg);transform-origin:50% 70%}.cx-sl-lock .heads.n3{bottom:16.5vh}.cx-sl-lock .heads.n3 img:nth-child(2){margin-bottom:2vh}.cx-sl-lock .heads.n3 img{height:min(24vh,31vw);margin:0 -1vw}.cx-sl-lock .blanket{position:absolute;left:-10%;right:-10%;bottom:0;height:22vh;background:linear-gradient(#b9a8dc,#8f7fbf);border-radius:50% 50% 0 0/40% 40% 0 0;box-shadow:0 -6px 20px #0003}' +
    '.cx-sl-lock .tip{position:absolute;bottom:4vh;font-size:12px;opacity:.7}.cx-sl-lock.pic{background:#1d1f52 center bottom/cover no-repeat}.cx-sl-lock.pic .sky,.cx-sl-lock.pic .moon,.cx-sl-lock.pic .bed{display:none}.cx-sl-lock.pic .clk,.cx-sl-lock.pic .dur,.cx-sl-lock.pic .tip{text-shadow:0 1px 8px #0009}.cx-sl-lock.pic .tip{opacity:.9;color:#fff}.cx-sl-lock.pic .say{background:#1b1d4a99;backdrop-filter:blur(4px)}.cx-sl-lock .q{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fffaf7;color:#5b4636;border-radius:18px;padding:18px;width:min(300px,86vw);text-align:center;flex-direction:column;gap:12px;z-index:2}.cx-sl-lock.ask .q{display:flex}.cx-sl-lock .q .r{display:flex;gap:8px;justify-content:center}.cx-sl-lock .q .lnk{border:0;background:none;color:#a8998a;font-size:12px;text-decoration:underline}' +
    '.cx-open .p.tf{background:linear-gradient(160deg,#f6b65a,#ef8f3c)}.cx-open .coin.tfbtn{width:auto;padding:0 22px;border-radius:999px;font-size:16px}';
    document.head.appendChild(st); })();
  /* ================= v107 新功能：骰子／問卷／待辦／睡眠／轉帳 ================= */
  function who1() { var ppl = groupPeople(); return ppl.length > 1 ? ppl : [{ name: pname() }]; }
  function avOf(name) { var p = groupPeople().find(function (x) { return x.name === name; }); var src = p && p.avatar ? p.avatar : ((document.querySelector('#partner-avatar img') || {}).src || ''); return src ? '<img src="' + esc(src) + '" alt="">' : '<i class="fas fa-user"></i>'; }
  function sayBy(name, text) { return '<div class="cx-say"><div class="av">' + avOf(name) + '</div><div><div class="n">' + esc(name) + '</div><div class="b">' + esc(text) + '</div></div></div>'; }

  /* ---------- 骰子＋幫我抉擇 ---------- */
  var DICE_FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  var CHOOSE_LINES = ['就這個吧，聽我的。', '選這個，不准反悔。', '我覺得這個最適合妳。', '這個！我陪妳一起。', '閉著眼睛也選這個。', '妳心裡其實也想選這個吧？'];
  var dcM = null, dcWho = null, dcLast = null;
  function diceOpen() {
    if (!dcM) {
      dcM = makeModal('cx-dice-modal', 'fa-dice', '骰子與抉擇');
      bindChips(dcM.body, function (n) { dcWho = n; });
      dcM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.dn) { X.dice.n = +b.dataset.dn; await save(); diceRender(); return; }
        if (b.id === 'cx-dice-roll') {
          var box = dcM.body.querySelector('.cx-dice-show'); box.classList.add('roll');
          var r = []; for (var i = 0; i < X.dice.n; i++) r.push(1 + Math.floor(Math.random() * 6));
          setTimeout(function () { box.classList.remove('roll'); box.innerHTML = r.map(function (v) { return '<span>' + DICE_FACE[v - 1] + '</span>'; }).join('') + '<b>' + (r.length > 1 ? '合計 ' + r.reduce(function (a, c) { return a + c; }, 0) : r[0] + ' 點') + '</b>'; }, 650);
          return;
        }
        if (b.id === 'cx-dice-pick') {
          var opts = dcM.body.querySelector('#cx-dice-opts').value.split(/\n|，|,|、/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (opts.length < 2) { toast('至少寫兩個選項', 'warning'); return; }
          X.dice.opts = opts.join('\n'); await save();
          var w = dcWho || pname(), ch = pick(opts); dcLast = { who: w, ch: ch, line: pick(CHOOSE_LINES) };
          var out = dcM.body.querySelector('#cx-dice-out'); out.innerHTML = '<div class="cx-muted" style="text-align:center">' + esc(w) + ' 想了一下…</div>';
          setTimeout(function () { out.innerHTML = sayBy(w, '「' + ch + '」' + dcLast.line) + '<button class="cx-btn" id="cx-dice-send">傳到聊天</button>'; }, 900);
          return;
        }
        if (b.id === 'cx-dice-send' && dcLast) { iSay('🎲 幫我選：' + X.dice.opts.split('\n').join(' / ')); var L = dcLast; setTimeout(function () { sayAs(L.who, '選「' + L.ch + '」。' + L.line); }, 1500); toast('傳到聊天了', 'success'); return; }
      });
    }
    dcWho = pname(); diceRender(); dcM.open();
  }
  function diceRender() {
    dcM.body.innerHTML = '<div class="cx-sec"><h4>丟骰子</h4><div class="cx-chips">' + [1, 2, 3].map(function (n) { return '<button data-dn="' + n + '" class="' + (X.dice.n === n ? 'on' : '') + '">' + n + ' 顆</button>'; }).join('') + '</div>' +
      '<div class="cx-dice-show"><span>🎲</span></div><button class="cx-btn pri" id="cx-dice-roll">擲！</button></div>' +
      '<div class="cx-sec"><h4>幫我抉擇</h4>' + whoChips('cx-dice-who', dcWho) + '<textarea class="cx-in" id="cx-dice-opts" rows="4" placeholder="一行一個選項，例如：&#10;火鍋&#10;拉麵&#10;壽司">' + esc(X.dice.opts || '') + '</textarea>' +
      '<button class="cx-btn pri" id="cx-dice-pick">讓他幫我選</button><div id="cx-dice-out"></div></div>';
  }

  /* ---------- 問卷（互問） ---------- */
  var QZ = ['第一次見面時，對我的印象是什麼？', '最喜歡我哪一點？', '如果明天放假，想跟我去哪裡？', '我做過最讓你心動的事？', '吵架的時候，你希望我怎麼做？', '最想跟我一起完成的一件事？',
    '你覺得我們像什麼動物？', '下雨天最想做什麼？', '如果能交換一天身體，你想做什麼？', '最喜歡的季節是？為什麼？', '我生氣的時候你會怎麼哄我？', '給十年後的我們一句話。',
    '你最常想起我的時刻是？', '我的哪個小習慣你最在意？', '如果只能吃一種食物一輩子？', '最想收到的禮物是？', '你會怎麼跟別人介紹我？', '覺得我們最像的地方？',
    '最近一次因為我笑是什麼時候？', '理想的週末怎麼過？', '如果我們養一隻寵物，叫什麼名字？', '最怕失去什麼？', '你覺得愛是什麼？', '最喜歡我叫你什麼？',
    '一起旅行最想去的國家？', '你覺得我最可愛的時候是？', '晚餐想吃什麼？', '如果可以回到過去一天，你選哪天？', '我最讓你放心的地方？', '睡前最想聽我說什麼？',
    '用三個詞形容我們。', '你會為我改掉什麼習慣？', '最想跟我一起看的電影？', '你覺得我會是什麼樣的老奶奶？', '如果我變成小貓，你會怎麼養我？', '今天最想對我說的一句話？'];
  var qzM = null, qzCur = null, qzWho = null;
  var QZ_WAIT = [['now', '馬上', 0, 0], ['m5', '幾分鐘', 2, 8], ['m30', '半小時內', 10, 30], ['h2', '一兩個小時', 40, 120], ['day', '半天內', 120, 600]];
  function qzWait() { var w = QZ_WAIT.filter(function (x) { return x[0] === (X.qz.wait || 'm30'); })[0] || QZ_WAIT[2]; return w[2] ? rnd(w[2], w[3]) * 60e3 : 1500; }
  async function qzTick() {
    var now = Date.now(), ch = false;
    X.qz.list.forEach(function (x) {
      if (!x.readyAt || x.told || now < x.readyAt) return; x.told = true; ch = true;
      if (x.chat) sayAs(x.who === pname() ? null : x.who, '「' + x.q + '」' + x.his); else sysNotify(x.who, '回答了問卷：' + x.q, 'quiz');
    });
    return ch;
  }
  function quizOpen() {
    if (!qzM) {
      qzM = makeModal('cx-quiz-modal', 'fa-clipboard-question', '問卷');
      bindChips(qzM.body, function (n) { qzWho = n; });
      qzM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.id === 'cx-qz-draw') {
          var used = X.qz.list.map(function (x) { return x.q; }), pool = QZ.filter(function (q) { return used.indexOf(q) < 0; });
          var w = qzWho || pname(); qzCur = { q: pick(pool.length ? pool : QZ), who: w, his: pickFor(w) || '……這題好難，讓我想想。' }; quizRender(); return;
        }
        if (b.id === 'cx-qz-own') { var t = (qzM.body.querySelector('#cx-qz-q').value || ''); if (!t.trim()) { toast('先在上面寫一個問題', 'warning'); return; } if (t && t.trim()) { var w2 = qzWho || pname(); qzCur = { q: t.trim(), who: w2, his: pickFor(w2) || '妳問的我都會回答。' }; quizRender(); } return; }
        if (b.id === 'cx-qz-save' && qzCur) {
          qzCur.mine = (qzM.body.querySelector('#cx-qz-mine').value || '').trim(); qzCur.at = Date.now(); qzCur.readyAt = Date.now() + qzWait(); qzCur.chat = qzM.body.querySelector('#cx-qz-chat').checked;
          X.qz.list.unshift(qzCur); await save();
          if (qzCur.chat) iSay('📝 ' + qzCur.q + (qzCur.mine ? '\n我的答案：' + qzCur.mine : ''));
          var wn = qzCur.who; qzCur = null; toast(wn + ' 拿去寫了，寫好會通知妳', 'success'); quizRender(); return;
        }
        if (b.dataset.qzw) { X.qz.wait = b.dataset.qzw; await save(); quizRender(); return;
        }
        if (b.dataset.qzdel != null) { X.qz.list.splice(+b.dataset.qzdel, 1); await save(); quizRender(); return; }
      });
    }
    qzWho = pname(); quizRender(); qzM.open();
  }
  function quizRender() {
    var h = '<div class="cx-sec"><h4>抽一題問彼此</h4>' + whoChips('cx-qz-who', qzWho) + '<button class="cx-btn pri" id="cx-qz-draw">🎴 抽一題</button><div style="display:flex;gap:8px"><input class="cx-in" id="cx-qz-q" maxlength="60" placeholder="或自己寫一個問題" style="flex:1"><button class="cx-btn" id="cx-qz-own">問他</button></div>';
    if (qzCur) h += '<div class="cx-qz-card"><b>' + esc(qzCur.q) + '</b></div>' +
      '<textarea class="cx-in" id="cx-qz-mine" rows="3" placeholder="妳的答案（可以不寫）"></textarea><label class="cx-muted" style="font-size:12px"><input type="checkbox" id="cx-qz-chat" checked> 他寫好後在聊天裡回答</label><button class="cx-btn pri" id="cx-qz-save">交給 ' + esc(qzCur.who) + ' 填</button>';
    h += '<h4>他要想多久</h4><div class="cx-chips">' + QZ_WAIT.map(function (w) { return '<button data-qzw="' + w[0] + '" class="' + ((X.qz.wait || 'm30') === w[0] ? 'on' : '') + '">' + w[1] + '</button>'; }).join('') + '</div>';
    h += '</div><div class="cx-sec"><h4>問卷本（' + X.qz.list.length + '）</h4><div class="cx-list">' + (X.qz.list.length ? X.qz.list.map(function (x, i) {
      var wait = x.readyAt && Date.now() < x.readyAt;
      return '<div class="cx-qz-it"><b>' + esc(x.q) + '</b><div><span>' + esc(x.who) + '：</span>' + (wait ? '<i class="cx-muted">✍️ 還在想…（' + fmtLeft(x.readyAt - Date.now()) + '）</i>' : esc(x.his)) + '</div>' + (x.mine ? '<div><span>我：</span>' + esc(x.mine) + '</div>' : '') + '<small class="cx-muted">' + fmtTime(x.at) + '</small><button class="del" data-qzdel="' + i + '">×</button></div>';
    }).join('') : '<div class="cx-muted">還沒有問答。抽一題開始吧～</div>') + '</div></div>';
    qzM.body.innerHTML = h;
  }

  /* ---------- 待辦＋節日 ---------- */
  var LUNAR = { '農曆新年': { 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' }, '元宵節': { 2027: '02-20', 2028: '02-09', 2029: '02-27', 2030: '02-17' }, '端午節': { 2027: '06-09', 2028: '05-28', 2029: '06-16', 2030: '06-05' },
    '七夕': { 2027: '08-08', 2028: '08-26', 2029: '08-16', 2030: '08-05' }, '中秋節': { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' }, '冬至': { 2026: '12-22', 2027: '12-22', 2028: '12-21', 2029: '12-21', 2030: '12-22' } };
  var SOLAR = [['元旦', '01-01'], ['情人節', '02-14'], ['白色情人節', '03-14'], ['萬聖節', '10-31'], ['平安夜', '12-24'], ['聖誕節', '12-25'], ['跨年', '12-31']];
  var TODO_DONE = ['好棒，又完成一件！', '做得好，獎勵一個抱抱。', '妳真的很棒。', '辛苦了，休息一下吧。', '我就知道妳可以。'];
  var TODO_REMIND = ['寶貝，「%」該做了喔。', '提醒妳：「%」，別忘了。', '「%」的時間到囉，我陪妳。'];
  function festList() {
    var t0 = new Date(); t0.setHours(0, 0, 0, 0); var out = [], y = t0.getFullYear();
    [y, y + 1].forEach(function (yy) {
      SOLAR.forEach(function (s) { out.push([s[0], new Date(yy + '-' + s[1] + 'T00:00:00')]); });
      Object.keys(LUNAR).forEach(function (n) { var d = LUNAR[n][yy]; if (d) out.push([n, new Date(yy + '-' + d + 'T00:00:00')]); });
      var m1 = new Date(yy, 4, 1); out.push(['母親節', new Date(yy, 4, 1 + (7 - m1.getDay()) % 7 + 7)]);
    });
    (typeof anniversaries !== 'undefined' && Array.isArray(anniversaries) ? anniversaries : []).forEach(function (a) { if (!a || !a.date) return; var p = String(a.date).split('-'); if (p.length < 3) return; [y, y + 1].forEach(function (yy) { out.push(['💗 ' + (a.name || '重要日'), new Date(yy, +p[1] - 1, +p[2])]); }); });
    return out.filter(function (x) { return x[1] >= t0; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 8).map(function (x) { return [x[0], x[1], Math.round((x[1] - t0) / 864e5)]; });
  }
  async function todoTick() {
    var now = Date.now(), ch = false;
    (X.todo.list || []).forEach(function (t) {
      if (t.done || !t.due || t.reminded || now < t.due) return;
      t.reminded = true; ch = true; var w = t.who || pname(), txt = pick(TODO_REMIND).replace('%', t.text);
      sayAs(w === pname() ? null : w, txt); sysNotify(w, txt, 'todo');
    });
    return ch;
  }
  var tdM = null;
  function todoOpen() {
    if (!tdM) {
      tdM = makeModal('cx-todo-modal', 'fa-list-check', '待辦與節日');
      tdM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.id === 'cx-td-add') {
          var tx = tdM.body.querySelector('#cx-td-txt').value.trim(), dt = tdM.body.querySelector('#cx-td-due').value; if (!tx) { toast('寫一下要做什麼', 'warning'); return; }
          var ppl = who1(); X.todo.list.push({ id: 't' + Date.now().toString(36), text: tx, due: dt ? new Date(dt).getTime() : 0, at: Date.now(), done: false, who: pick(ppl).name }); await save(); todoRender(); return;
        }
        if (b.dataset.tdok) { var t = X.todo.list.find(function (x) { return x.id === b.dataset.tdok; }); if (!t) return; t.done = !t.done; t.doneAt = t.done ? Date.now() : 0; await save(); if (t.done) toast(pick(TODO_DONE), 'success'); todoRender(); return; }
        if (b.dataset.tddel) { X.todo.list = X.todo.list.filter(function (x) { return x.id !== b.dataset.tddel; }); await save(); todoRender(); return; }
        if (b.id === 'cx-td-clear') { X.todo.list = X.todo.list.filter(function (x) { return !x.done; }); await save(); todoRender(); return; }
      });
    }
    todoRender(); tdM.open();
  }
  function todoRender() {
    var L = X.todo.list.slice().sort(function (a, b) { return (a.done - b.done) || ((a.due || 9e15) - (b.due || 9e15)); }), open = L.filter(function (t) { return !t.done; }).length;
    var h = '<div class="cx-sec"><h4>新增待辦</h4><input class="cx-in" id="cx-td-txt" maxlength="60" placeholder="要做什麼？"><label class="cx-muted" style="font-size:12px">提醒時間（可不填，到時候哥哥會提醒妳）</label><input class="cx-in" id="cx-td-due" type="datetime-local"><button class="cx-btn pri" id="cx-td-add">加入</button></div>' +
      '<div class="cx-sec"><h4>待辦（還有 ' + open + ' 件）</h4><div class="cx-list">' + (L.length ? L.map(function (t) {
        var late = !t.done && t.due && t.due < Date.now();
        return '<div class="cx-td' + (t.done ? ' done' : '') + '"><button class="ck" data-tdok="' + t.id + '">' + (t.done ? '✓' : '') + '</button><div><b>' + esc(t.text) + '</b>' + (t.due ? '<small class="' + (late ? 'late' : '') + '">⏰ ' + fmtTime(t.due) + (t.who && !t.done ? ' · ' + esc(t.who) + ' 會提醒' : '') + '</small>' : '') + '</div><button class="del" data-tddel="' + t.id + '">×</button></div>';
      }).join('') : '<div class="cx-muted">沒有待辦，今天好好休息。</div>') + '</div>' + (L.some(function (t) { return t.done; }) ? '<button class="cx-btn" id="cx-td-clear">清掉完成的</button>' : '') + '</div>' +
      '<div class="cx-sec"><h4>快到的節日和重要日</h4><div class="cx-list">' + festList().map(function (f) { return '<div class="cx-td fest"><span class="d">' + (f[2] === 0 ? '今天' : f[2] + ' 天') + '</span><div><b>' + esc(f[0]) + '</b><small>' + (f[1].getMonth() + 1) + '/' + f[1].getDate() + '</small></div></div>'; }).join('') + '</div></div>';
    tdM.body.innerHTML = h;
  }

  /* ---------- 睡眠紀錄 ---------- */
  var SLEEP_NIGHT = ['晚安，寶貝。我在這裡陪妳。', '好好睡，夢裡見。', '把手機放下，閉上眼睛，我抱著妳。', '晚安，明天見。'];
  var SLEEP_MORN = ['早安，睡得好嗎？', '起床啦，今天也要開心。', '早安寶貝，先喝杯水。', '醒了？我想妳了。'];
  var slM = null;
  /* ---------- 睡眠鎖屏 ---------- */
  var SL_WITH = [['cs', '昶司'], ['rm', '仁彌'], ['all', '三個人一起'], ['me', '自己睡']];
  var SL_PEEK = { cs: ['……不是說要睡了嗎？手機放下。', '我看到了喔，快睡。', '再滑手機我就沒收了。'], rm: ['抓到了！偷偷玩手機～', '快回來躺好，我一個人好冷。', '乖，閉上眼睛。'] };
  var slLockEl = null, slLeft = 0, slNoLock = false;
  function himgReady(cb) {
    if (window.__cxHIMG) return cb();
    var sc = document.getElementById('cx-himg-js');
    if (!sc) { sc = document.createElement('script'); sc.id = 'cx-himg-js'; sc.src = 'homeimg.js'; document.body.appendChild(sc); }
    sc.addEventListener('load', cb);
  }
  function slWho() { var w = X.sleep.with || 'cs'; return w === 'all' ? ['cs', 'me', 'rm'] : w === 'me' ? ['me'] : w === 'cs' ? ['me', 'cs'] : ['rm', 'me']; }
  function slTalker() { var w = X.sleep.with || 'cs'; return w === 'rm' ? 'rm' : w === 'all' ? pick(['cs', 'rm']) : w === 'me' ? null : 'cs'; }
  function sleepLock(msg) {
    if (!X.sleep.cur || slNoLock) return;
    if (!slLockEl) {
      slLockEl = document.createElement('div'); slLockEl.id = 'cx-sl-lock'; slLockEl.className = 'cx-sl-lock';
      document.body.appendChild(slLockEl);
      slLockEl.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-sll]');
        if (!b) { slLockEl.classList.add('ask'); return; }
        if (b.dataset.sll === 'no') { slLockEl.classList.remove('ask'); return; }
        if (b.dataset.sll === 'cancel') { await load(); X.sleep.cur = 0; X.sleep.peek = []; await save(); sleepUnlock(); return; }
        if (b.dataset.sll === 'wake') { sleepUnlock(); slNoLock = true; await load(); sleepOpen(); }
      });
      clearInterval(slLockEl._t); slLockEl._t = setInterval(slLockTick, 20e3);
    }
    var heads = slWho().map(function (k) { var m = window.__cxHIMG && window.__cxHIMG[k + '_sleep']; return m ? '<img src="' + m.src + '" alt="">' : ''; }).join('');
    slLockEl.innerHTML = '<div class="sky"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="moon">🌙</div><div class="clk" id="cx-sl-clk"></div><div class="dur" id="cx-sl-dur"></div>' +
      (msg ? '<div class="say">' + esc(msg) + '</div>' : '') +
      '<div class="bed"><div class="heads' + (slWho().length > 2 ? ' n3' : '') + '">' + heads + '</div><div class="blanket"></div></div><div class="tip">點一下畫面就是起床 ☀️</div>' +
      '<div class="q"><b>起床了嗎？</b><div class="r"><button type="button" class="cx-btn" data-sll="no">再睡一下</button><button type="button" class="cx-btn pri" data-sll="wake">起床了</button></div><button type="button" class="lnk" data-sll="cancel">取消這次睡眠（不記錄）</button></div>';
    var pk = X.sleep.with || 'cs', pu = 'fest/sl_' + pk + '.webp', pim = new Image();
    if (slLockEl._pic === pu) { slLockEl.classList.add('pic'); }
    else { slLockEl.classList.remove('pic'); slLockEl.style.backgroundImage = ''; pim.onload = function () { if (!slLockEl) return; slLockEl._pic = pu; slLockEl.style.backgroundImage = 'url(' + pu + ')'; slLockEl.classList.add('pic'); }; pim.src = pu; }
    slLockEl.hidden = false; slLockTick();
    if (!window.__cxHIMG) himgReady(function () { if (slLockEl && !slLockEl.hidden) sleepLock(msg); });
  }
  function slLockTick() {
    if (!slLockEl || slLockEl.hidden) return; var d = new Date(), c = document.getElementById('cx-sl-clk'), u = document.getElementById('cx-sl-dur');
    if (c) c.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (u && X.sleep.cur) u.textContent = '已經睡了 ' + hm(Date.now() - X.sleep.cur) + ((X.sleep.peek || []).length ? '・偷看手機 ' + X.sleep.peek.length + ' 次' : '');
  }
  function sleepUnlock() { if (slLockEl) { slLockEl.hidden = true; slLockEl.classList.remove('ask'); } }
  function sleepRestore() { if (X.sleep.cur && !slNoLock && (!slLockEl || slLockEl.hidden)) sleepLock(); if (!X.sleep.cur) { slNoLock = false; sleepUnlock(); } }
  document.addEventListener('visibilitychange', async function () {
    if (!X || !X.sleep || !X.sleep.cur || slNoLock) return;
    if (document.hidden) { slLeft = Date.now(); return; }
    if (!slLeft) return; var away = Date.now() - slLeft; slLeft = 0;
    if (away < 15e3) return;
    await load(); if (!X.sleep.cur) return;
    X.sleep.peek = X.sleep.peek || []; X.sleep.peek.push({ t: Date.now() - away, ms: away }); await save();
    var w = slTalker(); sleepLock(w ? pick(SLEEP_PEEK_LINES(w)) : '去哪了？手機放下，好好睡覺。');
  });
  function slName(k) {
    var re = k === 'rm' ? /仁彌|仁弥/ : /昶司/, all = who1().map(function (p) { return p.name; }).concat(pname());
    return all.filter(function (n) { return re.test(n); })[0] || null;
  }
  function slSpeaker() {
    var w = X.sleep.with || 'cs', ks = w === 'all' ? ['cs', 'rm'] : w === 'me' ? [] : [w];
    var k = ks.length ? pick(ks) : null, n = k ? slName(k) : null;
    if (!n) n = pick(who1()).name;
    return { k: k || (/仁彌|仁弥/.test(n) ? 'rm' : /昶司/.test(n) ? 'cs' : ''), n: n };
  }
  var SL_NIGHT2 = { cs: ['晚安，好妹妹。手機放下，我看著妳睡。', '還不睡？……要我過去哄妳嗎（笑）', '閉眼睛。再偷看手機，我可就要沒收了。', '過來，靠著我睡。', '晚安，愛妳。明天早上我叫妳。'], rm: ['晚安，好妹妹。夢裡也要有我。', '被子蓋好了嗎？我幫妳掖一掖。', '睡吧，我在旁邊陪著妳，哪都不去。', '今天辛苦了，好好睡一覺。', '（輕輕摸摸妳的頭）晚安。'] };
  var SL_MORN2 = { cs: ['早，傻妹妹。睡得好嗎？', '醒了？早餐我讓人準備好了，先吃飯。', '睡得真熟，我看了好久（笑）', '早安。今天也要乖乖的。'], rm: ['早安，好妹妹。睡得好嗎？', '醒啦？先喝杯溫水，別空腹。', '早安，今天也想妳。', '（笑盈盈）起床啦，我等妳好久了。'] };
  function SLEEP_PEEK_LINES(w) { return SL_PEEK[w] || SL_PEEK.cs; }
  function sleepOpen() {
    if (!slM) {
      slM = makeModal('cx-sleep-modal', 'fa-bed', '睡眠紀錄');
      slM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.slw) { X.sleep.with = b.dataset.slw; await save(); sleepRender(); return; }
        if (b.id === 'cx-sl-go') { X.sleep.cur = Date.now(); X.sleep.peek = []; slNoLock = false; await save(); var sp = slSpeaker(), w = sp.n; sayAs(w === pname() ? null : w, pick(SL_NIGHT2[sp.k] || SLEEP_NIGHT)); slM.close(); sleepLock(); return; }
        if (b.id === 'cx-sl-cancel') { X.sleep.cur = 0; await save(); sleepRender(); return; }
        if (b.dataset.slq) {
          var st = X.sleep.cur, en = Date.now(); if (!st) return;
          var wv = (slM.body.querySelector('#cx-sl-wake') || {}).value;
          if (wv) { var hm2 = wv.split(':'), wd = new Date(); wd.setHours(+hm2[0], +hm2[1], 0, 0); if (wd.getTime() > Date.now() + 6e4) wd.setDate(wd.getDate() - 1); if (wd.getTime() > st) en = Math.min(Date.now(), wd.getTime()); }
          var pk = X.sleep.peek || []; X.sleep.log.unshift({ s: st, e: en, q: +b.dataset.slq, pk: pk.length, pm: Math.round(pk.reduce(function (a, x) { return a + x.ms; }, 0) / 6e4) }); X.sleep.peek = []; slNoLock = false; X.sleep.log = X.sleep.log.slice(0, 120); X.sleep.cur = 0; await save();
          var hrs = (en - st) / 36e5, sp2 = slSpeaker(), w2 = sp2.n, ln = pick(SL_MORN2[sp2.k] || SLEEP_MORN) + (hrs < 6 ? '只睡了 ' + hrs.toFixed(1) + ' 小時，今天早點睡好不好？' : hrs > 9.5 ? '睡了好久，小懶豬。' : '');
          sayAs(w2 === pname() ? null : w2, ln); sleepRender(); return;
        }
        if (b.dataset.slfix != null) { var R0 = X.sleep.log[+b.dataset.slfix], inp = slM.body.querySelector('[data-slfixv="' + b.dataset.slfix + '"]'); if (!R0 || !inp || !inp.value) return; var p2 = inp.value.split(':'), d2 = new Date(R0.e); d2.setHours(+p2[0], +p2[1], 0, 0); if (d2.getTime() <= R0.s) d2.setDate(d2.getDate() + 1); if (d2.getTime() - R0.s > 20 * 36e5) d2.setDate(d2.getDate() - 1); if (d2.getTime() > R0.s) { R0.e = d2.getTime(); await save(); toast('改好了', 'success'); sleepRender(); } return; }
        if (b.dataset.sldel != null) { X.sleep.log.splice(+b.dataset.sldel, 1); await save(); sleepRender(); return; }
      });
    }
    sleepRender(); slM.open();
  }
  function hm(ms) { var m = Math.round(ms / 6e4); return Math.floor(m / 60) + ' 小時 ' + (m % 60) + ' 分'; }
  function sleepRender() {
    var cur = X.sleep.cur, L = X.sleep.log, h = '<div class="cx-sec cx-sl-top">';
    var nw = new Date(), nv = pad(nw.getHours()) + ':' + pad(nw.getMinutes());
    if (cur) h += '<div class="big">🌙</div><div>睡著了 ' + hm(Date.now() - cur) + '</div><label class="cx-muted" style="font-size:12px">幾點醒的？（忘了按也可以改）<input type="time" id="cx-sl-wake" class="cx-in" value="' + nv + '" style="width:auto;display:inline-block;margin-left:6px"></label><h4>醒來了嗎？睡得怎麼樣</h4><div class="cx-chips">' + [['1', '😫 很差'], ['2', '😕 不好'], ['3', '😐 普通'], ['4', '🙂 不錯'], ['5', '😴 超好']].map(function (q) { return '<button data-slq="' + q[0] + '">' + q[1] + '</button>'; }).join('') + '</div><button class="cx-btn" id="cx-sl-cancel">取消這次</button>';
    else h += '<div class="big">☀️</div><h4>今晚跟誰一起睡？</h4><div class="cx-chips">' + SL_WITH.map(function (w) { return '<button data-slw="' + w[0] + '" class="' + ((X.sleep.with || 'cs') === w[0] ? 'on' : '') + '">' + w[1] + '</button>'; }).join('') + '</div><button class="cx-btn pri" id="cx-sl-go">🌙 我要睡了</button><div class="cx-muted" style="font-size:12px">按了之後哥哥會說晚安；起床回來按「睡得怎麼樣」就會記錄下來</div>';
    h += '</div>';
    var wk = L.filter(function (x) { return x.e > Date.now() - 7 * 864e5; });
    if (wk.length) {
      var avg = wk.reduce(function (a, x) { return a + (x.e - x.s); }, 0) / wk.length, aq = wk.reduce(function (a, x) { return a + x.q; }, 0) / wk.length;
      h += '<div class="cx-stat"><div><b>' + (avg / 36e5).toFixed(1) + 'h</b><span>近 7 天平均</span></div><div><b>' + ['', '😫', '😕', '😐', '🙂', '😴'][Math.round(aq)] + '</b><span>睡眠品質</span></div><div><b>' + wk.length + '</b><span>天有記錄</span></div></div>';
      var days = []; for (var i = 6; i >= 0; i--) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); var e2 = d.getTime() + 864e5, rec = L.filter(function (x) { return x.e >= d.getTime() && x.e < e2; }).reduce(function (a, x) { return a + (x.e - x.s); }, 0); days.push([['日', '一', '二', '三', '四', '五', '六'][d.getDay()], rec / 36e5]); }
      h += '<div class="cx-sl-bars">' + days.map(function (d) { return '<div><i style="height:' + Math.round(Math.min(1, d[1] / 10) * 80) + 'px" class="' + (d[1] && d[1] < 6 ? 'low' : '') + '"></i><small>' + (d[1] ? d[1].toFixed(1) : '') + '</small><span>' + d[0] + '</span></div>'; }).join('') + '</div>';
    }
    h += '<div class="cx-sec"><h4>紀錄</h4><div class="cx-list">' + (L.length ? L.slice(0, 30).map(function (x, i) { var s = new Date(x.s), e = new Date(x.e); return '<div class="cx-td"><span class="d">' + ['', '😫', '😕', '😐', '🙂', '😴'][x.q] + '</span><div><b>' + hm(x.e - x.s) + '</b><small>' + (s.getMonth() + 1) + '/' + s.getDate() + ' ' + pad(s.getHours()) + ':' + pad(s.getMinutes()) + ' → ' + pad(e.getHours()) + ':' + pad(e.getMinutes()) + '</small>' + (x.pk ? '<small style="color:#d0605a">📱 偷看手機 ' + x.pk + ' 次・' + x.pm + ' 分鐘</small>' : '') + '<span style="font-size:11px;color:var(--text-secondary)">改起床時間 <input type="time" data-slfixv="' + i + '" value="' + pad(e.getHours()) + ':' + pad(e.getMinutes()) + '" style="border:1px solid var(--border-color);border-radius:6px;font-size:11px;padding:1px 4px"> <button class="cx-btn sm" data-slfix="' + i + '" style="padding:1px 8px;font-size:11px">改</button></span></div><button class="del" data-sldel="' + i + '">×</button></div>'; }).join('') : '<div class="cx-muted">還沒有紀錄。</div>') + '</div></div>';
    slM.body.innerHTML = h;
  }
  /* ================= 健康小本 ================= */
  var HB_SICK = ['頭痛', '肚子痛', '生理痛', '感冒', '喉嚨痛', '過敏', '很累', '失眠'];
  var HB_MOOD = ['😢', '😕', '😐', '🙂', '😆'];
  var HB_SAY = {
    w_half: ['喝了一半了，好妹妹真乖。', '水喝得不錯，繼續保持（笑）'],
    w_goal: ['今天的水喝完了？真乖，獎勵一個抱抱。', '做得好，妹妹。今天很聽話嘛。'],
    w_low: ['才喝這麼一點？過來，先喝杯水。', '水呢？我看著妳喝完這杯。'],
    meal_skip: ['又沒吃飯？……傻妹妹，現在去吃。', '餓壞了怎麼辦，先吃點東西。'],
    meal_all: ['三餐都吃了，好乖。', '今天有好好吃飯，我放心了。'],
    sick: ['哪裡不舒服？躺著別動，我在。', '不舒服要說，別硬撐。', '要不要我過去陪妳？'],
    mood_low: ['怎麼了？跟我說說。', '過來，抱一下就好了。', '誰讓妳不開心了？'],
    mood_hi: ['今天心情很好嘛（笑）', '看妳開心，我也開心。'],
    sleep_short: ['昨晚才睡這麼一點？今晚早點睡。', '睡太少了，今天別太累。'],
    sleep_ok: ['昨晚睡得不錯，乖。'],
    per: ['這幾天別吃冰的，熱水袋準備好。', '肚子還疼嗎？我幫妳揉揉。'],
    remind: ['好妹妹，喝水了沒？', '該喝水了，我看著。', '吃飯了沒？別又忘了。']
  };
  function hbG() { X.health = X.health || {}; var H = X.health; H.days = H.days || {}; if (H.goal == null) H.goal = 8; if (H.remind == null) H.remind = true; H.rd = H.rd || {}; return H; }
  function hbDay(d) { var H = hbG(); H.days[d] = H.days[d] || { w: 0, m: {}, mood: 0, mt: '', sick: [] }; var o = H.days[d]; o.m = o.m || {}; o.sick = o.sick || []; if (!o.sx) { o.sx = o.sick.map(function (k) { return { k: k, t: '', lv: 2 }; }); } return o; }
  function hbSx(d) { var o = (hbG().days[d] || {}); return o.sx || (o.sick || []).map(function (k) { return { k: k, t: '', lv: 2 }; }); }
  var HB_LV = ['輕微', '普通', '很痛'], hbLv = 2;
  function hbSleep(d) {
    var L = (X.sleep.log || []).filter(function (r) { return ymd(new Date(r.e)) === d; });
    if (!L.length) return null; var ms = L.reduce(function (a, r) { return a + (r.e - r.s); }, 0);
    return { ms: ms, q: L[0].q, pk: L.reduce(function (a, r) { return a + (r.pk || 0); }, 0) };
  }
  function hbPer(d) { try { var st = pMap(), t = st.map[d]; if (t !== 'per') return t || null; var cur = st.ps.filter(function (p) { return d >= p.start && d <= p.end; })[0]; return cur ? { day: diffDays(cur.start, d) + 1 } : 'per'; } catch (e) { return null; } }
  function hbSpeaker() { var n = pick(who1()).name; return n; }
  var hbM = null, hbSel = null, hbMon = null, hbSay = null;
  function hbTalk(k) { hbSay = { n: hbSpeaker(), t: pick(HB_SAY[k]) }; }
  function hbOpen() {
    if (!hbM) {
      hbM = makeModal('cx-health-modal', 'fa-heart', '健康小本');
      hbM.onBack = function () { if (hbM.view && hbM.view !== 'main') { hbM.view = 'main'; hbRender(); return true; } };
      hbM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var H = hbG(), D = hbDay(hbSel), ds = b.dataset;
        if (ds.hw != null) {
          var before = D.w; D.w = +ds.hw === D.w ? D.w - 1 : +ds.hw;
          if (D.w >= H.goal && before < H.goal) hbTalk('w_goal'); else if (D.w >= H.goal / 2 && before < H.goal / 2) hbTalk('w_half');
        } else if (ds.hm) {
          D.m[ds.hm] = !D.m[ds.hm];
          if (D.m.b && D.m.l && D.m.d) hbTalk('meal_all');
        } else if (ds.hmood) {
          D.mood = +ds.hmood === D.mood ? 0 : +ds.hmood;
          if (D.mood && D.mood <= 2) hbTalk('mood_low'); else if (D.mood >= 5) hbTalk('mood_hi');
        } else if (ds.hsick) {
          var tin = hbM.body.querySelector('#cx-hb-st'), tv = tin && tin.value ? tin.value : (pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()));
          D.sx.push({ k: ds.hsick, t: tv, lv: hbLv }); D.sx.sort(function (a, b) { return a.t < b.t ? -1 : 1; });
          D.sick = D.sx.map(function (x) { return x.k; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
          var cnt = D.sx.filter(function (x) { return x.k === ds.hsick; }).length;
          hbSay = { n: hbSpeaker(), t: cnt >= 2 ? '今天第 ' + cnt + ' 次' + ds.hsick + '了……躺下休息，我陪著妳。' : pick(HB_SAY.sick) };
        } else if (ds.hlv) { hbLv = +ds.hlv; hbRender(); return;
        } else if (ds.hsxdel != null) {
          D.sx.splice(+ds.hsxdel, 1); D.sick = D.sx.map(function (x) { return x.k; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
        } else if (ds.hmon) { hbMon.setMonth(hbMon.getMonth() + (+ds.hmon)); hbRender(); return; }
        else if (ds.hd) { hbSel = ds.hd; hbSay = null; hbRender(); return; }
        else if (ds.hv) { hbM.view = ds.hv; hbRender(); return; }
        else if (ds.hgoal) { H.goal = Math.max(4, Math.min(15, H.goal + (+ds.hgoal))); }
        else if (ds.hrem) { H.remind = !H.remind; }
        else return;
        await save(); hbRender();
      });
      hbM.body.addEventListener('change', async function (e) { if (e.target.id === 'cx-hb-mt') { hbDay(hbSel).mt = e.target.value.slice(0, 60); await save(); } });
    }
    hbSel = ymd(new Date()); hbMon = new Date(); hbMon.setDate(1); hbM.view = 'main'; hbSay = null;
    var D0 = hbDay(hbSel), sl = hbSleep(hbSel), pr = hbPer(hbSel);
    if (pr && pr.day) hbTalk('per'); else if (sl && sl.ms < 6 * 36e5) hbTalk('sleep_short'); else if (sl) hbTalk('sleep_ok');
    else if (new Date().getHours() >= 14 && D0.w < 3) hbTalk('w_low');
    hbRender(); hbM.open();
  }
  function hbWeek() {
    var t = ymd(new Date()), days = [], H = hbG();
    for (var i = 6; i >= 0; i--) days.push(addDays(t, -i));
    var sl = days.map(hbSleep).filter(Boolean), ws = days.map(function (d) { return (H.days[d] || {}).w || 0; });
    var moods = days.map(function (d) { return (H.days[d] || {}).mood || 0; }).filter(Boolean);
    var meals = days.reduce(function (a, d) { var m = (H.days[d] || {}).m || {}; return a + (m.b ? 1 : 0) + (m.l ? 1 : 0) + (m.d ? 1 : 0); }, 0);
    var sick = days.reduce(function (a, d) { return a + (hbSx(d).length ? 1 : 0); }, 0), sxc = {}, sxt = { 早上: 0, 下午: 0, 晚上: 0 };
    days.forEach(function (d) { hbSx(d).forEach(function (x) { sxc[x.k] = (sxc[x.k] || 0) + 1; if (x.t) { var hh = +x.t.slice(0, 2); sxt[hh < 12 ? '早上' : hh < 18 ? '下午' : '晚上']++; } }); });
    return { days: days, sl: sl.length ? sl.reduce(function (a, r) { return a + r.ms; }, 0) / sl.length : 0, sln: sl.length, w: ws.reduce(function (a, x) { return a + x; }, 0) / 7, ws: ws,
      mood: moods.length ? moods.reduce(function (a, x) { return a + x; }, 0) / moods.length : 0, meals: meals, sick: sick, sxc: sxc, sxt: sxt };
  }
  function hbComment(s) {
    var H = hbG(), out = [];
    if (s.sln) out.push(s.sl < 6 * 36e5 ? '這週睡太少了，今晚開始早點睡，我陪妳。' : s.sl >= 7 * 36e5 ? '這週睡得很好，乖。' : '睡眠還可以，再早一點睡就更好了。');
    out.push(s.w >= H.goal * 0.8 ? '水喝得很好，繼續保持。' : '水喝得太少了，好妹妹，每天多喝幾杯。');
    out.push(s.meals >= 18 ? '三餐都有好好吃，我很放心。' : '有幾頓沒吃，下次不准再跳過。');
    if (s.sick) { var hd = s.sxc['頭痛'] || 0, tk = Object.keys(s.sxt).sort(function (a, b) { return s.sxt[b] - s.sxt[a]; })[0];
      out.push(hd >= 3 ? '這週頭痛了 ' + hd + ' 次' + (s.sxt[tk] ? '，大多在' + tk : '') + '……多喝水、早點睡，一直這樣要去看醫生，我陪妳去。' : '這週有 ' + s.sick + ' 天不太舒服，要好好照顧自己，不舒服就叫我。'); }
    if (s.mood && s.mood < 2.8) out.push('這週心情好像不太好……過來，抱抱。');
    return out.join('');
  }
  function hbRender() {
    var H = hbG(), b = hbM.body, today = ymd(new Date());
    if (hbM.view === 'week') {
      var s = hbWeek(), mx = Math.max(H.goal, Math.max.apply(null, s.ws));
      b.innerHTML = '<div class="cx-sec"><h4>最近 7 天</h4><div class="cx-hb-sum">' +
        '<div><small>平均睡眠</small><b>' + (s.sln ? (s.sl / 36e5).toFixed(1) + 'h' : '—') + '</b></div>' +
        '<div><small>平均喝水</small><b>' + s.w.toFixed(1) + ' 杯</b></div>' +
        '<div><small>吃了幾餐</small><b>' + s.meals + '/21</b></div>' +
        '<div><small>心情</small><b>' + (s.mood ? HB_MOOD[Math.round(s.mood) - 1] : '—') + '</b></div></div>' +
        '<div class="cx-hb-bars">' + s.days.map(function (d, i) { return '<div><i style="height:' + Math.round(s.ws[i] / mx * 100) + '%"></i><small>' + d.slice(8) + '</small></div>'; }).join('') + '</div><div class="cx-muted" style="font-size:11px;text-align:center">每天喝水杯數</div>' +
        (Object.keys(s.sxc).length ? '<h4>不舒服紀錄</h4><div class="cx-hb-chips">' + Object.keys(s.sxc).map(function (k) { return '<button class="on sick">' + k + ' ×' + s.sxc[k] + '</button>'; }).join('') + '</div><div class="cx-muted" style="font-size:12px">時段：早上 ' + s.sxt['早上'] + '・下午 ' + s.sxt['下午'] + '・晚上 ' + s.sxt['晚上'] + '</div>' : '') +
        sayBy(hbSpeaker(), hbComment(s)) +
        '<h4>設定</h4><div class="cx-row"><span>每天喝水目標</span><span><button class="cx-btn sm" data-hgoal="-1">－</button> <b>' + H.goal + '</b> 杯 <button class="cx-btn sm" data-hgoal="1">＋</button></span></div>' +
        '<div class="cx-row"><span>哥哥提醒喝水、吃飯</span><button class="cx-btn sm' + (H.remind ? ' pri' : '') + '" data-hrem="1">' + (H.remind ? '開' : '關') + '</button></div>' +
        '<p class="cx-muted" style="font-size:11px">只是給自己看的紀錄，不是醫療建議。不舒服持續好幾天要去看醫生喔。</p></div>';
      return;
    }
    var D = hbDay(hbSel), sl = hbSleep(hbSel), pr = hbPer(hbSel), isT = hbSel === today;
    var h = '<div class="cx-sec">';
    h += '<div class="cx-hb-date"><b>' + (isT ? '今天' : hbSel.slice(5).replace('-', '月') + '日') + '</b>' + (pr && pr.day ? '<span class="per">🩸 經期第 ' + pr.day + ' 天</span>' : pr === 'pred' ? '<span class="pred">經期快到了</span>' : '') + '</div>';
    if (hbSay) h += sayBy(hbSay.n, hbSay.t);
    h += '<h4>💧 喝水 ' + D.w + '/' + H.goal + ' 杯</h4><div class="cx-hb-cups">';
    for (var i = 1; i <= Math.max(H.goal, D.w); i++) h += '<button data-hw="' + i + '" class="' + (i <= D.w ? 'on' : '') + '">' + (i <= D.w ? '🥛' : '🫙') + '</button>';
    h += '</div><h4>🍚 三餐</h4><div class="cx-hb-chips">' + [['b', '早餐'], ['l', '午餐'], ['d', '晚餐']].map(function (m) { return '<button data-hm="' + m[0] + '" class="' + (D.m[m[0]] ? 'on' : '') + '">' + (D.m[m[0]] ? '✓ ' : '') + m[1] + '</button>'; }).join('') + '</div>';
    h += '<h4>😊 心情</h4><div class="cx-hb-mood">' + HB_MOOD.map(function (e, i) { return '<button data-hmood="' + (i + 1) + '" class="' + (D.mood === i + 1 ? 'on' : '') + '">' + e + '</button>'; }).join('') + '</div>';
    h += '<input class="cx-in" id="cx-hb-mt" maxlength="60" placeholder="想說點什麼……" value="' + esc(D.mt) + '">';
    var nw = new Date(), tdef = isT ? pad(nw.getHours()) + ':' + pad(nw.getMinutes()) : '';
    h += '<h4>🤒 不舒服（點一次記一次）</h4><div class="cx-hb-lv"><span>程度</span>' + HB_LV.map(function (l, i) { return '<button data-hlv="' + (i + 1) + '" class="' + (hbLv === i + 1 ? 'on' : '') + '">' + l + '</button>'; }).join('') + '<span>時間</span><input type="time" id="cx-hb-st" value="' + tdef + '"></div>';
    h += '<div class="cx-hb-chips">' + HB_SICK.map(function (s) { var c = D.sx.filter(function (x) { return x.k === s; }).length; return '<button data-hsick="' + s + '" class="' + (c ? 'on sick' : '') + '">' + s + (c ? ' ×' + c : '') + '</button>'; }).join('') + '</div>';
    if (D.sx.length) h += '<div class="cx-hb-sx">' + D.sx.map(function (x, i) { return '<div><span>' + (x.t || '—') + '</span><b>' + esc(x.k) + '</b><em class="lv' + x.lv + '">' + HB_LV[x.lv - 1] + '</em><button data-hsxdel="' + i + '">×</button></div>'; }).join('') + '</div>';
    h += '<h4>🌙 睡眠</h4><div class="cx-muted">' + (sl ? '這天早上醒來，睡了 ' + hm(sl.ms) + (sl.q ? '・品質 ' + '⭐'.repeat(sl.q) : '') + (sl.pk ? '・偷看手機 ' + sl.pk + ' 次' : '') : '沒有睡眠紀錄（用「睡眠」記錄就會自動出現）') + '</div>';
    // calendar
    var y = hbMon.getFullYear(), mo = hbMon.getMonth(), first = new Date(y, mo, 1).getDay(), n = new Date(y, mo + 1, 0).getDate(), pm = {};
    try { pm = pMap().map; } catch (e) {}
    h += '<div class="cx-hb-calhd"><button class="cx-btn sm" data-hmon="-1">‹</button><b>' + y + ' 年 ' + (mo + 1) + ' 月</b><button class="cx-btn sm" data-hmon="1">›</button></div><div class="cx-hb-cal">' + '日一二三四五六'.split('').map(function (w) { return '<span class="wd">' + w + '</span>'; }).join('');
    for (var k = 0; k < first; k++) h += '<span></span>';
    for (var dd = 1; dd <= n; dd++) {
      var ds = y + '-' + pad(mo + 1) + '-' + pad(dd), o = H.days[ds] || {}, s2 = hbSleep(ds), wv = Math.min(1, (o.w || 0) / H.goal);
      h += '<button data-hd="' + ds + '" class="' + (ds === hbSel ? 'sel ' : '') + (ds === today ? 'td ' : '') + (pm[ds] === 'per' ? 'per' : pm[ds] === 'pred' ? 'pred' : '') + (hbSx(ds).length >= 3 ? ' many' : '') + '"><em>' + dd + '</em><span>' + (function () { var n2 = hbSx(ds).length; return n2 >= 2 ? '🤒' + n2 : o.mood ? HB_MOOD[o.mood - 1] : n2 ? '🤒' : ''; })() + '</span><i style="--w:' + Math.round(wv * 100) + '%"></i>' + (s2 ? '<small>' + (s2.ms / 36e5).toFixed(1) + 'h</small>' : '') + '</button>';
    }
    h += '</div><div class="cx-muted" style="font-size:11px">藍條＝喝水進度　紅框＝經期　數字＝睡了幾小時</div>';
    h += '<button class="cx-btn pri" data-hv="week">📊 這週小結</button></div>';
    b.innerHTML = h;
  }
  function healthTick() {
    var H = hbG(); if (!H.remind) return false;
    var now = new Date(), hr = now.getHours(), t = ymd(now), D = H.days[t] || { w: 0, m: {} }, slot = null, line = null;
    if (hr === 10 && D.w < 2) { slot = 'w10'; line = pick(HB_SAY.remind.slice(0, 2)); }
    else if (hr === 13 && !(D.m || {}).l) { slot = 'm13'; line = '吃午餐了沒？別又忘了。'; }
    else if (hr === 16 && D.w < H.goal / 2) { slot = 'w16'; line = pick(HB_SAY.w_low); }
    else if (hr === 19 && !(D.m || {}).d) { slot = 'm19'; line = '晚餐吃了嗎？吃了記得跟我說。'; }
    if (!slot || H.rd[t + slot]) return false;
    if (X.sleep.cur) return false;
    H.rd = {}; H.rd[t + slot] = 1; var n = hbSpeaker(); sayAs(n === pname() ? null : n, line); return true;
  }
  var hbCss = document.createElement('style');
  hbCss.textContent = '#cx-health-modal .cx-btn.sm{flex:none;padding:4px 10px;font-size:13px;border-radius:10px}#cx-health-modal .cx-row{justify-content:space-between}.cx-hb-date{display:flex;gap:8px;align-items:center}.cx-hb-date b{font-size:16px}.cx-hb-date .per{color:#c0392b;font-size:12px}.cx-hb-date .pred{color:#c06080;font-size:12px}' +
    '.cx-hb-cups{display:flex;flex-wrap:wrap;gap:4px}.cx-hb-cups button{width:38px;height:38px;border-radius:10px;border:1px solid var(--border-color);background:var(--primary-bg);font-size:20px;cursor:pointer;opacity:.55}.cx-hb-cups button.on{opacity:1;background:#e3f1ff;border-color:#9cc8f0}' +
    '.cx-hb-chips{display:flex;flex-wrap:wrap;gap:6px}.cx-hb-chips button{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}.cx-hb-chips button.on{background:#e8f6e8;border-color:#9fd39f}.cx-hb-chips button.sick{background:#ffe9e6;border-color:#f0a59a}' +
    '.cx-hb-mood{display:flex;gap:6px}.cx-hb-mood button{flex:1;font-size:24px;border:1px solid var(--border-color);background:var(--primary-bg);border-radius:12px;padding:4px;cursor:pointer;opacity:.5}.cx-hb-mood button.on{opacity:1;background:#fff3d6;border-color:#f0cf7a}' +
    '.cx-hb-calhd{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.cx-hb-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.cx-hb-cal .wd{text-align:center;font-size:11px;color:var(--text-secondary)}' +
    '.cx-hb-cal button{position:relative;aspect-ratio:1;border:1px solid var(--border-color);background:var(--primary-bg);border-radius:8px;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:var(--text-primary);font:inherit}.cx-hb-cal em{position:absolute;top:1px;left:3px;font-style:normal;font-size:9px;color:var(--text-secondary)}.cx-hb-cal span{font-size:15px;line-height:1}.cx-hb-cal small{font-size:8px;color:#7a6a9a}' +
    '.cx-hb-cal i{position:absolute;left:0;bottom:0;height:3px;width:var(--w);background:#7fb3e6}.cx-hb-cal .per{border:2px solid #e57373}.cx-hb-cal .pred{border:2px dashed #f0a0b0}.cx-hb-cal .sel{background:#fff0f4;box-shadow:0 0 0 2px #e8799a inset}.cx-hb-cal .td em{color:#e8799a;font-weight:700}' +
    '.cx-hb-lv{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary)}.cx-hb-lv button{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer}.cx-hb-lv button.on{background:#ffe9e6;border-color:#f0a59a}.cx-hb-lv input{border:1px solid var(--border-color);border-radius:8px;padding:3px 6px;font:inherit;font-size:12px;background:var(--primary-bg);color:var(--text-primary)}' +
    '.cx-hb-sx{display:flex;flex-direction:column;gap:4px}.cx-hb-sx div{display:flex;align-items:center;gap:8px;font-size:13px;padding:4px 8px;border-radius:10px;background:var(--primary-bg)}.cx-hb-sx span{color:var(--text-secondary);width:42px}.cx-hb-sx em{font-style:normal;font-size:11px;padding:1px 6px;border-radius:6px}.cx-hb-sx .lv1{background:#fff4d6}.cx-hb-sx .lv2{background:#ffe3d6}.cx-hb-sx .lv3{background:#ffd0d0;color:#b03030}.cx-hb-sx button{margin-left:auto;border:0;background:none;color:var(--text-secondary);font-size:16px;cursor:pointer}.cx-hb-cal .many{background:#fff0ee}' +
    '.cx-hb-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cx-hb-sum div{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:12px;padding:6px;text-align:center;display:flex;flex-direction:column}.cx-hb-sum small{font-size:10px;color:var(--text-secondary)}.cx-hb-sum b{font-size:16px}' +
    '.cx-hb-bars{display:flex;gap:6px;align-items:flex-end;height:90px;padding:6px;border-radius:12px;background:var(--primary-bg)}.cx-hb-bars div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.cx-hb-bars i{width:70%;background:#9cc8f0;border-radius:4px 4px 0 0;min-height:2px}.cx-hb-bars small{font-size:9px}';
  document.head.appendChild(hbCss);

  /* ===== 記帳本（獨立聊天窗：記帳、預算、花錢申請單） ===== */
  var AC_CAT = [['吃', '🍜', /飯|麵|吃|奶茶|珍奶|咖啡|早餐|午餐|晚餐|宵夜|便當|火鍋|雞排|飲料|零食|蛋糕|甜點|水果|餐|麥當勞|超商|7-?11|全家|鍋|壽司|拉麵|披薩|漢堡|茶|酒|coffee|food/i],
    ['交通', '🚇', /車|捷運|公車|uber|計程|高鐵|台鐵|火車|油|停車|opal|go ?card|bus|train/i],
    ['購物', '🛍️', /衣|褲|裙|鞋|包|化妝|口紅|保養|面膜|飾品|耳環|項鍊|手鍊|帽|襪|外套|淘寶|蝦皮|網購/],
    ['日用', '🧴', /超市|日用|衛生紙|洗|牙|沐浴|coles|woolworths|aldi|藥|電費|水費|網路|手機費|房租/i],
    ['玩樂', '🎡', /電影|門票|遊樂|ktv|展|演唱會|遊戲|扭蛋|娃娃|抓|按摩|book|書|課/i],
    ['住宿', '🏨', /飯店|住宿|民宿|旅館|hotel|airbnb/i],
    ['機票', '✈️', /機票|航空|flight/i],
    ['伴手禮', '🎁', /伴手禮|禮物|送/],
    ['其他', '📦', null]];
  var AC_SAY = {
    cs: {
      big: ['這筆不小……真的需要嗎？', '想買就買，但妳自己說過要省，我幫妳記著。'],
      over: ['今天超過預算了，錢包收起來。', '好妹妹，今天就到這裡，剩下的明天再說。'],
      low: ['預算快用完了，接下來省著點。', '剩不多了，我盯著妳。'],
      yes: ['准了，這點錢不用放心上。', '想要就買，我說了算。', '理由說得通，准了。', '准了，買了就好好用。'],
      no: ['駁回。', '這個月已經花不少了，駁回。', '有替代的就先用替代的，駁回。', '理由不夠，再想想。', '先放著，過幾天還想要再來找我。'],
      skip: ['真聰明，省下來了。', '忍住了？乖，獎勵一個抱抱。'],
      split: ['他說准就准？我不同意。', '……我們意見不一樣，妳冷靜一天再說。']
    },
    rm: {
      big: ['唔……這個有點貴耶，真的很想要嗎？', '要不要先送申請單給我們看看～'],
      over: ['今天花超過了……明天我們省一點好不好？', '錢包說它累了，讓它休息一下嘛～'],
      low: ['預算剩一點點了……我們省著花好不好？', '快見底了，要小心一點喔～'],
      yes: ['准啦～妳真的很喜歡嘛', '好～買吧，我幫妳蓋章！', '准了准了～要開開心心用喔'],
      no: ['唔……這次先不要好不好～', '駁回～先放著，過兩天還喜歡我們再買', '有替代的話先用替代的嘛～駁回', '這個月已經買好多了耶……駁回～'],
      skip: ['好厲害！省下來了～', '忍住了！摸摸頭，好乖～'],
      split: ['欸？他准了？那……妳再想一天好不好～', '我們吵起來了啦……妳先冷靜一天嘛']
    }
  };
  function acG() {
    X.acct = X.acct || {}; var A = X.acct; A.books = A.books || []; A.chat = A.chat || []; A.apps = A.apps || [];
    if (!A.books.length) A.books.push({ id: 'daily', name: '日常', type: 'daily', main: 'AUD', rate: 21, budget: 0, ex: [], saved: 0 });
    if (!A.cur || !A.books.some(function (b) { return b.id === A.cur; })) A.cur = A.books[0].id;
    return A;
  }
  function acBook() { var A = acG(); return A.books.filter(function (b) { return b.id === A.cur; })[0]; }
  function acConv(amt, from, to, rate) { if (from === to) return amt; return from === 'AUD' ? amt * rate : amt / rate; }
  function acFmt(n, cur) { var neg = n < 0; n = Math.abs(n); return (neg ? '-' : '') + (cur === 'AUD' ? 'A$' + (Math.round(n * 100) / 100).toLocaleString() : 'NT$' + Math.round(n).toLocaleString()); }
  function acIn(bk, e) { return acConv(e.amt, e.cur, bk.main, bk.rate); }
  function acMon(d) { return (d || ymd(new Date())).slice(0, 7); }
  function acRange(bk) { return bk.type === 'daily' ? function (e) { return e.d.slice(0, 7) === acMon(); } : function () { return true; }; }
  function acSpent(bk, day) { var f = acRange(bk); return bk.ex.filter(function (e) { return !e.inc && (day ? e.d === day : f(e)); }).reduce(function (a, e) { return a + acIn(bk, e); }, 0); }
  function acDaysLeft(bk) {
    var td = ymd(new Date());
    if (bk.type === 'daily') { var n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate() + 1; }
    if (!bk.end || td > bk.end) return 0; return diffDays(bk.start && td < bk.start ? bk.start : td, bk.end) + 1;
  }
  function acDaily(bk) { if (!bk.budget) return 0; var n = acDaysLeft(bk); if (!n) return 0; return Math.max(0, (bk.budget - acSpent(bk) + acSpent(bk, ymd(new Date()))) / n); }
  function acKey(n) { return /彌/.test(n || '') ? 'rm' : 'cs'; }
  function acPeople() { var p = who1().map(function (x) { return x.name; }); return p.length ? p : [pname()]; }
  function acCatOf(t) { for (var i = 0; i < AC_CAT.length - 1; i++) if (AC_CAT[i][2].test(t)) return AC_CAT[i][0]; return '其他'; }
  function acIcon(c) { var r = AC_CAT.filter(function (x) { return x[0] === c; })[0]; return r ? r[1] : '📦'; }
  function acParse(t, bk) {
    t = String(t || '').trim(); if (!t) return null;
    var m = t.match(/^(.*?)(\+|＋)?\s*(A\$|a\$|AU\$|澳幣?|NT\$|nt\$|台幣?|\$)?\s*(\d+(?:\.\d+)?)\s*(澳幣?|台幣?|元|塊|aud|twd)?(.*)$/i);
    if (!m) return null;
    var cur = bk.main, tag = (m[3] || '') + (m[5] || '');
    if (/A\$|AU|澳|aud/i.test(tag)) cur = 'AUD'; else if (/NT|台|twd/i.test(tag)) cur = 'TWD';
    var note = (m[1] + ' ' + m[6]).replace(/\s+/g, ' ').trim().slice(0, 40);
    return { amt: parseFloat(m[4]), cur: cur, note: note, inc: !!m[2] || /^收入|薪水|工資|退款/.test(note) };
  }
  function acPush(msg) { var A = acG(); msg.id = msg.id || 'm' + Date.now() + Math.random().toString(36).slice(2, 5); msg.b = msg.b || A.cur; msg.at = Date.now(); A.chat.push(msg); if (A.chat.length > 600) A.chat.splice(0, A.chat.length - 600); return msg; }
  function acReply(name, line) {
    setTimeout(async function () {
      await load(); if (line) acPush({ who: name, text: line }); var c = pickFor(name); if (c) acPush({ who: name, text: c, card: 1 });
      await save(); if (acM && acM.isOpen()) acRender(true);
    }, 900 + Math.random() * 1500);
  }
  function acSys(t) { acPush({ who: 'sys', text: t }); }
  /* 申請單：系統審批 */
  function acVote(name, ap, bk) {
    var inMain = acConv(ap.amt, ap.cur, bk.main, bk.rate), left = bk.budget ? bk.budget - acSpent(bk) : 0, s = 0.62;
    if (bk.budget) { var r = left > 0 ? inMain / left : 2; s -= r > 0.5 ? 0.5 : r > 0.25 ? 0.3 : r > 0.1 ? 0.12 : 0; }
    var rl = (ap.why || '').length; s += rl >= 15 ? 0.12 : rl < 4 ? -0.15 : 0;
    if (ap.alt) s -= 0.15;
    var recent = acG().apps.filter(function (x) { return x.res === 'yes' && Date.now() - x.at < 7 * 864e5; }).length; s -= recent * 0.08;
    if (ap.re) s += 0.1;
    s += acKey(name) === 'cs' ? 0.05 : -0.03;
    s += (Math.random() - 0.5) * 0.35;
    return s >= 0.5;
  }
  function acDecide(ap) {
    var bk = acG().books.filter(function (b) { return b.id === ap.b; })[0] || acBook(), ppl = acPeople();
    ap.votes = ppl.map(function (n) { return { n: n, ok: acVote(n, ap, bk) }; });
    var ok = ap.votes.filter(function (v) { return v.ok; }).length;
    ap.res = ok === ap.votes.length ? 'yes' : ok === 0 ? 'no' : 'wait'; ap.doneAt = Date.now();
    if (ap.res === 'wait') ap.waitUntil = Date.now() + 864e5;
  }
  function acTick() {
    var A = X && X.acct; if (!A || !A.apps) return false; var ch = false, now = Date.now();
    A.apps.forEach(function (ap) {
      if (ap.res === 'pending' && now >= ap.dueAt) {
        acDecide(ap); ch = true;
        ap.votes.forEach(function (v, i) {
          var k = acKey(v.n), line = ap.res === 'wait' ? pick(AC_SAY[k][v.ok ? 'yes' : 'split']) : pick(AC_SAY[k][v.ok ? 'yes' : 'no']);
          acPush({ b: ap.b, who: v.n, text: (v.ok ? '✅ ' : '❌ ') + line });
          var c = pickFor(v.n); if (c) acPush({ b: ap.b, who: v.n, text: c, card: 1 });
        });
        acPush({ b: ap.b, who: 'sys', kind: 'res', ap: ap.id });
      } else if (ap.res === 'wait' && ap.waitUntil && now >= ap.waitUntil) {
        ap.res = Math.random() < 0.5 ? 'yes' : 'no'; ap.waitUntil = 0; ch = true;
        var n = pick(acPeople()); acPush({ b: ap.b, who: n, text: ap.res === 'yes' ? '冷靜一天了，還想要的話……准了。' : '冷靜一天了，還是不要了吧。' });
        acPush({ b: ap.b, who: 'sys', kind: 'res', ap: ap.id });
      }
    });
    if (ch && acM && acM.isOpen()) acRender(true);
    return ch;
  }
  var acM = null, acView = 'chat', acForm = null;
  function acOpen(view) {
    if (!acM) {
      acM = makeModal('cx-acct-modal', 'fa-wallet', '記帳本');
      acM.el.querySelector('.modal-content').classList.add('cx-ac-wrap');
      acM.onBack = function () { if (acView !== 'chat') { acView = 'chat'; acRender(); return true; } };
      acM.body.addEventListener('click', acClick);
      acM.body.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing && e.target.id === 'cx-ac-in') { e.preventDefault(); acSend(); } });
    }
    acG(); acView = view || 'chat'; acForm = null; acRender(); acM.open();
    setTimeout(function () { var l = acM.body.querySelector('.cx-ac-log'); if (l) l.scrollTop = l.scrollHeight; }, 60);
  }
  async function acSend() {
    var inp = acM.body.querySelector('#cx-ac-in'), t = inp ? inp.value.trim() : ''; if (!t) return;
    var bk = acBook(), p = acParse(t, bk), ppl = acPeople(), who = pick(ppl);
    inp.value = '';
    if (!p || !(p.amt > 0)) { acPush({ who: 'me', text: t }); acReply(who); await save(); acRender(true); return; }
    var e = { id: 'e' + Date.now(), d: acM.body.querySelector('#cx-ac-d') ? acM.body.querySelector('#cx-ac-d').value || ymd(new Date()) : ymd(new Date()), amt: p.amt, cur: p.cur, cat: p.inc ? '收入' : acCatOf(p.note), note: p.note, inc: p.inc };
    var dayBefore = acSpent(bk, e.d), daily = acDaily(bk);
    bk.ex.push(e); acPush({ who: 'me', kind: 'ex', ex: e.id, text: t });
    var line = null, inMain = acIn(bk, e);
    if (!e.inc && bk.budget) {
      var left = bk.budget - acSpent(bk);
      if (left < bk.budget * 0.1) line = pick(AC_SAY[acKey(who)].low);
      else if (daily && dayBefore <= daily && dayBefore + inMain > daily) line = pick(AC_SAY[acKey(who)].over);
      else if (inMain > bk.budget * 0.1 && e.cat !== '機票' && e.cat !== '住宿') line = pick(AC_SAY[acKey(who)].big);
    }
    acReply(who, line); await save(); acRender(true);
  }
  async function acClick(e) {
    var b = e.target.closest('button,[data-acx]'); if (!b) return;
    var A = acG(), bk = acBook(), ds = b.dataset, v = function (id) { var el = acM.body.querySelector('#' + id); return el ? el.value.trim() : ''; };
    if (ds.acsend != null) return acSend();
    if (ds.acv) { acView = ds.acv; acForm = ds.acv === 'app' ? { cur: bk.main } : null; acRender(); return; }
    if (ds.acbook) { A.cur = ds.acbook; acView = 'chat'; await save(); acRender(); return; }
    if (ds.acx) { var ex = bk.ex.filter(function (x) { return x.id === ds.acx; })[0]; if (!ex || ex.inc) return; var i = AC_CAT.map(function (c) { return c[0]; }).indexOf(ex.cat); ex.cat = AC_CAT[(i + 1) % AC_CAT.length][0]; await save(); acRender(true); return; }
    if (ds.acdel) {
      if (!confirm('刪掉這筆帳？')) return;
      A.books.forEach(function (bb) { bb.ex = bb.ex.filter(function (x) { return x.id !== ds.acdel; }); });
      A.chat = A.chat.filter(function (m) { return m.ex !== ds.acdel; }); await save(); acRender(true); return;
    }
    if (ds.acfcur) { acForm = acForm || {}; acForm.cur = ds.acfcur; ['name', 'amt', 'why', 'alt'].forEach(function (k) { acForm[k] = v('cx-ap-' + k); }); acRender(); return; }
    if (ds.acapp != null) {
      var ap = { id: 'ap' + Date.now(), b: A.cur, name: v('cx-ap-name').slice(0, 30), amt: parseFloat(v('cx-ap-amt')), cur: (acForm && acForm.cur) || bk.main, why: v('cx-ap-why').slice(0, 120), alt: v('cx-ap-alt').slice(0, 60), at: Date.now(), dueAt: Date.now() + 4000 + Math.random() * 6000, res: 'pending', re: acForm && acForm.re };
      if (!ap.name || !(ap.amt > 0)) { toast('要寫買什麼、多少錢', 'error'); return; }
      A.apps.push(ap); acPush({ who: 'me', kind: 'app', ap: ap.id }); acView = 'chat'; acForm = null; await save(); acRender(true);
      setTimeout(function () { acTick() && save(); }, ap.dueAt - Date.now() + 50); return;
    }
    if (ds.acbuy || ds.acskip || ds.acredo) {
      var ap2 = A.apps.filter(function (x) { return x.id === (ds.acbuy || ds.acskip || ds.acredo); })[0]; if (!ap2) return;
      var bk2 = A.books.filter(function (x) { return x.id === ap2.b; })[0] || bk;
      if (ds.acbuy) { var ne = { id: 'e' + Date.now(), d: ymd(new Date()), amt: ap2.amt, cur: ap2.cur, cat: acCatOf(ap2.name), note: ap2.name }; bk2.ex.push(ne); ap2.done = 'buy'; acPush({ who: 'me', kind: 'ex', ex: ne.id, text: '買了 ' + ap2.name }); }
      else if (ds.acskip) { bk2.saved = (bk2.saved || 0) + acConv(ap2.amt, ap2.cur, bk2.main, bk2.rate); ap2.done = 'skip'; acSys('🐷 不買「' + ap2.name + '」，省下 ' + acFmt(ap2.amt, ap2.cur)); var n2 = pick(acPeople()); acReply(n2, pick(AC_SAY[acKey(n2)].skip)); }
      else { ap2.done = 'redo'; acForm = { name: ap2.name, amt: ap2.amt, cur: ap2.cur, why: ap2.why, alt: ap2.alt, re: true }; acView = 'app'; }
      await save(); acRender(acView === 'chat'); return;
    }
    if (ds.acsave != null || ds.acnew != null) {
      var name = v('cx-acb-name') || '旅行', bud = parseFloat(v('cx-acb-bud')) || 0, rate = parseFloat(v('cx-acb-rate')) || 21, main = v('cx-acb-main') || 'AUD';
      if (ds.acnew != null) { var nb = { id: 'b' + Date.now(), name: name, type: 'trip', main: main, rate: rate, budget: bud, start: v('cx-acb-st'), end: v('cx-acb-en'), ex: [], saved: 0 }; A.books.push(nb); A.cur = nb.id; acSys('📒 開了新的一本：' + name); }
      else { bk.name = bk.type === 'daily' ? '日常' : name; bk.budget = bud; bk.rate = rate; bk.main = main; if (bk.type !== 'daily') { bk.start = v('cx-acb-st'); bk.end = v('cx-acb-en'); } }
      acView = 'chat'; await save(); acRender(); return;
    }
    if (ds.acdelbook != null) { if (bk.type === 'daily' || !confirm('刪除「' + bk.name + '」和裡面所有紀錄？')) return; A.books = A.books.filter(function (x) { return x !== bk; }); A.chat = A.chat.filter(function (m) { return m.b !== bk.id; }); A.cur = 'daily'; acView = 'chat'; await save(); acRender(); return; }
  }
  function acBubble(m, bk) {
    var A = acG();
    if (m.who === 'sys' && m.kind === 'res') {
      var ap = A.apps.filter(function (x) { return x.id === m.ap; })[0]; if (!ap) return '';
      var stamp = ap.res === 'yes' ? '<span class="stamp ok">准</span>' : ap.res === 'no' ? '<span class="stamp no">駁回</span>' : '<span class="stamp wait">冷靜一天</span>';
      var act = ap.done ? '<small>' + (ap.done === 'buy' ? '已買，記進帳了' : ap.done === 'skip' ? '沒買，省下來了' : '已重新申請') + '</small>' :
        ap.res === 'yes' ? '<button class="cx-btn sm pri" data-acbuy="' + ap.id + '">買了，記帳</button><button class="cx-btn sm" data-acskip="' + ap.id + '">還是不買了</button>' :
        ap.res === 'no' ? '<button class="cx-btn sm" data-acskip="' + ap.id + '">好，不買了</button><button class="cx-btn sm" data-acredo="' + ap.id + '">修改再申請</button>' :
        '<small>明天這個時候再決定</small><button class="cx-btn sm" data-acskip="' + ap.id + '">不等了，不買</button>';
      return '<div class="cx-ac-res">' + stamp + '<b>' + esc(ap.name) + '</b> ' + acFmt(ap.amt, ap.cur) + '<div class="acts">' + act + '</div></div>';
    }
    if (m.who === 'sys') return '<div class="cx-ac-sys">' + esc(m.text) + '</div>';
    if (m.who === 'me') {
      var inner = esc(m.text);
      if (m.kind === 'ex') {
        var ex = bk.ex.filter(function (x) { return x.id === m.ex; })[0];
        if (ex) inner = '<span class="amt' + (ex.inc ? ' inc' : '') + '">' + (ex.inc ? '+' : '') + acFmt(ex.amt, ex.cur) + '</span>' + (ex.cur !== bk.main ? '<small>≈' + acFmt(acIn(bk, ex), bk.main) + '</small>' : '') + '<span class="note">' + esc(ex.note || '') + '</span>' +
          (ex.inc ? '<em class="cat">💰 收入</em>' : '<em class="cat" data-acx="' + ex.id + '">' + acIcon(ex.cat) + ' ' + ex.cat + '</em>') + '<button class="del" data-acdel="' + ex.id + '">×</button>';
      } else if (m.kind === 'app') {
        var ap2 = A.apps.filter(function (x) { return x.id === m.ap; })[0];
        if (ap2) inner = '<div class="app"><b>📝 花錢申請單' + (ap2.re ? '（重新申請）' : '') + '</b><div>想買：' + esc(ap2.name) + '</div><div>價錢：' + acFmt(ap2.amt, ap2.cur) + '</div>' + (ap2.why ? '<div>理由：' + esc(ap2.why) + '</div>' : '') + (ap2.alt ? '<div>替代：' + esc(ap2.alt) + '</div>' : '') + (ap2.res === 'pending' ? '<small>哥哥審批中…</small>' : '') + '</div>';
      }
      return '<div class="cx-ac-me' + (m.kind === 'ex' ? ' ex' : '') + '">' + inner + '</div>';
    }
    return '<div class="cx-ac-him"><div class="av">' + avOf(m.who) + '</div><div><div class="n">' + esc(m.who) + '</div><div class="b">' + esc(m.text) + '</div></div></div>';
  }
  function acRender(keepScroll) {
    var A = acG(), bk = acBook(), b = acM.body, today = ymd(new Date());
    var spent = acSpent(bk), daily = acDaily(bk), tsp = acSpent(bk, today), pct = bk.budget ? Math.min(100, spent / bk.budget * 100) : 0;
    var top = '<div class="cx-ac-books">' + A.books.map(function (x) { return '<button data-acbook="' + x.id + '" class="' + (x.id === bk.id ? 'on' : '') + '">' + (x.type === 'daily' ? '🏠 ' : '✈️ ') + esc(x.name) + '</button>'; }).join('') + '<button data-acv="new">＋</button></div>';
    var sum = '<div class="cx-ac-sum"><div><small>' + (bk.type === 'daily' ? '這個月花了' : '這趟花了') + '</small><b>' + acFmt(spent, bk.main) + '</b></div>' +
      (bk.budget ? '<div><small>還剩</small><b class="' + (bk.budget - spent < 0 ? 'neg' : '') + '">' + acFmt(bk.budget - spent, bk.main) + '</b></div>' : '<div><small>預算</small><b><button class="cx-btn sm" data-acv="set">設定</button></b></div>') +
      '<div><small>今天</small><b class="' + (daily && tsp > daily ? 'neg' : '') + '">' + acFmt(tsp, bk.main) + '</b>' + (daily ? '<em>可花 ' + acFmt(daily, bk.main) + '</em>' : '') + '</div></div>' +
      (bk.budget ? '<div class="cx-tp-bar"><i class="' + (pct >= 90 ? 'hot' : pct >= 70 ? 'warm' : '') + '" style="width:' + pct.toFixed(1) + '%"></i></div>' : '') +
      '<div class="cx-ac-tools"><button data-acv="app">📝 花錢申請單</button><button data-acv="stat">📊 統計</button><button data-acv="set">⚙️ 設定</button></div>';
    if (acView === 'chat') {
      var log = A.chat.filter(function (m) { return m.b === bk.id; }).slice(-150);
      var h = top + sum + '<div class="cx-ac-log">' + (log.length ? log.map(function (m) { return acBubble(m, bk); }).join('') :
        '<div class="cx-ac-tip">在下面直接打就能記帳：<br><b>120 珍奶</b>、<b>A$12 咖啡</b>、<b>+500 薪水</b><br>會自動分類，點分類可以改。<br>想買東西先按上面的「📝 花錢申請單」，讓哥哥審批。</div>') + '</div>' +
        '<div class="cx-ac-bar"><input type="date" id="cx-ac-d" value="' + today + '"><input class="cx-in" id="cx-ac-in" placeholder="例：120 珍奶" autocomplete="off"><button class="cx-btn pri" data-acsend="1">記</button></div>';
      var keep = keepScroll && b.querySelector('#cx-ac-in') ? b.querySelector('#cx-ac-in').value : '';
      b.innerHTML = h; var l = b.querySelector('.cx-ac-log'); if (l) l.scrollTop = l.scrollHeight;
      if (keep) b.querySelector('#cx-ac-in').value = keep;
      return;
    }
    if (acView === 'app') {
      var f = acForm || { cur: bk.main };
      b.innerHTML = top + '<div class="cx-sec"><h4>📝 花錢申請單</h4><p class="cx-muted" style="font-size:12px">送出後兩個哥哥各審一票：都准就可以買；都駁回就不買；一個准一個駁回，要冷靜一天。</p>' +
        '<div class="cx-tp-form"><label>想買什麼<input class="cx-in" id="cx-ap-name" maxlength="30" value="' + esc(f.name || '') + '"></label>' +
        '<label>多少錢<span class="cx-tp-add"><span class="cx-tp-cur"><button data-acfcur="TWD" class="' + (f.cur === 'TWD' ? 'on' : '') + '">NT$</button><button data-acfcur="AUD" class="' + (f.cur === 'AUD' ? 'on' : '') + '">A$</button></span><input class="cx-in" type="number" inputmode="decimal" id="cx-ap-amt" value="' + esc(f.amt || '') + '"></span></label>' +
        '<label>為什麼想要<textarea class="cx-in" id="cx-ap-why" maxlength="120" rows="2" placeholder="理由寫得越清楚，越容易過">' + esc(f.why || '') + '</textarea></label>' +
        '<label>有沒有替代品（可不填）<input class="cx-in" id="cx-ap-alt" maxlength="60" value="' + esc(f.alt || '') + '" placeholder="例如：家裡還有一件類似的"></label></div>' +
        '<div class="cx-tp-btns"><button class="cx-btn pri" data-acapp="1">送出申請</button><button class="cx-btn" data-acv="chat">取消</button></div></div>';
      return;
    }
    if (acView === 'stat') {
      var f2 = acRange(bk), L = bk.ex.filter(function (e) { return !e.inc && f2(e); }), byc = {};
      L.forEach(function (e) { byc[e.cat] = (byc[e.cat] || 0) + acIn(bk, e); });
      var mx = Math.max.apply(null, Object.keys(byc).map(function (k) { return byc[k]; }).concat([1]));
      var inc = bk.ex.filter(function (e) { return e.inc && f2(e); }).reduce(function (a, e) { return a + acIn(bk, e); }, 0);
      var apps = A.apps.filter(function (x) { return x.b === bk.id && x.res !== 'pending'; }), apY = apps.filter(function (x) { return x.res === 'yes'; }).length, apN = apps.filter(function (x) { return x.res === 'no'; }).length;
      var hb = 0; if (bk.type === 'daily') (X.rp.list || []).forEach(function (p) { if (p.from === 'him' && p.opened && ymd(new Date(p.openedAt || p.at)).slice(0, 7) === acMon()) hb += p.amount || 0; });
      var h2 = top + '<div class="cx-sec"><h4>' + (bk.type === 'daily' ? acMon().replace('-', ' 年 ') + ' 月' : esc(bk.name)) + '</h4>' +
        '<div class="cx-hb-sum"><div><small>花費</small><b>' + acFmt(spent, bk.main) + '</b></div><div><small>收入</small><b>' + acFmt(inc, bk.main) + '</b></div><div><small>省下</small><b>' + acFmt(bk.saved || 0, bk.main) + '</b></div><div><small>申請 准/駁</small><b>' + apY + '/' + apN + '</b></div></div>' +
        (hb ? '<div class="cx-tp-saved">🧧 這個月哥哥給的紅包和轉帳：<b>$' + hb.toFixed(2) + '</b></div>' : '') +
        '<h4>花在哪裡</h4>' + (L.length ? AC_CAT.filter(function (c) { return byc[c[0]]; }).map(function (c) { return '<div class="cx-tp-cat"><span>' + c[1] + ' ' + c[0] + '</span><i style="width:' + (byc[c[0]] / mx * 100).toFixed(0) + '%"></i><b>' + acFmt(byc[c[0]], bk.main) + '</b><small>' + (byc[c[0]] / spent * 100).toFixed(0) + '%</small></div>'; }).join('') : '<div class="cx-muted">還沒有紀錄</div>');
      var n3 = pick(acPeople()), k3 = acKey(n3), cm = !L.length ? '' : bk.budget && spent > bk.budget ? (k3 === 'cs' ? '超支了。下個月我幫妳盯緊一點。' : '這次花超過了……下次我們一起省嘛～') : (bk.saved || 0) > 0 ? (k3 === 'cs' ? '還知道忍住不買，不錯。' : '有忍住沒買的耶，好乖～') : (k3 === 'cs' ? '花得還算節制。' : '控制得很好耶～');
      if (cm) h2 += sayBy(n3, cm);
      h2 += '<button class="cx-btn" data-acv="chat">← 回去記帳</button></div>'; b.innerHTML = h2; return;
    }
    var isNew = acView === 'new', e0 = isNew ? { name: '回台灣', budget: '', rate: bk.rate || 21, main: 'TWD', type: 'trip' } : bk;
    b.innerHTML = top + '<div class="cx-sec"><h4>' + (isNew ? '開一本新的（旅行用）' : bk.type === 'daily' ? '日常設定' : '這本的設定') + '</h4><div class="cx-tp-form">' +
      (e0.type === 'daily' ? '' : '<label>名稱<input class="cx-in" id="cx-acb-name" maxlength="20" value="' + esc(e0.name) + '"></label><label>出發<input class="cx-in" type="date" id="cx-acb-st" value="' + esc(e0.start || '') + '"></label><label>回來<input class="cx-in" type="date" id="cx-acb-en" value="' + esc(e0.end || '') + '"></label>') +
      '<label>主要幣別<select class="cx-in" id="cx-acb-main"><option value="AUD"' + (e0.main === 'AUD' ? ' selected' : '') + '>澳幣 A$</option><option value="TWD"' + (e0.main === 'TWD' ? ' selected' : '') + '>台幣 NT$</option></select></label>' +
      '<label>' + (e0.type === 'daily' ? '每月預算（0＝不設）' : '這趟總預算') + '<input class="cx-in" type="number" inputmode="decimal" id="cx-acb-bud" value="' + esc(e0.budget || '') + '"></label>' +
      '<label>匯率：1 澳幣 = ? 台幣<input class="cx-in" type="number" inputmode="decimal" step="0.01" id="cx-acb-rate" value="' + esc(e0.rate) + '"></label></div>' +
      '<p class="cx-muted" style="font-size:11px">匯率照當天銀行或換匯的填，隨時可以改。</p><div class="cx-tp-btns"><button class="cx-btn pri" ' + (isNew ? 'data-acnew="1">建立' : 'data-acsave="1">儲存') + '</button>' + (!isNew && bk.type !== 'daily' ? '<button class="cx-btn" data-acdelbook="1">刪除這本</button>' : '') + '<button class="cx-btn" data-acv="chat">取消</button></div></div>';
  }
  var acCss = document.createElement('style');
  acCss.textContent = '#cx-acct-modal .cx-btn.sm{flex:none;padding:4px 10px;font-size:12px;border-radius:10px}.cx-ac-wrap{display:flex;flex-direction:column;max-height:92vh}.cx-ac-wrap .cx-body{display:flex;flex-direction:column;min-height:0;flex:1}.cx-ac-wrap .cx-body>*{flex:none}.cx-ac-wrap .cx-body>.cx-ac-log{flex:1 1 auto}' +
    '.cx-ac-books{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.cx-ac-books button{flex:none;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:4px 12px;font:inherit;font-size:13px;cursor:pointer}.cx-ac-books button.on{background:#e8799a;color:#fff;border-color:#e8799a}' +
    '.cx-ac-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0}.cx-ac-sum div{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:12px;padding:6px;display:flex;flex-direction:column;align-items:center}.cx-ac-sum small{font-size:10px;color:var(--text-secondary)}.cx-ac-sum b{font-size:15px}.cx-ac-sum b.neg{color:#c0392b}.cx-ac-sum em{font-style:normal;font-size:10px;color:var(--text-secondary)}' +
    '.cx-ac-tools{display:flex;gap:6px;margin:6px 0}.cx-ac-tools button{flex:1;border:1px dashed var(--border-color);background:none;color:var(--text-primary);border-radius:10px;padding:5px;font:inherit;font-size:12px;cursor:pointer}' +
    '.cx-ac-log{flex:1;min-height:200px;max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:14px;background:var(--primary-bg);border:1px solid var(--border-color)}' +
    '.cx-ac-tip{margin:auto;text-align:center;font-size:13px;color:var(--text-secondary);line-height:1.8}.cx-ac-sys{align-self:center;font-size:11px;color:var(--text-secondary);background:var(--secondary-bg);padding:2px 10px;border-radius:99px}' +
    '.cx-ac-me{align-self:flex-end;max-width:82%;background:#ffe3ec;color:#333;border-radius:14px 14px 4px 14px;padding:6px 10px;font-size:14px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}.cx-ac-me .amt{font-weight:700;font-size:16px}.cx-ac-me .amt.inc{color:#2e8b57}.cx-ac-me small{font-size:10px;color:#888}.cx-ac-me .note{flex-basis:100%;font-size:13px}.cx-ac-me .note:empty{display:none}.cx-ac-me .cat{font-style:normal;font-size:11px;background:#fff;border-radius:99px;padding:1px 8px;cursor:pointer}.cx-ac-me .del{border:0;background:none;color:#aaa;cursor:pointer;margin-left:auto}' +
    '.cx-ac-me .app{display:flex;flex-direction:column;gap:2px;font-size:13px}.cx-ac-me .app b{font-size:14px}' +
    '.cx-ac-him{display:flex;gap:6px;max-width:85%}.cx-ac-him .av{width:30px;height:30px;border-radius:50%;overflow:hidden;flex:none;background:var(--secondary-bg);display:flex;align-items:center;justify-content:center}.cx-ac-him .av img{width:100%;height:100%;object-fit:cover}.cx-ac-him .n{font-size:10px;color:var(--text-secondary)}.cx-ac-him .b{background:var(--secondary-bg);color:var(--text-primary);border-radius:14px 14px 14px 4px;padding:6px 10px;font-size:14px}' +
    '.cx-ac-res{align-self:center;text-align:center;background:#fffaf0;border:1px dashed #e0c48a;border-radius:14px;padding:8px 12px;font-size:13px;color:#333;max-width:92%}.cx-ac-res .acts{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:6px;align-items:center}.cx-ac-res small{color:#888}' +
    '.stamp{display:inline-block;border:2px solid;border-radius:8px;padding:0 8px;font-weight:700;transform:rotate(-8deg);margin-right:6px}.stamp.ok{color:#d0342c;border-color:#d0342c}.stamp.no{color:#666;border-color:#666}.stamp.wait{color:#c08a00;border-color:#c08a00}' +
    '.cx-ac-bar{display:flex;gap:6px;margin-top:8px;align-items:center}.cx-ac-bar .cx-in{flex:1;min-width:0}.cx-ac-bar input[type=date]{width:36px;flex:none;border:1px solid var(--border-color);border-radius:10px;padding:6px 2px;background:var(--primary-bg);color:var(--text-primary);font-size:0}.cx-ac-bar input[type=date]::-webkit-calendar-picker-indicator{margin:0 auto;font-size:16px}' +
    '.cx-tp-form{display:flex;flex-direction:column;gap:8px}.cx-tp-form label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text-secondary)}.cx-tp-add{display:flex;gap:6px;align-items:center}.cx-tp-add .cx-in{flex:1;min-width:0}.cx-tp-cur{display:flex;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;flex:none}.cx-tp-cur button{border:0;background:var(--primary-bg);color:var(--text-primary);padding:7px 10px;font:inherit;font-size:13px;cursor:pointer}.cx-tp-cur button.on{background:#e8799a;color:#fff}' +
    '.cx-tp-btns{display:flex;gap:6px;margin-top:8px}.cx-tp-btns .cx-btn{flex:1}.cx-tp-bar{height:8px;border-radius:99px;background:var(--primary-bg);border:1px solid var(--border-color);overflow:hidden}.cx-tp-bar i{display:block;height:100%;background:#8fd19e}.cx-tp-bar i.warm{background:#f5c26b}.cx-tp-bar i.hot{background:#ef7c6c}' +
    '.cx-tp-saved{font-size:13px;padding:6px 10px;border-radius:10px;background:#fff3d6;margin:6px 0}.cx-tp-cat{display:grid;grid-template-columns:72px 1fr auto 34px;gap:6px;align-items:center;font-size:13px;margin:4px 0}.cx-tp-cat i{height:10px;border-radius:99px;background:#f0a8bd;min-width:2px}.cx-tp-cat small{color:var(--text-secondary);font-size:11px;text-align:right}';
  document.head.appendChild(acCss);

  /* ===== 投票（可複選；哥哥由系統投票、可改票；附字卡留言） ===== */
  var vtM = null, vtView = 'list', vtDraft = null;
  function vtG() { X.vote = X.vote || {}; X.vote.list = X.vote.list || []; return X.vote; }
  function vtTally(p) { var c = p.opts.map(function () { return 0; }); Object.keys(p.v).forEach(function (n) { (p.v[n] || []).forEach(function (i) { if (c[i] != null) c[i]++; }); }); return c; }
  function vtSys(p, name) { var n = p.opts.length, k = p.multi ? 1 + Math.floor(Math.random() * Math.min(n, 2)) : 1, a = []; while (a.length < k) { var i = Math.floor(Math.random() * n); if (a.indexOf(i) < 0) a.push(i); } return a.sort(); }
  function vtTick() {
    var V = X && X.vote; if (!V || !V.list) return false; var ch = false, now = Date.now();
    V.list.forEach(function (p) {
      (p.wait || []).forEach(function (w) {
        if (w.done || now < w.at) return; w.done = true; ch = true;
        p.v[w.n] = vtSys(p, w.n); p.cm[w.n] = pickFor(w.n) || '';
        if (p.toChat) sayAs(w.n === pname() && !groupOn() ? null : w.n, '【投票】' + p.q + '\n我投 ' + p.v[w.n].map(function (i) { return p.opts[i]; }).join('、') + (p.cm[w.n] ? '\n' + p.cm[w.n] : ''));
      });
    });
    if (ch && vtM && vtM.isOpen()) vtRender();
    return ch;
  }
  function vtOpen() {
    if (!vtM) {
      vtM = makeModal('cx-vote-modal', 'fa-square-poll-vertical', '投票');
      vtM.onBack = function () { if (vtView !== 'list') { vtView = 'list'; vtRender(); return true; } };
      vtM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return; var V = vtG(), ds = b.dataset;
        var sync = function () { if (!vtDraft) return; vtDraft.q = (vtM.body.querySelector('#cx-vt-q') || {}).value || ''; vtDraft.opts = Array.prototype.map.call(vtM.body.querySelectorAll('.cx-vt-o'), function (x) { return x.value; }); };
        if (ds.vtnew != null) { vtDraft = { q: '', opts: ['', ''], multi: false, toChat: true }; vtView = 'new'; vtRender(); return; }
        if (ds.vtadd != null) { sync(); if (vtDraft.opts.length < 8) vtDraft.opts.push(''); vtRender(); return; }
        if (ds.vtrm != null) { sync(); vtDraft.opts.splice(+ds.vtrm, 1); vtRender(); return; }
        if (ds.vtmulti != null) { sync(); vtDraft.multi = !vtDraft.multi; vtRender(); return; }
        if (ds.vtchat != null) { sync(); vtDraft.toChat = !vtDraft.toChat; vtRender(); return; }
        if (ds.vtgo != null) {
          sync(); var q = vtDraft.q.trim(), opts = vtDraft.opts.map(function (x) { return x.trim(); }).filter(Boolean);
          if (!q || opts.length < 2) { toast('要有題目和至少兩個選項', 'error'); return; }
          var now = Date.now(), p = { id: 'vt' + now, q: q, opts: opts, multi: vtDraft.multi, toChat: vtDraft.toChat, at: now, v: {}, cm: {}, wait: acPeople().map(function (n) { return { n: n, at: now + 4000 + Math.random() * 40000 }; }) };
          V.list.unshift(p); if (p.toChat) iSay('【投票】' + q + (p.multi ? '（可複選）' : '') + '\n' + opts.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n'));
          vtView = 'list'; await save(); vtRender(); toast('投票發出去了', 'success');
          setTimeout(function () { vtTick() && save(); }, 45000); return;
        }
        var p2 = ds.vtp && V.list.filter(function (x) { return x.id === ds.vtp; })[0]; if (!p2) return;
        if (ds.vtdel != null) { if (!confirm('刪除這個投票？')) return; V.list = V.list.filter(function (x) { return x !== p2; }); await save(); vtRender(); return; }
        var who = ds.vtwho, oi = +ds.vti; if (!who || isNaN(oi)) return;
        var cur = (p2.v[who] || []).slice(), had = cur.indexOf(oi) >= 0;
        if (p2.multi) { if (had) cur.splice(cur.indexOf(oi), 1); else cur.push(oi); } else cur = had ? [] : [oi];
        var was = p2.v[who] && p2.v[who].length; p2.v[who] = cur.sort();
        (p2.wait || []).forEach(function (w) { if (w.n === who) w.done = true; });
        if (who !== '__me' && was && p2.toChat && cur.length) sayAs(who === pname() && !groupOn() ? null : who, '【投票】我改投 ' + cur.map(function (i) { return p2.opts[i]; }).join('、'));
        await save(); vtRender();
      });
    }
    vtView = 'list'; vtTick(); vtRender(); vtM.open();
  }
  function vtRender() {
    var V = vtG(), b = vtM.body;
    if (vtView === 'new') {
      var d = vtDraft;
      b.innerHTML = '<div class="cx-sec"><h4>發起投票</h4><input class="cx-in" id="cx-vt-q" maxlength="60" placeholder="題目，例如：明天吃什麼？" value="' + esc(d.q) + '">' +
        d.opts.map(function (o, i) { return '<div class="cx-tp-add"><input class="cx-in cx-vt-o" maxlength="30" placeholder="選項 ' + (i + 1) + '" value="' + esc(o) + '">' + (d.opts.length > 2 ? '<button class="cx-btn sm" data-vtrm="' + i + '">×</button>' : '') + '</div>'; }).join('') +
        (d.opts.length < 8 ? '<button class="cx-btn" data-vtadd="1">＋ 加選項</button>' : '') +
        '<div class="cx-row"><span>可以複選</span><button class="cx-btn sm' + (d.multi ? ' pri' : '') + '" data-vtmulti="1">' + (d.multi ? '開' : '關') + '</button></div>' +
        '<div class="cx-row"><span>投票結果傳到聊天</span><button class="cx-btn sm' + (d.toChat ? ' pri' : '') + '" data-vtchat="1">' + (d.toChat ? '開' : '關') + '</button></div>' +
        '<div class="cx-tp-btns"><button class="cx-btn pri" data-vtgo="1">發出投票</button></div></div>';
      return;
    }
    var ppl = acPeople(), h = '<button class="cx-btn pri" data-vtnew="1" style="width:100%">＋ 發起投票</button>';
    if (!V.list.length) h += '<div class="cx-muted" style="text-align:center;padding:20px 0">出個題目，讓哥哥們投票～<br>可以單選或複選，哥哥投完會附一張字卡。</div>';
    V.list.slice(0, 30).forEach(function (p) {
      var c = vtTally(p), mx = Math.max.apply(null, c.concat([1])), voters = ['__me'].concat(ppl);
      h += '<div class="cx-vt-card"><div class="q">' + esc(p.q) + (p.multi ? '<small>複選</small>' : '') + '</div>' +
        p.opts.map(function (o, i) { return '<div class="opt"><span>' + esc(o) + '</span><i style="width:' + (c[i] / mx * 100).toFixed(0) + '%"></i><b>' + c[i] + '</b></div>'; }).join('') +
        voters.map(function (n) {
          var mine = p.v[n] || [], waiting = n !== '__me' && !p.v[n] && (p.wait || []).some(function (w) { return w.n === n && !w.done; });
          return '<div class="who"><span class="nm">' + (n === '__me' ? '我' : esc(n)) + '</span><span class="ch">' + p.opts.map(function (o, i) { return '<button data-vtp="' + p.id + '" data-vtwho="' + esc(n) + '" data-vti="' + i + '" class="' + (mine.indexOf(i) >= 0 ? 'on' : '') + '">' + (i + 1) + '</button>'; }).join('') + '</span>' + (waiting ? '<small>想一下…</small>' : '') + '</div>' +
            (n !== '__me' && p.cm[n] ? '<div class="cm">💬 ' + esc(p.cm[n]) + '</div>' : '');
        }).join('') + '<div class="ft"><small>點數字可以幫哥哥改票</small><button class="cx-btn sm" data-vtp="' + p.id + '" data-vtdel="1">刪除</button></div></div>';
    });
    b.innerHTML = h;
  }
  var vtCss = document.createElement('style');
  vtCss.textContent = '#cx-vote-modal .cx-btn.sm{flex:none;padding:4px 10px;font-size:12px;border-radius:10px}#cx-vote-modal .cx-row{justify-content:space-between}#cx-vote-modal .cx-tp-add{margin:4px 0}.cx-vt-card{border:1px solid var(--border-color);border-radius:14px;padding:10px;margin-top:10px;background:var(--primary-bg)}.cx-vt-card .q{font-weight:700;margin-bottom:6px}.cx-vt-card .q small{font-weight:400;font-size:10px;margin-left:6px;padding:1px 6px;border-radius:6px;background:#e8f0ff}' +
    '.cx-vt-card .opt{display:grid;grid-template-columns:minmax(60px,40%) 1fr 22px;gap:6px;align-items:center;font-size:13px;margin:3px 0}.cx-vt-card .opt i{height:10px;border-radius:99px;background:#9cc8f0;min-width:2px}.cx-vt-card .opt b{text-align:right}' +
    '.cx-vt-card .who{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px}.cx-vt-card .nm{width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-vt-card .ch{display:flex;gap:4px;flex-wrap:wrap}.cx-vt-card .ch button{width:26px;height:26px;border-radius:8px;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);font:inherit;font-size:12px;cursor:pointer}.cx-vt-card .ch button.on{background:#e8799a;color:#fff;border-color:#e8799a}.cx-vt-card .who small{color:var(--text-secondary)}' +
    '.cx-vt-card .cm{font-size:12px;color:var(--text-secondary);margin:2px 0 0 62px}.cx-vt-card .ft{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.cx-vt-card .ft small{font-size:10px;color:var(--text-secondary)}';
  document.head.appendChild(vtCss);

  /* 合併入口：在視窗標題列放捷徑 */
  function hubAdd(id, links) {
    var m = document.getElementById(id); if (!m || m.querySelector('.cx-hub')) return;
    var t = m.querySelector('.modal-title'); if (!t) return;
    var w = document.createElement('span'); w.className = 'cx-hub';
    w.innerHTML = links.map(function (l, i) { return '<button type="button" data-hub="' + i + '">' + l[0] + '</button>'; }).join('');
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-hub]'); if (!b) return; hideModal(m); var fn = links[+b.dataset.hub][1]; setTimeout(async function () { await load(); fn(); }, 120); });
    t.appendChild(w);
  }
  function withHub(fn, id, links) { return function () { var r = fn.apply(this, arguments); hubAdd(id, links); return r; }; }
  hbOpen = withHub(hbOpen, 'cx-health-modal', [['🩸 潮汐', function () { pOpen(); }], ['🌙 睡眠', function () { sleepOpen(); }]]);
  pOpen = withHub(pOpen, 'cx-period-modal', [['💗 健康小本', function () { hbOpen(); }]]);
  sleepOpen = withHub(sleepOpen, 'cx-sleep-modal', [['💗 健康小本', function () { hbOpen(); }]]);
  compOpen = withHub(compOpen, 'cx-comp-modal', [['🍅 番茄鐘', function () { pomoOpen(); }]]);
  pomoOpen = withHub(pomoOpen, 'cx-pomo-modal', [['🎧 陪伴中心', function () { compOpen(); }]]);
  diaryOpen = withHub(diaryOpen, 'cx-diary-modal', [['⭐ 字卡評分', function () { rtOpen(); }]]);
  rtOpen = withHub(rtOpen, 'cx-rate-modal', [['📔 日記', function () { diaryOpen(); }]]);
  (function decisionDice() {
    var g = document.querySelector('#decision-menu-modal .decision-menu-grid'); if (!g || document.getElementById('cx-dec-dice')) return;
    var c = document.createElement('div'); c.className = 'decision-option-card'; c.id = 'cx-dec-dice';
    c.innerHTML = '<i class="fas fa-dice"></i><h3>骰子</h3><p>擲骰子、多個選項</p>';
    c.addEventListener('click', async function () { hideModal(document.getElementById('decision-menu-modal')); await load(); diceOpen(); });
    g.appendChild(c);
  })();
  var hubCss = document.createElement('style');
  hubCss.textContent = '.cx-hub{margin-left:auto;display:flex;gap:4px}.cx-hub button{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:3px 9px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}.modal-title:has(.cx-hub){display:flex;align-items:center;gap:8px;flex-wrap:wrap}';
  document.head.appendChild(hubCss);

  addEntry('cx-diary-entry', 'fa-book', '他的日記', diaryOpen);
  addEntry('cx-dice-entry', 'fa-dice', '骰子', diceOpen);
  addEntry('cx-quiz-entry', 'fa-clipboard-question', '問卷', quizOpen);
  addEntry('cx-todo-entry', 'fa-list-check', '待辦', todoOpen);
  addEntry('cx-sleep-entry', 'fa-bed', '睡眠', sleepOpen);
  addEntry('cx-period-entry', 'fa-droplet', '潮汐', pOpen);
  addEntry('cx-health-entry', 'fa-heart', '健康小本', hbOpen);
  addEntry('cx-acct-entry', 'fa-wallet', '記帳本', acOpen);
  addEntry('cx-vote-entry', 'fa-square-poll-vertical', '投票', vtOpen);
  addEntry('cx-pomo-entry', 'fa-clock', '番茄鐘', pomoOpen);
  addEntry('cx-comp-entry', 'fa-headphones', '陪伴中心', compOpen);
  addEntry('cx-rp-entry', 'fa-gift', '紅包', rpOpen);
  addEntry('cx-phone-entry', 'fa-mobile-screen', 'TA 的手機', phoneOpen);
  addEntry('cx-toss-entry', 'fa-face-grin-squint-tears', '搞怪', tossOpen);
  addEntry('cx-calllog-entry', 'fa-phone', '通話紀錄', clOpen);
  addEntry('cx-rate-entry', 'fa-star-half-stroke', '他的評分', rtOpen);
  addEntry('cx-help-entry', 'fa-book-open', '使用手冊', helpOpen);
  addEntry('cx-set-entry', 'fa-wand-magic-sparkles', '回覆與來信', setOpen);
  advTabs();
  try { envInit(); } catch (e) { console.warn('[cx] env fav', e); }
  try { envWhoInit(); pokeWhoInit(); } catch (e) { console.warn('[cx] group who', e); }
  load().then(function () { try { gcharInit(); } catch (e) { console.warn('[cx] gchar', e); } });
  /* 給 home.js（小窩、花園）用的工具 */
  window.__cxApi = {
    X: function () { return X; }, load: load, save: save, makeModal: makeModal, toast: toast, esc: esc, pname: pname, myname: myname,
    groupOn: groupOn, groupPeople: groupPeople, pokeMembers: pokeMembers, whoChips: whoChips, charGroup: charGroup, speakAs: speakAs,
    partnerSays: partnerSays, sysSay: sysSay, iSay: iSay
  };
  (function loadHome() { if (document.getElementById('cx-home-js')) return; var sc = document.createElement('script'); sc.id = 'cx-home-js'; sc.src = 'home.js'; document.body.appendChild(sc); })();
  setTimeout(tick, 3000);
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
})();
