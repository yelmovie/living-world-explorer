/** Project BGM (main loop, ending loop) + locally hosted CC0 interaction sounds. */
export type AudioSettings = {sound: boolean; bgm?: boolean; bgmVolume?: number};
export type EffectName = 'click'|'success'|'retry'|'snap'|'capture'|'water'|'hint'|'run'|'page-turn'|'pipette-drop'|'core-wake';
export type MusicTrack = 'main'|'ending';
const tracks: Record<MusicTrack, string> = {main: 'assets/audio/bgm-main-theme.m4a', ending: 'assets/audio/bgm-ending-theme.m4a'};
// Files are normalized to -16 LUFS. 100% BGM ≈ -36 LUFS, just under the effects (≈ -34 LUFS at .06). Tune by ear here.
const MUSIC_MAX_GAIN = .1;
let settings: AudioSettings = {sound: false, bgm: false, bgmVolume: 35};
let context: AudioContext | undefined;
let musicGain: GainNode | undefined;
let effectGain: GainNode | undefined;
let unlocked = false;
let explicitQuiet = false;
let installed = false;
let track: MusicTrack = 'main';
let music: HTMLAudioElement | undefined;
let musicTrack: MusicTrack | undefined;
const effectVoices = new Set<AudioScheduledSourceNode>();
// 2026-11-10: per-file level so short CC0 samples sit within about ±3 dB of each other (measured mean volume: run -9 dB … page-turn -28 dB).
const effectLevel: Partial<Record<EffectName, number>> = {run:.4,success:.55,retry:.75,hint:.75,'core-wake':.85,water:1.2,'pipette-drop':1.8,capture:1.8,'page-turn':2.2};
const samples=new Map<EffectName,AudioBuffer>();
let samplesRequested=false;let lastEffect=0;
let observer: MutationObserver | undefined;
let narration:HTMLAudioElement|undefined;
/** Keep shipped greetings until generated character lines and their provenance are available. */
function clearNarration(){const previous=narration;narration=undefined;if(previous){previous.onended=previous.onerror=null;previous.pause();previous.removeAttribute('src');previous.load();}}
export function stopNarration(){clearNarration();sync();}
export function playNarration(id:string):boolean{
 if(!settings.sound||document.hidden||explicitQuiet)return false;
 clearNarration();
 const stage=/^(M[1-5])(?:-welcome)?$/.exec(id)?.[1];
 // Unfinished voice plans must not create broken requests or leave the previous line playing.
 if(!stage){sync();return false;}
 const audio=new Audio(`assets/audio/npc/${stage}.m4a`);audio.preload='none';narration=audio;
 audio.onended=audio.onerror=()=>{if(narration===audio){narration=undefined;sync();}};
 stopMusic();void audio.play().catch(()=>{if(narration===audio){narration=undefined;sync();}});return true;
}


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
  if (!settings.sound || document.hidden || explicitQuiet) {stopVoices(effectVoices);clearNarration();}
  if (!settings.bgm || !unlocked || quiet() || narration) {stopMusic();return;}
  const ctx = engine();
  if (!ctx || !musicGain) return;
  const volume = Number.isFinite(settings.bgmVolume) ? Math.max(0, Math.min(100, settings.bgmVolume!)) / 100 : .35;
  musicGain.gain.setTargetAtTime(volume * MUSIC_MAX_GAIN, ctx.currentTime, .05);
  const element = musicElement(ctx);
  if (!element) return;
  if (musicTrack !== track) {element.src = tracks[track];musicTrack = track;}
  const start = () => {if (context === ctx && unlocked && !narration && element.paused && settings.bgm && !quiet()) void element.play().catch(() => {});};
  if (ctx.state === 'suspended') void ctx.resume().then(start).catch(() => {});else start();
}
function preloadEffects(){
 if(samplesRequested)return;const ctx=engine();if(!ctx)return;samplesRequested=true;
 for(const name of ['click','success','retry','snap','capture','water','hint','run','page-turn','pipette-drop','core-wake'] as EffectName[])void fetch(`assets/audio/${name}.wav`).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{if(context===ctx)samples.set(name,buffer);}).catch(()=>{});
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
export function anySound(value: AudioSettings) {return !!(value.sound || value.bgm);}
export function toggleMasterSound(value: AudioSettings) {const enabled = !anySound(value);value.sound = enabled;value.bgm = enabled;syncAudio(value);}
export function playEffect(name: EffectName = 'click') {
  if (!settings.sound || document.hidden || explicitQuiet) return;
  const now=performance.now();if(now-lastEffect<65&&name==='click')return;lastEffect=now;
  unlocked = true;
  const ctx = engine();
  if (!ctx || !effectGain) return;
  preloadEffects();
  stopVoices(effectVoices);
  // Original short motifs: lab droplets, specimen capture and the waking life core.
  const motifs: Record<EffectName, number[]> = {click:[523],success:[523,659,784],retry:[392,330],snap:[880,440],capture:[659,988],water:[784,523,392],hint:[659,784],run:[196],
    'page-turn':[330,220],'pipette-drop':[988,659],'core-wake':[262,392,523,784]};
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
  observer?.disconnect();observer = undefined;
  document.removeEventListener('pointerdown', firstGesture);
  document.removeEventListener('keydown', firstGesture);
  document.removeEventListener('visibilitychange', visibility);
  installed = false;unlocked = false;samplesRequested=false;samples.clear();
  if (context) void context.close().catch(() => {});
  context = undefined;musicGain = undefined;effectGain = undefined;music = undefined;musicTrack = undefined;
}
