import type {Stage} from './model';
import {el,button,heading,paragraph,modal,reducedMotion} from './ui';
import captions from './concept-captions.json';

/** Caption cues of each concept clip: [start s, end s, sentence]. The same file writes the VTT tracks (films/publish-films.mjs). */
export const conceptCaptions=captions as Record<Stage,{duration:number;cues:[number,number,string][]}>;
export const captionAt=(stage:Stage,time:number)=>{const cues=conceptCaptions[stage].cues;return (cues.find(([start,end])=>time>=start&&time<end)??cues[cues.length-1])[2];};

export const concepts:Record<Stage,{title:string}>={
 M1:{title:'모양을 확대하면 특징이 보여요'},
 M2:{title:'한 방울 속 생물을 비교해요'},
 M3:{title:'설명에는 근거가 필요해요'},
 M4:{title:'어떤 상황인지 함께 생각해요'},
 M5:{title:'생물의 작용을 우리 생활에 이용해요'}
};

/** Replays are optional; closing a clip never changes or loses learning evidence. */
export function showConcept(stage:Stage,settings:{sound:boolean;reduced:boolean},onContinue?:()=>void){
 const concept=concepts[stage];const body=el('div','concept-body');
 const video=el('video','concept-video');video.src=`assets/concepts/${stage}.mp4`;video.poster=`assets/concepts/${stage}.webp`;video.controls=true;video.playsInline=true;video.preload='metadata';video.muted=!settings.sound;
 video.setAttribute('aria-label',`${concept.title} · ${conceptCaptions[stage].duration}초 개념 영상`);
 const track=el('track');track.kind='captions';track.srclang='ko';track.label='한국어';track.src=`assets/concepts/${stage}.vtt`;video.append(track);
 const still=reducedMotion(settings.reduced);
 // Reduced motion: no autoplay, the poster is the closing frame, so the caption shows the closing sentence with it.
 const caption=paragraph(still?captionAt(stage,conceptCaptions[stage].duration):captionAt(stage,0),'concept-caption');caption.setAttribute('aria-live','off');
 video.ontimeupdate=()=>{caption.textContent=captionAt(stage,video.currentTime);};
 const fallback=el('div','concept-fallback');fallback.hidden=true;fallback.append(heading('핵심 개념을 그림으로 살펴봐요'),...conceptCaptions[stage].cues.map(([,,text])=>paragraph(text)));
 video.onerror=()=>{video.hidden=true;fallback.hidden=false;caption.hidden=true;};
 const actions=el('div','concept-actions');
 actions.append(button('처음부터 보기',()=>{video.currentTime=0;void video.play().catch(()=>{});}),button(onContinue?'복구 보상 받기':'탐구로 돌아가기',()=>dialog.close(),'primary'));
 body.append(video,fallback,caption,actions);
 const dialog=modal(concept.title,[body],{showClose:false});dialog.classList.add('concept-dialog');
 const hidden=()=>{if(document.hidden)video.pause();};document.addEventListener('visibilitychange',hidden);
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();document.removeEventListener('visibilitychange',hidden);onContinue?.();},{once:true});
 if(!still)void video.play().catch(()=>{});
 return dialog;
}
