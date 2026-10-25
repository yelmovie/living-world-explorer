import {describe,it,expect} from 'vitest';
import {guidance} from '../src/inquiry-guidance';
import {emptyRecord} from '../src/inquiry-model';
import {inquiryTasks} from '../src/curriculum';

const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;
describe('현재 근거에 맞춘 길잡이',()=>{
 it('읽지 않은 자료의 정답 배치를 완료로 안내하지 않는다',()=>{const t=task('M1-1'),r=emptyRecord();r.assignments=Object.fromEntries(t.items.map(i=>[i.id,i.target]));expect(guidance(t,r).ready).toBe(false);expect(guidance(t,r).done).toBe(0);expect(guidance(t,r).action).toContain('자료를 눌러');r.opened=t.items.map(i=>i.id);expect(guidance(t,r).ready).toBe(true);});
 it('초점이 맞아도 특징 표시 전에는 기록 준비로 안내하지 않는다',()=>{const t=task('M1-2'),r=emptyRecord();r.focus=65;expect(guidance(t,r).action).toContain('사진 촬영');r.capture=true;r.marks=[{x:.01,y:.01}];expect(guidance(t,r).ready).toBe(false);r.marks=[{x:.5,y:.4}];expect(guidance(t,r).ready).toBe(true);});
 it('B만 고정하면 먼저 A를 고정하도록 안내한다',()=>{const r=emptyRecord();r.pins[1]=5;expect(guidance(task('M2-3'),r).action).toContain('A 고정');expect(guidance(task('M2-3'),r).ready).toBe(false);});
 it('잘못된 전후 순서와 표본 밖 표시는 진행 수가 많아도 준비 완료가 아니다',()=>{const r=emptyRecord();r.pins=[3,0];r.marks=[{x:.01,y:.01}];r.opened=['process'];const g=guidance(task('M4-1'),r);expect(g.ready).toBe(false);expect(g.done).toBeLessThan(g.total);});
 it('설계가 성공해도 예상과의 비교를 해야 완료할 수 있다',()=>{const t=task('M5-1'),r=emptyRecord();for(const i of t.items)if(i.target)r.assignments[i.target]=i.id;r.assignments.edge1=r.assignments.edge2='linked';r.prediction='stopped';r.runResult='supported';expect(guidance(t,r).action).toContain('비교');expect(guidance(t,r).ready).toBe(false);r.reflection='differs';expect(guidance(t,r).ready).toBe(true);});
 it('소개 글만 길어도 사례와 작용이 맞지 않으면 완료로 안내하지 않는다',()=>{const r=emptyRecord();r.note='작은 생물의 작용을 이용해요.';r.assignments={case:'yogurt',action:'yeast'};const g=guidance(task('M5-4'),r);expect(g.ready).toBe(false);expect(g.done).toBeLessThan(g.total);});
});
