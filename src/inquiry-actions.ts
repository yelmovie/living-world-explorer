import type {InquiryTask,InquiryRecord} from './inquiry-model';
import {invalidateRun} from './inquiry-evaluate';

/** Connections express adjacent occupied slots; learners still choose every material. */
export function syncBuildLinks(task:InquiryTask,r:InquiryRecord){
 if(task.kind!=='build')return false;
 let changed=false;
 for(let i=0;i<task.targets.length-1;i++){
  const key='edge'+(i+1),value=r.assignments[task.targets[i].id]&&r.assignments[task.targets[i+1].id]?'linked':'';
  if((r.assignments[key]||'')!==value){r.assignments[key]=value;changed=true;}
 }
 if(changed)invalidateRun(r);
 return changed;
}
/** Returns false for an invalid or unchanged placement, preserving any completed experiment. */
export function assignCard(task:InquiryTask,r:InquiryRecord,id:string,target:string){
 if(!['collect','connect','sort','build'].includes(task.kind)||!task.items.some(i=>i.id===id)||!task.targets.some(t=>t.id===target))return false;
 const key=task.kind==='build'?target:id,value=task.kind==='build'?id:target;
 if(r.assignments[key]===value)return false;
 r.assignments[key]=value;r.submitted=false;
 if(task.kind==='build'){syncBuildLinks(task,r);invalidateRun(r);}
 return true;
}
export function chooseCase(task:InquiryTask,r:InquiryRecord,id:string){
 if(task.kind!=='publish'||!task.items.some(i=>i.id===id)||r.assignments.case===id)return false;
 r.assignments.case=id;r.assignments.action='';r.assignments.evidence=id;r.note='';r.submitted=false;return true;
}
