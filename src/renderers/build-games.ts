import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryItem,InquiryRecord,InquiryTask} from '../inquiry-model';
import {artFor} from '../artAssets';
import {assignCard} from '../inquiry-actions';
import {invalidateRun} from '../inquiry-evaluate';
import {currentRun,designCorrect,startRun} from '../inquiry-runs';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import {picture} from './quiz-board';
import '../build-games.css';

/** 2026-11-16: the second and third M5 designs stop repeating the M5-1 card slots.
 * M5-2 bread: drag a creature jar into the dough bowl, choose a prediction, then press and hold the oven until the dough rises (or not).
 * M5-3 leaves: drag a card into the compost box, choose a prediction, then tap to stir the box five times.
 * The record keeps the build shape (input/action/output, edge links, prediction, run, reflection), so evaluation is unchanged. */
export function mountBuildGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 const bread=task.id==='M5-2';
 let disposed=false,running=false,progress=0,raf=0,holding=false;
 const root=el('section',`build-game ${bread?'is-bread':'is-compost'}`);root.inert=true;host.append(root);
 // Input and output come prepared (prepareInquiry); fill them if an older record lacks them.
 for(const slot of ['input','output']){const it=task.items.find(i=>i.target===slot);if(it&&!record.assignments[slot]){assignCard(task,record,it.id,slot);hooks.changed();}}
 const cards=task.items.filter(i=>i.target==='action'||!i.target);
 const placed=()=>cards.find(i=>i.id===record.assignments.action);
 const yes=bread?'부풀 것 같아요':'흙처럼 바뀔 것 같아요',no=bread?'그대로일 것 같아요':'그대로일 것 같아요';
 const tip=el('p','build-tip');
 const hand=el('div','build-hand');
 const vessel=el('div','build-vessel');vessel.dataset.linkTarget='action';vessel.setAttribute('role','button');vessel.tabIndex=0;vessel.setAttribute('aria-label',bread?'반죽 그릇':'퇴비 상자');
 const frames=bread?[artFor('dough')!.src,artFor('risenDough')!.src]:[0,1,2,3].map(t=>artFor('leaf',t)!.src).concat(artFor('soil')!.src);
 const layers=frames.map((src,i)=>{const img=el('img','build-layer');img.src=src;img.alt='';img.draggable=false;img.style.opacity=i?'0':'1';return img;});
 const prop=el('img','build-prop');prop.src=`assets/ui/game/${bread?'oven':'compost-crate'}.webp`;prop.alt='';prop.draggable=false;
 const slotChip=el('span','build-slot');const ring=el('span','build-ring');
 vessel.append(...layers,prop,slotChip,ring);
 const panel=el('aside','build-panel');
 const labels=el('div','build-labels');
 labels.append(el('span','',`재료: ${task.items.find(i=>i.target==='input')?.label||''}`),el('span','',`결과: ${task.items.find(i=>i.target==='output')?.label||''}`));
 const stage=el('div','build-stage');stage.append(hand,vessel,panel);
 root.append(tip,stage);
 let selected='';
 const cardNodes=cards.map(it=>{
  const b=el('button','build-card');b.type='button';b.dataset.linkItem=it.id;b.append(picture(it),el('strong','',it.label));
  b.onclick=()=>{if(b.dataset.dragged||running)return;selected=selected===it.id?'':it.id;hooks.open(it.id);paint();};
  b.onpointerdown=e=>{
   if(running||e.button!==0)return;const r=b.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,sx=e.clientX,sy=e.clientY;let ghost:HTMLElement|undefined;const stop=new AbortController();
   window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;
   if(!ghost){if(Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;
   ghost=b.cloneNode(true) as HTMLElement;
   ghost.classList.add('build-ghost');
   ghost.removeAttribute('data-link-item');
   ghost.style.width=r.width+'px';
   document.body.append(ghost);
   b.classList.add('is-lifted');}
   ghost.style.transform=`translate(${m.clientX-dx}px,${m.clientY-dy}px) rotate(-4deg)`;
   const v=vessel.getBoundingClientRect();
   vessel.classList.toggle('is-over',m.clientX>=v.left&&m.clientX<=v.right&&m.clientY>=v.top&&m.clientY<=v.bottom);},{signal:stop.signal});
   const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;
   stop.abort();
   b.classList.remove('is-lifted');
   vessel.classList.remove('is-over');
   if(!ghost)return;
   ghost.remove();
   b.dataset.dragged='1';
   setTimeout(()=>delete b.dataset.dragged,350);
   const v=vessel.getBoundingClientRect();
   if(u.type==='pointerup'&&u.clientX>=v.left&&u.clientX<=v.right&&u.clientY>=v.top&&u.clientY<=v.bottom)put(it);};
   window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
  };
  hand.append(b);return {it,b};
 });
 vessel.onclick=()=>{if(!bread&&placed()&&record.prediction&&!currentRun(record)){stir();return;}const it=cards.find(c=>c.id===selected);if(it)put(it);};
 function put(it:InquiryItem){if(running)return;hooks.open(it.id);selected='';if(assignCard(task,record,it.id,'action')){record.prediction='';hooks.assigned(it.id,'action');hooks.changed();playEffect('snap');}progress=0;paint();}
 function predict(v:'supported'|'stopped'){if(running||!placed())return;invalidateRun(record);record.prediction=v;hooks.changed();playEffect('click');progress=0;paint();}
 /** Runs the experiment while the learner warms (hold) or stirs (taps). */
 function begin(){if(running||!placed()||!record.prediction||currentRun(record))return false;running=true;const run=startRun(record);run.status='running';hooks.changed();root.classList.add('is-running');return true;}
 function finish(){const run=record.runs.at(-1)!;
 const valid=designCorrect(task,record);
 running=false;
 root.classList.remove('is-running');
 run.status='completed';
 run.result=valid?'supported':'stopped';
 record.runResult=run.result;
 run.reflection=record.reflection=run.prediction===run.result?'matches':'differs';
 hooks.changed();
 playEffect(valid?'success':'retry');
  const it=placed()!;totoSay(root,valid?{text:run.reflection==='matches'?'예상이 맞았어! '+it.detail:'예상과 달랐지만 괜찮아. 결과를 보고 생각을 고치면 돼. '+it.detail,mood:'cheer'}:{text:it.hint||task.hints?.[1]||task.feedback,mood:'hint'});paint();}
 const show=(p:number)=>{const valid=designCorrect(task,record);const steps=layers.length-1;layers.forEach((l,i)=>{l.style.opacity=String(i===0?1:valid?Math.max(0,Math.min(1,p*steps-(i-1))):0);});ring.style.setProperty('--p',String(p));};
 // bread: press and hold
 const warm=button('',()=>{},'primary build-action');const warmIcon=el('img');warmIcon.src='assets/ui/game/oven.webp';warmIcon.alt='';warm.append(warmIcon,el('span','',bread?'꾹 눌러 데우기':'톡톡 섞기'));
 if(bread){
  const tick=()=>{if(!holding||disposed)return;progress=Math.min(1,progress+1/150);show(progress);if(progress>=1){holding=false;finish();return;}raf=requestAnimationFrame(tick);};
  warm.onpointerdown=e=>{if(e.button!==0)return;if(!running&&!begin())return;holding=true;warm.setPointerCapture(e.pointerId);playEffect('run');cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);};
  const release=()=>{holding=false;cancelAnimationFrame(raf);};warm.onpointerup=release;warm.onpointercancel=release;
  warm.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();warm.onpointerdown?.({button:0,pointerId:-1} as PointerEvent);}};warm.onkeyup=release;
 }
 // compost: five taps
 function stir(){if(!running&&!begin())return;progress=Math.min(1,progress+.2);show(progress);playEffect('water');vessel.classList.remove('is-shake');void vessel.offsetWidth;vessel.classList.add('is-shake');if(progress>=1)finish();else paint();}
 if(!bread){warm.onclick=stir;const shovel=warmIcon;shovel.src='assets/ui/game/shovel.webp';}
 const choice=(v:'supported'|'stopped',text:string)=>{const b=button(text,()=>predict(v),'secondary build-predict');b.dataset.prediction=v;return b;};
 const pYes=choice('supported',yes),pNo=choice('stopped',no);
 const retry=button('다른 카드로 다시 해 보기',()=>{invalidateRun(record);record.prediction='';hooks.changed();progress=0;show(0);paint();},'secondary');
 const verdict=el('p','build-verdict');
 function paint(){
  if(disposed)return;const it=placed(),run=currentRun(record);
  const phase=run?'done':!it?'pick':!record.prediction?'predict':'run';root.dataset.phase=phase;
  for(const {it:c,b} of cardNodes){b.classList.toggle('is-placed',c.id===it?.id);b.classList.toggle('is-selected',c.id===selected);b.setAttribute('aria-pressed',String(c.id===selected));b.disabled=running;}
  slotChip.textContent=it?it.label:bread?'여기에 병을 부어요':'여기에 카드를 넣어요';slotChip.classList.toggle('is-filled',!!it);
  tip.textContent=phase==='pick'?(bread?'🫙 반죽을 부풀릴 생물 병을 그릇으로 끌어 와요':'🍂 낙엽을 바꿀 생물 카드를 상자로 끌어 와요'):phase==='predict'?'🤔 어떻게 될지 먼저 예상해요':phase==='run'?(bread?'🔥 오븐 버튼을 꾹 누르고 있어요':'🪏 상자를 톡톡 눌러 다섯 번 섞어요'):run!.result==='supported'?'👉 「발견 기록하기」를 눌러 실험을 기록해요':'🔁 결과가 달랐어요. 다른 카드로 다시 해 봐요';
  pYes.classList.toggle('selected',record.prediction==='supported');pNo.classList.toggle('selected',record.prediction==='stopped');pYes.setAttribute('aria-pressed',String(record.prediction==='supported'));pNo.setAttribute('aria-pressed',String(record.prediction==='stopped'));
  verdict.textContent=run?(run.reflection==='matches'?'내 예상과 같았어요!':'내 예상과 달랐어요. 결과를 보고 생각을 고쳐요.'):'';
  const predictBox=el('div','build-predictions');predictBox.append(el('strong','',bread?'오븐에 넣으면?':'섞어 두면?'),pYes,pNo);
  panel.replaceChildren(labels,...phase!=='pick'?[predictBox]:[],...phase==='run'||(phase==='predict'&&false)?[warm]:[],...run?[verdict,...run.result!=='supported'?[retry]:[]]:[]);
  if(run)show(run.result==='supported'?1:0);else if(!running)show(progress);
 }
 paint();
 Promise.all([...root.querySelectorAll('img')].map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};const assign=(id:string,target:string)=>{const it=cards.find(c=>c.id===id);if(!it||target!=='action')return false;put(it);return true;};
 return {refresh:paint,showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:assign,assign,place:assign,animateRun:(_ok,done)=>done(),
  dispose:()=>{disposed=true;cancelAnimationFrame(raf);const run=record.runs.at(-1);if(running&&run?.status==='running'){run.status='interrupted';hooks.changed();}document.querySelectorAll('.build-ghost').forEach(g=>g.remove());root.remove();}};
}
