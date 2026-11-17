/* Carnet GR · carte : cache des tuiles et de la page pour le mode hors-ligne.
   Les fonds de carte (IGN, relief, sentiers) déjà vus ou téléchargés via le bouton ⬇︎ restent disponibles sans réseau. */
const V="cgr-carte-v2",HOSTS=["data.geopf.fr","s3.amazonaws.com","tile.waymarkedtrails.org","unpkg.com"],MAX=7000;
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(["./","sw.js"]).catch(()=>{})))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
async function trim(c){const k=await c.keys();if(k.length>MAX)for(const r of k.slice(0,k.length-MAX+500))await c.delete(r)}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){if(r.headers.has("range"))return; // tuiles PMTiles (lecture par morceaux) : pas de cache
    // la page : réseau d'abord, cache si hors-ligne (le # n'est pas envoyé au serveur)
    e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match("./"))));return}
  if(!HOSTS.includes(u.hostname))return;
  e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);if(hit)return hit;try{const x=await fetch(r);if(x.ok||x.type==="opaque"){c.put(r,x.clone());if(Math.random()<.01)trim(c)}return x}catch(err){return new Response("",{status:504})}}))});
