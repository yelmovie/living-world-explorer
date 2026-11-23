import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryRecord,InquiryTask} from '../inquiry-model';
import type {Point} from '../model';
import {artFor} from '../artAssets';
import {featureAt} from '../observation';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
// 2026-11-21: the board-screen layout (quiz-task: centred work area) lives in quiz-board.css; without this import it only arrived
// after a quiz screen had been opened, so a learner resuming straight into this game saw the work area stuck in the left column.
import '../quiz-board.css';
import '../scope-games.css';

/** 2026-11-16: the two M1 microscope activities each get their own gesture instead of the same focus-and-capture panel.
 * M1-2 mushroom: drag a hand lens to the gills, the view zooms into the microscope, then catch three spores by tapping.
 * M1-3 mold: turn a brass focus dial until the picture is sharp, then stick the 균사 and 포자주머니 name tags on the picture.
 * Both finish with the saved shape the evaluation expects (level 2, focus 65, light 65, capture). */
export function mountScopeGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 const mushroom=task.organism==='mushroom';
 let disposed=false;const timers:ReturnType<typeof setTimeout>[]=[];const later=(f:()=>void,ms:number)=>timers.push(setTimeout(()=>{if(!disposed)f();},ms));
 const root=el('section',`scope-game ${mushroom?'is-mushroom':'is-mold'}`);root.inert=true;host.append(root);
 const tip=el('p','scope-tip');const stage=el('div','scope-stage');const panel=el('aside','scope-panel');
 root.append(tip,stage);
 // Round eyepiece: the picture fills a circle (cover) inside the brass frame.
 const eye=el('div','scope-eye');const field=el('div','eye-field');const pic=el('img','eye-pic');pic.draggable=false;pic.alt='';
 const marks=el('div','eye-marks');const frame=el('img','eye-frame');frame.src='assets/ui/microscope-frame.webp';frame.alt='';frame.draggable=false;
 const flash=el('div','eye-flash');field.append(pic,marks,flash);eye.append(field,frame);
 /** Picture point under a screen point for an image shown with object-fit: cover in a square. */
 const box=()=>{const b=field.getBoundingClientRect();return {left:b.left+field.clientLeft,top:b.top+field.clientTop,width:field.clientWidth,height:field.clientHeight};};
 const toImage=(x:number,y:number):Point=>{const b=box(),a=pic.naturalWidth/pic.naturalHeight||16/9;const w=b.height*a;return {x:(x-b.left+(w-b.width)/2)/w,y:(y-b.top)/b.height};};
 const toView=(p:Point)=>{const b=box(),a=pic.naturalWidth/pic.naturalHeight||16/9;const w=b.height*a;return {left:(p.x*w-(w-b.width)/2)/b.width*100,top:p.y*100};};
 /** Finger-sized tolerance: tiny features count when the tap lands close to them; the closest hit wins. */
 /** Tolerance grows on small screens so a fingertip (about 16 px) is enough. */
 const shown=()=>field.clientHeight*(pic.naturalWidth/pic.naturalHeight||16/9)||600;
 const near=(kind:string,p:Point,want:string,min=.022)=>{const r=Math.max(min,16/shown()),step=Math.min(.006,r/4);let best:Point|undefined,bd=Infinity;
  for(let dx=-r;dx<=r;dx+=step)for(let dy=-r;dy<=r;dy+=step){const d=Math.hypot(dx,dy);if(d>r||d>=bd)continue;const q={x:p.x+dx,y:p.y+dy};if(featureAt(kind,q)===want){best=q;bd=d;}}
  return best;};
 const pin=(p:Point,cls:string,text:string)=>{const m=el('span',cls,text);const v=toView(p);m.style.left=v.left+'%';m.style.top=v.top+'%';marks.append(m);return m;};
 /** A placed name tag opens toward the side of the round lens with more room, so its word is not cut off. */
 const fitTag=(n:HTMLElement)=>{const w=marks.clientWidth,h=marks.clientHeight,r=Math.min(w,h)/2,half=n.offsetHeight/2,y=n.offsetTop;
  const spill=(end:number,inward:number)=>Math.max(...[[end,y],[end+inward,y-half],[end+inward,y+half]].map(([px,py])=>Math.hypot(px-w/2,py-h/2)-(r-4)));
  const right=spill(n.offsetLeft+n.offsetWidth,-half);if(right<=0)return;
  n.classList.add('is-flip');const left=spill(n.offsetLeft-n.offsetWidth,half);if(left>right)n.classList.remove('is-flip');};
 const miss=(x:number,y:number)=>{const b=box();const m=el('span','scope-miss','✕');m.style.left=(x-b.left)/b.width*100+'%';m.style.top=(y-b.top)/b.height*100+'%';marks.append(m);later(()=>m.remove(),700);};
 const capture=(say:string)=>{if(disposed||record.capture)return;record.level=2;record.focus=65;record.light=65;record.zoom=1;record.capture=true;hooks.changed();flash.classList.add('on');playEffect('capture');later(()=>flash.classList.remove('on'),500);totoSay(root,{text:say,mood:'cheer'});paint();};
 const progress=(steps:[string,boolean][])=>{const list=el('ol','scope-steps');steps.forEach(([t,done],i)=>{const li=el('li',done?'done':steps.findIndex(s=>!s[1])===i?'now':'');li.append(el('span','scope-step-n',done?'✓':String(i+1)),el('span','',t));list.append(li);});return list;};
 let paint:()=>void;

 if(mushroom){
  const lensView=el('div','lens-view');const photo=el('img','lens-photo');photo.src=artFor('mushroom')!.src;photo.alt=artFor('mushroom')!.label;photo.draggable=false;
  const lens=el('div','lens-glass');const handle=el('img','lens-handle');handle.src='assets/ui/hand-lens.webp';handle.alt='';handle.draggable=false;lens.append(handle);
  lensView.append(photo,lens);pic.src=artFor('mushroomSpores')!.src;
  let lp:Point={x:.22,y:.82},dwell:ReturnType<typeof setTimeout>|undefined,found=false;
  const placeLens=(p:Point)=>{lp={x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))};
  const b=lensView.getBoundingClientRect();
  lens.style.left=lp.x*100+'%';
  lens.style.top=lp.y*100+'%';
  lens.style.backgroundImage=`url("${photo.src}")`;
  lens.style.backgroundSize=`${b.width*2.4}px ${b.height*2.4}px`;
  const d=lens.offsetWidth/2;
  lens.style.backgroundPosition=`${-lp.x*b.width*2.4+d}px ${-lp.y*b.height*2.4+d}px`;
   // The glass counts as on the gills when they show anywhere in the inner part of the circle, not only under its centre.
   const rx=d*.45/b.width,ry=d*.45/b.height;
   const on=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].some(([x,y])=>featureAt('mushroom',{x:lp.x+x*rx,y:lp.y+y*ry})==='gills');
   lens.classList.toggle('is-on',on||found);clearTimeout(dwell);
   if(on&&!found)dwell=setTimeout(markFound,dragging?450:0);};
  // 2026-11-18: finding the gills no longer jumps on by itself; a button moves to the microscope when the child is ready.
  const markFound=()=>{if(disposed||found)return;found=true;playEffect('focus');totoSay(root,{text:'찾았다! 이 버섯 모형의 갓 아래 줄무늬를 주름이라고 해. 「현미경으로 보기」를 눌러 더 크게 보자!',mood:'cheer'});paint();};
  const toMicroscope=()=>{if(disposed||record.level>=2)return;playEffect('click');lensView.classList.add('zoom-out');later(()=>{record.level=2;record.focus=65;record.light=65;hooks.changed();paint();},prefersStill()?0:900);};
  const prefersStill=()=>document.documentElement.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dragging=false;
  lensView.onpointerdown=e=>{if(e.button!==0||record.level>=2)return;dragging=true;lensView.setPointerCapture(e.pointerId);const b=lensView.getBoundingClientRect();placeLens({x:(e.clientX-b.left)/b.width,y:(e.clientY-b.top)/b.height});};
  lensView.onpointermove=e=>{if(!dragging)return;const b=lensView.getBoundingClientRect();placeLens({x:(e.clientX-b.left)/b.width,y:(e.clientY-b.top)/b.height});};
  lensView.onpointerup=()=>{dragging=false;placeLens(lp);};lensView.onpointercancel=()=>{dragging=false;};
  field.onclick=e=>{
   if(record.level<2||record.capture||disposed)return;
   const p=toImage(e.clientX,e.clientY),hit=near('mushroomSpores',p,'spore');
   if(hit&&!record.marks.some(m=>Math.hypot(m.x-hit.x,m.y-hit.y)<.035)){record.marks.push(hit);record.marks=record.marks.slice(-8);hooks.changed();playEffect('snap');pin(hit,'scope-spore','✨');paint();
    if(record.marks.length>=3)later(()=>capture('포자 세 개를 잡았어! 주름에 붙은 이 작은 알갱이가 포자야. 찰칵, 사진도 남겼어.'),400);}
   else if(!hit){record.misses++;hooks.changed();playEffect('retry');miss(e.clientX,e.clientY);totoSay(root,{text:task.hints?.[1]||'사진을 다시 살펴봐!'});}
  };
  paint=()=>{
   const phase=record.capture?'done':record.level>=2?'spores':'lens';root.dataset.phase=phase;root.classList.toggle('is-found',found&&phase==='lens');
   stage.replaceChildren(phase==='lens'?lensView:eye,panel);
   tip.textContent=phase==='lens'?(found?'✅ 주름을 찾았어요! 「현미경으로 보기」를 눌러요':'🔍 돋보기를 끌어 갓 아래를 살펴봐요'):phase==='spores'?`✨ 작은 알갱이(포자)를 누르거나 관찰 확인 버튼으로 기록해요 · ${Math.min(3,record.marks.length)} / 3`:'👉 「발견 기록하기」를 눌러 기록을 남겨요';
   if(phase!=='lens'){marks.replaceChildren();record.marks.forEach(m=>pin(m,'scope-spore','✨'));}
   panel.replaceChildren(progress([['돋보기로 주름 찾기',found||record.level>=2],['현미경으로 포자 관찰하기',record.capture],['관찰 사진 남기기',record.capture]]),...phase==='lens'&&found?
     [button('현미경으로 보기 ▶',toMicroscope,'primary scope-next')]:[],...phase==='spores'?[el('p','scope-fact','주름 가장자리에 붙은 작은 알갱이(포자)를 살펴봐요.'),button('작은 알갱이(포자)를 확인했어요',()=>capture('이 버섯 모형의 주름에 붙은 작은 알갱이가 포자야. 관찰 사진을 남겼어.'),'primary spore-observe')]:[],...phase==='done'?[el('p','scope-fact','주름에 붙은 아주 작은 알갱이가 포자예요. 포자가 알맞은 곳에 닿으면 새 버섯이 자랄 수 있어요.')]:[]);
   if(phase==='lens')requestAnimationFrame(()=>placeLens(lp));
  };
  void Promise.all([photo,pic,handle,frame].map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;paint();hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 }else{
  pic.src=artFor('mold')!.src;
  const knob=el('img','focus-knob');knob.src='assets/ui/game/focus-knob.webp';knob.alt='';knob.draggable=false;
  const dial=el('div','focus-dial');dial.setAttribute('role','slider');dial.setAttribute('aria-label','초점 다이얼');dial.tabIndex=0;dial.append(knob);
  const meter=el('div','focus-meter');const meterFill=el('span');meter.append(meterFill);
  const turn=(d:number)=>{if(record.capture||sharp())return;record.focus=Math.max(35,Math.min(95,record.focus+d));if(Math.abs(record.focus-65)<=4){record.focus=65;playEffect('focus');totoSay(root,{text:'또렷해졌어! 이제 이름표를 알맞은 곳에 붙여 봐.',mood:'cheer'});}hooks.changed();paint();};
  const sharp=()=>Math.abs(record.focus-65)<=4;
  let last:number|undefined;
  dial.onpointerdown=e=>{if(e.button!==0)return;dial.setPointerCapture(e.pointerId);last=undefined;};
  dial.onpointermove=e=>{if(!dial.hasPointerCapture(e.pointerId))return;const b=dial.getBoundingClientRect();const a=Math.atan2(e.clientY-b.top-b.height/2,e.clientX-b.left-b.width/2)*180/Math.PI;if(last!==undefined){let d=a-last;if(d>180)d-=360;if(d<-180)d+=360;turn(d/6);}last=a;};
  dial.onpointerup=()=>{last=undefined;};
  dial.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp')turn(2);if(e.key==='ArrowLeft'||e.key==='ArrowDown')turn(-2);};
  const tags:{id:string;label:string;want:string;node:HTMLButtonElement}[]=[{id:'thread',label:'균사',want:'thread'},{id:'round',label:'포자주머니',want:'round'}].map(t=>{const b=el('button','name-tag');b.type='button';b.dataset.tag=t.id;b.textContent=t.label;return {...t,node:b};});
  let picked='',moldPhase='';
  const placedTag=(want:string)=>record.marks.find(m=>featureAt('mold',m)===want);
  /** Tries each point in turn (the tag's tip first, then the finger), so a tag dropped by its body still sticks. */
  const tryTag=(id:string,x:number,y:number,...more:[number,number][])=>{
   const t=tags.find(t=>t.id===id)!;if(placedTag(t.want)||!sharp())return;const hit=[[x,y],...more].map(([a,b])=>near('mold',toImage(a,b),t.want,.015)).find(Boolean);
   if(hit){record.marks.push(hit);hooks.changed();playEffect('snap');picked='';paint();if(placedTag('thread')&&placedTag('round'))later(()=>capture('이름표를 다 붙였어! 가는 실은 균사, 동그란 주머니 안에는 포자가 들어 있어. 찰칵!'),450);}
   else{record.misses++;hooks.changed();playEffect('retry');miss(x,y);t.node.classList.remove('is-shake');void t.node.offsetWidth;t.node.classList.add('is-shake');totoSay(root,{text:task.hints?.[1]||'이름표와 사진 속 모양을 비교해 봐!'});}
  };
  for(const t of tags){
   t.node.onpointerdown=e=>{if(e.button!==0||placedTag(t.want)||!sharp())return;const r=t.node.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,sx=e.clientX,sy=e.clientY;let ghost:HTMLElement|undefined;const stop=new AbortController();
    window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;
    if(!ghost){if(Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;
    ghost=t.node.cloneNode(true) as HTMLElement;
    ghost.classList.add('tag-ghost');
    document.body.append(ghost);
    t.node.classList.add('is-lifted');}
    ghost.style.transform=`translate(${m.clientX-dx}px,${m.clientY-dy}px) rotate(-5deg)`;},{signal:stop.signal});
    const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();t.node.classList.remove('is-lifted');if(!ghost)return;ghost.remove();t.node.dataset.dragged='1';later(()=>delete t.node.dataset.dragged,350);const b=field.getBoundingClientRect();
     // The tag's pointy end sits half its height left of the box, at the middle.
     const x=u.clientX-dx-r.height/2+4,y=u.clientY-dy+r.height/2;const pts=([[x,y],[u.clientX,u.clientY]] as [number,number][]).filter(([a,c])=>a>=b.left&&a<=b.right&&c>=b.top&&c<=b.bottom);if(u.type==='pointerup'&&pts.length)tryTag(t.id,pts[0][0],pts[0][1],...pts.slice(1));};
    window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});};
   t.node.onclick=()=>{if(t.node.dataset.dragged||placedTag(t.want)||!sharp())return;picked=picked===t.id?'':t.id;paint();};
  }
  field.onclick=e=>{if(!picked||record.capture)return;tryTag(picked,e.clientX,e.clientY);};
  paint=()=>{
   const focused=sharp(),both=!!placedTag('thread')&&!!placedTag('round'),phase=record.capture?'done':focused?'label':'focus';root.dataset.phase=phase;
   pic.style.filter=`blur(${Math.abs(record.focus-65)/5}px)`;knob.style.transform=`rotate(${(record.focus-35)*6}deg)`;meterFill.style.width=`${Math.max(0,100-Math.abs(record.focus-65)*3.3)}%`;dial.setAttribute('aria-valuenow',String(Math.round(record.focus)));
   const rebuild=phase!==moldPhase;moldPhase=phase;
   if(rebuild)stage.replaceChildren(eye,panel);
   tip.textContent=phase==='focus'?'🔧 초점 다이얼을 돌려 흐린 사진을 또렷하게 맞춰요':phase==='label'?'🏷 이름표를 끌어 사진 속 알맞은 곳에 붙여요':'👉 「발견 기록하기」를 눌러 기록을 남겨요';
   marks.replaceChildren();for(const t of tags){const m=placedTag(t.want);if(m)fitTag(pin(m,'scope-tag',t.label));t.node.hidden=!!m;t.node.classList.toggle('is-picked',picked===t.id);t.node.disabled=!focused;}
   if(!rebuild){panel.querySelectorAll('.scope-steps li').forEach((li,i)=>{const done=[focused||record.capture,both||record.capture,record.capture][i];li.className=done?'done':'';});return;}
   const tagBox=el('div','tag-box');tagBox.append(...tags.map(t=>t.node));
   panel.replaceChildren(progress([['초점 맞추기',focused||record.capture],['이름표 2개 붙이기',both||record.capture],['관찰 사진 남기기',record.capture]]),
    ...phase==='focus'?[dial,meter,el('div','focus-buttons')]:[],
    ...phase==='label'?[tagBox]:[],
    ...phase==='done'?[el('p','scope-fact','곰팡이 몸은 가는 실(균사)로 되어 있어요. 실 끝 동그란 주머니(포자주머니) 안에 포자가 들어 있어요.')]:[]);
   const btns=panel.querySelector('.focus-buttons');btns?.append(button('◀ 왼쪽으로',()=>turn(-3),'secondary'),button('오른쪽으로 ▶',()=>turn(3),'secondary'));
  };
  void Promise.all([pic,frame,knob].map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;paint();hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 }
 const idle=()=>{};const none=()=>false;
 return {refresh:()=>paint?.(),showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:none,assign:none,place:none,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;
 timers.forEach(clearTimeout);
 document.querySelectorAll('.tag-ghost').forEach(g=>g.remove());
 root.remove();}};
}
