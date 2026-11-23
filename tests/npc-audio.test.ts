import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {narrationRecordings} from '../src/narration-recordings';
const shippedRecordings=import.meta.glob('../public/assets/audio/voice/**/*.mp3',{query:'?url',import:'default'});
const clips:{src:string;paused:boolean;play:ReturnType<typeof vi.fn>;pause:ReturnType<typeof vi.fn>}[]=[];
const listeners=new Map<string,()=>void>();
beforeEach(()=>{
 vi.resetModules();clips.length=0;listeners.clear();
 vi.stubGlobal('window',{});
 vi.stubGlobal('document',{hidden:false,body:{},querySelector:()=>null,addEventListener:(n:string,f:()=>void)=>listeners.set(n,f),removeEventListener:(n:string)=>listeners.delete(n)});
 vi.stubGlobal('MutationObserver',class{observe(){}disconnect(){}});
 vi.stubGlobal('Audio',class{src:string;paused=true;preload='';onended:unknown;onerror:unknown;play=vi.fn(()=>{this.paused=false;return Promise.resolve();});pause=vi.fn(()=>{this.paused=true;});removeAttribute(){this.src='';}load(){}constructor(src=''){this.src=src;clips.push(this);}});
});
afterEach(()=>vi.unstubAllGlobals());
describe('NPC 인사 재생 수명',()=>{
 it('재생이 준비되거나 버퍼링 중이면 말하는 표정을 표시하지 않는다',async()=>{
  const a=await import('../src/audio');a.syncAudio({sound:true});const observe=vi.fn();
  expect(a.playNarration('M1',observe)).toBe(true);
  const clip=clips[0] as typeof clips[number]&{onplaying:()=>void;onwaiting:()=>void;onended:()=>void};
  await Promise.resolve();expect(observe.mock.calls).toEqual([['loading']]);
  clip.onplaying();clip.onwaiting();clip.onplaying();clip.onended();
  expect(observe.mock.calls).toEqual([['loading'],['playing'],['waiting'],['playing'],['ended']]);
 });
 it('이전 대화창을 닫을 때 새 대화창의 음성을 끊지 않는다',async()=>{
  const a=await import('../src/audio');a.syncAudio({sound:true});
  const previous=vi.fn(),current=vi.fn();
  a.playNarration('story-1',previous);a.playNarration('M1',current);
  a.stopNarration(previous);expect(clips[1].paused).toBe(false);
  a.stopNarration(current);expect(clips[1].paused).toBe(true);
 });
 it('음소거 때 생성·재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:false});expect(a.playNarration('M1')).toBe(false);expect(clips).toHaveLength(0);});
 it('캐릭터 목소리는 효과음과 독립적으로 켜고 끌 수 있다',async()=>{
  const a=await import('../src/audio');
  a.syncAudio({sound:true,voice:false});expect(a.playNarration('M1')).toBe(false);
  a.syncAudio({sound:false,voice:true});expect(a.playNarration('M1')).toBe(true);
  expect(clips).toHaveLength(1);expect(a.anySound({sound:false,voice:true})).toBe(true);
 });
 it('다시 듣기는 이전 음성을 중단한다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(a.playNarration('M1')).toBe(true);a.playNarration('M2');expect(clips[0].pause).toHaveBeenCalled();expect(clips[1].src).toBe('assets/audio/voice/M2-welcome.mp3');a.stopNarration();expect(clips[1].pause).toHaveBeenCalled();});
 it('소리를 끄면 재생 중인 인사를 멈춘다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1');a.syncAudio({sound:false});expect(clips[0].paused).toBe(true);});
 it('탭 숨김은 중단하고 다시 보여도 자동 재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M4');Object.defineProperty(document,'hidden',{value:true,writable:true});listeners.get('visibilitychange')!();expect(clips[0].paused).toBe(true);Object.defineProperty(document,'hidden',{value:false});listeners.get('visibilitychange')!();expect(clips[0].play).toHaveBeenCalledTimes(1);});
});

it('muting releases the clip source and event handlers',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1');
 const clip=clips[0] as typeof clips[number]&{onended:unknown;onerror:unknown};
 a.syncAudio({sound:false});expect(clip.src).toBe('');expect(clip.onended).toBeNull();expect(clip.onerror).toBeNull();
});

it('인사 ID는 실제로 있는 검증된 음성 파일을 사용한다',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});
 for(const stage of ['M1','M2','M3','M4','M5']){
  expect(a.playNarration(stage+'-welcome')).toBe(true);
  const clip=clips.at(-1)!;
  expect(clip.src).toBe(`assets/audio/voice/${stage}-welcome.mp3`);
  expect(shippedRecordings).toHaveProperty('../public/'+clip.src);
 }
});

it('등록되지 않은 대사는 요청하지 않고 이전 인사를 멈춘다',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1-welcome');
 const greeting=clips[0];
 for(const id of ['missing-line','M6-welcome','results-unknown'])expect(a.playNarration(id)).toBe(false);
 expect(greeting.pause).toHaveBeenCalled();expect(clips).toHaveLength(1);
});

it('every generated narration ID uses a shipped file',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(Object.keys(narrationRecordings)).toHaveLength(192);for(const[id,line]of Object.entries(narrationRecordings)){expect(a.playNarration(id)).toBe(true);expect(clips.at(-1)!.src).toBe(line.src);expect(shippedRecordings).toHaveProperty('../public/'+line.src);}});
// 2026-11-18: Toto reads every task hint aloud, and each character keeps one voice file set.
it('every task hint and villain line has a Toto or Lens recording',async()=>{const {inquiryTasks}=await import('../src/curriculum');const {mapVillainStages}=await import('../src/map-villain-content');const texts=new Set(Object.values(narrationRecordings).map(r=>r.text));for(const t of inquiryTasks)for(const h of t.hints??[])expect(texts.has(h),t.id+' '+h).toBe(true);for(const s of mapVillainStages)for(const line of [...s.lines,...s.hit,s.finish])expect(texts.has(line),line).toBe(true);expect(new Set(Object.values(narrationRecordings).filter(r=>r.speaker==='toto').map(r=>r.src.split('/').slice(0,-1).join('/'))).size).toBe(1);});
it('revised science summaries avoid stale audio; unchanged summaries, terms and map guide are voiced',async()=>{const {inquiryTasks}=await import('../src/curriculum');const {scienceTerms}=await import('../src/science-terms');const texts=new Set(Object.values(narrationRecordings).map(r=>r.text));for(const t of inquiryTasks){if(['M1-2','M3-1'].includes(t.id)){expect(texts.has(t.success),t.id+' revised wording must not use an old recording').toBe(false);expect((await import('../src/audio')).voiceLineSeconds(t.success)).toBe(0);}else expect(texts.has(t.success),t.id).toBe(true);}for(const [term,text] of Object.entries(scienceTerms))expect(texts.has(text),term).toBe(true);expect(texts.has('연구소를 복구하면 이웃이 돌아와요. 악당을 만나면 가까이에서 공격 버튼이나 J·스페이스바를 눌러요.')).toBe(true);});
describe('지도 전투음과 악당 대사',()=>{
 it('악당 대사가 나오는 동안에도 휘두르기·명중·퇴장 소리가 80% 이상으로 재생된다',async()=>{
  const gains:{gain:{value:number};connect:ReturnType<typeof vi.fn>}[]=[],sources:{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;level?:unknown}[]=[];
  class Ctx{state='running';currentTime=0;destination={};
   createGain(){const g={gain:{value:1},connect:vi.fn((n:unknown)=>n),disconnect:vi.fn()};gains.push(g);return g;}
   createBufferSource(){const s={buffer:null,start:vi.fn(),stop:vi.fn(),disconnect:vi.fn(),onended:null,level:undefined as unknown,connect:vi.fn((n:unknown)=>{s.level=n;return n;})};sources.push(s);return s;}
   decodeAudioData=vi.fn(async()=>({}));resume=vi.fn(async()=>{});close=vi.fn(async()=>{});}
  vi.stubGlobal('window',{AudioContext:Ctx});vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})));
  const a=await import('../src/audio');a.syncAudio({sound:true});listeners.get('pointerdown')?.();
  for(let i=0;i<10;i++)await Promise.resolve();
  const [,effects,fight]=gains;
  a.playVoiceLine('앗, 들켰네!')||a.playNarration('M1');
  a.playEffect('map-swing');a.playEffect('map-hit-1');a.playEffect('map-exit');
  const cues=sources.slice(-3);expect(cues).toHaveLength(3);
  for(const cue of cues){expect(cue.start).toHaveBeenCalledOnce();expect(cue.stop).not.toHaveBeenCalled();expect((cue.level as {connect:ReturnType<typeof vi.fn>}).connect).toHaveBeenCalledWith(fight);}
  expect(fight.gain.value).toBeCloseTo(.5*.8);
  a.playEffect('click');expect(effects.gain.value).toBeCloseTo(.5*.3);
  a.disposeAudio();
 });
});
// 2026-11-19: music sits at .28 of a character line by default, is lowered (never stopped) under lines and story films,
// and the map finale dialog plays the ending theme until it closes.
describe('배경 음악 크기·줄임·지도 피날레',()=>{
 const start=async(settings={sound:false,voice:true,bgm:true,bgmVolume:30})=>{
  const dom={finale:false,concept:false},gains:{gain:{value:number;setTargetAtTime:ReturnType<typeof vi.fn>;setValueAtTime:ReturnType<typeof vi.fn>}}[]=[];
  class Ctx{state='running';currentTime=0;destination={};
   createGain(){const gain={value:1,setTargetAtTime:vi.fn((v:number)=>{gain.value=v;}),setValueAtTime:vi.fn((v:number)=>{gain.value=v;})};const g={gain,connect:vi.fn((n:unknown)=>n),disconnect:vi.fn()};gains.push(g);return g;}
   createMediaElementSource(){return {connect:vi.fn()};}
   resume=vi.fn(async()=>{});close=vi.fn(async()=>{});}
  vi.stubGlobal('window',{AudioContext:Ctx});
  vi.stubGlobal('document',{hidden:false,body:{},querySelector:(q:string)=>(q.includes('.map-finale-dialog[open]')?dom.finale:dom.concept)?{}:null,addEventListener:(n:string,f:()=>void)=>listeners.set(n,f),removeEventListener:(n:string)=>listeners.delete(n)});
  const a=await import('../src/audio');a.syncAudio(settings);listeners.get('pointerdown')?.();
  return {a,dom,settings,music:gains[0].gain,theme:clips[0]};
 };
 it('기본 30%에서 대사의 약 0.28배로 메인테마를 튼다',async()=>{
  const {a,music,theme}=await start();
  expect(theme.src).toBe('assets/audio/bgm-main-theme.m4a');expect(theme.paused).toBe(false);
  expect(music.value).toBeGreaterThanOrEqual(.27);expect(music.value).toBeLessThanOrEqual(.3);
  a.disposeAudio();
 });
 it('대사 동안 멈추지 않고 0.25배로 줄였다가, 끝나거나 오류가 나면 되돌린다',async()=>{
  const {a,music,theme}=await start(),full=music.value;
  for(const end of ['onended','onerror','onpause'] as const){
   expect(a.playNarration('M1')).toBe(true);
   expect(music.value).toBeCloseTo(full*.25);expect(theme.paused).toBe(false);
   (clips.at(-1) as unknown as Record<string,()=>void>)[end]();
   expect(music.value).toBeCloseTo(full);
  }
  expect(theme.pause).not.toHaveBeenCalled();a.disposeAudio();
 });
 it('이야기 영상이 재생되는 동안 0.45배로 계속 나고, 닫으면 되돌린다',async()=>{
  const {a,music,theme}=await start(),full=music.value,on=new Map<string,()=>void>();
  const release=a.scoreStoryFilm({addEventListener:(n:string,f:()=>void)=>on.set(n,f)} as unknown as HTMLVideoElement,'main');
  on.get('playing')!();expect(theme.paused).toBe(false);expect(music.value).toBeCloseTo(full*.45);
  release();expect(music.value).toBeCloseTo(full);a.disposeAudio();
 });
 it('지도 피날레 창이 열려 있는 동안 엔딩 곡을 0에서 올려 틀고, 닫으면 메인테마로 돌아간다',async()=>{
  const {a,dom,settings,music,theme}=await start(),full=music.value;
  dom.finale=true;a.syncAudio(settings);
  expect(theme.src).toBe('assets/audio/bgm-ending-theme.m4a');expect(theme.paused).toBe(false);
  expect(music.setValueAtTime).toHaveBeenCalledTimes(1);expect(music.setValueAtTime).toHaveBeenCalledWith(0,0);
  expect(music.setTargetAtTime).toHaveBeenLastCalledWith(full,0,.8);
  a.syncAudio(settings);expect(music.setValueAtTime).toHaveBeenCalledTimes(1);
  dom.finale=false;a.syncAudio(settings);
  expect(theme.src).toBe('assets/audio/bgm-main-theme.m4a');expect(theme.paused).toBe(false);expect(music.value).toBeCloseTo(full);
  a.disposeAudio();
 });
 it('개념 영상 창에서는 멈추고, 배경 음악을 끄면 바로 멈춘다',async()=>{
  const {a,dom,settings,theme}=await start();
  dom.concept=true;a.syncAudio(settings);expect(theme.paused).toBe(true);
  dom.concept=false;a.syncAudio(settings);expect(theme.paused).toBe(false);
  a.syncAudio({...settings,bgm:false});expect(theme.paused).toBe(true);
  a.disposeAudio();
 });
});
