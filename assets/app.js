/* PM Launchpad — app logic. Vanilla JS, no build step. */

let curWk=1, curPhase=1, curTab='hall', curVideoYear=1, curFilter='all';

const LS={
  get:(k,d)=>{try{const v=localStorage.getItem('pml_'+k);return v!==null?JSON.parse(v):d;}catch(e){return d;}},
  set:(k,v)=>{try{localStorage.setItem('pml_'+k,JSON.stringify(v));}catch(e){}}
};
const $=id=>document.getElementById(id);

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
function sw(t,evt){
  curTab=t; closeSheet(); flyOwl(evt);
  document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('on',el.id==='tab-'+t));
  document.querySelectorAll('[data-t]').forEach(el=>el.classList.toggle('on',el.dataset.t===t));
  window.scrollTo(0,0);
  if(t==='curriculum')renderWeekTasks();
  if(t==='pensieve')renderVideos();
  if(t==='library')renderLibrary();
  if(t==='owl')renderJobs(curFilter);
  if(t==='goblet')renderKanban();
  if(t==='duel')renderCoach();
  if(t==='hogsmeade')renderFun();
}
function openSheet(){$('more-sheet').hidden=false;}
function closeSheet(){const s=$('more-sheet');if(s)s.hidden=true;}
function sheetGo(t,evt){closeSheet();sw(t,evt);}

/* GREAT HALL */
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
  $('jprev').innerHTML=JOBS.slice(0,3).map(j=>{
    const fc=j.fit>=80?'c-ok':j.fit>=65?'c-wa':'c-mu';
    return `<div class="jp" onclick="sw('owl')"><div class="jp-logo" style="background:${j.logobg}">${j.logo}</div><div style="flex:1;min-width:0;"><div class="jp-role">${j.role}</div><div class="jp-co">${j.co}</div></div><div class="jp-fit ${fc}">${j.fit}%</div></div>`;
  }).join('');
}

/* CURRICULUM */
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
function toggleTask(i){markStudied();const done=LS.get('tasks_'+curWk,[]);const was=done[i];done[i]=!done[i];LS.set('tasks_'+curWk,done);if(!was)addPoints(5);renderWeekTasks();}

/* PENSIEVE */
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
      <div class="vacts">${watchBtn}<button class="btn g" onclick="toggleQuiz('${key}')">🔮 Cast the spell</button></div>
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
  wrap.innerHTML=`<div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0" title="video" allow="accelerate 2d; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
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
  if(!already){qd[key]=true;LS.set('quizdone',qd);$('vl-'+key).classList.add('done');if(chosen===correct)addPoints(10);markStudied();}
}

/* LIBRARY */
function allBooks(){let a=[];[1,2,3,4].forEach(p=>a=a.concat(BOOKS_BY_PHASE[p]));return a;}
function renderLibrary(){
  const all=allBooks(); const prog=LS.get('bookprog',{});
  $('shelf-spines').innerHTML=all.map((b,i)=>{const h=108+((i*13)%42);return `<div class="spine" style="background:${b.color};height:${h}px;" title="${b.title}" onclick="openBook('${encodeURIComponent(b.title)}')">${b.title}</div>`;}).join('');
  $('book-list').innerHTML=all.map((b,i)=>{
    const pct=prog[b.title]!==undefined?prog[b.title]:b.pct;
    const st=pct===0?'ns':pct>=100?'dn':'rd';
    const lbl={ns:'Not started',rd:'Reading',dn:'Done'}[st];
    const readBtn=b.pdf?`<button class="btn p" onclick="openBook('${encodeURIComponent(b.title)}')">📖 Read</button>`:`<button class="btn g" onclick="openBook('${encodeURIComponent(b.title)}')">＋ Add your PDF</button>`;
    return `<div class="bk rise" style="animation-delay:${i*45}ms"><div class="bksp" style="background:${b.color}">📖</div><div style="flex:1;min-width:0;"><div class="bkttl">${b.title}</div><div class="bkauth">${b.author}</div><div class="bktake">${b.take}</div>
      <div class="bkrow"><span class="bkst ${st}">${lbl}</span><div class="bkbar"><div class="bkfill" style="width:${pct}%"></div></div><span class="bkpct">${pct}%</span></div>
      <div class="bkacts">${readBtn}<a class="btn g" href="${b.buy}" target="_blank" rel="noopener">Buy / borrow</a></div></div></div>`;
  }).join('');
}

/* PDF reader — themed text extraction */
let pdfDoc=null, pdfPage=1, pdfTitle='';
function openBook(encTitle){
  const title=decodeURIComponent(encTitle);
  const b=allBooks().find(x=>x.title===title); if(!b) return;
  pdfTitle=title;
  $('bk-title').textContent=title;
  $('bk-sub').textContent=b.author+' · '+b.take;
  const body=$('bk-body');
  if(b.pdf){
    body.innerHTML=`<div class="pdfbar"><button class="btn g" onclick="pdfPrev()">‹ Prev</button><span class="pdfpage" id="pdf-page">Summoning…</span><button class="btn g" onclick="pdfNext()">Next ›</button><span style="flex:1"></span><button class="btn g" id="bk-save" onclick="saveBookProgress()">💾 Save progress</button></div><div id="pdf-text-wrap" class="themed-text"><canvas id="pdf-canvas" style="display:none"></canvas></div>`;
    $('book-modal').hidden=false;
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
function saveManual(){const v=parseInt($('man-range').value)||0;const prog=LS.get('bookprog',{});prog[pdfTitle]=v;LS.set('bookprog',prog);markStudied();closeBook();renderLibrary();}
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
function renderPdfPage(){
  if(!pdfDoc)return;
  const wrap=$('pdf-text-wrap');
  wrap.innerHTML='<div class="tt-loading">Summoning page…</div><canvas id="pdf-canvas" style="display:none"></canvas>';
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
        wrap.innerHTML=`<div class="tt-page-num">— Page ${pdfPage} —</div>${html}`;
      }else{
        const canvas=$('pdf-canvas');
        const scale=2;
        const vp=page.getViewport({scale});
        canvas.width=vp.width; canvas.height=vp.height;
        canvas.style.cssText='display:block;max-width:680px;width:100%;height:auto;margin:0 auto;';
        page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise.then(()=>{
          wrap.innerHTML='';
          wrap.appendChild(document.createElement('div')).className='tt-page-num';
          wrap.firstChild.textContent=`— Page ${pdfPage} —`;
          wrap.appendChild(canvas);
        });
      }
      wrap.scrollTop=0;
      $('pdf-page').textContent=`Page ${pdfPage} of ${pdfDoc.numPages}`;
    });
  });
}
function pdfPrev(){if(pdfDoc&&pdfPage>1){pdfPage--;renderPdfPage();}}
function pdfNext(){if(pdfDoc&&pdfPage<pdfDoc.numPages){pdfPage++;renderPdfPage();}}
function saveBookProgress(){
  if(!pdfDoc)return;
  const sp=LS.get('bookpage',{});sp[pdfTitle]=pdfPage;LS.set('bookpage',sp);
  const prog=LS.get('bookprog',{});prog[pdfTitle]=Math.round(pdfPage/pdfDoc.numPages*100);LS.set('bookprog',prog);
  markStudied();
  $('bk-save').textContent='Saved ✓';
  setTimeout(()=>{closeBook();renderLibrary();},600);
}
function closeBook(){$('book-modal').hidden=true;pdfDoc=null;}

/* OWL POST */
function filterJobs(f){curFilter=f;document.querySelectorAll('[data-f]').forEach(el=>el.classList.toggle('on',el.dataset.f===f));renderJobs(f);}
function renderJobs(f){
  let jobs=JOBS;
  if(f==='strong')jobs=jobs.filter(j=>j.isStrong);
  else if(f==='new')jobs=jobs.filter(j=>j.isNew);
  else if(f==='internal')jobs=jobs.filter(j=>j.isInternal);
  const jl=$('jlist'); if(!jl)return;
  jl.innerHTML=jobs.map((j,i)=>{
    const fc=j.fit>=80?'c-ok':j.fit>=65?'c-wa':'c-mu';
    const fl=j.fit>=80?'Strong fit':j.fit>=65?'Good fit':'Moderate';
    const apply=j.applyUrl?`<a class="btn g" href="${j.applyUrl}" target="_blank" rel="noopener">Apply ↗</a>`:'';
    return `<div class="jc rise" style="animation-delay:${i*50}ms"><div class="jctop"><div class="jclogo" style="background:${j.logobg}">${j.logo}</div><div style="flex:1;min-width:0;"><div class="jcrole">${j.role}</div><div class="jcco">${j.co}</div></div><div class="jcfit"><div class="jcnum ${fc}">${j.fit}%</div><div class="jclbl ${fc}">${fl}</div></div></div>
    <div class="jctags">${j.tags.map(t=>{let c='';if(t.indexOf('₹')>-1)c=' sal';else if(t==='New')c=' new';return `<span class="jt${c}">${t}</span>`;}).join('')}</div>
    <div class="jcwhy">${j.why}</div>
    <div class="jcacts"><button class="btn p" onclick="openLocker('${j.id}')">🔓 Locker room</button>${apply}</div></div>`;
  }).join('');
}

/* GOBLET */
function renderKanban(){
  const kb=$('kanban'); if(!kb)return;
  kb.innerHTML=KANBAN.map(col=>`<div class="kbc"><div class="kbh"><div class="kbst" style="background:${col.color}"></div><div class="kbname">${col.name}</div><div class="kbcnt">${col.cards.length}</div></div><div class="kbcards">${col.cards.map(c=>`<div class="ac2"><div class="acrole">${c.role}</div><div class="acco">${c.co}</div><div class="acrow"><span class="acdate">${c.date}</span><span class="acfit ${c.fc}">${c.fit}% fit</span></div></div>`).join('')}<button class="addcrd">+ Add</button></div></div>`).join('');
}

/* DUELLING CLUB */
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
function showMockQ(){const it=mockPool[mockI%mockPool.length];$('mock-q').textContent=it.q;$('mock-cat-label').textContent=it.cat+' · Duel '+(mockI+1);}
function nextQ(){mockI++;$('mock-ans').value='';showMockQ();}
function closeMock(){$('mock-modal').hidden=true;}

/* LOCKER ROOM */
function openLocker(id){
  const j=JOBS.find(x=>x.id===id); if(!j)return;
  $('lk-title').textContent=j.role+' — '+j.co;
  $('lk-sub').textContent=j.fit+'% fit · '+j.tags.join(' · ');
  $('lq-list').innerHTML=(j.questions||[]).map((q,i)=>`<div class="lq">${i+1}. ${q}</div>`).join('');
  $('lk-cv-content').textContent=j.cv||'';
  $('lk-msg-content').textContent=j.msg||'';
  $('lk-brief-content').innerHTML='<strong>'+j.co+'</strong><br><br>'+(j.brief||'');
  const al=$('lk-apply'); if(al){if(j.applyUrl){al.href=j.applyUrl;al.style.display='inline-flex';}else{al.style.display='none';}}
  switchLocker('questions');$('locker-modal').hidden=false;
}
function switchLocker(tab){const tabs=['questions','cv','msg','brief'];document.querySelectorAll('#locker-modal .lt').forEach((el,i)=>el.classList.toggle('on',tabs[i]===tab));document.querySelectorAll('#locker-modal .ls').forEach((el,i)=>el.classList.toggle('on',tabs[i]===tab));}
function closeLocker(){$('locker-modal').hidden=true;}

function copyEl(id){const el=$(id);if(!el)return;try{navigator.clipboard.writeText(el.textContent).catch(()=>{const r=document.createRange();r.selectNode(el);getSelection().removeAllRanges();getSelection().addRange(r);});}catch(e){}}
function toggleTheme(){const cur=document.documentElement.getAttribute('data-theme')||'';const next=cur==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);LS.set('theme',next);}

document.addEventListener('click',e=>{if(e.target.classList&&e.target.classList.contains('mover'))e.target.hidden=true;});

/* PHASE B — live jobs from the published Google Sheet (falls back to sample data) */
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
      return {id:get('id')||'live'+Math.random().toString(36).slice(2,7),co:co,role:role,logo:"🦉",logobg:"#e3ece4",
        fit:fit,tags:tags,applyUrl:get('url'),why:get('why')||'Pulled by the owl and fit-scored for you.',
        isNew:get('isNew').toLowerCase()==='true',isStrong:fit>=80,isInternal:false,
        questions:(get('questions')||'').split(' || ').filter(Boolean),
        cv:defaultCv(),msg:defaultMsg(role,co),brief:get('brief')||''};
    }).filter(j=>j.fit>0).sort((a,b)=>b.fit-a.fit);
    if(live.length){ JOBS.length=0; live.forEach(j=>JOBS.push(j)); renderJobs(curFilter); renderHall(); }
  }).catch(()=>{ /* keep sample data */ });
}

/* Floating candles — Great Hall ambiance */
function spawnCandles(){
  const layer=$('candle-layer'); if(!layer)return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const count=window.innerWidth<600?5:9;
  let html='';
  for(let i=0;i<count;i++){
    const left=8+Math.random()*84;
    const top=5+Math.random()*60;
    const delay=Math.random()*5;
    const size=14+Math.random()*6;
    html+=`<div class="candle" style="left:${left}%;top:${top}%;animation-delay:${delay}s;font-size:${size}px">🕯️</div>`;
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

loadState();
renderHall();
renderJobs('all');
renderKanban();
renderCoach();
loadLiveJobs();
spawnCandles();
