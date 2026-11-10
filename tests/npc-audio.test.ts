import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
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
 it('다시 듣기는 이전 음성을 중단한다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(a.playNarration('M1')).toBe(true);a.playNarration('M2');expect(clips[0].pause).toHaveBeenCalled();expect(clips[1].src).toBe('assets/audio/voice/M2.mp3');a.stopNarration();expect(clips[1].pause).toHaveBeenCalled();});
 it('소리를 끄면 재생 중인 인사를 멈춘다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M3');a.syncAudio({sound:false});expect(clips[0].paused).toBe(true);});
 it('탭 숨김은 중단하고 다시 보여도 자동 재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M4');Object.defineProperty(document,'hidden',{value:true,writable:true});listeners.get('visibilitychange')!();expect(clips[0].paused).toBe(true);Object.defineProperty(document,'hidden',{value:false});listeners.get('visibilitychange')!();expect(clips[0].play).toHaveBeenCalledTimes(1);});
});

it('muting releases the clip source and event handlers',async()=>{
 const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M1');
 const clip=clips[0] as typeof clips[number]&{onended:unknown;onerror:unknown};
 a.syncAudio({sound:false});expect(clip.src).toBe('');expect(clip.onended).toBeNull();expect(clip.onerror).toBeNull();
});
