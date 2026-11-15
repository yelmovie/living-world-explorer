import {el} from '../ui';
import './scope-view.css';

/** Non-interactive details for both the DOM and canvas microscope views. */
export function mountScopeDecor(view:HTMLElement,kind:'water'|'forest'){
 const decor=el('div','scope-decor');
 decor.hidden=true;decor.dataset.specimen=kind;
 const badge=el('span','scope-status');
 const observers=el('div','scope-observers');
 observers.setAttribute('aria-hidden','true');
 for(const who of ['moa','toto']){
  const img=el('img',`scope-observer scope-observer-${who}`);
  img.alt='';img.decoding='async';img.draggable=false;
  img.dataset.observer=who;observers.append(img);
 }
 decor.append(observers,badge);view.append(decor);
 return {
  show(mode:'scope'|'eye'|null,captured=false){
   decor.hidden=!mode;
   view.toggleAttribute('data-scope-active',mode==='scope');
   view.toggleAttribute('data-eye-active',mode==='eye');
   if(!mode)return;
   const label=mode==='eye'?'눈으로 보는 중':captured?'관찰 사진 · 촬영 완료':'현미경 관찰 중';
   if(badge.textContent!==label)badge.textContent=label;
   for(const img of observers.querySelectorAll('img')){
    const src=`assets/ui/${img.dataset.observer}-${mode==='scope'?'microscope':'naked-eye'}.webp`;
    if(img.getAttribute('src')!==src)img.src=src;
   }
  },
  dispose(){decor.remove();view.removeAttribute('data-scope-active');view.removeAttribute('data-eye-active');},
 };
}
