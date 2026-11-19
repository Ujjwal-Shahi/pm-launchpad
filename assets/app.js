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
const TAB_NAMES={hall:'Great Hall',curriculum:'Curriculum',pensieve:'The Pensieve',library:'The Library',owl:'Owl Post',goblet:'Goblet of Fire',duel:'Duelling Club',hogsmeade:'Hogsmeade',prd:'The Decree',vault:'Portfolio Vault',competency:'Competency',knowledge:'Knowledge Vault',settings:'Settings'};
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
function markStudied(){const s=streakObj();const today=new Date().toDateString();if(s.last!==today){const y=new Date(Date.now()-86400000).toDateString();s.n=s.last===y?(s.n||0)+1:1;s.last=today;LS.set('streak',s);renderStreak();}}

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
  html=`<div class="pad"><div class="seclbl">Settings</div><div class="secname">Personalisation</div></div>
  <div class="settings-list pad">
    <div class="set-group"><div class="set-label">Theme</div><div class="set-ctrl"><button class="btn ${theme!=='dark'?'p':'g'}" onclick="setTheme('light')">Daylight</button><button class="btn ${theme==='dark'?'p':'g'}" onclick="setTheme('dark')">Candlelight</button></div></div>
    <div class="set-group"><div class="set-label">Reader font size</div><div class="set-ctrl"><span id="set-zoom">${zoom}%</span><input type="range" min="70" max="150" value="${zoom}" oninput="setReaderZoom(this.value)" style="flex:1"></div></div>
    <div class="set-group"><div class="set-label">Export data</div><div class="set-ctrl"><button class="btn g" onclick="exportData()">Download backup</button></div></div>
    <div class="set-group"><div class="set-label">Reset progress</div><div class="set-ctrl"><button class="btn g" style="color:var(--bad)" onclick="resetProgress()">Reset all</button></div></div>
  </div>`;
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

/* INIT */
loadState();
renderHall();
renderJobs('all');
renderKanban();
renderCoach();
loadLiveJobs();
spawnCandles();
handleRoute();
