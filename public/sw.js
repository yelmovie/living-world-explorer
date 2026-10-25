// Offline cache so a classroom tablet can reload and keep playing after Wi-Fi drops.
// Only touches Cache Storage — student records in IndexedDB/localStorage are never read or cleared here.
const VERSION='dev',FILES=[];// filled at build time by offlinePrecache() in vite.config.ts: [path, content hash, lazy?]
const CACHE='life-code-lab';// one cache; entries are keyed by content hash so a new deploy only downloads changed files
const files=new Map(FILES.map(([path,hash,lazy])=>{const url=new URL(path,location).href;return [url,{key:`${url}?v=${hash}`,lazy}];}));
const shell=files.get(new URL('index.html',location).href)?.key;
const within=(promise,ms)=>new Promise((ok,fail)=>{setTimeout(fail,ms);promise.then(ok,fail);});

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.all([...files].filter(([,f])=>!f.lazy).map(async([url,f])=>{
 if(await cache.match(f.key))return;const res=await fetch(url,{cache:'no-cache'});if(!res.ok)throw Error(`precache ${res.status} ${url}`);await cache.put(f.key,res);
})))));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name!==CACHE&&name.startsWith('life-code'))await caches.delete(name);
 const live=new Set([...files.values()].map(f=>f.key)),cache=await caches.open(CACHE);
 for(const req of await cache.keys())if(!live.has(req.url))await cache.delete(req);
 await self.clients.claim();
})()));

// Media elements ask for byte ranges; answer them from the full cached file (BGM is stored on its first play).
async function ranged(req,f){
 const cache=await caches.open(CACHE);let res=f&&await cache.match(f.key);
 if(!res){if(!f?.lazy)return fetch(req);res=await fetch(req.url);if(!res.ok)return res;await cache.put(f.key,res.clone());}
 const blob=await res.blob(),size=blob.size,m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range'));if(!m)return new Response(blob,{headers:res.headers});
 const start=m[1]?+m[1]:Math.max(0,size-+m[2]),end=m[1]&&m[2]?Math.min(+m[2],size-1):size-1;
 if(start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 return new Response(blob.slice(start,end+1),{status:206,headers:{'Content-Type':res.headers.get('Content-Type')||'','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}

self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin)return;
 // Network first so a new deploy shows when online; a stalled classroom network falls back after 4s.
 if(req.mode==='navigate'){event.respondWith(within(fetch(req),4000).catch(()=>caches.match(shell).then(r=>r||Response.error())));return;}
 const f=files.get(url.origin+url.pathname);
 if(req.headers.has('range')){event.respondWith(ranged(req,f));return;}
 if(f){event.respondWith(caches.match(f.key).then(hit=>hit||fetch(req)));return;}
 // Unknown files (e.g. a newer deploy's chunk installed by a waiting worker) still get an offline fallback.
 event.respondWith(fetch(req).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||Response.error())));
});
