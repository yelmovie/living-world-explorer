/** Shared visual references for the inquiry cards, source sheets and renderer. */
export type InquiryArt={src:string;label:string;frames?:string[]};
export const inquiryArt:Record<string,InquiryArt>={
 mushroom:{src:'assets/study/mushroom.webp',label:'버섯의 갓과 주름 관찰 모형'},
 mold:{src:'assets/study/mold.webp',label:'곰팡이의 가는 실과 둥근 부분 관찰 모형'},
 spirogyra:{src:'assets/study/spirogyra.webp',label:'실처럼 이어진 해캄 관찰 모형'},
 paramecium:{src:'assets/study/paramecium.webp',label:'짚신벌레 확대 관찰 모형'},
 bacteria:{src:'assets/study/bacteria.webp',label:'공·막대·나선 모양과 꼬리가 있는 세균 확대 모형'},
 bread:{src:'assets/study/bread-0.webp',label:'같은 빵 표본의 곰팡이 변화 관찰 모형',frames:['assets/study/bread-0.webp',...[1,2,3].map(i=>`assets/study/bread-${i}.webp`)]},
 leaf:{src:'assets/study/leaf-0.webp',label:'같은 낙엽 표본의 분해 변화 관찰 모형',frames:['assets/study/leaf-0.webp',...[1,2,3].map(i=>`assets/study/leaf-${i}.webp`)]},
 deadwood:{src:'assets/study/deadwood.webp',label:'갈라진 나무껍질과 균류가 보이는 죽은 나무'},
 moldyFruit:{src:'assets/study/moldy-fruit.webp',label:'곰팡이가 자라 변질된 과일의 관찰 예시'},
 dough:{src:'assets/study/dough-before.webp',label:'발효 전 유리 그릇 속 빵 반죽'},
 risenDough:{src:'assets/study/dough-after.webp',label:'같은 유리 그릇에서 부푼 빵 반죽'},
 yogurt:{src:'assets/study/yogurt.webp',label:'요구르트 조사 그림'},
 spoiledMilk:{src:'assets/study/spoiled-milk.webp',label:'오래 두어 덩어리지고 상한 우유'},
 tooth:{src:'assets/study/tooth.webp',label:'충치가 생긴 어금니 모형과 칫솔'},
 milk:{src:'assets/study/milk.webp',label:'요구르트를 만드는 재료인 우유'},
 yeast:{src:'assets/study/yeast.webp',label:'효모의 확대 관찰 모형'},
 water:{src:'assets/study/pond.webp',label:'물풀과 물가가 보이는 연못 조사 그림'},
 pond:{src:'assets/study/pond.webp',label:'물풀과 물가가 보이는 연못 조사 그림'},
 soil:{src:'assets/study/soil.webp',label:'채집한 흙 표본의 조사 그림'}
};
export const artFrame=(time=0)=>Math.max(0,Math.min(3,Math.floor(Number.isFinite(time)?time:0)));
export function artFor(kind:string|undefined,time=0){const art=kind?inquiryArt[kind]:undefined;return art?{...art,src:art.frames?.[artFrame(time)]||art.src}:undefined;}
export function artTime(kind:string|undefined,detail:string,id?:string){
 if(id==='sealed'||id==='leaves')return 0;
 return kind==='bread'&&/곰팡|변질|축축/.test(detail)||kind==='leaf'&&/분해/.test(detail)?3:0;
}
/** Keep curriculum and answer data intact while choosing the precise picture. */
export function artKey(item:{id:string;art?:string;label?:string;detail?:string}){
 if(item.id==='milk')return 'milk';
 if(item.id==='yeast')return 'yeast';
 if(['log','env1'].includes(item.id))return 'deadwood';
 if(item.id==='fruit-case')return 'moldyFruit';
 if(item.id==='dough')return 'dough';
 if(item.id==='risen'||item.id==='yeast-case'||item.art==='bread'&&/효모|반죽/.test((item.label||'')+(item.detail||'')))return 'risenDough';
 if(item.id==='changed')return 'leaf';
 return item.art;
}

/** 맨눈 → 돋보기 → 현미경 steps of the microscope tasks. context is the naked-eye picture, focus is where the magnifier looks (0–1). */
export const magnify:Record<string,{context:string;time:number;focus:{x:number;y:number};captions:[string,string,string]}>={
 mushroom:{context:'deadwood',time:0,focus:{x:.74,y:.47},captions:['맨눈 · 죽은 나무에 작은 버섯들이 자라요','돋보기 · 버섯의 갓과 자루가 크게 보여요','현미경 · 갓 아래 주름이 자세히 보여요']},
 mold:{context:'bread',time:3,focus:{x:.5,y:.5},captions:['맨눈 · 빵 위에 거뭇한 얼룩이 보여요','돋보기 · 솜털처럼 퍼진 곰팡이가 보여요','현미경 · 가는 실(균사)과 둥근 부분이 보여요']},
 spirogyra:{context:'pond',time:0,focus:{x:.45,y:.62},captions:['맨눈 · 연못 물풀 사이의 물을 살펴봐요','돋보기 · 초록색 덩어리는 보이지만 자세한 모양은 알기 어려워요','현미경 · 실처럼 길게 이어진 해캄이 보여요']}
};
export const levelNames=['맨눈','돋보기','현미경'] as const;
