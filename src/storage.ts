import {makeState,makeAttempt,type State,type Attempt,stageIds,captureValid} from './model';
import {routes} from './content';
import {validDraft,recoverDraft} from './validate';
import {missing} from './evaluate';
const blobs=new Map<string,Blob>();
let db:IDBDatabase|undefined;
export let storageMessage='기기에 저장 중';
let queue=Promise.resolve();
function request<T>(req:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export function restoreAttempt(raw:unknown):Attempt{
 const base=makeAttempt();
 if(!raw||typeof raw!=='object')return base;
 const v=raw as Attempt;
 if(typeof v.id!=='string'||!v.draft||!['m1','m2','m3','m4','m5'].every(k=>k in v.draft))return base;
 // Invalid records never become completed missions. Keep only records from this attempt.
 const a={...base,...v,draft:recoverDraft(v.draft)};
 a.route=routes.includes(v.route)?v.route:'nature-map';
 a.evidence=Object.fromEntries(Object.entries(v.evidence||{}).filter(([key,e])=>stageIds.includes(key as typeof stageIds[number])&&e?.stage===key&&e.attemptId===a.id&&['learner','demo'].includes(e.origin)&&validDraft(e.draft)&&missing(e.stage,e.draft).length===0));
 a.report=[...new Set((Array.isArray(v.report)?v.report:[]).filter(s=>stageIds.includes(s)&&a.evidence[s]))];
 a.ports=[...new Set((Array.isArray(v.ports)?v.ports:[]).filter(s=>stageIds.includes(s)&&a.evidence[s]))];
 a.activated=v.activated===true&&a.report.length===5&&a.ports.length===5;
 a.cardTitle=typeof v.cardTitle==='string'?v.cardTitle.slice(0,36):base.cardTitle;
 a.cardNote=typeof v.cardNote==='string'?v.cardNote.slice(0,100):'';
 if(!v.mapPosition||!Number.isFinite(v.mapPosition.x)||!Number.isFinite(v.mapPosition.y)||v.mapPosition.x<0||v.mapPosition.x>960||v.mapPosition.y<0||v.mapPosition.y>560)a.mapPosition=base.mapPosition;
 if(!Array.isArray(a.draft.m1.captures)||!Array.isArray(a.draft.m5.runs))return base;
 return a;
}
export async function load():Promise<State>{
 const fallback=makeState();
 try{
  db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('life-code-lab',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('captures');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('blocked'));});
  const raw=await request(db.transaction('state').objectStore('state').get('current'));
  if(!raw){storageMessage='기기에 저장';return fallback;}
  if(raw.version!==1)throw new Error('unknown version');
  const s:State={...fallback,learner:restoreAttempt(raw.learner),preview:restoreAttempt(raw.preview),settings:{...fallback.settings}};
  for(const k of ['sound','large','reduced','flat','admin'] as const)s.settings[k]=raw.settings?.[k]===true;
  for(const a of [s.learner,s.preview]){
   for(const c of a.draft.m1.captures){const blob=await request(db.transaction('captures').objectStore('captures').get(c.id));if(blob instanceof Blob)blobs.set(c.id,blob);}
   if(a.draft.m1.captures.some(c=>captureValid(c)&&!blobs.has(c.id))){a.evidence={};a.report=[];a.ports=[];a.activated=false;a.route='fungi-microscope';storageMessage='사진이 빠져 있어요. 다시 촬영해 주세요.';}
  }
  if(!storageMessage.startsWith('사진'))storageMessage='기기에 저장';return s;
 }catch{db=undefined;storageMessage='임시 저장 · 창을 닫으면 사라질 수 있어요';return fallback;}
}
export function rememberBlob(id:string,blob:Blob){blobs.set(id,blob);}
export function getBlob(id:string){return blobs.get(id);}
export function save(s:State):Promise<void>{
 const snapshot=structuredClone(s);const pending=[...blobs.entries()];
 queue=queue.then(async()=>{
  if(!db){storageMessage='임시 저장 · 창을 닫으면 사라질 수 있어요';return;}
  try{await new Promise<void>((resolve,reject)=>{const tx=db!.transaction(['state','captures'],'readwrite');tx.objectStore('state').put(snapshot,'current');for(const [id,blob] of pending)tx.objectStore('captures').put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});storageMessage='기기에 저장됨';}
  catch{storageMessage='저장 실패 · 현재 작업은 이 창에 남아 있어요';}
 });return queue;
}
