export type Stage = 'M1'|'M2'|'M3'|'M4'|'M5';
export type Point = {x:number;y:number};
export type Capture = {id:string;organism:string;focus:number;light:number;zoom:number;pan:Point;marks:Point[]};
export type Run = {id:string;revision:number;choices:string[];prediction:string;reason:string;passed:boolean;code:string;reflection:string;status:'running'|'completed'|'interrupted'};
export type Draft = {
  m1:{environment:string[];organism:string;focus:number;light:number;zoom:number;pan:Point;captures:Capture[];selected:string;claim:string};
  m2:{site:string;organism:string;sampleStep:number;amount:number;time:number;a:number|null;b:number|null;captured:string[];shape:string;motion:string;habitat:string};
  m3:{sources:string[];trait:string;habitat:string;bindings:Record<string,string[]>};
  m4:{caseId:string;time:number;a:number|null;b:number|null;marks:Point[];clues:Record<string,string[]>;answers:Record<string,string>;context:string};
  m5:{slots:string[];selected:string;edges:boolean[];revision:number;prediction:string;reason:string;runs:Run[];explanation:string};
};
export type Evidence = {stage:Stage;attemptId:string;origin:'learner'|'demo';created:string;summary:string;draft:Draft};
export type Attempt={id:string;route:string;mapPosition:Point;draft:Draft;evidence:Partial<Record<Stage,Evidence>>;report:Stage[];ports:Stage[];activated:boolean;cardTitle:string;cardNote:string};
export type State={version:1;settings:{sound:boolean;large:boolean;reduced:boolean;flat:boolean;admin:boolean};learner:Attempt;preview:Attempt};
export const stageIds:Stage[]=['M1','M2','M3','M4','M5'];
export function makeAttempt():Attempt {return {id:crypto.randomUUID(),route:'main',mapPosition:{x:480,y:380},evidence:{},report:[],ports:[],activated:false,cardTitle:'작은 생물이 만드는 변화',cardNote:'',draft:{
 m1:{environment:[],organism:'mushroom',focus:25,light:65,zoom:1,pan:{x:0,y:0},captures:[],selected:'',claim:''},
 m2:{site:'',organism:'paramecium',sampleStep:0,amount:1,time:0,a:null,b:null,captured:[],shape:'',motion:'',habitat:''},
 m3:{sources:[],trait:'',habitat:'',bindings:{trait:[],habitat:[]}},
 m4:{caseId:'bread',time:0,a:null,b:null,marks:[],clues:{},answers:{},context:''},
 m5:{slots:['','',''],selected:'',edges:[false,false],revision:0,prediction:'',reason:'',runs:[],explanation:''}
 }};}
export function makeState():State {return {version:1,settings:{sound:false,large:false,reduced:false,flat:false,admin:false},learner:makeAttempt(),preview:makeAttempt()};}
export function active(s:State){return s.settings.admin?s.preview:s.learner;}
export function validEvidence(a:Attempt,stage:Stage,admin:boolean){const e=a.evidence[stage];return !!e&&e.attemptId===a.id&&e.origin===(admin?'demo':'learner');}
export function position(t:number):Point {return {x:0.25+t*0.045,y:0.48+Math.sin(t*.65)*.15};}
export function captureValid(c:Capture){return Math.abs(c.focus-65)<=13&&c.light>=40&&c.light<=85;}
export function featurePoint(organism:string,p:Point){return organism==='mushroom'?((p.x-.5)**2/.24**2+(p.y-.43)**2/.16**2<1 || Math.abs(p.x-.5)<.07&&p.y>.5&&p.y<.82):[{x:.32,y:.3},{x:.65,y:.4},{x:.47,y:.64}].some(q=>Math.hypot(p.x-q.x,p.y-q.y)<.13);}
export function temporalValid(a:number|null,b:number|null){return a!==null&&b!==null&&a<b&&a>=0&&b<=3;}
export function breadSpots(t:number){return Array.from({length:t*9},(_,i)=>({x:.52+Math.cos(i*2.4)*.045*Math.sqrt(i),y:.48+Math.sin(i*2.4)*.045*Math.sqrt(i),r:.018+t*.004}));}
export function changePoint(a:number,b:number,p:Point){const inside=(t:number,tolerance:number)=>breadSpots(t).some(q=>Math.hypot((p.x-q.x),(p.y-q.y)*450/720)<q.r+tolerance);return inside(b,.012)&&!inside(a,-.008);}
