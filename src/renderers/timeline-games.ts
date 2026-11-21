import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryRecord,InquiryTask} from '../inquiry-model';
import type {Point} from '../model';
import {artFor} from '../artAssets';
import {addMark,markValid} from '../observation';
import {validTimelinePair} from '../inquiry-preparation';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import '../timeline-games.css';

/** 2026-11-16: the two before/after investigations of stage M4 each get their own gesture.
 * M4-1 bread: a time-lapse — drag the time handle (or play it) and watch mold grow, then tap the new mold on the last picture.
 * M4-2 leaf: a before/after wipe — slide the divider across the leaf, then tap where the leaf disappeared.
 * Both keep the saved shape (pins [0,3], marks in image coordinates, opened 'process'), so evaluation is unchanged. */
export function mountTimelineGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 const kind=task.organism||'bread',lapse=kind==='bread';
 let disposed=false,timer:ReturnType<typeof setInterval>|undefined;
 const root=el('section',`timeline-game ${lapse?'is-lapse':'is-wipe'}`);root.inert=true;host.append(root);
 const tip=el('p','timeline-tip');
 const frame=el('div','timeline-frame');const layers=[0,1,2,3].map(t=>{const img=el('img','timeline-layer');img.src=artFor(kind,t)!.src;img.alt=artFor(kind,t)!.label;img.draggable=false;return img;});
 const pins=el('div','timeline-pins');
 const note=el('aside','timeline-note');note.hidden=true;
 const noteText=lapse?'곰팡이가 자라 먹으려던 빵이 변질되었어요. 이렇게 변한 빵은 먹지 않아요.':'균류와 세균은 죽은 생물의 물질을 분해하는 데 관여해요. 그래서 낙엽이 조금씩 사라져요. 전후 모습만으로 어떤 생물이 관여했는지 모두 알 수는 없어요.';
 note.append(el('strong','',lapse?'📒 조사 자료: 빵이 왜 변했을까?':'📒 조사 자료: 낙엽은 어디로 갔을까?'),el('p','',noteText));
 const controls=el('div','timeline-controls');
 const found=()=>record.marks.filter(p=>markValid(task,record,p)).length;
 const paintPins=()=>pins.replaceChildren(...record.marks.map(p=>{const m=el('span','timeline-pin','🔍');m.style.left=p.x*100+'%';m.style.top=p.y*100+'%';return m;}));
 const say=()=>{tip.textContent=!validTimelinePair(record)?(lapse?'⏩ 시간 손잡이를 끝까지 밀어 빵이 어떻게 변하는지 봐요':'↔ 가운데 손잡이를 좌우로 밀어 처음과 나중을 비교해요'):!found()?(lapse?'👆 처음엔 없던 곰팡이를 큰 사진에서 콕 눌러요':'👆 처음엔 있었는데 사라진 잎 부분을 콕 눌러요'):'📄 옆의 조사 자료를 읽어 봐요';};
 const open=()=>{if(!found())return;note.hidden=false;if(!record.opened.includes('process')){record.opened.push('process');hooks.changed();}};
 const compare=()=>{if(validTimelinePair(record))return;record.pins=[0,3];record.time=3;hooks.changed();playEffect('capture');totoSay(root,{text:lapse?'시간이 지나니 빵 위에 무언가 생겼지? 처음 사진과 비교해 봐!':'나중 낙엽은 처음과 뭐가 달라졌을까? 사라진 곳을 찾아봐!',mood:'cheer'});};

 let paint:()=>void;
 if(lapse){
  // Time-lapse: four frames cross-fade with the handle; the first picture stays small in the corner for comparison.
  const thumb=el('figure','timeline-thumb');const ti=el('img');ti.src=artFor(kind,0)!.src;ti.alt='';thumb.append(ti,el('figcaption','','처음'));
  frame.append(...layers,thumb,pins);
  const range=el('input','timeline-range');range.type='range';range.min='0';range.max='3';range.step='0.01';range.value='0';range.setAttribute('aria-label','시간 손잡이');
  const marks=el('div','timeline-ticks');['처음','조금 뒤','더 뒤','나중'].forEach(t=>marks.append(el('span','',t)));
  const play=button('▶ 빨리 감기',()=>{if(timer){stop();return;}let v=0;range.value='0';set(0);play.textContent='⏸ 멈추기';timer=setInterval(()=>{v=Math.min(3,v+.04);range.value=String(v);set(v);if(v>=3)stop();},40);},'primary timeline-play');
  const stop=()=>{if(timer)clearInterval(timer);timer=undefined;play.textContent='▶ 빨리 감기';};
  const set=(v:number)=>{layers.forEach((l,i)=>l.style.opacity=String(i===0?1:Math.max(0,Math.min(1,v-i+1))));thumb.hidden=v<1;if(v>=2.98)compare();say();};
  range.oninput=()=>{stop();set(+range.value);};
  const track=el('div','timeline-track');track.append(range,marks);controls.append(play,track);
  paint=()=>{const v=validTimelinePair(record)?3:+range.value;range.value=String(v);set(v);paintPins();say();if(found())open();};
 }else{
  // Wipe: the "after" picture sits on top and is clipped at the divider.
  const before=layers[0],after=layers[3];const wipe=el('div','timeline-wipe');const handle=el('div','timeline-handle');handle.append(el('span','','◀ ▶'));
  frame.append(before,after,el('span','timeline-label before','처음'),el('span','timeline-label after','나중'),wipe,pins);wipe.append(handle);
  let pos=.5;const place=(v:number)=>{pos=Math.max(0,Math.min(1,v));after.style.clipPath=`inset(0 0 0 ${pos*100}%)`;wipe.style.left=pos*100+'%';};
  let dragging=false,moved=0;
  handle.onpointerdown=e=>{if(e.button!==0)return;dragging=true;moved=0;handle.setPointerCapture(e.pointerId);e.stopPropagation();};
  handle.onpointermove=e=>{if(!dragging)return;const b=frame.getBoundingClientRect();const v=(e.clientX-b.left)/b.width;moved+=Math.abs(v-pos);place(v);if(moved>.35)compare();say();};
  handle.onpointerup=()=>{dragging=false;};handle.onpointercancel=()=>{dragging=false;};
  const nudge=(d:number)=>{place(pos+d);moved+=Math.abs(d);if(moved>.35)compare();say();};
  controls.append(button('◀ 처음 더 보기',()=>nudge(.2),'secondary'),button('나중 더 보기 ▶',()=>nudge(-.2),'secondary'));
  place(.5);paint=()=>{if(validTimelinePair(record))moved=1;paintPins();say();if(found())open();};
 }
 // Tapping the picture marks a change. Before comparing, Toto asks to compare first.
 frame.onclick=e=>{
  if(disposed||document.querySelector('dialog[open]'))return;
  if((e.target as HTMLElement).closest('.timeline-handle,.timeline-thumb'))return;
  if(!validTimelinePair(record)){totoSay(root,{text:lapse?'먼저 시간 손잡이를 끝까지 밀어 변화를 봐!':'먼저 가운데 손잡이를 밀어 처음과 나중을 비교해 봐!'});return;}
  // 2026-11-21: the small 「처음」 picture lets taps through (pointer-events: none), so a tap on it used to count as a miss on the big picture behind it.
  const small=frame.querySelector<HTMLElement>('.timeline-thumb:not([hidden])')?.getBoundingClientRect();
  if(small&&e.clientX>=small.left&&e.clientX<=small.right&&e.clientY>=small.top&&e.clientY<=small.bottom){totoSay(root,{text:'작은 사진은 처음 모습이야. 큰 사진에서 곰팡이를 찾아 눌러 봐!'});return;}
  const b=layers[0].getBoundingClientRect();const p:Point={x:(e.clientX-b.left)/b.width,y:(e.clientY-b.top)/b.height};
  // Fingertip tolerance (about 16 px on screen): the closest changed spot near the tap counts.
  const r=16/b.width,step=Math.min(.006,r/4);let hit:Point|undefined,bd=Infinity;
  for(let dx=-r;dx<=r;dx+=step)for(let dy=-r*b.width/b.height;dy<=r*b.width/b.height;dy+=step){const d=Math.hypot(dx,dy*b.height/b.width);if(d>r||d>=bd)continue;const q={x:p.x+dx,y:p.y+dy};if(markValid(task,{...record,marks:[]},q)){hit=q;bd=d;}}
  if(hit&&addMark(task,record,hit)){playEffect('snap');paintPins();hooks.changed();open();say();totoSay(root,{text:lapse?'맞아! 처음엔 없던 곰팡이가 생겼어.':'맞아! 그 부분이 사라졌어.',mood:'cheer'});}
  else{playEffect('retry');record.misses++;hooks.changed();const miss=el('span','timeline-miss','✕');miss.style.left=p.x*100+'%';miss.style.top=p.y*100+'%';pins.append(miss);setTimeout(()=>miss.remove(),700);totoSay(root,{text:task.hints?.[1]||'처음 사진과 비교해 달라진 곳을 다시 찾아봐!'});}
 };
 const stage=el('div','timeline-stage');stage.append(frame,note);
 root.append(tip,stage,controls);
 Promise.all(layers.map(i=>i.decode())).then(()=>{if(disposed)return;root.inert=false;paint();hooks.ready(true);},()=>{if(!disposed)hooks.ready(false);});
 const idle=()=>{};const none=()=>false;
 return {refresh:()=>paint?.(),showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:none,assign:none,place:none,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;if(timer)clearInterval(timer);root.remove();}};
}
