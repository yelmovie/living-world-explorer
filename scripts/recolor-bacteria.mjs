// Turn the green bacteria model into a stained-slide look (purple/pink) without tinting the cream background.
// Hue is rotated only in proportion to saturation, so pale background pixels stay put.
// usage: node scripts/recolor-bacteria.mjs <source png/webp> public/assets/study/bacteria.webp
import sharp from 'sharp';
const [src, out] = process.argv.slice(2);
const {data, info} = await sharp(src).removeAlpha().raw().toBuffer({resolveWithObject: true});
const rotate = 180 / 360;
for (let i = 0; i < data.length; i += 3) {
  const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, s = max ? d / max : 0;
  const weight = Math.min(1, Math.max(0, (s - .12) / .18));
  if (!weight || !d) continue;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = ((h / 6 + rotate * weight) % 1 + 1) % 1;
  const k = (n) => { const x = (n + h * 6) % 6; return max - d * Math.max(0, Math.min(x, 4 - x, 1)); };
  data[i] = Math.round(k(5) * 255); data[i + 1] = Math.round(k(3) * 255); data[i + 2] = Math.round(k(1) * 255);
}
await sharp(data, {raw: info}).webp({quality: 82}).toFile(out);
console.log('recolored', out);
