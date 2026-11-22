import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryRecord,InquiryTask} from '../inquiry-model';
import {artFor} from '../artAssets';
import {syncBuildLinks} from '../inquiry-actions';
import {invalidateRun} from '../inquiry-evaluate';
import {currentRun,designCorrect,startRun} from '../inquiry-runs';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import '../quiz-board.css';
import '../build-games.css';
import '../yogurt-game.css';

/** 2026-11-22 M5-1 as a small experiment instead of a recipe with the answer already printed on it.
 * Pick what goes in the cup (milk or water) and what goes in with it (live lactic powder or nothing), predict, then hold the
 * fermenter button. Only the result tells whether it became yogurt; a miss says what to think about, never which card to pick.
 * The record keeps the build shape (input/action/output, edge links, prediction, run, reflection), so evaluation is unchanged;
 * ‘nothing’ is saved as action 'none', which no item matches, so it runs and stops like any other wrong design. */
const NONE='none';
const MISS:Record<string,string>={
 'water+lactic':'맑은 물 그대로야. 물에는 유산균이 이용할 당이 거의 없대. 컵에 부을 것을 다시 생각해 봐!',
 'milk+none':'우유 그대로야. 따뜻하게 두기만 해서는 우유가 바뀌지 않아. 우유를 바꿔 줄 무언가가 필요해!',
 'water+none':'아무것도 달라지지 않았어. 컵에 부을 것과 넣을 것을 하나씩 바꿔 가며 다시 해 봐!',
};
export function mountYogurtGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 let disposed=false,running=false,progress=0,raf=0,holding=false;
 const root=el('section','build-game is-yogurt');root.inert=true;host.append(root);
 // The food to make is the goal, not a choice: keep it in the record without showing it as a card.
 if(record.assignments.output!=='yogurt'){record.assignments.output='yogurt';syncBuildLinks(task,record);hooks.changed();}
 const item=(id:string)=>task.items.find(i=>i.id===id)!;
 const groups=[{slot:'input',title:'컵에 부을 것',ids:['milk','water']},{slot:'action',title:'함께 넣을 것',ids:['lactic',NONE]}];
 const label=(id:string)=>id===NONE?'아무것도 안 넣기':item(id).label;
 const picSrc:Record<string,string>={milk:artFor('milk')!.src,water:artFor('waterGlass')!.src,lactic:artFor('starter')!.src};
 const tip=el('p','build-tip');
 const hand=el('div','build-hand yogurt-hand');
 const cards=groups.map(g=>{
  const box=el('div','yogurt-group');box.append(el('strong','yogurt-group-title',g.title));
  const row=el('div','yogurt-choices');
  const nodes=g.ids.map(id=>{
   const b=el('button','build-card yogurt-card');b.type='button';b.dataset.linkItem=id;
   if(picSrc[id]){const img=el('img');img.src=picSrc[id];img.alt='';img.draggable=false;b.append(img);}else b.append(el('span','yogurt-empty-spoon'));
   b.append(el('strong','',label(id)));
   b.onclick=()=>choose(g.slot,id);
   row.append(b);return {id,b};
  });
  box.append(row);hand.append(box);return {...g,nodes};
 });
 // The cup: what was poured, what went in, and (after the run) what it became.
 const vessel=el('div','build-vessel yogurt-cup');vessel.dataset.linkTarget='input';
 const empty=el('div','yogurt-cup-empty','컵이 비어 있어요');
 const liquid=el('img','build-layer yogurt-liquid');liquid.alt='';liquid.draggable=false;
 const made=el('img','build-layer');made.src=artFor('yogurt')!.src;made.alt='';made.draggable=false;made.style.opacity='0';
 const maker=el('img','build-prop yogurt-maker');maker.src='assets/ui/yogurt-maker.webp';maker.alt='';maker.draggable=false;
 const chips=el('div','yogurt-chips');const ring=el('span','build-ring');const outcome=el('span','yogurt-outcome');
 vessel.append(empty,liquid,made,maker,chips,ring,outcome);
 const panel=el('aside','build-panel');
 const stage=el('div','build-stage');stage.append(hand,vessel,panel);
 root.append(tip,stage);
 const poured=()=>record.assignments.input||'',added=()=>record.assignments.action||'';
 const filled=()=>!!poured()&&!!added();
 function choose(slot:string,id:string){
  if(running||disposed)return;
  if(id!==NONE){hooks.open(id);}
  if(record.assignments[slot]===id)return;
  record.assignments[slot]=id;record.submitted=false;syncBuildLinks(task,record);invalidateRun(record);
  progress=0;hooks.assigned(id,slot);hooks.changed();playEffect(slot==='input'?'water':'snap');paint();
 }
 function predict(v:'supported'|'stopped'){if(running||!filled())return;invalidateRun(record);record.prediction=v;hooks.changed();playEffect('click');progress=0;paint();}
 function begin(){if(running||!filled()||!record.prediction||currentRun(record))return false;running=true;const run=startRun(record);run.status='running';hooks.changed();root.classList.add('is-running');return true;}
 function finish(){
  const run=record.runs.at(-1)!,valid=designCorrect(task,record);
  running=false;root.classList.remove('is-running');
  run.status='completed';run.result=valid?'supported':'stopped';record.runResult=run.result;
  run.reflection=record.reflection=run.prediction===run.result?'matches':'differs';
  hooks.changed();playEffect(valid?'success':'retry');
  totoSay(root,valid?{text:(run.reflection==='matches'?'예상이 맞았어! ':'예상과 달랐지만 괜찮아. ')+task.success,mood:'cheer'}:{text:MISS[`${poured()}+${added()}`]||task.feedback,mood:'hint'});
  paint();
 }
 const show=(p:number)=>{const ok=designCorrect(task,record);made.style.opacity=String(ok?Math.max(0,Math.min(1,p*1.4-.4)):0);liquid.style.opacity=String(ok?1-Math.max(0,Math.min(1,p*1.4-.4)):1);ring.style.setProperty('--p',String(p));};
 const warm=button('',()=>{},'primary build-action');const warmIcon=el('img');warmIcon.src='assets/ui/yogurt-maker.webp';warmIcon.alt='';warm.append(warmIcon,el('span','','꾹 눌러 발효기 켜기'));
 const tick=()=>{if(!holding||disposed)return;progress=Math.min(1,progress+1/150);show(progress);if(progress>=1){holding=false;finish();return;}raf=requestAnimationFrame(tick);};
 warm.onpointerdown=e=>{if(e.button!==0)return;if(!running&&!begin())return;holding=true;try{warm.setPointerCapture(e.pointerId);}catch{/* keyboard */}playEffect('run');cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);paint();};
 const release=()=>{holding=false;cancelAnimationFrame(raf);paint();};warm.onpointerup=release;warm.onpointercancel=release;
 warm.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();warm.onpointerdown?.({button:0,pointerId:-1} as PointerEvent);}};warm.onkeyup=release;
 const choice=(v:'supported'|'stopped',text:string)=>{const b=button(text,()=>predict(v),'secondary build-predict');b.dataset.prediction=v;return b;};
 const pYes=choice('supported','요구르트가 될 거예요'),pNo=choice('stopped','요구르트가 안 될 거예요');
 const retry=button('재료 바꿔 다시 해 보기',()=>{invalidateRun(record);record.prediction='';hooks.changed();progress=0;show(0);paint();},'secondary');
 const verdict=el('p','build-verdict');
 function paint(){
  if(disposed)return;const run=currentRun(record);
  const phase=run?'done':!filled()?'pick':!record.prediction?'predict':'run';root.dataset.phase=phase;
  for(const g of cards)for(const {id,b} of g.nodes){const on=record.assignments[g.slot]===id;b.classList.toggle('is-placed',on);b.setAttribute('aria-pressed',String(on));b.disabled=running;}
  const p=poured();liquid.hidden=!p;empty.hidden=!!p;if(p&&liquid.getAttribute('src')!==picSrc[p])liquid.src=picSrc[p];
  liquid.classList.toggle('is-glass',p==='water');
  chips.replaceChildren(...groups.map(g=>{const v=record.assignments[g.slot]||'';const c=el('span','build-slot yogurt-chip',v?`${g.title}: ${label(v)}`:`${g.title}: ?`);c.classList.toggle('is-filled',!!v);return c;}));
  outcome.textContent=run?(run.result==='supported'?'걸쭉하고 새콤해졌어요!':'그대로예요'):'';outcome.dataset.result=run?.result||'';
  tip.textContent=phase==='pick'?(!p&&!added()?'🥛 왼쪽에서 컵에 부을 것과 함께 넣을 것을 하나씩 골라요':!p?'🥛 컵에 부을 것을 골라요':'🥄 함께 넣을 것을 골라요')
   :phase==='predict'?'🤔 하룻밤 따뜻하게 두면 어떻게 될지 먼저 예상해요':phase==='run'?(running?'🌙 따뜻하게… 시간이 흐르고 있어요':'🔥 발효기 버튼을 꾹 누르고 있어요')
   :run!.result==='supported'?'👉 「발견 기록하기」로 실험 결과를 남겨요':'🔁 재료를 바꿔 다시 실험해 봐요';
  tip.classList.toggle('is-done',phase==='done'&&run?.result==='supported');
  pYes.classList.toggle('selected',record.prediction==='supported');pNo.classList.toggle('selected',record.prediction==='stopped');
  pYes.setAttribute('aria-pressed',String(record.prediction==='supported'));pNo.setAttribute('aria-pressed',String(record.prediction==='stopped'));
  pYes.disabled=pNo.disabled=running;
  verdict.textContent=run?(run.reflection==='matches'?'내 예상과 같았어요!':'내 예상과 달랐어요. 결과를 보고 생각을 고쳐요.'):'';
  const predictBox=el('div','build-predictions');predictBox.append(el('strong','','하룻밤 따뜻하게 두면?'),pYes,pNo);
  panel.replaceChildren(...phase==='pick'?[el('p','yogurt-wait','재료를 다 고르면 예상할 수 있어요.')]:[predictBox],...phase==='run'?[warm]:[],...run?[verdict,...run.result!=='supported'?[retry]:[]]:[]);
  if(run)show(run.result==='supported'?1:0);else if(!running)show(progress);
 }
 paint();
 Promise.all([...root.querySelectorAll('img')].filter(i=>i.getAttribute('src')).map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};
 const assign=(id:string,target:string)=>{const g=groups.find(x=>x.slot===target);if(!g||!g.ids.includes(id))return false;choose(target,id);return true;};
 return {refresh:paint,showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:assign,assign,place:assign,animateRun:(_ok:boolean,done:()=>void)=>done(),
  dispose:()=>{disposed=true;cancelAnimationFrame(raf);const run=record.runs.at(-1);if(running&&run?.status==='running'){run.status='interrupted';hooks.changed();}root.remove();}};
}
