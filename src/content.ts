import type {Stage} from './model';
export const stages:{id:Stage;title:string;place:string;verb:string;entry:string;exit:string;summary:string}[]=[
 {id:'M1',title:'균류 관찰',place:'버섯숲 표본실',verb:'조절하고 발견해요',entry:'fungi-field',exit:'fungi-microscope',summary:'관찰한 특징과 발견 장소를 연결했어요.'},
 {id:'M2',title:'한 방울 탐구',place:'연못 관찰소',verb:'따라가고 비교해요',entry:'water-sampling',exit:'protist-observation',summary:'모양·움직임·사는 곳을 비교했어요.'},
 {id:'M3',title:'세균의 단서',place:'자료 연구실',verb:'근거로 설명해요',entry:'bacteria-sources',exit:'bacteria-profile',summary:'자료를 근거로 특징과 사는 곳을 설명했어요.'},
 {id:'M4',title:'생활 속 사건',place:'생활마을',verb:'시간을 되돌려 봐요',entry:'impact-investigation',exit:'impact-analysis',summary:'생물이 생활에 미치는 영향을 비교했어요.'},
 {id:'M5',title:'생명과학 작업실',place:'BIO 작업실',verb:'만들고 시험해요',entry:'solution-assembly',exit:'solution-run',summary:'생물의 작용을 활용하는 방법을 소개했어요.'}
];
export const routes=['main','nature-map',...stages.flatMap(s=>[s.entry,s.exit]),'final-report','core-restoration','results'];
export const back:Record<string,string>={'main':'main','nature-map':'main','final-report':'nature-map','core-restoration':'final-report','results':'core-restoration',...Object.fromEntries(stages.flatMap(s=>[[s.entry,'nature-map'],[s.exit,s.entry]]))};
export const organisms:Record<string,string>={mushroom:'버섯',mold:'곰팡이',spirogyra:'해캄',paramecium:'짚신벌레',bacteria:'세균'};
export const environments=[{id:'wood',title:'발견 장소',text:'이 버섯 표본은 숲의 죽은 나무에서 발견했어요.'},{id:'moist',title:'주변 환경',text:'이 곰팡이 표본은 축축해진 빵에서 관찰했어요.'},{id:'guess',title:'누군가의 생각',text:'모든 균류는 물속에서만 살 것 같아요.'}];
export const sources=[
 {id:'photo',type:'확대 그림',title:'세균의 생김새',text:'막대 모양과 둥근 모양 등 여러 모양의 세균이 있어요.',segment:'모양을 비교한 부분',supports:['trait'],diagram:'bacteria'},
 {id:'place',type:'발견 장소',title:'어디에서 발견했을까?',text:'세균은 흙, 물, 생물의 몸 등 여러 곳에서 발견돼요.',segment:'발견 장소를 적은 부분',supports:['habitat'],diagram:'soil'},
 {id:'note',type:'관찰 메모',title:'눈으로 볼 수 있을까?',text:'세균은 매우 작아서 맨눈으로 하나하나의 모양을 보기 어려워요.',segment:'크기를 설명한 부분',supports:['trait'],diagram:'bacteria'},
 {id:'guess',type:'추측',title:'모든 세균은 해로울까?',text:'자료를 찾아보기 전, 모든 세균이 해로울 것 같다고 생각했어요.',segment:'아직 확인하지 않은 생각',supports:[],diagram:'question'},
 {id:'leaf',type:'다른 자료',title:'나뭇잎 관찰',text:'나뭇잎에는 잎맥이 보여요. 세균을 관찰한 기록은 아니에요.',segment:'나뭇잎에 관한 부분',supports:[],diagram:'leaf'},
 {id:'rumor',type:'추측',title:'물에는 세균이 없을까?',text:'누군가 물에는 세균이 살지 않는다고 했어요. 확인한 자료는 없어요.',segment:'출처가 없는 이야기',supports:[],diagram:'water'}
];
export const cases=[
 {id:'bread',name:'빵에 생긴 곰팡이',organism:'균류',action:'곰팡이가 자라면서 빵이 변했어요.',clues:['시간에 따른 빵의 모습','관련 생물: 곰팡이'],answer:'problem',explain:'먹을 빵이 변질되어 이용하기 어려워졌어요.'},
 {id:'yogurt',name:'요구르트 만들기',organism:'세균',action:'특정 세균의 작용을 이용해 요구르트를 만들어요.',clues:['우유를 이용한 발효 음식','관련 생물: 요구르트 만드는 세균'],answer:'help',explain:'세균의 작용을 음식 만들기에 이용해요.'},
 {id:'leaf',name:'낙엽이 분해되는 숲',organism:'균류·세균',action:'균류와 세균은 죽은 생물의 물질을 분해하는 데 관여해요.',clues:['쌓인 낙엽의 전후 모습','분해에 관여하는 균류·세균'],answer:'help',explain:'죽은 생물의 물질이 분해되는 데 도움을 줘요.'},
 {id:'water',name:'물속의 먹이 관계',organism:'원생생물',action:'짚신벌레 같은 작은 생물은 다른 물속 생물의 먹이가 되기도 해요.',clues:['작은 생물로 이어지는 먹이 관계','물속 생물과 이어지는 우리 생활'],answer:'help',explain:'물속 생물의 먹이 관계를 이어 주는 데 관여해요.'}
];
export const modules=[{id:'milk',label:'우유',kind:'재료'},{id:'water',label:'물',kind:'재료'},{id:'lactic',label:'요구르트 만드는 세균',kind:'생물의 작용'},{id:'mold',label:'빵에 자란 곰팡이',kind:'생물의 작용'},{id:'yogurt',label:'요구르트',kind:'결과'},{id:'bread',label:'빵',kind:'결과'}];
export const curriculumUrl='https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/11/b05e123f-8c12-4929-9914-319dea9b2099.pdf';
