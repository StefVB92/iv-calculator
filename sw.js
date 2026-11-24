const CACHE='iv-calculator-v1.1.1';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('message',e=>{if(e.data?.type==='GET_VERSION'){e.ports[0]?.postMessage({version:'1.1.1'});return;}if(e.data?.type==='SKIP_WAITING')e.waitUntil(self.skipWaiting())});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('iv-calculator-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{if(e.request.mode==='navigate')return (await c.match('./index.html'))||fetch(e.request);return (await c.match(e.request))||fetch(e.request)}))});
