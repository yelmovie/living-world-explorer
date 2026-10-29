import {el,button,heading,paragraph,notice,modelBadge,modal,type Context} from '../ui';
import {layout,footer} from './observe';
import {stages} from '../content';
import {stageIds,validEvidence} from '../model';
import {inquiryEvidenceView as evidenceView} from './inquiry';
import {stageBadge} from '../experience';
import {playEffect} from '../audio';
async function scene(ctx:Context,host:HTMLElement,labels:string[],enabled:boolean[],onPick:(i:number)=>void,core=false,onReady:()=>void=()=>{}){
 let disposed=false;let lab:ReturnType<typeof import('../renderers/lab2d').mountLab2d>|undefined;
 const progress=(event:Event)=>{const {step,failed}=(event as CustomEvent<{step:number;failed:boolean}>).detail;lab?.progress(step,failed);};host.addEventListener('lab-progress',progress);ctx.cleanup(()=>{disposed=true;host.removeEventListener('lab-progress',progress);lab?.dispose();});
 const loading=el('div','scene-loading','연구 장면을 준비하고 있어요…');loading.setAttribute('role','status');host.append(loading);
 try{const {mountLab2d}=await import('../renderers/lab2d');if(disposed)return;lab=mountLab2d(host,labels,enabled,onPick,ctx.attempt.draft.m5.edges,core,ctx.state.settings.reduced,ok=>{if(disposed)return;if(ok){loading.remove();onReady();}else loading.replaceChildren(paragraph('장면을 준비하지 못했어요.'),button('다시 준비',ctx.render));});}catch{if(disposed)return;loading.remove();const grid=el('div','flat-lab');labels.forEach((l,i)=>grid.append(button(l,()=>onPick(i),'module')));host.append(grid);onReady();}
}
export function core(ctx:Context){
 const a=ctx.attempt;const {work,side}=layout(ctx,'마지막 임무','내 연구 기록으로 코어를 복구해요.');
 let coreReady=false,running=false,stopped=false,finished=false,raf=0;
 ctx.cleanup(()=>{stopped=true;cancelAnimationFrame(raf);});
 const eligible=(i:number)=>!!stageIds[i]&&validEvidence(a,stageIds[i],ctx.state.settings.admin)&&a.report.includes(stageIds[i]);
 const linked=()=>stageIds.every((id,i)=>eligible(i)&&a.ports.includes(id));
 const host=el('div','three-host');work.append(host,modelBadge());
 const put=(i:number)=>{
  if(stopped||running||!coreReady)return;
  if(!eligible(i))return notice('먼저 이 연구소의 발견을 완성하고 보고서에서 확인해요.');
  const id=stageIds[i];if(a.ports.includes(id))return;
  a.ports.push(id);coreReady=false;ctx.save();playEffect('snap');ctx.render();
 };
 side.append(el('h3','core-list-title','내 발견으로 전원 연결'),paragraph('포트를 누르면 확인한 연구 기록이 바로 연결돼요. 다섯 발견을 모아 코어를 깨워요.'));
 stages.forEach((s,i)=>{
  const row=el('div','core-record-summary');row.append(paragraph(`${a.ports.includes(s.id)?'✓ 연결 완료 · ':''}${s.title}`));
  const more=button(s.title+' 기록 보기',()=>modal(s.title+' 기록',[evidenceView(a.evidence[s.id])]),'text-button',!validEvidence(a,s.id,ctx.state.settings.admin));
  more.prepend(stageBadge(i));row.append(more);side.append(row);
 });
 const sockets=el('div','slot-row');const ports=stages.map((s,i)=>{
  const port=button(`${s.title} 포트`,()=>put(i),a.ports.includes(s.id)?'secondary linked':'secondary',true);
  port.setAttribute('aria-pressed',String(a.ports.includes(s.id)));port.prepend(stageBadge(i));sockets.append(port);return port;
 });work.append(sockets);
 const activate=()=>{
  if(stopped||!coreReady||!linked()||running||finished)return;
  running=true;side.inert=true;sockets.inert=true;
  const finish=()=>{if(stopped||finished)return;finished=true;cancelAnimationFrame(raf);a.activated=true;ctx.save();ctx.go('results');};
  const banner=el('div','core-power','내 발견이 연구소를 깨워요');const record=el('div');work.querySelector('.evidence-view')?.remove();work.append(banner);side.replaceChildren(record);side.inert=false;
  ctx.host.querySelector('.action-bar')?.replaceChildren(button('결과로 바로 가기',finish,'primary'));
  let elapsed=0,previous=performance.now(),shown=-1;
  const tick=(now:number)=>{
   if(stopped||finished)return;if(!document.hidden&&!document.querySelector('dialog[open]'))elapsed+=now-previous;previous=now;
   const index=Math.min(4,Math.floor(elapsed/1000));if(index!==shown){shown=index;record.replaceChildren(heading(stages[index].title),evidenceView(a.evidence[stageIds[index]],true));banner.textContent=`${index+1}/5 · ${stages[index].title}의 발견이 전해져요`;host.dispatchEvent(new CustomEvent('lab-progress',{detail:{step:index,failed:false}}));}
   if(elapsed>=(ctx.state.settings.reduced?1:5000)){finish();return;}raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
 };
 const activateButton=button('코어 가동',activate,'primary',true);
 footer(ctx,paragraph(`${stageIds.filter((id,i)=>eligible(i)&&a.ports.includes(id)).length}/5 기록 연결`,'muted'),activateButton);
 void scene(ctx,host,stages.map(s=>s.title),stageIds.map(s=>a.ports.includes(s)),put,true,()=>{if(stopped)return;coreReady=true;ports.forEach((port,i)=>port.disabled=!eligible(i)||a.ports.includes(stageIds[i]));activateButton.disabled=!linked();});
}
