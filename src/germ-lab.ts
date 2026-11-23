import type {InquiryTask,InquiryRecord} from './inquiry-model';

/** 2026-11-17: M3 자료 연구실 is a hands-on lab for [4과12-01] bacteria features (size, shape, where they live).
 * The four games keep their state in record.assignments; `germ` marks a record made for these games. */
export const GERM_KINDS=['zoom','catch','culture','exhibit'] as const;
export const isGermTask=(task:Pick<InquiryTask,'kind'>)=>(GERM_KINDS as readonly string[]).includes(task.kind);

/** M3-1: magnification steps of the zoom dial. This teaching model reveals bacteria at ×1000; real visibility also depends on the specimen, contrast and resolution. */
export const zoomSteps=[{power:'1',label:'맨눈',note:'유리판 위 물 한 방울. 맨눈으로는 아무것도 안 보여요.'},{power:'10',label:'돋보기',note:'10배로 키워도 물방울 속은 맑기만 해요.'},{power:'100',label:'현미경 100배',note:'이 모형에서는 짚신벌레가 보여요. 세균을 더 크게 살펴봐요.'},{power:'1000',label:'현미경 1000배',note:'이 모형의 세균이 보여요. 실제 관찰은 표본과 현미경 상태에 따라 달라요.'}] as const;
export const zoomGuesses=['10','100','1000'] as const;

/** M3-2: the shapes a learner sorts into specimen jars, and which jar each sprite belongs to. */
export const germShapes=[{id:'round',label:'공 모양'},{id:'rod',label:'막대 모양'},{id:'spiral',label:'나선 모양'}] as const;
export const bugKinds=[{id:'round',jar:'round'},{id:'chain',jar:'round'},{id:'rod',jar:'rod'},{id:'tail',jar:'rod'},{id:'spiral',jar:'spiral'}] as const;
export const JAR_GOAL=2;

/** M3-3: places a learner can swab; the empty control dish stays clean. */
export const culturePlaces=[{id:'hand',label:'손바닥',art:'germHand'},{id:'soil',label:'화분 흙',art:'soil'},{id:'pond',label:'연못 물',art:'pond'},{id:'knob',label:'문손잡이',art:'germKnob'},{id:'bread',label:'먹다 남은 빵',art:'bread'}] as const;
export const CULTURE_GOAL=3;
export const cultureDays=3;

/** M3-4: specimens on the exhibit, biggest first, and the sentence blanks. */
export const exhibitOrder=['mushroom','paramecium','bacteria'] as const;
export const exhibitBlanks=[
 {id:'size',before:'세균은 짚신벌레보다 훨씬',options:[{id:'small',label:'작고'},{id:'big',label:'크고'}],answer:'small'},
 {id:'shape',before:'',options:[{id:'many',label:'공·막대·나선처럼 여러 모양이'},{id:'one',label:'한 가지 모양이'}],answer:'many',after:'있으며,'},
 {id:'place',before:'',options:[{id:'many',label:'흙·물·손처럼 여러 곳에'},{id:'water',label:'물속에만'}],answer:'many',after:'살아요.'}
] as const;

const count=(r:InquiryRecord,key:string)=>Number(r.assignments[key])||0;
/** Highest zoom step reached (0–3). Kept in assignments: record.level is the microscope step and is capped at 2 on load. */
export const zoomReach=(r:InquiryRecord)=>count(r,'reach');
export const jarCount=(r:InquiryRecord,jar:string)=>count(r,`jar_${jar}`);
export const streaked=(r:InquiryRecord)=>culturePlaces.filter(p=>r.assignments[`dish_${p.id}`]==='streaked').map(p=>p.id);

/** Steps for the status meter; `issues` lists what is still missing. */
export function germProgress(task:InquiryTask,r:InquiryRecord):{steps:[boolean,string][]}{
 const a=r.assignments;
 if(task.kind==='zoom')return {steps:[[!!a.guess,'먼저 몇 배로 확대해야 세균이 보일지 예상해요.'],[zoomReach(r)>=3,'배율 다이얼을 돌려 끝까지 확대해요.'],[a.found==='yes','1000배 시야에서 세균을 찾아 콕 눌러요.']]};
 if(task.kind==='catch')return {steps:germShapes.map(s=>[jarCount(r,s.id)>=JAR_GOAL,`${s.label} 세균을 ${JAR_GOAL}마리 잡아 ${s.label} 표본병에 넣어요.`] as [boolean,string])};
 if(task.kind==='culture')return {steps:[[streaked(r).length>=CULTURE_GOAL,culturePlaces.some(p=>a[`dish_${p.id}`]==='loaded')?'면봉에 묻혔어요! 새 배양 접시 위에 지그재그로 그려요.':
   `면봉으로 ${CULTURE_GOAL}곳 이상 문질러 배양 접시에 그려요.`],[a.days===String(cultureDays),'배양기 시간 손잡이를 끝까지 밀어 접시를 키워요.'],[a.conclusion==='many','접시를 비교해 세균이 사는 곳을 정리해요.']]};
 if(task.kind==='exhibit')return {steps:[[a.order===exhibitOrder.join(','),'세 표본을 큰 것부터 작은 것 순서로 전시대에 놓아요.'],...exhibitBlanks.map(b=>[a[`blank_${b.id}`]===b.answer,'관찰한 내용에 맞게 설명 문장을 완성해요.'] as [boolean,string])]};
 return {steps:[]};
}
export function germIssues(task:InquiryTask,r:InquiryRecord){return [...new Set(germProgress(task,r).steps.filter(([ok])=>!ok).map(([,text])=>text))];}
export function germGuidance(task:InquiryTask,r:InquiryRecord){const {steps}=germProgress(task,r);const missing=steps.find(([ok])=>!ok);return {done:steps.filter(([ok])=>ok).length,total:steps.length,action:missing?.[1]||'발견 기록하기를 눌러 관찰한 내용을 남겨요.'};}

/** Record lines for the research album. Records from before the redesign keep a short note. */
export function germSummary(task:InquiryTask,r:InquiryRecord):string[]{
 const a=r.assignments;if(a.germ!=='1')return ['이전 버전 활동으로 완료한 기록이에요.'];
 if(task.kind==='zoom')return [`처음 예상: ${a.guess}배 · 이 모형에서 살펴본 시야: 1000배`,a.guess==='1000'?'예상이 맞았어요.':'예상과 다른 시야에서 세균을 찾았어요.'];
 if(task.kind==='catch')return [germShapes.map(s=>`${s.label} ${jarCount(r,s.id)}마리`).join(' · '),a.tail==='yes'?'꼬리(편모)가 있는 막대 모양 세균도 찾았어요.':''].filter(Boolean);
 if(task.kind==='culture'){const names=culturePlaces.filter(p=>streaked(r).includes(p.id)).map(p=>p.label);return [`채집한 곳: ${names.join(', ')}`,'채집한 모든 접시에서 세균 무리가 자랐고, 아무것도 묻히지 않은 접시는 깨끗했어요.'];}
 if(task.kind==='exhibit')return ['큰 것부터: 버섯 → 짚신벌레 → 세균','세균은 짚신벌레보다 훨씬 작고, 공·막대·나선처럼 여러 모양이 있으며, 흙·물·손처럼 여러 곳에 살아요.'];
 return [];
}

/** A finished record for the teacher demo. */
export function germExample(task:InquiryTask):Record<string,string>{
 const a:Record<string,string>={germ:'1'};
 if(task.kind==='zoom')Object.assign(a,{guess:'100',reach:'3',found:'yes'});
 if(task.kind==='catch')Object.assign(a,{jar_round:'2',jar_rod:'2',jar_spiral:'2',tail:'yes'});
 if(task.kind==='culture')Object.assign(a,{dish_hand:'streaked',dish_soil:'streaked',dish_pond:'streaked',days:String(cultureDays),conclusion:'many'});
 if(task.kind==='exhibit'){a.order=exhibitOrder.join(',');for(const b of exhibitBlanks)a[`blank_${b.id}`]=b.answer;}
 return a;
}
