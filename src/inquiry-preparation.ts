import type {InquiryTask,InquiryRecord} from './inquiry-model';
import {emptyRecord} from './inquiry-model';

/** Prepare equipment, never the learner's observation, claim or biological action. Existing records are left intact. */
export function prepareInquiry(task:InquiryTask):InquiryRecord{
 const r=emptyRecord();
 if(task.kind==='microscope'&&task.id!=='M1-2'){r.level=2;r.focus=65;}
 if(task.kind==='track'){r.pins=[0];r.time=5;}
 if(task.kind==='timeline'){r.pins=[0];r.time=3;}
 if(task.kind==='build'&&task.order>1){
  for(const slot of ['input','output']){const item=task.items.find(i=>i.target===slot);if(item)r.assignments[slot]=item.id;}
 }
 return r;
}
export function validTrackPair(r:Pick<InquiryRecord,'pins'>){return r.pins.length===2&&Number.isFinite(r.pins[0])&&Number.isFinite(r.pins[1])&&Math.abs(r.pins[1]-r.pins[0])>=3;}
export function validTimelinePair(r:Pick<InquiryRecord,'pins'>){return r.pins.length===2&&Number.isInteger(r.pins[0])&&Number.isInteger(r.pins[1])&&r.pins[0]>=0&&r.pins[0]<r.pins[1]&&r.pins[1]<=3;}
export function reflectClaim(r:InquiryRecord){
 if(r.assignments.initial&&r.assignments.claim)r.assignments.decision=r.assignments.initial===r.assignments.claim?'keep':'revise';
 else delete r.assignments.decision;
}
export function introduction(task:InquiryTask,r:InquiryRecord){
 const item=task.items.find(i=>i.id===r.assignments.case);
 return item&&item.target===r.assignments.action?`${item.label}: ${item.detail}`.slice(0,100):'';
}
