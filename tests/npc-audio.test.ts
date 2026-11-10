import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const shippedGreetings=import.meta.glob('../public/assets/audio/npc/*.m4a',{query:'?url',import:'default'});
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
 it('음소거 때 생성·재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:false});expect(a.playNarration('M1')).toBe(false);expect(clips).toHaveLength(0);});
 it('다시 듣기는 이전 음성을 중단한다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(a.playNarration('M1')).toBe(true);a.playNarration('M2');expect(clips[0].pause).toHaveBeenCalled();expect(clips[1].src).toBe('assets/audio/npc/M2.m4a');a.stopNarration();expect(clips[1].pause).toHaveBeenCalled();});
 it('소리를 끄면 재생 중인 인사를 멈춘다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M3');a.syncAudio({sound:false});expect(clips[0].paused).toBe(true);});
 it('탭 숨김은 중단하고 다시 보여도 자동 재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M4');Object.defineProperty(document,'hidden',{value:true,writable:true});listeners.get('visibilitychange')!();expect(clips[0].paused).toBe(true);Object.defineProperty(document,'hidden',{value:false});listeners.get('visibilitychange')!();expect(clips[0].play).toHaveBeenCalledTimes(1);});
});

it('muting releases the clip source and event handlers',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1');
 const clip=clips[0] as typeof clips[number]&{onended:unknown;onerror:unknown};
 a.syncAudio({sound:false});expect(clip.src).toBe('');expect(clip.onended).toBeNull();expect(clip.onerror).toBeNull();
});

it('인사 ID는 실제로 있는 기존 음성 파일을 사용한다',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});
 for(const stage of ['M1','M2','M3','M4','M5']){
  expect(a.playNarration(stage+'-welcome')).toBe(true);
  const clip=clips.at(-1)!;
  expect(clip.src).toBe(`assets/audio/npc/${stage}.m4a`);
  expect(shippedGreetings).toHaveProperty('../public/'+clip.src);
 }
});

it('아직 생성하지 않은 대사는 요청하지 않고 이전 인사를 멈춘다',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1-welcome');
 const greeting=clips[0];
 for(const id of ['M1-memory','M2-memory-plant','M5-work','story-1','results'])expect(a.playNarration(id)).toBe(false);
 expect(greeting.pause).toHaveBeenCalled();expect(clips).toHaveLength(1);
});
