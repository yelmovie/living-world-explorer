import type {InquiryRecord} from '../inquiry-model';
import {el} from '../ui';
import {playEffect} from '../audio';
import {totoSay} from '../toto-hint';
import {germShapes,bugKinds,JAR_GOAL,jarCount,jarSpecimens,addJarSpecimen} from '../germ-lab';
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const sprite=(kind:string,cls='')=>{const n=el('img',cls);n.src=`assets/study/germ/bug-${kind}.webp`;n.alt='';n.draggable=false;n.dataset.kind=kind;return n;};
const contains=(x:number,y:number,n:Element)=>{const b=n.getBoundingClientRect();return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;};

/** The drag picture belongs to the whole board, so the microscope never clips it on the way to a jar. */
export function catchGame(stage:HTMLElement,r:InquiryRecord,changed:()=>void,root:HTMLElement){
 const field=el('div','catch-field');field.setAttribute('aria-label','움직이는 세균이 보이는 현미경 시야');
 const status=el('p','catch-status','세균을 끌어 병에 넣어요. 눌러서 고른 뒤 병을 눌러도 돼요.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');field.append(status);
 const jars=el('div','catch-jars'),preview=el('span','catch-drag-preview');preview.hidden=true;preview.setAttribute('aria-hidden','true');
 const jarNodes=new Map<string,{b:HTMLButtonElement;count:HTMLElement;inside:HTMLElement}>();
 for(const s of germShapes){const b=el('button','catch-jar');b.type='button';b.dataset.jar=s.id;
  const glass=el('span','jar-glass'),inside=el('span','jar-inside'),count=el('b','jar-count');glass.append(sprite(s.id,'jar-guide'),inside);
  b.append(el('span','jar-lid'),glass,el('strong','',s.label),count);b.onclick=()=>{if(picked)drop(picked,s.id);};jars.append(b);jarNodes.set(s.id,{b,count,inside});
 }
 stage.append(field,jars,preview);
 type Bug={kind:typeof bugKinds[number];n:HTMLButtonElement;x:number;y:number;vx:number;vy:number;a:number;t:number;held:boolean;ignoreClick:boolean};
 const bugs:Bug[]=[];let picked:Bug|undefined,raf=0,last=0,disposed=false,abortDrag:(()=>void)|undefined;
 const life=new AbortController();
 const labels:Record<string,string>={round:'동그란 세균',chain:'동그란 알갱이가 이어진 세균',rod:'길쭉한 세균',tail:'꼬리 달린 길쭉한 세균',spiral:'꼬불꼬불한 세균'};
 const speed:Record<string,number>={round:.012,chain:.012,rod:.03,tail:.07,spiral:.04};
 function spawn(kind=bugKinds[Math.floor(Math.random()*bugKinds.length)]){
  const n=el('button','catch-bug');n.type='button';n.dataset.bug=kind.id;n.setAttribute('aria-label',labels[kind.id]);n.append(sprite(kind.id));
  const a=Math.random()*Math.PI*2,b:Bug={kind,n,x:.12+Math.random()*.76,y:.15+Math.random()*.6,vx:Math.cos(a)*speed[kind.id],vy:Math.sin(a)*speed[kind.id],a,t:Math.random()*10,held:false,ignoreClick:false};
  n.onclick=e=>{if(b.ignoreClick&&e.detail!==0){b.ignoreClick=false;return;}b.ignoreClick=false;select(picked===b?undefined:b);};n.onpointerdown=e=>grab(e,b);
  field.append(n);bugs.push(b);place(b);return b;
 }
 function place(b:Bug){b.n.style.left=`${b.x*100}%`;b.n.style.top=`${b.y*100}%`;b.n.style.transform=`translate(-50%,-50%) rotate(${b.a}rad)`;}
 function select(b?:Bug){picked=b;for(const o of bugs){o.n.classList.toggle('is-picked',o===b);o.n.setAttribute('aria-pressed',String(o===b));}jars.classList.toggle('is-armed',!!b);
  if(b){status.textContent=`${labels[b.kind.id]} 선택! 같은 모양의 표본병을 눌러요.`;playEffect('click');}
 }
 function grab(e:PointerEvent,b:Bug){
  if(e.button!==0||abortDrag||disposed||!bugs.includes(b))return;
  const sx=e.clientX,sy=e.clientY,stop=new AbortController();let moved=false;b.held=true;b.ignoreClick=false;b.n.setPointerCapture?.(e.pointerId);
  const clean=()=>{stop.abort();abortDrag=undefined;b.held=false;b.n.classList.remove('is-drag-source');preview.hidden=true;preview.replaceChildren();for(const j of jarNodes.values())j.b.classList.remove('is-over');if(b.n.hasPointerCapture?.(e.pointerId))b.n.releasePointerCapture(e.pointerId);};
  abortDrag=()=>{clean();if(moved&&!disposed){b.ignoreClick=true;select(b);status.textContent='세균을 놓았어요. 같은 모양 표본병을 눌러 이어가요.';}};
  window.addEventListener('pointermove',m=>{if(m.pointerId!==e.pointerId)return;
   if(!moved&&Math.hypot(m.clientX-sx,m.clientY-sy)<8)return;
   if(!moved){moved=true;select(b);b.n.classList.add('is-drag-source');preview.replaceChildren(sprite(b.kind.id));preview.dataset.kind=b.kind.id;preview.hidden=false;status.textContent='같은 모양 표본병 위에서 손을 떼요.';}
   const s=stage.getBoundingClientRect();preview.style.left=`${(m.clientX-s.left)*stage.clientWidth/s.width}px`;preview.style.top=`${(m.clientY-s.top)*stage.clientHeight/s.height}px`;
   for(const j of jarNodes.values())j.b.classList.toggle('is-over',contains(m.clientX,m.clientY,j.b));
  },{signal:stop.signal});
  const end=(u:PointerEvent)=>{if(u.pointerId!==e.pointerId)return;clean();if(!moved)return;b.ignoreClick=true;
   const hit=u.type==='pointerup'?[...jarNodes].find(([,j])=>contains(u.clientX,u.clientY,j.b)):undefined;
   if(hit)drop(b,hit[0]);else{select(b);status.textContent='세균을 놓았어요. 같은 모양 표본병을 눌러 이어가요.';}
  };
  window.addEventListener('pointerup',end,{signal:stop.signal});window.addEventListener('pointercancel',end,{signal:stop.signal});
 }
 function drop(b:Bug,jar:string){
  if(disposed||!bugs.includes(b))return;const j=jarNodes.get(jar)!;select();
  if(b.kind.jar!==jar){r.misses++;changed();playEffect('retry');j.b.classList.remove('is-wrong');void j.b.offsetWidth;j.b.classList.add('is-wrong');b.x=.5;b.y=.45;place(b);select(b);
   status.textContent='모양을 다시 비교해요. 고른 세균으로 다시 시도할 수 있어요.';
   totoSay(root,{text:b.kind.id==='chain'?'동그란 알갱이가 줄줄이 이어져 있어도 하나하나는 공 모양이야!':b.kind.id==='tail'?'꼬리가 달려 있어도 몸은 길쭉한 막대 모양이야.':b.kind.id==='spiral'?'꼬불꼬불 꼬여 있지? 나선 모양 병을 찾아봐!':`이 세균의 몸 모양을 다시 봐! ${germShapes.find(s=>s.id===b.kind.jar)!.label}이야.`,mood:'hint'});return;
  }
  if(jarCount(r,jar)>=JAR_GOAL){status.textContent='이 표본병은 두 마리를 다 모았어요. 다른 표본병도 채워 봐요.';return;}
  const newTail=b.kind.id==='tail'&&r.assignments.tail!=='yes';if(!addJarSpecimen(r,b.kind.id))return;
  bugs.splice(bugs.indexOf(b),1);b.n.remove();
  if(newTail)totoSay(root,{text:'꼬리 달린 세균 발견! 이 꼬리(편모)를 흔들며 움직여. 몸은 막대 모양이야.',mood:'cheer'});
  else if(germShapes.every(s=>jarCount(r,s.id)>=JAR_GOAL))totoSay(root,{text:'세 표본병이 다 찼어! 세균은 공·막대·나선처럼 여러 모양이야.',mood:'cheer'});
  playEffect('snap');changed();paintJars();status.textContent=germShapes.every(s=>jarCount(r,s.id)>=JAR_GOAL)?'세 표본병을 다 채웠어요! 발견 기록하기를 눌러요.':`${germShapes.find(s=>s.id===jar)!.label} 표본병에 ${jarCount(r,jar)} / ${JAR_GOAL}마리 담았어요.`;
  j.b.classList.remove('is-added');void j.b.offsetWidth;j.b.classList.add('is-added');spawn(jarCount(r,jar)>=JAR_GOAL?nextNeeded():b.kind);
 }
 const nextNeeded=()=>{const need=germShapes.find(s=>jarCount(r,s.id)<JAR_GOAL),pool=bugKinds.filter(k=>!need||k.jar===need.id);return pool[Math.floor(Math.random()*pool.length)];};
 function paintJars(){for(const s of germShapes){const j=jarNodes.get(s.id)!,n=jarCount(r,s.id),kinds=jarSpecimens(r,s.id);j.count.textContent=`${Math.min(n,JAR_GOAL)} / ${JAR_GOAL}`;j.b.classList.toggle('is-full',n>=JAR_GOAL);j.b.setAttribute('aria-label',`${s.label} 표본병 ${Math.min(n,JAR_GOAL)}마리${picked?' · 여기에 넣기':''}`);
   if(j.inside.dataset.specimens!==kinds.join(',')){j.inside.replaceChildren(...kinds.map(k=>sprite(k,'jar-bug')));j.inside.dataset.specimens=kinds.join(',');}
  }
 }
 for(const k of ['round','chain','round','rod','tail','rod','spiral','spiral'])spawn(bugKinds.find(b=>b.id===k)!);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('reduced');
 const tick=(now:number)=>{if(disposed)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
  for(const b of bugs){if(b.held||b===picked)continue;b.t+=dt;if(b.kind.id==='round'||b.kind.id==='chain'){b.vx+=(Math.random()-.5)*.02*dt;b.vy+=(Math.random()-.5)*.02*dt;}if(b.kind.id==='spiral')b.a+=Math.sin(b.t*3)*dt*.8;if(b.kind.id==='rod'||b.kind.id==='tail')b.a=Math.atan2(b.vy,b.vx);
   b.x+=b.vx*dt*(reduce?.3:1);b.y+=b.vy*dt*(reduce?.3:1);if(b.x<.07||b.x>.93){b.vx*=-1;b.x=clamp(b.x,.07,.93);}if(b.y<.1||b.y>.8){b.vy*=-1;b.y=clamp(b.y,.1,.8);}place(b);
  }raf=requestAnimationFrame(tick);
 };
 window.addEventListener('blur',()=>abortDrag?.(),{signal:life.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)abortDrag?.();},{signal:life.signal});
 raf=requestAnimationFrame(tick);paintJars();
 return {refresh:paintJars,dispose:()=>{disposed=true;abortDrag?.();life.abort();cancelAnimationFrame(raf);preview.remove();}};
}
