import {el,button,paragraph} from './ui';
import {inquiryArt} from './artAssets';

/** Size ladder: examples ordered from larger to smaller, not equally spaced ratios. Sizes are approximate. */
export type Rung={id:string;label:string;size:string;art?:string;stage?:string};
export const rungs:Rung[]=[
 {id:'mushroom',label:'버섯 갓',size:'약 5cm',art:'mushroom',stage:'M1'},
 {id:'paramecium',label:'짚신벌레',size:'약 0.2mm',art:'paramecium',stage:'M2'},
 {id:'hair',label:'머리카락 굵기',size:'약 0.1mm'},
 {id:'spirogyra',label:'해캄 실의 굵기',size:'약 0.05mm',art:'spirogyra',stage:'M2'},
 {id:'hypha',label:'곰팡이 균사 굵기 · 버섯 포자',size:'약 0.005mm',art:'mold',stage:'M1'},
 {id:'bacteria',label:'세균',size:'약 0.001mm',art:'bacteria',stage:'M3'}
];
const NAKED_EYE_LAST='hair';
export const ladderFact='이 예에서 짚신벌레의 길이는 세균 길이의 약 200배예요. 실제 크기는 종류마다 달라요.';

function rungRow(r:Rung,lit:boolean){
 const row=el('li','ladder-rung'+(lit?' lit':''));row.dataset.rung=r.id;
 const pic=el('span','ladder-pic');if(r.art&&inquiryArt[r.art]){const img=el('img');img.src=inquiryArt[r.art].src;img.alt='';pic.append(img);}else pic.classList.add('ladder-hair');
 row.append(pic,el('strong','',r.label),el('small','',r.size));return row;
}
const limitLine=()=>{const li=el('li','ladder-limit');li.append(el('span','','↑ 이 정도 굵기는 맨눈으로 구별하기 쉬워요'),el('span','','↓ 더 가는 부분은 확대해 비교해요'));return li;};

/** Read-only ladder (발견 도감). lit: stages whose organisms are already discovered. */
export function sizeLadder(lit:Set<string>){
 const list=el('ol','size-ladder');list.setAttribute('aria-label','크기 사다리 · 위에서 아래로 갈수록 작아져요. 칸마다 크기 차이는 달라요');
 for(const r of rungs){list.append(rungRow(r,!r.stage||lit.has(r.stage)));if(r.id===NAKED_EYE_LAST)list.append(limitLine());}
 return list;
}

/** M3-2: the bacteria card goes into one of the gaps; the right gap is below the fungal threads. */
export function ladderPlacement(done:boolean,onPlaced:()=>void){
 const box=el('div','ladder-task');const known=rungs.filter(r=>r.id!=='bacteria');
 const say=paragraph(done?ladderFact:'세균 카드를 넣을 칸을 골라요. 위의 것보다 작고 아래 것보다 큰 자리를 찾아요.','ladder-feedback');say.setAttribute('role','status');
 const list=el('ol','size-ladder placing');list.setAttribute('aria-label','크기 사다리에 세균 놓기');
 const slot=(index:number)=>{const li=el('li','ladder-slot');const placed=done&&index===known.length;
  const b=button(placed?'세균 · 약 0.001mm':'여기에 놓기',()=>{
   if(index===known.length){say.textContent=ladderFact;list.querySelectorAll('.ladder-slot button').forEach(n=>(n as HTMLButtonElement).disabled=true);b.textContent='세균 · 약 0.001mm';li.classList.add('placed');onPlaced();return;}
   say.textContent=`${known[index]?.label||'맨 위'}보다도 작아요. 이 예의 세균은 약 0.001mm예요. 더 아래 칸을 골라 봐요.`;},placed?'selected':'secondary',done&&!placed);
  li.append(b);if(placed)li.classList.add('placed');return li;};
 list.append(slot(0));known.forEach((r,i)=>{list.append(rungRow(r,true));if(r.id===NAKED_EYE_LAST)list.append(limitLine());list.append(slot(i+1));});
 // Reopened after placing: show where the bacteria went.
 if(done)requestAnimationFrame(()=>list.querySelector('.ladder-slot.placed')?.scrollIntoView({block:'nearest'}));
 box.append(paragraph('크기 사다리 · 위에서 아래로 갈수록 작아져요. 크기는 대표적인 예이고 칸마다 차이는 달라요.','muted'),list,say);return box;
}
