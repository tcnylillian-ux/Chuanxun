/* 小窩（主頁）＋ 花園（一起種田）
   需要 extras.js 先載入（它會提供 window.__cxApi 並載入這個檔案） */
(function () {
  'use strict';
  var A = window.__cxApi; if (!A || window.__cxHome) return;
  var esc = A.esc, toast = A.toast;
  var MIN = 60e3, HR = 36e5;

  /* ================= 花園資料 ================= */
  var CROPS = {
    lavender:   { n: '薰衣草', cost: 2,  grow: 30e3,     yield: 3, price: 4,  col: '#9b7fd6', unit: '束' },
    strawberry: { n: '草莓',   cost: 6,  grow: 120e3,     yield: 4, price: 6,  col: '#e5546b', unit: '顆' },
    tomato:     { n: '番茄',   cost: 6,  grow: 180e3,     yield: 3, price: 9,  col: '#ef6a4c', unit: '顆' },
    sunflower:  { n: '向日葵', cost: 12, grow: 360e3,    yield: 2, price: 22, col: '#f2b632', unit: '朵' },
    rose:       { n: '玫瑰',   cost: 25, grow: 1440e3,    yield: 3, price: 35, col: '#d6336c', unit: '朵' }
  };
  var ORDER = ['lavender', 'strawberry', 'tomato', 'sunflower', 'rose'];
  var UNLOCK = [0, 0, 0, 0, 0, 0, 60, 120, 200];
  var WET = 6 * HR, DRY_RATE = 0.35;
  var GIFT_LINES = {
    lavender: ['好香……放在枕頭邊，晚上就像抱著你睡。', '妳種的薰衣草，我會好好收著。', '聞起來跟妳身上的味道一樣。'],
    strawberry: ['好甜。妳餵我的話會更甜。', '第一顆要給妳吃，張嘴。', '乖寶種的草莓，捨不得吃。'],
    tomato: ['這顆……是要給我吃，還是要拿來丟我的？', '好，今晚哥哥做番茄炒蛋給妳。', '紅紅的，跟妳害羞的時候一樣。'],
    sunflower: ['向日葵跟著太陽轉，我跟著妳轉。', '放在窗邊了，每天看到都會想起妳。', '妳就是我的太陽，知道嗎？'],
    rose: ['玫瑰應該是我送妳才對……不過，我收下了。', '每一朵我都會留著，做成乾燥花。', '好漂亮，跟妳一樣。']
  };
  var STEAL_LINES = {
    lavender: ['偷偷拿了一束薰衣草放在床頭，別生氣。'],
    strawberry: ['草莓好甜，偷吃了一顆，剩下的都留給妳。', '偷吃了一顆草莓……被妳發現了？'],
    tomato: ['拿了一顆番茄，等等煮湯給妳喝。'],
    sunflower: ['借走一朵向日葵，插在妳的書桌上了。'],
    rose: ['摘了一朵玫瑰……晚點親手送給妳。']
  };
  function G() {
    var X = A.X(); if (!X) return null;
    var g = X.garden;
    if (!g || typeof g !== 'object') g = X.garden = {};
    if (!Array.isArray(g.plots) || g.plots.length !== 9) g.plots = UNLOCK.map(function (c, i) { return { open: c === 0 }; });
    if (typeof g.coins !== 'number') g.coins = 30;
    g.inv = g.inv || {}; g.dex = g.dex || {}; g.log = g.log || [];
    if (g.notify === undefined) g.notify = true;
    g.lastHelp = g.lastHelp || 0; g.lastSteal = g.lastSteal || 0; g.lastPlant = g.lastPlant || 0; g.lastSeen = g.lastSeen || Date.now();
    return g;
  }
  function save() { A.save(); }
  function helpers() { var p = A.pokeMembers ? A.pokeMembers() : []; return p.length ? p.map(function (x) { return x.name; }) : [A.pname()]; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function log(g, text) { g.log.unshift({ t: Date.now(), text: text }); if (g.log.length > 60) g.log.length = 60; }
  function grow(p, now) {
    if (!p.crop) return;
    var at = p.at || now; if (now <= at) return;
    if (!p.bug) {
      var wetMs = Math.max(0, Math.min(now, p.wetUntil || 0) - at), dt = now - at;
      p.prog = (p.prog || 0) + wetMs + (dt - wetMs) * DRY_RATE;
    }
    p.at = now;
  }
  function ready(p) { return p.crop && p.prog >= CROPS[p.crop].grow; }
  function stage(p) { if (!p.crop) return -1; var f = p.prog / CROPS[p.crop].grow; return f >= 1 ? 3 : f >= .5 ? 2 : f >= .15 ? 1 : 0; }
  function left(p) { var c = CROPS[p.crop], wet = (p.wetUntil || 0) > Date.now(); return Math.max(0, (c.grow - p.prog) / (wet ? 1 : DRY_RATE)); }
  function dur(ms) { if (ms < MIN) return Math.max(1, Math.ceil(ms / 1000)) + ' 秒'; if (ms < 10 * MIN) { var sec = Math.ceil(ms / 1000); return Math.floor(sec / 60) + ' 分' + (sec % 60 ? ' ' + (sec % 60) + ' 秒' : '鐘'); } var m = Math.ceil(ms / MIN); if (m < 60) return m + ' 分鐘'; var h = Math.floor(m / 60), r = m % 60; return h + ' 小時' + (r ? ' ' + r + ' 分' : ''); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* 不在的時候發生的事：他幫忙澆水、偷摘、幫忙種、長蟲 */
  function simulate(fromVisit) {
    var g = G(); if (!g) return;
    var now = Date.now(), away = Math.max(0, now - g.lastSeen), events = [];
    // 他幫忙澆水（先補算到他澆水那一刻，之後照濕土的速度長）
    var dry = g.plots.filter(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now - 10 * MIN; });
    var chance = fromVisit ? (away > HR ? .75 : 0) : 1 / 45;
    if (dry.length && now - g.lastHelp > 2 * HR && Math.random() < chance) {
      var who = pick(helpers()), done = dry.slice(0, 3);
      done.forEach(function (p) {
        var from = Math.max(p.wetUntil || 0, p.at || now, now - Math.min(away, 8 * HR)), t = fromVisit ? from + Math.random() * Math.max(0, now - from) : now;
        grow(p, t); p.wetUntil = t + WET;
      });
      g.lastHelp = now;
      var names = done.map(function (p) { return CROPS[p.crop].n; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join('、');
      log(g, '💧 ' + who + ' 幫你的' + names + '澆了水');
      events.push(['sys', '✿ ' + who + ' 幫你的' + names + '澆了水 ✿']);
    }
    g.plots.forEach(function (p) { if (p.crop) grow(p, now); });
    // 偷摘一點點
    var ripe = g.plots.filter(function (p) { return ready(p) && (p.yieldLeft || CROPS[p.crop].yield) > 1 && p.readyAt && now - p.readyAt > 3 * HR; });
    if (ripe.length && now - g.lastSteal > 12 * HR && Math.random() < (fromVisit ? .4 : 1 / 120)) {
      var p2 = pick(ripe), who2 = pick(helpers());
      p2.yieldLeft = (p2.yieldLeft || CROPS[p2.crop].yield) - 1; g.lastSteal = now;
      log(g, '🤭 ' + who2 + ' 偷摘了一' + CROPS[p2.crop].unit + CROPS[p2.crop].n);
      events.push(['say', pick(STEAL_LINES[p2.crop]), who2]);
    }
    // 空地太久，他偷偷種一株薰衣草
    var empty = g.plots.filter(function (p) { return p.open && !p.crop; });
    if (empty.length && now - g.lastPlant > 24 * HR && away > 6 * HR && Math.random() < .5) {
      var p3 = pick(empty), who3 = pick(helpers());
      plant(p3, 'lavender', who3, now - Math.random() * Math.min(away, 2 * HR)); grow(p3, now); g.lastPlant = now;
      log(g, '🌱 ' + who3 + ' 在空地偷偷種了薰衣草');
      events.push(['sys', '✿ ' + who3 + ' 在花園的空地偷偷種了薰衣草 ✿']);
    }
    // 長蟲（一次最多一隻）
    if (!g.plots.some(function (p) { return p.bug; })) {
      var growing = g.plots.filter(function (p) { return p.crop && !ready(p) && p.prog > 0; });
      var bugChance = fromVisit ? Math.min(.5, away / HR * .05) : 1 / 600;
      if (growing.length && Math.random() < bugChance) { pick(growing).bug = true; log(g, '🐛 有一隻小蟲爬到田裡了'); }
    }
    g.plots.forEach(function (p) { if (ready(p) && !p.readyAt) p.readyAt = now; });
    if (document.visibilityState === 'visible') g.lastSeen = now;
    if (events.length) {
      save();
      if (g.notify) events.forEach(function (e, i) {
        setTimeout(function () { if (e[0] === 'sys') A.sysSay(e[1]); else A.partnerSays(e[1], A.groupOn() ? e[2] : null); }, 600 + i * 1500);
      });
    }
    return events.length;
  }
  function plant(p, crop, by, t) { p.crop = crop; p.prog = 0; p.at = t || Date.now(); p.wetUntil = 0; p.bug = false; p.by = by || ''; p.readyAt = 0; p.yieldLeft = CROPS[crop].yield; p.planted = t || Date.now(); }

  /* ================= 畫植物 ================= */
  function plantSvg(crop, st, bug) {
    var c = CROPS[crop].col, s = '';
    var leaf = '#6fae6a', leaf2 = '#8cc47f';
    if (st === 0) s = '<ellipse cx="30" cy="47" rx="13" ry="4" fill="#00000018"/><circle cx="26" cy="45" r="2.2" fill="#6b4a2f"/><circle cx="33" cy="46" r="2" fill="#6b4a2f"/><circle cx="30" cy="43" r="1.8" fill="#6b4a2f"/>';
    else if (st === 1) s = '<path d="M30 48 V36" stroke="' + leaf + '" stroke-width="2.4" stroke-linecap="round"/><path d="M30 38 C22 36 20 30 22 28 C27 29 30 33 30 38Z" fill="' + leaf2 + '"/><path d="M30 37 C38 35 40 29 38 27 C33 28 30 32 30 37Z" fill="' + leaf + '"/>';
    else {
      var big = st === 3;
      if (crop === 'lavender') {
        s = '<path d="M24 50 Q23 34 21 20 M30 50 V16 M36 50 Q37 34 39 20" stroke="' + leaf + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
        [[21, 20], [30, 16], [39, 20]].forEach(function (q) { for (var i = 0; i < (big ? 6 : 3); i++) s += '<ellipse cx="' + (q[0] + (i % 2 ? 1.6 : -1.6)) + '" cy="' + (q[1] + i * 3.2) + '" rx="2.4" ry="3.2" fill="' + (big ? c : '#c3b3e6') + '"/>'; });
      } else if (crop === 'sunflower') {
        s = '<path d="M30 52 V' + (big ? 24 : 30) + '" stroke="' + leaf + '" stroke-width="2.6"/><path d="M30 42 C21 41 18 35 20 33 C26 34 30 38 30 42Z" fill="' + leaf2 + '"/><path d="M30 38 C39 37 42 31 40 29 C34 30 30 34 30 38Z" fill="' + leaf + '"/>';
        if (big) { for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2; s += '<ellipse cx="' + (30 + Math.cos(a) * 9).toFixed(1) + '" cy="' + (18 + Math.sin(a) * 9).toFixed(1) + '" rx="4.4" ry="2.4" transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + ' ' + (30 + Math.cos(a) * 9).toFixed(1) + ' ' + (18 + Math.sin(a) * 9).toFixed(1) + ')" fill="' + c + '"/>'; } s += '<circle cx="30" cy="18" r="6.5" fill="#7a4f2a"/>'; }
        else s += '<circle cx="30" cy="27" r="4.5" fill="' + leaf + '"/><circle cx="30" cy="27" r="2.4" fill="#d8c25a"/>';
      } else if (crop === 'rose') {
        s = '<path d="M30 52 V' + (big ? 24 : 30) + '" stroke="#4f8a4c" stroke-width="2.2"/><path d="M30 44 C22 44 19 39 21 37 C26 37 30 40 30 44Z" fill="' + leaf + '"/><path d="M30 38 C38 38 41 33 39 31 C34 31 30 34 30 38Z" fill="' + leaf2 + '"/>';
        s += big ? '<circle cx="30" cy="19" r="8" fill="' + c + '"/><path d="M25 18 Q30 12 35 18 Q30 23 25 18Z" fill="#b02a5b"/><path d="M27 21 Q30 16 33 21" stroke="#f08fb0" stroke-width="1.2" fill="none"/>' : '<ellipse cx="30" cy="27" rx="3.2" ry="4.5" fill="' + leaf + '"/><path d="M28.5 24 Q30 21 31.5 24" fill="' + c + '"/>';
      } else {
        // strawberry / tomato: bush with fruits
        s = '<ellipse cx="30" cy="40" rx="' + (big ? 17 : 13) + '" ry="' + (big ? 11 : 9) + '" fill="' + leaf + '"/><ellipse cx="24" cy="36" rx="7" ry="5" fill="' + leaf2 + '"/><ellipse cx="37" cy="35" rx="6" ry="4.5" fill="' + leaf2 + '"/>';
        var fr = big ? [[22, 43], [31, 46], [39, 42], [29, 37]] : [[25, 43], [35, 43]];
        fr.forEach(function (q) {
          if (crop === 'strawberry') s += '<path d="M' + q[0] + ' ' + (q[1] + 5) + ' C' + (q[0] - 5) + ' ' + q[1] + ' ' + (q[0] - 3) + ' ' + (q[1] - 3) + ' ' + q[0] + ' ' + (q[1] - 3) + ' C' + (q[0] + 3) + ' ' + (q[1] - 3) + ' ' + (q[0] + 5) + ' ' + q[1] + ' ' + q[0] + ' ' + (q[1] + 5) + 'Z" fill="' + (big ? c : '#f3b0b8') + '"/>';
          else s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (big ? 4.4 : 3.2) + '" fill="' + (big ? c : '#9fcf7a') + '"/>';
        });
      }
    }
    if (bug) s += '<g transform="translate(40 30)"><ellipse rx="5" ry="3.4" fill="#7cb342"/><circle cx="5" cy="-1" r="2.4" fill="#558b2f"/><circle cx="6" cy="-1.6" r=".7" fill="#fff"/></g>';
    return '<svg viewBox="0 0 60 56" aria-hidden="true">' + s + '</svg>';
  }

  /* ================= 花園畫面 ================= */
  var gm = null, gTab = 'field', sel = -1, giftTo = null, timer = null;
  function gOpen(fromHome) {
    var g = G(); if (!g) return;
    if (!gm) {
      gm = A.makeModal('cx-garden-modal', 'fa-seedling', '我們的花園');
      gm.onBack = function () { gm.close(); homeOpen(); return true; };
      gm.onClose = function () { clearInterval(timer); timer = null; };
      gm.body.addEventListener('click', gClick);
      gm.el.classList.add('cx-garden');
    }
    var daily = '';
    if (g.lastDaily !== today()) { g.lastDaily = today(); g.coins += 15; log(g, '🪙 ' + A.pname() + ' 給的今日零用錢 +15'); daily = A.pname() + '：「今天的零用錢，拿去買種子吧。」'; }
    simulate(true); save();
    sel = -1; render(); gm.open();
    if (daily) setTimeout(function () { toast(daily + ' +15', 'success'); }, 400);
    clearInterval(timer); var ticks = 0;
    timer = setInterval(function () {
      if (!gm.isOpen()) return;
      if (++ticks % 20 === 0 && simulate(false)) { render(); return; }
      if (gTab === 'field') tickField();
    }, 1000);
  }
  function sig(g) { return g.plots.map(function (p) { return p.crop ? p.crop + stage(p) + (p.bug ? 'b' : '') + ((p.wetUntil || 0) > Date.now() ? 'w' : '') : (p.open ? 'e' : 'l'); }).join(','); }
  var lastSig = '';
  function tickField() {
    var g = G(); if (!g) return; var now = Date.now();
    g.plots.forEach(function (p) { grow(p, now); if (ready(p) && !p.readyAt) p.readyAt = now; });
    if (sig(g) !== lastSig) { render(); return; }
    g.plots.forEach(function (p, i) {
      if (!p.crop || ready(p) || p.bug) return;
      var el = gm.body.querySelector('[data-pl="' + i + '"] small'); if (!el) return;
      el.innerHTML = ((p.wetUntil || 0) > now ? '' : '<b class="dry">乾了</b> ') + dur(left(p));
    });
    if (sel >= 0) { var info = gm.body.querySelector('.cx-g-panel .cx-muted'); var q = g.plots[sel]; if (info && q && q.crop) info.textContent = (ready(q) ? '已經可以收成了' : '還要大約 ' + dur(left(q))) + '　·　' + ((q.wetUntil || 0) > now ? '土還濕濕的（' + dur(q.wetUntil - now) + '）' : '土乾了，長得比較慢'); }
  }
  function coinsHtml(g) { return '<span class="cx-g-coin"><i class="fas fa-coins"></i> ' + g.coins + '</span>'; }
  function render() {
    var g = G(); if (!g || !gm) return;
    var now = Date.now(); g.plots.forEach(function (p) { grow(p, now); if (ready(p) && !p.readyAt) p.readyAt = now; });
    var tabs = [['field', '田地'], ['inv', '倉庫'], ['dex', '圖鑑'], ['log', '紀錄']];
    var h = '<div class="cx-g-top">' + coinsHtml(g) + '<div class="cx-g-tabs">' + tabs.map(function (t) { return '<button type="button" data-gt="' + t[0] + '" class="' + (gTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    if (gTab === 'field') h += fieldHtml(g, now);
    else if (gTab === 'inv') h += invHtml(g);
    else if (gTab === 'dex') h += dexHtml(g);
    else h += logHtml(g);
    gm.body.innerHTML = h; lastSig = sig(g);
  }
  function fieldHtml(g, now) {
    var h = '<div class="cx-g-grid">' + g.plots.map(function (p, i) {
      if (!p.open) { var lockedBefore = g.plots.slice(0, i).some(function (q) { return !q.open; }); return '<button type="button" class="cx-g-plot lock" data-pl="' + i + '"' + (lockedBefore ? ' disabled' : '') + '><i class="fas fa-lock"></i><small>' + (lockedBefore ? '' : '🪙 ' + UNLOCK[i] + ' 開墾') + '</small></button>'; }
      if (!p.crop) return '<button type="button" class="cx-g-plot empty' + (sel === i ? ' sel' : '') + '" data-pl="' + i + '"><span class="plus">＋</span><small>種點什麼</small></button>';
      var st = stage(p), wet = (p.wetUntil || 0) > now, rd = st === 3;
      return '<button type="button" class="cx-g-plot' + (wet ? ' wet' : '') + (rd ? ' ready' : '') + (sel === i ? ' sel' : '') + '" data-pl="' + i + '">' + plantSvg(p.crop, st, p.bug) +
        '<small>' + (p.bug ? '有蟲！點我' : rd ? '可以收成' : (wet ? '' : '<b class="dry">乾了</b> ') + dur(left(p))) + '</small>' + (p.by ? '<i class="by">' + esc(p.by.slice(0, 1)) + '</i>' : '') + '</button>';
    }).join('') + '</div>';
    var needWater = g.plots.some(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now + HR; });
    var anyReady = g.plots.some(ready);
    h += '<div class="cx-g-acts"><button type="button" class="cx-btn" data-ga="waterAll"' + (needWater ? '' : ' disabled') + '><i class="fas fa-droplet"></i> 全部澆水</button><button type="button" class="cx-btn pri" data-ga="harvestAll"' + (anyReady ? '' : ' disabled') + '><i class="fas fa-basket-shopping"></i> 全部收成</button></div>';
    h += selHtml(g, now);
    return h;
  }
  function selHtml(g, now) {
    if (sel < 0) return '<p class="cx-muted cx-g-tip">點空地種種子；乾掉的土澆水會長得比較快。你不在的時候，' + esc(helpers().join('、')) + ' 也會幫忙照顧。</p>';
    var p = g.plots[sel];
    if (!p.crop) {
      return '<div class="cx-g-panel"><div class="cx-g-pt">要種什麼？</div>' + ORDER.map(function (k) {
        var c = CROPS[k];
        return '<button type="button" class="cx-g-seed" data-seed="' + k + '"' + (g.coins < c.cost ? ' disabled' : '') + '>' + plantSvg(k, 3) + '<span class="nm">' + c.n + '</span><span class="cx-muted">' + dur(c.grow) + ' · 收 ' + c.yield + c.unit + '</span><span class="pr">🪙 ' + c.cost + '</span></button>';
      }).join('') + '</div>';
    }
    var c = CROPS[p.crop], wet = (p.wetUntil || 0) > now;
    return '<div class="cx-g-panel"><div class="cx-g-pt">' + c.n + (p.by ? '<span class="cx-muted"> · ' + esc(p.by) + ' 種的</span>' : '') + '</div>' +
      '<div class="cx-muted">' + (ready(p) ? '已經可以收成了' : '還要大約 ' + dur(left(p))) + '　·　' + (wet ? '土還濕濕的（' + dur(p.wetUntil - now) + '）' : '土乾了，長得比較慢') + '</div>' +
      '<div class="cx-g-acts">' + (ready(p) ? '<button type="button" class="cx-btn pri" data-ga="harvest">收成</button>' : '<button type="button" class="cx-btn" data-ga="water"' + (wet && p.wetUntil - now > HR ? ' disabled' : '') + '><i class="fas fa-droplet"></i> 澆水</button>') +
      '<button type="button" class="cx-btn warn" data-ga="dig">剷掉</button></div></div>';
  }
  function invHtml(g) {
    var any = ORDER.filter(function (k) { return g.inv[k] > 0; });
    var ppl = A.groupOn() ? A.groupPeople().filter(function (p) { return p.name.indexOf('系統') < 0; }) : [];
    if (!giftTo || (ppl.length && !ppl.some(function (p) { return p.name === giftTo; }))) giftTo = A.pname();
    var h = ppl.length > 1 ? '<div class="cx-who-t">送給</div>' + A.whoChips('cx-g-who', giftTo) : '';
    if (!any.length) return h + '<p class="cx-muted" style="text-align:center;padding:20px 0">倉庫空空的，去田裡收成吧。</p>';
    return h + any.map(function (k) {
      var c = CROPS[k];
      return '<div class="cx-g-item">' + plantSvg(k, 3) + '<div class="tx"><b>' + c.n + '</b> × ' + g.inv[k] + '<div class="cx-muted">一' + c.unit + '賣 🪙 ' + c.price + '</div></div>' +
        '<button type="button" class="cx-btn pri" data-gift="' + k + '">送' + (ppl.length > 1 ? '' : '他') + '</button><button type="button" class="cx-btn" data-sell="' + k + '">賣一' + c.unit + '</button></div>';
    }).join('') + '<button type="button" class="cx-btn" data-ga="sellAll" style="margin-top:6px">全部賣掉</button>';
  }
  function dexHtml(g) {
    return '<div class="cx-g-dex">' + ORDER.map(function (k) {
      var c = CROPS[k], d = g.dex[k];
      return '<div class="cx-g-dx' + (d ? '' : ' no') + '">' + plantSvg(k, 3) + '<b>' + (d ? c.n : '？？？') + '</b><span class="cx-muted">' + (d ? '收成 ' + d.n + ' 次<br>' + new Date(d.first).toLocaleDateString('zh-TW') + ' 第一次' : dur(c.grow) + ' 長大') + '</span></div>';
    }).join('') + '</div>';
  }
  function logHtml(g) {
    var tg = '<label class="cx-row" style="margin-bottom:6px"><span>他照顧花園時，在聊天裡告訴我</span><input type="checkbox" id="cx-g-notify"' + (g.notify ? ' checked' : '') + '></label>';
    if (!g.log.length) return tg + '<p class="cx-muted" style="text-align:center;padding:20px 0">還沒有紀錄。</p>';
    return tg + '<div class="cx-g-log">' + g.log.map(function (l) { var d = new Date(l.t); return '<div><span class="cx-muted">' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</span> ' + esc(l.text) + '</div>'; }).join('') + '</div>';
  }
  function harvest(g, p) {
    var c = CROPS[p.crop], n = p.yieldLeft || c.yield;
    g.inv[p.crop] = (g.inv[p.crop] || 0) + n;
    var d = g.dex[p.crop] || (g.dex[p.crop] = { n: 0, first: Date.now() }); d.n++;
    log(g, '🧺 收成 ' + c.n + ' × ' + n);
    var k = p.crop; p.crop = null; p.bug = false; p.by = ''; p.readyAt = 0;
    return [k, n];
  }
  function gClick(e) {
    var g = G(), now = Date.now(), b;
    if ((b = e.target.closest('[data-gt]'))) { gTab = b.dataset.gt; sel = -1; render(); return; }
    if (e.target.id === 'cx-g-notify') { g.notify = e.target.checked; save(); return; }
    if ((b = e.target.closest('.cx-who [data-who]'))) { giftTo = b.dataset.who; render(); return; }
    if ((b = e.target.closest('[data-pl]'))) {
      var i = +b.dataset.pl, p = g.plots[i];
      if (!p.open) {
        if (g.coins < UNLOCK[i]) { toast('金幣不夠，還差 ' + (UNLOCK[i] - g.coins), 'info'); return; }
        g.coins -= UNLOCK[i]; p.open = true; log(g, '⛏ 開墾了一塊新的地'); save(); toast('開墾好了！', 'success'); render(); return;
      }
      if (p.bug) { p.bug = false; g.coins += 1; log(g, '🐛 抓走了一隻小蟲 +1'); save(); toast('抓到蟲了 +1 🪙', 'success'); render(); return; }
      if (ready(p)) { var r = harvest(g, p); save(); toast('收成 ' + CROPS[r[0]].n + ' × ' + r[1] + ' 🧺', 'success'); sel = -1; render(); return; }
      sel = sel === i ? -1 : i; render(); return;
    }
    if ((b = e.target.closest('[data-seed]'))) {
      var k = b.dataset.seed, c = CROPS[k], q = g.plots[sel]; if (!q || q.crop || g.coins < c.cost) return;
      g.coins -= c.cost; plant(q, k, '', now); q.wetUntil = now + WET; log(g, '🌱 種下' + c.n + '，澆了水'); save(); sel = -1; render(); return;
    }
    if ((b = e.target.closest('[data-sell]'))) { var s = b.dataset.sell; if (g.inv[s] > 0) { g.inv[s]--; g.coins += CROPS[s].price; save(); render(); } return; }
    if ((b = e.target.closest('[data-gift]'))) {
      var gk = b.dataset.gift; if (!(g.inv[gk] > 0)) return;
      var to = A.groupOn() ? (giftTo || A.pname()) : A.pname(), cc = CROPS[gk];
      g.inv[gk]--; log(g, '🎁 送了一' + cc.unit + cc.n + '給 ' + to); save(); render();
      A.iSay('（送了一' + cc.unit + cc.n + '給' + (to === A.pname() && !A.groupOn() ? '你' : to) + '）');
      var own = A.charGroup ? (A.charGroup(to) || []) : [];
      var reply = own.length && Math.random() < .3 ? pick(own) : pick(GIFT_LINES[gk]);
      setTimeout(function () { if (A.groupOn()) A.speakAs(to, 4000); A.partnerSays(reply, A.groupOn() ? to : null); }, 1500 + Math.random() * 1500);
      toast('送出去了 🎁', 'success'); return;
    }
    if ((b = e.target.closest('[data-ga]'))) {
      var a = b.dataset.ga;
      if (a === 'waterAll') { var n = 0; g.plots.forEach(function (p) { if (p.crop && !ready(p) && (p.wetUntil || 0) < now + HR) { grow(p, now); p.wetUntil = now + WET; n++; } }); if (n) { log(g, '💧 幫 ' + n + ' 格澆了水'); save(); toast('澆好了 💧', 'success'); } }
      else if (a === 'harvestAll') { var got = []; g.plots.forEach(function (p) { if (ready(p)) { var r2 = harvest(g, p); got.push(CROPS[r2[0]].n + '×' + r2[1]); } }); if (got.length) { save(); toast('收成 ' + got.join('、') + ' 🧺', 'success'); } }
      else if (a === 'water') { var p1 = g.plots[sel]; if (p1 && p1.crop) { grow(p1, now); p1.wetUntil = now + WET; log(g, '💧 幫' + CROPS[p1.crop].n + '澆了水'); save(); } }
      else if (a === 'harvest') { var p2 = g.plots[sel]; if (p2 && ready(p2)) { var r3 = harvest(g, p2); save(); toast('收成 ' + CROPS[r3[0]].n + ' × ' + r3[1] + ' 🧺', 'success'); sel = -1; } }
      else if (a === 'dig') { var p3 = g.plots[sel]; if (p3 && p3.crop) { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '確定剷掉？'; return; } log(g, '剷掉了' + CROPS[p3.crop].n); p3.crop = null; p3.bug = false; p3.by = ''; save(); sel = -1; } }
      else if (a === 'sellAll') { var sum = 0; ORDER.forEach(function (k2) { if (g.inv[k2] > 0) { sum += g.inv[k2] * CROPS[k2].price; g.inv[k2] = 0; } }); if (sum) { g.coins += sum; log(g, '💰 賣掉倉庫 +' + sum); save(); toast('賣了 🪙 ' + sum, 'success'); } }
      render();
    }
  }


  /* ================= 小遊戲：摸魚小貓 ================= */
  var moyu = null;
  function moyuOpen() {
    var o = document.getElementById('cx-moyu');
    if (!o) {
      o = document.createElement('div'); o.id = 'cx-moyu'; o.hidden = true;
      o.innerHTML = '<div class="cxm-hd"><b>摸魚小貓</b><span class="cxm-st"><span id="cxm-lives">♥♥♥</span><span><b id="cxm-score">0</b> <small>分</small></span><span><small>最高</small> <b id="cxm-best">0</b></span></span>' +
        '<button class="cxm-ib" id="cxm-snd" type="button" aria-label="音效開關">♪</button><button class="cxm-ib" id="cxm-pause" type="button" aria-label="暫停">❚❚</button><button class="cxm-ib" id="cxm-close" type="button" aria-label="離開"><i class="fas fa-xmark"></i></button></div>' +
        '<div class="cxm-stage" id="cxm-stage"><canvas id="cxm-cv"></canvas>' +
        '<div class="cxm-ov" id="cxm-start"><div class="cxm-panel"><h2>摸魚小貓</h2><p>上班好累，讓小黑貓幫你摸魚。<br>左右拖動小貓，接住好東西，躲開工作。<br>每 5 分換 1 枚花園金幣（一天最多 40）。</p><div class="cxm-legend" id="cxm-legend"></div><button class="cxm-go" id="cxm-goBtn" type="button">開始摸魚</button></div></div>' +
        '<div class="cxm-ov" id="cxm-over" hidden><div class="cxm-panel"><h2>被抓回去上班了</h2><div class="cxm-big" id="cxm-final">0</div><p id="cxm-bestLine"></p><p class="cxm-earn" id="cxm-earn"></p><p class="cxm-quote" id="cxm-quote"></p><button class="cxm-go" id="cxm-againBtn" type="button">再摸一次</button></div></div>' +
        '<div class="cxm-ov" id="cxm-paused" hidden><div class="cxm-panel"><h2>偷偷暫停</h2><p>老闆走過去了嗎？</p><button class="cxm-go" id="cxm-resumeBtn" type="button">繼續摸魚</button></div></div></div>';
      document.body.appendChild(o);
      moyu = moyuInit();
    }
    o.hidden = false; moyu.show();
  }

  function moyuInit() {
    var $ = function (id) { return document.getElementById('cxm-' + id); };
    var cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
    var W = 0, H = 0, DPR = 1;
    function sv(name, fb) { var v = getComputedStyle(document.body).getPropertyValue(name).trim() || getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
    function css(name) { return name === '--font' ? getComputedStyle(document.body).fontFamily : ''; }
    var C = {};
    function readColors() {
      C['--sky-top'] = sv('--primary-bg', '#f4f0fa'); C['--sky-bot'] = sv('--secondary-bg', '#fbf8f2'); C['--ink'] = sv('--text-primary', '#3b3150');
      C['--mute'] = sv('--text-secondary', '#8b80a3'); C['--accent'] = sv('--accent-color', '#8a6fc2'); C['--line'] = sv('--border-color', '#e2d8f1');
      C['--card'] = sv('--secondary-bg', '#ffffff'); C['--good'] = '#3f9e6a'; C['--bad'] = '#d9534f'; C['--gold'] = '#e0a526'; C['--grass'] = C['--accent'];
    }
    readColors();

    function resize() {
      var r = stage.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cat.y = H - 58; cat.x = Math.min(Math.max(cat.x || W / 2, 40), W - 40);
      if (!running) draw(0);
    }

    /* ---------- 掉下來的東西 ---------- */
    var KINDS = {
      fish:  { pts: 1, w: 30, draw: drawFish, good: true, name: '小魚' },
      lav:   { pts: 2, w: 26, draw: drawLav, good: true, name: '薰衣草' },
      heart: { pts: 3, w: 26, draw: drawHeart, good: true, name: '哥哥的心意' },
      gold:  { pts: 10, w: 34, draw: drawGold, good: true, name: '金魚' },
      doc:   { pts: 0, w: 30, draw: drawDoc, good: false, name: '加班文件' },
      clock: { pts: 0, w: 30, draw: drawClock, good: false, name: '開會鬧鐘' }
    };
    var LINES = ['乖寶好厲害', '偷偷陪你摸魚', '再一下就下班了', '辛苦了，我的乖寶', '摸魚被我抓到了', '這條魚給你', '累了就靠過來', '哥哥在這裡', '今天也很乖', '下班我去接你', '別逞強', '想你了'];
    var ENDQ = ['今天也辛苦了，乖寶。', '下班了就回來，哥哥抱著你。', '摸魚也很棒，嗯？', '累了就休息，不用每件事都做好。', '晚上想吃什麼？我讓司機去接你。', '工作做不完沒關係，你比較重要。'];

    function drawFish(x, y, s, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 6) * 0.12);
      ctx.fillStyle = '#7fb2d9'; ctx.beginPath(); ctx.ellipse(0, 0, s * .42, s * .24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * .34, 0); ctx.lineTo(s * .58, -s * .2); ctx.lineTo(s * .58, s * .2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-s * .2, -s * .04, s * .06, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2b3a'; ctx.beginPath(); ctx.arc(-s * .2, -s * .04, s * .03, 0, 7); ctx.fill();
      ctx.restore();
    }
    function drawGold(x, y, s, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 7) * 0.15);
      ctx.shadowColor = C['--gold']; ctx.shadowBlur = 12;
      ctx.fillStyle = C['--gold']; ctx.beginPath(); ctx.ellipse(0, 0, s * .42, s * .26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * .34, 0); ctx.lineTo(s * .6, -s * .24); ctx.lineTo(s * .6, s * .24); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(-s * .2, -s * .05, s * .06, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2b3a'; ctx.beginPath(); ctx.arc(-s * .2, -s * .05, s * .03, 0, 7); ctx.fill();
      ctx.restore();
    }
    function heartPath(s) { ctx.beginPath(); ctx.moveTo(0, s * .32); ctx.bezierCurveTo(-s * .6, -s * .05, -s * .32, -s * .55, 0, -s * .2); ctx.bezierCurveTo(s * .32, -s * .55, s * .6, -s * .05, 0, s * .32); ctx.closePath(); }
    function drawHeart(x, y, s, t) {
      ctx.save(); ctx.translate(x, y); var k = 1 + Math.sin(t * 8) * .06; ctx.scale(k, k);
      ctx.fillStyle = '#e46f9a'; heartPath(s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-s * .16, -s * .16, s * .07, s * .04, -.6, 0, 7); ctx.fill();
      ctx.restore();
    }
    function drawLav(x, y, s, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5) * .2);
      ctx.strokeStyle = '#7a9a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * .5); ctx.lineTo(0, -s * .1); ctx.stroke();
      ctx.fillStyle = '#9b7fd6';
      for (var i = 0; i < 6; i++) { var yy = -s * .1 - i * s * .08; ctx.beginPath(); ctx.ellipse(-3, yy, 3.4, 4.6, -.4, 0, 7); ctx.ellipse(3, yy - 2, 3.4, 4.6, .4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    function drawDoc(x, y, s, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * .25);
      ctx.fillStyle = '#f7f7f9'; ctx.strokeStyle = '#9aa0ad'; ctx.lineWidth = 1.5;
      ctx.fillRect(-s * .32 + 3, -s * .4 + 3, s * .64, s * .8); ctx.strokeRect(-s * .32 + 3, -s * .4 + 3, s * .64, s * .8);
      ctx.fillRect(-s * .32, -s * .4, s * .64, s * .8); ctx.strokeRect(-s * .32, -s * .4, s * .64, s * .8);
      ctx.strokeStyle = '#b8bdc7'; for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * .2, -s * .22 + i * s * .14); ctx.lineTo(s * .2, -s * .22 + i * s * .14); ctx.stroke(); }
      ctx.fillStyle = C['--bad']; ctx.font = '700 ' + Math.round(s * .26) + 'px ' + 'system-ui'; ctx.textAlign = 'center'; ctx.fillText('急', s * .14, s * .32);
      ctx.restore();
    }
    function drawClock(x, y, s, t) {
      ctx.save(); ctx.translate(x + Math.sin(t * 40) * 1.2, y);
      ctx.fillStyle = '#ef8a6f'; ctx.beginPath(); ctx.arc(-s * .26, -s * .3, s * .12, 0, 7); ctx.arc(s * .26, -s * .3, s * .12, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ef8a6f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * .36, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3b3150'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * .22); ctx.moveTo(0, 0); ctx.lineTo(s * .16, s * .06); ctx.stroke();
      ctx.restore();
    }
    function drawCat(x, y, t, mood) {
      var bob = Math.sin(t * 4) * 1.5;
      ctx.save(); ctx.translate(x, y + bob);
      // tail
      ctx.strokeStyle = '#1f1b26'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(26, 26); ctx.quadraticCurveTo(52, 20 + Math.sin(t * 3) * 8, 44, -6); ctx.stroke();
      // body
      ctx.fillStyle = '#1f1b26'; ctx.beginPath(); ctx.ellipse(0, 22, 30, 22, 0, 0, 7); ctx.fill();
      // head
      ctx.beginPath(); ctx.ellipse(0, -6, 26, 22, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-22, -14); ctx.lineTo(-18, -38); ctx.lineTo(-4, -24); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(22, -14); ctx.lineTo(18, -38); ctx.lineTo(4, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e9a7c3'; ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(-16, -31); ctx.lineTo(-9, -23); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, -18); ctx.lineTo(16, -31); ctx.lineTo(9, -23); ctx.closePath(); ctx.fill();
      // face
      if (mood === 'ouch') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
        [[-10, -6], [10, -6]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0] - 4, p[1] - 4); ctx.lineTo(p[0] + 4, p[1] + 4); ctx.moveTo(p[0] + 4, p[1] - 4); ctx.lineTo(p[0] - 4, p[1] + 4); ctx.stroke(); });
      } else if (mood === 'yum') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
        [[-10, -5], [10, -5]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1] + 2, 4.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
      } else {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-10, -6, 6, 7, 0, 0, 7); ctx.ellipse(10, -6, 6, 7, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#1f1b26'; ctx.beginPath(); ctx.arc(-9, -5, 3.4, 0, 7); ctx.arc(11, -5, 3.4, 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#f2a3bd'; ctx.beginPath(); ctx.ellipse(-16, 3, 4, 2.4, 0, 0, 7); ctx.ellipse(16, 3, 4, 2.4, 0, 0, 7); ctx.fill();
      // bowl
      ctx.fillStyle = C['--accent']; ctx.beginPath(); ctx.moveTo(-34, 18); ctx.lineTo(34, 18); ctx.quadraticCurveTo(30, 44, 0, 44); ctx.quadraticCurveTo(-30, 44, -34, 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-34, 18, 68, 4);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('摸魚', 0, 36);
      ctx.restore();
    }

    /* ---------- 狀態 ---------- */
    var cat = { x: 0, y: 0, tx: null, mood: '', moodT: 0 };
    var items = [], pops = [], score = 0, lives = 3, combo = 0, elapsed = 0, spawnT = 0, running = false, paused = false, last = 0, shake = 0;
    function gs() { var X = A.X(); if (!X) return { best: 0, day: '', earned: 0 }; X.games = X.games || {}; return X.games.moyu || (X.games.moyu = { best: 0, day: '', earned: 0, plays: 0 }); }
    var best = gs().best || 0;
    $('best').textContent = best;
    var sound = true; try { sound = localStorage.getItem('moyu_snd') !== '0'; } catch (e) {}
    function sndLabel() { $('snd').textContent = sound ? '♪' : '✕'; $('snd').setAttribute('aria-pressed', sound ? 'true' : 'false'); }
    sndLabel();
    var ac = null;
    function beep(f, d, type, vol) {
      if (!sound) return;
      try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = vol || .05; o.connect(g); g.connect(ac.destination); var n = ac.currentTime; g.gain.exponentialRampToValueAtTime(.0001, n + d); o.start(n); o.stop(n + d); } catch (e) {}
    }

    function level() { return Math.min(10, elapsed / 18); }
    function spawn() {
      var lv = level(), r = Math.random(), k;
      var badP = Math.min(.42, .2 + lv * .025);
      if (r < badP) k = Math.random() < .5 ? 'doc' : 'clock';
      else if (r < badP + .025) k = 'gold';
      else if (r < badP + .17) k = 'heart';
      else if (r < badP + .37) k = 'lav';
      else k = 'fish';
      var s = KINDS[k].w;
      items.push({ k: k, x: s / 2 + 8 + Math.random() * (W - s - 16), y: -30, vy: 110 + lv * 26 + Math.random() * 50, s: s, born: performance.now() / 1000 });
    }
    function hud() {
      $('score').textContent = score;
      $('lives').textContent = '♥♥♥'.slice(0, lives) + '♡♡♡'.slice(0, 3 - lives);
    }
    function addPop(x, y, text, color, big) { pops.push({ x: x, y: y, t: 0, text: text, color: color, big: !!big }); }

    function step(dt) {
      elapsed += dt;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(.32, .9 - level() * .055) * (.7 + Math.random() * .6); }
      if (cat.tx != null) cat.x += (cat.tx - cat.x) * Math.min(1, dt * 18);
      cat.x = Math.min(Math.max(cat.x, 34), W - 34);
      if (cat.moodT > 0) { cat.moodT -= dt; if (cat.moodT <= 0) cat.mood = ''; }
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i]; it.y += it.vy * dt;
        var catchY = cat.y + 14;
        if (it.y > catchY - 14 && it.y < catchY + 22 && Math.abs(it.x - cat.x) < 34 + it.s * .3) {
          items.splice(i, 1);
          var K = KINDS[it.k];
          if (K.good) {
            combo++; var mult = combo >= 15 ? 3 : combo >= 6 ? 2 : 1, p = K.pts * mult; score += p;
            addPop(it.x, cat.y - 34, '+' + p + (mult > 1 ? ' ×' + mult : ''), it.k === 'gold' ? C['--gold'] : C['--good']);
            if (it.k === 'heart' && Math.random() < .55) addPop(cat.x, cat.y - 70, LINES[Math.floor(Math.random() * LINES.length)], C['--accent'], true);
            if (it.k === 'gold') addPop(cat.x, cat.y - 70, '金魚！今天運氣真好', C['--gold'], true);
            cat.mood = 'yum'; cat.moodT = .35;
            beep(it.k === 'gold' ? 1046 : it.k === 'heart' ? 880 : 660 + Math.min(combo, 12) * 20, .12, 'triangle', .05);
          } else {
            lives--; combo = 0; shake = .3; cat.mood = 'ouch'; cat.moodT = .6;
            addPop(it.x, cat.y - 34, it.k === 'doc' ? '被派工作了' : '要開會了', C['--bad'], true);
            beep(180, .25, 'square', .04);
            try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
            if (lives <= 0) { hud(); return end(); }
          }
          hud(); continue;
        }
        if (it.y > H + 40) { items.splice(i, 1); if (KINDS[it.k].good && it.k !== 'lav') combo = 0; }
      }
      for (var j = pops.length - 1; j >= 0; j--) { pops[j].t += dt; if (pops[j].t > (pops[j].big ? 1.6 : .8)) pops.splice(j, 1); }
      if (shake > 0) shake -= dt;
    }

    function drawBg(t) {
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C['--sky-top']); g.addColorStop(1, C['--sky-bot']);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // lavender row at the bottom
      var n = Math.ceil(W / 14);
      for (var i = 0; i < n; i++) {
        var x = i * 14 + 6, h = 22 + ((i * 37) % 13), sway = Math.sin(t * 1.4 + i * .7) * 2;
        ctx.strokeStyle = C['--grass']; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + sway, H - h * .6, x + sway * 1.4, H - h); ctx.stroke();
        ctx.fillStyle = C['--accent']; ctx.globalAlpha = .55;
        for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + sway * 1.4 + (k % 2 ? 2 : -2), H - h + k * 4, 2.2, 3.2, 0, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    }
    function draw(t) {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - .5) * 8 * shake / .3, 0);
      drawBg(t);
      items.forEach(function (it) { KINDS[it.k].draw(it.x, it.y, it.s, t - it.born); });
      drawCat(cat.x, cat.y, t, cat.mood);
      if (combo >= 6) { ctx.fillStyle = C['--accent']; ctx.font = '700 13px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText('連續 ' + combo + '　×' + (combo >= 15 ? 3 : 2), cat.x, cat.y + 66 > H - 4 ? cat.y - 50 : cat.y + 66); }
      pops.forEach(function (p) {
        var life = p.big ? 1.6 : .8, a = 1 - p.t / life;
        ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
        ctx.font = '700 ' + (p.big ? 16 : 15) + 'px ' + css('--font');
        var y = p.y - p.t * 40;
        if (p.big) { var w = ctx.measureText(p.text).width + 18; ctx.fillStyle = C['--card']; roundRect(p.x - w / 2, y - 18, w, 26, 13); ctx.fill(); }
        ctx.fillStyle = p.color; ctx.fillText(p.text, Math.min(Math.max(p.x, 60), W - 60), y);
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    }
    function roundRect(x, y, w, h, r) { x = Math.min(Math.max(x, 6), W - w - 6); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function loop(now) {
      if (!running) return;
      var t = now / 1000, dt = Math.min(.05, t - (last || t)); last = t;
      if (!paused) step(dt);
      draw(t);
      if (running) requestAnimationFrame(loop);
    }
    function start() {
      items = []; pops = []; score = 0; lives = 3; combo = 0; elapsed = 0; spawnT = .4; shake = 0; cat.mood = ''; cat.x = W / 2; cat.tx = null;
      hud(); $('start').hidden = true; $('over').hidden = true; $('paused').hidden = true; paused = false;
      running = true; last = 0; requestAnimationFrame(loop);
      beep(523, .1, 'triangle'); setTimeout(function () { beep(784, .14, 'triangle'); }, 110);
    }
    function end() {
      running = false;
      best = gs().best || 0;
      var isNew = score > best, st = gs(), d = today();
      if (isNew) { best = score; st.best = score; }
      st.plays = (st.plays || 0) + 1;
      if (st.day !== d) { st.day = d; st.earned = 0; }
      var earn = Math.max(0, Math.min(Math.floor(score / 5), 40 - st.earned)), gg = G();
      if (earn && gg) { gg.coins += earn; st.earned += earn; log(gg, '🐟 摸魚賺到 +' + earn); }
      A.save();
      $('earn').textContent = earn ? '賺到花園金幣 🪙 ' + earn + (st.earned >= 40 ? '（今天賺滿了）' : '') : (st.earned >= 40 ? '今天的摸魚金幣已經賺滿了' : '');
      $('best').textContent = best; $('final').textContent = score;
      $('bestLine').textContent = isNew ? '新紀錄！' : '最高紀錄 ' + best + ' 分';
      $('bestLine').className = isNew ? 'new' : '';
      $('quote').textContent = pick(helpers()) + '：「' + ENDQ[Math.floor(Math.random() * ENDQ.length)] + '」';
      $('over').hidden = false; draw(performance.now() / 1000);
      beep(392, .2, 'triangle'); setTimeout(function () { beep(262, .3, 'triangle'); }, 180);
    }
    function setPause(v) {
      if (!running) return; paused = v; $('paused').hidden = !v; $('pause').textContent = v ? '▶' : '❚❚';
    }

    /* ---------- 操作 ---------- */
    function px(e) { var r = cv.getBoundingClientRect(); return e.clientX - r.left; }
    cv.addEventListener('pointerdown', function (e) { cat.tx = px(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.buttons || e.pressure) cat.tx = px(e); });
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') { cat.tx = (cat.tx == null ? cat.x : cat.tx) - 60; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { cat.tx = (cat.tx == null ? cat.x : cat.tx) + 60; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'p') { if (running) setPause(!paused); else if (!$('start').hidden || !$('over').hidden) start(); e.preventDefault(); }
    });
    $('goBtn').addEventListener('click', start);
    $('againBtn').addEventListener('click', start);
    $('resumeBtn').addEventListener('click', function () { setPause(false); });
    $('pause').addEventListener('click', function () { setPause(!paused); });
    $('snd').addEventListener('click', function () { sound = !sound; try { localStorage.setItem('moyu_snd', sound ? '1' : '0'); } catch (e) {} sndLabel(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) setPause(true); });
    window.addEventListener('resize', function () { if (isOpen()) resize(); });
    function isOpen() { var o = document.getElementById('cx-moyu'); return o && !o.hidden; }
    $('close').addEventListener('click', function () { if (running) { running = false; } document.getElementById('cx-moyu').hidden = true; if (home && !home.hidden) homeRender(); });

    /* 說明裡的小圖 */
    (function legend() {
      var box = $('legend'); var order = ['fish', 'lav', 'heart', 'gold', 'doc', 'clock'];
      order.forEach(function (k) {
        var K = KINDS[k], sp = document.createElement('span'), c = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1);
        c.width = 26 * d; c.height = 26 * d; sp.appendChild(c);
        var lab = document.createElement('span'); lab.textContent = K.name; sp.appendChild(lab);
        var p = document.createElement('span'); p.className = K.good ? 'pts' : 'neg'; p.textContent = K.good ? '+' + K.pts : '−♥'; sp.appendChild(p);
        box.appendChild(sp);
        var g = c.getContext('2d'), keep = ctx; ctx = g; g.setTransform(d, 0, 0, d, 0, 0); K.draw(13, 13, 22, 0); ctx = keep;
      });
    })();

    return { show: function () { readColors(); best = gs().best || 0; $('best').textContent = best; resize(); if (!running) { $('start').hidden = false; $('over').hidden = true; $('paused').hidden = true; } draw(0); } };
  }

  /* ================= 小窩 ================= */
  var APPS = [
    ['garden', 'fa-seedling', '花園'], ['moyu', 'fa-fish', '摸魚小貓'], ['envelope-function', 'fa-envelope', '寫信'], ['cx-diary-entry', 'fa-book', '他的日記'],
    ['qa-function', 'fa-box-open', '問題箱'],
    ['cx-comp-entry', 'fa-headphones', '陪伴'], ['cx-toss-entry', 'fa-face-grin-squint-tears', '搞怪'], ['cx-phone-entry', 'fa-mobile-screen', 'TA 的手機'], ['cx-rp-entry', 'fa-gift', '紅包'],
    ['cx-calllog-entry', 'fa-phone', '通話紀錄'], ['cx-pomo-entry', 'fa-clock', '番茄鐘'], ['cx-period-entry', 'fa-droplet', '潮汐'], ['mood-function', 'fa-face-smile', '心晴手帳'],
    ['anniversary-function', 'fa-calendar-days', '重要日'], ['decision-function', 'fa-shuffle', '抉擇'], ['fortune-lenormand-function', 'fa-star', '運勢'], ['cx-rate-entry', 'fa-star-half-stroke', '他的評分'],
    ['cx-status-entry', 'fa-heart-pulse', '狀態檢測'], ['stats-function', 'fa-chart-simple', '訊息統計'], ['custom-replies-function', 'fa-comment-dots', '字卡'], ['cx-help-entry', 'fa-book-open', '使用手冊']
  ];
  var home = null;
  function hello() { var h = new Date().getHours(); return h < 5 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : '晚上好'; }
  function nextAnniv() {
    var list = (typeof anniversaries !== 'undefined' && Array.isArray(anniversaries)) ? anniversaries : [], best = null, t0 = new Date(); t0.setHours(0, 0, 0, 0);
    list.forEach(function (a) {
      if (!a || !a.date) return; var p = String(a.date).split('-'); if (p.length < 3) return;
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      if (d < t0) { d = new Date(t0.getFullYear(), +p[1] - 1, +p[2]); if (d < t0) d.setFullYear(d.getFullYear() + 1); }
      var days = Math.round((d - t0) / 864e5); if (!best || days < best.days) best = { name: a.name, days: days };
    });
    return best;
  }
  function gardenSummary() {
    var g = G(); if (!g) return '';
    var now = Date.now(); g.plots.forEach(function (p) { grow(p, now); });
    var r = g.plots.filter(ready).length, dry = g.plots.filter(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now; }).length, bug = g.plots.some(function (p) { return p.bug; }), empty = g.plots.filter(function (p) { return p.open && !p.crop; }).length;
    var parts = []; if (r) parts.push(r + ' 格可以收成'); if (dry) parts.push(dry + ' 格要澆水'); if (bug) parts.push('有蟲！'); if (!parts.length) parts.push(empty === g.plots.filter(function (p) { return p.open; }).length ? '還沒種東西' : '都長得很好');
    return '<div class="mini">' + g.plots.map(function (p) { return '<i class="' + (!p.open ? 'lk' : !p.crop ? '' : ready(p) ? 'rd' : 'gr') + '"></i>'; }).join('') + '</div><div><b>花園</b><span>' + parts.join(' · ') + '</span><span class="cx-muted">🪙 ' + g.coins + '</span></div>';
  }
  function homeRender() {
    if (!home) return;
    var av = document.querySelector('#partner-avatar img'), st = (document.getElementById('partner-status') || {}).textContent || '';
    var an = nextAnniv();
    home.querySelector('.cx-h-body').innerHTML =
      '<div class="cx-h-hi">' + hello() + '，' + esc(A.myname()) + '</div>' +
      '<div class="cx-h-cards">' +
        '<button type="button" class="cx-h-card garden" data-app="garden">' + gardenSummary() + '</button>' +
        '<div class="cx-h-card him"><span class="av">' + (av ? '<img src="' + esc(av.src) + '" alt="">' : '') + '</span><div><b>' + esc(A.pname()) + '</b><span>' + esc(st.trim() || '在這裡') + '</span></div></div>' +
        (an ? '<button type="button" class="cx-h-card ann" data-app="anniversary-function"><div><b>' + (an.days === 0 ? '就是今天' : an.days + ' 天') + '</b><span>' + esc(an.name || '重要日') + '</span></div></button>' : '') +
      '</div>' +
      '<div class="cx-h-apps">' + APPS.filter(function (a) { return a[0] === 'garden' || a[0] === 'moyu' || document.getElementById(a[0]); }).map(function (a) {
        return '<button type="button" class="cx-h-app" data-app="' + a[0] + '"><span class="ic"><i class="fas ' + a[1] + '"></i></span><span class="lb">' + a[2] + '</span></button>';
      }).join('') + '</div>' +
      '<label class="cx-h-first"><input type="checkbox" id="cx-h-first"' + (lsGet('cxHomeFirst') === '1' ? ' checked' : '') + '> 打開網站時先顯示小窩</label>';
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function homeBuild() {
    home = document.createElement('div'); home.id = 'cx-home'; home.hidden = true;
    home.innerHTML = '<div class="cx-h-sheet" role="dialog" aria-label="小窩"><div class="cx-h-head"><b>小窩</b><button type="button" class="cx-h-x" aria-label="回到聊天"><i class="fas fa-comment"></i> 回聊天</button></div><div class="cx-h-body"></div></div>';
    document.body.appendChild(home);
    home.addEventListener('click', function (e) {
      if (e.target === home || e.target.closest('.cx-h-x')) { homeClose(); return; }
      if (e.target.id === 'cx-h-first') { try { localStorage.setItem('cxHomeFirst', e.target.checked ? '1' : '0'); } catch (x) {} return; }
      var b = e.target.closest('[data-app]'); if (!b) return;
      var id = b.dataset.app;
      if (id === 'garden') { A.load().then(function () { gOpen(true); }); return; }
      if (id === 'moyu') { A.load().then(moyuOpen); return; }
      var el = document.getElementById(id); if (el) el.click();
    });
  }
  function homeOpen() {
    if (!home) homeBuild();
    A.load().then(function () { simulate(true); homeRender(); home.hidden = false; requestAnimationFrame(function () { home.classList.add('on'); }); });
  }
  function homeClose() { if (!home) return; home.classList.remove('on'); setTimeout(function () { home.hidden = true; }, 220); }

  /* 上方按鈕 */
  (function headerBtn() {
    var bar = document.querySelector('.header-actions'); if (!bar || document.getElementById('cx-home-btn')) return;
    var b = document.createElement('button'); b.id = 'cx-home-btn'; b.className = 'action-btn'; b.title = '小窩'; b.type = 'button';
    b.innerHTML = '<i class="fas fa-house"></i>'; b.addEventListener('click', homeOpen);
    bar.insertBefore(b, bar.firstChild);
  })();

  var css = document.createElement('style');
  css.textContent =
    '#cx-home{position:fixed;inset:0;z-index:1900;background:rgba(30,20,50,.28);display:flex;align-items:flex-end;justify-content:center}' +
    '#cx-home[hidden]{display:none}' +
    '.cx-h-sheet{background:var(--secondary-bg,#fff);color:var(--text-primary);width:100%;max-width:560px;height:min(92vh,860px);border-radius:24px 24px 0 0;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .22s ease;box-shadow:0 -10px 40px rgba(40,20,80,.18);padding-bottom:env(safe-area-inset-bottom,0px)}' +
    '#cx-home.on .cx-h-sheet{transform:none}' +
    '@media (min-width:700px){#cx-home{align-items:center}.cx-h-sheet{border-radius:24px;height:min(86vh,820px)}}' +
    '.cx-h-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 6px}.cx-h-head b{font-size:20px;letter-spacing:.08em}' +
    '.cx-h-x{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer}' +
    '.cx-h-body{flex:1;min-height:0;overflow-y:auto;padding:4px 18px 18px;display:flex;flex-direction:column;gap:14px}' +
    '.cx-h-hi{font-size:14px;color:var(--text-secondary)}' +
    '.cx-h-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.cx-h-card{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:18px;padding:12px;display:flex;gap:10px;align-items:center;text-align:left;font:inherit;min-width:0}' +
    'button.cx-h-card{cursor:pointer}.cx-h-card b{display:block;font-size:15px}.cx-h-card span{display:block;font-size:12px;color:var(--text-secondary);line-height:1.5}' +
    '.cx-h-card>div{min-width:0}.cx-h-card.garden{grid-column:1/-1}' +
    '.cx-h-card .mini{display:grid;grid-template-columns:repeat(3,14px);gap:3px;flex:0 0 auto}.cx-h-card .mini i{width:14px;height:14px;border-radius:4px;background:#c9a77f;opacity:.55}.cx-h-card .mini i.gr{background:#7fb06f;opacity:1}.cx-h-card .mini i.rd{background:#e5546b;opacity:1}.cx-h-card .mini i.lk{background:var(--border-color)}' +
    '.cx-h-card .av{width:38px;height:38px;border-radius:50%;overflow:hidden;flex:0 0 38px;background:var(--border-color)}.cx-h-card .av img{width:100%;height:100%;object-fit:cover}' +
    '.cx-h-apps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 6px}' +
    '.cx-h-app{border:0;background:none;color:var(--text-primary);font:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:2px}' +
    '.cx-h-app .ic{width:54px;height:54px;border-radius:17px;display:grid;place-items:center;font-size:21px;color:var(--accent-color);background:var(--primary-bg);border:1px solid var(--border-color)}' +
    '.cx-h-app[data-app=moyu] .ic{color:#5b8fc7}' +
    '#cx-moyu{position:fixed;inset:0;z-index:2100;background:var(--primary-bg);color:var(--text-primary);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);touch-action:none;user-select:none;-webkit-user-select:none}' +
    '#cx-moyu[hidden]{display:none}' +
    '.cxm-hd{display:flex;align-items:center;gap:8px;padding:10px max(14px,env(safe-area-inset-right,0px)) 8px max(14px,env(safe-area-inset-left,0px))}.cxm-hd>b{font-size:17px;letter-spacing:.04em;white-space:nowrap}' +
    '.cxm-st{margin-left:auto;display:flex;gap:10px;align-items:baseline;font-variant-numeric:tabular-nums;white-space:nowrap}.cxm-st b{font-size:18px}.cxm-st small{font-size:11px;color:var(--text-secondary)}#cxm-lives{color:#d9534f;letter-spacing:1px}#cxm-best{font-size:14px!important}' +
    '.cxm-ib{border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:99px;width:32px;height:32px;flex:0 0 32px;font:inherit;font-size:13px;cursor:pointer;display:grid;place-items:center;padding:0}' +
    '.cxm-stage{position:relative;flex:1;min-height:0}.cxm-stage>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '.cxm-ov{position:absolute;inset:0;display:grid;place-items:center;padding:0 16px}.cxm-ov[hidden]{display:none}' +
    '.cxm-panel{background:var(--secondary-bg);border:1px solid var(--border-color);border-radius:22px;padding:20px 18px;width:min(360px,100%);text-align:center;box-shadow:0 18px 50px rgba(60,40,100,.18)}' +
    '.cxm-panel h2{margin:0 0 6px;font-size:24px;letter-spacing:.06em}.cxm-panel p{margin:6px 0;color:var(--text-secondary);font-size:14px;line-height:1.7}' +
    '.cxm-legend{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;text-align:left;margin:12px 0 14px;font-size:13px}.cxm-legend>span{display:flex;align-items:center;gap:7px}.cxm-legend canvas{width:26px;height:26px;flex:0 0 26px}' +
    '.cxm-legend .pts{margin-left:auto;color:#3f9e6a}.cxm-legend .neg{margin-left:auto;color:#d9534f}' +
    '.cxm-go{border:0;background:var(--accent-color);color:#fff;font:inherit;font-weight:700;font-size:16px;padding:11px 26px;border-radius:99px;cursor:pointer}' +
    '.cxm-big{font-size:42px;font-weight:700;font-variant-numeric:tabular-nums}.cxm-quote{color:var(--accent-color)!important;font-size:15px!important}.cxm-earn{color:#c08a12!important;font-weight:600}.cxm-panel .new{color:#e0a526!important;font-weight:700}' +
    '.cx-h-app[data-app=garden] .ic{background:var(--accent-color);color:#fff;border-color:var(--accent-color)}' +
    '.cx-h-app .lb{font-size:12px;text-align:center;line-height:1.3}' +
    '.cx-h-app:active .ic{transform:scale(.94)}' +
    '.cx-h-first{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text-secondary);justify-content:center;padding-top:4px}' +
    /* garden */
    '.cx-g-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cx-g-coin{font-weight:700;font-size:15px;color:#c08a12;white-space:nowrap}' +
    '.cx-g-tabs{display:flex;gap:4px;margin-left:auto;background:var(--primary-bg);border:1px solid var(--border-color);border-radius:99px;padding:3px}' +
    '.cx-g-tabs button{border:0;background:none;color:var(--text-secondary);font:inherit;font-size:13px;padding:5px 11px;border-radius:99px;cursor:pointer}.cx-g-tabs button.on{background:var(--accent-color);color:#fff}' +
    '.cx-g-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;border-radius:18px;background:#e9dcc8}' +
    '.cx-g-plot{position:relative;aspect-ratio:1/1.05;border-radius:14px;border:2px solid transparent;background:#c9a77f;box-shadow:inset 0 -6px 0 #b48d62;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:4px 2px 8px;cursor:pointer;font:inherit;color:#4b3621;min-width:0}' +
    '.cx-g-plot.wet{background:#a8825a;box-shadow:inset 0 -6px 0 #8f6c47}.cx-g-plot.ready{box-shadow:inset 0 -6px 0 #b48d62,0 0 0 2px #f7c948}.cx-g-plot.sel{border-color:var(--accent-color)}' +
    '.cx-g-plot svg{width:86%;flex:1;min-height:0}.cx-g-plot small{font-size:11px;line-height:1.2;color:#fff8ee;text-shadow:0 1px 1px #0005;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
    '.cx-g-plot .dry{color:#ffe08a}.cx-g-plot .by{position:absolute;top:5px;right:6px;font-style:normal;font-size:10px;background:#fff;color:var(--accent-color);border-radius:50%;width:17px;height:17px;display:grid;place-items:center}' +
    '.cx-g-plot.empty .plus{font-size:24px;color:#fff8ee;flex:1;display:grid;place-items:center}.cx-g-plot.lock{background:#d8ccbb;box-shadow:none;color:#8a7a66;justify-content:center;gap:6px}.cx-g-plot.lock small{color:#8a7a66;text-shadow:none}.cx-g-plot:disabled{opacity:.55;cursor:default}' +
    '.cx-g-acts{display:flex;gap:8px}.cx-g-acts .cx-btn{flex:1}' +
    '.cx-g-panel{border:1px solid var(--border-color);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--primary-bg)}.cx-g-pt{font-weight:700}' +
    '.cx-g-seed{display:grid;grid-template-columns:44px 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center;text-align:left;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:12px;padding:6px 10px;font:inherit;cursor:pointer}' +
    '.cx-g-seed svg{grid-row:1/3;width:44px;height:42px}.cx-g-seed .nm{font-weight:600}.cx-g-seed .cx-muted{grid-column:2}.cx-g-seed .pr{grid-row:1/3;grid-column:3;font-weight:700;color:#c08a12}.cx-g-seed:disabled{opacity:.45}' +
    '.cx-g-item{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border-color);padding:8px 0}.cx-g-item svg{width:44px;height:42px;flex:0 0 44px}.cx-g-item .tx{flex:1;min-width:0}.cx-g-item .cx-btn{padding:8px 12px;font-size:13px;white-space:nowrap}' +
    '.cx-g-dex{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}.cx-g-dx{border:1px solid var(--border-color);border-radius:14px;padding:8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}.cx-g-dx svg{width:60px;height:56px}.cx-g-dx.no svg{filter:grayscale(1) brightness(.4);opacity:.35}.cx-g-dx .cx-muted{font-size:11px}' +
    '.cx-g-log div{font-size:13px;padding:6px 0;border-bottom:1px dashed var(--border-color)}.cx-g-tip{text-align:center}' +
    '@media (prefers-reduced-motion:reduce){.cx-h-sheet{transition:none}}';
  document.head.appendChild(css);

  window.__cxHome = { open: homeOpen, close: homeClose, garden: function () { A.load().then(function () { gOpen(false); }); }, _sim: simulate, _G: G };
  if (lsGet('cxHomeFirst') === '1') setTimeout(homeOpen, 1200);
  setInterval(function () { if (document.visibilityState === 'visible' && A.X()) { if (simulate(false)) { if (home && !home.hidden) homeRender(); } } }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(function () { if (A.X()) simulate(true); }, 4000); });
})();
