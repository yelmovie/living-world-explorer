import type {Stage} from './model';
import {el,button,heading,paragraph,modal} from './ui';

export const concepts:Record<Stage,{title:string;beats:string[]}>={
 M1:{title:'모양을 확대하면 특징이 보여요',beats:['버섯과 곰팡이는 균류예요.','버섯의 갓 아래 주름, 곰팡이의 가는 실을 관찰해요.','생김새와 발견 장소를 함께 기록해요.']},
 M2:{title:'한 방울 속 생물을 비교해요',beats:['연못의 물 한 방울에도 작은 생물이 있어요.','해캄은 길게 이어지고, 짚신벌레는 위치가 달라져요.','같은 시야의 서로 다른 시점을 비교해요.']},
 M3:{title:'설명에는 근거가 필요해요',beats:['세균은 아주 작고 여러 모양이 있어요.','흙·물·생물의 몸 등 여러 곳에서 발견돼요.','모양 자료와 장소 자료를 구별해 설명에 연결해요.']},
 M4:{title:'어떤 상황인지 함께 생각해요',beats:['먹으려던 빵의 곰팡이는 음식 변질을 일으켜요.','균류와 세균은 낙엽의 물질을 분해하는 데 관여해요.','이름만으로 판단하지 않고, 상황과 영향을 살펴봐요.']},
 M5:{title:'생물의 작용을 우리 생활에 이용해요',beats:['우유에 특정 세균의 작용을 이용해 요구르트를 만들어요.','효모는 균류예요. 그 작용으로 빵 반죽이 부풀어요.','재료 → 생물의 작용 → 결과를 연결해 설명해요.']}
};

/** Replays are optional; closing a clip never changes or loses learning evidence. */
export function showConcept(stage:Stage,settings:{sound:boolean;reduced:boolean},onContinue?:()=>void){
 const concept=concepts[stage];const body=el('div','concept-body');
 const video=el('video','concept-video');video.src=`assets/concepts/${stage}.mp4`;video.poster=`assets/concepts/${stage}.webp`;video.controls=true;video.playsInline=true;video.preload='metadata';video.muted=!settings.sound;
 video.setAttribute('aria-label',`${concept.title} · 12초 개념 영상`);
 const track=el('track');track.kind='captions';track.srclang='ko';track.label='한국어';track.src=`assets/concepts/${stage}.vtt`;video.append(track);
 const caption=paragraph(concept.beats[0],'concept-caption');caption.setAttribute('aria-live','off');
 video.ontimeupdate=()=>{caption.textContent=concept.beats[Math.min(2,Math.floor(video.currentTime/4))];};
 const fallback=el('div','concept-fallback');fallback.hidden=true;fallback.append(heading('핵심 개념을 그림으로 살펴봐요'),...concept.beats.map(text=>paragraph(text)));
 video.onerror=()=>{video.hidden=true;fallback.hidden=false;caption.hidden=true;};
 const actions=el('div','concept-actions');
 actions.append(button('처음부터 보기',()=>{video.currentTime=0;void video.play().catch(()=>{});}),button(onContinue?'복구 보상 받기':'탐구로 돌아가기',()=>dialog.close(),'primary'));
 body.append(video,fallback,caption,actions);
 const dialog=modal(concept.title,[body],{showClose:false});dialog.classList.add('concept-dialog');
 const hidden=()=>{if(document.hidden)video.pause();};document.addEventListener('visibilitychange',hidden);
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();document.removeEventListener('visibilitychange',hidden);onContinue?.();},{once:true});
 if(!settings.reduced)void video.play().catch(()=>{});
 return dialog;
}
