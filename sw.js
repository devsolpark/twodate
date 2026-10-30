/* 오프라인에서도 열리도록 앱 파일을 저장해 둠.
   온라인이면 항상 새 파일을 받아오고(그래서 수정 사항이 바로 반영됨), 연결이 없을 때만 저장본을 씀. */
var CACHE='twodate-v13';
var SHELL=['./','./index.html','./style.css','./config.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',function(e){
  /* 설치할 때도 브라우저 저장본이 아닌 서버의 최신 파일을 담아 둠 */
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL.map(function(u){ return new Request(u,{cache:'reload'}); })); }).then(function(){ return self.skipWaiting(); }));
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
  /* 앱 파일은 브라우저 저장본(GitHub Pages는 10분 보관)을 건너뛰고 서버에 새 버전이 있는지 꼭 확인 */
  var req=u.origin===location.origin?new Request(r.url,{cache:'no-cache',credentials:'same-origin'}):r;
  e.respondWith(fetch(req).then(function(res){
    if(res.ok||res.type==='opaque'){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(r,copy); }); }
    return res;
  }).catch(function(){
    return caches.match(r,{ignoreSearch:true}).then(function(hit){ return hit||(r.mode==='navigate'?caches.match('./index.html'):Response.error()); });
  }));
});
