(function(){
'use strict';

/* ---------- helpers ---------- */
var $ = function(s){ return document.querySelector(s); };
var app = $('#app');
var pad = function(n){ return String(n).padStart(2,'0'); };
var ymd = function(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
var parse = function(s){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); };
var todayStr = function(){ return ymd(new Date()); };
var nowHM = function(){ var n=new Date(); return pad(n.getHours())+':'+pad(n.getMinutes()); };
var addDays = function(n){ var d=new Date(); d.setDate(d.getDate()+n); return ymd(d); };
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var seasonOf = function(m){ return (m>=3&&m<=5)?'봄':(m>=6&&m<=8)?'여름':(m>=9&&m<=11)?'가을':'겨울'; };

/* 카테고리 → 하위 카테고리(subs) → 세부 항목(opts). 하위와 세부는 선택하지 않아도 됨 */
var CATS = {
  date:{name:'데이트',emoji:'💗',color:'var(--pink)',subs:{
    home:{name:'집',emoji:'🏠',color:'#FCE7EF',opts:['OTT','요리']},
    food:{name:'냠',emoji:'🍜',color:'#FCE9D9',opts:['브런치','한식','양식','중식','일식','동남아','디저트']},
    walk:{name:'뚜벅',emoji:'👟',color:'#E2F4E6',opts:['공원','야경','한강','피크닉','캠핑','여행']},
    study:{name:'독서',emoji:'📚',color:'#E2EDFF',opts:[]},
    sport:{name:'운동',emoji:'🏃',color:'#EAF2D3',opts:[]},
    etc:{name:'활동',emoji:'✨',color:'#FFF0CC',opts:['전시','영화','쇼핑','스키장','놀이동산','방탈출','공방']}
  }},
  personal:{name:'개인',emoji:'🗂️',color:'var(--lav)',subs:{
    work:{name:'출장',emoji:'🧳',color:'#ECE6FA',opts:[]},
    meet:{name:'약속',emoji:'🤝',color:'#DDF3EC',opts:[]},
    dinner:{name:'회식',emoji:'🍻',color:'#FDE4D6',opts:[]}
  }}
};
function catOf(e){
  var c=CATS[e.cat]||CATS.date, s=e.sub&&c.subs[e.sub];
  return {emoji:(s||c).emoji,color:(s||c).color,label:s?s.name+(e.sub2?' · '+e.sub2:''):c.name};
}
var SEASONS = {'봄':'🌸','여름':'🌊','가을':'🍂','겨울':'⛄','언젠가':'✨'};
var SEASON_COLOR = {'봄':'var(--pink)','여름':'var(--sky)','가을':'var(--orange)','겨울':'var(--lav)','언젠가':'var(--yellow)'};
var SEASON_ORDER = ['봄','여름','가을','겨울'];
var SEASON_CHOICES = SEASON_ORDER.concat('언젠가');
var DOW = ['일','월','화','수','목','금','토'];
var WEATHER=[{k:'sun',i:'☀️',n:'맑음'},{k:'part',i:'⛅',n:'구름'},{k:'cloud',i:'☁️',n:'흐림'},{k:'rain',i:'🌧️',n:'비'},{k:'snow',i:'❄️',n:'눈'},{k:'wind',i:'🌬️',n:'바람'}];
/* cute round weather icons (crayon outline + pastel fill) */
var CLOUD_D='M11 32C6.5 32 4.5 27 7.5 24C8 20 12.5 18 16 19.5C18 15 25 14.5 27.5 19.5C32.5 19 35.5 24 33 28C32.5 30.5 30 32 28 32Z';
function wxFace(cx,cy,m){
  var eyes='<circle cx="'+(cx-4)+'" cy="'+cy+'" r="1.2" fill="#2A2724" stroke="none"/><circle cx="'+(cx+4)+'" cy="'+cy+'" r="1.2" fill="#2A2724" stroke="none"/>';
  var cheeks='<ellipse cx="'+(cx-6.6)+'" cy="'+(cy+2.4)+'" rx="2" ry="1.3" fill="#FF8FA3" opacity=".6" stroke="none"/><ellipse cx="'+(cx+6.6)+'" cy="'+(cy+2.4)+'" rx="2" ry="1.3" fill="#FF8FA3" opacity=".6" stroke="none"/>';
  var mouth=m==='flat'?'<path d="M'+(cx-1.8)+' '+(cy+3)+'H'+(cx+1.8)+'" fill="none" stroke-width="1.5"/>'
          :m==='sad'?'<path d="M'+(cx-2)+' '+(cy+4)+'Q'+cx+' '+(cy+2)+' '+(cx+2)+' '+(cy+4)+'" fill="none" stroke-width="1.5"/>'
          :'<path d="M'+(cx-2)+' '+(cy+2.4)+'Q'+cx+' '+(cy+4.8)+' '+(cx+2)+' '+(cy+2.4)+'" fill="none" stroke-width="1.5"/>';
  return eyes+cheeks+mouth;
}
function wxRays(cx,cy,r1,r2,angles){
  return angles.map(function(a){ var t=a*Math.PI/180; return '<path d="M'+(cx+r1*Math.cos(t)).toFixed(1)+' '+(cy+r1*Math.sin(t)).toFixed(1)+'L'+(cx+r2*Math.cos(t)).toFixed(1)+' '+(cy+r2*Math.sin(t)).toFixed(1)+'" fill="none"/>'; }).join('');
}
function wxDrop(x,y){ return '<path transform="translate('+x+' '+y+')" d="M0 -3.5C2.6 0 3.2 2.2 0 4.2C-3.2 2.2 -2.6 0 0 -3.5Z" fill="#8FD0F5"/>'; }
function wxFlake(x,y){ return '<path transform="translate('+x+' '+y+')" d="M-3 0H3M-1.5 -2.6L1.5 2.6M1.5 -2.6L-1.5 2.6" fill="none" stroke-width="1.5"/>'; }
function wxIcon(k){
  var b='';
  if(k==='sun') b=wxRays(20,20,13,17.5,[0,45,90,135,180,225,270,315])+'<circle cx="20" cy="20" r="9.5" fill="#FFE08A"/>'+wxFace(20,19.5,'smile');
  else if(k==='part') b=wxRays(25,13,10,12.5,[180,225,270,315,0])+'<circle cx="25" cy="13" r="7" fill="#FFE08A"/><path d="'+CLOUD_D+'" fill="#fff"/>'+wxFace(20,25.5,'smile');
  else if(k==='cloud') b='<g transform="translate(-2 -3) scale(1.1)"><path d="'+CLOUD_D+'" fill="#D5DEE9"/></g>'+wxFace(20.5,23,'flat');
  else if(k==='rain') b='<g transform="translate(0 -6)"><path d="'+CLOUD_D+'" fill="#CBE6F8"/></g>'+wxFace(20,19.5,'sad')+wxDrop(12,33)+wxDrop(20,36)+wxDrop(28,33);
  else if(k==='snow') b='<g transform="translate(0 -6)"><path d="'+CLOUD_D+'" fill="#ECE7FB"/></g>'+wxFace(20,19.5,'smile')+wxFlake(12,33)+wxFlake(20,36)+wxFlake(28,33);
  else b=['M6 14H24a4 4 0 0 0 -8 0','M4 22H30a4.5 4.5 0 0 1 -9 0','M9 31H20a3.5 3.5 0 0 0 -7 0'].map(function(d){ return '<path d="'+d+'" fill="none" stroke="#A9E3C8" stroke-width="6"/>'; }).join('')+
       ['M6 14H24a4 4 0 0 0 -8 0','M4 22H30a4.5 4.5 0 0 1 -9 0','M9 31H20a3.5 3.5 0 0 0 -7 0'].map(function(d){ return '<path d="'+d+'" fill="none"/>'; }).join('');
  return '<svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true"><g style="stroke:#2A2724;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round">'+b+'</g></svg>';
}
var WHO = {me:'은솔', partner:'건호'};
function withJosa(name){ var c=name.charCodeAt(name.length-1); var has=c>=0xAC00&&c<=0xD7A3&&((c-0xAC00)%28)!==0; return name+(has?'이':'가'); }

function fmtTime(t){
  if(!t) return '';
  var p=t.split(':'), h=+p[0], mm=p[1];
  var ap=h<12?'오전':'오후', h12=h%12||12;
  return ap+' '+h12+(mm==='00'?'시':':'+mm);
}
function fmtDate(s){
  var d=parse(s), now=new Date();
  return (d.getFullYear()!==now.getFullYear()?d.getFullYear()+'년 ':'')+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+DOW[d.getDay()]+')';
}
function fmtFull(s){
  var d=parse(s);
  return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일';
}
function whenText(e){
  if(!e.date) return SEASONS[e.season]+' '+e.season;
  return (e.date===todayStr()?'오늘':fmtDate(e.date))+(e.time?' '+fmtTime(e.time):'');
}

/* ---------- data ---------- */
var KEY = 'couple-diary-v1';
function seed(){
  return [
    {id:'s1',title:'성수동 카페 투어',cat:'date',sub:'food',sub2:'디저트',date:addDays(-3),time:'15:00',season:'',place:'성수동 연무장길',memo:'치즈케이크가 제일 맛있었어. 다음엔 다른 집도!',by:'me'},
    {id:'s2',title:'첫 영화 보러 가기',cat:'date',sub:'etc',sub2:'영화',date:addDays(-8),time:'19:30',season:'',place:'용산 CGV',memo:'팝콘은 반반으로.',by:'partner'},
    {id:'s3',title:'한강 피크닉',cat:'date',sub:'walk',sub2:'피크닉',date:addDays(-15),time:'',season:'',place:'뚝섬 한강공원',memo:'돗자리 챙겨오기',by:'me'},
    {id:'s4',title:'퇴근하고 야식 먹기',cat:'date',sub:'food',sub2:'한식',date:addDays(0),time:'21:00',season:'',place:'우리 동네 포장마차',memo:'오뎅탕이랑 계란말이 시키기',by:'partner'},
    {id:'s5',title:'도자기 공방 원데이 클래스',cat:'date',sub:'etc',sub2:'공방',date:addDays(2),time:'14:00',season:'',place:'서촌 흙놀이터',memo:'앞치마 챙기기! 작품은 3주 뒤에 찾으러 가면 돼.',by:'me'},
    {id:'s6',title:'춘천 닭갈비 당일치기',cat:'date',sub:'walk',sub2:'여행',date:addDays(5),time:'09:00',season:'',place:'청량리역 ITX 매표소 앞',memo:'아침은 기차에서 김밥 먹자.',by:'partner'},
    {id:'s7',title:'100일 기념일',cat:'date',sub:'',sub2:'',date:addDays(7),time:'',season:'',place:'연남동',memo:'편지랑 작은 선물 준비하기',by:'me'},
    {id:'s8',title:'친구들이랑 보드게임',cat:'personal',sub:'meet',sub2:'',date:addDays(11),time:'18:30',season:'',place:'홍대 보드게임 카페',memo:'4명 예약 완료',by:'partner'},
    {id:'s9',title:'단풍 구경 가기',cat:'date',sub:'walk',sub2:'여행',date:addDays(14),time:'',season:'',place:'내장산',memo:'따뜻하게 입고 가기. 보온병도!',by:'me'},
    {id:'s10',title:'개봉날 영화 같이 보기',cat:'date',sub:'etc',sub2:'영화',date:addDays(18),time:'20:10',season:'',place:'잠실 롯데시네마',memo:'',by:'partner'},
    {id:'s11',title:'김장 같이 하기',cat:'personal',sub:'meet',sub2:'',date:addDays(23),time:'10:00',season:'',place:'엄마네 집',memo:'장갑이랑 앞치마 챙기기',by:'me'},
    {id:'s12',title:'생일 서프라이즈 준비',cat:'date',sub:'',sub2:'',date:addDays(28),time:'',season:'',place:'',memo:'케이크는 미리 예약해두기',by:'partner'},
    {id:'s13',title:'제주도 2박 3일',cat:'date',sub:'walk',sub2:'여행',date:addDays(35),time:'07:40',season:'',place:'김포공항 국내선',memo:'렌터카 예약했어. 숙소는 애월 쪽!',by:'me'},
    {id:'s14',title:'크리스마스 마켓 구경',cat:'date',sub:'etc',sub2:'쇼핑',date:addDays(42),time:'17:00',season:'',place:'롯데월드몰',memo:'핫초코 마시기',by:'partner'},
    {id:'s15',title:'연말 파티',cat:'personal',sub:'meet',sub2:'',date:addDays(50),time:'19:00',season:'',place:'우리집',memo:'각자 음식 한 가지씩 가져오기',by:'me'},
    {id:'s16',title:'온천 여행 가자',cat:'date',sub:'walk',sub2:'여행',date:'',time:'',season:'겨울',place:'',memo:'어디로 갈지 같이 정해보기',by:'partner'},
    {id:'s17',title:'벚꽃 보러 가기',cat:'date',sub:'walk',sub2:'공원',date:'',time:'',season:'봄',place:'진해?',memo:'도시락 싸 가자.',by:'me'}
  ];
}
/* 예전 카테고리(여행·기념일·맛집·약속·기타)로 저장된 일정을 새 구조로 옮김 */
var OLD_CATS={date:['date','',''],trip:['date','walk','여행'],anniv:['date','',''],food:['date','food',''],meet:['personal','meet',''],etc:['date','etc','']};
function migrate(a){
  var changed=false;
  a.forEach(function(e){
    if('sub' in e) return;
    var m=OLD_CATS[e.cat]||OLD_CATS.date;
    e.cat=m[0]; e.sub=m[1]; e.sub2=m[2]; delete e.catLabel; changed=true;
  });
  if(changed){ try{ localStorage.setItem(KEY,JSON.stringify(a)); }catch(x){} }
  return a;
}
function load(){
  try{ var r=localStorage.getItem(KEY); if(r){ var a=JSON.parse(r); if(Array.isArray(a)) return migrate(a); } }catch(e){}
  /* 서버와 함께 쓸 때는 예시 일정 없이 빈 일기장으로 시작 */
  var s=(typeof SUPABASE_URL==='string'&&SUPABASE_URL)?[]:seed(); try{ localStorage.setItem(KEY,JSON.stringify(s)); }catch(e){}
  return s;
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(events)); return true; }catch(e){ return false; } }
var events = load();

function isUpcoming(e){
  if(!e.date) return true;
  var t=todayStr();
  if(e.date>t) return true;
  if(e.date<t) return false;
  if(!e.time) return true;
  return e.time>=nowHM();
}
function sortKey(e){
  if(e.date) return e.date+' '+(e.time||'00:00');
  if(e.season==='언젠가') return '9999-99-99 9';
  var cur=SEASON_ORDER.indexOf(seasonOf(new Date().getMonth()+1));
  return '9999-99-99 '+((SEASON_ORDER.indexOf(e.season)-cur+4)%4);
}
function upcoming(){
  return events.filter(isUpcoming).sort(function(a,b){ var x=sortKey(a), y=sortKey(b); return x<y?-1:x>y?1:0; });
}

/* ---------- state ---------- */
var now0=new Date();
var state={mode:'cal',month:{y:now0.getFullYear(),m:now0.getMonth()},sel:todayStr(),shown:6,scroll:0,animated:false};
var io=null, loading=false;

function toast(msg){
  var t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(function(){ t.classList.remove('show'); },2200);
}
function badge(e){
  var c=catOf(e);
  return '<span class="badge" style="background:'+c.color+'">'+esc(c.label)+'</span>';
}

/* ---------- main ---------- */
function heroHTML(){
  var e=upcoming()[0];
  if(!e){
    return '<div class="next empty tape"><p>다가오는 일정이 아직 없어요</p><a class="btn primary" href="#/new">첫 일정 등록하기</a></div>';
  }
  var sub='';
  if(e.place) sub+='<p class="s">📍 '+esc(e.place)+'</p>';
  if(e.memo) sub+='<p class="s">✏️ '+esc(e.memo.replace(/\s+/g,' '))+'</p>';
  return '<a class="next tape" href="#/event/'+esc(e.id)+'" style="border-color:var(--ink)">'+
    '<div class="row">'+badge(e)+'<span class="when">'+esc(whenText(e))+'</span></div>'+
    '<h2 class="t" style="margin-block:10px 6px">'+esc(e.title)+'</h2>'+sub+'</a>';
}

function renderMain(){
  var n=new Date(), season=seasonOf(n.getMonth()+1);
  app.innerHTML=
  '<div class="wrap">'+
    '<div class="topbar"><span class="d">'+fmtFull(todayStr())+'</span>'+
      '<a class="btn primary add" href="#/new">+ 일정 등록</a></div>'+
    '<section class="paper diary-top">'+heroHTML()+'</section>'+
    '<div class="seg" role="group" aria-label="보기 방식">'+
      '<button type="button" data-mode="cal" aria-pressed="'+(state.mode==='cal')+'">달력으로 보기</button>'+
      '<button type="button" data-mode="list" aria-pressed="'+(state.mode==='list')+'">목록으로 보기</button>'+
    '</div>'+
    '<section class="book"><div class="spiral" aria-hidden="true"></div><div id="bookBody"></div></section>'+
  '</div>';
  app.querySelectorAll('.seg button').forEach(function(b){
    b.addEventListener('click',function(){
      if(state.mode===b.dataset.mode) return;
      state.mode=b.dataset.mode; state.shown=6;
      app.querySelectorAll('.seg button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)); });
      renderBook();
    });
  });
  renderBook();
}

function renderBook(){
  if(io){ io.disconnect(); io=null; }
  loading=false;
  var body=$('#bookBody'); if(!body) return;
  if(state.mode==='cal') renderCalendar(body); else renderList(body);
}

function renderCalendar(body){
  var y=state.month.y, m=state.month.m, t=todayStr();
  var first=new Date(y,m,1), lead=first.getDay(), dim=new Date(y,m+1,0).getDate();
  var by={};
  events.forEach(function(e){ if(e.date){ (by[e.date]=by[e.date]||[]).push(e); } });
  var cells='', idx=0, animate=!state.animated;
  for(var i=0;i<lead;i++) cells+='<div class="day blank"></div>';
  for(var d=1; d<=dim; d++){
    var ds=y+'-'+pad(m+1)+'-'+pad(d), evs=by[ds]||[], past=ds<t;
    var cls='day'+(ds===t?' today':'')+(ds===state.sel?' sel':'')+(evs.length&&animate?' step':'');
    var foot=evs.length?'<span class="hearts">'+evs.slice().sort(function(a,b){ return (a.time||'')<(b.time||'')?-1:1; }).map(function(ev){
      return '<svg class="'+(past?'off':'on')+'"'+(past?'':' style="--ft-fill:'+catOf(ev).color+'"')+' aria-hidden="true"><use href="#heart"/></svg>';
    }).join('')+'</span>':'';
    cells+='<button type="button" class="'+cls+'" data-date="'+ds+'" style="--i:'+(evs.length?idx++:0)+'" aria-label="'+(m+1)+'월 '+d+'일'+(evs.length?', 일정 '+evs.length+'개':'')+'"><span class="n">'+d+'</span>'+foot+'</button>';
  }
  var rest=(7-((lead+dim)%7))%7;
  for(var j=0;j<rest;j++) cells+='<div class="day blank"></div>';
  state.animated=true;

  body.innerHTML=
    '<div class="cal-head">'+
      '<button type="button" class="round" data-nav="-1" aria-label="이전 달">‹</button>'+
      '<h2>'+y+'년 '+(m+1)+'월</h2>'+
      '<button type="button" class="round" data-nav="1" aria-label="다음 달">›</button>'+
    '</div>'+
    '<div class="dow"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
    '<div class="days">'+cells+'</div>'+
    '<div class="daypanel">'+dayPanel()+'</div>';

  body.querySelectorAll('[data-nav]').forEach(function(b){
    b.addEventListener('click',function(){
      var nd=new Date(y,m+Number(b.dataset.nav),1);
      state.month={y:nd.getFullYear(),m:nd.getMonth()};
      var cur=new Date();
      state.sel=(nd.getFullYear()===cur.getFullYear()&&nd.getMonth()===cur.getMonth())?todayStr():null;
      renderBook();
    });
  });
  body.querySelectorAll('.day[data-date]').forEach(function(b){
    b.addEventListener('click',function(){ state.sel=b.dataset.date; renderBook(); });
  });
}

function dayPanel(){
  if(!state.sel) return '<p class="hint">날짜를 누르면 그날의 일정을 볼 수 있어요.</p>';
  var d=parse(state.sel);
  var head='<h3>'+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+DOW[d.getDay()]+')</h3>';
  var evs=events.filter(function(e){ return e.date===state.sel; }).sort(function(a,b){ return (a.time||'')<(b.time||'')?-1:1; });
  if(!evs.length){
    return head+'<p class="hint">이 날은 아직 비어 있어요.</p>'+'<p style="margin:10px 0 0"><a class="btn" href="#/new?date='+state.sel+'">이 날에 일정 등록하기</a></p>';
  }
  return head+evs.map(function(e){
    return '<a class="mini" href="#/event/'+esc(e.id)+'">'+badge(e)+'<span class="tt">'+esc(e.title)+'</span><span class="tm">'+(e.time?esc(fmtTime(e.time)):'')+'</span></a>';
  }).join('');
}

function entryHTML(e){
  var t=todayStr(), stamp;
  if(!e.date) stamp='<div class="stamp"><b>'+SEASONS[e.season]+'</b><i>'+e.season+'</i></div>';
  else if(e.date===t) stamp='<div class="stamp today"><b>오늘</b></div>';
  else { var d=parse(e.date); stamp='<div class="stamp"><b>'+(d.getMonth()+1)+'/'+d.getDate()+'</b><i>'+DOW[d.getDay()]+'</i></div>'; }
  var tm=e.date&&e.time?'<span class="tm">'+esc(fmtTime(e.time))+'</span>':(!e.date?'<span class="tm">날짜 미정</span>':'');
  return '<a class="entry" href="#/event/'+esc(e.id)+'">'+stamp+
    '<div><div class="row">'+badge(e)+tm+'</div><h3 class="tt">'+esc(e.title)+'</h3>'+
    (e.place?'<p class="pl">📍 '+esc(e.place)+'</p>':'')+'</div></a>';
}

function renderList(body){
  /* 목록은 날짜 미정 일정(이번 계절부터 차례로, 언젠가는 맨 뒤)을 먼저, 그다음 날짜순 */
  var all=upcoming(), items=all.filter(function(e){ return !e.date; }).concat(all.filter(function(e){ return e.date; }));
  if(!items.length){
    body.innerHTML='<div class="emptybox"><p>다가오는 일정이 없어요</p><a class="btn primary" href="#/new">일정 등록하기</a></div>';
    return;
  }
  state.shown=Math.max(6,Math.min(state.shown,items.length));
  body.innerHTML='<div class="entries">'+items.slice(0,state.shown).map(entryHTML).join('')+'</div><div class="sentinel" role="status"></div>';
  var list=body.querySelector('.entries'), s=body.querySelector('.sentinel');
  if(state.shown>=items.length){ s.textContent='여기까지가 다가오는 일정이에요'; s.className='sentinel end'; return; }
  io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting||loading) return;
    loading=true; s.textContent='다음 일정을 불러오는 중';
    setTimeout(function(){
      if(!s.isConnected) return;
      var next=items.slice(state.shown,state.shown+5);
      state.shown+=next.length;
      list.insertAdjacentHTML('beforeend',next.map(entryHTML).join(''));
      loading=false;
      if(state.shown>=items.length){ io.disconnect(); s.textContent='여기까지가 다가오는 일정이에요'; s.className='sentinel end'; }
      else { s.textContent=''; io.unobserve(s); io.observe(s); }
    },450);
  },{rootMargin:'200px'});
  io.observe(s);
}

/* ---------- image ---------- */
function readImage(file,cb){
  var fr=new FileReader();
  fr.onerror=function(){ cb(null); };
  fr.onload=function(){
    var img=new Image();
    img.onerror=function(){ cb(null); };
    img.onload=function(){
      var max=900, w=img.naturalWidth, h=img.naturalHeight, k=Math.min(1,max/Math.max(w,h));
      var cv=document.createElement('canvas'); cv.width=Math.max(1,Math.round(w*k)); cv.height=Math.max(1,Math.round(h*k));
      var cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(img,0,0,cv.width,cv.height);
      try{ cb(cv.toDataURL('image/jpeg',0.8)); }catch(x){ cb(null); }
    };
    img.src=fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- place info (수정 화면에서 직접 입력) ---------- */
function emptyPlace(){ return {address:'',open:'',close:'',closed:false,parking:'',fee:'',parkingNote:''}; }
function toMin(t){ var p=String(t).split(':'); return (+p[0])*60+(+p[1]||0); }
function placeCardHTML(e){
  /* 장소명 박스. 링크가 있고 가게 정보를 적어둔 경우에만 위치·영업·주차 버튼을 보여줌 */
  var link=e.link&&/^https?:\/\//i.test(e.link)?'<p class="pc-link"><span aria-hidden="true">🔗</span><a class="lnk" href="'+esc(e.link)+'" target="_blank" rel="noopener noreferrer">'+esc(e.link.replace(/^https?:\/\//i,''))+'</a></p>':'';
  var p=e.link?e.placeInfo:null; if(!e.place&&!p&&!link) return ''; p=p||{};
  var chip=function(t,off){ return '<span class="pc-chip'+(off?' pc-chip-off':'')+'">'+esc(t)+'</span>'; };
  var panels=[];
  if(p.address){
    var tk=p.address.split(/\s+/), region=[tk[0]];
    for(var i=1;i<tk.length&&region.length<3&&/(시|군|구)$/.test(tk[i]);i++) region.push(tk[i]);
    panels.push({id:'pcL',cls:'pc-loc',label:'📍 위치',body:'<p class="pc-chips">'+region.map(function(r){ return '<span class="pc-chip pc-chip-loc">'+esc(r)+'</span>'; }).join('')+'</p><p>'+esc(p.address)+'</p>'});
  }
  if(p.closed||p.open||p.close){
    var dayName=e.date?DOW[parse(e.date).getDay()]+'요일':'';
    var at=e.time||(e.date===todayStr()?nowHM():''), badgeTxt, line;
    if(p.closed){
      badgeTxt=chip(at?'영업종료':'휴무',true);
      line='<b class="pc-off">'+(dayName?dayName+'은':'그날은')+' 쉬는 날이에요</b>';
    } else if(p.open&&p.close){
      var o=toMin(p.open), c=toMin(p.close), next=c<=o, t=at?toMin(at):null;
      if(next) c+=1440;
      badgeTxt=t===null?chip('영업일'):((t>=o&&t<c)||t+1440<c)?chip('영업중'):chip('영업종료',true);
      line='<b>'+(dayName?dayName+' ':'')+esc(p.open)+' – <span class="pc-off">'+(next?'다음날 ':'')+esc(p.close)+'</span></b>';
    } else {
      badgeTxt='';
      line='<b>'+(dayName?dayName+' ':'')+(p.open?esc(p.open)+' 오픈':'')+(p.close?(p.open?' ':'')+'<span class="pc-off">'+esc(p.close)+' 마감</span>':'')+'</b>';
    }
    panels.push({id:'pcH',cls:'pc-hours',label:'🕒 영업',body:(badgeTxt?'<p class="pc-chips">'+badgeTxt+'</p>':'')+'<p>'+line+'</p>'});
  }
  if(p.parking||p.parkingNote){
    var chips=(p.parking==='yes'?chip('주차 가능'):p.parking==='no'?chip('주차 불가',true):'')+(p.fee==='free'?chip('무료'):p.fee==='paid'?chip('유료'):'');
    panels.push({id:'pcP',cls:'pc-park',label:'🅿️ 주차',body:(chips?'<p class="pc-chips">'+chips+'</p>':'')+(p.parkingNote?'<p>'+esc(p.parkingNote)+'</p>':'')});
  }
  if(!panels.length) return '<section class="pcard" aria-label="장소">'+(e.place?'<h2>'+esc(e.place)+'</h2>':'')+link+'</section>';
  var first=panels.filter(function(x){ return x.id==='pcH'; })[0]||panels[0];
  var tabs=panels.length>1?
    panels.map(function(x){ return '<input type="radio" name="pctab" id="'+x.id+'" class="pc-r"'+(x===first?' checked':'')+'>'; }).join('')+
    '<div class="pc-tabs">'+panels.map(function(x){ return '<label for="'+x.id+'">'+x.label+'</label>'; }).join('')+'</div>':'';
  return '<section class="pcard'+(tabs?' has-tabs':'')+'" aria-label="가게 정보">'+
    '<h2>'+esc(e.place||'가게 정보')+'</h2>'+tabs+
    '<div class="pc-panels">'+panels.map(function(x){ return '<div class="pc-panel '+x.cls+'">'+(tabs?'':'<span class="pc-lb">'+x.label+'</span>')+x.body+'</div>'; }).join('')+'</div>'+link+
  '</section>';
}

/* ---------- 지난 일정 메모 ----------
   메모는 여러 개를 쌓아 둠: dayNotes = [{id, by, text, at}]. 예전 한 칸짜리 메모(dayMemo)는 첫 메모로 보여줌 */
var ME_KEY='couple-diary-me';
function notesOf(e){
  var a=Array.isArray(e.dayNotes)?e.dayNotes.slice():[];
  if(e.dayMemo&&!a.some(function(n){ return n.id==='legacy'; })) a.unshift({id:'legacy',by:e.by||'me',text:e.dayMemo,at:''});
  return a.sort(function(x,y){ return (x.at||'')<(y.at||'')?-1:(x.at||'')>(y.at||'')?1:0; });
}
function mergeNotes(a,b){
  var seen={}, out=[];
  (a||[]).concat(b||[]).forEach(function(n){ if(n&&n.id&&!seen[n.id]){ seen[n.id]=1; out.push(n); } });
  return out;
}
function noteTime(iso){
  if(!iso) return '';
  var d=new Date(iso); return (d.getMonth()+1)+'/'+d.getDate()+' '+fmtTime(pad(d.getHours())+':'+pad(d.getMinutes()));
}
function notesHTML(e){
  var a=notesOf(e);
  if(!a.length) return '<p class="hint">아직 남긴 메모가 없어요.</p>';
  return '<ul class="notes">'+a.map(function(n){
    return '<li class="note"><p>'+esc(n.text)+'</p><span class="note-by">'+esc(WHO[n.by]||WHO.me)+(n.at?' · '+esc(noteTime(n.at)):'')+'</span></li>';
  }).join('')+'</ul>';
}

/* ---------- detail ---------- */
function renderDetail(id){
  var fresh=!($('#ov')&&$('#ov').dataset.kind==='detail');
  var box=detailBox();
  var e=events.filter(function(x){ return x.id===id; })[0];
  if(!e){
    box.innerHTML='<div class="paper note-empty"><p>찾을 수 없는 일정이에요. 이미 삭제됐을 수 있어요.</p><a class="btn primary" href="#/">닫기</a></div>';
    return;
  }
  var c=catOf(e);
  var past=!!e.date&&e.date<todayStr();
  var curImg=(e.image&&/^data:image\//.test(e.image))?e.image:'';
  function photoHTML(){
    var has=!!curImg;
    return '<div class="frame tape" style="background-color:'+c.color+'">'+
      (has?'<img src="'+esc(curImg)+'" alt="'+esc(e.title)+' 사진">':'<span class="big" aria-hidden="true">'+c.emoji+'</span>')+'</div>'+
      '<div class="photo-actions"><input type="file" id="photoIn" accept="image/*" hidden>'+
      '<button type="button" class="btn" id="photoBtn">'+(has?'이미지 변경':'이미지 등록')+'</button>'+
      (has?'<button type="button" class="btn" id="photoDel">이미지 삭제</button>':'')+'</div>';
  }
  var frame=past?'<div id="photoArea">'+photoHTML()+'</div>':'';
  var diary='';
  var noteBy=getLS(ME_KEY)||'me';
  /* 팝업이 열린 동안 서버에서 일정을 새로 받아오면 events 안의 객체가 바뀌므로, 저장할 때는 항상 최신 객체를 씀 */
  var current=function(){ return events.filter(function(x){ return x.id===id; })[0]||e; };
  if(past){
    diary='<div class="diary-in">'+
      '<div class="fld"><span class="lb" id="lbWx">날씨</span><div class="wxs" role="radiogroup" aria-labelledby="lbWx">'+
      WEATHER.map(function(w){ return '<label class="wx"><input type="radio" name="wx" value="'+w.k+'"'+(e.weather===w.k?' checked':'')+'><span><i aria-hidden="true">'+wxIcon(w.k)+'</i><b>'+w.n+'</b></span></label>'; }).join('')+
      '</div></div>'+
      '<div class="fld"><span class="lb">메모</span><div id="notesList">'+notesHTML(e)+'</div>'+
        '<div class="note-add">'+
          '<div class="chips" role="radiogroup" aria-label="누가 남겨요?" id="gNoteBy">'+Object.keys(WHO).map(function(k){ return '<button type="button" class="chip" role="radio" data-tone data-noteby="'+k+'" style="--tone:var(--mint)" aria-checked="'+(noteBy===k)+'">'+WHO[k]+'</button>'; }).join('')+'</div>'+
          '<textarea class="in" id="noteIn" rows="3" maxlength="300" aria-label="새 메모" placeholder="그날은 어땠나요? 남기고 싶은 이야기를 적어 보세요"></textarea>'+
          '<button type="button" class="btn" id="noteAdd">메모 남기기</button>'+
        '</div></div>'+
    '</div>';
  }
  var dl;
  if(e.date){
    dl='<span class="d">'+fmtFull(e.date)+'</span><span class="sticker" style="background:'+c.color+'">'+(e.date===todayStr()?'오늘':(e.time?fmtTime(e.time):'하루 종일'))+'</span>';
  } else {
    dl='<span class="d">날짜는 아직 미정</span><span class="sticker" style="background:'+SEASON_COLOR[e.season]+'">'+SEASONS[e.season]+' '+e.season+'</span>';
  }
  box.innerHTML=
    '<article class="paper page"><div class="spiral" aria-hidden="true"></div>'+
      '<button type="button" class="round dclose" id="dClose" aria-label="닫기">✕</button>'+
      frame+
      '<div class="dateline"'+(past?'':' style="margin-top:0"')+'>'+dl+'</div>'+
      '<div class="lined">'+
        '<div class="rowb">'+badge(e)+'</div>'+
        '<h1 class="ttl">'+esc(e.title)+'</h1>'+
        (e.memo?'<div class="info"><span class="ic">✏️</span><span class="tx memo">'+esc(e.memo)+'</span></div>':'')+
      '</div>'+
      placeCardHTML(e)+
      '<p class="sign">'+withJosa(WHO[e.by||'me'])+' 적었어요</p>'+
      diary+
      (past?'<div class="actions"><button type="button" class="btn primary" id="saveBtn">저장하기</button></div>'
           :'<div id="act" class="actions"><a class="btn primary" href="#/edit/'+esc(e.id)+'">수정하기</a><button type="button" class="btn" id="delAsk">삭제하기</button></div>')+
    '</article>';
  $('#dClose').addEventListener('click',function(){ location.hash='#/'; });
  if(fresh) $('#dClose').focus();
  if(past){
    $('#gNoteBy').addEventListener('click',function(ev){
      var b=ev.target.closest('[data-noteby]'); if(!b) return;
      noteBy=b.getAttribute('data-noteby'); setLS(ME_KEY,noteBy);
      this.querySelectorAll('[data-noteby]').forEach(function(x){ x.setAttribute('aria-checked',String(x===b)); });
    });
    $('#noteAdd').addEventListener('click',function(){
      e=current();
      var t=$('#noteIn').value.trim();
      if(!t){ toast('메모를 입력해 주세요'); $('#noteIn').focus(); return; }
      e.dayNotes=notesOf(e).concat({id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),by:noteBy,text:t,at:new Date().toISOString()});
      delete e.dayMemo;
      save(); push('save',e.id);
      $('#notesList').innerHTML=notesHTML(e); $('#noteIn').value='';
      toast('메모를 남겼어요');
    });
    var bindPhoto=function(){
      var area=$('#photoArea');
      $('#photoBtn').addEventListener('click',function(){ $('#photoIn').click(); });
      $('#photoIn').addEventListener('change',function(){
        var file=this.files&&this.files[0]; if(!file) return;
        if(!/^image\//.test(file.type)){ toast('이미지 파일만 선택할 수 있어요'); return; }
        readImage(file,function(url){
          if(!url){ toast('이미지를 불러오지 못했어요'); return; }
          curImg=url; area.innerHTML=photoHTML(); bindPhoto(); $('#photoBtn').focus();
        });
      });
      var pd=$('#photoDel');
      if(pd) pd.addEventListener('click',function(){ curImg=''; area.innerHTML=photoHTML(); bindPhoto(); $('#photoBtn').focus(); });
    };
    bindPhoto();
    $('#saveBtn').addEventListener('click',function(){
      e=current();
      var wx=document.querySelector('input[name="wx"]:checked');
      if(curImg) e.image=curImg; else delete e.image;
      e.weather=wx?wx.value:'';
      if(!save()) toast('이 기기에 저장하지 못했어요. 새로고침하면 사라질 수 있어요'); else toast('저장했어요');
      push('save',e.id);
      renderDetail(id);
    });
  } else $('#delAsk').addEventListener('click',function(){
    $('#act').outerHTML='<div class="confirm" id="act"><p>이 일정을 정말 삭제할까요?</p><div class="actions"><button type="button" class="btn danger" id="delYes">삭제하기</button><button type="button" class="btn" id="delNo">취소</button></div></div>';
    $('#delNo').addEventListener('click',function(){ renderDetail(id); });
    $('#delYes').addEventListener('click',function(){
      events=events.filter(function(x){ return x.id!==id; }); save(); push('del',id);
      toast('삭제했어요'); location.hash='#/';
    });
    $('#delYes').focus();
  });
}

/* ---------- form ---------- */
function renderForm(id,presetDate){
  var editing=id?events.filter(function(x){ return x.id===id; })[0]:null;
  if(id&&!editing){ renderDetail(id); return; }
  if(editing&&editing.date&&editing.date<todayStr()){ location.hash='#/event/'+editing.id; return; }
  var curSeason=seasonOf(new Date().getMonth()+1);
  var f=editing?{title:editing.title,cat:CATS[editing.cat]?editing.cat:'date',sub:editing.sub||'',sub2:editing.sub2||'',mode:editing.date?'date':'season',date:editing.date||'',time:editing.time||'',season:editing.season||curSeason,place:editing.place||'',memo:editing.memo||'',by:editing.by||'me',link:editing.link||''}
               :{title:'',cat:'date',sub:'',sub2:'',mode:'date',date:/^\d{4}-\d{2}-\d{2}$/.test(presetDate||'')?presetDate:todayStr(),time:nowHM(),season:curSeason,place:'',memo:'',by:'me',link:''};
  var pi=editing&&editing.placeInfo?JSON.parse(JSON.stringify(editing.placeInfo)):emptyPlace();
  var catChips=Object.keys(CATS).map(function(k){
    var c=CATS[k];
    return '<button type="button" class="chip" data-tone data-cat="'+k+'" style="--tone:'+c.color+'" aria-pressed="'+(f.cat===k)+'">'+c.emoji+' '+c.name+'</button>';
  }).join('');
  var seasonChips=SEASON_CHOICES.map(function(s){ return '<button type="button" class="chip" data-tone data-season="'+s+'" style="--tone:'+SEASON_COLOR[s]+'" aria-pressed="'+(f.season===s)+'">'+SEASONS[s]+' '+s+(s==='언젠가'?'!':'')+'</button>'; }).join('');
  var whoChips=Object.keys(WHO).map(function(k){ return '<button type="button" class="chip" data-tone data-by="'+k+'" style="--tone:var(--mint)" aria-pressed="'+(f.by===k)+'">'+WHO[k]+'</button>'; }).join('');
  var radio=function(attr,val,label,tone,on){ return '<button type="button" class="chip" role="radio" data-tone data-'+attr+'="'+esc(val)+'" style="--tone:'+tone+'" aria-checked="'+on+'">'+esc(label)+'</button>'; };
  var placeBox=editing?
    '<div class="fld" id="boxPlace"><span class="lb">가게 정보 <small>(선택)</small></span>'+
      '<div class="pi"><label class="pi-lb" for="piAddr">📍 주소</label><input class="in" id="piAddr" maxlength="80" placeholder="예) 경기 안산시 단원구 중앙대로 929" autocomplete="off"></div>'+
      '<div class="pi"><span class="pi-lb" id="lbPiH">🕒 영업</span>'+
        '<div class="two" id="piTimes"><div><span class="lb pi-sm">여는 시간</span><button type="button" class="in pick" id="piOpen" aria-haspopup="dialog" aria-label="여는 시간 선택"></button></div>'+
        '<div><span class="lb pi-sm">닫는 시간</span><button type="button" class="in pick" id="piClose" aria-haspopup="dialog" aria-label="닫는 시간 선택"></button></div></div></div>'+
      '<div class="pi"><span class="pi-lb" id="lbPiP">🅿️ 주차</span>'+
        '<div class="chips" role="radiogroup" aria-labelledby="lbPiP" id="gPark">'+radio('park','yes','주차 가능','var(--mint)',pi.parking==='yes')+radio('park','no','주차 불가','#FFD7DD',pi.parking==='no')+'</div>'+
        '<div class="chips" role="radiogroup" aria-label="주차 요금" id="gFee">'+radio('fee','free','무료','var(--mint)',pi.fee==='free')+radio('fee','paid','유료','var(--mint)',pi.fee==='paid')+'</div>'+
        '<input class="in" id="piPark" maxlength="80" placeholder="예) 건물 지하 주차장, 최초 60분 무료" aria-label="주차 안내" autocomplete="off"></div>'+
    '</div>':'';
  var back=editing?'#/event/'+editing.id:'#/';
  app.innerHTML=
  '<div class="wrap">'+
    '<a class="back" href="'+back+'">← '+(editing?'일정으로':'일기장으로')+'</a>'+
    '<div class="paper page"><div class="spiral" aria-hidden="true"></div>'+
      '<h1>'+(editing?'일정 수정':'일정 등록')+'</h1>'+
      '<form id="f" novalidate>'+
        (editing?
          /* 수정 화면: 카테고리는 보여주기만 하고 제목은 고칠 수 있음 */
          '<div class="fld"><span class="lb">어떤 일정이에요?</span><p class="ro">'+badge(editing)+'</p><p class="sub">카테고리는 등록한 뒤에는 바꿀 수 없어요.</p></div>'+
          '<div class="fld"><label for="title">제목</label><input class="in" id="title" maxlength="40" autocomplete="off"></div>'
        :
          '<div class="fld"><span class="lb" id="lbCat">어떤 일정이에요?</span><div class="chips" role="group" aria-labelledby="lbCat" id="gCat">'+catChips+'</div>'+
            '<div class="chips sub-chips" role="radiogroup" aria-label="세부 종류 (선택)" id="gSub"></div>'+
            '<div class="chips sub-chips" role="radiogroup" id="gSub2"></div></div>'+
          '<div class="fld"><label for="title">제목</label><input class="in" id="title" maxlength="40" placeholder="예) 도자기 공방 원데이 클래스" autocomplete="off"></div>')+
        '<div class="fld"><span class="lb" id="lbWhen">언제예요?</span>'+
          '<div class="chips" role="group" aria-labelledby="lbWhen" id="gMode">'+
            '<button type="button" class="chip" data-tone data-mode="date" style="--tone:var(--yellow)" aria-pressed="'+(f.mode==='date')+'">날짜를 정했어요</button>'+
            '<button type="button" class="chip" data-tone data-mode="season" style="--tone:var(--yellow)" aria-pressed="'+(f.mode==='season')+'">아직 몰라요</button>'+
          '</div>'+
          '<div id="boxDate"><div class="two"><div><span class="lb" style="font-size:15px;color:var(--ink-soft)">날짜</span><button type="button" class="in pick" id="dateBtn" aria-haspopup="dialog" aria-label="날짜 선택"></button></div><div><span class="lb" style="font-size:15px;color:var(--ink-soft)">시간</span><button type="button" class="in pick" id="timeBtn" aria-haspopup="dialog" aria-label="시간 선택"></button></div></div></div>'+
          '<div id="boxSeason" style="margin-top:12px"><div class="chips" role="group" aria-label="계절" id="gSeason">'+seasonChips+'</div><p class="sub">정해지면 날짜와 시간을 수정해 주세요.</p></div>'+
        '</div>'+
        '<div class="fld"><label for="place">장소</label><input class="in" id="place" maxlength="60" placeholder="예) 서촌 흙놀이터" autocomplete="off"></div>'+
        '<div class="fld"><label for="link">링크</label><input class="in" id="link" inputmode="url" maxlength="300" placeholder="예) https://example.com" autocomplete="off"></div>'+
        placeBox+
        '<div class="fld"><label for="memo">메모</label><textarea class="in" id="memo" rows="4" maxlength="300" placeholder="준비물이나 하고 싶은 말을 적어 보세요"></textarea></div>'+
        (editing?'':'<div class="fld"><span class="lb" id="lbBy">누가 적었어요?</span><div class="chips" role="group" aria-labelledby="lbBy" id="gBy">'+whoChips+'</div></div>')+
        '<p class="err" id="err" role="alert"></p>'+
        '<div class="actions"><button type="submit" class="btn primary">'+(editing?'수정 저장':'등록하기')+'</button><a class="btn" href="'+back+'">취소</a></div>'+
      '</form>'+
    '</div>'+
  '</div>';

  $('#title').value=f.title;
  syncPick(); $('#place').value=f.place; $('#memo').value=f.memo; $('#link').value=f.link;

  /* 하위 카테고리: 라디오처럼 하나만 고르고, 고른 것을 다시 누르면 선택 해제 */
  function drawSubs(){
    var subs=CATS[f.cat].subs, s=subs[f.sub], opts=s?s.opts:[];
    $('#gSub').innerHTML=Object.keys(subs).map(function(k){ return radio('sub',k,subs[k].emoji+' '+subs[k].name,subs[k].color,f.sub===k); }).join('');
    $('#gSub2').hidden=!opts.length;
    $('#gSub2').setAttribute('aria-label',(s?s.name:'')+' 종류 (선택)');
    $('#gSub2').innerHTML=opts.map(function(o){ return radio('sub2',o,o,s.color,f.sub2===o); }).join('');
  }
  function radioGroup(sel,attr,get,set){
    $(sel).addEventListener('click',function(ev){
      var b=ev.target.closest('[data-'+attr+']'); if(!b) return;
      var v=b.getAttribute('data-'+attr);
      set(get()===v?'':v);
      $(sel).querySelectorAll('[data-'+attr+']').forEach(function(x){ x.setAttribute('aria-checked',String(x.getAttribute('data-'+attr)===get())); });
    });
  }
  if(!editing){
    drawSubs();
    $('#gSub').addEventListener('click',function(ev){
      var b=ev.target.closest('[data-sub]'); if(!b) return;
      var k=b.getAttribute('data-sub');
      f.sub=f.sub===k?'':k; f.sub2='';
      drawSubs(); $('#gSub [data-sub="'+k+'"]').focus();
    });
    radioGroup('#gSub2','sub2',function(){ return f.sub2; },function(v){ f.sub2=v; });
  }

  function syncMode(){ $('#boxDate').hidden=f.mode!=='date'; $('#boxSeason').hidden=f.mode!=='season'; }
  syncMode();
  function group(sel,attr,key,after){
    $(sel).querySelectorAll('['+'data-'+attr+']').forEach(function(b){
      b.addEventListener('click',function(){
        f[key]=b.getAttribute('data-'+attr);
        $(sel).querySelectorAll('['+'data-'+attr+']').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)); });
        if(after) after();
      });
    });
  }
  group('#gMode','mode','mode',syncMode); group('#gSeason','season','season');
  if(!editing){ group('#gCat','cat','cat',function(){ f.sub=''; f.sub2=''; drawSubs(); }); group('#gBy','by','by'); }

  function syncPick(){
    $('#dateBtn').innerHTML=(f.date?esc(fmtDate(f.date)):'<span class="ph">날짜 선택</span>')+'<span aria-hidden="true">📅</span>';
    $('#timeBtn').innerHTML=(f.time?esc(fmtTime(f.time)):'<span class="ph">시간 선택</span>')+'<span aria-hidden="true">🕒</span>';
  }
  $('#dateBtn').addEventListener('click',function(){ pickDate(f.date,this,function(v){ f.date=v; syncPick(); }); });
  $('#timeBtn').addEventListener('click',function(){ pickTime(f.time,this,function(v){ f.time=v; syncPick(); }); });

  /* 가게 정보: 수정 화면에서 링크가 있을 때만 */
  if(editing){
    var syncPlaceBox=function(){ $('#boxPlace').hidden=!$('#link').value.trim(); };
    var syncPi=function(){
      $('#piOpen').innerHTML=(pi.open?esc(fmtTime(pi.open)):'<span class="ph">시간 선택</span>')+'<span aria-hidden="true">🕒</span>';
      $('#piClose').innerHTML=(pi.close?esc(fmtTime(pi.close)):'<span class="ph">시간 선택</span>')+'<span aria-hidden="true">🕒</span>';
      $('#gFee').hidden=pi.parking!=='yes';
    };
    $('#piAddr').value=pi.address||''; $('#piPark').value=pi.parkingNote||'';
    syncPlaceBox(); syncPi();
    $('#link').addEventListener('input',syncPlaceBox);
    $('#piOpen').addEventListener('click',function(){ pickTime(pi.open,this,function(v){ pi.open=v; syncPi(); }); });
    $('#piClose').addEventListener('click',function(){ pickTime(pi.close,this,function(v){ pi.close=v; syncPi(); }); });
    radioGroup('#gPark','park',function(){ return pi.parking; },function(v){ pi.parking=v; if(v!=='yes') pi.fee=''; syncPi(); });
    radioGroup('#gFee','fee',function(){ return pi.fee; },function(v){ pi.fee=v; });
  }

  $('#f').addEventListener('submit',function(ev){
    ev.preventDefault();
    var title=$('#title').value.trim(), date=f.date, time=f.time, err=$('#err');
    if(!title){ err.textContent='제목을 입력해 주세요.'; $('#title').focus(); return; }
    if(f.mode==='date'&&!date){ err.textContent='날짜를 선택해 주세요. 아직 정하지 않았다면 "아직 몰라요"를 눌러 주세요.'; $('#dateBtn').focus(); return; }
    var link=$('#link').value.trim();
    if(link){
      if(!/^[a-z][a-z0-9+.-]*:/i.test(link)) link='https://'+link;
      var okLink=false;
      try{ var u=new URL(link); okLink=(u.protocol==='http:'||u.protocol==='https:')&&u.hostname.indexOf('.')>0; }catch(x){}
      if(!okLink){ err.textContent='올바른 링크를 입력해 주세요. 예) https://example.com'; $('#link').focus(); return; }
    }
    var placeInfo=null;
    if(editing&&link){
      var p={address:$('#piAddr').value.trim(),open:pi.open,close:pi.close,closed:false,parking:pi.parking,fee:pi.parking==='yes'?pi.fee:'',parkingNote:$('#piPark').value.trim()};
      if(p.address||p.open||p.close||p.parking||p.parkingNote) placeInfo=p;
    }
    var obj={
      id:editing?editing.id:'e'+Date.now().toString(36),
      title:title,cat:f.cat,sub:f.sub,sub2:f.sub2,image:editing&&editing.image?editing.image:'',weather:editing&&editing.weather?editing.weather:'',dayMemo:editing&&editing.dayMemo?editing.dayMemo:'',dayNotes:editing&&editing.dayNotes?editing.dayNotes:[],link:link,placeInfo:placeInfo,
      date:f.mode==='date'?date:'', time:f.mode==='date'?time:'',
      season:f.mode==='season'?f.season:'',
      place:$('#place').value.trim(), memo:$('#memo').value.trim(), by:f.by
    };
    if(editing) events=events.map(function(x){ return x.id===obj.id?obj:x; }); else events.push(obj);
    save(); push('save',obj.id);
    if(obj.date){ var d=parse(obj.date); state.month={y:d.getFullYear(),m:d.getMonth()}; state.sel=obj.date; state.mode='cal'; }
    toast(editing?'수정했어요':'등록했어요');
    location.hash=editing?'#/event/'+obj.id:'#/';
  });
}

/* ---------- pickers ---------- */
var modalOpener=null, modalOnClose=null;
function dismissModal(){ var cb=modalOnClose; closeModal(); if(cb) cb(); }
function escKey(e){ if(e.key==='Escape') dismissModal(); }
function closeModal(){
  var ov=$('#ov'); if(!ov) return;
  ov.remove(); document.removeEventListener('keydown',escKey);
  document.body.style.overflow=''; modalOnClose=null;
  var o=modalOpener; modalOpener=null;
  if(o&&o.isConnected) o.focus();
}
function openModal(label,opener,onClose,kind){
  closeModal(); modalOpener=opener||null; modalOnClose=onClose||null;
  var ov=document.createElement('div'); ov.className='ov'+(kind==='detail'?' detail':''); ov.id='ov'; ov.dataset.kind=kind||'sheet';
  ov.innerHTML=kind==='detail'
    ?'<div class="dbox" role="dialog" aria-modal="true" aria-label="'+label+'"></div>'
    :'<div class="sheet paper" role="dialog" aria-modal="true" aria-label="'+label+'"></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){ if(e.target===ov) dismissModal(); });
  document.addEventListener('keydown',escKey);
  document.body.style.overflow='hidden';
  return ov.firstChild;
}
function detailBox(){
  var ov=$('#ov');
  if(!ov||ov.dataset.kind!=='detail') return openModal('일정 상세',null,function(){ location.hash='#/'; },'detail');
  return ov.querySelector('.dbox');
}

function pickDate(cur,opener,done,min){ /* min(YYYY-MM-DD)보다 이른 날은 고를 수 없음 */
  var sh=openModal('날짜 선택',opener);
  var base=cur?parse(cur):new Date(), y=base.getFullYear(), m=base.getMonth(), first=true;
  function draw(){
    var t=todayStr(), lead=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate(), cells='', i, d;
    for(i=0;i<lead;i++) cells+='<span></span>';
    for(d=1;d<=dim;d++){
      var ds=y+'-'+pad(m+1)+'-'+pad(d);
      cells+='<button type="button" class="pd'+(ds===cur?' sel':'')+(ds===t?' today':'')+'" data-d="'+ds+'" aria-label="'+(m+1)+'월 '+d+'일"'+(min&&ds<min?' disabled':'')+'>'+d+'</button>';
    }
    sh.innerHTML=
      '<div class="cal-head"><button type="button" class="round" data-nav="-1" aria-label="이전 달"'+(min&&y+'-'+pad(m+1)<=min.slice(0,7)?' disabled':'')+'>‹</button><h2>'+y+'년 '+(m+1)+'월</h2><button type="button" class="round" data-nav="1" aria-label="다음 달">›</button></div>'+
      '<div class="dow"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="pgrid">'+cells+'</div>'+
      '<div class="actions"><button type="button" class="btn" data-today>오늘 선택</button><button type="button" class="btn" data-close>닫기</button></div>';
    sh.querySelectorAll('[data-nav]').forEach(function(b){ b.addEventListener('click',function(){
      var nd=new Date(y,m+Number(b.dataset.nav),1); y=nd.getFullYear(); m=nd.getMonth(); draw();
      var nb=sh.querySelector('[data-nav="'+b.dataset.nav+'"]'); if(nb) nb.focus();
    }); });
    sh.querySelectorAll('.pd').forEach(function(b){ b.addEventListener('click',function(){ var v=b.dataset.d; closeModal(); done(v); }); });
    sh.querySelector('[data-today]').addEventListener('click',function(){ closeModal(); done(todayStr()); });
    sh.querySelector('[data-close]').addEventListener('click',closeModal);
    if(first){ first=false; var f0=sh.querySelector('.pd.sel:not(:disabled)')||sh.querySelector('.pd.today')||sh.querySelector('.pd:not(:disabled)'); if(f0) f0.focus(); }
  }
  draw();
}

function pickTime(cur,opener,done){
  var sh=openModal('시간 선택',opener);
  var H,mi;
  if(cur){ var p=cur.split(':'); H=+p[0]; mi=+p[1]; } else { H=(new Date().getHours()+1)%24; mi=0; }
  var ap=H<12?'오전':'오후', h=H%12||12, step='h', first=true;
  function val(){ return pad((h%12)+(ap==='오후'?12:0))+':'+pad(mi); }
  function draw(){
    var R=92, c=120, btns='', i;
    for(i=1;i<=12;i++){
      var v=step==='h'?i:(i%12)*5, a=(i*30-90)*Math.PI/180;
      var x=c+R*Math.cos(a), y=c+R*Math.sin(a), on=step==='h'?v===h:v===mi;
      btns+='<button type="button" class="'+(on?'on':'')+'" style="left:'+x.toFixed(1)+'px;top:'+y.toFixed(1)+'px" data-v="'+v+'" aria-label="'+(step==='h'?v+'시':v+'분')+'">'+(step==='h'?v:pad(v))+'</button>';
    }
    var deg=step==='h'?(h%12)*30:mi*6, ha=(deg-90)*Math.PI/180;
    var hx=(c+R*Math.cos(ha)).toFixed(1), hy=(c+R*Math.sin(ha)).toFixed(1);
    function chip(attr,val2,label,pressed){ return '<button type="button" class="chip" data-tone style="--tone:var(--yellow)" '+attr+'="'+val2+'" aria-pressed="'+pressed+'">'+label+'</button>'; }
    sh.innerHTML=
      '<div class="chips tdisp">'+chip('data-ap','오전','오전',ap==='오전')+chip('data-ap','오후','오후',ap==='오후')+'<span class="sep"></span>'+chip('data-step','h',h+'시',step==='h')+chip('data-step','m',pad(mi)+'분',step==='m')+'</div>'+
      '<div class="clock"><svg viewBox="0 0 240 240" width="240" height="240" aria-hidden="true"><circle cx="120" cy="120" r="116" fill="#fff" stroke="#2A2724" stroke-width="3"/><line x1="120" y1="120" x2="'+hx+'" y2="'+hy+'" stroke="#2A2724" stroke-width="2.5" stroke-linecap="round"/><circle cx="120" cy="120" r="5" fill="#2A2724"/></svg>'+btns+'</div>'+
      '<div class="actions"><button type="button" class="btn" data-clear>시간 지우기</button><button type="button" class="btn primary" data-ok>확인</button></div>';
    sh.querySelectorAll('[data-ap]').forEach(function(b){ b.addEventListener('click',function(){ ap=b.dataset.ap; draw(); }); });
    sh.querySelectorAll('[data-step]').forEach(function(b){ b.addEventListener('click',function(){ step=b.dataset.step; draw(); }); });
    sh.querySelectorAll('.clock button').forEach(function(b){ b.addEventListener('click',function(){
      var v=Number(b.dataset.v);
      if(step==='h'){ h=v; step='m'; } else { mi=v; }
      draw();
    }); });
    sh.querySelector('[data-clear]').addEventListener('click',function(){ closeModal(); done(''); });
    sh.querySelector('[data-ok]').addEventListener('click',function(){ var v=val(); closeModal(); done(v); });
    if(first){ first=false; var f0=sh.querySelector('.clock button.on')||sh.querySelector('.clock button'); if(f0) f0.focus(); }
  }
  draw();
}

/* ---------- router ---------- */
function route(){
  closeModal();
  if(ONLINE&&!roomKey()){ renderLock(); return; }
  var raw=location.hash.replace(/^#\/?/,''), parts=raw.split('?'), seg=parts[0].split('/').filter(Boolean);
  var q=new URLSearchParams(parts[1]||'');
  if($('#bookBody')) state.scroll=window.scrollY;
  if(io){ io.disconnect(); io=null; }
  if(seg[0]==='event'){
    if(!$('#bookBody')){ renderMain(); window.scrollTo(0,state.scroll); }
    renderDetail(seg[1]);
    return;
  }
  var isMain=false;
  if(seg[0]==='new') renderForm(null,q.get('date'));
  else if(seg[0]==='edit') renderForm(seg[1]);
  else { renderMain(); isMain=true; }
  window.scrollTo(0,isMain?state.scroll:0);
}
/* ---------- 함께 쓰기 (Supabase) ----------
   일정은 이 기기(localStorage)에 먼저 저장하고, 서버(Supabase)로 보내 둘이 같은 일정을 봄.
   - 앱을 열거나 다시 화면에 띄울 때 서버의 일정 전체를 받아옴 (pull)
   - 등록·수정·삭제는 "보낼 목록"에 쌓아 두고 차례로 보냄 (push → flush). 인터넷이 없으면 연결될 때 다시 보냄
   - 방 비밀번호는 서버 함수가 확인함. 맞으면 이 기기에 기억해 두고 다음부터 묻지 않음
   config.js 에 SUPABASE_URL 이 없으면(미리보기 등) 서버 없이 이 기기에서만 동작함 */
var ONLINE=typeof SUPABASE_URL==='string'&&!!SUPABASE_URL;
var ROOM=typeof ROOM_ID==='string'&&ROOM_ID?ROOM_ID:'twodate';
var PASS_KEY='couple-diary-room-key', PENDING_KEY='couple-diary-pending', SYNCED_KEY='couple-diary-synced';
function getLS(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function setLS(k,v){ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} }
function roomKey(){ return getLS(PASS_KEY)||''; }
function rpc(fn,args){
  return fetch(SUPABASE_URL+'/rest/v1/rpc/'+fn,{
    method:'POST',
    headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(args)
  }).then(function(r){
    if(r.ok) return r.status===204?null:r.json();
    return r.json().catch(function(){ return {}; }).then(function(j){ var e=new Error(j.message||('HTTP '+r.status)); e.code=j.code; e.status=r.status; throw e; });
  });
}
function wrongKey(err){ return err&&err.code==='28000'; }
function lockOut(){
  setLS(PASS_KEY,null); closeModal();
  renderLock('방 비밀번호가 바뀌었어요. 새 비밀번호를 입력해 주세요.');
}
function pending(){ try{ return JSON.parse(getLS(PENDING_KEY))||[]; }catch(e){ return []; } }
function setPending(a){ setLS(PENDING_KEY,JSON.stringify(a)); }
/* 바뀐 일정을 보낼 목록에 넣고 보내기. 같은 일정은 마지막 변경만 남김 */
function push(op,id){
  if(!ONLINE) return;
  var a=pending().filter(function(x){ return x.id!==id; });
  a.push({op:op,id:id,t:Date.now()+Math.random()});
  setPending(a); flush();
}
var flushing=false;
function flush(){
  if(!ONLINE||flushing||!roomKey()) return Promise.resolve();
  var x=pending()[0]; if(!x) return Promise.resolve();
  var ev=events.filter(function(e){ return e.id===x.id; })[0];
  flushing=true;
  var call=(x.op==='del'||!ev)?rpc('twodate_delete_event',{p_room:ROOM,p_key:roomKey(),p_id:x.id})
                              :rpc('twodate_save_event',{p_room:ROOM,p_key:roomKey(),p_event:ev});
  return call.then(function(){
    setPending(pending().filter(function(y){ return y.t!==x.t; }));
    flushing=false; return flush();
  },function(err){
    flushing=false; if(wrongKey(err)) lockOut();
  });
}
/* 서버 일정을 받아와 이 기기 일정과 합침. 아직 못 보낸 변경은 이 기기 쪽을 우선 */
function pull(){
  if(!ONLINE||!roomKey()) return Promise.resolve();
  return rpc('twodate_list_events',{p_room:ROOM,p_key:roomKey()}).then(function(list){
    var local={}; events.forEach(function(e){ local[e.id]=e; });
    if(!getLS(SYNCED_KEY)){
      /* 이 기기에서 처음 연결: 예시 일정(s1…)을 뺀, 이 기기에만 있던 일정을 서버로 올림 */
      var a=pending();
      events.forEach(function(e){ if(!/^s\d+$/.test(e.id)&&!a.some(function(x){ return x.id===e.id; })) a.push({op:'save',id:e.id,t:Date.now()+Math.random()}); });
      setPending(a); setLS(SYNCED_KEY,'1');
    }
    var p=pending(), mine={}; p.forEach(function(x){ mine[x.id]=x.op; });
    var next=(list||[]).filter(function(e){ return e&&e.id&&!mine[e.id]; });
    var srv={}; (list||[]).forEach(function(e){ if(e&&e.id) srv[e.id]=e; });
    Object.keys(mine).forEach(function(id){
      if(mine[id]!=='save'||!local[id]) return;
      if(srv[id]) local[id].dayNotes=mergeNotes(local[id].dayNotes,srv[id].dayNotes);
      next.push(local[id]);
    });
    events=migrate(next); save();
    refresh();
    return flush();
  },function(err){ if(wrongKey(err)) lockOut(); });
}
/* 받아온 일정을 화면에 반영. 입력 중인 화면(등록·수정)이나 열린 팝업은 건드리지 않음 */
function refresh(){
  var nl=$('#notesList'), m=location.hash.match(/^#\/event\/(.+)$/);
  if(nl&&m){ var ev=events.filter(function(x){ return x.id===decodeURIComponent(m[1]); })[0]; if(ev) nl.innerHTML=notesHTML(ev); }
  if($('#lockF')||$('#ov')) return;
  var raw=location.hash.replace(/^#\/?/,'');
  if(raw===''&&$('#bookBody')){ var y=window.scrollY; renderMain(); window.scrollTo(0,y); }
}

/* ---------- 방 비밀번호 ---------- */
var started=false;
function start(){
  if(!started){
    started=true;
    window.addEventListener('hashchange',route);
    window.addEventListener('online',function(){ pull(); });
    document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') pull(); });
  }
  route(); pull();
}
function renderLock(msg){
  app.innerHTML=
  '<div class="wrap lock">'+
    '<form class="paper page lock-box" id="lockF" novalidate><div class="spiral" aria-hidden="true"></div>'+
      '<svg class="lock-heart" aria-hidden="true"><use href="#heart"/></svg>'+
      '<h1>투데이트</h1>'+
      '<div class="fld"><label for="roomPw">방 비밀번호</label>'+
      '<input class="in" id="roomPw" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false"></div>'+
      '<p class="err" id="lockErr" role="alert">'+esc(msg||'')+'</p>'+
      '<div class="actions"><button type="submit" class="btn primary" id="lockBtn">들어가기</button></div>'+
    '</form>'+
  '</div>';
  var input=$('#roomPw'); input.focus();
  $('#lockF').addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=input.value.trim(), err=$('#lockErr'), btn=$('#lockBtn');
    if(!v){ err.textContent='비밀번호를 입력해 주세요.'; input.focus(); return; }
    btn.disabled=true; err.textContent='';
    rpc('twodate_check_room',{p_room:ROOM,p_key:v}).then(function(ok){
      btn.disabled=false;
      if(ok!==true){ err.textContent='비밀번호가 달라요. 다시 입력해 주세요.'; input.select(); return; }
      setLS(PASS_KEY,v); start();
    },function(e){
      btn.disabled=false;
      /* 서버가 오류로 답했으면 그 내용을, 아예 닿지 못했으면 연결 안내를 보여줌 */
      err.textContent=e&&e.status?'서버가 요청을 받지 않았어요 ('+e.status+(e.code?' · '+e.code:'')+'): '+e.message
                                   :'서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';
      console.error('twodate_check_room',e);
    });
  });
}
if(!ONLINE||roomKey()) start(); else renderLock();

/* ---------- 앱 설치·오프라인 ---------- */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
}
})();
