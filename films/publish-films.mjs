// Copies rendered 1920x1080 films into the app at the same paths and format the app already uses:
// public/assets/concepts/<id>.mp4 (960x540 H.264 + AAC, faststart), <id>.webp (closing frame poster), <id>.vtt, manifest.json.
// Run: node films/publish-films.mjs <folder with M1-1080.mp4 ... M5-1080.mp4>
//      node films/publish-films.mjs --captions-only   (caption wording changed, videos untouched: rewrites concept-captions.json, VTT, manifest)
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
const sharp = createRequire(import.meta.url)('sharp'); // project devDependency; ffmpeg builds often lack libwebp

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'assets', 'concepts');
const renders = process.argv[2];
if (!renders) throw Error('usage: node films/publish-films.mjs <render folder> | --captions-only');
const captionsOnly = renders === '--captions-only';
const {films, DURATION, CUES} = await import('./films.data.mjs');
const captions = Object.fromEntries(films.map(f => [f.id, {duration: DURATION, cues: CUES.slice(0, -1).map((t, i) => [t, CUES[i + 1], f.captions[i]])}]));
writeFileSync(join(here, '..', 'src', 'concept-captions.json'), JSON.stringify(captions, null, 1) + '\n');
const LIMIT = 2.5 * 1024 * 1024;
const stamp = t => new Date(t * 1000).toISOString().slice(11, 23);
const manifest = {};

for (const [id, {duration, cues}] of Object.entries(captions)) {
  const src = join(renders, `${id}-1080.mp4`), mp4 = join(out, `${id}.mp4`);
  if (!captionsOnly) {
  // Flat illustrated frames compress well; CRF 26 keeps the labels crisp at 960 px.
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=960:540:flags=lanczos', '-r', '30', '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', mp4]);
  const size = statSync(mp4).size;
  if (size > LIMIT) throw Error(`${id}.mp4 is ${size} bytes, over 2.5MB`);
  // Poster = the closing frame (answer + 토토), which is also what reduced-motion viewers see.
  const still = join(tmpdir(), `${id}-poster.png`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(duration - 0.1), '-i', src, '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', still]);
  await sharp(still).webp({quality: 82}).toFile(join(out, `${id}.webp`));
  console.log(id, size, 'bytes');
  }
  writeFileSync(join(out, `${id}.vtt`), 'WEBVTT\n\n' + cues.map(([a, b, text], i) => `${i + 1}\n${stamp(a)} --> ${stamp(b)}\n${text}\n`).join('\n'));
  manifest[id] = {duration, size: [960, 540], fps: 30, source: `films/concept-${id}`, captions: cues.map(c => c[2])};
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
