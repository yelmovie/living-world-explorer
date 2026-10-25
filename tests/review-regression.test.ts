import {describe,it,expect} from 'vitest';
import {featureAt,changedAt,imageToView,viewToImage,addMark} from '../src/observation';
import {emptyRecord} from '../src/inquiry-model';
import {inquiryTasks} from '../src/curriculum';
import {taskIssues,invalidateRun} from '../src/inquiry-evaluate';
import {startRun,currentRun} from '../src/inquiry-runs';
import {publishRecord,acceptedRecord} from '../src/inquiry-records';
import {makeAttempt,makeState} from '../src/model';
import {restoreAttempt} from '../src/storage';
import {cardContent} from '../src/export';
const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;
function build(prediction='supported'){const r=emptyRecord(),t=task('M5-1');for(const i of t.items)if(i.target)r.assignments[i.target]=i.id;r.assignments.edge1=r.assignments.edge2='linked';r.prediction=prediction;const run=startRun(r);run.status='completed';run.result=r.runResult='supported';run.reflection=r.reflection=prediction==='supported'?'matches':'differs';return r;}
describe('이미지와 표시 판정의 일치',()=>{
 it.each([[.5,.24],[.34,.33],[.67,.42],[.34,.53]])('실제 주름 (%s,%s)을 모두 인정한다',(x,y)=>expect(featureAt('mushroom',{x,y})).toBe('gills'));
 it.each([[.5,.1],[.5,.7],[.2,.35],[.79,.4]])('갓 표면·자루·인접 배경 (%s,%s)은 거절한다',(x,y)=>expect(featureAt('mushroom',{x,y})).toBeUndefined());
 it('곰팡이는 실제 둥근 부분과 실을 구분하고 빈 배경을 거절한다',()=>{expect(featureAt('mold',{x:.38,y:.17})).toBe('round');expect(featureAt('mold',{x:.36,y:.5})).toBe('thread');expect(featureAt('mold',{x:.7,y:.1})).toBeUndefined();});
 it('곰팡이의 서로 다른 실제 특징은 머리 두 곳이나 머리·실 조합 모두 인정한다',()=>{const r=emptyRecord();r.focus=65;r.capture=true;r.marks=[{x:.38,y:.17},{x:.665,y:.3}];expect(taskIssues(task('M1-3'),r)).toEqual([]);r.marks=[{x:.38,y:.17},{x:.381,y:.171}];expect(taskIssues(task('M1-3'),r).length).toBeGreaterThan(0);});
 it('해캄은 녹색 실과 그 사이의 배경을 구분한다',()=>{expect(featureAt('spirogyra',{x:.45,y:.5})).toBe('filament');expect(featureAt('spirogyra',{x:.9,y:.1})).toBeUndefined();});
 it('깨끗한 빵 부분은 모든 전후 조합에서 거절한다',()=>{for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)expect(changedAt('bread',[a,b],{x:.35,y:.48})).toBe(false);});
 it('빵과 낙엽의 서로 다른 실제 변화 영역은 인정한다',()=>{expect(changedAt('bread',[0,3],{x:.49,y:.4})).toBe(true);expect(changedAt('bread',[0,3],{x:.62,y:.66})).toBe(true);expect(changedAt('leaf',[0,3],{x:.51,y:.54})).toBe(true);expect(changedAt('leaf',[0,3],{x:.5,y:.3})).toBe(true);});
 it('동일 시점·역순·새 변화 없는 위치를 거절한다',()=>{expect(changedAt('bread',[2,2],{x:.49,y:.4})).toBe(false);expect(changedAt('leaf',[3,0],{x:.51,y:.54})).toBe(false);expect(changedAt('leaf',[0,3],{x:.8,y:.3})).toBe(false);});
 it('표시를 잘못해도 이미 찾은 올바른 표시를 지우지 않는다',()=>{const r=emptyRecord();expect(addMark(task('M1-2'),r,{x:.5,y:.24})).toBe(true);expect(addMark(task('M1-2'),r,{x:.1,y:.1})).toBe(false);expect(r.marks).toEqual([{x:.5,y:.24}]);});
 it.each([1,1.5,2])('확대 %s배·이동을 왕복해도 원본 좌표를 보존한다',zoom=>{for(const pan of [{x:0,y:0},{x:.2,y:-.15}]){const p={x:.34,y:.33},actual=viewToImage(imageToView(p,{zoom,pan}),{zoom,pan});expect(actual.x).toBeCloseTo(p.x);expect(actual.y).toBeCloseTo(p.y);}});
});
describe('실행 당시 예상과 검증 기록 보호',()=>{
 it('실행 후 예상만 바꾸어 이전 결과를 새 예상으로 제출할 수 없다',()=>{const r=build();r.prediction='stopped';r.reflection='differs';expect(currentRun(r)).toBeUndefined();expect(taskIssues(task('M5-1'),r).length).toBeGreaterThan(0);expect(r.runs[0].prediction).toBe('supported');});
 it('틀린 예상도 실제 실행과 비교하면 통과한다',()=>{expect(taskIssues(task('M5-1'),build('stopped'))).toEqual([]);});
 it('설계·연결 수정과 중단된 실험은 옛 결과를 재사용하지 않는다',()=>{const r=build();r.assignments.edge1='';expect(currentRun(r)).toBeUndefined();invalidateRun(r);expect(r.runs).toHaveLength(1);const next=startRun(r);next.status='interrupted';expect(currentRun(r)).toBeUndefined();});
 it('관찰 후 생각은 실행 당시 예상을 바꾸지 않는다',()=>{const r=build();r.afterThought='stopped';expect(taskIssues(task('M5-1'),r)).toEqual([]);expect(currentRun(r)?.prediction).toBe('supported');});
 it('재탐구 초안과 오답은 도감·내보내기의 유효 기록을 바꾸지 않는다',()=>{const s=makeState(),a=s.learner,t=task('M5-4'),r=emptyRecord();Object.assign(r.assignments,{case:'yogurt',action:'lactic',evidence:'yogurt'});r.note='원래 검증 기록';r.completedAt='2026-10-25';a.inquiry.records[t.id]=r;a.evidence.M5={stage:'M5',attemptId:a.id,origin:'learner',created:'2026-10-25',summary:'설계',draft:a.draft,inquiry:structuredClone(a.inquiry)};r.note='아직 제출하지 않은 초안';r.assignments.action='yeast';expect(publishRecord(a,t,r)).toBe(false);expect(acceptedRecord(a,t.id)?.note).toBe('원래 검증 기록');expect(cardContent(s).note).toBe('원래 검증 기록');r.assignments.action='lactic';expect(publishRecord(a,t,r)).toBe(true);expect(cardContent(s).note).toBe(r.note);expect(a.inquiry.rewards).toEqual([]);});
 it('새 판정 기준 때문에 이전 완료 기록·보상을 잃지 않는다',()=>{const a=makeAttempt();for(const t of inquiryTasks.filter(t=>t.stage==='M1'))a.inquiry.records[t.id]={...emptyRecord(),completedAt:'2026-10-24'};a.inquiry.rewards=['M1-2','M1-4'];a.evidence.M1={stage:'M1',attemptId:a.id,origin:'learner',created:'2026-10-24',summary:'이전 기록',draft:a.draft,inquiry:structuredClone(a.inquiry)};const restored=restoreAttempt(a);expect(restored.evidence.M1).toBeDefined();expect(restored.inquiry.rewards).toEqual(a.inquiry.rewards);});
 it('새 자료를 근거로 유지·수정한 주장 모두 허용한다',()=>{for(const initial of ['allbad','somehelp']){const r=emptyRecord();r.opened=task('M3-4').items.map(i=>i.id);r.assignments={initial,claim:'somehelp',evidence:'yogurt-new',decision:initial==='allbad'?'revise':'keep'};expect(taskIssues(task('M3-4'),r)).toEqual([]);}});
 it('소개 글 길이가 아니라 사례·작용·근거로 판단한다',()=>{const r=emptyRecord();r.assignments={case:'yogurt',action:'lactic',evidence:'yogurt'};expect(taskIssues(task('M5-4'),r)).toEqual([]);r.assignments.evidence='leaf';r.note='아주 긴 소개 문장을 여러 번 적었어요.'.repeat(10);expect(taskIssues(task('M5-4'),r).length).toBeGreaterThan(0);});
});
