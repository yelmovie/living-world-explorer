// Contact sheet for scripts/shrink-glb.py renders: rows = views, columns = original + levels.  node scripts/glb-sheet.mjs <dir> <name> <out.png> <level...>
import sharp from 'sharp';
const [dir, name, out, ...levels] = process.argv.slice(2);
const cols = ['orig', ...levels], rows = ['front', 'side', 'below'], w = 320, h = 240;
const composites = [];
for (const [r, view] of rows.entries()) for (const [c, tag] of cols.entries())
  composites.push({input: await sharp(`${dir}/${name}-${tag}-${view}.png`).resize(w, h).toBuffer(), left: c * w, top: r * h + 28});
const labels = cols.map((tag, c) => `<text x="${c * w + 10}" y="20" font-size="18" font-family="sans-serif">${tag === 'orig' ? '원본' : tag + ' tri'}</text>`).join('');
composites.push({input: Buffer.from(`<svg width="${cols.length * w}" height="28">${labels}</svg>`), left: 0, top: 0});
await sharp({create: {width: cols.length * w, height: rows.length * h + 28, channels: 3, background: '#ffffff'}}).composite(composites).png().toFile(out);
console.log(out);
