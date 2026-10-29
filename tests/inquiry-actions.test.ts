import {describe,it,expect} from 'vitest';
import {inquiryTasks} from '../src/curriculum';
import {emptyRecord} from '../src/inquiry-model';
import {assignCard,chooseCase,syncBuildLinks} from '../src/inquiry-actions';
import {designCorrect,startRun,currentRun} from '../src/inquiry-runs';
const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;

describe('중복 조작 없는 자료 배치',()=>{
 it('분류 오류도 수정 가능한 배치로 남기며 임의의 자료나 칸은 거절한다',()=>{
  const t=task('M1-1'),r=emptyRecord(),item=t.items[0],wrong=t.targets.find(v=>v.id!==item.target)!;
  expect(assignCard(t,r,item.id,wrong.id)).toBe(true);expect(r.assignments[item.id]).toBe(wrong.id);
  expect(assignCard(t,r,item.id,item.target)).toBe(true);expect(r.assignments[item.id]).toBe(item.target);
  expect(assignCard(t,r,item.id,item.target)).toBe(false);
  expect(assignCard(t,r,'unknown',item.target)).toBe(false);expect(assignCard(t,r,item.id,'unknown')).toBe(false);
 });
 it('맞닿은 설계 칸만 자동으로 잇고 빈 칸이나 정답은 대신 채우지 않는다',()=>{
  const t=task('M5-1'),r=emptyRecord();
  assignCard(t,r,'milk','input');expect(r.assignments.edge1).toBeUndefined();
  assignCard(t,r,'yogurt','output');expect(r.assignments.edge1).toBeUndefined();expect(r.assignments.edge2).toBeUndefined();
  assignCard(t,r,'water','action');expect(r.assignments.edge1).toBe('linked');expect(r.assignments.edge2).toBe('linked');expect(designCorrect(t,r)).toBe(false);
  assignCard(t,r,'lactic','action');expect(designCorrect(t,r)).toBe(true);
 });
 it('같은 카드를 다시 놓아도 예상과 실행 기록을 잃지 않는다',()=>{
  const t=task('M5-1'),r=emptyRecord();for(const item of t.items)if(item.target)assignCard(t,r,item.id,item.target);
  r.prediction='stopped';const run=startRun(r);run.status='completed';run.result=r.runResult='supported';run.reflection=r.reflection='differs';
  const before=structuredClone(r);expect(assignCard(t,r,'milk','input')).toBe(false);expect(r).toEqual(before);expect(currentRun(r)).toBe(run);
  expect(assignCard(t,r,'water','input')).toBe(true);expect(r.prediction).toBe('');expect(r.runResult).toBe('');expect(r.reflection).toBe('');expect(currentRun(r)).toBeUndefined();expect(r.runs).toHaveLength(1);
 });
 it('예전 저장의 연결 버튼 누르기 전 상태도 자동 연결하며 완료 기록은 유지한다',()=>{
  const t=task('M5-1'),r=emptyRecord();r.assignments={input:'milk',action:'lactic',output:'yogurt'};r.prediction='supported';
  expect(syncBuildLinks(t,r)).toBe(true);expect(designCorrect(t,r)).toBe(true);expect(r.prediction).toBe('');
  r.prediction='supported';expect(syncBuildLinks(t,r)).toBe(false);expect(r.prediction).toBe('supported');
 });
 it('소개 사례를 바꿀 때만 이전 작용과 문장을 비우고 새 사례 근거를 함께 선택한다',()=>{
  const t=task('M5-4'),r=emptyRecord();expect(chooseCase(t,r,'yogurt')).toBe(true);expect(r.assignments.evidence).toBe('yogurt');
  r.assignments.action='lactic';r.note='요구르트 소개';const before=structuredClone(r);expect(chooseCase(t,r,'yogurt')).toBe(false);expect(r).toEqual(before);
  expect(chooseCase(t,r,'bread')).toBe(true);expect(r.assignments).toEqual({case:'bread',action:'',evidence:'bread'});expect(r.note).toBe('');expect(chooseCase(t,r,'unknown')).toBe(false);
 });
});
