import type {InquiryTask,InquiryRecord,InquiryProgress} from './inquiry-model';
import type {Stage} from './model';
import {tasksFor} from './curriculum';
import {markValid,observedKind} from './observation';
import {currentRun,designCorrect} from './inquiry-runs';
import {validTrackPair,validTimelinePair} from './inquiry-preparation';
export function taskIssues(task:InquiryTask,r:InquiryRecord):string[]{
 // Records started before 2026-10-25 (no v) are judged by the rules they were finished under.
 const current=r.v===2,items=task.items.filter(i=>current||i.since!==2);
 const issues:string[]=[];const sourceRead=items.every(i=>r.opened.includes(i.id));
 if(['collect','connect','sort'].includes(task.kind)){if(!sourceRead)issues.push('먼저 각 자료를 눌러 안에 담긴 관찰 내용을 읽어요.');if(!items.every(i=>(r.assignments[i.id]||'')===i.target))issues.push(task.feedback);}
 if(task.id==='M3-2'&&current&&r.assignments.ladder!=='smallest')issues.push('크기 사다리에서 세균이 들어갈 칸을 골라 크기를 비교해요.');
 if(task.kind==='microscope'){
  if(Math.abs(r.focus-65)>12||r.light<40||r.light>85||!r.capture)issues.push('모양이 선명하게 보이도록 조절한 뒤 사진을 찍어요.');

 }
 if(task.kind==='sample'&&(r.sequence!==3||!['edge','plant'].includes(r.assignments.site)))issues.push(task.feedback);
 if(task.kind==='track'&&!validTrackPair(r))issues.push(task.feedback);
 if(task.kind==='track'&&current&&!r.marks.some(p=>markValid(task,r,p)))issues.push('현미경으로 크게 보고, 짚신벌레를 움직이게 하는 몸 둘레의 가는 털을 표시해요.');
 if(task.kind==='timeline'){
  if(!validTimelinePair(r))issues.push('이전과 이후를 서로 다른 순서로 고정해요.');
  if(!r.marks.length||!r.marks.every(p=>markValid(task,r,p)))issues.push('이 두 시점 사이에 새로 생긴 곰팡이나 사라진 잎 부분을 표시해요.');
  if(!r.opened.includes('process'))issues.push('관련 생물의 작용을 알려 주는 조사 자료도 열어봐요.');
 }
 if(task.kind==='build'){
  const run=currentRun(r);
  if(!designCorrect(task,r))issues.push(task.feedback);if(!run||run.result!=='supported'||r.runResult!==run.result)issues.push('실행 당시 예상과 설계를 확인해요. 새 예상이나 설계로는 다시 실행해요.');if(!run||r.reflection!==run.reflection||run.reflection!==(run.prediction===run.result?'matches':'differs'))issues.push('실행 당시 예상과 실제 결과를 비교해요.');
 }
 if(task.kind==='review'){
  if(!['allbad','somehelp'].includes(r.assignments.initial))issues.push('자료를 보기 전 내 생각을 먼저 골라요.');
  if(!sourceRead)issues.push('새로 도착한 두 자료를 모두 살펴봐요.');
  if(r.assignments.claim!=='somehelp'||r.assignments.evidence!=='yogurt-new')issues.push('새 자료가 뒷받침하는 주장과 그 근거를 골라요. 모든 세균이 해로운 것은 아니에요.');
  if(r.assignments.decision!==(r.assignments.initial===r.assignments.claim?'keep':'revise'))issues.push('처음 생각과 지금 주장을 비교해 유지했는지 수정했는지 골라요.');
 }
 if(task.kind==='publish'){const selected=task.items.find(i=>i.id===r.assignments.case);if(!selected||r.assignments.action!==selected.target)issues.push('사례와 알맞은 생물의 작용을 연결해요.');if(r.assignments.evidence!==selected?.id)issues.push('이 사례에서 확인한 근거를 골라요. 소개 문장은 짧게 쓰거나 문장틀을 사용할 수 있어요.');}
 return issues;
}
export function completedTasks(progress:InquiryProgress,stage:Stage){return tasksFor(stage).filter(t=>{const r=progress.records[t.id];return !!r?.completedAt&&taskIssues(t,r).length===0;});}
export function inquiryComplete(progress:InquiryProgress,stage:Stage){return completedTasks(progress,stage).length===4;}
export function invalidateRun(r:InquiryRecord){r.runResult='';r.reflection='';r.prediction='';}
