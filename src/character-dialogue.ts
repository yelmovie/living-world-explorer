import {narrationEnabled,playNarration,stopNarration,type NarrationState} from './audio';
import {button,el,paragraph} from './ui';
import './character-dialogue.css';

/** Shared reading and voice controls; the caller owns story pages and reply choices. */
export function mountDialogueSpeech(
  dialog:HTMLDialogElement, line:HTMLElement, scene:HTMLElement=dialog,
  voiceFinished?:(state:'ended'|'unavailable'|'stopped')=>void,
  enableVoice?:()=>void,
){
  const layout=el('span','dialogue-line-layout');
  const visual=el('span','dialogue-line-visual');
  const readable=el('span','dialogue-readable');
  // Not-yet-typed letters stay in place (hidden) so the line breaks never move while typing.
  const typed=document.createTextNode(''),pending=el('span','dialogue-line-pending');
  const reveal=el('button','dialogue-reveal');
  reveal.type='button';
  reveal.onclick=finish;
  reveal.setAttribute('aria-label','대사 모두 보기');
  layout.setAttribute('aria-hidden','true');
  visual.setAttribute('aria-hidden','true');
  readable.setAttribute('role','status');
  readable.setAttribute('aria-atomic','true');
  reveal.append(layout,visual);
  line.append(reveal,readable);

  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const events=new AbortController(),{signal}=events;
  let frame=0,recording='',busy=false;
  const status=paragraph('','dialogue-voice-status');
  status.setAttribute('role','status');
  const listen=button('',()=>{
    if(busy){stopNarration(onVoice);return;}
    if(!narrationEnabled())enableVoice?.();
    speak(true);
  },'secondary dialogue-listen');
  listen.setAttribute('aria-pressed','false');

  function finish(){
    cancelAnimationFrame(frame);frame=0;
    visual.textContent=layout.textContent;
    reveal.setAttribute('aria-disabled','true');
    scene.dataset.typing='false';
  }
  function onVoice(state:NarrationState){
    busy=state==='loading'||state==='playing'||state==='waiting';
    scene.dataset.speaking=String(state==='playing'&&dialog.open);
    paintListen();
    if(state==='unavailable')status.textContent='목소리를 재생하지 못했어요. 글로도 읽을 수 있어요.';
    if(state==='ended'||state==='unavailable'||state==='stopped')voiceFinished?.(state);
  }
  function paintListen(){
    listen.textContent=busy?'음성 멈추기':!narrationEnabled()&&enableVoice?'목소리 켜고 듣기':'다시 듣기';
    listen.setAttribute('aria-pressed',String(busy));
  }
  function speak(requested=false){
    status.textContent='';
    paintListen();
    if(!playNarration(recording,onVoice)&&requested)status.textContent='소리가 꺼져 있어요. 대화를 닫고 화면의 소리를 켜면 들을 수 있어요.';
  }
  function show(text:string,voice:string){
    finish();
    layout.textContent=readable.textContent=text;
    recording=voice;
    if(motion.matches||document.hidden||document.documentElement.classList.contains('reduced'))finish();
    else{
      const characters=Array.from(text),started=performance.now();
      typed.data='';pending.textContent=text;
      visual.replaceChildren(typed,pending);
      reveal.removeAttribute('aria-disabled');
      scene.dataset.typing='true';
      const draw=(now:number)=>{
        if(!dialog.open||!dialog.isConnected){finish();return;}
        const count=Math.floor((now-started)/24)+1;
        if(count>=characters.length){finish();return;}
        typed.data=characters.slice(0,count).join('');
        pending.textContent=characters.slice(count).join('');
        frame=requestAnimationFrame(draw);
      };
      frame=requestAnimationFrame(draw);
    }
    speak();
  }
  function suspend(){finish();stopNarration(onVoice);}
  motion.addEventListener('change',()=>{if(motion.matches)finish();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();},{signal});
  window.addEventListener('pagehide',suspend,{signal});
  dialog.addEventListener('close',()=>{suspend();events.abort();},{once:true});
  return {show,listen,status,isVoiceBusy:()=>busy};
}
