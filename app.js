'use strict';
const BOOK_FILES = Object.freeze({barker2009:'./vault/barker2009.pdf.enc',podcast2025:'./vault/podcast2025.pdf.enc'});
const STORE_KEY='vivalab_final_anaesthesia_v1';
const SOURCE_ID='barker2009';
const caseDisclosureState=new Map();
function caseDisclosureAttrs(c,section){
 const key=String(c.id)+':'+section;
 return 'data-case-id="'+H(c.id)+'" data-case-section="'+section+'"'+(caseDisclosureState.get(key)!==false?' open':'');
}

const BUILT_IN_IDS = new Set([...BUILT_IN.questions,...NEW_BOOK.questions].map(q=>q.id));
const BUILT_IN_CASE_IDS = new Set([...BUILT_IN.cases,...NEW_BOOK.cases].map(c=>c.id));
function caseIntroHtml(c){if(!c)return '<p>Clinical scenario unavailable.</p>';if(BUILT_IN_CASE_IDS.has(c.id)&&c.scenarioRich)return c.scenarioRich;return String(c.scenario||'Refer to clinical case details.').split(/\n\s*\n/).filter(x=>x.trim()).map(x=>'<p>'+H(x.trim()).replace(/\n/g,'<br>')+'</p>').join('');}
function sourceAnswerHtml(q){
 if(BUILT_IN_IDS.has(q.id)&&q.rich)return q.rich;
 return String(q.a||'').split(/\n\s*\n/).filter(x=>x.trim()).map(x=>'<p>'+H(x.trim()).replace(/\n/g,'<br>')+'</p>').join('');
}
function caseGallery(c){
 if(!c)return '';if(!Array.isArray(c.figures)||!c.figures.length){return renderCaseTables(c)};
 return `<details class="case-figures" ${caseDisclosureAttrs(c,'images')}><summary>Clinical images · ${c.figures.length} image${c.figures.length!==1?'s':''}</summary><div class="figure-flex">${c.figures.map((f,i)=>`<figure><img class="zoomable-figure" tabindex="0" role="button" title="Tap to enlarge" loading="lazy" decoding="async" width="${Number(f.width)||640}" height="${Number(f.height)||480}" src="${f.src}" alt="Textbook illustration ${i+1} for ${H(c.title)}"><figcaption>${H(c.title)} · book p. ${Number(f.page)||'—'}</figcaption></figure>`).join('')}</div></details>${renderCaseTables(c)}`;
}
function renderCaseTables(c){if(!c||!c.tables?.length)return '';return `<details class="case-figures" ${caseDisclosureAttrs(c,'tables')}><summary>Reference tables · ${c.tables.length}</summary><div class="source-tables">${c.tables.map(t=>`<section class="source-table"><h4>${H(t.title)} · p. ${t.page}</h4>${t.html}</section>`).join('')}</div></details>`;}

const photoState={scale:1,x:0,y:0,pointers:new Map(),start:null};
function viewerDraw(){const img=document.querySelector('#vivaImagePreview');if(img)img.style.transform=`translate(${photoState.x}px,${photoState.y}px) scale(${photoState.scale})`}
function openImage(src,alt='Figure'){
 const layer=document.createElement('div');layer.id='vivaImageLayer';layer.className='image-layer';layer.innerHTML='<div class="image-toolbar"><strong>Image</strong><div class="image-ctrl"><button type="button" data-image-action="minus" aria-label="Zoom out">−</button><button type="button" data-image-action="reset">Reset</button><button type="button" data-image-action="plus" aria-label="Zoom in">+</button><button type="button" data-image-action="close" aria-label="Close image">✕</button></div></div><div id="vivaImageStage" class="image-stage"><img id="vivaImagePreview" draggable="false"></div>';
 document.body.append(layer);const img=layer.querySelector('#vivaImagePreview');img.src=src;img.alt=alt;photoState.scale=1;photoState.x=0;photoState.y=0;photoState.pointers.clear();viewerDraw();document.body.classList.add('image-viewer-open');layer.querySelector('[data-image-action=close]').focus();
 const stage=layer.querySelector('#vivaImageStage');
 stage.addEventListener('pointerdown',ev=>{ev.preventDefault();stage.setPointerCapture(ev.pointerId);photoState.pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});photoState.start=null});
 stage.addEventListener('pointermove',ev=>{if(!photoState.pointers.has(ev.pointerId))return;ev.preventDefault();let old=photoState.pointers.get(ev.pointerId);let dx=ev.clientX-old.x,dy=ev.clientY-old.y;photoState.pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});let pts=[...photoState.pointers.values()];if(pts.length===1){photoState.x+=dx;photoState.y+=dy}else if(pts.length>=2){let d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(photoState.start){let ratio=d/photoState.start;photoState.scale=Math.max(1,Math.min(10,photoState.scale*ratio))}photoState.start=d}viewerDraw()});
 const end=ev=>{photoState.pointers.delete(ev.pointerId);photoState.start=null};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
 stage.addEventListener('wheel',ev=>{ev.preventDefault();photoState.scale=Math.max(1,Math.min(10,photoState.scale*(ev.deltaY<0?1.2:.83)));viewerDraw()},{passive:false});
 stage.addEventListener('dblclick',()=>{photoState.scale=photoState.scale>1?1:2.5;photoState.x=0;photoState.y=0;viewerDraw()});
 layer.addEventListener('click',ev=>{let bt=ev.target.closest('[data-image-action]');if(!bt)return;let act=bt.dataset.imageAction;if(act==='close'){closeImage();return}if(act==='reset'){photoState.scale=1;photoState.x=0;photoState.y=0}else photoState.scale=Math.min(10,Math.max(1,photoState.scale*(act==='plus'?1.5:1/1.5)));viewerDraw()});
}
function closeImage(){document.querySelector('#vivaImageLayer')?.remove();document.body.classList.remove('image-viewer-open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#vivaImageLayer')){e.preventDefault();e.stopImmediatePropagation();closeImage()}},true);
const VIEW_NAMES={search:'Search results',overview:'Overview',bank:'Question bank',study:'Study cards',mock:'Mock viva',insights:'My progress',library:'Sources & settings',sessions:'Session history'};
const RATINGS={again:{label:'Again',weight:0},hard:{label:'Hard',weight:1},good:{label:'Good',weight:2},easy:{label:'Easy',weight:3}};
const H=e=>String(e??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const randomId=()=>('u'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));
const fmtTime=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const T=(a,b)=>a.toLowerCase().includes(b.toLowerCase());
let saved=window.vivaSaved||{};
let userCases=Array.isArray(saved.userCases)?saved.userCases:[],userQs=Array.isArray(saved.userQs)?saved.userQs:[],sources=Array.isArray(saved.sources)?saved.sources:[];
let progress=saved.progress&&typeof saved.progress==='object'?saved.progress:{},notes=saved.notes&&typeof saved.notes==='object'?saved.notes:{},log=Array.isArray(saved.log)?saved.log:[];
let prefs={theme:'light',accent:'teal',font:1,...(saved.prefs||{})};if(prefs.theme==='system'&&!saved.prefs?.explicitTheme)prefs.theme='light';
let cases=[],questions=[],caseById=new Map(),qById=new Map();
let S={globalQuery:'',source:'all',view:'overview',type:'all',category:'all',status:'all',search:'',selectedCase:null,selectedQ:null,reveal:false,answerMode:'full',study:null,mock:null,studyKind:'all',studyLength:20,studyWeak:false,bankCollapsed:false,bankFiltersOpen:false,bankView:prefs.bankView==='continuous'?'continuous':'single',bankReveal:prefs.bankReveal==='all'?'all':'manual',navExpanded:false,bankOpenQ:{}};
let timerInterval=null,pdfUrl=null;
let sessions=Array.isArray(saved.sessions)?saved.sessions.filter(x=>x&&x.id&&x.kind):[],currentSessionId=null;
let verseIndex=0;
const isMobile=()=>window.matchMedia('(max-width:770px)').matches;
let saveSequence=Promise.resolve();
function persist(){
 const snapshot=JSON.stringify({userCases,userQs,sources,progress,notes,log:log.slice(0,600),prefs,sessions:sessions.slice(0,150)});
 saveSequence=saveSequence.catch(()=>{}).then(async()=>{
   try {const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},window.vivaKey,new TextEncoder().encode(snapshot)));const packed=new Uint8Array(iv.length+cipher.length);packed.set(iv);packed.set(cipher,12);localStorage.setItem(STORE_KEY+'_encrypted',bytesToBase64(packed));localStorage.removeItem(STORE_KEY);}
   catch(e){console.warn('Progress could not be saved:',e);toast('Progress could not be saved. Export a backup from Settings.');}
 });
}


const QURAN_VERSES=[
 {ref:'31:27',quote:'If all the trees on earth were pens and the sea were ink, the words of Allah would not be exhausted.',summary:'The knowledge and words of Allah are beyond measure.'},
 {ref:'39:9',quote:'Are those who know equal to those who do not know? Only people of understanding take heed.',summary:'The value of knowledge and reflection.'},
 {ref:'67:2',quote:'He created death and life to test which of you is best in deeds.',summary:'Purpose and excellence in action.'},
 {ref:'51:56',quote:'I created the jinn and humankind only to worship Me.',summary:'Purpose, worship and intention.'},
 {ref:'23:12–14',quote:'We created humankind from clay, then through successive stages of development. Blessed is Allah, the best of creators.',summary:'Reflection on human development and creation.'},
 {ref:'30:20',quote:'Among His signs is that He created you from dust, and then you became people spread throughout the earth.',summary:'Creation as a sign inviting contemplation.'},
 {ref:'95:4',quote:'We have indeed created humankind in the best of form.',summary:'Human dignity and responsibility.'},
 {ref:'16:78',quote:'Allah brought you from your mothers’ wombs knowing nothing, and gave you hearing, sight and understanding so you might be grateful.',summary:'Learning, sensory gifts and gratitude.'},
 {ref:'3:190',quote:'In the creation of the heavens and the earth, and the alternation of night and day, are signs for people of understanding.',summary:'Observation and contemplation of the world.'},
 {ref:'40:67',quote:'He created you from dust, then from a drop, then through further stages, bringing you forth as a child and allowing you to mature.',summary:'The stages of human life.'},
 {ref:'36:77',quote:'Does the human being not reflect that We created him from a drop, yet he becomes a clear disputant?',summary:'Humility and reflection on one’s origin.'},
 {ref:'21:104',quote:'As We began the first creation, so shall We repeat it. This is a promise We shall fulfil.',summary:'Creation, accountability and the promise of resurrection.'}
];
const HOME_VERSES=[
 {ref:'1:1',quote:'In the name of Allah, the Most Gracious, the Most Merciful'},
 {ref:'2:32',quote:'They said, ‘Glory be to You! We have no knowledge except what You have taught us. You are truly the All-Knowing, All-Wise.’'}
];
function rotateVerse(){verseIndex=(verseIndex+1)%QURAN_VERSES.length}
function sessionTitle(s){return s.kind==='browse'?'Question Bank browsing':s.kind==='study'?'Study cards':s.kind==='mock'?(s.state?.mode==='full'?'Full mock viva':'Rapid mock viva'):'Revision session'}
function sessionStatus(s){return s.completed?'Completed':'Continue'}
function sessionPosition(s){let state=s.state||{};if(s.kind==='browse'){const c=caseById.get(state.selectedCase);const count=state.visited?.length||0;return (c?.title||'Question Bank')+' · '+count+' '+(count===1?'topic':'topics')+' visited'}if(s.kind==='study')return `${Math.min((state.index||0)+1,state.queue?.length||0)} / ${state.queue?.length||0} questions`;
 const phase=['Preparation','Long case','Short cases'][state.phase||0]||'Mock viva';return phase+' · '+fmtTime(Math.max(0,state.remaining||0))+' remaining'}
function sessionDate(s){try{return new Date(s.updatedAt||s.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}catch{return 'Earlier session'}}
function updateCurrentSession(completed=false){if(!currentSessionId)return;let session=sessions.find(x=>x.id===currentSessionId);if(!session)return;let state=session.kind==='study'?S.study:session.kind==='mock'?S.mock:{...session.state,selectedCase:S.selectedCase,selectedQ:S.selectedQ,scrollY:window.scrollY,caseScrollTop:document.querySelector('.case-scroll')?.scrollTop||0};if(!state)return;session.state=JSON.parse(JSON.stringify(state));session.updatedAt=Date.now();if(completed||state.done||(session.kind==='study'&&state.index>=state.queue.length)){session.completed=true;session.completedAt=Date.now()}persist()}
function startTrackedSession(kind,state){if(currentSessionId){updateCurrentSession()}const s={id:randomId(),kind,state:JSON.parse(JSON.stringify(state)),createdAt:Date.now(),updatedAt:Date.now(),completed:false};sessions.unshift(s);sessions=sessions.slice(0,150);currentSessionId=s.id;persist()}
function leaveSession(){updateCurrentSession();currentSessionId=null;}
function resumeSession(id){
 let item=sessions.find(s=>s.id===id);if(!item)return toast('Session not found.');
 if(item.completed)return restartSession(id);
 if(currentSessionId&&currentSessionId!==id)updateCurrentSession();
 currentSessionId=item.id;
 const state=JSON.parse(JSON.stringify(item.state||{}));
 if(item.kind==='browse'){
  if(!caseById.has(state.selectedCase))return toast('That topic is no longer available.');
  S.selectedCase=state.selectedCase;
  S.selectedQ=qById.has(state.selectedQ)?state.selectedQ:caseById.get(S.selectedCase)?.qids?.[0];
  S.source=caseById.get(S.selectedCase)?.source||'barker2009';S.type='all';S.category='all';S.status='all';S.search='';
  S.reveal=false;S.bankCollapsed=isMobile();
  go('bank');
  requestAnimationFrame(()=>{window.scrollTo(0,Math.max(0,Number(state.scrollY)||0));const pane=document.querySelector('.case-scroll');if(pane)pane.scrollTop=Number(state.caseScrollTop)||0});
 }else if(item.kind==='study'){
  state.queue=(state.queue||[]).filter(x=>qById.has(x));if(!state.queue.length)return toast('The questions for this session are no longer available.');
  state.index=clamp(state.index||0,0,state.queue.length);S.study=state;S.reveal=false;go('study');
 }else{
  state.running=false;state.lastTick=Date.now();S.mock=state;S.reveal=false;go('mock');
 }
 updateCurrentSession();
}
function restartSession(id){let item=sessions.find(s=>s.id===id);if(!item)return;if(item.kind==='study'){
 let state={queue:(item.state?.queue||[]).filter(q=>qById.has(q)),index:0,graded:0};if(!state.queue.length)return toast('This question set is no longer available.');S.study=state;startTrackedSession('study',state);S.reveal=false;go('study')
 }else{let state={...item.state,phase:0,shortIdx:0,qIndex:0,seen:0,graded:0,done:false,running:false};state.remaining=state.durations?.[0]*60||600;state.lastTick=Date.now();S.mock=state;startTrackedSession('mock',state);S.reveal=false;go('mock')}
}
function mostRecentResumable(){return sessions.filter(s=>!s.completed).sort((a,b)=>b.updatedAt-a.updatedAt)[0]}
function historySnapshot(scrollY=window.scrollY){return {vivalab:true,view:S.view,globalQuery:S.globalQuery,selectedCase:S.selectedCase,selectedQ:S.selectedQ,source:S.source,type:S.type,category:S.category,status:S.status,search:S.search,bankCollapsed:S.bankCollapsed,bankFiltersOpen:S.bankFiltersOpen,study:S.study?JSON.parse(JSON.stringify(S.study)):null,mock:S.mock?JSON.parse(JSON.stringify(S.mock)):null,currentSessionId,verseIndex,scrollY,caseScrollTop:document.querySelector('.case-scroll')?.scrollTop||0,reveal:S.reveal,answerMode:S.answerMode,bankView:S.bankView,bankReveal:S.bankReveal,navExpanded:S.navExpanded}}
let navigationEnabled=true,restoringHistory=false;
function saveHistoryScroll(){if(restoringHistory)return;try{let current=history.state;if(current?.vivalab)history.replaceState({...current,scrollY:window.scrollY,caseScrollTop:document.querySelector('.case-scroll')?.scrollTop||0,reveal:S.reveal,answerMode:S.answerMode},'')}catch{navigationEnabled=false}}
function pushNavState(savePrevious=true){if(restoringHistory)return;if(savePrevious)saveHistoryScroll();rotateVerse();try{history.pushState(historySnapshot(0),'');navigationEnabled=true}catch{navigationEnabled=false}}
function restoreHistoryEntry(st){if(!st?.vivalab)return;restoringHistory=true;S.view=VIEW_NAMES[st.view]?st.view:'overview';for(const name of ['globalQuery','selectedCase','selectedQ','source','type','category','status','search','bankCollapsed','bankFiltersOpen'])if(st[name]!==undefined)S[name]=st[name];S.study=st.study||null;S.mock=st.mock||null;currentSessionId=st.currentSessionId||null;verseIndex=Number(st.verseIndex)||0;S.reveal=!!st.reveal;S.answerMode=st.answerMode||'full';S.bankView=st.bankView||'single';S.bankReveal=st.bankReveal||'manual';S.navExpanded=!!st.navExpanded;if(S.mock?.running){S.mock.running=false;S.mock.lastTick=Date.now()};render();requestAnimationFrame(()=>{let el=document.querySelector('.case-scroll');if(el)el.scrollTop=Number(st.caseScrollTop)||0;window.scrollTo(0,Math.max(0,Number(st.scrollY)||0));restoringHistory=false})}
function enhanceTables(){document.querySelectorAll('#mainContent table').forEach(table=>{
 let rows=[...table.rows],cols=rows.reduce((max,row)=>Math.max(max,[...row.cells].reduce((n,cell)=>n+Math.max(1,Number(cell.colSpan)||1),0)),0);
 table.dataset.cols=String(cols);table.classList.remove('compact-table','wide-table');table.classList.add(cols<=3?'compact-table':'wide-table');
 if(cols>3&&!table.closest('.book-table-wrap,.table-scroller')){let parent=document.createElement('div');parent.className='table-scroller';table.parentNode.insertBefore(parent,table);parent.append(table)}
 });}
function scrollToBankContent(){if(!isMobile())return;requestAnimationFrame(()=>{let target=document.querySelector('.bank-main');if(!target)return;let top=target.getBoundingClientRect().top+window.scrollY-(document.querySelector('.topbar')?.getBoundingClientRect().height||80)-12;window.scrollTo({top:Math.max(0,top),behavior:'instant'});try{history.replaceState(historySnapshot(window.scrollY),'')}catch{}})}
window.addEventListener('popstate',e=>{if(document.querySelector('#vivaImageLayer'))closeImage();if(document.querySelector('#modalLayer .modal-layer'))closeModal();searchSuggestions(false);restoreHistoryEntry(e.state)});
window.addEventListener('pagehide',()=>{updateCurrentSession();saveHistoryScroll()});
window.addEventListener('beforeunload',()=>{updateCurrentSession();saveHistoryScroll()});


let SEARCH_INDEX=[];
const cleanSearch=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function buildSearchIndex(){
 SEARCH_INDEX=cases.map(c=>{
  const qs=(c.qids||[]).map(id=>qById.get(id)).filter(Boolean);
  return {c,qs,title:cleanSearch(c.title),intro:cleanSearch(c.scenario),category:cleanSearch(activeCategory(c)),questions:qs.map(q=>cleanSearch(q.q)),answers:qs.map(q=>cleanSearch(q.a))};
 });
}
function searchTopics(term,limit=0){
 const phrase=cleanSearch(term);if(!phrase)return [];
 const parts=phrase.split(/\s+/).filter(Boolean).slice(0,12);
 const hits=[];
 for(const entry of SEARCH_INDEX){
  let {c,title,intro,category,questions:qtexts,answers:atexts,qs}=entry;
  const joined=title+' '+intro+' '+category+' '+qtexts.join(' ')+' '+atexts.join(' ');
  if(!parts.every(word=>joined.includes(word)))continue;
  let score=0,firstMatch=null,qMatches=0;
  if(title===phrase)score+=340;
  else if(title.startsWith(phrase))score+=260;
  else if(title.includes(phrase))score+=190;
  else if(parts.every(w=>title.includes(w)))score+=155;
  else score+=10*parts.filter(w=>title.includes(w)).length;
  if(category.includes(phrase))score+=35;
  if(intro.includes(phrase))score+=60;
  for(let i=0;i<qs.length;i++){
   const qt=qtexts[i],at=atexts[i];
   const qMatch=qt.includes(phrase)||parts.every(w=>qt.includes(w));
   const aMatch=at.includes(phrase)||parts.every(w=>at.includes(w));
   if(qMatch||aMatch){qMatches++;if(!firstMatch)firstMatch={q:qs[i],fromAnswer:!qMatch};if(qMatch)score+=Math.max(5,90-Math.min(qMatches,6)*8);else score+=Math.max(2,16-Math.min(qMatches,6)*2)}
  }
  hits.push({caseObj:c,score,matchedQuestion:firstMatch?.q||null,matchedCount:qMatches});
 }
 hits.sort((a,b)=>b.score-a.score||a.caseObj.title.localeCompare(b.caseObj.title));
 return limit?hits.slice(0,limit):hits;
}
function sourceLabel(c){return (c.source||'barker2009')==='podcast2025'?'Dr Podcast Scripts · 2025':(c.source||'barker2009')==='barker2009'?'Clinical Anaesthesia Viva Book · 2009':(sources.find(s=>s.id===c.source)?.title||'Personal collection')}
function excerpt(text,length=160){const plain=String(text||'').replace(/\s+/g,' ').trim();return plain.length>length?plain.slice(0,length-1)+'…':plain}
function searchSuggestions(open=true){
 const box=document.querySelector('#searchSuggestions');if(!box)return;
 const term=document.querySelector('#globalSearch')?.value.trim()||'';
 if(!open||!term){box.hidden=true;box.innerHTML='';return}
 const hits=searchTopics(term,7);
 box.innerHTML=`<div class="search-suggest-head"><span>TOPIC SUGGESTIONS · BOTH BOOKS</span><span>${hits.length?'':'No matches'}</span></div>`+(hits.length?hits.map(r=>`<button class="search-suggest-item" type="button" data-search-case="${H(r.caseObj.id)}" data-search-q="${H(r.matchedQuestion?.id||'')}"><strong>${H(r.caseObj.title)}</strong><small>${H(sourceLabel(r.caseObj))} · ${H(activeCategory(r.caseObj))}${r.matchedQuestion?' · '+H(excerpt(r.matchedQuestion.q,90)):''}</small></button>`).join(''):'<div class="empty-state" style="padding:14px">No topics found. Try a broader term.</div>')+`<button class="search-suggest-footer" type="button" data-action="submitGlobalSearch">View all search results for “${H(excerpt(term,45))}” →</button>`;
 box.hidden=false;
}
function performSearch(term){
 const q=String(term??document.querySelector('#globalSearch')?.value??'').trim();
 if(!q){document.querySelector('#globalSearch')?.focus();return}
 S.globalQuery=q;
 const header=document.querySelector('#globalSearch');if(header)header.value=q;
 searchSuggestions(false);
 if(S.view==='search'){pushNavState();render();window.scrollTo({top:0,behavior:'instant'})}
 else go('search');
}
function openSearchCase(id,qid){
 const c=caseById.get(id);if(!c)return;
 searchSuggestions(false);
 S.selectedCase=c.id;
 S.selectedQ=(qid&&c.qids.includes(qid)?qid:c.qids[0])||null;
 S.source=c.source||'barker2009';S.type='all';S.category='all';S.status='all';S.search='';
 S.reveal=false;S.bankCollapsed=isMobile();
 if(S.view==='bank'){saveHistoryScroll();pushNavState(false);render();noteBrowseSelection()}
 else go('bank');
 scrollToBankContent();
}
function renderSearch(){
 const term=S.globalQuery.trim(),hits=searchTopics(term),count=hits.length;
 return `<div class="page-head"><div><div class="eyebrow">SEARCH BOTH REFERENCE BOOKS</div><h1>Search results</h1><p class="subtext">Find topics and clinical questions across your entire VivaLab library.</p></div></div>
 <form class="search-page-query" id="resultSearchForm" role="search"><input id="resultSearchInput" aria-label="Search all topics" type="search" value="${H(term)}" placeholder="Search conditions, procedures or viva questions…" required><button class="btn btn-primary" type="submit">Search</button></form>
 <div class="search-summary">${term?`${count} ${count===1?'topic':'topics'} matching “${H(term)}”`:'Enter a keyword to explore topics from both books.'}</div>
 ${count?`<div class="search-results-list">${hits.map(r=>`<article class="search-result-card"><button class="search-result-button" data-search-case="${H(r.caseObj.id)}" data-search-q="${H(r.matchedQuestion?.id||'')}"><span class="search-result-icon" aria-hidden="true">☷</span><div class="search-result-copy"><h3>${H(r.caseObj.title)}</h3><div class="search-result-meta"><span>${H(sourceLabel(r.caseObj))}</span><span>${H(activeCategory(r.caseObj))}</span><span>${r.caseObj.qids?.length||0} viva questions</span></div>${r.matchedQuestion?`<p><strong>Relevant question:</strong> ${H(excerpt(r.matchedQuestion.q,190))}</p>`:r.caseObj.scenario?`<p>${H(excerpt(r.caseObj.scenario,180))}</p>`:''}</div><span class="search-result-arrow" aria-hidden="true">›</span></button></article>`).join('')}</div>`:`<section class="card pad"><h2>No matching topics</h2><p class="subtext">Try fewer words or a related clinical term.</p></section>`}${footer()}`;
}
function beginBrowseSession(){
 const current=sessions.find(s=>s.id===currentSessionId);
 if(current?.kind==='browse'){noteBrowseSelection();return}
 startTrackedSession('browse',{selectedCase:S.selectedCase,selectedQ:S.selectedQ,visited:S.selectedCase?[S.selectedCase]:[],scrollY:0,caseScrollTop:0});
}
function noteBrowseSelection(){
 const s=sessions.find(item=>item.id===currentSessionId);
 if(s?.kind!=='browse')return;
 const state=s.state||(s.state={});
 state.selectedCase=S.selectedCase;
 state.selectedQ=S.selectedQ;
 if(!Array.isArray(state.visited))state.visited=[];
 if(S.selectedCase&&!state.visited.includes(S.selectedCase))state.visited.push(S.selectedCase);
 state.scrollY=window.scrollY;
 state.caseScrollTop=document.querySelector('.case-scroll')?.scrollTop||0;
 s.updatedAt=Date.now();persist();
}

function recalc(){cases=[...BUILT_IN.cases,...NEW_BOOK.cases,...userCases];questions=[...BUILT_IN.questions,...NEW_BOOK.questions,...userQs];caseById=new Map(cases.map(c=>[c.id,c]));qById=new Map(questions.map(q=>[q.id,q]));buildSearchIndex();if(!S.selectedCase||!caseById.has(S.selectedCase))S.selectedCase=cases[0]?.id;if(!S.selectedQ||!qById.has(S.selectedQ))S.selectedQ=caseById.get(S.selectedCase)?.qids[0]||questions[0]?.id}
function genre(title){let s=title.toLowerCase();if(/obstetric|eclampsia|amniotic|antepartum|pregnan|caesarean/.test(s))return'Obstetrics';if(/paediatric|child|infant|neonat|premature|pyloric|circumcision|squint|down.s syndrome|inhaled peanut/.test(s))return'Paediatrics';if(/pleural|pneumo|thorac|pneumonectomy|asthma|respirat|chest|lung|copd|pulmonary|osa|apnoea/.test(s))return'Respiratory & thoracic';if(/airway|intubat|stridor|laryn|aspiration|goitre|thyroidectomy/.test(s))return'Airway';if(/cardiac|coronary|infarct|heart|atrial|ventricular|valve|mitral|pacemaker|hypertension|aortic|aneurysm|eisenmenger|wolff|ischaem|flail/.test(s))return'Cardiovascular';if(/neuro|intracran|cerebral|brain|head.injur|cervical|c2|epilep|myasthen|guillain|cauda|cord|spine|craniotomy/.test(s))return'Neuroanaesthesia';if(/sepsis|icu|intensive|renal|ketoacidosis|overdose|unconscious|dka|shoc|nutrition|acidotic/.test(s))return'Critical care';if(/plexus|block|epidural|spinal|pain|sympathectomy|regional|neuralgi|anticoagul|dural|post.herpetic/.test(s))return'Pain & regional';if(/trauma|fracture|rta|burns|haemorrhage|bleeding|anaphylaxis|tetanus|massive|emergency/.test(s))return'Emergencies & trauma';if(/diabet|obesity|thyro|acromegal|phaeochromo|endocr|metabolic/.test(s))return'Endocrine & metabolic';return'Perioperative & general'}
function activeCategory(c){return c.category||genre(c.title)}
function applyPrefs(){document.documentElement.dataset.theme=prefs.theme==='system'?'':prefs.theme;document.documentElement.dataset.accent=prefs.accent;document.documentElement.style.setProperty('--fs',prefs.font);if(prefs.theme==='system')document.documentElement.removeAttribute('data-theme')}
function stats(){let seen=0,good=0,attempts=0,bookmarked=0;for(const q of questions){const p=progress[q.id]||{};if(p.seen)seen++;if(p.rating==='good'||p.rating==='easy')good++;attempts+=p.count||0;if(p.bookmark)bookmarked++}return{seen,good,attempts,bookmarked,total:questions.length,percent:questions.length?Math.round(100*seen/questions.length):0}}
function cstats(c){let seen=0,master=0;for(const id of c.qids||[]){let p=progress[id]||{};if(p.seen)seen++;if(['good','easy'].includes(p.rating))master++}return{seen,master,total:(c.qids||[]).length,pct:c.qids?.length?Math.round(100*seen/c.qids.length):0}}
function badge(text,accent=false){return`<span class="pill ${accent?'accent':''}">${H(text)}</span>`}
function btn(action,label,cls='btn-quiet',extra=''){return`<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`}
function toast(msg){let e=document.createElement('div');e.className='toast';e.textContent=msg;document.querySelector('#toastArea').append(e);setTimeout(()=>e.remove(),3400)}
function go(view){
 const changed=S.view!==view;
 if(S.view==='mock'&&changed&&S.mock?.running){S.mock.running=false;S.mock.lastTick=Date.now();updateCurrentSession()}
 if(changed&&S.view==='bank'&&view!=='bank'&&sessions.find(s=>s.id===currentSessionId)?.kind==='browse')leaveSession();
 S.view=view;
 document.getElementById('app').classList.remove('menu-open');
 if(changed&&view==='bank')beginBrowseSession();
 if(changed)pushNavState();
 render();
 searchSuggestions(false);
 if(changed)window.scrollTo({top:0,behavior:'instant'});
}
function render(){
 document.querySelector('#mainContent').innerHTML=({search:renderSearch,overview:renderOverview,bank:renderBank,study:renderStudy,mock:renderMock,insights:renderInsights,library:renderLibrary,sessions:renderSessions}[S.view]||renderOverview)();
 document.querySelector('#crumbTitle').textContent=VIEW_NAMES[S.view]||'Overview';document.querySelector('#globalSearch').value=S.globalQuery||'';
 let s=stats();document.querySelector('#sidebarBar').style.width=s.percent+'%';document.querySelector('#sidebarCount').textContent=`${s.seen} / ${s.total} questions reviewed`;
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===S.view));document.body.classList.toggle('bank-navigation-active',S.view==='bank');
 enhanceTables();
}

function renderOverview(){
 let st=stats();
 let recent=log.slice(-5).reverse(),last=mostRecentResumable();
 return`<div class="home-verses">${HOME_VERSES.map(v=>`<blockquote>“${H(v.quote)}”</blockquote><p class="verse-ref">Al-Quran ${H(v.ref)}</p>`).join('')}</div>
 <section class="hero"><div class="hero-content"><div style="color:#baf3e7;font-size:10px;font-weight:800;letter-spacing:2px">YOUR CLINICAL VIVA WORKSPACE</div><h1>Think clinically.<br>Answer confidently.</h1><p>Structured clinical oral examination practice, guided by your reference books. Revise topics, reveal answers and strengthen your recall.</p><div class="actions">${btn('openBank','☷ Question Bank','btn-quiet')}${btn('startStudy','◈ Start Revision','btn-primary')}${btn('startMock','◴ Mock Viva','alt')}</div></div></section>

 <div class="stat-grid"><div class="card stat-card"><div class="label">Question bank <span class="symbol">☷</span></div><div class="num">${st.total}</div><div class="desc">Answered prompts available</div></div><div class="card stat-card"><div class="label">Short cases <span class="symbol">▤</span></div><div class="num">${cases.filter(c=>c.kind==='short').length}</div><div class="desc">Focused viva discussions</div></div><div class="card stat-card"><div class="label">Long cases <span class="symbol">▥</span></div><div class="num">${cases.filter(c=>c.kind==='long').length}</div><div class="desc">Full clinical scenarios</div></div><div class="card stat-card"><div class="label">Reviewed <span class="symbol">◉</span></div><div class="num">${st.percent}%</div><div class="desc">${st.seen} of ${st.total} prompts</div></div></div>
 <section class="card resume-bar"><div><div class="resume-title">Pick up where you left off</div><p class="resume-sub">${last?`${H(sessionTitle(last))} · ${H(sessionPosition(last))} · ${H(sessionDate(last))}`:'Previous revision sessions will appear here.'}</p></div><div class="actions"><button class="btn btn-primary" data-action="resumePrevious" ${last?'':'disabled'}>↻ Resume previous session</button><button class="inline-link" data-view="sessions">View all previous sessions →</button></div></section>
 <section class="card pad home-recent"><div class="section-head"><h2>Recent activity</h2><button class="btn btn-soft btn-small" data-view="insights">View progress →</button></div>${recent.length?recent.map(r=>`<div class="activity-row"><div class="circle-symbol">${r.rating==='easy'?'✓':'◈'}</div><div><b>${H(qById.get(r.id)?.q?.slice(0,70)||'Question reviewed')}</b><p>${H(r.rating||'Reviewed')} · ${new Date(r.when).toLocaleDateString()}</p></div></div>`).join(''):`<div class="empty-state" style="padding:22px"><div style="font-size:29px;color:var(--accent)">◈</div><h3>Your journey starts here</h3><p>Reveal an answer, then grade your recall to track progress.</p></div>`}<div class="divider"></div><div class="section-head"><h3>Quick actions</h3></div><div class="actions">${btn('openBank','Browse question bank','btn-quiet')}${btn('openAdd','+ Add question','btn-quiet')}</div></section>${footer()}`;
}
function footer(){let verse=QURAN_VERSES[verseIndex]||QURAN_VERSES[0];return`<footer class="verse-footer"><p>“${H(verse.quote)}”</p><small>Al-Quran ${H(verse.ref)}</small></footer>`}
function renderSessions(){let list=[...sessions].sort((a,b)=>b.updatedAt-a.updatedAt);return`<div class="page-head"><div><div class="eyebrow">YOUR REVISION JOURNEY</div><h1>Previous sessions</h1><p class="subtext">Continue your previous Question Bank browsing, study cards or mock viva sessions.</p></div><div class="actions">${btn('startStudy','New study session','btn-primary')}${btn('startMock','New mock viva','btn-quiet')}</div></div>${list.length?`<div class="session-list">${list.map(s=>`<article class="study-session-item"><div><h3>${H(sessionTitle(s))} ${s.completed?badge('Completed'):badge('In progress',true)}</h3><p>${H(sessionDate(s))} · ${H(sessionPosition(s))}</p></div><button class="btn ${s.completed?'btn-quiet':'btn-primary'}" data-resume-session="${H(s.id)}">${s.completed?'Restart session':s.kind==='browse'?'Continue browsing':'Continue session'} →</button></article>`).join('')}</div>`:`<section class="card empty-sessions"><h2>No previous sessions yet</h2><p>Topics you browse and revision sessions you start will appear here.</p><div class="actions" style="justify-content:center">${btn('startStudy','Start revision','btn-primary')}</div></section>`}${footer()}`}

function matchCase(c){if(S.source!=='all'&&(c.source||'barker2009')!==S.source)return false;if(S.type!=='all'&&c.kind!==S.type)return false;if(S.category!=='all'&&activeCategory(c)!==S.category)return false;if(S.status==='bookmarks'&&!c.qids?.some(id=>progress[id]?.bookmark))return false;if(S.status==='unseen'&&c.qids?.every(id=>progress[id]?.seen))return false;if(S.search){let s=S.search.toLowerCase();if(!T(c.title,s)&&!T(c.scenario||'',s)&&!c.qids?.some(id=>{let q=qById.get(id);return q&&(T(q.q,s)||T(q.a,s))}))return false}return true}
function renderBank(){
 let list=cases.filter(matchCase);
 if(!list.some(c=>c.id===S.selectedCase)&&list.length){S.selectedCase=list[0].id;S.selectedQ=list[0].qids?.[0];S.reveal=false}
 let caseObj=caseById.get(S.selectedCase),selQs=caseObj?.qids||[];
 if(!selQs.includes(S.selectedQ)){S.selectedQ=selQs[0];S.reveal=false}
 let q=qById.get(S.selectedQ),cats=[...new Set(cases.filter(c=>S.source==='all'||(c.source||'barker2009')===S.source).map(activeCategory))].sort();
 const bookOptions=[['all','All books'],['barker2009','Clinical Anaesthesia Viva Book · 2009'],['podcast2025','Dr Podcast Scripts · 2025']];
 let bookSelect=`<div class="bank-filter-head"><div class="field"><label for="sourceFilter" class="tiny">Reference book</label><select id="sourceFilter">${bookOptions.map(([key,val])=>`<option value="${key}" ${S.source===key?'selected':''}>${H(val)}</option>`).join('')}</select></div><button class="filter-toggle ${S.bankFiltersOpen?'active':''}" data-action="toggleFilters" aria-expanded="${!!S.bankFiltersOpen}" aria-label="Show or hide filters">☷ Filters</button></div>`;
 let filterDrawer=S.bankFiltersOpen?`<div class="filter-drawer"><div class="select-row">${['all','short','long','topic'].map(type=>`<button class="chip ${S.type===type?'active':''}" data-type="${type}">${type==='all'?'All':type==='short'?'Short cases':type==='long'?'Long cases':'Textbook topics'}</button>`).join('')}</div><div class="filter-selects"><select id="catFilter" aria-label="Filter by specialty"><option value="all">All specialties</option>${cats.map(cat=>`<option ${S.category===cat?'selected':''} value="${H(cat)}">${H(cat)}</option>`).join('')}</select><select id="statusFilter" aria-label="Filter by progress"><option value="all" ${S.status==='all'?'selected':''}>All</option><option value="unseen" ${S.status==='unseen'?'selected':''}>To review</option><option value="bookmarks" ${S.status==='bookmarks'?'selected':''}>Saved ★</option></select></div></div>`:'';
 return`<div class="page-head"><div><div class="eyebrow">CLINICAL VIVA LIBRARY</div><h1>Question bank</h1><p class="subtext">${cases.length} cases · ${questions.length} questions. Browse by topic or search for a condition.</p></div><div class="actions">${btn('openAdd','+ Add question','btn-soft')}${btn('startStudy','◈ Study selected topics','btn-primary')}</div></div>
 <div class="bank-grid"><aside class="card bank-side ${S.bankCollapsed?'is-collapsed':''}"><div class="bank-control-head"><button class="bank-section-toggle" data-action="toggleBank" aria-expanded="${!S.bankCollapsed}"><span>Reference books & topics <span class="bank-selected-title">${H(caseObj?.title||'Choose a topic')}</span></span><span class="bank-expand-icon" aria-hidden="true">${S.bankCollapsed?'⌄':'⌃'}</span></button></div>
 <div class="filters">${bookSelect}${filterDrawer}<div class="tiny muted" style="margin-top:10px">${list.length} matching topics</div></div>
 <div class="case-scroll">${list.map(c=>{let cs=cstats(c);return`<button class="case-button ${S.selectedCase===c.id?'active':''}" data-case="${H(c.id)}"><div class="case-number">${c.kind==='long'?'L'+c.number:c.kind==='topic'?'§':(''+(cases.indexOf(c)+1)).padStart(2,'0')}</div><div style="min-width:0"><div class="c-title">${H(c.title)}</div><div class="c-info">${cs.total} questions · ${cs.seen} reviewed · p. ${H(c.page||'—')}</div></div></button>`}).join('')||'<div class="empty-state"><h3>No matching topics</h3><p>Try a different filter or search term.</p></div>'}</div></aside>
 <div class="bank-main">${caseObj&&list.some(c=>c.id===caseObj.id)?`<section class="card case-header"><div class="meta-line">${badge(caseObj.kind==='long'?'LONG CASE':caseObj.kind==='topic'?'TOPIC':'SHORT CASE',true)}${badge(activeCategory(caseObj))}${badge('Source p. '+(caseObj.page||'—'))}</div><h2 class="case-title">${H(caseObj.title)}</h2><div class="meta-line">${selQs.length} questions · ${cstats(caseObj).seen} reviewed · ${H((caseObj.source||'barker2009')==='podcast2025'?'2025 edition':'2009 edition')}</div>${caseObj.scenario?`<details class="scenario" ${caseDisclosureAttrs(caseObj,'scenario')}><summary>Clinical scenario / source case information</summary><div class="scenario-content answer-content">${caseIntroHtml(caseObj)}</div></details>`:''}${caseGallery(caseObj)}</section>${S.bankView==='single'&&q?.sectionHeading?`<div class="case-section-note card"><h3>${H(q.sectionHeading)}</h3><div class="answer-content">${q.sectionIntroHtml||H(q.sectionIntro||'')}</div></div>`:''}${S.bankView==='continuous'?selQs.map((id,i)=>{const item=qById.get(id);return (item?.sectionHeading?`<div class="case-section-note card"><h3>${H(item.sectionHeading)}</h3><div class="answer-content">${item.sectionIntroHtml||H(item.sectionIntro||'')}</div></div>`:'')+renderQuestion(item,i+1,selQs.length,'bank')}).join(''):renderQuestion(q,selQs.indexOf(q?.id)+1,selQs.length,'bank')}${bankBottomNavigator(caseObj,selQs)}`:'<section class="card empty-state"><h3>No case selected</h3><p>Choose a case from the list.</p></section>'}</div></div>${footer()}`;
}


function bankBottomNavigator(c,selQs){
 if(!c||!selQs.length)return '';
 const index=Math.max(0,selQs.indexOf(S.selectedQ)), open=S.navExpanded;
 const questions=selQs.map((id,i)=>`<button class="q-dot ${id===S.selectedQ?'active':''} ${progress[id]?.seen?'done':''}" data-qid="${H(id)}" aria-label="Go to question ${i+1}" title="${H(qById.get(id)?.q||'')}">${i+1}</button>`).join('');
 return `<nav class="bank-bottom-nav" aria-label="Question navigation"><div class="bank-bottom-row"><button class="nav-step" type="button" data-action="bankPrev" ${index===0?'disabled':''} aria-label="Previous question"><span class="nav-arrow" aria-hidden="true">&lt;&lt;</span><span class="nav-step-text">Previous</span></button><button class="nav-progress" type="button" data-action="toggleQuestionNav" aria-label="${open?'Collapse':'Expand'} question navigator" aria-expanded="${open}"><span id="bankNavCounter">Question ${index+1} / ${selQs.length}</span><span class="nav-chevron" aria-hidden="true">${open?'▾':'▴'}</span></button><button class="nav-step" type="button" data-action="bankNext" ${index===selQs.length-1?'disabled':''} aria-label="Next question"><span class="nav-step-text">Next</span><span class="nav-arrow" aria-hidden="true">&gt;&gt;</span></button></div>${open?`<div class="bank-nav-expansion"><div class="bank-setting-row"><div><span class="bank-setting-label">Question layout</span><div class="bank-choice"><button class="${S.bankView==='single'?'selected':''}" data-bank-view="single">One by one</button><button class="${S.bankView==='continuous'?'selected':''}" data-bank-view="continuous">Continuous</button></div></div><div><span class="bank-setting-label">Answers</span><div class="bank-choice"><button class="${S.bankReveal==='manual'?'selected':''}" data-bank-reveal="manual">Reveal manually</button><button class="${S.bankReveal==='all'?'selected':''}" data-bank-reveal="all">Reveal all</button></div></div></div><div class="bank-question-number-list" aria-label="Choose question">${questions}</div></div>`:''}</nav>`;
}

function renderQuestion(q,index,total,context){if(!q)return'<div class="card empty-state">Question not available.</div>';let p=progress[q.id]||{};let revealed=context==='bank'?(S.bankReveal==='all'||(S.bankView==='continuous'?!!S.bankOpenQ[q.id]:S.reveal)):S.reveal;let hasQuick=Array.isArray(q.quick)&&q.quick.length>0;let displayQuick=S.answerMode==='quick'&&hasQuick;return`<article class="card question-card" id="viva-q-${H(q.id)}" data-card-id="${H(q.id)}"><div class="question-overline"><span>${context==='mock'?'MOCK VIVA':context==='study'?'STUDY CARD':'VIVA QUESTION'} ${index} / ${total}</span><div class="actions"><span class="tiny muted">${H(q.source===SOURCE_ID?'Barker et al. (2009)':q.source==='podcast2025'?'Leslie et al. (2025)':findSource(q.source))}, p. ${H(q.page||'—')}</span><button class="icon-btn" data-action="bookmark" data-q-target="${H(q.id)}" title="Bookmark" aria-label="Bookmark question" style="height:32px;min-height:32px;width:32px;min-width:32px">${p.bookmark?'★':'☆'}</button></div></div><h2 class="question-title">${H(q.q)}</h2>${!revealed?`<div class="answer-placeholder"><div style="font-size:30px;color:var(--accent)">◈</div><strong>Prepare your spoken answer</strong><p>Lead with your priorities, give a structured plan, and justify your management.</p>${btn('reveal','Reveal answer','btn-primary',`data-q-target="${H(q.id)}" aria-controls="viva-answer-${H(q.id)}" aria-expanded="false"`)}</div>`:`<div class="answer-frame" id="viva-answer-${H(q.id)}"><div class="section-head"><h3>${displayQuick?'Opening cues':'Source-derived answer'}</h3><div class="answer-mode"><button data-answer-mode="quick" data-q-target="${H(q.id)}" class="${displayQuick?'active':''}" ${!hasQuick?'disabled title="No quick cues available for this question"':''}>Quick cues</button><button data-answer-mode="full" data-q-target="${H(q.id)}" class="${!displayQuick?'active':''}">Full answer</button></div></div>${displayQuick&&hasQuick?`<ol class="answer-cues">${q.quick.slice(0,9).map(p=>`<li>${H(p)}</li>`).join('')}</ol>`:`<div class="answer-content">${sourceAnswerHtml(q)}</div>`}</div>`}
${notes[q.id]?`<div class="scenario" style="margin-top:16px"><div class="tiny bold">YOUR PERSONAL NOTE</div><div class="small" style="white-space:pre-wrap;margin-top:5px">${H(notes[q.id])}</div></div>`:''}
<div class="source-row"><div class="small muted">${p.count?`Reviewed ${p.count} time${p.count!==1?'s':''}`:'Not yet reviewed'}${p.rating?' · Last rating: '+H(p.rating):''}</div><div class="actions"><button class="btn btn-quiet btn-small" data-action="note" data-q-target="${H(q.id)}">✎ My notes</button>${['barker2009','podcast2025'].includes(q.source)?`<button class="btn btn-soft btn-small" data-pdf="${q.pdfPage}" data-pdf-source="${H(q.source)}">↗ Book p. ${q.page}</button>`:''}</div></div>
<div class="q-actions"><div class="rating-group">${revealed?Object.keys(RATINGS).map(k=>`<button class="rate ${p.rating===k?'selected':''}" data-rate="${k}" data-q-target="${H(q.id)}" title="Grade recall">${k==='again'?'↻':k==='easy'?'✓':'◦'} ${RATINGS[k].label}</button>`).join(''):`<span class="tiny muted">Grade your recall after revealing the answer.</span>`}</div><div class="actions">${context==='bank'?'':context==='study'?`<button class="btn btn-quiet btn-small" data-action="studySkip">Skip →</button>`:`<button class="btn btn-quiet btn-small" data-action="mockNext">Next question →</button>`}</div></div></article>`}
function findSource(id){if(id==='podcast2025')return NEW_BOOK.source.title;if(id==='barker2009')return BUILT_IN.source.title;return id==='custom'?'Personal notes':(sources.find(s=>s.id===id)?.title||'Imported source')}
function renderStudy(){if(!S.study)return`<div class="page-head"><div><div class="eyebrow">ACTIVE RECALL</div><h1>Study cards</h1><p class="subtext">Answer the question aloud before revealing the answer; then rate your recall.</p></div></div><section class="card pad study-setup"><div class="section-head"><h2>Build a revision session</h2></div><div class="setup-grid"><div class="field"><label for="studyKind">Question pool</label><select id="studyKind"><option value="all" ${S.studyKind==='all'?'selected':''}>All questions</option><option value="short" ${S.studyKind==='short'?'selected':''}>Short cases only</option><option value="long" ${S.studyKind==='long'?'selected':''}>Long cases only</option><option value="topic" ${S.studyKind==='topic'?'selected':''}>Textbook topics only</option><option value="selected" ${S.studyKind==='selected'?'selected':''}>Current case only</option></select></div><div class="field"><label for="studyLength">Session size</label><select id="studyLength">${[5,10,20,30,50,100].map(n=>`<option value="${n}" ${S.studyLength===n?'selected':''}>${n} questions</option>`).join('')}</select></div></div><label class="small"><input type="checkbox" id="studyWeak" ${S.studyWeak?'checked':''} style="width:auto;margin-right:6px"> Focus on unseen, repeated or difficult questions</label><div style="margin-top:24px">${btn('startStudySession','Start study session →','btn-primary')}</div><p class="tiny muted" style="margin-top:16px">Keyboard: Space = reveal, 1–4 = rate, → = next/skip, B = bookmark.</p></section>${footer()}`;
let ss=S.study;if(ss.index>=ss.queue.length)return`<div class="card finish"><div style="font-size:48px;color:var(--accent)">✓</div><h2>Session complete</h2><p>You worked through ${ss.queue.length} viva questions and rated ${ss.graded} answers.</p><div class="actions" style="justify-content:center;margin-top:20px">${btn('resetStudy','New session','btn-primary')}${btn('viewInsights','View progress','btn-quiet')}</div></div>`;
let q=qById.get(ss.queue[ss.index]);if(!q)return'<p>Question unavailable.</p>';let c=caseById.get(q.caseId);return`<div class="page-head"><div><div class="eyebrow">ACTIVE RECALL · SESSION IN PROGRESS</div><h1>Study cards</h1><p class="subtext">${H(c?.title||'Custom topic')} · ${H(activeCategory(c||{title:''}))}</p></div><div class="actions">${btn('endStudy','End session','btn-quiet')}</div></div><div class="center-stage"><div class="study-progress"><span>${ss.index+1} of ${ss.queue.length}</span><div class="progress-track"><i class="progress-fill" style="width:${Math.round(100*ss.index/ss.queue.length)}%"></i></div><span>${ss.graded} graded</span></div>${c?.kind==='long'&&c.scenario?`<details class="scenario" style="margin:0 0 16px"><summary>View long case clinical information</summary><div class="scenario-content">${H(c.scenario)}</div></details>`:''}${renderQuestion(q,ss.index+1,ss.queue.length,'study')}<p class="tiny muted" style="text-align:center;margin:15px">Reveal the answer, then select Again, Hard, Good or Easy to move on.</p></div>${footer()}`}
function renderMock(){let m=S.mock;if(!m)return`<div class="page-head"><div><div class="eyebrow">EXAMINATION PRACTICE</div><h1>Mock viva</h1><p class="subtext">Practise a timed long case followed by three short cases, based on the historical format described in the source book.</p></div></div><div class="mock-stage"><div class="card pad"><div class="section-head"><h2>Choose a simulation</h2></div><div class="setup-grid"><button class="topic-tile" data-mock-mode="full"><div style="font-size:25px;color:var(--accent)">◴</div><div class="ttl" style="font-size:17px">Full clinical viva · 50 min</div><div class="meta">10 min long-case preparation · 20 min long-case discussion · 20 min three short cases</div></button><button class="topic-tile" data-mock-mode="rapid"><div style="font-size:25px;color:var(--accent)">⚡</div><div class="ttl" style="font-size:17px">Rapid mock · 12 min</div><div class="meta">2 min preparation · 5 min long-case discussion · 5 min short cases</div></button></div><div class="note-bar"><strong>Format:</strong> This is a practice simulator inspired by the book's description of the Final FRCA clinical viva in 2009, not a representation of current examination regulations. The timer runs only while this page is open.</div></div></div>${footer()}`;
if(m.done)return`<div class="card finish"><div style="font-size:50px;color:var(--accent)">◈</div><h2>Mock viva finished</h2><p>Completed ${m.mode==='full'?'50-minute':'rapid'} simulated exam · ${m.seen} questions visited · ${m.graded} graded.</p><div class="actions" style="justify-content:center">${btn('newMock','New mock','btn-primary')}${btn('viewInsights','Review progress','btn-quiet')}</div></div>`;
let stages=[['Preparation',m.durations[0]],['Long case',m.durations[1]],['Short cases',m.durations[2]]];let selectedCase=m.phase===2?caseById.get(m.shortIds[m.shortIdx]):caseById.get(m.longId);let q=selectedCase?.qids?.length?qById.get(selectedCase.qids[m.qIndex%selectedCase.qids.length]):null;return`<div class="page-head"><div><div class="eyebrow">${m.mode==='full'?'FULL CLINICAL VIVA':'RAPID MOCK'} · TIMED</div><h1>${stages[m.phase][0]}</h1><p class="subtext">${m.phase===0?'Read the clinical information, identify the main problems and prepare an opening summary.':'Answer aloud as though an examiner is questioning you.'}</p></div><div class="actions">${btn('endMock','End mock','btn-quiet')}</div></div><div class="mock-stage"><div class="mock-timeline">${stages.map((p,i)=>`<div class="phase ${i===m.phase?'active':i<m.phase?'done':''}"><div>${i+1}. ${p[0]}</div><strong>${p[1]} min</strong></div>`).join('')}</div><div class="card mock-time"><div><div class="eyebrow">TIME REMAINING</div><div class="timer" id="mockTimer">${fmtTime(m.remaining)}</div><div class="tiny muted" id="mockTimerHint">${m.running?'Timer running':'Timer paused'}</div></div><div class="actions"><button class="btn btn-quiet" data-action="toggleTimer">${m.running?'❚❚ Pause':'▶ Resume'}</button>${btn('nextMockPhase',m.phase===2?'Finish viva →':'Next phase →','btn-primary')}</div></div>${m.phase===0?`<section class="card pad"><div class="eyebrow">LONG CASE · BOOK p. ${selectedCase?.page}</div><h2 class="case-title">${H(selectedCase?.title)}</h2><div class="scenario-content answer-content" style="max-height:none">${caseIntroHtml(selectedCase)}</div>${caseGallery(selectedCase)}<div class="note-bar">Plan your clinical summary, risk assessment, investigations, optimisation, anaesthetic technique and postoperative care.</div></section>`:`<div class="card pad" style="margin-bottom:14px"><div class="eyebrow">${m.phase===1?'LONG CASE DISCUSSION':'THREE SHORT CASES'}</div>${m.phase===2?`<div class="mock-case-list" style="margin-top:9px">${m.shortIds.map((id,i)=>`<button class="mini-case ${m.shortIdx===i?'active':''}" data-mock-case="${i}">${i+1}. ${H(caseById.get(id)?.title||'Case')}</button>`).join('')}</div>`:`<h2 class="case-title">${H(selectedCase?.title)}</h2>`}${selectedCase?.scenario?`<details class="scenario"><summary>Clinical scenario</summary><div class="scenario-content answer-content">${caseIntroHtml(selectedCase)}</div></details>`:''}${caseGallery(selectedCase)}</div>${renderQuestion(q,m.qIndex+1,selectedCase?.qids.length||1,'mock')}`}</div>${footer()}`}
function renderInsights(){let st=stats();let grouped={};for(const q of questions){let k=activeCategory(caseById.get(q.caseId)||{title:''});grouped[k]??={total:0,seen:0,master:0};grouped[k].total++;if(progress[q.id]?.seen)grouped[k].seen++;if(['good','easy'].includes(progress[q.id]?.rating))grouped[k].master++}let rated={again:0,hard:0,good:0,easy:0};Object.values(progress).forEach(p=>{if(rated[p.rating]!==undefined)rated[p.rating]++});return`<div class="page-head"><div><div class="eyebrow">PERSONAL LEARNING RECORD</div><h1>My progress</h1><p class="subtext">Self-assessment is based on your own recall ratings and is stored locally on this browser.</p></div><div class="actions">${btn('exportProgress','↓ Export progress','btn-soft')}</div></div><div class="stat-grid"><div class="card stat-card"><div class="label">Questions seen</div><div class="num">${st.seen}</div><div class="desc">of ${st.total} total</div></div><div class="card stat-card"><div class="label">Recall proficient</div><div class="num">${st.good}</div><div class="desc">Rated Good or Easy</div></div><div class="card stat-card"><div class="label">Total ratings</div><div class="num">${st.attempts}</div><div class="desc">Recorded reviews</div></div><div class="card stat-card"><div class="label">Bookmarks</div><div class="num">${st.bookmarked}</div><div class="desc">Saved for revision</div></div></div><div class="insights-grid"><section class="card pad"><div class="section-head"><h2>Coverage by specialty</h2></div>${Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0])).map(([cat,g])=>`<div class="bar-row"><div class="bar-head"><span>${H(cat)}</span><span class="muted">${g.seen}/${g.total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round(g.seen/g.total*100)}%"></div></div></div>`).join('')}</section><section class="card pad"><div class="section-head"><h2>Recall ratings</h2></div>${Object.entries(rated).map(([k,v])=>`<div class="bar-row"><div class="bar-head"><span>${H(RATINGS[k].label)}</span><span>${v}</span></div><div class="progress-track"><div class="progress-fill" style="width:${st.seen?Math.round(v/st.seen*100):0}%"></div></div></div>`).join('')}<div class="divider"></div><div class="section-head"><h3>Revision strategy</h3></div><p class="small muted">Return to questions marked Again or Hard. Gradually expand coverage before prioritising rapid recall under simulated viva conditions.</p>${btn('studyWeak','Revise weak areas','btn-primary')}</section></div><section class="card pad" style="margin-top:17px"><div class="section-head"><h2>Latest graded questions</h2></div><div style="overflow:auto"><table class="data-table"><thead><tr><th>Question</th><th>Rating</th><th>Last reviewed</th></tr></thead><tbody>${log.length?log.slice(-12).reverse().map(l=>`<tr><td><button style="border:0;background:none;color:var(--accent);text-align:left" data-go-q="${H(l.id)}">${H(qById.get(l.id)?.q||'Deleted custom question')}</button></td><td>${H(l.rating)}</td><td>${new Date(l.when).toLocaleDateString()}</td></tr>`).join(''):'<tr><td colspan="3" class="muted">No graded questions yet</td></tr>'}</tbody></table></div></section>${footer()}`}
function renderLibrary(){let s=stats();return`<div class="page-head"><div><div class="eyebrow">YOUR RESOURCE LIBRARY</div><h1>Sources &amp; settings</h1><p class="subtext">A growing question bank for Final Anaesthesia Viva. Add new sources and personal questions as your revision collection grows.</p></div><div class="actions">${btn('exportBank','↓ Export full bank','btn-primary')}</div></div><div class="card pad"><div class="section-head"><h2>Available resources</h2>${badge((2+sources.length)+' sources',true)}</div><div class="source-card"><div class="book-cover"><span>THE CLINICAL<br>ANAESTHESIA<br>VIVA BOOK</span><i>2nd ed.</i></div><div style="flex:1"><h3>${H(BUILT_IN.source.title)}</h3><div class="small muted">${H(BUILT_IN.source.authors)} · Cambridge University Press · 2009</div><p class="small">${BUILT_IN.cases.filter(c=>c.kind==='short').length} short cases · ${BUILT_IN.cases.filter(c=>c.kind==='long').length} long cases · ${BUILT_IN.questions.length} question–answer pairs</p><div class="actions">${BOOK_FILES.barker2009?btn('openBook','↗ Open textbook','btn-soft'):'<button class="btn btn-soft" disabled>↗ Open textbook</button>'}</div></div></div><div class="divider"></div><div class="source-card"><div class="book-cover" style="background:linear-gradient(155deg,#004f63,#17a7a6)"><span>DR PODCAST<br>SCRIPTS FOR<br>FINAL FRCA</span><i>2025</i></div><div style="flex:1"><h3>${H(NEW_BOOK.source.title)}</h3><div class="small muted">${H(NEW_BOOK.source.authors)} · 2025</div><p class="small">${NEW_BOOK.cases.length} chapters and topics · ${NEW_BOOK.questions.length} viva questions</p><div class="actions">${BOOK_FILES.podcast2025?`<button class="btn btn-soft" data-book="podcast2025">↗ Open textbook</button>`:'<button class="btn btn-soft" disabled>↗ Open textbook</button>'}</div></div></div>${sources.length?`<div class="divider"></div>${sources.map(s=>`<div class="activity-row"><div class="circle-symbol">✚</div><div><b>${H(s.title)}</b><p>Imported · ${H(s.year||'No publication date supplied')}</p></div></div>`).join('')}`:''}</div>
<div class="insights-grid" style="margin-top:18px"><section class="card pad"><div class="section-head"><h2>Add more questions</h2></div><p class="small muted">Create a viva question manually or import an expanded question bank. Future books can be converted to a compatible JSON file and merged here.</p><div class="actions">${btn('openAdd','+ Create a question','btn-primary')}</div><div class="divider"></div><div class="upload-zone"><div style="font-size:25px;color:var(--accent)">⇧</div><b>Import questions or a backup</b><p class="tiny muted">Accepts .json and .csv. Imported question banks are saved locally.</p><label class="btn btn-soft" for="importFile">Choose file</label><input id="importFile" type="file" accept=".json,.csv,application/json,text/csv"></div><p class="tiny muted" style="margin-top:12px">CSV columns: topic, question, answer, type, source, page. JSON may use exported VivaLab format or an array of question objects.</p></section><section class="card pad"><div class="section-head"><h2>Your data</h2></div><p class="small muted">Your ratings, bookmarks, and personal notes are private to this browser. If you switch browsers or devices, export a backup and import it on the new device.</p><div class="actions">${btn('exportBank','Full backup (questions + progress)','btn-quiet')}${btn('exportProgress','Progress only','btn-quiet')}${btn('exportCsv','Question CSV','btn-quiet')}</div><div class="divider"></div><div class="small"><b>${userQs.length}</b> custom or imported questions · <b>${s.bookmarked}</b> bookmarks</div><p class="tiny muted">Your question bank is available offline.</p><button class="btn btn-danger btn-small" data-action="confirmReset" style="margin-top:10px">Reset ratings and notes</button></section></div>
<section class="card pad" style="margin-top:18px"><div class="section-head"><h2>Install VivaLab</h2></div><p class="small muted">Add VivaLab to your home screen for quick access and offline revision.</p><div class="actions"><button class="btn btn-primary" data-action="pwaInstall">Install app</button></div></section>
<section class="card pad" style="margin-top:18px"><div class="section-head"><h2>Display preferences</h2></div><div class="setting-grid"><div class="field"><label>Theme</label><select id="settingTheme"><option value="system" ${prefs.theme==='system'?'selected':''}>Follow device</option><option value="light" ${prefs.theme==='light'?'selected':''}>Light</option><option value="dark" ${prefs.theme==='dark'?'selected':''}>Dark</option></select></div><div class="field"><label>Accent colour</label><select id="settingAccent">${[['teal','Teal'],['indigo','Indigo'],['rose','Rose'],['amber','Gold']].map(([k,v])=>`<option value="${k}" ${prefs.accent===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Question / answer font size</label><select id="settingFont">${[['0.9','Small'],['1','Default'],['1.15','Large'],['1.3','Extra large']].map(([k,v])=>`<option value="${k}" ${String(prefs.font)===k?'selected':''}>${v}</option>`).join('')}</select></div></div></section>
<section class="card pad" style="margin-top:18px"><div class="section-head"><h2>Qur’anic verses & reflections</h2>${badge(QURAN_VERSES.length+' verses',true)}</div><p class="small muted" style="margin-bottom:18px">A verse appears at the bottom of each page and changes as you navigate. The English wording below gives a concise rendering of the meaning.</p><div class="verse-collection">${QURAN_VERSES.map(v=>`<article class="verse-item"><strong>Al-Quran ${H(v.ref)}</strong><p>“${H(v.quote)}”</p><small>${H(v.summary)}</small></article>`).join('')}</div></section>
${footer()}`}
function makeStudy(){let pool=questions.filter(q=>{if(S.source!=='all'&&q.source!==S.source)return false;const c=caseById.get(q.caseId);if(!c)return false;if(S.studyKind==='selected'&&c.id!==S.selectedCase)return false;if(['short','long','topic'].includes(S.studyKind)&&c.kind!==S.studyKind)return false;if(S.studyWeak&&['good','easy'].includes(progress[q.id]?.rating))return false;return true});if(!pool.length){toast('No matching questions. Change the revision filter.');return}pool.sort(()=>Math.random()-.5);let arr=pool.slice(0,Math.min(Number(S.studyLength)||20,pool.length)).map(q=>q.id);S.study={queue:arr,index:0,graded:0};startTrackedSession('study',S.study);S.reveal=false;pushNavState();go('study')}
function startMock(mode){const longs=cases.filter(c=>c.kind==='long'&&c.qids?.length),shorts=cases.filter(c=>c.kind==='short'&&c.qids?.length).sort(()=>Math.random()-.5);const longCase=longs[Math.floor(Math.random()*longs.length)];if(!longCase||shorts.length<3){toast('Requires at least one long case and three short cases.');return}let durations=mode==='full'?[10,20,20]:[2,5,5];S.mock={mode,durations,longId:longCase.id,shortIds:shorts.slice(0,3).map(c=>c.id),phase:0,shortIdx:0,qIndex:0,remaining:durations[0]*60,running:true,lastTick:Date.now(),graded:0,seen:0,done:false};startTrackedSession('mock',S.mock);S.reveal=false;pushNavState();go('mock')}
function mockNext(){let m=S.mock;if(!m)return;let c=caseById.get(m.phase===2?m.shortIds[m.shortIdx]:m.longId);m.seen++;m.qIndex++;if(m.qIndex>=(c?.qids.length||1)){m.qIndex=0;if(m.phase===2&&m.shortIdx<2)m.shortIdx++}S.reveal=false;updateCurrentSession();render()}
function nextMockPhase(){let m=S.mock;if(!m)return;if(m.phase>=2){m.done=true;m.running=false;updateCurrentSession(true);render();return}m.phase++;m.qIndex=0;m.shortIdx=0;m.remaining=m.durations[m.phase]*60;m.lastTick=Date.now();S.reveal=false;updateCurrentSession();render()}
function storeRating(r){let q=currentQ();if(!q)return;let p=progress[q.id]||(progress[q.id]={});p.seen=true;p.rating=r;p.count=(p.count||0)+1;p.last=Date.now();log.push({id:q.id,rating:r,when:p.last});if(log.length>600)log=log.slice(-600);if(S.view==='study'&&S.study){S.study.graded++;S.study.index++;S.reveal=false;updateCurrentSession(S.study.index>=S.study.queue.length)}else if(S.view==='mock'&&S.mock){S.mock.graded++;mockNext();updateCurrentSession();persist();return}persist();if(S.view==='bank'&&S.bankView==='continuous')renderPreservingScroll();else render()}
function currentQ(){if(S.view==='study'&&S.study)return qById.get(S.study.queue[S.study.index]);if(S.view==='mock'&&S.mock&&S.mock.phase!==0){let m=S.mock,c=caseById.get(m.phase===2?m.shortIds[m.shortIdx]:m.longId);return qById.get(c?.qids[m.qIndex%c.qids.length])}return qById.get(S.selectedQ)}
function jumpBankQuestion(id,smooth=true){
 const c=caseById.get(S.selectedCase);if(!c?.qids.includes(id))return;
 saveHistoryScroll();S.selectedQ=id;S.reveal=false;pushNavState(false);noteBrowseSelection();
 if(S.bankView==='continuous'){
   document.querySelectorAll('.q-dot').forEach(b=>b.classList.toggle('active',b.dataset.qid===id));
   const counter=document.querySelector('#bankNavCounter');if(counter)counter.textContent='Question '+(c.qids.indexOf(id)+1)+' / '+c.qids.length;
   const el=document.getElementById('viva-q-'+id);if(el)el.scrollIntoView({behavior:smooth?'smooth':'instant',block:'start'});
 } else {render();const el=document.querySelector('.question-card');if(el)el.scrollIntoView({behavior:smooth?'smooth':'instant',block:'start'});}
}
function nextBank(dir){let c=caseById.get(S.selectedCase);if(!c)return;let i=Math.max(0,c.qids.indexOf(S.selectedQ));let ni=clamp(i+dir,0,c.qids.length-1);if(ni!==i)jumpBankQuestion(c.qids[ni]);}
function renderPreservingScroll(){
 const y=window.scrollY;let active=document.getElementById('viva-q-'+S.selectedQ);const top=active?.getBoundingClientRect().top;
 render();requestAnimationFrame(()=>{const again=document.getElementById('viva-q-'+S.selectedQ);if(top!==undefined&&again)window.scrollTo({top:Math.max(0,window.scrollY+again.getBoundingClientRect().top-top),behavior:'instant'});else window.scrollTo({top:y,behavior:'instant'})});
}

function downloadFile(text,name,mime='application/json'){const blob=new Blob([text],{type:mime+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function exportBank(){let data={format:'VivaLab Backup',version:1,exportedAt:new Date().toISOString(),source:BUILT_IN.source,cases,questions,sources,userCases,userQs,progress,notes,log,prefs,sessions};downloadFile(JSON.stringify(data,null,2),'vivalab-full-backup-'+new Date().toISOString().slice(0,10)+'.json')}
function exportProgress(){downloadFile(JSON.stringify({format:'VivaLab Progress',version:1,exportedAt:new Date().toISOString(),progress,notes,log,prefs,sessions},null,2),'vivalab-progress-'+new Date().toISOString().slice(0,10)+'.json')}
function csvCell(x){return'"'+String(x??'').replace(/"/g,'""')+'"'}
function exportCsv(){let cols=['topic','type','question','answer','source','page'];let csv=[cols.join(',')];for(const q of questions){let c=caseById.get(q.caseId);csv.push([c?.title,c?.kind,q.q,q.a,findSource(q.source),q.page].map(csvCell).join(','))}downloadFile('\ufeff'+csv.join('\r\n'),'vivalab-question-bank.csv','text/csv')}
function parseCsv(str){let rows=[],row=[],cell='',quotes=false;for(let i=0;i<str.length;i++){let a=str[i];if(a==='"'){if(quotes&&str[i+1]==='"'){cell+='"';i++}else quotes=!quotes}else if(a===','&&!quotes){row.push(cell);cell=''}else if((a==='\n'||a==='\r')&&!quotes){if(a==='\r'&&str[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=a}row.push(cell);if(row.some(x=>x.trim()))rows.push(row);let head=(rows.shift()||[]).map(s=>s.replace(/^\ufeff/,'').trim().toLowerCase());return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]||''])))}
function mergeSessions(list){const ids=new Set(sessions.map(s=>s.id));for(const s of list){if(s&&s.id&&!ids.has(s.id)&&['study','mock','browse'].includes(s.kind)){sessions.push(s);ids.add(s.id)}}sessions=sessions.slice(0,150)}
function importObject(raw,filename){if(raw?.format==='VivaLab Progress'){progress={...progress,...(raw.progress||{})};notes={...notes,...(raw.notes||{})};log=[...log,...(raw.log||[])].slice(-600);if(raw.prefs)prefs={...prefs,...raw.prefs};if(Array.isArray(raw.sessions))mergeSessions(raw.sessions);applyPrefs();persist();render();toast('Progress imported.');return}
let incoming=Array.isArray(raw)?raw:Array.isArray(raw?.questions)?raw.questions:[],srcName=raw?.source?.title||filename,imported=0,caseMap=new Map();if(raw?.format==='VivaLab Backup'){progress={...progress,...(raw.progress||{})};notes={...notes,...(raw.notes||{})};log=[...log,...(raw.log||[])].slice(-600);if(Array.isArray(raw.sessions))mergeSessions(raw.sessions)}
// preserve original case mapping for backups, but only save additional cases/questions
const importedCases=Array.isArray(raw?.cases)?raw.cases:[];
for(const c of importedCases){if(caseById.has(c.id)){caseMap.set(c.id,c.id);continue}let nc={...c,id:c.id||randomId(),qids:[],kind:c.kind==='long'?'long':'short'};userCases.push(nc);caseMap.set(c.id,nc.id)}
let originalIds=new Set(questions.map(q=>q.id));let sourceId='src-'+randomId();
for(const item of incoming){let qtext=String(item.q||item.question||item.prompt||'').trim(),answer=String(item.a||item.answer||item.model_answer||'').trim();if(!qtext||!answer)continue;if(item.id&&originalIds.has(item.id))continue;let cid=caseMap.get(item.caseId);if(!cid){let topic=String(item.topic||item.caseTitle||item.case||'Imported questions').trim();let c=userCases.find(c=>c.title===topic)||cases.find(c=>c.title===topic);if(!c){c={id:randomId(),kind:item.type==='long'?'long':'short',title:topic,scenario:String(item.scenario||''),page:item.page||'',qids:[]};userCases.push(c)}cid=c.id}let nc={id:item.id&&!originalIds.has(item.id)?String(item.id):randomId(),caseId:cid,q:qtext,a:answer,quick:Array.isArray(item.quick)?item.quick:[],source:sourceId,page:item.page||'',pdfPage:null};
let c=userCases.find(c=>c.id===cid);
if(!c){ // Do not mutate the built-in bank; create a personal extension topic.
 const original=caseById.get(cid);c={id:randomId(),title:(original?.title||'Imported questions')+' · additional questions',kind:original?.kind||'short',scenario:original?.scenario||'',page:'',qids:[]};userCases.push(c);nc.caseId=c.id;
}
c.qids.push(nc.id);userQs.push(nc);originalIds.add(nc.id);imported++}
if(imported){sources.push({id:sourceId,title:srcName,year:raw?.source?.year||''});recalc();persist();render();toast('Imported '+imported+' new questions.')}else{persist();render();toast('No new valid questions found; existing records were preserved.')}}
async function importFile(file){if(!file)return;try{let text=await file.text();let raw=file.name.toLowerCase().endsWith('.csv')?parseCsv(text):JSON.parse(text);importObject(raw,file.name)}catch(e){toast('Import failed: '+e.message)}}
const decryptedPdfUrls=new Map();
async function openPdf(page=1,which='barker2009'){
 const path=BOOK_FILES[which];if(!path){toast('Textbook is unavailable.');return;}
 const tab=window.open('about:blank','_blank');if(!tab){toast('Allow pop-ups to open the textbook.');return;}
 try{
   tab.document.title='Opening textbook';tab.document.body.textContent='Opening textbook…';
   if(!decryptedPdfUrls.has(which)){
     const bytes=await fetchEncryptedAsset(path);
     const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},window.vivaKey,bytes.slice(12));
     const url=URL.createObjectURL(new Blob([raw],{type:'application/pdf'}));decryptedPdfUrls.set(which,url);
   }
   tab.location.replace(decryptedPdfUrls.get(which)+'#page='+Math.max(1,Number(page)||1));
 }catch(e){tab.close();toast('Unable to open textbook: '+e.message)}
}
function modal(html){document.querySelector('#modalLayer').innerHTML=`<div class="modal-layer" data-action="closeModalOuter"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`}
function closeModal(){document.querySelector('#modalLayer').innerHTML=''}
function addModal(){let c=caseById.get(S.selectedCase);modal(`<div class="section-head"><h2>Create a viva question</h2><button class="icon-btn" data-action="closeModal" aria-label="Close">✕</button></div><p class="small muted">Personal questions are stored locally and included in your exports.</p><form id="addForm"><div class="field"><label>Topic / case title</label><input name="topic" maxlength="200" required value="${H(c?.title||'')}"></div><div class="field"><label>Case type</label><select name="type"><option value="short">Short case</option><option value="long" ${c?.kind==='long'?'selected':''}>Long case</option></select></div><div class="field"><label>Viva question</label><textarea name="question" required placeholder="What are your anaesthetic considerations?"></textarea></div><div class="field"><label>Model answer / speaking points</label><textarea name="answer" required rows="7" placeholder="Preoperative…&#10;Intraoperative…&#10;Postoperative…"></textarea></div><div class="field"><label>Source / attribution (optional)</label><input name="source" placeholder="Your notes, guideline, textbook…"></div><div class="actions" style="justify-content:flex-end;margin-top:20px"><button class="btn btn-quiet" type="button" data-action="closeModal">Cancel</button><button class="btn btn-primary" type="submit">Save question</button></div></form>`)}
function noteModal(){let q=currentQ();if(!q)return;modal(`<div class="section-head"><h2>Your question note</h2><button class="icon-btn" data-action="closeModal">✕</button></div><p class="small muted">${H(q.q)}</p><form id="noteForm"><textarea name="note" rows="8" placeholder="Add your mnemonics, updated guideline notes, examiner pointers…">${H(notes[q.id]||'')}</textarea><div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-quiet" type="button" data-action="closeModal">Cancel</button><button class="btn btn-primary" type="submit">Save note</button></div></form>`)}
function tick(){let m=S.mock;if(!m||m.done||!m.running)return;let now=Date.now(),elapsed=Math.max(0,Math.floor((now-m.lastTick)/1000));if(elapsed<1)return;m.lastTick+=elapsed*1000;m.remaining=Math.max(0,m.remaining-elapsed);let el=document.querySelector('#mockTimer');if(el)el.textContent=fmtTime(m.remaining);if(elapsed&&m.remaining%10===0)updateCurrentSession();if(!m.remaining){updateCurrentSession();m.running=false;let h=document.querySelector('#mockTimerHint');if(h)h.textContent='Time expired — advance to the next phase';toast('Phase time elapsed. Advance when ready.')}}
function handleAction(action,targetQ=null){
 if(action==='toggleMenu')document.querySelector('#app').classList.toggle('menu-open');
 else if(action==='closeMenu')document.querySelector('#app').classList.remove('menu-open');
 else if(action==='quickTheme'){prefs.theme=prefs.theme==='dark'?'light':'dark';prefs.explicitTheme=true;applyPrefs();persist();render()}
 else if(action==='reveal'){const id=targetQ||S.selectedQ;if(S.view==='bank'&&S.bankView==='continuous'){if(!id||!qById.has(id))return;S.selectedQ=id;S.bankOpenQ[id]=true;renderPreservingScroll()}else{if(S.view==='bank'&&id&&qById.has(id))S.selectedQ=id;S.reveal=true;render()}}
 else if(action==='bookmark'){let q=currentQ();if(!q)return;let p=progress[q.id]||(progress[q.id]={});p.bookmark=!p.bookmark;persist();if(S.view==='bank'&&S.bankView==='continuous')renderPreservingScroll();else render();toast(p.bookmark?'Saved to bookmarks':'Bookmark removed')}
 else if(action==='note')noteModal();
 else if(action==='bankNext')nextBank(1);
 else if(action==='bankPrev')nextBank(-1);
 else if(action==='openBank'){S.bankCollapsed=false;go('bank')}else if(action==='submitGlobalSearch')performSearch()
 else if(action==='startStudy'){if(currentSessionId&&S.study)leaveSession();S.study=null;go('study')}
 else if(action==='resumePrevious'){let s=mostRecentResumable();if(s)resumeSession(s.id);else toast('No unfinished sessions yet.')}
 else if(action==='resumeStudy'){let s=mostRecentResumable();if(s)resumeSession(s.id);else go('study')}
 else if(action==='startStudySession')makeStudy();
 else if(action==='studySkip'){S.study.index++;S.reveal=false;updateCurrentSession(S.study.index>=S.study.queue.length);render()}
 else if(action==='endStudy'){leaveSession();S.study=null;go('study')}
 else if(action==='resetStudy'){leaveSession();S.study=null;go('study')}
 else if(action==='startMock'){go('mock')}
 else if(action==='newMock'){leaveSession();S.mock=null;go('mock')}
 else if(action==='endMock'){if(S.mock){S.mock.running=false;leaveSession()};S.mock=null;go('mock')}
 else if(action==='toggleTimer'){if(!S.mock)return;S.mock.running=!S.mock.running;S.mock.lastTick=Date.now();updateCurrentSession();render()}
 else if(action==='nextMockPhase')nextMockPhase();
 else if(action==='mockNext')mockNext();
 else if(action==='openAdd')addModal();
 else if(action==='closeModal')closeModal();
 else if(action==='closeModalOuter'){}
 else if(action==='pwaInstall')installVivaLab();
 else if(action==='openBook')openPdf(1,'barker2009');
 else if(action==='exportBank')exportBank();
 else if(action==='exportProgress')exportProgress();
 else if(action==='exportCsv')exportCsv();
 else if(action==='confirmReset')modal(`<div class="section-head"><h2>Reset your progress?</h2><button class="icon-btn" data-action="closeModal">✕</button></div><p>This clears ratings, bookmarks, notes, and activity. Your question bank and session history remain.</p><div class="actions" style="justify-content:flex-end;margin-top:20px">${btn('closeModal','Cancel','btn-quiet')}${btn('resetData','Reset progress','btn-danger')}</div>`);
 else if(action==='resetData'){progress={};notes={};log=[];persist();closeModal();render();toast('Ratings and notes reset.')}
 else if(action==='studyWeak'){S.studyKind='all';S.studyWeak=true;S.study=null;go('study')}
 else if(action==='viewInsights')go('insights');
 else if(action==='toggleBank'){S.bankCollapsed=!S.bankCollapsed;render()}
 else if(action==='toggleFilters'){S.bankFiltersOpen=!S.bankFiltersOpen;render()}
 else if(action==='toggleQuestionNav'){S.navExpanded=!S.navExpanded;renderPreservingScroll()}
}

function saveCustom(form){let d=Object.fromEntries(new FormData(form));let topic=d.topic.trim(),q=d.question.trim(),a=d.answer.trim();if(!topic||!q||!a){toast('Topic, question and answer are required.');return}let c=cases.find(c=>c.title.toLowerCase()===topic.toLowerCase()&&c.kind===d.type);if(!c){c={id:randomId(),title:topic,kind:d.type,scenario:'',page:'',number:null,qids:[]};userCases.push(c)}let sid='custom';if(d.source?.trim()){let s=sources.find(x=>x.title===d.source.trim());if(!s){s={id:'src-'+randomId(),title:d.source.trim(),year:''};sources.push(s)}sid=s.id}let nq={id:randomId(),caseId:c.id,source:sid,q,a,quick:[],page:'',pdfPage:null};userQs.push(nq);if(userCases.includes(c))c.qids.push(nq.id);else{ // built-in cases are immutable; create a linked personal extension case to avoid changing baked data
 let ext={id:randomId(),title:topic+' · personal additions',kind:d.type,scenario:'',page:'',number:null,qids:[nq.id]};userCases.push(ext);nq.caseId=ext.id;S.selectedCase=ext.id
}S.selectedCase=nq.caseId;S.selectedQ=nq.id;S.reveal=false;recalc();persist();closeModal();go('bank');toast('Question saved.')}
function getSafeCase(id){return caseById.get(id)}
document.addEventListener('click',e=>{let target=e.target.closest('[data-bank-view],[data-bank-reveal],[data-view],[data-action],[data-type],[data-case],[data-qid],[data-rate],[data-answer-mode],[data-pdf],[data-mock-mode],[data-mock-case],[data-go-q],[data-resume-session],[data-search-case],.zoomable-figure,[data-book]');if(!target)return;if(target.classList.contains('zoomable-figure')){openImage(target.src,target.alt);return}if(target.dataset.bankView){S.bankView=target.dataset.bankView;prefs.bankView=S.bankView;S.bankOpenQ={};S.navExpanded=true;persist();renderPreservingScroll();return}if(target.dataset.bankReveal){S.bankReveal=target.dataset.bankReveal;prefs.bankReveal=S.bankReveal;S.navExpanded=true;persist();renderPreservingScroll();return}if(target.dataset.qTarget&&S.view==='bank'){S.selectedQ=target.dataset.qTarget;}if(target.dataset.book){openPdf(1,target.dataset.book);return}if(target.dataset.resumeSession){resumeSession(target.dataset.resumeSession);return}if(target.dataset.searchCase){openSearchCase(target.dataset.searchCase,target.dataset.searchQ);return}if(target.dataset.action==='closeModalOuter'&&e.target!==target)return;if(target.dataset.view){go(target.dataset.view);return}if(target.dataset.type){S.type=target.dataset.type;render();return}if(target.dataset.case){saveHistoryScroll();S.selectedCase=target.dataset.case;S.selectedQ=getSafeCase(S.selectedCase)?.qids[0];S.reveal=false;S.bankOpenQ={};S.bankCollapsed=isMobile();if(S.view!=='bank')go('bank');else{pushNavState(false);render();noteBrowseSelection()};scrollToBankContent();return}if(target.dataset.qid){jumpBankQuestion(target.dataset.qid);return}if(target.dataset.rate){storeRating(target.dataset.rate);return}if(target.dataset.answerMode){const cardQ=qById.get(target.dataset.qTarget||S.selectedQ);if(target.dataset.answerMode==='quick'&&!cardQ?.quick?.length)return;S.answerMode=target.dataset.answerMode;if(S.view==='bank'&&S.bankView==='continuous')renderPreservingScroll();else render();return}if(target.dataset.pdf){openPdf(Number(target.dataset.pdf),target.dataset.pdfSource||'barker2009');return}if(target.dataset.mockMode){startMock(target.dataset.mockMode);return}if(target.dataset.mockCase){S.mock.shortIdx=Number(target.dataset.mockCase);S.mock.qIndex=0;S.reveal=false;render();return}if(target.dataset.goQ){let q=qById.get(target.dataset.goQ);if(q)openSearchCase(q.caseId,q.id);return}if(target.dataset.action)handleAction(target.dataset.action,target.dataset.qTarget||target.closest('[data-card-id]')?.dataset.cardId||null)});
document.addEventListener('submit',e=>{if(e.target.id==='addForm'){e.preventDefault();saveCustom(e.target)}else if(e.target.id==='noteForm'){e.preventDefault();let q=currentQ();if(q){notes[q.id]=new FormData(e.target).get('note');persist();closeModal();if(S.view==='bank'&&S.bankView==='continuous')renderPreservingScroll();else render();toast('Note saved')}}});
document.addEventListener('toggle',event=>{
 const node=event.target;
 if(!node.matches?.('details[data-case-section]')||!node.isConnected||!node.closest('#mainContent'))return;
 caseDisclosureState.set(node.dataset.caseId+':'+node.dataset.caseSection,node.open);
},true);
document.addEventListener('change',e=>{let t=e.target;if(t.id==='sourceFilter'){S.source=t.value;S.type='all';S.category='all';S.bankCollapsed=false;render()}else if(t.id==='catFilter'){S.category=t.value;render()}else if(t.id==='statusFilter'){S.status=t.value;render()}else if(t.id==='studyKind'){S.studyKind=t.value}else if(t.id==='studyLength'){S.studyLength=Number(t.value)}else if(t.id==='studyWeak'){S.studyWeak=t.checked}else if(t.id==='settingTheme'){prefs.theme=t.value;prefs.explicitTheme=true;applyPrefs();persist();render()}else if(t.id==='settingAccent'){prefs.accent=t.value;applyPrefs();persist();render()}else if(t.id==='settingFont'){prefs.font=Number(t.value);applyPrefs();persist();render()}else if(t.id==='importFile'){importFile(t.files?.[0]);t.value=''}});

// Stable mobile search panel: only transforms, never changes header row height.
const vivaHeader=document.querySelector('.topbar');
let vivaLastScrollY=Math.max(0,window.scrollY),vivaScrollTick=false;
let vivaScrollDirection=0,vivaScrollDistance=0;
function updateVivaSearchVisibility(){
 vivaScrollTick=false;
 const y=Math.max(0,window.scrollY),delta=y-vivaLastScrollY;
 vivaLastScrollY=y;
 if(!vivaHeader)return;
 if(y<70||document.activeElement?.closest('#globalSearchForm')||document.querySelector('#searchSuggestions:not([hidden])')){
  vivaHeader.classList.remove('search-hidden');vivaScrollDistance=0;vivaScrollDirection=0;return;
 }
 if(Math.abs(delta)<1)return;
 const direction=delta>0?1:-1;
 if(direction!==vivaScrollDirection){vivaScrollDirection=direction;vivaScrollDistance=0;}
 vivaScrollDistance+=Math.abs(delta);
 if(direction>0&&y>135&&vivaScrollDistance>24){vivaHeader.classList.add('search-hidden');vivaScrollDistance=0;}
 else if(direction<0&&vivaScrollDistance>18){vivaHeader.classList.remove('search-hidden');vivaScrollDistance=0;}
}
window.addEventListener('scroll',()=>{
 if(!vivaScrollTick){vivaScrollTick=true;requestAnimationFrame(updateVivaSearchVisibility);}
},{passive:true});
document.querySelector('#globalSearchForm')?.addEventListener('focusin',()=>{
 vivaHeader?.classList.remove('search-hidden');vivaScrollDistance=0;
});
function collapseQuestionNavigator(){
 if(S.view!=='bank'||!S.navExpanded)return;
 S.navExpanded=false;
 const nav=document.querySelector('.bank-bottom-nav');
 if(!nav)return;
 nav.querySelector('.bank-nav-expansion')?.remove();
 const toggle=nav.querySelector('.nav-progress');
 if(toggle){
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Expand question navigator');
  const chev=toggle.querySelector('.nav-chevron');
  if(chev)chev.textContent='▴';
 }
}
// Registered after the normal delegated click handler, so outside controls still work.
document.addEventListener('click',event=>{
 if(S.view==='bank'&&S.navExpanded&&!event.target.closest('.bank-bottom-nav'))collapseQuestionNavigator();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&S.view==='bank'&&S.navExpanded&&!document.querySelector('#modalLayer .modal-layer')){
  collapseQuestionNavigator();
 }
});

const headerSearch=document.querySelector('#globalSearch');
headerSearch.addEventListener('input',e=>{S.globalQuery=e.target.value;searchSuggestions()});
headerSearch.addEventListener('focus',()=>searchSuggestions());
document.querySelector('#globalSearchForm').addEventListener('submit',e=>{e.preventDefault();performSearch(headerSearch.value)});
document.addEventListener('submit',e=>{if(e.target.id==='resultSearchForm'){e.preventDefault();performSearch(document.querySelector('#resultSearchInput').value)}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#globalSearchForm'))searchSuggestions(false)});
headerSearch.addEventListener('keydown',e=>{if(e.key==='Escape'){searchSuggestions(false);headerSearch.blur()}});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey)return;let tag=document.activeElement?.tagName||'';if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if(document.querySelector('#modalLayer .modal-layer')){if(e.key==='Escape')closeModal();return}if(e.key==='/'&&S.view!=='mock'){e.preventDefault();document.querySelector('#globalSearch').focus();return}if(e.key===' '&&['bank','study','mock'].includes(S.view)){e.preventDefault();const hidden=S.view==='bank'?(S.bankReveal!=='all'&&(S.bankView==='continuous'?!S.bankOpenQ[S.selectedQ]:!S.reveal)):!S.reveal;if(hidden&&!(S.view==='mock'&&S.mock?.phase===0))handleAction('reveal',S.selectedQ)}else if(e.key==='ArrowRight'){if(S.view==='study'&&S.study){S.study.index++;S.reveal=false;updateCurrentSession(S.study.index>=S.study.queue.length);render()}else if(S.view==='bank')nextBank(1);else if(S.view==='mock'&&S.mock?.phase!==0)mockNext()}else if(e.key.toLowerCase()==='b'&&['bank','study','mock'].includes(S.view))handleAction('bookmark');else if(['1','2','3','4'].includes(e.key)&&S.reveal){storeRating(['again','hard','good','easy'][Number(e.key)-1])}});
let deferredVivaInstall=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredVivaInstall=event;});
window.addEventListener('appinstalled',()=>{deferredVivaInstall=null;});
function installVivaLab(){
 if(deferredVivaInstall){deferredVivaInstall.prompt();deferredVivaInstall=null;}
 else toast('Use your browser menu and choose Install app or Add to Home screen.');
}
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
setInterval(tick,350);recalc();applyPrefs();render();if(window.vivaHadLegacyProgress)persist();try{history.replaceState(historySnapshot(0),'')}catch{navigationEnabled=false}window.addEventListener('scroll',()=>{ /* Snapshot scroll on the next navigation, not every frame. */ },{passive:true});
