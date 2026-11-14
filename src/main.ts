import {mountMapEncounters} from './map-encounters.js';
import {mapVillainStages} from './map-villain-content';
import {bindMapZoom} from './map-gestures.js';
import {bindDirectionPad,mapKeyDirection} from './map-controls.js';
import {revisedEvidenceCount} from './experience';
import {needsStorageWarning} from './storage-status';
import './styles.css';
import {active,makeAttempt,stageIds,validEvidence,type Stage,type State} from './model';
import {load,save,storageMessage,restoredFromPreview,clearResearchCaptures} from './storage';
import {routes,activityRoutes,stages,back} from './content';
import {canEnter} from './evaluate';
import {reducedMotion,el,button,heading,paragraph,modal,notice,type Context} from './ui';
import {core} from './scenes/solution';
import {prepareInquiry} from './inquiry-preparation';
import {inquiryScene,inquiryEvidenceView} from './scenes/inquiry';
import {inquiryComplete,taskIssues,completedTasks} from './inquiry-evaluate';
import {emptyRecord} from './inquiry-model';
import {inquiryTasks,tasksFor} from './curriculum';
import {downloadCard} from './export';
import {iconButton,reward,stageBadge,habits,habitEarned,canDoLines} from './experience';
import {mapNodes,MAP_WIDTH,MAP_HEIGHT,mapSpawn,mapAssets} from './mapData';
import {openSettings} from './settings';
import {syncAudio,playEffect,toggleMasterSound,anySound,setMusicTrack,playNarration,stopNarration} from './audio';
import {showConcept} from './concepts';
import {showFilm} from './film';
import {startRun} from './inquiry-runs';
import {sizeLadder} from './ladder';
import {acceptedRecord} from './inquiry-records';
import {residents,residentMarker,residentConversation} from './residents';


const app=document.querySelector<HTMLDivElement>('#app')!;
let state:State;let cleanups:(()=>void)[]=[];let saveTimer:ReturnType<typeof setTimeout>|undefined;let shownStorageWarning='';
let mapModule:Promise<typeof import('./renderers/map')>|undefined;
function loadMap(){
 return mapModule??=import('./renderers/map').catch(error=>{mapModule=undefined;throw error;});
}
function warmNextMap(dialog:HTMLDialogElement){
 const warm=()=>{
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(dialog.open&&!document.hidden&&navigator.onLine&&!connection?.saveData&&!/^(slow-)?2g$/.test(connection?.effectiveType||''))
   void loadMap().catch(()=>{/* The map screen owns the recovery controls. */});
 };
 const idle=typeof requestIdleCallback==='function';
 const job=idle?requestIdleCallback(warm,{timeout:700}):window.setTimeout(warm,300);
 dialog.addEventListener('close',()=>idle?cancelIdleCallback(job):clearTimeout(job),{once:true});
}
function showStorageWarning(){if(needsStorageWarning(storageMessage)&&storageMessage!==shownStorageWarning){shownStorageWarning=storageMessage;modal('기록 저장을 확인해 주세요',[paragraph(storageMessage),paragraph('이 창을 닫기 전에 선생님께 알려 주세요. 설정에서도 저장 상태를 확인할 수 있어요.')]);}}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>void save(state).then(showStorageWarning),120);}
function allowed(route:string){const a=active(state);if(state.settings.admin||['main','nature-map'].includes(route))return true;const i=stages.findIndex(s=>s.entry===route||s.exit===route);if(i>=0)return (i===0||validEvidence(a,stages[i-1].id,false))&&(route===stages[i].entry||validEvidence(a,stages[i].id,false)||completedTasks(a.inquiry,stages[i].id).length>=2);return canEnter(a,route,false);}
function go(route:string){if(!routes.includes(route))route='main';if(!allowed(route)){notice('먼저 앞선 발견 기록을 완성해요.');route='nature-map';}const a=active(state);a.route=route;if(activityRoutes.includes(route))a.resumeRoute=route;history.replaceState(state.settings.admin?{teacherPreview:true}:null,'',`#/${route}`);persist();render();app.scrollTop=0;}
let dialogueStage:Stage|null=null;
function complete(stage:Stage){const a=active(state),first=!validEvidence(a,stage,state.settings.admin);if(first&&!inquiryComplete(a.inquiry,stage)){notice('네 가지 발견 기록을 먼저 완성해요.');return;}if(first)a.evidence[stage]={stage,attemptId:a.id,origin:state.settings.admin?'demo':'learner',created:new Date().toISOString(),validationVersion:2,summary:stages.find(s=>s.id===stage)!.summary,draft:structuredClone(a.draft),inquiry:structuredClone(a.inquiry)};a.resumeRoute=null;if(first&&!state.settings.admin)dialogueStage=stage;playEffect('success');void save(state).then(()=>{go('nature-map');if(first)showConcept(stage,state.settings,()=>reward(stage,()=>{
 const marker=app.querySelector<HTMLButtonElement>(`.map-resident[data-stage="${stage}"]`);
 marker?.focus({preventScroll:true});marker?.click();
}));else if(habitEarned(a,stage))notice(`'${habits[stageIds.indexOf(stage)].name}' 배지를 받았어요. 발견 도감에서 볼 수 있어요.`);});}
// 다시 도전 restarts only the working records of one stage; accepted evidence, rewards, report and card stay.
function retry(stage:Stage){const i=stageIds.indexOf(stage);modal(`${stages[i].title} 다시 도전`,[paragraph('네 탐구를 처음부터 다시 해요. 이미 남긴 발견 기록·보상·소개 카드는 그대로 남아요.'),paragraph(`이번에 네 탐구를 한 번에 정확히 기록하면 '${habits[i].name}' 배지를 받아요.`),button('다시 도전 시작',()=>{const a=active(state);for(const t of tasksFor(stage))a.inquiry.records[t.id]=prepareInquiry(t);a.inquiry.current[stage]=0;persist();document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>d.close());go(stages[i].entry);},'primary')]);}
function story(prepareMap=false){
 const sections=[['작은 생물의 사건을 조사해요','숲과 연못에 궁금한 사건이 생겼어요. 모아와 토토가 증거를 찾는 네 도움이 필요해요.'],['손으로 탐구하고 발견해요','확대해 관찰하고, 시간을 움직여 비교하고, 근거를 연결해요.'],['증거를 연결하면 사건이 풀려요','관찰한 단서를 연결하고, 아직 알 수 없는 것도 구별해요. 조사 결과를 전하면 다음 연구소가 열려요.']];
 const body=el('div','intro-story');const page=el('div','story-page');const pic=el('img','story-character');pic.src='assets/characters/moa-portrait.webp';pic.alt='모아 연구원';const copy=el('div','story-copy');page.append(pic,copy);const tabs=el('div','story-controls');let n=0;
 const draw=()=>{copy.replaceChildren(el('span','eyebrow',`${n+1} / 3`),heading(sections[n][0]),paragraph(sections[n][1]));playNarration('story-'+(n+1));tabs.replaceChildren(button('이전',()=>{n--;draw();},'secondary',n===0),button(n===2?'탐험 지도로':'다음',()=>{if(n<2){n++;draw();}else{dialog.close();go('nature-map');}},'primary'));};body.append(page,tabs);const dialog=modal('모아와 토토의 탐험 의뢰',[body]);dialog.classList.add('story-dialog');dialog.addEventListener('close',stopNarration,{once:true});draw();if(prepareMap)warmNextMap(dialog);
}
async function examples(){const a=makeAttempt();for(const task of inquiryTasks){const r=emptyRecord();r.opened=task.items.map(i=>i.id);for(const it of task.items)if(['collect','connect','sort'].includes(task.kind))r.assignments[it.id]=it.target;
 r.clean=true;if(task.kind==='microscope'){r.level=2;r.focus=65;r.capture=true;r.marks=task.organism==='mushroom'?[{x:.506,y:.201}]:task.organism==='mold'?[{x:.38,y:.17},{x:.36,y:.5}]:[{x:.4,y:.3}];}
 if(task.kind==='sample'){r.sequence=3;r.assignments.site='plant';}if(task.kind==='track'){r.pins=[0,5];r.level=2;r.marks=[{x:.17,y:.501}];}if(task.id==='M3-2')r.assignments.ladder='smallest';if(task.kind==='timeline'){r.pins=[0,3];r.marks=task.organism==='bread'?[{x:.49,y:.4}]:[{x:.51,y:.54}];r.opened.push('process');}
 if(task.kind==='build'){for(const it of task.items)if(it.target)r.assignments[it.target]=it.id;r.assignments.edge1='linked';r.assignments.edge2='linked';r.prediction='supported';r.runResult='supported';r.reflection='matches';const run=startRun(r);run.status='completed';run.result=r.runResult='supported';run.reflection=r.reflection='matches';}
 if(task.kind==='review')r.assignments={initial:'allbad',claim:'somehelp',evidence:'yogurt-new',decision:'revise'};
 if(task.kind==='publish'){r.assignments.case='yogurt';r.assignments.action='lactic';r.assignments.evidence='yogurt';r.note='유산균의 도움으로 우유를 요구르트로 만들어요.';}
 if(taskIssues(task,r).length)throw Error('Invalid example '+task.id);r.completedAt=new Date().toISOString();a.inquiry.records[task.id]=r;if([2,4].includes(task.order))a.inquiry.rewards.push(task.id);
 }for(const stage of stageIds)a.evidence[stage]={stage,attemptId:a.id,origin:'demo',created:new Date().toISOString(),validationVersion:2,summary:stages.find(s=>s.id===stage)!.summary,draft:structuredClone(a.draft),inquiry:structuredClone(a.inquiry)};a.route='nature-map';state.preview=a;state.settings.admin=true;persist();go('nature-map');}
function settings(showTeacherTools=false){openSettings(state,{save:persist,render:()=>{syncAudio(state.settings);render();},go,resetLearner:()=>{if(state.settings.admin){state.preview=makeAttempt();void save(state);go('main');return;}state.learner=makeAttempt();state.preview=makeAttempt();void clearResearchCaptures().then(()=>save(state));go('main');},showStory:story,showIntro:()=>showFilm('intro',state.settings),showEnding:()=>{go('results');showFilm('final',state.settings);},printCertificate:()=>{go('results');requestAnimationFrame(()=>window.print());},loadExample:examples},showTeacherTools);}
function records(){const a=active(state);const cards=stages.map((s,i)=>{const card=el('section','record-summary');const head=el('div','record-heading');const label=el('div','record-label');const art=el('img','record-place-art');art.src=`assets/places/${['fungi','water','archive','village','workshop'][i]}.webp`;art.alt='';label.append(art,heading(s.title));head.append(label);if(a.evidence[s.id])head.append(button('개념 영상 다시 보기',()=>showConcept(s.id,state.settings)));card.append(head);if(a.evidence[s.id]){const earned=habitEarned(a,s.id);const habit=el('div',`habit-row${earned?' earned':''}`);const text=el('div','habit-text');text.append(el('strong','',`${earned?'받은 배지':'도전 배지'} · ${habits[i].name}`),paragraph(earned?'네 탐구에서 관찰과 연결을 확인하고 제출해 받은 배지예요.':'네 탐구를 한 번에 정확히 기록하면 받아요. 다시 도전해도 발견 기록은 그대로 남아요.','habit-note'));habit.append(stageBadge(i,'habit-badge'),text);if(!earned&&!state.settings.admin)habit.append(button('다시 도전',()=>retry(s.id)));card.append(habit);const revised=revisedEvidenceCount(a,s.id);if(revised)card.append(paragraph(`다시 살펴본 발견 ${revised}개 · 처음과 달라도 괜찮아요. 근거를 확인하고 고친 것도 과학자의 탐구예요.`,'revision-recognition'));}card.append(a.evidence[s.id]?inquiryEvidenceView(a.evidence[s.id]):paragraph('이 연구소를 탐험하면 여기에 발견이 모여요.','record-empty'));return card;});const scale=el('details','record-ladder');scale.append(el('summary','','크기 사다리 · 내가 만난 생물의 크기 비교'),sizeLadder(new Set(stageIds.filter(id=>a.evidence[id]))));const dialog=modal('내 발견 도감',[scale,...cards]);dialog.classList.add('records-dialog');}
function titleArt(){const h=el('h1');const image=el('img','title-art');image.fetchPriority='high';image.src='assets/ui/logo.webp';image.alt='생명 코드 연구소';h.append(image);return h;}
function main(ctx:Context){
 const hero=el('section','hero');hero.append(titleArt(),paragraph('작은 생물을 만나, 큰 변화를 발견해요.','hero-subtitle'));
 const actions=el('div','hero-actions');const resume=ctx.attempt.resumeRoute;const has=!!resume||Object.keys(ctx.attempt.inquiry.records).length>0||Object.keys(ctx.attempt.evidence).length>0;actions.append(button(has?'탐험 이어 하기':'탐험 시작',()=>has?go(resume&&allowed(resume)?resume:'nature-map'):showFilm('intro',state.settings,()=>story(true)),'primary large'));hero.append(actions);ctx.host.append(hero);
 const speech=button('모아의 의뢰 듣기',()=>story(),'hero-speech left');ctx.host.append(speech);
 const dress=()=>{
  ctx.host.classList.add('home-dressed');
  for(const [name,cls,alt] of [['moa','hero-moa','모아 연구원'],['companion','hero-companion','함께 탐험하는 토끼']] as const){const img=el('img','hero-character '+cls);img.fetchPriority='low';img.decoding='async';img.src=`assets/characters/${name}-full.webp`;img.alt=alt;ctx.host.append(img);}
 };
 const artTimer=window.setTimeout(dress,650);
 ctx.cleanup(()=>clearTimeout(artTimer));
}
function map(ctx:Context){
 const done=stageIds.map(s=>validEvidence(ctx.attempt,s,state.settings.admin));const unlocked=(i:number)=>state.settings.admin||(i===5?done.every(Boolean):i===0||done[i-1]);
 const camera=el('div','map-camera');const land=el('div','map-landscape');const host=el('div','map-host');camera.style.setProperty('--map-camera-art',`url('${new URL(mapAssets.terrain,document.baseURI).href}')`);land.style.backgroundImage='var(--map-camera-art)';land.style.backgroundSize='100% 100%';const overlay=el('div','map-overlay');land.append(host,overlay);camera.append(land);ctx.host.append(camera);
 const destination=el('div','map-destination');ctx.host.append(destination);
 const arrival=el('div','map-arrival');destination.append(arrival);let selected=-1,guided=-1;let disposed=false;let m:ReturnType<typeof import('./renderers/map').mountMap>|undefined;let position={...ctx.attempt.mapPosition};
 const residentButtons:{marker:HTMLButtonElement;feet:readonly [number,number]}[]=[];
 let companion={x:position.x,y:Math.min(MAP_HEIGHT-18,position.y+34)};
 const nextIndex=done.findIndex(v=>!v),next=nextIndex<0?5:nextIndex;
 const place=(i:number)=>stages[i]?.place||'중앙 연구소';
 const toPlace=(i:number)=>{const name=place(i),tail=(name.charCodeAt(name.length-1)-0xac00)%28;return name+(tail&&tail!==8?'으로':'로');};
 const nextButton=button(`${toPlace(next)} 가기`,()=>choose(next,true),state.settings.reduced?'primary map-next':'primary map-next map-next-cue');
 nextButton.insertAdjacentHTML('beforeend','<svg class="map-direction-cue" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>');
 destination.append(nextButton);
 const mapRecovery=el('section','map-recovery');
 const mapStatus=paragraph('지도를 준비하고 있어요.');
 mapStatus.setAttribute('role','status');
 const direct=button(next===5?'연구 기록 열기':'탐구부터 시작하기',()=>{
  if(disposed)return;
  enter(next);
  const title=app.querySelector<HTMLElement>('main h2');
  if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
 },'primary');
 const retryMap=button('지도 다시 불러오기',()=>location.reload());
 retryMap.hidden=true;
 mapRecovery.hidden=true;
 mapRecovery.append(mapStatus,direct,retryMap);
 ctx.host.append(mapRecovery);
 const slowTimer=window.setTimeout(()=>{
  mapStatus.textContent='지도가 늦게 열리고 있어요. 탐구부터 시작할 수 있어요.';
  mapRecovery.hidden=false;
 },3000);
 const retryTimer=window.setTimeout(()=>{retryMap.hidden=false;},12000);
 const clearMapTimers=()=>{clearTimeout(slowTimer);clearTimeout(retryTimer);};
 ctx.cleanup(clearMapTimers);
 const setGuided=(i:number)=>{guided=i;nextButton.setAttribute('aria-busy',String(i>=0));nextButton.setAttribute('aria-disabled',String(i>=0));};
 const clearSelection=()=>{selected=-1;setGuided(-1);arrival.replaceChildren();overlay.querySelectorAll('.map-node').forEach((b,j)=>b.classList.toggle('current',j===next));};
 const cancelTravel=()=>{if(selected>=0||guided>=0){m?.cancel();clearSelection();}};
 const cancelGuidedByKey=(e:KeyboardEvent)=>{if(mapKeyDirection(e)&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.isComposing&&!document.querySelector('dialog[open]')&&!(e.target instanceof HTMLElement&&(e.target.isContentEditable||e.target.closest('input,textarea,select')))){cancelTravel();if(mode!=='follow')setMode('follow',false);}};
 document.addEventListener('keydown',cancelGuidedByKey,true);ctx.cleanup(()=>document.removeEventListener('keydown',cancelGuidedByKey,true));
 let mode:'follow'|'hand'|'overview'='follow',pan={x:0,y:0},translation={x:0,y:0},zoom=1;
 let cameraW=0,cameraH=0,landW=0,landH=0,lastFrame=0,followFrame=0;
 let returnView:{mode:'follow'|'hand',zoom:number,center:{x:number;y:number}}|undefined;
 const currentCenter=()=>({x:(cameraW/2-translation.x)/(landW||1),y:(cameraH*.55-translation.y)/(landH||1)});
 const span=()=>Math.max(camera.clientWidth,camera.clientHeight*MAP_WIDTH/MAP_HEIGHT)*1.06*zoom;
 const poseAt=(at:{x:number;y:number})=>{const w=span(),h=w*MAP_HEIGHT/MAP_WIDTH;return{x:camera.clientWidth/2-at.x*w,y:camera.clientHeight*.55-at.y*h};};
 const reduced=()=>reducedMotion(state.settings.reduced);
 const followLater=()=>{if(followFrame||disposed||mode!=='follow'||reduced())return;followFrame=requestAnimationFrame(now=>{followFrame=0;frame(position,companion,now);m?.bounds();});};
 const frame=(point:typeof position,friend=companion,now=performance.now())=>{
  position=point;companion=friend;
  const cw=camera.clientWidth,ch=camera.clientHeight,ratio=MAP_WIDTH/MAP_HEIGHT;
  // Slight overscan leaves the hand tool room to pan even on a 16:9 screen.
  if(!cw||!ch)return;
  const resized=cw!==cameraW||ch!==cameraH;
  const w=mode==='overview'?Math.min(Math.max(1,cw-32),Math.max(1,ch-148)*ratio):span(),h=w/ratio;
  if(resized&&landW&&mode==='hand')pan=poseAt(currentCenter());
  if(w!==landW||h!==landH){land.style.width=w+'px';land.style.height=h+'px';land.style.maxHeight='none';}
  cameraW=cw;cameraH=ch;landW=w;landH=h;
  const clampAxis=(size:number,span:number,at:number)=>span<=size?(size-span)/2:Math.max(size-span,Math.min(0,at));
  const tx=clampAxis(cw,w,mode==='hand'?pan.x:cw*.5-point.x/MAP_WIDTH*w),ty=clampAxis(ch,h,mode==='hand'?pan.y:ch*.55-point.y/MAP_HEIGHT*h);
  const first=resized||!lastFrame||mode!=='follow'||reduced(),a=first?1:1-Math.exp(-Math.max(1,Math.min(50,now-lastFrame))/115);
  const settled=Math.hypot(tx-translation.x,ty-translation.y)<.3;
  const x=settled?tx:clampAxis(cw,w,translation.x+(tx-translation.x)*a),y=settled?ty:clampAxis(ch,h,translation.y+(ty-translation.y)*a);
  lastFrame=now;translation={x,y};if(mode==='hand')pan={x,y};if(!first&&!settled)followLater();land.style.transform=`translate3d(${x}px,${y}px,0)`;
  const fx=x+friend.x/MAP_WIDTH*w,fy=y+friend.y/MAP_HEIGHT*h;
  helper.style.left=`${Math.max(22,Math.min(cw-62,fx+14))}px`;
  helper.style.top=`${Math.max(64,Math.min(ch-50,fy-75*h/MAP_HEIGHT))}px`;
  helper.hidden=fx<0||fx>cw||fy<0||fy>ch;
  residentButtons.forEach(({marker,feet})=>marker.classList.toggle('is-near',Math.hypot(point.x-feet[0],point.y-feet[1])<160));
 };
 const tools=el('div','map-view-tools');tools.setAttribute('role','group');tools.setAttribute('aria-label','지도 보기');
 const setMode=(next:typeof mode,stop=true)=>{
  if(mode===next)return;
  const wasOverview=mode==='overview';
  if(next==='overview'&&mode!=='overview')returnView={mode,zoom,center:currentCenter()};
  if(next==='hand')pan={...translation};
  mode=next;
  if(wasOverview&&returnView?.mode===next){zoom=returnView.zoom;translation=poseAt(returnView.center);if(next==='hand')pan={...translation};}
  if(stop)m?.stop();camera.classList.toggle('hand-on',mode==='hand');camera.classList.toggle('overview-on',mode==='overview');hand.setAttribute('aria-pressed',String(mode==='hand'));overview.setAttribute('aria-pressed',String(mode==='overview'));overview.setAttribute('aria-label',mode==='overview'?'이전 지도 보기':'지도 전체 보기');frame(position);m?.resize();};
 const clearStage=dialogueStage;dialogueStage=null;
 const encounters=mountMapEncounters({
  requiredFoes:5,host:camera,clearStage:()=>clearStage,stages:state.settings.admin?[]:mapVillainStages.filter((_,i)=>done[i]),progress:ctx.attempt.mapHits,
  onSave:patch=>{ctx.attempt.mapHits={...ctx.attempt.mapHits,...patch};void save(state).then(showStorageWarning);},
  blocked:()=>disposed||mode!=='follow'||guided>=0||ctx.host.dataset.mapReady!=='true',
  reduced,art:{left:'assets/map-encounter/map-villain-poses-left.webp',frames:6,nativeFacing:1},palette:'#bd84ff',reach:102,contact:24,
  tone:(kind,hits)=>playEffect(kind==='finish'?'core-wake':kind==='contact'?'pipette-drop':hits===1?'snap':'capture'),
 });
 ctx.cleanup(encounters.destroy);
 const encounterFrame=(hero:typeof position,ally:typeof companion)=>encounters.update({
  hero,ally,scale:landW/MAP_WIDTH,
  project:point=>({x:translation.x+point.x*landW/MAP_WIDTH,y:translation.y+point.y*landH/MAP_HEIGHT}),
 });
 const hand=iconButton('hand','손으로 지도 이동',()=>{cancelTravel();setMode(mode==='hand'?'follow':'hand');},'map-view-icon');
 const overview=iconButton('expand','지도 전체 보기',()=>{cancelTravel();setMode(mode==='overview'?returnView?.mode??'follow':'overview');},'map-view-icon');
 for(const b of [hand,overview]){b.querySelector('span')?.remove();b.setAttribute('aria-pressed','false');tools.append(b);}destination.prepend(tools);
 camera.tabIndex=0;camera.setAttribute('aria-label','탐험 지도. 끌어서 둘러보거나 방향키로 걸을 수 있어요.');camera.style.touchAction='none';
 let grab:{id:number;x:number;y:number;start:typeof pan}|undefined;
 const gestures=new AbortController();ctx.cleanup(()=>{gestures.abort();cancelAnimationFrame(followFrame);});
 bindMapZoom(camera,{signal:gestures.signal,enabled:()=>!disposed&&!document.hidden&&mode!=='overview'&&!document.querySelector('dialog[open]'),
  onStart:()=>{grab=undefined;camera.classList.remove('grabbing');cancelTravel();m?.cancel();setMode('hand');},
  onZoom:(start,end,ratio)=>{const point={x:(start.x-translation.x)/landW,y:(start.y-translation.y)/landH};
   zoom=Math.min(1.75,Math.max(.95,zoom*ratio));const w=span();pan={x:end.x-point.x*w,y:end.y-point.y*w*MAP_HEIGHT/MAP_WIDTH};frame(position);m?.resize();}
 });
 camera.addEventListener('pointerdown',e=>{if(mode==='overview'||e.button!==0||!e.isPrimary||document.querySelector('dialog[open]'))return;grab={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...translation}};if(mode==='hand'&&!(e.target as Element).closest('button')){e.preventDefault();e.stopPropagation();camera.setPointerCapture(e.pointerId);}},true);
 camera.addEventListener('pointermove',e=>{if(!grab||grab.id!==e.pointerId)return;const dx=e.clientX-grab.x,dy=e.clientY-grab.y;if(mode!=='hand'&&Math.hypot(dx,dy)<8)return;e.preventDefault();e.stopPropagation();if(!camera.classList.contains('grabbing')){cancelTravel();m?.cancel();setMode('hand');camera.setPointerCapture(e.pointerId);camera.focus({preventScroll:true});camera.classList.add('grabbing');}pan={x:grab.start.x+dx,y:grab.start.y+dy};frame(position);m?.bounds();},true);
 const release=()=>{grab=undefined;camera.classList.remove('grabbing');};camera.addEventListener('pointerup',release);camera.addEventListener('pointercancel',release);camera.addEventListener('lostpointercapture',release);
 camera.addEventListener('click',e=>{if(mode==='hand'&&e.detail!==0&&!(e.target as Element).closest('button')){e.preventDefault();e.stopPropagation();}},true);

 let conversation:HTMLDialogElement|undefined;
 const talk=(stage:Stage)=>{cancelTravel();if(!conversation?.open)conversation=residentConversation(stage,ctx.attempt);};
 ctx.cleanup(()=>{if(conversation?.open)conversation.close();});
 const enter=(i:number)=>{if(unlocked(i))go(stages[i]?.entry||'final-report');};
 const choose=(i:number,auto=false)=>{if(!unlocked(i)||(auto&&guided>=0))return;cancelTravel();setMode('follow');selected=i;setGuided(auto?i:-1);overlay.querySelectorAll('.map-node').forEach((b,j)=>b.classList.toggle('current',j===i));m?.move(i);};
 mapNodes.forEach(node=>{const state=done[node.index]?'복구 완료':unlocked(node.index)?'열림':'잠김';const b=iconButton(unlocked(node.index)?'unlock':'lock',node.label,()=>choose(node.index),`map-node ${done[node.index]?'restored':''} ${unlocked(node.index)?'':'locked'} ${node.index===next?'current':''}`);b.style.left=`${node.percentX}%`;b.style.top=`${Math.max(6,node.percentY-(done[node.index]?16:9))}%`;b.setAttribute('aria-label',`${node.index+1}. ${node.label} · ${state}`);if(!unlocked(node.index))b.setAttribute('aria-disabled','true');overlay.append(b);});
 for(const [i,stage] of stageIds.entries())if(done[i]){const marker=residentMarker(stage,()=>talk(stage));residentButtons.push({marker,feet:residents[stage].feet});overlay.append(marker);}
 const helper=button('…',()=>{cancelTravel();const i=done.findIndex(v=>!v);modal('같이 탐험해요',[paragraph(`다음은 ${i===-1?'중앙 연구소':stages[i].place}예요. 건물 이름이나 길을 누르면 함께 걸어가요. 방향키로도 움직일 수 있어요.`),paragraph(done.some(Boolean)?'지도에서 이웃의 이름을 누르면 이야기를 나눌 수 있어요.':'연구소 한 곳을 복구할 때마다 이웃 한 명이 돌아와요.'),button('내 발견 도감',()=>{document.querySelector<HTMLDialogElement>('dialog[open]')?.close();records();})]);},'map-companion-help');helper.setAttribute('aria-label','토토의 지도 힌트');helper.title='토토의 지도 힌트';ctx.host.append(helper);
 const directions=el('div','map-directions');directions.setAttribute('aria-label','길 따라 이동');for(const [label,dir,name] of [['↑','up','위'],['←','left','왼쪽'],['↓','down','아래'],['→','right','오른쪽']] as const){const b=button(label,()=>{},'direction');b.setAttribute('aria-label',`${name} 방향으로 걷기`);b.dataset.mapDirection=dir;directions.append(b);}ctx.host.append(directions);
 const pad=bindDirectionPad(directions,'[data-map-direction]',b=>b.dataset.mapDirection as 'up'|'down'|'left'|'right',{blocked:()=>disposed||document.hidden||!!document.querySelector('dialog[open]'),press:d=>{cancelTravel();setMode('follow');m?.walk(d);},release:()=>m?.stop(),tap:d=>{cancelTravel();setMode('follow');m?.nudge(d);}});ctx.cleanup(pad.destroy);
 const ro=new ResizeObserver(()=>{frame(position);m?.resize();});ro.observe(camera);ctx.cleanup(()=>{disposed=true;ro.disconnect();});frame(position);
 void loadMap().then(({mountMap})=>{if(disposed)return;m=mountMap(host,position,done,ctx.attempt.id,(i,p)=>{const auto=i===guided;ctx.attempt.mapPosition=p;persist();clearSelection();if(!unlocked(i))return;if(auto){enter(i);return;}selected=i;arrival.append(button(`${place(i)} 들어가기`,()=>enter(i),'primary'));},reducedMotion(state.settings.reduced),frame,clearSelection,()=>mode==='follow',()=>{
  clearMapTimers();
  if(mapRecovery.contains(document.activeElement))nextButton.focus({preventScroll:true});
  mapRecovery.hidden=true;
  ctx.host.dataset.mapReady='true';
 },encounterFrame);ctx.cleanup(m.dispose);if(selected>=0)m.move(selected);}).catch(()=>{
  if(disposed)return;
  clearMapTimers();clearSelection();
  for(const control of [destination,camera,helper,directions])control.inert=true;
  mapStatus.textContent='지도를 불러오지 못했어요. 탐구부터 시작할 수 있어요.';
  retryMap.hidden=false;
  mapRecovery.hidden=false;
 });
}
function report(ctx:Context){const a=ctx.attempt;const head=el('div','activity-heading');head.append(heading('우리의 발견을 모아 소개해요'));ctx.host.append(head);const grid=el('div','workspace');const work=el('section','workbench');const side=el('aside','tool-panel');grid.append(work,side);ctx.host.append(grid);const tabs=el('div','report-tabs');tabs.setAttribute('aria-label','확인할 연구 기록');ctx.host.insertBefore(tabs,grid);
 const hasRecord=(id:Stage)=>validEvidence(a,id,ctx.state.settings.admin);
 const confirmSlot=el('div','report-confirm-slot');
 const show=(id:Stage)=>{tabs.replaceChildren(...stages.map(s=>{const b=button(`${a.report.includes(s.id)?'✓ ':''}${s.title}`,()=>show(s.id),id===s.id?'selected':'secondary');b.prepend(stageBadge(stages.indexOf(s)));b.setAttribute('aria-pressed',String(id===s.id));return b;}));work.scrollTop=0;work.replaceChildren(inquiryEvidenceView(a.evidence[id]));confirmSlot.replaceChildren(button(a.report.includes(id)?'확인한 기록이에요':'이 기록 확인',()=>{
   if(!hasRecord(id)||a.report.includes(id))return;
   a.report.push(id);persist();render();app.querySelector<HTMLElement>('.report-confirm:not(:disabled),.action-bar .primary:not(:disabled)')?.focus();
  },'primary report-confirm',!hasRecord(id)||a.report.includes(id)));
  if(ctx.state.settings.admin&&!hasRecord(id))work.append(paragraph('아직 시연 기록이 없어요. 교사용 도구에서 예시를 불러오거나 지도에서 이 연구소를 탐험해요.'),button('교사용 도구 열기',()=>settings(true),'secondary'));
 };show(stageIds.find(id=>hasRecord(id)&&!a.report.includes(id))||stageIds.find(id=>!a.report.includes(id))||'M1');
 const presentation=()=>{
  const form=el('div','presentation-form');
  const items=tasksFor('M4').flatMap(task=>{
   const record=a.evidence.M4?.inquiry?.records[task.id];
   return record?.completedAt?task.items.filter(it=>record.opened.includes(it.id)):[];
  });
  const saved=a.presentation;
  const pick=el('select');pick.setAttribute('aria-label','발표할 생활 사건');
  if(saved)pick.append(new Option('내가 저장한 발표',''));
  for(const item of items)pick.append(new Option(item.label,item.id));
  const prompt=el('label','field');prompt.append(el('span','field-label','발표할 생활 사건'),pick);if(items.length)form.append(prompt);
  const fields={observation:el('textarea'),evidence:el('textarea'),life:el('textarea')};
  const draw=()=>{
   const item=items.find(it=>it.id===pick.value);
   fields.observation.value=item?.label??saved?.observation??'';
   fields.evidence.value=item?.detail??saved?.evidence??'';
   fields.life.value=item?'':saved?.life??'';
  };
  for(const [key,label] of [['observation','조사한 사건'],['evidence','그렇게 생각한 근거'],['life','우리 생활과의 연결']] as const){
   const wrap=el('label','field'),input=fields[key];input.maxLength=140;input.setAttribute('aria-label',label);
   wrap.append(el('span','field-label',label),input);form.append(wrap);
  }
  fields.life.placeholder='누구에게 어떤 도움이나 문제가 되었나요?';pick.onchange=draw;draw();
  const album=el('details','evidence-details');album.append(el('summary','','내 조사 기록 펼치기'),inquiryEvidenceView(a.evidence.M4));
  const dialog=modal('우리 생활 속 생물',[form,button('발표 문장 저장',()=>{
   a.presentation={observation:fields.observation.value,evidence:fields.evidence.value,life:fields.life.value};persist();dialog.close();
  },'primary'),album]);
 };
 const reviewed=stageIds.filter(id=>hasRecord(id)&&a.report.includes(id)).length;
 const reportStatus=paragraph(reviewed===5?'✓ 기록 5개를 모두 확인했어요. 코어에 연결해요.':`기록 ${reviewed}/5 확인 · 위에서 연구소를 골라 발견을 확인해요.`,'report-status');
 const mentor=el('img','report-mentor');mentor.src='assets/characters/moa-portrait.webp';mentor.alt='모아 연구원';side.append(reportStatus,mentor,heading('내 말로 소개해요'),paragraph('관찰한 것 / 그렇게 생각한 근거 / 우리 생활과의 연결'),button('생활 사건 발표',presentation,'secondary',!hasRecord('M4')));
 const f=el('div','action-bar');f.append(button('지도로',()=>go('nature-map')),confirmSlot,button('발견을 코어에 연결',()=>go('core-restoration'),'primary',!stageIds.every(id=>hasRecord(id)&&a.report.includes(id))));ctx.host.append(f);
}
/** Moa's line plays once per visit of the session, not on every re-render. */
let resultsVoiced=false;
function results(ctx:Context){const a=ctx.attempt;ctx.host.classList.add('results');const publish=acceptedRecord(a,'M5-4');const choice=inquiryTasks.find(t=>t.id==='M5-4')!.items.find(i=>i.id===publish?.assignments.case);const layout=el('div','results-layout');const celebration=el('section','result-celebration');const stamp=el('span','completion-seal',a.activated?'연구소 복구 완료':'교사용 시연 · 결과 미리보기');celebration.append(stamp,el('h1','','작은 생물,\n우리 생활의 큰 발견'),paragraph(a.activated?'너의 발견으로 연구소가 다시 깨어났어요.':'탐구 기록을 모아 코어를 가동하면 여기에 결과가 나타나요.'));if(a.activated&&!resultsVoiced){resultsVoiced=true;playNarration('results-1');ctx.cleanup(stopNarration);}const earned=el('div','result-badges');earned.setAttribute('aria-label',`복구한 연구 구역 ${stageIds.filter(id=>a.evidence[id]).length}개`);stages.forEach((s,i)=>{if(!a.evidence[s.id])return;const b=stageBadge(i,`result-badge${habitEarned(a,s.id)?' habit':''}`);b.title=habitEarned(a,s.id)?habits[i].name+' 배지':'';earned.append(b);});const habitCount=stageIds.filter(id=>habitEarned(a,id)).length;celebration.append(earned,paragraph(`탐구 습관 배지 ${habitCount}/5${habitCount<5?' · 발견 도감에서 다시 도전할 수 있어요':' · 모두 모았어요'}`,'habit-summary'));const companions=el('div','result-companions');for(const [name,alt] of [['moa','모아 연구원'],['companion','길잡이 토토']]){const pic=el('img');pic.src=`assets/characters/${name}-full.webp`;pic.alt=alt;companions.append(pic);}celebration.append(companions);const card=el('section','result-card');card.append(el('span','eyebrow','짝에게 카드를 보여 주고 설명해요'),heading('나만의 생물 소개 카드'));const title=el('input');title.id='result-title';title.maxLength=36;title.value=a.cardTitle;title.setAttribute('aria-label','소개 카드 제목');title.oninput=()=>{a.cardTitle=title.value;persist();};const titleLabel=el('label','field-label','소개 카드 제목');titleLabel.htmlFor=title.id;const note=el('textarea');note.id='result-note';note.maxLength=100;note.value=a.cardNote||publish?.note||'';note.setAttribute('aria-label','소개 문장');note.oninput=()=>{a.cardNote=note.value;persist();};const noteLabel=el('label','field-label','친구에게 전할 발견');noteLabel.htmlFor=note.id;card.append(titleLabel,title,paragraph(choice?`소개할 사례: ${choice.label}\n${choice.detail}`:'내가 만든 연구 기록을 친구에게 소개해요.','result-case'),noteLabel,note);
 const canDo=el('div','can-do');const canDoText=paragraph('','can-do-lines');const certificate=el('section','print-certificate');
 const drawCertificate=()=>{const lines=canDoLines(a);canDoText.textContent=lines.length?lines.join('\n'):'인증서에 넣을 "나는 이제 … 할 수 있어요" 문장을 골라요.';canDoText.classList.toggle('empty',!lines.length);certificate.replaceChildren(heading('생명 코드 연구소 탐구 인증서'),paragraph('관찰 · 비교 · 근거 조사 · 생활 영향 · 활용 설계'),paragraph(a.cardTitle),...lines.map(line=>paragraph(line,'certificate-can')),paragraph(a.cardNote),paragraph(`20개 탐구 활동과 다섯 연구 패킷을 완성했어요. 탐구 습관 배지 ${stageIds.filter(id=>habitEarned(a,id)).length}/5`));};
 const pickCanDo=()=>{const chosen=new Set(a.canDo||[]);const list=el('div','can-do-choices');stages.forEach((s,i)=>{const b=button(habits[i].can,()=>{if(chosen.has(s.id))chosen.delete(s.id);else chosen.add(s.id);b.classList.toggle('selected',chosen.has(s.id));b.setAttribute('aria-pressed',String(chosen.has(s.id)));},chosen.has(s.id)?'secondary selected':'secondary');b.prepend(stageBadge(i));b.setAttribute('aria-pressed',String(chosen.has(s.id)));list.append(b);});const own=el('input');own.id='can-do-own';own.maxLength=40;own.value=a.canDoNote||'';own.placeholder='예) 집에서 곰팡이가 생기는 곳을 찾아 설명할';const ownLabel=el('label','field can-do-own');ownLabel.htmlFor=own.id;ownLabel.append(el('span','field-label','내 말로 쓰기'),el('span','can-do-frame','나는 이제'),own,el('span','can-do-frame','수 있어요.'));const dialog=modal('나는 이제 이런 것을 할 수 있어요',[paragraph('해 보니 할 수 있게 된 것을 골라요. 여러 개 골라도 되고, 내 말로 써도 돼요.'),list,ownLabel,button('인증서에 넣기',()=>{a.canDo=stageIds.filter(id=>chosen.has(id));a.canDoNote=own.value.trim();persist();drawCertificate();dialog.close();},'primary')]);dialog.classList.add('can-do-dialog');};
 canDo.append(el('span','field-label','나는 이제 이런 것을 할 수 있어요'),canDoText,button('할 수 있게 된 것 고르기',pickCanDo));card.append(canDo);drawCertificate();const row=el('div','hero-actions');row.append(button('내 카드 저장',()=>void downloadCard(state).then(()=>playEffect('success'),()=>notice('카드를 다시 저장해 주세요.')),'primary'),button('인증서 인쇄',()=>window.print(),'secondary',!a.activated),button('발견 도감',records));card.append(row);layout.append(celebration,card);ctx.host.append(layout);if(a.activated)ctx.host.append(certificate);}
function render(){if(!state)return;cleanups.forEach(f=>f());cleanups=[];app.replaceChildren();const a=active(state);app.dataset.route=a.route;document.documentElement.classList.toggle('large-text',state.settings.large);document.documentElement.classList.toggle('reduced',reducedMotion(state.settings.reduced));setMusicTrack(a.route==='results'?'ending':'main');syncAudio(state.settings);
 const header=el('header','toolbar');const left=el('div','toolbar-group');if(a.route!=='main')left.append(iconButton('home','홈',()=>go('main')),iconButton('back','이전',()=>go(back[a.route]||'nature-map')));const right=el('div','toolbar-group');right.append(iconButton(anySound(state.settings)?'sound':'mute',anySound(state.settings)?'소리 켜짐':'소리 꺼짐',()=>{toggleMasterSound(state.settings);persist();render();}),iconButton('settings','설정',()=>settings()));header.append(left,right);app.append(header);if(state.settings.admin){const exit=button('교사용 시연 · 종료',()=>{state.settings.admin=false;persist();go(state.learner.route);},'preview-banner');exit.setAttribute('aria-label','시연 종료 · 학생 기록으로 돌아가기');header.append(exit);}
 const host=el('main',`screen screen-${a.route}`);app.append(host);if(state.settings.admin)host.dataset.preview='true';const ctx:Context={host,state,attempt:a,save:persist,render,go,complete,cleanup:f=>cleanups.push(f)};
 const handlers:Record<string,(ctx:Context)=>void>={main,'nature-map':map,'final-report':report,'core-restoration':core,results};for(const s of stages){handlers[s.entry]=c=>inquiryScene(c,s.id);handlers[s.exit]=c=>inquiryScene(c,s.id);}
 try{(handlers[a.route]||main)(ctx);}catch(e){console.error(e);host.replaceChildren(heading('기록을 지키고 있어요.'),paragraph('지도로 돌아가 탐구를 다시 열어주세요.'),button('지도로',()=>go('nature-map'),'primary'));}
}
window.addEventListener('hashchange',()=>{if(state)go(location.hash.replace('#/',''));});window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);if(state)void save(state);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state){clearTimeout(saveTimer);void save(state);}});
// Keep the offline pack out of the home and intro requests. Start it after the first usable activity.
if(import.meta.env.PROD&&'serviceWorker' in navigator)app.addEventListener('activity-ready',()=>{
 const prepare=()=>void navigator.serviceWorker.register('./sw.js').catch(()=>{});
 window.setTimeout(()=>typeof requestIdleCallback==='function'?requestIdleCallback(prepare,{timeout:3000}):prepare(),3000);
},{once:true});
document.documentElement.style.removeProperty('--app-height');void load().then(s=>{state=s;const a=active(state);if(a.mapPosition.x===480&&a.mapPosition.y===380)a.mapPosition={...mapSpawn};const route=history.state?.teacherPreview||restoredFromPreview?a.route:location.hash.replace('#/','')||a.route;go(route);showStorageWarning();});

import './glass-surfaces.css';
