import {el,button,heading,paragraph,slider,choices,select,modal,notice,type Context} from '../ui';
import {stages} from '../content';
import {tasksFor} from '../curriculum';
import {emptyRecord,type InquiryTask,type InquiryRecord} from '../inquiry-model';
import {taskIssues,completedTasks,invalidateRun} from '../inquiry-evaluate';
import {playEffect} from '../audio';
import {guidance} from '../inquiry-guidance';
import {showConcept} from '../concepts';
import type {Stage,Evidence} from '../model';
import {artFor,artTime,artKey} from '../artAssets';
import {canvas,draw} from '../draw';
import {addMark,markHint,markValid} from '../observation';
import {currentRun,startRun,designCorrect} from '../inquiry-runs';
import {publishRecord} from '../inquiry-records';
import {sourceNotes} from '../inquiry-sources';

const backgrounds:Record<Stage,string>={M1:'fungi',M2:'water',M3:'archive',M4:'village',M5:'workshop'};
export function mentor(task:InquiryTask,record:InquiryRecord){const box=el('div','buddy-card');const pic=el('img');pic.src='assets/characters/companion-portrait.webp';pic.alt='토끼 길잡이 토토';const talk=el('div','buddy-speech');talk.hidden=true;let level=0;const text=paragraph('');const more=button('다른 힌트',()=>{level=(level+1)%3;draw();playEffect('hint');},'text-button');const draw=()=>{text.textContent=[task.mentor,task.instruction,guidance(task,record).action][level];};talk.append(text,more);const b=button('',()=>{talk.hidden=!talk.hidden;level=0;draw();b.setAttribute('aria-expanded',String(!talk.hidden));playEffect('hint');},'buddy-toggle');b.setAttribute('aria-label','토토의 힌트');b.setAttribute('aria-expanded','false');b.append(pic,el('span','','토토에게 힌트'));box.append(b,talk);return box;}
export function inquiryScene(ctx:Context,stage:Stage){
 const progress=ctx.attempt.inquiry;const list=tasksFor(stage);let index=progress.current[stage]??0;index=Math.max(0,Math.min(3,index));const task=list[index];const r=progress.records[task.id]??=emptyRecord();let disposed=false;ctx.cleanup(()=>disposed=true);
 ctx.host.classList.add('expedition-shell',`stage-${stage}`);ctx.host.dataset.stage=stage;ctx.host.dataset.kind=task.kind;ctx.host.style.setProperty('--facility-image',`url('/assets/places/${backgrounds[stage]}.webp')`);
 const head=el('div','expedition-header');head.append(el('span','eyebrow',`${stages.find(s=>s.id===stage)!.title} · ${index+1}번째 발견`),heading(task.title));ctx.host.append(head);
 const grid=el('div','expedition-workspace');const work=el('section','expedition-work');const host=el('div','expedition-canvas-host');host.setAttribute('aria-label',task.title+' 탐구 장면');const badge=el('span','model-badge',task.kind==='build'?'관계 설명 모형':'관찰·조사 모형');work.append(host,badge);const side=el('aside','expedition-panel');grid.append(work,side);ctx.host.append(grid);
 let running=false,ready=false;const loading=el('div','inquiry-loading','관찰 이미지를 준비하고 있어요…');loading.setAttribute('role','status');work.append(loading);const status=el('div','inquiry-status');status.setAttribute('role','status');const counter=el('strong','inquiry-counter');const action=paragraph('','next-instruction');status.append(counter,action);side.append(status,mentor(task,r));const tools=el('div','expedition-tools');tools.inert=true;side.append(tools);
 const feedback=el('p','inquiry-feedback');feedback.setAttribute('role','status');side.append(feedback);
 ctx.cleanup(()=>{if(running){const run=r.runs.at(-1);if(run?.status==='running')run.status='interrupted';ctx.save();}});
 let view:ReturnType<typeof import('../renderers/inquiry2d').mountInquiry>|undefined;
 const updateStatus=()=>{const g=guidance(task,r);counter.textContent=g.ready?'✓ 기록 준비 완료':`탐구 중 · ${g.done} / ${g.total}`;action.textContent=g.action;status.classList.toggle('ready',g.ready);};
 const save=()=>{r.submitted=false;ctx.save();updateStatus();};const paint=()=>{view?.refresh();save();};
 const info=(text:string)=>{feedback.textContent=text;const portrait=side.querySelector('.mentor-card');portrait?.classList.add('has-feedback');};
 const source=(id:string)=>{const it=task.items.find(i=>i.id===id);if(!it)return;const detail=el('div','source-detail');detail.append(paragraph(it.detail),sourceNotes(task));if(it.art){const kind=artKey(it)!;const art=artFor(kind,artTime(kind,it.detail,it.id));if(art){const pic=el('img','source-picture');pic.src=art.src;pic.alt=art.label;detail.prepend(pic);}else{const pic=canvas(640,360);pic.classList.add('source-picture');draw(pic,kind);pic.setAttribute('aria-label','확인하기 전의 생각을 나타낸 물음표');detail.prepend(pic);}}if(!r.opened.includes(id))r.opened.push(id);save();const dialog=modal(it.label,[detail,button(task.kind==='build'?'이 재료 선택':'이 단서 선택',()=>{view?.arm(id);dialog.close();},'primary')]);dialog.classList.add('source-dialog');dialog.addEventListener('close',()=>{view?.refresh();controls();},{once:true});};
 void import('../renderers/inquiry2d').then(async({mountInquiry})=>{await document.fonts.ready;if(disposed)return;view=mountInquiry(host,task,r,{changed:()=>{save();feedback.textContent='';controls();},open:source,feedback:info,ready:(ok)=>{ready=ok;tools.inert=!ok;next.disabled=!ok;if(ok)loading.remove();else{loading.replaceChildren(paragraph('관찰 이미지를 준비하지 못했어요. 연결을 확인하고 다시 열어요.'),button('이미지 다시 준비',ctx.render));}}},ctx.state.settings.reduced);ctx.cleanup(view.dispose);}).catch(()=>{loading.replaceChildren(paragraph('장면을 열지 못했어요.'),button('다시 열기',ctx.render));});
 const controls=()=>{tools.replaceChildren();
  if(task.kind==='microscope'){
   if(!r.capture){tools.append(slider('초점',0,100,5,r.focus,v=>{r.focus=v;paint();}),slider('밝기',20,100,5,r.light,v=>{r.light=v;paint();}),button('사진 촬영',()=>{r.capture=true;r.marks=[];paint();controls();playEffect('capture');},'primary'));}
   else tools.append(paragraph(`촬영한 사진 · 특징 표시 ${r.marks.length}곳`),button('다시 관찰',()=>{r.capture=false;r.marks=[];paint();controls();}),button('표시 되돌리기',()=>{r.marks.pop();paint();controls();}),button('특징 밖의 표시만 지우기',()=>{r.marks=r.marks.filter(p=>markValid(task,r,p));paint();controls();},'text-button'));
   const zoomButton=button('확대해서 보기',()=>{r.zoom=r.zoom===1?1.5:1;paint();controls();});zoomButton.setAttribute('aria-pressed',String(r.zoom>1));zoomButton.title=r.zoom>1?'확대 중 · 누르면 원래 크기':'누르면 1.5배 확대';tools.append(zoomButton);
  }else if(task.kind==='track'){
   tools.append(slider('관찰 시점',0,10,1,r.time,v=>{view?.setPlaying(false);r.time=v;paint();}),button('움직임 재생',()=>view?.setPlaying(true)),button(`A 고정${r.pins[0]===undefined?'':` · ${r.pins[0]}`}`,()=>{view?.setPlaying(false);r.pins[0]=Math.round(r.time);paint();controls();playEffect('capture');}),button(`B 고정${r.pins[1]===undefined?'':` · ${r.pins[1]}`}`,()=>{view?.setPlaying(false);r.pins[1]=Math.round(r.time);paint();controls();playEffect('capture');}));
   if(r.pins.length===2)tools.append(slider('두 시점 겹쳐 보기',0,100,5,50,v=>view?.setReveal(v/100)),button('나란히 보기',()=>view?.setReveal(undefined),'text-button'));
  }else if(task.kind==='timeline'){
   tools.append(slider('관찰 순서',0,3,1,r.time,v=>{r.time=v;paint();}),button(`이전 고정${r.pins[0]===undefined?'':` · ${r.pins[0]+1}`}`,()=>{r.pins[0]=r.time;r.marks=[];paint();controls();playEffect('capture');}),button(`이후 고정${r.pins[1]===undefined?'':` · ${r.pins[1]+1}`}`,()=>{r.pins[1]=r.time;r.marks=[];paint();controls();playEffect('capture');}),button('관련 작용 자료',()=>{r.opened=[...new Set([...r.opened,'process'])];save();modal('함께 살펴볼 조사 자료',[paragraph(task.organism==='bread'?'곰팡이가 자라면서 먹을 빵이 변질되었어요. 이 빵은 먹지 않아요.':'균류와 세균은 죽은 생물의 물질을 분해하는 데 관여해요. 관찰 전후만으로 어느 생물이 관여했는지 모두 알아내지는 못해요.')]);}));
   if(r.pins.length===2)tools.append(slider('전후 겹쳐 보기',0,100,5,50,v=>view?.setReveal(v/100)),button('나란히 보기',()=>view?.setReveal(undefined),'text-button'),button('변화 밖의 표시만 지우기',()=>{r.marks=r.marks.filter(p=>markValid(task,r,p));paint();controls();},'text-button'));
  }else if(task.kind==='sample'){
   tools.append(choices([{id:'edge',label:'물가 가까이'},{id:'plant',label:'물풀 가까이'}],r.assignments.site||'',v=>{r.assignments.site=v;paint();controls();}),button(['스포이드 누르기','물속에서 놓기','한 방울 옮기기','준비했어요'][r.sequence],()=>{if(!r.assignments.site)return info('채집할 장소를 먼저 골라요.');if(r.sequence<3)r.sequence++;paint();controls();playEffect('water');},'secondary',r.sequence===3));
  }else if(task.kind==='build'){
   tools.append(button('사례 기록 보기',()=>modal(task.caseName+' 조사 자료',[paragraph(task.items.filter(i=>i.target).map(i=>i.detail).join('\n')),sourceNotes(task)])));
   const run=currentRun(r);
   if(run)tools.append(paragraph(`실행 ${r.runs.length}의 예상: ${run.prediction==='supported'?'사례처럼 이어질 것 같아요':'중간에 멈출 것 같아요'}`,'run-snapshot'),button('새 예상으로 다시 실험',()=>{invalidateRun(r);save();controls();view?.refresh();}));
   else tools.append(select('나의 예상',[{id:'',label:'실행 전에 예상해요'},{id:'supported',label:'사례처럼 이어질 것 같아요'},{id:'stopped',label:'중간에 멈출 것 같아요'}],r.prediction,v=>{r.prediction=v;save();}));
   tools.append(button(running?'흐름을 시험하고 있어요…':'설계 가동',()=>{if(running)return;if(!r.prediction)return info('가동하기 전에 어떤 결과일지 예상해요.');const valid=designCorrect(task,r),attempt=startRun(r);running=true;save();controls();playEffect('run');const finish=()=>{if(disposed)return;running=false;attempt.status='completed';attempt.result=valid?'supported':'stopped';r.runResult=attempt.result;r.reflection='';save();view?.refresh();info(valid?'설계가 연결됐어요. 실행 당시 예상과 비교해요.':task.feedback);controls();};view?.animateRun(valid,finish);},'primary',running));
   if(run){tools.append(choices([{id:'matches',label:'예상과 같아요'},{id:'differs',label:'예상과 달라요'}],run.reflection,v=>{run.reflection=r.reflection=v;save();controls();}),select('관찰 후 생각',[{id:'',label:'결과를 보고 지금 생각을 남겨요'},{id:'supported',label:'이 연결은 사례처럼 이어져요'},{id:'stopped',label:'이 연결은 중간에 멈춰요'}],r.afterThought,v=>{r.afterThought=v;save();}));}
  }else if(task.kind==='review'){
   if(!r.opened.length)tools.append(choices([{id:'allbad',label:'모든 세균이 해로울 것 같아요'},{id:'somehelp',label:'도움이 되는 세균도 있을 것 같아요'}],r.assignments.initial||'',v=>{r.assignments.initial=v;save();controls();}));
   else tools.append(paragraph(`자료를 보기 전 생각: ${r.assignments.initial==='allbad'?'모든 세균이 해로울 것 같아요':'도움이 되는 세균도 있을 것 같아요'}`));
   task.items.forEach(it=>tools.append(button((r.opened.includes(it.id)?'✓ ':'')+it.label,()=>{if(!r.assignments.initial)return info('새 자료를 보기 전 생각을 먼저 골라요.');source(it.id);},'secondary')));
   tools.append(select('새 자료를 보고 고른 주장',[{id:'allbad',label:'모든 세균이 해로워요'},{id:'somehelp',label:'모든 세균이 해로운 것은 아니에요'}],r.assignments.claim||'',v=>{r.assignments.claim=v;save();controls();}),select('내 주장의 근거',task.items.map(it=>({id:it.id,label:it.label})),r.assignments.evidence||'',v=>{r.assignments.evidence=v;save();}),choices([{id:'keep',label:'처음 생각을 유지했어요'},{id:'revise',label:'처음 생각을 수정했어요'}],r.assignments.decision||'',v=>{r.assignments.decision=v;save();controls();}));
  }else if(task.kind==='publish'){
   tools.append(select('어떤 생물의 작용인가요?',[{id:'',label:'사례와 작용을 연결해요'},...task.targets.map(t=>({id:t.id,label:t.label}))],r.assignments.action||'',v=>{r.assignments.action=v;paint();}),select('소개할 근거',task.items.map(it=>({id:it.id,label:it.detail})),r.assignments.evidence||'',v=>{r.assignments.evidence=v;paint();}));const note=el('textarea');note.maxLength=100;note.value=r.note;note.placeholder='관찰한 것 / 근거 / 생활과의 연결 (짧게 써도 돼요)';note.setAttribute('aria-label','내 소개 문장');note.oninput=()=>{r.note=note.value;save();view?.refresh();};tools.append(button('문장틀로 소개하기',()=>{const selected=task.items.find(it=>it.id===r.assignments.case);if(!selected)return info('소개할 사례를 먼저 골라요.');r.note=`관찰한 것: ${selected.label} / 근거: ${selected.detail} / 생활: 이 작용을 이용해요.`.slice(0,100);paint();controls();}),note);
  }else tools.append(button('자료 목록 보기',()=>modal('살펴볼 자료',task.items.map(it=>button(it.label,()=>{document.querySelector<HTMLDialogElement>('dialog[open]')?.close();source(it.id);})))));
  if(running)tools.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
  updateStatus();
 };
 controls();
 const alternative=()=>{
  if(!ready||running)return info(running?'실험 중에는 설계를 바꿀 수 없어요.':'이미지가 준비되면 조작할 수 있어요.');
  const list:Node[]=[];let selected='';
  if(['collect','connect','sort','build'].includes(task.kind)){
   const picked=paragraph('자료를 먼저 살펴보고 선택해요.');list.push(picked);const buttons:HTMLButtonElement[]=[];task.items.forEach(it=>{const b=button(it.label,()=>{selected=it.id;if(!r.opened.includes(it.id))r.opened.push(it.id);picked.textContent=`선택한 자료: ${it.label} · ${it.detail}`;buttons.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));save();});b.setAttribute('aria-pressed','false');buttons.push(b);list.push(b);});
   for(const t of task.targets)list.push(button(t.label+'에 연결',()=>{if(!selected)return notice('먼저 자료를 골라요.');if(task.kind==='build'){r.assignments[t.id]=selected;invalidateRun(r);}else r.assignments[selected]=t.id;paint();controls();notice('선택한 연결을 기록했어요.');}));
   if(task.kind==='build')for(const n of [1,2])list.push(button(n===1?'재료와 작용 잇기':'작용과 결과 잇기',()=>{r.assignments[`edge${n}`]='linked';invalidateRun(r);paint();controls();}));
  }else if(task.kind==='microscope'||task.kind==='timeline'){
   let x=.5,y=.45;list.push(paragraph('원본 그림의 왼쪽 위가 0, 오른쪽 아래가 1이에요. 확대와 이동을 해도 원본의 같은 위치에 표시돼요.'),slider('표시 가로 위치',0,1,.01,x,v=>x=v),slider('표시 세로 위치',0,1,.01,y,v=>y=v),button('이 위치 표시',()=>{if(task.kind==='microscope'&&!r.capture)return notice('먼저 관찰 사진을 촬영해요.');if(task.kind==='timeline'&&r.pins.length!==2)return notice('먼저 이전과 이후를 고정해요.');if(!addMark(task,r,{x,y}))return notice(markHint(task));paint();controls();notice('선택한 위치를 표시했어요.');}));
  }else if(task.kind==='publish')for(const it of task.items)list.push(button(it.label+' 소개하기',()=>{r.assignments.case=it.id;r.assignments.action='';paint();controls();notice('소개할 사례를 골랐어요.');}));
  else list.push(paragraph('오른쪽 도구의 버튼과 시간 조절을 사용할 수 있어요.'));
  modal('버튼으로 조작',list);
 };
 const footer=el('div','expedition-footer');const left=el('div','expedition-secondary');left.append(button(index===0?'지도로':'이전 발견',()=>{if(index===0)ctx.go('nature-map');else{progress.current[stage]=index-1;ctx.save();ctx.go(index-1<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);}}),button('버튼으로 조작',alternative,'text-button'),button('자료·관찰 조건',()=>modal('자료와 관찰 조건',[sourceNotes(task)]),'text-button'));
 const next=button(r.completedAt?'기록 확인하고 계속':'발견 기록하기',()=>{
  if(!ready||running)return info('이미지와 실행 결과를 확인한 뒤 기록해요.');
  r.tries++;const issues=taskIssues(task,r);r.submitted=true;if(issues.length){info(issues[0]);playEffect('retry');ctx.save();return;}
  r.completedAt=new Date().toISOString();if([2,4].includes(task.order)&&!progress.rewards.includes(task.id))progress.rewards.push(task.id);publishRecord(ctx.attempt,task,r);ctx.save();playEffect('success');
  const card=el('div','discovery-card');card.append(heading(task.success),paragraph(index===3?'연구소의 이 구역을 복구할 수 있어요.':'이 발견을 다음 탐구에서 이어서 써봐요.'));
  const dialog=modal(index===3?'연구 패킷 완성!':'새로운 발견을 기록했어요',[card,button(index===3?'연구소 복구하기':'다음 발견으로',()=>{dialog.close();if(index===3){ctx.complete(stage);return;}progress.current[stage]=index+1;ctx.save();ctx.go(index+1<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);},'primary')],{showClose:false});dialog.classList.add('discovery-dialog');
 },'primary',true);footer.append(left,next);ctx.host.append(footer);
 const stepper=el('div','activity-stepper');stepper.setAttribute('aria-label','발견 기록 진행');for(const [i,t] of list.entries()){const done=!!progress.records[t.id]?.completedAt;const step=button(done?'✓ '+(i+1):String(i+1),()=>{progress.current[stage]=i;ctx.save();ctx.go(i<2?stages.find(s=>s.id===stage)!.entry:stages.find(s=>s.id===stage)!.exit);},i===index?'current':done?'done':'',!done&&i!==index&&!ctx.state.settings.admin);step.setAttribute('aria-label',`${i+1}번째 발견: ${t.title}`);if(i===index)step.setAttribute('aria-current','step');stepper.append(step);}work.append(stepper);
 if(ctx.attempt.evidence[stage]||ctx.state.settings.admin)left.append(button('개념 영상',()=>showConcept(stage,ctx.state.settings),'secondary concept-replay'));
}

export function inquiryEvidenceView(evidence:Evidence|undefined,compact=false){
 const box=el('div','evidence-view research-album');
 if(!evidence?.inquiry){box.append(paragraph('이전 버전의 연구 기록이에요. 새 탐구에서 발견 기록을 더 만들 수 있어요.'));return box;}
 box.dataset.recordVersion=evidence.updated||evidence.created;
 const stamp=paragraph(evidence.validationVersion===2?'정상 제출한 최신 연구 기록 · 편집 중인 내용은 제출 뒤 반영돼요.':'이전 기준으로 완료한 기록 · 원본을 보존했어요. 재탐구를 제출하면 해당 기록이 갱신돼요.','record-version');box.append(stamp);
 for(const task of tasksFor(evidence.stage)){
  const record=evidence.inquiry.records[task.id];if(!record?.completedAt)continue;
  const row=el('div','album-tile');const selected=task.items.find(it=>it.id===record.assignments.case);
  if(task.kind==='review'&&!record.assignments.initial){row.append(el('strong','','이전 활동: 세균 주장의 근거 연결'),paragraph('이전 활동은 주장 연결로 완료했어요. 당시의 처음 생각은 별도로 기록하지 않았어요.'));const labels:Record<string,string>={round:'세균에는 둥근 모양도 있어요',everybad:'모든 세균은 해로워요',manyplaces:'세균은 여러 곳에서 발견돼요',onlywater:'세균은 물에서만 살아요'};for(const [id,label] of Object.entries(labels))if(record.assignments[id])row.append(paragraph(`${label} → ${record.assignments[id]==='supported'?'자료로 설명할 수 있어요':'설명을 다시 살펴봐요'}`));box.append(row);continue;}
  if(compact){row.append(el('strong','',task.title),paragraph(task.success));if(task.kind==='build'){const run=currentRun(record);row.append(paragraph(`실행 당시 예상: ${(run?.prediction||record.prediction)==='supported'?'이어짐':'멈춤'} / 결과: ${(run?.result||record.runResult)==='supported'?'이어짐':'멈춤'}`));}box.append(row);continue;}
  const kind=task.organism||((selected||task.items[0])?artKey(selected||task.items[0]):undefined);const art=artFor(kind,task.organism?(Number.isFinite(record.pins[1])?record.pins[1]:record.time):artTime(kind,(selected||task.items[0])?.detail||'',(selected||task.items[0])?.id));
  if(kind&&['microscope','track','timeline'].includes(task.kind)){
   const picture=canvas(640,360);picture.classList.add('saved-observation');
   const time=Number.isFinite(record.pins[1])?record.pins[1]:record.time;
   const paint=(image?:CanvasImageSource)=>{
    draw(picture,kind,{image,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,time,marks:record.marks,markerSpace:'world',trail:task.kind==='track'});
    picture.setAttribute('aria-label',`${task.title} · 내 관찰 기록 · 표시 ${record.marks.length}곳`);
   };
   let imageReady=false;
   const pending=picture.getContext('2d')!;pending.fillStyle='#edf1df';pending.fillRect(0,0,picture.width,picture.height);pending.fillStyle='#315f46';pending.font='28px sans-serif';pending.fillText('관찰 사진 준비 중…',35,180);
   // The moving specimen uses the same deterministic drawing as the activity.
   if(art){const image=new Image();image.onload=()=>{if(task.kind!=='track')picture.height=Math.round(picture.width*image.height/image.width);paint(image);imageReady=true;preview.disabled=false;};image.onerror=()=>{pending.clearRect(0,0,picture.width,picture.height);pending.fillText('사진을 다시 열어 주세요.',35,180);};image.src=art.src;}else{paint();imageReady=true;}
   const preview=button('',()=>{if(!imageReady)return;const full=canvas(picture.width,picture.height);full.getContext('2d')!.drawImage(picture,0,0);full.setAttribute('aria-label',picture.getAttribute('aria-label')!);const dialog=modal('내 관찰 사진',[full,paragraph(task.kind==='microscope'?`내가 남긴 특징 표시 ${record.marks.length}곳`:'고정한 이후 시점과 내가 남긴 관찰 표시예요.')]);dialog.classList.add('observation-preview-dialog');},'observation-preview',!imageReady);preview.setAttribute('aria-label',task.title+' · 내 관찰 사진 크게 보기');preview.append(picture);row.append(preview);
  }else if(art){const image=el('img');image.src=art.src;image.alt=art.label;row.append(image);}
  row.append(el('strong','',task.title),paragraph(task.success));
  if(task.kind==='microscope')row.append(paragraph(`내 촬영 · 초점 ${record.focus} · 밝기 ${record.light} · ${record.zoom}배 · 특징 표시 ${record.marks.length}곳`));
  else if(task.kind==='track')row.append(paragraph(`같은 시야의 두 순간 · A ${record.pins[0]} → B ${record.pins[1]} · 그림은 B의 위치예요.`));
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
  if(record.note)row.append(paragraph(record.note));box.append(row);
 }
 return box;
}
