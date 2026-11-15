import {el,button,paragraph,modal,type Context} from './ui';
import {artFor} from './artAssets';
import {researchCases,caseReady,type CaseClue} from './detective-cases';
import type {Stage} from './model';
import {playEffect} from './audio';
import './detective-board.css';
const zoneLabels={supports:'관찰한 내용',limit:'더 살펴볼 점'} as const;

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
 const message=paragraph('','detective-message');
 message.id=`detective-message-${stage}`;
 message.setAttribute('role','status');
 message.setAttribute('aria-atomic','true');
 const clueButtons=new Map<string,HTMLButtonElement>();
 const placementLabels=new Map<string,HTMLSpanElement>();

 const report=button('연결 확인하기',()=>{
  if(closed)return;
  const wrong=data.clues.find(clue=>placements[clue.id]!==clue.role);
  if(wrong){
   selected=wrong.id;
   message.textContent=`‘${wrong.label}’ 카드의 연결을 다시 확인해요. ${wrong.detail}`;
   refresh();
   clueButtons.get(wrong.id)?.focus();
   playEffect('retry');
   return;
  }
  solved=true;
  selected='';
  record.assignments.case_solved='yes';
  ctx.save();
  message.textContent='';
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
  progress.textContent=solved?'연결 완료':`연결 ${connected} / ${data.clues.length}`;
  board.dataset.solved=String(solved);
  board.dataset.step=solved?'done':selected?'place':next?'observe':'check';
  for(const clue of data.clues){
   const current=clueButtons.get(clue.id)!;
   current.classList.toggle('selected',selected===clue.id);
   current.dataset.next=String(!solved&&!selected&&next?.id===clue.id);
   current.setAttribute('aria-pressed',String(selected===clue.id));
   const role=placements[clue.id];
   placementLabels.get(clue.id)!.textContent=role==='supports'||role==='limit'?zoneLabels[role]:'';
  }
  report.disabled=connected<data.clues.length;
  report.hidden=solved;
  done.hidden=!solved;
 }

 function inspect(clue:CaseClue){
  if(closed)return;
  selected=clue.id;
  message.textContent=clue.detail;
  refresh();
 }

 function place(role:CaseClue['role']){
  if(closed)return;
  const clue=data.clues.find(candidate=>candidate.id===selected);
  if(!clue){
   message.textContent='카드를 먼저 골라요.';
   return;
  }
  placements[clue.id]=role;
  record.assignments[`case_${clue.id}`]=role;
  record.assignments.case_solved='';
  solved=false;
  selected='';
  ctx.save();
  refresh();
  message.textContent='';
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
 for(const role of ['supports','limit'] as const){
  const label=zoneLabels[role];
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
