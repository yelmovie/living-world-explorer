/** Quiet original BGM + locally hosted Kenney CC0 interaction sounds. */
export type AudioSettings = {sound: boolean; bgm?: boolean; bgmVolume?: number};
export type EffectName = 'click'|'success'|'retry'|'snap'|'capture'|'water'|'hint'|'run';
let settings: AudioSettings = {sound: false, bgm: false, bgmVolume: 35};
let context: AudioContext | undefined;
let musicGain: GainNode | undefined;
let effectGain: GainNode | undefined;
let unlocked = false;
let explicitQuiet = false;
let installed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let noteIndex = 0;
const musicVoices = new Set<OscillatorNode>();
const effectVoices = new Set<AudioScheduledSourceNode>();
const samples=new Map<EffectName,AudioBuffer>();
let samplesRequested=false;let lastEffect=0;
let observer: MutationObserver | undefined;
const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 329.63, 392, 493.88, 392, 293.66, 349.23, 392, 0];

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
function quiet() {return explicitQuiet || document.hidden || !!document.querySelector('dialog[open]');}
function stopMusic() {clearTimeout(timer); timer = undefined;stopVoices(musicVoices);}
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
function schedule() {
  timer = undefined;
  const ctx = context;
  if (!ctx || !musicGain || !settings.bgm || !unlocked || quiet()) return;
  const frequency = melody[noteIndex++ % melody.length];
  if (frequency) {
    voice(frequency, .7, musicGain, musicVoices, ctx.currentTime);
    if (noteIndex % 4 === 1) voice(frequency / 2, 1.3, musicGain, musicVoices, ctx.currentTime);
  }
  timer = setTimeout(schedule, 900);
}
function sync() {
  if (!settings.sound || document.hidden || explicitQuiet) stopVoices(effectVoices);
  if (!settings.bgm || !unlocked || quiet()) {stopMusic();return;}
  const ctx = engine();
  if (!ctx || !musicGain) return;
  const volume = Number.isFinite(settings.bgmVolume) ? Math.max(0, Math.min(100, settings.bgmVolume!)) / 100 : .35;
  // BGM maximum sits under the fixed effect level (.06 × .7).
  musicGain.gain.setTargetAtTime(volume * .042, ctx.currentTime, .05);
  if (ctx.state === 'suspended') void ctx.resume().then(() => {if (!timer) schedule();}).catch(() => {});
  else if (!timer) schedule();
}
function preloadEffects(){
 if(samplesRequested)return;const ctx=engine();if(!ctx)return;samplesRequested=true;
 for(const name of ['click','success','retry','snap','capture','water','hint','run'] as EffectName[])void fetch(`assets/audio/${name}.wav`).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{if(context===ctx)samples.set(name,buffer);}).catch(()=>{});
}
function firstGesture() {unlocked = true;preloadEffects();sync();}
function visibility() {if (document.hidden) {stopMusic();stopVoices(effectVoices);}else sync();}
function install() {
  if (installed) return;
  installed = true;
  document.addEventListener('pointerdown', firstGesture, {once: true});
  document.addEventListener('keydown', firstGesture, {once: true});
  document.addEventListener('visibilitychange', visibility);
  observer = new MutationObserver(sync);
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['open']});
}
export function syncAudio(value: AudioSettings) {settings = value;install();sync();}
export function setAudioQuiet(value: boolean) {explicitQuiet = value;sync();}
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
  const frequencies = name === 'success' ? [523.25, 659.25, 783.99] : name === 'retry' ? [392, 329.63] : [523.25];
  const play = () => {
    if (context !== ctx || !effectGain || !settings.sound || document.hidden || explicitQuiet) return;
    const buffer=samples.get(name);if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(effectGain);effectVoices.add(source);source.onended=()=>{effectVoices.delete(source);source.disconnect();};source.start();return;}
    frequencies.forEach((frequency,i) => voice(frequency, .16, effectGain!, effectVoices, ctx.currentTime + i * .09));
  };
  if (ctx.state === 'suspended') void ctx.resume().then(play).catch(() => {});else play();
}
export function disposeAudio() {
  stopMusic();stopVoices(effectVoices);
  observer?.disconnect();observer = undefined;
  document.removeEventListener('pointerdown', firstGesture);
  document.removeEventListener('keydown', firstGesture);
  document.removeEventListener('visibilitychange', visibility);
  installed = false;unlocked = false;samplesRequested=false;samples.clear();
  if (context) void context.close().catch(() => {});
  context = undefined;musicGain = undefined;effectGain = undefined;
}
