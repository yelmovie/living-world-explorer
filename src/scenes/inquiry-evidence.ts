import {el,button,paragraph,modal,keepBracketWords} from '../ui';
import {tasksFor} from '../curriculum';
import {voiceDialog} from '../audio';
import type {Evidence} from '../model';
import {artFor,artTime,artKey} from '../artAssets';
import {canvas,draw} from '../draw';
import {observedKind} from '../observation';
import {isGermTask,germSummary} from '../germ-lab';
import {modelButton} from '../models';
import {currentRun} from '../inquiry-runs';
import {scienceTerms,emphasizeScience} from '../science-terms';
// 2026-11-21: moved unchanged from scenes/inquiry.ts (discovery-term chips and the submitted-evidence view).
export function termChips(terms:string[]){
 const row=el('div','term-chips');row.append(el('span','term-label','과학 낱말'));
 for(const term of terms){
  if(!scienceTerms[term]){row.append(el('span','term-chip',term));continue;}
  const chip=button(term,()=>voiceDialog(modal(term+' 알아보기',[emphasizeScience(paragraph(scienceTerms[term]))]),[scienceTerms[term]],{now:true}),'term-chip');
  chip.setAttribute('aria-label',term+' 뜻 보기');row.append(chip);
 }
 return row;
}
export function inquiryEvidenceView(evidence:Evidence|undefined,compact=false){
 const box=el('div','evidence-view research-album');
 if(!evidence){box.append(paragraph('이 연구소에서 네 가지 발견을 마치면 연구 기록이 생겨요.'));return box;}
 if(!evidence.inquiry){box.append(paragraph('이전 버전의 연구 기록이에요. 새 탐구에서 발견 기록을 더 만들 수 있어요.'));return box;}
 box.dataset.recordVersion=evidence.updated||evidence.created;
 const stamp=paragraph(evidence.validationVersion===2?'내가 제출한 발견 기록':'이전 기준으로 완료한 기록 · 원본을 보존했어요. 재탐구를 제출하면 해당 기록이 갱신돼요.','record-version');box.append(stamp);
 for(const task of tasksFor(evidence.stage)){
  const record=evidence.inquiry.records[task.id];if(!record?.completedAt)continue;
  const row=el('div','album-tile');const selected=task.items.find(it=>it.id===record.assignments.case);
  if(task.kind==='review'&&!record.assignments.initial){row.append(el('strong','','이전 활동: 세균 주장의 근거 연결'),paragraph('이전 활동은 주장 연결로 완료했어요. 당시의 처음 생각은 별도로 기록하지 않았어요.'));
  const labels:Record<string,string>={round:'세균에는 둥근 모양도 있어요',everybad:'모든 세균은 해로워요',manyplaces:'세균은 여러 곳에서 발견돼요',onlywater:'세균은 물에서만 살아요'};
  for(const [id,label] of Object.entries(labels))if(record.assignments[id])row.append(paragraph(`${label} → ${record.assignments[id]==='supported'?'자료로 설명할 수 있어요':'설명을 다시 살펴봐요'}`));
  box.append(row);
  continue;}
  if(compact){row.append(el('strong','',task.title),keepBracketWords(emphasizeScience(paragraph(task.success))));
  if(task.kind==='build'){const run=currentRun(record);
  row.append(paragraph(`실행 당시 예상: ${(run?.prediction||record.prediction)==='supported'?'이어짐':'멈춤'} / 결과: ${(run?.result||record.runResult)==='supported'?'이어짐':'멈춤'}`));}
  box.append(row);
  continue;}
  const kind=task.organism?observedKind(task,record):((selected||task.items[0])?artKey(selected||task.items[0]):undefined);
  const art=artFor(kind,task.organism?(Number.isFinite(record.pins[1])?record.pins[1]:record.time):artTime(kind,(selected||task.items[0])?.detail||'',(selected||task.items[0])?.id));
  if(kind&&['microscope','track','timeline'].includes(task.kind)){
   const picture=canvas(640,360);picture.classList.add('saved-observation');
   const time=Number.isFinite(record.pins[1])?record.pins[1]:record.time;
   const paint=(image?:CanvasImageSource)=>{
    draw(picture,kind,{image,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,time,marks:task.kind==='track'?[]:record.marks,markerSpace:'world',trail:task.kind==='track'});
    picture.setAttribute('aria-label',`${task.title} · 내 관찰 기록 · 표시 ${record.marks.length}곳`);
   };
   let imageReady=false;
   const pending=picture.getContext('2d')!;pending.fillStyle='#edf1df';pending.fillRect(0,0,picture.width,picture.height);pending.fillStyle='#315f46';pending.font='28px NanumSquareNeo, sans-serif';pending.fillText('관찰 사진 준비 중…',35,180);
   // The moving specimen uses the same deterministic drawing as the activity.
   if(art){const image=new Image();
   image.onload=()=>{if(task.kind!=='track')picture.height=Math.round(picture.width*image.height/image.width);
   paint(image);
   imageReady=true;
   preview.disabled=false;};
   image.onerror=()=>{pending.clearRect(0,0,picture.width,picture.height);
   pending.fillText('사진을 다시 열어 주세요.',35,180);};
   image.src=art.src;}else{paint();
   imageReady=true;}
   const preview=button('',()=>{if(!imageReady)return;
   const full=canvas(picture.width,picture.height);
   full.getContext('2d')!.drawImage(picture,0,0);
   full.setAttribute('aria-label',picture.getAttribute('aria-label')!);
   const dialog=modal('내 관찰 사진',[full,paragraph(task.kind==='microscope'?`확대하여 살펴보고 남긴 관찰 모형이에요`:'고정한 이후 시점과 내가 남긴 관찰 표시예요.')]);
   dialog.classList.add('observation-preview-dialog');},'observation-preview',!imageReady);
   preview.setAttribute('aria-label',task.title+' · 내 관찰 사진 크게 보기');
   preview.append(picture);
   row.append(preview);
  }else if(art){const image=el('img');image.src=art.src;image.alt=art.label;row.append(image);}
  row.append(el('strong','',task.title),keepBracketWords(emphasizeScience(paragraph(task.success))));if(task.terms?.length)row.append(termChips(task.terms));const model=modelButton(task.id,'3D로 보기');if(model)row.append(model);
  const beforeDetails=row.children.length;
  if(isGermTask(task))row.append(...germSummary(task,record).map(line=>paragraph(line)));
  else if(task.kind==='microscope')row.append(paragraph(`내 관찰 사진 · 초점 ${record.focus} · 특징을 확대해 살펴봤어요`));
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
   row.append(paragraph(`처음 생각: ${record.assignments.initial==='allbad'?'모든 세균이 해로울 것 같다':'도움이 되는 세균도 있을 것 같다'}`),paragraph(`선택한 주장: ${task.targets.find(t=>t.id===record.assignments.claim)?.label||
     '이전 연결 활동 기록'}`),paragraph(`근거: ${task.items.find(it=>it.id===record.assignments.evidence)?.detail||'이전 기준에서 남긴 연결 기록'}`),paragraph(record.assignments.decision==='keep'?'처음 주장을 유지했어요.':
     '새 자료를 보고 주장을 수정했어요.'));
  }else for(const it of task.items){const target=task.targets.find(t=>t.id===record.assignments[it.id]);if(target)row.append(paragraph(`선택한 설명: ${target.label} ← 근거: ${it.label} · ${it.detail}`));}
  if(record.note)row.append(paragraph(record.note));
  const extra=Array.from(row.children).slice(beforeDetails);
  if(extra.length){const detail=el('details','evidence-details');detail.append(el('summary','','내가 남긴 근거 보기'),...extra);row.append(detail);}
  box.append(row);
 }
 return box;
}
