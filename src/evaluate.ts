import {captureValid,featurePoint,temporalValid,changePoint,validEvidence,type Attempt,type Stage,type Draft} from './model';
import {cases,sources} from './content';
export function claimStatus(claim:'trait'|'habitat',choice:string,bindings:string[]){
 const supported=bindings.some(id=>sources.find(s=>s.id===id)?.supports.includes(claim));
 if(!supported)return '근거 부족';
 return choice==='correct'?'확인 가능':choice?'자료와 맞지 않아요':'설명을 골라요';
}
export function evaluateSolution(d:Draft['m5']){if(d.slots.some(x=>!x)||d.edges.some(x=>!x))return 'connection-missing';if(d.slots[0]!=='milk'||d.slots[1]!=='lactic')return 'action-unsupported';if(d.slots[2]!=='yogurt')return 'outcome-unsupported';return 'supported';}
export function missing(stage:Stage,d:Draft):string[]{
 const out:string[]=[];
 if(stage==='M1'){
  if(!['wood','moist'].every(x=>d.m1.environment.includes(x)))out.push('발견 장소와 주변 환경을 확인해요.');
  for(const organism of ['mushroom','mold'])if(!d.m1.captures.some(c=>c.organism===organism&&captureValid(c)&&c.marks.some(p=>featurePoint(organism,p))))out.push(`${organism==='mold'?'곰팡이':'버섯'}를 선명하게 찍고 특징을 표시해요.`);
  if(d.m1.claim!=='correct')out.push('관찰 기록과 맞는 설명을 골라요.');
 }
 if(stage==='M2'){
  if(d.m2.sampleStep!==3)out.push('관찰할 표본을 준비해요.');
  if(!['spirogyra','paramecium'].every(x=>d.m2.captured.includes(x)))out.push('두 생물을 각각 기록해요.');
  if(d.m2.a===null||d.m2.b===null||Math.abs(d.m2.b-d.m2.a)<2)out.push('서로 다른 두 시점의 움직임을 고정해요.');
  if([d.m2.shape,d.m2.motion,d.m2.habitat].some(v=>v!=='correct'))out.push('모양·움직임·채집 장소를 기록과 비교해요.');
 }
 if(stage==='M3'){
  if(!['photo','place','note'].every(x=>d.m3.sources.includes(x)))out.push('확대 그림·장소·관찰 메모를 살펴봐요.');
  const used=(['trait','habitat'] as const).flatMap(claim=>d.m3.bindings[claim].filter(id=>sources.find(s=>s.id===id)?.supports.includes(claim)));
  if(!['photo','place','note'].every(x=>used.includes(x)))out.push('확대 그림·장소·관찰 메모를 설명의 근거로 연결해요.');
  for(const claim of ['trait','habitat'] as const)if(claimStatus(claim,d.m3[claim],d.m3.bindings[claim]||[])!=='확인 가능')out.push(`${claim==='trait'?'특징':'사는 곳'} 설명을 뒷받침하는 원문을 연결해요.`);
 }
 if(stage==='M4'){
  if(!temporalValid(d.m4.a,d.m4.b)||!d.m4.marks.some(p=>changePoint(d.m4.a!,d.m4.b!,p)))out.push('빵의 변화 전후를 고정하고 달라진 곳을 표시해요.');
  for(const c of cases)if((d.m4.clues[c.id]||[]).length<2||d.m4.answers[c.id]!==c.answer)out.push(`${c.name}: 두 단서를 읽고 영향을 설명해요.`);
  if(d.m4.context!=='correct')out.push('빵과 낙엽의 상황을 비교해요.');
 }
 if(stage==='M5'){
  if(evaluateSolution(d.m5)!=='supported')out.push('재료·작용·결과와 연결을 다시 확인해요.');
  const run=d.m5.runs.findLast(r=>r.revision===d.m5.revision&&r.passed&&r.status==='completed');
  if(!run)out.push('현재 설계를 예상하고 가동해요.');
  else if(!run.prediction||!run.reason||run.reflection!==(run.prediction==='yogurt'?'matches':'differs'))out.push('예상과 실제 결과가 같았는지 확인해요.');
  if(d.m5.explanation!=='correct')out.push('어떤 생물의 작용을 이용했는지 설명해요.');
 }
 return out;
}
export function canEnter(a:Attempt,route:string,admin:boolean){
 if(admin||['main','nature-map'].includes(route))return true;
 const stageRoutes=[['fungi-field','fungi-microscope'],['water-sampling','protist-observation'],['bacteria-sources','bacteria-profile'],['impact-investigation','impact-analysis'],['solution-assembly','solution-run']];
 const i=stageRoutes.findIndex(r=>r.includes(route));
 if(i>=0){if(i>0&&!validEvidence(a,`M${i}` as Stage,false))return false;return route!==stageRoutes[i][1]||[a.draft.m1.environment.length>=2,a.draft.m2.sampleStep===3,a.draft.m3.sources.length>=3,true,a.draft.m5.slots.every(Boolean)][i];}
 if(!(['M1','M2','M3','M4','M5'] as Stage[]).every(s=>validEvidence(a,s,false)))return false;
 return route==='final-report'||(a.report.length===5&&(route==='core-restoration'||route==='results'&&a.activated));
}
