import type {Point} from './model';
import type {InquiryTask,InquiryRecord} from './inquiry-model';
import masks from './observation-masks.json';

/** All points are normalized ORIGINAL image coordinates, independent of aspect/zoom. */
export function imageToView(p:Point,r:Pick<InquiryRecord,'zoom'|'pan'>):Point{return {x:(p.x+r.pan.x-.5)*r.zoom+.5,y:(p.y+r.pan.y-.5)*r.zoom+.5};}
export function viewToImage(p:Point,r:Pick<InquiryRecord,'zoom'|'pan'>):Point{return {x:(p.x-.5)/r.zoom+.5-r.pan.x,y:(p.y-.5)/r.zoom+.5-r.pan.y};}
function polygon(p:Point,vertices:number[][]){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const [x,y]=vertices[i],[u,v]=vertices[j];if((y>p.y)!==(v>p.y)&&p.x<(u-x)*(p.y-y)/(v-y)+x)inside=!inside;}return inside;}
function maskContains(key:string,p:Point){const rows=(masks.regions as Record<string,number[][]>)[key],row=rows?.[Math.floor(p.y*masks.height)],x=Math.floor(p.x*masks.width);return !!row?.some((start,i)=>i%2===0&&x>=start&&x<=row[i+1]);}
export function featureAt(kind:string,p:Point):string|undefined{
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)return;
 if(kind==='mushroom'&&polygon(p,[[.235,.39],[.27,.32],[.33,.25],[.41,.20],[.50,.18],[.61,.20],[.69,.26],[.75,.35],[.76,.43],[.72,.51],[.62,.57],[.55,.58],[.55,.40],[.45,.40],[.44,.58],[.36,.58],[.28,.53],[.235,.46]]))return 'gills';
 if(kind==='mold'){
  if(!maskContains('mold:feature',p))return;
  if([[.38,.17,.057,.086],[.665,.30,.060,.095],[.50,.60,.055,.09]].some(([x,y,rx,ry])=>((p.x-x)/rx)**2+((p.y-y)/ry)**2<=1))return 'round';
  return 'thread';
 }
 if(kind==='spirogyra'&&maskContains('spirogyra:feature',p))return 'filament';
}
export function changedAt(kind:string,pins:number[],p:Point){
 if(pins.length!==2||!pins.every(Number.isInteger)||pins[0]<0||pins[1]>3||pins[0]>=pins[1]||p.x<0||p.x>=1||p.y<0||p.y>=1)return false;
 return maskContains(`${kind}:${pins[0]}-${pins[1]}`,p);
}
export function markValid(task:InquiryTask,r:InquiryRecord,p:Point){return task.kind==='timeline'?changedAt(task.organism||'',r.pins,p):!!featureAt(task.organism||'',p);}
export function addMark(task:InquiryTask,r:InquiryRecord,p:Point){if(!markValid(task,r,p))return false;r.marks.push(p);r.marks=r.marks.slice(-8);return true;}
export function markHint(task:InquiryTask){return task.kind==='timeline'?'이 표시는 새 변화가 확인되지 않는 곳이에요. 이전 표시를 유지했어요. 전후를 겹쳐 새 곰팡이나 새로 사라진 잎 부분을 찾아요.':'이 표시는 특징 밖이에요. 앞서 찾은 표시는 유지했어요. 그림의 주름·가는 실·둥근 부분을 다시 살펴봐요.';}
