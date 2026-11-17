import {describe,it,expect} from 'vitest';
import {tasksFor} from '../src/curriculum';
import {emptyRecord,recoverInquiry} from '../src/inquiry-model';
import {taskIssues} from '../src/inquiry-evaluate';
import {prepareInquiry} from '../src/inquiry-preparation';
import {guidance} from '../src/inquiry-guidance';
import {germExample,germSummary,isGermTask,JAR_GOAL} from '../src/germ-lab';
import {makeAttempt} from '../src/model';
import {restoreAttempt} from '../src/storage';

const [zoom,catchTask,culture,exhibit]=tasksFor('M3');
const done=(t:typeof zoom)=>{const r=prepareInquiry(t);Object.assign(r.assignments,germExample(t));return r;};

describe('M3 자료 연구실 세균 실험',()=>{
 it('네 활동이 모두 손으로 하는 새 게임이다',()=>{expect(tasksFor('M3').map(t=>t.kind)).toEqual(['zoom','catch','culture','exhibit']);expect(tasksFor('M3').every(isGermTask)).toBe(true);expect(tasksFor('M3').every(t=>t.standard==='4과12-01')).toBe(true);});
 it('확대: 예상하고, 끝까지 확대하고, 세균을 눌러야 끝난다',()=>{
  const r=prepareInquiry(zoom);expect(taskIssues(zoom,r)).toHaveLength(3);
  r.assignments.guess='100';r.assignments.reach='2';expect(taskIssues(zoom,r)).toHaveLength(2);
  r.assignments.reach='3';r.assignments.found='yes';expect(taskIssues(zoom,r)).toEqual([]);expect(guidance(zoom,r).ready).toBe(true);
  // Saving and loading keeps the finished zoom (record.level is capped at 2 on load).
  expect(taskIssues(zoom,recoverInquiry({version:1,current:{},rewards:[],records:{'M3-1':r}}).records['M3-1'])).toEqual([]);
 });
 it('포획: 공·막대·나선 표본병을 두 마리씩 채운다',()=>{
  const r=done(catchTask);expect(taskIssues(catchTask,r)).toEqual([]);
  r.assignments.jar_spiral=String(JAR_GOAL-1);expect(taskIssues(catchTask,r)).toHaveLength(1);expect(guidance(catchTask,r)).toMatchObject({done:2,total:3,ready:false});
 });
 it('배양: 세 곳 이상 채집하고, 사흘을 키우고, 여러 곳에 산다고 정리한다',()=>{
  const r=done(culture);expect(taskIssues(culture,r)).toEqual([]);
  r.assignments.dish_pond='loaded';expect(taskIssues(culture,r).length).toBe(1);r.assignments.dish_pond='streaked';
  r.assignments.conclusion='soil';expect(taskIssues(culture,r).length).toBe(1);r.assignments.conclusion='many';
  delete r.assignments.days;expect(taskIssues(culture,r).length).toBe(1);
 });
 it('전시: 큰 것부터 놓고 문장의 세 빈칸을 관찰과 맞게 고른다',()=>{
  const r=done(exhibit);expect(taskIssues(exhibit,r)).toEqual([]);
  r.assignments.order='bacteria,paramecium,mushroom';expect(taskIssues(exhibit,r).length).toBe(1);r.assignments.order='mushroom,paramecium,bacteria';
  r.assignments.blank_place='water';expect(taskIssues(exhibit,r).length).toBe(1);
 });
 it('조사 기록 사건의 단서 칸(case_*)과 겹치지 않는다',()=>{for(const t of tasksFor('M3'))expect(Object.keys(germExample(t)).some(k=>k.startsWith('case_'))).toBe(false);});
 it('예전 카드 활동 기록은 다시 시작하고, 새 기록과 완료한 연구 기록은 지킨다',()=>{
  const a=makeAttempt();const old=emptyRecord();old.assignments={shape:'evidence',rumor:'guess'};old.completedAt='2026-11-01T00:00:00Z';
  a.inquiry.records['M3-1']=old;a.inquiry.records['M3-2']={...done(catchTask),completedAt:'2026-11-17T00:00:00Z'};
  const restored=restoreAttempt(a);expect(restored.inquiry.records['M3-1']).toBeUndefined();expect(restored.inquiry.records['M3-2'].assignments.jar_round).toBe(String(JAR_GOAL));
  expect(germSummary(zoom,old)).toEqual(['이전 버전 활동으로 완료한 기록이에요.']);
 });
});
