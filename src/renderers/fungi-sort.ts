import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {artFor,artKey} from '../artAssets';
import {assignCard} from '../inquiry-actions';
import {el} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import '../fungi-sort.css';

/** 2026-11-16: drag a feature card into a two-circle (Venn) board — mushroom only, both, mold only.
 * A right card snaps into its circle and stays; a wrong one flies back to the hand and Toto gives a hint.
 * Tapping the card and then a circle does the same for learners who cannot drag. */
export function mountFungiSort(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 let selected='',disposed=false,justDragged='';
 let drag:{id:string;pointer:number;x:number;y:number;dx:number;dy:number;ghost?:HTMLElement}|undefined;
 const root=el('div','fungi-sort'),hand=el('div','fungi-hand'),venn=el('div','fungi-venn'),count=el('span','fungi-count');
 const tip=el('p','fungi-tip'),tipIcon=el('span','fungi-tip-icon','☝'),tipText=el('span','','카드를 끌어서 알맞은 칸에 놓아요');tip.append(tipIcon,tipText);
 hand.setAttribute('aria-label','특징 카드');venn.setAttribute('aria-label','버섯과 곰팡이 비교판');
 root.append(tip,hand,venn);host.append(root);
 const placed=(id:string)=>{const it=task.items.find(i=>i.id===id);return !!it&&record.assignments[id]===it.target;};
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 const picture=(kind:string|undefined,cls='')=>{const art=artFor(kind);const img=el('img',cls);if(art)img.src=art.src;img.alt='';img.draggable=false;return img;};

 const cardNodes=task.items.map(item=>{
  const slot=el('div','fungi-slot');
  const b=el('button','fungi-card');b.type='button';b.dataset.linkItem=item.id;b.setAttribute('aria-label',item.label+' 카드');
  b.append(picture(artKey(item)),el('strong','',item.label));slot.append(b,el('span','fungi-slot-done','✓ 정답'));
  b.onpointerdown=e=>{
   if(blocked()||placed(item.id)||e.button!==0)return;
   const r=b.getBoundingClientRect();drag={id:item.id,pointer:e.pointerId,x:e.clientX,y:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top};
   b.setPointerCapture(e.pointerId);
  };
  b.onclick=()=>{if(blocked()||placed(item.id)||drag||justDragged===item.id)return;select(selected===item.id?'':item.id);};
  hand.append(slot);return {item,b,slot};
 });

 // Mushroom on the left, the overlap in the middle, mold on the right.
 const order=['mushroom','both','mold'];
 venn.append(el('span','venn-ring mushroom'),el('span','venn-ring mold'),count);
 const zoneNodes=order.map(id=>task.targets.find(t=>t.id===id)!).filter(Boolean).map(t=>{
  const z=el('button','fungi-zone');z.type='button';z.dataset.linkTarget=t.id;z.dataset.zone=t.id;z.setAttribute('aria-label',t.label+' 칸');
  const badge=el('span','fungi-zone-badge');
  if(t.id==='both')badge.append(picture('mushroom','mini'),el('span','plus','+'),picture('mold','mini'));else badge.append(picture(t.id,'icon'));
  const chips=el('div','fungi-zone-chips');z.append(badge,el('strong','fungi-zone-label',t.label),chips);
  z.onclick=()=>{if(selected)attempt(selected,t.id);else{flash(z,'is-empty');totoSay(root,{text:'먼저 위에서 특징 카드를 하나 골라 봐!'});}};
  venn.append(z);return {t,z,chips};
 });

 function select(id:string){selected=id;if(id){hooks.open(id);playEffect('click');}refresh();}
 function flash(node:HTMLElement,cls:string){node.classList.remove(cls);void node.offsetWidth;node.classList.add(cls);setTimeout(()=>node.classList.remove(cls),700);}
 function zoneAt(x:number,y:number){return zoneNodes.find(({z})=>{const r=z.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;});}

 /** Returns true when the card was placed. Wrong answers are not stored: the card returns to the hand. */
 function attempt(id:string,target:string){
  if(blocked())return false;
  const item=task.items.find(i=>i.id===id);if(!item||placed(id))return false;
  hooks.open(id);selected='';
  const zone=zoneNodes.find(n=>n.t.id===target);
  if(item.target!==target){
   record.misses++;hooks.changed();playEffect('retry');
   const card=cardNodes.find(n=>n.item.id===id)!.b;flash(card,'is-shake');if(zone)flash(zone.z,'is-wrong');
   hooks.feedback(item.hint||task.feedback,'retry');totoSay(root,{text:item.hint||task.feedback,mood:'hint'});refresh();return false;
  }
  assignCard(task,record,id,target);hooks.assigned(id,target);hooks.changed();refresh();
  if(zone){const chip=zone.chips.querySelector<HTMLElement>(`[data-chip="${id}"]`);if(chip)flash(chip,'is-new');flash(zone.z,'is-right');}
  const done=task.items.every(i=>placed(i.id));
  playEffect(done?'success':'snap');
  const cheer=done?'완벽해! 버섯과 곰팡이는 생김새는 달라도 가는 실과 포자가 있는 균류야.':'맞아! '+item.detail;
  hooks.feedback(cheer,'success');totoSay(root,{text:cheer,mood:'cheer'});
  return true;
 }

 function refresh(){if(disposed)return;
  let n=0;
  for(const {item,b,slot} of cardNodes){const ok=placed(item.id);if(ok)n++;slot.classList.toggle('is-placed',ok);b.setAttribute('aria-disabled',String(ok));b.classList.toggle('is-selected',selected===item.id);b.setAttribute('aria-pressed',String(selected===item.id));}
  for(const {t,chips} of zoneNodes){
   const items=task.items.filter(i=>record.assignments[i.id]===t.id&&i.target===t.id);
   if(chips.childElementCount!==items.length)chips.replaceChildren(...items.map(i=>{const c=el('span','fungi-chip');c.dataset.chip=i.id;c.append(picture(artKey(i)),el('span','',i.label));return c;}));
  }
  count.textContent=`${n} / ${task.items.length}`;
  root.classList.toggle('is-armed',!!selected);venn.classList.toggle('is-complete',n===task.items.length);
  const all=n===task.items.length;tipIcon.textContent=all?'👉':'☝';tipText.textContent=all?'「발견 기록하기」를 눌러 기록을 남겨요':'카드를 끌어서 알맞은 칸에 놓아요';
 }

 const events=new AbortController();
 window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;
  if(!drag.ghost){
   if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
   const card=cardNodes.find(n=>n.item.id===drag!.id)!.b,r=card.getBoundingClientRect();
   const ghost=card.cloneNode(true) as HTMLElement;ghost.className='fungi-card fungi-ghost';ghost.removeAttribute('data-link-item');ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';
   document.body.append(ghost);drag.ghost=ghost;card.classList.add('is-lifted');select(drag.id);
  }
  drag.ghost.style.transform=`translate(${e.clientX-drag.dx}px,${e.clientY-drag.dy}px) rotate(-3deg) scale(1.04)`;
  const over=zoneAt(e.clientX,e.clientY);for(const {z} of zoneNodes)z.classList.toggle('is-over',z===over?.z);
 },{signal:events.signal});
 const drop=(e:PointerEvent,cancel=false)=>{
  if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=undefined;
  for(const {z} of zoneNodes)z.classList.remove('is-over');
  const card=cardNodes.find(n=>n.item.id===d.id)!.b;
  if(!d.ghost)return; // a tap: the click handler selects the card
  const zone=cancel?undefined:zoneAt(e.clientX,e.clientY);
  const ok=zone?attempt(d.id,zone.t.id):false;
  const ghost=d.ghost;
  if(ok){ghost.remove();card.classList.remove('is-lifted');}
  else{
   // Fly back to the hand.
   const r=card.getBoundingClientRect();ghost.classList.add('is-returning');ghost.style.transform=`translate(${r.left}px,${r.top}px)`;
   setTimeout(()=>{ghost.remove();card.classList.remove('is-lifted');},260);
   if(!zone){selected='';refresh();}
  }
  // The click that follows a drag must not toggle the selection again.
  justDragged=d.id;setTimeout(()=>{if(justDragged===d.id)justDragged='';},400);
 };
 window.addEventListener('pointerup',e=>drop(e),{signal:events.signal});
 window.addEventListener('pointercancel',e=>drop(e,true),{signal:events.signal});
 refresh();
 Promise.all([...root.querySelectorAll('img')].map(i=>i.decode())).then(()=>{if(!disposed)hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};
 return {refresh,showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:select,assignCard:attempt,assign:attempt,place:attempt,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;
 events.abort();
 document.querySelectorAll('.fungi-ghost').forEach(g=>g.remove());
 root.remove();}};
}
