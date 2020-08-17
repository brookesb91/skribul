const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}:sw-cache`;

const HTML_ASSETS = ['/', '/offline'];

const JS_ASSETS = ['/scripts/skribul.js'];

const CSS_ASSETS = [
  '/styles/skribul.css',
  '/styles/skribul-editor.css',
  '/styles/skribul-browse.css',
];

const IMAGE_ASSETS = [];

function onInstall(event) {
  log('Installing');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          ...HTML_ASSETS,
          ...JS_ASSETS,
          ...CSS_ASSETS,
          ...IMAGE_ASSETS,
        ])
      )
      .then(() => log('Install complete'))
  );
}

function onActivate() {
  log('Activating');
  caches
    .keys()
    .then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.indexOf(CACHE_NAME) !== 0)
          .map((name) => caches.delete(name))
      )
    );
}

function onFetch(event) {
  log('Fetching');

  if (event.request.url.match('(browse)$')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(handleNetworkResponse)
        .catch(() => caches.match('/offline'));
    })
  );

  function handleNetworkResponse(response) {
    const clone = response.clone();
    if (isSecure(event.request.url)) {
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  }
}

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);

function isSecure(url) {
  return /^https?:$/i.test(new URL(url).protocol);
}

/* eslint-disable no-console */
function log(message) {
  console.log(`[service-worker] ${message}`);
}
