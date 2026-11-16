/* Service worker Depozit ESD v0.11.0: aplicația merge și fără internet */
var CACHE='esd-app-v0.11.0',LIB='esd-lib-v1';
var FILES=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==CACHE&&x!==LIB;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});
function put(name,key,res){if(res&&res.ok){var cp=res.clone();caches.open(name).then(function(c){c.put(key,cp);});}return res;}
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;
  var u=new URL(r.url);
  /* biblioteca de sincronizare (versiune fixă): o dată descărcată, rămâne pe dispozitiv */
  if(u.origin!==location.origin){
    if(u.hostname==='cdn.jsdelivr.net')e.respondWith(caches.open(LIB).then(function(c){return c.match(r.url).then(function(hit){return hit||fetch(r).then(function(res){if(res&&res.ok)c.put(r.url,res.clone());return res;});});}));
    return;
  }
  var page=r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname);
  if(page){
    /* pagina: întâi de pe internet (ca să ai mereu ultima versiune), cu rezervă din memorie dacă nu e semnal */
    e.respondWith(new Promise(function(done){
      var settled=false,t=setTimeout(function(){caches.match('index.html').then(function(hit){if(hit&&!settled){settled=true;done(hit);}});},3500);
      fetch(u.origin+u.pathname,{cache:'no-cache'}).then(function(res){put(CACHE,'index.html',res);clearTimeout(t);if(!settled){settled=true;done(res);}})
        .catch(function(){clearTimeout(t);caches.match('index.html').then(function(hit){if(!settled){settled=true;done(hit||Response.error());}});});
    }));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){
    var net=fetch(r).then(function(res){return put(CACHE,r,res);}).catch(function(){return hit;});
    return hit||net;
  }));
});
