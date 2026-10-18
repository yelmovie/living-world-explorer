import {describe,it,expect} from 'vitest';
import {makeAttempt,makeState,active,stageIds,changePoint} from '../src/model';
import {missing,canEnter,claimStatus,evaluateSolution} from '../src/evaluate';
import {restoreAttempt} from '../src/storage';
import {recoverDraft} from '../src/validate';
import {cases} from '../src/content';
function ready(){const a=makeAttempt(),d=a.draft;Object.assign(d.m1,{environment:['wood','moist'],claim:'correct',captures:[{id:'a',organism:'mushroom',focus:65,light:65,zoom:1,pan:{x:0,y:0},marks:[{x:.5,y:.43}]},{id:'b',organism:'mold',focus:65,light:65,zoom:1,pan:{x:0,y:0},marks:[{x:.32,y:.3}]}]});Object.assign(d.m2,{sampleStep:3,captured:['spirogyra','paramecium'],a:0,b:5,shape:'correct',motion:'correct',habitat:'correct'});Object.assign(d.m3,{sources:['photo','place','note'],trait:'correct',habitat:'correct',bindings:{trait:['photo','note'],habitat:['place']}});Object.assign(d.m4,{a:0,b:3,marks:[{x:.52,y:.48}],context:'correct'});for(const c of cases){d.m4.clues[c.id]=[`${c.id}-0`,`${c.id}-1`];d.m4.answers[c.id]=c.answer;}Object.assign(d.m5,{slots:['milk','lactic','yogurt'],edges:[true,true],prediction:'yogurt',reason:'evidence',explanation:'correct',runs:[{id:'r1',revision:0,choices:['milk','lactic','yogurt'],prediction:'yogurt',reason:'evidence',passed:true,code:'supported',reflection:'matches',status:'completed'}]});return a;}
describe('학습 근거 판정',()=>{
 it('다섯 미션의 유효한 근거를 통과시킨다',()=>{for(const id of stageIds)expect(missing(id,ready().draft)).toEqual([]);});
 it('흐린 사진의 표시를 완료로 인정하지 않는다',()=>{const a=ready();a.draft.m1.captures[0].focus=10;expect(missing('M1',a.draft).length).toBeGreaterThan(0);});
 it('생물 밖의 표시를 거부한다',()=>{const a=ready();a.draft.m1.captures[0].marks=[{x:.01,y:.01}];expect(missing('M1',a.draft).length).toBeGreaterThan(0);});
 it('같은 시점 두 장을 움직임 비교로 인정하지 않는다',()=>{const a=ready();a.draft.m2.b=0;expect(missing('M2',a.draft).length).toBeGreaterThan(0);});
 it('자료를 담기만 하고 메모를 연결하지 않으면 완료하지 않는다',()=>{const a=ready();a.draft.m3.bindings.trait=['photo'];expect(missing('M3',a.draft).length).toBeGreaterThan(0);});
 it('크기 메모를 사는 곳에 잘못 연결하면 세 번째 근거로 인정하지 않는다',()=>{const a=ready();a.draft.m3.bindings.trait=['photo'];a.draft.m3.bindings.habitat=['place','note'];expect(missing('M3',a.draft).length).toBeGreaterThan(0);});
 it('근거를 제거하면 주장 상태를 갱신한다',()=>{expect(claimStatus('trait','correct',['photo'])).toBe('확인 가능');expect(claimStatus('trait','correct',[])).toBe('근거 부족');});
 it('무관 자료를 사실 불일치로 단정하지 않는다',()=>expect(claimStatus('habitat','wrong',['leaf'])).toBe('근거 부족'));
 it('그려진 곰팡이 변화 밖의 표시를 거부한다',()=>{expect(changePoint(0,1,{x:.28,y:.48})).toBe(false);const a=ready();a.draft.m4.a=0;a.draft.m4.b=1;a.draft.m4.marks=[{x:.28,y:.48}];expect(missing('M4',a.draft).length).toBeGreaterThan(0);});
 it('유효한 여러 전후 시점 쌍을 허용한다',()=>{expect(changePoint(0,1,{x:.52,y:.48})).toBe(true);expect(changePoint(0,3,{x:.52,y:.48})).toBe(true);});
 it('미연결 모듈을 성공시키지 않는다',()=>{const a=ready();a.draft.m5.edges[0]=false;expect(evaluateSolution(a.draft.m5)).toBe('connection-missing');});
 it('설계 수정 전 성공으로 현재 초안을 통과시키지 않는다',()=>{const a=ready();a.draft.m5.revision++;expect(missing('M5',a.draft).length).toBeGreaterThan(0);});
 it('틀린 예상도 관찰 후 올바르게 대조하면 통과한다',()=>{const a=ready();a.draft.m5.runs[0].prediction='other';a.draft.m5.runs[0].reflection='differs';expect(missing('M5',a.draft)).toEqual([]);});
 it('중단한 실행을 성공으로 인정하지 않는다',()=>{const a=ready();a.draft.m5.runs[0].status='interrupted';expect(missing('M5',a.draft).length).toBeGreaterThan(0);});
});
describe('저장과 해금 경계',()=>{
 it('일반 학습의 결과 URL 직행을 막는다',()=>expect(canEnter(makeAttempt(),'results',false)).toBe(false));
 it('관리자 미리보기는 전 화면을 열 수 있다',()=>expect(canEnter(makeAttempt(),'core-restoration',true)).toBe(true));
 it('미리보기 초안이 일반 학습을 바꾸지 않는다',()=>{const s=makeState();s.settings.admin=true;active(s).draft.m1.claim='correct';s.settings.admin=false;expect(active(s).draft.m1.claim).toBe('');});
 it('손상된 그룹만 복구하고 다른 그룹 초안을 유지한다',()=>{const a=ready();const raw=structuredClone(a.draft) as unknown as Record<string,unknown>;raw.m3={bindings:null};const d=recoverDraft(raw);expect(d.m3.sources).toEqual([]);expect(d.m4.b).toBe(3);});
 it('완료 조건이 사라진 저장 기록을 다시 완료로 복원하지 않는다',()=>{const a=ready();a.evidence.M1={stage:'M1',attemptId:a.id,origin:'learner',created:'',summary:'',draft:structuredClone(a.draft)};a.evidence.M1.draft.m1.claim='wrong';expect(restoreAttempt(a).evidence.M1).toBeUndefined();});
 it('실행 중 새로고침은 중단으로 복원한다',()=>{const a=ready();a.draft.m5.runs[0].status='running';const restored=restoreAttempt(a);expect(restored.draft.m5.runs[0].status).toBe('interrupted');expect(restored.draft.m5.runs[0].passed).toBe(false);});
});
