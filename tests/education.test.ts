import {describe,it,expect} from 'vitest';
import {inquiryTasks,tasksFor} from '../src/curriculum';
import {emptyRecord,recoverInquiry,type InquiryRecord,type InquiryTask} from '../src/inquiry-model';
import {taskIssues} from '../src/inquiry-evaluate';
import {habitEarned,canDoLines} from '../src/experience';
import {makeAttempt} from '../src/model';
import {restoreAttempt} from '../src/storage';

const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;
// A correct M3 record (item tasks file every card; the review keeps the yogurt evidence).
function solved(t:InquiryTask):InquiryRecord{const r=emptyRecord();r.opened=t.items.map(i=>i.id);for(const i of t.items)r.assignments[i.id]=i.target;
 if(t.kind==='review')r.assignments={initial:'allbad',claim:'somehelp',evidence:'yogurt-new',decision:'revise'};r.completedAt=new Date().toISOString();r.clean=true;return r;}

describe('2026-10-25 교육 항목',()=>{
 it('M3-3 새 조건: 장소가 적혀도 곰팡이 기록은 세균이 사는 곳의 근거가 아니다',()=>{const t=task('M3-3'),r=solved(t);expect(taskIssues(t,r)).toEqual([]);r.assignments['mold-place']='place';expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('이전 기록: 사진을 찍은 현미경 기록은 현미경 단계, 한 번에 통과한 기록은 헛다리 없음으로 복원한다',()=>{const old={...emptyRecord(),capture:true,tries:1,completedAt:'2026-10-20T00:00:00Z'} as Partial<InquiryRecord>;delete old.level;delete old.misses;delete old.clean;
  const p=recoverInquiry({version:1,records:{'M1-2':old,'M1-3':{...old,tries:3}},current:{},rewards:[]});expect(p.records['M1-2'].level).toBe(2);expect(p.records['M1-2'].clean).toBe(true);expect(p.records['M1-3'].clean).toBe(false);
  expect(recoverInquiry({version:1,records:{'M1-2':{...emptyRecord(),level:9}},current:{},rewards:[]}).records['M1-2'].level).toBe(2);});
 it('탐구 습관 배지는 네 탐구가 모두 정확하고 헛다리가 없을 때만 받는다',()=>{const a=makeAttempt();for(const t of tasksFor('M3'))a.inquiry.records[t.id]=solved(t);expect(habitEarned(a,'M3')).toBe(true);
  a.inquiry.records['M3-2'].clean=false;expect(habitEarned(a,'M3')).toBe(false);a.inquiry.records['M3-2']=emptyRecord();expect(habitEarned(a,'M3')).toBe(false);});
 it('능력 문장은 정해진 단계와 40자 안의 내 문장만 복원해 인증서 문장으로 만든다',()=>{const a=makeAttempt();const r=restoreAttempt({...a,canDo:['M2','M9','M2'],canDoNote:'가'.repeat(80)});expect(r.canDo).toEqual(['M2']);expect(r.canDoNote).toHaveLength(40);
  const lines=canDoLines(r);expect(lines).toHaveLength(2);expect(lines.every(l=>l.startsWith('나는 이제 '))).toBe(true);
  const untouched=restoreAttempt(a);expect('canDo' in untouched).toBe(false);expect('canDoNote' in untouched).toBe(false);});
});
