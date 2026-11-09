import {el} from '../ui';
import projection from './core-figure-anchors.json';
import type {CoreVisualState} from './core3d';

type PowerState=CoreVisualState['power'];
const powerLabels:Record<PowerState,string>={
 waiting:'전원 대기',linking:'기록 연결 중',ready:'가동 준비 완료',running:'코어 가동 중',powered:'복구 완료'
};

/** The local image remains usable while the live model loads, or if WebGL is unavailable. */
export function coreFigure(reduced:boolean){
 const element=el('figure','core-figure');
 const plate=el('figcaption','core-figure-plate');
 const state=el('span','core-figure-state',powerLabels.waiting);
 plate.append(el('strong','','BIO CORE'),state);
 const stage=el('div','core-figure-stage');
 stage.dataset.renderer='image';
 const live=el('div','core-live');
 live.setAttribute('aria-hidden','true');
 const frame=el('div','core-figure-frame');
 frame.style.setProperty('--figure-width',`${100*projection.width/projection.height}cqh`);
 frame.style.aspectRatio=`${projection.width} / ${projection.height}`;
 frame.setAttribute('aria-hidden','true');
 const art=el('img','core-figure-art'),powered=el('img','core-figure-art core-figure-powered');
 for(const [img,src] of [[art,'bio-core'],[powered,'bio-core-powered']] as const){
  img.src=`assets/ui/${src}.webp`;img.alt='';img.width=projection.width;img.height=projection.height;img.draggable=false;
 }
 const aura=el('span','core-figure-aura');
 aura.style.left=projection.crystal[0]+'%';aura.style.top=projection.crystal[1]+'%';
 const lamps=projection.lamps.map(([x,y],i)=>{
  const lamp=el('span','core-lamp core-channel');
  lamp.dataset.channel=String(i+1);
  lamp.style.left=x+'%';lamp.style.top=y+'%';
  lamp.append(el('span','core-lamp-dot'),el('span','core-lamp-number',String(i+1)));
  return lamp;
 });
 frame.append(art,powered,aura,...lamps);
 const fallback=el('p','core-figure-fallback','코어 그림을 불러오지 못했어요. 기록 연결 버튼은 사용할 수 있어요.');
 fallback.hidden=true;
 art.onerror=()=>{frame.hidden=true;fallback.hidden=false;};
 powered.onerror=()=>{powered.hidden=true;};
 stage.append(frame,live,fallback);element.append(plate,stage);
 let renderer:ReturnType<typeof import('./core3d').mountCore3d>,disposed=false;
 let visual:CoreVisualState={linked:[],power:'waiting',active:-1,fresh:-1};
 function useImage(){
  renderer=undefined;stage.dataset.renderer='image';
  lamps.forEach((lamp,i)=>{
   const [x,y]=projection.lamps[i];lamp.style.left=x+'%';lamp.style.top=y+'%';frame.append(lamp);
  });
 }
 void import('./core3d').then(({mountCore3d})=>{
  if(disposed)return;
  renderer=mountCore3d(live,lamps,reduced,useImage);
  if(!renderer)return;
  live.append(...lamps);stage.dataset.renderer='three';renderer.show(visual);
 }).catch(useImage);
 return {element,
  dispose(){disposed=true;renderer?.dispose();},
  show(linked:boolean[],power:PowerState,active=-1,fresh=-1){
   visual={linked,power,active,fresh};renderer?.show(visual);
   element.dataset.power=power;state.textContent=powerLabels[power];
   lamps.forEach((lamp,i)=>{
    lamp.classList.toggle('is-lit',!!linked[i]);
    lamp.classList.toggle('is-current',i===active);
    lamp.classList.toggle('just-linked',i===fresh);
   });
  }
 };
}
