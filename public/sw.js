const CACHE='omni-static-v2';
const OFFLINE='/offline.html';
const SHELL=[OFFLINE,'/favicon.svg','/manifest.webmanifest','/pwa/apple-touch-icon.png','/pwa/icon-192.png','/pwa/icon-512.png','/pwa/icon-maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('omni-static-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Never cache API calls, account information, third-party responses or uploads.
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(OFFLINE)));return;}
 if(!url.pathname.startsWith('/assets/')&&!SHELL.includes(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;
  const response=await fetch(request);if(response.ok&&response.type==='basic'){await cache.put(request,response.clone());const keys=await cache.keys();if(keys.length>100){const old=keys.find(key=>new URL(key.url).pathname.startsWith('/assets/'));if(old)await cache.delete(old);}}
  return response;
 })());
});
