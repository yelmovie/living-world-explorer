import {el,button,paragraph,modal,type Context} from './ui';
import {artFor} from './artAssets';
import {researchCases,caseReady,type CaseClue} from './detective-cases';
import type {Stage} from './model';
import {playEffect} from './audio';
import './detective-board.css';

export function openDetectiveBoard(ctx:Context,stage:Stage,finish?:()=>void){
 const data=researchCases[stage],record=ctx.attempt.inquiry.records[`${stage}-4`];
 if(!record)return;

 const placements:Record<string,string>={};
 for(const clue of data.clues){
  const saved=record.assignments[`case_${clue.id}`];
  placements[clue.id]=saved==='supports'||saved==='limit'?saved:'';
 }
 let selected='',closed=false;
 let solved=record.assignments.case_solved==='yes'&&caseReady(stage,placements);
 const board=el('div','detective-board');
 const cards=el('div','detective-clues');
 const zones=el('div','detective-zones');
 const progress=paragraph('','detective-progress');
 const returnLabel=finish?'조사 결과 전달하기':'관찰로 돌아가기';
 const pending=data.clues.find(clue=>!placements[clue.id]);
 const message=paragraph(solved?`${data.result} ‘${returnLabel}’를 눌러 이어가요.`:pending?`‘${pending.label}’ 단서를 눌러 자세히 살펴봐요. 연결한 단서도 다시 눌러 바꿀 수 있어요.`:'연결한 단서를 다시 살펴보고 ‘증거로 사건 설명하기’를 눌러요.','detective-message');
 message.id=`detective-message-${stage}`;
 message.setAttribute('role','status');
 message.setAttribute('aria-atomic','true');
 const clueButtons=new Map<string,HTMLButtonElement>();
 const placementLabels=new Map<string,HTMLSpanElement>();

 const report=button('증거로 사건 설명하기',()=>{
  if(closed)return;
  const wrong=data.clues.find(clue=>placements[clue.id]!==clue.role);
  if(wrong){
   selected=wrong.id;
   message.textContent=`${wrong.label} 단서를 다시 살펴봐요. ${wrong.detail} 어느 칸에 연결하면 좋을까요?`;
   refresh();
   clueButtons.get(wrong.id)?.focus();
   playEffect('retry');
   return;
  }
  solved=true;
  selected='';
  record.assignments.case_solved='yes';
  ctx.save();
  message.textContent=`${data.result} ‘${returnLabel}’를 눌러 이어가요.`;
  refresh();
  done.focus();
  playEffect('success');
 },'primary');
 const done=button(returnLabel,()=>{
  if(closed||!solved||!caseReady(stage,placements))return;
  closed=true;
  dialog.close();
  finish?.();
 },'primary');

 function refresh(){
  const connected=data.clues.filter(clue=>placements[clue.id]).length;
  const next=data.clues.find(clue=>!placements[clue.id]);
  progress.textContent=solved?`조사 완료 · 단서 ${data.clues.length}개를 설명했어요.`:selected?`2단계 · 아래 두 칸 중 한 곳을 눌러요. (${connected}/${data.clues.length})`:next?`1단계 · ‘${next.label}’ 단서를 눌러요. (${connected}/${data.clues.length})`:'3단계 · ‘증거로 사건 설명하기’를 눌러요.';
  board.dataset.solved=String(solved);
  board.dataset.step=solved?'done':selected?'place':next?'observe':'check';
  for(const clue of data.clues){
   const current=clueButtons.get(clue.id)!;
   current.classList.toggle('selected',selected===clue.id);
   current.dataset.next=String(!solved&&!selected&&next?.id===clue.id);
   current.setAttribute('aria-pressed',String(selected===clue.id));
   const role=placements[clue.id];
   placementLabels.get(clue.id)!.textContent=role==='supports'?'연결됨 · 설명의 근거':role==='limit'?'연결됨 · 단정할 수 없음':selected===clue.id?'선택한 단서':next?.id===clue.id?'다음 단서 · 눌러 조사':'눌러 조사';
  }
  report.disabled=connected<data.clues.length;
  report.hidden=solved;
  done.hidden=!solved;
 }

 function inspect(clue:CaseClue){
  if(closed)return;
  selected=clue.id;
  message.textContent=`‘${clue.label}’ 단서를 살펴봐요. ${clue.detail} 아래 두 칸 중 어울리는 곳을 눌러 연결해요.`;
  refresh();
 }

 function place(role:CaseClue['role']){
  if(closed)return;
  const clue=data.clues.find(candidate=>candidate.id===selected);
  if(!clue){
   message.textContent='먼저 조사할 단서를 눌러 골라요.';
   return;
  }
  placements[clue.id]=role;
  record.assignments[`case_${clue.id}`]=role;
  record.assignments.case_solved='';
  solved=false;
  selected='';
  ctx.save();
  refresh();
  const next=data.clues.find(candidate=>!placements[candidate.id]);
  message.textContent=`${clue.label} 단서를 ${role==='supports'?'설명의 근거':'단정할 수 없는 점'}에 연결했어요. ${next?`이제 ‘${next.label}’ 단서를 눌러요.`:'‘증거로 사건 설명하기’를 눌러 연결한 근거를 확인해요.'}`;
  playEffect('snap');
 }

 for(const clue of data.clues){
  const card=button('',()=>inspect(clue),'detective-clue');
  card.dataset.clue=clue.id;
  card.draggable=true;
  card.setAttribute('aria-describedby',message.id);
  const art=artFor(clue.art);
  if(art){
   const img=el('img');
   img.src=art.src;
   img.alt=art.label;
   card.append(img);
  }
  const placement=el('span');
  card.append(el('strong','',clue.label),placement);
  card.ondragstart=event=>{
   inspect(clue);
   event.dataTransfer?.setData('text/plain',clue.id);
  };
  clueButtons.set(clue.id,card);
  placementLabels.set(clue.id,placement);
  cards.append(card);
 }
 for(const [role,label] of [['supports','설명을 뒷받침하는 증거'],['limit','이것만으로는 단정 못 해요']] as const){
  const zone=button(label,()=>place(role),'detective-zone');
  zone.dataset.zone=role;
  zone.setAttribute('aria-describedby',message.id);
  zone.ondragover=event=>event.preventDefault();
  zone.ondrop=event=>{
   event.preventDefault();
   const id=event.dataTransfer?.getData('text/plain');
   if(data.clues.some(clue=>clue.id===id)){
    selected=id!;
    place(role);
   }
  };
  zones.append(zone);
 }
 board.append(paragraph(data.question,'detective-question'),progress,cards,message,zones,report,done);
 refresh();
 const dialog=modal(data.title,[board]);
 dialog.classList.add('detective-dialog');
 dialog.addEventListener('close',()=>closed=true,{once:true});
 ctx.cleanup(()=>{
  closed=true;
  if(dialog.isConnected)dialog.close();
 });
}
