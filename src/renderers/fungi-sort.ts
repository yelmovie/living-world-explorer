import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {artFor,artKey,artTime} from '../artAssets';
import {assignCard} from '../inquiry-actions';
import {el,paragraph} from '../ui';
import {playEffect} from '../audio';

/** One evidence card at a time. Drag anywhere into a large tray, or tap card then tray. */
export function mountFungiSort(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 let selected='',disposed=false,drag:{id:string;pointer:number;x:number;y:number;moved:boolean}|undefined;
 const root=el('div','fungi-sort'),cards=el('div','fungi-sort-cards'),trays=el('div','fungi-sort-trays');
 root.append(paragraph('특징 카드를 알맞은 칸에 놓아요. 카드와 칸을 차례로 눌러도 돼요.','sort-instruction'),cards,trays);host.append(root);
 const choose=(id:string)=>{if(blocked())return;selected=id;hooks.open(id);refresh();};
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 const cardNodes=task.items.map(item=>{
  const b=el('button','fungi-sort-card');b.type='button';b.dataset.linkItem=item.id;const art=artFor(artKey(item),artTime(artKey(item),item.detail,item.id));if(art){const img=el('img');img.src=art.src;img.alt='';img.draggable=false;b.append(img);}
  b.append(el('strong','',item.label),el('span','sort-placed'));
  b.onpointerdown=e=>{if(blocked()||e.button!==0)return;choose(item.id);drag={id:item.id,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);};
  b.onclick=e=>{if(e.detail===0)choose(item.id);};cards.append(b);return {item,b};
 });
 const targetNodes=task.targets.map(t=>{const b=el('button','fungi-sort-tray');b.type='button';b.dataset.linkTarget=t.id;b.append(el('strong','',t.label),el('span','sort-tray-items'));b.onclick=()=>{if(selected)assign(selected,t.id);else hooks.feedback('특징 카드를 먼저 골라요.');};trays.append(b);return {t,b};});
 function assign(id:string,target:string){if(blocked())return false;const changed=assignCard(task,record,id,target);selected='';hooks.assigned(id,target);hooks.changed();refresh();const ok=task.items.find(i=>i.id===id)?.target===target;playEffect(ok?'snap':'retry');hooks.feedback(ok?'관찰한 특징을 알맞게 분류했어요.':task.feedback,ok?'success':'retry');return changed;}
 function refresh(){if(disposed)return;
  for(const {item,b} of cardNodes){const target=task.targets.find(t=>t.id===record.assignments[item.id]);b.classList.toggle('is-selected',selected===item.id);b.classList.toggle('is-correct',!!target&&target.id===item.target);b.setAttribute('aria-pressed',String(selected===item.id));b.querySelector('.sort-placed')!.textContent=target?'놓은 칸: '+target.label:'끌어서 놓기';}
  for(const {t,b} of targetNodes){const items=task.items.filter(i=>record.assignments[i.id]===t.id);b.querySelector('.sort-tray-items')!.textContent=items.length?items.map(i=>i.label).join(' · '):'여기에 놓아요';}
 }
 const events=new AbortController();
 window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;for(const {b} of targetNodes){const r=b.getBoundingClientRect();b.classList.toggle('is-over',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}}, {signal:events.signal});
 window.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=undefined;for(const {t,b} of targetNodes){const r=b.getBoundingClientRect();b.classList.remove('is-over');if(d.moved&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)assign(d.id,t.id);}}, {signal:events.signal});
 window.addEventListener('pointercancel',()=>{drag=undefined;targetNodes.forEach(({b})=>b.classList.remove('is-over'));},{signal:events.signal});
 refresh();Promise.all([...root.querySelectorAll('img')].map(i=>i.decode())).then(()=>{if(!disposed)hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};return {refresh,showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:choose,assignCard:assign,assign,place:assign,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;events.abort();root.remove();}};
}
