import {active,type State,stageIds,captureValid,featurePoint} from './model';
import {getBlob} from './storage';
export async function downloadCard(s:State){
 const a=active(s);const c=document.createElement('canvas');c.width=1600;c.height=1000;const g=c.getContext('2d')!;
 g.fillStyle='#f7f4e8';g.fillRect(0,0,1600,1000);g.fillStyle='#245e50';g.fillRect(0,0,1600,170);g.fillStyle='white';g.font='bold 52px sans-serif';g.fillText(a.cardTitle||'작은 생물이 만드는 변화',70,110,1450);
 g.fillStyle='#263f36';g.font='32px sans-serif';const lines=['생명 코드 연구소 · 나의 생명과학 소개 카드','사례: 요구르트 만들기','이용하는 생물: 특정 세균','생물의 작용: 발효 음식 만들기에 이용','생활에서의 쓰임: 우유로 요구르트 만들기'];lines.forEach((t,i)=>g.fillText(t,70,250+i*64));
 const capture=a.evidence.M1?.draft.m1.captures.find(c=>captureValid(c)&&c.marks.some(p=>featurePoint(c.organism,p)));if(capture){const blob=getBlob(capture.id);if(blob){const bmp=await createImageBitmap(blob);g.drawImage(bmp,1020,230,500,320);bmp.close();g.save();g.beginPath();g.rect(1020,230,500,320);g.clip();g.strokeStyle='#dd7d35';g.lineWidth=4;for(const p of capture.marks){const x=(p.x+capture.pan.x-.5)*capture.zoom+.5,y=(p.y+capture.pan.y-.5)*capture.zoom+.5;g.beginPath();g.arc(1020+x*500,230+y*320,14,0,Math.PI*2);g.stroke();}g.restore();}}
 g.font='24px sans-serif';g.fillText('내가 조사한 기록',70,620);stageIds.forEach((id,i)=>{const e=a.evidence[id];if(e)g.fillText(`${id} · ${e.summary}`,70,670+i*42,1420);});g.fillText((a.cardNote||'우리 생활 속 생물의 작용을 친구에게 소개해요.').slice(0,100),70,920,1450);g.fillStyle='#7b6650';g.font='20px sans-serif';g.fillText(s.settings.admin?'전체 해금 예시 · 설명용 모형 / 교과 검수 전':'개발용 탐구 기록 · 설명용 모형 / 교과 검수 전',70,970);
 const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG 생성 실패')),'image/png'));const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='생명코드-소개카드.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
