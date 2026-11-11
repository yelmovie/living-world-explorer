import {el,button,paragraph,modal,type Context} from './ui';
import {artFor} from './artAssets';
import {researchCases,caseReady} from './detective-cases';
import type {Stage} from './model';
import {playEffect} from './audio';
import './detective-board.css';
export function openDetectiveBoard(ctx:Context,stage:Stage,finish?:()=>void){
 const data=researchCases[stage],record=ctx.attempt.inquiry.records[`${stage}-4`];
 if(!record)return;
 const placements:Record<string,string>={};for(const clue of data.clues)placements[clue.id]=record.assignments[`case_${clue.id}`]||'';
 let selected='',closed=false;const board=el('div','detective-board'),cards=el('div','detective-clues'),zones=el('div','detective-zones'),message=paragraph('단서를 눌러 크게 조사한 뒤, 어울리는 칸을 눌러 연결해요.','detective-message');message.setAttribute('role','status');
 const report=button('증거로 사건 설명하기',()=>{
  const wrong=data.clues.find(c=>placements[c.id]!==c.role);
  if(wrong){message.textContent=`${wrong.label}: ${wrong.detail} 이 단서로 결론을 뒷받침할 수 있는지 다시 놓아봐요.`;playEffect('retry');return;}
  record.assignments.case_solved='yes';ctx.save();playEffect('success');board.dataset.solved='true';message.textContent=data.result;done.hidden=false;report.hidden=true;
 },'primary');
 const done=button(finish?'조사 결과 전달하기':'관찰로 돌아가기',()=>{dialog.close();finish?.();},'primary');done.hidden=true;
 const inspect=(id:string)=>{const c=data.clues.find(c=>c.id===id)!;selected=id;message.textContent=c.detail;draw();};
 const place=(role:string)=>{if(closed||!selected)return;placements[selected]=role;record.assignments[`case_${selected}`]=role;record.assignments.case_solved='';ctx.save();selected='';draw();playEffect('snap');};
 const draw=()=>{cards.replaceChildren();for(const c of data.clues){const b=button('',()=>inspect(c.id),'detective-clue'+(selected===c.id?' selected':''));b.dataset.clue=c.id;b.draggable=true;b.setAttribute('aria-pressed',String(selected===c.id));const a=artFor(c.art);if(a){const img=el('img');img.src=a.src;img.alt=a.label;b.append(img);}b.append(el('strong','',c.label),el('span','',placements[c.id]==='supports'?'✓ 설명의 근거':placements[c.id]==='limit'?'✓ 단정할 수 없음':'눌러 조사'));b.ondragstart=e=>{selected=c.id;e.dataTransfer?.setData('text/plain',c.id);};cards.append(b);}zones.replaceChildren();for(const [role,label] of [['supports','설명을 뒷받침하는 증거'],['limit','이것만으로는 단정 못 해요']]){const z=button(label,()=>place(role),'detective-zone');z.dataset.zone=role;z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(data.clues.some(c=>c.id===id)){selected=id!;place(role);}};zones.append(z);}report.disabled=data.clues.some(c=>!placements[c.id]);};
 board.append(paragraph(data.question,'detective-question'),cards,zones,message,report,done);draw();const dialog=modal(data.title,[board]);dialog.classList.add('detective-dialog');dialog.addEventListener('close',()=>closed=true,{once:true});ctx.cleanup(()=>{closed=true;if(dialog.isConnected)dialog.close();});
}
