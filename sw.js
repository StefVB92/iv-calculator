// Release protocol: keep VERSION in sync with index.html. All future releases must retain this protocol.
const VERSION='1.4.2';
const CACHE='iv-calculator-release-'+VERSION;
const META='iv-calculator-release-control';
const ROOT=new URL('./',self.registration.scope);
const PIN=new URL('__iv_selected_release__',ROOT).href;
const INDEX=new URL('index.html',ROOT).href;
const FILES=['manifest.webmanifest','icon-192.png','icon-512.png'];
async function selected(){const c=await caches.open(META);const r=await c.match(PIN);return r?await r.text():null}
async function select(version){const c=await caches.open(META);await c.put(PIN,new Response(version));}
async function stage(){const html=await fetch(new Request(INDEX,{cache:'reload'}));if(!html.ok||!(await html.clone().text()).includes("const VERSION='"+VERSION+"'"))throw Error('Release files not synchronized');const c=await caches.open(CACHE);await c.put(INDEX,html);await c.addAll(FILES.map(f=>new Request(new URL(f,ROOT),{cache:'reload'})));}
self.addEventListener('install',e=>e.waitUntil(stage()));
// Only the one-time transition from a legacy worker (or a fresh installation) initializes the pin.
// A later browser-driven activation must never overwrite an existing selected release.
self.addEventListener('activate',e=>e.waitUntil((async()=>{if(!await selected())await select(VERSION);await self.clients.claim()})()));
self.addEventListener('message',e=>{
 const reply=data=>e.ports[0]?.postMessage(data);
 if(e.data?.type==='GET_VERSION'){reply({version:VERSION});return}
 if(e.data?.type==='SKIP_WAITING'){ // compatibility for the legacy v1.4.0 UI and earlier releases
  e.waitUntil((async()=>{if(!await selected()){await select(VERSION);await self.skipWaiting()}})());return;
 }
 if(e.data?.type==='APPROVE_RELEASE'&&e.data.version===VERSION){
  e.waitUntil((async()=>{try{const c=await caches.open(CACHE);if(!await c.match(INDEX))throw Error('Missing release');await select(VERSION);reply({ok:true,version:VERSION});await self.skipWaiting()}catch(err){reply({ok:false})}})());
 }
});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
 e.respondWith((async()=>{const version=await selected()||VERSION;const c=await caches.open('iv-calculator-release-'+version);if(e.request.mode==='navigate'||u.pathname===ROOT.pathname||u.pathname===new URL('index.html',ROOT).pathname){return await c.match(INDEX)||new Response('The selected offline release is missing. Clear site data and reopen the app online to recover.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}return await c.match(e.request)||fetch(e.request)})());
});
