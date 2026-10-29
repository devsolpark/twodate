/* 오프라인에서도 열리도록 앱 파일을 저장해 둠.
   온라인이면 항상 새 파일을 받아오고(그래서 수정 사항이 바로 반영됨), 연결이 없을 때만 저장본을 씀. */
var CACHE='twodate-v5';
var SHELL=['./','./index.html','./style.css','./config.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url), font=/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin&&!font) return;
  e.respondWith(fetch(r).then(function(res){
    if(res.ok||res.type==='opaque'){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(r,copy); }); }
    return res;
  }).catch(function(){
    return caches.match(r,{ignoreSearch:true}).then(function(hit){ return hit||(r.mode==='navigate'?caches.match('./index.html'):Response.error()); });
  }));
});
