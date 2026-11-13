import {locations,nearestRoadPoint} from './mapData';
import {stageIds} from './model';

const lines=[
 ['오늘은 아무것도 못 보겠지?','렌즈 캡을 다시 씌워야지!'],
 ['표본을 가리면 나만 보이지!','창에 이 덮개를 놓아 볼까?'],
 ['파일은 옆으로 봐야지!','기록틀을 또 뒤집을까?'],
 ['이름표 바꾸기 성공!','어느 이름이었더라?'],
 ['화면을 흐려 버릴 테다!','초점을 어디로 옮겨 볼까?'],
];
const approaches=[{x:392,y:221},{x:847,y:215},{x:1032,y:411},{x:817,y:580},{x:314,y:540}];
export const mapVillainStages=stageIds.map((id,i)=>({
 id,name:'초점 도깨비 렌즈',...nearestRoadPoint(approaches[i]??locations[i]),
 lines:lines[i],prop:['cap','pane','file','label','lens'][i],hit:['초점이 어긋났어!','앗, 화면이 선명해져!'],finish:'덮개를 놓고 물러날게!',
}));
