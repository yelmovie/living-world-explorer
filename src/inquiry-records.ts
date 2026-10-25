import type {Attempt,Evidence} from './model';
import type {InquiryTask,InquiryRecord} from './inquiry-model';
import {taskIssues} from './inquiry-evaluate';
import {tasksFor} from './curriculum';
/** Publish one successfully submitted record; drafts never replace an accepted snapshot. */
export function publishRecord(a:Attempt,task:InquiryTask,r:InquiryRecord){
 if(!r.completedAt||taskIssues(task,r).length)return false;
 const e=a.evidence[task.stage];
 if(e?.inquiry){e.inquiry.records[task.id]=structuredClone(r);e.updated=new Date().toISOString();e.validationVersion=tasksFor(task.stage).every(t=>{const record=e.inquiry!.records[t.id];return !!record?.completedAt&&!taskIssues(t,record).length;})?2:undefined;}
 if(task.kind==='publish')a.cardNote=r.note;
 return true;
}
export function acceptedRecord(a:Attempt,id:string){const stage=id.slice(0,2) as Evidence['stage'];return a.evidence[stage]?.inquiry?.records[id]||a.inquiry.records[id];}
