/* 納涼会 音響卓 — Service Worker
   会場のWi-Fiは信用しない前提。一度読んだものは全部キャッシュから返す。
   バージョンを上げると古いキャッシュを捨てて入れ替える。 */
const SHELL = 'noryo-shell-v2';
const AUDIO = 'noryo-audio-v1';

// アプリ本体（音源以外）を先読みキャッシュ
const SHELL_ASSETS = [
  './',
  './index.html',
  './sounds.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL).then(c => c.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL && k !== AUDIO).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isAudio = url.pathname.includes('/audio/');
  const cacheName = isAudio ? AUDIO : SHELL;

  // キャッシュ優先。無ければ取得してキャッシュに保存。オフラインでも既読分は返る。
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(cacheName).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
