import type {InquiryHooks,InquiryView} from './inquiry2d';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {artFor,magnifyFor} from '../artAssets';
import {observedKind} from '../observation';
import {el,paragraph} from '../ui';

/** Direct observation, without hidden targets, aiming or annotation gates. */
export function mountMicroscope(host:HTMLElement,task:InquiryTask,learner:InquiryRecord,hooks:InquiryHooks):InquiryView{
 let record=learner,disposed=false;
 const root=el('div','simple-observation'),viewport=el('div','observation-photo'),img=el('img'),loupe=el('div','observation-loupe'),caption=paragraph('','observation-caption');
 img.draggable=false;loupe.setAttribute('aria-hidden','true');viewport.append(img,loupe);root.append(viewport,caption,paragraph('AI 생성 관찰 모형 · 실제 현미경 사진이 아니에요.','observation-disclosure'));host.append(root);
 let active=false;
 const move=(e:PointerEvent)=>{if(!active||record.level>=2)return;const b=viewport.getBoundingClientRect(),x=Math.max(0,Math.min(b.width,e.clientX-b.left)),y=Math.max(0,Math.min(b.height,e.clientY-b.top));loupe.style.left=x+'px';loupe.style.top=y+'px';loupe.style.backgroundSize=b.width*2+'px '+b.height*2+'px';loupe.style.backgroundPosition=(-x*2+75)+'px '+(-y*2+75)+'px';};
 viewport.onpointerdown=e=>{if(document.querySelector('dialog[open]'))return;active=true;viewport.setPointerCapture(e.pointerId);move(e);};viewport.onpointermove=move;viewport.onpointerup=()=>{active=false;};viewport.onpointercancel=()=>{active=false;};
 function refresh(){
  if(disposed)return;const context=magnifyFor(task.organism,true);
  const kind=record.level<2?(record.level===0?context?.context:context?.lens)||task.organism:observedKind(task,record);
  const art=artFor(kind,record.level===0?context?.time:0);if(!art)return;
  img.alt=art.label;img.src=art.src;loupe.style.backgroundImage='url("'+art.src+'")';loupe.hidden=record.level>=2;
  img.style.filter=record.level>=2?'blur('+Math.abs(record.focus-65)/9+'px)':'none';
  viewport.dataset.mode=record.level<2?'lens':'microscope';root.dataset.captured=String(record.capture);
  caption.textContent=record.level<2?(context?.captions[record.level]||'돋보기를 움직여 생김새를 살펴봐요.'):task.organism==='mushroom'?'현미경으로 확대한 주름이에요. 주름 표면에 붙은 작은 알갱이가 포자예요.':task.organism==='mold'?'가는 실은 균사예요. 이 곰팡이의 둥근 포자주머니 안에는 포자가 들어 있어요.':'초록색 해캄은 여러 마디가 실처럼 이어져 있어요.';
 }
 img.onload=()=>{if(!disposed)hooks.ready(true);};img.onerror=()=>{if(!disposed)hooks.ready(false);};refresh();
 const idle=()=>{};const assign=()=>false;
 return {refresh,showFrame:frame=>{record={...learner,...frame.patch};refresh();},endDemo:()=>{record=learner;refresh();},setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:assign,assign,place:assign,animateRun:(_ok,finish)=>finish(),dispose:()=>{disposed=true;root.remove();}};
}
