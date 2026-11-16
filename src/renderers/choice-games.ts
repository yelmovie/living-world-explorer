import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryItem,InquiryRecord,InquiryTask} from '../inquiry-model';
import {assignCard} from '../inquiry-actions';
import {el} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import {picture} from './quiz-board';
import '../choice-games.css';

/** 2026-11-16: three game boards that replace the identical two-button quiz in stages M3 and M4.
 * stamp: stamp each document · swipe: push each card left or right · lamp: drag case cards onto two signal lamps.
 * Data stays item → target, so saved work and evaluation are unchanged. A wrong answer is not stored. */
export type ChoiceGame='stamp'|'swipe'|'lamp';
export const choiceGames:Record<string,ChoiceGame>={'M3-1':'stamp','M3-3':'swipe','M4-3':'lamp','M4-4':'swipe'};
const icons:Record<string,string>={evidence:'🔍',guess:'💭',place:'📍',other:'❓',help:'👍',problem:'⚠️'};
const tones:Record<string,string>={evidence:'green',guess:'purple',place:'green',other:'grey',help:'green',problem:'orange'};

export function mountChoiceGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 const mode=choiceGames[task.id]||'swipe';
 const items=task.items.filter(it=>record.v===2||it.since!==2);
 let disposed=false;const events=new AbortController();
 const root=el('section',`choice-game choice-${mode}`);root.dataset.task=task.id;root.inert=true;host.append(root);
 const placed=(it:InquiryItem)=>record.assignments[it.id]===it.target;
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 const art=(it:InquiryItem)=>picture(it);
 const tone=(id:string)=>tones[id]||'green';
 /** true when right. */
 function attempt(id:string,target:string){
  const it=items.find(i=>i.id===id);if(!it||blocked()||placed(it))return false;
  hooks.open(id);
  if(it.target!==target){record.misses++;hooks.changed();playEffect('retry');const hint=it.hint||task.feedback;hooks.feedback(hint,'retry');totoSay(root,{text:hint,mood:'hint'});return false;}
  assignCard(task,record,id,target);hooks.assigned(id,target);hooks.changed();
  const done=items.every(placed);playEffect(done?'success':'snap');
  const cheer=done?'다 풀었어! ‘발견 기록하기’를 눌러 기록하자.':'딩동댕! '+it.detail;
  hooks.feedback(cheer,'success');totoSay(root,{text:cheer,mood:'cheer'});return true;
 }
 /** Drag a clone of node with the pointer; onDrop gets the release point. A short press is left to the click handler. */
 function drag(e:PointerEvent,node:HTMLElement,onMove:(x:number,y:number)=>void,onDrop:(x:number,y:number)=>void){
  if(blocked()||e.button!==0)return;
  const r=node.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,sx=e.clientX,sy=e.clientY;let ghost:HTMLElement|undefined;
  const stop=new AbortController();
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;
   if(!ghost){if(Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;ghost=node.cloneNode(true) as HTMLElement;ghost.classList.add('choice-ghost');ghost.removeAttribute('data-link-item');ghost.removeAttribute('data-link-target');ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';document.body.append(ghost);node.classList.add('is-lifted');}
   ghost.style.transform=`translate(${m.clientX-dx}px,${m.clientY-dy}px) rotate(-4deg)`;onMove(m.clientX,m.clientY);
  },{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();node.classList.remove('is-lifted');if(!ghost)return;ghost.remove();node.dataset.dragged='1';setTimeout(()=>delete node.dataset.dragged,350);if(u.type==='pointerup')onDrop(u.clientX,u.clientY);else onMove(-1,-1);};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
  events.signal.addEventListener('abort',()=>{stop.abort();ghost?.remove();});
 }
 const inside=(node:Element,x:number,y:number)=>{const b=node.getBoundingClientRect();return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;};
 const shake=(node:HTMLElement)=>{node.classList.remove('is-shake');void node.offsetWidth;node.classList.add('is-shake');};
 const progress=el('div','choice-progress');const dots=items.map(()=>el('span'));progress.append(...dots);
 const paintDots=(current=-1)=>dots.forEach((d,i)=>{d.className=placed(items[i])?'done':i===current?'now':'';});
 let refresh:()=>void=()=>{};

 if(mode==='stamp'||mode==='swipe'){
  // One card at a time.
  const nextIndex=()=>{const i=items.findIndex(it=>!placed(it));return i<0?items.length:i;};
  let index=nextIndex();
  const stage=el('div','choice-stage');const finish=el('div','choice-finish');finish.hidden=true;
  finish.append(el('strong','','🎉 모두 정리했어요!'),el('span','','‘발견 기록하기’를 눌러요'));
  const card=el('article','choice-card');const photo=el('div','choice-photo'),title=el('strong','choice-title'),detail=el('p','choice-detail'),mark=el('span','choice-mark');mark.hidden=true;
  card.append(photo,title,detail,mark);
  const tray=el('div','choice-tray');
  const show=()=>{
   index=nextIndex();paintDots(index);
   if(index>=items.length){card.hidden=true;finish.hidden=false;root.classList.add('is-complete');return;}
   const it=items[index];card.hidden=false;finish.hidden=true;card.dataset.linkItem=it.id;photo.replaceChildren(art(it));title.textContent=it.label;detail.textContent=it.detail;mark.hidden=true;
   card.style.transform='';card.className='choice-card is-enter';hooks.open(it.id);
  };
  const paintTray=()=>tray.replaceChildren(...items.filter(placed).map(it=>{const m=el('span',`choice-chip tone-${tone(it.target)}`);m.append(el('i','',icons[it.target]||'✓'),el('span','',it.label));return m;}));
  const decide=(target:string,fly:number)=>{
   const it=items[index];if(!it)return;
   if(attempt(it.id,target)){
    paintTray();paintDots(index);
    if(mode==='stamp'){const t=task.targets.find(x=>x.id===target)!;mark.textContent=(icons[target]||'')+' '+t.label;mark.className=`choice-mark tone-${tone(target)}`;mark.hidden=false;setTimeout(()=>{if(!disposed){card.classList.add('is-leave');setTimeout(()=>{if(!disposed)show();},380);}},900);}
    else{card.style.transform=`translateX(${fly*130}vw) rotate(${fly*24}deg)`;card.classList.add('is-fly');setTimeout(()=>{if(!disposed)show();},380);}
   }else{card.style.transform='';shake(card);}
  };
  if(mode==='stamp'){
   const rack=el('div','stamp-rack');
   for(const t of task.targets){
    const s=el('button',`stamp-tool tone-${tone(t.id)}`);s.type='button';s.dataset.linkTarget=t.id;s.setAttribute('aria-label',t.label+' 도장 찍기');
    s.append(el('span','stamp-knob'),el('span','stamp-face',`${icons[t.id]||''} ${t.label}`));
    s.onpointerdown=e=>drag(e,s,(x,y)=>card.classList.toggle('is-target',x>=0&&inside(card,x,y)),(x,y)=>{card.classList.remove('is-target');if(inside(card,x,y))decide(t.id,0);});
    s.onclick=()=>{if(s.dataset.dragged||blocked())return;decide(t.id,0);};
    rack.append(s);
   }
   stage.append(card,finish);root.append(progress,el('p','choice-tip','도장을 끌어 서류에 쾅! 눌러도 찍혀요'),stage,rack,tray);
  }else{
   // targets[0] goes right, targets[1] left.
   const [rightT,leftT]=task.targets;
   const side=(t:typeof rightT,dir:'left'|'right')=>{const b=el('button',`swipe-side ${dir} tone-${tone(t.id)}`);b.type='button';b.dataset.linkTarget=t.id;b.append(el('i','',icons[t.id]||''),el('strong','',t.label),el('span','swipe-arrow',dir==='left'?'◀':'▶'));b.onclick=()=>{if(!blocked())decide(t.id,dir==='left'?-1:1);};return b;};
   const left=side(leftT,'left'),right=side(rightT,'right');
   card.onpointerdown=e=>{
    if(blocked()||e.button!==0||card.hidden)return;card.setPointerCapture(e.pointerId);const sx=e.clientX;card.classList.add('is-dragging');
    const stop=new AbortController();
    card.addEventListener('pointermove',m=>{const dx=m.clientX-sx;card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;left.classList.toggle('is-hot',dx<-70);right.classList.toggle('is-hot',dx>70);},{signal:stop.signal});
    const end=(u:PointerEvent)=>{stop.abort();card.classList.remove('is-dragging');left.classList.remove('is-hot');right.classList.remove('is-hot');const dx=u.clientX-sx;
     if(u.type==='pointerup'&&Math.abs(dx)>110)decide(dx>0?rightT.id:leftT.id,dx>0?1:-1);else card.style.transform='';};
    card.addEventListener('pointerup',end,{signal:stop.signal});card.addEventListener('pointercancel',end,{signal:stop.signal});
   };
   stage.append(left,card,finish,right);root.append(progress,el('p','choice-tip','카드를 읽고 알맞은 쪽으로 쓱 밀어요'),stage,tray);
  }
  refresh=()=>{paintTray();if(nextIndex()!==index)show();else paintDots(index);};
  paintTray();show();
 }else{
  // lamp: every case card at once, two lamps to drop them on.
  const hand=el('div','lamp-hand');const lamps=el('div','lamp-row');
  const zones=task.targets.map(t=>{const z=el('button',`lamp tone-${tone(t.id)}`);z.type='button';z.dataset.linkTarget=t.id;const bulb=el('span','lamp-bulb',icons[t.id]||'');const chips=el('div','lamp-chips');z.append(bulb,el('strong','lamp-label',t.label),chips);z.onclick=()=>{if(selected)drop(selected,t.id);else totoSay(root,{text:'먼저 위에서 사건 카드를 하나 골라 봐!'});};lamps.append(z);return {t,z,chips};});
  let selected='';
  const drop=(id:string,target:string)=>{selected='';const zone=zones.find(z=>z.t.id===target)!;const ok=attempt(id,target);if(ok){zone.z.classList.remove('is-on');void zone.z.offsetWidth;zone.z.classList.add('is-on');}else{shake(zone.z);shake(cards.find(c=>c.it.id===id)!.b);}refresh();};
  const cards=items.map(it=>{
   const b=el('button','lamp-card');b.type='button';b.dataset.linkItem=it.id;b.append(art(it),el('strong','',it.label),el('span','lamp-card-detail',it.detail),el('span','lamp-card-done','✓'));
   b.onpointerdown=e=>{if(placed(it))return;drag(e,b,(x,y)=>zones.forEach(z=>z.z.classList.toggle('is-over',x>=0&&inside(z.z,x,y))),(x,y)=>{zones.forEach(z=>z.z.classList.remove('is-over'));const z=zones.find(z=>inside(z.z,x,y));if(z)drop(it.id,z.t.id);});};
   b.onclick=()=>{if(b.dataset.dragged||blocked()||placed(it))return;selected=selected===it.id?'':it.id;if(selected){hooks.open(it.id);playEffect('click');}refresh();};
   hand.append(b);return {it,b};
  });
  root.append(progress,el('p','choice-tip','사건 카드를 끌어 알맞은 신호등에 놓아요'),hand,lamps);
  refresh=()=>{
   for(const {it,b} of cards){b.classList.toggle('is-placed',placed(it));b.classList.toggle('is-selected',selected===it.id);b.setAttribute('aria-pressed',String(selected===it.id));}
   for(const {t,z,chips} of zones){const its=items.filter(it=>placed(it)&&it.target===t.id);z.classList.toggle('is-lit',its.length>0);if(chips.childElementCount!==its.length)chips.replaceChildren(...its.map(it=>el('span','lamp-chip',it.label)));}
   root.classList.toggle('is-armed',!!selected);root.classList.toggle('is-complete',items.every(placed));paintDots();
  };
  refresh();
 }
 Promise.all([...root.querySelectorAll('img')].map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};const assign=(id:string,target:string)=>attempt(id,target);
 return {refresh:()=>refresh(),showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:assign,assign,place:assign,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;events.abort();root.remove();}};
}
