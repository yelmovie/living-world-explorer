import {narrationRecordings} from './narration-recordings';
/** Project BGM (main loop, ending loop) + locally hosted CC0 interaction sounds. */
export type AudioSettings = {sound: boolean; voice?: boolean; bgm?: boolean; bgmVolume?: number};
export type EffectName = 'click'|'success'|'retry'|'snap'|'capture'|'water'|'hint'|'run'|'page-turn'|'pipette-drop'|'core-wake'|'focus'|'sparkle'
  |'map-swing'|'map-hit-1'|'map-hit-2'|'map-finish'|'map-exit'|'map-hurt'|'map-appear'|'map-victory'
  |'card-whoosh'|'card-reveal'|'card-epic'|'card-slot'|'card-complete';
// 2026-11-17 map villain cues (CC0, see public/assets/audio/sources.json). Everything else is <name>.wav.
const effectNames: EffectName[] = ['click','success','retry','snap','capture','water','hint','run','page-turn','pipette-drop','core-wake','focus','sparkle','map-swing','map-hit-1','map-hit-2','map-finish','map-exit','map-hurt','map-appear','map-victory',
  // 2026-11-18 achievement card cues (CC0, sources.json cardEffects): fly in, reveal (the two rarest use the longer jingle), land in the slot, full set.
  'card-whoosh','card-reveal','card-epic','card-slot','card-complete'];
const effectFile = (name: EffectName) => /^(map|card)-/.test(name) ? `assets/audio/sfx/${name}.mp3` : `assets/audio/${name}.wav`;
// The impact lands while the swing is still ringing, so these do not cut the previous effect.
// A card flies in over the villain's exit and its chimes follow one another closely; the map finale jingle still cuts them.
const layered = new Set<EffectName>(['map-hit-1','map-hit-2','map-finish','map-exit','card-whoosh','card-reveal','card-epic','card-slot','card-complete']);
export type MusicTrack = 'main'|'ending';
const tracks: Record<MusicTrack, string> = {main: 'assets/audio/bgm-main-theme.m4a', ending: 'assets/audio/bgm-ending-theme.m4a'};
// Files are normalized to -16 LUFS. 100% BGM ≈ -36 LUFS, just under the effects (≈ -34 LUFS at .06). Tune by ear here.
const MUSIC_MAX_GAIN = .1;
// Character lines duck the music instead of stopping it, so the theme carries on from the intro film.
const NARRATION_DUCK = .4;
let settings: AudioSettings = {sound: false, bgm: false, bgmVolume: 35};
let context: AudioContext | undefined;
let musicGain: GainNode | undefined;
let effectGain: GainNode | undefined;
let unlocked = false;
let explicitQuiet = false;
let installed = false;
let track: MusicTrack = 'main';
let film: {track:MusicTrack;playing:boolean} | undefined;
let music: HTMLAudioElement | undefined;
let musicTrack: MusicTrack | undefined;
const effectVoices = new Set<AudioScheduledSourceNode>();
// 2026-11-10: per-file level so short CC0 samples sit within about ±3 dB of each other (measured mean volume: run -9 dB … page-turn -28 dB).
const effectLevel: Partial<Record<EffectName, number>> = {run:.4,success:.55,retry:.75,hint:.75,'core-wake':.85,water:1.2,'pipette-drop':1.8,capture:1.8,'page-turn':2.2,focus:1.3,sparkle:1.6,
  // Map cues (library loudness: swing/exit/victory about -18 LUFS, hits -20, hurt -24, heavy hit -28). The appear pop stays soft.
  'map-swing':.75,'map-hit-1':1.1,'map-hit-2':1.1,'map-finish':2,'map-exit':.8,'map-hurt':1.3,'map-appear':.7,'map-victory':.8,
  // Card cues (library loudness: reveal/epic/complete about -18 LUFS, whoosh and slot -21 to -22).
  'card-whoosh':.9,'card-reveal':.8,'card-epic':.8,'card-slot':1.1,'card-complete':.8};
const samples=new Map<EffectName,AudioBuffer>();
let samplesRequested=false;let lastEffect=0;
let observer: MutationObserver | undefined;
let narration:HTMLAudioElement|undefined;
export type NarrationState='loading'|'playing'|'waiting'|'ended'|'stopped'|'unavailable';
let narrationState:((state:NarrationState)=>void)|undefined;
/** Every playable ID is backed by a shipped, validated character recording. */
/** A line waiting for the current one to end (a discovery card after Toto's cheer); any new line drops it. */
let queued:(()=>void)|undefined;
function clearNarration(){
 queued=undefined;
 const previous=narration,onState=narrationState;narration=undefined;narrationState=undefined;
 if(previous){previous.onended=previous.onerror=previous.onplaying=previous.onwaiting=previous.onpause=null;previous.pause();previous.removeAttribute('src');previous.load();onState?.('stopped');}
}
export function stopNarration(owner?:(state:NarrationState)=>void){if(owner&&narrationState!==owner)return;clearNarration();sync();}
export function narrationEnabled(){return settings.voice??settings.sound;}
export function playNarration(id:string,onState?:(state:NarrationState)=>void):boolean{
 if(!narrationEnabled()||document.hidden||explicitQuiet)return false;
 clearNarration();
 const key=/^M[1-5]$/.test(id)?id+'-welcome':id,recording=narrationRecordings[key];
 // Unknown IDs must not create broken requests or leave the previous line playing.
 if(!recording){sync();return false;}
 const audio=new Audio(recording.src);audio.preload='none';narration=audio;narrationState=onState;
 const finish=(state:NarrationState)=>{if(narration===audio){narration=undefined;narrationState=undefined;const next=queued;queued=undefined;sync();onState?.(state);if(state==='ended')next?.();}};
 audio.onended=()=>finish('ended');audio.onerror=()=>finish('unavailable');
 audio.onplaying=()=>{if(narration===audio)onState?.('playing');};
 audio.onwaiting=()=>{if(narration===audio)onState?.('waiting');};
 audio.onpause=()=>{if(!audio.ended)finish('stopped');};
 // 2026-11-18: BGM keeps running from the intro film on; sync() ducks it under the line.
 sync();
 onState?.('loading');
 void audio.play().catch(()=>finish('unavailable'));
 return true;
}

/** Toto hints and villain lines carry no id: they play when their exact on-screen text has a recording. */
const lineIds=new Map(Object.entries(narrationRecordings).map(([id,r])=>[r.text,id]));
export function playVoiceLine(text:string,onState?:(state:NarrationState)=>void){const id=lineIds.get(text.trim());return id?playNarration(id,onState):false;}
export function queueVoiceLine(text:string,onState?:(state:NarrationState)=>void,still:()=>boolean=()=>true){if(!narration)return playVoiceLine(text,onState);if(!lineIds.has(text.trim()))return false;queued=()=>{if(still())playVoiceLine(text,onState);};return true;}
/** Plays voiced lines in order while a dialog is open and stops them when it closes; `now` interrupts a line already playing (a tap), otherwise it waits. */
export function voiceDialog(dialog:HTMLDialogElement,texts:string[],{now=false}={}){let open=true;texts=[...texts];const own=(state:NarrationState)=>{if(state==='ended'&&texts.length)voice();};const voice=()=>{const t=texts.shift();if(t&&now){now=false;playVoiceLine(t,own);}else if(t)queueVoiceLine(t,own,()=>open);};voice();dialog.addEventListener('close',()=>{open=false;texts.length=0;stopNarration(own);},{once:true});}
export function voiceLineSeconds(text:string){const id=lineIds.get(text.trim());return id?narrationRecordings[id].duration:0;}

function engine() {
  if (!context) {
    const Audio = window.AudioContext;
    if (!Audio) return;
    try {
      context = new Audio();
      musicGain = context.createGain();
      effectGain = context.createGain();
      musicGain.gain.value = 0;
      effectGain.gain.value = .06;
      musicGain.connect(context.destination);
      effectGain.connect(context.destination);
    } catch { context = undefined; }
  }
  return context;
}
function stopVoices(voices: Set<AudioScheduledSourceNode>) {
  for (const voice of voices) {try { voice.stop(); } catch { /* Already stopped. */ }}
  voices.clear();
}
// Only a concept video silences BGM; story films play over it, and settings keep it so the volume slider can be heard.
function quiet() {return explicitQuiet || document.hidden || !!document.querySelector('dialog[open] video:not(.film-video)');}
function stopMusic() {music?.pause();}
function voice(frequency: number, duration: number, destination: GainNode, voices: Set<AudioScheduledSourceNode>, start: number, type: OscillatorType = 'sine') {
  const ctx = context;
  if (!ctx || !frequency) return;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(.6, start + .025);
  envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
  oscillator.connect(envelope).connect(destination);
  voices.add(oscillator);
  oscillator.onended = () => {voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
  oscillator.start(start);oscillator.stop(start + duration + .02);
}
// Routed through musicGain because iPad Safari ignores HTMLMediaElement.volume.
function musicElement(ctx: AudioContext) {
  if (!music && musicGain) {
    try {
      const element = new Audio();
      element.loop = true;element.preload = 'none';
      ctx.createMediaElementSource(element).connect(musicGain);
      music = element;
    } catch { /* No BGM; effects still work. */ }
  }
  return music;
}
function sync() {
  if (!settings.sound || document.hidden || explicitQuiet) stopVoices(effectVoices);
  if (!narrationEnabled() || document.hidden || explicitQuiet) clearNarration();
  if (!settings.bgm || !unlocked || quiet() || (film && !film.playing)) {stopMusic();return;}
  const ctx = engine();
  if (!ctx || !musicGain) return;
  const volume = Number.isFinite(settings.bgmVolume) ? Math.max(0, Math.min(100, settings.bgmVolume!)) / 100 : .35;
  musicGain.gain.setTargetAtTime(volume * MUSIC_MAX_GAIN * (film ? .82 : narration ? NARRATION_DUCK : 1), ctx.currentTime, narration ? .08 : .25);
  const element = musicElement(ctx);
  if (!element) return;
  const desiredTrack = film?.track ?? track;
  if (musicTrack !== desiredTrack) {element.src = tracks[desiredTrack];musicTrack = desiredTrack;}
  const start = () => {if (context === ctx && unlocked && element.paused && settings.bgm && !quiet() && (!film || film.playing)) void element.play().catch(() => {});};
  if (ctx.state === 'suspended') void ctx.resume().then(start).catch(() => {});else start();
}
function preloadEffects(){
 if(samplesRequested)return;const ctx=engine();if(!ctx)return;samplesRequested=true;
 for(const name of effectNames)void fetch(effectFile(name)).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{if(context===ctx)samples.set(name,buffer);}).catch(()=>{});
}
function firstGesture() {unlocked = true;if(settings.sound)preloadEffects();sync();}
function visibility() {if (document.hidden) {stopMusic();stopVoices(effectVoices);stopNarration();}else sync();}
function install() {
  if (installed) return;
  installed = true;
  document.addEventListener('pointerdown', firstGesture, {once: true});
  document.addEventListener('keydown', firstGesture, {once: true});
  document.addEventListener('visibilitychange', visibility);
  observer = new MutationObserver(sync);
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['open']});
}
export function syncAudio(value: AudioSettings) {settings = value;install();if(unlocked&&settings.sound)preloadEffects();sync();}
export function setAudioQuiet(value: boolean) {explicitQuiet = value;sync();}
export function setMusicTrack(value: MusicTrack) {if (track === value) return;track = value;sync();}
export function scoreStoryFilm(video: HTMLVideoElement, theme: MusicTrack) {
  const session = {track: theme, playing: false};
  film = session;
  stopNarration();
  const events = new AbortController();
  const update = (playing: boolean) => {session.playing = playing; if (film === session) sync();};
  for (const event of ['pause', 'waiting', 'seeking', 'ended']) video.addEventListener(event, () => update(false), {signal: events.signal});
  video.addEventListener('playing', () => update(true), {signal: events.signal});
  return () => {
    events.abort();
    if (film === session) {film = undefined; sync();}
  };
}
export function anySound(value: AudioSettings) {return !!(value.sound || value.voice || value.bgm);}
export function toggleMasterSound(value: AudioSettings) {const enabled = !anySound(value);value.sound = value.voice = value.bgm = enabled;syncAudio(value);}
export function playEffect(name: EffectName = 'click') {
  if (!settings.sound || document.hidden || explicitQuiet) return;
  const now=performance.now();if(now-lastEffect<65&&name==='click')return;lastEffect=now;
  unlocked = true;
  const ctx = engine();
  if (!ctx || !effectGain) return;
  preloadEffects();
  if(!layered.has(name))stopVoices(effectVoices);
  // Original short motifs: lab droplets, specimen capture and the waking life core.
  const motifs: Record<EffectName, number[]> = {click:[523],success:[523,659,784],retry:[392,330],snap:[880,440],capture:[659,988],water:[784,523,392],hint:[659,784],run:[196],
    'page-turn':[330,220],'pipette-drop':[988,659],'core-wake':[262,392,523,784],focus:[784,1175],sparkle:[784,1047,1319],
    'map-swing':[392,587],'map-hit-1':[330],'map-hit-2':[294],'map-finish':[220,165],'map-exit':[523,392,262],'map-hurt':[247],'map-appear':[311,415],'map-victory':[523,659,784,1047],
    'card-whoosh':[392,587],'card-reveal':[659,988],'card-epic':[523,784,1047],'card-slot':[880],'card-complete':[523,659,784,1047]};
  const frequencies = motifs[name];
  const play = () => {
    if (context !== ctx || !effectGain || !settings.sound || document.hidden || explicitQuiet) return;
    effectGain.gain.value = .06 * (narration ? .3 : 1);
    const buffer=samples.get(name);if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;const level=ctx.createGain();level.gain.value=effectLevel[name]??1;source.connect(level).connect(effectGain);effectVoices.add(source);source.onended=()=>{effectVoices.delete(source);source.disconnect();level.disconnect();};source.start();return;}
    frequencies.forEach((frequency,i) => voice(frequency, .16, effectGain!, effectVoices, ctx.currentTime + i * .09));
  };
  if (ctx.state === 'suspended') void ctx.resume().then(play).catch(() => {});else play();
}
export function disposeAudio() {
  stopNarration();stopMusic();stopVoices(effectVoices);
  observer?.disconnect();observer = undefined;film = undefined;
  document.removeEventListener('pointerdown', firstGesture);
  document.removeEventListener('keydown', firstGesture);
  document.removeEventListener('visibilitychange', visibility);
  installed = false;unlocked = false;samplesRequested=false;samples.clear();
  if (context) void context.close().catch(() => {});
  context = undefined;musicGain = undefined;effectGain = undefined;music = undefined;musicTrack = undefined;
}
