import {playNarration,stopNarration} from './audio';
import './residents.css';
import type {Attempt, Stage} from './model';
import {MAP_WIDTH, MAP_HEIGHT} from './mapData';
import {button, el, modal, paragraph} from './ui';

type Resident = {
  art:string; name:string; role:string; feet:[number,number];
  welcome:string; question:string; memory:string; work:string;
};

export const residents:Record<Stage,Resident> = {
  M1:{art:'solbi',name:'솔비',role:'다람쥐 표본지기',feet:[432,247],
    welcome:'표본실에 불이 켜졌어! 네가 갓 아래에서 찾은 주름, 이제 내 표본 노트에도 그려 넣을 수 있어.',
    question:'노트에 뭘 그렸어?',memory:'위에서 보면 갓에 가려져. 그래서 이번엔 버섯을 옆으로 눕혀서, 갓 아래 나란히 난 주름을 그렸지!',
    work:'작은 전시를 준비해. 한쪽엔 버섯 그림을, 다른 쪽엔 곰팡이에서 본 가느다란 실 그림을 걸 거야.'},
  M2:{art:'yeoul',name:'여울',role:'수달 물길지기',feet:[808,250],
    welcome:'찰랑! 관찰소 문이 다시 열렸어. 네가 남긴 두 장면을 나란히 걸어 두려고 해.',
    question:'내가 뜬 물 기억나?',memory:'네 한 방울 기록을 펼쳐 봤어. 두 장면 속에서 짚신벌레가 있던 자리가 달라졌더라!',
    work:'물가의 작은 전시대를 닦고 있어. 친구들이 같은 짚신벌레의 두 순간을 비교해 볼 수 있게!'},
  M3:{art:'duri',name:'두리',role:'부엉이 기록원',feet:[989,443],
    welcome:'책장이 다시 열렸네! 뒤섞인 세균 자료를 네 조사 기록 덕분에 제자리에 꽂을 수 있겠어.',
    question:'자료를 어떻게 나눠?',memory:'모양 그림은 ‘생김새’ 칸에, 흙이나 물에서 발견한 기록은 ‘사는 곳’ 칸에 꽂아. 모양만 보고 어디서 왔는지 짐작할 필요가 없지.',
    work:'마을 친구들한테 자료를 빌려줘. “어디서 찾은 사실이야?” 하고 물으면 함께 책장을 펼치지.'},
  M4:{art:'bamtol',name:'밤톨',role:'고슴도치 정원사',feet:[748,604],
    welcome:'마을 정원에 다시 불이 들어왔어! 네가 살펴본 그 낙엽 자리로 나도 돌아왔지.',
    question:'낙엽은 어디로 갔어?',memory:'낙엽 모습이 달라졌지? 우리가 조사한 자료에는 균류와 세균이 낙엽을 분해하는 데 관여한다고 적혀 있어.',
    work:'같은 자리에서 낙엽 그림을 한 장씩 그려. 다음에 온 친구들도 어제와 오늘을 비교할 수 있게 말이야.'},
  M5:{art:'bori',name:'보리',role:'곰 발효 장인',feet:[381,558],
    welcome:'빵 굽는 냄새 나지? 네가 생물의 작용을 이어 준 덕분에 작업실 첫 반죽이 부풀었어!',
    question:'내 소개 카드 봤어?',memory:'재료가 어떻게 달라졌는지, 그때 어떤 생물이 도왔는지 소개하는 카드였지. 우리 작업실에 딱이야!',
    work:'첫 빵은 이웃들과 나눌 거야. 빵 옆에는 효모가 만든 기체가 반죽을 부풀렸다는 작은 안내판도 놓을래.'}
};

/** The answer and its voice line id (assets/audio/voice/<id>.mp3). */
function memory(stage:Stage, attempt:Attempt):[string,string]{
  const records=attempt.evidence[stage]?.inquiry?.records;
  if(stage==='M2'){
    const site=records?.['M2-1']?.assignments.site;
    if(site==='edge'||site==='plant')return [(site==='edge'?'물가 가까이':'물풀 가까이')+'에서 떴지! 네 기록을 보고 같은 곳에서 물을 떠서 관찰해 보려고 해.','M2-memory-'+site];
  }
  if(stage==='M5'){
    const selected=records?.['M5-4']?.assignments.case;
    if(selected==='bread')return ['빵 반죽 카드였지! 효모가 만든 기체가 반죽을 부풀린다는 걸 손님들에게도 들려줄게.','M5-memory-bread'];
    if(selected==='yogurt')return ['요구르트 카드였지! 유산균의 도움으로 우유를 요구르트로 만든다는 네 설명을 이웃들에게도 들려줄게.','M5-memory-yogurt'];
    if(selected==='leaf')return ['낙엽 분해 카드였지! 낙엽을 분해하는 생물의 도움으로 퇴비를 만들 수 있다는 이야기를 정원에도 전할게.','M5-memory-leaf'];
  }
  return [residents[stage].memory,stage+'-memory'];
}

export function residentImage(stage:Stage, className:string){
  const img=el('img',className);
  img.src='assets/map/residents/'+residents[stage].art+'.webp';
  img.alt='';img.draggable=false;
  return img;
}

export function residentMarker(stage:Stage, talk:()=>void){
  const resident=residents[stage];
  const marker=el('button','map-resident');
  marker.type='button';marker.dataset.stage=stage;
  marker.style.left=resident.feet[0]/MAP_WIDTH*100+'%';
  marker.style.top=resident.feet[1]/MAP_HEIGHT*100+'%';
  marker.title=resident.name+'에게 말 걸기';
  marker.setAttribute('aria-label',resident.role+' '+marker.title);
  marker.setAttribute('aria-haspopup','dialog');
  marker.append(residentImage(stage,'resident-sprite'),el('span','resident-name',resident.name));
  marker.onclick=talk;
  return marker;
}

export function residentConversation(stage:Stage, attempt:Attempt){
  const r=residents[stage];
  const scene=el('div','resident-conversation');
  const copy=el('div','resident-lines');
  const line=paragraph(r.welcome,'resident-line');
  line.setAttribute('aria-live','polite');line.setAttribute('aria-atomic','true');
  copy.append(el('span','eyebrow',r.role),line);
  scene.append(residentImage(stage,'resident-portrait'),copy);
  const replies=el('div','resident-replies');
  for(const [question,[answer,voice]] of [[r.question,memory(stage,attempt)],['이제 무슨 일을 해?',[r.work,stage+'-work']]] as [string,[string,string]][]){
    const choice=button(question,()=>{
      line.textContent=answer;playNarration(voice);
      for(const b of replies.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===choice));
    });
    choice.setAttribute('aria-pressed','false');
    replies.append(choice);
  }
  const listen=button('인사 다시 듣기',()=>{line.textContent=r.welcome;for(const b of replies.querySelectorAll('button'))b.setAttribute('aria-pressed','false');if(!playNarration(stage+'-welcome'))line.textContent=r.welcome+' (소리가 꺼져 있어요. 대화를 닫고 소리 버튼을 켜면 들을 수 있어요.)';},'secondary');
  const dialog=modal(r.name+'의 이야기',[scene,listen,paragraph('AI로 만든 목소리예요 · 말한 내용은 위 글로도 읽을 수 있어요.','muted'),replies],{description:line});
  dialog.addEventListener('close',stopNarration,{once:true});
  playNarration(stage+'-welcome');
  dialog.classList.add('resident-dialog');
  return dialog;
}
