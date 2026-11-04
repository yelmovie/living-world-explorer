import {assignCard as applyCard} from '../inquiry-actions';
import type {InquiryItem,InquiryRecord,InquiryTask} from '../inquiry-model';
import {artFor,artKey,artTime} from '../artAssets';
import {playEffect} from '../audio';
import {canvas,draw} from '../draw';
import {el} from '../ui';
import type {InquiryHooks,InquiryView} from './inquiry2d';

type Side='left'|'right';
type Point={x:number;y:number};
const DRAG_START=8;// px of travel before a press counts as drawing a line rather than a tap.
const SVG='http://www.w3.org/2000/svg';

function picture(item:InquiryItem){
 const kind=artKey(item),art=artFor(kind,artTime(kind,item.detail,item.id));
 if(art){const img=el('img');img.src=art.src;img.alt='';img.draggable=false;return img;}
 const sketch=canvas(480,300);draw(sketch,kind||'question',{});sketch.setAttribute('aria-hidden','true');return sketch;
}
function port(side:Side){const dot=el('span','link-port');dot.dataset.side=side;dot.setAttribute('aria-hidden','true');return dot;}
function column(step:string,title:string,cls:string){
 const box=el('section','link-column '+cls),heading=el('h3','link-heading'),stack=el('div','link-stack');
 heading.append(el('span','link-step',step),el('span','',title));box.append(heading,stack);return {box,heading,stack};
}

/** DOM board for source-to-record links: fills the work area at any aspect ratio, and every card is a real button. */
export function mountLinkBoard(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 let armed='',fresh='',disposed=false;
 let drag:{id:string;start:Point;at:Point;moved:boolean;over:string}|undefined;
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 // Past four sources the records move to the middle, so six pictures stay as large as four.
 const split=task.items.length>4,leftCount=split?Math.ceil(task.items.length/2):task.items.length;
 const board=el('div','link-board');board.dataset.layout=split?'center':'side';if(task.targets.length<=2)board.dataset.notebook='';
 const lines=document.createElementNS(SVG,'svg');lines.classList.add('link-lines');lines.setAttribute('aria-hidden','true');
 const left=column('1','자료 고르기','link-sources'),right=split?column('1','자료 고르기','link-sources'):undefined,records=column('2','기록 칸 고르기','link-records');
 board.append(lines,left.box,records.box);if(right)board.append(right.box);

 const cards=task.items.map((item,i)=>{
  const side:Side=i<leftCount?'right':'left';
  const node=el('button','link-card');node.type='button';node.dataset.linkItem=item.id;
  const photo=el('span','link-photo');photo.append(picture(item));
  node.append(photo,el('span','link-name',item.label),port(side),el('span','link-mark'));
  node.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||blocked())return;const at={x:e.clientX,y:e.clientY};drag={id:item.id,start:at,at,moved:false,over:''};choose(item.id);});
  // Pointer presses already chose the card; detail 0 is the keyboard path.
  node.addEventListener('click',e=>{if(e.detail===0&&!blocked())choose(item.id);});
  (i<leftCount?left:right!).stack.append(node);
  return {item,node,side};
 });
 const targets=task.targets.map(target=>{
  const node=el('button','link-target');node.type='button';node.dataset.linkTarget=target.id;
  const filed=el('span','link-filed');
  node.append(port('left'),...split?[port('right')]:[],el('span','link-target-name',target.label),filed);
  node.addEventListener('click',()=>{if(blocked())return;if(armed)assign(armed,target.id);else hooks.feedback('자료 카드를 먼저 골라요.');});
  records.stack.append(node);
  return {target,node,filed,shown:''};
 });

 const placedOn=(item:InquiryItem)=>targets.find(t=>t.target.id===record.assignments[item.id]);
 function portAt(node:HTMLElement,side:Side):Point{
  const dot=node.querySelector(`.link-port[data-side=${side}]`)!.getBoundingClientRect(),frame=board.getBoundingClientRect();
  return {x:dot.left+dot.width/2-frame.left,y:dot.top+dot.height/2-frame.top};
 }
 function curve(a:Point,b:Point){const bend=Math.max(36,Math.abs(b.x-a.x)*.5),way=b.x>=a.x?1:-1;return `M${a.x} ${a.y}C${a.x+bend*way} ${a.y} ${b.x-bend*way} ${b.y} ${b.x} ${b.y}`;}
 function stroke(d:string,cls:string){const path=document.createElementNS(SVG,'path');path.setAttribute('d',d);path.setAttribute('class',cls);path.setAttribute('pathLength','1');return path;}
 function paintLines(){
  const frame=board.getBoundingClientRect(),paths:SVGPathElement[]=[];
  for(const {item,node,side} of cards){
   const moving=drag?.moved&&drag.id===item.id,placed=placedOn(item),inward:Side=side==='right'?'left':'right';
   const over=moving?targets.find(t=>t.target.id===drag!.over):undefined;
   const end=over?portAt(over.node,inward):moving?{x:drag!.at.x-frame.left,y:drag!.at.y-frame.top}:placed&&portAt(placed.node,inward);
   if(!end)continue;
   const state=moving?'is-draft':placed!.target.id===item.target?'is-right':'is-wrong',d=curve(portAt(node,side),end);
   paths.push(stroke(d,'link-halo'),stroke(d,`link-line ${state}${fresh===item.id?' is-new':''}`));
  }
  lines.replaceChildren(...paths);fresh='';
 }
 function update(){
  if(disposed)return;
  const next=armed?undefined:cards.find(({item})=>!record.opened.includes(item.id)||record.assignments[item.id]!==item.target);
  for(const card of cards){
   const {item,node}=card,placed=placedOn(item),right=placed?.target.id===item.target;
   node.classList.toggle('is-armed',armed===item.id);node.classList.toggle('is-next',card===next);
   node.classList.toggle('is-right',!!placed&&right);node.classList.toggle('is-wrong',!!placed&&!right);
   node.querySelector('.link-mark')!.textContent=placed?right?'✓':'!':'';
   node.setAttribute('aria-pressed',String(armed===item.id));
   node.setAttribute('aria-label',placed?`${item.label}, ${placed.target.label}에 연결됨`:item.label);
  }
  for(const slot of targets){
   const items=cards.filter(({item})=>record.assignments[item.id]===slot.target.id).map(c=>c.item),key=items.map(i=>i.id).join();
   if(key!==slot.shown||!slot.filed.childElementCount){
    slot.shown=key;
    slot.filed.replaceChildren(...items.length?items.map(item=>{const thumb=el('span','link-thumb');thumb.append(picture(item));return thumb;}):[el('span','link-empty','여기로 선을 이어요')]);
   }
   slot.node.classList.toggle('is-over',drag?.over===slot.target.id);
   slot.node.setAttribute('aria-label',items.length?`${slot.target.label}, 연결된 자료 ${items.map(i=>i.label).join(', ')}`:slot.target.label);
  }
  board.dataset.step=armed?'2':'1';
  left.heading.classList.toggle('is-current',!!next);right?.heading.classList.toggle('is-current',!!next);records.heading.classList.toggle('is-current',!!armed);
  paintLines();
 }
 function choose(id:string){armed=id;hooks.open(id);update();}
 function assign(id:string,target:string){
  if(disposed||document.hidden)return false;
  const item=task.items.find(it=>it.id===id);if(!item||!task.targets.some(t=>t.id===target))return false;
  if(!record.opened.includes(id))hooks.open(id);
  const changed=applyCard(task,record,id,target);
  armed='';hooks.assigned(id,target);
  if(changed){fresh=id;playEffect('snap');hooks.changed();}
  update();
  hooks.feedback(item.target===target?'단서를 알맞게 연결했어요.':task.feedback);
  return changed;
 }
 const listening=new AbortController(),{signal}=listening;
 window.addEventListener('pointermove',e=>{
  if(!drag||!e.isPrimary)return;
  drag.at={x:e.clientX,y:e.clientY};
  if(!drag.moved&&Math.hypot(drag.at.x-drag.start.x,drag.at.y-drag.start.y)<DRAG_START)return;
  drag.moved=true;
  const under=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('.link-target');
  drag.over=under?.dataset.linkTarget||'';update();
 },{signal});
 window.addEventListener('pointerup',e=>{
  if(!drag||!e.isPrimary)return;
  const {id,moved,over}=drag;drag=undefined;
  if(moved&&over&&!blocked())assign(id,over);else if(moved)update();
 },{signal});
 window.addEventListener('pointercancel',()=>{if(drag){drag=undefined;update();}},{signal});
 const resized=new ResizeObserver(paintLines);

 host.append(board);resized.observe(board);update();
 void Promise.all([...board.querySelectorAll('img')].map(img=>img.decode())).then(()=>{if(!disposed)hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};
 return {showFrame:idle,endDemo:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,animateRun:(_valid,finish)=>finish(),refresh:update,assignCard:assign,assign,place:assign,dispose:()=>{disposed=true;listening.abort();resized.disconnect();board.remove();}};
}
