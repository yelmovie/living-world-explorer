import type {InquiryTask,InquiryRecord} from './inquiry-model';
import {taskIssues} from './inquiry-evaluate';
import {markValid} from './observation';
import {magnifyFor} from './artAssets';
import {validTimelinePair} from './inquiry-preparation';

function observedFeature(task:InquiryTask,r:InquiryRecord){
 if(task.organism==='mushroom')return r.v===2?'주름 가장자리의 갈색 알갱이를':'갓 아래 주름을';
 return task.organism==='mold'?'가는 실이나 둥근 부분 두 곳을':'초록색 실처럼 이어진 부분을';
}

/** Guidance follows the saved learning evidence rather than click counts. */
export function guidance(task:InquiryTask,r:InquiryRecord,selectedCard=''){
 const issues=taskIssues(task,r);let action=issues[0]||'발견 기록하기를 눌러 다음 탐구로 가요.';
 let done=0,total=1;
 if(['collect','connect','sort'].includes(task.kind)){
  const items=task.items.filter(it=>r.v===2||it.since!==2);
  total=items.length;done=items.filter(it=>r.opened.includes(it.id)&&(r.assignments[it.id]||'')===it.target).length;
  const card=items.find(it=>it.id===selectedCard);
  const pending=items.find(it=>!r.opened.includes(it.id)||it.target!==r.assignments[it.id]);
  if(card)action=`‘${card.label}’ 내용을 읽고, 어울리는 기록 칸까지 선을 이어요.`;
  else if(pending)action=`‘${pending.label}’ 자료를 눌러 살펴봐요.`;
  if(task.id==='M3-2'&&r.v===2){
   total++;done+=Number(r.assignments.ladder==='smallest');
   if(!pending&&!card&&r.assignments.ladder!=='smallest')action='이제 ‘크기 사다리에 세균 놓기’를 눌러요.';
  }
 }else if(task.kind==='microscope'){
  total=4;const sharp=Math.abs(r.focus-65)<=12&&r.light>=40&&r.light<=85;const reached=r.capture||r.level>=2;done=Number(reached)+Number(reached&&sharp)+Number(r.capture)+Number(!issues.length);
  const gate=magnifyFor(task.organism,r.v===2)?.gate;
  action=!r.capture?(!reached?(r.level===0?'맨눈으로 본 뒤 돋보기로 크게 보기를 눌러요.':gate?'돋보기를 움직여 갓 아래를 살펴봐요. 주름을 톡 누르면 현미경이 열려요.':'돋보기로도 자세한 모양은 보이지 않아요. 현미경으로 크게 보기를 눌러요.'):sharp?'선명해졌어요. 사진 촬영을 눌러요.':'초점과 밝기를 움직여 특징이 선명한 곳을 찾아요.'):action;
  if(r.capture&&issues.length&&!r.marks.length){
   const feature=observedFeature(task,r);
   action=`찍은 사진에서 ${feature} 눌러 표시해요.`;
  }
 }else if(task.kind==='sample'){
  total=3;done=Number(!!r.assignments.site)+Number(r.sequence>=2)+Number(r.sequence===3);action=!r.assignments.site?'물가나 물풀 가까이를 눌러 채집 장소를 골라요.':r.sequence<2?'그림의 스포이드를 눌러 물 한 방울을 담아요.':r.sequence===2?'오른쪽 유리판을 눌러 물 한 방울을 떨어뜨려요.':action;
 }else if(task.kind==='track'){
  const cilia=r.v===2,paired=r.pins.length===2&&Number.isFinite(r.pins[0])&&Number.isFinite(r.pins[1])&&Math.abs(r.pins[1]-r.pins[0])>=3;
  total=cilia?3:2;done=Number(Number.isFinite(r.pins[0]))+Number(cilia?paired:!issues.length)+Number(cilia&&!issues.length);
  action=!Number.isFinite(r.pins[0])?'관찰 시점을 고른 뒤 A 고정을 눌러요.':!paired?(Math.abs(r.time-r.pins[0])>=3?'A와 다른 순간이에요. ‘B 고정’을 눌러 두 모습을 비교해요.':'관찰 시점을 A에서 3칸 이상 옮긴 뒤 ‘B 고정’을 눌러요.'):issues.length&&cilia?(r.level<2?'무엇이 짚신벌레를 움직일까요? 현미경으로 움직임의 비밀 찾기를 눌러요.':'몸 가장자리에 난 가는 털을 찾아 눌러요.'):action;
 }else if(task.kind==='timeline'){
  total=3;done=Number(validTimelinePair(r))+Number(r.marks.length>0&&r.marks.every(p=>markValid(task,r,p)))+Number(r.opened.includes('process'));action=!validTimelinePair(r)?(!Number.isFinite(r.pins[0])?'첫 모습을 고르고 ‘이전 고정’을 눌러요.':r.time>r.pins[0]?'뒤의 모습을 골랐어요. ‘이후 고정’을 눌러 사진 두 장을 나란히 놓아요.':'아래 숫자에서 더 뒤의 모습을 고르고 ‘이후 고정’을 눌러요.'):!r.marks.length?`오른쪽 ‘이후’ 사진에서 ${task.organism==='bread'?'새로 생긴 곰팡이를':'사라진 잎 부분을'} 찾아 눌러요.`:action;
 }else if(task.kind==='build'){
  total=5;done=task.targets.filter(t=>!!r.assignments[t.id]).length+Number(r.assignments.edge1==='linked'&&r.assignments.edge2==='linked')+Number(!issues.length);
  const card=task.items.find(it=>it.id===selectedCard);
  action=card?`‘${card.label}’ 카드를 놓을 위쪽 칸을 눌러요.`:r.runResult==='stopped'?'흐름이 멈췄어요. 사례 기록을 읽고 바꿀 카드를 다시 골라요.':done<3?(task.order>1?'아래에서 생물의 작용 카드를 고른 뒤 위쪽 가운데 칸을 눌러요.':'아래 카드 한 장을 누른 뒤 위쪽에서 어울리는 칸을 눌러요.'):!r.assignments.edge1||!r.assignments.edge2?'설계도의 빈 자리를 채우면 흐름이 이어져요.':!r.prediction?'나의 예상에서 실행 결과를 먼저 골라요.':!r.runResult?'설계 가동을 눌러 흐름을 시험해요.':!r.reflection?'예상과 실제 결과가 같은지 비교해요.':action;
  if(task.id==='M5-1'){
   if(card)action=card.id==='yogurt'?'오른쪽 ‘만들 음식’에 놓아요.':card.id==='lactic'?'유산균 가루를 가운데 발효기에 넣어요.':'왼쪽 재료 병에 담거나 가운데 발효기에 넣어요.';
   else if(r.runResult==='stopped')action='이번 조합을 살펴보고 재료나 만들 음식을 바꿔 봐요.';
   else if(done<3)action=!r.assignments.input?'우유와 물 중 하나를 골라 재료 병에 담아요.':!r.assignments.action?'발효기에 함께 넣을 것을 골라요.':'완성하고 싶은 음식을 골라 오른쪽에 놓아요.';
   else if(!r.prediction)action='따뜻하게 두면 어떻게 될지 예상해요.';
   else if(!r.runResult)action='‘발효기 켜기’를 눌러 변화를 살펴봐요.';
   else if(!r.reflection)action='내 예상과 실제 결과를 비교해요.';
  }
 }else if(task.kind==='review'){
  total=4;done=Number(!!r.assignments.initial)+Number(task.items.every(it=>r.opened.includes(it.id)))+Number(!!r.assignments.claim&&!!r.assignments.evidence)+Number(!issues.length);
  const unread=task.items.find(it=>!r.opened.includes(it.id));
  if(!r.assignments.initial)action='자료를 열기 전에, 도구에서 지금 내 생각과 가까운 말을 골라요.';
  else if(unread)action=`‘${unread.label}’ 카드를 눌러 읽어요.`;
  else if(!r.assignments.claim)action='두 자료를 읽었어요. 이제 내 생각과 가까운 주장을 골라요.';
  else if(!r.assignments.evidence)action='내 주장을 뒷받침하는 자료 하나를 ‘내 주장의 근거’에서 골라요.';
  else if(issues.length)action='두 자료를 다시 비교해요. 내가 고른 주장과 근거가 서로 어울리나요?';
 }else if(task.kind==='publish'){
  total=3;done=Number(!!r.assignments.case)+Number(!!r.assignments.action)+Number(!!r.assignments.case&&r.assignments.evidence===r.assignments.case);action=!r.assignments.case?'위쪽 그림 카드 세 장 중 친구에게 소개할 사례 하나를 눌러요.':!r.assignments.action?'이 사례에 쓰인 생물의 작용을 골라요.':!r.assignments.evidence?'고른 사례의 근거로 소개 문장을 만들어요.':action;
 }
 if(!issues.length&&!selectedCard)action='발견을 모았어요! 아래의 기록 버튼을 눌러 연구 노트에 남겨요.';
 return {action,done:issues.length?Math.min(done,total-1):total,total,ready:!issues.length};
}
