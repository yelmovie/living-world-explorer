import {describe,it,expect} from 'vitest';
import {inquiryTasks} from '../src/curriculum';
import {artFor,artFrame,artKey,artTime} from '../src/artAssets';

describe('학습 자료의 의미와 표본 이미지 연결',()=>{
 const item=(task:string,id:string)=>inquiryTasks.find(t=>t.id===task)!.items.find(i=>i.id===id)!;
 it('죽은 나무와 버섯의 관찰 특징을 서로 다른 그림으로 표시한다',()=>{
  expect(artKey(item('M1-1','log'))).toBe('deadwood');
  expect(artKey(item('M1-1','gills'))).toBe('mushroom');
  expect(artKey(item('M1-4','env1'))).toBe('deadwood');
 });
 it('곰팡이 핀 빵은 시간 비교의 마지막 표본과 같은 그림이다',()=>{
  const bread=item('M1-1','bread'),kind=artKey(bread);
  expect(artFor(kind,artTime(kind,bread.detail,bread.id))?.src).toBe(artFor('bread',3)?.src);
  expect(artFor('bread',0)?.src).not.toBe(artFor('bread',3)?.src);
  expect(new Set([0,1,2,3].map(t=>artFor('bread',t)?.src)).size).toBe(4);
 });
 it('반죽의 재료·결과와 곰팡이가 핀 과일을 구분한다',()=>{
  expect(artKey(item('M5-2','dough'))).toBe('dough');
  expect(artKey(item('M5-2','risen'))).toBe('risenDough');
  expect(artKey(item('M5-4','bread'))).toBe('risenDough');
  expect(artKey(item('M4-4','fruit-case'))).toBe('moldyFruit');
 });
 it('모든 활동 자료가 명확한 그림과 시간 단계로 연결된다',()=>{
  for(const task of inquiryTasks)for(const it of task.items){const kind=artKey(it);if(kind==='question')continue;const art=artFor(kind,artTime(kind,it.detail,it.id));expect(art,it.id).toBeDefined();expect(art!.src,it.id).toMatch(/^assets\/.+\.webp$/);}
  for(const kind of ['bread','leaf'])expect(new Set([0,1,2,3].map(time=>artFor(kind,time)!.src)).size).toBe(4);
 });
 it('기존 시간 값은 보존하면서 그림 번호만 안전하게 정한다',()=>{
  expect(artFrame(-1)).toBe(0);expect(artFrame(9)).toBe(3);expect(artFrame(Number.NaN)).toBe(0);
  expect(artTime('leaf','분해되어 달라진 낙엽','changed')).toBe(3);
  expect(artTime('leaf','분해가 멈춘 낙엽','sealed')).toBe(0);
 });
});
