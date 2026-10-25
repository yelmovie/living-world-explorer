import {describe,it,expect} from 'vitest';
import {MAP_WIDTH,MAP_HEIGHT,mapSpawn,locations,pathGraph,pathSegments,destinationNodeIds,nearestRoadPoint,routeBetween} from '../src/mapData';

const near=(a:{x:number;y:number},b:{x:number;y:number},epsilon=.01)=>Math.hypot(a.x-b.x,a.y-b.y)<epsilon;
const isRoadPoint=(p:{x:number;y:number})=>near(p,nearestRoadPoint(p));

describe('마을 지도의 실제 길과 도착',()=>{
 it('모든 시설 문으로 출발 광장에서 이어진 길이 있고 끝점은 문 바닥이다',()=>{
  expect(destinationNodeIds).toHaveLength(6);
  destinationNodeIds.forEach((id,index)=>{
   const route=routeBetween(mapSpawn,id);
   expect(route.length).toBeGreaterThan(1);
   expect(near(route.at(-1)!,locations[index])).toBe(true);
   route.forEach(p=>{expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);expect(p.x>=0&&p.x<=MAP_WIDTH&&p.y>=0&&p.y<=MAP_HEIGHT).toBe(true);});
  });
 });
 it('한 시설에서 다른 시설로 다시 선택해도 연결된 도로 구간만 통과한다',()=>{
  for(const from of locations)for(const target of destinationNodeIds){
   const route=routeBetween(from,target);
   for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i];
    expect(pathSegments.some(([u,v])=>near(a,u)&&near(b,v)||near(a,v)&&near(b,u))).toBe(true);
   }
  }
 });
 it('길 중간에 새 목적지를 선택한 경우 현재 발 위치를 길에 투영한다',()=>{
  const [a,b]=pathSegments.find(([u,v])=>Math.hypot(u.x-v.x,u.y-v.y)>100)!;
  const midway={x:a.x+(b.x-a.x)*.43,y:a.y+(b.y-a.y)*.43};
  const projected=nearestRoadPoint({x:midway.x+3,y:midway.y-3});
  expect(isRoadPoint(projected)).toBe(true);
  for(const id of destinationNodeIds){
   const route=routeBetween(projected,id);
   expect(route.length).toBeGreaterThan(0);
   // The first interpolation remains on a road, instead of cutting across the village.
   const leg=[projected,...route];for(let i=1;i<leg.length;i++)for(let t=0;t<=1;t+=.1){const a=leg[i-1],b=leg[i],p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};expect(isRoadPoint(p)).toBe(true);}
  }
 });
 it('중앙 연구소의 벽과 지붕 앞을 대각선으로 가로지르는 지름길이 없다',()=>{
  const blocked=[{x:555,y:250,w:180,h:135},{x:620,y:195,w:60,h:50},{x:870,y:460,w:100,h:75}];
  for(const [a,b] of pathSegments)for(let step=0;step<=30;step++){
   const t=step/30,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
   expect(blocked.some(r=>p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h)).toBe(false);
  }
 });
 it('도로 연결은 양방향이고 없는 목적지는 안전하게 거절한다',()=>{
  for(const node of pathGraph)for(const id of node.neighbors)expect(pathGraph.find(n=>n.id===id)?.neighbors).toContain(node.id);
  expect(routeBetween(mapSpawn,'unknown')).toEqual([]);
 });
});
