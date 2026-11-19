/* PM Launchpad 2.0 — app logic. Vanilla JS, no build step. */

let curWk=1, curPhase=1, curTab='hall', curVideoYear=1, curFilter='all';

const LS={
  get:(k,d)=>{try{const v=localStorage.getItem('pml_'+k);return v!==null?JSON.parse(v):d;}catch(e){return d;}},
  set:(k,v)=>{try{localStorage.setItem('pml_'+k,JSON.stringify(v));}catch(e){}}
};
const $=id=>document.getElementById(id);

/* ═══════════════════════════════════════════
   HASH-BASED ROUTING & NAVIGATION HISTORY
   ═══════════════════════════════════════════ */
const NAV_HISTORY=[];
function pushNav(hash){
  if(NAV_HISTORY[NAV_HISTORY.length-1]!==hash)NAV_HISTORY.push(hash);
}
function navTo(tab,sub,evt){
  const hash=sub?tab+'/'+sub:tab;
  window.location.hash=hash;
}
function handleRoute(){
  const raw=(window.location.hash||'#hall').slice(1);
  const parts=raw.split('/');
  const tab=parts[0]||'hall';
  const sub=parts.slice(1).join('/');
  pushNav(raw);
  showTab(tab,sub);
}
function goBack(){
  if(NAV_HISTORY.length>1){NAV_HISTORY.pop();const prev=NAV_HISTORY[NAV_HISTORY.length-1]||'hall';window.location.hash=prev;}
  else{window.location.hash='hall';}
}
window.addEventListener('hashchange',handleRoute);

function showTab(t,sub){
  if($('book-modal')&&!$('book-modal').hidden)closeBook();
  if($('mock-modal')&&!$('mock-modal').hidden)closeMock();
  if($('locker-modal')&&!$('locker-modal').hidden)closeLocker();
  closeSheet();
  curTab=t;
  document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('on',el.id==='tab-'+t));
  document.querySelectorAll('[data-t]').forEach(el=>el.classList.toggle('on',el.dataset.t===t));
  updateBreadcrumb(t,sub);
  if(t==='hall'){renderHall();window.scrollTo(0,0);}
  else if(t==='curriculum')renderWeekTasks();
  else if(t==='pensieve')renderVideos();
  else if(t==='library')renderLibrary();
  else if(t==='owl')renderJobs(curFilter);
  else if(t==='goblet')renderKanban();
  else if(t==='duel')renderCoach();
  else if(t==='hogsmeade')renderFun();
  else if(t==='vault')renderVault();
  else if(t==='competency')renderCompetency();
  else if(t==='knowledge')renderKnowledge();
  else if(t==='settings')renderSettings();
  else if(t==='timer')renderTimer();
  else if(t==='journal')renderJournal();
  else if(t==='analytics')renderAnalytics();
  else if(t==='owlexam')renderOwlExam();
  else if(t==='mentor')renderMentor();
  if(t!=='hall')window.scrollTo(0,0);
}

function sw(t,evt){
  flyOwl(evt);
  navTo(t);
}
function openSheet(){$('more-sheet').hidden=false;}
function closeSheet(){const s=$('more-sheet');if(s)s.hidden=true;}
function sheetGo(t,evt){closeSheet();sw(t,evt);}

/* BREADCRUMB */
const TAB_NAMES={hall:'Great Hall',curriculum:'Curriculum',pensieve:'The Pensieve',library:'The Library',owl:'Owl Post',goblet:'Goblet of Fire',duel:'Duelling Club',hogsmeade:'Hogsmeade',prd:'The Decree',vault:'Portfolio Vault',competency:'Competency',knowledge:'Knowledge Vault',settings:'Settings',timer:'Study Timer',journal:'Decision Journal',analytics:'Analytics',owlexam:'O.W.L. Exam',mentor:'AI Mentor'};
function updateBreadcrumb(tab,sub){
  const bc=$('breadcrumb');
  if(!bc)return;
  if(tab==='hall'){bc.innerHTML='';bc.hidden=true;return;}
  bc.hidden=false;
  let html='<span class="bc-link" onclick="navTo(\'hall\')">Great Hall</span><span class="bc-sep">›</span>';
  html+='<span class="bc-cur">'+(TAB_NAMES[tab]||tab)+'</span>';
  bc.innerHTML=html;
}

/* points + streak */
function points(){return LS.get('points',0);}
function addPoints(n){LS.set('points',points()+n);animateCount();spawnSparkles();}
function animateCount(){
  const target=points();
  ['sb-ptn','pc-pts','tb-pts'].forEach(id=>{
    const el=$(id); if(!el) return;
    const from=parseInt(el.textContent)||0;
    const start=performance.now(), dur=600;
    function step(t){const p=Math.min(1,(t-start)/dur);const v=Math.round(from+(target-from)*p);el.textContent=v;if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  });
}
function streakObj(){return LS.get('streak',{last:'',n:0});}
function renderStreak(){const s=streakObj();const today=new Date().toDateString();const n=today===s.last?s.n:(s.n||0);const a=$('pc-streak');if(a)a.textContent=n;const b=$('sb-streak');if(b)b.textContent=n+'-day streak';}
function markStudied(){const s=streakObj();const today=new Date().toDateString();if(s.last!==today){const y=new Date(Date.now()-86400000).toDateString();s.n=s.last===y?(s.n||0)+1:1;s.last=today;LS.set('streak',s);renderStreak();}const log=LS.get('streak_log',{});log[today]=true;LS.set('streak_log',log);}

function loadState(){curWk=LS.get('wk',1);curPhase=Math.ceil(curWk/4);const th=LS.get('theme','');if(th)document.documentElement.setAttribute('data-theme',th);}

/* TOAST NOTIFICATION */
function toast(msg,type){
  const t=document.createElement('div');
  t.className='toast toast-'+(type||'info');
  t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},2500);
}

function flyOwl(evt){
  if(!evt||window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const src=evt.target.closest('[data-t]')||evt.target;
  const r=src.getBoundingClientRect();
  const sx=r.left+r.width/2, sy=r.top+r.height/2;
  const dx=window.innerWidth/2-sx, dy=window.innerHeight*0.3-sy;
  const owl=document.createElement('div');
  owl.className='owl-fly';
  owl.textContent='\u{1F989}';
  owl.style.left=sx+'px'; owl.style.top=sy+'px';
  owl.style.setProperty('--dx',dx+'px'); owl.style.setProperty('--dy',dy+'px');
  owl.style.setProperty('--ox1',(dx*0.3)+'px'); owl.style.setProperty('--oy1',(dy*0.3-40)+'px');
  owl.style.setProperty('--ox2',(dx*0.7)+'px'); owl.style.setProperty('--oy2',(dy*0.7+20)+'px');
  document.body.appendChild(owl);
  owl.addEventListener('animationend',()=>owl.remove());
}

/* ═══════════════════════════════════════════
   GREAT HALL DASHBOARD
   ═══════════════════════════════════════════ */
function renderHall(){
  const d=new Date();
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const h=d.getHours();
  $('greet').textContent=(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', Ujjwal';
  $('greet-date').textContent=`${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const wk=WEEKS[curWk]||WEEKS[1];
  $('today-year').textContent=wk.phase;
  $('today-task').textContent=wk.tasks[0].t;
  $('today-time').textContent=wk.tasks[0].m;
  $('today-phase').textContent=PHASE_LABELS[wk.phase];
  const pct=Math.round((curWk-1)/16*100);
  $('prog-pct').textContent=pct+'%';
  requestAnimationFrame(()=>{$('prog-bar').style.width=pct+'%';});
  $('prog-label').textContent=`Year ${curPhase} · Week ${curWk} of 16`;
  document.querySelectorAll('#tab-hall .yr').forEach((p,i)=>{p.classList.remove('done','cur');if(i+1<curPhase)p.classList.add('done');else if(i+1===curPhase)p.classList.add('cur');});
  $('sb-wk').textContent='W'+curWk;
  renderStreak(); animateCount();
  renderReadingProgress();
  renderCompetencyMini();
  if(!document.querySelector('.hall-ornament-tl')){
    var hall=$('tab-hall');
    if(hall){hall.insertAdjacentHTML('afterbegin','<div class="hall-ornament hall-ornament-tl">✦</div><div class="hall-ornament hall-ornament-tr">✦</div>');}
  }
  $('jprev').innerHTML=JOBS.slice(0,3).map(j=>{
    const fc=j.fit>=80?'c-ok':j.fit>=65?'c-wa':'c-mu';
    return `<div class="jp" onclick="navTo('owl')"><div class="jp-logo" style="background:${j.logobg}">${j.logo}</div><div style="flex:1;min-width:0;"><div class="jp-role">${j.role}</div><div class="jp-co">${j.co}</div></div><div class="jp-fit ${fc}">${j.fit}%</div></div>`;
  }).join('');
}
function renderReadingProgress(){
  const el=$('hall-reading');if(!el)return;
  const all=allBooks();const prog=LS.get('bookprog',{});
  let reading=0,done=0;
  all.forEach(b=>{const p=prog[b.title]!==undefined?prog[b.title]:b.pct;if(p>=100)done++;else if(p>0)reading++;});
  el.innerHTML=`<div class="mini-stat"><span class="mini-num">${done}</span><span class="mini-lbl">books done</span></div><div class="mini-stat"><span class="mini-num">${reading}</span><span class="mini-lbl">reading</span></div><div class="mini-stat"><span class="mini-num">${all.length-done-reading}</span><span class="mini-lbl">to start</span></div>`;
}
function renderCompetencyMini(){
  const el=$('hall-competency');if(!el)return;
  const scores=LS.get('competency',{});
  const cats=['discovery','strategy','execution','analytics','technical','communication','leadership','design','experimentation'];
  const labels=['Discovery','Strategy','Execution','Analytics','Technical','Communication','Leadership','Design','Experimentation'];
  let total=0,count=0,weakest='',weakVal=999;
  cats.forEach((c,i)=>{const s=scores[c]||0;total+=s;count++;if(s<weakVal){weakVal=s;weakest=labels[i];}});
  const avg=count?Math.round(total/count):0;
  el.innerHTML=`<div class="mini-stat"><span class="mini-num">${avg}<small>%</small></span><span class="mini-lbl">avg competency</span></div><div class="mini-stat"><span class="mini-num weak-txt">${weakest||'—'}</span><span class="mini-lbl">needs work</span></div>`;
}

/* ═══════════════════════════════════════════
   CURRICULUM
   ═══════════════════════════════════════════ */
function switchPhase(p){curPhase=p;curWk=(p-1)*4+1;LS.set('wk',curWk);document.querySelectorAll('[data-p]').forEach(el=>el.classList.toggle('on',+el.dataset.p===p));renderWeekTasks();$('sb-wk').textContent='W'+curWk;}
function changeWk(d){curWk=Math.max(1,Math.min(16,curWk+d));curPhase=Math.ceil(curWk/4);LS.set('wk',curWk);document.querySelectorAll('[data-p]').forEach(el=>el.classList.toggle('on',+el.dataset.p===curPhase));renderWeekTasks();$('sb-wk').textContent='W'+curWk;}
function renderWeekTasks(){
  const wk=WEEKS[curWk]||WEEKS[1];
  $('wk-ttl').textContent='Week '+curWk;
  $('wk-sub').textContent=wk.focus;
  $('wk-of').textContent=curWk+' / 16';
  const done=LS.get('tasks_'+curWk,[]);
  $('task-list').innerHTML=wk.tasks.map((t,i)=>{
    const dn=done[i];
    return `<div class="ti rise" style="animation-delay:${i*60}ms"><div class="tchk${dn?' done':''}" onclick="toggleTask(${i})">${dn?'✓':''}</div><div style="flex:1;min-width:0;"><div class="tittl${dn?' done':''}">${t.t}</div><div class="tisub">${t.s}</div></div><div class="titime">${t.m}</div></div>`;
  }).join('');
}
function toggleTask(i){markStudied();const done=LS.get('tasks_'+curWk,[]);const was=done[i];done[i]=!done[i];LS.set('tasks_'+curWk,done);if(!was){addPoints(5);toast('+5 house points!','ok');}renderWeekTasks();}

/* ═══════════════════════════════════════════
   PENSIEVE
   ═══════════════════════════════════════════ */
function switchVideoYear(y){curVideoYear=y;document.querySelectorAll('[data-vp]').forEach(el=>el.classList.toggle('on',+el.dataset.vp===y));renderVideos();}
function renderVideos(){
  const vids=VIDEOS[curVideoYear]||[];
  const quizDone=LS.get('quizdone',{});
  $('video-list').innerHTML=vids.map((v,i)=>{
    const key='y'+curVideoYear+'q'+i; const dn=quizDone[key];
    const tag=v.plat==='free'?'<span class="vtag free">✓ Ad-free</span>':'<span class="vtag yt">Plays in-app</span>';
    const watchBtn=v.plat==='free'
      ? `<a class="btn p" href="${v.url||'#'}" target="_blank" rel="noopener">▶ Open (ad-free)</a>`
      : `<button class="btn p" onclick="playVideo('${key}','${v.yt}')">▶ Watch here</button>`;
    return `<div class="vl${dn?' done':''}" id="vl-${key}"><div class="vnum">${i+1}</div>
      <div class="vt">${v.t}</div><div class="vsrc">${v.src}</div>
      <div class="vtags"><span class="vtag yr">Year ${curVideoYear}</span>${tag}<span class="vtag dur">${v.dur}</span></div>
      <div class="vacts">${watchBtn}<button class="btn g" onclick="toggleQuiz('${key}')">\u{1F52E} Cast the spell</button></div>
      <div id="frame-${key}"></div>
      <div class="quiz" id="quiz-${key}"><div class="qlbl">Concept check</div><div class="qq">${v.q.q}</div>
      ${v.q.opts.map((o,oi)=>`<button class="qopt" onclick="answerQuiz('${key}',${oi},${v.q.c})">${o}</button>`).join('')}
      <div class="qfb" id="fb-${key}"></div></div></div>`;
  }).join('');
}
function playVideo(key,ytid){
  const wrap=$('frame-'+key);
  if(!wrap) return;
  if(wrap.innerHTML.trim()!==''){wrap.innerHTML='';return;}
  wrap.innerHTML=`<div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0" title="video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
}
function toggleQuiz(key){$('quiz-'+key).classList.toggle('open');}
function answerQuiz(key,chosen,correct){
  const quiz=$('quiz-'+key); const opts=quiz.querySelectorAll('.qopt');
  opts.forEach(o=>{o.disabled=true;o.style.pointerEvents='none';});
  const fb=$('fb-'+key);
  const idx=parseInt(key.split('q')[1]);
  const why=VIDEOS[curVideoYear][idx].q.why;
  const qd=LS.get('quizdone',{}); const already=qd[key];
  if(chosen===correct){opts[chosen].classList.add('right');fb.className='qfb ok';fb.textContent=(already?'':'+10 points. ')+why;}
  else{opts[chosen].classList.add('wrong');opts[correct].classList.add('right');fb.className='qfb no';fb.textContent=why;}
  if(!already){qd[key]=true;LS.set('quizdone',qd);$('vl-'+key).classList.add('done');if(chosen===correct){addPoints(10);toast('+10 house points!','ok');}markStudied();}
}

/* ═══════════════════════════════════════════
   LIBRARY — Enhanced Bookshelf + Reader
   ═══════════════════════════════════════════ */
function allBooks(){let a=[];[1,2,3,4].forEach(p=>a=a.concat(BOOKS_BY_PHASE[p]));return a;}
let libSearch='';
function renderLibrary(){
  const all=allBooks(); const prog=LS.get('bookprog',{});
  const q=libSearch.toLowerCase();
  const filtered=q?all.filter(b=>b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q)):all;
  $('shelf-spines').innerHTML=all.map((b,i)=>{
    const h=108+((i*13)%42);
    const p=prog[b.title]!==undefined?prog[b.title]:b.pct;
    return `<div class="spine${p>=100?' spine-done':''}" style="background:${b.color};height:${h}px;" title="${b.title}" onclick="openBook('${encodeURIComponent(b.title)}')">${b.title}</div>`;
  }).join('');
  $('book-list').innerHTML=filtered.map((b,i)=>{
    const pct=prog[b.title]!==undefined?prog[b.title]:b.pct;
    const st=pct===0?'ns':pct>=100?'dn':'rd';
    const lbl={ns:'Not started',rd:'Reading',dn:'Done'}[st];
    const bookmarks=LS.get('bookmarks_'+b.title,[]);
    const bmIcon=bookmarks.length?`<span class="bm-indicator" title="${bookmarks.length} bookmarks">\u{1F516}${bookmarks.length}</span>`:'';
    const readBtn=b.pdf?`<button class="btn p" onclick="openBook('${encodeURIComponent(b.title)}')">\u{1F4D6} Read</button>`:`<button class="btn g" onclick="openBook('${encodeURIComponent(b.title)}')">＋ Add your PDF</button>`;
    return `<div class="bk rise" style="animation-delay:${i*45}ms"><div class="bksp" style="background:${b.color}">\u{1F4D6}</div><div style="flex:1;min-width:0;"><div class="bkttl">${b.title}${bmIcon}</div><div class="bkauth">${b.author}</div><div class="bktake">${b.take}</div>
      <div class="bkrow"><span class="bkst ${st}">${lbl}</span><div class="bkbar"><div class="bkfill" style="width:${pct}%"></div></div><span class="bkpct">${pct}%</span></div>
      <div class="bkacts">${readBtn}<a class="btn g" href="${b.buy}" target="_blank" rel="noopener">Buy / borrow</a></div></div></div>`;
  }).join('');
}
function searchLibrary(val){libSearch=val;renderLibrary();}

/* ═══════════════════════════════════════════
   PDF READER — Enhanced Kindle Experience
   ═══════════════════════════════════════════ */
let pdfDoc=null, pdfPage=1, pdfTitle='', readerZoom=100;
function openBook(encTitle){
  const title=decodeURIComponent(encTitle);
  const b=allBooks().find(x=>x.title===title); if(!b) return;
  pdfTitle=title;
  readerZoom=LS.get('reader_zoom',100);
  $('bk-title').textContent=title;
  $('bk-sub').textContent=b.author+' \xB7 '+b.take;
  const body=$('bk-body');
  if(b.pdf){
    body.innerHTML=`<div class="pdfbar">
      <button class="btn g rbtn" onclick="pdfPrev()" title="Previous page">‹ Prev</button>
      <span class="pdfpage" id="pdf-page">Summoning…</span>
      <button class="btn g rbtn" onclick="pdfNext()" title="Next page">Next ›</button>
      <button class="sticky-note-btn" id="sticky-btn" onclick="toggleStickyNote()" style="margin-left:auto">\u{1F4DD} Note</button>
      <button class="btn g rbtn" id="bk-bookmark" onclick="toggleBookmark()" title="Bookmark this page">\u{1F516}</button>
      <button class="btn g rbtn" onclick="readerZoomIn()" title="Zoom in">A+</button>
      <button class="btn g rbtn" onclick="readerZoomOut()" title="Zoom out">A–</button>
      <button class="btn g rbtn" onclick="toggleFullscreen()" title="Fullscreen">⛶</button>
      <button class="btn g rbtn" id="bk-save" onclick="saveBookProgress()">\u{1F4BE} Save</button>
    </div>
    <div class="pdf-progress"><div class="pdf-progress-fill" id="pdf-prog-fill"></div></div>
    <div class="page-container">
      <div class="page-zone page-zone-left" onclick="pdfPrev()"><span class="page-zone-hint">‹</span></div>
      <div class="page-zone page-zone-right" onclick="pdfNext()"><span class="page-zone-hint">›</span></div>
      <div class="page-scroll" id="pdf-text-wrap"><canvas id="pdf-canvas" style="display:none"></canvas></div>
    </div>`;
    $('book-modal').hidden=false;
    document.body.classList.add('book-open');
    loadPdf(b.pdf);
  }else{
    const notesHtml=b.notes?`<div class="booknotes">${formatNotes(b.notes)}</div>`:'';
    body.innerHTML=`${notesHtml}
      <div class="readrow"><label style="font-size:13px;color:var(--ink2);">Reading progress: <b id="man-pct">0</b>%</label>
      <input type="range" min="0" max="100" value="0" id="man-range" style="width:100%;margin-top:8px;" oninput="document.getElementById('man-pct').textContent=this.value">
      <div style="margin-top:10px;"><button class="btn p" onclick="saveManual()">Save progress</button> <a class="btn g" href="${b.buy}" target="_blank" rel="noopener">Buy / borrow</a></div></div>
      <div class="pdf-tip">Own this book as a PDF? Drop it in <b>/books</b> and set its <code>pdf</code> field in <b>assets/data.js</b> to read it here in the reader.</div>`;
    const prog=LS.get('bookprog',{}); const cur=prog[title]!==undefined?prog[title]:b.pct;
    $('book-modal').hidden=false;
    document.body.classList.add('book-open');
    const r=$('man-range'); if(r){r.value=cur;$('man-pct').textContent=cur;}
  }
}
function formatNotes(txt){
  return txt.split('\n').map(line=>{
    const t=line.trim();
    if(t==='')return '<div style="height:7px"></div>';
    if(/^[A-Z0-9][A-Z0-9 ()—\-]+$/.test(t))return `<div class="nhead">${t}</div>`;
    if(t.startsWith('•'))return `<div class="nbul">${t}</div>`;
    return `<div class="npar">${t}</div>`;
  }).join('');
}
function saveManual(){const v=parseInt($('man-range').value)||0;const prog=LS.get('bookprog',{});prog[pdfTitle]=v;LS.set('bookprog',prog);markStudied();toast('Progress saved!','ok');closeBook();renderLibrary();}
function loadPdf(url){
  if(typeof pdfjsLib==='undefined'){$('pdf-page').textContent='PDF engine not loaded.';return;}
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfjsLib.getDocument(url).promise.then(doc=>{
    pdfDoc=doc;
    const saved=LS.get('bookpage',{});
    pdfPage=saved[pdfTitle]||1;
    if(pdfPage>doc.numPages)pdfPage=1;
    renderPdfPage();
  }).catch(e=>{$('pdf-text-wrap').innerHTML='<div class="pdf-note">Could not open this PDF. Check the filename in data.js matches the file in /books.</div>';});
}
var _turnDir='right';
function renderPdfPage(){
  if(!pdfDoc)return;
  const wrap=$('pdf-text-wrap');
  wrap.innerHTML='<div class="page-inner"><div class="page-frame"><div class="tt-loading">Summoning page…</div></div></div><canvas id="pdf-canvas" style="display:none"></canvas>';
  pdfDoc.getPage(pdfPage).then(page=>{
    return page.getTextContent().then(tc=>{
      const hasText=tc.items.some(i=>i.str&&i.str.trim());
      if(hasText){
        let html='',lastY=null;
        tc.items.forEach(item=>{
          if(!item.str||!item.str.trim())return;
          const y=Math.round(item.transform[5]);
          const size=Math.round(item.transform[0])||12;
          const isBold=item.fontName&&(/bold/i.test(item.fontName));
          const isItalic=item.fontName&&(/italic|oblique/i.test(item.fontName));
          const isHeading=size>=16;
          const isSubhead=size>=13&&size<16&&isBold;
          const text=item.str.replace(/</g,'&lt;').replace(/>/g,'&gt;');
          if(lastY!==null&&Math.abs(y-lastY)>size*1.8){
            html+='</div>';
            if(isHeading) html+=`<div class="tt-heading">${text}`;
            else if(isSubhead) html+=`<div class="tt-subhead">${text}`;
            else html+=`<div class="tt-para">${text}`;
          }else if(lastY===null){
            if(isHeading) html+=`<div class="tt-heading">${text}`;
            else if(isSubhead) html+=`<div class="tt-subhead">${text}`;
            else html+=`<div class="tt-para">${text}`;
          }else{
            if(isBold&&!isItalic) html+=` <strong>${text}</strong>`;
            else if(isItalic) html+=` <em>${text}</em>`;
            else html+=` ${text}`;
          }
          lastY=y;
        });
        if(lastY!==null) html+='</div>';
        _finishPage(wrap,html,null);
      }else{
        const canvas=$('pdf-canvas');
        const scale=2;
        const vp=page.getViewport({scale});
        canvas.width=vp.width; canvas.height=vp.height;
        canvas.style.cssText='display:block;width:100%;height:auto;';
        page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise.then(()=>{
          _finishPage(wrap,null,canvas);
        });
      }
      $('pdf-page').textContent=`Page ${pdfPage} of ${pdfDoc.numPages}`;
      var pf=$('pdf-prog-fill');if(pf)pf.style.width=Math.round(pdfPage/pdfDoc.numPages*100)+'%';
    });
  });
}
function _finishPage(wrap,html,canvas){
  const inner=document.createElement('div');
  inner.className='page-inner turn-'+_turnDir;
  inner.style.fontSize=readerZoom+'%';
  const frame=document.createElement('div');
  frame.className='page-frame';
  const pageNum=`<div class="tt-page-num">— Page ${pdfPage} —</div>`;
  const footer=`<div class="page-footer"><span class="page-footer-text">${pdfTitle}</span></div>`;
  if(canvas){
    frame.innerHTML=pageNum;
    frame.appendChild(canvas);
    frame.insertAdjacentHTML('beforeend',footer);
  }else{
    frame.innerHTML=pageNum+html+footer;
  }
  inner.appendChild(frame);
  wrap.innerHTML='';
  wrap.appendChild(inner);
  wrap.scrollTop=0;
  updateStickyBtn();
  updateBookmarkBtn();
}
function pdfPrev(){if(pdfDoc&&pdfPage>1){_turnDir='left';pdfPage--;renderPdfPage();}}
function pdfNext(){if(pdfDoc&&pdfPage<pdfDoc.numPages){_turnDir='right';pdfPage++;renderPdfPage();}}
function pdfFirst(){if(pdfDoc){_turnDir='left';pdfPage=1;renderPdfPage();}}
function pdfLast(){if(pdfDoc){_turnDir='right';pdfPage=pdfDoc.numPages;renderPdfPage();}}
function readerZoomIn(){readerZoom=Math.min(150,readerZoom+10);LS.set('reader_zoom',readerZoom);var inner=document.querySelector('.page-inner');if(inner)inner.style.fontSize=readerZoom+'%';}
function readerZoomOut(){readerZoom=Math.max(70,readerZoom-10);LS.set('reader_zoom',readerZoom);var inner=document.querySelector('.page-inner');if(inner)inner.style.fontSize=readerZoom+'%';}
function toggleFullscreen(){
  const el=$('book-modal');
  if(!el)return;
  if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});}
  else{el.requestFullscreen().catch(()=>{});}
}
function toggleBookmark(){
  if(!pdfDoc)return;
  const key='bookmarks_'+pdfTitle;
  let bm=LS.get(key,[]);
  const idx=bm.indexOf(pdfPage);
  if(idx>=0){bm.splice(idx,1);toast('Bookmark removed');}
  else{bm.push(pdfPage);bm.sort((a,b)=>a-b);toast('Page '+pdfPage+' bookmarked!','ok');}
  LS.set(key,bm);
  updateBookmarkBtn();
}
function updateBookmarkBtn(){
  const btn=$('bk-bookmark');if(!btn)return;
  const bm=LS.get('bookmarks_'+pdfTitle,[]);
  btn.classList.toggle('active-bm',bm.includes(pdfPage));
}
function saveBookProgress(){
  if(!pdfDoc)return;
  const sp=LS.get('bookpage',{});sp[pdfTitle]=pdfPage;LS.set('bookpage',sp);
  const prog=LS.get('bookprog',{});prog[pdfTitle]=Math.round(pdfPage/pdfDoc.numPages*100);LS.set('bookprog',prog);
  markStudied();
  toast('Progress saved ✔','ok');
  $('bk-save').textContent='Saved ✓';
  setTimeout(()=>{if($('bk-save'))$('bk-save').textContent='\u{1F4BE} Save';},1500);
}
function closeBook(){$('book-modal').hidden=true;pdfDoc=null;document.body.classList.remove('book-open');}
document.addEventListener('keydown',function(e){
  if($('book-modal').hidden||!pdfDoc)return;
  if(e.key==='ArrowLeft'){e.preventDefault();pdfPrev();}
  else if(e.key==='ArrowRight'){e.preventDefault();pdfNext();}
  else if(e.key==='Home'){e.preventDefault();pdfFirst();}
  else if(e.key==='End'){e.preventDefault();pdfLast();}
  else if(e.key==='Escape'){e.preventDefault();closeBook();}
  else if(e.key==='b'||e.key==='B'){e.preventDefault();toggleBookmark();}
  else if(e.key==='+'||e.key==='='){e.preventDefault();readerZoomIn();}
  else if(e.key==='-'){e.preventDefault();readerZoomOut();}
});
(function(){var sx,sy;document.addEventListener('touchstart',function(e){if($('book-modal').hidden||!pdfDoc)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});document.addEventListener('touchend',function(e){if($('book-modal').hidden||!pdfDoc||sx===undefined)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=undefined;if(Math.abs(dx)<50||Math.abs(dy)>Math.abs(dx))return;if(dx<0)pdfNext();else pdfPrev();});})();

/* STICKY NOTES on book pages */
function getStickyKey(){return 'note_'+encodeURIComponent(pdfTitle)+'_p'+pdfPage;}
function getNote(){return LS.get(getStickyKey(),'');}
function toggleStickyNote(){
  var existing=document.getElementById('sticky-wrap');
  if(existing){existing.remove();return;}
  var frame=document.querySelector('.page-frame');
  if(!frame)return;
  var wrap=document.createElement('div');
  wrap.className='sticky-wrap';
  wrap.id='sticky-wrap';
  var saved=getNote();
  wrap.innerHTML='<textarea class="sticky-note-ta" id="sticky-ta" placeholder="Write your note for this page…">'+saved.replace(/</g,'&lt;')+'</textarea><div class="sticky-actions"><button class="sticky-del" onclick="delStickyNote()">Delete</button><button class="sticky-save" onclick="saveStickyNote()">Save note</button></div>';
  frame.appendChild(wrap);
  document.getElementById('sticky-ta').focus();
}
function saveStickyNote(){
  var ta=document.getElementById('sticky-ta');
  if(!ta)return;
  var txt=ta.value.trim();
  if(txt){LS.set(getStickyKey(),txt);toast('Note saved','ok');}else{LS.set(getStickyKey(),undefined);}
  var wrap=document.getElementById('sticky-wrap');
  if(wrap)wrap.remove();
  updateStickyBtn();
}
function delStickyNote(){
  try{localStorage.removeItem('pml_'+getStickyKey());}catch(e){}
  var wrap=document.getElementById('sticky-wrap');
  if(wrap)wrap.remove();
  updateStickyBtn();
  toast('Note deleted');
}
function updateStickyBtn(){
  var btn=document.getElementById('sticky-btn');
  if(!btn)return;
  var has=getNote();
  btn.className='sticky-note-btn'+(has?' has-note':'');
  btn.textContent=has?'\u{1F4DD} View':'\u{1F4DD} Note';
}

/* ═══════════════════════════════════════════
   OWL POST — Job Discovery
   ═══════════════════════════════════════════ */
function filterJobs(f){curFilter=f;document.querySelectorAll('[data-f]').forEach(el=>el.classList.toggle('on',el.dataset.f===f));renderJobs(f);}
function renderJobs(f){
  let jobs=JOBS;
  if(f==='strong')jobs=jobs.filter(j=>j.isStrong);
  else if(f==='new')jobs=jobs.filter(j=>j.isNew);
  else if(f==='internal')jobs=jobs.filter(j=>j.isInternal);
  const jl=$('jlist'); if(!jl)return;
  if(!jobs.length){jl.innerHTML='<div class="empty-state">No owls match this filter.</div>';return;}
  jl.innerHTML=jobs.map((j,i)=>{
    const fc=j.fit>=80?'c-ok':j.fit>=65?'c-wa':'c-mu';
    const fl=j.fit>=80?'Strong fit':j.fit>=65?'Good fit':'Moderate';
    const apply=j.applyUrl?`<a class="btn g" href="${j.applyUrl}" target="_blank" rel="noopener">Apply ↗</a>`:'';
    return `<div class="jc rise" style="animation-delay:${i*50}ms"><div class="jctop"><div class="jclogo" style="background:${j.logobg}">${j.logo}</div><div style="flex:1;min-width:0;"><div class="jcrole">${j.role}</div><div class="jcco">${j.co}</div></div><div class="jcfit"><div class="jcnum ${fc}">${j.fit}%</div><div class="jclbl ${fc}">${fl}</div></div></div>
    <div class="jctags">${j.tags.map(t=>{let c='';if(t.indexOf('₹')>-1)c=' sal';else if(t==='New')c=' new';return `<span class="jt${c}">${t}</span>`;}).join('')}</div>
    <div class="jcwhy">${j.why}</div>
    <div class="jcacts"><button class="btn p" onclick="openLocker('${j.id}')">\u{1F513} Locker room</button>${apply}</div></div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   GOBLET — Kanban with Drag & Drop
   ═══════════════════════════════════════════ */
function getKanban(){return LS.get('kanban_data',null)||KANBAN;}
function saveKanban(data){LS.set('kanban_data',data);}
function renderKanban(){
  const data=getKanban();
  const kb=$('kanban'); if(!kb)return;
  kb.innerHTML=data.map((col,ci)=>`<div class="kbc" data-col="${ci}"><div class="kbh"><div class="kbst" style="background:${col.color}"></div><div class="kbname">${col.name}</div><div class="kbcnt">${col.cards.length}</div></div><div class="kbcards" data-col="${ci}" ondragover="event.preventDefault();this.classList.add('kb-drag-over')" ondragleave="this.classList.remove('kb-drag-over')" ondrop="dropCard(event,${ci})">${col.cards.map((c,ri)=>`<div class="ac2" draggable="true" ondragstart="dragCard(event,${ci},${ri})"><div class="acrole">${c.role}</div><div class="acco">${c.co}</div><div class="acrow"><span class="acdate">${c.date}</span><span class="acfit ${c.fc}">${c.fit}% fit</span></div></div>`).join('')}<button class="addcrd" onclick="addKanbanCard(${ci})">+ Add</button></div></div>`).join('');
}
let dragFrom=null;
function dragCard(e,col,row){dragFrom={col,row};e.dataTransfer.effectAllowed='move';}
function dropCard(e,toCol){
  e.preventDefault();e.currentTarget.classList.remove('kb-drag-over');
  if(!dragFrom)return;
  const data=getKanban();
  const card=data[dragFrom.col].cards.splice(dragFrom.row,1)[0];
  if(!card)return;
  data[toCol].cards.push(card);
  saveKanban(data);
  renderKanban();
  toast('Card moved to '+data[toCol].name,'ok');
  dragFrom=null;
}
function addKanbanCard(colIdx){
  const role=prompt('Role title:');if(!role)return;
  const co=prompt('Company:');if(!co)return;
  const data=getKanban();
  const today=new Date();
  data[colIdx].cards.push({role,co,date:today.toLocaleDateString('en-GB',{month:'short',day:'numeric'}),fit:0,fc:'c-mu'});
  saveKanban(data);
  renderKanban();
  toast('Card added!','ok');
}

/* ═══════════════════════════════════════════
   DUELLING CLUB
   ═══════════════════════════════════════════ */
function renderCoach(){
  const cl=$('qcat-list'); if(!cl)return;
  cl.innerHTML=QCATS.map((c,ci)=>`<div class="qc"><div class="qch" onclick="toggleQCat(${ci})"><span class="qcic">${c.ic}</span><span class="qcname">${c.name}</span><span class="qccnt">${c.qs.length} spells</span><span class="qcarr" id="qcarr-${ci}">▶</span></div><div class="qcitems" id="qci-${ci}">${c.qs.map(q=>`<div class="qi">${q}</div>`).join('')}</div></div>`).join('');
}
function toggleQCat(i){$('qci-'+i).classList.toggle('open');$('qcarr-'+i).classList.toggle('open');}

/* HOGSMEADE */
function renderFun(){
  $('fun-list').innerHTML=FUN.map((f,i)=>`<div class="fc rise" style="animation-delay:${i*45}ms"><div class="fci">${f.ic}</div><div class="fcn">${f.n}</div><div class="fcs">${f.s}</div>${f.url?`<a class="btn g" href="${f.url}" target="_blank" rel="noopener">${f.btn}</a>`:`<button class="btn g" disabled>${f.btn}</button>`}</div>`).join('');
}

/* MOCK DUEL */
let mockPool=[], mockI=0;
function openMock(){mockPool=QCATS.flatMap(c=>c.qs.map(q=>({q,cat:c.name})));mockPool.sort(()=>Math.random()-0.5);mockI=0;$('mock-ans').value='';showMockQ();$('mock-modal').hidden=false;}
function showMockQ(){const it=mockPool[mockI%mockPool.length];$('mock-q').textContent=it.q;$('mock-cat-label').textContent=it.cat+' \xB7 Duel '+(mockI+1);}
function nextQ(){mockI++;$('mock-ans').value='';showMockQ();}
function closeMock(){$('mock-modal').hidden=true;}

/* LOCKER ROOM */
function openLocker(id){
  const j=JOBS.find(x=>x.id===id); if(!j)return;
  $('lk-title').textContent=j.role+' — '+j.co;
  $('lk-sub').textContent=j.fit+'% fit \xB7 '+j.tags.join(' \xB7 ');
  $('lq-list').innerHTML=(j.questions||[]).map((q,i)=>`<div class="lq">${i+1}. ${q}</div>`).join('');
  $('lk-cv-content').textContent=j.cv||'';
  $('lk-msg-content').textContent=j.msg||'';
  $('lk-brief-content').innerHTML='<strong>'+j.co+'</strong><br><br>'+(j.brief||'');
  const al=$('lk-apply'); if(al){if(j.applyUrl){al.href=j.applyUrl;al.style.display='inline-flex';}else{al.style.display='none';}}
  switchLocker('questions');$('locker-modal').hidden=false;
}
function switchLocker(tab){const tabs=['questions','cv','msg','brief'];document.querySelectorAll('#locker-modal .lt').forEach((el,i)=>el.classList.toggle('on',tabs[i]===tab));document.querySelectorAll('#locker-modal .ls').forEach((el,i)=>el.classList.toggle('on',tabs[i]===tab));}
function closeLocker(){$('locker-modal').hidden=true;}

function copyEl(id){const el=$(id);if(!el)return;try{navigator.clipboard.writeText(el.textContent).then(()=>toast('Copied!','ok')).catch(()=>{const r=document.createRange();r.selectNode(el);getSelection().removeAllRanges();getSelection().addRange(r);toast('Select all & copy');});}catch(e){}}
function toggleTheme(){const cur=document.documentElement.getAttribute('data-theme')||'';const next=cur==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);LS.set('theme',next);toast(next==='dark'?'Candlelight mode':'Daylight mode');}

document.addEventListener('click',e=>{if(e.target.classList&&e.target.classList.contains('mover'))e.target.hidden=true;});

/* Escape key closes any open modal */
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(!$('book-modal').hidden){closeBook();return;}
  if(!$('mock-modal').hidden){closeMock();return;}
  if(!$('locker-modal').hidden){closeLocker();return;}
  if(!$('more-sheet').hidden){closeSheet();return;}
});

/* ═══════════════════════════════════════════
   PORTFOLIO VAULT (New Chamber)
   ═══════════════════════════════════════════ */
function renderVault(){
  const vaultEl=$('tab-vault');if(!vaultEl)return;
  const projects=LS.get('vault_projects',[]);
  const templates=[
    {title:'RM Auto Assignment',problem:'Manual assignment of RMs to leads caused delays and uneven workload.'},
    {title:'Early Warning System',problem:'No proactive alerts for at-risk deals or churning customers.'},
    {title:'Commercial Servicing Dashboard',problem:'Fragmented data across tools made servicing insights hard to access.'},
    {title:'Incentive & R&R System',problem:'Manual incentive tracking was error-prone and lacked transparency.'},
    {title:'Visit Point Tracking',problem:'No visibility into field visit effectiveness and coverage gaps.'}
  ];
  let html='<div class="pad"><div class="seclbl">The Portfolio Vault</div><div class="secname">Your Product Case Studies</div><div class="sec-story">Document real product ownership. Each case study demonstrates your PM capabilities to hiring managers.</div></div>';
  html+='<div class="vault-actions pad"><button class="btn p" onclick="addVaultProject()">+ New Project</button></div>';
  if(!projects.length){
    html+='<div class="pad"><div class="empty-state">No projects yet. Add your first case study or start from a template below.</div></div>';
    html+='<div class="vault-templates pad"><div class="sec-story" style="margin-top:14px">Quick-start templates from your NoBroker work:</div>';
    html+=templates.map(t=>`<div class="vault-tpl" onclick="createFromTemplate('${t.title}','${t.problem.replace(/'/g,"\\'")}')"><div class="vt-title">${t.title}</div><div class="vt-desc">${t.problem}</div></div>`).join('');
    html+='</div>';
  }else{
    html+='<div class="vault-list pad">'+projects.map((p,i)=>`<div class="vault-card"><div class="vc-title">${p.title}</div><div class="vc-problem">${p.problem||'No problem statement yet'}</div><div class="vc-meta"><span class="pill">${p.status||'Draft'}</span></div><div class="vc-acts"><button class="btn g" onclick="editVaultProject(${i})">Edit</button><button class="btn g" onclick="deleteVaultProject(${i})">Delete</button></div></div>`).join('')+'</div>';
  }
  vaultEl.innerHTML=html;
}
function addVaultProject(){
  const title=prompt('Project title:');if(!title)return;
  const projects=LS.get('vault_projects',[]);
  projects.push({title,problem:'',target:'',impact:'',status:'Draft',created:new Date().toISOString()});
  LS.set('vault_projects',projects);
  renderVault();
  toast('Project added!','ok');
}
function createFromTemplate(title,problem){
  const projects=LS.get('vault_projects',[]);
  projects.push({title,problem,target:'',impact:'',status:'Draft',created:new Date().toISOString()});
  LS.set('vault_projects',projects);
  renderVault();
  toast('Template created!','ok');
}
function editVaultProject(i){
  const projects=LS.get('vault_projects',[]);
  const p=projects[i];if(!p)return;
  const title=prompt('Project title:',p.title);if(title===null)return;
  const problem=prompt('Problem statement:',p.problem);if(problem===null)return;
  const impact=prompt('Business impact:',p.impact||'');if(impact===null)return;
  p.title=title;p.problem=problem;p.impact=impact;
  LS.set('vault_projects',projects);
  renderVault();
  toast('Project updated','ok');
}
function deleteVaultProject(i){
  if(!confirm('Delete this project?'))return;
  const projects=LS.get('vault_projects',[]);
  projects.splice(i,1);
  LS.set('vault_projects',projects);
  renderVault();
  toast('Project deleted');
}

/* ═══════════════════════════════════════════
   COMPETENCY DASHBOARD (New Chamber)
   ═══════════════════════════════════════════ */
function renderCompetency(){
  const el=$('tab-competency');if(!el)return;
  const scores=LS.get('competency',{});
  const cats=[
    {key:'discovery',name:'Product Discovery',icon:'\u{1F50D}'},
    {key:'strategy',name:'Product Strategy',icon:'\u{1F3AF}'},
    {key:'execution',name:'Product Execution',icon:'⚙️'},
    {key:'analytics',name:'Product Analytics',icon:'\u{1F4CA}'},
    {key:'technical',name:'Technical PM',icon:'\u{1F4BB}'},
    {key:'communication',name:'Communication',icon:'\u{1F4AC}'},
    {key:'leadership',name:'Leadership',icon:'\u{1F451}'},
    {key:'design',name:'Product Design',icon:'\u{1F3A8}'},
    {key:'experimentation',name:'Experimentation',icon:'\u{1F9EA}'}
  ];
  let html='<div class="pad"><div class="seclbl">Competency Intelligence</div><div class="secname">Your Skill Map</div><div class="sec-story">Track your PM competencies. Rate yourself honestly — this drives your learning recommendations.</div></div>';
  html+='<div class="comp-grid pad">';
  cats.forEach(c=>{
    const s=scores[c.key]||0;
    const barColor=s>=70?'var(--ok)':s>=40?'var(--wa)':'var(--acc)';
    html+=`<div class="comp-card"><div class="comp-head"><span class="comp-icon">${c.icon}</span><span class="comp-name">${c.name}</span><span class="comp-score">${s}%</span></div><div class="comp-bar"><div class="comp-fill" style="width:${s}%;background:${barColor}"></div></div><div class="comp-ctrl"><input type="range" min="0" max="100" value="${s}" oninput="updateCompetency('${c.key}',this.value,this.parentElement.previousElementSibling)" class="comp-range"><div class="comp-labels"><span>Beginner</span><span>Expert</span></div></div></div>`;
  });
  html+='</div>';
  el.innerHTML=html;
}
function updateCompetency(key,val,barEl){
  const scores=LS.get('competency',{});
  scores[key]=parseInt(val);
  LS.set('competency',scores);
  if(barEl){
    const fill=barEl.querySelector('.comp-fill');
    if(fill){fill.style.width=val+'%';fill.style.background=val>=70?'var(--ok)':val>=40?'var(--wa)':'var(--acc)';}
  }
  const scoreEl=barEl?barEl.previousElementSibling.querySelector('.comp-score'):null;
  if(scoreEl)scoreEl.textContent=val+'%';
}

/* ═══════════════════════════════════════════
   KNOWLEDGE VAULT (New Chamber)
   ═══════════════════════════════════════════ */
function renderKnowledge(){
  const el=$('tab-knowledge');if(!el)return;
  const notes=LS.get('knowledge_notes',[]);
  let html='<div class="pad"><div class="seclbl">Knowledge Vault</div><div class="secname">Your Personal Wiki</div><div class="sec-story">Save notes, frameworks, interview answers, and insights from across your PM journey.</div></div>';
  html+='<div class="pad"><button class="btn p" onclick="addKnowledgeNote()">+ Quick Note</button></div>';
  if(!notes.length){
    html+='<div class="pad"><div class="empty-state">Your knowledge vault is empty. Add your first note!</div></div>';
  }else{
    html+='<div class="knowledge-list pad">'+notes.map((n,i)=>`<div class="kn-card"><div class="kn-head"><span class="kn-tag">${n.tag||'General'}</span><span class="kn-date">${new Date(n.created).toLocaleDateString()}</span></div><div class="kn-title">${n.title}</div><div class="kn-body">${(n.body||'').slice(0,200)}${n.body&&n.body.length>200?'…':''}</div><div class="kn-acts"><button class="btn g" onclick="editKnNote(${i})">Edit</button><button class="btn g" onclick="deleteKnNote(${i})">Delete</button></div></div>`).join('')+'</div>';
  }
  el.innerHTML=html;
}
function addKnowledgeNote(){
  const title=prompt('Note title:');if(!title)return;
  const body=prompt('Content:');if(body===null)return;
  const tag=prompt('Tag (e.g. Framework, Interview, Insight):','General');
  const notes=LS.get('knowledge_notes',[]);
  notes.unshift({title,body,tag:tag||'General',created:new Date().toISOString()});
  LS.set('knowledge_notes',notes);
  renderKnowledge();
  toast('Note saved!','ok');
}
function editKnNote(i){
  const notes=LS.get('knowledge_notes',[]);const n=notes[i];if(!n)return;
  const title=prompt('Title:',n.title);if(title===null)return;
  const body=prompt('Content:',n.body);if(body===null)return;
  n.title=title;n.body=body;
  LS.set('knowledge_notes',notes);
  renderKnowledge();
  toast('Note updated','ok');
}
function deleteKnNote(i){
  if(!confirm('Delete this note?'))return;
  const notes=LS.get('knowledge_notes',[]);
  notes.splice(i,1);
  LS.set('knowledge_notes',notes);
  renderKnowledge();
}

/* ═══════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════ */
function renderSettings(){
  const el=$('tab-settings');if(!el)return;
  const zoom=LS.get('reader_zoom',100);
  const theme=LS.get('theme','');
  const gemKey=LS.get('gemini_key','');
  const html=`<div class="pad"><div class="seclbl">Settings</div><div class="secname">Personalisation</div></div>
  <div class="settings-list pad">
    <div class="set-group"><div class="set-label">Theme</div><div class="set-ctrl"><button class="btn ${theme!=='dark'?'p':'g'}" onclick="setTheme('light')">Daylight</button><button class="btn ${theme==='dark'?'p':'g'}" onclick="setTheme('dark')">Candlelight</button></div></div>
    <div class="set-group"><div class="set-label">Reader font</div><div class="set-ctrl"><span id="set-zoom">${zoom}%</span><input type="range" min="70" max="150" value="${zoom}" oninput="setReaderZoom(this.value)" style="flex:1"></div></div>
    <div class="set-group"><div class="set-label">Export data</div><div class="set-ctrl"><button class="btn g" onclick="exportData()">Download backup</button></div></div>
    <div class="set-group"><div class="set-label">Reset</div><div class="set-ctrl"><button class="btn g" style="color:var(--bad)" onclick="resetProgress()">Reset all</button></div></div>
  </div>
  <div class="pad gap"><div class="seclbl">AI Features</div><div class="secname">Gemini API Key</div><div class="sec-story">Your key is stored only in this browser. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:var(--acc)">Get a free key ↗</a> — enables AI Mentor, Job Fit Scorer, and Mock Interview Evaluation.</div></div>
  <div class="settings-list pad">
    <div class="set-group"><div class="set-label">Gemini key</div><div class="set-ctrl"><input type="password" class="set-key-input" id="gemini-key-input" placeholder="AIza..." value="${gemKey}" style="flex:1"><button class="btn g" onclick="saveGeminiKey()">Save</button></div></div>
  </div>
  <div class="pad gap"><div class="seclbl">House Cup</div><div class="secname">Duel a friend</div><div class="sec-story">Share your stats code with a study partner — they paste it to see a side-by-side comparison. Zero backend, works instantly.</div></div>
  <div class="settings-list pad">
    <div class="set-group"><div class="set-label">My code</div><div class="set-ctrl"><button class="btn g" onclick="copyShareCode()">📋 Copy my stats code</button></div></div>
    <div class="set-group"><div class="set-label">Friend's code</div><div class="set-ctrl"><input type="text" class="set-key-input" id="friend-code-input" placeholder="Paste their code here…" style="flex:1"><button class="btn g" onclick="compareWithFriend()">Compare ↗</button></div></div>
  </div>
  <div id="friend-compare"></div>
  <div class="bpad"></div>`;
  el.innerHTML=html;
}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);LS.set('theme',t);toast(t==='dark'?'Candlelight mode':'Daylight mode');renderSettings();}
function setReaderZoom(v){readerZoom=parseInt(v);LS.set('reader_zoom',readerZoom);const el=$('set-zoom');if(el)el.textContent=v+'%';}
function exportData(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k.startsWith('pml_'))data[k]=localStorage.getItem(k);
  }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='pm-launchpad-backup.json';a.click();
  URL.revokeObjectURL(url);
  toast('Backup downloaded','ok');
}
function resetProgress(){
  if(!confirm('This will erase ALL progress, notes, and settings. Are you sure?'))return;
  if(!confirm('Last chance! This cannot be undone.'))return;
  for(let i=localStorage.length-1;i>=0;i--){
    const k=localStorage.key(i);
    if(k.startsWith('pml_'))localStorage.removeItem(k);
  }
  toast('Progress reset');
  setTimeout(()=>window.location.reload(),500);
}

/* PHASE B — live jobs from the published Google Sheet */
function parseCsv(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else q=false; } else cell+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(cell);cell='';} else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';} else if(c!=='\r')cell+=c; }
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return rows;
}
function defaultCv(){return "• Owned 0→1 AI Call Quality Analyzer — defined the problem, led research, shipped to 47 RMs; audit coverage 5% → 100%\n• Built Property Carnival CRM — 200+ concurrent buyers, atomic queue, WhatsApp automation, 0 double-assigns\n• Designed multi-agent Gemini pipeline with an 8-metric evaluation rubric\n• 4 years NoBroker field→BA; built 5 production internal tools solo";}
function defaultMsg(role,co){return `Hi [Name], I'm Ujjwal — BA at NoBroker who built an AI call auditor (47 RMs) and a real-time event CRM (200 buyers). I'm exploring ${role} roles and ${co}'s work caught my eye. Would you be open to a quick chat?`;}
function loadLiveJobs(){
  if(typeof CONFIG==='undefined'||!CONFIG.USE_LIVE_JOBS||!CONFIG.SHEET_ID)return;
  const url=`https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(CONFIG.SHEET_TAB||'Jobs')}`;
  fetch(url).then(r=>r.ok?r.text():Promise.reject()).then(txt=>{
    const rows=parseCsv(txt); if(rows.length<2)return;
    const head=rows[0].map(h=>h.trim().toLowerCase());
    const idx=n=>head.indexOf(n);
    const live=rows.slice(1).filter(r=>r.length>1&&r[idx('url')]).map(r=>{
      const get=n=>{const i=idx(n);return i>=0?(r[i]||'').trim():'';};
      const fit=parseInt(get('fit'))||0;
      const sal=get('salary'); const loc=get('location');
      const tags=[loc,sal,get('isNew').toLowerCase()==='true'?'New':''].filter(Boolean);
      const role=get('role')||'Product role';
      const co=get('company')||'Company';
      return {id:get('id')||'live'+Math.random().toString(36).slice(2,7),co:co,role:role,logo:"\u{1F989}",logobg:"#e3ece4",
        fit:fit,tags:tags,applyUrl:get('url'),why:get('why')||'Pulled by the owl and fit-scored for you.',
        isNew:get('isNew').toLowerCase()==='true',isStrong:fit>=80,isInternal:false,
        questions:(get('questions')||'').split(' || ').filter(Boolean),
        cv:defaultCv(),msg:defaultMsg(role,co),brief:get('brief')||''};
    }).filter(j=>j.fit>0).sort((a,b)=>b.fit-a.fit);
    if(live.length){ JOBS.length=0; live.forEach(j=>JOBS.push(j)); renderJobs(curFilter); renderHall(); }
  }).catch(()=>{});
}

/* Floating candles — Great Hall ceiling grid */
function spawnCandles(){
  const layer=$('candle-layer'); if(!layer)return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var isMobile=window.innerWidth<600;
  var cols=isMobile?4:7;
  var rows=2;
  var html='';
  for(var r=0;r<rows;r++){
    for(var c=0;c<cols;c++){
      var left=8+(c*(84/(cols-1)))+(r%2?4:-4)+Math.random()*3;
      var top=12+r*32+Math.random()*8;
      var delay=(c*0.6+r*1.2+Math.random()*1.5).toFixed(1);
      var size=isMobile?16:18+Math.random()*4;
      html+='<div class="candle" style="left:'+left+'%;top:'+top+'px;animation-delay:'+delay+'s;font-size:'+size+'px">\u{1F56F}️</div>';
    }
  }
  layer.innerHTML=html;
}

/* Golden sparkle burst on points earned */
function spawnSparkles(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const el=$('pc-pts')||$('sb-ptn'); if(!el)return;
  const r=el.getBoundingClientRect();
  const burst=document.createElement('div');
  burst.className='sparkle-burst';
  burst.style.left=(r.left+r.width/2)+'px';
  burst.style.top=(r.top+r.height/2)+'px';
  for(let i=0;i<12;i++){
    const s=document.createElement('div');
    s.className='sparkle';
    const angle=Math.random()*Math.PI*2;
    const dist=20+Math.random()*40;
    s.style.setProperty('--sx',Math.cos(angle)*dist+'px');
    s.style.setProperty('--sy',Math.sin(angle)*dist+'px');
    s.style.animationDelay=(Math.random()*0.15)+'s';
    burst.appendChild(s);
  }
  document.body.appendChild(burst);
  setTimeout(()=>burst.remove(),900);
}

/* ═══════════════════════════════════════════
   GEMINI AI HELPER
   ═══════════════════════════════════════════ */
async function geminiCall(prompt){
  const key=LS.get('gemini_key','');
  if(!key){toast('Add your Gemini API key in Settings','info');return null;}
  try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key='+key,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const d=await r.json();
    if(d.error){toast('Gemini: '+d.error.message);return null;}
    return d.candidates?.[0]?.content?.parts?.[0]?.text||null;
  }catch(e){toast('Network error calling Gemini');return null;}
}
function saveGeminiKey(){const v=($('gemini-key-input')||{}).value||'';LS.set('gemini_key',v.trim());toast(v.trim()?'Gemini key saved!':'Key cleared','ok');}

/* ═══════════════════════════════════════════
   SETTINGS — SHARE CODE & HOUSE CUP
   ═══════════════════════════════════════════ */
function generateShareCode(){
  const scores=LS.get('competency',{});
  const cats=['discovery','strategy','execution','analytics','technical','communication','leadership','design','experimentation'];
  const avg=Math.round(cats.reduce((s,c)=>s+(scores[c]||0),0)/cats.length);
  const bookprog=LS.get('bookprog',{});
  const booksDone=allBooks().filter(b=>(bookprog[b.title]||b.pct)>=100).length;
  return btoa(JSON.stringify({pts:points(),streak:streakObj().n,booksDone,avg,name:'Ujjwal',ts:Date.now()}));
}
function copyShareCode(){
  const code=generateShareCode();
  navigator.clipboard.writeText(code).then(()=>toast('Stats code copied! Share it with your friend.','ok')).catch(()=>{toast('Code: '+code.slice(0,20)+'… (copy manually)');});
}
function compareWithFriend(){
  const inp=$('friend-code-input');if(!inp||!inp.value.trim()){toast('Paste your friend\'s code first');return;}
  try{
    const them=JSON.parse(atob(inp.value.trim()));
    const me=JSON.parse(atob(generateShareCode()));
    const container=$('friend-compare');if(!container)return;
    const c1=me.pts>them.pts?'c-ok':'c-mu';const c2=them.pts>=me.pts?'c-ok':'c-mu';
    container.innerHTML=`<div class="pad"><div class="compare-wrap">
      <div class="compare-title">🏆 House Cup Duel</div>
      <div class="compare-grid">
        <div class="cmp-head">You</div><div class="cmp-head"></div><div class="cmp-head">${them.name||'Friend'}</div>
        <div class="cmp-val ${c1}">${me.pts}</div><div class="cmp-lbl">House pts</div><div class="cmp-val ${c2}">${them.pts}</div>
        <div class="cmp-val">${me.streak}d</div><div class="cmp-lbl">Streak</div><div class="cmp-val">${them.streak}d</div>
        <div class="cmp-val">${me.booksDone}</div><div class="cmp-lbl">Books done</div><div class="cmp-val">${them.booksDone}</div>
        <div class="cmp-val">${me.avg}%</div><div class="cmp-lbl">Competency</div><div class="cmp-val">${them.avg}%</div>
      </div>
      <div class="cmp-verdict">${me.pts>them.pts?'🏆 You\'re ahead! Keep the streak alive.':me.pts===them.pts?'⚔️ It\'s a draw! Push harder.':'🔥 You\'re behind — earn more points!'}</div>
    </div></div>`;
  }catch(e){toast('Invalid share code','info');}
}

/* ═══════════════════════════════════════════
   STUDY TIMER (Pomodoro)
   ═══════════════════════════════════════════ */
let timerMode='focus',timerSecs=25*60,timerRunning=false,timerInterval=null;
const TIMER_FOCUS=25*60,TIMER_BREAK=5*60;
function renderTimer(){
  const el=$('tab-timer');if(!el)return;
  const m=Math.floor(timerSecs/60).toString().padStart(2,'0');
  const s=(timerSecs%60).toString().padStart(2,'0');
  const sessions=LS.get('timer_sessions',0);
  el.innerHTML=`<div class="pad"><div class="seclbl">Study Timer</div><div class="secname">The Hourglass</div><div class="sec-story">Focus for 25 minutes, earn 10 house points. Break for 5. Four sessions = one deep work block.</div></div>
  <div class="timer-wrap">
    <div class="timer-mode timer-mode-${timerMode}">${timerMode==='focus'?'⏳ Focus time':'☕ Break time'}</div>
    <div class="timer-display" id="timer-display">${m}:${s}</div>
    <div class="timer-label">${timerMode==='focus'?'Stay focused — wand at the ready':'Rest — the magic needs to settle'}</div>
    <div class="timer-acts">
      ${timerRunning?`<button class="btn p" onclick="pauseTimer()">⏸ Pause</button>`:`<button class="btn p" onclick="startTimer()">▶ Start</button>`}
      <button class="btn g" onclick="resetTimer()">↺ Reset</button>
      <button class="btn g" onclick="skipTimerMode()">⏭ Skip</button>
    </div>
    <div class="timer-sessions">Sessions completed today: <strong>${sessions}</strong> · <span style="color:var(--gold)">${sessions*10} pts earned</span></div>
  </div>
  <div class="pad gap"><div class="seclbl">Today's log</div></div>
  <div class="pad timer-history" id="timer-history"></div>
  <div class="bpad"></div>`;
  renderTimerHistory();
}
function renderTimerHistory(){
  const el=$('timer-history');if(!el)return;
  const log=LS.get('timer_log',[]);
  const today=new Date().toDateString();
  const todayLog=log.filter(l=>new Date(l.ts).toDateString()===today).slice(-10).reverse();
  if(!todayLog.length){el.innerHTML='<div class="empty-state">No sessions yet today. Start the hourglass!</div>';return;}
  el.innerHTML=todayLog.map(l=>`<div class="timer-log-item"><span>${l.type==='focus'?'⏳':'☕'}</span><span class="timer-log-desc">${l.type==='focus'?'Focus session':'Break'} · ${new Date(l.ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>${l.pts?`<span class="timer-log-pts">+${l.pts} pts</span>`:''}</div>`).join('');
}
function startTimer(){timerRunning=true;timerInterval=setInterval(tickTimer,1000);renderTimer();}
function pauseTimer(){timerRunning=false;clearInterval(timerInterval);renderTimer();}
function resetTimer(){pauseTimer();timerSecs=timerMode==='focus'?TIMER_FOCUS:TIMER_BREAK;renderTimer();}
function skipTimerMode(){pauseTimer();timerMode=timerMode==='focus'?'break':'focus';timerSecs=timerMode==='focus'?TIMER_FOCUS:TIMER_BREAK;renderTimer();}
function tickTimer(){
  timerSecs--;
  const d=$('timer-display');
  if(d){const m=Math.floor(timerSecs/60).toString().padStart(2,'0');const s=(timerSecs%60).toString().padStart(2,'0');d.textContent=m+':'+s;}
  if(timerSecs<=0){
    clearInterval(timerInterval);timerRunning=false;
    if(timerMode==='focus'){
      addPoints(10);toast('+10 house points! Focus session complete 🏆','ok');
      const sessions=LS.get('timer_sessions',0)+1;LS.set('timer_sessions',sessions);
      const log=LS.get('timer_log',[]);log.push({type:'focus',ts:new Date().toISOString(),pts:10});LS.set('timer_log',log);
      markStudied();timerMode='break';timerSecs=TIMER_BREAK;
    }else{
      toast('Break over! Ready for more?','info');
      const log=LS.get('timer_log',[]);log.push({type:'break',ts:new Date().toISOString(),pts:0});LS.set('timer_log',log);
      timerMode='focus';timerSecs=TIMER_FOCUS;
    }
    renderTimer();
  }
}

/* ═══════════════════════════════════════════
   DECISION JOURNAL
   ═══════════════════════════════════════════ */
function renderJournal(){
  const el=$('tab-journal');if(!el)return;
  const entries=LS.get('journal_entries',[]);
  let html=`<div class="pad"><div class="seclbl">Decision Journal</div><div class="secname">The Pensieve of Choices</div><div class="sec-story">Log every significant PM decision. The best PMs revisit decisions to learn from outcomes — this is your retrospective engine.</div></div>
  <div class="pad"><button class="btn p" onclick="addJournalEntry()">+ Log a Decision</button></div>`;
  if(!entries.length){
    html+='<div class="pad"><div class="empty-state">No decisions logged yet. Start with a real work decision — small ones count too.</div></div>';
  }else{
    html+='<div class="journal-list pad">'+entries.map((e,i)=>{
      const statusColor=e.outcome?'var(--ok)':e.status==='pending'?'var(--wa)':'var(--acc)';
      const statusLabel=e.outcome?'Outcome known':e.status==='pending'?'Pending':'Open';
      return `<div class="jrl-card"><div class="jrl-head"><span class="jrl-date">${new Date(e.created).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</span><span class="jrl-status" style="color:${statusColor}">${statusLabel}</span></div>
      <div class="jrl-decision">${e.decision}</div>
      ${e.context?`<div class="jrl-context">${e.context}</div>`:''}
      ${e.outcome?`<div class="jrl-outcome"><strong>Outcome:</strong> ${e.outcome}</div>`:''}
      <div class="jrl-acts"><button class="btn g" onclick="editJournalEntry(${i})">Edit</button><button class="btn g" onclick="addOutcome(${i})">📝 Add outcome</button><button class="btn g" onclick="deleteJournalEntry(${i})">Delete</button></div>
      </div>`;
    }).join('')+'</div>';
  }
  html+='<div class="bpad"></div>';
  el.innerHTML=html;
}
function addJournalEntry(){
  const decision=prompt('What decision did you make?');if(!decision)return;
  const context=prompt('Context / why:','')||'';
  const entries=LS.get('journal_entries',[]);
  entries.unshift({decision,context,outcome:'',status:'open',created:new Date().toISOString()});
  LS.set('journal_entries',entries);renderJournal();toast('Decision logged!','ok');
}
function addOutcome(i){
  const entries=LS.get('journal_entries',[]);const e=entries[i];if(!e)return;
  const outcome=prompt('What was the outcome?',e.outcome||'');if(outcome===null)return;
  e.outcome=outcome;e.status='resolved';LS.set('journal_entries',entries);renderJournal();toast('Outcome recorded!','ok');
}
function editJournalEntry(i){
  const entries=LS.get('journal_entries',[]);const e=entries[i];if(!e)return;
  const decision=prompt('Decision:',e.decision);if(decision===null)return;
  const context=prompt('Context:',e.context);if(context===null)return;
  e.decision=decision;e.context=context;LS.set('journal_entries',entries);renderJournal();toast('Updated','ok');
}
function deleteJournalEntry(i){
  if(!confirm('Delete this entry?'))return;
  const entries=LS.get('journal_entries',[]);entries.splice(i,1);LS.set('journal_entries',entries);renderJournal();
}

/* ═══════════════════════════════════════════
   PROGRESS ANALYTICS
   ═══════════════════════════════════════════ */
function renderAnalytics(){
  const el=$('tab-analytics');if(!el)return;
  const scores=LS.get('competency',{});
  const cats=['discovery','strategy','execution','analytics','technical','communication','leadership','design','experimentation'];
  const labels=['Discovery','Strategy','Execution','Analytics','Technical','Comms','Leadership','Design','Experiment'];
  const vals=cats.map(c=>(scores[c]||0)/100);
  const cx=150,cy=155,r=105,n=cats.length,angleStep=Math.PI*2/n;
  const axes=cats.map((_,i)=>{const a=i*angleStep-Math.PI/2;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a),lx:cx+(r+26)*Math.cos(a),ly:cy+(r+26)*Math.sin(a)};});
  let svgRings='';
  for(let ri=1;ri<=5;ri++){const rr=r*ri/5;const pts=cats.map((_,i)=>{const a=i*angleStep-Math.PI/2;return`${cx+rr*Math.cos(a)},${cy+rr*Math.sin(a)}`;}).join(' ');svgRings+=`<polygon points="${pts}" fill="none" stroke="var(--line2)" stroke-width="0.8"/>`;}
  const svgAxes=axes.map(ax=>`<line x1="${cx}" y1="${cy}" x2="${ax.x.toFixed(1)}" y2="${ax.y.toFixed(1)}" stroke="var(--line2)" stroke-width="0.8"/>`).join('');
  const dpts=vals.map((v,i)=>{const a=i*angleStep-Math.PI/2;const rv=r*v;return`${(cx+rv*Math.cos(a)).toFixed(1)},${(cy+rv*Math.sin(a)).toFixed(1)}`;}).join(' ');
  const svgData=`<polygon points="${dpts}" fill="rgba(116,0,1,0.18)" stroke="var(--acc)" stroke-width="2"/>`;
  const svgLabels=axes.map((ax,i)=>`<text x="${ax.lx.toFixed(1)}" y="${ax.ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--ink2)" font-size="9" font-family="Cinzel,serif">${labels[i]}</text>`).join('');
  const svgDots=vals.map((v,i)=>{const a=i*angleStep-Math.PI/2;const rv=r*v;return`<circle cx="${(cx+rv*Math.cos(a)).toFixed(1)}" cy="${(cy+rv*Math.sin(a)).toFixed(1)}" r="4" fill="var(--acc)" stroke="var(--bg2)" stroke-width="2"/>`;}).join('');
  const svgChart=`<svg viewBox="0 0 300 310" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;display:block;margin:0 auto">${svgRings}${svgAxes}${svgData}${svgDots}${svgLabels}</svg>`;
  const log=LS.get('streak_log',{});const today=new Date();
  let calHtml='<div class="cal-grid">';
  for(let d=29;d>=0;d--){const dt=new Date(today.getTime()-d*86400000);const key=dt.toDateString();calHtml+=`<div class="cal-day${log[key]?' cal-active':''}" title="${dt.toLocaleDateString()}"></div>`;}
  calHtml+='</div>';
  const avg=Math.round(cats.reduce((s,c)=>s+(scores[c]||0),0)/cats.length);
  const bookprog=LS.get('bookprog',{});
  const booksDone=allBooks().filter(b=>(bookprog[b.title]||b.pct)>=100).length;
  el.innerHTML=`<div class="pad"><div class="seclbl">Analytics</div><div class="secname">Your Progress Map</div></div>
  <div class="analytics-section pad"><div class="an-label">Competency Radar</div>${svgChart}</div>
  <div class="analytics-section pad gap"><div class="an-label">30-day Study Activity</div>${calHtml}<div style="font-size:12px;color:var(--ink3);margin-top:7px">■ Green = studied that day</div></div>
  <div class="analytics-section pad gap"><div class="an-label">Summary</div>
    <div class="an-stats">
      <div class="an-stat"><div class="an-num">${points()}</div><div class="an-lbl">total pts</div></div>
      <div class="an-stat"><div class="an-num">${streakObj().n||0}</div><div class="an-lbl">day streak</div></div>
      <div class="an-stat"><div class="an-num">${avg}%</div><div class="an-lbl">avg competency</div></div>
      <div class="an-stat"><div class="an-num">${booksDone}</div><div class="an-lbl">books done</div></div>
      <div class="an-stat"><div class="an-num">${LS.get('timer_sessions',0)}</div><div class="an-lbl">pomodoros</div></div>
      <div class="an-stat"><div class="an-num">${Object.values(LS.get('owl_exam_passed',{})).filter(Boolean).length}</div><div class="an-lbl">O.W.L.s earned</div></div>
    </div>
  </div>
  <div class="bpad"></div>`;
}

/* ═══════════════════════════════════════════
   O.W.L. EXAMINATIONS
   ═══════════════════════════════════════════ */
const OWL_QUESTIONS={
  1:[
    {q:'What is a Product Manager primarily responsible for?',opts:['Writing code','Defining what to build and why','Running QA tests','Managing the budget'],c:1,why:'PMs define the problem and outcome — not the implementation.'},
    {q:'What does Marty Cagan mean by "product discovery"?',opts:['Discovering bugs','Validating the right problem before building','Doing only market research','Testing the final product'],c:1,why:'Discovery validates you are solving the right problem before you invest in building.'},
    {q:'What is "Jobs-to-be-Done"?',opts:['A job listing for PMs','The reason a user "hires" a product to do something','A sprint backlog item','A user story format'],c:1,why:'JTBD: "When I [situation] I want to [motivation] so I can [outcome]." Focus on motivation.'},
    {q:'What is the CIRCLES framework used for?',opts:['Competitor analysis','Structuring a product design interview answer','Prioritising features','Hiring engineers'],c:1,why:'CIRCLES = Comprehend, Identify user, Report needs, Cut, List solutions, Evaluate, Summarise.'},
    {q:'What is a North Star Metric?',opts:['A KPI your manager tracks','A single metric capturing core user value that predicts revenue','The number of features shipped','Daily active users always'],c:1,why:'North Star = core value your product delivers. It is a leading indicator, not a vanity metric.'},
    {q:'What does "output vs outcome" mean in PM?',opts:['Output is code, outcome is design','Output is what you build, outcome is the value it creates','They mean the same thing','Outcomes are always revenue'],c:1,why:'PMs are measured on outcomes (did it help users?) not outputs (did we ship?).'},
    {q:'What is an MVP?',opts:['Most Valuable Player','Minimum to test your riskiest assumption with real users','A finished product with bugs','A prototype only designers build'],c:1,why:'MVP = minimum to validate your biggest assumption — not a complete product.'},
    {q:'What is product-market fit?',opts:['When engineering and marketing agree','When customers love your product enough to tell others','When the product has no bugs','When you hit revenue targets'],c:1,why:'PMF = your product solves a real problem so well that customers pull you into the market.'},
    {q:'What is the RICE prioritisation framework?',opts:['Revenue, Impact, Cost, Effort','Reach × Impact × Confidence ÷ Effort','Risk, Investment, Conversion, Execution','Reach, Iteration, Cost, Engineering'],c:1,why:'RICE = Reach × Impact × Confidence ÷ Effort. Higher score = higher priority.'},
    {q:'What do PMs write to align stakeholders on a feature?',opts:['A technical spec','A PRD — Problem, Goals, Success Metrics, Requirements','A sprint plan','A design brief'],c:1,why:'PRD aligns all stakeholders on the why and what before building begins.'}
  ],
  2:[
    {q:'What is a product strategy?',opts:['A list of features to build','A plan defining vision, focus, and what you will NOT do','A marketing plan','The engineering roadmap'],c:1,why:'Strategy = focus and trade-offs. What you will do, what you will prioritise, and what you will consciously ignore.'},
    {q:'What is "competitive positioning"?',opts:['Beating competitors on price','How your product occupies a distinct place in the customer\'s mind','Copying competitor features','Being first to market'],c:1,why:'Positioning is the reason customers choose you over alternatives — own a specific perception.'},
    {q:'What is user segmentation?',opts:['Splitting the codebase by feature','Dividing users into groups with common needs or behaviours','Filtering bug reports','Running A/B tests'],c:1,why:'Segmentation lets you focus on the right users and build specifically for their needs.'},
    {q:'What does the Kano model categorise?',opts:['Competitor products','Features into must-haves, performance features, and delighters','Sprint priorities','UX wireframes'],c:1,why:'Kano helps you identify what creates delight vs what just prevents dissatisfaction.'},
    {q:'What does "retention" mean in AARRR?',opts:['Acquiring new users','Users coming back after their first use','Revenue per user','Referral rate'],c:1,why:'Retention = users returning. It is the foundation of sustainable growth.'},
    {q:'What is a product vision?',opts:['The sprint goal','An aspirational long-term state your product strives towards','A feature list','A go-to-market plan'],c:1,why:'Vision guides all strategy — where you want to be in 3-5 years.'},
    {q:'What is the difference between a feature and an outcome?',opts:['Features are UX, outcomes are code','Features are what you build, outcomes are the value it creates','They mean the same','Outcomes are always revenue'],c:1,why:'Building a feature is not a goal. The goal is a measurable change in user behaviour or business result.'},
    {q:'What is a "pivot" in product development?',opts:['A sprint retrospective','A fundamental change in strategy while keeping learnings','Releasing a new version','A design redesign'],c:1,why:'Pivot = structured course correction based on evidence your current approach is not working.'},
    {q:'What does "switching cost" mean?',opts:['The cost of changing cloud providers','The effort/pain a user faces when moving to a competitor','The cost of running A/B tests','Infrastructure migration cost'],c:1,why:'High switching costs are a moat — users stay because leaving is too painful.'},
    {q:'What is "dogfooding"?',opts:['Using your own product as an internal user','Feeding dogs data','Testing on external users only','A type of sprint'],c:1,why:'Dogfooding builds empathy and surfaces issues your users face.'}
  ],
  3:[
    {q:'What is a "metric tree"?',opts:['A visualisation of all bugs','A hierarchy showing how metrics roll up to the North Star','A sprint burndown chart','A data warehouse schema'],c:1,why:'Metric tree = which levers drive the top-line outcome.'},
    {q:'What makes a good A/B test?',opts:['Running it for one day','Single variable, sufficient sample, statistical significance','Testing as many changes as possible','Only testing on new users'],c:1,why:'Good A/B tests change one variable, run to significance, with a clear hypothesis.'},
    {q:'What is "statistical significance"?',opts:['A result that feels important','Confidence the effect is not due to random chance','P-value above 0.05','A large sample size alone'],c:1,why:'p<0.05 = less than 5% chance the result happened by chance.'},
    {q:'What is a "guardrail metric"?',opts:['A metric you always want to increase','A metric that must not degrade even as you optimise the North Star','A KPI set by the CEO','A sprint velocity measure'],c:1,why:'Guardrail metrics protect against unintended harm — optimise one thing without breaking another.'},
    {q:'What does LTV/CAC ratio measure?',opts:['Load time vs conversion','Lifetime value of a customer divided by cost to acquire them','Revenue vs costs','User growth rate'],c:1,why:'LTV/CAC > 3 is a healthy benchmark — $3 of value for every $1 spent on acquisition.'},
    {q:'What is an "embedding" in AI/ML context?',opts:['A video embedded in a webpage','A numerical vector representing semantic meaning','A model hyperparameter','A type of database index'],c:1,why:'Embeddings map text/images to vectors in a semantic space for similarity search, recommendations, clustering.'},
    {q:'What is "feature engineering"?',opts:['Building product features','Creating/transforming input variables to improve ML model performance','Writing technical docs','Sprint planning'],c:1,why:'Feature engineering uses domain knowledge to make ML models more accurate.'},
    {q:'What is "precision vs recall" in ML?',opts:['Speed vs accuracy','Precision = quality of positives; recall = coverage of real positives','Training vs test performance','Model size vs performance'],c:1,why:'Precision = TP/(TP+FP). Recall = TP/(TP+FN). Trade-off based on use case.'},
    {q:'What is "data infrastructure" in a PM context?',opts:['Server hardware','Systems that collect, store, process, and serve data to the product','Cloud computing only','The BI team'],c:1,why:'PMs need to know what insights are possible, what tracking requires, and where bottlenecks are.'},
    {q:'What is "multivariate testing"?',opts:['Testing across multiple countries','Testing multiple variables simultaneously to find the best combination','Running 2+ A/B tests sequentially','Testing a product on multiple devices'],c:1,why:'Multivariate testing varies multiple elements at once — faster at scale than sequential A/B.'}
  ],
  4:[
    {q:'How should you open a product strategy presentation to leadership?',opts:['Start with technical details','Open with the customer problem, then market size, solution, metrics','List features first','Show competitor analysis first'],c:1,why:'Lead with the customer problem and opportunity — leadership buys into the why before the what.'},
    {q:'What is a "pre-mortem"?',opts:['A post-launch review','Imagining failure and working backwards to find risks beforehand','A technical debt audit','A stakeholder alignment meeting'],c:1,why:'Pre-mortems surface hidden risks before launch — invaluable for de-risking.'},
    {q:'How do you handle sceptical stakeholders?',opts:['Avoid them','Lead with data addressing their concern, then co-create a path','Send email only','Escalate to your manager'],c:1,why:'Sceptics need to feel heard first. Address their concern with data, then co-create — not override.'},
    {q:'What is "influence without authority"?',opts:['Getting a promotion','Achieving outcomes through trust and persuasion rather than reporting lines','Being the loudest in the room','Having final say on decisions'],c:1,why:'PMs lead through vision, trust, and compelling logic — not direct authority over engineers or designers.'},
    {q:'What makes a good product interview case answer?',opts:['Knowing all the answers','Structured thinking: clarify → explore → prioritise → measure → tradeoffs','Giving the most features','Being fast'],c:1,why:'Interviewers test structured thinking. They want to see how you approach ambiguity.'},
    {q:'What is "ruthless prioritisation"?',opts:['Saying no to your team','Consistently focusing on highest-impact work and explicitly deprioritising everything else','Cutting features randomly','Prioritising only engineering tasks'],c:1,why:'Every yes is a no to something else — make that trade-off explicit and visible.'},
    {q:'What must a launch plan cover?',opts:['A deployment checklist only','Communications, support, metrics, rollback strategy, and cross-functional alignment','A marketing campaign','A sprint release'],c:1,why:'Launch plans align sales, support, marketing, and engineering — preventing surprises on day one.'},
    {q:'When must you define success metrics for a new feature?',opts:['After launch, based on data','Before launch, tied specifically to the feature\'s stated goal','At the end of the year','Only for major features'],c:1,why:'Define metrics before launch — otherwise you measure what\'s easy, not what matters.'},
    {q:'What is "technical debt" and why should PMs care?',opts:['A type of product debt','Accumulated shortcuts that slow future development; balance shipping speed vs long-term velocity','A financial term only','Something only engineers care about'],c:1,why:'PMs who ignore tech debt ship features fast initially but kill team velocity over time.'},
    {q:'What question should a PM ask before every feature?',opts:['"How long will this take?"','"Will this solve a real problem for real users, and how will we measure it?"','"What does the CEO want?"','"Can we do this in 2 weeks?"'],c:1,why:'Every feature decision must start with "is this a real problem?" and "how will we know we solved it?"'}
  ]
};
let owlExamState={year:1,qi:0,score:0,secs:0,interval:null};
function renderOwlExam(){
  const el=$('tab-owlexam');if(!el)return;
  const passed=LS.get('owl_exam_passed',{});
  el.innerHTML=`<div class="pad"><div class="seclbl">O.W.L. Examinations</div><div class="secname">Ordinary Wizarding Levels</div><div class="sec-story">10 questions per year. 15 seconds each. Pass 7/10 to earn 50 house points and your O.W.L. certificate. No looking at notes.</div></div>
  <div class="owl-exam-select pad">
    ${[1,2,3,4].map(y=>`<div class="owl-year-card${passed[y]?' owl-passed':''}" onclick="startOwlExam(${y})">
      <div class="owl-year-num">Year ${y}</div>
      <div class="owl-year-label">${['Fundamentals','Product Sense','AI & Metrics','Apply'][y-1]}</div>
      ${passed[y]?'<div class="owl-cert">🎓 O.W.L. Earned</div>':'<div class="owl-start-hint">Tap to sit the exam →</div>'}
    </div>`).join('')}
  </div>
  <div class="bpad"></div>`;
}
function startOwlExam(year){
  clearInterval(owlExamState.interval);
  owlExamState={year,qi:0,score:0,secs:15,interval:null};
  renderOwlQ();
}
function renderOwlQ(){
  const el=$('tab-owlexam');if(!el)return;
  const qs=OWL_QUESTIONS[owlExamState.year];
  if(owlExamState.qi>=qs.length){finishOwlExam();return;}
  const q=qs[owlExamState.qi];
  owlExamState.secs=15;
  clearInterval(owlExamState.interval);
  owlExamState.interval=setInterval(()=>{
    owlExamState.secs--;
    const td=$('owl-timer');if(td)td.textContent=owlExamState.secs+'s';
    if(owlExamState.secs<=0){clearInterval(owlExamState.interval);owlExamState.qi++;renderOwlQ();}
  },1000);
  el.innerHTML=`<div class="pad"><div class="seclbl">O.W.L. · Year ${owlExamState.year}</div><div class="secname">Question ${owlExamState.qi+1} of ${qs.length}</div></div>
  <div class="owl-exam-wrap pad">
    <div class="owl-exam-top"><div class="owl-score-bar"><div class="owl-score-fill" style="width:${owlExamState.qi/qs.length*100}%"></div></div><div class="owl-timer" id="owl-timer">${owlExamState.secs}s</div></div>
    <div class="owl-q">${q.q}</div>
    <div class="owl-opts">${q.opts.map((o,oi)=>`<button class="owl-opt" onclick="answerOwl(${oi})">${o}</button>`).join('')}</div>
  </div>
  <div class="bpad"></div>`;
}
function answerOwl(chosen){
  clearInterval(owlExamState.interval);
  const q=OWL_QUESTIONS[owlExamState.year][owlExamState.qi];
  if(chosen===q.c)owlExamState.score++;
  document.querySelectorAll('.owl-opt').forEach((o,i)=>{o.disabled=true;if(i===q.c)o.classList.add('owl-opt-right');else if(i===chosen&&chosen!==q.c)o.classList.add('owl-opt-wrong');});
  const wrap=document.querySelector('.owl-exam-wrap');
  if(wrap){const fb=document.createElement('div');fb.className='owl-fb '+(chosen===q.c?'owl-fb-ok':'owl-fb-no');fb.textContent=(chosen===q.c?'✓ ':'✗ ')+q.why;wrap.appendChild(fb);}
  setTimeout(()=>{owlExamState.qi++;renderOwlQ();},1800);
}
function finishOwlExam(){
  clearInterval(owlExamState.interval);
  const el=$('tab-owlexam');if(!el)return;
  const passed=owlExamState.score>=7;
  if(passed){const p=LS.get('owl_exam_passed',{});p[owlExamState.year]=true;LS.set('owl_exam_passed',p);addPoints(50);markStudied();}
  el.innerHTML=`<div class="pad"><div class="seclbl">O.W.L. Result · Year ${owlExamState.year}</div><div class="secname">${passed?'Outstanding — O.W.L. Achieved!':'Not yet achieved'}</div></div>
  <div class="owl-result-wrap pad">
    <div class="owl-result-score${passed?' owl-result-pass':' owl-result-fail'}">${owlExamState.score}/10</div>
    <div class="owl-result-label">${passed?'🎓 +50 house points earned!':'You need 7/10 to pass. Review the curriculum and retry.'}</div>
    <div class="owl-result-bar"><div style="height:100%;width:${owlExamState.score*10}%;background:${passed?'var(--ok)':'var(--acc)'};border-radius:4px;transition:width .6s ease;"></div></div>
    <div class="owl-result-pass-line">${passed?'Your O.W.L. in Year '+owlExamState.year+' PM is recorded.':'Keep studying — you\'re getting there.'}</div>
    <div style="margin-top:16px;display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn p" onclick="startOwlExam(${owlExamState.year})">↺ Retry</button>
      <button class="btn g" onclick="renderOwlExam()">← All years</button>
      <button class="btn g" onclick="navTo('curriculum')">📜 Review curriculum</button>
    </div>
  </div>
  <div class="bpad"></div>`;
}

/* ═══════════════════════════════════════════
   AI MENTOR (Dumbledore)
   ═══════════════════════════════════════════ */
let mentorHistory=[];
function renderMentor(){
  const el=$('tab-mentor');if(!el)return;
  const key=LS.get('gemini_key','');
  if(!key){
    el.innerHTML=`<div class="pad"><div class="seclbl">AI Mentor</div><div class="secname">Albus Dumbledore, PM</div></div>
    <div class="pad"><div class="mentor-no-key">🧙 Dumbledore awaits.<br><br>To activate the AI Mentor, add your free Gemini API key in <strong>Settings</strong>. It takes 30 seconds to get one at Google AI Studio.</div>
    <div style="margin-top:12px"><button class="btn p" onclick="navTo('settings')">Go to Settings ↗</button></div></div>
    <div class="bpad"></div>`;
    return;
  }
  const quickAsks=['Explain product discovery vs delivery','How do I prepare for a PM interview?','What framework should I use for prioritisation?','How do I improve my analytics competency?','Coach me on telling my NoBroker story'];
  el.innerHTML=`<div class="pad"><div class="seclbl">AI Mentor</div><div class="secname">Albus Dumbledore, PM</div><div class="sec-story">Ask anything about product management. Dumbledore draws on 150 years of building wizarding products.</div></div>
  <div class="mentor-wrap">
    <div class="mentor-chat" id="mentor-chat">${mentorHistory.length?mentorHistory.map(m=>`<div class="mentor-msg${m.role==='user'?' mentor-msg-user':' mentor-msg-ai'}"><div class="mentor-bubble">${m.text.replace(/\n/g,'<br>')}</div></div>`).join(''):'<div class="mentor-welcome"><div class="mentor-avatar">🧙</div><div class="mentor-welcome-txt">Welcome, young PM. What wisdom do you seek?<br><small>Try asking about PM strategy, interview prep, or your NoBroker work.</small></div></div>'}</div>
    <div class="mentor-quick-asks">${quickAsks.map(q=>`<button class="mentor-quick" onclick="quickAsk('${q}')">${q}</button>`).join('')}</div>
    <div class="mentor-input-row">
      <textarea class="mentor-input" id="mentor-input" placeholder="Ask about PM strategy, interview prep, your NoBroker projects…" rows="2" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();askMentor();}"></textarea>
      <button class="mentor-send" onclick="askMentor()">Ask →</button>
    </div>
  </div>
  <div class="bpad"></div>`;
  const chat=$('mentor-chat');if(chat)chat.scrollTop=chat.scrollHeight;
}
function quickAsk(q){const inp=$('mentor-input');if(inp){inp.value=q;askMentor();}}
async function askMentor(){
  const inp=$('mentor-input');if(!inp)return;
  const q=inp.value.trim();if(!q)return;
  inp.value='';
  mentorHistory.push({role:'user',text:q});
  renderMentor();
  const chat=$('mentor-chat');
  if(chat){const th=document.createElement('div');th.className='mentor-msg mentor-msg-ai';th.id='mentor-thinking';th.innerHTML='<div class="mentor-bubble mentor-thinking">Dumbledore is thinking…</div>';chat.appendChild(th);chat.scrollTop=chat.scrollHeight;}
  const scores=LS.get('competency',{});
  const cats=['discovery','strategy','execution','analytics','technical','communication','leadership','design','experimentation'];
  const weakest=cats.reduce((w,c)=>(scores[c]||0)<(scores[w]||0)?c:w,'discovery');
  const ctx=`You are Professor Dumbledore, but also a world-class Product Manager with deep wisdom. You speak with warmth, clarity, and occasional magical metaphors. Keep responses concise — 3-5 sentences unless detail is needed. The person is Ujjwal, a Business Analyst at NoBroker (Indian prop-tech) transitioning to PM. He has 4 years of BA experience, shipped 5 AI tools solo (ML pipeline, WhatsApp bot, Call Quality Analyzer, event CRM for 200+ concurrent buyers). His weakest PM competency right now is ${weakest}. Answer this PM question practically and encouragingly:\n\n${q}`;
  const ans=await geminiCall(ctx);
  const thinking=document.getElementById('mentor-thinking');if(thinking)thinking.remove();
  mentorHistory.push({role:'ai',text:ans||'Even the greatest wizards have off days. Check your Gemini API key in Settings and try again.'});
  renderMentor();
}

/* ═══════════════════════════════════════════
   AI JOB FIT SCORER
   ═══════════════════════════════════════════ */
async function scoreJD(){
  const jdInput=$('jd-input');if(!jdInput)return;
  const jd=jdInput.value.trim();if(!jd){toast('Paste a job description first');return;}
  const btn=$('jd-score-btn');if(btn){btn.textContent='Scoring…';btn.disabled=true;}
  const ctx=`You are an expert PM recruiter. Analyse this job description and score how well it fits a candidate who: is a 4-year Business Analyst at NoBroker (Indian prop-tech), has shipped 5 AI tools solo (ML pipeline, WhatsApp bot, Call Quality Analyzer, event CRM), is transitioning to PM with structured PM study, strong execution and analytics background, no formal PM title yet.

Score 0-100% and explain briefly. Then list 5 specific interview questions this company will likely ask. Format exactly as:
FIT SCORE: [number]%
WHY: [2-3 sentences]
TOP 5 QUESTIONS:
1. [question]
2. [question]
3. [question]
4. [question]
5. [question]

Job Description:
${jd.slice(0,2500)}`;
  const result=await geminiCall(ctx);
  if(btn){btn.textContent='Score with Gemini →';btn.disabled=false;}
  const out=$('jd-result');if(!out)return;
  if(result){
    const scoreMatch=result.match(/FIT SCORE:\s*(\d+)/i);
    const score=scoreMatch?parseInt(scoreMatch[1]):0;
    const color=score>=80?'var(--ok)':score>=60?'var(--wa)':'var(--bad)';
    const body=result.replace(/FIT SCORE:\s*\d+%?/i,'').trim().replace(/\n/g,'<br>');
    out.innerHTML=`<div class="jd-score-result"><div class="jd-score-top"><div class="jd-score-num" style="color:${color}">${score}%</div><div class="jd-score-label">${score>=80?'Strong fit':score>=60?'Good fit':'Moderate fit'}</div></div><div class="jd-score-body">${body}</div></div>`;
  }else{
    out.innerHTML='<div class="empty-state">Could not score. Check your Gemini key in Settings.</div>';
  }
}

/* ═══════════════════════════════════════════
   AI MOCK INTERVIEW EVALUATOR
   ═══════════════════════════════════════════ */
async function evaluateAnswer(){
  const q=$('mock-q');const a=$('mock-ans');if(!q||!a)return;
  const qtext=q.textContent;const atext=a.value.trim();
  if(!atext){toast('Write your answer first');return;}
  const existing=document.getElementById('ai-eval-result');if(existing)existing.remove();
  const ctx=`You are a PM interview coach. Evaluate this answer concisely using the STAR framework. Score 1-10. Be direct.

Question: ${qtext}
Answer: ${atext}

Respond in this format:
SCORE: [1-10]/10
STRENGTHS: [1-2 sentences]
IMPROVE: [1-2 specific suggestions]
STAR: Situation [✓/✗] Task [✓/✗] Action [✓/✗] Result [✓/✗]`;
  toast('Evaluating with Gemini…','info');
  const result=await geminiCall(ctx);
  if(result){
    const div=document.createElement('div');div.id='ai-eval-result';div.className='ai-eval-result';
    div.innerHTML=result.replace(/SCORE:\s*(\d+\/10)/i,'<strong>AI Score: $1</strong>').replace(/\n/g,'<br>');
    const mhint=document.querySelector('.mhint');if(mhint)mhint.before(div);
  }
}

/* INIT */
loadState();
renderHall();
renderJobs('all');
renderKanban();
renderCoach();
loadLiveJobs();
spawnCandles();
handleRoute();
