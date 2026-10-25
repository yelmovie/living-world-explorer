import {describe,it,expect} from 'vitest';
import {inquiryTasks,tasksFor} from '../src/curriculum';
import {emptyInquiry,emptyRecord,recoverInquiry} from '../src/inquiry-model';
import {taskIssues,inquiryComplete,invalidateRun} from '../src/inquiry-evaluate';
import {makeAttempt,makeState} from '../src/model';
import {restoreAttempt} from '../src/storage';

function valid(id:string){const t=inquiryTasks.find(t=>t.id===id)!;const r=emptyRecord();r.opened=t.items.map(i=>i.id);for(const it of t.items){if(['collect','connect','sort'].includes(t.kind))r.assignments[it.id]=it.target;else if(t.kind==='build'&&it.target)r.assignments[it.target]=it.id;}
 if(t.kind==='microscope'){r.focus=65;r.capture=true;r.marks=t.organism==='mushroom'?[{x:.5,y:.4}]:t.organism==='mold'?[{x:.32,y:.3},{x:.65,y:.4}]:[{x:.45,y:.5}];}
 if(t.kind==='sample'){r.sequence=3;r.assignments.site='plant';}if(t.kind==='track')r.pins=[0,5];if(t.kind==='timeline'){r.pins=[0,3];r.marks=[{x:.52,y:.48}];r.opened.push('process');}if(t.kind==='build'){r.assignments.edge1='linked';r.assignments.edge2='linked';r.prediction='supported';r.runResult='supported';r.reflection='matches';}if(t.kind==='publish'){r.assignments.case='yogurt';r.assignments.action='lactic';r.note='세균의 작용을 음식 만들기에 이용해요.';}return r;}

describe('스무 가지 탐구의 학습 근거',()=>{
 it('다섯 스테이지마다 서로 연결된 네 탐구가 있고 모두 성취기준에 연결된다',()=>{expect(inquiryTasks).toHaveLength(20);for(const s of ['M1','M2','M3','M4','M5'] as const){expect(tasksFor(s)).toHaveLength(4);expect(tasksFor(s).every(t=>/^4과12-0[123]$/.test(t.standard))).toBe(true);}});
 for(const t of inquiryTasks){it(`${t.id}: 유효한 관찰·연결·설명만 완료로 인정한다`,()=>{expect(taskIssues(t,emptyRecord()).length).toBeGreaterThan(0);expect(taskIssues(t,valid(t.id))).toEqual([]);});}
 it('읽지 않은 정답 연결을 근거로 인정하지 않는다',()=>{const r=valid('M1-1');r.opened=[];expect(taskIssues(inquiryTasks[0],r).length).toBeGreaterThan(0);});
 it('B만 고정한 sparse 배열은 A/B 비교가 아니다',()=>{for(const id of ['M2-3','M4-1']){const r=valid(id);r.pins=[];r.pins[1]=3;expect(taskIssues(inquiryTasks.find(t=>t.id===id)!,r).length).toBeGreaterThan(0);}});
 it('흐린 촬영과 표본 밖의 표시는 거부한다',()=>{const t=inquiryTasks.find(t=>t.id==='M1-2')!,r=valid(t.id);r.focus=10;expect(taskIssues(t,r).length).toBeGreaterThan(0);r.focus=65;r.marks=[{x:.01,y:.01}];expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('한 곳을 반복 표시해 곰팡이 두 특징으로 세지 않는다',()=>{const t=inquiryTasks.find(t=>t.id==='M1-3')!,r=valid(t.id);r.marks=[{x:.32,y:.3},{x:.33,y:.31}];expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('같은 장면과 뒤집은 전후는 시간 비교가 아니다',()=>{const t=inquiryTasks.find(t=>t.id==='M4-1')!,r=valid(t.id);r.pins=[3,0];expect(taskIssues(t,r).length).toBeGreaterThan(0);r.pins=[2,2];expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('실행 성공 뒤 설계를 바꾸면 새 예상과 실행이 필요하다',()=>{const t=inquiryTasks.find(t=>t.id==='M5-1')!,r=valid(t.id);invalidateRun(r);expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('예상이 틀려도 실제 결과를 근거로 비교하면 통과한다',()=>{const t=inquiryTasks.find(t=>t.id==='M5-1')!,r=valid(t.id);r.prediction='stopped';r.reflection='differs';expect(taskIssues(t,r)).toEqual([]);});
 it('잘못 연결한 사례와 작용은 소개 카드로 완료할 수 없다',()=>{const t=inquiryTasks.find(t=>t.id==='M5-4')!,r=valid(t.id);r.assignments.action='yeast';expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('하나의 활동이나 클릭 횟수만으로 스테이지가 끝나지 않는다',()=>{const p=emptyInquiry();p.records['M1-1']={...valid('M1-1'),completedAt:new Date().toISOString(),tries:999};expect(inquiryComplete(p,'M1')).toBe(false);});
 it('네 근거의 불변 스냅샷은 저장 복원 뒤에도 유효하다',()=>{const a=makeAttempt();for(const t of tasksFor('M1'))a.inquiry.records[t.id]={...valid(t.id),completedAt:new Date().toISOString()};a.evidence.M1={stage:'M1',attemptId:a.id,origin:'learner',created:new Date().toISOString(),summary:'관찰',draft:a.draft,inquiry:structuredClone(a.inquiry)};a.inquiry.records['M1-2'].focus=0;const restored=restoreAttempt(a);expect(restored.evidence.M1).toBeDefined();expect(restored.evidence.M1?.inquiry?.records['M1-2'].focus).toBe(65);});
 it('손상된 탐구 좌표와 비정상 수치는 복원할 때 걸러낸다',()=>{const r=valid('M1-2');r.focus=NaN;r.marks=[{x:999,y:0},{x:.5,y:.4}];const p=recoverInquiry({version:1,records:{'M1-2':r}});expect(p.records['M1-2'].focus).toBe(25);expect(p.records['M1-2'].marks).toHaveLength(1);});
 it('새 전체 해금 공간에는 완료 기록이나 보상이 없다',()=>{const s=makeState();s.settings.admin=true;expect(s.preview.evidence).toEqual({});expect(s.preview.inquiry.rewards).toEqual([]);});
});
