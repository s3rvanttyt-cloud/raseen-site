/* رصين: عامل الخدمة
   - الصفحات: من الشبكة أولاً، ومن النسخة المحفوظة إذا انقطع الاتصال
   - الملفات الثابتة (خطوط، أيقونات، CSS، JS): من النسخة المحفوظة فوراً مع تحديثها في الخلفية
   - طلبات قاعدة البيانات (Supabase) لا تُحفظ أبداً */
const VERSION = 'raseen-v2';
const CORE = [
  '/', '/manifest.webmanifest',
  '/assets/style.css', '/assets/common.js', '/assets/app.js', '/assets/vendor/supabase.js',
  '/assets/logo.svg', '/assets/favicon.svg', '/assets/icons/icon-192.png',
  '/assets/fonts/reem-kufi-arabic-700-normal.woff2', '/assets/fonts/reem-kufi-arabic-500-normal.woff2',
  '/assets/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', '/assets/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2',
  '/assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase وغيره: مباشرة من الشبكة

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
