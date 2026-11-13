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
    marigold:   { n: '金盞花', cost: 4,  grow: 75e3,   yield: 3, price: 7,  col: '#f6a23a', unit: '朵', flower: 1, lang: '迎接幸福' },
    cornflower: { n: '矢車菊', cost: 6,  grow: 100e3,  yield: 3, price: 9,  col: '#8fb5ee', unit: '朵', flower: 1, lang: '遇見幸福' },
    lilyvalley: { n: '鈴蘭',   cost: 9,  grow: 200e3,  yield: 3, price: 14, col: '#f4f7ea', unit: '枝', flower: 1, lang: '幸福歸來' },
    rose:       { n: '玫瑰',   cost: 25, grow: 1440e3, yield: 3, price: 35, col: '#d97a8f', unit: '朵', flower: 1, lang: '熱烈的愛' },
    bluerose:   { n: '藍玫瑰',   rare: 1, cost: 45, base: 'rose',      pair: 'cornflower', grow: 1440e3, yield: 1, price: 90, col: '#7fa6e6', unit: '朵', flower: 1, lang: '奇蹟，不可能的事也會實現' },
    goldrose:   { n: '金玫瑰',   rare: 1, cost: 45, base: 'rose',      pair: 'sunflower',  grow: 1440e3, yield: 1, price: 90, col: '#f2c45a', unit: '朵', flower: 1, lang: '永恆不變的愛' },
    blacktulip: { n: '黑鬱金香', rare: 1, cost: 30, base: 'tulip',     pair: 'lavender',   grow: 90e3,   yield: 1, price: 60, col: '#5a4566', unit: '朵', flower: 1, lang: '神秘、獨一無二的愛' },
    pinkhydra:  { n: '粉繡球',   rare: 1, cost: 35, base: 'hydrangea', pair: 'peony',      grow: 300e3,  yield: 1, price: 70, col: '#f2a7c3', unit: '朵', flower: 1, lang: '浪漫的團聚' },
    whitelav:   { n: '白薰衣草', rare: 1, cost: 20, base: 'lavender',  pair: 'gypso',      grow: 30e3,   yield: 1, price: 40, col: '#f3eef9', unit: '束', flower: 1, lang: '純白的等待' },
    pinkdaisy:  { n: '粉雛菊',   rare: 1, cost: 20, base: 'daisy',     pair: 'tulip',      grow: 45e3,   yield: 1, price: 40, col: '#f6b9c8', unit: '朵', flower: 1, lang: '天真又藏不住的喜歡' },
    carrot:     { n: '胡蘿蔔', cost: 3,  grow: 60e3,   yield: 3, price: 4,  col: '#f08a3c', unit: '根' },
    wheat:      { n: '小麥',   cost: 2,  grow: 40e3,   yield: 3, price: 3,  col: '#e3c27a', unit: '把' },
    blueberry:  { n: '藍莓',   seed: '藍莓叢', cost: 15, grow: 180e3, yield: 5, price: 5,  col: '#6f7fc0', unit: '顆', tree: 1 },
    orange:     { n: '橘子',   seed: '橘子樹', cost: 25, grow: 360e3, yield: 3, price: 9,  col: '#f0a04b', unit: '顆', tree: 1 },
    momo:       { n: '桃子',   seed: '桃樹',   cost: 30, grow: 480e3, yield: 3, price: 11, col: '#f3a99a', unit: '顆', tree: 1 },
    apple:      { n: '蘋果',   seed: '蘋果樹', cost: 28, grow: 420e3, yield: 4, price: 9,  col: '#e0605a', unit: '顆', tree: 1 },
    lemon:      { n: '檸檬',   seed: '檸檬樹', cost: 22, grow: 300e3, yield: 4, price: 8,  col: '#f3d75a', unit: '顆', tree: 1 },
    pear:       { n: '梨子',   seed: '梨樹',   cost: 26, grow: 420e3, yield: 3, price: 10, col: '#e2d777', unit: '顆', tree: 1 },
    grape:      { n: '葡萄',   seed: '葡萄藤', cost: 32, grow: 540e3, yield: 3, price: 14, col: '#8a6fc2', unit: '串', tree: 1 },
    persimmon:  { n: '柿子',   seed: '柿子樹', cost: 30, grow: 600e3, yield: 4, price: 9,  col: '#f08a3c', unit: '顆', tree: 1 },
    cherry:     { n: '櫻桃',   seed: '櫻桃樹', cost: 35, grow: 600e3, yield: 6, price: 6,  col: '#cf4f62', unit: '顆', tree: 1 }
  };
  var ORDER = ['lavender', 'gypso', 'wheat', 'carrot', 'daisy', 'marigold', 'tulip', 'cornflower', 'strawberry', 'tomato', 'gardenia', 'lilyvalley', 'osmanthus', 'hydrangea', 'sunflower', 'peach', 'lotus', 'peony', 'rose', 'blueberry', 'lemon', 'orange', 'apple', 'pear', 'momo', 'grape', 'cherry', 'persimmon', 'whitelav', 'pinkdaisy', 'blacktulip', 'pinkhydra', 'bluerose', 'goldrose'];
  var UNLOCK = [0, 0, 0, 0, 0, 0, 60, 120, 200];
  var WET = 6 * HR, DRY_RATE = 0.35;
  var GIFT_LINES = {
    marigold: ['金黃色的，像把太陽摘下來給我。', '好有元氣的花，看著就想笑。', '收到了，今天一整天都會很好。'],
    cornflower: ['好藍……像妳穿那件裙子的顏色。', '矢車菊，遇見幸福的意思。我遇見妳了。', '小小一朵，插在杯子裡剛剛好。'],
    lilyvalley: ['鈴蘭……一串小鈴鐺，好可愛。', '幸福歸來的意思。妳就是我的幸福。', '捨不得碰，怕把鈴鐺碰響了。'],
    apple: ['蘋果！削好皮給妳吃，一整圈不斷的那種。', '一天一蘋果，乖寶不用看醫生。', '好紅，好香。'],
    lemon: ['檸檬……是想說我最近很酸嗎。', '泡一杯蜂蜜檸檬水給妳，好不好。', '酸酸的，跟妳吃醋的時候一樣可愛。'],
    pear: ['梨子不能分著吃喔，整顆都給妳。', '好甜，水分好多。', '燉個冰糖梨給妳潤潤喉。'],
    grape: ['一顆一顆剝好皮餵妳。', '好大一串，妳是不是挑了最漂亮的。', '紫紫的，好甜。'],
    persimmon: ['柿子！事事如意的意思。', '熟透了，好軟好甜。', '秋天的味道。謝謝妳。'],
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
    carrot: ['胡蘿蔔……是要給兔子的吧？好，我拿去餵牠。', '我也要吃一口，咔滋。', '好新鮮，晚上燉湯。'],
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
    carrot: ['拔了一根胡蘿蔔……兔子看起來很想吃。'],
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
    if (!Array.isArray(g.plots) || !g.plots.length || g.plots.length % 9) g.plots = UNLOCK.map(function (c, i) { return { open: c === 0 }; });
    if (typeof g.coins !== 'number') g.coins = 30;
    g.inv = g.inv || {}; g.dex = g.dex || {}; g.log = g.log || [];
    if (g.notify === undefined) g.notify = true;
    g.lastHelp = g.lastHelp || 0; g.lastSteal = g.lastSteal || 0; g.lastPlant = g.lastPlant || 0; g.lastSeen = g.lastSeen || Date.now();
    if (!Array.isArray(g.orchard) || !g.orchard.length || g.orchard.length % 6) g.orchard = OUNLOCK.map(function (c) { return { open: c === 0 }; });
    g.coop = g.coop || {}; g.coop.hens = g.coop.hens || []; g.coop.feed = g.coop.feed || 0; g.coop.lastHelp = g.coop.lastHelp || 0;
    g.pens = g.pens || {}; ['duck', 'cow', 'rabbit', 'bee'].forEach(function (k) { g.pens[k] = g.pens[k] || { built: false, list: [] }; g.pens[k].list = g.pens[k].list || []; });
    if (!g.v2) {
      // 搬家：原本種在花園的果樹，移到果園
      g.plots.forEach(function (p) {
        if (!p.crop || !CROPS[p.crop] || !CROPS[p.crop].tree) return;
        var slot = g.orchard.find(function (q) { return !q.crop; }); if (!slot) return;
        slot.open = true; Object.keys(p).forEach(function (k) { if (k !== 'open') slot[k] = p[k]; });
        p.crop = null; p.bug = false; p.by = ''; p.readyAt = 0;
      });
      g.v2 = 1;
    }
    return g;
  }
  var OUNLOCK = [0, 0, 80, 150, 220, 300];
  var hybridMsg = '', hybridKey = '';
  var WX_BLOCK = 2 * 3600e3;
  function weatherAt(t) { var b = Math.floor(t / WX_BLOCK), h = Math.sin(b * 12.9898 + 78.233) * 43758.5453; h -= Math.floor(h); return h < .24 ? 'rain' : h < .5 ? 'cloud' : 'sun'; }
  function wxLeft(t) { return WX_BLOCK - t % WX_BLOCK; }
  function wxApply(g, now) { if (weatherAt(now) !== 'rain') return; var until = now + wxLeft(now) + WET / 2; allPlots(g).forEach(function (p) { if (p.crop && !ready(p) && (p.wetUntil || 0) < until) p.wetUntil = until; }); }
  function wxOverlay(x, y, w, h) {
    var k = weatherAt(Date.now()), o = '';
    if (k === 'rain') { o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#6d86a6" opacity=".12"/><g class="cx-rain">'; for (var i = 0; i < w / 7; i++) { var rx = x + (i * 37.3) % w, ry = y + (i * 53.7) % h; o += '<path d="M' + f(rx) + ' ' + f(ry) + ' l-2 7" stroke="#8fb0d6" stroke-width="1" stroke-linecap="round" opacity=".7"/>'; } o += '</g>'; }
    else if (k === 'cloud') o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#8a9aa8" opacity=".08"/>';
    return o;
  }
  function wxChip(now) {
    var k = weatherAt(now), m = Math.ceil(wxLeft(now) / 60e3), t = m >= 60 ? Math.floor(m / 60) + ' 小時' + (m % 60 ? ' ' + (m % 60) + ' 分' : '') : m + ' 分鐘';
    return '<div class="cx-wx ' + k + '">' + (k === 'rain' ? '🌧 下雨了，花園和果園會自己澆水（還會下 ' + t + '）' : k === 'cloud' ? '☁️ 多雲，記得幫乾掉的地澆水' : '☀️ 晴天，適合種花') + '</div>';
  }
  var LAND = { g: [0, 400, 900], o: [0, 500, 1000] }, landScroll = null, stageDrag = null, stageMoved = 0;
  function allPlots(g) { return g.plots.concat(g.orchard); }
  function PK(g, key) { if (!key) return null; var a = key[0] === 'o' ? g.orchard : g.plots; return a[+key.slice(1)] || null; }
  /* ---------- 雞 ---------- */
  var ANIM = {
    hen: { n: '雞', emoji: '🐔', place: '雞舍', build: 0, cost: 20, max: 6, fed: 8 * MIN, lay: 90e3, cap: 2, prod: 'egg', unit: '顆', eat: ['wheat', 1], verb: '撿蛋', art: henArt,
      names: ['小白', '布丁', '麻糬', '芝麻', '栗子', '雞蛋糕', '湯圓', '豆花', '奶茶', '可可'], desc: '吃飽的雞每 1 分半下一顆蛋，蛋會放進廚房的食材櫃。' },
    duck: { n: '鴨子', emoji: '🦆', place: '鴨池', build: 120, cost: 30, max: 4, fed: 8 * MIN, lay: 120e3, cap: 2, prod: 'egg', unit: '顆', eat: ['wheat', 1], verb: '撿鴨蛋', art: duckArt,
      names: ['呱呱', '小黃', '鴨鴨', '奶油', '嘟嘟', '泡泡'], desc: '鴨子會在池塘裡游來游去，吃飽了每 2 分鐘下一顆鴨蛋（可以當雞蛋用）。' },
    cow: { n: '乳牛', emoji: '🐄', place: '牛棚', build: 250, cost: 80, max: 2, fed: 10 * MIN, lay: 180e3, cap: 2, prod: 'milk', unit: '瓶', eat: ['wheat', 2], verb: '擠牛奶', art: cowArt,
      names: ['花花', '牛奶糖', '哞哞', '斑斑'], desc: '吃飽的乳牛每 3 分鐘可以擠一瓶牛奶。牛奶在廚房可以做成奶油。' },
    rabbit: { n: '兔子', emoji: '🐰', place: '兔子窩', build: 180, cost: 40, max: 4, fed: 10 * MIN, lay: 240e3, cap: 1, prod: 'flower', unit: '朵', eat: ['carrot', 1], verb: '看看帶回什麼', art: rabbitArt,
      names: ['棉花糖', '團子', 'QQ', '蘿蔔', '雪球', '可頌'], desc: '兔子吃胡蘿蔔（花園可以種），吃飽了會到處跑，偶爾叼一朵花回來給你。' },
    bee: { n: '蜂箱', emoji: '🐝', place: '養蜂場', build: 160, cost: 45, max: 3, fed: 10 * MIN, lay: 150e3, cap: 2, prod: 'honey', unit: '罐', eat: ['lavender', 1], verb: '取蜂蜜', art: hiveArt,
      names: ['蜜糖', '嗡嗡', '琥珀', '小黃'], desc: '蜜蜂最愛薰衣草。餵過花的蜂箱每 2 分半產一罐蜂蜜，蜂蜜放進廚房的食材櫃。' }
  };
  var ANI_H = { hen: 27, duck: 22, cow: 30, rabbit: 26, bee: 26 }, ANI_IMG = { hen: 'hen', duck: 'duck', cow: 'cow', rabbit: 'rabbit', bee: 'hive' };
  Object.keys(ANIM).forEach(function (k) { var orig = ANIM[k].art; ANIM[k].art = function (on, dir, i) {
    var key = ANI_IMG[k]; if (!FI(key)) return orig(on, dir, i);
    var m = FI(key), H = ANI_H[k], W = H * m.w / m.h;
    return '<ellipse cx="0" cy="1" rx="' + f(W * .42) + '" ry="3" fill="#00000018"/>' + (on ? '<ellipse cx="0" cy="1" rx="' + f(W * .5) + '" ry="4.4" fill="none" stroke="var(--accent-color)" stroke-width="1.6"/>' : '') +
      '<g transform="scale(' + (k === 'bee' ? 1 : -dir) + ',1)">' + imgAt(key, 0, 2, H) + '</g>' + (k === 'bee' ? beesArt(i, [[-15, -22], [13, -27], [5, -33]]) : '');
  }; });
  var pen = 'hen';
  function penBuilt(g, k) { return k === 'hen' || !!(g.pens[k] && g.pens[k].built); }
  function herd(g, k) { return k === 'hen' ? g.coop.hens : g.pens[k].list; }
  function allAni(g) { var out = []; Object.keys(ANIM).forEach(function (k) { if (penBuilt(g, k)) herd(g, k).forEach(function (a) { out.push([k, a]); }); }); return out; }
  function henTick(h, now, type) {
    var A0 = ANIM[type || 'hen'], from = Math.max(h.lastLay || now, h.fedAt || 0), to = Math.min(now, h.fedUntil || 0);
    if (to > from) { var n = Math.floor((to - from) / A0.lay); if (n > 0) { h.eggs = Math.min(A0.cap, (h.eggs || 0) + n); h.lastLay = from + n * A0.lay; } }
    if ((h.fedUntil || 0) < now && (h.lastLay || 0) < (h.fedUntil || 0)) h.lastLay = h.fedUntil;
  }
  function tickAll(g, now) { allAni(g).forEach(function (x) { henTick(x[1], now, x[0]); }); }
  function hungry(h, now) { return (h.fedUntil || 0) <= now; }
  function foodLeft(g, type) { return (g.inv[ANIM[type].eat[0]] || 0) + g.coop.feed; }
  function feedAni(g, type, h, now, free) {
    var A0 = ANIM[type];
    if (!free) {
      if (foodLeft(g, type) < A0.eat[1]) return false;
      var need = A0.eat[1], fromInv = Math.min(need, g.inv[A0.eat[0]] || 0);
      g.inv[A0.eat[0]] = (g.inv[A0.eat[0]] || 0) - fromInv; g.coop.feed -= need - fromInv; tick(g, 'feed');
    }
    henTick(h, now, type); var was = !hungry(h, now); h.fedUntil = now + A0.fed; if (!was) { h.fedAt = now; h.lastLay = now; }
    return true;
  }
  function aniStatus(h, now, type) { var A0 = ANIM[type || pen]; return (hungry(h, now) ? '肚子餓了，餵了才會' + (A0.prod === 'flower' ? '出去玩' : '有東西收') : '吃飽了（' + dur(h.fedUntil - now) + '）') + '　·　' + ((h.eggs || 0) ? '有 ' + h.eggs + ' ' + A0.unit + (A0.prod === 'flower' ? '花' : PANTRY[A0.prod][0]) + '可以收' : '還沒有東西可以收'); }
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
  var TASKS = [
    ['harvest', '收成 {n} 次', [5, 8, 12]], ['water', '澆水 {n} 次', [3, 5]], ['plant', '種下 {n} 格', [5, 9]], ['feed', '餵動物 {n} 隻', [3, 6]],
    ['collect', '在牧場收 {n} 樣東西', [3, 6]], ['cook', '在廚房做 {n} 道料理', [1, 2]], ['bouquet', '包 {n} 束花', [1]], ['gift', '送哥哥 {n} 樣禮物', [1, 2]],
    ['moyu', '玩一次摸魚小貓', [1]], ['sell', '賣掉 {n} 樣東西', [5, 10]]
  ];
  function taskDay(g) {
    var d = today(); if (g.task && g.task.d === d) return g.task;
    var seed = 0; for (var i = 0; i < d.length; i++) seed = (seed * 31 + d.charCodeAt(i)) % 100003;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var pool = TASKS.slice(), list = [];
    for (var j = 0; j < 3; j++) { var t = pool.splice(Math.floor(rnd() * pool.length), 1)[0], lv = Math.floor(rnd() * t[2].length), n = t[2][lv]; list.push({ k: t[0], n: n, p: 0, got: false, r: 20 + lv * 10 + (t[0] === 'bouquet' || t[0] === 'cook' ? 10 : 0) }); }
    g.task = { d: d, list: list, bonus: false };
    return g.task;
  }
  function tick(g, k, n) { if (!g) return; var T = taskDay(g); T.list.forEach(function (t) { if (t.k === k && t.p < t.n) t.p = Math.min(t.n, t.p + (n || 1)); }); }
  function taskText(t) { var def = TASKS.filter(function (x) { return x[0] === t.k; })[0]; return def ? def[1].replace('{n}', t.n) : t.k; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* 不在的時候發生的事：他幫忙澆水、偷摘、幫忙種、長蟲 */
  function simulate(fromVisit) {
    var g = G(); if (!g) return;
    var now = Date.now(), away = Math.max(0, now - g.lastSeen), events = [];
    // 他幫忙澆水（先補算到他澆水那一刻，之後照濕土的速度長）
    var dry = allPlots(g).filter(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now - 10 * MIN; });
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
    allPlots(g).forEach(function (p) { if (p.crop) grow(p, now); });
    // 雞：下蛋；他幫忙餵
    tickAll(g, now);
    var hun = allAni(g).filter(function (x) { return hungry(x[1], now); });
    if (hun.length && now - g.coop.lastHelp > 2 * HR && Math.random() < (fromVisit ? (away > HR ? .7 : 0) : 1 / 60)) {
      var whoH = pick(helpers()), kinds = [];
      hun.forEach(function (x) { var h = x[1], t0 = fromVisit ? Math.max(h.fedUntil || 0, now - Math.min(away, 2 * HR)) + Math.random() * 60e3 : now; if (t0 > now) t0 = now; henTick(h, t0, x[0]); h.fedAt = t0; h.fedUntil = t0 + ANIM[x[0]].fed; h.lastLay = t0; henTick(h, now, x[0]); if (kinds.indexOf(ANIM[x[0]].n) < 0) kinds.push(ANIM[x[0]].n); });
      g.coop.lastHelp = now;
      log(g, '🌾 ' + whoH + ' 幫你餵了' + kinds.join('、'));
      events.push(['sys', '✿ ' + whoH + ' 幫你餵了' + kinds.join('、') + ' ✿']);
    }
    // 偷摘一點點
    var ripe = allPlots(g).filter(function (p) { return ready(p) && (p.yieldLeft || CROPS[p.crop].yield) > 1 && p.readyAt && now - p.readyAt > 3 * HR; });
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
    if (!allPlots(g).some(function (p) { return p.bug; })) {
      var growing = allPlots(g).filter(function (p) { return p.crop && !ready(p) && p.prog > 0; });
      var bugChance = fromVisit ? Math.min(.5, away / HR * .05) : 1 / 600;
      if (growing.length && Math.random() < bugChance) { pick(growing).bug = true; log(g, '🐛 有一隻小蟲爬到田裡了'); }
    }
    allPlots(g).forEach(function (p) { if (ready(p) && !p.readyAt) p.readyAt = now; });
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
    marigold: function (x, y, s) {
      var o = '';
      [8, 5.6, 3.2].forEach(function (R, k) { var n = 14 - k * 3; for (var i = 0; i < n; i++) { var a = i / n * 360 + k * 13, r = a * Math.PI / 180; o += petal(x + Math.cos(r) * R * .55 * s, y + Math.sin(r) * R * .5 * s, R * .48 * s, R * .34 * s, a, ['#f39a3a', '#f6b04a', '#f9c86a'][k], .92); } });
      return o + dot(x, y, 1.4 * s, '#e88a2a');
    },
    cornflower: function (x, y, s) {
      var o = '';
      for (var i = 0; i < 10; i++) { var a = i / 10 * 360, r = a * Math.PI / 180; o += petal(x + Math.cos(r) * 4.6 * s, y + Math.sin(r) * 4.6 * s, 3.2 * s, 1.5 * s, a, i % 2 ? '#8fb5ee' : '#a9c6f2', .92); }
      return o + dot(x, y, 2 * s, '#5f7fc8', .9) + dot(x, y, .9 * s, '#f6e08a');
    },
    lilyvalley: function (x, y, s) {
      var o = '<path d="M' + f(x - 4 * s) + ' ' + f(y + 12 * s) + ' Q' + f(x - 3 * s) + ' ' + f(y - 8 * s) + ' ' + f(x + 8 * s) + ' ' + f(y - 6 * s) + '" stroke="' + STEM + '" stroke-width="1.2" fill="none"/>';
      [[-3, -4], [1, -7], [5, -6.4], [8, -4]].forEach(function (q, i) { var bx = x + q[0] * s, by = y + q[1] * s + 4 * s;
        o += '<path d="M' + f(bx) + ' ' + f(by - 3 * s) + ' l0 ' + f(1.6 * s) + '" stroke="' + STEM + '" stroke-width=".6"/><path d="M' + f(bx - 2 * s) + ' ' + f(by + 1.8 * s) + ' Q' + f(bx - 2.2 * s) + ' ' + f(by - 1.6 * s) + ' ' + f(bx) + ' ' + f(by - 1.6 * s) + ' Q' + f(bx + 2.2 * s) + ' ' + f(by - 1.6 * s) + ' ' + f(bx + 2 * s) + ' ' + f(by + 1.8 * s) + ' Q' + f(bx) + ' ' + f(by + 1 * s) + ' ' + f(bx - 2 * s) + ' ' + f(by + 1.8 * s) + 'Z" fill="#fffef6" stroke="' + INK + '" stroke-width=".5"/>'; });
      return leafAt(x - 3 * s, y + 12 * s, 14 * s, -110, LEAF2) + o;
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
    if (FI(crop)) { var tm = FI(crop), wide = tm.w > tm.h * 1.3; return '<ellipse cx="30" cy="54" rx="16" ry="3" fill="#00000018"/>' + imgAt(crop, 30, 55.5, wide ? 0 : (st === 3 ? 56 : 48), wide ? (st === 3 ? 58 : 50) : 0, st === 3 ? '' : ' style="filter:saturate(.25) brightness(1.08)" opacity=".9"'); }
    if (crop === 'blueberry') {
      o = bush('x', true).replace(/<path d="M[^"]*Z" fill="#[0-9a-f]{6}"[^>]*\/>|<circle[^>]*\/>/g, '');
      var bb = [[21, 40], [27, 44], [34, 41], [39, 45], [30, 37], [24, 47], [36, 36]];
      if (st === 3) bb.forEach(function (q) { o += dot(q[0], q[1], 2.4, c.col, .92) + dot(q[0] - .7, q[1] - .7, .7, '#d9e0f6', .8) + dot(q[0] + .4, q[1] - 1.9, .5, '#3e4a7e'); });
      else bb.slice(0, 3).forEach(function (q) { dot(q[0], q[1], 1.6, '#cfe0b8'); o += dot(q[0], q[1], 1.6, '#cfe0b8'); });
      return o;
    }
    var crown = crop === 'orange' || crop === 'lemon' ? '#7f9f6a' : crop === 'cherry' || crop === 'grape' ? '#86a873' : crop === 'persimmon' ? '#a3a86a' : '#93ad7f';
    o += '<path d="M30 54 L30 34 M30 40 L24 32 M30 37 L36 30" stroke="#8a6a52" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    [[30, 22, 15, 12], [21, 27, 9, 8], [39, 26, 9, 8], [30, 15, 9, 7]].forEach(function (q, i) { o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + q[3] + '" fill="' + (i % 2 ? LEAF : crown) + '" fill-opacity=".8" stroke="' + INK + '" stroke-width=".45"/>'; });
    var fr = [[22, 26], [30, 30], [38, 25], [27, 18], [35, 18], [31, 23]];
    if (st === 3) fr.forEach(function (q) {
      if (crop === 'cherry') o += '<path d="M' + q[0] + ' ' + (q[1] - 4) + ' q2 -2 4 -1" stroke="#6b8a55" stroke-width=".7" fill="none"/>' + dot(q[0] - 1, q[1], 2, c.col, .95) + dot(q[0] + 2, q[1] + .5, 2, c.col, .95) + dot(q[0] - 1.6, q[1] - .6, .5, '#fff', .6);
      else if (crop === 'grape') o += '<path d="M' + q[0] + ' ' + (q[1] - 4) + ' v2" stroke="#6b8a55" stroke-width=".7"/>' + [[0, -1.4], [-1.6, 0], [1.6, 0], [-.8, 1.6], [.8, 1.6], [0, 3]].map(function (z) { return dot(q[0] + z[0], q[1] + z[1], 1.15, c.col, .95); }).join('');
      else if (crop === 'lemon' || crop === 'pear') o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + (crop === 'lemon' ? 3.2 : 2.6) + '" ry="' + (crop === 'lemon' ? 2.3 : 3.2) + '" fill="' + c.col + '" fill-opacity=".95" stroke="' + INK + '" stroke-width=".4"/>' + (crop === 'pear' ? '<path d="M' + q[0] + ' ' + (q[1] - 3.2) + ' v-1.4" stroke="#7a5a44" stroke-width=".6"/>' : '') + dot(q[0] - .9, q[1] - .9, .7, '#fff', .55);
      else o += dot(q[0], q[1], crop === 'momo' ? 3 : 2.8, c.col, .93) + (crop === 'persimmon' ? '<path d="M' + (q[0] - 1.6) + ' ' + (q[1] - 2.4) + ' l1.6 1 l1.6 -1" stroke="#6b8a55" stroke-width=".9" fill="none"/>' : crop === 'apple' ? '<path d="M' + q[0] + ' ' + (q[1] - 2.6) + ' q.6 -1.4 1.6 -1.6" stroke="#6b8a55" stroke-width=".6" fill="none"/>' : '') + (crop === 'momo' ? '<path d="M' + q[0] + ' ' + (q[1] - 2.6) + ' q1 2.6 0 5.2" stroke="#e48a7c" stroke-width=".6" fill="none"/>' : '') + dot(q[0] - .9, q[1] - .9, .8, '#fff', .55);
    });
    else if (crop === 'momo' || crop === 'cherry') fr.slice(0, 4).forEach(function (q) { o += petal(q[0], q[1], 1.6, 1.2, 0, crop === 'cherry' ? '#fbe3ea' : '#f8c7d0', .9); });
    return o;
  }
  var RECOL = {
    bluerose: [['#d97a8f', '#7fa6e6'], ['#b55a70', '#4f72b8'], ['#e39aab', '#a9c4f2']],
    goldrose: [['#d97a8f', '#f2c45a'], ['#b55a70', '#b98a2a'], ['#e39aab', '#f8dc8a']],
    blacktulip: [['#ee9aa6', '#5a4566'], ['#d97888', '#3a2a44']],
    pinkhydra: [['#a6b6e6', '#f2a7c3'], ['#c3a6dc', '#f6bfd2'], ['#b7c9ef', '#efa0bc'], ['#d2bce8', '#f8cfe0']],
    whitelav: [['#a493cf', '#f3eef9'], ['#c2b4e6', '#ffffff']],
    pinkdaisy: [['#fbf6ea', '#f6b9c8']]
  };
  function recolor(svg, k) { (RECOL[k] || []).forEach(function (pr) { svg = svg.split(pr[0]).join(pr[1]); }); return svg; }
  function plantArt(crop, st) {
    var c = CROPS[crop], ci = st === 3 && !c.tree && CI(crop);
    if (ci) { var sc = Math.min(48 / ci.w, 47 / ci.h), w = ci.w * sc, h = ci.h * sc; return '<image href="' + ci.src + '" x="' + f(30 - w / 2) + '" y="' + f(54 - h) + '" width="' + f(w) + '" height="' + f(h) + '"/>'; }
    if (c.base) return recolor(plantArt(c.base, st), crop);
    if (c.tree && st >= 2) return treeArt(crop, st);
    if (crop === 'carrot' && st >= 2) {
      var cr = '';
      [-7, 0, 7].forEach(function (dx, i) { cr += leafAt(30 + dx * .4, 38, st === 3 ? 13 : 10, -90 + dx * 4, i % 2 ? LEAF : LEAF2) + leafAt(30 + dx * .4, 38, 9, -110 + dx * 6, LEAF); });
      if (st === 3) cr += '<path d="M24 38 Q30 33 36 38 L31 50 Q30 52 29 50Z" fill="' + CROPS.carrot.col + '" stroke="' + INK + '" stroke-width=".6"/><path d="M27 41 h3 M28 44 h3" stroke="#d26e28" stroke-width=".8"/>';
      return cr;
    }
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
    if (st === 1 && CI('sprout')) return ciAt('sprout', 30, 52, 0, 24);
    if (st === 2 && c.flower && CI('bud')) return ciAt('bud', 30, 54, 32);
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
    if (bug && CI('bug')) s += ciAt('bug', 44, 40, 0, 17);
    else if (bug) s += '<g transform="translate(41 30)"><ellipse rx="4.6" ry="3.2" fill="#9cbf6a" stroke="' + INK + '" stroke-width=".5"/><circle cx="4.6" cy="-.8" r="2.2" fill="#7fa253"/><circle cx="5.4" cy="-1.4" r=".6" fill="#fff"/></g>';
    return '<svg viewBox="0 0 60 56" aria-hidden="true"><g' + (s.indexOf('<image') >= 0 ? '' : ' filter="url(#cxwc)"') + '>' + s + '</g></svg>';
  }
  /* 花束：flowers = ['rose','lavender',...]（最多 9 朵） */
  function bouquetArt(flowers, wrap, ribbon, hi) {
    var W = WRAPS[wrap] || WRAPS.kraft, R = RIBBONS[ribbon] || RIBBONS.violet, n = flowers.length, o = '';
    // 背後的包裝紙
    var IMGBQ = n && flowers.every(function (cr) { return CI(cr); });
    o += IMGBQ ? '<path d="M16 58 L60 150 L104 58 Q60 40 16 58Z" fill="' + W[2] + '" fill-opacity=".9" stroke="' + INK + '" stroke-width=".7"/>' : ''; if (!IMGBQ) o += '<path d="M28 70 L60 150 L92 70 Q60 58 28 70Z" fill="' + W[2] + '" fill-opacity=".9" stroke="' + INK + '" stroke-width=".7"/>';
    if (n && flowers.every(function (cr) { return CI(cr); })) {
      // 用水彩花圖：每枝花從包裝紙裡的同一點往外呈扇形散開
      var H0 = n <= 1 ? 104 : n <= 3 ? 100 : n <= 6 ? 96 : 92, spanA = n <= 1 ? 0 : Math.min(62, 22 + n * 6), ord = [];
      for (var i = 0; i < n; i++) ord.push(i);
      ord.sort(function (x, y) { return Math.abs(y - (n - 1) / 2) - Math.abs(x - (n - 1) / 2); }); // 外圈先畫，中間的在前面
      ord.forEach(function (i) {
        var cr = flowers[i], t = n <= 1 ? .5 : i / (n - 1), ang = -spanA / 2 + t * spanA, H = H0 * (i % 2 ? .9 : 1) * (/lotus|strawberry|hydra|peony|sunflower|rose|gardenia/.test(cr) ? .84 : 1);
        var rad = ang * Math.PI / 180, hx = 60 + Math.sin(rad) * H * .8, hy = 122 - Math.cos(rad) * H * .8;
        o += '<g data-slot="' + i + '">' + (hi === i ? '<circle cx="' + f(hx) + '" cy="' + f(hy) + '" r="13" fill="#fff6c8" fill-opacity=".7" stroke="#d6a744" stroke-width="1.2" stroke-dasharray="2 2"/>' : '') +
          '<g transform="rotate(' + f(ang) + ' 60 122)">' + ciAt(cr, 60, 122, H) + '</g><circle cx="' + f(hx) + '" cy="' + f(hy) + '" r="12" fill="transparent"/></g>';
      });
    } else {
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
    }
    // 前面的包裝紙
    if (IMGBQ) o += '<g filter="url(#cxwc)">';
    o += '<path d="M24 76 L60 152 L96 76 L82 84 L60 78 L38 84 Z" fill="' + W[1] + '" fill-opacity=".93" stroke="' + INK + '" stroke-width=".7"/>' +
      '<path d="M38 84 L60 152 M82 84 L60 152" stroke="' + W[2] + '" stroke-width="1" fill="none" opacity=".8"/>';
    // 緞帶
    o += '<path d="M50 118 Q60 114 70 118 L69 124 Q60 120 51 124Z" fill="' + R[1] + '" stroke="' + INK + '" stroke-width=".5"/>' +
      '<path d="M60 121 Q46 108 44 118 Q46 126 60 121Z M60 121 Q74 108 76 118 Q74 126 60 121Z" fill="' + R[1] + '" fill-opacity=".92" stroke="' + INK + '" stroke-width=".5"/>' +
      '<path d="M58 123 L52 138 M62 123 L68 138" stroke="' + R[1] + '" stroke-width="2.4" stroke-linecap="round"/>' + dot(60, 121, 2.2, R[1]);
    if (IMGBQ) o += '</g>';
    return o;
  }
  function bouquetSvg(b, standalone) {
    if (b.recipe) return bqArt(b.recipe, standalone);
    var body = '<g>' + bouquetArt(b.flowers, b.wrap, b.ribbon, b.hi) + '</g>';
    if (!standalone) return '<svg viewBox="0 0 120 160" aria-hidden="true">' + body + '</svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="360" height="480"><defs>' + WC_DEFS + '</defs><rect width="120" height="160" fill="#f7f1e6"/>' + body + '</svg>';
  }
  function bouquetPng(b) {
    return new Promise(function (res) {
      try {
        var img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bouquetSvg(b, true));
        img.onload = function () { try { var c = document.createElement('canvas'); c.width = 360; c.height = 480; var x = c.getContext('2d'); x.fillStyle = '#f7f1e6'; x.fillRect(0, 0, 360, 480); x.drawImage(img, 0, 0, 360, 480); res(c.toDataURL('image/jpeg', .86)); } catch (e) { res(null); } };
        img.onerror = function () { res(null); }; img.src = url;
      } catch (e) { res(null); }
    });
  }
  /* ================= 配方花束（照參考圖描的，貼紙風） ================= */
  var BQX = (function () {
    function f(n) { return Math.round(n * 10) / 10; }
  function hx(c) { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/(.)/g, '$1$1'); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) { var p = hx(a), q = hx(b); return '#' + p.map(function (v, i) { var n = Math.round(v + (q[i] - v) * t); return (n < 16 ? '0' : '') + n.toString(16); }).join(''); }
  function dk(c) { return mix(c, '#5a3b30', .55); }
  function circ(x, y, r, fill, stroke, w) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (w || .6) + '"' : '') + '/>'; }
  function P(x, y) { return f(x) + ' ' + f(y); }
  function scallop(x, y, r, n, rot, ry) {
    ry = ry || 1; var d = '';
    for (var i = 0; i <= n; i++) {
      var a = rot + i / n * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * ry;
      if (!i) { d = 'M' + P(px, py); continue; }
      var am = rot + (i - .5) / n * Math.PI * 2, cx = x + Math.cos(am) * r * 1.32, cy = y + Math.sin(am) * r * 1.32 * ry;
      d += ' Q' + P(cx, cy) + ' ' + P(px, py);
    }
    return d + 'Z';
  }
  /* ===== 貼紙風一比一：每樣東西用自己的深色描邊、漸層、白色反光 ===== */
  var GID = 0;
  function SK() {
    var defs = [], u = 'g' + (GID++) + '_';
    return {
      lg: function (top, bot, ang) { var id = u + defs.length; defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (ang ? 1 : 0) + '" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bot + '"/></linearGradient>'); return 'url(#' + id + ')'; },
      rg: function (inC, outC) { var id = u + defs.length; defs.push('<radialGradient id="' + id + '" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="' + inC + '"/><stop offset="1" stop-color="' + outC + '"/></radialGradient>'); return 'url(#' + id + ')'; },
      defs: function () { return '<defs>' + defs.join('') + '</defs>'; }
    };
  }
  function sp(d, fill, stroke, w, ex) { return '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (w || .9) + '" stroke-linejoin="round" stroke-linecap="round"' + (ex || '') + '/>'; }
  function hl(d, w, op) { return '<path d="' + d + '" stroke="#fff" stroke-width="' + (w || 1.2) + '" fill="none" stroke-linecap="round" opacity="' + (op || .75) + '"/>'; }
  function star4(x, y, r, c) { var d = dk(c); return sp('M' + P(x, y - r) + ' Q' + P(x + r * .22, y - r * .22) + ' ' + P(x + r, y) + ' Q' + P(x + r * .22, y + r * .22) + ' ' + P(x, y + r) + ' Q' + P(x - r * .22, y + r * .22) + ' ' + P(x - r, y) + ' Q' + P(x - r * .22, y - r * .22) + ' ' + P(x, y - r) + 'Z', c, mix(c, '#4a5a8a', .35), .6); }
  function star5(x, y, r, c) { var pts = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; pts += (i ? ' L' : 'M') + P(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } return sp(pts + 'Z', c, dk(c), .6); }
  function heartS(x, y, s, c) { return sp('M' + P(x, y + 2.8 * s) + ' C' + P(x - 4.4 * s, y) + ' ' + P(x - 3.4 * s, y - 3.6 * s) + ' ' + P(x - 1.3 * s, y - 3.4 * s) + ' C' + P(x - .3 * s, y - 3.3 * s) + ' ' + P(x, y - 2.4 * s) + ' ' + P(x, y - 2 * s) + ' C' + P(x, y - 2.4 * s) + ' ' + P(x + .3 * s, y - 3.3 * s) + ' ' + P(x + 1.3 * s, y - 3.4 * s) + ' C' + P(x + 3.4 * s, y - 3.6 * s) + ' ' + P(x + 4.4 * s, y) + ' ' + P(x, y + 2.8 * s) + 'Z', c, dk(c), .6); }
  function arcText(id, txt, cx, cy, r, a0, a1, cols, size) {
    var x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    var o = '<path id="' + id + '" d="M' + P(x0, y0) + ' A' + r + ' ' + r + ' 0 0 1 ' + P(x1, y1) + '" fill="none"/>', t = '';
    for (var i = 0; i < txt.length; i++) t += '<tspan fill="' + cols[i % cols.length] + '">' + txt[i] + '</tspan>';
    return o + '<text font-family="Arial Rounded MT Bold,Nunito,Arial,sans-serif" font-weight="900" font-size="' + (size || 7) + '" letter-spacing=".6" stroke="#fff" stroke-width=".5" paint-order="stroke"><textPath href="#' + id + '" startOffset="50%" text-anchor="middle">' + t + '</textPath></text>';
  }
  /* 紗包：c 主色。回傳 back（放花後面）、front（放花前面） */
  function sheer(k, c, ribC) {
    var d = dk(c), L = mix(c, '#fff', .55), rd = dk(ribC);
    var back = sp('M20 74 Q40 62 60 64 Q82 60 100 68 L74 126 L46 126Z', k.lg(mix(c, '#fff', .75), mix(c, '#fff', .45)), d, .8);
    var front =
      sp('M100 68 Q90 90 58 104 L60 128 L72 126Z', k.lg(mix(c, '#fff', .5), c), d, .9) +
      sp('M16 76 Q30 86 50 88 Q66 89 78 84 L68 128 L50 128Z', k.lg(mix(c, '#fff', .6), mix(c, '#fff', .1)), d, .9) +
      hl('M24 82 Q36 100 50 120', 1.4, .7) + hl('M88 80 Q80 96 70 106', 1.2, .6) + hl('M60 94 L62 118', 1, .5) +
      // 裙邊
      sp('M50 129 Q44 140 42 150 Q51 155 60 153 Q69 155 78 150 Q76 140 70 129Z', k.lg(mix(c, '#fff', .45), c), d, .9) + hl('M50 136 L47 148', 1, .6) +
      // 蝴蝶結
      sp('M60 129 Q48 118 43 124 Q40 132 60 130Z', k.lg(mix(ribC, '#fff', .3), ribC), rd, .9) + sp('M60 129 Q72 118 77 124 Q80 132 60 130Z', k.lg(mix(ribC, '#fff', .3), ribC), rd, .9) +
      sp('M58.6 131 Q56 138 52 144 L55 145.4 Q58 139 60.4 132Z', ribC, rd, .7) + sp('M61.4 131 Q64 138 68 144 L65 145.4 Q62 139 59.6 132Z', ribC, rd, .7) +
      '<ellipse cx="60" cy="129.6" rx="3.2" ry="2.8" fill="' + ribC + '" stroke="' + rd + '" stroke-width=".9"/>' + hl('M46 123 q3 -2 6 1', .9, .7) + hl('M74 123 q-3 -2 -6 1', .9, .7);
    return { back: back, front: front };
  }
  function leafS(k, x, y, len, deg, w) {
    var a = deg * Math.PI / 180, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, nx = -Math.sin(a) * len * (w || .22), ny = Math.cos(a) * len * (w || .22);
    return sp('M' + P(x, y) + ' Q' + P((x + x2) / 2 + nx, (y + y2) / 2 + ny) + ' ' + P(x2, y2) + ' Q' + P((x + x2) / 2 - nx * .6, (y + y2) / 2 - ny * .6) + ' ' + P(x, y) + 'Z', k.lg('#a9d58c', '#6fae5a'), '#4f8a45', .8) +
      '<path d="M' + P(x + (x2 - x) * .15, y + (y2 - y) * .15) + ' Q' + P((x + x2) / 2 + nx * .3, (y + y2) / 2 + ny * .3) + ' ' + P(x + (x2 - x) * .8, y + (y2 - y) * .8) + '" stroke="#c8e6b0" stroke-width=".8" fill="none" opacity=".8"/>';
  }
  function stemS(x, y, x0, y0) { x0 = x0 || 60; y0 = y0 || 124; return '<path d="M' + P(x0 + (x - x0) * .1, y0) + ' Q' + P(x + (x0 - x) * .3, (y + y0) / 2) + ' ' + P(x, y) + '" stroke="#4f8a45" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M' + P(x0 + (x - x0) * .1, y0) + ' Q' + P(x + (x0 - x) * .3, (y + y0) / 2) + ' ' + P(x, y) + '" stroke="#86c06c" stroke-width="1.4" fill="none" stroke-linecap="round"/>'; }
  function tulipS(k, x, y, s, rot) {
    var c1 = '#fbc9d4', c2 = '#f18fa6', d = '#dc6f8a', g = k.lg(c1, c2), g2 = k.lg('#fde1e7', '#f5a7b8');
    var o = sp('M' + P(x - 8 * s, y - 3 * s) + ' C' + P(x - 9.4 * s, y + 8 * s) + ' ' + P(x - 5 * s, y + 12 * s) + ' ' + P(x, y + 12 * s) + ' C' + P(x + 5 * s, y + 12 * s) + ' ' + P(x + 9.4 * s, y + 8 * s) + ' ' + P(x + 8 * s, y - 3 * s) + ' C' + P(x + 7.6 * s, y - 9 * s) + ' ' + P(x + 5 * s, y - 11.6 * s) + ' ' + P(x + 3.4 * s, y - 10 * s) + ' C' + P(x + 2 * s, y - 12.6 * s) + ' ' + P(x - 2 * s, y - 12.6 * s) + ' ' + P(x - 3.4 * s, y - 10 * s) + ' C' + P(x - 5 * s, y - 11.6 * s) + ' ' + P(x - 7.6 * s, y - 9 * s) + ' ' + P(x - 8 * s, y - 3 * s) + 'Z', g, d, 1);
    o += sp('M' + P(x - 4.6 * s, y - 5 * s) + ' C' + P(x - 6 * s, y + 5 * s) + ' ' + P(x - 2.4 * s, y + 11.4 * s) + ' ' + P(x, y + 11.6 * s) + ' C' + P(x + 2.4 * s, y + 11.4 * s) + ' ' + P(x + 6 * s, y + 5 * s) + ' ' + P(x + 4.6 * s, y - 5 * s) + ' C' + P(x + 3 * s, y - 10.4 * s) + ' ' + P(x - 3 * s, y - 10.4 * s) + ' ' + P(x - 4.6 * s, y - 5 * s) + 'Z', g2, d, .8);
    o += '<path d="M' + P(x - 6.4 * s, y + 3 * s) + ' Q' + P(x - 5.6 * s, y + 9 * s) + ' ' + P(x - 2.4 * s, y + 11 * s) + ' M' + P(x + 6.4 * s, y + 3 * s) + ' Q' + P(x + 5.6 * s, y + 9 * s) + ' ' + P(x + 2.4 * s, y + 11 * s) + '" stroke="' + d + '" stroke-width=".6" fill="none" opacity=".6"/>';
    o += hl('M' + P(x - 2.6 * s, y - 6 * s) + ' Q' + P(x - 3.4 * s, y - 1 * s) + ' ' + P(x - 2.6 * s, y + 3 * s), 1.4 * s * .7, .85);
    return '<g transform="rotate(' + (rot || 0) + ' ' + f(x) + ' ' + f(y) + ')">' + o + '</g>';
  }
  function bellS(k, x, y, s) {
    var o = sp('M' + P(x - 3.6 * s, y + 3 * s) + ' C' + P(x - 4.2 * s, y - 2 * s) + ' ' + P(x - 2.4 * s, y - 4.4 * s) + ' ' + P(x, y - 4.4 * s) + ' C' + P(x + 2.4 * s, y - 4.4 * s) + ' ' + P(x + 4.2 * s, y - 2 * s) + ' ' + P(x + 3.6 * s, y + 3 * s) + ' Q' + P(x + 4.4 * s, y + 4.6 * s) + ' ' + P(x + 2.4 * s, y + 4 * s) + ' Q' + P(x + 1.2 * s, y + 5.2 * s) + ' ' + P(x, y + 4 * s) + ' Q' + P(x - 1.2 * s, y + 5.2 * s) + ' ' + P(x - 2.4 * s, y + 4 * s) + ' Q' + P(x - 4.4 * s, y + 4.6 * s) + ' ' + P(x - 3.6 * s, y + 3 * s) + 'Z', k.lg('#ffffff', '#eef4e2'), '#7fae6a', .8);
    return o + hl('M' + P(x - 1.8 * s, y - 2.6 * s) + ' Q' + P(x - 2.6 * s, y) + ' ' + P(x - 2 * s, y + 2 * s), .8, .9);
  }
  function lilyArc(k, x0, y0, cx, cy, ex, ey, n, s) {
    var o = '<path d="M' + P(x0, y0) + ' Q' + P(cx, cy) + ' ' + P(ex, ey) + '" stroke="#4f8a45" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M' + P(x0, y0) + ' Q' + P(cx, cy) + ' ' + P(ex, ey) + '" stroke="#86c06c" stroke-width="1.1" fill="none" stroke-linecap="round"/>', b = '';
    for (var i = 0; i < n; i++) { var t = .42 + i * (.58 / n), px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * ex, py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * ey;
      o += '<path d="M' + P(px, py) + ' q.6 2.4 0 ' + f(4 * s) + '" stroke="#5f9a50" stroke-width=".8" fill="none"/>'; b += bellS(k, px, py + 7.6 * s, s * (1 - i * .04)); }
    return o + b;
  }
  function puffS(k, x, y, s, c) { // 藍色重瓣小花（矢車菊感）
    var d = dk(c), o = '';
    for (var r = 0; r < 2; r++) for (var i = 0; i < 9; i++) { var a = (i + r * .5) / 9 * 360, rr = r ? 3.4 : 5.4;
      o += '<g transform="rotate(' + f(a) + ' ' + f(x) + ' ' + f(y) + ')">' + sp('M' + P(x - 1.9 * s, y - 1 * s) + ' Q' + P(x - 2.2 * s, y - rr * s - 1.6 * s) + ' ' + P(x, y - rr * s - 2 * s) + ' Q' + P(x + 2.2 * s, y - rr * s - 1.6 * s) + ' ' + P(x + 1.9 * s, y - 1 * s) + 'Z', r ? mix(c, '#fff', .35) : c, d, .5) + '</g>'; }
    return o + circ(x, y, 2 * s, '#fff3b0', '#d9b94a', .5);
  }
  function frillS(k, x, y, s, c) { // 康乃馨／金盞花那種皺邊花
    var d = dk(c), o = sp(scallop(x, y, 7.2 * s, 18, 0), k.rg(mix(c, '#fff', .3), c), d, .8);
    o += sp(scallop(x, y - .4 * s, 5 * s, 14, .2), k.rg(mix(c, '#fff', .45), mix(c, '#fff', .1)), d, .7) + sp(scallop(x, y - .6 * s, 2.8 * s, 9, .5), mix(c, '#fff', .35), d, .6);
    for (var i = 0; i < 8; i++) { var a = i * .785; o += '<path d="M' + P(x + Math.cos(a) * 3 * s, y + Math.sin(a) * 3 * s) + ' L' + P(x + Math.cos(a) * 6 * s, y + Math.sin(a) * 6 * s) + '" stroke="' + d + '" stroke-width=".4" opacity=".55"/>'; }
    return o + hl('M' + P(x - 4.6 * s, y - 2.4 * s) + ' Q' + P(x - 3.6 * s, y - 4.8 * s) + ' ' + P(x - 1 * s, y - 5.4 * s), 1, .7);
  }
  function babyS(k, x, y, s) {
    var o = '';
    for (var i = 0; i < 5; i++) { var a = i * 72; o += '<g transform="rotate(' + a + ' ' + f(x) + ' ' + f(y) + ')">' + sp('M' + P(x, y) + ' Q' + P(x - 2.2 * s, y - 2.6 * s) + ' ' + P(x - 1 * s, y - 4.2 * s) + ' Q' + P(x, y - 4.8 * s) + ' ' + P(x + 1 * s, y - 4.2 * s) + ' Q' + P(x + 2.2 * s, y - 2.6 * s) + ' ' + P(x, y) + 'Z', '#ffffff', '#8fbde6', .55) + '</g>'; }
    return o + circ(x, y, 1 * s, '#cfe6fb', '#8fbde6', .4);
  }
  function lavS(k, x0, y0, deg, len, s) {
    var a = deg * Math.PI / 180, o = '<path d="M' + P(x0, y0) + ' L' + P(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len) + '" stroke="#4f8a45" stroke-width="2.2" stroke-linecap="round"/>', fl = '';
    for (var i = 12; i >= 0; i--) {
      var t = 1 - i * .04, px = x0 + Math.cos(a) * len * t, py = y0 + Math.sin(a) * len * t, nx = -Math.sin(a), ny = Math.cos(a), r = (2.1 - i * .03) * s;
      [-1, 1, 0].forEach(function (sd, j) { var cx = px + nx * sd * 1.9 * s, cy = py + ny * sd * 1.9 * s + (j === 2 ? -.6 : 0);
        fl += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * .9) + '" ry="' + f(r * 1.1) + '" fill="' + (i < 3 ? '#c9b6ef' : j === 2 ? '#a88be0' : '#9a7dd6') + '" stroke="#7059b3" stroke-width=".55"/>'; });
    }
    return o + fl;
  }
  function frame(k, inner, deco) { return k.defs() + inner + (deco || ''); }
  var STK = {
    tulip: function () { var k = SK(), w = sheer(k, '#f7b8c6', '#f290a8'), o = '';
      [[36, 48], [84, 48], [60, 30], [60, 64]].forEach(function (q) { o += stemS(q[0], q[1] + 10); });
      o += leafS(k, 58, 110, 46, -128, .26) + leafS(k, 62, 110, 46, -52, .26);
      o += tulipS(k, 36, 48, 1.55, -14) + tulipS(k, 84, 48, 1.55, 14) + tulipS(k, 60, 30, 1.6, 0) + tulipS(k, 60, 64, 1.6, 0);
      var deco = arcText('t1', 'HAPPY DAY', 60, 72, 54, Math.PI * 1.08, Math.PI * 1.42, ['#f08aa6', '#f4a3b8', '#8fc4c0'], 7.5) + arcText('t2', 'TO YOU', 60, 72, 54, Math.PI * 1.6, Math.PI * 1.92, ['#f4a3b8', '#f08aa6'], 7.5) +
        star4(20, 98, 6, '#bfe0f6') + star4(28, 108, 3.4, '#bfe0f6') + star4(98, 102, 4, '#bfe0f6') + star4(104, 46, 3, '#9fd3cf');
      return frame(k, w.back + o + w.front, deco); },
    lily: function () { var k = SK(), w = sheer(k, '#f6eaa0', '#eed777'), o = '';
      o += leafS(k, 56, 116, 60, -112, .2) + leafS(k, 64, 116, 58, -66, .2);
      o += lilyArc(k, 54, 122, 40, 18, 82, 22, 7, 1.15) + lilyArc(k, 64, 122, 82, 30, 30, 34, 6, 1.1) + lilyArc(k, 58, 122, 58, 8, 92, 18, 5, 1);
      var deco = star5(16, 64, 5, '#f6d870') + star4(20, 34, 3.4, '#f6d870') + heartS(20, 92, 1.4, '#f4a8b6') + heartS(28, 100, 1, '#f4a8b6') + star5(100, 102, 6, '#f6d870') + star4(104, 74, 3, '#f6d870');
      return frame(k, w.back + o + w.front, deco); },
    gerbera: function () { var k = SK(), w = sheer(k, '#bfe6ea', '#8cc8e6'), o = '';
      var F = [[38, 40, 'y'], [58, 32, 'y'], [80, 42, 'b'], [42, 60, 'b'], [64, 56, 'b'], [84, 64, 'y'], [30, 58, 'y']];
      F.forEach(function (q) { o += stemS(q[0], q[1]); }); o += leafS(k, 56, 100, 22, -150) + leafS(k, 64, 100, 22, -30);
      F.forEach(function (q) { o += q[2] === 'b' ? puffS(k, q[0], q[1], 1.35, '#9ec5f2') : frillS(k, q[0], q[1], 1.35, '#f8de7a'); });
      var deco = arcText('g1', 'HAPPY', 60, 74, 54, Math.PI * 1.1, Math.PI * 1.38, ['#7fb6ea', '#f08aa6', '#f4c95c'], 8) + arcText('g2', 'BIRTHDAY', 60, 74, 54, Math.PI * 1.5, Math.PI * 1.9, ['#f4c95c', '#f6d870'], 7) +
        star4(18, 100, 5, '#f6d870') + star4(102, 104, 6, '#f6d870') + star4(26, 112, 3, '#bfe0f6') + star4(104, 52, 3, '#f6d870');
      return frame(k, w.back + o + w.front, deco); },
    gyp: function () { var k = SK(), w = sheer(k, '#bfe0f2', '#86bfe8'), o = '', pts = [];
      for (var i = 0; i < 46; i++) { var a = i * 2.39996, r = Math.sqrt((i + .5) / 46); var px = 60 + Math.cos(a) * r * 34, py = 54 + Math.sin(a) * r * 26; if (py > 76) py = 76 - (py - 76) * .3; pts.push([px, py]); }
      pts.forEach(function (q, i) { if (i % 2) o += '<path d="M' + P(60 + (q[0] - 60) * .1, 122) + ' L' + P(q[0], q[1]) + '" stroke="#5f9a50" stroke-width=".9"/>'; });
      pts.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (q) { o += babyS(k, q[0], q[1], 1.3); });
      var deco = '<path d="M18 52 Q14 70 22 92 Q30 110 26 124" stroke="#c9a3b0" stroke-width=".6" fill="none"/>' + sp('M18 38 C8 38 6 52 18 54 C30 52 28 38 18 38Z', k.rg('#ffd6e0', '#f08aa6'), '#d66f8c', .8) + hl('M13 42 q-1 3 1 6', 1, .8) + sp('M17 54 L19 54 L18.6 56.4 L17.4 56.4Z', '#f08aa6', '#d66f8c', .5) +
        '<path d="M66 24 Q86 34 108 30" stroke="#b9a7c8" stroke-width=".6" fill="none"/>' + ['#9cc3ef', '#9fd8b8', '#f6d870', '#f39a9a', '#9cc3ef'].map(function (c, i) { var x = 70 + i * 8, y = 26 + Math.sin(i * .7) * 2 + i * .6; return sp('M' + P(x, y) + ' L' + P(x + 6, y + .4) + ' L' + P(x + 3.2, y + 7) + 'Z', c, dk(c), .5); }).join('') +
        arcText('h1', 'HAPPY', 60, 74, 50, Math.PI * 1.32, Math.PI * 1.62, ['#a48fe0', '#f08aa6'], 8) +
        ['#f39a9a', '#f6d870', '#9fd8b8', '#9cc3ef', '#c3a9ec'].map(function (c, i) { return '<path d="M86 116 A' + (14 - i * 2) + ' ' + (14 - i * 2) + ' 0 0 1 ' + f(114 - i * 4) + ' 116" stroke="' + c + '" stroke-width="2" fill="none"/>'; }).join('') + sp('M84 116 q-2 -4 2 -5 q2 -3 5 0 q3 0 2 5Z', '#fff', '#c9d3dc', .5) + sp('M108 116 q-2 -4 2 -5 q2 -3 5 0 q3 0 2 5Z', '#fff', '#c9d3dc', .5) +
        star5(22, 108, 5, '#c9c2ee') + star5(104, 90, 4, '#c9b6ef');
      return frame(k, w.back + o + w.front, deco); },
    orange: function () { var k = SK(), w = sheer(k, '#f9d0a0', '#f4a560'), o = '';
      var F = [[40, 40, '#f6b23e'], [62, 32, '#f8c24e'], [84, 44, '#f6b23e'], [34, 60, '#f07a3c'], [58, 56, '#f8c24e'], [80, 64, '#f6b23e']];
      F.forEach(function (q) { o += stemS(q[0], q[1]); }); o += stemS(94, 30) + leafS(k, 58, 100, 22, -150) + leafS(k, 62, 100, 22, -30);
      o += sp('M94 30 C89 26 90 18 95 16 C99 19 99 26 94 30Z', k.lg('#fbc06a', '#f08a3c'), '#d66d2c', .7) + leafS(k, 94, 31, 5, 140) + leafS(k, 94, 31, 5, 40);
      F.forEach(function (q) { o += frillS(k, q[0], q[1], 1.5, q[2]); });
      var deco = arcText('o1', 'WITH LOVE!', 60, 74, 56, Math.PI * 1.1, Math.PI * 1.55, ['#6fb6c0', '#7fb6ea', '#9fd3cf'], 7.5) + star4(98, 104, 5, '#f6d870') + star4(18, 100, 4, '#bfe0f6') + star4(26, 110, 2.6, '#bfe0f6') + circ(14, 86, 1.6, '#f4a8b6');
      return frame(k, w.back + o + w.front, deco); },
    lav: function () { var k = SK(), w = sheer(k, '#dccdf2', '#b39ae4'), o = '';
      o += leafS(k, 56, 112, 34, -130, .2) + leafS(k, 64, 112, 34, -50, .2) + leafS(k, 58, 112, 28, -100, .18);
      o += lavS(k, 58, 124, -112, 90, 1.55) + lavS(k, 62, 124, -68, 90, 1.55) + lavS(k, 60, 124, -90, 102, 1.65);
      var deco = star4(18, 94, 4, '#f6d870') + star4(22, 104, 2.4, '#f6d870') + circ(26, 98, 1, '#f6d870') + heartS(24, 116, 1.4, '#f4a8b6') + star5(102, 106, 5.4, '#f6d870') + star4(100, 40, 3, '#c9b6ef') + star4(106, 64, 2.4, '#bfe0f6');
      return frame(k, w.back + o + w.front, deco); }
  };
  /* ===== 描圖版：座標直接照原圖量的 ===== */
  function tulipT(k, cx, cy, w, h, rot) {
    var g = k.lg('#fbd0d8', '#f398ab'), g2 = k.lg('#fde4e9', '#f6aebd'), d = '#cf5f79';
    function X(u) { return f(cx + u * w); } function Y(v) { return f(cy + v * h); }
    var o = sp('M' + X(-.8) + ' ' + Y(-.86) + ' C' + X(-1.02) + ' ' + Y(-.5) + ' ' + X(-1.04) + ' ' + Y(.3) + ' ' + X(-.86) + ' ' + Y(.62) + ' C' + X(-.62) + ' ' + Y(1) + ' ' + X(.62) + ' ' + Y(1) + ' ' + X(.86) + ' ' + Y(.62) + ' C' + X(1.04) + ' ' + Y(.3) + ' ' + X(1.02) + ' ' + Y(-.5) + ' ' + X(.8) + ' ' + Y(-.86) + ' C' + X(.66) + ' ' + Y(-.98) + ' ' + X(.46) + ' ' + Y(-.9) + ' ' + X(.36) + ' ' + Y(-.78) + ' C' + X(.24) + ' ' + Y(-1.02) + ' ' + X(-.24) + ' ' + Y(-1.02) + ' ' + X(-.36) + ' ' + Y(-.78) + ' C' + X(-.46) + ' ' + Y(-.9) + ' ' + X(-.66) + ' ' + Y(-.98) + ' ' + X(-.8) + ' ' + Y(-.86) + 'Z', g, d, 1.6);
    o += sp('M' + X(-.52) + ' ' + Y(-.7) + ' C' + X(-.66) + ' ' + Y(-.2) + ' ' + X(-.62) + ' ' + Y(.62) + ' ' + X(-.36) + ' ' + Y(.86) + ' C' + X(-.16) + ' ' + Y(.98) + ' ' + X(.16) + ' ' + Y(.98) + ' ' + X(.36) + ' ' + Y(.86) + ' C' + X(.62) + ' ' + Y(.62) + ' ' + X(.66) + ' ' + Y(-.2) + ' ' + X(.52) + ' ' + Y(-.7) + ' C' + X(.36) + ' ' + Y(-1) + ' ' + X(-.36) + ' ' + Y(-1) + ' ' + X(-.52) + ' ' + Y(-.7) + 'Z', g2, d, 1.3);
    o += '<path d="M' + X(-.84) + ' ' + Y(-.1) + ' Q' + X(-.8) + ' ' + Y(.5) + ' ' + X(-.56) + ' ' + Y(.8) + ' M' + X(.84) + ' ' + Y(-.1) + ' Q' + X(.8) + ' ' + Y(.5) + ' ' + X(.56) + ' ' + Y(.8) + '" stroke="' + d + '" stroke-width="1" fill="none" opacity=".55"/>';
    o += hl('M' + X(-.3) + ' ' + Y(-.62) + ' Q' + X(-.42) + ' ' + Y(-.2) + ' ' + X(-.34) + ' ' + Y(.2), 2.2, .8);
    return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' + o + '</g>';
  }
  function leafT(k, d, dark) { return sp(d, k.lg(dark ? '#7fae55' : '#b3d47c', dark ? '#4f8a35' : '#88b85a'), '#3d6a2a', 1.5); }
  function stemT(d) { return '<path d="' + d + '" stroke="#3d6a2a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="#78b04e" stroke-width="2.8" fill="none" stroke-linecap="round"/>'; }
  function wrapT(k, c, line, rib, back, front, waist, skirt, bow) {
    var o = { back: sp(back, k.lg(mix(c, '#fff', .7), mix(c, '#fff', .35)), line, 1.4) };
    var b = bow, rd = dk(rib);
    o.front = sp(front, k.lg(mix(c, '#fff', .6), mix(c, '#fff', .15)), line, 1.4) + sp(skirt, k.lg(mix(c, '#fff', .5), c), line, 1.4) +
      sp('M' + b[0] + ' ' + b[1] + ' Q' + (b[0] - 26) + ' ' + (b[1] - 16) + ' ' + (b[0] - 28) + ' ' + (b[1] - 3) + ' Q' + (b[0] - 28) + ' ' + (b[1] + 10) + ' ' + b[0] + ' ' + (b[1] + 2) + 'Z', k.lg(mix(rib, '#fff', .35), rib), rd, 1.4) +
      sp('M' + b[0] + ' ' + b[1] + ' Q' + (b[0] + 26) + ' ' + (b[1] - 16) + ' ' + (b[0] + 28) + ' ' + (b[1] - 3) + ' Q' + (b[0] + 28) + ' ' + (b[1] + 10) + ' ' + b[0] + ' ' + (b[1] + 2) + 'Z', k.lg(mix(rib, '#fff', .35), rib), rd, 1.4) +
      sp('M' + (b[0] - 3) + ' ' + (b[1] + 2) + ' L' + (b[0] - 15) + ' ' + (b[1] + 26) + ' L' + (b[0] - 9) + ' ' + (b[1] + 28) + ' L' + b[0] + ' ' + (b[1] + 4) + 'Z', rib, rd, 1.2) +
      sp('M' + (b[0] + 3) + ' ' + (b[1] + 2) + ' L' + (b[0] + 15) + ' ' + (b[1] + 26) + ' L' + (b[0] + 9) + ' ' + (b[1] + 28) + ' L' + b[0] + ' ' + (b[1] + 4) + 'Z', rib, rd, 1.2) +
      '<ellipse cx="' + b[0] + '" cy="' + (b[1] + 1) + '" rx="5" ry="4.4" fill="' + rib + '" stroke="' + rd + '" stroke-width="1.4"/>';
    return o;
  }
  function ruffT(k, cx, cy, r, c, line, center) {
    var o = sp(scallop(cx, cy, r * .82, 14, .2, .92), k.rg(mix(c, '#fff', .35), c), line, 1.5);
    o += sp(scallop(cx, cy - r * .05, r * .56, 11, .5, .92), k.rg(mix(c, '#fff', .45), mix(c, '#fff', .1)), line, 1.1);
    for (var i = 0; i < 10; i++) { var a = i * .628 + .3; o += '<path d="M' + P(cx + Math.cos(a) * r * .3, cy + Math.sin(a) * r * .28) + ' L' + P(cx + Math.cos(a) * r * .7, cy + Math.sin(a) * r * .64) + '" stroke="' + line + '" stroke-width=".8" opacity=".45"/>'; }
    return o + (center ? circ(cx, cy - r * .05, r * .26, center) : sp(scallop(cx, cy - r * .06, r * .26, 7, .9), mix(c, '#fff', .3), line, .9));
  }
  function blueT(k, cx, cy, r) {
    var o = '', g = k.rg('#d6e6fd', '#8fb4ee'), d = '#3e6aa8';
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 - Math.PI / 2, px = cx + Math.cos(a) * r * .56, py = cy + Math.sin(a) * r * .56;
      o += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(r * .42) + '" ry="' + f(r * .34) + '" transform="rotate(' + f(a * 180 / Math.PI + 90) + ' ' + f(px) + ' ' + f(py) + ')" fill="' + g + '" stroke="' + d + '" stroke-width="1.5"/>'; }
    for (var j = 0; j < 6; j++) { var b = j / 6 * Math.PI * 2 - Math.PI / 2; o += '<path d="M' + P(cx + Math.cos(b) * r * .28, cy + Math.sin(b) * r * .28) + ' L' + P(cx + Math.cos(b) * r * .7, cy + Math.sin(b) * r * .7) + '" stroke="#6f97d6" stroke-width=".9" opacity=".7"/>'; }
    o += circ(cx, cy, r * .26, '#f8d468', '#d9a83a', 1);
    for (var m = 0; m < 6; m++) o += circ(cx + Math.cos(m) * r * .13, cy + Math.sin(m) * r * .13, r * .04, '#d9963a');
    return o + hl('M' + P(cx - r * .7, cy - r * .3) + ' Q' + P(cx - r * .6, cy - r * .62) + ' ' + P(cx - r * .3, cy - r * .74), 1.6, .7);
  }
  function bellT(k, x, y, w) {
    var s = w / 13;
    var o = sp('M' + P(x - 6 * s, y + 4 * s) + ' C' + P(x - 7 * s, y - 3 * s) + ' ' + P(x - 4 * s, y - 7.4 * s) + ' ' + P(x, y - 7.4 * s) + ' C' + P(x + 4 * s, y - 7.4 * s) + ' ' + P(x + 7 * s, y - 3 * s) + ' ' + P(x + 6 * s, y + 4 * s) +
      ' Q' + P(x + 9.4 * s, y + 6 * s) + ' ' + P(x + 8.6 * s, y + 8 * s) + ' Q' + P(x + 6 * s, y + 6.4 * s) + ' ' + P(x + 4.2 * s, y + 8.6 * s) + ' Q' + P(x + 2 * s, y + 6.6 * s) + ' ' + P(x, y + 8.8 * s) + ' Q' + P(x - 2 * s, y + 6.6 * s) + ' ' + P(x - 4.2 * s, y + 8.6 * s) + ' Q' + P(x - 6 * s, y + 6.4 * s) + ' ' + P(x - 8.6 * s, y + 8 * s) + ' Q' + P(x - 9.4 * s, y + 6 * s) + ' ' + P(x - 6 * s, y + 4 * s) + 'Z',
      k.lg('#f4f9ec', '#ffffff'), '#6d8aa0', 1.4);
    return o + '<path d="M' + P(x - 3 * s, y - 5 * s) + ' Q' + P(x - 4.6 * s, y) + ' ' + P(x - 3.4 * s, y + 4 * s) + '" stroke="#dfe9d4" stroke-width="1.4" fill="none"/>';
  }
  function lavSpikeT(k, x0, y0, x1, y1, wBot, wTop) {
    var o = '', n = 15, d = '#6a52ad';
    for (var i = n - 1; i >= 0; i--) {
      var t = i / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = wBot + (wTop - wBot) * t, r = w * .24;
      [-1, 1, 0].forEach(function (sd, j) { var cx = x + sd * w * .3, cy = y + (j === 2 ? -r * .5 : 0);
        o += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * (j === 2 ? .95 : 1)) + '" ry="' + f(r * .82) + '" fill="' + (t > .8 ? '#d6c8f4' : j === 2 ? '#cbb8f2' : '#b39ce6') + '" stroke="' + d + '" stroke-width="1.1"/>'; });
      if (i % 3 === 1) o += circ(x - w * .1, y - r * .3, r * .22, '#8a6e52');
    }
    return o;
  }
  var TR = {
    tulip: { vb: '72 18 190 248', draw: function (k) {
      var w = wrapT(k, '#f8bfca', '#e98fa3', '#f39aae', 'M82 104 Q95 160 146 202 L190 202 Q230 160 246 108 Q164 92 82 104Z', 'M88 140 Q128 158 166 160 Q206 156 242 132 Q228 170 190 202 L146 202 Q104 172 88 140Z', 0, 'M146 204 Q138 232 133 252 Q166 262 200 252 Q195 232 188 204Z', [167, 210]);
      var o = stemT('M163 80 Q165 140 167 196') + stemT('M128 112 Q148 150 162 196') + stemT('M200 112 Q182 150 172 196');
      o += leafT(k, 'M145 82 Q138 94 151 106 Q156 92 145 82Z', 1) + leafT(k, 'M188 82 Q195 94 182 106 Q177 92 188 82Z', 1);
      o += tulipT(k, 164, 53, 25, 27, 0) + tulipT(k, 113, 90, 24, 27, -20) + tulipT(k, 215, 90, 24, 27, 20);
      o += leafT(k, 'M96 118 Q130 118 156 152 Q116 152 96 118Z') + leafT(k, 'M234 116 Q200 118 176 152 Q216 152 234 116Z');
      o += leafT(k, 'M150 138 Q150 172 167 197 Q160 168 160 138Z', 1) + leafT(k, 'M184 138 Q184 172 167 197 Q174 168 174 138Z', 1);
      o += tulipT(k, 165, 122, 25, 26, 0);
      return w.back + o + w.front + hl('M100 150 Q118 176 140 196', 2, .55) + hl('M232 140 Q220 162 202 182', 2, .5); } },
    lily: { vb: '322 18 196 248', draw: function (k) {
      var w = wrapT(k, '#f8eba8', '#d9c46a', '#f3dc7a', 'M334 126 Q420 108 508 124 Q472 170 446 206 L396 206 Q368 170 334 126Z', 'M336 130 Q420 154 506 128 Q472 172 446 206 L396 206 Q368 172 336 130Z', 0, 'M396 214 Q388 236 386 254 Q420 262 454 254 Q450 236 444 214Z', [420, 210]);
      var o = '', b = '';
      function arc(d, bells) { o += stemT(d); bells.forEach(function (q) { o += '<path d="M' + q[0] + ' ' + (q[1] - 12) + ' q1 4 0 8" stroke="#4f8a35" stroke-width="1.6" fill="none"/>'; b += bellT(k, q[0], q[1], q[2]); }); }
      arc('M422 196 C414 140 404 62 382 40 C372 32 362 38 360 46', [[358, 56, 20], [380, 52, 17], [398, 64, 18]]);
      arc('M420 180 C412 130 402 84 380 82 C368 82 360 90 358 96', [[358, 104, 20], [384, 102, 18], [406, 104, 16], [370, 130, 18], [396, 134, 18], [380, 154, 16]]);
      arc('M424 196 C432 140 446 54 466 36 C476 30 486 38 488 48', [[488, 58, 20], [470, 70, 18], [452, 86, 16]]);
      arc('M428 172 C436 124 450 96 472 94 C484 94 492 100 494 106', [[494, 114, 20], [470, 112, 18], [446, 116, 17], [460, 140, 17], [438, 150, 16]]);
      o += b + leafT(k, 'M368 138 Q402 146 424 176 Q388 174 368 138Z') + leafT(k, 'M478 136 Q454 148 430 170 Q464 166 478 136Z');
      return w.back + o + w.front + hl('M346 138 Q368 170 392 196', 2, .55); } },
    gerbera: { vb: '62 300 216 240', draw: function (k) {
      var w = wrapT(k, '#bfe8ee', '#8cc4d0', '#9fd4ea', 'M84 402 Q170 384 252 400 Q228 446 194 484 L148 484 Q112 446 84 402Z', 'M88 416 Q170 446 252 406 Q228 450 194 484 L148 484 Q110 450 88 416Z', 0, 'M148 488 Q140 510 134 530 Q170 540 206 530 Q200 510 194 488Z', [171, 492]);
      var o = stemT('M150 410 Q160 440 168 470') + stemT('M176 410 Q172 440 170 470') + stemT('M210 400 Q190 440 172 470') + stemT('M120 420 Q150 446 166 470');
      o += ruffT(k, 100, 372, 32, '#f9e08f', '#e2bf5a') + ruffT(k, 166, 330, 32, '#f9e08f', '#e2bf5a') + ruffT(k, 130, 348, 22, '#fae49a', '#e2bf5a') + ruffT(k, 224, 388, 32, '#f9e08f', '#e2bf5a', '#f3b84a');
      o += blueT(k, 207, 346, 30) + sp('M146 343 C139 343 138 356 146 360 C154 356 153 343 146 343Z', k.lg('#c7e0a0', '#7fae55'), '#3d6a2a', 1.2);
      o += leafT(k, 'M196 446 Q214 418 232 414 Q222 438 196 446Z') + leafT(k, 'M150 418 Q146 432 158 444 Q160 428 150 418Z', 1);
      o += blueT(k, 176, 382, 34) + blueT(k, 128, 394, 34);
      return w.back + o + w.front + hl('M98 424 Q118 452 140 476', 2, .55); } },
    orange: { vb: '72 582 200 232', draw: function (k) {
      var w = wrapT(k, '#fbd3a8', '#ecaa70', '#f6a05a', 'M94 698 Q170 684 246 694 Q228 732 194 762 L146 762 Q112 732 94 698Z', 'M96 704 Q170 732 244 700 Q228 732 194 762 L146 762 Q112 732 96 704Z', 0, 'M146 766 Q138 786 134 805 Q168 814 202 805 Q198 786 192 766Z', [168, 770]);
      var o = stemT('M130 680 Q152 712 165 744') + stemT('M172 700 Q170 724 168 746') + stemT('M210 690 Q186 718 172 746') + stemT('M172 640 Q170 690 168 744') + stemT('M205 652 Q210 634 222 622');
      o += sp('M224 600 C212 600 210 616 222 624 C236 622 236 602 224 600Z', k.lg('#fbb26a', '#f07e2e'), '#c9601f', 1.4) + leafT(k, 'M218 626 Q232 624 240 632 Q226 638 218 626Z');
      o += leafT(k, 'M108 690 Q130 690 150 706 Q118 712 108 690Z') + leafT(k, 'M228 696 Q206 700 188 712 Q216 716 228 696Z');
      o += ruffT(k, 172, 618, 34, '#f9b23e', '#de8a2a') + ruffT(k, 120, 652, 34, '#f7883c', '#d2602a', '#fbbf6a') + ruffT(k, 224, 662, 34, '#f9b23e', '#de8a2a') + ruffT(k, 172, 672, 36, '#f9b840', '#de8a2a');
      return w.back + o + w.front + hl('M100 700 Q120 728 140 752', 2, .55); } },
    lav: { vb: '338 568 186 244', draw: function (k) {
      var w = wrapT(k, '#ddd0f4', '#b4a0dc', '#b79ae6', 'M358 684 Q432 670 508 684 Q486 730 458 756 L402 756 Q378 730 358 684Z', 'M360 694 Q434 716 508 690 Q486 730 458 756 L402 756 Q378 730 360 694Z', 0, 'M402 768 Q396 790 392 805 Q430 814 466 805 Q462 790 458 768Z', [430, 765]);
      var o = stemT('M398 700 Q412 724 426 744') + stemT('M420 690 Q424 720 428 746') + stemT('M458 700 Q444 724 432 744');
      o += leafT(k, 'M406 700 Q414 720 428 742 Q414 714 414 700Z', 1) + leafT(k, 'M448 700 Q440 720 430 742 Q444 714 442 700Z', 1);
      o += lavSpikeT(k, 396, 700, 370, 604, 34, 15) + lavSpikeT(k, 458, 700, 484, 604, 34, 15) + lavSpikeT(k, 421, 692, 422, 576, 40, 17);
      o += leafT(k, 'M384 690 Q396 708 420 730 Q398 716 384 690Z', 1) + leafT(k, 'M470 690 Q456 710 434 730 Q456 716 470 690Z', 1) + leafT(k, 'M352 668 Q382 686 400 706 Q370 704 352 668Z') + leafT(k, 'M504 668 Q476 688 458 706 Q490 702 504 668Z');
      return w.back + o + w.front + hl('M368 702 Q384 726 402 748', 2, .55); } }
  };
  /* 薰衣草：一整條花穗，外緣坑坑巴巴，裡面畫小花 */
  function lavSpikeT(k, x0, y0, x1, y1, wBot, wTop) {
    var n = 12, L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
    function pt(t, side, extra) { var w = (wBot + (wTop - wBot) * t) / 2 + (extra || 0); return [x0 + (x1 - x0) * t + nx * side * w, y0 + (y1 - y0) * t + ny * side * w]; }
    var d = 'M' + P.apply(null, pt(0, -1)), bump = (wBot + wTop) * .1;
    for (var i = 0; i < n; i++) { var a = pt((i + .5) / n, -1, bump), b = pt((i + 1) / n, -1, -bump * .4); d += ' Q' + P(a[0], a[1]) + ' ' + P(b[0], b[1]); }
    var tip = [x1 + ux * wTop * .45, y1 + uy * wTop * .45], tl = pt(1, -1), tr = pt(1, 1);
    d += ' Q' + P(tl[0] + ux * wTop * .5, tl[1] + uy * wTop * .5) + ' ' + P(tip[0], tip[1]) + ' Q' + P(tr[0] + ux * wTop * .5, tr[1] + uy * wTop * .5) + ' ' + P(tr[0], tr[1]);
    for (var j = n - 1; j >= 0; j--) { var c = pt((j + .25) / n, 1, bump), e = pt(Math.max(0, j - .25) / n, 1, -bump * .4); d += ' Q' + P(c[0], c[1]) + ' ' + P(e[0], e[1]); }
    var o = sp(d + 'Z', k.lg('#d2c0f4', '#9d84da'), '#6a52ad', 1.5);
    for (var r = 0; r < n; r++) { var t = (r + .5) / n, w = (wBot + (wTop - wBot) * t) / 2, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t, side = r % 2 ? 1 : -1;
      var fx = cx + nx * side * w * .35, fy = cy + ny * side * w * .35;
      o += '<path d="M' + P(fx - w * .32, fy + 1) + ' q' + f(w * .32) + ' ' + f(-w * .45) + ' ' + f(w * .64) + ' 0" stroke="#6a52ad" stroke-width="1" fill="none" opacity=".75"/>';
      o += '<ellipse cx="' + f(fx) + '" cy="' + f(fy - w * .1) + '" rx="' + f(w * .22) + '" ry="' + f(w * .14) + '" fill="#e6dcfb" opacity=".8"/>';
      if (r % 3 === 0) o += circ(cx - nx * side * w * .3, cy - ny * side * w * .3, Math.max(1, w * .08), '#8a6e52');
    }
    return o;
  }
  /* 其他參考圖要用的花 */
  function roseT(k, cx, cy, r, c) {
    var d = dk(c), o = sp(scallop(cx, cy, r * .84, 7, .3, .92), k.rg(mix(c, '#fff', .45), c), d, 1.5);
    o += sp(scallop(cx, cy - r * .06, r * .6, 6, 1, .9), k.rg(mix(c, '#fff', .55), mix(c, '#fff', .15)), d, 1.2);
    o += '<path d="M' + P(cx - r * .36, cy - r * .02) + ' Q' + P(cx - r * .02, cy - r * .5) + ' ' + P(cx + r * .36, cy - r * .08) + ' Q' + P(cx + r * .12, cy + r * .3) + ' ' + P(cx - r * .16, cy + r * .06) + ' Q' + P(cx - r * .02, cy - r * .22) + ' ' + P(cx + r * .14, cy - r * .02) + '" stroke="' + d + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    o += '<path d="M' + P(cx - r * .74, cy + r * .2) + ' Q' + P(cx - r * .5, cy + r * .6) + ' ' + P(cx, cy + r * .64) + ' M' + P(cx + r * .74, cy + r * .1) + ' Q' + P(cx + r * .6, cy + r * .5) + ' ' + P(cx + r * .2, cy + r * .66) + '" stroke="' + d + '" stroke-width="1" fill="none" opacity=".6"/>';
    return o + hl('M' + P(cx - r * .62, cy - r * .3) + ' Q' + P(cx - r * .5, cy - r * .64) + ' ' + P(cx - r * .16, cy - r * .74), 2, .65);
  }
  function daisyT(k, cx, cy, r, rot) {
    var o = '';
    for (var i = 0; i < 22; i++) { var a = i / 22 * 360 + (rot || 0); o += '<ellipse cx="' + f(cx) + '" cy="' + f(cy - r * .58) + '" rx="' + f(r * .12) + '" ry="' + f(r * .4) + '" transform="rotate(' + f(a) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + k.lg('#ffffff', '#eef0fa') + '" stroke="#8f8fb0" stroke-width="1.2"/>'; }
    return o + circ(cx, cy, r * .26, k.rg('#fbe08a', '#e9b23a'), '#c58a2a', 1.4) + circ(cx - r * .07, cy - r * .07, r * .08, '#fdf0b8');
  }
  function sunT(k, cx, cy, r) {
    var o = '';
    for (var kk = 0; kk < 2; kk++) for (var i = 0; i < 16; i++) { var a = (i + kk * .5) / 16 * Math.PI * 2, r0 = r * .42, r1 = r * (kk ? .88 : 1), w = .2;
      o += sp('M' + P(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0) + ' Q' + P(cx + Math.cos(a - .13) * r1 * .8, cy + Math.sin(a - .13) * r1 * .8) + ' ' + P(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1) + ' Q' + P(cx + Math.cos(a + .13) * r1 * .8, cy + Math.sin(a + .13) * r1 * .8) + ' ' + P(cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0) + 'Z', k.lg(kk ? '#fde58a' : '#f9d35a', kk ? '#f6c53e' : '#eeb030'), '#c88a22', 1.2); }
    o += circ(cx, cy, r * .44, k.rg('#7a4a2a', '#4a2c18'), '#3a2414', 1.5) + circ(cx, cy, r * .26, '#6a3f22');
    for (var j = 0; j < 18; j++) { var b = j * 2.4, rr = Math.sqrt(j / 18) * r * .36; o += circ(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr, r * .025, '#9a6a3a'); }
    return o;
  }
  function eucaT(k, x0, y0, x1, y1, n, rr) {
    var o = '<path d="M' + P(x0, y0) + ' L' + P(x1, y1) + '" stroke="#6f8f8a" stroke-width="1.6"/>';
    for (var i = 1; i <= n; i++) { var t = i / (n + .5), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, s = i % 2 ? 1 : -1, sz = rr * (1 - t * .35);
      o += '<ellipse cx="' + f(x + s * sz * 1.1) + '" cy="' + f(y) + '" rx="' + f(sz) + '" ry="' + f(sz * .8) + '" fill="' + k.lg('#c4d8d2', '#93b3ad') + '" stroke="#5f7f7a" stroke-width="1.2"/>'; }
    return o;
  }
  function smallT(k, x, y, r, c) {
    var d = dk(c), o = '';
    for (var i = 0; i < 5; i++) { var a = i * 72 - 90, px = x + Math.cos(a * Math.PI / 180) * r * .55, py = y + Math.sin(a * Math.PI / 180) * r * .55; o += circ(px, py, r * .48, k.rg(mix(c, '#fff', .4), c), d, 1.1); }
    return o + circ(x, y, r * .3, '#fbe7a0', '#c99a3a', .9);
  }
  function budT(k, x, y, r, c) { var d = dk(c); return sp('M' + P(x - r, y + r * .3) + ' Q' + P(x - r * 1.1, y - r) + ' ' + P(x, y - r * 1.2) + ' Q' + P(x + r * 1.1, y - r) + ' ' + P(x + r, y + r * .3) + ' Q' + P(x, y + r) + ' ' + P(x - r, y + r * .3) + 'Z', k.lg(mix(c, '#fff', .3), c), d, 1.3) + sp('M' + P(x - r * .9, y + r * .4) + ' L' + P(x - r * .2, y + r * .2) + ' L' + P(x, y + r * 1.1) + ' L' + P(x + r * .2, y + r * .2) + ' L' + P(x + r * .9, y + r * .4) + ' Q' + P(x, y + r * 1.4) + ' ' + P(x - r * .9, y + r * .4) + 'Z', '#86b95c', '#3d6a2a', 1.1); }
  function tulipLie(k, cx, cy, w, h, rot, c1, c2) { return tulipT(k, cx, cy, w, h, rot).replace(/#fbd0d8/g, c1 || '#fbd0d8').replace(/#f398ab/g, c2 || '#f398ab'); }
  var TR2 = {
    purple: { vb: '0 0 528 559', draw: function (k) {
      var lil = '#c8b2ec', line = '#8f74c6';
      var o = sp('M2 22 L268 14 Q380 60 462 108 Q500 150 526 200 L330 330 L120 330 Q40 290 2 210Z', k.lg('#e6dcf8', '#cfbdf0'), line, 1.6);
      o += stemT('M250 400 Q245 300 238 190') + stemT('M250 400 Q270 300 300 230') + stemT('M250 400 Q200 320 160 160') + stemT('M250 400 Q300 330 340 260') + stemT('M250 400 Q240 300 252 160');
      o += leafT(k, 'M276 6 Q258 110 244 210 Q262 110 292 10Z', 1) + leafT(k, 'M340 300 Q400 270 450 250 Q410 300 340 300Z') + leafT(k, 'M210 330 Q180 280 190 230 Q220 280 210 330Z', 1);
      o += tulipLie(k, 236, 110, 34, 72, -6) + tulipLie(k, 302, 168, 32, 62, 12) + tulipLie(k, 356, 184, 26, 52, 22);
      o += daisyT(k, 160, 118, 112);
      o += tulipLie(k, 118, 232, 30, 42, -24) + tulipLie(k, 196, 250, 38, 40, 0) + tulipLie(k, 300, 252, 26, 46, 78, '#fbd6dc', '#f2a6b6');
      o += budT(k, 252, 156, 16, '#f4f6fb');
      [[160, 250], [182, 264], [146, 274], [200, 286], [168, 296], [222, 262], [190, 240]].forEach(function (q) { o += star5(q[0], q[1], 14, '#bfe0f8'); });
      o += daisyT(k, 346, 250, 104, 8);
      o += sp('M8 200 Q60 280 140 318 Q300 318 470 240 L526 200 Q470 330 380 400 L190 400 Q60 320 8 200Z', k.lg('#d9c8f4', '#b39ae6'), line, 1.6);
      o += sp('M462 108 Q500 150 526 200 L470 232 Q474 170 462 108Z', k.lg('#c3abea', '#9b80d8'), line, 1.4);
      o += hl('M60 260 Q140 330 220 380', 3, .5) + hl('M420 300 Q380 350 340 390', 3, .45);
      o += sp('M160 400 Q150 480 165 545 Q250 558 330 548 Q320 470 330 404Z', k.lg('#cdb8f2', '#a88ae0'), line, 1.6);
      o += sp('M182 384 L332 404 L330 428 L182 410Z', k.lg('#fbe7a0', '#f2cf5a'), '#c9a23a', 1.4) + sp('M284 410 Q330 470 382 522 L360 532 Q310 480 268 424Z', k.lg('#fbe7a0', '#f2cf5a'), '#c9a23a', 1.4) + sp('M268 424 L272 522 L292 526 L292 424Z', '#f4d66c', '#c9a23a', 1.4);
      return o; } },
    roses: { vb: '0 0 620 760', draw: function (k) {
      var pap = '#fbe2c0', line = '#8a6a4a';
      var o = sp('M70 40 L590 136 L560 330 L20 270Z', k.lg('#fbe2c0', '#f4cf9c'), line, 2);
      o += stemT('M290 470 Q295 300 296 210') + stemT('M290 470 Q250 330 170 250') + stemT('M290 470 Q330 360 380 300') + stemT('M290 470 Q280 400 240 345') + stemT('M290 470 Q250 200 222 50') + stemT('M290 470 Q230 250 182 92') + stemT('M290 470 Q400 200 460 36') + stemT('M290 470 Q350 250 415 145');
      o += leafT(k, 'M78 130 Q120 150 116 200 Q66 180 78 130Z') + leafT(k, 'M44 250 Q100 260 120 300 Q60 300 44 250Z', 1) + leafT(k, 'M118 330 Q150 300 170 350 Q140 370 118 330Z') + leafT(k, 'M404 100 Q440 80 450 120 Q420 130 404 100Z') + leafT(k, 'M430 60 Q470 40 490 80 Q450 90 430 60Z', 1) + leafT(k, 'M440 360 Q480 340 500 370 Q470 390 440 360Z');
      o += eucaT(k, 470, 340, 560, 120, 6, 13).replace(/c4d8d2/g, 'd7e6a6').replace(/93b3ad/g, 'b7cf7e').replace(/5f7f7a/g, '6f8a3a').replace(/6f8f8a/g, '6f8a3a') + eucaT(k, 480, 380, 590, 280, 4, 13).replace(/c4d8d2/g, 'd7e6a6').replace(/93b3ad/g, 'b7cf7e').replace(/5f7f7a/g, '6f8a3a').replace(/6f8f8a/g, '6f8a3a');
      o += budT(k, 222, 46, 20, '#e8504a') + budT(k, 182, 84, 18, '#e8504a') + budT(k, 462, 30, 18, '#e8504a');
      o += smallT(k, 156, 128, 18, '#f8e27a') + smallT(k, 132, 160, 15, '#f8e27a') + smallT(k, 418, 140, 18, '#f39a5a') + smallT(k, 400, 166, 14, '#f39a5a') + smallT(k, 432, 202, 18, '#f3ec8a') + smallT(k, 488, 206, 18, '#b8bdf0') + smallT(k, 502, 258, 22, '#ee6a62') + smallT(k, 484, 300, 16, '#ee8a6a');
      o += roseT(k, 296, 142, 92, '#f2875f') + roseT(k, 170, 238, 90, '#f6a3a0') + roseT(k, 384, 302, 88, '#f8bf8f') + roseT(k, 240, 348, 86, '#fbe7a0');
      o += sp('M18 268 Q60 250 120 320 Q190 400 280 455 L278 528 Q120 450 18 268Z', k.lg('#fbe2c0', '#f4cf9c'), line, 2);
      o += sp('M560 322 Q500 380 420 398 Q340 410 268 460 L278 528 Q420 430 560 322Z', k.lg('#fbe2c0', '#f4cf9c'), line, 2);
      o += sp('M246 556 L194 692 Q280 742 386 692 L334 556Z', k.lg('#fbe2c0', '#f4cf9c'), line, 2) + sp('M246 522 L334 522 L334 560 L246 560Z', '#f6d6a8', line, 2);
      var R = '#ee3e30', Rd = '#b8261c';
      o += sp('M290 572 Q200 520 180 572 Q188 620 290 584Z', k.lg('#f66a5a', R), Rd, 2) + sp('M290 572 Q380 520 400 572 Q392 620 290 584Z', k.lg('#f66a5a', R), Rd, 2) + sp('M282 584 L214 690 L240 696 L292 590Z', R, Rd, 2) + sp('M298 584 L346 688 L320 696 L288 590Z', R, Rd, 2) + '<ellipse cx="290" cy="578" rx="16" ry="14" fill="' + R + '" stroke="' + Rd + '" stroke-width="2"/>';
      return o; } },
    sun: { vb: '0 0 441 640', draw: function (k) {
      var line = '#a67a46';
      var o = sp('M10 100 L100 30 L292 26 Q312 110 326 186 L312 322 L48 322 L4 200Z', k.lg('#f6d9a8', '#ebbf7a'), line, 1.8);
      o += sp('M318 168 L440 200 L412 322 L330 330Z', k.lg('#f2cf96', '#e3b06a'), line, 1.6);
      o += eucaT(k, 150, 240, 152, 0, 9, 9) + eucaT(k, 300, 160, 324, 36, 6, 8);
      o += leafT(k, 'M96 200 Q130 180 164 210 Q130 236 96 200Z') + leafT(k, 'M80 300 Q120 276 164 300 Q120 334 80 300Z', 1) + leafT(k, 'M324 340 Q360 320 398 352 Q360 372 324 340Z') + leafT(k, 'M170 370 Q206 344 244 372 Q206 396 170 370Z', 1);
      o += ruffT(k, 222, 122, 66, '#f4b8c8', '#d27d96') + ruffT(k, 294, 166, 42, '#f4b8c8', '#d27d96') + ruffT(k, 366, 210, 52, '#f4b8c8', '#d27d96');
      o += sunT(k, 244, 272, 108);
      o += sp('M44 300 Q150 334 240 334 Q330 326 404 304 L384 352 Q300 420 210 440 Q110 420 44 352Z', k.lg('#f4d39c', '#e4b26a'), line, 1.8);
      o += sp('M8 140 L4 280 L52 300 Q34 210 8 140Z', '#efc98a', line, 1.6);
      o += sp('M92 436 Q62 520 66 600 Q160 632 246 612 Q252 520 242 436Z', k.lg('#f2cf96', '#dfa960'), line, 1.8) + hl('M120 460 Q112 530 118 600', 3, .45);
      var R = '#ec7c9a', Rd = '#b84a6a';
      o += sp('M160 450 Q70 400 46 432 Q50 480 150 468Z', k.lg('#f6a2b8', R), Rd, 1.6) + sp('M160 450 Q260 420 290 470 Q280 540 196 478Z', k.lg('#f6a2b8', R), Rd, 1.6) + sp('M140 462 Q100 530 72 612 L94 616 Q124 540 160 470Z', R, Rd, 1.4) + sp('M200 470 Q240 520 278 572 L262 584 Q224 530 186 476Z', R, Rd, 1.4) + '<ellipse cx="164" cy="460" rx="14" ry="11" fill="' + R + '" stroke="' + Rd + '" stroke-width="1.6"/>';
      return o; } },
    pink: { vb: '0 0 384 399', draw: function (k) {
      var o = '';
      [[156, 300], [166, 310], [176, 300], [186, 312], [196, 300], [206, 310], [216, 300], [226, 306]].forEach(function (q, i) { o += '<path d="M' + q[0] + ' ' + q[1] + ' L' + (q[0] + (i - 3.5) * 5) + ' 396" stroke="' + (i % 2 ? '#3d6a2a' : '#6d9a4a') + '" stroke-width="7" stroke-linecap="round"/>'; });
      o += leafT(k, 'M60 18 Q112 40 100 86 Q50 64 60 18Z') + leafT(k, 'M14 104 Q60 100 80 132 Q30 140 14 104Z', 1) + leafT(k, 'M8 190 Q60 170 90 196 Q40 220 8 190Z') + leafT(k, 'M376 92 Q340 104 320 140 Q370 130 376 92Z') + leafT(k, 'M286 196 Q320 196 330 228 Q290 222 286 196Z', 1) + leafT(k, 'M296 6 Q306 40 290 64 Q280 30 296 6Z') + leafT(k, 'M28 160 Q12 168 4 160 Q14 148 28 160Z', 1);
      o += smallT(k, 76, 150, 22, '#fdf7f2') + smallT(k, 272, 150, 24, '#f7eef0') + smallT(k, 298, 96, 20, '#fdf7f2') + smallT(k, 196, 174, 22, '#fdf7f2') + smallT(k, 92, 108, 16, '#fdf7f2') + budT(k, 106, 74, 12, '#e9a0b2') + budT(k, 176, 146, 14, '#9cc06a');
      o += roseT(k, 232, 46, 44, '#f4b3c2') + roseT(k, 130, 78, 46, '#f6c0cc') + roseT(k, 208, 96, 62, '#f2a3b6') + roseT(k, 134, 142, 54, '#f7c6d0');
      o += leafT(k, 'M216 148 Q246 120 262 150 Q240 176 216 148Z', 1);
      var R = '#ec9fb2', Rd = '#c46a84';
      o += sp('M176 226 L214 226 L216 304 L176 304Z', k.lg('#f6bccb', R), Rd, 1.6) + '<path d="M176 250 H216 M176 270 H216 M176 288 H216" stroke="' + Rd + '" stroke-width="1" opacity=".6"/>';
      o += sp('M190 214 Q140 180 110 200 Q100 236 186 228Z', k.lg('#f8c6d2', R), Rd, 1.6) + sp('M196 214 Q260 176 290 206 Q296 250 202 228Z', k.lg('#f8c6d2', R), Rd, 1.6);
      o += sp('M184 226 Q90 240 4 286 L12 300 Q100 262 190 236Z', k.lg('#f6bccb', R), Rd, 1.4) + sp('M180 232 Q130 290 104 394 L122 396 Q146 300 192 240Z', k.lg('#f6bccb', '#e08aa0'), Rd, 1.4) + sp('M206 232 Q270 290 300 372 L284 380 Q254 300 198 240Z', k.lg('#f6bccb', R), Rd, 1.4);
      o += '<ellipse cx="193" cy="220" rx="14" ry="12" fill="' + R + '" stroke="' + Rd + '" stroke-width="1.6"/>';
      return o; } }
  };

    function gypBody() { var s = STK.gyp(), cut = s.indexOf('<path d="M18 52'); return cut > 0 ? s.slice(0, cut) : s; }
    function svg(key, standalone) {
      var vb, body;
      if (key === 'gyp') { vb = '0 0 120 160'; body = gypBody(); }
      else if (TR2[key]) { var k2 = SK(), b2 = TR2[key].draw(k2); vb = TR2[key].vb; body = '<style>.ns *{vector-effect:non-scaling-stroke}</style>' + k2.defs() + '<g class="ns">' + b2 + '</g>'; }
      else if (TR[key]) { var k = SK(), b1 = TR[key].draw(k); vb = TR[key].vb; body = k.defs() + b1; }
      else return '';
      if (!standalone) return '<svg viewBox="' + vb + '" aria-hidden="true">' + body + '</svg>';
      var v = vb.split(' ').map(Number);
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="360" height="480" preserveAspectRatio="xMidYMid meet"><rect x="' + (v[0] - v[2]) + '" y="' + (v[1] - v[3]) + '" width="' + v[2] * 3 + '" height="' + v[3] * 3 + '" fill="#f7f1e6"/>' + body + '</svg>';
    }
    return { svg: svg };
  })();
  /* 用圖片的花束（豆包畫的） */
  (function loadFarmImg() { if (window.__cxFIMG || document.getElementById('cx-fimg-js')) return; var sc = document.createElement('script'); sc.id = 'cx-fimg-js'; sc.src = 'farmimg.js'; sc.onload = function () { try { if (gm && !gm.hidden) render(); } catch (e) {} }; document.body.appendChild(sc); })();
  (function loadDishImg() { if (window.__cxDIMG || document.getElementById('cx-dimg-js')) return; var sc = document.createElement('script'); sc.id = 'cx-dimg-js'; sc.src = 'dishimg.js'; sc.onload = function () { try { if (gm && !gm.hidden) render(); } catch (e) {} }; document.body.appendChild(sc); })();
  (function loadCropImg() { if (window.__cxCIMG || document.getElementById('cx-cimg-js')) return; var sc = document.createElement('script'); sc.id = 'cx-cimg-js'; sc.src = 'cropimg.js'; sc.onload = function () { try { if (gm && !gm.hidden) render(); } catch (e) {} }; document.body.appendChild(sc); })();
  function CI(k) { return (window.__cxCIMG || {})[k]; }
  /* 底部中心 (x,y)，給高 H 或寬 W */
  /* 小驚喜：跳出 Q 版小人 */
  function chibiOf(name) { name = String(name || ''); return /昶司/.test(name) ? 'cb_changsi' : /仁彌|仁弥/.test(name) ? 'cb_renmi' : ''; }
  function surprise(who, artHtml, title, line) {
    var cb = CI(who); if (!cb) return false;
    var old = document.querySelector('.cx-sp'); if (old) old.remove();
    var d = document.createElement('div'); d.className = 'cx-sp';
    d.innerHTML = '<div class="card"><div class="row"><img class="cb" src="' + cb.src + '" alt="">' + (artHtml ? '<div class="art">' + artHtml + '</div>' : '') + '</div><b>' + esc(title) + '</b>' + (line ? '<p>' + esc(line) + '</p>' : '') + '<small>點一下關閉</small></div>';
    d.addEventListener('click', function () { d.remove(); });
    document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 6000);
    return true;
  }
  function ciAt(k, x, y, H, W, extra) { var m = CI(k); if (!m) return ''; var h = H || W * m.h / m.w, w = W || H * m.w / m.h; return '<image href="' + m.src + '" x="' + f(x - w / 2) + '" y="' + f(y - h) + '" width="' + f(w) + '" height="' + f(h) + '"' + (extra || '') + '/>'; }
  function DI(k) { return (window.__cxDIMG || {})[k]; }
  function FI(k) { return (window.__cxFIMG || {})[k]; }
  /* 圖片放進 SVG：底部中心在 (x,y)，高 H（或寬 W） */
  function imgAt(k, x, y, H, W, extra) { var m = FI(k); if (!m) return ''; var h = H || W * m.h / m.w, w = W || H * m.w / m.h; return '<image href="' + m.src + '" x="' + f(x - w / 2) + '" y="' + f(y - h) + '" width="' + f(w) + '" height="' + f(h) + '"' + (extra || '') + '/>'; }
  (function loadBqImg() { if (window.__cxBQIMG || document.getElementById('cx-bqimg-js')) return; var sc = document.createElement('script'); sc.id = 'cx-bqimg-js'; sc.src = 'bqimg.js'; sc.onload = function () { try { if (gm && !gm.hidden) render(); } catch (e) {} }; document.body.appendChild(sc); })();
  function bqArt(key, standalone) {
    var im = (window.__cxBQIMG || {})[key]; if (!im) return BQX.svg(key, standalone);
    var body = '<image href="' + im + '" x="0" y="0" width="300" height="400" preserveAspectRatio="xMidYMid meet"/>';
    if (!standalone) return '<svg viewBox="0 0 300 400" aria-hidden="true">' + body + '</svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -20 330 440" width="360" height="480"><rect x="-15" y="-20" width="330" height="440" fill="#f7f1e6"/>' + body + '</svg>';
  }
  var BQR = [
    { k: 'daisy', n: '雛菊花束', need: { daisy: 8 } },
    { k: 'lav', n: '薰衣草花束', need: { lavender: 6 } },
    { k: 'gyp', n: '滿天星花束', need: { gypso: 8 } },
    { k: 'tulip', n: '粉鬱金香花束', need: { tulip: 6 } },
    { k: 'orange', n: '暖橘花束', need: { marigold: 4, rose: 2, tulip: 1 } },
    { k: 'gerbera', n: '晴天花束', need: { marigold: 4, cornflower: 3 } },
    { k: 'purple', n: '春日花束', need: { tulip: 3, daisy: 2, rose: 1, cornflower: 2 } },
    { k: 'lily', n: '鈴蘭花束', need: { lilyvalley: 6 } },
    { k: 'bluetulip', n: '藍調鬱金香', need: { tulip: 6, cornflower: 3, gypso: 2 } },
    { k: 'redtulip', n: '紅鬱金香', need: { tulip: 9 } },
    { k: 'hydra', n: '繡球花束', need: { hydrangea: 3, gypso: 3 } },
    { k: 'sun', n: '向日葵花束', need: { sunflower: 1, peony: 2, rose: 1 } },
    { k: 'peony', n: '牡丹花束', need: { peony: 6 } },
    { k: 'cream', n: '奶油花束', need: { rose: 3, peony: 1, tulip: 2, gypso: 1 } },
    { k: 'roses', n: '玫瑰花束', need: { rose: 4, tulip: 2, lavender: 1 } }
  ];
  /* ================= 花園畫面 ================= */
  var recentGift = [];
  var gm = null, gTab = 'field', sel = '', giftTo = null, timer = null;
  function gOpen(fromHome) {
    var g = G(); if (!g) return;
    if (!gm) {
      gm = A.makeModal('cx-garden-modal', 'fa-seedling', '我們的花園');
      gm.onBack = function () { gm.close(); homeOpen(); return true; };
      gm.onClose = function () { clearInterval(timer); timer = null; };
      gm.body.addEventListener('click', function (e) { if (stageMoved && Date.now() - stageMoved < 300) { e.preventDefault(); e.stopPropagation(); } }, true);
      gm.body.addEventListener('click', gClick);
      gm.body.addEventListener('pointerdown', function (e) { var st = e.target.closest('.cx-g-stage.pan'); if (!st || e.pointerType !== 'mouse') return; stageDrag = { st: st, x: e.clientX, l: st.scrollLeft, moved: false }; });
      window.addEventListener('pointermove', function (e) { if (!stageDrag) return; var dx = e.clientX - stageDrag.x; if (Math.abs(dx) > 5) stageDrag.moved = true; if (stageDrag.moved) stageDrag.st.scrollLeft = stageDrag.l - dx; });
      window.addEventListener('pointerup', function () { if (stageDrag && stageDrag.moved) stageMoved = Date.now(); stageDrag = null; });
      gm.body.addEventListener('input', function (e) { if (e.target.id === 'cx-bq-name') bq.name = e.target.value; });
      gm.body.addEventListener('change', function (e) { if (e.target.id === 'cx-hen-name' && sel && sel[0] === 'a') { var g = G(), ak = sel.slice(1).split(':'), h = herd(g, ak[0])[+ak[1]]; if (h) { h.name = e.target.value.trim().slice(0, 6) || h.name; save(); render(); } } });
      gm.el.classList.add('cx-garden');
    }
    var daily = '';
    if (g.lastDaily !== today()) { g.lastDaily = today(); g.coins += 15; log(g, '🪙 ' + A.pname() + ' 給的今日零用錢 +15'); daily = A.pname() + '：「今天的零用錢，拿去買種子吧。」'; }
    simulate(true); save();
    sel = ''; render(); gm.open();
    if (daily) setTimeout(function () { toast(daily + ' +15', 'success'); }, 400);
    clearInterval(timer); var ticks = 0;
    timer = setInterval(function () {
      if (!gm.isOpen()) return;
      if (++ticks % 20 === 0 && simulate(false)) { render(); return; }
      if (gTab === 'field') tickField();
    }, 1000);
  }
  /* ================= 農場場景（等角視角：花園／果園／雞舍） ================= */
  var area = 'g';
  var OL = '#7a6252', TW = 60, TH = 30;
  function sig(g) {
    var now = Date.now();
    return area + '|' + allPlots(g).map(function (p) { return p.crop ? p.crop + stage(p) + (p.bug ? 'b' : '') + ((p.wetUntil || 0) > now ? 'w' : '') : (p.open ? 'e' : 'l'); }).join(',') +
      '|' + pen + Object.keys(g.pens).map(function (k) { return g.pens[k].built ? 1 : 0; }).join('') + '|' + allAni(g).map(function (x) { var h = x[1]; return (h.eggs || 0) + (hungry(h, now) ? 'h' : 'f') + (h.name || ''); }).join(',');
  }
  var lastSig = '';
  function tickField() {
    var g = G(); if (!g) return; var now = Date.now();
    allPlots(g).forEach(function (p) { grow(p, now); if (ready(p) && !p.readyAt) p.readyAt = now; });
    tickAll(g, now);
    if (sig(g) !== lastSig) { render(); return; }
    var info = gm.body.querySelector('.cx-g-panel [data-live]'); if (!info) return;
    if (sel && sel[0] !== 'a') { var q = PK(g, sel); if (q && q.crop) info.textContent = plotStatus(q, now); }
    else if (sel && sel[0] === 'a') { var ak = sel.slice(1).split(':'), hh = penBuilt(g, ak[0]) && herd(g, ak[0])[+ak[1]]; if (hh) info.textContent = aniStatus(hh, now, ak[0]); }
  }
  function coinsHtml(g) { return '<span class="cx-g-coin"><i class="fas fa-coins"></i> ' + g.coins + '</span>'; }
  function render() {
    var g = G(); if (!g || !gm) return;
    var now = Date.now(); allPlots(g).forEach(function (p) { grow(p, now); if (ready(p) && !p.readyAt) p.readyAt = now; }); wxApply(g, now);
    tickAll(g, now);
    var tabs = [['field', '農場'], ['inv', '倉庫'], ['bq', '花束'], ['kit', '廚房'], ['dex', '圖鑑'], ['log', '紀錄']];
    var h = '<div class="cx-g-top">' + coinsHtml(g) + '<div class="cx-g-tabs">' + tabs.map(function (t) { return '<button type="button" data-gt="' + t[0] + '" class="' + (gTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    if (gTab === 'field') h += fieldHtml(g, now);
    else if (gTab === 'inv') h += invHtml(g);
    else if (gTab === 'bq') h += bqHtml(g);
    else if (gTab === 'kit') h += kitchenHtml(g);
    else if (gTab === 'dex') h += dexHtml(g);
    else h += logHtml(g);
    var oldSt = gm.body.querySelector('.cx-g-stage'), keepX = oldSt ? oldSt.scrollLeft : 0, keepKey = oldSt ? oldSt.dataset.k : '';
    gm.body.innerHTML = h; lastSig = sig(g);
    if (hybridMsg) { var hm = hybridMsg, hk = hybridKey; hybridMsg = ''; hybridKey = ''; setTimeout(function () { var ci = CI(hk); if (!(ci && surprise('cb_me', '<img src="' + ci.src + '" alt="">', hm.replace('✨ ', ''), CROPS[hk] && CROPS[hk].lang ? '花語：' + CROPS[hk].lang : ''))) toast(hm, 'success'); }, 700); }
    var nst = gm.body.querySelector('.cx-g-stage');
    if (nst) { nst.dataset.k = gTab + area; if (landScroll) { nst.scrollLeft = (landScroll - 1) * nst.clientWidth; landScroll = null; } else if (keepKey === gTab + area) nst.scrollLeft = keepX; }
  }
  function plotStatus(p, now) { return (ready(p) ? '已經可以收成了' : '還要大約 ' + dur(left(p))) + '　·　' + ((p.wetUntil || 0) > now ? '土還濕濕的（' + dur(p.wetUntil - now) + '）' : '土乾了，長得比較慢'); }
  function _unusedHenStatus(h, now) { return (hungry(h, now) ? '肚子餓了，餵了才會下蛋' : '吃飽了（' + dur(h.fedUntil - now) + '）') + '　·　' + ((h.eggs || 0) ? '有 ' + h.eggs + ' 顆蛋可以撿' : '還沒下蛋'); }

  /* --- 等角繪圖小工具 --- */
  function P2(x, y) { return f(x) + ',' + f(y); }
  function poly(pts, fill, stroke, sw, extra) { return '<polygon points="' + pts.map(function (q) { return P2(q[0], q[1]); }).join(' ') + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1) + '" stroke-linejoin="round"' : '') + (extra || '') + '/>'; }
  function mkIso(OX, OY) { return function (r, c) { return [OX + (c - r) * TW / 2, OY + (c + r) * TH / 2]; }; }
  function platform(iso, R, C, m, top, side1, side2, T) {
    var t = iso(-m, -m), rt = iso(-m, C - 1 + m), b = iso(R - 1 + m, C - 1 + m), l = iso(R - 1 + m, -m);
    return poly([l, b, [b[0], b[1] + T], [l[0], l[1] + T]], side1, OL, 1) + poly([b, rt, [rt[0], rt[1] + T], [b[0], b[1] + T]], side2, OL, 1) + poly([t, rt, b, l], top, OL, 1);
  }
  var FENCE_COL = '#fffaf2';
  function fenceLine(a, b, n) {
    var o = '', i, pts = [];
    for (i = 0; i <= n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
    [5, 10].forEach(function (hh) { o += '<polyline points="' + pts.map(function (q) { return P2(q[0], q[1] - hh); }).join(' ') + '" fill="none" stroke="' + OL + '" stroke-width="3"/><polyline points="' + pts.map(function (q) { return P2(q[0], q[1] - hh); }).join(' ') + '" fill="none" stroke="' + FENCE_COL + '" stroke-width="1.6"/>'; });
    pts.forEach(function (q) { o += '<path d="M' + P2(q[0] - 2, q[1]) + ' L' + P2(q[0] - 2, q[1] - 12) + ' L' + P2(q[0], q[1] - 15) + ' L' + P2(q[0] + 2, q[1] - 12) + ' L' + P2(q[0] + 2, q[1]) + 'Z" fill="' + FENCE_COL + '" stroke="' + OL + '" stroke-width=".8" stroke-linejoin="round"/>'; });
    return o;
  }
  function fences(iso, R, C, m, which) {
    var k = m - .3, t = iso(-k, -k), rt = iso(-k, C - 1 + k), b = iso(R - 1 + k, C - 1 + k), l = iso(R - 1 + k, -k);
    var n1 = Math.round((C - 1 + 2 * k) * 2.2), n2 = Math.round((R - 1 + 2 * k) * 2.2);
    return which === 'back' ? fenceLine(l, t, n2) + fenceLine(t, rt, n1) : fenceLine(l, b, n1) + fenceLine(b, rt, n2);
  }
  var DECOR = {
    hydra: function (x, y, col) { var o = '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="10" ry="4" fill="#00000014"/>'; [[-5, -6], [4, -7], [0, -12], [-2, -4], [6, -3]].forEach(function (q, i) { o += '<circle cx="' + f(x + q[0]) + '" cy="' + f(y + q[1]) + '" r="5.4" fill="' + (i % 2 ? col : '#b9c8f0') + '" stroke="' + OL + '" stroke-width=".7"/>'; }); [[-4, -8], [3, -10], [1, -5]].forEach(function (q) { o += '<circle cx="' + f(x + q[0]) + '" cy="' + f(y + q[1]) + '" r="1" fill="#fff" opacity=".8"/>'; }); return o; },
    pink: function (x, y) { return clump(x, y, ['#f2a7b8', '#f7c7d2', '#ee8fa4']); },
    white: function (x, y) { return clump(x, y, ['#fffaf2', '#fff', '#f6efe2'], '#f2c94c'); },
    yellow: function (x, y) { return clump(x, y, ['#f6d26b', '#f8e08f', '#efc24e']); },
    lav: function (x, y) { var o = '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="8" ry="3" fill="#00000012"/>'; [-4, 0, 4].forEach(function (dx, i) { o += '<path d="M' + P2(x + dx, y) + ' L' + P2(x + dx * 1.3, y - 13 - i % 2 * 2) + '" stroke="#7fa36a" stroke-width="1"/>'; for (var j = 0; j < 4; j++) o += '<ellipse cx="' + f(x + dx * 1.3) + '" cy="' + f(y - 13 - i % 2 * 2 + j * 2.4) + '" rx="1.7" ry="2.2" fill="#a493cf" stroke="' + OL + '" stroke-width=".4"/>'; }); return o; },
    bush: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="9" ry="3.5" fill="#00000014"/><circle cx="' + f(x - 3) + '" cy="' + f(y - 6) + '" r="6" fill="#8fc178" stroke="' + OL + '" stroke-width=".8"/><circle cx="' + f(x + 4) + '" cy="' + f(y - 7) + '" r="6.5" fill="#9fcd86" stroke="' + OL + '" stroke-width=".8"/><circle cx="' + f(x + 1) + '" cy="' + f(y - 11) + '" r="5" fill="#a9d58f" stroke="' + OL + '" stroke-width=".8"/>'; },
    stone: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="7" ry="3.4" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".8"/>'; },
    mush: function (x, y) { return '<rect x="' + f(x - 1.6) + '" y="' + f(y - 5) + '" width="3.2" height="5" rx="1" fill="#fbf3e6" stroke="' + OL + '" stroke-width=".6"/><path d="M' + P2(x - 5, y - 4.4) + ' Q' + P2(x, y - 12) + ' ' + P2(x + 5, y - 4.4) + 'Z" fill="#e7735f" stroke="' + OL + '" stroke-width=".6"/><circle cx="' + f(x - 1.6) + '" cy="' + f(y - 7.5) + '" r=".9" fill="#fff"/><circle cx="' + f(x + 1.8) + '" cy="' + f(y - 6.6) + '" r=".8" fill="#fff"/>'; },
    lamp: function (x, y) { return '<rect x="' + f(x - 1) + '" y="' + f(y - 16) + '" width="2" height="16" fill="#8a7a6a"/><rect x="' + f(x - 3.6) + '" y="' + f(y - 22) + '" width="7.2" height="7" rx="1.5" fill="#fff6d8" stroke="' + OL + '" stroke-width=".8"/><path d="M' + P2(x - 4.4, y - 22) + ' L' + P2(x, y - 25.5) + ' L' + P2(x + 4.4, y - 22) + 'Z" fill="#8a7a6a"/>'; }
  };
  var DECOS = {
    lamp: ['小路燈', 40, [2.7, -.7], 'fa-lightbulb'], mailbox: ['信箱', 50, [2.74, .35], 'fa-envelope'], bench: ['長椅', 60, [1.4, 2.76], 'fa-chair'],
    bunny: ['兔子石像', 80, [-.66, .45], 'fa-carrot'], swing: ['鞦韆', 120, [-.66, 1.55], 'fa-child-reaching'],
    windmill: ['小風車', 150, [-.66, -.66], 'fa-fan'], well: ['水井', 90, [-.6, 2.5], 'fa-bucket'], arch: ['玫瑰拱門', 200, [2.76, 1.6], 'fa-archway']
  };
  var FENCES = { white: ['奶白', 0, '#fffaf2'], wood: ['原木', 60, '#e2c29a'], pink: ['粉紅', 80, '#f7cdd7'], mint: ['薄荷', 80, '#cfe9d7'], lilac: ['淡紫', 80, '#ddd1f2'], sky: ['天藍', 80, '#cfe2f6'] };
  function decoG(g) { g.deco = g.deco || {}; g.deco.own = g.deco.own || {}; g.deco.on = g.deco.on || {}; g.deco.fown = g.deco.fown || { white: 1 }; g.deco.fence = g.deco.fence || 'white'; if (g.deco.own.pond) { delete g.deco.own.pond; delete g.deco.on.pond; g.coins = (g.coins || 0) + 100; } return g.deco; }
  var DART = {
    lamp: function (x, y) { return DECOR.lamp(x, y); },
    mailbox: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="6" ry="2.4" fill="#00000016"/><rect x="' + f(x - 1) + '" y="' + f(y - 13) + '" width="2" height="13" fill="#8a6a52"/><path d="M' + P2(x - 6, y - 13) + ' v-6 q0 -4 6 -4 q6 0 6 4 v6z" fill="#f2a0b4" stroke="' + OL + '" stroke-width=".8"/><path d="M' + P2(x + 6, y - 19) + ' v-6 h4 v3 h-4" fill="#e65a5a" stroke="' + OL + '" stroke-width=".6"/><rect x="' + f(x - 3) + '" y="' + f(y - 18) + '" width="6" height="1.6" rx=".8" fill="#fff"/>'; },
    bench: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="14" ry="3.4" fill="#00000016"/><path d="M' + P2(x - 11, y) + ' v-6 M' + P2(x + 11, y - 2) + ' v-6" stroke="#7a5a44" stroke-width="2"/>' + poly([[x - 13, y - 6], [x + 13, y - 9], [x + 13, y - 11], [x - 13, y - 8]], '#d9a56a', OL, .8) + poly([[x - 13, y - 9], [x + 13, y - 12], [x + 13, y - 20], [x - 13, y - 17]], '#e4b47c', OL, .8) + '<path d="M' + P2(x - 12, y - 13) + ' L' + P2(x + 12, y - 16) + '" stroke="#c48e52" stroke-width=".8"/>'; },
    bunny: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="9" ry="3" fill="#00000016"/>' + poly([[x - 7, y], [x + 7, y], [x + 7, y - 5], [x - 7, y - 5]], '#e8e2d8', OL, .7) + '<g transform="translate(' + P2(x - 1, y - 5) + ')">' + rabbitArt(false, 1, 2).replace(/#f4ecdf/g, '#dcd6cc').replace(/#f6b6c4/g, '#c9c2b6') + '</g>'; },
    pond: function (x, y) { return '<g transform="rotate(-26.6 ' + f(x) + ' ' + f(y) + ')"><ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="19" ry="5" fill="#a9d7ef" stroke="' + OL + '" stroke-width=".9"/><ellipse cx="' + f(x - 2) + '" cy="' + f(y - .8) + '" rx="13" ry="2.8" fill="#c4e6f6"/><ellipse cx="' + f(x + 9) + '" cy="' + f(y + .6) + '" rx="3.4" ry="1.5" fill="#8fc178" stroke="' + OL + '" stroke-width=".5"/><circle cx="' + f(x + 9) + '" cy="' + f(y - .4) + '" r="1.2" fill="#f3b6c4"/>' + [[-19, 1], [18, -1.6], [-6, 5.4], [8, -5.4]].map(function (q) { return '<ellipse cx="' + f(x + q[0]) + '" cy="' + f(y + q[1]) + '" rx="2.4" ry="1.4" fill="#ece6da" stroke="#c9c1b2" stroke-width=".5"/>'; }).join('') + '</g>'; },
    swing: function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="15" ry="3.4" fill="#00000016"/><path d="M' + P2(x - 13, y) + ' L' + P2(x - 10, y - 28) + ' L' + P2(x - 7, y) + ' M' + P2(x + 7, y) + ' L' + P2(x + 10, y - 28) + ' L' + P2(x + 13, y) + '" stroke="#8a6a52" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M' + P2(x - 12, y - 28) + ' H' + f(x + 12) + '" stroke="#7a5a44" stroke-width="2.6" stroke-linecap="round"/><path d="M' + P2(x - 5, y - 28) + ' V' + f(y - 9) + ' M' + P2(x + 5, y - 28) + ' V' + f(y - 9) + '" stroke="#b9a58a" stroke-width=".8"/><rect x="' + f(x - 7) + '" y="' + f(y - 10) + '" width="14" height="3" rx="1.2" fill="#f2a0b4" stroke="' + OL + '" stroke-width=".7"/><path d="M' + P2(x - 10, y - 27) + ' q4 3 8 0 M' + P2(x + 2, y - 27) + ' q4 3 8 0" stroke="#8fc178" stroke-width="1.4" fill="none"/>'; },
    windmill: function (x, y) { var o = '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="11" ry="3.4" fill="#00000016"/>' + poly([[x - 8, y], [x + 8, y], [x + 5, y - 26], [x - 5, y - 26]], '#f6eedf', OL, .9) + poly([[x - 7, y - 26], [x + 7, y - 26], [x, y - 34]], '#d97a63', OL, .9) + '<rect x="' + f(x - 2.4) + '" y="' + f(y - 8) + '" width="4.8" height="8" rx="2" fill="#8a6a52"/><g class="cx-mill" style="transform-origin:' + f(x) + 'px ' + f(y - 24) + 'px">';
      for (var i = 0; i < 4; i++) o += '<g transform="rotate(' + (i * 90 + 20) + ' ' + f(x) + ' ' + f(y - 24) + ')">' + poly([[x - 1, y - 24], [x + 1, y - 24], [x + 3.4, y - 40], [x - 2, y - 40]], '#fffaf2', OL, .7) + '</g>';
      return o + '</g><circle cx="' + f(x) + '" cy="' + f(y - 24) + '" r="1.8" fill="#7a5a44"/>'; },
    arch2: function (a, b) {
      var H = 30, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, o = '';
      o += '<ellipse cx="' + f(mx - 3) + '" cy="' + f(my + 9) + '" rx="5" ry="2.4" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".7"/><ellipse cx="' + f(mx - 9) + '" cy="' + f(my + 15) + '" rx="5" ry="2.4" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".7"/>';
      var arc = 'M' + P2(a[0], a[1]) + ' L' + P2(a[0], a[1] - H) + ' Q' + P2(mx, my - H - 16) + ' ' + P2(b[0], b[1] - H) + ' L' + P2(b[0], b[1]);
      o += '<path d="' + arc + '" stroke="' + OL + '" stroke-width="4.6" fill="none" stroke-linejoin="round"/><path d="' + arc + '" stroke="#fffaf2" stroke-width="2.8" fill="none" stroke-linejoin="round"/>';
      var pts = [];
      for (var i = 0; i <= 10; i++) { var t = i / 10, x, y;
        if (t < .25) { x = a[0]; y = a[1] - H * (t / .25) * .9 - 3; } else if (t > .75) { x = b[0]; y = b[1] - H * ((1 - t) / .25) * .9 - 3; }
        else { var u = (t - .25) / .5; x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0]; y = (1 - u) * (1 - u) * (a[1] - H) + 2 * (1 - u) * u * (my - H - 16) + u * u * (b[1] - H); }
        pts.push([x, y]); }
      pts.forEach(function (q, i) { o += '<circle cx="' + f(q[0] + (i % 2 ? 2.2 : -2.2)) + '" cy="' + f(q[1] + 1.6) + '" r="2.4" fill="#8fc178" stroke="' + OL + '" stroke-width=".4"/>'; });
      pts.forEach(function (q, i) { if (i % 3 !== 1) o += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="2.4" fill="' + (i % 2 ? '#f2a0b4' : '#e9707f') + '" stroke="' + OL + '" stroke-width=".5"/><circle cx="' + f(q[0] - .6) + '" cy="' + f(q[1] - .6) + '" r=".7" fill="#fff" opacity=".7"/>'; });
      return o;
    },
    arch: function (x, y) { var o = '<path d="M' + P2(x - 12, y) + ' V' + f(y - 22) + ' Q' + P2(x, y - 38) + ' ' + P2(x + 12, y - 22) + ' V' + f(y) + '" stroke="#fffaf2" stroke-width="3.4" fill="none"/><path d="M' + P2(x - 12, y) + ' V' + f(y - 22) + ' Q' + P2(x, y - 38) + ' ' + P2(x + 12, y - 22) + ' V' + f(y) + '" stroke="' + OL + '" stroke-width=".8" fill="none"/>';
      [[-12, -6], [-12, -16], [-10, -26], [-4, -31], [4, -31], [10, -26], [12, -16], [12, -6], [0, -32]].forEach(function (q, i) { o += '<circle cx="' + f(x + q[0] + (i % 2 ? 2 : -2)) + '" cy="' + f(y + q[1] + 2) + '" r="2.4" fill="#8fc178" stroke="' + OL + '" stroke-width=".4"/><circle cx="' + f(x + q[0]) + '" cy="' + f(y + q[1]) + '" r="2.3" fill="' + (i % 3 ? '#f2a0b4' : '#e9707f') + '" stroke="' + OL + '" stroke-width=".5"/>'; });
      return o; }
  };
  DART.well = function (x, y) { return '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="11" ry="3.4" fill="#00000016"/><rect x="' + f(x - 9) + '" y="' + f(y - 12) + '" width="18" height="12" rx="3" fill="#e4e0d8" stroke="' + OL + '" stroke-width=".8"/><ellipse cx="' + f(x) + '" cy="' + f(y - 12) + '" rx="9" ry="3" fill="#7d8f9a" stroke="' + OL + '" stroke-width=".7"/><path d="M' + P2(x - 8, y - 12) + ' V' + f(y - 28) + ' M' + P2(x + 8, y - 12) + ' V' + f(y - 28) + ' M' + P2(x - 10, y - 27) + ' H' + f(x + 10) + '" stroke="#a07853" stroke-width="2"/>'; };
  (function () { var SZ = { lamp: [34], mailbox: [27], bench: [0, 30], bunny: [22], pond: [0, 46, 9], swing: [34], windmill: [44], well: [32], arch: [42] };
    Object.keys(SZ).forEach(function (k) { var orig = DART[k], z = SZ[k]; DART[k] = function (x, y) { if (!CI(k)) return orig(x, y); return (k === 'pond' ? '' : '<ellipse cx="' + f(x) + '" cy="' + f(y + 1) + '" rx="' + (z[1] ? z[1] * .42 : 9) + '" ry="3" fill="#00000012"/>') + ciAt(k, x, y + 2 + (z[2] || 0), z[0], z[1]); }; });
    var a2 = DART.arch2; DART.arch2 = function (a, b) { if (!CI('arch')) return a2(a, b); var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      return '<ellipse cx="' + f(mx - 3) + '" cy="' + f(my + 9) + '" rx="5" ry="2.4" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".7"/><ellipse cx="' + f(mx - 9) + '" cy="' + f(my + 15) + '" rx="5" ry="2.4" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".7"/>' + '<g transform="translate(' + f(2 * mx) + ' 0) scale(-1 1)">' + ciAt('arch', mx, my + 6, 0, Math.abs(b[0] - a[0]) + 16) + '</g>'; };
    var RING = { pink: ['flowerP', 17], lav: ['lavender', 18], hydra: ['hydrangea', 17], white: ['daisy', 15], yellow: ['marigold', 15] };
    Object.keys(RING).forEach(function (k) { var orig = DECOR[k], r = RING[k]; DECOR[k] = function (x, y, col) { if (!CI(r[0])) return orig(x, y, col); var key = k === 'hydra' && col === '#c3b0e6' ? 'pinkhydra' : r[0];
      return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="9" ry="3" fill="#00000012"/>' + ciAt(key, x - 5, y - 1, r[1] * .85) + ciAt(key, x + 5, y, r[1] * .9) + ciAt(key, x, y + 2, r[1]); }; });
  })();
  function decoItems(g, iso) {
    var D = decoG(g), out = [];
    Object.keys(DECOS).forEach(function (k) { if (!D.on[k] || k === 'arch') return; var sp = DECOS[k][2], q = iso(sp[0], sp[1]); out.push({ z: k === 'pond' ? -5 : sp[0] + sp[1], front: sp[0] > 2.6 || sp[1] > 2.6, s: DART[k](q[0], q[1]) }); });
    return out;
  }
  function decoFree(g, list) { var D = decoG(g); return list.filter(function (d) { return !Object.keys(DECOS).some(function (k) { var sp = DECOS[k][2]; return D.on[k] && Math.abs(sp[0] - d[0]) < .75 && Math.abs(sp[1] - d[1]) < .75; }); }); }
  function clump(x, y, cols, center) {
    var o = '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="9" ry="3.4" fill="#00000012"/><ellipse cx="' + f(x) + '" cy="' + f(y - 3) + '" rx="8" ry="4" fill="#8fc178" stroke="' + OL + '" stroke-width=".7"/>';
    [[-4, -5], [3, -6], [0, -8], [5, -3], [-5, -2]].forEach(function (q, i) { var cx = x + q[0], cy = y + q[1]; for (var k = 0; k < 5; k++) { var a = k * 1.2566; o += '<circle cx="' + f(cx + Math.cos(a) * 1.5) + '" cy="' + f(cy + Math.sin(a) * 1.3) + '" r="1.35" fill="' + cols[i % cols.length] + '"/>'; } o += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r=".8" fill="' + (center || '#fff3c4') + '"/>'; });
    return o;
  }
  function ringDecor(iso, R, C, m, list) {
    // list: [r, c, type, color]
    return list.map(function (d) { var q = iso(d[0], d[1]); return { z: d[0] + d[1], s: DECOR[d[2]](q[0], q[1], d[3]) }; });
  }
  function plotTile(iso, r, c, p, key, now) {
    var k = .43, t = iso(r - k, c - k), rt = iso(r - k, c + k), b = iso(r + k, c + k), l = iso(r + k, c - k), cen = iso(r, c), o = '';
    var on = sel === key, wet = p.crop && (p.wetUntil || 0) > now;
    if (!p.open) {
      o += poly([t, rt, b, l], '#cfe5bd', '#9fbf88', 1, ' stroke-dasharray="3 2"');
      o += '<g transform="translate(' + P2(cen[0], cen[1] - 4) + ')"><path d="M-3.4 -2 v-2.4 a3.4 3.4 0 0 1 6.8 0 v2.4" fill="none" stroke="#8a7a6a" stroke-width="1.4"/><rect x="-5" y="-2" width="10" height="7" rx="1.4" fill="#c9b49a" stroke="#8a7a6a" stroke-width=".8"/></g>';
      return o;
    }
    var top = wet ? '#b38d6e' : '#d4b08e';
    o += poly([l, b, [b[0], b[1] + 4], [l[0], l[1] + 4]], wet ? '#9a7860' : '#bf9a7c', OL, .8) + poly([b, rt, [rt[0], rt[1] + 4], [b[0], b[1] + 4]], wet ? '#8c6d56' : '#b08d70', OL, .8);
    o += poly([t, rt, b, l], top, on ? 'var(--accent-color)' : OL, on ? 2.2 : .9);
    for (var i = 1; i < 3; i++) { var a1 = iso(r - k + i * .29, c - k + .06), a2 = iso(r - k + i * .29, c + k - .06); o += '<line x1="' + f(a1[0]) + '" y1="' + f(a1[1]) + '" x2="' + f(a2[0]) + '" y2="' + f(a2[1]) + '" stroke="#00000018" stroke-width="1"/>'; }
    if (!p.crop) o += '<text x="' + f(cen[0]) + '" y="' + f(cen[1] + 4) + '" text-anchor="middle" font-size="13" fill="#fff6e8" opacity=".9">＋</text>';
    return o;
  }
  function plantOn(x, y, p, sc) {
    var st = stage(p), o = '';
    if (st === 3) o += '<ellipse cx="' + f(x) + '" cy="' + f(y - 14 * sc) + '" rx="' + f(20 * sc) + '" ry="' + f(18 * sc) + '" fill="#fff1b8" opacity=".55"/>';
    o += '<g transform="translate(' + P2(x - 30 * sc, y - 49 * sc) + ') scale(' + sc + ')">' + plantArt(p.crop, st) + '</g>';
    if (p.bug && CI('bug')) o += ciAt('bug', x + 10, y - 10, 0, 17);
    else if (p.bug) o += '<g transform="translate(' + P2(x + 9, y - 16) + ')"><ellipse rx="4.4" ry="3" fill="#9cbf6a" stroke="' + OL + '" stroke-width=".6"/><circle cx="4.2" cy="-.8" r="2" fill="#7fa253"/><circle cx="4.8" cy="-1.4" r=".55" fill="#fff"/></g>';
    else if (st === 3) o += '<path d="M' + P2(x + 10, y - 40 * sc) + ' l1.6 3.4 3.6.6-2.7 2.5.7 3.6-3.2-1.8-3.2 1.8.7-3.6-2.7-2.5 3.6-.6z" fill="#f6c94e" stroke="' + OL + '" stroke-width=".6"/>';
    else if ((p.wetUntil || 0) <= Date.now()) o += '<path d="M' + P2(x + 11, y - 34 * sc) + ' q4 5 0 7 q-4 -2 0 -7z" fill="#7fb6e6" stroke="' + OL + '" stroke-width=".6"/>';
    return o;
  }
  function areaSvg(g, now) {
    var W = 340, o = '', items = [];
    var bg = '<defs><pattern id="cxchk" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#e2eed8"/><rect width="12" height="12" fill="#d9e9cd"/><rect x="12" y="12" width="12" height="12" fill="#d9e9cd"/></pattern></defs><rect x="-20" y="-20" width="400" height="400" fill="url(#cxchk)"/>';
    if (area === 'g' || area === 'o') {
      var isG = area === 'g', arr = isG ? g.plots : g.orchard, per = isG ? 9 : 6, N = arr.length / per, SP = isG ? 264 : 232, show = N + (N < LAND[area].length ? 1 : 0);
      var R = isG ? 3 : 2, C = 3, m = isG ? 1.05 : .95, oy = isG ? 46 : 52, vx = isG ? 38 : 54, vy = isG ? -14 : -6, vh = isG ? 172 : 158;
      var deco = isG ? [[-.62, -.62, 'hydra', '#c3b0e6'], [-.66, .5, 'pink'], [-.66, 1.5, 'white'], [-.62, 2.62, 'hydra', '#a9bdf0'], [.5, -.66, 'lav'], [1.5, -.66, 'yellow'], [.5, 2.66, 'lav'], [1.5, 2.66, 'pink'], [2.62, -.62, 'bush'], [2.66, .4, 'white'], [2.66, 1.6, 'pink'], [2.62, 2.62, 'hydra', '#c3b0e6'], [2.7, 1, 'stone']]
        : [[-.55, -.55, 'bush'], [-.6, 1, 'mush'], [-.55, 2.55, 'bush'], [.5, -.6, 'mush'], [1.55, 2.55, 'mush'], [1.6, .2, 'stone'], [1.6, 1.4, 'stone'], [.5, 2.6, 'yellow']];
      FENCE_COL = FENCES[decoG(g).fence] ? FENCES[decoG(g).fence][2] : '#fffaf2'; var dfront = '';
      for (var k = 0; k < show; k++) {
        var iso = mkIso((isG ? W / 2 : W / 2 - TW / 4) + k * SP, oy), its = [], sale = k >= N;
        if (k) { var a1 = iso(R / 2 - .5, -m - .2), stones = ''; for (var st = 1; st <= 3; st++) stones += '<ellipse cx="' + f(a1[0] - st * (SP - 200) / 4 - 4) + '" cy="' + f(a1[1] + 18 + (st % 2) * 3) + '" rx="7" ry="3.2" fill="#f4f1ea" stroke="#c9c1b2" stroke-width=".8"/>'; o += stones; }
        o += '<g' + (sale ? ' data-buyland="' + area + '" class="pl" opacity=".55"' : '') + '>' + platform(iso, R, C, m, sale ? '#dbe5d2' : isG ? '#c3dfac' : '#bcdba4', '#dcc1a2', '#cdae8e', 12) + (sale ? '' : fences(iso, R, C, m, 'back'));
        if (!sale) {
          if (isG && k === 0) { its = its.concat(ringDecor(iso, R, C, m, decoFree(g, deco))); decoItems(g, iso).forEach(function (d) { if (d.front) dfront += d.s; else its.push(d); }); }
          else its = its.concat(ringDecor(iso, R, C, m, deco));
          for (var j = 0; j < per; j++) (function (i, j) {
            var p = arr[i], r = Math.floor(j / 3), c = j % 3, cen = iso(r, c), key = (isG ? 'g' : 'o') + i;
            its.push({ z: r + c + .1, s: '<g data-pl="' + key + '" class="pl">' + plotTile(iso, r, c, p, key, now) + (p.crop ? plantOn(cen[0], cen[1] + 4, p, isG ? .78 : 1.05) : '') +
              (p.by ? '<circle cx="' + f(cen[0] - 14) + '" cy="' + f(cen[1] - 4) + '" r="5" fill="#fffaf2" stroke="' + OL + '" stroke-width=".6"/><text x="' + f(cen[0] - 14) + '" y="' + f(cen[1] - 1.6) + '" text-anchor="middle" font-size="6.5" fill="#8a6fc2">' + esc(p.by.slice(0, 1)) + '</text>' : '') +
              (!isG && !p.open && OUNLOCK[i] && arr.slice(0, i).every(function (q) { return q.open; }) ? '<text x="' + f(cen[0]) + '" y="' + f(cen[1] + 14) + '" text-anchor="middle" font-size="8" fill="#6b5a48">🪙' + OUNLOCK[i] + '</text>' : '') + '</g>' });
          })(k * per + j, j);
          its.sort(function (a, b) { return a.z - b.z; }).forEach(function (it) { o += it.s; });
          if (isG && k === 0 && decoG(g).on.arch) {
            var kk = m - .3, fl = iso(R - 1 + kk, -kk), fb = iso(R - 1 + kk, C - 1 + kk), frt = iso(-kk, C - 1 + kk), g1 = iso(R - 1 + kk, 1.15), g2 = iso(R - 1 + kk, 1.95);
            o += fenceLine(fl, g1, 4) + fenceLine(g2, fb, 2) + fenceLine(fb, frt, Math.round((R - 1 + 2 * kk) * 2.2)) + DART.arch2(g1, g2) + dfront;
          } else o += fences(iso, R, C, m, 'front') + (k === 0 ? dfront : '');
        }
        o += '</g>';
        if (sale) { var cq = iso((R - 1) / 2, 1); o += '<g data-buyland="' + area + '" class="pl" transform="translate(' + P2(cq[0], cq[1] - 4) + ')"><rect x="-54" y="-17" width="108" height="32" rx="9" fill="#fffaf2" stroke="' + OL + '" stroke-width="1"/><text x="0" y="-3" text-anchor="middle" font-size="10" fill="#5f4d40">買下這塊地</text><text x="0" y="10" text-anchor="middle" font-size="9" fill="#a07a2a">🪙 ' + LAND[area][N] + '</text></g>'; }
        else if (N > 1 || show > 1) { var lb = iso(R - 1 + m, -m); o += '<text x="' + f(lb[0] + 8) + '" y="' + f(lb[1] + 26) + '" font-size="8" fill="#6b7a5e">' + (isG ? '花圃' : '果園') + ' ' + (k + 1) + '</text>'; }
      }
      var totalW = (show - 1) * SP + (isG ? 264 : 232);
      return '<svg class="cx-scene" viewBox="' + vx + ' ' + vy + ' ' + totalW + ' ' + vh + '" style="width:' + (show * 100) + '%" role="img" aria-label="' + (isG ? '花園' : '果園') + '">' + bg.replace('width="400"', 'width="' + (totalW + 400) + '"') + o + wxOverlay(vx, vy, totalW, vh) + '</svg>';
    }
    FENCE_COL = '#fffaf2';
    return penSvg(g, now, bg);
  }
  /* ---------- 牧場：四個圈 ---------- */
  function penSvg(g, now, bg) {
    var A0 = ANIM[pen], o = '', items = [], W = 340, built = penBuilt(g, pen);
    var R3 = 3, C3 = 3, m3 = .75, iso3 = mkIso(W / 2, 40);
    var top = { hen: '#c6e0ae', duck: '#bfdea6', cow: '#cae2aa', rabbit: '#c6e3b0', bee: '#cde4ac' }[pen];
    o += platform(iso3, R3, C3, m3, built ? top : '#cfdcc4', '#c9a27a', '#b48c66', 12) + fences(iso3, R3, C3, m3, 'back');
    var hp = iso3(-.15, -.15), hx = hp[0], hy = hp[1] + 10;
    if (pen === 'hen') {
      items.push({ z: -.3, s: house(hx, hy, '#f3e3c8', '#e8d2b0', '#d97a63', '#c4634e') });
      var tp = iso3(2.25, .1); items.push({ z: 2.35, s: trough(tp, herd(g, 'hen').some(function (h) { return !hungry(h, now); })) });
      items = items.concat(ringDecor(iso3, R3, C3, m3, [[2.5, 2.4, 'bush'], [-.4, 2.5, 'yellow'], [2.5, -.3, 'stone'], [1.2, 2.55, 'pink']]));
    } else if (pen === 'duck') {
      var pc = iso3(1.15, 1.2);
      if (CI('pond')) items.push({ z: .5, s: ciAt('pond', pc[0] - 4, pc[1] + 28, 0, 108) }); else items.push({ z: .5, s: '<ellipse cx="' + f(pc[0]) + '" cy="' + f(pc[1]) + '" rx="62" ry="27" fill="#a9d7ef" stroke="' + OL + '" stroke-width="1"/><ellipse cx="' + f(pc[0] - 6) + '" cy="' + f(pc[1] - 3) + '" rx="48" ry="19" fill="#bfe3f4"/><path d="M' + P2(pc[0] - 30, pc[1] - 6) + ' q8 -3 16 0 M' + P2(pc[0] + 10, pc[1] + 8) + ' q8 -3 16 0" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>' +
        '<ellipse cx="' + f(pc[0] + 34) + '" cy="' + f(pc[1] - 8) + '" rx="7" ry="3" fill="#8fc178" stroke="' + OL + '" stroke-width=".6"/><circle cx="' + f(pc[0] + 35) + '" cy="' + f(pc[1] - 10) + '" r="2" fill="#f3b6c4"/>' });
      items = items.concat(ringDecor(iso3, R3, C3, m3, [[-.4, -.3, 'bush'], [-.45, 1.2, 'lav'], [-.4, 2.5, 'white'], [2.5, .2, 'stone'], [2.5, 2.4, 'bush'], [1.4, 2.6, 'yellow']]));
    } else if (pen === 'cow') {
      items.push({ z: -.3, s: house(hx, hy, '#c9584a', '#b44b40', '#f2ece0', '#e2d9c8', true) });
      var hb = iso3(2.1, .2); items.push({ z: 2.3, s: '<ellipse cx="' + f(hb[0]) + '" cy="' + f(hb[1]) + '" rx="13" ry="5" fill="#00000016"/><rect x="' + f(hb[0] - 12) + '" y="' + f(hb[1] - 14) + '" width="24" height="13" rx="4" fill="#ecc96b" stroke="' + OL + '" stroke-width=".8"/><path d="M' + P2(hb[0] - 12, hb[1] - 9) + ' h24 M' + P2(hb[0] - 12, hb[1] - 5) + ' h24" stroke="#c9a24a" stroke-width=".8"/>' });
      items = items.concat(ringDecor(iso3, R3, C3, m3, [[2.5, 2.4, 'bush'], [-.4, 2.5, 'white'], [1.3, 2.6, 'yellow'], [2.55, 1.2, 'stone']]));
    } else if (pen === 'bee') {
      items = items.concat(ringDecor(iso3, R3, C3, m3, [[-.4, -.3, 'lav'], [-.45, .6, 'lav'], [-.45, 1.5, 'yellow'], [-.4, 2.5, 'lav'], [.6, -.4, 'pink'], [1.6, -.4, 'lav'], [2.5, -.3, 'white'], [2.55, 1.1, 'lav'], [2.5, 2.4, 'pink'], [1.3, 2.6, 'lav']]));
      [[2, .5], [.4, 2.1], [1.9, 1.9]].forEach(function (q) { var c = iso3(q[0], q[1]); items.push({ z: q[0] + q[1], s: DECOR.lav(c[0], c[1]) }); });
    } else {
      var hh = iso3(-.1, 1.9); items.push({ z: .6, s: hutch(hh[0], hh[1]) });
      [[1.9, 1.7], [2.1, 2.1], [1.7, 2.2]].forEach(function (q) { var c = iso3(q[0], q[1]); items.push({ z: q[0] + q[1], s: '<path d="M' + P2(c[0] - 3, c[1]) + ' l-2 -7 M' + P2(c[0], c[1]) + ' l0 -8 M' + P2(c[0] + 3, c[1]) + ' l2 -7" stroke="#6fae5a" stroke-width="1.6" stroke-linecap="round"/><path d="M' + P2(c[0] - 2.4, c[1]) + ' L' + P2(c[0], c[1] + 4) + ' L' + P2(c[0] + 2.4, c[1]) + 'Z" fill="#f08a3c" stroke="' + OL + '" stroke-width=".5"/>' }); });
      items = items.concat(ringDecor(iso3, R3, C3, m3, [[-.4, -.3, 'pink'], [-.45, .9, 'white'], [2.5, -.3, 'bush'], [2.55, 1, 'lav'], [2.5, 2.5, 'pink']]));
    }
    var spots = pen === 'bee' ? [[.6, .7], [1.4, .9], [1, 1.6]] : pen === 'duck' ? [[.9, 1], [1.4, 1.5], [1.1, 1.9], [1.5, .7]] : pen === 'cow' ? [[1, 1.1], [1.6, 1.9]] : pen === 'rabbit' ? [[.6, .6], [1.3, .9], [1.1, 1.6], [.6, 1.3]] : [[.7, 1.1], [1.3, .4], [1, 1.8], [1.6, 1.2], [.4, 1.9], [1.7, .3]];
    if (built) herd(g, pen).forEach(function (a, i) {
      var sp = spots[i % spots.length], q = iso3(sp[0], sp[1]), hun = hungry(a, now), key = 'a' + pen + ':' + i, on = sel === key;
      var s = '<g data-ani="' + key + '" class="hen' + (hun ? ' hun' : '') + (pen === 'duck' ? ' swim' : pen === 'bee' ? ' hive' : pen === 'cow' ? ' slow' : '') + '" style="--d:' + (2.6 + i * .37).toFixed(2) + 's;--dl:' + (-i * .9).toFixed(2) + 's"><g transform="translate(' + P2(q[0], q[1]) + ')"><g class="hw">' + ANIM[pen].art(on, i % 2 ? -1 : 1, i) + '</g></g>';
      for (var e = 0; e < (a.eggs || 0); e++) s += '<g data-prod="' + key + '" transform="translate(' + P2(q[0] + (pen === 'cow' ? 18 : 13) + e * 7, q[1] + 3) + ')">' + prodIcon(pen) + '</g>';
      if (hun) s += '<g transform="translate(' + P2(q[0] + 6, q[1] - (pen === 'cow' ? 34 : 28)) + ')"><rect x="-9" y="-7" width="18" height="11" rx="5" fill="#fff" stroke="' + OL + '" stroke-width=".7"/><text x="0" y="1.6" text-anchor="middle" font-size="7" fill="#8a7a6a">餓…</text></g>';
      s += '<text x="' + f(q[0]) + '" y="' + f(q[1] + 13) + '" text-anchor="middle" font-size="7.5" fill="#5f4d40">' + esc(a.name || '') + '</text></g>';
      items.push({ z: sp[0] + sp[1] + .2, s: s });
    });
    var cq = iso3(1.2, 1.2);
    var sign = '';
    if (!built) sign = ('<g transform="translate(' + P2(cq[0], cq[1] - 6) + ')"><rect x="-58" y="-16" width="116" height="30" rx="8" fill="#fffaf2" stroke="' + OL + '" stroke-width="1"/><text x="0" y="-2" text-anchor="middle" font-size="10" fill="#5f4d40">🔒 還沒蓋' + A0.place + '</text><text x="0" y="10" text-anchor="middle" font-size="8.5" fill="#8a7a6a">下面可以用 🪙' + A0.build + ' 蓋起來</text></g>');
    else if (!herd(g, pen).length) items.push({ z: 9, s: '<text x="' + f(cq[0]) + '" y="' + f(cq[1]) + '" text-anchor="middle" font-size="10" fill="#5f6f52">還沒有' + A0.n + '，下面可以買</text>' });
    items.sort(function (a, b) { return a.z - b.z; }).forEach(function (it) { o += it.s; });
    o += fences(iso3, R3, C3, m3, 'front') + sign;
    return '<svg class="cx-scene" viewBox="56 -6 228 152" role="img" aria-label="' + A0.place + '">' + bg + o + '</svg>';
  }
  function house(hx, hy, w1, w2, r1, r2, barn) {
    if (CI(barn ? 'barn' : 'coop')) return '<ellipse cx="' + f(hx) + '" cy="' + f(hy + 6) + '" rx="' + (barn ? 36 : 28) + '" ry="7" fill="#00000012"/>' + ciAt(barn ? 'barn' : 'coop', hx, hy + 9, 0, barn ? 82 : 62);
    var o = poly([[hx - 26, hy - 6], [hx, hy + 7], [hx, hy - 15], [hx - 26, hy - 28]], w1, OL, 1) + poly([[hx, hy + 7], [hx + 26, hy - 6], [hx + 26, hy - 28], [hx, hy - 15]], w2, OL, 1) +
      poly([[hx - 30, hy - 26], [hx, hy - 11], [hx, hy - 34], [hx - 14, hy - 44]], r1, OL, 1) + poly([[hx, hy - 11], [hx + 30, hy - 26], [hx + 14, hy - 44], [hx, hy - 34]], r2, OL, 1);
    if (barn) o += '<path d="M' + P2(hx - 20, hy - 2) + ' L' + P2(hx - 20, hy - 18) + ' L' + P2(hx - 6, hy - 11) + ' L' + P2(hx - 6, hy + 5) + 'Z" fill="#f2ece0" stroke="' + OL + '" stroke-width=".8"/><path d="M' + P2(hx - 20, hy - 18) + ' L' + P2(hx - 6, hy + 5) + ' M' + P2(hx - 6, hy - 11) + ' L' + P2(hx - 20, hy - 2) + '" stroke="' + OL + '" stroke-width=".8"/>';
    else o += '<path d="M' + P2(hx - 15, hy - 2) + ' L' + P2(hx - 15, hy - 14) + ' Q' + P2(hx - 10, hy - 19) + ' ' + P2(hx - 6, hy - 10) + ' L' + P2(hx - 6, hy + 2) + 'Z" fill="#7a5a44"/><path d="M' + P2(hx - 14, hy + 4) + ' L' + P2(hx - 2, hy + 10) + '" stroke="#b89a76" stroke-width="2"/>';
    return o;
  }
  function hutch(x, y) {
    if (CI('hutch')) return '<ellipse cx="' + f(x) + '" cy="' + f(y + 4) + '" rx="22" ry="6" fill="#00000012"/>' + ciAt('hutch', x, y + 8, 0, 50);
    return '<ellipse cx="' + f(x) + '" cy="' + f(y + 4) + '" rx="22" ry="7" fill="#00000016"/>' + poly([[x - 20, y - 2], [x, y + 8], [x, y - 8], [x - 20, y - 18]], '#e9c9a0', OL, .9) + poly([[x, y + 8], [x + 18, y - 1], [x + 18, y - 17], [x, y - 8]], '#d9b48a', OL, .9) +
      poly([[x - 23, y - 16], [x, y - 5], [x, y - 18], [x - 10, y - 26]], '#9fbf88', OL, .9) + poly([[x, y - 5], [x + 21, y - 15], [x + 9, y - 26], [x, y - 18]], '#8fb178', OL, .9) +
      '<ellipse cx="' + f(x - 10) + '" cy="' + f(y - 3) + '" rx="4.4" ry="5" fill="#6b4f3a"/>';
  }
  function trough(tp, full) { return '<path d="M' + P2(tp[0] - 14, tp[1]) + ' L' + P2(tp[0], tp[1] + 7) + ' L' + P2(tp[0] + 14, tp[1]) + ' L' + P2(tp[0], tp[1] - 7) + 'Z" fill="#b68d5f" stroke="' + OL + '" stroke-width=".8"/><path d="M' + P2(tp[0] - 10, tp[1]) + ' L' + P2(tp[0], tp[1] + 5) + ' L' + P2(tp[0] + 10, tp[1]) + ' L' + P2(tp[0], tp[1] - 5) + 'Z" fill="' + (full ? '#e9cf7a' : '#8f6d48') + '"/>'; }
  function prodIcon(type) {
    var pk = { hen: 'egg', duck: 'egg', cow: 'milk', bee: 'honey' }[type];
    if (pk && FI(pk)) return imgAt(pk, 0, 5, pk === 'egg' ? 10 : 12);
    if (type === 'bee') return '<path d="M-3.6 -7 h7.2 v1.6 q2 1.4 2 4 v4.4 q0 2 -2 2 h-7.2 q-2 0 -2 -2 v-4.4 q0 -2.6 2 -4z" fill="#f2b33a" stroke="' + OL + '" stroke-width=".6"/><rect x="-4" y="-9" width="8" height="2.4" rx=".8" fill="#e9d3a0" stroke="' + OL + '" stroke-width=".5"/><ellipse cx="-1.4" cy="-1.6" rx=".9" ry="1.4" fill="#fff" opacity=".6"/>';
    if (type === 'cow') return '<path d="M-3 -9 h6 v2 l2 3 v8 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2 v-8 l2 -3z" fill="#fffdf8" stroke="' + OL + '" stroke-width=".7"/><rect x="-3.4" y="-3" width="6.8" height="4" fill="#9cc4e8"/>';
    if (type === 'rabbit') return '<circle r="4.4" fill="#f6c7d2" stroke="' + OL + '" stroke-width=".6"/><circle r="1.6" fill="#f2d16b"/><path d="M0 4 v4" stroke="#6fae5a" stroke-width="1"/>';
    return '<ellipse rx="3.4" ry="4.3" fill="' + (type === 'duck' ? '#e6f0f3' : '#fffaf0') + '" stroke="' + OL + '" stroke-width=".7"/><ellipse cx="-1" cy="-1.4" rx="1" ry="1.3" fill="#fff"/>';
  }
  function duckArt(on, dir) {
    var o = '<ellipse cx="0" cy="1" rx="9" ry="2.6" fill="#7fb6d6" opacity=".55"/><g transform="scale(' + dir + ',1)">';
    o += '<path d="M-10 -6 Q-12 -10 -7 -9 L-6 -6Z" fill="#fffdf8" stroke="' + OL + '" stroke-width=".7"/>';
    o += '<ellipse cx="-1" cy="-5" rx="9" ry="5.6" fill="#fffdf8" stroke="' + (on ? 'var(--accent-color)' : OL) + '" stroke-width="' + (on ? 1.8 : .9) + '"/><path d="M-5 -6 Q-1 -3 3 -6" stroke="#e5ded2" stroke-width="1.2" fill="none"/>';
    o += '<circle cx="6" cy="-12" r="4.6" fill="#fffdf8" stroke="' + OL + '" stroke-width=".9"/><path d="M9.6 -12.6 Q14.6 -12.4 14 -10.4 Q11 -9.6 9.4 -10.4Z" fill="#f2a24a" stroke="' + OL + '" stroke-width=".5"/>';
    o += '<circle cx="7.4" cy="-13.2" r=".9" fill="#3b2f2a"/><ellipse cx="6" cy="-10.6" rx="1.2" ry=".7" fill="#f6b6b6" opacity=".7"/>';
    return o + '</g>';
  }
  function cowArt(on, dir, i) {
    var o = '<ellipse cx="0" cy="1" rx="15" ry="3.6" fill="#00000018"/><g transform="scale(' + dir + ',1)">';
    o += '<path d="M-10 0 v-6 M-5 0 v-6 M5 0 v-6 M10 0 v-6" stroke="' + OL + '" stroke-width="2.4" stroke-linecap="round"/><path d="M-10 0 v-5 M-5 0 v-5 M5 0 v-5 M10 0 v-5" stroke="#fffdf8" stroke-width="1.4" stroke-linecap="round"/>';
    o += '<path d="M-14 -12 q-4 2 -3 7" stroke="' + OL + '" stroke-width="1" fill="none"/>';
    o += '<rect x="-14" y="-18" width="26" height="13" rx="6.5" fill="#fffdf8" stroke="' + (on ? 'var(--accent-color)' : OL) + '" stroke-width="' + (on ? 1.8 : .9) + '"/>';
    o += '<path d="M-9 -18 q4 2 3 6 q-4 1 -6 -2z M3 -12 q5 -2 6 3 q-4 2 -6 -3z" fill="#4a3b34"/>';
    o += '<ellipse cx="14" cy="-18" rx="6.4" ry="6" fill="#fffdf8" stroke="' + OL + '" stroke-width=".9"/><ellipse cx="16" cy="-14.4" rx="4.6" ry="3" fill="#f4b8bf" stroke="' + OL + '" stroke-width=".6"/>';
    o += '<path d="M10 -23 l-3 -3 M17 -23 l2 -3.6" stroke="#e8d7b6" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9" cy="-21" rx="2.6" ry="1.4" fill="#fffdf8" stroke="' + OL + '" stroke-width=".6"/>';
    o += '<circle cx="15" cy="-19.4" r=".95" fill="#3b2f2a"/><circle cx="15.2" cy="-14.4" r=".5" fill="#8a5a5a"/><circle cx="17.6" cy="-14.6" r=".5" fill="#8a5a5a"/>';
    return o + '</g>';
  }
  function beesArt(i, pts) {
    var o = '';
    pts.forEach(function (q, j) { o += '<g class="bz" style="animation-delay:' + (-j * .7 - i * .3) + 's"><ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="2" ry="1.5" fill="#f6c84a" stroke="' + OL + '" stroke-width=".5"/><path d="M' + (q[0] - .6) + ' ' + (q[1] - 1.4) + ' v2.8 M' + (q[0] + .7) + ' ' + (q[1] - 1.4) + ' v2.8" stroke="#3b2f2a" stroke-width=".5"/><ellipse cx="' + (q[0] - .4) + '" cy="' + (q[1] - 2.2) + '" rx="1.2" ry=".8" fill="#fff" opacity=".85"/></g>'; });
    return o;
  }
  function hiveArt(on, dir, i) {
    var st = on ? 'var(--accent-color)' : OL, sw = on ? 1.8 : .9, o = '<ellipse cx="0" cy="1" rx="12" ry="3.4" fill="#00000018"/>';
    o += '<rect x="-10" y="-8" width="20" height="8" rx="1.4" fill="#f6edd6" stroke="' + st + '" stroke-width="' + sw + '"/><rect x="-10" y="-16" width="20" height="8" rx="1.4" fill="' + (['#f3d27a', '#f6e2b0', '#e9c46a'][i % 3]) + '" stroke="' + st + '" stroke-width="' + sw + '"/>';
    o += '<path d="M-12 -16 L0 -22 L12 -16Z" fill="#c98a5a" stroke="' + OL + '" stroke-width=".8"/><rect x="-3" y="-4" width="6" height="2" rx="1" fill="#6b4f3a"/>';
    o += beesArt(i, [[-13, -20], [12, -24], [6, -28]]);
    return o;
  }
  function rabbitArt(on, dir, i) {
    var fur = ['#fffdf8', '#e9d3bd', '#f4ecdf', '#d9c1a8'][i % 4];
    var o = '<ellipse cx="0" cy="1" rx="8" ry="2.6" fill="#00000018"/><g transform="scale(' + dir + ',1)">';
    o += '<ellipse cx="-1" cy="-5" rx="7.4" ry="5.6" fill="' + fur + '" stroke="' + (on ? 'var(--accent-color)' : OL) + '" stroke-width="' + (on ? 1.8 : .9) + '"/><circle cx="-8" cy="-5" r="2.2" fill="#fff" stroke="' + OL + '" stroke-width=".6"/>';
    o += '<ellipse cx="3.4" cy="-21" rx="1.8" ry="5.4" transform="rotate(-10 3.4 -21)" fill="' + fur + '" stroke="' + OL + '" stroke-width=".8"/><ellipse cx="7" cy="-20.6" rx="1.8" ry="5.4" transform="rotate(14 7 -20.6)" fill="' + fur + '" stroke="' + OL + '" stroke-width=".8"/><ellipse cx="7" cy="-20.6" rx=".7" ry="3.6" transform="rotate(14 7 -20.6)" fill="#f6b6c4"/>';
    o += '<circle cx="5" cy="-11" r="4.8" fill="' + fur + '" stroke="' + OL + '" stroke-width=".9"/><circle cx="6.6" cy="-12" r=".9" fill="#3b2f2a"/><circle cx="9.4" cy="-10.2" r=".7" fill="#e88a9a"/><ellipse cx="5" cy="-9.4" rx="1.2" ry=".7" fill="#f6b6b6" opacity=".7"/>';
    return o + '</g>';
  }
  function penPanel(g, now) {
    var A0 = ANIM[pen], tabs = Object.keys(ANIM).map(function (k) { var n = penBuilt(g, k) ? herd(g, k).reduce(function (s2, a) { return s2 + (a.eggs || 0); }, 0) : 0; return '<button type="button" data-pen="' + k + '" class="' + (pen === k ? 'on' : '') + '">' + (penBuilt(g, k) ? '' : '🔒') + ANIM[k].emoji + ' ' + ANIM[k].n + (n ? '<i>' + n + '</i>' : '') + '</button>'; }).join('');
    var all = allAni(g), hunAll = all.filter(function (x) { return hungry(x[1], now); }).length, prodAll = all.reduce(function (s2, x) { return s2 + (x[1].eggs || 0); }, 0);
    var h = all.length ? '<div class="cx-g-acts cx-ranch-all"><button type="button" class="cx-btn" data-ranch="feed"' + (hunAll ? '' : ' disabled') + '><i class="fas fa-wheat-awn"></i> 一鍵餵食' + (hunAll ? '（' + hunAll + ' 隻）' : '') + '</button><button type="button" class="cx-btn pri" data-ranch="collect"' + (prodAll ? '' : ' disabled') + '><i class="fas fa-basket-shopping"></i> 一鍵撿蛋' + (prodAll ? '（' + prodAll + '）' : '') + '</button></div>' : '';
    h += '<div class="cx-g-area cx-g-pens">' + tabs + '</div>';
    if (!penBuilt(g, pen)) return h + '<div class="cx-g-panel cx-coop-info"><div><b>蓋' + A0.place + '</b><span class="cx-muted">' + A0.desc + '</span></div><button type="button" class="cx-btn pri" data-coop="build"' + (g.coins < A0.build ? ' disabled' : '') + '>蓋 🪙' + A0.build + '</button></div>';
    var list = herd(g, pen), prods = list.reduce(function (s2, a) { return s2 + (a.eggs || 0); }, 0), hun = list.filter(function (a) { return hungry(a, now); }).length;
    var hasFood = foodLeft(g, pen) >= A0.eat[1];
    h += '<div class="cx-g-acts"><button type="button" class="cx-btn" data-coop="feedAll"' + (hun && hasFood ? '' : ' disabled') + '><i class="fas fa-wheat-awn"></i> 餵飯' + (hun ? '（' + hun + ' 隻餓了）' : '') + '</button><button type="button" class="cx-btn pri" data-coop="collect"' + (prods ? '' : ' disabled') + '>' + A0.verb + (prods ? ' ' + prods : '') + '</button></div>';
    h += '<div class="cx-g-panel cx-coop-info"><div><b>飼料</b><span class="cx-muted">' + A0.n + '一次吃 ' + A0.eat[1] + ' 份' + CROPS[A0.eat[0]].n + '（現在有 ' + (g.inv[A0.eat[0]] || 0) + '），沒有的話用飼料袋（' + g.coop.feed + ' 份）</span></div><button type="button" class="cx-btn" data-coop="buyFeed"' + (g.coins < 1 ? ' disabled' : '') + '>買飼料 🪙1</button></div>';
    h += '<div class="cx-g-panel cx-coop-info"><div><b>' + A0.n + ' ' + list.length + ' / ' + A0.max + '</b><span class="cx-muted">' + A0.desc + '</span></div><button type="button" class="cx-btn" data-coop="buy"' + (list.length >= A0.max || g.coins < A0.cost ? ' disabled' : '') + '>買' + A0.n + ' 🪙' + A0.cost + '</button></div>';
    var ak = sel && sel[0] === 'a' ? sel.slice(1).split(':') : null;
    if (ak && ak[0] === pen && list[+ak[1]]) {
      var a1 = list[+ak[1]];
      h += '<div class="cx-g-panel"><div class="cx-g-pt">' + esc(a1.name || A0.n) + '</div><div class="cx-muted" data-live>' + aniStatus(a1, now) + '</div>' +
        '<div class="cx-g-acts"><input class="cx-in" id="cx-hen-name" maxlength="6" value="' + esc(a1.name || '') + '" placeholder="幫牠取名字" style="flex:1"><button type="button" class="cx-btn" data-coop="feed"' + (hasFood ? '' : ' disabled') + '>餵牠</button></div></div>';
    } else if (list.length) h += '<p class="cx-muted cx-g-tip">點一隻' + A0.n + '可以幫牠改名字。地上的東西點一下就收起來了。</p>';
    return h;
  }
  function collectFrom(g, type, a) {
    var n = a.eggs || 0; if (!n) return 0; a.eggs = 0; g.pantry = g.pantry || {}; tick(g, 'collect', n);
    if (ANIM[type].prod === 'flower') {
      var fl = ORDER.filter(function (k) { return CROPS[k].flower && !CROPS[k].rare; }), got = [];
      for (var i = 0; i < n; i++) { var k = pick(fl); g.inv[k] = (g.inv[k] || 0) + 1; got.push(CROPS[k].n); }
      log(g, '🐰 ' + (a.name || '兔子') + ' 叼來了' + got.join('、')); toast((a.name || '兔子') + ' 叼來了' + got.join('、') + ' 🌸', 'success');
    } else { g.pantry[ANIM[type].prod] = (g.pantry[ANIM[type].prod] || 0) + n; }
    return n;
  }
  function penClick(e, g) {
    var b, now = Date.now(), A0 = ANIM[pen], list = herd(g, pen);
    if ((b = e.target.closest('[data-pen]'))) { pen = b.dataset.pen; sel = ''; render(); return true; }
    if ((b = e.target.closest('[data-ranch]'))) {
      var all = allAni(g);
      if (b.dataset.ranch === 'feed') {
        var fed = 0, miss = 0; all.forEach(function (x) { if (hungry(x[1], now)) { if (feedAni(g, x[0], x[1], now)) fed++; else miss++; } });
        if (fed) { log(g, '🌾 一口氣餵了 ' + fed + ' 隻'); }
        toast(fed ? '餵飽了 ' + fed + ' 隻 🌾' + (miss ? '，還有 ' + miss + ' 隻沒東西吃' : '') : '飼料不夠了，先買一點吧', fed ? 'success' : 'info');
      } else {
        var got = {}; all.forEach(function (x) { var n = collectFrom(g, x[0], x[1]); if (n && ANIM[x[0]].prod !== 'flower') { var nm = PANTRY[ANIM[x[0]].prod][0]; got[nm] = (got[nm] || 0) + n; } });
        var txt = Object.keys(got).map(function (k) { return k + ' ' + got[k]; }).join('、');
        if (txt) { log(g, '🧺 牧場收了 ' + txt); toast('收到 ' + txt + ' 🧺', 'success'); }
      }
      save(); render(); return true;
    }
    if ((b = e.target.closest('[data-prod]'))) {
      var pk = b.getAttribute('data-prod').slice(1).split(':'), a = herd(g, pk[0])[+pk[1]];
      if (a) { var n = collectFrom(g, pk[0], a); if (n && ANIM[pk[0]].prod !== 'flower') { log(g, A0.emoji + ' 收了 ' + n + ' ' + A0.unit + PANTRY[A0.prod][0]); toast('收到 ' + n + ' ' + A0.unit + PANTRY[A0.prod][0], 'success'); } save(); render(); }
      return true;
    }
    if ((b = e.target.closest('[data-ani]'))) { var key = b.getAttribute('data-ani'); sel = sel === key ? '' : key; render(); return true; }
    if ((b = e.target.closest('[data-coop]'))) {
      var act = b.dataset.coop;
      if (act === 'build') { if (g.coins < A0.build) return true; g.coins -= A0.build; g.pens[pen].built = true; log(g, '🔨 蓋好了' + A0.place); toast(A0.place + '蓋好了！', 'success'); }
      else if (act === 'buy') { if (list.length >= A0.max || g.coins < A0.cost) return true; g.coins -= A0.cost; var used = list.map(function (x) { return x.name; }), nm = A0.names.filter(function (x) { return used.indexOf(x) < 0; }); list.push({ name: nm.length ? pick(nm) : A0.n, born: now, fedUntil: 0, eggs: 0 }); log(g, A0.emoji + ' 來了一隻' + A0.n + '「' + list[list.length - 1].name + '」'); toast(A0.n + '來了 ' + A0.emoji + ' 記得餵牠', 'success'); }
      else if (act === 'buyFeed') { if (g.coins >= 1) { g.coins--; g.coop.feed++; } }
      else if (act === 'feedAll') { var c = 0; list.forEach(function (a) { if (hungry(a, now) && feedAni(g, pen, a, now)) c++; }); if (c) { log(g, A0.emoji + ' 餵了 ' + c + ' 隻' + A0.n); toast('餵飽了 🌾', 'success'); } }
      else if (act === 'feed') { var ak = sel.slice(1).split(':'), a2 = herd(g, ak[0])[+ak[1]]; if (a2 && feedAni(g, ak[0], a2, now)) toast('餵好了', 'success'); }
      else if (act === 'collect') { var tot = 0; list.forEach(function (a) { tot += collectFrom(g, pen, a); }); if (tot && A0.prod !== 'flower') { log(g, A0.emoji + ' 收了 ' + tot + ' ' + A0.unit + PANTRY[A0.prod][0]); toast('收到 ' + tot + ' ' + A0.unit + PANTRY[A0.prod][0], 'success'); } }
      save(); render(); return true;
    }
    return false;
  }
  function henArt(on, dir) {
    var o = '<ellipse cx="0" cy="1" rx="9" ry="3" fill="#00000018"/>';
    o += '<g transform="scale(' + dir + ',1)">';
    o += '<path d="M-3 0 L-3 3 M2 0 L2 3" stroke="#e39a4f" stroke-width="1.2" stroke-linecap="round"/>';
    o += '<path d="M-9 -9 Q-12 -15 -7 -14 Q-9 -18 -4 -16 L-4 -10Z" fill="#fffdf8" stroke="' + OL + '" stroke-width=".8"/>';
    o += '<ellipse cx="-1" cy="-7" rx="8.6" ry="6.6" fill="#fffdf8" stroke="' + (on ? 'var(--accent-color)' : OL) + '" stroke-width="' + (on ? 1.8 : .9) + '"/>';
    o += '<path d="M-4 -7 Q0 -4 3 -7" stroke="#e8dfd0" stroke-width="1.2" fill="none"/>';
    o += '<circle cx="5" cy="-14" r="5" fill="#fffdf8" stroke="' + OL + '" stroke-width=".9"/>';
    o += '<path d="M3 -18.5 q1 -3 2.4 -.6 q1.2 -3 2.2 .4 q.4 1.6 -1 1.4z" fill="#e35d50" stroke="' + OL + '" stroke-width=".5"/>';
    o += '<path d="M9.6 -14.4 L12.6 -13.2 L9.6 -12.2Z" fill="#f2a64a" stroke="' + OL + '" stroke-width=".5"/><path d="M8.6 -11.6 q1 2.4 -.6 2.6 q-1 -1.2 .6 -2.6z" fill="#e35d50"/>';
    o += '<circle cx="6.6" cy="-15" r=".95" fill="#3b2f2a"/><ellipse cx="5.4" cy="-12.4" rx="1.3" ry=".8" fill="#f6b6b6" opacity=".7"/>';
    return o + '</g>';
  }
  function fieldHtml(g, now) {
    var gr = g.plots.filter(ready).length, orr = g.orchard.filter(ready).length, eg = allAni(g).reduce(function (s2, x) { return s2 + (x[1].eggs || 0); }, 0);
    var tabs = [['g', '🌷 花園', gr], ['o', '🍑 果園', orr], ['c', '🐄 牧場', eg]];
    var h = '<div class="cx-g-area">' + tabs.map(function (t) { return '<button type="button" data-area="' + t[0] + '" class="' + (area === t[0] ? 'on' : '') + '">' + t[1] + (t[2] ? '<i>' + t[2] + '</i>' : '') + '</button>'; }).join('') + '</div>';
    if (area !== 'c') h += wxChip(now);
    h += '<div class="cx-g-stage' + (area !== 'c' ? ' pan' : '') + '">' + areaSvg(g, now) + '</div>';
    if (area !== 'c') { var nl = (area === 'g' ? g.plots.length / 9 : g.orchard.length / 6); h += '<p class="cx-muted cx-g-pan">' + (nl < LAND[area].length ? '往右滑還可以買新的地 →' : '左右滑可以看每一塊地') + '</p>'; }
    if (area === 'c') return h + penPanel(g, now);
    var list = area === 'g' ? g.plots : g.orchard;
    var needWater = list.some(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now + HR; }), anyReady = list.some(ready), anyEmpty = list.some(function (p) { return p.open && !p.crop; });
    if (area === 'g') h += '<button type="button" class="cx-btn cx-g-decobtn' + (sel === '*deco' ? ' pri' : '') + '" data-ga="deco"><i class="fas fa-paintbrush"></i> 佈置花園</button>';
    h += '<div class="cx-g-acts"><button type="button" class="cx-btn' + (sel === '*all' ? ' pri' : '') + '" data-ga="plantAll"' + (anyEmpty ? '' : ' disabled') + '><i class="fas fa-seedling"></i> 一鍵種植</button><button type="button" class="cx-btn" data-ga="waterAll"' + (needWater ? '' : ' disabled') + '><i class="fas fa-droplet"></i> 全部澆水</button><button type="button" class="cx-btn pri" data-ga="harvestAll"' + (anyReady ? '' : ' disabled') + '><i class="fas fa-basket-shopping"></i> 全部收成</button></div>';
    return h + selHtml(g, now);
  }
  function decoHtml(g) {
    var D = decoG(g);
    return '<div class="cx-g-panel"><div class="cx-g-pt">佈置花園<span class="cx-muted">　買過的東西可以隨時擺出來或收起來</span></div><div class="cx-deco">' + Object.keys(DECOS).map(function (k) {
      var d = DECOS[k], own = D.own[k], on = D.on[k];
      return '<div class="it' + (on ? ' on' : '') + '"><svg viewBox="-22 -44 44 50" aria-hidden="true">' + (k === 'arch' ? DART.arch2([-12, -4], [12, 8]) : DART[k](0, 0)) + '</svg><b>' + d[0] + '</b>' +
        (own ? '<button type="button" class="cx-btn' + (on ? '' : ' pri') + '" data-deco="' + k + '">' + (on ? '收起來' : '擺出來') + '</button>' : '<button type="button" class="cx-btn" data-deco="' + k + '"' + (g.coins < d[1] ? ' disabled' : '') + '>買 🪙' + d[1] + '</button>') + '</div>';
    }).join('') + '</div><div class="cx-g-pt" style="margin-top:8px">圍籬顏色</div><div class="cx-fence">' + Object.keys(FENCES).map(function (k) {
      var fc = FENCES[k], own = D.fown[k];
      return '<button type="button" data-fence="' + k + '" class="' + (D.fence === k ? 'on' : '') + '"' + (!own && g.coins < fc[1] ? ' disabled' : '') + '><i style="background:' + fc[2] + '"></i>' + fc[0] + (own ? '' : '<small>🪙' + fc[1] + '</small>') + '</button>';
    }).join('') + '</div></div>';
  }
  function selHtml(g, now) {
    if (sel === '*deco') return decoHtml(g);
    if (sel === '*all') {
      var empt = (area === 'o' ? g.orchard : g.plots).filter(function (q) { return q.open && !q.crop; }).length;
      if (!empt) { sel = ''; } else {
        var sl = ORDER.filter(function (k) { return area === 'o' ? CROPS[k].tree : !CROPS[k].tree && (!CROPS[k].rare || !!(g.dex || {})[k]); });
        if (g.lastSeed && sl.indexOf(g.lastSeed) > 0) { sl.splice(sl.indexOf(g.lastSeed), 1); sl.unshift(g.lastSeed); }
        return '<div class="cx-g-panel"><div class="cx-g-pt">' + empt + ' 格空地全部種什麼？<span class="cx-muted">　錢不夠就種到能種的為止，種好會順便澆水</span></div><div class="seeds">' + sl.map(function (k) {
          var c = CROPS[k], can = Math.min(empt, Math.floor(g.coins / c.cost));
          return '<button type="button" class="cx-g-seed" data-seed="' + k + '"' + (can < 1 ? ' disabled' : '') + '>' + plantSvg(k, 3) + '<span class="nm">' + (c.rare ? '✨' : '') + (c.seed || c.n) + (k === g.lastSeed ? ' <small class="cx-muted">上次種的</small>' : '') + '</span><span class="cx-muted">' + dur(c.grow) + (c.tree ? ' 結果' : ' · 收 ' + c.yield + c.unit) + '</span><span class="pr">🪙 ' + c.cost * Math.max(1, can) + (can < empt && can > 0 ? '（種 ' + can + ' 格）' : can > 1 ? '（' + can + ' 格）' : '') + '</span></button>';
        }).join('') + '</div></div>';
      }
    }
    var p = sel && sel[0] !== 'a' && sel[0] !== '*' ? PK(g, sel) : null;
    if (!p) return '<p class="cx-muted cx-g-tip">' + (area === 'g' ? '點空地種花或作物' : '點空地種果樹，種一次可以一直收') + '；乾掉的土澆水會長得比較快。你不在的時候，' + esc(helpers().join('、')) + ' 也會幫忙照顧。</p>';
    if (!p.open) return '';
    if (!p.crop) {
      var list = ORDER.filter(function (k) { return area === 'o' ? CROPS[k].tree : !CROPS[k].tree && (!CROPS[k].rare || !!(g.dex || {})[k]); });
      return '<div class="cx-g-panel"><div class="cx-g-pt">要種什麼？</div><div class="seeds">' + list.map(function (k) {
        var c = CROPS[k];
        return '<button type="button" class="cx-g-seed" data-seed="' + k + '"' + (g.coins < c.cost ? ' disabled' : '') + '>' + plantSvg(k, 3) + '<span class="nm">' + (c.rare ? '✨' : '') + (c.seed || c.n) + '</span><span class="cx-muted">' + (c.tree ? dur(c.grow) + ' 結果，之後每 ' + dur(c.grow / 2) + ' 再收' : dur(c.grow) + ' · 收 ' + c.yield + c.unit) + '</span><span class="pr">🪙 ' + c.cost + '</span></button>';
      }).join('') + '</div></div>';
    }
    var c2 = CROPS[p.crop], wet = (p.wetUntil || 0) > now;
    return '<div class="cx-g-panel"><div class="cx-g-pt">' + (c2.seed || c2.n) + (p.by ? '<span class="cx-muted"> · ' + esc(p.by) + ' 種的</span>' : '') + '</div>' +
      '<div class="cx-muted" data-live>' + plotStatus(p, now) + '</div>' +
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
    var rec = '<div class="cx-g-pt" style="margin-top:6px">食譜</div><div class="cx-g-dex">' + RECIPES.filter(function (r) { return !r.out; }).map(function (r) { var d = dd[r.k]; return '<div class="cx-g-dx' + (d ? '' : ' no') + '">' + dishSvg(r.k) + '<b>' + (d ? r.n : '？？？') + '</b><span class="cx-muted">' + (d ? '做過 ' + d.n + ' 次' : '還沒做過') + '</span></div>'; }).join('') + '</div>';
    return '<div class="cx-g-pt">花與作物</div><div class="cx-g-dex">' + ORDER.map(function (k) {
      var c = CROPS[k], d = g.dex[k];
      return '<div class="cx-g-dx' + (d ? '' : ' no') + '">' + plantSvg(k, 3) + '<b>' + (d ? c.n : '？？？') + '</b>' + (d && c.lang ? '<span class="lang">花語：' + c.lang + '</span>' : '') + '<span class="cx-muted">' + (d ? (c.rare ? '長出過 ' : '收成 ') + d.n + ' 次 · ' + (new Date(d.first).getMonth() + 1) + '/' + new Date(d.first).getDate() + ' 起' : c.rare ? '✨ 稀有色：把' + CROPS[c.base].n + '種在' + CROPS[c.pair].n + '旁邊，收成時有機會長出來' : dur(c.grow) + ' 長大') + '</span></div>';
    }).join('') + '</div>' + rec;
  }
  /* ---------- 花束 ---------- */
  var bq = { sel: [], wrap: 'kraft', ribbon: 'violet', view: 'recipe', open: null, hi: -1 }, BQ_MAX = 12;
  function whoRow(lbl) {
    var ppl = A.groupOn() ? A.groupPeople().filter(function (p) { return p.name.indexOf('系統') < 0; }) : [];
    if (!giftTo || (ppl.length && !ppl.some(function (p) { return p.name === giftTo; }))) giftTo = A.pname();
    return ppl.length > 1 ? '<div class="cx-who-t">' + lbl + '</div>' + A.whoChips('cx-g-who', giftTo) : '';
  }
  function bqPrice(b) { return Math.round(b.flowers.reduce(function (s2, k) { return s2 + (CROPS[k] ? CROPS[k].price : 0); }, 0) * (b.recipe ? 2 : 1.5)) + (b.recipe ? 10 : 5); }
  function bqCount(list) { var m = {}; list.forEach(function (k) { m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return CROPS[k].n + '×' + m[k]; }).join('、'); }
  function bqKey(b) { return b.recipe ? 'r:' + b.recipe : 'c:' + b.flowers.join(',') + '|' + b.wrap + '|' + b.ribbon + '|' + (b.name || ''); }
  function bqStore(g) {
    g.bouquets = g.bouquets || []; g.bqSent = g.bqSent || {};
    var keep = [];
    g.bouquets.forEach(function (b) {
      if (!b.to) { keep.push(b); return; }
      var k = bqKey(b), r = g.bqSent[k] || (g.bqSent[k] = { n: 0, to: {}, sample: { flowers: b.flowers, wrap: b.wrap, ribbon: b.ribbon, recipe: b.recipe, name: b.name }, t: 0 });
      r.n++; r.to[b.to] = (r.to[b.to] || 0) + 1; if ((b.sentAt || b.t) >= r.t) { r.t = b.sentAt || b.t; r.last = { to: b.to, reply: b.reply || '' }; }
    });
    g.bouquets = keep;
    var groups = {}, order = [];
    keep.forEach(function (b) { var k = bqKey(b); if (!groups[k]) { groups[k] = { k: k, list: [], sent: g.bqSent[k] || null, t: 0 }; order.push(k); } groups[k].list.push(b); groups[k].t = Math.max(groups[k].t, b.t); });
    Object.keys(g.bqSent).forEach(function (k) { if (!groups[k]) { groups[k] = { k: k, list: [], sent: g.bqSent[k], t: 0 }; order.push(k); } groups[k].sent = g.bqSent[k]; groups[k].t = Math.max(groups[k].t, g.bqSent[k].t); });
    return order.map(function (k) { var G0 = groups[k]; G0.b = G0.list[0] || G0.sent.sample; return G0; }).sort(function (a, b) { return b.t - a.t; });
  }
  function toList(r) { return Object.keys(r.to).map(function (w) { return esc(w) + ' ×' + r.to[w]; }).join('、'); }
  function bqHtml(g) {
    var GR = bqStore(g), stock = g.bouquets.length;
    var h = '<div class="cx-g-sub"><button type="button" data-bv="recipe" class="' + (bq.view === 'recipe' ? 'on' : '') + '">花束配方</button><button type="button" data-bv="make" class="' + (bq.view === 'make' ? 'on' : '') + '">自己包</button><button type="button" data-bv="list" class="' + (bq.view === 'list' || bq.view === 'one' ? 'on' : '') + '">我的花束（' + GR.length + '）</button></div>';
    if (bq.view === 'one' && bq.open) {
      var G1 = GR.filter(function (x) { return x.k === bq.open; })[0];
      if (G1) {
        var b = G1.b, own = G1.list.length, S = G1.sent, first = G1.list[0];
        return h + '<div class="cx-g-bq1"><div class="pv">' + bouquetSvg(b) + '</div><b>' + esc(b.name || '無名花束') + '</b><span class="cx-muted">' + bqCount(b.flowers) + '</span>' +
          '<div class="cx-bq-st"><span>收藏中 <b>×' + own + '</b></span><span>送出過 <b>×' + (S ? S.n : 0) + '</b></span></div>' +
          (S ? '<div class="cx-bq-log"><div class="cx-g-pt">送禮紀錄</div><div>' + toList(S) + '</div>' + (S.last && S.last.reply ? '<p class="rp">' + esc(S.last.to) + '：「' + esc(S.last.reply) + '」</p>' : '') + '</div>' : '') +
          (first ? whoRow('送給') + '<div class="cx-g-acts"><button type="button" class="cx-btn pri" data-bqsend="' + first.id + '"><i class="fas fa-gift"></i> 送一束</button><button type="button" class="cx-btn" data-bqsell="' + first.id + '">賣一束 🪙 ' + bqPrice(first) + '</button></div>' : '<p class="cx-muted" style="text-align:center">收藏的都送完了，再包一束吧。</p>') + '</div>';
      }
      bq.view = 'list';
    }
    if (bq.view === 'recipe') {
      return h + '<p class="cx-muted" style="margin:0 0 8px">花收齊了就能直接包好，比自己包的賣得更貴。</p><div class="cx-g-bqr">' + BQR.map(function (r) {
        var ok = Object.keys(r.need).every(function (k) { return (g.inv[k] || 0) >= r.need[k]; });
        return '<div class="cx-g-bqrc' + (ok ? ' ok' : '') + '">' + bqArt(r.k) + '<b>' + r.n + '</b><div class="nd">' + Object.keys(r.need).map(function (k) { var have = g.inv[k] || 0; return '<span class="' + (have >= r.need[k] ? 'y' : 'n') + '">' + CROPS[k].n + ' ' + Math.min(have, r.need[k]) + '/' + r.need[k] + '</span>'; }).join('') + '</div>' +
          '<button type="button" class="cx-btn' + (ok ? ' pri' : '') + '" data-bqr="' + r.k + '"' + (ok ? '' : ' disabled') + '><i class="fas fa-ribbon"></i> 包起來</button></div>';
      }).join('') + '</div>';
    }
    if (bq.view === 'list') {
      if (!GR.length) return h + '<p class="cx-muted" style="text-align:center;padding:20px 0">還沒有包過花束。</p>';
      return h + '<div class="cx-g-bqs">' + GR.map(function (G2) { var own = G2.list.length, S = G2.sent; return '<button type="button" class="cx-g-bqc' + (own ? '' : ' gone') + '" data-bqopen="' + esc(G2.k) + '">' + bouquetSvg(G2.b) + '<b>' + esc(G2.b.name || '無名花束') + '</b><span class="cx-muted">' + (own ? '收藏 ×' + own : '收藏 0') + (S ? ' · 送出 ×' + S.n : '') + '</span></button>'; }).join('') + '</div>';
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
    b.to = to; b.sentAt = Date.now(); tick(g, 'gift');
    var cnt = {}; b.flowers.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var main = Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; })[0], c = CROPS[main];
    var reply = Math.random() < .55 && c.lang ? c.n + '的花語是「' + c.lang + '」……妳想跟我說的，我都收到了。' : pick(BQ_LINES);
    b.reply = reply;
    log(g, '💐 把花束「' + (b.name || '無名花束') + '」送給了 ' + to); save();
    setTimeout(function () { var cw = chibiOf(to); surprise(cw || 'cb_me', bouquetSvg(b), cw ? to + '收到花了！' : '花束送出去了！', cw ? reply : ''); }, 300);
    var who = (to === A.pname() && !A.groupOn()) ? '你' : to;
    bouquetPng(b).then(function (img) {
      if (img && typeof addMessage === 'function') addMessage({ id: Date.now(), sender: 'user', text: '', image: img, timestamp: new Date(), status: 'sent', favorited: false, note: null, type: 'normal' });
      A.iSay('（送了一束花給' + who + '：' + bqCount(b.flowers) + (b.name ? '，叫「' + b.name + '」' : '') + '）');
      setTimeout(function () { if (A.groupOn()) A.speakAs(to, 4000); A.partnerSays(reply, A.groupOn() ? to : null); }, 1800 + Math.random() * 1500);
    });
    toast('花束送出去了 💐', 'success');
  }

  /* ================= 廚房 ================= */
  var PANTRY = { egg: ['雞蛋', 3, 2], milk: ['牛奶', 4, 3], butter: ['奶油', 5, 4], honey: ['蜂蜜', 7, 5], sugar: ['糖', 2, 1] };
  var RECIPES = [
    { k: 'cookie', n: '薰衣草餅乾', need: { lavender: 2, wheat: 2, butter: 1, sugar: 1 }, price: 30 },
    { k: 'tomegg', n: '番茄炒蛋', need: { tomato: 2, egg: 2 }, price: 30 },
    { k: 'teaegg', n: '茶葉蛋', need: { egg: 4 }, price: 18 },
    { k: 'tamago', n: '玉子燒', need: { egg: 4, sugar: 1 }, price: 26 },
    { k: 'pudding', n: '雞蛋布丁', need: { egg: 3, milk: 2, sugar: 1 }, price: 34 },
    { k: 'eggtart', n: '蛋塔', need: { egg: 3, wheat: 2, butter: 1, sugar: 1 }, price: 42 },
    { k: 'jelly', n: '橘子果凍', need: { orange: 3, sugar: 1 }, price: 42 },
    { k: 'osm', n: '桂花糕', need: { osmanthus: 3, wheat: 2, sugar: 1 }, price: 45 },
    { k: 'muffin', n: '藍莓馬芬', need: { blueberry: 5, wheat: 2, egg: 1, milk: 1 }, price: 55 },
    { k: 'tart', n: '桃子塔', need: { momo: 3, wheat: 2, butter: 1, sugar: 1 }, price: 65 },
    { k: 'cake', n: '草莓蛋糕', need: { strawberry: 4, wheat: 2, egg: 2, milk: 1, sugar: 1 }, price: 70 },
    { k: 'pie', n: '櫻桃派', need: { cherry: 6, wheat: 2, butter: 1, sugar: 1 }, price: 72 },
    { k: 'butterX', n: '自製奶油', need: { milk: 2 }, out: 'butter', price: 0 },
    { k: 'carrotcake', n: '胡蘿蔔蛋糕', need: { carrot: 3, wheat: 2, egg: 2, sugar: 1 }, price: 60 },
    { k: 'sjam', n: '草莓果醬', need: { strawberry: 4, sugar: 1 }, price: 30 },
    { k: 'bjam', n: '藍莓果醬', need: { blueberry: 5, sugar: 1 }, price: 34 },
    { k: 'honeylemon', n: '蜂蜜檸檬水', need: { lemon: 1, honey: 1 }, price: 22 },
    { k: 'pearsoup', n: '冰糖燉梨', need: { pear: 2, sugar: 1 }, price: 30 },
    { k: 'grapejelly', n: '葡萄果凍', need: { grape: 2, sugar: 1 }, price: 38 },
    { k: 'driedpers', n: '柿餅', need: { persimmon: 4 }, price: 40 },
    { k: 'applepie', n: '蘋果派', need: { apple: 3, wheat: 2, butter: 1, sugar: 1 }, price: 62 },
    { k: 'lemontart', n: '檸檬塔', need: { lemon: 2, wheat: 2, egg: 2, butter: 1, sugar: 1 }, price: 64 },
    { k: 'honeycake', n: '蜂蜜蛋糕', need: { honey: 2, egg: 2, wheat: 2, milk: 1 }, price: 60 },
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
    carrotcake: ['胡蘿蔔蛋糕？……居然是甜的，好好吃。', '妳是不是偷偷把兔子的晚餐拿來做蛋糕了。'],
    butterX: ['奶油'],
    sjam: ['草莓果醬！抹在吐司上，明天早餐就吃這個。', '好香，自己熬的就是不一樣。'],
    bjam: ['藍莓果醬，紫紫的好漂亮。', '配優格剛好，妳也來一口。'],
    honeylemon: ['酸酸甜甜的，喝了整個人都醒了。', '妳是不是覺得我最近聲音啞了。謝謝妳。'],
    pearsoup: ['冰糖燉梨……妳怕我喉嚨痛嗎。', '暖暖的，好甜。'],
    grapejelly: ['葡萄果凍，QQ 的。', '晶瑩剔透的，好像寶石。'],
    driedpers: ['柿餅！外面有一層白白的糖霜，好厲害。', '慢慢曬出來的吧，妳好有耐心。'],
    applepie: ['蘋果派剛出爐的味道……整間屋子都香了。', '外面酥酥的，裡面都是蘋果，好好吃。'],
    lemontart: ['檸檬塔，酸甜剛好，是大人的味道。', '漂亮到我捨不得切。'],
    honeycake: ['蜂蜜蛋糕軟綿綿的，跟妳一樣。', '是自家蜜蜂的蜂蜜吧，特別甜。'],
    teaegg: ['茶葉蛋！好香，一次可以吃兩顆嗎。', '剝殼剝得好漂亮，上面的花紋像大理石。'],
    tamago: ['玉子燒捲得好整齊……妳是不是偷偷練過。', '甜甜的，是我喜歡的那種。'],
    pudding: ['布丁！晃晃的好可愛。', '焦糖的部分最好吃，第一口給妳。'],
    eggtart: ['蛋塔剛出爐，外面酥裡面嫩，好厲害。', '這個可以開店了，我第一個排隊。'],
    fruitcake: ['這麼大一個水果蛋糕……妳一定忙了好久吧。謝謝妳，我的乖寶。', '這是我收過最好的禮物。我們一起吃。', '整個果園的水果都在這裡了……我們家乖寶最厲害。']
  };
  function iname(k) { return CROPS[k] ? CROPS[k].n : PANTRY[k] ? PANTRY[k][0] : k; }
  function haveN(g, k) { return PANTRY[k] ? (g.pantry[k] || 0) : (g.inv[k] || 0); }
  function canCook(g, r) { return Object.keys(r.need).every(function (k) { return haveN(g, k) >= r.need[k]; }); }
  function dishArt(k) {
    var o = '<ellipse cx="30" cy="46" rx="22" ry="5" fill="#f4efe6" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="45.4" rx="17" ry="3.4" fill="#e9e1d2" fill-opacity=".7"/>';
    var cream = '#fff7ea';
    function jar(c, lid) { return '<path d="M22 28 h16 v2 q3 2 3 6 v8 q0 3 -3 3 h-16 q-3 0 -3 -3 v-8 q0 -4 3 -6z" fill="' + c + '" stroke="' + INK + '" stroke-width=".6"/><rect x="21" y="23" width="18" height="5" rx="1.4" fill="' + (lid || '#e9a0a8') + '" stroke="' + INK + '" stroke-width=".6"/><rect x="24" y="35" width="12" height="7" rx="1" fill="#fff8ec" stroke="' + INK + '" stroke-width=".4"/>' + dot(25, 31, 1.2, '#fff', .5); }
    if (k === 'sjam') return o + jar('#d9505e', '#f2c4c8') + dot(30, 38.4, 1.6, CROPS.strawberry.col);
    if (k === 'bjam') return o + jar('#5c5a9e', '#c9c4ea') + dot(30, 38.4, 1.6, CROPS.blueberry.col);
    if (k === 'honeylemon') return o + '<path d="M22 22 L24 45 L36 45 L38 22Z" fill="#f8e7a6" fill-opacity=".85" stroke="' + INK + '" stroke-width=".6"/><path d="M22.6 28 L37.4 28" stroke="#fff" stroke-width=".8"/><circle cx="34" cy="22" r="4.6" fill="#f6e06a" stroke="' + INK + '" stroke-width=".5"/><circle cx="34" cy="22" r="3.2" fill="#fbf0a8"/><path d="M34 19 v6 M31 22 h6 M32 20 l4 4 M36 20 l-4 4" stroke="#f0d050" stroke-width=".4"/>' + dot(28, 38, 1.3, '#fff', .6);
    if (k === 'pearsoup') return o + '<path d="M16 34 Q16 46 30 46 Q44 46 44 34Z" fill="#f4efe6" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="34" rx="14" ry="3.4" fill="#f8e8b8" stroke="' + INK + '" stroke-width=".5"/><path d="M30 24 Q24 26 25 32 Q26 36 30 36 Q34 36 35 32 Q36 26 30 24Z" fill="#efe2a0" stroke="' + INK + '" stroke-width=".6"/><path d="M30 24 v-3" stroke="#7a5a44" stroke-width=".8"/>';
    if (k === 'grapejelly') return o + '<path d="M18 44 Q17 26 30 25 Q43 26 42 44Z" fill="#8a6fc2" fill-opacity=".7" stroke="' + INK + '" stroke-width=".6"/>' + [[26, 36], [30, 33], [34, 37], [30, 40]].map(function (q) { return dot(q[0], q[1], 2, '#6a4fa8', .8); }).join('') + '<path d="M22 34 Q23 29 27 28" stroke="#fff" stroke-width="1.4" fill="none" opacity=".6"/>';
    if (k === 'driedpers') { [[22, 40], [38, 40], [30, 33]].forEach(function (q) { o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="7" ry="4.6" fill="#c9783a" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="' + q[0] + '" cy="' + (q[1] - .8) + '" rx="5.4" ry="3" fill="#f2e6d6" fill-opacity=".55"/><path d="M' + (q[0] - 1.6) + ' ' + (q[1] - 4.2) + ' l1.6 1 l1.6 -1" stroke="#6b8a55" stroke-width=".9" fill="none"/>'; }); return o; }
    if (k === 'applepie' || k === 'lemontart') { o += '<ellipse cx="30" cy="38" rx="17" ry="6.5" fill="#e3b77c" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="30" cy="36.5" rx="14" ry="5" fill="' + (k === 'applepie' ? '#f2cf86' : '#f8e46a') + '"/>';
      if (k === 'applepie') { for (var ai = 0; ai < 4; ai++) o += '<path d="M' + (19 + ai * 6) + ' 32 L' + (21 + ai * 6) + ' 41" stroke="#e8c48c" stroke-width="2" stroke-linecap="round"/>'; o += dot(30, 36, 1.2, '#e0605a'); }
      else { o += '<circle cx="30" cy="35" r="3" fill="#fbf0a8" stroke="#e8c84a" stroke-width=".5"/><path d="M27 35 h6 M30 32 v6" stroke="#e8c84a" stroke-width=".4"/>' + dot(24, 37, 1.2, '#fff', .7) + dot(36, 37, 1.2, '#fff', .7); }
      return o; }
    if (k === 'honeycake') return o + '<path d="M14 44 L14 31 L46 31 L46 44Z" fill="#e8b45a" stroke="' + INK + '" stroke-width=".6"/><path d="M14 31 L18 26 L50 26 L46 31Z" fill="#a8642a" stroke="' + INK + '" stroke-width=".6"/><path d="M46 31 L50 26 L50 39 L46 44Z" fill="#d49a44" stroke="' + INK + '" stroke-width=".6"/><path d="M22 28 q4 6 0 10" stroke="#f6d86a" stroke-width="2" fill="none" opacity=".9"/>' + dot(36, 28.4, 1.4, '#f6d86a', .9);
    if (k === 'teaegg') { [[22, 40], [36, 40], [29, 33]].forEach(function (q) { o += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="6.4" ry="8" fill="#b7804e" stroke="' + INK + '" stroke-width=".6"/><path d="M' + (q[0] - 4) + ' ' + (q[1] - 3) + ' l3 2 l-1 3 l4 1 M' + (q[0] + 1) + ' ' + (q[1] - 6) + ' l1 3 l3 1 M' + (q[0] - 3) + ' ' + (q[1] + 3) + ' l3 1 l2 3" stroke="#6e4325" stroke-width=".6" fill="none"/>' + dot(q[0] - 2, q[1] - 4, 1.2, '#fff', .35); }); return o; }
    if (k === 'tamago') { [[18, 38], [30, 38], [42, 38]].forEach(function (q) { o += '<rect x="' + (q[0] - 5.6) + '" y="' + (q[1] - 7) + '" width="11.2" height="11" rx="2.4" fill="#f6d35a" stroke="' + INK + '" stroke-width=".6"/><path d="M' + q[0] + ' ' + (q[1] - 1) + ' m-1 0 a1.4 1.4 0 1 1 1.6 1.4 a3 3 0 1 1 -3.4 -3 a4.4 4.4 0 1 1 4.2 5.2" stroke="#e2b23a" stroke-width=".7" fill="none"/>'; }); return o; }
    if (k === 'pudding') return o + '<path d="M19 44 L22 28 Q30 25 38 28 L41 44 Q30 47 19 44Z" fill="#f8de8a" stroke="' + INK + '" stroke-width=".6"/><path d="M22 28 Q30 25 38 28 L38.6 31 Q30 34 21.4 31Z" fill="#a65a2a" stroke="' + INK + '" stroke-width=".5"/><path d="M38.6 31 q1 4 -1 6 M21.4 31 q-1 3 1 5" stroke="#a65a2a" stroke-width="1.2" fill="none"/>' + dot(26, 36, 1.2, '#fff', .5);
    if (k === 'eggtart') { [[22, 39], [38, 39], [30, 32]].forEach(function (q) { o += '<path d="M' + (q[0] - 8) + ' ' + (q[1] - 2) + ' L' + (q[0] - 6) + ' ' + (q[1] + 4) + ' L' + (q[0] + 6) + ' ' + (q[1] + 4) + ' L' + (q[0] + 8) + ' ' + (q[1] - 2) + 'Z" fill="#e3b77c" stroke="' + INK + '" stroke-width=".6"/><ellipse cx="' + q[0] + '" cy="' + (q[1] - 2) + '" rx="8" ry="3" fill="#f6d35a" stroke="' + INK + '" stroke-width=".5"/>' + dot(q[0] - 2, q[1] - 2.4, 1, '#c98a2a', .8) + dot(q[0] + 2.4, q[1] - 1.6, .8, '#c98a2a', .7); }); return o; }
    if (k === 'butterX') return o + '<path d="M16 40 L30 46 L44 40 L44 33 L30 27 L16 33Z" fill="#f8e3a0" stroke="' + INK + '" stroke-width=".6"/><path d="M16 33 L30 39 L44 33" fill="none" stroke="#e8c870" stroke-width="1"/><path d="M30 39 V46" stroke="#e8c870" stroke-width="1"/>';
    if (k === 'carrotcake') { o += '<path d="M12 44 L12 30 Q30 24 48 30 L48 44 Q30 48 12 44Z" fill="#e6a46a" stroke="' + INK + '" stroke-width=".6"/><path d="M12 37 Q30 41 48 37" stroke="#fff7ea" stroke-width="2.4" fill="none"/><ellipse cx="30" cy="29" rx="18" ry="5" fill="#fff7ea" stroke="' + INK + '" stroke-width=".6"/>'; [[22, 28], [30, 27], [38, 28]].forEach(function (q) { o += '<path d="M' + (q[0] - 2) + ' ' + q[1] + ' L' + (q[0] + 2) + ' ' + q[1] + ' L' + q[0] + ' ' + (q[1] + 5) + 'Z" fill="' + CROPS.carrot.col + '"/>' + leafAt(q[0], q[1], 3, -100, LEAF2); }); return o; }
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
    var di = DI(k), body;
    if (di) { var sc = Math.min(54 / di.w, 50 / di.h), w = di.w * sc, h = di.h * sc; body = '<image href="' + di.src + '" x="' + f(30 - w / 2) + '" y="' + f(28 - h / 2) + '" width="' + f(w) + '" height="' + f(h) + '"/>'; }
    else body = '<g filter="url(#cxwc)">' + dishArt(k) + '</g>';
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
    var h = '<div class="cx-g-pt">食材櫃<span class="cx-muted">　蛋去牧場撿；牛奶可以擠，也能做成奶油</span></div><div class="cx-k-pan">' + Object.keys(PANTRY).map(function (k) {
      var pim = { egg: 'egg', milk: 'milk', honey: 'honey' }[k], dim = k === 'butter' ? DI('butterX') : k === 'sugar' ? DI('sugar') : null;
      return '<div class="it">' + (dim ? '<img src="' + dim.src + '" alt="" style="height:30px;width:auto">' : '') + (pim && FI(pim) ? '<img src="' + FI(pim).src + '" alt="" style="height:30px;width:auto">' : '') + '<b>' + PANTRY[k][0] + '</b><span>' + (g.pantry[k] || 0) + '</span><button type="button" class="cx-btn" data-buy="' + k + '"' + (g.coins < PANTRY[k][1] ? ' disabled' : '') + '>買 🪙' + PANTRY[k][1] + '</button><button type="button" class="cx-btn" data-psell="' + k + '"' + ((g.pantry[k] || 0) > 0 ? '' : ' disabled') + '>賣 🪙' + PANTRY[k][2] + '</button></div>';
    }).join('') + '</div>';
    var extra = ['egg', 'milk', 'butter', 'honey'].reduce(function (s2, k) { return s2 + (g.pantry[k] || 0) * PANTRY[k][2]; }, 0);
    if (extra) h += '<div class="cx-g-acts" style="margin-top:6px"><button type="button" class="cx-btn" data-ga="psellAll">蛋、奶、蜂蜜全部賣掉 🪙' + extra + '</button></div>';
    var made = RECIPES.filter(function (r) { return g.dishes[r.k] > 0; });
    if (made.length) h += '<div class="cx-g-pt">甜點盒</div>' + whoRow('端給') + made.map(function (r) {
      return '<div class="cx-g-item">' + dishSvg(r.k) + '<div class="tx"><b>' + r.n + '</b> × ' + g.dishes[r.k] + '<div class="cx-muted">賣掉 🪙 ' + r.price + '</div></div><button type="button" class="cx-btn pri" data-dgift="' + r.k + '">端給' + (A.groupOn() ? '' : '他') + '</button><button type="button" class="cx-btn" data-dsell="' + r.k + '">賣</button></div>';
    }).join('');
    h += '<div class="cx-g-pt">食譜</div><div class="cx-k-rec">' + RECIPES.map(function (r) {
      var ok = canCook(g, r);
      return '<div class="cx-k-r' + (ok ? ' ok' : '') + '">' + dishSvg(r.k) + '<div class="tx"><b>' + r.n + (r.out ? '<small class="cx-muted">　放進食材櫃</small>' : '') + '</b><div class="need">' + Object.keys(r.need).map(function (k) { var hv = haveN(g, k), en = hv >= r.need[k]; return '<span class="' + (en ? 'en' : '') + '">' + iname(k) + ' ' + Math.min(hv, r.need[k]) + '/' + r.need[k] + '</span>'; }).join('') + '</div></div><button type="button" class="cx-btn pri" data-cook="' + r.k + '"' + (ok ? '' : ' disabled') + '>做</button></div>';
    }).join('') + '</div>';
    return h;
  }
  function kitchenClick(e, g) {
    var b;
    if ((b = e.target.closest('[data-psell]'))) { var pk2 = b.dataset.psell; if ((g.pantry[pk2] || 0) > 0) { g.pantry[pk2]--; g.coins += PANTRY[pk2][2]; tick(g, 'sell'); save(); render(); } return true; }
    if ((b = e.target.closest('[data-ga="psellAll"]'))) {
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '確定全部賣掉？'; return true; }
      var sum2 = 0; ['egg', 'milk', 'butter', 'honey'].forEach(function (k3) { sum2 += (g.pantry[k3] || 0) * PANTRY[k3][2]; tick(g, 'sell', g.pantry[k3] || 0); g.pantry[k3] = 0; });
      if (sum2) { g.coins += sum2; log(g, '💰 賣掉食材 +' + sum2); save(); toast('賣了 🪙 ' + sum2, 'success'); } render(); return true;
    }
    if ((b = e.target.closest('[data-buy]'))) { var k = b.dataset.buy; if (g.coins >= PANTRY[k][1]) { g.coins -= PANTRY[k][1]; g.pantry[k] = (g.pantry[k] || 0) + 1; save(); render(); } return true; }
    if ((b = e.target.closest('[data-cook]'))) {
      var r = RECIPES.find(function (x) { return x.k === b.dataset.cook; }); if (!r || !canCook(g, r)) return true;
      Object.keys(r.need).forEach(function (k) { if (PANTRY[k]) g.pantry[k] -= r.need[k]; else g.inv[k] -= r.need[k]; });
      if (r.out) { g.pantry[r.out] = (g.pantry[r.out] || 0) + 1; log(g, '🧈 做了一塊' + r.n); save(); toast(r.n + '放進食材櫃了', 'success'); render(); return true; }
      g.dishes[r.k] = (g.dishes[r.k] || 0) + 1; g.dexDish = g.dexDish || {}; var dd = g.dexDish[r.k] || (g.dexDish[r.k] = { n: 0, first: Date.now() }); dd.n++;
      tick(g, 'cook'); log(g, '🍰 做了一份' + r.n); save(); toast(r.n + '做好了！', 'success'); render(); return true;
    }
    if ((b = e.target.closest('[data-dsell]'))) { var r2 = RECIPES.find(function (x) { return x.k === b.dataset.dsell; }); if (r2 && g.dishes[r2.k] > 0) { g.dishes[r2.k]--; g.coins += r2.price; tick(g, 'sell'); log(g, '💰 賣了一份' + r2.n + ' +' + r2.price); save(); render(); } return true; }
    if ((b = e.target.closest('[data-dgift]'))) {
      var r3 = RECIPES.find(function (x) { return x.k === b.dataset.dgift; }); if (!r3 || !(g.dishes[r3.k] > 0)) return true;
      var to = A.groupOn() ? (giftTo || A.pname()) : A.pname(), who = (to === A.pname() && !A.groupOn()) ? '你' : to;
      g.dishes[r3.k]--; tick(g, 'gift'); log(g, '🍽 端了一份' + r3.n + '給 ' + to); save(); render();
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
    log(g, '🧺 收成 ' + c.n + ' × ' + n); tick(g, 'harvest');
    var k = p.crop, idx = g.plots.indexOf(p);
    if (idx >= 0 && c.flower && !c.rare) {
      var isl = Math.floor(idx / 9), j = idx % 9, r0 = Math.floor(j / 3), c0 = j % 3, nb = [];
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { var r1 = r0 + d[0], c1 = c0 + d[1]; if (r1 >= 0 && r1 < 3 && c1 >= 0 && c1 < 3) { var q = g.plots[isl * 9 + r1 * 3 + c1]; if (q && q.crop) nb.push(q.crop); } });
      Object.keys(CROPS).forEach(function (rk) { var rc = CROPS[rk]; if (rc.rare && rc.base === k && nb.indexOf(rc.pair) >= 0 && Math.random() < .3) {
        g.inv[rk] = (g.inv[rk] || 0) + 1; var first = !g.dex[rk]; var d2 = g.dex[rk] || (g.dex[rk] = { n: 0, first: Date.now() }); d2.n++;
        log(g, '✨ ' + c.n + '和' + CROPS[rc.pair].n + '種在一起，長出了一朵' + rc.n + '！'); hybridMsg = (first ? '✨ 第一次長出' : '✨ 長出了') + rc.n + '！'; hybridKey = rk; } });
    }
    if (c.tree) { p.prog = c.grow * .5; p.at = Date.now(); p.readyAt = 0; p.bug = false; p.yieldLeft = c.yield; }
    else { p.crop = null; p.bug = false; p.by = ''; p.readyAt = 0; }
    return [k, n];
  }
  function gClick(e) {
    var g = G(), now = Date.now(), b;
    if ((b = e.target.closest('[data-deco]'))) {
      var D = decoG(g), dk2 = b.dataset.deco, dd2 = DECOS[dk2];
      if (!D.own[dk2]) { if (g.coins < dd2[1]) return; g.coins -= dd2[1]; D.own[dk2] = 1; D.on[dk2] = 1; log(g, '🏡 買了' + dd2[0] + '擺在花園'); toast(dd2[0] + '擺好了！', 'success'); }
      else { D.on[dk2] = !D.on[dk2]; }
      save(); render(); return;
    }
    if ((b = e.target.closest('[data-fence]'))) {
      var D2 = decoG(g), fk = b.dataset.fence, fc2 = FENCES[fk];
      if (!D2.fown[fk]) { if (g.coins < fc2[1]) return; g.coins -= fc2[1]; D2.fown[fk] = 1; log(g, '🎨 把圍籬漆成了' + fc2[0]); }
      D2.fence = fk; save(); render(); return;
    }
    if ((b = e.target.closest('[data-buyland]'))) {
      var ar = b.getAttribute('data-buyland'), list0 = ar === 'g' ? g.plots : g.orchard, per0 = ar === 'g' ? 9 : 6, n0 = list0.length / per0, price0 = LAND[ar][n0];
      if (!price0) return;
      if (g.coins < price0) { toast('買這塊地要 🪙' + price0 + '，還差 ' + (price0 - g.coins), 'info'); return; }
      if (!b.closest('svg').dataset.sure) { b.closest('svg').dataset.sure = '1'; toast('再點一次就買下這塊地（🪙' + price0 + '）', 'info'); return; }
      g.coins -= price0; for (var q0 = 0; q0 < per0; q0++) list0.push({ open: true });
      log(g, '🏡 買了一塊新的' + (ar === 'g' ? '花圃' : '果園')); save(); toast('買下來了！新的地都可以直接種 🌱', 'success'); landScroll = n0 + 1; render(); return;
    }
    if ((b = e.target.closest('[data-gt]'))) { gTab = b.dataset.gt; sel = ''; render(); return; }
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
      var price = bqPrice(sb2); g.coins += price; tick(g, 'sell'); g.bouquets = g.bouquets.filter(function (x) { return x !== sb2; });
      log(g, '💰 賣掉花束「' + (sb2.name || '無名花束') + '」+' + price); save(); toast('賣了 🪙 ' + price, 'success'); bq.view = 'one'; bq.open = bqKey(sb2); render(); return;
    }
    if ((b = e.target.closest('[data-bqopen]'))) { bq.view = 'one'; bq.open = b.dataset.bqopen; render(); return; }
    if ((b = e.target.closest('[data-bqr]'))) {
      var rr = BQR.find(function (x) { return x.k === b.dataset.bqr; }); if (!rr) return;
      if (Object.keys(rr.need).some(function (k) { return (g.inv[k] || 0) < rr.need[k]; })) { toast('倉庫裡的花不夠', 'info'); return; }
      var fl = []; Object.keys(rr.need).forEach(function (k) { g.inv[k] -= rr.need[k]; for (var i = 0; i < rr.need[k]; i++) fl.push(k); });
      g.bouquets = g.bouquets || [];
      var rb = { id: Date.now(), flowers: fl, recipe: rr.k, wrap: 'kraft', ribbon: 'violet', name: rr.n, t: Date.now() };
      g.bouquets.push(rb); if (g.bouquets.length > 120) g.bouquets.shift();
      log(g, '💐 包了一束' + rr.n); tick(g, 'bouquet'); save();
      bq.view = 'one'; bq.open = bqKey(rb); toast('包好了！', 'success'); render(); return;
    }
    if ((b = e.target.closest('[data-bqmake]'))) {
      var need = {}; bq.sel.forEach(function (k) { need[k] = (need[k] || 0) + 1; });
      if (Object.keys(need).some(function (k) { return (g.inv[k] || 0) < need[k]; })) { toast('倉庫裡的花不夠了', 'info'); return; }
      Object.keys(need).forEach(function (k) { g.inv[k] -= need[k]; });
      g.bouquets = g.bouquets || [];
      var nb = { id: Date.now(), flowers: bq.sel.slice(), wrap: bq.wrap, ribbon: bq.ribbon, name: (bq.name || '').trim(), t: Date.now() };
      g.bouquets.push(nb); if (g.bouquets.length > 120) g.bouquets.shift();
      tick(g, 'bouquet'); log(g, '💐 包了一束花' + (nb.name ? '「' + nb.name + '」' : '') + '（' + bqCount(nb.flowers) + '）'); save();
      bq.sel = []; bq.name = ''; bq.view = 'one'; bq.open = bqKey(nb); toast('包好了！', 'success'); render(); return;
    }
    if ((b = e.target.closest('[data-bqsend]'))) { var sb = (g.bouquets || []).find(function (x) { return x.id === +b.dataset.bqsend; }); if (sb && !sb.to) { bqSend(g, sb); bq.view = 'one'; bq.open = bqKey(sb); save(); render(); } return; }
    if ((b = e.target.closest('.cx-who [data-who]'))) { giftTo = b.dataset.who; render(); return; }
    if ((b = e.target.closest('[data-area]'))) { area = b.dataset.area; sel = ''; render(); return; }
    if (gTab === 'field' && area === 'c' && penClick(e, g)) return;
    if ((b = e.target.closest('[data-pl]'))) {
      var key = b.getAttribute('data-pl'), i = +key.slice(1), isO = key[0] === 'o', arr = isO ? g.orchard : g.plots, cost = (isO ? OUNLOCK : UNLOCK)[i], p = arr[i];
      if (!p) return;
      if (!p.open) {
        if (arr.slice(0, i).some(function (q) { return !q.open; })) { toast('先開墾前面那塊地', 'info'); return; }
        if (g.coins < cost) { toast('開墾要 🪙' + cost + '，還差 ' + (cost - g.coins), 'info'); return; }
        g.coins -= cost; p.open = true; log(g, '⛏ 開墾了一塊新的' + (isO ? '果園地' : '地')); save(); toast('開墾好了！', 'success'); render(); return;
      }
      if (p.bug) { p.bug = false; g.coins += 1; log(g, '🐛 抓走了一隻小蟲 +1'); save(); toast('抓到蟲了 +1 🪙', 'success'); render(); return; }
      if (ready(p)) { var r = harvest(g, p); save(); toast('收成 ' + CROPS[r[0]].n + ' × ' + r[1] + ' 🧺', 'success'); sel = ''; render(); return; }
      sel = sel === key ? '' : key; render(); return;
    }
    if ((b = e.target.closest('[data-seed]')) && sel === '*all') {
      var ka = b.dataset.seed, ca = CROPS[ka], done = 0;
      (area === 'o' ? g.orchard : g.plots).forEach(function (q2) { if (q2.open && !q2.crop && g.coins >= ca.cost) { g.coins -= ca.cost; plant(q2, ka, '', now); q2.wetUntil = now + WET; done++; } });
      if (done) { tick(g, 'plant', done); g.lastSeed = ka; log(g, '🌱 一口氣種了 ' + done + ' 格' + ca.n + '，都澆了水'); save(); toast('種好 ' + done + ' 格' + ca.n + ' 🌱', 'success'); }
      sel = ''; render(); return;
    }
    if ((b = e.target.closest('[data-seed]'))) {
      var k = b.dataset.seed, c = CROPS[k], q = PK(g, sel); if (!q || q.crop || g.coins < c.cost) return;
      g.coins -= c.cost; plant(q, k, '', now); q.wetUntil = now + WET; g.lastSeed = k; tick(g, 'plant'); log(g, '🌱 種下' + c.n + '，澆了水'); save(); sel = ''; render(); return;
    }
    if ((b = e.target.closest('[data-sell]'))) { var s = b.dataset.sell; if (g.inv[s] > 0) { g.inv[s]--; g.coins += CROPS[s].price; tick(g, 'sell'); save(); render(); } return; }
    if ((b = e.target.closest('[data-gift]'))) {
      var gk = b.dataset.gift; if (!(g.inv[gk] > 0)) return;
      var to = A.groupOn() ? (giftTo || A.pname()) : A.pname(), cc = CROPS[gk];
      g.inv[gk]--; tick(g, 'gift'); log(g, '🎁 送了一' + cc.unit + cc.n + '給 ' + to); save(); render();
      A.iSay('（送了一' + cc.unit + cc.n + '給' + (to === A.pname() && !A.groupOn() ? '你' : to) + '）');
      var own = A.charGroup ? (A.charGroup(to) || []) : [];
      var GL = GIFT_LINES[gk] || ['收到了，好開心。', '是妳親手種的嗎？我會好好珍惜。'];
      var pool = GL.filter(function (t) { return recentGift.indexOf(t) < 0; });
      var reply = own.length && Math.random() < .3 ? pick(own) : pick(pool.length ? pool : GL);
      recentGift.push(reply); if (recentGift.length > 4) recentGift.shift();
      setTimeout(function () { if (A.groupOn()) A.speakAs(to, 4000); A.partnerSays(reply, A.groupOn() ? to : null); }, 1500 + Math.random() * 1500);
      toast('送出去了 🎁', 'success'); return;
    }
    if ((b = e.target.closest('[data-ga]'))) {
      var a = b.dataset.ga;
      if (a === 'plantAll') { sel = sel === '*all' ? '' : '*all'; render(); return; }
      if (a === 'deco') { sel = sel === '*deco' ? '' : '*deco'; render(); return; }
      if (a === 'waterAll') { var n = 0; (area === 'o' ? g.orchard : g.plots).forEach(function (p) { if (p.crop && !ready(p) && (p.wetUntil || 0) < now + HR) { grow(p, now); p.wetUntil = now + WET; n++; } }); if (n) { tick(g, 'water', n); log(g, '💧 幫 ' + n + ' 格澆了水'); save(); toast('澆好了 💧', 'success'); } }
      else if (a === 'harvestAll') { var got = []; (area === 'o' ? g.orchard : g.plots).forEach(function (p) { if (ready(p)) { var r2 = harvest(g, p); got.push(CROPS[r2[0]].n + '×' + r2[1]); } }); if (got.length) { save(); toast('收成 ' + got.join('、') + ' 🧺', 'success'); } }
      else if (a === 'water') { var p1 = PK(g, sel); if (p1 && p1.crop) { grow(p1, now); p1.wetUntil = now + WET; tick(g, 'water'); log(g, '💧 幫' + CROPS[p1.crop].n + '澆了水'); save(); } }
      else if (a === 'harvest') { var p2 = PK(g, sel); if (p2 && ready(p2)) { var r3 = harvest(g, p2); save(); toast('收成 ' + CROPS[r3[0]].n + ' × ' + r3[1] + ' 🧺', 'success'); sel = ''; } }
      else if (a === 'dig') { var p3 = PK(g, sel); if (p3 && p3.crop) { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '確定剷掉？'; return; } log(g, '剷掉了' + CROPS[p3.crop].n); p3.crop = null; p3.bug = false; p3.by = ''; save(); sel = ''; } }
      else if (a === 'sellAll') { var sum = 0; ORDER.forEach(function (k2) { if (g.inv[k2] > 0) { sum += g.inv[k2] * CROPS[k2].price; tick(g, 'sell', g.inv[k2]); g.inv[k2] = 0; } }); if (sum) { g.coins += sum; log(g, '💰 賣掉倉庫 +' + sum); save(); toast('賣了 🪙 ' + sum, 'success'); } }
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
      // lavender row at the bottom（有水彩圖就用圖）
      var lv = CI('lavender');
      if (lv) {
        if (!drawBg.im || drawBg.src !== lv.src) { drawBg.im = new Image(); drawBg.im.src = lv.src; drawBg.src = lv.src; }
        var im = drawBg.im;
        if (im.complete && im.naturalWidth) {
          var m = Math.ceil(W / 24) + 2;
          for (var r = 1; r >= 0; r--) for (var j = 0; j < m; j++) {
            var seed = (j * 53 + r * 29) % 17, hh = (r ? 74 : 58) + seed * 1.3, ww = hh * im.naturalWidth / im.naturalHeight, bx = j * 24 + (r ? 12 : 0) - 10 + (seed % 6), sw = Math.sin(t * 1.3 + j * .8 + r) * .045;
            ctx.save(); ctx.globalAlpha = r ? .8 : 1; ctx.translate(bx, H + 6); ctx.rotate(sw + (seed % 3 - 1) * .06); ctx.drawImage(im, -ww / 2, -hh, ww, hh); ctx.restore();
          }
          return;
        }
      }
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
      if (gg) tick(gg, 'moyu'); if (earn && gg) { gg.coins += earn; st.earned += earn; log(gg, '🐟 摸魚賺到 +' + earn); }
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
    var now = Date.now(); allPlots(g).forEach(function (p) { grow(p, now); }); tickAll(g, now);
    var eggs = allAni(g).reduce(function (s2, x) { return s2 + (x[1].eggs || 0); }, 0), hun = allAni(g).filter(function (x) { return hungry(x[1], now); }).length;
    var r = allPlots(g).filter(ready).length, dry = allPlots(g).filter(function (p) { return p.crop && !ready(p) && (p.wetUntil || 0) < now; }).length, bug = allPlots(g).some(function (p) { return p.bug; }), empty = g.plots.filter(function (p) { return p.open && !p.crop; }).length;
    var parts = []; if (r) parts.push(r + ' 格可以收成'); if (dry) parts.push(dry + ' 格要澆水'); if (bug) parts.push('有蟲！'); if (eggs) parts.push('牧場有 ' + eggs + ' 樣可以收'); if (hun) parts.push(hun + ' 隻動物餓了'); if (!parts.length) parts.push(empty === g.plots.filter(function (p) { return p.open; }).length ? '還沒種東西' : '都長得很好');
    return '<div class="mini">' + g.plots.slice(0, 9).map(function (p) { return '<i class="' + (!p.open ? 'lk' : !p.crop ? '' : ready(p) ? 'rd' : 'gr') + '"></i>'; }).join('') + '</div><div><b>花園</b><span>' + parts.join(' · ') + '</span><span class="cx-muted">🪙 ' + g.coins + '</span></div>';
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
      tasksHtml() +
      (editing ? '<div class="cx-h-tip">拖到另一個圖示上＝放進同一個資料夾；拖到旁邊＝換位置。<a href="#" data-hreset>恢復原本排列</a></div>' : '') +
      appsHtml() +
      '<label class="cx-h-first"><input type="checkbox" id="cx-h-first"' + (lsGet('cxHomeFirst') === '1' ? ' checked' : '') + '> 打開網站時先顯示小窩</label>';
  }
  function tasksHtml() {
    var g = G(); if (!g) return ''; var T = taskDay(g), all = T.list.every(function (t) { return t.got; });
    return '<div class="cx-h-task"><div class="tt"><b>今日小任務</b><span>只有在小窩才能領獎勵喔</span></div>' + T.list.map(function (t, i) {
      var ok = t.p >= t.n;
      return '<div class="row' + (t.got ? ' got' : '') + '"><div class="tx"><span>' + taskText(t) + '</span><i style="--w:' + Math.round(t.p / t.n * 100) + '%"></i><small>' + t.p + ' / ' + t.n + '</small></div>' +
        (t.got ? '<em>已領 ✓</em>' : '<button type="button" class="cx-btn' + (ok ? ' pri' : '') + '" data-task="' + i + '"' + (ok ? '' : ' disabled') + '>🪙 ' + t.r + '</button>') + '</div>';
    }).join('') + '<div class="row bonus' + (T.bonus ? ' got' : '') + '"><div class="tx"><span>三個都完成的額外獎勵 🎁</span></div>' + (T.bonus ? '<em>已領 ✓</em>' : '<button type="button" class="cx-btn' + (all ? ' pri' : '') + '" data-task="bonus"' + (all ? '' : ' disabled') + '>🪙 50</button>') + '</div></div>';
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
      var tb = e.target.closest('[data-task]');
      if (tb) {
        var g = G(); if (!g) return; var T = taskDay(g), w = tb.dataset.task, amt = 0;
        if (w === 'bonus') { if (!T.bonus && T.list.every(function (t) { return t.got; })) { T.bonus = true; amt = 50; setTimeout(function () { surprise('cb_me', '', '今天的小任務全部完成！', '額外獎勵 🪙 50，明天也一起加油～'); }, 200); } }
        else { var t = T.list[+w]; if (t && !t.got && t.p >= t.n) { t.got = true; amt = t.r; } }
        if (amt) { g.coins += amt; log(g, '📋 完成小任務 +' + amt); save(); toast('領到 🪙 ' + amt, 'success'); hRender(); }
        return;
      }
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
    '.cx-h-task{border:1px solid var(--border-color);background:var(--primary-bg);border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}.cx-h-task .tt{display:flex;align-items:baseline;gap:8px}.cx-h-task .tt b{font-size:15px}.cx-h-task .tt span{font-size:11px;color:var(--text-secondary)}' +
    '.cx-h-task .row{display:flex;align-items:center;gap:10px}.cx-h-task .tx{flex:1;min-width:0;display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:13px}.cx-h-task .tx i{grid-column:1/-1;height:6px;border-radius:9px;background:var(--secondary-bg);position:relative;overflow:hidden}.cx-h-task .tx i::after{content:"";position:absolute;inset:0;width:var(--w);background:var(--accent-color);border-radius:9px}.cx-h-task .tx small{grid-row:1;grid-column:2;color:var(--text-secondary)}' +
    '.cx-h-task .cx-btn{padding:6px 10px;font-size:12px;white-space:nowrap}.cx-h-task em{font-style:normal;font-size:12px;color:#4f8a35;white-space:nowrap}.cx-h-task .row.got .tx span{text-decoration:line-through;color:var(--text-secondary)}.cx-h-task .bonus{border-top:1px dashed var(--border-color);padding-top:8px}' +
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
    '.cx-k-pan{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:6px}.cx-k-pan .it{border:1px solid var(--border-color);border-radius:12px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px;background:var(--primary-bg)}.cx-k-pan .it span{font-size:16px;font-weight:700}.cx-k-pan .cx-btn{padding:4px 6px;font-size:11px;white-space:nowrap}' +
    '.cx-k-rec{display:flex;flex-direction:column;gap:6px}.cx-k-r{display:flex;align-items:center;gap:8px;border:1px solid var(--border-color);border-radius:14px;padding:6px 8px;background:var(--primary-bg)}.cx-k-r.ok{border-color:var(--accent-color)}.cx-k-r svg{width:52px;height:48px;flex:0 0 52px;overflow:visible}.cx-k-r .tx{flex:1;min-width:0}' +
    '.cx-k-r .need{display:flex;flex-wrap:wrap;gap:3px 6px;font-size:11px;color:var(--text-secondary);margin-top:2px}.cx-k-r .need .en{color:#3f9e6a}.cx-k-r .cx-btn{padding:8px 14px}' +
    '.cx-g-bqmk [data-slot]{cursor:pointer}.cx-g-bqtip{font-size:12px;text-align:center}.cx-g-bqtip a{color:var(--accent-color)}' +
    '.cx-g-area{display:flex;gap:6px}.cx-g-area button{flex:1;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-secondary);font:inherit;font-size:13px;padding:7px 4px;border-radius:12px;cursor:pointer;position:relative;white-space:nowrap}.cx-g-area button.on{color:#fff;background:var(--accent-color);border-color:var(--accent-color);font-weight:600}.cx-g-area i{font-style:normal;position:absolute;top:-6px;right:-4px;background:#e0a526;color:#fff;font-size:10px;border-radius:99px;padding:0 6px;line-height:16px}' +
    '#cx-garden-modal .cx-body>*{flex-shrink:0}.cx-g-stage{border-radius:18px;overflow:hidden;border:1px solid #c9dfbf;background:#e2eed8}.cx-g-stage.pan{overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scrollbar-width:none;cursor:grab}.cx-g-stage.pan::-webkit-scrollbar{display:none}.cx-g-stage.pan .cx-scene{max-width:none}.cx-g-pan{text-align:center;font-size:11.5px;margin:-4px 0 0}.cx-g-decobtn{align-self:center;padding:5px 14px;font-size:12.5px}.cx-deco{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}.cx-deco .it{border:1px solid var(--border-color);border-radius:14px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;background:var(--primary-bg)}.cx-deco .it.on{border-color:var(--accent-color)}.cx-deco svg{width:56px;height:62px;overflow:visible}.cx-deco b{font-size:12.5px}.cx-deco .cx-btn{width:100%;justify-content:center;padding:4px 6px;font-size:11.5px}.cx-fence{display:flex;flex-wrap:wrap;gap:6px}.cx-fence button{border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-primary);border-radius:99px;padding:4px 10px 4px 6px;font:inherit;font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer}.cx-fence button.on{border-color:var(--accent-color);box-shadow:0 0 0 1px var(--accent-color)}.cx-fence i{width:16px;height:16px;border-radius:50%;border:1px solid #7a6252}.cx-fence small{color:var(--text-secondary)}.cx-scene .cx-mill{animation:cxmill 6s linear infinite}@keyframes cxmill{to{transform:rotate(360deg)}}.cx-wx{font-size:12px;padding:6px 12px;border-radius:12px;background:#fff7dc;color:#8a6a2a;border:1px solid #f0dfa8}.cx-wx.rain{background:#e6eef8;color:#4f6a8a;border-color:#c6d6ea}.cx-wx.cloud{background:var(--secondary-bg);color:var(--text-secondary);border-color:var(--border-color)}.cx-scene .cx-rain{animation:cxrain .6s linear infinite}@keyframes cxrain{from{transform:translate(0,-10px)}to{transform:translate(-3px,10px)}}.cx-scene{display:block;width:100%;height:auto;-webkit-tap-highlight-color:transparent;user-select:none}' +
    '.cx-sp{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(70,50,70,.28);animation:cxspf .2s ease}.cx-sp .card{background:#fffaf4;color:#5a4a44;border-radius:22px;padding:16px 18px 12px;width:min(300px,86vw);text-align:center;box-shadow:0 12px 40px rgba(60,40,60,.25);display:flex;flex-direction:column;align-items:center;gap:6px;animation:cxspp .4s cubic-bezier(.2,1.5,.4,1)}.cx-sp .row{display:flex;align-items:flex-end;justify-content:center;gap:2px}.cx-sp .cb{height:128px;width:auto;animation:cxspb 1.6s ease-in-out infinite}.cx-sp .art{width:92px;height:120px;display:flex;align-items:flex-end;justify-content:center}.cx-sp .art img,.cx-sp .art svg{max-width:100%;max-height:100%}.cx-sp b{font-size:16px}.cx-sp p{margin:0;font-size:13.5px;line-height:1.55;color:#7a6a62}.cx-sp small{font-size:11px;color:#b3a59c}@keyframes cxspf{from{opacity:0}}@keyframes cxspp{from{transform:scale(.6);opacity:0}}@keyframes cxspb{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '.cx-scene .pl,.cx-scene [data-ani],.cx-scene [data-prod]{cursor:pointer}.cx-g-pens{margin-top:-4px}.cx-g-pens button{font-size:11.5px;padding:6px 1px;white-space:nowrap}.cx-scene .bz{animation:cxbz 2.4s ease-in-out infinite}@keyframes cxbz{0%,100%{transform:translate(0,0)}25%{transform:translate(5px,-3px)}50%{transform:translate(1px,-6px)}75%{transform:translate(-5px,-2px)}}.cx-scene .hen.slow .hw{animation-duration:7s}.cx-scene .hen.swim .hw{animation-duration:4.5s}.cx-scene .hen.slow .hw>g:last-child{animation:none}.cx-scene .hen.hive .hw{animation:none}.cx-scene .hen.hive .hw>g:last-child{animation:cxbz 2.4s ease-in-out infinite}.cx-scene .pl:active{opacity:.85}' +
    '.cx-scene .hen .hw{animation:cxhen var(--d,3s) ease-in-out var(--dl,0s) infinite alternate}.cx-scene .hen.hun .hw{animation-duration:6s}' +
    '@keyframes cxhen{0%{transform:translate(-7px,-2px)}100%{transform:translate(7px,3px)}}' +
    '.cx-scene .hen .hw>g:last-child{transform-box:fill-box;transform-origin:50% 100%;animation:cxpeck 2.4s ease-in-out var(--dl,0s) infinite}' +
    '@keyframes cxpeck{0%,70%,100%{rotate:0deg}80%{rotate:16deg}90%{rotate:0deg}}' +
    '.cx-coop-info{flex-direction:row;align-items:center;gap:10px}.cx-coop-info>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.cx-coop-info .cx-btn{white-space:nowrap;padding:8px 12px;font-size:13px}' +
    '@media (prefers-reduced-motion:reduce){.cx-scene .hen .hw,.cx-scene .hen .hw>g:last-child{animation:none}}' +
    '.cx-g-sub{display:flex;gap:6px}.cx-g-sub button{flex:1;border:1px solid var(--border-color);background:var(--primary-bg);color:var(--text-secondary);font:inherit;font-size:13px;padding:7px;border-radius:10px;cursor:pointer}.cx-g-sub button.on{color:var(--accent-color);border-color:var(--accent-color);font-weight:600}' +
    '.cx-g-bqmk{display:grid;grid-template-columns:minmax(120px,42%) 1fr;gap:12px;align-items:start}.cx-g-bqmk .pv,.cx-g-bq1 .pv{background:' + PAPER + ',#f7f1e6;border:1px solid #e3d6bd;border-radius:16px;aspect-ratio:3/4;display:grid;place-items:center;overflow:hidden}.cx-g-bqmk .pv svg,.cx-g-bq1 .pv svg{width:100%;height:100%}.cx-g-bqmk .empty{text-align:center;font-size:12px}' +
    '.cx-g-bqmk .opts{display:flex;flex-direction:column;gap:6px;min-width:0}.cx-g-bqmk .sw{display:flex;flex-wrap:wrap;gap:5px}.cx-g-bqmk .sw button{border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);font:inherit;font-size:12px;border-radius:99px;padding:4px 9px 4px 5px;display:flex;align-items:center;gap:4px;cursor:pointer}.cx-g-bqmk .sw button.on{border-color:var(--accent-color);box-shadow:0 0 0 1px var(--accent-color)}.cx-g-bqmk .sw i{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.12)}' +
    '.cx-g-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px}.cx-g-pick button{position:relative;border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:12px;padding:4px 2px 6px;font:inherit;font-size:12px;display:flex;flex-direction:column;align-items:center;cursor:pointer}.cx-g-pick svg{width:46px;height:44px;overflow:visible}.cx-g-pick small{color:var(--text-secondary);font-size:11px}.cx-g-pick button:disabled{opacity:.5}' +
    '.cx-g-pt a{color:var(--accent-color)}.cx-g-pick em{position:absolute;top:2px;right:2px;font-style:normal;font-size:11px;background:var(--accent-color);color:#fff;border-radius:99px;padding:0 6px;cursor:pointer}' +
    '.cx-g-bqr{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}.cx-g-bqrc{border:1px solid var(--border-color);background:var(--secondary-bg);border-radius:14px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;opacity:.85}.cx-g-bqrc.ok{opacity:1;border-color:var(--accent-color)}.cx-g-bqrc svg{width:100%;aspect-ratio:3/4}.cx-g-bqrc b{font-size:14px}.cx-g-bqrc .nd{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;font-size:11px}.cx-g-bqrc .nd span{padding:1px 6px;border-radius:8px;background:var(--primary-bg)}.cx-g-bqrc .nd .y{color:#4f8a35}.cx-g-bqrc .nd .n{color:var(--text-secondary)}.cx-g-bqrc .cx-btn{width:100%;justify-content:center}.cx-g-bq1 .pv svg,.cx-g-bqmk .pv svg{max-height:52vh}' +
    '.cx-g-bqc.gone svg{opacity:.45}.cx-bq-st{display:flex;gap:18px;font-size:13px;color:var(--text-secondary)}.cx-bq-st b{color:var(--text-primary);font-size:15px}.cx-bq-log{width:100%;border-top:1px dashed var(--border-color);padding-top:8px;font-size:13px;text-align:center}.cx-bq-log .cx-g-pt{justify-content:center}.cx-g-bqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}.cx-g-bqc{border:1px solid var(--border-color);background:var(--secondary-bg);color:var(--text-primary);border-radius:14px;padding:6px;font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;min-width:0}.cx-g-bqc svg{width:100%;aspect-ratio:3/4}.cx-g-bqc b{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-g-bqc .cx-muted{font-size:11px}' +
    '.cx-g-bq1{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.cx-g-bq1 .pv{width:min(240px,70%)}.cx-g-bq1 .rp{color:var(--accent-color);margin:4px 0;font-size:14px}.cx-g-bq1 .cx-who,.cx-g-bq1 .cx-g-acts{width:100%}' +
    '.cx-g-log div{font-size:13px;padding:6px 0;border-bottom:1px dashed var(--border-color)}.cx-g-tip{text-align:center}' +
    '@media (prefers-reduced-motion:reduce){.cx-h-sheet{transition:none}}';
  document.head.appendChild(css);

  window.__cxHome = { open: homeOpen, close: homeClose, garden: function () { A.load().then(function () { gOpen(false); }); }, _sim: simulate, _G: G, _moyu: function () { launch('moyu'); }, _sp: function (w, t, l) { return surprise(w, '', t, l); } };
  if (lsGet('cxHomeFirst') === '1') setTimeout(homeOpen, 1200);
  setInterval(function () { if (document.visibilityState === 'visible' && A.X()) { if (simulate(false)) { if (home && !home.hidden) homeRender(); } } }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(function () { if (A.X()) simulate(true); }, 4000); });
})();
