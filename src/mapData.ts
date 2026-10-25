import type {Point} from './model';

export const MAP_WIDTH=1280;
export const MAP_HEIGHT=720;
export const mapSpawn:Point={x:640,y:650};
/** Ground-plane door coordinates shared by the composition-matched v3 terrain. */
export const locations:Point[]=[{x:350,y:195},{x:878,y:195},{x:1078,y:404},{x:858,y:582},{x:268,y:540},{x:640,y:415}];
export const mapNodes=locations.map((p,index)=>({
 ...p,index,percentX:p.x/MAP_WIDTH*100,percentY:p.y/MAP_HEIGHT*100,
 label:['버섯숲 표본실','연못 관찰소','자료 연구실','생활마을','BIO 작업실','중앙 연구소'][index],
 entry:['fungi-field','water-sampling','bacteria-sources','impact-investigation','solution-assembly','final-report'][index]
}));

/** Broad tan roads around the central observatory; building interiors are never crossed. */
export const pathGraph:{id:string;point:Point;neighbors:string[]}[]=[
 {id:'spawn',point:mapSpawn,neighbors:['south']},
 {id:'south',point:{x:640,y:505},neighbors:['spawn','southwest','southeast','core','market-turn']},
 {id:'southwest',point:{x:445,y:465},neighbors:['south','west','green-approach']},
 {id:'west',point:{x:350,y:350},neighbors:['southwest','northwest']},
 {id:'northwest',point:{x:430,y:245},neighbors:['west','north','door0']},
 {id:'north',point:{x:610,y:205},neighbors:['northwest']},
 {id:'northeast',point:{x:818,y:235},neighbors:['east','door1']},
 {id:'east',point:{x:947,y:335},neighbors:['northeast','southeast','archive-approach']},
 {id:'southeast',point:{x:820,y:455},neighbors:['east','south']},
 {id:'green-approach',point:{x:440,y:535},neighbors:['southwest','door4']},
 {id:'market-turn',point:{x:650,y:580},neighbors:['south','food-approach']},
 {id:'food-approach',point:{x:735,y:580},neighbors:['market-turn','door3']},
 {id:'door0',point:locations[0],neighbors:['northwest']},
 {id:'door1',point:locations[1],neighbors:['northeast']},
 {id:'archive-approach',point:{x:1000,y:415},neighbors:['east','door2']},
 {id:'door2',point:locations[2],neighbors:['archive-approach']},
 {id:'door3',point:locations[3],neighbors:['food-approach']},
 {id:'door4',point:locations[4],neighbors:['green-approach']},
 {id:'core',point:locations[5],neighbors:['south']}
];
export const destinationNodeIds=['door0','door1','door2','door3','door4','core'];
export const pathWaypoints=pathGraph.map(n=>({...n.point}));
export const pathSegments=pathGraph.flatMap(n=>n.neighbors.filter(id=>id>n.id).map(id=>[n.point,pathGraph.find(p=>p.id===id)!.point] as [Point,Point]));
export const mapAssets={terrain:'assets/map-terrain-v3.webp',moaPortrait:'assets/moa-portrait.webp',companionPortrait:'assets/companion-portrait.webp'};

export function nearestRoadPoint(point:Point):Point{
 let best={...mapSpawn};let distance=Infinity;
 for(const [a,b] of pathSegments){const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));const p={x:a.x+t*dx,y:a.y+t*dy};const d=Math.hypot(point.x-p.x,point.y-p.y);if(d<distance){distance=d;best=p;}}
 return best;
}
export function routeBetween(start:Point,targetId:string):Point[]{
 if(!pathGraph.some(n=>n.id===targetId))return [];
 const project=(a:Point,b:Point)=>{const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((start.x-a.x)*dx+(start.y-a.y)*dy)/(dx*dx+dy*dy)));return {x:a.x+t*dx,y:a.y+t*dy};};
 const edge=pathSegments.reduce((best,next)=>{const a=project(...best),b=project(...next);return Math.hypot(start.x-a.x,start.y-a.y)<=Math.hypot(start.x-b.x,start.y-b.y)?best:next;});
 const origin=project(...edge);
 // The two endpoints of the CURRENT road are the only legal starting nodes.
 // A globally nearer node can belong to another branch across a garden or a wall.
 const seeds=edge.map(p=>pathGraph.find(n=>Math.hypot(n.point.x-p.x,n.point.y-p.y)<.01)!);
 const distances=new Map(pathGraph.map(n=>[n.id,Infinity]));for(const n of seeds)distances.set(n.id,Math.hypot(origin.x-n.point.x,origin.y-n.point.y));
 const previous=new Map<string,string>();const open=new Set(pathGraph.map(n=>n.id));
 while(open.size){const id=[...open].sort((a,b)=>distances.get(a)!-distances.get(b)!)[0];open.delete(id);if(id===targetId||!Number.isFinite(distances.get(id)))break;const node=pathGraph.find(n=>n.id===id)!;for(const next of node.neighbors){if(!open.has(next))continue;const dest=pathGraph.find(n=>n.id===next)!;const cost=distances.get(id)!+Math.hypot(node.point.x-dest.point.x,node.point.y-dest.point.y);if(cost<distances.get(next)!){distances.set(next,cost);previous.set(next,id);}}}
 if(!Number.isFinite(distances.get(targetId)))return [];
 const ids=[targetId];while(previous.has(ids[0]))ids.unshift(previous.get(ids[0])!);
 const points=ids.map(id=>({...pathGraph.find(n=>n.id===id)!.point}));if(Math.hypot(points[0].x-origin.x,points[0].y-origin.y)>.01)points.unshift(origin);return points;
}
