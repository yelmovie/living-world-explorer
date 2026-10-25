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
 soil:{src:'assets/study/soil.webp',label:'채집한 흙 표본의 조사 그림'},
 // 2026-10-25: magnification steps, fungal common features and the three bacteria shapes (assets/generated/study-20261025c).
 mushroomSpores:{src:'assets/study/mushroom-spores.webp',label:'현미경으로 본 버섯 주름 가장자리와 포자'},
 mushroomMycelium:{src:'assets/study/mushroom-mycelium.webp',label:'죽은 나무 속으로 퍼진 버섯의 균사 단면 모형'},
 moldLens:{src:'assets/study/mold-lens.webp',label:'돋보기로 본 빵 위의 곰팡이'},
 spirogyraLens:{src:'assets/study/spirogyra-lens.webp',label:'돋보기로 본 연못물 속 초록 실'},
 bacteriaRound:{src:'assets/study/bacteria-round.webp',label:'공 모양 세균 확대 모형'},
 bacteriaRod:{src:'assets/study/bacteria-rod.webp',label:'막대 모양 세균 확대 모형'},
 bacteriaSpiral:{src:'assets/study/bacteria-spiral.webp',label:'나선 모양 세균 확대 모형'}
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

/** 맨눈 → 돋보기 → 현미경 steps of the microscope tasks. context is the naked-eye picture, focus is where the magnifier looks (0–1).
 * lens: own picture for the 돋보기 step (new structure appears instead of a blurry enlargement). gate: the 돋보기 picture must be tapped on this feature to open the microscope. */
export type MagnifyView={context:string;time:number;focus:{x:number;y:number};lens?:string;gate?:string;captions:[string,string,string]};
export const magnify:Record<string,MagnifyView>={
 mushroom:{context:'deadwood',time:0,focus:{x:.74,y:.47},lens:'mushroom',gate:'gills',captions:['맨눈 · 죽은 나무에 작은 버섯들이 자라요','돋보기 · 갓 아래 줄무늬(주름)를 찾아 눌러요','현미경 · 주름 가장자리에 작은 알갱이가 보여요']},
 mold:{context:'bread',time:3,focus:{x:.5,y:.5},lens:'moldLens',captions:['맨눈 · 빵 위에 거뭇한 얼룩이 보여요','돋보기 · 솜털 같은 실 위에 검은 점이 보여요','현미경 · 가는 실(균사)과 둥근 부분이 보여요']},
 spirogyra:{context:'pond',time:0,focus:{x:.45,y:.62},lens:'spirogyraLens',captions:['맨눈 · 연못 물풀 사이의 물을 살펴봐요','돋보기 · 가는 초록 실이 보이지만 속은 아직 안 보여요','현미경 · 실처럼 길게 이어진 해캄이 보여요']}
};
/** Older records (before 2026-10-25) keep the original 돋보기 enlargement and no gate. */
export function magnifyFor(organism:string|undefined,current:boolean):MagnifyView|undefined{const view=magnify[organism||''];return view&&!current?{...view,lens:undefined,gate:undefined,captions:[view.captions[0],'돋보기 · 크게 보면 모양이 더 잘 보여요','현미경 · 특징이 자세히 보여요']}:view;}
export const levelNames=['맨눈','돋보기','현미경'] as const;
/** Smallest detail each step can show (size ladder chip in the microscope tools). */
export const levelReach=['머리카락 굵기(약 0.1mm)까지 보여요','머리카락 굵기의 10분의 1(약 0.01mm)까지 보여요','머리카락 굵기의 100분의 1(약 0.001mm)까지 보여요'] as const;
