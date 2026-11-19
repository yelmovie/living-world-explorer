import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {footfall,STEP_MS,STEP_LEAD,type Stride} from '../src/renderers/map-walk';
// 2026-11-19 second sound pass: map footsteps (own voice, quieter than the music) and one limiter in front of the speakers.
describe('지도 발자국 박자',()=>{
 const walk=(stride:Stride,from:number,to:number,frame=1000/60)=>{const at:number[]=[];for(let now=from;now<to;now+=frame)if(footfall(stride,true,now))at.push(now);return at;};
 it('걷기 시작한 직후 첫 발, 그 뒤 280~320ms마다 한 번 낸다',()=>{
  const stride={next:0},at=walk(stride,1000,3000);
  expect(at[0]-1000).toBeGreaterThanOrEqual(STEP_LEAD);expect(at[0]-1000).toBeLessThan(STEP_LEAD+20);
  const gaps=at.slice(1).map((t,i)=>t-at[i]);
  expect(gaps.length).toBeGreaterThanOrEqual(5);
  for(const gap of gaps){expect(gap).toBeGreaterThanOrEqual(280);expect(gap).toBeLessThanOrEqual(320);}
  expect(STEP_MS).toBeGreaterThanOrEqual(280);
 });
 it('멈추거나 벽에 막혀 제자리면 내지 않고, 다시 걸으면 처음부터 센다',()=>{
  const stride={next:0};walk(stride,0,500);
  for(let now=500;now<1500;now+=16)expect(footfall(stride,false,now)).toBe(false);
  expect(stride.next).toBe(0);
  expect(footfall(stride,true,1500)).toBe(false);
  expect(walk(stride,1516,1700)).toHaveLength(1);
 });
 it('긴 프레임 뒤에도 발소리가 몰려 나지 않는다',()=>{
  const stride={next:0};footfall(stride,true,0);
  expect(footfall(stride,true,2000)).toBe(true);
  expect(footfall(stride,true,2016)).toBe(false);expect(footfall(stride,true,2000+STEP_MS)).toBe(true);
 });
});

type Param={value:number;setTargetAtTime:ReturnType<typeof vi.fn>;setValueAtTime:ReturnType<typeof vi.fn>};
type Node={kind:string;gain:Param;to:unknown[];connect:(n:unknown)=>unknown;disconnect:ReturnType<typeof vi.fn>};
type Source=Node&{buffer:unknown;playbackRate:{value:number};start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;onended:null|(()=>void)};
describe('발자국 소리와 출력 리미터',()=>{
 const listeners=new Map<string,()=>void>();
 let nodes:Node[],sources:Source[],hidden:{value:boolean};
 const param=(value=1):Param=>{const p={value,setTargetAtTime:vi.fn((v:number)=>{p.value=v;}),setValueAtTime:vi.fn((v:number)=>{p.value=v;})};return p;};
 const node=(kind:string):Node=>{const n:Node={kind,gain:param(),to:[],connect:(next:unknown)=>{n.to.push(next);return next;},disconnect:vi.fn()};nodes.push(n);return n;};
 const start=async(settings:{sound:boolean;voice?:boolean;bgm?:boolean;bgmVolume?:number}={sound:true,voice:true,bgm:false},compressor=true)=>{
  const destination={kind:'destination'};
  class Ctx{state='running';currentTime=5;destination=destination;
   createGain(){return node('gain');}
   createBufferSource(){const s=Object.assign(node('source'),{buffer:null as unknown,playbackRate:{value:1},start:vi.fn(),stop:vi.fn(),onended:null}) as Source;sources.push(s);return s;}
   createMediaElementSource(){return node('media');}
   decodeAudioData=vi.fn(async(data:{name:string})=>({name:data.name}));resume=vi.fn(async()=>{});close=vi.fn(async()=>{});}
  if(compressor)Object.assign(Ctx.prototype,{createDynamicsCompressor(){return Object.assign(node('limiter'),{threshold:param(-24),knee:param(30),ratio:param(12),attack:param(.003),release:param(.25)});}});
  vi.stubGlobal('window',{AudioContext:Ctx});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,arrayBuffer:async()=>({name:url})})));
  const a=await import('../src/audio');a.syncAudio(settings);listeners.get('pointerdown')?.();
  for(let i=0;i<12;i++)await Promise.resolve();
  return {a,destination,settings};
 };
 beforeEach(()=>{
  vi.resetModules();listeners.clear();nodes=[];sources=[];hidden={value:false};
  vi.stubGlobal('document',{get hidden(){return hidden.value;},body:{},querySelector:()=>null,addEventListener:(n:string,f:()=>void)=>listeners.set(n,f),removeEventListener:(n:string)=>listeners.delete(n)});
  vi.stubGlobal('MutationObserver',class{observe(){}disconnect(){}});
  vi.stubGlobal('Audio',class{src='';paused=true;loop=false;preload='';onended:unknown;onerror:unknown;play=vi.fn(()=>{this.paused=false;return Promise.resolve();});pause=vi.fn(()=>{this.paused=true;});removeAttribute(){this.src='';}load(){}constructor(src=''){this.src=src;}});
 });
 afterEach(()=>vi.unstubAllGlobals());
 const level=(s:Source)=>s.to[0] as Node;

 it('배경 음악·효과음·전투음이 모두 리미터 하나를 거쳐 나가고, 평소 크기는 그대로다',async()=>{
  const {a,destination}=await start({sound:true,voice:true,bgm:true,bgmVolume:30});
  const limiter=nodes.find(n=>n.kind==='limiter') as Node&Record<'threshold'|'knee'|'ratio'|'attack'|'release',Param>;
  const [music,effects,fight,trim]=nodes.filter(n=>n.kind==='gain');
  for(const bus of [music,effects,fight])expect(bus.to).toEqual([limiter]);
  expect(limiter.to).toEqual([trim]);expect(trim.to).toEqual([destination]);
  // Threshold at the loudest single sound (capture peaks at .9 = -0.9 dB): nothing below it is touched.
  expect(limiter.threshold.value).toBe(-1);expect(limiter.knee.value).toBe(0);expect(limiter.ratio.value).toBe(20);
  // The compressor's own make-up gain is (full-range gain)^-0.6; the trim takes exactly that back out.
  const fullRangeDb=-1+(0-(-1))/20;
  expect(20*Math.log10(trim.gain.value)).toBeCloseTo(.6*fullRangeDb,6);
  expect(music.gain.value).toBeCloseTo(.3*.93);expect(effects.gain.value).toBe(.5);expect(fight.gain.value).toBe(.5);
  a.disposeAudio();
 });
 it('리미터를 만들 수 없는 브라우저에서는 예전처럼 바로 출력한다',async()=>{
  const {a,destination}=await start({sound:true,bgm:true,bgmVolume:30},false);
  const [music,effects,fight]=nodes.filter(n=>n.kind==='gain');
  for(const bus of [music,effects,fight])expect(bus.to).toEqual([destination]);
  a.disposeAudio();
 });
 it('두 파일을 번갈아, 속도는 ±6% 안에서, 배경 음악보다 작게 리미터로 보낸다',async()=>{
  const {a}=await start();const limiter=nodes.find(n=>n.kind==='limiter');
  expect(vi.mocked(fetch).mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining(['assets/audio/sfx/step-01.mp3','assets/audio/sfx/step-02.mp3']));
  // Read each level as the step starts: the next step fades the previous one out.
  const levels:number[]=[];for(let i=0;i<6;i++){a.playStep();levels.push(level(sources.at(-1)!).gain.value);}
  expect(sources).toHaveLength(6);
  expect(sources.map(s=>(s.buffer as {name:string}).name.slice(-11))).toEqual(['step-01.mp3','step-02.mp3','step-01.mp3','step-02.mp3','step-01.mp3','step-02.mp3']);
  for(const s of sources){
   expect(s.start).toHaveBeenCalledOnce();
   expect(s.playbackRate.value).toBeGreaterThanOrEqual(.94);expect(s.playbackRate.value).toBeLessThanOrEqual(1.06);
   expect(level(s).to).toEqual([limiter]);
   // Music at the default level is .279; the two files differ by 3.7 dB, so their levels do too.
  }
  for(const value of levels){expect(value).toBeGreaterThanOrEqual(.12);expect(value).toBeLessThan(.279);}
  expect(levels.slice(0,2)).toEqual([.17,.26]);
  expect(new Set(sources.map(s=>s.playbackRate.value)).size).toBeGreaterThan(1);
  a.disposeAudio();
 });
 it('발자국은 한 번에 하나: 새 발소리가 앞 발소리만 짧게 줄여 끝낸다',async()=>{
  const {a}=await start();a.playStep();a.playStep();
  expect(level(sources[0]).gain.setTargetAtTime).toHaveBeenCalledWith(0,5,expect.any(Number));
  expect(sources[0].stop).toHaveBeenCalledWith(expect.closeTo(5.06,3));expect(sources[1].stop).not.toHaveBeenCalled();
  a.disposeAudio();
 });
 it('멈추면 울리던 발소리를 0.1초 안에 끝낸다',async()=>{
  const {a}=await start();a.playStep();a.stopStep();
  const at=sources[0].stop.mock.calls[0][0] as number;
  expect(at-5).toBeGreaterThan(0);expect(at-5).toBeLessThanOrEqual(.1);
  a.stopStep();expect(sources[0].stop).toHaveBeenCalledOnce();
  a.disposeAudio();
 });
 it('발자국은 타격음·카드 소리·클릭을 끊지 않고, 클릭도 발자국을 끊지 않는다',async()=>{
  const {a}=await start();
  a.playEffect('map-hit-1');a.playEffect('card-reveal');
  a.playStep();a.playStep();
  const [hit,card,first,second]=sources;
  expect(hit.stop).not.toHaveBeenCalled();expect(card.stop).not.toHaveBeenCalled();
  a.playEffect('click');
  expect(second.stop).not.toHaveBeenCalled();expect(level(second).gain.setTargetAtTime).not.toHaveBeenCalled();
  expect(first.stop).toHaveBeenCalledOnce();
  a.disposeAudio();
 });
 it('대사가 나오는 동안에는 절반 크기로 낸다',async()=>{
  const {a}=await start();
  expect(a.playNarration('M1')).toBe(true);a.playStep();
  expect(level(sources[0]).gain.value).toBeCloseTo(.17*.5);
  a.stopNarration();a.playStep();expect(level(sources[1]).gain.value).toBeCloseTo(.26);
  a.disposeAudio();
 });
 it('효과음을 끄거나 탭을 숨기면 내지 않고, 울리던 발소리도 멈춘다',async()=>{
  const {a,settings}=await start();a.playStep();
  a.syncAudio({...settings,sound:false});expect(sources[0].stop).toHaveBeenCalledOnce();
  a.playStep();expect(sources).toHaveLength(1);
  a.syncAudio(settings);a.playStep();expect(sources).toHaveLength(2);
  hidden.value=true;listeners.get('visibilitychange')!();expect(sources[1].stop).toHaveBeenCalledOnce();
  a.playStep();expect(sources).toHaveLength(2);
  hidden.value=false;a.setAudioQuiet(true);a.playStep();expect(sources).toHaveLength(2);
  a.disposeAudio();
 });
 it('첫 입력 전에는 내지 않는다',async()=>{
  vi.stubGlobal('window',{AudioContext:class{}});
  const a=await import('../src/audio');a.syncAudio({sound:true});a.playStep();expect(sources).toHaveLength(0);a.disposeAudio();
 });
});
