import {makeAttempt,stageIds,type Attempt} from './model';
import {stages,cases} from './content';
import {canvas,draw} from './draw';
import {rememberBlob} from './storage';
export async function demoAttempt():Promise<Attempt>{
 const a=makeAttempt();const d=a.draft;
 d.m1.environment=['wood','moist'];d.m1.claim='correct';
 for(const [organism,p] of [['mushroom',{x:.5,y:.43}],['mold',{x:.32,y:.3}]] as const){const shot={id:crypto.randomUUID(),organism,focus:65,light:65,zoom:1,pan:{x:0,y:0},marks:[p]};const c=canvas(720,450);draw(c,organism);const blob=await new Promise<Blob|null>(r=>c.toBlob(r));if(blob)rememberBlob(shot.id,blob);d.m1.captures.push(shot);}
 Object.assign(d.m2,{site:'edge',sampleStep:3,captured:['spirogyra','paramecium'],a:0,b:5,shape:'correct',motion:'correct',habitat:'correct'});
 Object.assign(d.m3,{sources:['photo','place','note'],trait:'correct',habitat:'correct',bindings:{trait:['photo','note'],habitat:['place']}});
 Object.assign(d.m4,{a:0,b:3,marks:[{x:.52,y:.48}],context:'correct'});for(const c of cases){d.m4.clues[c.id]=[`${c.id}-0`,`${c.id}-1`];d.m4.answers[c.id]=c.answer;}
 Object.assign(d.m5,{slots:['milk','lactic','yogurt'],edges:[true,true],prediction:'yogurt',reason:'evidence',explanation:'correct'});d.m5.runs=[{id:crypto.randomUUID(),revision:0,choices:[...d.m5.slots],prediction:'yogurt',reason:'evidence',passed:true,code:'supported',reflection:'matches',status:'completed'}];
 for(const s of stages)a.evidence[s.id]={stage:s.id,attemptId:a.id,origin:'demo',created:new Date().toISOString(),summary:s.summary,draft:structuredClone(d)};
 a.route='nature-map';return a;
}
