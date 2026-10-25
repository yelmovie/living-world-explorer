import type {Stage,Point} from './model';

export type TaskKind='collect'|'microscope'|'sample'|'track'|'connect'|'timeline'|'sort'|'build'|'publish';
export type InquiryItem={id:string;label:string;detail:string;target:string;art?:string};
export type InquiryTask={id:string;stage:Stage;order:number;title:string;instruction:string;mentor:string;kind:TaskKind;organism?:string;items:InquiryItem[];targets:{id:string;label:string}[];success:string;feedback:string;standard:string;caseName?:string};
export type InquiryRecord={assignments:Record<string,string>;opened:string[];marks:Point[];focus:number;light:number;zoom:number;pan:Point;time:number;pins:number[];sequence:number;prediction:string;runResult:string;reflection:string;note:string;capture:boolean;submitted:boolean;tries:number;completedAt?:string};
export type InquiryProgress={version:1;current:Partial<Record<Stage,number>>;records:Record<string,InquiryRecord>;rewards:string[]};
export function emptyInquiry():InquiryProgress{return {version:1,current:{},records:{},rewards:[]};}
export function emptyRecord():InquiryRecord{return {assignments:{},opened:[],marks:[],focus:25,light:65,zoom:1,pan:{x:0,y:0},time:0,pins:[],sequence:0,prediction:'',runResult:'',reflection:'',note:'',capture:false,submitted:false,tries:0};}
export function recoverInquiry(raw:unknown):InquiryProgress{
 const base=emptyInquiry();if(!raw||typeof raw!=='object')return base;const x=raw as Partial<InquiryProgress>;
 if(x.version!==1||!x.records||typeof x.records!=='object')return base;
 for(const [id,value] of Object.entries(x.records).slice(0,60)){if(!/^M[1-5]-[1-4]$/.test(id)||!value||typeof value!=='object')continue;const r={...emptyRecord(),...value};
  r.assignments=Object.fromEntries(Object.entries(r.assignments||{}).filter(([k,v])=>k.length<80&&typeof v==='string'&&v.length<80));r.opened=Array.isArray(r.opened)?[...new Set(r.opened.filter(v=>typeof v==='string'&&v.length<80))]:[];
  r.marks=Array.isArray(r.marks)?r.marks.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1).slice(0,20):[];
  for(const key of ['focus','light','time','zoom','sequence','tries'] as const)if(!Number.isFinite(r[key]))r[key]=emptyRecord()[key];r.focus=Math.max(0,Math.min(100,r.focus));r.light=Math.max(20,Math.min(100,r.light));r.zoom=Math.max(1,Math.min(2,r.zoom));r.time=Math.max(0,Math.min(10,r.time));r.sequence=Math.max(0,Math.min(3,Math.floor(r.sequence)));
  r.pan=r.pan&&Number.isFinite(r.pan.x)&&Number.isFinite(r.pan.y)?{x:Math.max(-.4,Math.min(.4,r.pan.x)),y:Math.max(-.4,Math.min(.4,r.pan.y))}:{x:0,y:0};r.pins=Array.isArray(r.pins)?r.pins.filter(v=>Number.isFinite(v)&&v>=0&&v<=10).slice(0,2):[];
  for(const key of ['prediction','runResult','reflection','note'] as const)r[key]=typeof r[key]==='string'?r[key].slice(0,key==='note'?100:80):'';
  r.capture=r.capture===true;r.submitted=r.submitted===true;r.completedAt=typeof r.completedAt==='string'?r.completedAt:undefined;base.records[id]=r;
 }
 for(const stage of ['M1','M2','M3','M4','M5'] as Stage[]){const n=x.current?.[stage];if(typeof n==='number'&&n>=0&&n<=3)base.current[stage]=Math.floor(n);}
 base.rewards=Array.isArray(x.rewards)?[...new Set(x.rewards.filter(id=>/^M[1-5]-[24]$/.test(id)))]:[];return base;
}
