/* Pokémon Torre 2 — install as an app (owner list 2026-11-20, item 25).
 * Publish-time helpers: the web app manifest, a small service worker and the
 * page hook. The worker only speeds up the second visit:
 *  - versioned code (src-xxxxxxxxxx/) is cache-first (a new release has a new
 *    folder name, so it is never stale) and old release folders are dropped;
 *  - everything else (index, version.json, RELEASE json, assets) is
 *    network-first with the cache as offline fallback, so updates show up at
 *    once when online.
 */
export function pwaManifest(base){
 const m=JSON.parse(String(base||'{}'));
 return JSON.stringify({...m,name:'Pokémon Torre 2',short_name:'Torre 2',
  description:'Campanha de Kanto e batalhas Pokémon em tempo real. Projeto de fã gratuito.',
  start_url:'./',scope:'./',display:'fullscreen',orientation:'landscape'},null,2)+'\n';
}
export function serviceWorker(release){
 if(!/^src-[a-f0-9]{10}$/.test(release))throw Error('PWA: bad release '+release);
 return `/* Pokémon Torre 2 service worker (release ${release}). */
const RELEASE='${release}',CACHE='torre2-'+RELEASE;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k.startsWith('torre2-')&&k!==CACHE)await caches.delete(k);
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(/\\/src-[a-f0-9]{10}\\//.test(url.pathname)){
  e.respondWith(caches.open(CACHE).then(async c=>{
   const hit=await c.match(req);if(hit)return hit;
   const res=await fetch(req);if(res.ok)c.put(req,res.clone());return res;
  }));
  return;
 }
 e.respondWith(fetch(req).then(res=>{
  if(res.ok&&!url.search)caches.open(CACHE).then(c=>c.put(req,res.clone()));
  return res;
 }).catch(()=>caches.match(req).then(hit=>hit||Response.error())));
});
`;
}
// Registers the worker and keeps the browser's install prompt for the
// campaign's "INSTALAR APP" button (window.__torre2Install).
export const PWA_HOOK='<script>(()=>{addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__torre2Install=e});'+
 'if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))})()</script>';
