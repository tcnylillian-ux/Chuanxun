/* 小窩（主頁）＋ 花園（一起種田）
   需要 extras.js 先載入（它會提供 window.__cxApi 並載入這個檔案） */
(function () {
  'use strict';
  var A = window.__cxApi; if (!A || window.__cxHome) return;
  var esc = A.esc, toast = A.toast;
  var MIN = 60e3, HR = 36e5;

  /* ================= 花園資料 ================= */
  var CROPS = {
    lavender:   { n: '薰衣草', cost: 2,  grow: 30e3,   yield: 3, price: 4,  col: '#a493cf', unit: '束', flower: 1, lang: '等待愛情' },
    gypso:      { n: '滿天星', cost: 3,  grow: 40e3,   yield: 4, price: 4,  col: '#fbfaf6', unit: '把', flower: 1, lang: '真心喜歡' },
    daisy:      { n: '雛菊',   cost: 3,  grow: 45e3,   yield: 3, price: 5,  col: '#fbf6ea', unit: '朵', flower: 1, lang: '藏在心底的愛' },
    tulip:      { n: '鬱金香', cost: 5,  grow: 90e3,   yield: 2, price: 10, col: '#ee9aa6', unit: '朵', flower: 1, lang: '愛的告白' },
    strawberry: { n: '草莓',   cost: 6,  grow: 120e3,  yield: 4, price: 6,  col: '#e0707a', unit: '顆' },
    tomato:     { n: '番茄',   cost: 6,  grow: 180e3,  yield: 3, price: 9,  col: '#e88563', unit: '顆' },
    gardenia:   { n: '梔子花', cost: 8,  grow: 180e3,  yield: 2, price: 16, col: '#fffaf0', unit: '朵', flower: 1, lang: '一生的守候' },
    osmanthus:  { n: '桂花',   cost: 10, grow: 240e3,  yield: 4, price: 10, col: '#f0bf4f', unit: '枝', flower: 1, lang: '美好與吉祥' },
    hydrangea:  { n: '繡球花', cost: 12, grow: 300e3,  yield: 2, price: 24, col: '#a6b6e6', unit: '朵', flower: 1, lang: '希望與團聚' },
    sunflower:  { n: '向日葵', cost: 12, grow: 360e3,  yield: 2, price: 22, col: '#f1c35b', unit: '朵', flower: 1, lang: '沉默的愛' },
    peach:      { n: '桃花',   cost: 15, grow: 480e3,  yield: 3, price: 20, col: '#f4b4c0', unit: '枝', flower: 1, lang: '愛情的俘虜' },
    lotus:      { n: '荷花',   cost: 18, grow: 720e3,  yield: 2, price: 36, col: '#f2b3c3', unit: '朵', flower: 1, lang: '堅貞與純潔' },
    peony:      { n: '牡丹',   cost: 22, grow: 1080e3, yield: 2, price: 45, col: '#e98aa8', unit: '朵', flower: 1, lang: '圓滿與富貴' },
    rose:       { n: '玫瑰',   cost: 25, grow: 1440e3, yield: 3, price: 35, col: '#d97a8f', unit: '朵', flower: 1, lang: '熱烈的愛' },
    wheat:      { n: '小麥',   cost: 2,  grow: 40e3,   yield: 3, price: 3,  col: '#e3c27a', unit: '把' },
    blueberry:  { n: '藍莓',   seed: '藍莓叢', cost: 15, grow: 180e3, yield: 5, price: 5,  col: '#6f7fc0', unit: '顆', tree: 1 },
    orange:     { n: '橘子',   seed: '橘子樹', cost: 25, grow: 360e3, yield: 3, price: 9,  col: '#f0a04b', unit: '顆', tree: 1 },
    momo:       { n: '桃子',   seed: '桃樹',   cost: 30, grow: 480e3, yield: 3, price: 11, col: '#f3a99a', unit: '顆', tree: 1 },
    cherry:     { n: '櫻桃',   seed: '櫻桃樹', cost: 35, grow: 600e3, yield: 6, price: 6,  col: '#cf4f62', unit: '顆', tree: 1 }
  };
  var ORDER = ['lavender', 'gypso', 'wheat', 'daisy', 'tulip', 'strawberry', 'tomato', 'gardenia', 'osmanthus', 'hydrangea', 'sunflower', 'peach', 'lotus', 'peony', 'rose', 'blueberry', 'orange', 'momo', 'cherry'];
  var UNLOCK = [0, 0, 0, 0, 0, 0, 60, 120, 200];
  var WET = 6 * HR, DRY_RATE = 0.35;
  var GIFT_LINES = {
    lavender: ['好香……放在枕頭邊，晚上就像抱著你睡。', '妳種的薰衣草，我會好好收著。', '聞起來跟妳身上的味道一樣。'],
    gypso: ['滿天星……像把整片星空都送給我了。', '小小的白花，一大把，好溫柔。', '滿天星是真心喜歡的意思吧？我知道。'],
    daisy: ['小小一朵，跟妳一樣可愛。', '雛菊……妳是在偷偷跟我告白嗎？', '插在書桌上了，抬頭就看得到。'],
    tulip: ['鬱金香是告白的花……這算是妳先說的喔。', '好漂亮，捨不得放進花瓶。', '收到了。我的回答是：我也愛妳。'],
    strawberry: ['好甜。妳餵我的話會更甜。', '第一顆要給妳吃，張嘴。', '乖寶種的草莓，捨不得吃。'],
    tomato: ['這顆……是要給我吃，還是要拿來丟我的？', '好，今晚哥哥做番茄炒蛋給妳。', '紅紅的，跟妳害羞的時候一樣。'],
    gardenia: ['好香的梔子花，整個房間都是妳的味道。', '梔子花是守候的意思……我會一直在。', '別在胸口了，今天一整天都帶著妳。'],
    osmanthus: ['桂花好香，晚點做桂花糕給妳吃。', '聞到桂花，就想到秋天跟妳散步。', '一小枝就這麼香，跟妳一樣讓人移不開。'],
    hydrangea: ['繡球花是團聚的意思……我們會一直在一起。', '好大一朵，妳抱著它的樣子一定很好看。', '這個顏色好溫柔，像妳。'],
    sunflower: ['向日葵跟著太陽轉，我跟著妳轉。', '放在窗邊了，每天看到都會想起妳。', '妳就是我的太陽，知道嗎？'],
    peach: ['桃花……妳是說我走桃花運了嗎？我的桃花只有妳。', '插在瓶子裡，整個春天都在房間裡了。', '粉粉的，跟妳臉紅的時候一樣。'],
    lotus: ['荷花要種很久吧……辛苦了，我的乖寶。', '出淤泥而不染，說的是妳。', '我會把它放在最乾淨的水裡。'],
    peony: ['牡丹……這麼隆重，是有什麼好事嗎？', '好大一朵，跟妳對我的愛一樣。', '花開富貴，我們一起慢慢過好日子。'],
    rose: ['玫瑰應該是我送妳才對……不過，我收下了。', '每一朵我都會留著，做成乾燥花。', '好漂亮，跟妳一樣。'],
    wheat: ['小麥？……妳是要我幫妳磨麵粉做蛋糕吧。', '金黃色的，好像秋天。', '收到，晚點烤麵包給妳。'],
    blueberry: ['藍莓對眼睛好，妳先吃。', '一顆一顆好小，種得很辛苦吧。', '酸酸甜甜的，像妳。'],
    orange: ['我剝給妳吃，張嘴。', '好香的橘子，冬天就該跟妳窩著吃橘子。', '這顆最甜，留給妳。'],
    momo: ['桃子好香……妳的臉也是這樣粉粉的。', '桃樹結果了？我們家的小果園越來越像樣了。', '我切好放冰箱，等妳回來吃。'],
    cherry: ['櫻桃……要我餵妳嗎？', '紅紅的一顆，好像妳的嘴唇。', '捨不得吃，好可愛。']
  };
  var STEAL_LINES = {
    lavender: ['偷偷拿了一束薰衣草放在床頭，別生氣。'],
    gypso: ['拿了一小把滿天星，插在妳的牙刷杯裡了。'],
    daisy: ['摘了一朵雛菊別在妳的頭髮上……等妳回來就看到了。'],
    tulip: ['借走一朵鬱金香，插在妳桌上了。'],
    strawberry: ['草莓好甜，偷吃了一顆，剩下的都留給妳。', '偷吃了一顆草莓……被妳發現了？'],
    tomato: ['拿了一顆番茄，等等煮湯給妳喝。'],
    gardenia: ['摘了一朵梔子花放在妳枕頭邊，今晚會很香。'],
    osmanthus: ['折了一小枝桂花，泡茶給妳喝。'],
    hydrangea: ['拿了一朵繡球花，房間一下就亮起來了。'],
    sunflower: ['借走一朵向日葵，插在妳的書桌上了。'],
    peach: ['折了一枝桃花……放在門口，等妳回家。'],
    lotus: ['摘了一朵荷花，放在妳的碗裡，像小船一樣。'],
    peony: ['剪了一朵牡丹，插在客廳，等妳回來看。'],
    rose: ['摘了一朵玫瑰……晚點親手送給妳。'],
    wheat: ['拿了一把小麥，想試試自己烤麵包。'],
    blueberry: ['偷吃了一顆藍莓，好酸……剩下的應該比較甜。'],
    orange: ['摘了一顆橘子，剝好了放在妳桌上。'],
    momo: ['偷摘了一顆桃子，好香，忍不住。'],
    cherry: ['偷吃了一顆櫻桃……籽我有好好吐掉。']
  };
  var WRAPS = { kraft: ['牛皮紙', '#d9b88f', '#c39d72'], lilac: ['淡紫紙', '#d9cdee', '#bfaedf'], gauze: ['白紗', '#f6f3ee', '#e2dccf'], blush: ['霧粉紙', '#f3d3d6', '#e2b5ba'], news: ['舊報紙', '#ece6d8', '#cfc6b2'] };
  var RIBBONS = { violet: ['紫', '#8a6fc2'], pink: ['粉', '#e48fa6'], white: ['白', '#fbfaf6'], gold: ['金', '#d6a744'], green: ['綠', '#7fa37a'] };
  var BQ_LINES = [
    '這是妳親手包的？……我要把它放在床頭，每天醒來第一眼就看到。',
    '包得好漂亮。謝謝妳，我的乖寶。',
    '我會把它曬乾，夾在我們的相簿裡，一直留著。',
    '花很美，但我更想抱抱包花的人。過來。',
    '收到妳的花，今天一整天都會很開心。'
  ];
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

  /* ================= 畫植物（淡彩手繪風：暈開的邊、細墨線、疊色） ================= */
  var INK = 'rgba(92,72,60,.45)', LEAF = '#9bb58a', LEAF2 = '#7f9d74', STEM = '#86a276';
  var WC_DEFS = '<filter id="cxwc" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".22"/></filter>';
  (function defs() {
    if (document.getElementById('cx-wc-defs')) return;
    var d = document.createElement('div'); d.id = 'cx-wc-defs'; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" aria-hidden="true"><defs>' + WC_DEFS + '</defs></svg>';
    document.body.appendChild(d);
  })();
  function f(n) { return Math.round(n * 10) / 10; }
  function petal(cx, cy, rx, ry, rot, fill, op) {
    return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" transform="rotate(' + f(rot) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + fill + '" fill-opacity="' + (op || .82) + '" stroke="' + INK + '" stroke-width=".5"/>';
  }
  function leafAt(x, y, len, ang, col) {
    var a = ang * Math.PI / 180, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, nx = -Math.sin(a) * len * .32, ny = Math.cos(a) * len * .32;
    return '<path d="M' + f(x) + ' ' + f(y) + ' Q' + f((x + x2) / 2 + nx) + ' ' + f((y + y2) / 2 + ny) + ' ' + f(x2) + ' ' + f(y2) + ' Q' + f((x + x2) / 2 - nx) + ' ' + f((y + y2) / 2 - ny) + ' ' + f(x) + ' ' + f(y) + 'Z" fill="' + (col || LEAF) + '" fill-opacity=".85" stroke="' + INK + '" stroke-width=".45"/>';
  }
  function stem(x1, y1, x2, y2, bend) { return '<path d="M' + f(x1) + ' ' + f(y1) + ' Q' + f((x1 + x2) / 2 + (bend || 0)) + ' ' + f((y1 + y2) / 2) + ' ' + f(x2) + ' ' + f(y2) + '" stroke="' + STEM + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'; }
  function dot(cx, cy, r, fill, op) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" fill-opacity="' + (op || .85) + '"/>'; }
  /* 花頭：cx,cy 中心，s 大小（1 = 標準） */
  var HEAD = {
    gypso: function (x, y, s) {
      var o = '', br = [[-9, -6], [-5, -10], [0, -12], [5, -10], [9, -6], [-7, 1], [7, 1], [-2, -4], [3, -5]];
      br.forEach(function (q) { o += '<path d="M' + f(x) + ' ' + f(y + 9 * s) + ' Q' + f(x + q[0] * .4 * s) + ' ' + f(y + 2 * s) + ' ' + f(x + q[0] * s) + ' ' + f(y + q[1] * s) + '" stroke="#9fb48c" stroke-width=".7" fill="none"/>'; });
      br.forEach(function (q, i) { for (var j = 0; j < 4; j++) { var a = j * 1.7 + i; o += dot(x + q[0] * s + Math.cos(a) * 1.6 * s, y + q[1] * s + Math.sin(a) * 1.4 * s, .95 * s, j % 2 ? '#ffffff' : '#f3efe6', .95); } });
      return o;
    },
    lavender: function (x, y, s) {
      var o = '';
      [[-6, 2, -8], [0, -2, 0], [6, 2, 8]].forEach(function (q) {
        o += stem(x + q[0] * .4 * s, y + 18 * s, x + q[0] * s, y + q[1] * s, q[2] * .3);
        for (var i = 0; i < 6; i++) o += petal(x + q[0] * s + (i % 2 ? 1.3 : -1.3) * s, y + (q[1] + i * 2.6) * s, 1.9 * s, 2.7 * s, q[2] + (i % 2 ? 25 : -25), i < 2 ? '#c2b4e6' : CROPS.lavender.col);
      });
      return o;
    },
    daisy: function (x, y, s) { var o = ''; for (var i = 0; i < 12; i++) { var a = i / 12 * 360, r = a * Math.PI / 180; o += petal(x + Math.cos(r) * 5 * s, y + Math.sin(r) * 5 * s, 4.2 * s, 1.5 * s, a, CROPS.daisy.col, .95); } return o + dot(x, y, 2.6 * s, '#e8b84a', .95) + dot(x - .6 * s, y - .6 * s, 1 * s, '#f6d98a'); },
    tulip: function (x, y, s) {
      var c = CROPS.tulip.col;
      return '<path d="M' + f(x - 6 * s) + ' ' + f(y - 4 * s) + ' Q' + f(x - 7 * s) + ' ' + f(y + 6 * s) + ' ' + f(x) + ' ' + f(y + 7 * s) + ' Q' + f(x + 7 * s) + ' ' + f(y + 6 * s) + ' ' + f(x + 6 * s) + ' ' + f(y - 4 * s) + ' L' + f(x + 3 * s) + ' ' + f(y) + ' L' + f(x) + ' ' + f(y - 6 * s) + ' L' + f(x - 3 * s) + ' ' + f(y) + 'Z" fill="' + c + '" fill-opacity=".85" stroke="' + INK + '" stroke-width=".5"/>' +
        '<path d="M' + f(x - 2 * s) + ' ' + f(y + 1 * s) + ' Q' + f(x) + ' ' + f(y + 5 * s) + ' ' + f(x + 2 * s) + ' ' + f(y + 1 * s) + '" stroke="#d97888" stroke-width=".8" fill="none" opacity=".7"/>';
    },
    gardenia: function (x, y, s) { var o = ''; for (var i = 0; i < 6; i++) o += petal(x + Math.cos(i) * 4 * s, y + Math.sin(i) * 4 * s, 4.6 * s, 2.6 * s, i * 60 + 20, '#fffaf0', .95); for (var j = 0; j < 4; j++) o += petal(x + Math.cos(j * 1.6) * 1.8 * s, y + Math.sin(j * 1.6) * 1.8 * s, 2.8 * s, 1.6 * s, j * 90, '#f3ecd8', .95); return o + dot(x, y, 1.2 * s, '#e8d48a'); },
    osmanthus: function (x, y, s) {
      var o = leafAt(x - 2 * s, y + 3 * s, 9 * s, 200, LEAF2) + leafAt(x + 2 * s, y + 2 * s, 9 * s, -20) + leafAt(x, y - 1 * s, 8 * s, -90, LEAF2) + leafAt(x - 1 * s, y + 4 * s, 7 * s, 130);
      var pts = [[-4, 0], [-2, -3], [1, -2], [3, 1], [-1, 2], [4, -3], [-5, -3], [0, 4], [2, -5], [-3, 5], [5, 3]];
      pts.forEach(function (q) { o += dot(x + q[0] * s, y + q[1] * s, 1.2 * s, CROPS.osmanthus.col, .95) + dot(x + q[0] * s + .3, y + q[1] * s - .3, .45 * s, '#fbe3a0'); });
      return o;
    },
    hydrangea: function (x, y, s) {
      var o = '', cols = ['#a6b6e6', '#c3a6dc', '#b7c9ef', '#d2bce8'];
      for (var i = 0; i < 22; i++) { var a = i * 2.4, r = Math.sqrt(i) * 1.75 * s, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .85;
        o += petal(px - 1 * s, py, 1.3 * s, .9 * s, 0, cols[i % 4], .9) + petal(px + 1 * s, py, 1.3 * s, .9 * s, 0, cols[(i + 1) % 4], .9) + dot(px, py, .45 * s, '#f6f2ff'); }
      return o;
    },
    sunflower: function (x, y, s) { var o = ''; for (var i = 0; i < 16; i++) { var a = i / 16 * 360, r = a * Math.PI / 180; o += petal(x + Math.cos(r) * 7 * s, y + Math.sin(r) * 7 * s, 3.6 * s, 1.6 * s, a, i % 2 ? '#f1c35b' : '#ebb54a', .9); } return o + dot(x, y, 5 * s, '#8a6240', .92) + dot(x - 1, y - 1, 2.4 * s, '#a07a52', .8); },
    peach: function (x, y, s) {
      var o = '<path d="M' + f(x - 10 * s) + ' ' + f(y + 9 * s) + ' Q' + f(x - 2 * s) + ' ' + f(y + 2 * s) + ' ' + f(x + 9 * s) + ' ' + f(y - 7 * s) + '" stroke="#7d5b49" stroke-width="' + f(1.5 * s) + '" fill="none" stroke-linecap="round"/>';
      [[-6, 5], [0, 0], [6, -5], [-2, -4], [4, 3]].forEach(function (q, k) {
        var cx = x + q[0] * s, cy = y + q[1] * s;
        for (var i = 0; i < 5; i++) { var a = i * 72 + k * 13, r = a * Math.PI / 180; o += petal(cx + Math.cos(r) * 2 * s, cy + Math.sin(r) * 2 * s, 1.8 * s, 1.4 * s, a, i % 2 ? '#f4b4c0' : '#f8c7d0', .9); }
        o += dot(cx, cy, .7 * s, '#d9667f');
      });
      return o;
    },
    lotus: function (x, y, s) {
      var o = '<ellipse cx="' + f(x) + '" cy="' + f(y + 8 * s) + '" rx="' + f(12 * s) + '" ry="' + f(3.4 * s) + '" fill="#8fb59a" fill-opacity=".8" stroke="' + INK + '" stroke-width=".5"/>';
      [[-60, 6.5], [60, 6.5], [-30, 7.5], [30, 7.5], [0, 8]].forEach(function (q) {
        var r = (q[0] - 90) * Math.PI / 180, len = q[1] * s, tx = x + Math.cos(r) * len, ty = y + 5 * s + Math.sin(r) * len;
        o += '<path d="M' + f(x) + ' ' + f(y + 5 * s) + ' Q' + f(x + Math.cos(r - .5) * len * .7) + ' ' + f(y + 5 * s + Math.sin(r - .5) * len * .7) + ' ' + f(tx) + ' ' + f(ty) + ' Q' + f(x + Math.cos(r + .5) * len * .7) + ' ' + f(y + 5 * s + Math.sin(r + .5) * len * .7) + ' ' + f(x) + ' ' + f(y + 5 * s) + 'Z" fill="' + (q[0] === 0 ? '#f7c9d4' : CROPS.lotus.col) + '" fill-opacity=".88" stroke="' + INK + '" stroke-width=".5"/>';
      });
      return o + dot(x, y + 3 * s, 1.4 * s, '#efd27a');
    },
    peony: function (x, y, s) {
      var o = '', cols = ['#e98aa8', '#f0a3bb', '#f6bfd0'];
      [9, 6.5, 4].forEach(function (R, k) { for (var i = 0; i < 9 - k * 2; i++) { var a = i / (9 - k * 2) * 360 + k * 20, r = a * Math.PI / 180; o += petal(x + Math.cos(r) * R * .55 * s, y + Math.sin(r) * R * .5 * s, R * .55 * s, R * .38 * s, a, cols[k], .82); } });
      return o + dot(x, y, 1.6 * s, '#f1d27c');
    },
    rose: function (x, y, s) {
      var c = CROPS.rose.col;
      return dot(x, y, 7 * s, c, .85) + '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(7 * s) + '" fill="none" stroke="' + INK + '" stroke-width=".5"/>' +
        '<path d="M' + f(x - 4 * s) + ' ' + f(y) + ' Q' + f(x) + ' ' + f(y - 6 * s) + ' ' + f(x + 4 * s) + ' ' + f(y) + ' Q' + f(x) + ' ' + f(y + 4 * s) + ' ' + f(x - 2 * s) + ' ' + f(y) + ' Q' + f(x) + ' ' + f(y - 3 * s) + ' ' + f(x + 1.5 * s) + ' ' + f(y) + '" stroke="#b55a70" stroke-width=".9" fill="none" opacity=".8"/>' +
        petal(x - 5 * s, y + 4 * s, 3 * s, 1.8 * s, 30, '#e39aab', .7) + petal(x + 5 * s, y + 4 * s, 3 * s, 1.8 * s, -30, '#e39aab', .7);
    }
  };
  function bush(crop, big) {
    var o = '<ellipse cx="30" cy="41" rx="' + (big ? 16 : 12) + '" ry="' + (big ? 10 : 8) + '" fill="' + LEAF2 + '" fill-opacity=".7"/>' + leafAt(22, 40, 11, 200) + leafAt(38, 40, 11, -20) + leafAt(30, 38, 10, -90, LEAF2) + leafAt(26, 42, 9, 150) + leafAt(34, 42, 9, 30);
    var fr = big ? [[22, 43], [31, 46], [39, 42], [28, 36], [35, 35]] : [[25, 43], [35, 43]];
    fr.forEach(function (q) {
      if (crop === 'strawberry') {
        o += '<path d="M' + q[0] + ' ' + (q[1] + 4.6) + ' C' + (q[0] - 4.4) + ' ' + q[1] + ' ' + (q[0] - 3) + ' ' + (q[1] - 3) + ' ' + q[0] + ' ' + (q[1] - 2.6) + ' C' + (q[0] + 3) + ' ' + (q[1] - 3) + ' ' + (q[0] + 4.4) + ' ' + q[1] + ' ' + q[0] + ' ' + (q[1] + 4.6) + 'Z" fill="' + (big ? CROPS.strawberry.col : '#f2c0c3') + '" fill-opacity=".9" stroke="' + INK + '" stroke-width=".45"/>';
        if (big) o += dot(q[0] - 1, q[1], .4, '#fbe7a6') + dot(q[0] + 1, q[1] + 1.5, .4, '#fbe7a6') + dot(q[0] + .5, q[1] - 1, .4, '#fbe7a6');
        o += leafAt(q[0] - 1.6, q[1] - 2.6, 2.6, -150, LEAF2) + leafAt(q[0] + 1.6, q[1] - 2.6, 2.6, -30, LEAF2);
      } else {
        o += dot(q[0], q[1], big ? 4.2 : 3, big ? CROPS.tomato.col : '#b9d79a', .9) + '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (big ? 4.2 : 3) + '" fill="none" stroke="' + INK + '" stroke-width=".45"/>' + dot(q[0] - 1.3, q[1] - 1.3, 1, '#ffffff', .45) + leafAt(q[0], q[1] - 3.6, 2.4, -120, LEAF2) + leafAt(q[0], q[1] - 3.6, 2.4, -60, LEAF2);
      }
    });
    return o;
  }
  function treeArt(crop, st) {
    var c = CROPS[crop], o = '';
    if (crop === 'blueberry') {
      o = bush('x', true).replace(/<path d="M[^"]*Z" fill="#[0-9a-f]{6}"[^>]*\/>|<circle[^>]*\/>/g, '');
      var bb = [[21, 40], [27, 44], [34, 41], [39, 45], [30, 37], [24, 47], [36, 36]];
      if (st === 3) bb.forEach(function (q) { o += dot(q[0], q[1], 2.4, c.col, .92) + dot(q[0] - .7, q[1] - .7, .7, '#d9e0f6', .8) + dot(q[0] + .4, q[1] - 1.9, .5, '#3e4a7e'); });
      else bb.slice(0, 3).forEach(function (q) { dot(q[0], q[1], 1.6, '#cfe0b8'); o += dot(q[0], q[1], 1.6, '#cfe0b8'); });
      return o;
    }
    var crown = crop === 'orange' ? '#7f9f6a' : crop === 'cherry' ? '#86a873' : '#93ad7f';
    o += '<path d="M30 54 L30 34 M30 40 L24 32 M30 37 L36 30" stroke="#8a6a52" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    [[30, 22, 15, 12], [21, 27, 9, 8], [39, 26, 9, 8], [30, 15, 9, 7]].forEach(function (q, i) { o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + q[3] + '" fill="' + (i % 2 ? LEAF : crown) + '" fill-opacity=".8" stroke="' + INK + '" stroke-width=".45"/>'; });
    var fr = [[22, 26], [30, 30], [38, 25], [27, 18], [35, 18], [31, 23]];
    if (st === 3) fr.forEach(function (q) {
      if (crop === 'cherry') o += '<path d="M' + q[0] + ' ' + (q[1] - 4) + ' q2 -2 4 -1" stroke="#6b8a55" stroke-width=".7" fill="none"/>' + dot(q[0] - 1, q[1], 2, c.col, .95) + dot(q[0] + 2, q[1] + .5, 2, c.col, .95) + dot(q[0] - 1.6, q[1] - .6, .5, '#fff', .6);
      else o += dot(q[0], q[1], crop === 'momo' ? 3 : 2.8, c.col, .93) + (crop === 'momo' ? '<path d="M' + q[0] + ' ' + (q[1] - 2.6) + ' q1 2.6 0 5.2" stroke="#e48a7c" stroke-width=".6" fill="none"/>' : '') + dot(q[0] - .9, q[1] - .9, .8, '#fff', .55);
    });
    else if (crop === 'momo' || crop === 'cherry') fr.slice(0, 4).forEach(function (q) { o += petal(q[0], q[1], 1.6, 1.2, 0, crop === 'cherry' ? '#fbe3ea' : '#f8c7d0', .9); });
    return o;
  }
  function plantArt(crop, st) {
    var c = CROPS[crop];
    if (c.tree && st >= 2) return treeArt(crop, st);
    if (crop === 'wheat' && st >= 2) {
      var w = '';
      [[22, -8], [27, -3], [32, 2], [37, 7], [29, 0]].forEach(function (q) {
        var x = 30 + (q[0] - 30) * .9, top = st === 3 ? 12 : 20;
        w += '<path d="M' + x + ' 52 Q' + (x + q[1] * .2) + ' 34 ' + (x + q[1] * .4) + ' ' + top + '" stroke="' + (st === 3 ? '#c9a55a' : STEM) + '" stroke-width="1.3" fill="none"/>';
        for (var i = 0; i < 5; i++) w += petal(x + q[1] * .4 + (i % 2 ? 1.4 : -1.4), top + 2 + i * 2.6, 1.3, 2.4, i % 2 ? 25 : -25, st === 3 ? c.col : '#c8d79a', .9);
      });
      return w;
    }
    if (st === 0) return '<ellipse cx="30" cy="47" rx="12" ry="3.4" fill="#7a5c43" fill-opacity=".25"/>' + dot(26, 45.5, 1.6, '#6b4a2f') + dot(32.5, 46.4, 1.5, '#6b4a2f') + dot(29.6, 44, 1.3, '#6b4a2f');
    if (st === 1) return stem(30, 50, 30, 34) + leafAt(30, 38, 11, 200) + leafAt(30, 37, 11, -20, LEAF2);
    if (crop === 'strawberry' || crop === 'tomato') return bush(crop, st === 3);
    if (st === 2) {
      return stem(30, 52, 30, 26, 2) + leafAt(30, 44, 10, 200) + leafAt(30, 40, 10, -20, LEAF2) + leafAt(30, 34, 7, 210, LEAF2) +
        '<ellipse cx="30" cy="24" rx="3.2" ry="4.6" fill="' + LEAF + '" fill-opacity=".9" stroke="' + INK + '" stroke-width=".45"/>' + '<ellipse cx="30" cy="22.4" rx="1.9" ry="2.6" fill="' + c.col + '" fill-opacity=".9"/>';
    }
    var o = '';
    if (crop === 'lavender') return HEAD.lavender(30, 14, 1.4);
    if (crop === 'lotus') return HEAD.lotus(30, 30, 1.6);
    if (crop === 'peach') return HEAD.peach(30, 26, 1.8);
    if (crop === 'osmanthus') return stem(30, 54, 30, 30) + HEAD.osmanthus(30, 24, 1.9);
    if (crop === 'hydrangea') return stem(30, 54, 30, 28) + leafAt(30, 44, 11, 200) + leafAt(30, 40, 11, -20, LEAF2) + HEAD.hydrangea(30, 21, 1.5);
    o = stem(30, 54, 30, 24, 2) + leafAt(30, 46, 11, 200) + leafAt(30, 40, 11, -20, LEAF2) + leafAt(30, 34, 8, 205, LEAF2);
    if (crop === 'gypso') return stem(30, 54, 30, 30) + HEAD.gypso(30, 24, 1.5);
    var sz = { daisy: 1.5, tulip: 1.45, gardenia: 1.5, sunflower: 1.4, peony: 1.55, rose: 1.45 }[crop] || 1.35;
    return o + HEAD[crop](30, crop === 'sunflower' ? 18 : 20, sz);
  }
  function plantSvg(crop, st, bug) {
    var s = plantArt(crop, st);
    if (bug) s += '<g transform="translate(41 30)"><ellipse rx="4.6" ry="3.2" fill="#9cbf6a" stroke="' + INK + '" stroke-width=".5"/><circle cx="4.6" cy="-.8" r="2.2" fill="#7fa253"/><circle cx="5.4" cy="-1.4" r=".6" fill="#fff"/></g>';
    return '<svg viewBox="0 0 60 56" aria-hidden="true"><g filter="url(#cxwc)">' + s + '</g></svg>';
  }
  /* 花束：flowers = ['rose','lavender',...]（最多 9 朵） */
  function bouquetArt(flowers, wrap, ribbon, hi) {
    var W = WRAPS[wrap] || WRAPS.kraft, R = RIBBONS[ribbon] || RIBBONS.violet, n = flowers.length, o = '';
    // 背後的包裝紙
    o += '<path d="M28 70 L60 150 L92 70 Q60 58 28 70Z" fill="' + W[2] + '" fill-opacity=".9" stroke="' + INK + '" stroke-width=".7"/>';
    // 花頭排成扇形：花越少越大、越靠近包裝紙
    var pos = [], rows = n <= 3 ? [n] : n <= 6 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [Math.ceil(n / 3), Math.ceil(n / 3), n - 2 * Math.ceil(n / 3)];
    var base = rows.length === 1 ? 60 : rows.length === 2 ? 50 : 42, sc = n <= 2 ? 1.45 : n <= 3 ? 1.3 : n <= 6 ? 1.15 : 1.05, k = 0;
    rows.forEach(function (cnt, r) {
      for (var j = 0; j < cnt; j++) { var tt = cnt === 1 ? .5 : j / (cnt - 1), spread = (n <= 3 ? 34 : 44) - r * 8; pos.push([60 - spread / 2 + tt * spread + (r % 2 ? 4 : 0), base + r * 13 - Math.sin(tt * Math.PI) * (cnt > 1 ? 7 : 0), k++]); }
    });
    // 花莖：每朵花都接到包裝紙裡
    pos.forEach(function (p) { o += '<path d="M' + f(p[0]) + ' ' + f(p[1] + 4) + ' Q' + f((p[0] + 60) / 2) + ' ' + f((p[1] + 132) / 2) + ' 60 132" stroke="' + STEM + '" stroke-width="1.5" fill="none"/>'; });
    pos.forEach(function (p) {
      var cr = flowers[p[2]];
      o += '<g data-slot="' + p[2] + '">' + (hi === p[2] ? '<circle cx="' + f(p[0]) + '" cy="' + f(p[1] - 2) + '" r="' + f(11 * sc) + '" fill="#fff6c8" fill-opacity=".7" stroke="#d6a744" stroke-width="1.2" stroke-dasharray="2 2"/>' : '') + '<circle cx="' + f(p[0]) + '" cy="' + f(p[1] - 2) + '" r="' + f(10 * sc) + '" fill="transparent"/>';
      o += leafAt(p[0], p[1] + 9, 9 * sc, p[0] < 60 ? 205 : -25, p[2] % 2 ? LEAF : LEAF2);
      if (cr === 'lavender') o += HEAD.lavender(p[0], p[1] - 10 * sc, .9 * sc);
      else if (cr === 'lotus') o += HEAD.lotus(p[0], p[1] - 4, sc);
      else if (cr === 'gypso') o += HEAD.gypso(p[0], p[1], .95 * sc);
      else o += HEAD[cr] ? HEAD[cr](p[0], p[1], (cr === 'hydrangea' ? .95 : 1.05) * sc) : '';
      o += '</g>';
    });
    // 前面的包裝紙
    o += '<path d="M24 76 L60 152 L96 76 L82 84 L60 78 L38 84 Z" fill="' + W[1] + '" fill-opacity=".93" stroke="' + INK + '" stroke-width=".7"/>' +
      '<path d="M38 84 L60 152 M82 84 L60 152" stroke="' + W[2] + '" stroke-width="1" fill="none" opacity=".8"/>';
    // 緞帶
    o += '<path d="M50 118 Q60 114 70 118 L69 124 Q60 120 51 124Z" fill="' + R[1] + '" stroke="' + INK + '" stroke-width=".5"/>' +
      '<path d="M60 121 Q46 108 44 118 Q46 126 60 121Z M60 121 Q74 108 76 118 Q74 126 60 121Z" fill="' + R[1] + '" fill-opacity=".92" stroke="' + INK + '" stroke-width=".5"/>' +
      '<path d="M58 123 L52 138 M62 123 L68 138" stroke="' + R[1] + '" stroke-width="2.4" stroke-linecap="round"/>' + dot(60, 121, 2.2, R[1]);
    return o;
  }
  function bouquetSvg(b, standalone) {
    var body = '<g filter="url(#cxwc)">' + bouquetArt(b.flowers, b.wrap, b.ribbon, b.hi) + '</g>';
    if (!standalone) return '<svg viewBox="0 0 120 160" aria-hidden="true">' + body + '</svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="360" height="480"><defs>' + WC_DEFS + '</defs><rect width="120" height="160" fill="#f7f1e6"/>' + body + '</svg>';
  }
  function bouquetPng(b) {
    return new Promise(function (res) {
      try {
        var img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bouquetSvg(b, true));
        img.onload = function () { try { var c = document.createElement('canvas'); c.width = 360; c.height = 480; var x = c.getContext('2d'); x.drawImage(img, 0, 0, 360, 480); res(c.toDataURL('image/jpeg', .86)); } catch (e) { res(null); } };
        img.onerror = function () { res(null); }; img.src = url;
      } catch (e) { res(null); }
    });
  }
  /* ================= 花園畫面 ================= */
  var recentGift = [];
  var gm = null, gTab = 'field', sel = -1, giftTo = null, timer = null;
  function gOpen(fromHome) {
    var g = G(); if (!g) return;
    if (!gm) {
      gm = A.makeModal('cx-garden-modal', 'fa-seedling', '我們的花園');
      gm.onBack = function () { gm.close(); homeOpen(); return true; };
      gm.onClose = function () { clearInterval(timer); timer = null; };
      gm.body.addEventListener('click', gClick);
      gm.body.addEventListener('input', function (e) { if (e.target.id === 'cx-bq-name') bq.name = e.target.value; });
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
    var tabs = [['field', '田地'], ['inv', '倉庫'], ['bq', '花束'], ['kit', '廚房'], ['dex', '圖鑑'], ['log', '紀錄']];
    var h = '<div class="cx-g-top">' + coinsHtml(g) + '<div class="cx-g-tabs">' + tabs.map(function (t) { return '<button type="button" data-gt="' + t[0] + '" class="' + (gTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    if (gTab === 'field') h += fieldHtml(g, now);
    else if (gTab === 'inv') h += invHtml(g);
    else if (gTab === 'bq') h += bqHtml(g);
    else if (gTab === 'kit') h += kitchenHtml(g);
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
      return '<div class="cx-g-panel"><div class="cx-g-pt">要種什麼？</div><div class="seeds">' + ORDER.map(function (k) {
        var c = CROPS[k];
        return '<button type="button" class="cx-g-seed" data-seed="' + k + '"' + (g.coins < c.cost ? ' disabled' : '') + '>' + plantSvg(k, 3) + '<span class="nm">' + (c.seed || c.n) + '</span><span class="cx-muted">' + (c.tree ? dur(c.grow) + ' 結果，之後每 ' + dur(c.grow / 2) + ' 再收' : dur(c.grow) + ' · 收 ' + c.yield + c.unit) + '</span><span class="pr">🪙 ' + c.cost + '</span></button>';
      }).join('') + '</div></div>';
    }
    var c = CROPS[p.crop], wet = (p.wetUntil || 0) > now;
    return '<div class="cx-g-panel"><div class="cx-g-pt">' + (c.seed || c.n) + (p.by ? '<span class="cx-muted"> · ' + esc(p.by) + ' 種的</span>' : '') + '</div>' +
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
    var dd = g.dexDish || {};
    var rec = '<div class="cx-g-pt" style="margin-top:6px">食譜</div><div class="cx-g-dex">' + RECIPES.map(function (r) { var d = dd[r.k]; return '<div class="cx-g-dx' + (d ? '' : ' no') + '">' + dishSvg(r.k) + '<b>' + (d ? r.n : '？？？') + '</b><span class="cx-muted">' + (d ? '做過 ' + d.n + ' 次' : '還沒做過') + '</span></div>'; }).join('') + '</div>';
    return '<div class="cx-g-pt">花與作物</div><div class="cx-g-dex">' + ORDER.map(function (k) {
      var c = CROPS[k], d = g.dex[k];
      return '<div class="cx-g-dx' + (d ? '' : ' no') + '">' + plantSvg(k, 3) + '<b>' + (d ? c.n : '？？？') + '</b>' + (d && c.lang ? '<span class="lang">花語：' + c.lang + '</span>' : '') + '<span class="cx-muted">' + (d ? '收成 ' + d.n + ' 次 · ' + (new Date(d.first).getMonth() + 1) + '/' + new Date(d.first).getDate() + ' 起' : dur(c.grow) + ' 長大') + '</span></div>';
    }).join('') + '</div>' + rec;
  }
  /* ---------- 花束 ---------- */
  var bq = { sel: [], wrap: 'kraft', ribbon: 'violet', view: 'make', open: null, hi: -1 }, BQ_MAX = 12;
  function whoRow(lbl) {
    var ppl = A.groupOn() ? A.groupPeople().filter(function (p) { return p.name.indexOf('系統') < 0; }) : [];
    if (!giftTo || (ppl.length && !ppl.some(function (p) { return p.name === giftTo; }))) giftTo = A.pname();
    return ppl.length > 1 ? '<div class="cx-who-t">' + lbl + '</div>' + A.whoChips('cx-g-who', giftTo) : '';
  }
  function bqPrice(b) { return Math.round(b.flowers.reduce(function (s2, k) { return s2 + (CROPS[k] ? CROPS[k].price : 0); }, 0) * 1.5) + 5; }
  function bqCount(list) { var m = {}; list.forEach(function (k) { m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return CROPS[k].n + '×' + m[k]; }).join('、'); }
  function bqHtml(g) {
    g.bouquets = g.bouquets || [];
    var h = '<div class="cx-g-sub"><button type="button" data-bv="make" class="' + (bq.view === 'make' ? 'on' : '') + '">包花束</button><button type="button" data-bv="list" class="' + (bq.view !== 'make' ? 'on' : '') + '">我的花束（' + g.bouquets.length + '）</button></div>';
    if (bq.view === 'one' && bq.open) {
      var b = g.bouquets.find(function (x) { return x.id === bq.open; });
      if (b) return h + '<div class="cx-g-bq1"><div class="pv">' + bouquetSvg(b) + '</div><b>' + esc(b.name || '無名花束') + '</b><span class="cx-muted">' + bqCount(b.flowers) + '</span><span class="cx-muted">' + new Date(b.t).toLocaleDateString('zh-TW') + (b.to ? ' · 送給了 ' + esc(b.to) : ' · 還留在身邊') + '</span>' +
        (b.reply ? '<p class="rp">' + esc(b.to) + '：「' + esc(b.reply) + '」</p>' : '') +
        (b.to ? '' : whoRow('送給') + '<div class="cx-g-acts"><button type="button" class="cx-btn pri" data-bqsend="' + b.id + '"><i class="fas fa-gift"></i> 送出去</button><button type="button" class="cx-btn" data-bqsell="' + b.id + '">賣掉 🪙 ' + bqPrice(b) + '</button></div>') + '</div>';
      bq.view = 'list';
    }
    if (bq.view === 'list') {
      if (!g.bouquets.length) return h + '<p class="cx-muted" style="text-align:center;padding:20px 0">還沒有包過花束。</p>';
      return h + '<div class="cx-g-bqs">' + g.bouquets.slice().reverse().map(function (b) { return '<button type="button" class="cx-g-bqc" data-bqopen="' + b.id + '">' + bouquetSvg(b) + '<b>' + esc(b.name || '無名花束') + '</b><span class="cx-muted">' + (b.to ? '給 ' + esc(b.to) : '收藏中') + '</span></button>'; }).join('') + '</div>';
    }
    var flowers = ORDER.filter(function (k) { return CROPS[k].flower; });
    var used = {}; bq.sel.forEach(function (k) { used[k] = (used[k] || 0) + 1; });
    var have = flowers.filter(function (k) { return (g.inv[k] || 0) > 0; });
    h += '<div class="cx-g-bqmk"><div class="pv">' + (bq.sel.length ? bouquetSvg({ flowers: bq.sel, wrap: bq.wrap, ribbon: bq.ribbon, hi: bq.hi }) : '<div class="cx-muted empty">從下面挑花<br>（最多 12 朵）</div>') + '</div>' +
      '<div class="opts"><div class="cx-g-pt">包裝紙</div><div class="sw">' + Object.keys(WRAPS).map(function (k) { return '<button type="button" data-wrap="' + k + '" class="' + (bq.wrap === k ? 'on' : '') + '" title="' + WRAPS[k][0] + '"><i style="background:' + WRAPS[k][1] + '"></i>' + WRAPS[k][0] + '</button>'; }).join('') + '</div>' +
      '<div class="cx-g-pt">緞帶</div><div class="sw">' + Object.keys(RIBBONS).map(function (k) { return '<button type="button" data-rib="' + k + '" class="' + (bq.ribbon === k ? 'on' : '') + '"><i style="background:' + RIBBONS[k][1] + '"></i>' + RIBBONS[k][0] + '</button>'; }).join('') + '</div></div></div>';
    if (bq.sel.length > 1) h += '<div class="cx-g-bqtip cx-muted">' + (bq.hi >= 0 ? '再點一朵，兩朵就會交換位置' : '點預覽裡的花，再點另一朵，就能交換位置') + '　<a href="#" data-bqshuffle>隨機排一下</a></div>';
    h += '<div class="cx-g-pt">挑花' + (bq.sel.length ? '<span class="cx-muted">　已選 ' + bq.sel.length + ' 朵 · <a href="#" data-bqclear>清空</a></span>' : '') + '</div>';
    if (!have.length) h += '<p class="cx-muted">倉庫裡還沒有花。去田裡種一些，收成後就能包花束了。</p>';
    else h += '<div class="cx-g-pick">' + have.map(function (k) { var left = (g.inv[k] || 0) - (used[k] || 0); return '<button type="button" data-pick="' + k + '"' + (left <= 0 || bq.sel.length >= BQ_MAX ? ' disabled' : '') + '>' + plantSvg(k, 3) + '<span>' + CROPS[k].n + '</span><small>' + left + '</small>' + (used[k] ? '<em data-unpick="' + k + '">−' + used[k] + '</em>' : '') + '</button>'; }).join('') + '</div>';
    h += '<input class="cx-in" id="cx-bq-name" maxlength="20" placeholder="幫花束取個名字（可以不填）" value="' + esc(bq.name || '') + '">' +
      '<div class="cx-g-acts"><button type="button" class="cx-btn pri" data-bqmake' + (bq.sel.length ? '' : ' disabled') + '><i class="fas fa-ribbon"></i> 包好了</button></div>';
    return h;
  }
  function bqSend(g, b) {
    var to = A.groupOn() ? (giftTo || A.pname()) : A.pname();
    b.to = to; b.sentAt = Date.now();
    var cnt = {}; b.flowers.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var main = Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; })[0], c = CROPS[main];
    var reply = Math.random() < .55 && c.lang ? c.n + '的花語是「' + c.lang + '」……妳想跟我說的，我都收到了。' : pick(BQ_LINES);
    b.reply = reply;
    log(g, '💐 把花束「' + (b.name || '無名花束') + '」送給了 ' + to); save();
    var who = (to === A.pname() && !A.groupOn()) ? '你' : to;
    bouquetPng(b).then(function (img) {
      if (img && typeof addMessage === 'function') addMessage({ id: Date.now(), sender: 'user', text: '', image: img, timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' });
      A.iSay('（送了一束花給' + who + '：' + bqCount(b.flowers) + (b.name ? '，叫「' + b.name + '」' : '') + '）');
      setTimeout(function () { if (A.groupOn()) A.speakAs(to, 4000); A.partnerSays(reply, A.groupOn() ? to : null); }, 1800 + Math.random() * 1500);
    });
    toast('花束送出去了 💐', 'success');
  }

  /* ================= 廚房 ================= */
  var PANTRY = { egg: ['雞蛋', 3], milk: ['牛奶', 4], butter: ['奶油', 5], sugar: ['糖', 2] };
  var RECIPES = [
    { k: 'cookie', n: '薰衣草餅乾', need: { lavender: 2, wheat: 2, butter: 1, sugar: 1 }, price: 30 },
    { k: 'tomegg', n: '番茄炒蛋', need: { tomato: 2, egg: 2 }, price: 30 },
    { k: 'jelly', n: '橘子果凍', need: { orange: 3, sugar: 1 }, price: 42 },
    { k: 'osm', n: '桂花糕', need: { osmanthus: 3, wheat: 2, sugar: 1 }, price: 45 },
    { k: 'muffin', n: '藍莓馬芬', need: { blueberry: 5, wheat: 2, egg: 1, milk: 1 }, price: 55 },
    { k: 'tart', n: '桃子塔', need: { momo: 3, wheat: 2, butter: 1, sugar: 1 }, price: 65 },
    { k: 'cake', n: '草莓蛋糕', need: { strawberry: 4, wheat: 2, egg: 2, milk: 1, sugar: 1 }, price: 70 },
    { k: 'pie', n: '櫻桃派', need: { cherry: 6, wheat: 2, butter: 1, sugar: 1 }, price: 72 },
    { k: 'fruitcake', n: '水果蛋糕', need: { strawberry: 2, momo: 2, orange: 2, blueberry: 3, wheat: 3, egg: 2, milk: 1, butter: 1, sugar: 1 }, price: 160 }
  ];
  var DISH_LINES = {
    cookie: ['薰衣草餅乾……好香，配茶剛好。', '一口一個，停不下來。'],
    tomegg: ['番茄炒蛋！是家的味道。', '妳做的比我做的好吃，不准跟別人說。'],
    jelly: ['QQ 的，好可愛，跟妳一樣。', '冰冰涼涼的，夏天就想吃這個。'],
    osm: ['桂花糕……一咬下去整個嘴巴都是秋天。', '軟軟甜甜的，像妳。'],
    muffin: ['剛出爐的？好香。', '早餐就吃這個，再配一杯咖啡和妳。'],
    tart: ['桃子塔！酥酥的，好厲害。', '這麼漂亮，我捨不得切。'],
    cake: ['草莓蛋糕……今天是什麼日子嗎？', '第一口給妳，張嘴。'],
    pie: ['櫻桃派，好有大人的感覺。', '烤得剛剛好，妳是不是偷偷練習過？'],
    fruitcake: ['這麼大一個水果蛋糕……妳一定忙了好久吧。謝謝妳，我的乖寶。', '這是我收過最好的禮物。我們一起吃。', '整個果園的水果都在這裡了……我們家乖寶最厲害。']
  };
  function iname(k) { return CROPS[k] ? CROPS[k].n : PANTRY[k] ? PANTRY[k][0] : k; }
  function haveN(g, k) { return PANTRY[k] ? (g.pantry[k] || 0) : (g.inv[k] || 0); }
  function canCook(g, r) { return Object.keys(r.need).every(function (k) { return haveN(g, k) >= r.need[k]; }); }
  function dishArt(k) {
    var o = '<ellipse cx="30" cy="46" rx="22" ry="5" fill="#f4efe6" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="45.4" rx="17" ry="3.4" fill="#e9e1d2" fill-opacity=".7"/>';
    var cream = '#fff7ea';
    if (k === 'cake' || k === 'fruitcake') {
      var big = k === 'fruitcake';
      o += '<path d="M12 44 L12 30 Q30 24 48 30 L48 44 Q30 48 12 44Z" fill="' + cream + '" stroke="' + INK + '" stroke-width=".6"/><path d="M12 37 Q30 41 48 37" stroke="#f0c2c8" stroke-width="2.4" fill="none"/>' +
        '<ellipse cx="30" cy="29" rx="18" ry="5" fill="#fffdf6" stroke="' + INK + '" stroke-width=".6"/>';
      if (big) o += '<path d="M18 28 L18 20 Q30 16 42 20 L42 28" fill="' + cream + '" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="19.5" rx="12" ry="3.4" fill="#fffdf6" stroke="' + INK + '" stroke-width=".6"/>';
      var top = big ? 18 : 27;
      [[22, top], [30, top - 1.5], [38, top]].forEach(function (q) { o += '<path d="M' + q[0] + ' ' + (q[1] + 3) + ' C' + (q[0] - 3) + ' ' + q[1] + ' ' + (q[0] - 2) + ' ' + (q[1] - 2.4) + ' ' + q[0] + ' ' + (q[1] - 2.2) + ' C' + (q[0] + 2) + ' ' + (q[1] - 2.4) + ' ' + (q[0] + 3) + ' ' + q[1] + ' ' + q[0] + ' ' + (q[1] + 3) + 'Z" fill="' + CROPS.strawberry.col + '" stroke="' + INK + '" stroke-width=".4"/>'; });
      if (big) { o += dot(26, 29, 2, CROPS.orange.col) + dot(34, 29.4, 2, CROPS.orange.col) + dot(20, 30, 1.6, CROPS.blueberry.col) + dot(40, 30, 1.6, CROPS.blueberry.col) + dot(30, 30.5, 1.6, CROPS.blueberry.col) + petal(24, 21, 2.4, 1.6, 20, CROPS.momo.col) + petal(36, 21, 2.4, 1.6, -20, CROPS.momo.col); }
    } else if (k === 'tart' || k === 'pie') {
      o += '<ellipse cx="30" cy="38" rx="17" ry="6.5" fill="#e3b77c" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="36.5" rx="14" ry="5" fill="' + (k === 'pie' ? '#b8394d' : '#f6c9a0') + '"/>';
      if (k === 'pie') { for (var i = 0; i < 4; i++) o += '<path d="M' + (19 + i * 6) + ' 32 L' + (21 + i * 6) + ' 41" stroke="#e8c48c" stroke-width="2" stroke-linecap="round"/><path d="M17 ' + (33 + i * 2.4) + ' L43 ' + (33 + i * 2.4) + '" stroke="#e8c48c" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>'; }
      else { for (var j = 0; j < 7; j++) { var a = j / 7 * Math.PI * 2; o += petal(30 + Math.cos(a) * 8, 36.5 + Math.sin(a) * 3, 4, 1.6, a * 180 / Math.PI, CROPS.momo.col, .95); } }
    } else if (k === 'jelly') {
      o += '<path d="M17 44 Q16 26 30 25 Q44 26 43 44Z" fill="' + CROPS.orange.col + '" fill-opacity=".72" stroke="' + INK + '" stroke-width=".6"/><path d="M21 34 Q22 29 27 28" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/>' + petal(30, 25, 3, 1.4, 0, '#f6c27c');
    } else if (k === 'muffin') {
      o += '<path d="M18 30 L21 45 L39 45 L42 30Z" fill="#c9a2d8" stroke="' + INK + '" stroke-width=".6"/><path d="M21 31 L23 44 M26 31 L27 44 M31 31 L31 44 M36 31 L35 44" stroke="#b08bc2" stroke-width=".8"/><ellipse cx="30" cy="28" rx="15" ry="8" fill="#e2b882" stroke="' + INK + '" stroke-width=".6"/>' + dot(24, 26, 1.6, CROPS.blueberry.col) + dot(31, 24, 1.6, CROPS.blueberry.col) + dot(36, 28, 1.6, CROPS.blueberry.col) + dot(28, 30, 1.6, CROPS.blueberry.col);
    } else if (k === 'cookie') {
      [[22, 40], [36, 41], [29, 34]].forEach(function (q) { o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="8" ry="5" fill="#e8c38c" stroke="' + INK + '" stroke-width=".6"/>' + dot(q[0] - 2, q[1] - 1, .9, CROPS.lavender.col) + dot(q[0] + 2, q[1] + 1, .9, CROPS.lavender.col) + dot(q[0] + 3, q[1] - 1.5, .9, CROPS.lavender.col); });
    } else if (k === 'osm') {
      [[22, 38], [38, 38], [30, 31]].forEach(function (q) { o += '<path d="M' + (q[0] - 7) + ' ' + (q[1] - 3) + ' L' + (q[0] + 7) + ' ' + (q[1] - 3) + ' L' + (q[0] + 7) + ' ' + (q[1] + 5) + ' L' + (q[0] - 7) + ' ' + (q[1] + 5) + 'Z" fill="#fbf3dc" stroke="' + INK + '" stroke-width=".6"/><rect x="' + (q[0] - 7) + '" y="' + (q[1] - 3) + '" width="14" height="2.4" fill="#f2d67e" opacity=".8"/>' + dot(q[0] - 3, q[1] - 2, .7, CROPS.osmanthus.col) + dot(q[0] + 2, q[1] - 2.2, .7, CROPS.osmanthus.col); });
    } else if (k === 'tomegg') {
      o += petal(24, 40, 7, 4, 10, '#f6d76b', .95) + petal(35, 41, 7, 4, -15, '#f3cf5c', .95) + petal(30, 36, 6, 3.6, 0, '#f8de80', .95) + petal(26, 37, 3, 2.4, 30, CROPS.tomato.col) + petal(34, 37, 3.4, 2.4, -20, CROPS.tomato.col) + petal(30, 42, 3, 2, 0, '#d9573e') + dot(22, 36, .8, '#7fa37a') + dot(37, 37, .8, '#7fa37a');
    }
    return o;
  }
  function dishSvg(k, standalone) {
    var body = '<g filter="url(#cxwc)">' + dishArt(k) + '</g>';
    if (!standalone) return '<svg viewBox="0 0 60 56" aria-hidden="true">' + body + '</svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 56" width="360" height="336"><defs>' + WC_DEFS + '</defs><rect width="60" height="56" fill="#f7f1e6"/>' + body + '</svg>';
  }
  function svgPng(svg, w, h) {
    return new Promise(function (res) {
      try { var img = new Image(); img.onload = function () { try { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); res(c.toDataURL('image/jpeg', .86)); } catch (e) { res(null); } }; img.onerror = function () { res(null); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); } catch (e) { res(null); }
    });
  }
  function kitchenHtml(g) {
    g.pantry = g.pantry || {}; g.dishes = g.dishes || {};
    var h = '<div class="cx-g-pt">食材櫃<span class="cx-muted">　以後養了雞和牛就不用買了</span></div><div class="cx-k-pan">' + Object.keys(PANTRY).map(function (k) {
      return '<div class="it"><b>' + PANTRY[k][0] + '</b><span>' + (g.pantry[k] || 0) + '</span><button type="button" class="cx-btn" data-buy="' + k + '"' + (g.coins < PANTRY[k][1] ? ' disabled' : '') + '>買 🪙' + PANTRY[k][1] + '</button></div>';
    }).join('') + '</div>';
    var made = RECIPES.filter(function (r) { return g.dishes[r.k] > 0; });
    if (made.length) h += '<div class="cx-g-pt">甜點盒</div>' + whoRow('端給') + made.map(function (r) {
      return '<div class="cx-g-item">' + dishSvg(r.k) + '<div class="tx"><b>' + r.n + '</b> × ' + g.dishes[r.k] + '<div class="cx-muted">賣掉 🪙 ' + r.price + '</div></div><button type="button" class="cx-btn pri" data-dgift="' + r.k + '">端給' + (A.groupOn() ? '' : '他') + '</button><button type="button" class="cx-btn" data-dsell="' + r.k + '">賣</button></div>';
    }).join('');
    h += '<div class="cx-g-pt">食譜</div><div class="cx-k-rec">' + RECIPES.map(function (r) {
      var ok = canCook(g, r);
      return '<div class="cx-k-r' + (ok ? ' ok' : '') + '">' + dishSvg(r.k) + '<div class="tx"><b>' + r.n + '</b><div class="need">' + Object.keys(r.need).map(function (k) { var hv = haveN(g, k), en = hv >= r.need[k]; return '<span class="' + (en ? 'en' : '') + '">' + iname(k) + ' ' + Math.min(hv, r.need[k]) + '/' + r.need[k] + '</span>'; }).join('') + '</div></div><button type="button" class="cx-btn pri" data-cook="' + r.k + '"' + (ok ? '' : ' disabled') + '>做</button></div>';
    }).join('') + '</div>';
    return h;
  }
  function kitchenClick(e, g) {
    var b;
    if ((b = e.target.closest('[data-buy]'))) { var k = b.dataset.buy; if (g.coins >= PANTRY[k][1]) { g.coins -= PANTRY[k][1]; g.pantry[k] = (g.pantry[k] || 0) + 1; save(); render(); } return true; }
    if ((b = e.target.closest('[data-cook]'))) {
      var r = RECIPES.find(function (x) { return x.k === b.dataset.cook; }); if (!r || !canCook(g, r)) return true;
      Object.keys(r.need).forEach(function (k) { if (PANTRY[k]) g.pantry[k] -= r.need[k]; else g.inv[k] -= r.need[k]; });
      g.dishes[r.k] = (g.dishes[r.k] || 0) + 1; g.dexDish = g.dexDish || {}; var dd = g.dexDish[r.k] || (g.dexDish[r.k] = { n: 0, first: Date.now() }); dd.n++;
      log(g, '🍰 做了一份' + r.n); save(); toast(r.n + '做好了！', 'success'); render(); return true;
    }
    if ((b = e.target.closest('[data-dsell]'))) { var r2 = RECIPES.find(function (x) { return x.k === b.dataset.dsell; }); if (r2 && g.dishes[r2.k] > 0) { g.dishes[r2.k]--; g.coins += r2.price; log(g, '💰 賣了一份' + r2.n + ' +' + r2.price); save(); render(); } return true; }
    if ((b = e.target.closest('[data-dgift]'))) {
      var r3 = RECIPES.find(function (x) { return x.k === b.dataset.dgift; }); if (!r3 || !(g.dishes[r3.k] > 0)) return true;
      var to = A.groupOn() ? (giftTo || A.pname()) : A.pname(), who = (to === A.pname() && !A.groupOn()) ? '你' : to;
      g.dishes[r3.k]--; log(g, '🍽 端了一份' + r3.n + '給 ' + to); save(); render();
      var own = A.charGroup ? (A.charGroup(to) || []) : [], pool = DISH_LINES[r3.k].filter(function (t) { return recentGift.indexOf(t) < 0; });
      var reply = own.length && Math.random() < .25 ? pick(own) : pick(pool.length ? pool : DISH_LINES[r3.k]); recentGift.push(reply); if (recentGift.length > 4) recentGift.shift();
      svgPng(dishSvg(r3.k, true), 360, 336).then(function (img) {
        if (img && typeof addMessage === 'function') addMessage({ id: Date.now(), sender: 'user', text: '', image: img, timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' });
        A.iSay('（端了一份' + r3.n + '給' + who + '）');
        setTimeout(function () { if (A.groupOn()) A.speakAs(to, 4000); A.partnerSays(reply, A.groupOn() ? to : null); }, 1600 + Math.random() * 1500);
      });
      toast('端過去了 🍽', 'success'); return true;
    }
    return false;
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
    var k = p.crop;
    if (c.tree) { p.prog = c.grow * .5; p.at = Date.now(); p.readyAt = 0; p.bug = false; p.yieldLeft = c.yield; }
    else { p.crop = null; p.bug = false; p.by = ''; p.readyAt = 0; }
    return [k, n];
  }
  function gClick(e) {
    var g = G(), now = Date.now(), b;
    if ((b = e.target.closest('[data-gt]'))) { gTab = b.dataset.gt; sel = -1; render(); return; }
    if (e.target.id === 'cx-g-notify') { g.notify = e.target.checked; save(); return; }
    if (gTab === 'kit' && kitchenClick(e, g)) return;
    if ((b = e.target.closest('[data-bv]'))) { bq.view = b.dataset.bv; render(); return; }
    if ((b = e.target.closest('[data-wrap]'))) { bq.wrap = b.dataset.wrap; render(); return; }
    if ((b = e.target.closest('[data-rib]'))) { bq.ribbon = b.dataset.rib; render(); return; }
    if ((b = e.target.closest('[data-unpick]'))) { e.preventDefault(); e.stopPropagation(); var ui = bq.sel.lastIndexOf(b.dataset.unpick); if (ui >= 0) bq.sel.splice(ui, 1); bq.hi = -1; render(); return; }
    if ((b = e.target.closest('[data-pick]'))) { if (bq.sel.length < BQ_MAX) bq.sel.push(b.dataset.pick); bq.hi = -1; render(); return; }
    if ((b = e.target.closest('[data-bqclear]'))) { e.preventDefault(); bq.sel = []; bq.hi = -1; render(); return; }
    if ((b = e.target.closest('.cx-g-bqmk [data-slot]'))) {
      var si = +b.getAttribute('data-slot');
      if (bq.hi < 0) bq.hi = si; else if (bq.hi === si) bq.hi = -1; else { var tmp = bq.sel[bq.hi]; bq.sel[bq.hi] = bq.sel[si]; bq.sel[si] = tmp; bq.hi = -1; }
      render(); return;
    }
    if ((b = e.target.closest('[data-bqshuffle]'))) { for (var q = bq.sel.length - 1; q > 0; q--) { var r = Math.floor(Math.random() * (q + 1)), t2 = bq.sel[q]; bq.sel[q] = bq.sel[r]; bq.sel[r] = t2; } bq.hi = -1; render(); return; }
    if ((b = e.target.closest('[data-bqsell]'))) {
      var sb2 = (g.bouquets || []).find(function (x) { return x.id === +b.dataset.bqsell; }); if (!sb2 || sb2.to) return;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '確定賣掉？'; return; }
      var price = bqPrice(sb2); g.coins += price; g.bouquets = g.bouquets.filter(function (x) { return x !== sb2; });
      log(g, '💰 賣掉花束「' + (sb2.name || '無名花束') + '」+' + price); save(); toast('賣了 🪙 ' + price, 'success'); bq.view = 'list'; render(); return;
    }
    if ((b = e.target.closest('[data-bqopen]'))) { bq.view = 'one'; bq.open = +b.dataset.bqopen; render(); return; }
    if ((b = e.target.closest('[data-bqmake]'))) {
      var need = {}; bq.sel.forEach(function (k) { need[k] = (need[k] || 0) + 1; });
      if (Object.keys(need).some(function (k) { return (g.inv[k] || 0) < need[k]; })) { toast('倉庫裡的花不夠了', 'info'); return; }
      Object.keys(need).forEach(function (k) { g.inv[k] -= need[k]; });
      g.bouquets = g.bouquets || [];
      var nb = { id: Date.now(), flowers: bq.sel.slice(), wrap: bq.wrap, ribbon: bq.ribbon, name: (bq.name || '').trim(), t: Date.now() };
      g.bouquets.push(nb); if (g.bouquets.length > 60) g.bouquets.shift();
      log(g, '💐 包了一束花' + (nb.name ? '「' + nb.name + '」' : '') + '（' + bqCount(nb.flowers) + '）'); save();
      bq.sel = []; bq.name = ''; bq.view = 'one'; bq.open = nb.id; toast('包好了！', 'success'); render(); return;
    }
    if ((b = e.target.closest('[data-bqsend]'))) { var sb = (g.bouquets || []).find(function (x) { return x.id === +b.dataset.bqsend; }); if (sb && !sb.to) { bqSend(g, sb); bq.view = 'one'; bq.open = sb.id; render(); } return; }
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
      var pool = GIFT_LINES[gk].filter(function (t) { return recentGift.indexOf(t) < 0; });
      var reply = own.length && Math.random() < .3 ? pick(own) : pick(pool.length ? pool : GIFT_LINES[gk]);
      recentGift.push(reply); if (recentGift.length > 4) recentGift.shift();
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
      (editing ? '<div class="cx-h-tip">拖到另一個圖示上＝放進同一個資料夾；拖到旁邊＝換位置。<a href="#" data-hreset>恢復原本排列</a></div>' : '') +
      appsHtml() +
      '<label class="cx-h-first"><input type="checkbox" id="cx-h-first"' + (lsGet('cxHomeFirst') === '1' ? ' checked' : '') + '> 打開網站時先顯示小窩</label>';
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- 圖示排列與資料夾 ---------- */
  var LKEY = 'cxHomeLayout', editing = false, openFolder = -1, suppressUntil = 0;
  function availIds() { return APPS.filter(function (a) { return a[0] === 'garden' || a[0] === 'moyu' || document.getElementById(a[0]); }).map(function (a) { return a[0]; }); }
  function meta(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i][0] === id) return APPS[i]; return [id, 'fa-circle', id]; }
  function getLayout() {
    var L = null; try { L = JSON.parse(lsGet(LKEY) || 'null'); } catch (e) {}
    if (!Array.isArray(L)) L = [];
    var av = availIds(), seen = {}, out = [];
    L.forEach(function (it) {
      if (typeof it === 'string') { if (av.indexOf(it) >= 0 && !seen[it]) { seen[it] = 1; out.push(it); } return; }
      if (!it || !Array.isArray(it.items)) return;
      var items = it.items.filter(function (x) { return av.indexOf(x) >= 0 && !seen[x]; });
      items.forEach(function (x) { seen[x] = 1; });
      if (items.length > 1) out.push({ f: String(it.f || '資料夾').slice(0, 12), items: items }); else if (items.length === 1) out.push(items[0]);
    });
    av.forEach(function (id) { if (!seen[id]) out.push(id); });
    return out;
  }
  function setLayout(L) { try { localStorage.setItem(LKEY, JSON.stringify(L)); } catch (e) {} }
  function iconBtn(id, attrs) { var a = meta(id); return '<button type="button" class="cx-h-app" data-app="' + id + '" ' + attrs + '><span class="ic"><i class="fas ' + a[1] + '"></i></span><span class="lb">' + a[2] + '</span></button>'; }
  function appsHtml() {
    var L = getLayout();
    return '<div class="cx-h-apps' + (editing ? ' editing' : '') + '">' + L.map(function (it, i) {
      if (typeof it === 'string') return iconBtn(it, 'data-i="' + i + '"');
      return '<button type="button" class="cx-h-app folder" data-folder="' + i + '" data-i="' + i + '"><span class="ic fd">' + it.items.slice(0, 4).map(function (id) { return '<i class="fas ' + meta(id)[1] + '"></i>'; }).join('') + '</span><span class="lb">' + esc(it.f) + '</span></button>';
    }).join('') + '</div>';
  }
  function foldRender() {
    var w = home.querySelector('.cx-h-foldwrap'), L = getLayout(), F = L[openFolder];
    if (openFolder < 0 || !F || typeof F === 'string') { openFolder = -1; w.hidden = true; w.innerHTML = ''; return; }
    w.hidden = false;
    w.innerHTML = '<div class="cx-h-fold' + (editing ? ' editing' : '') + '">' +
      (editing ? '<input class="cx-h-fname" id="cx-h-fname" maxlength="12" value="' + esc(F.f) + '" aria-label="資料夾名稱">' : '<div class="cx-h-fname">' + esc(F.f) + '</div>') +
      '<div class="cx-h-apps">' + F.items.map(function (id, j) { return iconBtn(id, 'data-fi="' + j + '"'); }).join('') + '</div>' +
      (editing ? '<div class="cx-h-tip">把圖示拖到框外面，就會移出資料夾。</div>' : '') + '</div>';
  }
  function hRender() { homeRender(); foldRender(); var eb = home.querySelector('.cx-h-edit'); if (eb) eb.textContent = editing ? '完成' : '整理'; }
  function launch(id) {
    if (id === 'garden') { A.load().then(function () { gOpen(true); }); return; }
    if (id === 'moyu') { A.load().then(moyuOpen); return; }
    var el = document.getElementById(id); if (el) el.click();
  }
  /* 拖曳 */
  var drag = null, press = null;
  function clearMarks() { home.querySelectorAll('.cx-h-app.mg,.cx-h-app.bf,.cx-h-app.af').forEach(function (x) { x.classList.remove('mg', 'bf', 'af'); }); var fp = home.querySelector('.cx-h-fold'); if (fp) fp.classList.remove('out'); }
  function hit(x, y) {
    var el = document.elementFromPoint(x, y); if (!el) return null;
    var inFold = drag.src.f >= 0, fp = home.querySelector('.cx-h-fold');
    if (inFold) {
      if (fp && !fp.contains(el)) return { out: true };
      var t = el.closest('.cx-h-fold [data-fi]'); if (!t) return null;
      var r = t.getBoundingClientRect(); return { el: t, idx: +t.dataset.fi, mode: x < r.left + r.width / 2 ? 'bf' : 'af' };
    }
    var t2 = el.closest('.cx-h-body [data-i]'); if (!t2) return null;
    var idx = +t2.dataset.i, ic = t2.querySelector('.ic').getBoundingClientRect(), r2 = t2.getBoundingClientRect();
    var inner = x > ic.left + ic.width * .18 && x < ic.right - ic.width * .18 && y > ic.top + ic.height * .15 && y < ic.bottom - ic.height * .15;
    var dragIsApp = typeof getLayout()[drag.src.i] === 'string';
    if (inner && idx !== drag.src.i && dragIsApp) return { el: t2, idx: idx, mode: 'mg' };
    return { el: t2, idx: idx, mode: x < r2.left + r2.width / 2 ? 'bf' : 'af' };
  }
  function applyDrop(h) {
    var L = getLayout();
    if (drag.src.f >= 0) {
      var F = L[drag.src.f]; if (!F || typeof F === 'string') return;
      var item = F.items.splice(drag.src.j, 1)[0];
      if (h.out) {
        L.splice(drag.src.f + 1, 0, item);
        if (F.items.length === 1) { L[drag.src.f] = F.items[0]; openFolder = -1; } else if (!F.items.length) { L.splice(drag.src.f, 1); openFolder = -1; }
      } else {
        var ti = h.idx - (drag.src.j < h.idx ? 1 : 0) + (h.mode === 'af' ? 1 : 0); F.items.splice(ti, 0, item);
      }
      setLayout(L); return;
    }
    var it = L[drag.src.i];
    if (h.mode === 'mg') {
      var t = L[h.idx], newIdx = h.idx - (drag.src.i < h.idx ? 1 : 0);
      if (typeof t === 'string') L[h.idx] = { f: '資料夾', items: [t, it] }; else t.items.push(it);
      L.splice(drag.src.i, 1); setLayout(L);
      if (typeof t === 'string') openFolder = newIdx;
      return;
    }
    L.splice(drag.src.i, 1);
    var to = h.idx - (drag.src.i < h.idx ? 1 : 0) + (h.mode === 'af' ? 1 : 0);
    L.splice(to, 0, it); setLayout(L);
  }
  function dragInit() {
    home.addEventListener('contextmenu', function (e) { if (e.target.closest('.cx-h-app')) e.preventDefault(); });
    home.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.cx-h-app[data-i], .cx-h-app[data-fi]'); if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (!editing) {
        press = { x: e.clientX, y: e.clientY, t: setTimeout(function () { press = null; editing = true; suppressUntil = Date.now() + 400; hRender(); try { navigator.vibrate && navigator.vibrate(15); } catch (x) {} }, 550) };
        return;
      }
      drag = { b: b, x0: e.clientX, y0: e.clientY, on: false, src: b.dataset.fi != null ? { f: openFolder, j: +b.dataset.fi } : { i: +b.dataset.i, f: -1 }, hit: null };
    });
    home.addEventListener('pointermove', function (e) {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; }
      if (!drag) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
        drag.on = true; var r = drag.b.getBoundingClientRect();
        drag.g = drag.b.cloneNode(true); drag.g.className = 'cx-h-app cx-h-ghost'; drag.g.style.width = r.width + 'px';
        drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top; document.body.appendChild(drag.g); drag.b.classList.add('dragging');
      }
      e.preventDefault();
      drag.g.style.transform = 'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px)';
      clearMarks(); var h = hit(e.clientX, e.clientY); drag.hit = h;
      if (h && h.out) { var fp = home.querySelector('.cx-h-fold'); if (fp) fp.classList.add('out'); }
      else if (h && h.el && h.el !== drag.b) h.el.classList.add(h.mode);
      var body = home.querySelector('.cx-h-body'), br = body.getBoundingClientRect();
      if (e.clientY < br.top + 40) body.scrollTop -= 8; else if (e.clientY > br.bottom - 40) body.scrollTop += 8;
    }, { passive: false });
    function end() {
      if (press) { clearTimeout(press.t); press = null; }
      if (!drag) return;
      var d = drag; drag = null;
      if (d.g) d.g.remove();
      if (d.on) { suppressUntil = Date.now() + 400; clearMarks(); if (d.hit && (d.hit.out || (d.hit.el && d.hit.el !== d.b))) { drag = d; applyDrop(d.hit); drag = null; } hRender(); }
    }
    home.addEventListener('pointerup', end); home.addEventListener('pointercancel', end);
    home.addEventListener('input', function (e) {
      if (e.target.id !== 'cx-h-fname') return;
      var L = getLayout(), F = L[openFolder]; if (!F || typeof F === 'string') return;
      F.f = e.target.value.trim() || '資料夾'; setLayout(L);
      var lb = home.querySelector('.cx-h-body [data-folder="' + openFolder + '"] .lb'); if (lb) lb.textContent = F.f;
    });
  }
  function homeBuild() {
    home = document.createElement('div'); home.id = 'cx-home'; home.hidden = true;
    home.innerHTML = '<div class="cx-h-sheet" role="dialog" aria-label="小窩"><div class="cx-h-head"><b>小窩</b><button type="button" class="cx-h-x cx-h-edit">整理</button><button type="button" class="cx-h-x cx-h-back" aria-label="回到聊天"><i class="fas fa-comment"></i> 回聊天</button></div><div class="cx-h-body"></div><div class="cx-h-foldwrap" hidden></div></div>';
    document.body.appendChild(home);
    dragInit();
    home.addEventListener('click', function (e) {
      if (Date.now() < suppressUntil) { suppressUntil = 0; e.preventDefault(); return; }
      if (e.target === home || e.target.closest('.cx-h-back')) { editing = false; openFolder = -1; homeClose(); return; }
      if (e.target.closest('.cx-h-edit')) { editing = !editing; hRender(); return; }
      if (e.target.closest('[data-hreset]')) { e.preventDefault(); try { localStorage.removeItem(LKEY); } catch (x) {} openFolder = -1; hRender(); return; }
      if (e.target.classList.contains('cx-h-foldwrap')) { openFolder = -1; foldRender(); return; }
      if (e.target.id === 'cx-h-first') { try { localStorage.setItem('cxHomeFirst', e.target.checked ? '1' : '0'); } catch (x) {} return; }
      var fb = e.target.closest('[data-folder]'); if (fb) { openFolder = +fb.dataset.folder; foldRender(); return; }
      var b = e.target.closest('[data-app]'); if (!b || editing) return;
      launch(b.dataset.app);
    });
  }
  function homeOpen() {
    if (!home) homeBuild();
    A.load().then(function () { simulate(true); editing = false; openFolder = -1; hRender(); home.hidden = false; requestAnimationFrame(function () { home.classList.add('on'); }); });
  }
  function homeClose() { if (!home) return; home.classList.remove('on'); setTimeout(function () { home.hidden = true; }, 220); }

  /* 上方按鈕 */
  (function headerBtn() {
    var bar = document.querySelector('.header-actions'); if (!bar || document.getElementById('cx-home-btn')) return;
    var b = document.createElement('button'); b.id = 'cx-home-btn'; b.className = 'action-btn'; b.title = '小窩'; b.type = 'button';
    b.innerHTML = '<i class="fas fa-house"></i>'; b.addEventListener('click', homeOpen);
    bar.insertBefore(b, bar.firstChild);
  })();

  var PAPER = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .3  0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";
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
    '.cx-h-sheet{position:relative}.cx-h-head{gap:8px}.cx-h-head b{margin-right:auto}' +
    '.cx-h-tip{font-size:12px;color:var(--text-secondary);text-align:center;line-height:1.6}.cx-h-tip a{color:var(--accent-color);margin-left:6px}' +
    '.cx-h-app{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:manipulation}' +
    '.cx-h-apps.editing .cx-h-app,.cx-h-fold.editing .cx-h-app{touch-action:none;animation:cxwig .28s ease-in-out infinite alternate}' +
    '.cx-h-apps.editing .cx-h-app:nth-child(2n){animation-delay:.14s}' +
    '@keyframes cxwig{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}' +
    '.cx-h-app.dragging{opacity:.25}.cx-h-ghost{position:fixed;left:0;top:0;z-index:2300;pointer-events:none;opacity:.9;transform-origin:center}.cx-h-ghost .ic{box-shadow:0 10px 24px rgba(60,40,100,.25)}' +
    '.cx-h-app.mg .ic{box-shadow:0 0 0 3px var(--accent-color);transform:scale(1.08)}.cx-h-app.bf{box-shadow:-3px 0 0 var(--accent-color)}.cx-h-app.af{box-shadow:3px 0 0 var(--accent-color)}' +
    '.cx-h-app .ic.fd{display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:8px;font-size:12px;background:var(--secondary-bg)}.cx-h-app .ic.fd i{display:grid;place-items:center}' +
    '.cx-h-foldwrap{position:absolute;inset:0;z-index:5;background:rgba(30,20,50,.25);display:grid;place-items:center;padding:16px;border-radius:inherit}.cx-h-foldwrap[hidden]{display:none}' +
    '.cx-h-fold{background:var(--secondary-bg);border:1px solid var(--border-color);border-radius:22px;padding:16px 14px;width:min(360px,100%);display:flex;flex-direction:column;gap:12px;box-shadow:0 16px 40px rgba(40,20,80,.2);transition:box-shadow .15s}' +
    '.cx-h-fold.out{box-shadow:0 0 0 3px #e0a526,0 16px 40px rgba(40,20,80,.2)}' +
    '.cx-h-fname{font-size:17px;font-weight:700;text-align:center;letter-spacing:.06em}input.cx-h-fname{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:10px;padding:8px;font:inherit;font-weight:700;width:100%;box-sizing:border-box}' +
    '@media (prefers-reduced-motion:reduce){.cx-h-apps.editing .cx-h-app,.cx-h-fold.editing .cx-h-app{animation:none}}' +
    '.cx-h-first{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text-secondary);justify-content:center;padding-top:4px}' +
    /* garden */
    '.cx-g-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cx-g-coin{font-weight:700;font-size:15px;color:#b48a2c;white-space:nowrap}' +
    '.cx-g-tabs{display:flex;gap:2px;margin-left:auto;background:var(--primary-bg);border:1px solid var(--border-color);border-radius:99px;padding:3px;max-width:100%;overflow-x:auto;scrollbar-width:none}.cx-g-tabs::-webkit-scrollbar{display:none}' +
    '.cx-g-tabs button{border:0;background:none;color:var(--text-secondary);font:inherit;font-size:13px;padding:5px 10px;border-radius:99px;cursor:pointer;white-space:nowrap}.cx-g-tabs button.on{background:var(--accent-color);color:#fff}' +
    '.cx-g-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 12px;border-radius:20px;background:' + PAPER + ',radial-gradient(120% 90% at 30% 10%,#fbf6ea,#efe4cf);border:1px solid #e3d6bd}' +
    '.cx-g-plot{position:relative;aspect-ratio:1/1.08;border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 0 4px;cursor:pointer;font:inherit;color:#5c4636;min-width:0;isolation:isolate}' +
    '.cx-g-plot::before{content:"";position:absolute;left:4%;right:4%;bottom:14%;height:38%;z-index:-1;border-radius:48% 52% 46% 54% / 58% 50% 50% 42%;background:radial-gradient(60% 70% at 45% 40%,#cfae86,#b9926a 70%,#a98259);opacity:.75;filter:blur(.4px)}' +
    '.cx-g-plot.wet::before{background:radial-gradient(60% 70% at 45% 40%,#a98663,#8f6c4c 70%,#7d5d41);opacity:.8}' +
    '.cx-g-plot.ready::after{content:"";position:absolute;inset:4% 6% 18%;z-index:-2;border-radius:50%;background:radial-gradient(closest-side,rgba(255,226,140,.55),rgba(255,226,140,0))}' +
    '.cx-g-plot.sel::before{box-shadow:0 0 0 2px var(--accent-color)}' +
    '.cx-g-plot svg{width:92%;flex:1;min-height:0;overflow:visible}.cx-g-plot small{font-size:11px;line-height:1.25;color:#6b5443;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;letter-spacing:.02em}' +
    '.cx-g-plot.ready small{color:#b0782a;font-weight:600}.cx-g-plot .dry{color:#b0782a;font-weight:600}.cx-g-plot .by{position:absolute;top:2px;right:4px;font-style:normal;font-size:10px;background:#fffaf2;color:var(--accent-color);border:1px solid #e3d6bd;border-radius:50%;width:17px;height:17px;display:grid;place-items:center}' +
    '.cx-g-plot.empty .plus{font-size:22px;color:#a8896a;flex:1;display:grid;place-items:center;opacity:.8}.cx-g-plot.lock{color:#a3937e;justify-content:center;gap:6px}.cx-g-plot.lock::before{background:#e0d4c0;opacity:.6}.cx-g-plot.lock small{color:#9a8a75}.cx-g-plot:disabled{opacity:.5;cursor:default}' +
    '.cx-g-acts{display:flex;gap:8px}.cx-g-acts .cx-btn{flex:1}' +
    '.cx-g-panel{border:1px solid var(--border-color);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--primary-bg)}.cx-g-pt{font-weight:700;font-size:14px}' +
    '.cx-g-panel .seeds{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.cx-g-seed{display:grid;grid-template-columns:40px 1fr;grid-template-rows:auto auto auto;column-gap:8px;align-items:center;text-align:left;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:12px;padding:6px 8px;font:inherit;cursor:pointer;min-width:0}' +
    '.cx-g-seed svg{grid-row:1/4;width:40px;height:40px;overflow:visible}.cx-g-seed .nm{font-weight:600;font-size:14px}.cx-g-seed .cx-muted{grid-column:2;font-size:11px}.cx-g-seed .pr{grid-column:2;font-weight:700;color:#b48a2c;font-size:12px}.cx-g-seed:disabled{opacity:.45}' +
    '.cx-g-item{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border-color);padding:8px 0}.cx-g-item svg{width:44px;height:42px;flex:0 0 44px;overflow:visible}.cx-g-item .tx{flex:1;min-width:0}.cx-g-item .cx-btn{padding:8px 12px;font-size:13px;white-space:nowrap}' +
    '.cx-g-dex{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}.cx-g-dx{border:1px solid var(--border-color);border-radius:14px;padding:8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}.cx-g-dx svg{width:60px;height:56px;overflow:visible}.cx-g-dx.no svg{filter:grayscale(1) brightness(1.1);opacity:.3}.cx-g-dx .cx-muted{font-size:11px}.cx-g-dx .lang{font-size:11px;color:var(--accent-color)}' +
    '.cx-k-pan{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cx-k-pan .it{border:1px solid var(--border-color);border-radius:12px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px;background:var(--primary-bg)}.cx-k-pan .it span{font-size:16px;font-weight:700}.cx-k-pan .cx-btn{padding:4px 6px;font-size:11px;white-space:nowrap}' +
    '.cx-k-rec{display:flex;flex-direction:column;gap:6px}.cx-k-r{display:flex;align-items:center;gap:8px;border:1px solid var(--border-color);border-radius:14px;padding:6px 8px;background:var(--primary-bg)}.cx-k-r.ok{border-color:var(--accent-color)}.cx-k-r svg{width:52px;height:48px;flex:0 0 52px;overflow:visible}.cx-k-r .tx{flex:1;min-width:0}' +
    '.cx-k-r .need{display:flex;flex-wrap:wrap;gap:3px 6px;font-size:11px;color:var(--text-secondary);margin-top:2px}.cx-k-r .need .en{color:#3f9e6a}.cx-k-r .cx-btn{padding:8px 14px}' +
    '.cx-g-bqmk [data-slot]{cursor:pointer}.cx-g-bqtip{font-size:12px;text-align:center}.cx-g-bqtip a{color:var(--accent-color)}' +
    '.cx-g-sub{display:flex;gap:6px}.cx-g-sub button{flex:1;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-secondary);font:inherit;font-size:13px;padding:7px;border-radius:10px;cursor:pointer}.cx-g-sub button.on{color:var(--accent-color);border-color:var(--accent-color);font-weight:600}' +
    '.cx-g-bqmk{display:grid;grid-template-columns:minmax(120px,42%) 1fr;gap:12px;align-items:start}.cx-g-bqmk .pv,.cx-g-bq1 .pv{background:' + PAPER + ',#f7f1e6;border:1px solid #e3d6bd;border-radius:16px;aspect-ratio:3/4;display:grid;place-items:center;overflow:hidden}.cx-g-bqmk .pv svg,.cx-g-bq1 .pv svg{width:100%;height:100%}.cx-g-bqmk .empty{text-align:center;font-size:12px}' +
    '.cx-g-bqmk .opts{display:flex;flex-direction:column;gap:6px;min-width:0}.cx-g-bqmk .sw{display:flex;flex-wrap:wrap;gap:5px}.cx-g-bqmk .sw button{border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);font:inherit;font-size:12px;border-radius:99px;padding:4px 9px 4px 5px;display:flex;align-items:center;gap:4px;cursor:pointer}.cx-g-bqmk .sw button.on{border-color:var(--accent-color);box-shadow:0 0 0 1px var(--accent-color)}.cx-g-bqmk .sw i{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.12)}' +
    '.cx-g-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px}.cx-g-pick button{position:relative;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:12px;padding:4px 2px 6px;font:inherit;font-size:12px;display:flex;flex-direction:column;align-items:center;cursor:pointer}.cx-g-pick svg{width:46px;height:44px;overflow:visible}.cx-g-pick small{color:var(--text-secondary);font-size:11px}.cx-g-pick button:disabled{opacity:.5}' +
    '.cx-g-pt a{color:var(--accent-color)}.cx-g-pick em{position:absolute;top:2px;right:2px;font-style:normal;font-size:11px;background:var(--accent-color);color:#fff;border-radius:99px;padding:0 6px;cursor:pointer}' +
    '.cx-g-bqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}.cx-g-bqc{border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:14px;padding:6px;font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;min-width:0}.cx-g-bqc svg{width:100%;aspect-ratio:3/4}.cx-g-bqc b{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-g-bqc .cx-muted{font-size:11px}' +
    '.cx-g-bq1{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.cx-g-bq1 .pv{width:min(240px,70%)}.cx-g-bq1 .rp{color:var(--accent-color);margin:4px 0;font-size:14px}.cx-g-bq1 .cx-who,.cx-g-bq1 .cx-g-acts{width:100%}' +
    '.cx-g-log div{font-size:13px;padding:6px 0;border-bottom:1px dashed var(--border-color)}.cx-g-tip{text-align:center}' +
    '@media (prefers-reduced-motion:reduce){.cx-h-sheet{transition:none}}';
  document.head.appendChild(css);

  window.__cxHome = { open: homeOpen, close: homeClose, garden: function () { A.load().then(function () { gOpen(false); }); }, _sim: simulate, _G: G };
  if (lsGet('cxHomeFirst') === '1') setTimeout(homeOpen, 1200);
  setInterval(function () { if (document.visibilityState === 'visible' && A.X()) { if (simulate(false)) { if (home && !home.hidden) homeRender(); } } }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(function () { if (A.X()) simulate(true); }, 4000); });
})();
