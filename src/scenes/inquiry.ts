import {el,button,heading,paragraph,slider,choices,modal,notice,reducedMotion,type Context} from '../ui';
import {stages} from '../content';
import {tasksFor} from '../curriculum';
import {type InquiryTask,type InquiryRecord} from '../inquiry-model';
import {taskIssues,invalidateRun} from '../inquiry-evaluate';
import {playEffect} from '../audio';
import {guidance} from '../inquiry-guidance';
import {finishObservation,observationFrames} from '../inquiry-playback';
import type {Stage,Evidence} from '../model';
import {artFor,artTime,artKey,magnifyFor} from '../artAssets';
import {canvas,draw} from '../draw';
import {addMark,markHint,markValid,observedKind,featureAt} from '../observation';
import {ladderPlacement} from '../ladder';
import {modelButton} from '../models';
import {currentRun,startRun,designCorrect} from '../inquiry-runs';
import {publishRecord} from '../inquiry-records';
import {sourceNotes} from '../inquiry-sources';
import {activityIllustration} from '../experience';
import {prepareInquiry,validTrackPair,validTimelinePair,reflectClaim,introduction} from '../inquiry-preparation';
import {chooseCase} from '../inquiry-actions';
import '../link-board.css';
import '../inquiry-controls.css';
import '../inquiry-simplified.css';

let playbackRate=1;
const backgrounds:Record<Stage,string>={M1:'fungi',M2:'water',M3:'archive',M4:'village',M5:'workshop'};
export function mentor(task:InquiryTask,record:InquiryRecord){const box=el('div','buddy-card');const pic=el('img');pic.src='assets/characters/companion-portrait.webp';pic.alt='토끼 길잡이 토토';const talk=el('div','buddy-speech');talk.hidden=true;let level=0;const text=paragraph('');const more=button('다른 힌트',()=>{level=(level+1)%3;draw();playEffect('hint');},'text-button');const draw=()=>{text.textContent=[task.mentor,task.instruction,guidance(task,record).action][level];};talk.append(text,more,button('자료·관찰 조건',()=>modal('자료와 관찰 조건',[sourceNotes(task)]),'text-button'));const b=button('',()=>{talk.hidden=!talk.hidden;level=0;draw();b.setAttribute('aria-expanded',String(!talk.hidden));playEffect('hint');},'buddy-toggle');b.setAttribute('aria-label','토토의 힌트');b.setAttribute('aria-expanded','false');b.append(pic,el('span','','토토에게 힌트'));box.append(b,talk);return box;}
export function inquiryScene(ctx:Context,stage:Stage){
 const progress=ctx.attempt.inquiry;const list=tasksFor(stage);let index=progress.current[stage]??0;index=Math.max(0,Math.min(3,index));const task=list[index];const r=progress.records[task.id]??=prepareInquiry(task);let disposed=false;ctx.cleanup(()=>disposed=true);
 const linking=['collect','connect','sort'].includes(task.kind);ctx.host.classList.add('expedition-shell',`stage-${stage}`);ctx.host.classList.toggle('link-task',linking);ctx.host.dataset.stage=stage;ctx.host.dataset.kind=task.kind;ctx.host.style.setProperty('--facility-image',`url('/assets/places/${backgrounds[stage]}.webp')`);
 const head=el('div','expedition-header');const emblem=activityIllustration(task,'mission-emblem');const titles=el('div','mission-titles');titles.append(el('span','eyebrow',`MISSION ${stage.slice(1).padStart(2,'0')} · ${stages.find(s=>s.id===stage)!.title} · ${index+1}번째 발견`),heading(task.title));head.append(emblem,titles);ctx.host.append(head);
 const grid=el('div','expedition-workspace');const work=el('section','expedition-work');const host=el('div','expedition-canvas-host');host.setAttribute('aria-label',task.title+' 탐구 장면');const badge=el('span','model-badge',task.kind==='build'?'관계 설명 모형':'관찰·조사 모형');work.append(host);if(!linking)work.append(badge);const side=el('aside','expedition-panel');grid.append(work,side);ctx.host.append(grid);
 let running=false,ready=false;
 const loading=el('div','inquiry-loading','관찰 이미지를 준비하고 있어요…');loading.setAttribute('role','status');work.append(loading);
 const status=el('div','inquiry-status');const counter=el('strong','inquiry-counter');
 const action=paragraph('','next-instruction');action.setAttribute('aria-live','polite');
 const meter=el('div','inquiry-meter');meter.setAttribute('aria-hidden','true');
 const feedback=el('p','inquiry-feedback');feedback.setAttribute('role','status');
 status.append(counter,meter,feedback,action);
 const panelBody=el('div','expedition-panel-body');
 const tools=el('div','expedition-tools');tools.setAttribute('aria-label','탐구 도구');tools.inert=true;
 const sourcePreview=el('section','source-preview');sourcePreview.hidden=true;sourcePreview.setAttribute('aria-label','선택한 자료');
 const playback=el('div','inquiry-playback');playback.hidden=true;
 const speedLabel=el('label','playback-speed');speedLabel.append(el('span','','속도'));
 const speed=el('select');speed.setAttribute('aria-label','재생 속도');
 for(const rate of [.5,1,1.5,2]){const option=el('option','',rate+'배');option.value=String(rate);speed.append(option);}
 speed.value=String(playbackRate);speed.onchange=()=>{playbackRate=Number(speed.value);view?.setPlaybackRate(playbackRate);if(demoStep>=0)scheduleFrame();};
 speedLabel.append(speed);playback.append(speedLabel);
 panelBody.append(sourcePreview,tools);side.append(status,playback,panelBody);
 ctx.cleanup(()=>{if(running){const run=r.runs.at(-1);if(run?.status==='running')run.status='interrupted';ctx.save();}});
 let view:ReturnType<typeof import('../renderers/inquiry2d').mountInquiry>|undefined;
 const yogurt=task.id==='M5-1';
 const putLabel=(t:{id:string;label:string})=>yogurt?({input:'재료 병에 담기',action:'발효기에 넣기',output:'만들 음식 고르기'}[t.id]||t.label):t.label+'에 연결';
 let selectedCard='',demoStep=-1,readingSource=false,editingClaim=false,editingAction=false;
 let demoButton:HTMLButtonElement|undefined;
 const showMeter=(done:number,total:number)=>{
  if(meter.childElementCount!==total)meter.replaceChildren(...Array.from({length:total},()=>el('span')));
  Array.from(meter.children).forEach((segment,i)=>segment.classList.toggle('complete',i<done));
 };
 const updateStatus=()=>{
  if(demoStep>=0)return;
  playback.hidden=task.kind==='build'?!r.prediction||!!currentRun(r):!observationFrames(task,r).length;
  if(demoButton)demoButton.hidden=playback.hidden;
  updateReadouts();
  const g=guidance(task,r,selectedCard);
  status.hidden=readingSource||linking&&!sourcePreview.hidden;
  counter.textContent=g.ready?(task.kind==='review'?(r.assignments.decision==='revise'?'✓ 생각 수정 · 기록 준비':'✓ 생각 유지 · 기록 준비'):'✓ 기록 준비 완료'):`${g.done} / ${g.total}`;
  showMeter(g.done,g.total);
  const instruction=readingSource?'자료를 읽고 확인 버튼을 눌러요.':running?(yogurt?'시계가 도는 동안 재료가 어떻게 달라지는지 살펴봐요.':'설계도에서 작용이 어느 칸까지 이어지는지 살펴봐요.'):g.action;
  if(action.textContent!==instruction)action.textContent=instruction;
  status.classList.toggle('ready',g.ready);ctx.host.classList.toggle('record-ready',g.ready);
 };
 const save=()=>{feedback.textContent='';r.submitted=false;ctx.save();updateStatus();};
 const paint=()=>{view?.refresh();save();};
 const info=(text:string,kind:'retry'|'success'='retry')=>{feedback.dataset.kind=kind;feedback.textContent=text;};
 const source=(id:string,fromList=false)=>{
  const it=task.items.find(i=>i.id===id);if(!it||running||disposed)return;
  if(task.kind==='review'&&!r.assignments.initial)return info('새 자료를 보기 전 생각을 먼저 골라요.');
  if(!r.opened.includes(id))r.opened.push(id);
  feedback.textContent='';
  if(['collect','connect','sort','build'].includes(task.kind)){
   selectedCard=id;if(fromList)view?.arm(id);
  }
  sourcePreview.hidden=false;sourcePreview.classList.remove('filed');sourcePreview.replaceChildren(paragraph(it.detail));
  if(task.kind==='review'){
   if(ctx.state.settings.large){sourcePreview.hidden=true;readingSource=false;modal(it.label,[paragraph(it.detail)]);}
   else readingSource=true;
  }
  if(linking&&ctx.state.settings.large){sourcePreview.hidden=true;modal(it.label,[paragraph(it.detail)]);}
  panelBody.scrollTop=0;
  if(task.kind==='build'){
   const targets=el('div','source-targets');
   for(const t of task.targets)targets.append(button(putLabel(t),()=>{
    if(running||disposed)return;
    view?.assignCard(id,t.id);
   },'secondary'));
   if(fromList)sourcePreview.append(targets);
   else{const options=el('details','inline-targets');options.append(el('summary','','버튼으로 칸 고르기'),targets);sourcePreview.append(options);}
  }
  save();
  if(task.kind==='review'){controls();view?.refresh();}
 };
 // Link boards never need Phaser, so they load their own small renderer.
 const scene=():Promise<typeof import('../renderers/inquiry2d').mountInquiry>=>task.kind==='microscope'?import('../renderers/simple-microscope').then(m=>m.mountMicroscope):task.id==='M1-4'?import('../renderers/fungi-sort').then(m=>m.mountFungiSort):linking?import('../renderers/link-board').then(m=>m.mountLinkBoard):import('../renderers/inquiry2d').then(m=>m.mountInquiry);
 void scene().then(async mount=>{await document.fonts.ready;if(disposed)return;view=mount(host,task,r,{assigned:()=>{selectedCard='';sourcePreview.hidden=true;sourcePreview.replaceChildren();updateStatus();},changed:()=>{save();controls();},open:source,feedback:info,ready:(ok)=>{ready=ok;view?.setPlaybackRate(playbackRate);if(demoButton)demoButton.disabled=!ok;speed.disabled=!ok;tools.inert=!ok;next.disabled=!ok;if(ok)loading.remove();else{loading.replaceChildren(paragraph('관찰 이미지를 준비하지 못했어요. 연결을 확인하고 다시 열어요.'),button('이미지 다시 준비',ctx.render));}}},reducedMotion(ctx.state.settings.reduced));ctx.cleanup(view.dispose);}).catch(()=>{loading.replaceChildren(paragraph('장면을 열지 못했어요.'),button('다시 열기',ctx.render));});
 const openLadder=()=>{const dialog=modal('세균은 얼마나 작을까요?',[ladderPlacement(r.assignments.ladder==='smallest',()=>{r.assignments.ladder='smallest';save();playEffect('success');controls();})]);dialog.classList.add('ladder-dialog');};
 const drawControls=()=>{tools.replaceChildren();playback.querySelector('.run-play')?.remove();
  tools.dataset.phase=task.kind==='review'?(readingSource?'reading':!r.assignments.initial?'initial':!task.items.every(it=>r.opened.includes(it.id))?'sources':!r.assignments.claim||editingClaim?'claim':'evidence'):task.kind;
  if(task.kind==='microscope'){
   if(r.level<2&&!r.capture)tools.append(button('현미경으로 관찰하기',()=>{r.level=2;r.focus=45;r.light=65;paint();controls();},'primary'));
   else if(!r.capture){
    const sharp=()=>Math.abs(r.focus-65)<=12;
    const capture=button('관찰 사진 남기기',()=>{if(!sharp())return info('초점을 맞춰 선명하게 보아요.');r.capture=true;r.level=2;r.light=65;r.marks=[];paint();controls();playEffect('capture');},'primary',!sharp());
    tools.append(slider('초점',35,95,5,r.focus,v=>{r.focus=v;paint();capture.disabled=!sharp();}),button('초점 자동 맞춤',()=>{r.focus=65;r.light=65;paint();controls();}),capture);
   }else tools.append(paragraph(task.organism==='mushroom'?'포자는 버섯의 주름에서 만들어져요. 알맞은 조건에서 균사가 자랄 수 있어요.':task.organism==='mold'?'이 곰팡이는 균사로 이루어져 있고, 포자주머니 안에서 포자가 만들어져요.':'해캄은 초록색이고 여러 마디가 실처럼 이어져 있어요.'),button('다시 관찰하기',()=>{r.capture=false;r.marks=[];r.focus=65;paint();controls();}));
  }else if(task.kind==='track'&&r.level===2){
   const found=r.marks.filter(p=>markValid(task,r,p)).length;
   tools.append(paragraph(`현미경 · 몸 둘레 표시 ${found}곳`),button('표시 되돌리기',()=>{r.marks.pop();paint();controls();},'secondary',!r.marks.length),button('움직임 다시 보기',()=>{r.level=0;paint();controls();}));
  }else if(task.kind==='track'){
   if(!validTrackPair(r)){
    tools.append(slider('관찰 시점',0,10,1,r.time,v=>{view?.setPlaying(false);r.time=v;view?.setPreview(true);paint();}),
     button(`A 고정${r.pins[0]===undefined?'':` · ${r.pins[0]}`}`,()=>{r.pins=[Math.round(r.time)];view?.setPreview(true);paint();controls();playEffect('capture');}),
     button(`B 고정${r.pins[1]===undefined?'':` · ${r.pins[1]}`}`,()=>{const time=Math.round(r.time);if(!Number.isFinite(r.pins[0])||Math.abs(time-r.pins[0])<3)return info('A에서 3칸 이상 떨어진 순간을 골라요.');r.pins[1]=time;view?.setPreview(false);paint();controls();playEffect('capture');}));
   }else{
    tools.append(slider('두 시점 겹쳐 보기',0,100,5,50,v=>view?.setReveal(v/100)));
    if(r.v===2)tools.append(button('현미경으로 움직임의 비밀 찾기',()=>{r.level=2;paint();controls();playEffect('capture');},'primary'));
   }
  }else if(task.kind==='timeline'){
   if(!validTimelinePair(r))tools.append(slider('관찰 순서',0,3,1,r.time,v=>{r.time=v;view?.setPreview(true);paint();}),
    button(`이전 고정${r.pins[0]===undefined?'':` · ${r.pins[0]+1}`}`,()=>{r.pins=[r.time];r.marks=[];view?.setPreview(true);paint();controls();playEffect('capture');}),
    button(`이후 고정${r.pins[1]===undefined?'':` · ${r.pins[1]+1}`}`,()=>{if(!Number.isFinite(r.pins[0])||r.time<=r.pins[0])return info('이전보다 뒤의 관찰 순서를 골라요.');if(r.pins[1]!==r.time)r.marks=[];r.pins[1]=r.time;view?.setPreview(false);paint();controls();playEffect('capture');}));
   else{
    tools.append(slider('전후 겹쳐 보기',0,100,5,50,v=>view?.setReveal(v/100)));
    const process=paragraph(task.organism==='bread'?'곰팡이가 자라 먹을 빵이 변질되었어요. 이 빵은 먹지 않아요.':'균류와 세균은 죽은 생물의 물질을 분해하는 데 관여해요. 전후 모습만으로 어떤 생물이 관여했는지 모두 알 수는 없어요.','process-note');
    tools.append(button(r.opened.includes('process')?'✓ 조사 자료 다시 보기':'관련 조사 자료 읽기',()=>{
     modal('변화를 설명하는 조사 자료',[process]);
     if(!r.opened.includes('process')){r.opened.push('process');save();controls();}
    },r.opened.includes('process')?'secondary':'primary'));
   }
  }else if(task.kind==='sample'){
   if(!r.assignments.site)tools.append(choices([{id:'edge',label:'물가 가까이'},{id:'plant',label:'물풀 가까이'}],'',v=>{r.assignments.site=v;r.sequence=0;paint();controls();}));
   else if(r.sequence<3)tools.append(button(r.sequence===2?'한 방울 옮기기':'한 방울 채집',()=>{r.sequence=r.sequence<2?2:3;paint();controls();playEffect(r.sequence===3?'pipette-drop':'water');},'primary'));
  }else if(task.kind==='build'){
   const yes=yogurt?'요구르트가 될 거예요':'사례처럼 이어질 것 같아요',no=yogurt?'요구르트가 안 될 거예요':'중간에 멈출 것 같아요';
   const filled=task.targets.every(t=>!!r.assignments[t.id]);
   if(!filled){updateStatus();return;}
   const run=currentRun(r);
   if(run)tools.append(button('새 예상으로 다시 실험',()=>{invalidateRun(r);save();controls();view?.refresh();}));
   else if(!running&&!r.prediction)tools.append(paragraph('나의 예상','field-label'),choices([{id:'supported',label:yes},{id:'stopped',label:no}],r.prediction,v=>{r.prediction=v;save();controls();}));
   if(!run&&r.prediction&&!running)tools.append(button('예상 바꾸기',()=>{r.prediction='';save();controls();},'text-button'));
   if(!run)playback.prepend(button(yogurt?(running?'발효기를 지켜봐요…':'발효기 켜기'):(running?'흐름을 시험하고 있어요…':'설계 가동'),()=>{if(running)return;if(yogurt&&r.assignments.output!=='yogurt')return info('오늘 만들 음식은 요구르트예요. 오른쪽 칸에 요구르트를 놓아 봐요.');if(!r.prediction)return info('가동하기 전에 어떤 결과일지 예상해요.');const valid=designCorrect(task,r),attempt=startRun(r);running=true;save();controls();playEffect('run');const finish=()=>{if(disposed)return;running=false;attempt.status='completed';attempt.result=valid?'supported':'stopped';r.runResult=attempt.result;r.reflection='';save();view?.refresh();info(valid?(yogurt?'걸쭉한 요구르트가 됐어요! 내가 한 예상과 비교해요.':'설계가 연결됐어요. 실행 당시 예상과 비교해요.'):task.feedback,valid?'success':'retry');controls();};view?.animateRun(valid,finish);},'primary observation-play run-play',running||!r.prediction||!task.targets.every(t=>r.assignments[t.id])));
   if(run){tools.append(choices([{id:'matches',label:'예상과 같아요'},{id:'differs',label:'예상과 달라요'}],run.reflection,v=>{run.reflection=r.reflection=v;save();controls();}));}
  }else if(task.kind==='review'){
   if(readingSource){tools.append(button('자료 확인했어요',()=>{readingSource=false;sourcePreview.hidden=true;controls();},'primary'));}
   else if(!r.assignments.initial)tools.append(choices([{id:'allbad',label:'모든 세균이 해로울 것 같아요'},{id:'somehelp',label:'도움이 되는 세균도 있을 것 같아요'}],'',v=>{r.assignments.initial=v;reflectClaim(r);save();controls();}));
   else if(!task.items.every(it=>r.opened.includes(it.id)))task.items.forEach(it=>tools.append(button((r.opened.includes(it.id)?'✓ ':'')+it.label,()=>source(it.id))));
   else if(!r.assignments.claim||editingClaim){
    tools.append(paragraph('자료를 읽은 뒤, 내 주장','field-label'),choices(task.targets,r.assignments.claim||'',v=>{r.assignments.claim=v;editingClaim=false;reflectClaim(r);save();controls();}));
   }else{
    tools.append(paragraph('내 주장을 뒷받침하는 근거','field-label'),choices(task.items.map(it=>({id:it.id,label:it.label.replace('새 자료: ','')})),r.assignments.evidence||'',v=>{r.assignments.evidence=v;save();controls();}),button('주장 다시 고르기',()=>{editingClaim=true;controls();},'text-button'));

   }
  }else if(task.kind==='publish'){
   const selected=task.items.find(it=>it.id===r.assignments.case);
   if(selected){
    // The chosen case already contains its evidence; do not ask learners to choose the identical case twice.
    if(r.assignments.evidence!==selected.id){r.assignments.evidence=selected.id;save();}
    if(!r.assignments.action||editingAction)tools.append(paragraph('어떤 생물의 작용인가요?','field-label'),choices(task.targets,r.assignments.action||'',v=>{editingAction=false;
     const previous=introduction(task,r);r.assignments.action=v;if(!r.note||r.note===previous)r.note=introduction(task,r);paint();controls();if(v!==selected.target)info('이 사례를 만든 생물이 무엇인지 설계 기록을 떠올려요.');
    }));
    if(r.assignments.action&&!editingAction){
    const note=el('textarea');note.maxLength=100;note.value=r.note;note.placeholder='사례와 작용을 연결하면 소개 문장이 만들어져요.';note.setAttribute('aria-label','내 소개 문장');note.oninput=()=>{r.note=note.value;save();view?.refresh();};
    tools.append(note);
    tools.append(button('작용 다시 고르기',()=>{editingAction=true;controls();},'text-button'));
    }
    if(r.assignments.action&&!editingAction)tools.append(button('소개할 사례 바꾸기',()=>{
     const dialog=modal('친구에게 소개할 사례',task.items.map(item=>button(item.label,()=>{
      if(chooseCase(task,r,item.id)){paint();controls();}
      dialog.close();
      tools.querySelector<HTMLElement>('.choices button')?.focus();
     },'secondary',item.id===selected.id)));
    },'text-button'));
   }else tools.append(choices(task.items,'',id=>{if(chooseCase(task,r,id)){paint();controls();}}));
  }else{
   if(task.id==='M3-2'&&r.v===2){
    const placed=r.assignments.ladder==='smallest';tools.append(button(placed?'✓ 크기 사다리 다시 보기':'크기 사다리에 세균 놓기',openLadder,placed?'secondary':'primary'));
   }
  }
  sourcePreview.inert=running;if(running)tools.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
  updateStatus();
 };
 // Keep each question with its choices; wrapping must not detach a label from its answers.
 const organizeControls=()=>{
  Array.from(tools.querySelectorAll<HTMLElement>(':scope > .field-label')).forEach((label,i)=>{
   const answers=label.nextElementSibling;
   if(!answers?.classList.contains('choices'))return;
   const group=el('div','inquiry-choice-group');
   label.id=`${task.id}-choice-${i}`;group.setAttribute('role','group');group.setAttribute('aria-labelledby',label.id);
   label.before(group);group.append(label,answers);
  });
  for(const choice of tools.querySelectorAll<HTMLButtonElement>('.choices > .button')){
   choice.replaceChildren(el('span','inquiry-choice-label',choice.textContent||''));
  }
  for(const field of tools.querySelectorAll<HTMLElement>('.field.slider')){
   const input=field.querySelector<HTMLInputElement>('input[type=range]');
   const label=field.querySelector('.field-label');
   if(!input||!label)continue;
   const value=el('output','instrument-readout');value.setAttribute('aria-hidden','true');label.append(value);
   input.addEventListener('input',updateReadouts);
   for(const step of field.querySelectorAll('.step'))step.addEventListener('click',updateReadouts);
  }
  updateReadouts();
 };
 function updateReadouts(){
  for(const field of tools.querySelectorAll<HTMLElement>('.field.slider')){
   const input=field.querySelector<HTMLInputElement>('input[type=range]');
   const value=field.querySelector('output');if(!input||!value)continue;
   const name=input.getAttribute('aria-label');
   value.textContent=name==='관찰 순서'?`${+input.value+1} / ${+input.max+1}`:name==='관찰 시점'?`${input.value} / ${input.max}`:`${input.value}${name==='밝기'?'%':''}`;
  }
 }
 const toolControls=()=>Array.from(tools.querySelectorAll<HTMLElement>('button,input,textarea,summary'));
 const controlName=(node:HTMLElement)=>(node.getAttribute('aria-label')||node.textContent||'').replace(/^✓ /,'').split(' · ')[0];
 const controls=()=>{
  const active=document.activeElement as HTMLElement;
  const previous=toolControls();
  const index=previous.indexOf(active);
  const name=index>=0?controlName(active):'';
  drawControls();
  organizeControls();
  if(index<0)return;
  const current=toolControls();
  const usable=(n:HTMLElement)=>!n.matches(':disabled')&&!!n.getClientRects().length;
  const same=current.filter(n=>controlName(n)===name&&usable(n));
  const target=same.find(n=>n===current[index])||same[0]||current.slice(index).find(usable)||current.find(usable);
  target?.focus({preventScroll:true});
 };
 controls();
 const alternative=()=>{
  if(!ready||running)return info(running?'실험 중에는 설계를 바꿀 수 없어요.':'이미지가 준비되면 조작할 수 있어요.');
  if(task.kind==='timeline'&&validTimelinePair(r))view?.setPreview(false);
  const list:Node[]=[];let selected='';
  if(task.kind==='build'){
   const picked=paragraph('자료를 먼저 살펴보고 선택해요.');picked.setAttribute('role','status');list.push(picked);const buttons:HTMLButtonElement[]=[];task.items.forEach(it=>{const b=button(it.label,()=>{selected=it.id;source(it.id,true);picked.textContent=`선택한 자료: ${it.label} · ${it.detail}`;buttons.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));save();});b.setAttribute('aria-pressed','false');buttons.push(b);list.push(b);});
   for(const t of task.targets)list.push(button(putLabel(t),()=>{if(!selected){picked.textContent='먼저 자료를 골라요.';return;}view?.assignCard(selected,t.id);const it=task.items.find(i=>i.id===selected)!,correct=!!it.target&&r.assignments[it.target]===it.id;picked.textContent=correct?`✓ ${it.label}을 알맞은 칸에 연결했어요.`:task.feedback;info(picked.textContent,correct?'success':'retry');}));
  }else if(task.kind==='microscope'||task.kind==='timeline'||task.kind==='track'&&r.level===2){
   const gate=task.kind==='microscope'&&!r.capture&&r.level===1&&magnifyFor(task.organism,r.v===2)?.gate;
   const picture=artFor(gate?task.organism:observedKind(task,r),task.kind==='timeline'?r.pins[1]??r.time:0);
   const pad=el('div','mark-pad');const cross=el('span','mark-cross');cross.setAttribute('aria-hidden','true');
   const message=paragraph('사진 위의 조준점을 옮긴 뒤 표시 버튼을 눌러요.','mark-message');message.setAttribute('role','status');
   let x=.5,y=.45;const aim=()=>{cross.style.left=x*100+'%';cross.style.top=y*100+'%';};aim();
   const horizontal=slider('표시 가로 위치',0,1,.01,x,v=>{x=v;aim();});
   const vertical=slider('표시 세로 위치',0,1,.01,y,v=>{y=v;aim();});
   horizontal.querySelector('.field-label')!.textContent='조준점 왼쪽 ↔ 오른쪽';
   vertical.querySelector('.field-label')!.textContent='조준점 위 ↕ 아래';
   if(picture){
    const img=el('img');img.src=picture.src;img.alt=picture.label;pad.append(img,cross);
    pad.onclick=e=>{const rect=pad.getBoundingClientRect();x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));horizontal.querySelector('input')!.value=String(x);vertical.querySelector('input')!.value=String(y);aim();};
    list.push(pad);
   }
   const say=(text:string)=>{message.textContent=text;};
   list.push(message,horizontal,vertical,button(gate?'이 위치의 주름 찾기':'이 위치 표시',()=>{
    if(gate){if(featureAt(task.organism||'',{x,y})===gate){r.level=2;paint();controls();document.querySelector<HTMLDialogElement>('dialog[open]')?.close();info('주름을 찾았어요. 현미경으로 크게 봐요.','success');}else say('갓 아래쪽의 줄무늬(주름)를 찾아요.');return;}
    if(task.kind==='microscope'&&!r.capture)return say('먼저 관찰 사진을 촬영해요.');if(task.kind==='timeline'&&!validTimelinePair(r))return say('먼저 이전과 이후를 고정해요.');if(!addMark(task,r,{x,y}))return say(markHint(task,r));paint();controls();say(`✓ 특징을 표시했어요. 지금까지 ${r.marks.length}곳을 찾았어요.`);}));
  }else if(task.kind==='publish')for(const it of task.items)list.push(button(it.label+' 소개하기',()=>{if(chooseCase(task,r,it.id)){paint();controls();}notice('소개할 사례와 근거를 골랐어요.');}));
  else list.push(paragraph('오른쪽 도구의 버튼과 시간 조절을 사용할 수 있어요.'));
  const controlDialog=modal('버튼으로 조작',list);
  if(controlDialog.querySelector('.mark-pad'))controlDialog.classList.add('observation-control-dialog');
 };
 let frames=observationFrames(task,r);
 let timer:ReturnType<typeof setTimeout>|undefined;
 demoButton=['microscope','sample','timeline','track'].includes(task.kind)?button('자동재생',()=>{if(demoStep>=0)stopDemo();else{frames=observationFrames(task,r);if(frames.length)playFrame(0);}},'observation-play primary',true):undefined;
 if(demoButton)playback.prepend(demoButton);
 function stopDemo(){
  if(demoStep<0)return;
  clearTimeout(timer);demoStep=-1;view?.endDemo();
  host.inert=false;tools.inert=!ready;links.inert=false;next.disabled=!ready;
  status.classList.remove('demonstrating');demoButton!.textContent='자동재생';demoButton!.setAttribute('aria-pressed','false');
  updateStatus();feedback.textContent='';
 }
 function playFrame(index:number){
  if(disposed||!ready||!view||document.hidden||document.querySelector('dialog[open]')){stopDemo();return;}
  if(index>=frames.length){stopDemo();finishObservation(task,r);view.refresh();ctx.save();controls();return;}
  demoStep=index;
  view.showFrame(frames[index]);host.inert=true;tools.inert=true;links.inert=true;next.disabled=true;
  feedback.textContent='';status.classList.add('demonstrating');counter.textContent=`자동재생 · ${index+1} / ${frames.length}`;
  showMeter(index+1,frames.length);action.textContent=frames[index].caption;
  demoButton!.textContent='직접 해보기';demoButton!.setAttribute('aria-pressed','true');
  scheduleFrame();
 }
 function scheduleFrame(){clearTimeout(timer);timer=setTimeout(()=>playFrame(demoStep+1),2600/playbackRate);}
 if(demoButton){
  demoButton.title='도구가 움직이는 모습을 보고 직접 이어서 탐구해요';
  demoButton.setAttribute('aria-pressed','false');
  updateStatus();
  const interrupt=()=>{if(document.hidden||document.querySelector('dialog[open]'))stopDemo();};
  document.addEventListener('visibilitychange',interrupt);document.addEventListener('focusin',interrupt);
  ctx.cleanup(()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',interrupt);document.removeEventListener('focusin',interrupt);demoButton.remove();});
 }
 const footer=el('div','expedition-footer');const left=el('div','expedition-secondary');left.append(button(index===0?'지도로':'이전 발견',()=>{if(index===0)ctx.go('nature-map');else{progress.current[stage]=index-1;ctx.save();ctx.go(index-1<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);}}));
 // Optional help stays outside the notebook, leaving its height to the current operation.
 const links=el('div','panel-links');links.append(button('도움말',()=>{
  const nodes:Node[]=[paragraph(task.mentor),sourceNotes(task)];
  if(task.kind==='microscope'){const lens=magnifyFor(task.organism,r.v===2);if(lens)nodes.unshift(paragraph(lens.captions[r.level]));nodes.push(button(r.zoom>1?'원래 크기로 보기':'확대해서 보기',()=>{r.zoom=r.zoom===1?1.5:1;paint();document.querySelector<HTMLDialogElement>('dialog[open]')?.close();}));}
  if(task.kind==='sample'&&r.assignments.site)nodes.push(button('장소 다시 고르기',()=>{r.assignments.site='';r.sequence=0;paint();controls();document.querySelector<HTMLDialogElement>('dialog[open]')?.close();}));
  if(['timeline','track'].includes(task.kind))nodes.push(button('나란히 보기',()=>{view?.setReveal(undefined);document.querySelector<HTMLDialogElement>('dialog[open]')?.close();}),button('두 시점 다시 고르기',()=>{r.pins=[0];r.marks=[];r.level=0;r.time=task.kind==='timeline'?3:5;view?.setPreview(true);paint();controls();document.querySelector<HTMLDialogElement>('dialog[open]')?.close();}));
  if(task.kind==='review')for(const item of task.items)nodes.push(button(item.label,()=>modal(item.label,[paragraph(item.detail)])));
  if(task.kind==='publish'&&r.assignments.action)nodes.push(button('문장틀로 소개하기',()=>{r.note=introduction(task,r);paint();controls();document.querySelector<HTMLDialogElement>('dialog[open]')?.close();}));
  if(task.kind==='build'||task.kind==='publish')nodes.unshift(paragraph(task.items.filter(i=>i.target).map(i=>i.detail).join('\n')));
  const model=modelButton(task.id);if(model)nodes.push(model);modal('탐구 도움말',nodes);
 },'text-button'));
 if(!linking&&task.kind!=='microscope'){
  const assist=button('버튼으로 조작',alternative,'text-button');
  links.append(assist);
 }
 left.append(links);
 const next=button(r.completedAt?'기록 확인하고 계속':'발견 기록하기',()=>{
  if(!ready||running)return info('이미지와 실행 결과를 확인한 뒤 기록해요.');
  if(document.querySelector('.discovery-dialog'))return;
  if(task.kind==='publish'&&!r.note.trim())r.note=introduction(task,r);
  r.tries++;const issues=taskIssues(task,r);r.submitted=true;if(issues.length){r.misses++;info(task.kind==='review'?guidance(task,r).action:issues[0]);playEffect('retry');ctx.save();return;}
  r.clean=r.clean!==false&&r.misses===0;r.misses=0;r.completedAt=new Date().toISOString();if([2,4].includes(task.order)&&!progress.rewards.includes(task.id))progress.rewards.push(task.id);publishRecord(ctx.attempt,task,r);ctx.save();playEffect('success');
  const card=el('div','discovery-card');card.append(activityIllustration(task,'discovery-stamp',r),heading(task.success),...task.terms?.length?[termChips(task.terms)]:[],paragraph(index===3?'연구소의 이 구역을 복구할 수 있어요.':'이 발견을 다음 탐구에서 이어서 써봐요.'));const model=modelButton(task.id);if(model)card.append(model);
  const dialog=modal(index===3?'연구 패킷 완성!':'새로운 발견을 기록했어요',[card,button(index===3?'연구소 복구하기':'다음 발견으로',()=>{dialog.close();if(index===3){ctx.complete(stage);return;}playEffect('page-turn');progress.current[stage]=index+1;ctx.save();ctx.go(index+1<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);},'primary')],{showClose:false});dialog.classList.add('discovery-dialog');
 },'primary',true);footer.append(left,next);ctx.host.append(footer);
 const stepper=el('div','activity-stepper');stepper.setAttribute('aria-label','발견 기록 진행');for(const [i,t] of list.entries()){const done=!!progress.records[t.id]?.completedAt;const step=button(String(i+1),()=>{progress.current[stage]=i;ctx.save();ctx.go(i<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);},i===index?'current':done?'done':'',!done&&i!==index&&!ctx.state.settings.admin);step.setAttribute('aria-label',`${i+1}번째 발견: ${t.title}`);if(i===index)step.setAttribute('aria-current','step');stepper.append(step);}footer.insertBefore(stepper,next);

 if(linking)left.append(badge);
}

/** 새 낱말 chips: the concept words a discovery introduced. */
export function termChips(terms:string[]){const row=el('div','term-chips');row.append(el('span','term-label','새 낱말'),...terms.map(t=>el('span','term-chip',t)));return row;}
export function inquiryEvidenceView(evidence:Evidence|undefined,compact=false){
 const box=el('div','evidence-view research-album');
 if(!evidence){box.append(paragraph('이 연구소에서 네 가지 발견을 마치면 연구 기록이 생겨요.'));return box;}
 if(!evidence.inquiry){box.append(paragraph('이전 버전의 연구 기록이에요. 새 탐구에서 발견 기록을 더 만들 수 있어요.'));return box;}
 box.dataset.recordVersion=evidence.updated||evidence.created;
 const stamp=paragraph(evidence.validationVersion===2?'내가 제출한 발견 기록':'이전 기준으로 완료한 기록 · 원본을 보존했어요. 재탐구를 제출하면 해당 기록이 갱신돼요.','record-version');box.append(stamp);
 for(const task of tasksFor(evidence.stage)){
  const record=evidence.inquiry.records[task.id];if(!record?.completedAt)continue;
  const row=el('div','album-tile');const selected=task.items.find(it=>it.id===record.assignments.case);
  if(task.kind==='review'&&!record.assignments.initial){row.append(el('strong','','이전 활동: 세균 주장의 근거 연결'),paragraph('이전 활동은 주장 연결로 완료했어요. 당시의 처음 생각은 별도로 기록하지 않았어요.'));const labels:Record<string,string>={round:'세균에는 둥근 모양도 있어요',everybad:'모든 세균은 해로워요',manyplaces:'세균은 여러 곳에서 발견돼요',onlywater:'세균은 물에서만 살아요'};for(const [id,label] of Object.entries(labels))if(record.assignments[id])row.append(paragraph(`${label} → ${record.assignments[id]==='supported'?'자료로 설명할 수 있어요':'설명을 다시 살펴봐요'}`));box.append(row);continue;}
  if(compact){row.append(el('strong','',task.title),paragraph(task.success));if(task.kind==='build'){const run=currentRun(record);row.append(paragraph(`실행 당시 예상: ${(run?.prediction||record.prediction)==='supported'?'이어짐':'멈춤'} / 결과: ${(run?.result||record.runResult)==='supported'?'이어짐':'멈춤'}`));}box.append(row);continue;}
  const kind=task.organism?observedKind(task,record):((selected||task.items[0])?artKey(selected||task.items[0]):undefined);const art=artFor(kind,task.organism?(Number.isFinite(record.pins[1])?record.pins[1]:record.time):artTime(kind,(selected||task.items[0])?.detail||'',(selected||task.items[0])?.id));
  if(kind&&['microscope','track','timeline'].includes(task.kind)){
   const picture=canvas(640,360);picture.classList.add('saved-observation');
   const time=Number.isFinite(record.pins[1])?record.pins[1]:record.time;
   const paint=(image?:CanvasImageSource)=>{
    draw(picture,kind,{image,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,time,marks:task.kind==='track'?[]:record.marks,markerSpace:'world',trail:task.kind==='track'});
    picture.setAttribute('aria-label',`${task.title} · 내 관찰 기록 · 표시 ${record.marks.length}곳`);
   };
   let imageReady=false;
   const pending=picture.getContext('2d')!;pending.fillStyle='#edf1df';pending.fillRect(0,0,picture.width,picture.height);pending.fillStyle='#315f46';pending.font='28px sans-serif';pending.fillText('관찰 사진 준비 중…',35,180);
   // The moving specimen uses the same deterministic drawing as the activity.
   if(art){const image=new Image();image.onload=()=>{if(task.kind!=='track')picture.height=Math.round(picture.width*image.height/image.width);paint(image);imageReady=true;preview.disabled=false;};image.onerror=()=>{pending.clearRect(0,0,picture.width,picture.height);pending.fillText('사진을 다시 열어 주세요.',35,180);};image.src=art.src;}else{paint();imageReady=true;}
   const preview=button('',()=>{if(!imageReady)return;const full=canvas(picture.width,picture.height);full.getContext('2d')!.drawImage(picture,0,0);full.setAttribute('aria-label',picture.getAttribute('aria-label')!);const dialog=modal('내 관찰 사진',[full,paragraph(task.kind==='microscope'?`확대하여 살펴보고 남긴 관찰 모형이에요`:'고정한 이후 시점과 내가 남긴 관찰 표시예요.')]);dialog.classList.add('observation-preview-dialog');},'observation-preview',!imageReady);preview.setAttribute('aria-label',task.title+' · 내 관찰 사진 크게 보기');preview.append(picture);row.append(preview);
  }else if(art){const image=el('img');image.src=art.src;image.alt=art.label;row.append(image);}
  row.append(el('strong','',task.title),paragraph(task.success));if(task.terms?.length)row.append(termChips(task.terms));const model=modelButton(task.id,'3D로 보기');if(model)row.append(model);
  const beforeDetails=row.children.length;
  if(task.kind==='microscope')row.append(paragraph(`내 관찰 사진 · 초점 ${record.focus} · 특징을 확대해 살펴봤어요`));
  else if(task.kind==='track')row.append(paragraph(`같은 시야의 두 순간 · A ${record.pins[0]} → B ${record.pins[1]} · 그림은 B의 위치예요.${record.marks.length?` 현미경에서 몸 둘레의 섬모 ${record.marks.length}곳을 찾았어요.`:''}`));
  else if(task.kind==='timeline')row.append(paragraph(`이전 관찰 ${record.pins[0]+1} → 이후 관찰 ${record.pins[1]+1} · 그림은 이후 모습과 내 표시 ${record.marks.length}곳이에요.`));
  else if(task.kind==='sample')row.append(paragraph(`${record.assignments.site==='plant'?'물풀 가까이':'물가 가까이'}에서 채집 · ${record.sequence===3?'한 방울 표본 준비 완료':'준비 순서 '+record.sequence}`));
  else if(task.kind==='build'){
   const run=currentRun(record),assignments=run?.assignments||record.assignments;
   const chosen=task.targets.map(target=>task.items.find(it=>it.id===assignments[target.id])?.label||'선택 없음');
   row.append(paragraph(chosen.join(' → ')),paragraph(`${run?'실행 당시 예상':'이전 기록의 예상'}: ${(run?.prediction||record.prediction)==='supported'?'이어질 것 같아요':'멈출 것 같아요'} · 실행: ${(run?.result||record.runResult)==='supported'?'연결됐어요':'멈췄어요'} · ${record.reflection==='matches'?'예상과 같았어요':'예상과 달랐어요'}`));
   if(record.afterThought)row.append(paragraph(`관찰 후 생각: ${record.afterThought==='supported'?'사례처럼 이어져요':'중간에 멈춰요'}`));
   if(record.runs.length)row.append(paragraph(`실행 기록 ${record.runs.length}회 · 마지막 실험 ${run?.startedAt||'다시 확인 필요'}`));
  }else if(task.kind==='publish')row.append(paragraph(`내가 고른 사례: ${selected?.label||'선택 없음'} · ${task.targets.find(target=>target.id===record.assignments.action)?.label||'작용 선택 없음'}`));
  else if(task.kind==='review'){
   row.append(paragraph(`처음 생각: ${record.assignments.initial==='allbad'?'모든 세균이 해로울 것 같다':'도움이 되는 세균도 있을 것 같다'}`),paragraph(`선택한 주장: ${task.targets.find(t=>t.id===record.assignments.claim)?.label||'이전 연결 활동 기록'}`),paragraph(`근거: ${task.items.find(it=>it.id===record.assignments.evidence)?.detail||'이전 기준에서 남긴 연결 기록'}`),paragraph(record.assignments.decision==='keep'?'처음 주장을 유지했어요.':'새 자료를 보고 주장을 수정했어요.'));
  }else for(const it of task.items){const target=task.targets.find(t=>t.id===record.assignments[it.id]);if(target)row.append(paragraph(`선택한 설명: ${target.label} ← 근거: ${it.label} · ${it.detail}`));}
  if(record.note)row.append(paragraph(record.note));
  const extra=Array.from(row.children).slice(beforeDetails);
  if(extra.length){const detail=el('details','evidence-details');detail.append(el('summary','','내가 남긴 근거 보기'),...extra);row.append(detail);}
  box.append(row);
 }
 return box;
}
