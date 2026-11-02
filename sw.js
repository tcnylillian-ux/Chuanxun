/*
 * 传讯 · 离线支持
 * 把网站本身和它用到的程式库存在手机/电脑里，没有网络也能打开。
 * 聊天数据本来就存在本机（IndexedDB），同步数据（Firebase）不经过这里。
 * 更新网站后，把下面的 VERSION 改一下（例如 v5），所有设备会自动换成新版本。
 */
const VERSION = 'v4';
const CACHE = 'chuanxun-' + VERSION;
const BASE = new URL('./', self.location).href;

const LOCAL = [
  '', 'index.html', 'manifest.webmanifest', 'styles.css', 'sync.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'config.js', 'utils.js', 'backup-engine.js', 'state.js', 'core.js',
  'mood.js', 'envelope.js', 'reply-library.js',
  'theme-editor.js', 'group-chat.js', 'call.js',
  'games.js', 'features.js', 'data.js', 'onboarding.js', 'listeners.js', 'app.js', 'qa.js'
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
  return res || new Response('离线中，且这台设备还没有存下网站。请先连网打开一次。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
