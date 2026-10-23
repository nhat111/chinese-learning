// Service worker template. `vite.config.ts` (pwaPlugin) replaces the
// placeholders at build time and writes the result to dist/sw.js.
//
// - Install: precache every built file (app shell, JSON content, stroke data,
//   icons) into a cache named after the build version: the app works offline.
// - Navigations: network first (fresh deploys show up), cached index.html offline.
// - Other precached files: cache first.
// - /audio/*.mp3: cached on first play in AUDIO_CACHE, kept across versions
//   (file names are hashes of the text).
// - Activate: delete caches from older builds.

const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = `zv-${VERSION}`;
const AUDIO_CACHE = 'zv-audio-v1';
// Where the MP3s live ('' = this origin).
const AUDIO_BASE = '__AUDIO_BASE__';
const NAV_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('zv-') && k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await Promise.race([fetch(request), timeout(NAV_TIMEOUT_MS)]);
    if (response.ok) return response;
    throw new Error(`HTTP ${response.status}`);
  } catch {
    // SPA: every route is served by index.html.
    return (await cache.match('/index.html')) ?? Response.error();
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request, { cacheName: CACHE, ignoreSearch: true });
  return cached ?? fetch(request);
}

async function handleAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && (response.headers.get('content-type') ?? '').startsWith('audio/')) await cache.put(request, response.clone());
  return response;
}

function isAudio(url) {
  if (AUDIO_BASE !== '') return url.href.startsWith(`${AUDIO_BASE}/audio/`);
  return url.origin === self.location.origin && url.pathname.startsWith('/audio/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode !== 'navigate' && isAudio(url)) {
    event.respondWith(handleAudio(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else if (PRECACHE.includes(decodeURIComponent(url.pathname))) {
    event.respondWith(handleAsset(request));
  }
});
