/* 納涼会 音響卓 — Service Worker（ネットワーク優先版）
   方針: オンラインなら常に最新を取りに行き、成功したらキャッシュも更新。
         オフライン(会場Wi-Fi不通)のときだけキャッシュから返す。
   これで「更新したのに古い音が鳴る」を防ぐ。バージョンを上げると旧キャッシュを破棄。 */
const CACHE = 'noryo-v6';

const SHELL_ASSETS = [
  './',
  './index.html',
  './sounds.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ネットワーク優先。取れたらキャッシュ更新、ダメならキャッシュにフォールバック。
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
