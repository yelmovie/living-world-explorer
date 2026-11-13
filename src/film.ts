import {el,button,modal,reducedMotion} from './ui';
import {scoreStoryFilm} from './audio';

export type Film='intro'|'final';
const titles:Record<Film,string>={intro:'연구소의 의뢰 영상',final:'연구소 복구 영상'};

/** Full-screen story film. Captions are burned in; the VTT track repeats them for assistive tech. A missing film (offline) just continues. */
export function showFilm(name:Film,settings:{sound:boolean;reduced:boolean},onDone?:()=>void){
 const reduced=reducedMotion(settings.reduced);
 const video=el('video','film-video');video.src=`assets/film/${name}.mp4`;video.poster=`assets/film/${name}.webp`;video.playsInline=true;video.preload='auto';video.muted=!settings.sound;video.controls=reduced;video.setAttribute('aria-label',titles[name]);
 const track=el('track');track.kind='captions';track.srclang='ko';track.label='한국어';track.src=`assets/film/${name}.vtt`;video.append(track);
 // Tablets may refuse sound without a fresh tap; the picture and captions still carry the film.
 const play=()=>{void video.play().catch(()=>{video.muted=true;void video.play().catch(()=>{video.controls=true;});});};
 const dialog=modal(titles[name],[video,button('건너뛰기',()=>dialog.close(),'secondary film-skip')],{showClose:false});dialog.classList.add('film-dialog');
 const releaseScore=scoreStoryFilm(video,name==='intro'?'main':'ending');
 let wasPlaying=false;
 const visibility=()=>{if(document.hidden){wasPlaying=!video.paused;video.pause();}else if(wasPlaying){wasPlaying=false;play();}};document.addEventListener('visibilitychange',visibility);
 video.onended=()=>dialog.close();video.onerror=()=>dialog.close();
 dialog.addEventListener('close',()=>{video.onerror=null;video.pause();video.removeAttribute('src');video.load();releaseScore();document.removeEventListener('visibilitychange',visibility);onDone?.();},{once:true});
 if(!reduced)play();
 return dialog;
}
