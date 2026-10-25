import {describe,it,expect} from 'vitest';
import {cardContent} from '../src/export';
import {makeState} from '../src/model';
import {emptyRecord} from '../src/inquiry-model';

describe('현재 소개 카드의 사례와 근거',()=>{
 it.each([
  ['yogurt','요구르트','특정 세균의 작용','음식 만들기','assets/study-yogurt.webp'],
  ['bread','빵 반죽','효모의 작용','반죽을 부풀','assets/specimen-dough-after.webp'],
  ['leaf','낙엽 분해','균류·세균의 분해 작용','분해하는 데 관여','assets/specimen-leaf-time-3-v2.webp']
 ])('%s 선택을 요구르트 고정 문구로 바꾸지 않는다',(caseId,label,action,description,art)=>{
  const state=makeState();const record=emptyRecord();record.assignments.case=caseId;record.note='내가 이 사례에서 찾아낸 근거예요.';state.learner.inquiry.records['M5-4']=record;
  const content=cardContent(state);
  expect(content.caseId).toBe(caseId);expect(content.caseLabel).toBe(label);expect(content.action).toBe(action);expect(content.description).toContain(description);expect(content.note).toBe(record.note);expect(content.art).toBe(art);
 });
 it('시연 카드는 시연 내용만 읽고 결과 화면의 수정 문장을 우선한다',()=>{
  const state=makeState();const learner=emptyRecord();learner.assignments.case='yogurt';learner.note='학생의 원래 소개 문장이에요.';state.learner.inquiry.records['M5-4']=learner;
  const preview=emptyRecord();preview.assignments.case='bread';preview.note='시연 활동에서 쓴 문장이에요.';state.preview.inquiry.records['M5-4']=preview;state.preview.cardNote='시연 결과 화면에서 고친 문장이에요.';state.settings.admin=true;
  expect(cardContent(state)).toMatchObject({caseId:'bread',caseLabel:'빵 반죽',note:'시연 결과 화면에서 고친 문장이에요.'});
  expect(state.learner.inquiry.records['M5-4'].note).toBe('학생의 원래 소개 문장이에요.');
 });
});
