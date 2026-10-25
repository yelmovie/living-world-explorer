import {recoverInquiry} from './inquiry-model';
import {tasksFor} from './curriculum';
import {makeState,makeAttempt,type State,type Attempt,stageIds,captureValid} from './model';
import {routes} from './content';
import {validDraft,recoverDraft} from './validate';
import {missing} from './evaluate';
const blobs=new Map<string,Blob>();
let db:IDBDatabase|undefined;
export let storageMessage='기기에 저장 중';
let queue=Promise.resolve();
let protectedOriginal=false;
let observedState:string|undefined;
let clearCapturesPending=false;
function request<T>(req:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export function restoreAttempt(raw:unknown):Attempt{
 const base=makeAttempt();
 if(!raw||typeof raw!=='object')return base;
 const v=raw as Attempt;
 if(typeof v.id!=='string'||!v.draft||!['m1','m2','m3','m4','m5'].every(k=>k in v.draft))return base;
 // Invalid records never become completed missions. Keep only records from this attempt.
 const a={...base,...v,draft:recoverDraft(v.draft),inquiry:recoverInquiry(v.inquiry)};
 a.route=routes.includes(v.route)?v.route:'nature-map';
 // Historical accepted snapshots keep their original validation policy. A stricter
 // image mask must never erase an older student's completed lab or rewards.
 a.evidence=Object.fromEntries(Object.entries(v.evidence||{}).filter(([key,e])=>stageIds.includes(key as typeof stageIds[number])&&e?.stage===key&&e.attemptId===a.id&&['learner','demo'].includes(e.origin)&&(e.inquiry?tasksFor(e.stage).every(t=>!!recoverInquiry(e.inquiry).records[t.id]?.completedAt):validDraft(e.draft)&&missing(e.stage,e.draft).length===0)).map(([key,e])=>[key,{...e,...(e.inquiry?{inquiry:recoverInquiry(e.inquiry)}:{})}]));
 a.report=[...new Set((Array.isArray(v.report)?v.report:[]).filter(s=>stageIds.includes(s)&&a.evidence[s]))];
 a.ports=[...new Set((Array.isArray(v.ports)?v.ports:[]).filter(s=>stageIds.includes(s)&&a.evidence[s]))];
 a.activated=v.activated===true&&a.report.length===5&&a.ports.length===5;
 a.cardTitle=typeof v.cardTitle==='string'?v.cardTitle.slice(0,36):base.cardTitle;
 a.cardNote=typeof v.cardNote==='string'?v.cardNote.slice(0,100):'';
 if(v.presentation&&typeof v.presentation==='object')a.presentation={observation:typeof v.presentation.observation==='string'?v.presentation.observation.slice(0,140):'',evidence:typeof v.presentation.evidence==='string'?v.presentation.evidence.slice(0,140):'',life:typeof v.presentation.life==='string'?v.presentation.life.slice(0,140):''};
 if(!v.mapPosition||!Number.isFinite(v.mapPosition.x)||!Number.isFinite(v.mapPosition.y)||v.mapPosition.x<0||v.mapPosition.x>1280||v.mapPosition.y<0||v.mapPosition.y>720)a.mapPosition=base.mapPosition;
 if(!Array.isArray(a.draft.m1.captures)||!Array.isArray(a.draft.m5.runs))return base;
 return a;
}
export async function load():Promise<State>{
 const fallback=makeState();
 protectedOriginal=false;
 observedState=undefined;
 try{
  db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('life-code-lab',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('captures');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('blocked'));});
  const raw=await request(db.transaction('state').objectStore('state').get('current'));
  observedState=raw===undefined?undefined:JSON.stringify(raw);
  if(raw===undefined){storageMessage='기기에 저장';return fallback;}
  if(!raw||raw.version!==1||typeof raw.learner?.id!=='string'||!raw.learner.draft||!['m1','m2','m3','m4','m5'].every(k=>raw.learner.draft[k]&&typeof raw.learner.draft[k]==='object')){
   protectedOriginal=true;storageMessage='저장 원본을 보호하고 있어요. 기존 기록을 자동으로 덮어쓰지 않아요.';return fallback;
  }
  const s:State={...fallback,learner:restoreAttempt(raw.learner),preview:restoreAttempt(raw.preview),settings:{...fallback.settings}};
  for(const k of ['sound','bgm','large','reduced','flat'] as const)s.settings[k]=raw.settings?.[k]===true;
  // Classroom previews are temporary. Reload always returns to the student's own attempt.
  s.settings.admin=false;
  s.preview=makeAttempt();
  s.settings.bgmVolume=typeof raw.settings?.bgmVolume==='number'?Math.max(0,Math.min(100,raw.settings.bgmVolume)):30;
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
 if(protectedOriginal){storageMessage='저장 원본을 보호하고 있어요. 기존 기록을 자동으로 덮어쓰지 않아요.';return Promise.resolve();}
 const snapshot=structuredClone(s);const pending=[...blobs.entries()];const clearCaptures=clearCapturesPending;
 queue=queue.then(async()=>{
  if(protectedOriginal)return;
  if(!db){storageMessage='임시 저장 · 창을 닫으면 사라질 수 있어요';return;}
  try{await new Promise<void>((resolve,reject)=>{
   const tx=db!.transaction(['state','captures'],'readwrite');const current=tx.objectStore('state').get('current');
   current.onsuccess=()=>{
    const actual=current.result===undefined?undefined:JSON.stringify(current.result);
    if(actual!==observedState){protectedOriginal=true;storageMessage='다른 창에서 기록이 바뀌었어요. 새로고침해 최신 기록을 열어 주세요.';tx.abort();return;}
    tx.objectStore('state').put(snapshot,'current');
    if(clearCaptures)tx.objectStore('captures').clear();
    for(const [id,blob] of pending)tx.objectStore('captures').put(blob,id);
   };
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });observedState=JSON.stringify(snapshot);if(clearCaptures)clearCapturesPending=false;storageMessage='기기에 저장됨';}
  catch{if(!protectedOriginal)storageMessage='저장 실패 · 현재 작업은 이 창에 남아 있어요';}
 });return queue;
}

export async function clearResearchCaptures(){if(protectedOriginal)return;blobs.clear();clearCapturesPending=true;}
