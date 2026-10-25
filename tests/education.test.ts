import {describe,it,expect} from 'vitest';
import {inquiryTasks,tasksFor} from '../src/curriculum';
import {emptyRecord,recoverInquiry,type InquiryRecord,type InquiryTask} from '../src/inquiry-model';
import {taskIssues} from '../src/inquiry-evaluate';
import {habitEarned,canDoLines} from '../src/experience';
import {makeAttempt} from '../src/model';
import {restoreAttempt} from '../src/storage';
import {featureAt,observedKind} from '../src/observation';

const task=(id:string)=>inquiryTasks.find(t=>t.id===id)!;
// A correct M3 record (item tasks file every card; the review keeps the yogurt evidence).
function solved(t:InquiryTask):InquiryRecord{const r=emptyRecord();r.opened=t.items.map(i=>i.id);for(const i of t.items)r.assignments[i.id]=i.target;
 if(t.kind==='review')r.assignments={initial:'allbad',claim:'somehelp',evidence:'yogurt-new',decision:'revise'};if(t.id==='M3-2')r.assignments.ladder='smallest';r.completedAt=new Date().toISOString();r.clean=true;return r;}

describe('2026-10-25 교육 항목',()=>{
 it('M3-3 새 조건: 장소가 적혀도 곰팡이 기록은 세균이 사는 곳의 근거가 아니다',()=>{const t=task('M3-3'),r=solved(t);expect(taskIssues(t,r)).toEqual([]);r.assignments['mold-place']='place';expect(taskIssues(t,r).length).toBeGreaterThan(0);});
 it('이전 기록: 사진을 찍은 현미경 기록은 현미경 단계, 한 번에 통과한 기록은 헛다리 없음으로 복원한다',()=>{const old={...emptyRecord(),capture:true,tries:1,completedAt:'2026-10-20T00:00:00Z'} as Partial<InquiryRecord>;delete old.level;delete old.misses;delete old.clean;
  const p=recoverInquiry({version:1,records:{'M1-2':old,'M1-3':{...old,tries:3}},current:{},rewards:[]});expect(p.records['M1-2'].level).toBe(2);expect(p.records['M1-2'].clean).toBe(true);expect(p.records['M1-3'].clean).toBe(false);
  expect(recoverInquiry({version:1,records:{'M1-2':{...emptyRecord(),level:9}},current:{},rewards:[]}).records['M1-2'].level).toBe(2);});
 it('탐구 습관 배지는 네 탐구가 모두 정확하고 헛다리가 없을 때만 받는다',()=>{const a=makeAttempt();for(const t of tasksFor('M3'))a.inquiry.records[t.id]=solved(t);expect(habitEarned(a,'M3')).toBe(true);
  a.inquiry.records['M3-2'].clean=false;expect(habitEarned(a,'M3')).toBe(false);a.inquiry.records['M3-2']=emptyRecord();expect(habitEarned(a,'M3')).toBe(false);});
 it('개념 보강(포자·섬모·크기 사다리·새 카드)은 새로 하는 기록에만 적용하고, 이전 완료 기록은 그대로 완료다',()=>{
  // Saved before 2026-10-25: gill mark on the whole mushroom, no cilia mark, no ladder, old M1-4/M3-2 cards only.
  const legacy=(r:InquiryRecord)=>{const raw=structuredClone(r) as Partial<InquiryRecord>;delete raw.v;return recoverInquiry({version:1,records:{'M1-1':raw},current:{},rewards:[]}).records['M1-1'];};
  const m12={...emptyRecord(),focus:65,capture:true,level:2,marks:[{x:.34,y:.33}],completedAt:'2026-10-20T00:00:00Z'};
  const m23={...emptyRecord(),pins:[0,5],completedAt:'2026-10-20T00:00:00Z'};
  const m32=solved(task('M3-2'));for(const id of ['round','rod','spiral','green-thread'])delete m32.assignments[id];m32.assignments.forms='shape';delete m32.assignments.ladder;m32.opened=['small','places','forms'];
  const m14=solved(task('M1-4'));delete m14.assignments.mycelium;delete m14.assignments.spread;m14.opened=['cap','hypha','env1','env2'];
  for(const [id,r] of [['M1-2',m12],['M2-3',m23],['M3-2',m32],['M1-4',m14]] as const){const restored=recoverInquiry({version:1,records:{[id]:(()=>{const raw={...r} as Partial<InquiryRecord>;delete raw.v;return raw;})()},current:{},rewards:[]}).records[id];expect(restored.v).toBeUndefined();expect(taskIssues(task(id),restored)).toEqual([]);
   // The same work started under the new rules is not enough.
   expect(taskIssues(task(id),{...restored,v:2}).length).toBeGreaterThan(0);}
  expect(legacy(emptyRecord()).v).toBeUndefined();expect(emptyRecord().v).toBe(2);
 });
 it('포자는 주름 가장자리의 알갱이, 섬모는 짚신벌레 몸 둘레에서만 인정한다',()=>{
  expect(featureAt('mushroomSpores',{x:.506,y:.201})).toBe('spore');expect(featureAt('mushroomSpores',{x:.3,y:.5})).toBeUndefined();
  expect(featureAt('paramecium',{x:.17,y:.501})).toBe('cilia');expect(featureAt('paramecium',{x:.45,y:.5})).toBeUndefined();expect(featureAt('paramecium',{x:.95,y:.1})).toBeUndefined();
  // 돋보기 gate still uses the whole-mushroom gills.
  expect(featureAt('mushroom',{x:.34,y:.33})).toBe('gills');expect(observedKind(task('M1-2'),emptyRecord())).toBe('mushroomSpores');expect(observedKind(task('M1-2'),{v:undefined})).toBe('mushroom');});
 it('M3-2 해캄 카드는 "세균 자료가 아니에요" 칸에만 맞고, 크기 사다리를 거쳐야 완료된다',()=>{const t=task('M3-2'),r=solved(t);expect(taskIssues(t,r)).toEqual([]);
  r.assignments['green-thread']='shape';expect(taskIssues(t,r).length).toBeGreaterThan(0);r.assignments['green-thread']='none';delete r.assignments.ladder;expect(taskIssues(t,r)).toContain('크기 사다리에서 세균이 들어갈 칸을 골라 크기를 비교해요.');});
 it('능력 문장은 정해진 단계와 40자 안의 내 문장만 복원해 인증서 문장으로 만든다',()=>{const a=makeAttempt();const r=restoreAttempt({...a,canDo:['M2','M9','M2'],canDoNote:'가'.repeat(80)});expect(r.canDo).toEqual(['M2']);expect(r.canDoNote).toHaveLength(40);
  const lines=canDoLines(r);expect(lines).toHaveLength(2);expect(lines.every(l=>l.startsWith('나는 이제 '))).toBe(true);
  const untouched=restoreAttempt(a);expect('canDo' in untouched).toBe(false);expect('canDoNote' in untouched).toBe(false);});
});
