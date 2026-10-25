import type {InquiryTask,InquiryRecord,InquiryProgress} from './inquiry-model';
import type {Stage} from './model';
import {tasksFor} from './curriculum';
export function taskIssues(task:InquiryTask,r:InquiryRecord):string[]{
 const issues:string[]=[];const sourceRead=task.items.every(i=>r.opened.includes(i.id));
 if(['collect','connect','sort'].includes(task.kind)){if(!sourceRead)issues.push('먼저 각 자료를 눌러 안에 담긴 관찰 내용을 읽어요.');if(!task.items.every(i=>r.assignments[i.id]===i.target))issues.push(task.feedback);}
 if(task.kind==='microscope'){
  if(Math.abs(r.focus-65)>12||r.light<40||r.light>85||!r.capture)issues.push('모양이 선명하게 보이도록 조절한 뒤 사진을 찍어요.');
  const marks=r.marks.filter(p=>p.x>.15&&p.x<.85&&p.y>.18&&p.y<.86);
  if(task.organism==='mushroom'&&!marks.some(p=>p.x>.27&&p.x<.73&&p.y>.30&&p.y<.53))issues.push('버섯의 갓 아래 주름이 보이는 곳을 표시해요.');
  if(task.organism==='mold'){const regions=[{x:.32,y:.3},{x:.65,y:.4},{x:.47,y:.64}].filter(q=>marks.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<.15));if(regions.length<2)issues.push('곰팡이의 둥근 부분과 가는 실이 이어진 두 곳을 찾아 표시해요.');}
  if(task.organism==='spirogyra'&&!marks.some(p=>p.x>.16&&p.x<.85&&p.y>.18&&p.y<.85&&[-.3,0,.3].some(d=>Math.abs(p.y-p.x-d)<.13)))issues.push('해캄의 길게 이어진 모양에 표시해요.');
 }
 if(task.kind==='sample'&&(r.sequence!==3||!['edge','plant'].includes(r.assignments.site)))issues.push(task.feedback);
 if(task.kind==='track'&&(r.pins.length!==2||!Number.isFinite(r.pins[0])||!Number.isFinite(r.pins[1])||Math.abs(r.pins[1]-r.pins[0])<3))issues.push(task.feedback);
 if(task.kind==='timeline'){
  if(r.pins.length!==2||!Number.isFinite(r.pins[0])||!Number.isFinite(r.pins[1])||r.pins[0]>=r.pins[1]||r.pins[1]>3)issues.push('이전과 이후를 서로 다른 순서로 고정해요.');
  if(!r.marks.some(p=>Math.hypot(p.x-.52,(p.y-.48)*.65)<.24))issues.push('비교한 표본 안에서 실제 달라진 곳을 표시해요.');
  if(!r.opened.includes('process'))issues.push('관련 생물의 작용을 알려 주는 조사 자료도 열어봐요.');
 }
 if(task.kind==='build'){
  const correct=task.items.filter(i=>i.target).every(i=>r.assignments[i.target]===i.id)&&r.assignments.edge1==='linked'&&r.assignments.edge2==='linked';
  if(!correct)issues.push(task.feedback);if(!r.prediction||r.runResult!=='supported')issues.push('예상한 뒤 현재 설계도를 실행해요.');if(r.reflection!==(r.prediction==='supported'?'matches':'differs'))issues.push('예상과 실행 결과를 비교해요.');
 }
 if(task.kind==='publish'){const selected=task.items.find(i=>i.id===r.assignments.case);if(!selected||r.assignments.action!==selected.target)issues.push('사례와 알맞은 생물의 작용을 연결해요.');if(r.note.trim().length<5)issues.push('알게 된 점을 다섯 글자 이상 한 문장으로 적어요.');}
 return issues;
}
export function completedTasks(progress:InquiryProgress,stage:Stage){return tasksFor(stage).filter(t=>{const r=progress.records[t.id];return !!r?.completedAt&&taskIssues(t,r).length===0;});}
export function inquiryComplete(progress:InquiryProgress,stage:Stage){return completedTasks(progress,stage).length===4;}
export function invalidateRun(r:InquiryRecord){r.runResult='';r.reflection='';r.prediction='';}
