import './concept-focus.css';
import type {Stage} from './model';
import {el,button,heading,paragraph,modal,reducedMotion} from './ui';
import captions from './concept-captions.json';

/** Caption cues of each concept clip: [start s, end s, sentence]. The same file writes the VTT tracks (films/publish-films.mjs). */
export const conceptCaptions=captions as Record<Stage,{duration:number;cues:[number,number,string][]}>;
export const cueIndexAt=(stage:Stage,time:number)=>{const cues=conceptCaptions[stage].cues;const i=cues.findIndex(([start,end])=>time>=start&&time<end);return i===-1?cues.length-1:i;};
export const captionAt=(stage:Stage,time:number)=>conceptCaptions[stage].cues[cueIndexAt(stage,time)][2];

export const concepts:Record<Stage,{title:string}>={
 M1:{title:'모양을 확대하면 특징이 보여요'},
 M2:{title:'한 방울 속 생물을 비교해요'},
 M3:{title:'설명에는 근거가 필요해요'},
 M4:{title:'어떤 상황인지 함께 생각해요'},
 M5:{title:'생물의 작용을 우리 생활에 이용해요'}
};

/** Words to remember; each one appears in that clip's caption sentences (tests/concept-captions.test.ts). */
export const conceptTerms:Record<Stage,string[]>={M1:['균류','균사','포자'],M2:['해캄','짚신벌레','섬모'],M3:['세균','모양','사는 곳'],M4:['음식 변질','분해','상황'],M5:['유산균','효모','생물의 작용']};
/** Scene buttons jump to the clip's scene boundaries (caption cues): replay → zoom with labels → one-line answer. Cue 0 is the opening question. */
export const conceptChapters=[{label:'관찰하기',cue:1},{label:'특징 연결',cue:2},{label:'기억하기',cue:3}] as const;
function focusWords(node:HTMLElement,text:string,terms:string[]){
 node.replaceChildren();let remaining=text;
 while(remaining){const matches=terms.map(term=>({term,index:remaining.indexOf(term)})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index||b.term.length-a.term.length);const match=matches[0];if(!match){node.append(remaining);break;}node.append(remaining.slice(0,match.index),el('mark','concept-keyword',match.term));remaining=remaining.slice(match.index+match.term.length);}
}
/** Replays are optional; closing a clip never changes or loses learning evidence. */
export function showConcept(stage:Stage,settings:{sound:boolean;reduced:boolean},onContinue?:()=>void){
 const concept=concepts[stage],{duration,cues}=conceptCaptions[stage];const still=reducedMotion(settings.reduced);
 const body=el('div','concept-body');body.dataset.reduced=String(still);
 const video=el('video','concept-video');video.src=`assets/concepts/${stage}.mp4`;video.poster=`assets/concepts/${stage}.webp`;video.controls=true;video.playsInline=true;video.preload='metadata';video.muted=!settings.sound;
 // 2026-11-10: the explainer's effects were mixed about 20 dB louder than the same effects in play; match the story films (desktop/Android; iPad ignores volume).
 video.volume=.35;
 video.setAttribute('aria-label',`${concept.title} · ${duration}초 개념 영상`);
 const track=el('track');track.kind='captions';track.srclang='ko';track.label='한국어';track.src=`assets/concepts/${stage}.vtt`;video.append(track);
 const caption=paragraph('','concept-caption');caption.setAttribute('aria-live','off');
 const focus=el('div','concept-focus');focus.append(el('small','','기억할 낱말'),...conceptTerms[stage].map(term=>el('strong','',term)));
 const chapters=el('nav','concept-chapters');chapters.setAttribute('aria-label','개념 장면 선택');
 const steps=conceptChapters.map(({label,cue},index)=>{const b=button(`${index+1} · ${label}`,()=>{video.currentTime=cues[cue][0];update();});b.dataset.start=String(cues[cue][0]);b.setAttribute('aria-label',`${index+1}번째 장면: ${cues[cue][2]}`);return b;});chapters.append(...steps);
 // Reduced motion: no autoplay and the poster is the closing frame, so start on the closing sentence and the 기억하기 step.
 function show(cue:number){focusWords(caption,cues[cue][2],conceptTerms[stage]);steps.forEach((b,i)=>conceptChapters[i].cue===cue?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));}
 function update(){show(cueIndexAt(stage,video.currentTime));}
 video.ontimeupdate=update;
 show(still?cues.length-1:0);
 const fallback=el('div','concept-fallback');fallback.hidden=true;fallback.append(heading('핵심 개념을 그림으로 살펴봐요'),...cues.map(([,,text])=>paragraph(text)));
 video.onerror=()=>{video.hidden=true;fallback.hidden=false;caption.hidden=true;steps.forEach(b=>b.disabled=true);};
 const actions=el('div','concept-actions');
 actions.append(button('처음부터 보기',()=>{video.currentTime=0;update();void video.play().catch(()=>{});}),button(onContinue?'복구 보상 받기':'탐구로 돌아가기',()=>dialog.close(),'primary'));
 body.append(video,fallback,focus,chapters,caption,actions);
 const dialog=modal(concept.title,[body],{showClose:false});dialog.classList.add('concept-dialog');
 const hidden=()=>{if(document.hidden)video.pause();};document.addEventListener('visibilitychange',hidden);
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();document.removeEventListener('visibilitychange',hidden);onContinue?.();},{once:true});
 if(!still)void video.play().catch(()=>{});
 return dialog;
}
