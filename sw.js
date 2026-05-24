// 잇다 PWA Service Worker
// 전략: 앱 셸 캐시 (네트워크 우선 + 캐시 폴백), 푸시 알림 수신

const CACHE_VERSION = 'itda-v3-2026-05-24-account-deletion';
const APP_SHELL = [
  './',
  './index.html',
  './seed.html',
  './nest.html',
  './forest.html',
  './root.html',
  './diary-write.html',
  './diary-detail.html',
  './plan-write.html',
  './plan-detail.html',
  './content-detail.html',
  './content-write.html',
  './post-detail.html',
  './post-write.html',
  './care-dashboard.html',
  './care-emergency.html',
  './invite.html',
  './book-export.html',
  './admin.html',
  './setup.html',
  './auth-styles.css',
  './manifest.json',
  './nav.js',
  './auth.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Supabase / 외부 API는 캐시하지 않음
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // HTML/JS/CSS만 캐시 갱신
        const ct = res.headers.get('content-type') || '';
        if (res.ok && /text\/(html|css|javascript)|application\/javascript/.test(ct)) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});

// =========================================================
// Web Push 알림 수신 (돌봄 변경, 친구 초대, 댓글 등)
// =========================================================
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: '잇다', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || '잇다';
  const options = {
    body: payload.body || '',
    icon: payload.icon || './icons/icon-192.png',
    badge: './icons/icon-192.png',
    data: { url: payload.url || './index.html', ...payload.data },
    tag: payload.tag,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});
