// Release protocol: VERSION and BUILD must match index.html. Forced builds never change the selected version.
const VERSION='1.5.0';
const BUILD=2;
const FORCED=true;
const PREFIX='iv-calculator-release-';
const CACHE=PREFIX+VERSION+'-build-'+BUILD;
const META='iv-calculator-release-control';
const ROOT=new URL('./',self.registration.scope);
const PIN=new URL('__iv_selected_release__',ROOT).href;
const INDEX=new URL('index.html',ROOT).href;
const FILES=['manifest.webmanifest','icon-192.png','icon-512.png'];
const buildKey=v=>new URL('__iv_build_'+v,ROOT).href;
async function selected(){const c=await caches.open(META);const r=await c.match(PIN);return r?await r.text():null}
async function selectedBuild(v){const c=await caches.open(META);const r=await c.match(buildKey(v));return r?Number(await r.text()):0}
async function select(v,b){const c=await caches.open(META);await c.put(buildKey(v),new Response(String(b)));await c.put(PIN,new Response(v))}
async function stage(){const html=await fetch(new Request(INDEX,{cache:'reload'}));if(!html.ok)throw Error('Missing HTML');const t=await html.clone().text();if(!t.includes("const VERSION='"+VERSION+"'")||!t.includes("const BUILD="+BUILD+";")||!t.includes("Build revision: "+VERSION+"-"+BUILD))throw Error('Release files not synchronized');const c=await caches.open(CACHE);await c.addAll(FILES.map(f=>new Request(new URL(f,ROOT),{cache:'reload'})));await c.put(INDEX,html.clone());if(!FORCED){const legacy=await caches.open(PREFIX+VERSION);await legacy.addAll(FILES.map(f=>new Request(new URL(f,ROOT),{cache:'reload'})));await legacy.put(INDEX,html)}}
async function staged(){return !!(await (await caches.open(CACHE)).match(INDEX))}
self.addEventListener('install',e=>e.waitUntil(stage()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{if(!await selected())await select(VERSION,BUILD);await self.clients.claim()})()));
self.addEventListener('message',e=>{
 const reply=data=>e.ports[0]?.postMessage(data);
 if(e.data?.type==='GET_VERSION'){reply({version:VERSION,build:BUILD,forced:FORCED});return}
 if(e.data?.type==='SKIP_WAITING'){e.waitUntil((async()=>{if(!await selected()&&await staged()){await select(VERSION,BUILD);await self.skipWaiting()}})());return}
 if(e.data?.type==='APPROVE_RELEASE'&&e.data.version===VERSION){e.waitUntil((async()=>{try{if(!await staged())throw Error('Missing release');await select(VERSION,BUILD);await self.skipWaiting();reply({ok:true,version:VERSION,build:BUILD})}catch(err){reply({ok:false})}})());return}
 if(e.data?.type==='APPLY_HOTFIX'){e.waitUntil((async()=>{try{
  if(!FORCED||e.data.version!==VERSION||e.data.build!==BUILD||await selected()!==VERSION||!await staged())throw Error('Hotfix not eligible');
  const current=await selectedBuild(VERSION);if(current>BUILD)throw Error('Stale hotfix');
  await select(VERSION,BUILD);await self.skipWaiting();reply({ok:true,version:VERSION,build:BUILD})
 }catch(err){reply({ok:false})}})())}
});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
 e.respondWith((async()=>{const v=await selected()||VERSION;const b=await selectedBuild(v);const c=await caches.open(PREFIX+v+(b?'-build-'+b:''));if(e.request.mode==='navigate'||u.pathname===ROOT.pathname||u.pathname===INDEX.pathname){return await c.match(INDEX)||new Response('The selected offline release is missing. Clear site data and reopen the app online to recover.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}return await c.match(e.request)||fetch(e.request)})());
});
