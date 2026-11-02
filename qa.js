/*
 * 问题箱：写一个问题和几个选项，梦角过一阵子回来选一个。
 * 数据存在 localforage（和原网站其他功能一样），所以会跟着同步。
 * 答案在提问时就已决定（藏起来，到时间才揭晓），两台设备看到的结果一定一样。
 */
(function () {
  'use strict';
  var LETTERS = 'ABCDEF';
  var SPEEDS = {
    fast: { label: '马上（几秒～半分钟）', min: 5e3, max: 30e3 },
    soon: { label: '稍后（5～30 分钟）', min: 5 * 60e3, max: 30 * 60e3 },
    slow: { label: '慢慢来（1～6 小时）', min: 60 * 60e3, max: 6 * 60 * 60e3 }
  };
  var data = { items: [] }, loaded = false, view = 'list';

  function key() { return getStorageKey('qaBox'); }
  function pname() { return (typeof settings !== 'undefined' && settings.partnerName) || '梦角'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function notify(t, type) { if (typeof showNotification === 'function') showNotification(t, type || 'info'); }
  async function load() { try { var d = await localforage.getItem(key()); data = d && Array.isArray(d.items) ? d : { items: [] }; } catch (e) { data = { items: [] }; } loaded = true; }
  function save() { return localforage.setItem(key(), data).catch(function () { notify('问题箱保存失败', 'error'); }); }
  function pickCard() {
    var pool = (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) ? customReplies : [];
    try { var off = new Set(JSON.parse(localStorage.getItem('disabledReplyItems') || '[]')); pool = pool.filter(function (x) { return !off.has(x); }); } catch (e) {}
    pool = pool.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
  }
  function fmtLeft(ms) {
    if (ms <= 0) return '马上就好';
    var m = Math.ceil(ms / 60e3);
    if (m < 2) return '不到一分钟';
    if (m < 60) return '约 ' + m + ' 分钟后';
    return '约 ' + Math.round(m / 60 * 10) / 10 + ' 小时后';
  }
  function fmtTime(t) { var d = new Date(t); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  /* ---------- reveal answers that are due ---------- */
  async function checkDue() {
    if (typeof getStorageKey !== 'function') return;
    if (!loaded) await load();
    var now = Date.now(), changed = false;
    for (var i = 0; i < data.items.length; i++) {
      var it = data.items[i];
      if (it.revealed || now < it.dueAt) continue;
      it.revealed = true; it.revealedAt = now; changed = true;
      var letter = LETTERS[it.pick], opt = it.opts[it.pick];
      notify(pname() + ' 回答了你的问题：选了 ' + letter, 'success');
      if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
      if (it.toChat && typeof addMessage === 'function') {
        addMessage({ id: Date.now() + i, sender: pname(), text: '【问题箱】' + it.q + '\n我选 ' + letter + '. ' + opt + (it.note ? '\n' + it.note : ''), timestamp: new Date(), status: 'received', favorited: false, note: null, type: 'normal' });
      }
    }
    if (changed) { await save(); if (isOpen()) render(); }
  }

  /* ---------- modal ---------- */
  var modal = document.createElement('div');
  modal.className = 'modal'; modal.id = 'qa-modal';
  modal.innerHTML = '<div class="modal-content qa-content"><div class="modal-title"><i class="fas fa-box-open"></i><span>问题箱</span></div><div id="qa-body"></div>' +
    '<div class="modal-buttons qa-foot"><button class="modal-btn modal-btn-secondary" id="qa-back"><i class="fas fa-arrow-left"></i> 返回</button><button class="modal-btn modal-btn-secondary" id="qa-close">关闭</button></div></div>';
  document.body.appendChild(modal);
  var st = document.createElement('style');
  st.textContent =
    '#qa-modal .qa-content{max-height:88vh;display:flex;flex-direction:column}' +
    '#qa-body{overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;padding:2px 2px 8px}' +
    '.qa-new{width:100%;padding:12px;border-radius:14px;border:1px dashed var(--accent-color);background:transparent;color:var(--accent-color);font:inherit;font-size:14px;cursor:pointer}' +
    '.qa-empty{text-align:center;color:var(--text-secondary);font-size:13px;line-height:1.8;padding:18px 8px}' +
    '.qa-card{background:var(--primary-bg);border:1px solid var(--border-color);border-radius:14px;padding:14px}' +
    '.qa-q{font-size:15px;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;word-break:break-word;margin-bottom:10px}' +
    '.qa-opt{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--text-secondary);padding:7px 10px;border-radius:10px;margin-top:4px;border:1px solid transparent;line-height:1.5}' +
    '.qa-opt b{font-weight:600;min-width:1.2em}' +
    '.qa-opt.on{color:var(--text-primary);border-color:var(--accent-color);background:var(--secondary-bg)}' +
    '.qa-opt.on::after{content:"\\2713";margin-left:auto;color:var(--accent-color);font-weight:600}' +
    '.qa-note{margin-top:10px;font-size:13px;color:var(--text-primary);line-height:1.6;padding-left:10px;border-left:2px solid var(--accent-color);white-space:pre-wrap;word-break:break-word}' +
    '.qa-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;font-size:11px;color:var(--text-secondary)}' +
    '.qa-meta button{border:none;background:none;color:var(--text-secondary);font:inherit;font-size:11px;cursor:pointer;padding:2px 4px}' +
    '.qa-wait{font-size:12px;color:var(--accent-color);margin-top:8px}' +
    '.qa-form{display:flex;flex-direction:column;gap:10px}' +
    '.qa-form label.t{font-size:12px;color:var(--text-secondary)}' +
    '.qa-form textarea,.qa-form input[type=text],.qa-form select{width:100%;box-sizing:border-box;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px}' +
    '.qa-form textarea{min-height:70px;resize:vertical}' +
    '.qa-orow{display:flex;gap:8px;align-items:center}.qa-orow span{font-weight:600;color:var(--text-secondary);width:1.2em;text-align:center;flex:none}' +
    '.qa-orow button{flex:none;width:34px;height:34px;border-radius:50%;border:none;background:none;color:var(--text-secondary);cursor:pointer}' +
    '.qa-add{align-self:flex-start;border:none;background:none;color:var(--accent-color);font:inherit;font-size:13px;cursor:pointer;padding:4px 0}' +
    '.qa-chk{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-primary)}' +
    '.qa-chk input{accent-color:var(--accent-color);width:16px;height:16px}' +
    '.qa-send{display:flex;gap:10px}.qa-send button{flex:1}';
  document.head.appendChild(st);
  var body = modal.querySelector('#qa-body');
  function isOpen() { return modal.style.display === 'flex'; }
  function open() { view = 'list'; load().then(function () { render(); showModal(modal); checkDue(); }); }
  function close() { hideModal(modal); }
  modal.querySelector('#qa-close').onclick = close;
  modal.querySelector('#qa-back').onclick = function () {
    if (view === 'new') { view = 'list'; render(); return; }
    close(); var adv = document.getElementById('advanced-modal'); if (adv) showModal(adv);
  };
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

  function render() {
    if (view === 'new') return renderNew();
    var items = data.items.slice().sort(function (a, b) { return b.askedAt - a.askedAt; });
    var h = '<button class="qa-new" id="qa-new"><i class="fas fa-plus"></i> 问 ' + esc(pname()) + ' 一个问题</button>';
    if (!items.length) h += '<div class="qa-empty">写一个问题，给几个选项，<br>' + esc(pname()) + ' 会挑一个回答你。</div>';
    var now = Date.now();
    items.forEach(function (it) {
      h += '<div class="qa-card"><div class="qa-q">' + esc(it.q) + '</div>';
      it.opts.forEach(function (o, i) { h += '<div class="qa-opt' + (it.revealed && i === it.pick ? ' on' : '') + '"><b>' + LETTERS[i] + '.</b><span>' + esc(o) + '</span></div>'; });
      if (it.revealed) { if (it.note) h += '<div class="qa-note">' + esc(it.note) + '</div>'; }
      else h += '<div class="qa-wait"><i class="fas fa-hourglass-half"></i> ' + esc(pname()) + ' 正在想… ' + fmtLeft(it.dueAt - now) + '</div>';
      h += '<div class="qa-meta"><span>' + fmtTime(it.askedAt) + '</span><span>' +
        (it.revealed ? '<button data-again="' + esc(it.id) + '">再问一次</button>' : '') +
        '<button data-del="' + esc(it.id) + '">删除</button></span></div></div>';
    });
    body.innerHTML = h;
  }
  var draft = null;
  function renderNew() {
    if (!draft) draft = { q: '', opts: ['', '', ''], speed: 'soon', toChat: true, withCard: true };
    var h = '<div class="qa-form"><label class="t" for="qa-q">问题</label><textarea id="qa-q" placeholder="例如：周末想和我去哪里？">' + esc(draft.q) + '</textarea>' +
      '<label class="t">选项</label>';
    draft.opts.forEach(function (o, i) {
      h += '<div class="qa-orow"><span>' + LETTERS[i] + '</span><input type="text" id="qa-o' + i + '" data-i="' + i + '" value="' + esc(o) + '" placeholder="选项 ' + LETTERS[i] + '">' +
        (draft.opts.length > 2 ? '<button data-rm="' + i + '" aria-label="删除选项 ' + LETTERS[i] + '"><i class="fas fa-xmark"></i></button>' : '') + '</div>';
    });
    if (draft.opts.length < 6) h += '<button class="qa-add" id="qa-add"><i class="fas fa-plus"></i> 添加选项</button>';
    h += '<label class="t" for="qa-speed">回答时间</label><select id="qa-speed">' +
      Object.keys(SPEEDS).map(function (k) { return '<option value="' + k + '"' + (draft.speed === k ? ' selected' : '') + '>' + SPEEDS[k].label + '</option>'; }).join('') + '</select>' +
      '<label class="qa-chk"><input type="checkbox" id="qa-chat"' + (draft.toChat ? ' checked' : '') + '>同时发送到聊天记录</label>' +
      '<label class="qa-chk"><input type="checkbox" id="qa-card"' + (draft.withCard ? ' checked' : '') + '>回答时附上一句字卡</label>' +
      '<div class="qa-send"><button class="modal-btn modal-btn-secondary" id="qa-cancel">取消</button><button class="modal-btn modal-btn-primary" id="qa-submit">送出问题</button></div></div>';
    body.innerHTML = h;
    var q = body.querySelector('#qa-q'); setTimeout(function () { if (!draft.q) q.focus(); }, 50);
  }
  function syncDraft() {
    if (view !== 'new' || !draft) return;
    var q = body.querySelector('#qa-q'); if (q) draft.q = q.value;
    body.querySelectorAll('input[data-i]').forEach(function (inp) { draft.opts[+inp.dataset.i] = inp.value; });
    var sp = body.querySelector('#qa-speed'); if (sp) draft.speed = sp.value;
    var c1 = body.querySelector('#qa-chat'); if (c1) draft.toChat = c1.checked;
    var c2 = body.querySelector('#qa-card'); if (c2) draft.withCard = c2.checked;
  }
  body.addEventListener('input', syncDraft);
  body.addEventListener('change', syncDraft);
  body.addEventListener('click', async function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'qa-new') { view = 'new'; render(); return; }
    if (b.id === 'qa-cancel') { view = 'list'; draft = null; render(); return; }
    if (b.id === 'qa-add') { syncDraft(); draft.opts.push(''); render(); var n = body.querySelector('#qa-o' + (draft.opts.length - 1)); if (n) n.focus(); return; }
    if (b.dataset.rm !== undefined) { syncDraft(); draft.opts.splice(+b.dataset.rm, 1); render(); return; }
    if (b.id === 'qa-submit') { syncDraft(); return submit(); }
    if (b.dataset.del) {
      if (!(await window.__cxConfirmSafe('删除这个问题？'))) return;
      data.items = data.items.filter(function (x) { return x.id !== b.dataset.del; }); await save(); render(); return;
    }
    if (b.dataset.again) {
      var it = data.items.find(function (x) { return x.id === b.dataset.again; }); if (!it) return;
      draft = { q: it.q, opts: it.opts.slice(), speed: it.speed || 'soon', toChat: it.toChat, withCard: it.withCard }; view = 'new'; render();
    }
  });
  window.__cxConfirmSafe = window.__cxConfirmSafe || function (m) { return Promise.resolve(window.confirm(m)); };

  async function submit() {
    var q = draft.q.trim(), opts = draft.opts.map(function (x) { return x.trim(); }).filter(Boolean);
    if (!q) { notify('请先写下问题', 'warning'); return; }
    if (opts.length < 2) { notify('至少需要两个选项', 'warning'); return; }
    var sp = SPEEDS[draft.speed] || SPEEDS.soon;
    var now = Date.now();
    var it = {
      id: 'qa_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      q: q, opts: opts, askedAt: now, speed: draft.speed,
      dueAt: now + sp.min + Math.random() * (sp.max - sp.min),
      pick: Math.floor(Math.random() * opts.length),
      note: draft.withCard ? pickCard() : '',
      toChat: draft.toChat, withCard: draft.withCard, revealed: false
    };
    if (it.toChat && typeof addMessage === 'function') {
      addMessage({ id: now, sender: 'user', text: '【问题箱】' + q + '\n' + opts.map(function (o, i) { return LETTERS[i] + '. ' + o; }).join('\n'), timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' });
    }
    data.items.push(it); await save();
    draft = null; view = 'list'; render();
    notify('问题已送出，' + pname() + ' ' + fmtLeft(it.dueAt - now) + '回答', 'success');
  }

  /* ---------- menu entry ---------- */
  function addEntry() {
    if (document.getElementById('qa-function')) return;
    var anchor = document.getElementById('envelope-function');
    var list = anchor ? anchor.parentNode : document.querySelector('#advanced-modal .settings-item-list');
    if (!list) return;
    var el = document.createElement('div'); el.className = 'settings-item'; el.id = 'qa-function';
    el.innerHTML = '<i class="fas fa-box-open"></i><span>问题箱</span>';
    el.addEventListener('click', function () { var adv = document.getElementById('advanced-modal'); if (adv) hideModal(adv); open(); });
    if (anchor && anchor.nextSibling) list.insertBefore(el, anchor.nextSibling); else list.appendChild(el);
  }
  addEntry();
  setTimeout(checkDue, 2500);
  setInterval(checkDue, 20000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') checkDue(); });
  setInterval(function () { if (isOpen() && view === 'list') render(); }, 30000);
})();
