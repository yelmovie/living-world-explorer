import {describe,it,expect} from 'vitest';
import {ownedRewardCards,wonRewardCards} from '../src/reward-card-set';
describe('성취 카드',()=>{
 it('세 번 맞힌 악당의 카드만 가진 것으로 본다',()=>{
  expect(ownedRewardCards(undefined)).toEqual([false,false,false,false,false]);
  expect(ownedRewardCards({M1:3,M2:2,M4:3})).toEqual([true,false,false,true,false]);
 });
 it('타격 수가 3이 되는 순간에만 카드를 얻는다',()=>{
  expect(wonRewardCards({M1:2},{M1:3})).toEqual([0]);
  expect(wonRewardCards(undefined,{M3:1})).toEqual([]);
  // The map hands over every hit of the visit again, so an earlier win must not come back.
  expect(wonRewardCards({M1:3,M2:2},{M1:3,M2:3})).toEqual([1]);
  expect(wonRewardCards({M5:3},{M5:3})).toEqual([]);
 });
});
