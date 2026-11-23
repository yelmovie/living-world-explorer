import {el,button,modal,paragraph} from './ui';
import {tasksFor} from './curriculum';
import {taskArt,artFor} from './artAssets';
import type {Evidence,Stage} from './model';
import {inquiryEvidenceView} from './scenes/inquiry-evidence';

export const reviewIdeas:Record<Stage,{title:string;idea:string;art:string}>={
 M1:{title:'균류',idea:'가는 실로 된 몸 · 포자로 퍼져요',art:'fungiThreads'},
 M2:{title:'물 한 방울',idea:'해캄과 짚신벌레도 살아 있어요',art:'paramecium'},
 M3:{title:'세균',idea:'작고 다양한 모양 · 여러 곳에 살아요',art:'bacteria'},
 M4:{title:'우리 생활',idea:'상황에 따라 도움도, 피해도 줘요',art:'yogurt'},
 M5:{title:'생물의 작용',idea:'발효와 분해를 생활에 이용해요',art:'risenDough'}
};
const discoveries:Record<string,[string,string]>={
 'M1-1':['사는 곳','죽은 나무와 축축한 빵에서 발견'],
 'M1-2':['버섯','이 모형의 갓 아래 주름과 작은 포자'],
 'M1-3':['곰팡이','가는 실과 동그란 포자주머니'],
 'M1-4':['균류의 공통점','가는 실로 된 몸 · 포자로 퍼져요'],
 'M2-1':['물 한 방울','물가나 물풀 가까이에서 채집'],
 'M2-2':['해캄','초록색 세포가 실처럼 이어져요'],
 'M2-3':['짚신벌레','두 사진의 위치 변화 · 몸 둘레의 섬모'],
 'M2-4':['비교하기','둘 다 생물! 모양과 움직임은 달라요'],
 'M3-1':['아주 작은 생물','눈에 안 보여도 없다는 뜻은 아니에요'],
 'M3-2':['세균의 모양','공 · 막대 · 나선 모양'],
 'M3-3':['세균이 사는 곳','여러 표본에서 자란 모습을 비교했어요'],
 'M3-4':['크기 비교','이 모형에서는 버섯 → 짚신벌레 → 세균'],
 'M4-1':['빵의 변화','곰팡이가 자라면 먹지 않아요'],
 'M4-2':['낙엽의 변화','균류와 세균이 분해에 관여해요'],
 'M4-3':['도움과 피해','같은 생물도 상황을 살펴봐요'],
 'M4-4':['생활 속 사건','관찰한 자료를 근거로 설명해요'],
 'M5-1':['요구르트','유산균의 발효로 우유가 변해요'],
 'M5-2':['빵 반죽','효모가 만든 기체로 부풀어요'],
 'M5-3':['낙엽과 퇴비','분해 작용을 생활에 이용해요'],
 'M5-4':['내 소개 카드','사례와 생물의 작용을 연결해요']
};
/** Compact review uses the submitted snapshot; full observations remain one tap away. */
export function discoveryCards(evidence:Evidence|undefined,stage:Stage){
 const grid=el('div','discovery-review-grid');
 grid.dataset.recordVersion=evidence?.updated||evidence?.created||'';
 if(!evidence){grid.append(paragraph('지도에서 이 연구소를 탐험해요.'));return grid;}
 if(evidence.validationVersion!==2||!evidence.inquiry){
  grid.classList.add('is-legacy');
  const card=button('',()=>modal('이전 탐구에서 남긴 기록',[inquiryEvidenceView(evidence)]),'discovery-review-card');
  const art=artFor(reviewIdeas[stage].art)!,pictures=el('div','discovery-review-pictures'),image=el('img');image.src=art.src;image.alt=art.label;pictures.append(image);
  card.append(pictures,el('strong','','이전 탐구 기록'),el('span','discovery-review-idea','저장한 기록을 그대로 펼쳐 봐요.'),el('span','discovery-review-open','내 기록 보기 ›'));grid.append(card);return grid;
 }

 for(const task of tasksFor(stage)){
  const record=evidence.inquiry?.records[task.id];
  const [title,idea]=discoveries[task.id]||[task.title,reviewIdeas[stage].idea];
  const card=button('',()=>{
   const album=inquiryEvidenceView(evidence),tiles=[...album.querySelectorAll('.album-tile')];
   tiles.forEach((tile,i)=>{if(i!==task.order-1)tile.remove();});
   const dialog=modal(title+' · 내 발견 기록',[album]);dialog.classList.add('review-record-dialog');
  },'discovery-review-card',!record?.completedAt);
  card.setAttribute('aria-label',title+' · 내 기록 크게 보기');
  const pictures=el('div','discovery-review-pictures');
  const arts=taskArt(task,record);if(!arts.length)arts.push(artFor(reviewIdeas[stage].art)!);
  for(const art of arts.slice(0,2)){const img=el('img');img.src=art.src;img.alt=art.label;img.draggable=false;pictures.append(img);}
  card.append(pictures,el('strong','',title),el('span','discovery-review-idea',idea),el('span','discovery-review-open','내 기록 보기 ›'));
  grid.append(card);
 }
 return grid;
}
export function coreDiscovery(stage:Stage){
 const idea=reviewIdeas[stage],card=el('div','core-discovery');
 const img=el('img');img.src=artFor(idea.art)!.src;img.alt=artFor(idea.art)!.label;
 card.append(img,el('strong','',idea.title),el('p','',idea.idea));return card;
}
