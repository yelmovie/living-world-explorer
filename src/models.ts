import {el,button,paragraph,modal} from './ui';
import {inquiryArt} from './artAssets';

/** Meshy specimen models (assets/generated/models-20261025, reduced in Blender). Optional: every activity also works without them. */
export type ModelKey='mushroom'|'bread-mold'|'paramecium'|'yeast';
/** view: starting tilt/turn in radians, so each model opens on the side worth looking at. */
export const models:Record<ModelKey,{src:string;title:string;note:string;fallback:string;view?:[number,number]}>={
 mushroom:{src:'assets/models/mushroom.glb',title:'버섯 3D 모형',note:'‘아래에서 보기’를 누르고 갓 아래 주름을 확대해 봐요.',fallback:'mushroom'},
 'bread-mold':{src:'assets/models/bread-mold.glb',title:'빵 곰팡이 3D 모형',note:'가는 실(균사)과 끝의 둥근 부분(포자가 든 주머니)을 찾아봐요. 실제보다 아주 크게 키운 설명용 모형이에요.',fallback:'mold'},
 paramecium:{src:'assets/models/paramecium.glb',title:'짚신벌레 3D 모형',note:'몸 둘레의 섬모와 한쪽의 오목한 홈을 찾아봐요. 실제보다 아주 크게 키운 설명용 모형이에요.',fallback:'paramecium',view:[1.15,0]},
 yeast:{src:'assets/models/yeast.glb',title:'효모 3D 모형',note:'옆에 작은 혹이 붙어 자라는 모습을 볼 수 있어요. 실제보다 아주 크게 키운 설명용 모형이에요.',fallback:'yeast'}
};
/** Discovery cards and the 발견 도감 offer the model of the organism each activity is about. */
export const taskModel:Record<string,ModelKey>={'M1-2':'mushroom','M1-3':'bread-mold','M2-3':'paramecium','M5-2':'yeast'};

export function openModel(key:ModelKey){const reduced=document.documentElement.classList.contains('reduced');
 const info=models[key];const stage=el('div','model-stage');stage.setAttribute('role','img');stage.setAttribute('aria-label',`${info.title} · 끌어서 회전하고 휠이나 두 손가락으로 확대해요`);
 const status=paragraph('3D 모형을 불러오고 있어요…','model-status');status.setAttribute('role','status');stage.append(status);
 let viewer:import('./model-viewer').Viewer|undefined,closed=false;
 const turn=(label:string,dx:number,dy:number)=>button(label,()=>viewer?.rotate(dx,dy),'secondary');
 const controls=el('div','model-controls');controls.append(turn('왼쪽으로',-.5,0),turn('오른쪽으로',.5,0),turn('위에서 보기',0,.5),turn('아래에서 보기',0,-.5),button('처음 자리',()=>viewer?.reset(),'text-button'));
 const zoomTools=el('div','model-zoom');zoomTools.setAttribute('role','group');zoomTools.setAttribute('aria-label','화면 확대');
 const less=button('−',()=>viewer?.zoomBy(-1),'secondary',true),more=button('+',()=>viewer?.zoomBy(1),'secondary',true);
 less.setAttribute('aria-label','축소');more.setAttribute('aria-label','확대');
 less.title='작게 보기';more.title='가까이 보기 · 휠이나 두 손가락으로도 확대할 수 있어요';
 const scale=el('output','','1배');scale.setAttribute('aria-label','화면 확대 비율');scale.setAttribute('aria-live','off');
 zoomTools.append(less,scale,more);
 const dialog=modal(info.title,[stage,controls,paragraph(info.note,'model-note')]);dialog.classList.add('model-dialog');
 const heading=dialog.querySelector('h2')!;const header=el('div','model-heading');heading.before(header);header.append(heading,zoomTools);
 dialog.addEventListener('close',()=>{closed=true;viewer?.dispose();},{once:true});
 void import('./model-viewer').then(({mountViewer,MAX_MODEL_ZOOM})=>{
  const showZoom=(zoom:number)=>{scale.value=`${Number(zoom.toFixed(2))}배`;less.disabled=zoom<=1;more.disabled=zoom>=MAX_MODEL_ZOOM;};
  return mountViewer(stage,info.src,reduced,info.view,showZoom).then(v=>{showZoom(1);return v;});
 }).then(v=>{if(closed){v.dispose();return;}viewer=v;status.remove();}).catch(()=>{
  if(closed)return;status.textContent='3D 모형을 열지 못했어요. 처음 한 번은 인터넷이 연결된 상태에서 열어야 해요. 대신 그림으로 살펴봐요.';controls.hidden=true;zoomTools.hidden=true;
  const art=inquiryArt[info.fallback];if(art){const img=el('img','model-fallback');img.src=art.src;img.alt=art.label;stage.append(img);}});
 return dialog;
}
export function modelButton(taskId:string,label='3D로 돌려 보기'){const key=taskModel[taskId];return key?button(label,()=>openModel(key),'secondary model-open'):undefined;}
