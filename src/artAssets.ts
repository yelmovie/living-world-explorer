/** Shared visual references for the inquiry cards, source sheets and renderer. */
export const inquiryArt:Record<string,{src:string;label:string}>={
 mushroom:{src:'assets/specimen-mushroom.webp',label:'버섯의 갓과 주름 관찰 모형'},
 mold:{src:'assets/specimen-mold.webp',label:'곰팡이의 가는 실과 둥근 부분 관찰 모형'},
 spirogyra:{src:'assets/specimen-spirogyra.webp',label:'실처럼 이어진 해캄 관찰 모형'},
 paramecium:{src:'assets/specimen-paramecium.webp',label:'짚신벌레 확대 관찰 모형'},
 bacteria:{src:'assets/study-bacteria.webp',label:'둥근 모양과 막대 모양의 세균 확대 모형'},
 bread:{src:'assets/study-bread.webp',label:'같은 위치에서 관찰한 빵 모형'},
 leaf:{src:'assets/study-leaf.webp',label:'숲 바닥에 쌓인 낙엽 조사 그림'},
 yogurt:{src:'assets/study-yogurt.webp',label:'요구르트 조사 그림'},
 milk:{src:'assets/study-milk.webp',label:'요구르트를 만드는 재료인 우유'},
 yeast:{src:'assets/study-yeast.webp',label:'효모의 확대 관찰 모형'},
 water:{src:'assets/study-pond.webp',label:'물풀과 물가가 보이는 연못 조사 그림'},
 pond:{src:'assets/study-pond.webp',label:'물풀과 물가가 보이는 연못 조사 그림'},
 soil:{src:'assets/study-soil.webp',label:'죽은 나무와 흙의 조사 그림'}
};
export const artFor=(kind:string|undefined)=>kind?inquiryArt[kind]:undefined;
export const artTime=(kind:string|undefined,detail:string)=>kind==='bread'&&/곰팡|변질/.test(detail)?3:0;
/** Keep curriculum and answer data intact while choosing the precise picture. */
export const artKey=(item:{id:string;art?:string})=>item.id==='milk'?'milk':item.id==='yeast'?'yeast':item.art;
