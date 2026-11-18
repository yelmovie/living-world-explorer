// The map award plays once on the last hit. It never changes learning or certificate progress.
// Full screen like the story films: the captions are burned into the bottom of the picture, so nothing sits there while it plays.
export function openMapFinale(host, source) {
 const doc=host.ownerDocument;
 if(!host.isConnected||doc.querySelector('.map-finale-dialog'))return;
 const dialog=doc.createElement('dialog');dialog.className='map-finale-dialog';
 dialog.setAttribute('aria-label','지도 모험 피날레');
 Object.assign(dialog.style,{position:'fixed',inset:'0',margin:'0',width:'100dvw',maxWidth:'100dvw',height:'100dvh',maxHeight:'100dvh',padding:'0',border:'0',borderRadius:'0',background:'#000',color:'#fff',overflow:'hidden',zIndex:'999'});
 const title=doc.createElement('h2');title.textContent='모든 악당을 물리쳤어!';
 Object.assign(title.style,{position:'absolute',top:'max(12px,env(safe-area-inset-top))',left:'max(16px,env(safe-area-inset-left))',zIndex:'1',margin:'0',padding:'8px 16px',borderRadius:'999px',background:'rgba(8,14,16,.72)',fontSize:'clamp(18px,2.2vw,24px)',lineHeight:'1.3',maxWidth:'calc(100dvw - 260px)',pointerEvents:'none'});
 const video=doc.createElement('video');video.src=source;video.playsInline=true;video.muted=true;video.controls=false;video.autoplay=true;video.preload='metadata';video.setAttribute('aria-label','지도 탐험 피날레 영상');
 Object.assign(video.style,{display:'block',width:'100%',height:'100%',objectFit:'contain',background:'#000'});
 // Native controls would cover the captions, so they appear only while the film is paused; a tap pauses it.
 video.addEventListener('playing',()=>{video.controls=false;});video.addEventListener('pause',()=>{video.controls=true;});video.addEventListener('click',()=>{if(!video.paused)video.pause();});
 const status=doc.createElement('p');status.hidden=true;status.role='status';
 Object.assign(status.style,{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(560px,calc(100dvw - 40px))',margin:'0',padding:'16px 20px',borderRadius:'12px',background:'#172525',textAlign:'center',fontSize:'20px',lineHeight:'1.5'});
 const close=doc.createElement('button');close.type='button';close.textContent='지도로 돌아가기';
 Object.assign(close.style,{position:'absolute',top:'max(12px,env(safe-area-inset-top))',right:'max(16px,env(safe-area-inset-right))',zIndex:'1',minHeight:'48px',padding:'6px 18px',borderRadius:'8px',cursor:'pointer',opacity:'.9'});
 dialog.append(title,video,status,close);doc.body.append(dialog);dialog.showModal();
 close.addEventListener('click',()=>dialog.close());
 video.addEventListener('error',()=>{status.hidden=false;status.textContent='지금은 영상을 열 수 없어. 지도 퇴치 기록은 저장됐어.';});
 dialog.addEventListener('close',()=>{video.pause();dialog.remove();},{once:true});
 video.play().catch(()=>{video.controls=true;});
}
