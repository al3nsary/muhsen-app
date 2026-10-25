/* ط¹ط§ظ…ظ„ ط§ظ„ط®ط¯ظ…ط© â€” ط§ظ„ط´ط¨ظƒط© ط£ظˆظ„ظ‹ط§ ظ„ظ„طµظپط­ط© ظ†ظپط³ظ‡ط§ ط­طھظ‰ طھطµظ„ ط¢ط®ط± ظ†ط³ط®ط© ظپظˆط±ظ‹ط§طŒ
   ظˆط§ظ„ط°ط§ظƒط±ط© ط£ظˆظ„ظ‹ط§ ظ„ظ„ط£ظٹظ‚ظˆظ†ط§طھ ظˆط§ظ„ط®ط·ظˆط·. */
/* ط§ظ„ط°ط§ظƒط±ط©ظڈ ط¨ط§ط³ظ… ط§ظ„ظ†ط³ط®ط© â€” ظˆط¥ظ„ظ‘ط§ طھط¯ط§ط®ظ„طھ ظ†ط³ط®طھط§ظ† طھط­طھ ط£طµظ„ظچ ظˆط§ط­ط¯. */
const CACHE = 'muhsen-v43';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

/* ظپطھط­ ط§ظ„طھط·ط¨ظٹظ‚ ط¹ظ†ط¯ ط§ظ„ظ†ظ‚ط± ط¹ظ„ظ‰ ط¥ط´ط¹ط§ط± ط§ظ„ظ†ط¸ط§ظ… */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

const isPage = req =>
  req.mode === 'navigate' ||
  req.destination === 'document' ||
  /\/(index\.html)?(\?.*)?$/.test(new URL(req.url).pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* ط§ظ„طµظپط­ط© ظ†ظپط³ظ‡ط§: ط§ظ„ط´ط¨ظƒط© ط£ظˆظ„ظ‹ط§ â€” ظ„ط§ ظ†ط³ط®ط© ظ‚ط¯ظٹظ…ط© ط¹ط§ظ„ظ‚ط© ط¨ط¹ط¯ ط§ظ„طھط­ط¯ظٹط« */
  if (isPage(req)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  /* ط§ظ„ط®ط·ظˆط·: ط§ظ„ط´ط¨ظƒط© ط£ظˆظ„ظ‹ط§ ط«ظ… ط§ظ„ط°ط§ظƒط±ط© */
  if (req.url.includes('fonts.googleapis.com') || req.url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* ط§ظ„ط£ظٹظ‚ظˆظ†ط§طھ ظˆط¨ظ‚ظٹط© ط§ظ„ظ…ظ„ظپط§طھ: ط§ظ„ط°ط§ظƒط±ط© ط£ظˆظ„ظ‹ط§ */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
