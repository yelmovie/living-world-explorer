import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {narrationRecordings} from '../src/narration-recordings';
const shippedRecordings=import.meta.glob('../public/assets/audio/voice/*.mp3',{query:'?url',import:'default'});
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
 it('표정은 실제 음성 재생이 시작될 때 켜지고 종료하면 꺼진다',async()=>{
  const a=await import('../src/audio');a.syncAudio({sound:true});const observe=vi.fn();
  expect(a.playNarration('M1',observe)).toBe(true);expect(observe).not.toHaveBeenCalled();
  await Promise.resolve();expect(observe).toHaveBeenLastCalledWith('playing');
  (clips[0] as typeof clips[number]&{onended:()=>void}).onended();
  expect(observe.mock.calls).toEqual([['playing'],['ended']]);
 });
 it('음소거 때 생성·재생하지 않는다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:false});expect(a.playNarration('M1')).toBe(false);expect(clips).toHaveLength(0);});
 it('다시 듣기는 이전 음성을 중단한다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(a.playNarration('M1')).toBe(true);a.playNarration('M2');expect(clips[0].pause).toHaveBeenCalled();expect(clips[1].src).toBe('assets/audio/voice/M2-welcome.mp3');a.stopNarration();expect(clips[1].pause).toHaveBeenCalled();});
 it('소리를 끄면 재생 중인 인사를 멈춘다',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});a.playNarration('M3');a.syncAudio({sound:false});expect(clips[0].paused).toBe(true);});
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

it('every generated narration ID uses a shipped file',async()=>{const a=await import('../src/audio');a.syncAudio({sound:true});expect(Object.keys(narrationRecordings)).toHaveLength(24);for(const[id,line]of Object.entries(narrationRecordings)){expect(a.playNarration(id)).toBe(true);expect(clips.at(-1)!.src).toBe(line.src);expect(shippedRecordings).toHaveProperty('../public/'+line.src);}});
