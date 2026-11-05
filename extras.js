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
    phone: { chance: 0.04, items: [], seen: null, unread: 0, notes: null, seeded: false },
    toss: { back: 0.35 },
    gchar: {},
    comp: { books: [], lines: {
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
    '.cx-adv-tabs{display:flex;gap:6px;position:sticky;top:-1px;z-index:5;background:var(--secondary-bg);padding:4px 0 10px;margin-bottom:4px}' +
    '.cx-adv-tabs button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border:1px solid var(--border-color);border-radius:14px;background:var(--primary-bg);color:var(--text-secondary);font:inherit;font-size:12px;cursor:pointer;position:relative;white-space:nowrap}' +
    '.cx-adv-tabs button span{font-size:18px;line-height:1.2}.cx-adv-tabs button.on{background:var(--accent-color);border-color:var(--accent-color);color:#fff}' +
    '.cx-adv-tabs .dot{position:absolute;top:5px;right:8px;width:8px;height:8px;border-radius:50%;background:#ff7b93;display:none}.cx-adv-tabs button.has .dot{display:block}.cx-tab-hide{display:none!important}' +
    '.cx-env-star{position:absolute;bottom:6px;right:36px;z-index:2;background:transparent;border:none;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;cursor:pointer;color:var(--text-secondary)}#env-fav-list .cx-env-star{right:8px}' +
    '.cx-env-star.on{color:#e0a52e}.cx-env-vstar{display:inline-flex;align-items:center;gap:4px}.cx-fav-count{background:#f2b544!important}' +
    '.env-tab-bar{flex-wrap:nowrap}.env-tab-bar .env-tab-btn{white-space:nowrap}' +
    '.cx-who-t{font-size:12px;color:var(--text-secondary);margin:2px 2px 6px}.cx-who{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
    '.cx-who button{display:flex;align-items:center;gap:8px;padding:3px 14px 3px 3px;border:1px solid var(--border-color);border-radius:99px;background:var(--primary-bg);color:var(--text-primary);font:inherit;font-size:13px;cursor:pointer}' +
    '.cx-who button.on{background:var(--accent-color);border-color:var(--accent-color);color:#fff}.cx-who .av{width:34px;height:34px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--secondary-bg);color:var(--accent-color);font-size:12px;flex:none;box-shadow:0 0 0 1px var(--border-color)}.cx-who .av img{width:100%;height:100%;object-fit:cover;object-position:center 35%}' +
    '.session-item:active{transform:translateX(5px)!important}.session-info:active{transform:scale(.97);transition:transform .1s}.session-action-btn:active{transform:scale(.9)!important}' +
    '.cx-cl-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--border-color);font-size:13px;color:var(--text-primary)}.cx-cl-row span:last-child{text-align:right;color:var(--text-secondary)}.cx-sec h4 small{font-weight:400;color:var(--text-secondary);margin-left:6px}' +
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
      var p = { id: 'rp' + Date.now().toString(36), from: 'him', amount: amt, note: pick(RP_NOTES), at: Date.now(), opened: false };
      if (who) p.who = who;
      X.rp.list.push(p); await save();
      partnerSays('🧧 紅包｜' + p.note + '（點這則訊息領取）', who);
      refreshBadge();
    }, 6000 + Math.random() * 6000);
  }
  async function rpTick() {
    var now = Date.now(), changed = false;
    X.rp.list.forEach(function (p) {
      if (p.from === 'me' && !p.opened && p.openAt && now >= p.openAt) {
        p.opened = true; p.openedAt = now; changed = true;
        sysSay((p.who || pname()) + ' 領取了你的紅包');
        if (p.reply) setTimeout(function () { sayAs(p.who, p.reply); }, 1200);
      }
    });
    return changed;
  }
  var rpM = null, rpTo = null;
  function rpWho(p) { return p.who || pname(); }
  function rpOpen() {
    if (!rpM) {
      rpM = makeModal('cx-rp-modal', 'fa-gift', '紅包');
      bindChips(rpM.body, function (n) { rpTo = n; var h = rpM.body.querySelector('#cx-rp-h'); if (h) h.textContent = '發紅包給 ' + n; });
      rpM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.amt) { rpM.body.querySelector('#cx-rp-amt').value = b.dataset.amt; return; }
        if (b.id === 'cx-rp-send') {
          var amt = parseFloat(rpM.body.querySelector('#cx-rp-amt').value), note = rpM.body.querySelector('#cx-rp-note').value.trim() || '恭喜發財，大吉大利';
          if (!(amt > 0) || amt > 99999) { toast('請輸入金額', 'warning'); return; }
          var to = groupOn() && rpTo && rpTo !== pname() ? rpTo : null;
          var p = { id: 'rp' + Date.now().toString(36), from: 'me', amount: amt, note: note, at: Date.now(), opened: false, openAt: Date.now() + rnd(8e3, 90e3), reply: pickFor(to) || '謝謝寶貝' };
          if (to) p.who = to;
          X.rp.list.push(p); await save();
          iSay('🧧 紅包｜' + note + (to ? '（給 ' + to + '）' : ''));
          toast('紅包已送出', 'success'); rpRender(); return;
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
    var h = '<div class="cx-sec"><h4 id="cx-rp-h">發紅包給 ' + esc(rpTo || pname()) + '</h4>' + chips + '<input class="cx-in" id="cx-rp-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="金額">' +
      '<div class="cx-chips">' + [5.2, 13.14, 52, 520, 1314].map(function (a) { return '<button data-amt="' + a + '">' + a + '</button>'; }).join('') + '</div>' +
      '<input class="cx-in" id="cx-rp-note" maxlength="30" placeholder="恭喜發財，大吉大利"><button class="cx-btn pri" id="cx-rp-send">🧧 塞進紅包</button></div>' +
      '<div class="cx-stat"><div><b>' + unopened() + '</b><span>待領取</span></div><div><b>' + money(got) + '</b><span>收到</span></div><div><b>' + money(sent) + '</b><span>送出</span></div></div>' +
      '<div class="cx-sec"><h4>紅包記錄</h4><div class="cx-list">';
    if (!list.length) h += '<div class="cx-muted">還沒有紅包。' + esc(pname()) + ' 聊天時偶爾也會發紅包給你。</div>';
    list.forEach(function (p) {
      var mine = p.from === 'me';
      h += '<button class="cx-rp' + (p.opened ? ' done' : '') + '"' + (!mine && !p.opened ? ' data-open="' + p.id + '"' : '') + '><span class="i">🧧</span><div><b>' + esc(p.note) + '</b><span>' +
        (mine ? '送給 ' + esc(rpWho(p)) + ' · ¥' + money(p.amount) + (p.opened ? ' · 已被領取' : ' · 等待領取') : esc(rpWho(p)) + ' 送的 · ' + (p.opened ? '已領取 ¥' + money(p.amount) : '點一下領取')) + ' · ' + fmtTime(p.at) + '</span></div></button>';
    });
    rpM.body.innerHTML = h + '</div></div>';
  }
  function openPacket(id) {
    var p = X.rp.list.find(function (x) { return x.id === id; }); if (!p) return;
    var o = document.createElement('div'); o.className = 'cx-open';
    o.innerHTML = '<div class="p"><div class="who">' + esc(rpWho(p)) + ' 的紅包</div><div class="note">' + esc(p.note) + '</div>' +
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
        sysSay('你領取了 ' + rpWho(p) + ' 的紅包 ¥' + money(p.amount));
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
    if (c === 'mend') { clearInterval(cTimer); noiseStop(); cState.ending = true; compRender(); return; }
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
      if (periodCare()) ch = true;
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
    sysSay(MODES[k].e + ' 和 ' + pname() + ' ' + MODES[k].label + '中');
    cM.view = 'mode'; compRender(); modeLive();
  }
  function modeLive() {
    clearInterval(cTimer);
    var M = cState.mode, g = MODES[M].gap, said = 0, next = Date.now() + rnd(g[0], g[1]) * 1000;
    cTimer = setInterval(function () {
      if (!cM.isOpen() || !cState.started) return;
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

  /* 拍一拍：拍誰 */
  var pokeTo = null;
  function pokeWhoInit() {
    var pm = document.getElementById('poke-modal'), inp = document.getElementById('poke-input'), sb = document.getElementById('send-poke');
    if (!pm || !inp || !sb || document.getElementById('cx-poke-who-wrap')) return;
    var wrap = document.createElement('div'); wrap.id = 'cx-poke-who-wrap'; inp.parentNode.insertBefore(wrap, inp);
    bindChips(wrap, function (n) { pokeTo = n; inp.placeholder = '例如：拍了拍「' + n + '」的肩膀'; });
    new MutationObserver(function () {
      var open = pm.style.display && pm.style.display !== 'none';
      if (open && !wrap.dataset.open) { wrap.dataset.open = '1'; pokeTo = pname(); var h = whoChips('cx-poke-who', pokeTo); wrap.innerHTML = h ? '<div class="cx-who-t">拍誰</div>' + h : ''; }
      if (!open) delete wrap.dataset.open;
    }).observe(pm, { attributes: true, attributeFilter: ['style', 'class'] });
    sb.addEventListener('click', function () {
      if (!groupOn() || !pokeTo) return;
      if (pokeTo !== pname() && !inp.value.trim()) inp.value = myname() + ' 拍了拍 ' + pokeTo;
      speakAs(pokeTo);
    }, true);
  }



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
  function imgBytes(arr) { var n = 0, b = 0; (arr || []).forEach(function (m) { if (m && typeof m.image === 'string' && m.image) { n++; b += m.image.length * 2; } }); return { n: n, b: b }; }
  async function clnScan() {
    var keys = []; try { keys = await localforage.keys(); } catch (e) {}
    var P = pfx(), ids = {}; sessions().forEach(function (s) { if (s && s.id) ids[s.id] = s.name || s.id; });
    var used = {}; [localStorage.getItem('groupChatSettings')].concat(Object.keys(localStorage).filter(function (k) { return k.indexOf('groupChatSettings_') === 0; }).map(function (k) { return localStorage.getItem(k); })).forEach(function (raw) {
      try { (JSON.parse(raw || 'null') || { members: [] }).members.forEach(function (m) { if (m && m.id) used['gca_' + m.id] = 1; if (m && m.avatarRef) used[m.avatarRef] = 1; }); } catch (e) {}
    });
    var info = { total: 0, chats: [], img: { n: 0, b: 0 }, books: [], orphan: { keys: [], b: 0 }, avatars: { keys: [], b: 0 }, stickers: 0, cache: 0 };
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], v = null; try { v = await localforage.getItem(k); } catch (e) {}
      var b = (k.length * 2) + szOf(v); info.total += b;
      var m = k.indexOf(P) === 0 ? /^([a-z0-9]{10,30})_(.+)$/.exec(k.slice(P.length)) : null;
      if (m && !ids[m[1]] && !/^[A-Z]/.test(m[1])) { info.orphan.keys.push(k); info.orphan.b += b; continue; }
      if (m && m[2] === 'chatMessages' && Array.isArray(v)) { var ib = imgBytes(v); info.chats.push({ sid: m[1], name: ids[m[1]], b: b, n: v.length, img: ib }); info.img.n += ib.n; info.img.b += ib.b; continue; }
      if (m && /^cxBook_/.test(m[2])) { info.books.push({ key: k, sid: m[1], title: (v && v.title) || '未命名', b: b }); continue; }
      if (m && (m[2] === 'stickerLibrary' || m[2] === 'myStickerLibrary')) { info.stickers += b; continue; }
      if (/^gca_/.test(k) && !used[k]) { info.avatars.keys.push(k); info.avatars.b += b; }
    }
    try {
      if (window.caches) { var cn = await caches.keys(); for (var c = 0; c < cn.length; c++) { var ch = await caches.open(cn[c]), rq = await ch.keys(); for (var r = 0; r < rq.length; r++) { var res = await ch.match(rq[r]); if (res) { try { info.cache += (await res.clone().blob()).size; } catch (e) {} } } } }
    } catch (e) {}
    try { if (navigator.storage && navigator.storage.estimate) info.est = await navigator.storage.estimate(); } catch (e) {}
    clnInfo = info; return info;
  }
  function clnOpen() {
    if (!clnM) {
      clnM = makeModal('cx-clean-modal', 'fa-broom', '整理空間');
      clnM.body.addEventListener('click', async function (e) {
        var b = e.target.closest('button[data-k]'); if (!b) return;
        var k = b.dataset.k;
        if (k === 'img') { await clnImages(); return; }
        if (k === 'orphan') { if (!(await confirmAsync('清掉已刪除聊天室留下的資料？'))) return; for (var i = 0; i < clnInfo.orphan.keys.length; i++) { try { await localforage.removeItem(clnInfo.orphan.keys[i]); } catch (er) {} } toast('已清除', 'success'); clnRefresh(); return; }
        if (k === 'avatars') { for (var j = 0; j < clnInfo.avatars.keys.length; j++) { try { await localforage.removeItem(clnInfo.avatars.keys[j]); } catch (er) {} } toast('已清除', 'success'); clnRefresh(); return; }
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
    var est = I.est && I.est.quota ? '<div class="cx-muted">這台裝置實際用了 ' + mb(I.est.usage || 0) + '，瀏覽器最多可以給這個網站大約 ' + mb(I.est.quota) + '。資料管理那條紅色進度條是用 5MB 算的，那是舊的上限，不用擔心。</div>' : '';
    var chatRows = I.chats.sort(function (a, b) { return b.b - a.b; }).map(function (c) {
      return '<div class="cx-cl-row"><span>' + esc(c.name || '聊天室') + (c.sid === curSid() ? '（目前）' : '') + '</span><span>' + c.n + ' 則 · ' + mb(c.b) + (c.img.n ? '<br><small>其中圖片 ' + c.img.n + ' 張 · ' + mb(c.img.b) + '</small>' : '') + '</span></div>';
    }).join('');
    var h = '<div class="cx-card">' + est + '</div>' +
      '<div class="cx-sec"><h4>各個聊天室</h4>' + (chatRows || '<div class="cx-muted">沒有聊天紀錄</div>') + '</div>' +
      '<div class="cx-sec"><h4>🖼 聊天裡的圖片 <small>' + I.img.n + ' 張 · ' + mb(I.img.b) + '</small></h4>' +
      '<div class="cx-muted">清掉圖片只會刪圖，文字訊息都會留著；只有圖片的訊息會變成「［圖片已清除］」。清了就救不回來，重要的可以先存到手機相簿。</div>' +
      '<label class="cx-row"><span>範圍</span><select class="cx-sel" id="cx-cl-scope" style="width:auto"><option value="cur">這個聊天室</option><option value="all">所有聊天室</option></select></label>' +
      '<label class="cx-row"><span>清哪些</span><select class="cx-sel" id="cx-cl-age" style="width:auto"><option value="30">30 天以前的</option><option value="7">7 天以前的</option><option value="0">全部</option></select></label>' +
      '<label class="qa-chk"><input type="checkbox" id="cx-cl-fav" checked>保留收藏的訊息裡的圖片</label>' +
      '<button class="cx-btn pri" data-k="img"' + (I.img.n ? '' : ' disabled') + '>清除圖片</button></div>' +
      '<div class="cx-sec"><h4>📦 網站暫存 <small>' + mb(I.cache) + '</small></h4><div class="cx-muted">讓網站離線也能打開的檔案。清掉不影響任何聊天資料，下次打開會重新下載。</div><button class="cx-btn" data-k="cache"' + (I.cache ? '' : ' disabled') + '>清除暫存</button></div>' +
      '<div class="cx-sec"><h4>🗑 已刪除聊天室的殘留 <small>' + mb(I.orphan.b) + '</small></h4><div class="cx-muted">刪掉聊天室後沒清乾淨的資料。</div><button class="cx-btn" data-k="orphan"' + (I.orphan.keys.length ? '' : ' disabled') + '>清除殘留</button></div>' +
      '<div class="cx-sec"><h4>👤 沒在用的成員頭像 <small>' + I.avatars.keys.length + ' 張 · ' + mb(I.avatars.b) + '</small></h4><div class="cx-muted">已經刪掉的群組成員留下的頭像。</div><button class="cx-btn" data-k="avatars"' + (I.avatars.keys.length ? '' : ' disabled') + '>清除</button></div>' +
      '<div class="cx-sec"><h4>📖 書架 <small>' + I.books.length + ' 本 · ' + mb(I.books.reduce(function (s, x) { return s + x.b; }, 0)) + '</small></h4>' +
      (I.books.length ? I.books.map(function (bk) { return '<div class="cx-cl-row"><span>' + esc(bk.title) + '</span><span>' + mb(bk.b) + ' <button class="cx-btn" data-k="book" data-key="' + esc(bk.key) + '" style="padding:4px 10px;margin-left:6px">刪除</button></span></div>'; }).join('') : '<div class="cx-muted">書架是空的</div>') + '</div>' +
      (I.stickers ? '<div class="cx-muted">表情庫用了 ' + mb(I.stickers) + '，可以到「表情 & 拍一拍 › 管理表情庫」刪掉不用的。</div>' : '');
    clnM.body.innerHTML = h;
  }
  async function clnImages() {
    var scope = clnM.body.querySelector('#cx-cl-scope').value, days = +clnM.body.querySelector('#cx-cl-age').value, keepFav = clnM.body.querySelector('#cx-cl-fav').checked;
    var cut = days ? Date.now() - days * 86400e3 : Infinity;
    if (!(await confirmAsync('確定清除' + (scope === 'all' ? '所有聊天室' : '這個聊天室') + (days ? ' ' + days + ' 天以前' : '全部') + '的聊天圖片？清了就救不回來。'))) return;
    function strip(arr) {
      var n = 0;
      (arr || []).forEach(function (m) {
        if (!m) return;
        var t = +new Date(m.timestamp) || 0;
        if (t >= cut || (keepFav && m.favorited)) return;
        if (typeof m.image === 'string' && m.image) { m.image = null; if (!m.text) m.text = '［圖片已清除］'; n++; }
        if (m.replyTo && m.replyTo.image) m.replyTo.image = null;
      });
      return n;
    }
    var total = 0, P = pfx(), cur = curSid();
    total += strip(allMsgs());
    try { if (typeof saveData === 'function') await saveData(); else if (typeof throttledSaveData === 'function') throttledSaveData(); } catch (e) {}
    try { renderMessages(); } catch (e) {}
    if (scope === 'all') {
      var ss = sessions();
      for (var i = 0; i < ss.length; i++) {
        if (!ss[i] || ss[i].id === cur) continue;
        var k = P + ss[i].id + '_chatMessages', arr = null; try { arr = await localforage.getItem(k); } catch (e) {}
        if (Array.isArray(arr)) { var n = strip(arr); if (n) { total += n; try { await localforage.setItem(k, arr); } catch (e) {} } }
      }
    }
    toast(total ? '清掉了 ' + total + ' 張圖片' : '沒有符合條件的圖片', total ? 'success' : 'info');
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

  /* ================= 高階功能分頁 ================= */
  var ADV_TABS = [
    ['chat', '💬', '聊天', ['custom-replies-function', 'cx-set-entry', 'stats-function', 'cx-calllog-entry', 'music-player-toggle']],
    ['us', '💞', '我們倆', ['cx-diary-entry', 'cx-phone-entry', 'envelope-function', 'qa-function', 'cx-rp-entry', 'cx-status-entry', 'anniversary-function']],
    ['life', '🌿', '生活', ['cx-comp-entry', 'cx-pomo-entry', 'cx-period-entry', 'mood-function']],
    ['fun', '🎲', '好玩', ['cx-toss-entry', 'decision-function', 'fortune-lenormand-function']]
  ];
  var advList = null, advBar = null;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function advTabs() {
    var a = document.getElementById('qa-function') || document.getElementById('envelope-function');
    advList = a && a.parentNode; if (!advList || document.getElementById('cx-adv-tabs')) return;
    advBar = document.createElement('div'); advBar.id = 'cx-adv-tabs'; advBar.className = 'cx-adv-tabs';
    advBar.innerHTML = ADV_TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '<i class="dot"></i></button>'; }).join('');
    advList.parentNode.insertBefore(advBar, advList);
    ADV_TABS.forEach(function (t) { t[3].forEach(function (id) { var el = document.getElementById(id); if (el && el.parentNode === advList) { el.dataset.cxTab = t[0]; advList.appendChild(el); } }); });
    Array.prototype.forEach.call(advList.children, function (el) { if (!el.dataset.cxTab) el.dataset.cxTab = 'chat'; });
    advBar.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) advShow(b.dataset.t); });
    var adv = document.getElementById('advanced-modal');
    if (adv) new MutationObserver(function () { if (adv.style.display !== 'none') advDots(); }).observe(adv, { attributes: true, attributeFilter: ['style', 'class'] });
    var t0 = lsGet('cxAdvTab'); advShow(ADV_TABS.some(function (t) { return t[0] === t0; }) ? t0 : 'us');
  }
  function advShow(t) {
    if (!advList) return; lsSet('cxAdvTab', t);
    Array.prototype.forEach.call(advBar.children, function (b) { b.classList.toggle('on', b.dataset.t === t); });
    Array.prototype.forEach.call(advList.children, function (el) { el.classList.toggle('cx-tab-hide', (el.dataset.cxTab || 'chat') !== t); });
    advDots();
  }
  function advDots() {
    if (!advBar) return;
    Array.prototype.forEach.call(advBar.children, function (b) {
      var on = Array.prototype.some.call(advList.children, function (el) { return el.dataset.cxTab === b.dataset.t && el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner') && (el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner').textContent || '').trim() && el.querySelector('.cx-badge, .qa-badge, .qa-badge-corner').style.display !== 'none'; });
      b.classList.toggle('has', on && !b.classList.contains('on'));
    });
  }

  /* 修正：電腦用滑鼠點通話視窗右上角按鈕沒反應（拖動功能把滑鼠抓走了） */
  document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('#call-window-header button')) e.stopPropagation();
  }, true);

  (function credit() {
    var h = Array.prototype.find.call(document.querySelectorAll('h3,h4'), function (x) { return /特別鳴謝/.test(x.textContent); });
    if (h && !document.getElementById('cx-credit')) { var c = document.createElement('p'); c.id = 'cx-credit'; c.style.cssText = 'font-size:12px;opacity:.75;margin-top:8px'; c.textContent = '潮汐、番茄鐘、陪伴中心、紅包、狀態檢測、拼字卡、主動來信的功能靈感來自「渡念」（小紅書 @我要學英語）；搞怪、TA 的手機、通話紀錄、陪伴模式與邀約的點子參考自「字卡傳訊」二改版（小紅書 @滚筒洗衣机）與「ZY」。程式皆為重新撰寫。'; h.parentNode.appendChild(c); }
  })();
  addEntry('cx-diary-entry', 'fa-book', '他的日記', diaryOpen);
  addEntry('cx-period-entry', 'fa-droplet', '潮汐', pOpen);
  addEntry('cx-pomo-entry', 'fa-clock', '番茄鐘', pomoOpen);
  addEntry('cx-comp-entry', 'fa-headphones', '陪伴中心', compOpen);
  addEntry('cx-rp-entry', 'fa-gift', '紅包', rpOpen);
  addEntry('cx-status-entry', 'fa-heart-pulse', '狀態檢測', stOpen);
  addEntry('cx-phone-entry', 'fa-mobile-screen', 'TA 的手機', phoneOpen);
  addEntry('cx-toss-entry', 'fa-face-grin-squint-tears', '搞怪', tossOpen);
  addEntry('cx-calllog-entry', 'fa-phone', '通話紀錄', clOpen);
  addEntry('cx-set-entry', 'fa-wand-magic-sparkles', '回覆與來信', setOpen);
  advTabs();
  try { envInit(); } catch (e) { console.warn('[cx] env fav', e); }
  try { envWhoInit(); pokeWhoInit(); } catch (e) { console.warn('[cx] group who', e); }
  load().then(function () { try { gcharInit(); } catch (e) { console.warn('[cx] gchar', e); } });
  setTimeout(tick, 3000);
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
})();
