const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}:sw-cache`;
const REQUEST_LIMIT = 10;

const HTML_ASSETS = ['/', '/offline'];

const JS_ASSETS = ['/scripts/skribul.js'];

const CSS_ASSETS = ['/styles/skribul.css', '/styles/skribul-editor.css', '/styles/skribul-browse.css'];

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

function onActivate(event) {
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(handleNetworkResponse)
        .catch((_) => caches.match('/offline'));
    })
  );

  function handleNetworkResponse(response) {
    const clone = response.clone();
    if (/^https?:$/i.test(new URL(event.request.url).protocol)) {
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  }
}

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);

function log(message) {
  console.log(`[service-worker] ${message}`);
}