import {reducedMotion,el,button,heading,paragraph,modal,type Context} from '../ui';
import {layout,footer} from './observe';
import {stages} from '../content';
import {stageIds,validEvidence} from '../model';
import {inquiryEvidenceView as evidenceView} from './inquiry';
import {stageBadge} from '../experience';
import {playEffect} from '../audio';
import {showFilm} from '../film';
import {coreFigure} from '../renderers/core-figure';
import '../core-figure.css';

export function core(ctx:Context){
 const a=ctx.attempt;
 const {work,side}=layout(ctx,'마지막 임무','내 연구 기록으로 코어를 복구해요.');
 work.classList.add('core-workbench');side.classList.add('core-controls');
 let running=false,stopped=false,finished=false,raf=0;
 const reduce=reducedMotion(ctx.state.settings.reduced);
 ctx.cleanup(()=>{stopped=true;cancelAnimationFrame(raf);});
 const eligible=(i:number)=>!!stageIds[i]&&validEvidence(a,stageIds[i],ctx.state.settings.admin)&&a.report.includes(stageIds[i]);
 const connections=()=>stageIds.map((id,i)=>eligible(i)&&a.ports.includes(id));

 const figure=coreFigure(reduce);work.append(figure.element);ctx.cleanup(figure.dispose);
 const status=el('div','core-link-status');status.setAttribute('role','status');
 const count=el('strong','core-link-count');
 const message=paragraph('','core-link-message');status.append(count,message);
 const sockets=el('div','slot-row');sockets.setAttribute('role','group');sockets.setAttribute('aria-label','연구 기록 연결');
 const ports=stages.map((s,i)=>{
  const control=button('',()=>put(i),'secondary core-port core-channel');
  control.dataset.channel=String(i+1);control.setAttribute('aria-label',s.title+' 포트');
  const number=el('span','core-port-number',String(i+1));number.setAttribute('aria-hidden','true');
  const label=el('span','core-port-label',s.title);
  const state=el('span','core-port-state');state.id=`core-port-state-${i+1}`;
  control.setAttribute('aria-describedby',state.id);
  control.append(number,stageBadge(i),label,state);sockets.append(control);
  return {control,state};
 });
 const review=el('details','core-records');
 review.append(el('summary','','발견 기록 다시 보기'));
 const records=el('div','core-record-list');
 stages.forEach((s,i)=>{
  const more=button(s.title+' 기록 보기',()=>modal(s.title+' 기록',[evidenceView(a.evidence[s.id])]),'secondary',!validEvidence(a,s.id,ctx.state.settings.admin));
  more.prepend(stageBadge(i));records.append(more);
 });
 review.append(records);
 side.append(status,sockets,review);
 const back=button('보고서로',()=>ctx.go('final-report'),'secondary');
 const activateButton=button('코어 가동',()=>activate(),'primary',true);
 activateButton.setAttribute('aria-describedby','core-link-help');
 message.id='core-link-help';
 footer(ctx,back,activateButton);

 function update(fresh=-1){
  const linked=connections(),total=linked.filter(Boolean).length,ready=total===stageIds.length;
  count.textContent=`${total} / ${stageIds.length}개 연결`;
  message.textContent=ready?(a.activated?'코어를 복구했어요. 다시 가동해 볼 수 있어요.':'다 모았어요! ‘코어 가동’을 눌러요.'):stageIds.some((_,i)=>!eligible(i))?'보고서에서 읽지 않은 기록을 먼저 확인해요.':'연구소 이름을 누르면 같은 번호에 불이 켜져요.';
  ports.forEach(({control,state},i)=>{
   const done=linked[i],available=eligible(i);
   control.disabled=done||!available;
   control.classList.toggle('linked',done);
   control.setAttribute('aria-pressed',String(done));
   state.textContent=done?'✓ 연결 완료':available?'연결하기':'보고서 확인 필요';
  });
  activateButton.disabled=!ready;
  figure.show(linked,ready?(a.activated?'powered':'ready'):total?'linking':'waiting',-1,fresh);
 }
 function put(i:number){
  const id=stageIds[i];
  if(stopped||running||!eligible(i)||a.ports.includes(id))return;
  const pressed=ports[i].control;
  const keepFocus=pressed===document.activeElement&&pressed.matches(':focus-visible');
  a.ports.push(id);update(i);ctx.save();playEffect('snap');
  if(keepFocus)(ports.find(p=>!p.control.disabled)?.control||activateButton).focus();
 }
 function activate(){
  const linked=connections();
  if(stopped||running||finished||!linked.every(Boolean))return;
  running=true;playEffect('core-wake');figure.show(linked,'running');
  const finish=()=>{
   if(stopped||finished)return;
   finished=true;cancelAnimationFrame(raf);a.activated=true;ctx.save();ctx.go('results');showFilm('final',ctx.state.settings);
  };
  const record=el('div','core-active-record');
  side.replaceChildren(record);
  const skip=button('결과로 바로 가기',finish,'primary');
  ctx.host.querySelector('.action-bar')?.replaceChildren(skip);
  skip.focus({preventScroll:true});
  let elapsed=0,previous=performance.now(),shown=-1;
  const tick=(now:number)=>{
   if(stopped||finished)return;
   if(!document.hidden&&!document.querySelector('dialog[open]'))elapsed+=now-previous;
   previous=now;
   const index=Math.min(4,Math.floor(elapsed/1000));
   if(index!==shown){
    shown=index;figure.show(linked,'running',index);
    record.replaceChildren(el('span','core-link-count',`${index+1} / 5 · 발견이 전해져요`),heading(stages[index].title),evidenceView(a.evidence[stageIds[index]],true));
    side.scrollTop=0;
   }
   if(elapsed>=(reduce?1:5000)){finish();return;}
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
 }
 update();
}
