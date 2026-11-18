import type {InquiryTask} from './inquiry-model';
import {el,button} from './ui';
import {playEffect,playVoiceLine,voiceLineSeconds,stopNarration,type NarrationState} from './audio';
import './toto-hint.css';

/** What a renderer sends when Toto should speak by himself (a wrong drop, a correct answer). */
export type TotoSay={text:string;mood?:'hint'|'cheer'};
export function totoSay(from:Element,say:TotoSay){from.dispatchEvent(new CustomEvent<TotoSay>('toto-say',{bubbles:true,detail:say}));}

/** 2026-11-16: the rabbit guide Toto. Tap for a hint, tap again for a clearer one; he pops up by himself after a mistake
 * and wiggles when the learner has not touched anything for a while. */
export function mountTotoHint(shell:HTMLElement,task:InquiryTask):HTMLElement{
 const hints=task.hints!;
 const box=el('div','toto-hint');
 const toggle=el('button','toto-hint-toggle');toggle.type='button';toggle.setAttribute('aria-label','토토에게 힌트 듣기');toggle.setAttribute('aria-expanded','false');
 const face=el('img');face.src='assets/characters/companion-portrait.webp';face.alt='';face.draggable=false;
 toggle.append(face,el('span','toto-hint-label','토토 힌트'));
 const bubble=el('div','toto-bubble');bubble.hidden=true;bubble.setAttribute('role','status');
 const name=el('strong','toto-bubble-name','토토');const text=el('p','toto-bubble-text');
 const more=button('더 알려줘',()=>{level=1;show(hints[1],'hint');},'toto-more');
 const close=el('button','toto-close','×');close.type='button';close.setAttribute('aria-label','힌트 닫기');close.onclick=()=>hide();
 bubble.append(close,name,text,more);box.append(bubble,toggle);
 let level=0,timer:ReturnType<typeof setTimeout>|undefined,idle:ReturnType<typeof setTimeout>|undefined;
 function show(line:string,mood:'hint'|'cheer'){
  clearTimeout(timer);text.textContent=line;bubble.dataset.mood=mood;bubble.hidden=false;
  more.hidden=mood==='cheer'||level>0;toggle.setAttribute('aria-expanded','true');box.classList.remove('nudge');
  bubble.classList.remove('pop');void bubble.offsetWidth;bubble.classList.add('pop');
  if(mood==='cheer')timer=setTimeout(hide,Math.max(6500,voiceLineSeconds(line)*1000+900));
  // 2026-11-18: Toto reads his line aloud when it has a recording and character voices are on.
  playVoiceLine(line,voice);
  if(import.meta.env.DEV&&!voiceLineSeconds(line))console.warn('[toto-voice] missing',line);
 }
 const voice=(_state:NarrationState)=>{};
 function hide(){clearTimeout(timer);bubble.hidden=true;toggle.setAttribute('aria-expanded','false');stopNarration(voice);}
 toggle.onclick=()=>{if(!bubble.hidden&&bubble.dataset.mood==='hint'){hide();return;}level=0;show(hints[0],'hint');playEffect('hint');};
 const listen=new AbortController();
 shell.addEventListener('toto-say',e=>{const say=(e as CustomEvent<TotoSay>).detail;if(say.mood!=='cheer')level=0;show(say.text,say.mood||'hint');},{signal:listen.signal});
 // A gentle wiggle after 20 s without touching the screen, never a pop-up that blocks the activity.
 const wake=()=>{box.classList.remove('nudge');clearTimeout(idle);idle=setTimeout(()=>{if(bubble.hidden&&box.isConnected)box.classList.add('nudge');},20000);};
 shell.addEventListener('pointerdown',e=>{wake();if(!box.contains(e.target as Node))hide();},{signal:listen.signal});wake();
 const stop=new MutationObserver(()=>{if(!box.isConnected){listen.abort();clearTimeout(timer);clearTimeout(idle);stop.disconnect();}});
 queueMicrotask(()=>{if(box.parentElement)stop.observe(shell,{childList:true,subtree:true});});
 return box;
}
