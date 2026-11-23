import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {artFor} from '../artAssets';
import {el,button} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import {catchGame} from './germ-catch';
import {zoomSteps,zoomGuesses,zoomReach,germShapes,bugKinds,JAR_GOAL,jarCount,culturePlaces,CULTURE_GOAL,cultureDays,streaked,cultureWrongHint,exhibitOrder,exhibitBlanks,germGuidance} from '../germ-lab';
// Board layout (full-width stage, no side panel) lives with the quiz board styles.
import '../quiz-board.css';
import '../germ-games.css';
// Culture-dish colony pictures: one row of 96px cells per sheet, shared by every mount.
const COLONY_CELL=96;const colonyPics=new Map<string,HTMLImageElement>();
function colonySheet(name:string,repaint:()=>void){
 let pic=colonyPics.get(name);if(!pic){pic=new Image();pic.decoding='async';pic.src=`assets/study/germ/colonies-${name}.webp`;colonyPics.set(name,pic);}
 if(!pic.complete)pic.addEventListener('load',repaint,{once:true});return pic;
}

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
 // 2026-11-17: Toto's bubble celebrates; the tip only names the next step (the 「발견 기록하기」 button once done).
 const paintTip=()=>{tip.textContent=germGuidance(task,record).action;};
 const game:Game=task.kind==='zoom'?zoomGame(stage,record,changed,root):task.kind==='catch'?catchGame(stage,record,changed,root):task.kind==='culture'?cultureGame(stage,record,changed,root):exhibitGame(stage,record,changed,root);
 paintTip();
 Promise.all([...root.querySelectorAll('img')].map(i=>i.decode().catch(()=>undefined))).then(()=>{root.inert=false;hooks.ready(true);});
 const idle=()=>{};const no=()=>false;
 return {refresh:()=>{game.refresh?.();paintTip();},showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:no,assign:no,place:no,animateRun:(_ok,done)=>done(),dispose:()=>{game.dispose?.();root.remove();}};
}

/** M3-1: predict the power, then turn the dial from a water drop on a slide down to bacteria beside a paramecium.
 * 2026-11-18: real photomicrograph scenes (맨눈 → 돋보기 → 현미경 100배 → 1000배) joined by a focus pull, seen through a round eyepiece;
 * the paramecium swims, the bacteria jiggle, and each 「+ 키우기」 or tap on the picture moves one whole power. */
const zoomArt='assets/study/germ/';
const zoomScenes=[{src:'zoom-1',origin:'50.1% 50.8%',grow:3.4},{src:'zoom-10',origin:'50% 48%',grow:2.6},{src:'zoom-100',origin:'66% 31%',grow:3.6},{src:'zoom-1000',origin:'50% 50%',grow:0}] as const;
// Bacteria cut from the 1000× photograph: [x in atlas, width, height, centre x, centre y] on a 1672×941 frame, atlas 1041×62.
const bacteria:[number,number,number,number,number][]=[[0,59,39,.4871,.1111],[63,37,38,.9064,.1286],[104,95,51,.6414,.2067],[203,98,62,.8206,.2391],[305,36,36,.2877,.2295],[345,53,52,.4369,.3369],[402,62,44,.7344,.3464],[468,38,36,.9205,.4091],[510,39,57,.3269,.4458],[553,70,52,.622,.4931],[627,36,36,.4928,.5388],[667,37,35,.7712,.5393],[708,53,55,.2844,.6477],[765,57,39,.6349,.7253],[826,44,58,.8989,.7481],[874,81,62,.4219,.7705],[959,36,37,.3367,.8486],[999,38,37,.7996,.8507]];
const EDGE=.2;// the paramecium's edge fills the left fifth of the 1000× field
function zoomGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const reduced=document.documentElement.classList.contains('reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const view=el('div','zoom-view');view.setAttribute('role','img');view.setAttribute('aria-label','물 한 방울을 확대해 보는 관찰 창');
 const layers=zoomScenes.map((s,i)=>{const n=el('div',`zoom-layer zoom-scene-${i}`);n.style.transformOrigin=s.origin;n.append(img(`${zoomArt}${s.src}.webp`,'zoom-photo'));view.append(n);return n;});
 const swim=el('div','zoom-swim');swim.append(img(`${zoomArt}zoom-paramecium.webp`,'zoom-para','헤엄치는 짚신벌레'));layers[2].append(swim);
 const bugs=bacteria.map(([sx,w,h,cx,cy])=>{const n=el('span','zoom-bug');
 Object.assign(n.style,{left:`${cx*100}%`,top:`${cy*100}%`,width:`${w/1672*100}%`,aspectRatio:`${w}/${h}`,backgroundSize:`${1041/w*100}% ${62/h*100}%`,backgroundPosition:`${sx/(1041-w)*100}% 0%`});
 layers[3].append(n);
 return {n,cx,cy,x:0,y:0,vx:0,vy:0,a:0};});
 [2,9,13].forEach(i=>bugs[i].n.classList.add('zoom-bug-hint'));
 const eyepiece=el('div','zoom-eyepiece'),lensRing=el('div','zoom-lensring'),lens=el('span','zoom-lens');
 const power=el('b','zoom-power'),note=el('p','zoom-note'),spark=el('span','zoom-spark','✨');spark.hidden=true;
 view.append(lensRing,eyepiece,spark,lens,power);
 const panel=el('div','zoom-panel');
 const ask=el('div','zoom-ask');ask.append(el('strong','','이 모형에서 몇 배 시야에 세균이 나타날까?'));
 const guesses=el('div','zoom-guesses');
 const guessButtons=zoomGuesses.map(g=>{const b=button(`${g}배`,()=>{if(r.assignments.found==='yes')return;r.assignments.guess=g;playEffect('click');changed();paint();},'secondary zoom-guess');b.dataset.guess=g;guesses.append(b);return b;});
 ask.append(guesses);
 const dial=el('input','zoom-dial') as HTMLInputElement;dial.type='range';dial.min='0';dial.max='3';dial.step='0.01';dial.setAttribute('aria-label','배율 다이얼');
 const less=button('− 줄이기',()=>step(-1),'secondary zoom-step'),more=button('+ 키우기',()=>step(1),'primary zoom-step');
 const dialBox=el('div','zoom-dialbox');const steps=el('div','zoom-ticks');zoomSteps.forEach(s=>steps.append(el('span','',`×${s.power}`)));dialBox.append(el('strong','','배율 다이얼'),dial,steps,el('div','zoom-buttons'));dialBox.lastElementChild!.append(less,more);
 panel.append(ask,dialBox,note);stage.append(view,panel);
 const atlas=new Image();atlas.src=`${zoomArt}zoom-bacteria-sprites.webp`;
 let z=r.assignments.found==='yes'?3:clamp(zoomReach(r),0,3),goal=z,said=-1,raf=0,last=0,hintTimer=0,disposed=false;
 const smooth=(v:number,a:number,b:number)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
 const show=(n:HTMLElement,opacity:number,scale:number,blur:number)=>{n.style.opacity=String(opacity);n.style.visibility=opacity<.01?'hidden':'visible';n.style.transform=`scale(${scale})`;n.style.filter=blur>.1?`blur(${blur.toFixed(1)}px)`:'none';};
 function render(){
  // Each scene grows toward its focus point and goes soft; the next power comes in out of focus and sharpens, like turning a real objective.
  const i=Math.min(2,Math.floor(z)),t=z-i;
  layers.forEach((n,k)=>{
   if(k===i)show(n,1-smooth(t,.55,.95),1+smooth(t,0,1)*zoomScenes[k].grow,smooth(t,.35,.9)*7);
   else if(k===i+1)show(n,smooth(t,.5,.9),.84+.16*smooth(t,.45,1),(1-smooth(t,.55,1))*7);
   else show(n,0,1,0);
  });
  eyepiece.style.opacity=String(smooth(z,1.45,2));lensRing.style.opacity=String(smooth(z,.45,1)*(1-smooth(z,1.4,1.8)));
  view.dataset.level=String(Math.round(z));
  const shownPower=Math.round(10**z).toLocaleString();
  power.textContent=`×${shownPower}`;dial.value=String(z);
  dial.setAttribute('aria-valuetext',`${shownPower}배 · 학습 모형`);view.setAttribute('aria-label',`물 한 방울 관찰 창 · ${shownPower}배 · 학습 모형`);
  const near=clamp(Math.round(z),0,3);lens.textContent=zoomSteps[near].label;
  note.textContent=Math.abs(z-near)<.12?zoomSteps[near].note:'초점을 맞추는 중…';
 }
 function paint(){
  const guessed=!!r.assignments.guess;guessButtons.forEach(b=>{b.classList.toggle('selected',b.dataset.guess===r.assignments.guess);b.setAttribute('aria-pressed',String(b.dataset.guess===r.assignments.guess));});
  dial.disabled=!guessed;less.disabled=!guessed||goal<=0;more.disabled=!guessed||goal>=3;dialBox.classList.toggle('is-locked',!guessed);
  more.classList.toggle('is-next',guessed&&goal<3&&r.assignments.found!=='yes');ask.classList.toggle('is-next',!guessed);
  view.dataset.found=String(r.assignments.found==='yes');render();
 }
 function reached(){
  const i=Math.floor(z+.02);if(i>zoomReach(r)){r.assignments.reach=String(i);playEffect(i===3?'sparkle':'focus');changed();}
  if(Math.abs(z-Math.round(z))<.05&&said!==Math.round(z)){said=Math.round(z);clearTimeout(hintTimer);view.classList.remove('show-hint');
   if(said===2&&r.assignments.found!=='yes')totoSay(root,{text:r.assignments.guess==='100'?'100배야! 짚신벌레는 보이는데… 세균은 어디 있지? 더 돌려 볼까?':'짚신벌레가 보여! 세균은 이것보다 훨씬 작대.',mood:'hint'});
   if(said===3&&r.assignments.found!=='yes'){totoSay(root,{text:'짚신벌레 가장자리 옆에 아주 작은 것들이 보여! 하나를 콕 눌러 봐.',mood:'hint'});hintTimer=window.setTimeout(()=>view.classList.add('show-hint'),2500);}}
 }
 function set(v:number){z=clamp(v,0,3);reached();render();}
 // One whole power per press; quick presses add up because they count from where the dial is heading.
 function step(dir:number){if(!r.assignments.guess)return;goTo(clamp((dir>0?Math.floor(goal+.02):Math.ceil(goal-.02))+dir,0,3));}
 function goTo(target:number){
  goal=target;paint();if(reduced){set(goal);return;}
  if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}
 }
 function tick(now:number){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(Math.abs(goal-z)>.002)set(z+(goal-z)*Math.min(1,dt*4.2)+Math.sign(goal-z)*Math.min(Math.abs(goal-z),dt*.35));
  else if(z!==goal)set(goal);
  if(Math.abs(goal-z)<.002&&z!==goal)set(goal);
  if(!reduced&&z>2.3)jiggle(dt);
  raf=disposed||(Math.abs(goal-z)<.002&&(reduced||z<=2.3))?0:requestAnimationFrame(tick);
 }
 // Brownian motion: each bacterium wanders a little around its place and drifts back.
 function jiggle(dt:number){for(const b of bugs){b.vx+=(Math.random()-.5)*dt*60-b.x*dt*3;
 b.vy+=(Math.random()-.5)*dt*60-b.y*dt*3;
 b.vx*=.9;
 b.vy*=.9;
 b.x+=b.vx*dt*6;
 b.y+=b.vy*dt*6;
 b.a+=(Math.random()-.5)*dt*40;
 b.a*=.98;
 b.n.style.transform=`translate(-50%,-50%) translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px) rotate(${b.a.toFixed(1)}deg)`;}}
 dial.oninput=()=>{if(!r.assignments.guess)return;goal=Number(dial.value);set(goal);paint();if(!raf&&!reduced&&z>2.3){last=performance.now();raf=requestAnimationFrame(tick);}};
 dial.onchange=()=>{if(r.assignments.guess)goTo(Math.round(Number(dial.value)));};
 const tap=(cx:number,cy:number)=>{
  if(r.assignments.found==='yes')return;
  // No guess yet: the tip above already asks for one, so the three choices just flash again.
  if(!r.assignments.guess){ask.classList.remove('is-next');void ask.offsetWidth;ask.classList.add('is-next');playEffect('retry');return;}
  // Below 1000×, a tap on the picture is the same as 「+ 키우기」.
  if(goal<3){step(1);return;}
  if(z<3)set(3);
  const b=view.getBoundingClientRect(),x=(cx-b.left)/b.width,y=(cy-b.top)/b.height;
  if(x<EDGE){r.misses++;changed();totoSay(root,{text:'그건 거대한 짚신벌레의 가장자리야! 그 옆에 떠 있는 작은 알갱이를 눌러 봐.',mood:'hint'});return;}
  const hit=bugs.reduce((best,o)=>Math.hypot(o.cx-x,(o.cy-y)*.56)<Math.hypot(best.cx-x,(best.cy-y)*.56)?o:best);
  hit.n.classList.add('is-found');view.classList.remove('show-hint');clearTimeout(hintTimer);
  spark.hidden=false;spark.style.left=`${hit.cx*100}%`;spark.style.top=`${hit.cy*100}%`;
  r.assignments.found='yes';r.assignments.reach='3';playEffect('success');
  totoSay(root,{text:(r.assignments.guess==='1000'?'예상과 같았어! ':'예상과 달랐구나. ')+'이 모형에서는 1000배 시야로 세균을 살펴봐. 실제 관찰은 표본과 현미경 상태에 따라 달라.',mood:'cheer'});
  changed();paint();
 };
 view.onclick=e=>tap(e.clientX,e.clientY);
 view.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const b=view.getBoundingClientRect();tap(b.left+b.width*.62,b.top+b.height*.4);}};view.tabIndex=0;
 paint();if(!reduced&&z>2.3){last=performance.now();raf=requestAnimationFrame(tick);}
 return {refresh:paint,dispose:()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(hintTimer);}};
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
 const status=el('p','culture-status','그림을 눌러 크게 보고, 면봉으로 문질러요.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');bench.prepend(status);
 const detail=el('div','culture-detail');detail.hidden=true;detail.tabIndex=-1;detail.setAttribute('role','group');
 const detailPhoto=el('div','culture-detail-photo'),detailImage=img('','culture-detail-image');detailPhoto.append(detailImage);
 const detailName=el('strong','culture-detail-name'),detailHelp=el('span','culture-detail-help','그림 위를 쓱쓱 문질러요'),meter=el('div','culture-rub-meter'),meterFill=el('span'),meterLabel=el('b','culture-rub-label','0%');meter.append(meterFill,meterLabel);meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','면봉 채집 진행');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
 const close=button('×',()=>closeDetail(true),'culture-detail-close');close.setAttribute('aria-label','확대 그림 닫기');
 const collect=button('눌러서 면봉에 묻히기',()=>{if(focused)pick(focused);},'culture-collect');
 detail.append(detailPhoto,detailName,detailHelp,meter,collect,close);places.append(detail);
 let loaded='',focused='',ignoreCardClick='',ignoreDishClick='',activeCancel:(()=>void)|undefined,disposed=false;
 let day=Number(r.assignments.days)||0;const paths=new Map<string,[number,number][]>(),rubProgress=new Map<string,number>(),life=new AbortController();
 const dishes=new Map<string,{n:HTMLButtonElement;c:HTMLCanvasElement}>();
 const placeLabel=(id:string)=>id==='control'?'빈 접시':culturePlaces.find(p=>p.id===id)!.label;
 function closeDetail(refocus=false){activeCancel?.();const id=focused;focused='';detail.hidden=true;if(refocus&&id)places.querySelector<HTMLButtonElement>(`[data-place="${id}"]`)?.focus({preventScroll:true});}
 function openDetail(id:string){if(locked()||r.assignments[`dish_${id}`])return;focused=id;const p=culturePlaces.find(p=>p.id===id)!;detailImage.src=artFor(p.art)!.src;detailImage.alt=p.label;detailName.textContent=p.label;detail.setAttribute('aria-label',`${p.label} 확대 그림에서 면봉으로 채집하기`);detail.hidden=false;paintRub(id);detail.focus({preventScroll:true});}
 detail.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();closeDetail(true);}};
 detailPhoto.onpointerdown=e=>{if(focused)rub(e,focused,detailPhoto);};
 function dish(id:string){
  if(dishes.has(id))return dishes.get(id)!;
  const n=el('button','culture-dish');n.type='button';n.dataset.dish=id;const c=el('canvas','dish-canvas') as HTMLCanvasElement;c.width=c.height=240;
  n.append(img('assets/study/germ/petri.webp','dish-glass'),c,el('span','dish-label',placeLabel(id)));rack.append(n);const d={n,c};dishes.set(id,d);
  if(id!=='control')n.onpointerdown=e=>streak(e,id);
  n.onclick=()=>{if(ignoreDishClick===id){ignoreDishClick='';return;}if(!locked()&&r.assignments[`dish_${id}`]==='loaded')finishStreak(id,zigzag());};
  n.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&id!=='control'&&!locked()&&r.assignments[`dish_${id}`]==='loaded'){e.preventDefault();finishStreak(id,zigzag());}};
  return d;
 }
 const zigzag=():[number,number][]=>Array.from({length:9},(_,i)=>[.22+i*.07,i%2?.36:.66]);
 for(const p of culturePlaces){
  const card=el('button','culture-place');card.type='button';card.dataset.place=p.id;
  const picture=el('span','culture-place-picture');picture.append(img(artFor(p.art)!.src,'',p.label));card.append(picture,el('strong','',p.label),el('span','place-check','✓'));
  card.onpointerdown=e=>rub(e,p.id,picture);
  card.onclick=()=>{if(ignoreCardClick===p.id){ignoreCardClick='';return;}openDetail(p.id);};
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(p.id);}};places.insertBefore(card,detail);
 }
 function locked(){return day>0||!!r.assignments.conclusion;}
 function paintRub(id:string){const value=clamp(rubProgress.get(id)||0,0,1),card=places.querySelector<HTMLElement>(`[data-place="${id}"]`);card?.style.setProperty('--rub',String(value));if(focused===id){meterFill.style.width=`${value*100}%`;meterLabel.textContent=`${Math.round(value*100)}%`;meter.setAttribute('aria-valuenow',String(Math.round(value*100)));}}
 function rub(e:PointerEvent,id:string,area:HTMLElement){
  if(e.button!==0||locked()||r.assignments[`dish_${id}`]||activeCancel||disposed)return;
  const stop=new AbortController(),card=places.querySelector<HTMLElement>(`[data-place="${id}"]`)!;let lx=e.clientX,ly=e.clientY,moved=false;ignoreCardClick='';swab.hidden=false;moveSwab(lx,ly);card.classList.add('is-rubbing');area.setPointerCapture?.(e.pointerId);
  const clean=()=>{stop.abort();activeCancel=undefined;swab.hidden=true;card.classList.remove('is-rubbing');if(area.hasPointerCapture?.(e.pointerId))area.releasePointerCapture(e.pointerId);};activeCancel=clean;
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;const distance=Math.hypot(m.clientX-lx,m.clientY-ly);moved ||= distance>3;moveSwab(m.clientX,m.clientY);
   if(inside(lx,ly,area)&&inside(m.clientX,m.clientY,area)){const target=clamp(area.getBoundingClientRect().width*.9,80,160);rubProgress.set(id,clamp((rubProgress.get(id)||0)+distance/target,0,1));paintRub(id);}
   lx=m.clientX;ly=m.clientY;if((rubProgress.get(id)||0)>=1){ignoreCardClick=id;clean();pick(id);}
  },{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;clean();if(moved){ignoreCardClick=id;status.textContent=`${placeLabel(id)} 채집 ${Math.round((rubProgress.get(id)||0)*100)}%. 이어서 문질러도 돼요.`;}};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function moveSwab(x:number,y:number){const s=stage.getBoundingClientRect();swab.style.left=`${(x-s.left)*stage.clientWidth/s.width}px`;swab.style.top=`${(y-s.top)*stage.clientHeight/s.height}px`;}
 function pick(id:string){if(locked()||r.assignments[`dish_${id}`]||disposed)return;activeCancel?.();closeDetail();loaded=id;rubProgress.set(id,1);paintRub(id);r.assignments[`dish_${id}`]='loaded';playEffect('water');changed();paint();status.textContent=`${placeLabel(id)} 면봉이 준비됐어요! 이름이 같은 접시에 문지르거나 접시를 눌러요.`;dish(id).n.focus({preventScroll:true});}
 function streak(e:PointerEvent,id:string){
  if(e.button!==0||locked()||r.assignments[`dish_${id}`]!=='loaded'||activeCancel||disposed)return;
  const d=dish(id),b=d.c.getBoundingClientRect(),pts:[number,number][]=[...(paths.get(id)||[])],stop=new AbortController();let length=0,moved=false;ignoreDishClick='';d.n.setPointerCapture?.(e.pointerId);swab.hidden=false;moveSwab(e.clientX,e.clientY);
  const add=(x:number,y:number)=>{const nx=(x-b.left)/b.width,ny=(y-b.top)/b.height;if(Math.hypot(nx-.5,ny-.5)>.4)return;const p:[number,number]=[nx,ny],q=pts.at(-1);if(q)length+=Math.hypot((p[0]-q[0])*b.width,(p[1]-q[1])*b.height);pts.push(p);if(pts.length>200)pts.splice(1,1);paths.set(id,pts);drawDish(id,pts,0);};
  add(e.clientX,e.clientY);const clean=()=>{stop.abort();activeCancel=undefined;swab.hidden=true;if(d.n.hasPointerCapture?.(e.pointerId))d.n.releasePointerCapture(e.pointerId);};activeCancel=clean;
  window.addEventListener('pointermove',m=>{if(m.pointerId===e.pointerId){moved=true;moveSwab(m.clientX,m.clientY);add(m.clientX,m.clientY);}},{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;clean();if(moved)ignoreDishClick=id;if(u.type==='pointerup'&&length>=clamp(b.width,70,150))finishStreak(id,pts);else if(moved)status.textContent=`${placeLabel(id)} 접시에 선을 이어 그리거나 접시를 눌러 마무리해요.`;};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function finishStreak(id:string,pts:[number,number][]){if(disposed||locked()||r.assignments[`dish_${id}`]!=='loaded')return;activeCancel?.();paths.set(id,pts);r.assignments[`dish_${id}`]='streaked';loaded='';playEffect('snap');changed();paint();status.textContent=streaked(r).length>=CULTURE_GOAL?'접시가 준비됐어요. 배양기 시간 손잡이를 끝까지 밀어요.':`${placeLabel(id)} 접시 준비 완료! 다른 그림에서도 채집해요.`;
  if(streaked(r).length>=CULTURE_GOAL&&!day)totoSay(root,{text:'접시가 준비됐어! 배양기 시간 손잡이를 밀어서 며칠 지나게 해 봐.',mood:'hint'});}
 window.addEventListener('blur',()=>activeCancel?.(),{signal:life.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)activeCancel?.();},{signal:life.signal});
 // Colonies grow along the streak; the control dish stays clean.
 // 2026-11-21: each colony is a cut-out picture of a real-looking colony (one 96px cell of assets/study/germ/colonies-*.webp).
 // Until a picture has loaded the colony is drawn as a flat circle in its colour, and the dishes repaint when it arrives.
 const colonyColor:Record<string,string[]>={hand:['#f4ecd2','#e9d9a8'],soil:['#e8b56a','#f2d9a3','#c98c4a'],pond:['#f6e38a','#efe9c8'],knob:['#f7f3e3','#e7ddc0'],bread:['#f0d080','#efe4cf','#d7b06a']};
 const colonySheets:Record<string,string[]>={hand:['cream'],knob:['cream'],soil:['soil'],pond:['pond'],bread:['soil','cream']};
 function drawDish(id:string,pts:[number,number][],growth:number){
  const {c}=dish(id),g=c.getContext('2d')!;g.clearRect(0,0,c.width,c.height);const W=c.width;
  if(pts.length>1&&growth<.15){g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=4;g.lineCap='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x*W,y*W):g.moveTo(x*W,y*W));g.stroke();}
  if(id==='control'||growth<=0||pts.length<2)return;
  let seed=id.length*97+pts.length;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const colors=colonyColor[id]||['#f2e6c4'];
  const sheets=(colonySheets[id]||['cream']).map(name=>colonySheet(name,paintDishes));
  for(let i=0;i<pts.length-1;i++){const [x1,y1]=pts[i],[x2,y2]=pts[i+1];const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)*30));
   for(let k=0;k<n;k++){const t=rand(),x=(x1+(x2-x1)*t+(rand()-.5)*.05)*W,y=(y1+(y2-y1)*t+(rand()-.5)*.05)*W,size=(2+rand()*6)*growth;if(rand()>growth*1.1)continue;
    const color=colors[Math.floor(rand()*colors.length)],pick=rand()*sheets.length,pic=sheets[Math.floor(pick)];
    if(pic.complete&&pic.naturalWidth){const cells=Math.floor(pic.naturalWidth/COLONY_CELL),cell=Math.floor((pick%1)*cells),d=size*2.2;
     g.drawImage(pic,cell*COLONY_CELL,0,COLONY_CELL,COLONY_CELL,x-d/2,y-d/2,d,d);continue;}
    g.fillStyle=color;g.strokeStyle='rgba(120,90,40,.35)';g.lineWidth=1;g.beginPath();g.arc(x,y,size,0,Math.PI*2);g.fill();g.stroke();}}
 }
 days.oninput=()=>{if(streaked(r).length<CULTURE_GOAL)return;const wasComplete=Number(r.assignments.days)>=cultureDays;day=Number(days.value);if(day>0&&!detail.hidden)closeDetail();r.assignments.days=String(day);paintDishes();dayLabel.textContent=`${Math.floor(day)}일째`;changed();if(day>=cultureDays&&!wasComplete){playEffect('sparkle');paint();status.textContent='채집한 접시와 빈 접시를 비교해요.';totoSay(root,{text:'접시를 봐! 채집한 접시마다 세균 무리가 자랐어. 빈 접시는 어때?',mood:'cheer'});}};
 function paintDishes(){for(const id of dishes.keys()){if(id==='control'){drawDish(id,[],0);continue;}const state=r.assignments[`dish_${id}`];if(state==='streaked'){const pts=paths.get(id)||zigzag();paths.set(id,pts);drawDish(id,pts,clamp(day/cultureDays,0,1));}}}
 const conclusions=[{id:'many',label:'세균은 손·흙·물·물건처럼 여러 곳에 살아요'},{id:'soil',label:'세균은 흙에만 살아요'},{id:'dirty',label:'눈에 더러워 보이는 곳에만 살아요'}];
 function paint(){
  dish('control');for(const p of culturePlaces)if(r.assignments[`dish_${p.id}`])dish(p.id);
  for(const card of places.querySelectorAll<HTMLButtonElement>('.culture-place')){const id=card.dataset.place!;const st=r.assignments[`dish_${id}`];card.classList.toggle('is-sampled',!!st);card.disabled=locked()&&!st;card.setAttribute('aria-label',`${placeLabel(id)} ${st?'채집함':'확대해서 면봉으로 문지르기 · Enter로 채집'}`);}
  for(const [id,{n}] of dishes){const st=r.assignments[`dish_${id}`];n.classList.toggle('is-armed',st==='loaded');n.setAttribute('aria-label',`${placeLabel(id)} 배양 접시${st==='loaded'?' · 문지르거나 눌러서 바르기':''}`);}
  const ready=streaked(r).length>=CULTURE_GOAL;incubator.classList.toggle('is-locked',!ready);days.disabled=!ready||!!r.assignments.conclusion;
  if(r.assignments.days===String(cultureDays))day=cultureDays;days.value=String(day);dayLabel.textContent=ready?`${Math.floor(day)}일째`:`${streaked(r).length} / ${CULTURE_GOAL} 접시 준비`;
  verdict.replaceChildren();
  if(r.assignments.days===String(cultureDays)){verdict.append(el('strong','','접시를 비교해 보니…'));
  const row=el('div','culture-choices');
  for(const c of conclusions){const b=button(c.label,()=>{if(r.assignments.conclusion==='many')return;
  if(c.id!=='many'){r.misses++;
  changed();
  playEffect('retry');
  totoSay(root,{text:cultureWrongHint(r,c.id),mood:'hint'});
  return;}
  r.assignments.conclusion='many';
  playEffect('success');
  changed();
  paint();
  totoSay(root,{text:'맞아! 세균은 눈에 안 보여도 우리 주변 거의 모든 곳에 살아.',mood:'cheer'});},'secondary');
  b.dataset.conclusion=c.id;
  b.classList.toggle('selected',r.assignments.conclusion===c.id);
  row.append(b);}
  verdict.append(row);}
  paintDishes();
 }
 paint();
 return {refresh:paint,dispose:()=>{disposed=true;activeCancel?.();life.abort();swab.remove();}};
}

/** M3-4: order the three specimens biggest first, then finish a sentence about bacteria. */
function exhibitGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement):Game{
 const specimens:Record<string,{label:string;art:string;seen:string}>={mushroom:{label:'버섯',art:'mushroom',seen:'눈으로 봤어요'},paramecium:{label:'짚신벌레',art:'paramecium',seen:'현미경 100배'},bacteria:{label:'세균',art:'bacteria',seen:'현미경 1000배'}};
 const shelf=el('div','exhibit-shelf');const tray=el('div','exhibit-tray');const sentence=el('div','exhibit-sentence');
 shelf.append(el('span','exhibit-arrow','큰 것 → 작은 것'));
 const slots=exhibitOrder.map((_,i)=>{const s=el('div','exhibit-slot');
 s.tabIndex=0;
 s.setAttribute('role','button');
 s.dataset.slot=String(i);
 s.append(el('span','slot-number',String(i+1)));
 s.onclick=()=>{if(solved())return;
 if(picked)put(picked,i);else if(order[i]){order[i]='';
 save();
 paint();}};
 s.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();
 s.click();}};
 shelf.append(s);
 return s;});
 stage.append(shelf,tray,sentence);
 let order:string[]=(r.assignments.order||'').split(',').concat(['','','']).slice(0,3);let picked='';
 const solved=()=>r.assignments.order===exhibitOrder.join(',');
 function card(id:string){const s=specimens[id];const b=el('button','exhibit-card');b.type='button';b.dataset.specimen=id;b.append(img(artFor(s.art)!.src,'',s.label),el('strong','',s.label),el('span','',s.seen));
  b.onclick=()=>{if(solved())return;if(b.dataset.dragged)return;picked=picked===id?'':id;playEffect('click');paint();};
  b.onpointerdown=e=>drag(e,id,b);return b;}
 function drag(e:PointerEvent,id:string,b:HTMLElement){
  if(e.button!==0||solved())return;const sx=e.clientX,sy=e.clientY,rect=b.getBoundingClientRect();let ghost:HTMLElement|undefined;const stop=new AbortController();
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;
  if(!ghost){if(Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;
  ghost=b.cloneNode(true) as HTMLElement;
  ghost.classList.add('exhibit-ghost');
  ghost.style.width=rect.width+'px';
  document.body.append(ghost);
  b.classList.add('is-lifted');}
  ghost.style.transform=`translate(${m.clientX-rect.width/2}px,${m.clientY-rect.height/2}px) rotate(-3deg)`;
  slots.forEach(s=>s.classList.toggle('is-over',inside(m.clientX,m.clientY,s)));},{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;
  stop.abort();
  slots.forEach(s=>s.classList.remove('is-over'));
  b.classList.remove('is-lifted');
  if(!ghost)return;
  ghost.remove();
  b.dataset.dragged='1';
  setTimeout(()=>delete b.dataset.dragged,300);
  const i=slots.findIndex(s=>inside(u.clientX,u.clientY,s));
  if(i>=0&&u.type==='pointerup')put(id,i);};
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function put(id:string,i:number){order=order.map(o=>o===id?'':o);order[i]=id;picked='';playEffect('snap');
  if(order.every(Boolean)){if(order.join(',')===exhibitOrder.join(',')){playEffect('success');totoSay(root,{text:'완벽한 전시야! 이번 모형에서 본 세균은 짚신벌레보다 훨씬 작아.',mood:'cheer'});}
   else{r.misses++;playEffect('retry');totoSay(root,{text:'어느 생물이 가장 큰 배율에서야 보였는지 떠올려 봐! 많이 확대해야 보일수록 작은 거야.',mood:'hint'});slots.forEach(s=>{s.classList.remove('is-wrong');void s.offsetWidth;s.classList.toggle('is-wrong',order[Number(s.dataset.slot)]!==exhibitOrder[Number(s.dataset.slot)]);});order=order.map((id,i)=>id===exhibitOrder[i]?id:'');}}
  save();paint();}
 function save(){r.assignments.order=order.join(',');changed();}
 function paint(){
  const ok=solved();shelf.classList.toggle('is-solved',ok);tray.replaceChildren(...Object.keys(specimens).filter(id=>!order.includes(id)).map(card));
  slots.forEach((s,i)=>{s.querySelector('.exhibit-placed')?.remove();
  const id=order[i];
  if(id){const f=el('span','exhibit-placed');
  f.dataset.specimen=id;
  f.append(img(artFor(specimens[id].art)!.src,'',specimens[id].label),el('strong','',specimens[id].label),el('span','',specimens[id].seen));
  s.append(f);}
  s.classList.toggle('is-armed',!!picked&&!ok);
  s.setAttribute('aria-label',`${i+1}번째 자리 ${id?specimens[id].label:'비어 있음'}`);});
  tray.querySelectorAll<HTMLButtonElement>('.exhibit-card').forEach(b=>{b.classList.toggle('is-picked',b.dataset.specimen===picked);b.setAttribute('aria-pressed',String(b.dataset.specimen===picked));});
  sentence.hidden=!ok;sentence.replaceChildren();
  if(ok){sentence.append(el('strong','sentence-title','세균을 소개하는 문장을 완성해요'));const line=el('p','sentence-line');
   for(const blank of exhibitBlanks){if(blank.before)line.append(document.createTextNode(blank.before+' '));const group=el('span','sentence-blank');group.setAttribute('role','group');
    for(const o of blank.options){const b=button(o.label,()=>{if(r.assignments[`blank_${blank.id}`]===blank.answer)return;
    r.assignments[`blank_${blank.id}`]=o.id;
    if(o.id!==blank.answer){r.misses++;
    playEffect('retry');
    totoSay(root,{text:blank.id==='size'?'이번 모형에서 짚신벌레와 세균의 크기를 비교한 걸 떠올려 봐!':blank.id==='shape'?'표본병 세 개를 떠올려 봐!':'배양 접시 여러 개에서 무리가 자랐던 걸 떠올려 봐!',mood:'hint'});}else playEffect('snap');
    changed();
    paint();},'secondary sentence-option');
    b.dataset.blank=blank.id;
    b.dataset.option=o.id;
    const chosen=r.assignments[`blank_${blank.id}`]===o.id;
    b.classList.toggle('selected',chosen);
    b.classList.toggle('is-right',chosen&&o.id===blank.answer);
    b.classList.toggle('is-wrong',chosen&&o.id!==blank.answer);
    b.setAttribute('aria-pressed',String(chosen));
    group.append(b);}
    line.append(group);if('after' in blank&&blank.after)line.append(document.createTextNode(' '+blank.after+' '));else line.append(document.createTextNode(' '));}
   sentence.append(line);}
 }
 paint();
 return {refresh:paint};
}
