import {active,type State,stageIds} from './model';
import {inquiryTasks} from './curriculum';
import {artFor} from './artAssets';

/** Export the selected case from the learner or the isolated classroom preview. */
export function cardContent(s:State){
 const a=active(s),record=a.inquiry.records['M5-4'];
 const task=inquiryTasks.find(t=>t.id==='M5-4')!;
 const item=task.items.find(it=>it.id===record?.assignments.case);
 return {caseId:item?.id||'',caseLabel:item?.label||'내가 조사한 생물의 작용',action:task.targets.find(t=>t.id===item?.target)?.label||'아직 소개할 사례를 고르지 않았어요.',description:item?.detail||'발견 도감에서 내 탐구 기록을 살펴봐요.',note:a.cardNote||record?.note||'',art:artFor(item?.art)?.src};
}

function lines(g:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,limit:number){
 const rows:string[]=[];let row='';
 for(const word of text.split(/\s+/)){
  const next=row?row+' '+word:word;
  if(g.measureText(next).width<=width){row=next;continue;}
  if(row){rows.push(row);row='';}
  for(const ch of word){if(g.measureText(row+ch).width>width&&row){rows.push(row);row='';}row+=ch;}
 }
 if(row)rows.push(row);
 rows.slice(0,limit).forEach((r,i)=>{if(i===limit-1&&rows.length>limit){while(g.measureText(r+'…').width>width)r=r.slice(0,-1);r+='…';}g.fillText(r,x,y+i*lineHeight);});
}

export async function downloadCard(s:State){
 const a=active(s),content=cardContent(s);await document.fonts.ready;
 const c=document.createElement('canvas');c.width=1600;c.height=1000;const g=c.getContext('2d')!;
 const box=(x:number,y:number,w:number,h:number,r:number,fill:string)=>{g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
 g.fillStyle='#f3edd9';g.fillRect(0,0,1600,1000);box(32,32,1536,936,28,'#fffdf4');box(48,48,1504,180,20,'#315f46');
 g.fillStyle='#e8d6a1';g.font='28px "Lab Display", sans-serif';g.fillText('생명 코드 연구소 · 나의 발견',84,94);
 g.fillStyle='#fff9e6';g.font='52px "Lab Display", sans-serif';lines(g,a.cardTitle||'작은 생물이 만드는 변화',84,157,1432,57,2);
 g.fillStyle='#637650';g.font='26px "Lab Display", sans-serif';g.fillText('내가 소개할 생활 속 사례',84,284);
 g.fillStyle='#213f30';g.font='44px "Lab Display", sans-serif';g.fillText(content.caseLabel,84,341);
 g.font='30px sans-serif';lines(g,'생물의 작용 · '+content.action,84,396,930,40,2);
 g.font='27px sans-serif';lines(g,content.description,84,450,930,37,2);
 box(1056,264,456,254,18,'#edf1df');
 if(content.art){try{const img=new Image();img.src=content.art;await img.decode();const scale=Math.min(420/img.width,218/img.height);g.drawImage(img,1284-img.width*scale/2,391-img.height*scale/2,img.width*scale,img.height*scale);}catch{/* The selected case remains readable if its illustration cannot load. */}}
 g.fillStyle='#315f46';g.font='30px "Lab Display", sans-serif';g.fillText('다섯 연구소에 남긴 나의 발견',84,566);
 g.font='25px sans-serif';stageIds.forEach((id,i)=>{const e=a.evidence[id];box(84,586+i*40,1432,34,8,i%2?'#fffdf4':'#edf1df');g.fillStyle='#284b37';lines(g,String(i+1)+'. '+(e?.summary?.replace('세균의 작용을 활용하는 방법을 소개했어요.','생물의 작용을 활용하는 방법을 소개했어요.')||'아직 완성하지 않은 연구 기록이에요.'),100,612+i*40,1400,30,1);});
 g.fillStyle='#315f46';g.font='29px "Lab Display", sans-serif';g.fillText('친구에게 전하고 싶은 발견',84,835);
 g.fillStyle='#213f30';g.font='28px sans-serif';lines(g,content.note||'우리 생활 속 생물의 작용을 친구에게 소개해요.',84,881,1432,37,2);
 g.fillStyle='#6c735b';g.font='20px sans-serif';g.fillText(s.settings.admin?'수업 시연용 소개 카드 · 학생의 원래 기록과 별도로 만들었어요.':'관찰·조사한 설명 모형을 바탕으로 만든 나의 생명과학 소개 카드',84,950);
 const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG 생성 실패')),'image/png'));
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='생명코드-소개카드.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
