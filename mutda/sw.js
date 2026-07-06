// 묻다 서비스워커 — 웹푸시 수신 + 알림 클릭 (안부확인 알림용)
const CACHE_VERSION = 'mutda-v11-2026-07-06-belongings-entrust';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('mutda-') && k !== CACHE_VERSION)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 네트워크 우선 (오프라인 대비 최소 캐시)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res.ok && /text\/html|css|javascript/.test(res.headers.get('content-type') || '')) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(e.request, res.clone());
      }
      return res;
    } catch {
      const cached = await caches.match(e.request);
      return cached || Response.error();
    }
  })());
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { /* 텍스트 페이로드 무시 */ }
  const title = data.title || '묻다 알림';
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    tag: data.tag || 'mutda',
    icon: '../icons/icon-192.png',
    badge: '../icons/icon-192.png',
    data: { url: data.url || './home.html' },
    requireInteraction: data.tag?.startsWith('mutda-checkin') || false,
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './home.html', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) { w.focus(); w.navigate(url); return; }
    }
    await self.clients.openWindow(url);
  })());
});
