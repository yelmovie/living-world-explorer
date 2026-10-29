import {describe,it,expect} from 'vitest';
import {inquiryTasks} from '../src/curriculum';
import {taskIssues} from '../src/inquiry-evaluate';
import {prepareInquiry,validTrackPair,validTimelinePair,reflectClaim,introduction} from '../src/inquiry-preparation';
import {assignCard,chooseCase} from '../src/inquiry-actions';
import {designCorrect} from '../src/inquiry-runs';
const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;
describe('준비를 줄여도 남겨야 하는 학생의 판단',()=>{
 it('어떤 활동도 준비만으로 완료되지는 않는다',()=>{for(const t of inquiryTasks)expect(taskIssues(t,prepareInquiry(t)).length,t.id).toBeGreaterThan(0);});
 it('두 번째 설계도에서도 생물 작용을 잘못 고르면 가동 성공이 아니다',()=>{const t=task('M5-2'),r=prepareInquiry(t);expect(r.assignments.action).toBeUndefined();assignCard(t,r,'bacterium','action');expect(designCorrect(t,r)).toBe(false);assignCard(t,r,'yeast','action');expect(designCorrect(t,r)).toBe(true);expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('같은 순간·뒤집은 전후·B만 저장한 값으로 비교를 통과하지 않는다',()=>{for(const pins of [[1,1],[0,2],[,5]] as number[][])expect(validTrackPair({pins})).toBe(false);for(const pins of [[3,0],[1,1],[,3],[0,4],[0,1.5]] as number[][])expect(validTimelinePair({pins})).toBe(false);expect(validTrackPair({pins:[0,5]})).toBe(true);expect(validTimelinePair({pins:[0,3]})).toBe(true);});
 it('주장 유지·수정은 실제 처음 생각과 현재 주장을 따라간다',()=>{const r=prepareInquiry(task('M3-4'));r.assignments.initial='allbad';reflectClaim(r);expect(r.assignments.decision).toBeUndefined();r.assignments.claim='somehelp';reflectClaim(r);expect(r.assignments.decision).toBe('revise');r.assignments.initial='somehelp';reflectClaim(r);expect(r.assignments.decision).toBe('keep');});
 it('잘못된 사례·작용으로 소개 문장을 만들지 않고 새 사례의 문장은 다시 만든다',()=>{const t=task('M5-4'),r=prepareInquiry(t);chooseCase(t,r,'yogurt');r.assignments.action='yeast';expect(introduction(t,r)).toBe('');r.assignments.action='lactic';r.note=introduction(t,r);expect(r.note).toContain('특정 세균');chooseCase(t,r,'bread');expect(r.note).toBe('');expect(r.assignments.evidence).toBe('bread');r.assignments.action='yeast';expect(introduction(t,r)).toContain('효모');});
});
