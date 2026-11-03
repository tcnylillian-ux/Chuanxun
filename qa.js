/*
 * 問題箱
 *  · 我問他：寫一個問題和幾個選項，夢角過一陣子回來選一個。
 *  · 他問我：夢角每隔一陣子在這裡放一題，你點選項回答，他再回一句。
 * 資料存在 localforage（和原網站其他功能一樣），所以會跟著同步。
 * 隨機結果（他選哪個、下一題是什麼、什麼時候來）都提前決定好存起來，兩臺裝置看到的一定一樣。
 */
(function () {
  'use strict';
  var LETTERS = 'ABCDEF';
  var SPEEDS = {
    fast: { label: '馬上（幾秒～半分鐘）', min: 5e3, max: 30e3 },
    soon: { label: '稍後（5～30 分鐘）', min: 5 * 60e3, max: 30 * 60e3 },
    slow: { label: '慢慢來（1～6 小時）', min: 60 * 60e3, max: 6 * 60 * 60e3 }
  };
  var FREQ = {
    often: { label: '常常（1～3 小時一題）', min: 1, max: 3 },
    sometimes: { label: '偶爾（3～8 小時一題）', min: 3, max: 8 },
    rarely: { label: '很少（大約一天一題）', min: 16, max: 30 },
    off: { label: '先不要問我' }
  };
  var BANK = [
    ['今天想吃什麼？', ['火鍋', '拉麵', '烤肉', '你做的']],
    ['週末比較想怎麼過？', ['出去走走', '在家窩著', '看電影', '跟你待在一起就好']],
    ['你更喜歡哪個季節？', ['春天', '夏天', '秋天', '冬天']],
    ['要是我們去旅行，想去哪裡？', ['海邊', '雪山', '古鎮', '國外的城市']],
    ['你現在的心情最像哪種天氣？', ['晴天', '多雲', '下雨', '起風了']],
    ['睡前喜歡做什麼？', ['刷手機', '聽歌', '看書', '跟我聊天']],
    ['你是早起型還是熬夜型？', ['早起型', '熬夜型', '看心情', '都不太行']],
    ['想要我怎麼叫你？', ['名字', '寶寶', '笨蛋', '你來決定']],
    ['奶茶要幾分甜？', ['無糖', '三分', '五分', '全糖']],
    ['下雨天你會想做什麼？', ['睡覺', '聽雨聲', '看劇', '想我']],
    ['如果今晚一起看電影，選哪種？', ['愛情片', '恐怖片', '動畫', '喜劇']],
    ['你覺得我最像哪種動物？', ['貓', '狗', '狐狸', '兔子']],
    ['今天過得怎麼樣？', ['很好', '還可以', '有點累', '不太好']],
    ['不開心的時候，你希望我怎麼做？', ['安靜陪著你', '逗你笑', '聽你說', '抱抱你']],
    ['最想和我一起做的事是？', ['看日出', '逛夜市', '一起做飯', '窩在沙發上']],
    ['你喜歡收到什麼樣的禮物？', ['親手做的', '實用的', '有紀念意義的', '有你在就夠了']],
    ['你更喜歡哪個時段？', ['清晨', '午後', '傍晚', '深夜']],
    ['貓派還是狗派？', ['貓派', '狗派', '都喜歡', '只喜歡你']],
    ['第一次約會想去哪裡？', ['咖啡店', '遊樂園', '水族館', '公園散步']],
    ['你最近在聽什麼型別的歌？', ['抒情', '搖滾', '純音樂', '隨便播']],
    ['你覺得我們之間最像什麼顏色？', ['粉色', '藍色', '金色', '黑白']],
    ['現在想見我嗎？', ['想', '很想', '超級想', '每天都想']],
    ['吵架了，你會先找我嗎？', ['會', '不會', '看情況', '等你先來']],
    ['你喜歡我穿什麼風格？', ['西裝', '衛衣', '居家服', '都喜歡']],
    ['最喜歡哪種甜點？', ['蛋糕', '冰淇淋', '布丁', '馬卡龍']],
    ['今天有沒有好好吃飯？', ['有', '吃了一點', '還沒', '忘了']],
    ['今天有沒有好好喝水？', ['喝了很多', '一點點', '只喝了飲料', '忘記了']],
    ['你覺得自己最可愛的地方是？', ['笑起來', '認真的時候', '撒嬌的時候', '全部']],
    ['如果有一天假期，你想？', ['睡到自然醒', '出門玩一整天', '在家打遊戲', '跟我待一整天']],
    ['你喜歡哪種告白？', ['當面說', '寫信', '突然的擁抱', '不用說也知道']],
    ['我們一起養只寵物好不好？', ['好啊，養貓', '好啊，養狗', '養魚就好', '養你就夠了']],
    ['你現在最想要什麼？', ['錢', '睡覺', '假期', '我']],
    ['你會記得我們的紀念日嗎？', ['當然', '會記在手機裡', '靠你提醒', '每一天都是']],
    ['最怕什麼？', ['蟲子', '黑暗', '孤單', '失去你']],
    ['想一起去看什麼？', ['煙花', '星星', '海', '雪']],
    ['如果我突然出現在你面前，你會？', ['抱住我', '愣住', '哭出來', '假裝很淡定']],
    ['喜歡晴天還是雨天？', ['晴天', '雨天', '陰天', '有你的天']],
    ['想聽我說什麼？', ['晚安', '我想你', '我愛你', '辛苦了']],
    ['你最近有在努力的事嗎？', ['學習', '工作', '照顧自己', '在想']],
    ['給今天的自己打幾分？', ['100 分', '80 分', '60 分', '不及格也沒關係']]
  ];
  var data = null, loaded = false, view = 'mine', sub = 'list';

  function key() { return getStorageKey('qaBox'); }
  function pname() { return (typeof settings !== 'undefined' && settings.partnerName) || '夢角'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function notify(t, type) { if (typeof showNotification === 'function') showNotification(t, type || 'info'); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function norm(d) {
    d = d && typeof d === 'object' ? d : {};
    if (!Array.isArray(d.items)) d.items = [];
    if (!Array.isArray(d.inbox)) d.inbox = [];
    if (!d.bank || typeof d.bank !== 'object') d.bank = {};
    if (!Array.isArray(d.bank.custom)) d.bank.custom = [];
    if (!Array.isArray(d.bank.off)) d.bank.off = [];
    if (!Array.isArray(d.asked)) d.asked = [];
    if (!FREQ[d.freq]) d.freq = 'sometimes';
    if (!Array.isArray(d.favs)) d.favs = [];
    return d;
  }
  async function load() { try { data = norm(await localforage.getItem(key())); } catch (e) { data = norm(null); } loaded = true; }
  function save() { return localforage.setItem(key(), data).catch(function () { notify('問題箱儲存失敗', 'error'); }); }
  function pickCard() {
    var pool = (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) ? customReplies : [];
    try { var off = new Set(JSON.parse(localStorage.getItem('disabledReplyItems') || '[]')); pool = pool.filter(function (x) { return !off.has(x); }); } catch (e) {}
    pool = pool.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
  }
  function fmtLeft(ms) {
    if (ms <= 0) return '馬上就好';
    var m = Math.ceil(ms / 60e3);
    if (m < 2) return '不到一分鐘';
    if (m < 60) return '約 ' + m + ' 分鐘後';
    return '約 ' + Math.round(m / 60 * 10) / 10 + ' 小時後';
  }
  function fmtTime(t) { var d = new Date(t); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  /* ---------- question bank ---------- */
  function bankAll() {
    var off = new Set(data.bank.off), out = [];
    BANK.forEach(function (b, i) { var id = 'b' + i; if (!off.has(id)) out.push({ id: id, q: b[0], opts: b[1], builtIn: true }); });
    data.bank.custom.forEach(function (c) { out.push({ id: c.id, q: c.q, opts: c.opts, builtIn: false }); });
    return out;
  }
  function pickQid() {
    var all = bankAll(); if (!all.length) return null;
    var asked = new Set(data.asked), fresh = all.filter(function (x) { return !asked.has(x.id); });
    if (!fresh.length) { data.asked = []; fresh = all; }
    return fresh[Math.floor(Math.random() * fresh.length)].id;
  }
  function scheduleNext(from) {
    var f = FREQ[data.freq], qid = pickQid();
    if (!f || !f.min || !qid) { data.next = null; return; }
    data.next = { at: (from || Date.now()) + rnd(f.min, f.max) * 3600e3, qid: qid };
  }
  function deliver(qid, at) {
    var q = bankAll().find(function (x) { return x.id === qid; });
    if (!q) return null;
    var id = 'in_' + Math.round(at).toString(36) + '_' + qid;
    if (data.inbox.some(function (x) { return x.id === id; })) return null;
    var item = { id: id, qid: qid, q: q.q, opts: q.opts.slice(), at: at, answer: null, react: pickCard() };
    data.inbox.push(item);
    if (data.asked.indexOf(qid) < 0) data.asked.push(qid);
    return item;
  }
  function unansweredIn() { return data ? data.inbox.filter(function (x) { return !x.answer; }).length : 0; }

  /* ---------- timers: reveal answers / deliver his questions ---------- */
  async function tick() {
    if (typeof getStorageKey !== 'function') return;
    try { if (!SESSION_ID) return; } catch (e) { return; }
    await load();
    var now = Date.now(), changed = false;
    data.items.forEach(function (it, i) {
      if (it.revealed || now < it.dueAt) return;
      it.revealed = true; it.revealedAt = now; changed = true;
      var letter = LETTERS[it.pick], opt = it.opts[it.pick];
      notify(pname() + ' 回答了你的問題：選了 ' + letter, 'success');
      sysNotify(pname(), '回答了你的問題：' + letter + '. ' + opt, 'qa-answer');
      if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
      if (it.toChat && typeof addMessage === 'function') {
        addMessage({ id: Date.now() + i, sender: pname(), text: '【問題箱】' + it.q + '\n我選 ' + letter + '. ' + opt + (it.note ? '\n' + it.note : ''), timestamp: new Date(), status: 'received', favorited: false, note: null, type: 'normal' });
      }
    });
    if (data.freq !== 'off') {
      if (!data.next) { scheduleNext(now - 0.9 * 3600e3 * (FREQ[data.freq].min)); changed = true; } // first question comes fairly soon
      // only one unanswered question at a time; the next is scheduled after you answer
      if (data.next && now >= data.next.at && unansweredIn() === 0) {
        if (deliver(data.next.qid, data.next.at)) {
          notify(pname() + ' 有個問題想問你，去問題箱看看吧', 'info');
          sysNotify(pname(), '有個問題想問你：' + (data.inbox[data.inbox.length - 1] || {}).q, 'qa-ask');
          if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
        }
        data.next = null; changed = true;
      }
    }
    if (changed) { await save(); if (isOpen()) render(); }
    await refreshBadges();
  }
  /* ---------- red numbers: unanswered questions + unread letters ---------- */
  var unreadLetters = 0, lettersCounted = false;
  function setBadge(el, n, cls) {
    if (!el) return;
    var b = el.querySelector(':scope > .' + cls);
    if (n && !b) { b = document.createElement('span'); b.className = cls; el.appendChild(b); }
    if (b) { if (n) b.textContent = n > 99 ? '99+' : n; else b.remove(); }
  }
  function badge() {
    var q = unansweredIn(), l = unreadLetters, total = q + l;
    setBadge(document.getElementById('qa-function'), q, 'qa-badge');
    setBadge(document.getElementById('envelope-function'), l, 'qa-badge');
    setBadge(document.getElementById('advanced-settings'), total, 'qa-badge-corner');
    setBadge(document.getElementById('qa-top-btn'), q, 'qa-badge-corner');
    setBadge(document.getElementById('settings-btn'), l, 'qa-badge-corner');
    var tab = document.querySelector('#qa-tabs [data-v="his"] .qa-dot'); if (tab) tab.hidden = !q;
  }
  async function countLetters() {
    var before = unreadLetters;
    try { var env = await localforage.getItem(getStorageKey('envelopeData')); unreadLetters = env && Array.isArray(env.inbox) ? env.inbox.filter(function (x) { return x && x.isNew; }).length : 0; }
    catch (e) { unreadLetters = 0; }
    if (lettersCounted && unreadLetters > before) sysNotify(pname(), '回信了，去信封投遞看看吧', 'letter');
    lettersCounted = true;
  }
  var lastEnvCheck = 0;
  async function refreshBadges() {
    if (typeof getStorageKey !== 'function') return;
    try { if (!SESSION_ID) return; } catch (e) { return; }
    // letters only arrive when the original code checks for them; let it check while the app stays open
    if (typeof checkEnvelopeStatus === 'function' && document.visibilityState === 'visible' && Date.now() - lastEnvCheck > 60000) {
      lastEnvCheck = Date.now(); try { await checkEnvelopeStatus(); } catch (e) {}
    }
    await countLetters(); if (!data) await load(); badge();
  }
  var badgeTimer = null;
  document.addEventListener('click', function () { clearTimeout(badgeTimer); badgeTimer = setTimeout(refreshBadges, 800); }, true);

  /* ---------- modal ---------- */
  var modal = document.createElement('div');
  modal.className = 'modal'; modal.id = 'qa-modal';
  modal.innerHTML = '<div class="modal-content qa-content"><div class="modal-title"><i class="fas fa-box-open"></i><span>問題箱</span></div>' +
    '<div class="qa-tabs" id="qa-tabs" role="tablist"><button data-v="mine" role="tab">我問他</button><button data-v="his" role="tab">他問我<span class="qa-dot" hidden></span></button></div>' +
    '<div id="qa-body"></div>' +
    '<div class="modal-buttons qa-foot"><button class="modal-btn modal-btn-secondary" id="qa-back"><i class="fas fa-arrow-left"></i> 返回</button><button class="modal-btn modal-btn-secondary" id="qa-close">關閉</button></div></div>';
  document.body.appendChild(modal);
  var st = document.createElement('style');
  st.textContent =
    '#qa-modal .qa-content{max-height:88vh;display:flex;flex-direction:column}' +
    '#qa-body{overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;padding:2px 2px 8px}' +
    '.qa-tabs{display:flex;gap:6px;margin:0 0 12px;padding:4px;background:var(--primary-bg);border-radius:12px}' +
    '.qa-tabs button{flex:1;border:none;background:none;padding:8px;border-radius:9px;font:inherit;font-size:14px;color:var(--text-secondary);cursor:pointer;position:relative}' +
    '.qa-tabs button[aria-selected="true"]{background:var(--secondary-bg);color:var(--text-primary);box-shadow:0 1px 3px rgba(0,0,0,.08)}' +
    '.qa-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e5534b;margin-left:5px;vertical-align:2px}.qa-dot[hidden]{display:none}' +
    '.qa-badge-corner{position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:8px;background:#e5534b;color:#fff;font:600 10px/16px -apple-system,sans-serif;text-align:center;pointer-events:none;z-index:2}' +
    '#qa-top-btn,#settings-btn,#advanced-settings{position:relative}' +
    '#advanced-settings>.qa-badge-corner{top:8px;right:8px}' +
    '.qa-badge{margin-left:auto;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e5534b;color:#fff;font-size:11px;line-height:18px;text-align:center}' +
    '.qa-favs{display:flex;flex-direction:column;gap:6px}' +
    '.qa-favs-t{font-size:12px;color:var(--text-secondary)}.qa-favs-t i{color:var(--accent-color);margin-right:3px}' +
    '.qa-favs-l{display:flex;flex-wrap:wrap;gap:6px}' +
    '.qa-chip{display:inline-flex;align-items:center;max-width:100%;border:1px solid var(--border-color);background:var(--primary-bg);border-radius:99px;overflow:hidden}' +
    '.qa-chip button{border:none;background:none;font:inherit;font-size:13px;color:var(--text-primary);padding:6px 4px 6px 12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}' +
    '.qa-chip button.x{padding:6px 10px 6px 4px;color:var(--text-secondary);font-size:11px}' +
    '.qa-form+.qa-favs,.qa-favs+.qa-form{margin-top:4px}' +
    '.qa-new{width:100%;padding:12px;border-radius:14px;border:1px dashed var(--accent-color);background:transparent;color:var(--accent-color);font:inherit;font-size:14px;cursor:pointer}' +
    '.qa-empty{text-align:center;color:var(--text-secondary);font-size:13px;line-height:1.8;padding:18px 8px}' +
    '.qa-card{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:14px;padding:14px}' +
    '.qa-card.ask{border-color:var(--accent-color)}' +
    '.qa-from{font-size:12px;color:var(--accent-color);margin-bottom:6px}' +
    '.qa-q{font-size:15px;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;word-break:break-word;margin-bottom:10px}' +
    '.qa-opt{display:flex;gap:8px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;font:inherit;font-size:13px;color:var(--text-secondary);padding:7px 10px;border-radius:10px;margin-top:4px;border:1px solid transparent;background:none;line-height:1.5}' +
    'button.qa-opt{cursor:pointer;border-color:var(--border-color);background:var(--secondary-bg);color:var(--text-primary);padding:10px 12px}' +
    'button.qa-opt:hover{border-color:var(--accent-color)}' +
    '.qa-opt b{font-weight:600;min-width:1.2em}' +
    '.qa-opt.on{color:var(--text-primary);border-color:var(--accent-color);background:var(--secondary-bg)}' +
    '.qa-opt.on::after{content:"\\2713";margin-left:auto;color:var(--accent-color);font-weight:600}' +
    '.qa-own{display:flex;gap:8px;margin-top:8px}.qa-own input{flex:1;min-width:0;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:10px;padding:9px 12px;font:inherit;font-size:14px}' +
    '.qa-own button{flex:none;border:none;border-radius:10px;padding:0 14px;background:var(--accent-color);color:#fff;font:inherit;font-size:13px;cursor:pointer}' +
    '.qa-note{margin-top:10px;font-size:13px;color:var(--text-primary);line-height:1.6;padding-left:10px;border-left:2px solid var(--accent-color);white-space:pre-wrap;word-break:break-word}' +
    '.qa-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;font-size:11px;color:var(--text-secondary)}' +
    '.qa-meta button,.qa-link{border:none;background:none;color:var(--text-secondary);font:inherit;font-size:11px;cursor:pointer;padding:2px 4px}' +
    '.qa-link{font-size:13px;color:var(--accent-color);padding:4px 0}' +
    '.qa-wait{font-size:12px;color:var(--accent-color);margin-top:8px}' +
    '.qa-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--text-secondary)}' +
    '.qa-form{display:flex;flex-direction:column;gap:10px}' +
    '.qa-form label.t{font-size:12px;color:var(--text-secondary)}' +
    '.qa-form textarea,.qa-form input[type=text],.qa-form select,.qa-sel{width:100%;box-sizing:border-box;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px}' +
    '.qa-form textarea{min-height:70px;resize:vertical}' +
    '.qa-orow{display:flex;gap:8px;align-items:center}.qa-orow span{font-weight:600;color:var(--text-secondary);width:1.2em;text-align:center;flex:none}' +
    '.qa-orow button{flex:none;width:34px;height:34px;border-radius:50%;border:none;background:none;color:var(--text-secondary);cursor:pointer}' +
    '.qa-add{align-self:flex-start;border:none;background:none;color:var(--accent-color);font:inherit;font-size:13px;cursor:pointer;padding:4px 0}' +
    '.qa-chk{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-primary)}' +
    '.qa-chk input{accent-color:var(--accent-color);width:16px;height:16px}' +
    '.qa-send{display:flex;gap:10px}.qa-send button{flex:1}' +
    '.qa-bank{display:flex;flex-direction:column;gap:6px}' +
    '.qa-bi{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:var(--primary-bg);border:1px solid var(--border-color);border-radius:12px}' +
    '.qa-bi div{flex:1;min-width:0}.qa-bi .q{font-size:14px;color:var(--text-primary);line-height:1.5}.qa-bi .o{font-size:12px;color:var(--text-secondary);margin-top:3px;line-height:1.5}' +
    '.qa-bi .tag{font-size:10px;color:var(--accent-color);border:1px solid var(--accent-color);border-radius:6px;padding:0 4px;margin-left:6px;vertical-align:1px}' +
    '.qa-bi button{flex:none;border:none;background:none;color:var(--text-secondary);cursor:pointer;width:30px;height:30px}';
  document.head.appendChild(st);
  var body = modal.querySelector('#qa-body');
  function isOpen() { return modal.style.display === 'flex'; }
  var fromTop = false;
  function open(v, top) { fromTop = !!top; view = v || (unansweredIn() ? 'his' : 'mine'); sub = 'list'; load().then(function () { if (!v) view = unansweredIn() ? 'his' : 'mine'; render(); showModal(modal); tick(); }); }
  function close() { hideModal(modal); }
  modal.querySelector('#qa-close').onclick = close;
  modal.querySelector('#qa-back').onclick = function () {
    if (sub !== 'list') { sub = 'list'; draft = null; render(); return; }
    close(); if (fromTop) return; var adv = document.getElementById('advanced-modal'); if (adv) showModal(adv);
  };
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  modal.querySelector('#qa-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]'); if (!b) return; view = b.dataset.v; sub = 'list'; draft = null; render();
  });

  function render() {
    if (!data) return;
    modal.querySelectorAll('#qa-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === view); });
    if (sub === 'new' || sub === 'addq') return renderForm();
    if (view === 'his') return sub === 'bank' ? renderBank() : renderHis();
    renderMine();
    badge();
  }
  function renderMine() {
    var items = data.items.slice().sort(function (a, b) { return b.askedAt - a.askedAt; });
    var h = '<button class="qa-new" data-act="new"><i class="fas fa-plus"></i> 問 ' + esc(pname()) + ' 一個問題</button>';
    h += favChips();
    if (!items.length) h += '<div class="qa-empty">寫一個問題，給幾個選項，<br>' + esc(pname()) + ' 會挑一個回答你。</div>';
    var now = Date.now();
    items.forEach(function (it) {
      h += '<div class="qa-card"><div class="qa-q">' + esc(it.q) + '</div>';
      it.opts.forEach(function (o, i) { h += '<div class="qa-opt' + (it.revealed && i === it.pick ? ' on' : '') + '"><b>' + LETTERS[i] + '.</b><span>' + esc(o) + '</span></div>'; });
      if (it.revealed) { if (it.note) h += '<div class="qa-note">' + esc(it.note) + '</div>'; }
      else h += '<div class="qa-wait"><i class="fas fa-hourglass-half"></i> ' + esc(pname()) + ' 正在想… ' + fmtLeft(it.dueAt - now) + '</div>';
      h += '<div class="qa-meta"><span>' + fmtTime(it.askedAt) + '</span><span>' +
        '<button data-fav="' + esc(it.id) + '">' + (isFav(it.q) ? '<i class="fas fa-star" style="color:var(--accent-color)"></i> 已收藏' : '<i class="far fa-star"></i> 收藏') + '</button>' +
        (it.revealed ? '<button data-again="' + esc(it.id) + '">再問一次</button>' : '') +
        '<button data-del="' + esc(it.id) + '">刪除</button></span></div></div>';
    });
    body.innerHTML = h;
  }
  function renderHis() {
    var items = data.inbox.slice().sort(function (a, b) { return (a.answer ? 1 : 0) - (b.answer ? 1 : 0) || b.at - a.at; });
    var now = Date.now(), p = esc(pname());
    var h = '<div class="qa-bar"><span>';
    if (data.freq === 'off') h += '已設定先不要問你';
    else if (unansweredIn()) h += '回答之後，' + p + ' 才會問下一題';
    else if (data.next) h += '下一題 ' + fmtLeft(data.next.at - now);
    h += '</span><span><button class="qa-link" data-act="now">現在問我一題</button> · <button class="qa-link" data-act="bank">題庫與頻率</button></span></div>';
    if (!items.length) h += '<div class="qa-empty">' + p + ' 還沒有問你問題。<br>可以等他來問，或點「現在問我一題」。</div>';
    items.forEach(function (it) {
      h += '<div class="qa-card' + (it.answer ? '' : ' ask') + '"><div class="qa-from">' + p + ' 問你</div><div class="qa-q">' + esc(it.q) + '</div>';
      if (!it.answer) {
        it.opts.forEach(function (o, i) { h += '<button class="qa-opt" data-ans="' + esc(it.id) + '" data-i="' + i + '"><b>' + LETTERS[i] + '.</b><span>' + esc(o) + '</span></button>'; });
        h += '<div class="qa-own"><input type="text" id="own-' + esc(it.id) + '" placeholder="都不是？自己寫" maxlength="80"><button data-own="' + esc(it.id) + '">回答</button></div>';
      } else {
        it.opts.forEach(function (o, i) { h += '<div class="qa-opt' + (it.answer.i === i ? ' on' : '') + '"><b>' + LETTERS[i] + '.</b><span>' + esc(o) + '</span></div>'; });
        if (it.answer.text) h += '<div class="qa-opt on"><b>✎</b><span>' + esc(it.answer.text) + '</span></div>';
        if (it.react) h += '<div class="qa-note">' + esc(it.react) + '</div>';
      }
      h += '<div class="qa-meta"><span>' + fmtTime(it.at) + (it.answer ? ' · 已回答' : '') + '</span><span><button data-delin="' + esc(it.id) + '">刪除</button></span></div></div>';
    });
    body.innerHTML = h;
  }
  function renderBank() {
    var all = bankAll();
    var h = '<div class="qa-form"><label class="t" for="qa-freq">' + esc(pname()) + ' 多久問你一次</label><select class="qa-sel" id="qa-freq">' +
      Object.keys(FREQ).map(function (k) { return '<option value="' + k + '"' + (data.freq === k ? ' selected' : '') + '>' + FREQ[k].label + '</option>'; }).join('') + '</select></div>' +
      '<button class="qa-new" data-act="addq"><i class="fas fa-plus"></i> 新增題目</button>' +
      '<div class="qa-bar"><span>題庫共 ' + all.length + ' 題，會輪流問，問完一輪再重來</span>' + (data.bank.off.length ? '<button class="qa-link" data-act="restore">恢復內建題目</button>' : '') + '</div><div class="qa-bank">';
    all.slice().reverse().forEach(function (q) {
      h += '<div class="qa-bi"><div><div class="q">' + esc(q.q) + (q.builtIn ? '' : '<span class="tag">我加的</span>') + '</div><div class="o">' + q.opts.map(function (o, i) { return LETTERS[i] + '. ' + esc(o); }).join('　') + '</div></div>' +
        '<button data-rmq="' + esc(q.id) + '" aria-label="刪除這題"><i class="fas fa-xmark"></i></button></div>';
    });
    h += '</div>';
    body.innerHTML = h;
  }

  function isFav(q) { return data.favs.some(function (f) { return f.q === q; }); }
  function favChips(inForm) {
    if (!data.favs.length) return '';
    return '<div class="qa-favs"><div class="qa-favs-t"><i class="fas fa-star"></i> 常問的問題' + (inForm ? '（點一下填入）' : '') + '</div><div class="qa-favs-l">' +
      data.favs.map(function (f) { return '<span class="qa-chip"><button data-usefav="' + esc(f.id) + '">' + esc(f.q) + '</button><button class="x" data-unfav="' + esc(f.id) + '" aria-label="取消收藏"><i class="fas fa-xmark"></i></button></span>'; }).join('') + '</div></div>';
  }
  var draft = null;
  function renderForm() {
    var asking = sub === 'new';
    if (!draft) draft = { q: '', opts: ['', '', ''], speed: 'soon', toChat: true, withCard: true };
    var h = (asking ? favChips(true) : '') + '<div class="qa-form"><label class="t" for="qa-q">' + (asking ? '問題' : '題目（' + esc(pname()) + ' 會問你這題）') + '</label><textarea id="qa-q" placeholder="' + (asking ? '例如：週末想和我去哪裡？' : '例如：今天想吃什麼？') + '">' + esc(draft.q) + '</textarea>' +
      '<label class="t">選項</label>';
    draft.opts.forEach(function (o, i) {
      h += '<div class="qa-orow"><span>' + LETTERS[i] + '</span><input type="text" id="qa-o' + i + '" data-i="' + i + '" value="' + esc(o) + '" placeholder="選項 ' + LETTERS[i] + '">' +
        (draft.opts.length > 2 ? '<button data-rm="' + i + '" aria-label="刪除選項 ' + LETTERS[i] + '"><i class="fas fa-xmark"></i></button>' : '') + '</div>';
    });
    if (draft.opts.length < 6) h += '<button class="qa-add" data-act="addopt"><i class="fas fa-plus"></i> 新增選項</button>';
    if (asking) {
      h += '<label class="t" for="qa-speed">回答時間</label><select id="qa-speed">' +
        Object.keys(SPEEDS).map(function (k) { return '<option value="' + k + '"' + (draft.speed === k ? ' selected' : '') + '>' + SPEEDS[k].label + '</option>'; }).join('') + '</select>' +
        '<label class="qa-chk"><input type="checkbox" id="qa-chat"' + (draft.toChat ? ' checked' : '') + '>同時傳送到聊天記錄</label>' +
        '<label class="qa-chk"><input type="checkbox" id="qa-card"' + (draft.withCard ? ' checked' : '') + '>回答時附上一句字卡</label>';
    }
    h += '<div class="qa-send"><button class="modal-btn modal-btn-secondary" data-act="cancel">取消</button><button class="modal-btn modal-btn-primary" data-act="' + (asking ? 'submit' : 'saveq') + '">' + (asking ? '送出問題' : '加入題庫') + '</button></div></div>';
    body.innerHTML = h;
    var q = body.querySelector('#qa-q'); setTimeout(function () { if (!draft.q) q.focus(); }, 50);
  }
  function syncDraft() {
    if (!draft) return;
    var q = body.querySelector('#qa-q'); if (q) draft.q = q.value;
    body.querySelectorAll('input[data-i]').forEach(function (inp) { draft.opts[+inp.dataset.i] = inp.value; });
    var sp = body.querySelector('#qa-speed'); if (sp) draft.speed = sp.value;
    var c1 = body.querySelector('#qa-chat'); if (c1) draft.toChat = c1.checked;
    var c2 = body.querySelector('#qa-card'); if (c2) draft.withCard = c2.checked;
  }
  function cleanDraft() {
    var q = draft.q.trim(), opts = draft.opts.map(function (x) { return x.trim(); }).filter(Boolean);
    if (!q) { notify('請先寫下問題', 'warning'); return null; }
    if (opts.length < 2) { notify('至少需要兩個選項', 'warning'); return null; }
    return { q: q, opts: opts };
  }
  body.addEventListener('input', syncDraft);
  body.addEventListener('change', async function (e) {
    syncDraft();
    if (e.target.id === 'qa-freq') { data.freq = e.target.value; scheduleNext(); await save(); notify(FREQ[data.freq].min ? '已設定：' + FREQ[data.freq].label : '好的，' + pname() + ' 先不問你了', 'success'); }
  });
  body.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.isComposing && e.target.id && e.target.id.indexOf('own-') === 0) { e.preventDefault(); var b = body.querySelector('[data-own="' + e.target.id.slice(4) + '"]'); if (b) b.click(); }
  });
  body.addEventListener('click', async function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'new' || act === 'addq') { sub = act; draft = null; render(); return; }
    if (act === 'cancel') { sub = sub === 'addq' ? 'bank' : 'list'; draft = null; render(); return; }
    if (act === 'addopt') { syncDraft(); draft.opts.push(''); render(); var n = body.querySelector('#qa-o' + (draft.opts.length - 1)); if (n) n.focus(); return; }
    if (b.dataset.rm !== undefined) { syncDraft(); draft.opts.splice(+b.dataset.rm, 1); render(); return; }
    if (act === 'submit') { syncDraft(); return submit(); }
    if (act === 'saveq') {
      syncDraft(); var c = cleanDraft(); if (!c) return;
      data.bank.custom.push({ id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), q: c.q, opts: c.opts });
      await save(); draft = null; sub = 'bank'; render(); notify('已加入題庫', 'success'); return;
    }
    if (act === 'bank') { sub = 'bank'; render(); return; }
    if (act === 'restore') { data.bank.off = []; await save(); render(); return; }
    if (act === 'now') {
      if (unansweredIn()) { notify('先回答 ' + pname() + ' 現在的問題吧', 'info'); return; }
      if (!bankAll().length) { notify('題庫是空的，先新增題目吧', 'warning'); return; }
      var it = deliver((data.next && data.next.qid) || pickQid(), Date.now()); data.next = null;
      await save(); render(); badge(); if (!it) notify('出了點問題，再試一次', 'warning'); return;
    }
    if (b.dataset.ans || b.dataset.own) {
      var id = b.dataset.ans || b.dataset.own, item = data.inbox.find(function (x) { return x.id === id; }); if (!item || item.answer) return;
      if (b.dataset.own) {
        var inp = body.querySelector('#own-' + CSS.escape(id)); var t = inp ? inp.value.trim() : '';
        if (!t) { notify('寫下你的回答', 'warning'); return; }
        item.answer = { text: t, at: Date.now() };
      } else item.answer = { i: +b.dataset.i, at: Date.now() };
      scheduleNext(); await save(); render(); badge(); return;
    }
    if (b.dataset.del) {
      if (!(await confirmAsync('刪除這個問題？'))) return;
      data.items = data.items.filter(function (x) { return x.id !== b.dataset.del; }); await save(); render(); return;
    }
    if (b.dataset.delin) {
      if (!(await confirmAsync('刪除這條記錄？'))) return;
      var wasOpen = data.inbox.find(function (x) { return x.id === b.dataset.delin && !x.answer; });
      data.inbox = data.inbox.filter(function (x) { return x.id !== b.dataset.delin; });
      if (wasOpen) scheduleNext();
      await save(); render(); badge(); return;
    }
    if (b.dataset.rmq) {
      var qid = b.dataset.rmq;
      if (qid.charAt(0) === 'b') { if (data.bank.off.indexOf(qid) < 0) data.bank.off.push(qid); }
      else data.bank.custom = data.bank.custom.filter(function (x) { return x.id !== qid; });
      if (data.next && data.next.qid === qid) scheduleNext();
      await save(); render(); return;
    }
    if (b.dataset.fav) {
      var fi = data.items.find(function (x) { return x.id === b.dataset.fav; }); if (!fi) return;
      if (isFav(fi.q)) data.favs = data.favs.filter(function (f) { return f.q !== fi.q; });
      else { data.favs.push({ id: 'f' + Date.now().toString(36), q: fi.q, opts: fi.opts.slice() }); notify('已收藏，下次在「問 ' + pname() + ' 一個問題」上方一點就能再問', 'success'); }
      await save(); render(); return;
    }
    if (b.dataset.usefav) {
      var fv = data.favs.find(function (f) { return f.id === b.dataset.usefav; }); if (!fv) return;
      var keep = draft || {};
      draft = { q: fv.q, opts: fv.opts.slice(), speed: keep.speed || 'soon', toChat: keep.toChat !== false, withCard: keep.withCard !== false }; sub = 'new'; render(); return;
    }
    if (b.dataset.unfav) {
      if (sub === 'new') syncDraft();
      data.favs = data.favs.filter(function (f) { return f.id !== b.dataset.unfav; }); await save(); render(); return;
    }
    if (b.dataset.again) {
      var it2 = data.items.find(function (x) { return x.id === b.dataset.again; }); if (!it2) return;
      draft = { q: it2.q, opts: it2.opts.slice(), speed: it2.speed || 'soon', toChat: it2.toChat, withCard: it2.withCard }; sub = 'new'; render();
    }
  });
  function confirmAsync(m) { return window.__cxConfirm ? window.__cxConfirm(m) : Promise.resolve(window.confirm(m)); }

  async function submit() {
    var c = cleanDraft(); if (!c) return;
    var sp = SPEEDS[draft.speed] || SPEEDS.soon, now = Date.now();
    var it = {
      id: 'qa_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      q: c.q, opts: c.opts, askedAt: now, speed: draft.speed,
      dueAt: now + rnd(sp.min, sp.max),
      pick: Math.floor(Math.random() * c.opts.length),
      note: draft.withCard ? pickCard() : '',
      toChat: draft.toChat, withCard: draft.withCard, revealed: false
    };
    if (it.toChat && typeof addMessage === 'function') {
      addMessage({ id: now, sender: 'user', text: '【問題箱】' + c.q + '\n' + c.opts.map(function (o, i) { return LETTERS[i] + '. ' + o; }).join('\n'), timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' });
    }
    data.items.push(it); await save();
    draft = null; sub = 'list'; render();
    notify('問題已送出，' + pname() + ' ' + fmtLeft(it.dueAt - now) + '回答', 'success');
  }

  /* ---------- menu entry ---------- */
  function addEntry() {
    if (document.getElementById('qa-function')) return;
    var anchor = document.getElementById('envelope-function');
    var list = anchor ? anchor.parentNode : document.querySelector('#advanced-modal .settings-item-list');
    if (!list) return;
    var el = document.createElement('div'); el.className = 'settings-item'; el.id = 'qa-function';
    el.innerHTML = '<i class="fas fa-box-open"></i><span>問題箱</span>';
    el.addEventListener('click', function () { var adv = document.getElementById('advanced-modal'); if (adv) hideModal(adv); open(); });
    if (anchor && anchor.nextSibling) list.insertBefore(el, anchor.nextSibling); else list.appendChild(el);
  }
  addEntry();

  /* ---------- top bar: 問題箱 next to 設定 ---------- */
  function addTopButtons() {
    var gear = document.getElementById('settings-btn'); if (!gear || document.getElementById('qa-top-btn')) return;
    var qa = document.createElement('button'); qa.id = 'qa-top-btn'; qa.className = 'action-btn'; qa.title = '問題箱'; qa.setAttribute('aria-label', '問題箱');
    qa.innerHTML = '<i class="fas fa-box-open"></i>';
    qa.addEventListener('click', function () { open(null, true); });
    gear.parentNode.insertBefore(qa, gear);
  }
  addTopButtons();

  /* ---------- system notifications (work on phones via the offline worker) ---------- */
  async function sysNotify(title, body, tag) {
    try {
      if (localStorage.getItem('notifEnabled') !== '1') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (!document.hidden) return;
      var opts = { body: body || '傳來了訊息', tag: tag || 'partner-msg', renotify: true };
      var reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null;
      if (reg && reg.showNotification) { await reg.showNotification(title || '傳訊', opts); return; }
      new Notification(title || '傳訊', opts);
    } catch (e) {}
  }
  window._sendPartnerNotification = function (title, body) { sysNotify(title, body, 'partner-msg'); };
  function notifStatus(t) { var el = document.getElementById('notif-status-text'); if (el) el.textContent = t; }
  window.handleNotifToggle = function (cb) {
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    if (!('Notification' in window)) {
      cb.checked = false;
      notifStatus(ios && !standalone ? '⚠️ iPhone 要先「加入主畫面」，再從主畫面開啟傳訊，才能開通知' : '⚠️ 這個瀏覽器不支援通知');
      return;
    }
    if (!cb.checked) { localStorage.setItem('notifEnabled', '0'); notifStatus('已關閉 — 不會再跳出訊息通知'); return; }
    Notification.requestPermission().then(async function (perm) {
      if (perm === 'granted') {
        localStorage.setItem('notifEnabled', '1');
        notifStatus('✅ 已開啟 — 傳訊開著但不在畫面上時，收到訊息會跳出通知');
        try { var reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null;
          if (reg) reg.showNotification('傳訊通知已開啟 ✨', { body: pname() + ' 傳訊息時會在這裡通知你', tag: 'notif-test' }); else new Notification('傳訊通知已開啟 ✨'); } catch (e) {}
      } else {
        cb.checked = false; localStorage.setItem('notifEnabled', '0');
        notifStatus(perm === 'denied' ? '❌ 通知被擋住了，請到手機或瀏覽器的設定裡允許這個網站通知' : '⚠️ 沒有選擇，請再試一次');
      }
    }).catch(function () { cb.checked = false; localStorage.setItem('notifEnabled', '0'); notifStatus('❌ 沒辦法開啟通知'); });
  };
  setTimeout(tick, 2500);
  setInterval(tick, 20000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
  setInterval(function () { if (isOpen() && sub === 'list') render(); }, 30000);
})();
