const CACHE_NAME="vivalab-secure-mobile-v3-20261104";
const PRECACHE=["./index.html","./app.js","./manifest.webmanifest","./vault/check.enc","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png"];
const ON_DEMAND=["./vault/barker2009.json.enc","./vault/podcast2025.json.enc","./vault/barker2009.pdf.enc","./vault/podcast2025.pdf.enc"];
const ASSETS=new Set([...PRECACHE,...ON_DEMAND].map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(n=>(n.startsWith('vivalab-')&&n!==CACHE_NAME)).map(n=>caches.delete(n)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
if(request.mode==='navigate'){event.respondWith(fetch(request).then(r=>{if(r.ok)caches.open(CACHE_NAME).then(c=>c.put(request,r.clone())).catch(()=>{});return r;}).catch(()=>caches.match(request).then(r=>r||caches.match('./index.html'))));return;}
event.respondWith(caches.match(request).then(r=>r||fetch(request).then(r=>{if(r.ok&&ASSETS.has(url.href))caches.open(CACHE_NAME).then(c=>c.put(request,r.clone())).catch(()=>{});return r;})));});
