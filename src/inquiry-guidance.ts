import type {InquiryTask,InquiryRecord} from './inquiry-model';
import {taskIssues} from './inquiry-evaluate';
import {markValid} from './observation';
import {magnifyFor} from './artAssets';

/** Guidance follows the saved learning evidence rather than click counts. */
export function guidance(task:InquiryTask,r:InquiryRecord){
 const issues=taskIssues(task,r);let action=issues[0]||'발견 기록하기를 눌러 다음 탐구로 가요.';
 let done=0,total=1;
 if(['collect','connect','sort'].includes(task.kind)){
  const items=task.items.filter(it=>r.v===2||it.since!==2);
  total=items.length;done=items.filter(it=>r.opened.includes(it.id)&&(r.assignments[it.id]||'')===it.target).length;
  const unread=items.find(it=>!r.opened.includes(it.id));
  action=unread?`${unread.label} 자료를 눌러 살펴봐요.`:done<total?'살펴본 자료를 알맞은 칸으로 끌어 이어요.':action;
 }else if(task.kind==='microscope'){
  total=4;const sharp=Math.abs(r.focus-65)<=12&&r.light>=40&&r.light<=85;const reached=r.capture||r.level>=2;done=Number(reached)+Number(reached&&sharp)+Number(r.capture)+Number(!issues.length);
  const gate=magnifyFor(task.organism,r.v===2)?.gate;
  action=!r.capture?(!reached?(r.level===0?'맨눈으로 본 뒤 돋보기로 크게 보기를 눌러요.':gate?'돋보기 그림에서 갓 아래 줄무늬(주름)를 찾아 눌러요. 찾으면 현미경이 열려요.':'돋보기로도 자세한 모양은 보이지 않아요. 현미경으로 크게 보기를 눌러요.'):sharp?'선명해졌어요. 사진 촬영을 눌러요.':'초점과 밝기를 움직여 특징이 선명한 곳을 찾아요.'):action;
 }else if(task.kind==='sample'){
  total=4;done=Number(!!r.assignments.site)+r.sequence;action=!r.assignments.site?'물가나 물풀 가까이를 눌러 채집 장소를 골라요.':['스포이드를 눌러 공기를 빼요.','물속에서 스포이드를 놓아 물을 담아요.','스포이드를 유리판까지 끌어 한 방울을 옮겨요.',action][r.sequence];
 }else if(task.kind==='track'){
  const cilia=r.v===2,paired=r.pins.length===2&&Number.isFinite(r.pins[0])&&Number.isFinite(r.pins[1])&&Math.abs(r.pins[1]-r.pins[0])>=3;
  total=cilia?3:2;done=Number(Number.isFinite(r.pins[0]))+Number(cilia?paired:!issues.length)+Number(cilia&&!issues.length);
  action=!Number.isFinite(r.pins[0])?'관찰 시점을 고른 뒤 A 고정을 눌러요.':!paired?'시간을 움직여 다른 시점을 B로 고정해요.':issues.length&&cilia?(r.level<2?'무엇이 짚신벌레를 움직일까요? 현미경으로 움직임의 비밀 찾기를 눌러요.':'몸 가장자리에 난 가는 털을 찾아 눌러요.'):action;
 }else if(task.kind==='timeline'){
  total=3;done=Number(r.pins.length===2&&r.pins[0]<r.pins[1])+Number(r.marks.length>0&&r.marks.every(p=>markValid(task,r,p)))+Number(r.opened.includes('process'));action=r.pins.length<2?'이전과 이후를 서로 다른 시간에 고정해요.':!r.marks.length?'비교 화면에서 실제 달라진 부분을 눌러 표시해요.':action;
 }else if(task.kind==='build'){
  total=5;done=task.targets.filter(t=>!!r.assignments[t.id]).length+Number(r.assignments.edge1==='linked'&&r.assignments.edge2==='linked')+Number(!issues.length);
  action=done<3?'아래 재료를 끌어 설계도의 세 자리를 채워요.':!r.assignments.edge1||!r.assignments.edge2?'설계도 사이의 +를 눌러 흐름을 연결해요.':!r.prediction?'나의 예상에서 실행 결과를 먼저 골라요.':!r.runResult?'설계 가동을 눌러 흐름을 시험해요.':!r.reflection?'예상과 실제 결과가 같은지 비교해요.':action;
 }else if(task.kind==='review'){
  total=4;done=Number(!!r.assignments.initial)+Number(task.items.every(it=>r.opened.includes(it.id)))+Number(!!r.assignments.claim&&!!r.assignments.evidence)+Number(!issues.length);action=issues[0]||action;
 }else if(task.kind==='publish'){
  total=3;done=Number(!!r.assignments.case)+Number(!!r.assignments.action)+Number(!!r.assignments.case&&r.assignments.evidence===r.assignments.case);action=!r.assignments.case?'그림에서 친구에게 소개할 사례를 골라요.':!r.assignments.action?'이 사례에 쓰인 생물의 작용을 골라요.':!r.assignments.evidence?'소개할 근거를 골라요. 소개 문장은 짧게 쓰거나 문장틀을 써도 돼요.':action;
 }
 return {action,done:issues.length?Math.min(done,total-1):total,total,ready:!issues.length};
}
