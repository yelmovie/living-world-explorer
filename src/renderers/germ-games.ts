import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {artFor} from '../artAssets';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import {zoomSteps,zoomGuesses,zoomReach,germShapes,bugKinds,JAR_GOAL,jarCount,culturePlaces,CULTURE_GOAL,cultureDays,streaked,exhibitOrder,exhibitBlanks,germGuidance} from '../germ-lab';
// Board layout (full-width stage, no side panel) lives with the quiz board styles.
import '../quiz-board.css';
import '../germ-games.css';

/** 2026-11-17: M3 자료 연구실 hands-on bacteria lab ([4과12-01]).
 * M3-1 zoom dial · M3-2 catch moving bacteria into shape jars · M3-3 swab, streak and culture · M3-4 compare exhibit. */
type Game={dispose?:()=>void;refresh?:()=>void};
const img=(src:string,cls='',alt='')=>{const i=el('img',cls);i.src=src;i.alt=alt;i.draggable=false;return i;};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const inside=(x:number,y:number,n:Element)=>{const b=n.getBoundingClientRect();return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;};

export function mountGermGame(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:InquiryHooks):InquiryView{
 const root=el('section',`germ-game germ-${task.kind}`);root.inert=true;host.append(root);
 const tip=el('p','germ-tip');root.append(tip);
 const stage=el('div','germ-stage');root.append(stage);
 const changed=()=>{hooks.changed();paintTip();};
 const paintTip=()=>{const g=germGuidance(task,record);tip.textContent=g.done===g.total?'🎉 관찰 완료! 발견 기록이 열려요':g.action;tip.classList.toggle('is-done',g.done===g.total);};
 const game:Game=task.kind==='zoom'?zoomGame(stage,record,changed,root):task.kind==='catch'?catchGame(stage,record,changed,root):task.kind==='culture'?cultureGame(stage,record,changed,root):exhibitGame(stage,record,changed,root);
 paintTip();
 Promise.all([...root.querySelectorAll('img')].map(i=>i.decode().catch(()=>undefined))).then(()=>{root.inert=false;hooks.ready(true);});
 const idle=()=>{};const no=()=>false;
 return {refresh:()=>{game.refresh?.();paintTip();},showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:no,assign:no,place:no,animateRun:(_ok,done)=>done(),dispose:()=>{game.dispose?.();root.remove();}};
}

/** M3-1: predict the power, then turn the dial from a water drop on a slide down to bacteria beside a paramecium. */
function zoomGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const view=el('div','zoom-view');view.setAttribute('role','img');view.setAttribute('aria-label','물 한 방울을 확대해 보는 관찰 창');
 const drop=img(artFor('germDrop')!.src,'zoom-layer zoom-drop'),cell=img(artFor('paramecium')!.src,'zoom-layer zoom-cell'),field=img(artFor('germField')!.src,'zoom-layer zoom-field');
 const power=el('b','zoom-power'),note=el('p','zoom-note'),spark=el('span','zoom-spark','✨');spark.hidden=true;
 view.append(drop,cell,field,spark,power);
 const panel=el('div','zoom-panel');
 const ask=el('div','zoom-ask');ask.append(el('strong','','몇 배로 확대하면 세균이 보일까?'));
 const guesses=el('div','zoom-guesses');
 const guessButtons=zoomGuesses.map(g=>{const b=button(`${g}배`,()=>{if(r.assignments.found==='yes')return;r.assignments.guess=g;playEffect('click');changed();paint();},'secondary zoom-guess');b.dataset.guess=g;guesses.append(b);return b;});
 ask.append(guesses);
 const dial=el('input','zoom-dial') as HTMLInputElement;dial.type='range';dial.min='0';dial.max='3';dial.step='0.01';dial.setAttribute('aria-label','배율 다이얼');
 const less=button('− 줄이기',()=>turnTo(Math.round(z*4-1)/4),'secondary zoom-step'),more=button('+ 키우기',()=>turnTo(Math.round(z*4+1)/4),'primary zoom-step');
 const dialBox=el('div','zoom-dialbox');const steps=el('div','zoom-ticks');zoomSteps.forEach(s=>steps.append(el('span','',`×${s.power}`)));dialBox.append(el('strong','','배율 다이얼'),dial,steps,el('div','zoom-buttons'));dialBox.lastElementChild!.append(less,more);
 panel.append(ask,dialBox,note);stage.append(view,panel);
 let z=r.assignments.found==='yes'?3:clamp(zoomReach(r),0,3),said=-1;
 const layer=(n:HTMLElement,opacity:number,scale:number,blur=0)=>{n.style.opacity=String(clamp(opacity,0,1));n.style.transform=`scale(${scale})`;n.style.filter=blur>.05?`blur(${blur}px)`:'none';};
 function render(){
  // Drop: 1× to 10× on the same picture, then it dissolves into the paramecium at 100×, which in turn gives way to the 1000× field.
  layer(drop,1-clamp((z-1)/.5,0,1),1+z*3,clamp((z-.8)*6,0,4));
  layer(cell,clamp((z-1)/.5,0,1)*(1-clamp((z-2.45)/.45,0,1)),z<2?.55+(z-1)*.45:1+(z-2)*2.4,clamp(Math.abs(z-2)*3-1.2,0,3));
  layer(field,clamp((z-2.45)/.45,0,1),.75+clamp((z-2.45)/.55,0,1)*.25);
  power.textContent=`×${Math.round(10**z).toLocaleString()}`;dial.value=String(z);
  const i=clamp(Math.round(z),0,3);note.textContent=Math.abs(z-i)<.12?zoomSteps[i].note:'다이얼을 돌리는 중…';
 }
 function paint(){
  const guessed=!!r.assignments.guess;guessButtons.forEach(b=>{b.classList.toggle('selected',b.dataset.guess===r.assignments.guess);b.setAttribute('aria-pressed',String(b.dataset.guess===r.assignments.guess));});
  dial.disabled=less.disabled=more.disabled=!guessed;dialBox.classList.toggle('is-locked',!guessed);view.dataset.found=String(r.assignments.found==='yes');render();
 }
 function turnTo(v:number){
  if(!r.assignments.guess)return;z=clamp(v,0,3);const i=Math.floor(z+.02);
  if(i>zoomReach(r)){r.assignments.reach=String(i);playEffect(i===3?'sparkle':'focus');changed();}
  if(Math.abs(z-Math.round(z))<.05&&said!==Math.round(z)){said=Math.round(z);
   if(said===2&&r.assignments.found!=='yes')totoSay(root,{text:r.assignments.guess==='100'?'100배야! 짚신벌레는 보이는데… 세균은 어디 있지? 더 돌려 볼까?':'짚신벌레가 보여! 세균은 이것보다 훨씬 작대.',mood:'hint'});
   if(said===3&&r.assignments.found!=='yes')totoSay(root,{text:'짚신벌레 가장자리 옆에 아주 작은 것들이 보여! 하나를 콕 눌러 봐.',mood:'hint'});}
  render();
 }
 dial.oninput=()=>turnTo(Number(dial.value));
 const tap=(cx:number,cy:number)=>{
  if(z<2.9||r.assignments.found==='yes')return;const b=view.getBoundingClientRect(),x=(cx-b.left)/b.width;
  if(x<.28){r.misses++;changed();totoSay(root,{text:'그건 거대한 짚신벌레의 가장자리야! 그 옆에 떠 있는 작은 알갱이를 눌러 봐.',mood:'hint'});return;}
  spark.hidden=false;spark.style.left=`${x*100}%`;spark.style.top=`${(cy-b.top)/b.height*100}%`;
  r.assignments.found='yes';r.assignments.reach='3';playEffect('success');
  totoSay(root,{text:r.assignments.guess==='1000'?'예상이 딱 맞았어! 세균은 1000배쯤 확대해야 보여.':`${r.assignments.guess}배로는 안 보였지? 세균은 1000배쯤 확대해야 보일 만큼 작아!`,mood:'cheer'});
  changed();paint();
 };
 view.onclick=e=>tap(e.clientX,e.clientY);
 view.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&z>=2.9&&r.assignments.found!=='yes'){e.preventDefault();const b=view.getBoundingClientRect();tap(b.left+b.width*.62,b.top+b.height*.4);}};view.tabIndex=0;
 paint();
 return {refresh:paint};
}

/** M3-2: drag (or tap, then tap a jar) moving bacteria into the jar of the same shape. */
function catchGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const field=el('div','catch-field');field.setAttribute('aria-label','움직이는 세균이 보이는 현미경 시야');
 const jars=el('div','catch-jars');
 const jarNodes=new Map<string,{b:HTMLButtonElement;count:HTMLElement;inside:HTMLElement}>();
 for(const s of germShapes){const b=el('button','catch-jar');b.type='button';b.dataset.jar=s.id;const glass=el('span','jar-glass'),insideBox=el('span','jar-inside'),count=el('b','jar-count');glass.append(insideBox);b.append(el('span','jar-lid'),glass,el('strong','',`${s.label}`),count);b.onclick=()=>{if(picked)drop(picked,s.id);};jars.append(b);jarNodes.set(s.id,{b,count,inside:insideBox});}
 stage.append(field,jars);
 type Bug={kind:typeof bugKinds[number];n:HTMLButtonElement;x:number;y:number;vx:number;vy:number;a:number;t:number;held:boolean};
 const bugs:Bug[]=[];let picked:Bug|undefined,raf=0,last=0,disposed=false;
 const spriteSrc=(k:string)=>`assets/study/germ/bug-${k}.webp`;
 const labels:Record<string,string>={round:'동그란 세균',chain:'동그란 알갱이가 이어진 세균',rod:'길쭉한 세균',tail:'꼬리 달린 길쭉한 세균',spiral:'꼬불꼬불한 세균'};
 const speed:Record<string,number>={round:.012,chain:.012,rod:.03,tail:.07,spiral:.04};
 function spawn(kind=bugKinds[Math.floor(Math.random()*bugKinds.length)]){
  const n=el('button','catch-bug');n.type='button';n.dataset.bug=kind.id;n.setAttribute('aria-label',labels[kind.id]);n.append(img(spriteSrc(kind.id)));
  const a=Math.random()*Math.PI*2,b:Bug={kind,n,x:.12+Math.random()*.76,y:.15+Math.random()*.7,vx:Math.cos(a)*speed[kind.id],vy:Math.sin(a)*speed[kind.id],a,t:Math.random()*10,held:false};
  n.onclick=()=>{if(n.dataset.dragged)return;select(picked===b?undefined:b);};
  n.onpointerdown=e=>grab(e,b);
  field.append(n);bugs.push(b);place(b);return b;
 }
 function place(b:Bug){b.n.style.left=`${b.x*100}%`;b.n.style.top=`${b.y*100}%`;b.n.style.transform=`translate(-50%,-50%) rotate(${b.a}rad)`;}
 function select(b?:Bug){picked=b;bugs.forEach(o=>{o.n.classList.toggle('is-picked',o===b);o.n.setAttribute('aria-pressed',String(o===b));});jars.classList.toggle('is-armed',!!b);if(b)playEffect('click');}
 function grab(e:PointerEvent,b:Bug){
  if(e.button!==0)return;const sx=e.clientX,sy=e.clientY;let moved=false;const stop=new AbortController();
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;if(!moved&&Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;if(!moved){moved=true;b.held=true;select(b);}const f=field.getBoundingClientRect();
   // The bug can leave the field toward the jars while held.
   b.x=(m.clientX-f.left)/f.width;b.y=(m.clientY-f.top)/f.height;b.n.style.zIndex='5';place(b);jarNodes.forEach(j=>j.b.classList.toggle('is-over',inside(m.clientX,m.clientY,j.b)));},{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();jarNodes.forEach(j=>j.b.classList.remove('is-over'));if(!moved)return;b.held=false;b.n.style.zIndex='';b.n.dataset.dragged='1';setTimeout(()=>delete b.n.dataset.dragged,300);
   const hit=[...jarNodes].find(([,j])=>inside(u.clientX,u.clientY,j.b));if(hit&&u.type==='pointerup')drop(b,hit[0]);else{b.x=clamp(b.x,.06,.94);b.y=clamp(b.y,.08,.92);place(b);}};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function drop(b:Bug,jar:string){
  const j=jarNodes.get(jar)!;select();
  if(b.kind.jar!==jar){
   r.misses++;changed();playEffect('retry');j.b.classList.remove('is-wrong');void j.b.offsetWidth;j.b.classList.add('is-wrong');b.x=.5;b.y=.5;place(b);
   totoSay(root,{text:b.kind.id==='chain'?'동그란 알갱이가 줄줄이 이어져 있어도 하나하나는 공 모양이야!':b.kind.id==='tail'?'꼬리가 달려 있어도 몸은 길쭉한 막대 모양이야.':b.kind.id==='spiral'?'꼬불꼬불 꼬여 있지? 나선 모양 병을 찾아봐!':`이 세균의 몸 모양을 다시 봐! ${germShapes.find(s=>s.id===b.kind.jar)!.label}이야.`,mood:'hint'});return;
  }
  bugs.splice(bugs.indexOf(b),1);b.n.remove();
  r.assignments[`jar_${jar}`]=String(jarCount(r,jar)+1);
  if(b.kind.id==='tail'&&r.assignments.tail!=='yes'){r.assignments.tail='yes';totoSay(root,{text:'꼬리 달린 세균 발견! 이 꼬리(편모)를 흔들며 움직여. 몸은 막대 모양이야.',mood:'cheer'});}
  else if(germShapes.every(s=>jarCount(r,s.id)>=JAR_GOAL))totoSay(root,{text:'세 표본병이 다 찼어! 세균은 공·막대·나선처럼 여러 모양이야.',mood:'cheer'});
  playEffect('snap');changed();paintJars();spawn(b.kind.jar===jar&&jarCount(r,jar)>=JAR_GOAL?nextNeeded():b.kind);
 }
 const nextNeeded=()=>{const need=germShapes.find(s=>jarCount(r,s.id)<JAR_GOAL);const pool=bugKinds.filter(k=>!need||k.jar===need.id);return pool[Math.floor(Math.random()*pool.length)];};
 function paintJars(){for(const s of germShapes){const j=jarNodes.get(s.id)!,n=jarCount(r,s.id);j.count.textContent=`${Math.min(n,JAR_GOAL)} / ${JAR_GOAL}`;j.b.classList.toggle('is-full',n>=JAR_GOAL);j.b.setAttribute('aria-label',`${s.label} 표본병 ${n}마리`);
  if(j.inside.childElementCount!==Math.min(n,6)){j.inside.replaceChildren(...Array.from({length:Math.min(n,6)},(_,i)=>img(spriteSrc(s.id==='round'?(i%2?'chain':'round'):s.id==='rod'?(i===1&&r.assignments.tail==='yes'?'tail':'rod'):'spiral'),'jar-bug')));}}}
 for(const k of ['round','chain','round','rod','tail','rod','spiral','spiral'])spawn(bugKinds.find(b=>b.id===k)!);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('reduced');
 const tick=(now:number)=>{if(disposed)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
  for(const b of bugs){if(b.held||b===picked)continue;b.t+=dt;
   if(b.kind.id==='round'||b.kind.id==='chain'){b.vx+=(Math.random()-.5)*.02*dt;b.vy+=(Math.random()-.5)*.02*dt;}
   if(b.kind.id==='spiral')b.a+=Math.sin(b.t*3)*dt*.8;
   if(b.kind.id==='rod'||b.kind.id==='tail')b.a=Math.atan2(b.vy,b.vx);
   b.x+=b.vx*dt*(reduce?.3:1);b.y+=b.vy*dt*(reduce?.3:1);
   if(b.x<.07||b.x>.93){b.vx*=-1;b.x=clamp(b.x,.07,.93);}if(b.y<.1||b.y>.9){b.vy*=-1;b.y=clamp(b.y,.1,.9);}
   place(b);}
  raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);paintJars();
 return {refresh:paintJars,dispose:()=>{disposed=true;cancelAnimationFrame(raf);}};
}

/** M3-3: rub a swab on a place, streak it on a dish, then let the incubator run and compare with the clean control dish. */
function cultureGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const places=el('div','culture-places');const rack=el('div','culture-rack');const bench=el('div','culture-bench');
 const incubator=el('div','culture-incubator');const days=el('input','culture-days') as HTMLInputElement;days.type='range';days.min='0';days.max=String(cultureDays);days.step='0.05';days.setAttribute('aria-label','배양기 시간');
 const dayLabel=el('b','culture-daylabel');incubator.append(el('strong','','🌡️ 배양기 시간'),days,dayLabel);
 const verdict=el('div','culture-verdict');
 const safety=el('p','culture-safety','실제 배양 접시는 뚜껑을 열지 않고 선생님이 처리해요.');
 bench.append(rack,incubator,verdict,safety);stage.append(places,bench);
 const swab=img('assets/study/germ/swab.webp','culture-swab');swab.hidden=true;stage.append(swab);
 let loaded='';let day=Number(r.assignments.days)||0;const paths=new Map<string,[number,number][]>();
 const dishes=new Map<string,{n:HTMLButtonElement;c:HTMLCanvasElement}>();
 const placeLabel=(id:string)=>id==='control'?'빈 접시':culturePlaces.find(p=>p.id===id)!.label;
 function dish(id:string){
  if(dishes.has(id))return dishes.get(id)!;
  const n=el('button','culture-dish');n.type='button';n.dataset.dish=id;const c=el('canvas','dish-canvas') as HTMLCanvasElement;c.width=c.height=240;
  n.append(img('assets/study/germ/petri.webp','dish-glass'),c,el('span','dish-label',placeLabel(id)));rack.append(n);
  const d={n,c};dishes.set(id,d);
  if(id!=='control')n.onpointerdown=e=>streak(e,id);
  n.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&id!=='control'&&r.assignments[`dish_${id}`]==='loaded'){e.preventDefault();finishStreak(id,zigzag());}};
  return d;
 }
 const zigzag=():[number,number][]=>Array.from({length:9},(_,i)=>[.22+i*.07,i%2?.36:.66]);
 // A swab picks up a place by rubbing over its picture.
 for(const p of culturePlaces){
  const card=el('button','culture-place');card.type='button';card.dataset.place=p.id;card.append(img(artFor(p.art)!.src,'',p.label),el('strong','',p.label),el('span','place-check','✓'));
  card.onpointerdown=e=>rub(e,p.id,card);
  card.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')){e.preventDefault();pick(p.id);}};
  places.append(card);
 }
 function locked(){return day>0||!!r.assignments.conclusion;}
 function rub(e:PointerEvent,id:string,card:HTMLElement){
  if(e.button!==0||locked()||r.assignments[`dish_${id}`])return;let distance=0,lx=e.clientX,ly=e.clientY;const stop=new AbortController();swab.hidden=false;moveSwab(e.clientX,e.clientY);card.classList.add('is-rubbing');card.setPointerCapture?.(e.pointerId);
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;distance+=Math.hypot(m.clientX-lx,m.clientY-ly);lx=m.clientX;ly=m.clientY;moveSwab(m.clientX,m.clientY);card.style.setProperty('--rub',String(clamp(distance/140,0,1)));if(distance>=140){stop.abort();done();}},{signal:stop.signal});
  const done=()=>{swab.hidden=true;card.classList.remove('is-rubbing');card.style.removeProperty('--rub');pick(id);};
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();swab.hidden=true;card.classList.remove('is-rubbing');card.style.removeProperty('--rub');if(distance<140&&!r.assignments[`dish_${id}`])totoSay(root,{text:'면봉으로 그림 위를 쓱쓱 여러 번 문질러 봐!',mood:'hint'});};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function moveSwab(x:number,y:number){const s=stage.getBoundingClientRect();swab.style.left=`${x-s.left}px`;swab.style.top=`${y-s.top}px`;}
 function pick(id:string){if(locked()||r.assignments[`dish_${id}`])return;loaded=id;r.assignments[`dish_${id}`]='loaded';playEffect('water');changed();paint();dish(id).n.focus({preventScroll:true});}
 function streak(e:PointerEvent,id:string){
  if(e.button!==0||r.assignments[`dish_${id}`]!=='loaded')return;const d=dish(id),b=d.c.getBoundingClientRect(),pts:[number,number][]=[];let length=0;const stop=new AbortController();d.n.setPointerCapture?.(e.pointerId);
  const add=(x:number,y:number)=>{const p:[number,number]=[clamp((x-b.left)/b.width,.12,.88),clamp((y-b.top)/b.height,.12,.88)];const q=pts.at(-1);if(q)length+=Math.hypot((p[0]-q[0])*b.width,(p[1]-q[1])*b.height);pts.push(p);drawDish(id,pts,0);};
  add(e.clientX,e.clientY);
  window.addEventListener('pointermove',m=>{if(m.pointerId===e.pointerId)add(m.clientX,m.clientY);},{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();if(length>=150)finishStreak(id,pts);else{drawDish(id,[],0);totoSay(root,{text:'접시 위에 지그재그로 길게 그려야 해. 다시 그려 볼까?',mood:'hint'});}};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function finishStreak(id:string,pts:[number,number][]){paths.set(id,pts);r.assignments[`dish_${id}`]='streaked';loaded='';playEffect('snap');changed();paint();
  if(streaked(r).length>=CULTURE_GOAL&&!day)totoSay(root,{text:'접시가 준비됐어! 배양기 시간 손잡이를 밀어서 며칠 지나게 해 봐.',mood:'hint'});}
 // Colonies grow along the streak; the control dish stays clean.
 const colonyColor:Record<string,string[]>={hand:['#f4ecd2','#e9d9a8'],soil:['#e8b56a','#f2d9a3','#c98c4a'],pond:['#f6e38a','#efe9c8'],knob:['#f7f3e3','#e7ddc0'],bread:['#f0d080','#efe4cf','#d7b06a']};
 function drawDish(id:string,pts:[number,number][],growth:number){
  const {c}=dish(id),g=c.getContext('2d')!;g.clearRect(0,0,c.width,c.height);const W=c.width;
  if(pts.length>1&&growth<.15){g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=4;g.lineCap='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x*W,y*W):g.moveTo(x*W,y*W));g.stroke();}
  if(id==='control'||growth<=0||pts.length<2)return;
  let seed=id.length*97+pts.length;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const colors=colonyColor[id]||['#f2e6c4'];
  for(let i=0;i<pts.length-1;i++){const [x1,y1]=pts[i],[x2,y2]=pts[i+1];const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)*30));
   for(let k=0;k<n;k++){const t=rand(),x=(x1+(x2-x1)*t+(rand()-.5)*.05)*W,y=(y1+(y2-y1)*t+(rand()-.5)*.05)*W,size=(2+rand()*6)*growth;if(rand()>growth*1.1)continue;
    g.fillStyle=colors[Math.floor(rand()*colors.length)];g.strokeStyle='rgba(120,90,40,.35)';g.lineWidth=1;g.beginPath();g.arc(x,y,size,0,Math.PI*2);g.fill();g.stroke();}}
 }
 days.oninput=()=>{if(streaked(r).length<CULTURE_GOAL)return;day=Number(days.value);paintDishes();dayLabel.textContent=`${Math.floor(day)}일째`;
  if(day>=cultureDays&&r.assignments.days!==String(cultureDays)){r.assignments.days=String(cultureDays);playEffect('sparkle');changed();paint();totoSay(root,{text:'접시를 봐! 채집한 접시마다 세균 무리가 자랐어. 빈 접시는 어때?',mood:'cheer'});}};
 function paintDishes(){for(const id of dishes.keys()){if(id==='control'){drawDish(id,[],0);continue;}const state=r.assignments[`dish_${id}`];if(state==='streaked'){const pts=paths.get(id)||zigzag();paths.set(id,pts);drawDish(id,pts,clamp(day/cultureDays,0,1));}}}
 const conclusions=[{id:'many',label:'세균은 손·흙·물·물건처럼 여러 곳에 살아요'},{id:'soil',label:'세균은 흙에만 살아요'},{id:'dirty',label:'눈에 더러워 보이는 곳에만 살아요'}];
 function paint(){
  dish('control');for(const p of culturePlaces)if(r.assignments[`dish_${p.id}`])dish(p.id);
  for(const card of places.querySelectorAll<HTMLButtonElement>('.culture-place')){const id=card.dataset.place!;const st=r.assignments[`dish_${id}`];card.classList.toggle('is-sampled',!!st);card.disabled=locked()&&!st;card.setAttribute('aria-label',`${placeLabel(id)} ${st?'채집함':'면봉으로 문지르기'}`);}
  for(const [id,{n}] of dishes){const st=r.assignments[`dish_${id}`];n.classList.toggle('is-armed',st==='loaded');n.setAttribute('aria-label',`${placeLabel(id)} 배양 접시${st==='loaded'?' · 지그재그로 그리기':''}`);}
  const ready=streaked(r).length>=CULTURE_GOAL;incubator.classList.toggle('is-locked',!ready);days.disabled=!ready||!!r.assignments.conclusion;
  if(r.assignments.days===String(cultureDays))day=cultureDays;days.value=String(day);dayLabel.textContent=ready?`${Math.floor(day)}일째`:`${streaked(r).length} / ${CULTURE_GOAL} 접시 준비`;
  verdict.replaceChildren();
  if(r.assignments.days===String(cultureDays)){verdict.append(el('strong','','접시를 비교해 보니…'));const row=el('div','culture-choices');for(const c of conclusions){const b=button(c.label,()=>{if(r.assignments.conclusion==='many')return;if(c.id!=='many'){r.misses++;changed();playEffect('retry');totoSay(root,{text:c.id==='soil'?'흙 말고 다른 접시에도 세균 무리가 자랐는지 다시 봐!':'깨끗해 보이던 손과 문손잡이 접시에도 무리가 자랐어!',mood:'hint'});return;}r.assignments.conclusion='many';playEffect('success');changed();paint();totoSay(root,{text:'맞아! 세균은 눈에 안 보여도 우리 주변 거의 모든 곳에 살아.',mood:'cheer'});},'secondary');b.dataset.conclusion=c.id;b.classList.toggle('selected',r.assignments.conclusion===c.id);row.append(b);}verdict.append(row);}
  paintDishes();
 }
 paint();
 return {refresh:paint};
}

/** M3-4: order the three specimens biggest first, then finish a sentence about bacteria. */
function exhibitGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const specimens:Record<string,{label:string;art:string;seen:string}>={mushroom:{label:'버섯',art:'mushroom',seen:'눈으로 봤어요'},paramecium:{label:'짚신벌레',art:'paramecium',seen:'현미경 100배'},bacteria:{label:'세균',art:'bacteria',seen:'현미경 1000배'}};
 const shelf=el('div','exhibit-shelf');const tray=el('div','exhibit-tray');const sentence=el('div','exhibit-sentence');
 shelf.append(el('span','exhibit-arrow','큰 것 → 작은 것'));
 const slots=exhibitOrder.map((_,i)=>{const s=el('div','exhibit-slot');s.tabIndex=0;s.setAttribute('role','button');s.dataset.slot=String(i);s.append(el('span','slot-number',String(i+1)));s.onclick=()=>{if(solved())return;if(picked)put(picked,i);else if(order[i]){order[i]='';save();paint();}};s.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();s.click();}};shelf.append(s);return s;});
 stage.append(shelf,tray,sentence);
 let order:string[]=(r.assignments.order||'').split(',').concat(['','','']).slice(0,3);let picked='';
 const solved=()=>r.assignments.order===exhibitOrder.join(',');
 function card(id:string){const s=specimens[id];const b=el('button','exhibit-card');b.type='button';b.dataset.specimen=id;b.append(img(artFor(s.art)!.src,'',s.label),el('strong','',s.label),el('span','',s.seen));
  b.onclick=()=>{if(solved())return;if(b.dataset.dragged)return;picked=picked===id?'':id;playEffect('click');paint();};
  b.onpointerdown=e=>drag(e,id,b);return b;}
 function drag(e:PointerEvent,id:string,b:HTMLElement){
  if(e.button!==0||solved())return;const sx=e.clientX,sy=e.clientY,rect=b.getBoundingClientRect();let ghost:HTMLElement|undefined;const stop=new AbortController();
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;if(!ghost){if(Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;ghost=b.cloneNode(true) as HTMLElement;ghost.classList.add('exhibit-ghost');ghost.style.width=rect.width+'px';document.body.append(ghost);b.classList.add('is-lifted');}ghost.style.transform=`translate(${m.clientX-rect.width/2}px,${m.clientY-rect.height/2}px) rotate(-3deg)`;slots.forEach(s=>s.classList.toggle('is-over',inside(m.clientX,m.clientY,s)));},{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;stop.abort();slots.forEach(s=>s.classList.remove('is-over'));b.classList.remove('is-lifted');if(!ghost)return;ghost.remove();b.dataset.dragged='1';setTimeout(()=>delete b.dataset.dragged,300);const i=slots.findIndex(s=>inside(u.clientX,u.clientY,s));if(i>=0&&u.type==='pointerup')put(id,i);};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function put(id:string,i:number){order=order.map(o=>o===id?'':o);order[i]=id;picked='';playEffect('snap');
  if(order.every(Boolean)){if(order.join(',')===exhibitOrder.join(',')){playEffect('success');totoSay(root,{text:'완벽한 전시야! 세균은 1000배로 확대해야 보일 만큼 가장 작아.',mood:'cheer'});}
   else{r.misses++;playEffect('retry');totoSay(root,{text:'어느 생물이 가장 큰 배율에서야 보였는지 떠올려 봐! 많이 확대해야 보일수록 작은 거야.',mood:'hint'});slots.forEach(s=>{s.classList.remove('is-wrong');void s.offsetWidth;s.classList.add('is-wrong');});}}
  save();paint();}
 function save(){r.assignments.order=order.join(',');changed();}
 function paint(){
  const ok=solved();shelf.classList.toggle('is-solved',ok);tray.replaceChildren(...Object.keys(specimens).filter(id=>!order.includes(id)).map(card));
  slots.forEach((s,i)=>{s.querySelector('.exhibit-placed')?.remove();const id=order[i];if(id){const f=el('span','exhibit-placed');f.dataset.specimen=id;f.append(img(artFor(specimens[id].art)!.src,'',specimens[id].label),el('strong','',specimens[id].label),el('span','',specimens[id].seen));s.append(f);}s.classList.toggle('is-armed',!!picked&&!ok);s.setAttribute('aria-label',`${i+1}번째 자리 ${id?specimens[id].label:'비어 있음'}`);});
  tray.querySelectorAll<HTMLButtonElement>('.exhibit-card').forEach(b=>{b.classList.toggle('is-picked',b.dataset.specimen===picked);b.setAttribute('aria-pressed',String(b.dataset.specimen===picked));});
  sentence.hidden=!ok;sentence.replaceChildren();
  if(ok){sentence.append(el('strong','sentence-title','세균을 소개하는 문장을 완성해요'));const line=el('p','sentence-line');
   for(const blank of exhibitBlanks){if(blank.before)line.append(document.createTextNode(blank.before+' '));const group=el('span','sentence-blank');group.setAttribute('role','group');
    for(const o of blank.options){const b=button(o.label,()=>{if(r.assignments[`blank_${blank.id}`]===blank.answer)return;r.assignments[`blank_${blank.id}`]=o.id;if(o.id!==blank.answer){r.misses++;playEffect('retry');totoSay(root,{text:blank.id==='size'?'1000배로 확대해야 보였던 걸 떠올려 봐!':blank.id==='shape'?'표본병 세 개를 떠올려 봐!':'배양 접시 여러 개에서 무리가 자랐던 걸 떠올려 봐!',mood:'hint'});}else playEffect('snap');changed();paint();},'secondary sentence-option');b.dataset.blank=blank.id;b.dataset.option=o.id;const chosen=r.assignments[`blank_${blank.id}`]===o.id;b.classList.toggle('selected',chosen);b.classList.toggle('is-right',chosen&&o.id===blank.answer);b.classList.toggle('is-wrong',chosen&&o.id!==blank.answer);b.setAttribute('aria-pressed',String(chosen));group.append(b);}
    line.append(group);if('after' in blank&&blank.after)line.append(document.createTextNode(' '+blank.after+' '));else line.append(document.createTextNode(' '));}
   sentence.append(line);}
 }
 paint();
 return {refresh:paint};
}
