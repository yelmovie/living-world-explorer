import {el,paragraph} from '../ui';
import {canvas,draw} from '../draw';
import {position} from '../model';
import type {InquiryRecord} from '../inquiry-model';
import type {InquiryHooks,InquiryView} from './inquiry2d';
import './pond-summary.css';

export function mountPondSummary(host:HTMLElement,records:Record<string,InquiryRecord>,hooks:InquiryHooks):InquiryView{
 const root=el('div','pond-summary');
 const algae=records['M2-2'],protozoan=records['M2-3'],site=records['M2-1']?.assignments.site;
 const reading=el('div','pond-summary-site',site==='plant'?'채집 장소 · 물풀 가까이':site==='edge'?'채집 장소 · 물가 가까이':'연못물 관찰');
 const panels=el('div','pond-summary-panels');
 const card=(title:string)=>{
  const node=el('section','pond-summary-card');
  node.append(el('h3','',title));panels.append(node);
  return node;
 };
 const picture=(src:string,label:string)=>{
  const img=el('img','pond-summary-picture');img.src=src;img.alt=label;img.decoding='async';return img;
 };
 const first=card('해캄 관찰 기록');
 first.append(picture('assets/study/spirogyra.webp','실처럼 이어진 해캄 관찰 모형'),
  el('strong','pond-summary-status',algae?.capture?'현미경 사진 기록':'참고 그림 · 사진 기록 없음'),
  paragraph(algae?.capture?'초록색 마디가 실처럼 길게 이어졌어요.':'해캄을 관찰하고 사진을 남기면 여기에 기록이 보여요.'));
 const second=card('짚신벌레 관찰 기록');
 const pins=protozoan?.pins?.slice(0,2)??[];
 if(pins.length===2){
  const moments=el('div','pond-summary-moments');
  const image=new Image();image.src='assets/study/paramecium.webp';
  for(const [index,time] of pins.entries()){
   const moment=el('figure'),imageCanvas=canvas(304,171);
   const label=`${['A','B'][index]} · 시점 ${time}`;
   imageCanvas.setAttribute('aria-label',label+'의 짚신벌레 위치');
   moment.append(imageCanvas,el('figcaption','',label));moments.append(moment);
   const render=()=>{
    draw(imageCanvas,'paramecium',{time,trail:true,image:image.naturalWidth?image:undefined});
    imageCanvas.setAttribute('aria-label',label+'의 짚신벌레 위치');
    const ctx=imageCanvas.getContext('2d')!,p=position(time);
    ctx.strokeStyle='#296353';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x*304,p.y*171,50,33,0,0,2*Math.PI);ctx.stroke();
   };
   image.addEventListener('load',render,{once:true});render();
  }
  second.append(moments,el('strong','pond-summary-status','두 시점 비교 기록'),
   paragraph(protozoan?.marks?.length?'위치가 달라졌고, 확대했을 때 몸 둘레에서 가는 털(섬모)을 찾았어요.':'같은 짚신벌레의 위치를 두 시점에서 비교했어요.'));
 }else second.append(picture('assets/study/paramecium.webp','몸 둘레에 가는 섬모가 있는 짚신벌레 관찰 모형'),
  el('strong','pond-summary-status','참고 그림 · 두 시점 기록 없음'),
  paragraph('다른 두 순간을 고정하면 움직인 위치를 여기서 비교할 수 있어요.'));
 root.append(reading,panels,paragraph('관찰 모형 · 실제 현미경 사진은 아니에요.','pond-summary-caption'));
 host.append(root);
 queueMicrotask(()=>{if(root.isConnected)hooks.ready(true);});
 const idle=()=>{},assign=()=>false;
 return {refresh:idle,showFrame:idle,endDemo:idle,setPlaybackRate:idle,setPreview:idle,setReveal:idle,setPlaying:idle,arm:idle,assignCard:assign,assign,place:assign,animateRun:(_valid,finish)=>finish(),dispose:()=>root.remove()};
}
