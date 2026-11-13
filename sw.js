/*
 * 傳訊 · 離線支援
 * 把網站本身和它用到的程式庫存在手機/電腦裡，沒有網路也能開啟。
 * 聊天資料本來就存在本機（IndexedDB），同步資料（Firebase）不經過這裡。
 * 更新網站後，把下面的 VERSION 改一下（例如 v8），所有裝置會自動換成新版本。
 */
const VERSION = 'v78-tw';
const CACHE = 'chuanxun-' + VERSION;
const BASE = new URL('./', self.location).href;

const LOCAL = [
  '', 'index.html', 'manifest.webmanifest', 'styles.css', 'sync.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'config.js', 'utils.js', 'backup-engine.js', 'state.js', 'core.js',
  'mood.js', 'envelope.js', 'reply-library.js',
  'theme-editor.js', 'group-chat.js', 'call.js',
  'games.js', 'features.js', 'data.js', 'onboarding.js', 'listeners.js', 'app.js', 'qa.js', 'extras.js', 'home.js', 'bqimg.js', 'farmimg.js', 'dishimg.js', 'cropimg.js'
].map(p => BASE + p);

const REMOTE = [
  'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

// Hosts whose files never change for a given URL: keep the first copy.
const PINNED_HOSTS = ['cdnjs.cloudflare.com', 'www.gstatic.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all([...LOCAL, ...REMOTE].map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('chuanxun-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.href.startsWith(BASE);

  // Opening the app: the cached page, refreshed in the background.
  // 其他獨立頁面（例如 recover.html）直接上網拿
  if (req.mode === 'navigate' && own && /\.html$/.test(url.pathname) && !/\/index\.html$/.test(url.pathname)) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  if (req.mode === 'navigate' && own) {
    event.respondWith(staleWhileRevalidate(event, new Request(BASE + 'index.html'), req));
    return;
  }
  if (own) { event.respondWith(staleWhileRevalidate(event, req)); return; }
  if (PINNED_HOSTS.includes(url.hostname)) { event.respondWith(cacheFirst(req)); return; }
  if (url.hostname === 'fonts.googleapis.com') { event.respondWith(staleWhileRevalidate(event, req)); return; }
  // Everything else (Firebase sync traffic, online music and pictures) goes straight to the network.
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, key, realReq) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key, { ignoreSearch: true, ignoreVary: true });
  const fresh = fetch(realReq || key).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(fresh); return hit; }
  const res = await fresh;
  return res || new Response('離線中，且這臺裝置還沒有存下網站。請先連網開啟一次。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// 點通知：回到已開著的傳訊，沒有的話就打開它
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.startsWith(BASE) && 'focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(BASE);
  })());
});
