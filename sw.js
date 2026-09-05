/* =========================================================
   MAROMBA — service worker
   Cache simples "cache-first, com atualização em segundo
   plano" dos arquivos estáticos, pra funcionar offline.

   Suba APP_VERSION sempre que mudar style.css, app.js,
   bodymap.js ou data.js — e troque o mesmo número no "?v="
   desses arquivos no index.html. Isso derruba tanto o cache
   do service worker (nome do cache muda, o velho é apagado no
   'activate') quanto qualquer cache de CDN/navegador na frente
   dele (a URL com query string nova é tratada como um recurso
   diferente, então o Cloudflare busca a versão nova na
   origem em vez de servir a antiga).
   ========================================================= */

/* Suba este número junto com o "?v=" usado no index.html sempre que
   publicar uma mudança em style.css, app.js, bodymap.js ou data.js.
   Ele entra tanto na query string de cache-busting (contra o cache do
   Cloudflare) quanto no nome do cache do service worker (pra forçar o
   'activate' a descartar o cache antigo e o 'install' a baixar tudo de
   novo). Se só um dos dois for atualizado, o navegador pode acabar
   comparando um HTML novo com JS/CSS velhos (ou vice-versa). */
const APP_VERSION = '3';
const CACHE_NAME = `maromba-cache-v${APP_VERSION}`;
const ARQUIVOS_ESTATICOS = [
  './',
  './index.html',
  `./style.css?v=${APP_VERSION}`,
  `./app.js?v=${APP_VERSION}`,
  `./bodymap.js?v=${APP_VERSION}`,
  `./data.js?v=${APP_VERSION}`,
  './manifest.json',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first para os arquivos do app; qualquer coisa que não
// esteja na lista (ex.: uma requisição externa) vai direto pra rede.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached); // offline: cai pro que tiver em cache

      // responde rápido com o cache se existir, e atualiza em segundo plano
      return cached || networkFetch;
    })
  );
});
