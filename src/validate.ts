import {makeAttempt,type Draft} from './model';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const strings=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&x.length<1000);
const number=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const point=(v:unknown)=>object(v)&&number(v.x,-2,2)&&number(v.y,-2,2);
const points=(v:unknown)=>Array.isArray(v)&&v.every(point);
export function validGroup(key:keyof Draft,v:unknown):boolean{
 if(!object(v))return false;
 if(key==='m1')return strings(v.environment)&&typeof v.organism==='string'&&number(v.focus,0,100)&&number(v.light,0,100)&&number(v.zoom,1,2)&&point(v.pan)&&typeof v.selected==='string'&&typeof v.claim==='string'&&Array.isArray(v.captures)&&v.captures.every(c=>object(c)&&typeof c.id==='string'&&typeof c.organism==='string'&&number(c.focus,0,100)&&number(c.light,0,100)&&number(c.zoom,1,2)&&point(c.pan)&&points(c.marks));
 if(key==='m2')return ['site','shape','motion','habitat'].every(k=>typeof v[k]==='string')&&number(v.sampleStep,0,3)&&number(v.amount,1,3)&&number(v.time,0,10)&&(v.a===null||number(v.a,0,10))&&(v.b===null||number(v.b,0,10))&&strings(v.captured);
 if(key==='m3')return strings(v.sources)&&typeof v.trait==='string'&&typeof v.habitat==='string'&&object(v.bindings)&&strings(v.bindings.trait)&&strings(v.bindings.habitat);
 if(key==='m4')return typeof v.caseId==='string'&&number(v.time,0,3)&&(v.a===null||number(v.a,0,3))&&(v.b===null||number(v.b,0,3))&&points(v.marks)&&typeof v.context==='string'&&object(v.clues)&&Object.values(v.clues).every(strings)&&object(v.answers)&&Object.values(v.answers).every(x=>typeof x==='string');
 return strings(v.slots)&&(v.slots as unknown[]).length===3&&typeof v.selected==='string'&&Array.isArray(v.edges)&&v.edges.length===2&&v.edges.every(x=>typeof x==='boolean')&&number(v.revision,0,1e7)&&['prediction','reason','explanation'].every(k=>typeof v[k]==='string')&&Array.isArray(v.runs)&&v.runs.every(r=>object(r)&&typeof r.id==='string'&&number(r.revision,0,1e7)&&strings(r.choices)&&typeof r.prediction==='string'&&typeof r.reason==='string'&&typeof r.passed==='boolean'&&typeof r.code==='string'&&typeof r.reflection==='string'&&['running','completed','interrupted'].includes(r.status as string));
}
export function validDraft(v:unknown):v is Draft{return object(v)&&(['m1','m2','m3','m4','m5'] as const).every(k=>validGroup(k,v[k]));}
export function recoverDraft(raw:unknown){const d=makeAttempt().draft;if(!object(raw))return d;for(const k of ['m1','m2','m3','m4','m5'] as const){if(validGroup(k,raw[k]))Object.assign(d[k],raw[k]);}for(const run of d.m5.runs){if(run.status==='running'){run.status='interrupted';run.passed=false;}}return d;}
