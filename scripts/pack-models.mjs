// Meshy GLB → public/assets/models: shrink the embedded textures, then gltfpack simplifies with UV seams locked and meshopt-compresses.
// Blender's merge + Decimate collapsed across UV seams and smeared the texture into shards (2026-10-26), so no Blender step here.
// node scripts/pack-models.mjs [name...]   (originals: assets/generated/models-20261025/<name>-meshy.glb, Git-ignored)
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

// Texture limits per class (colour, normal, metal/rough) and the gltfpack error bound. A looser bound cut seam edges short and showed dark
// lines (yeast 0.005, paramecium 0.002), so each model keeps the loosest bound whose close-up still matched the original.
const models = {
  mushroom: {tex: [2048, 2048, 512], error: 0.005},
  'bread-mold': {tex: [2048, 2048, 512], error: 0.002},
  paramecium: {tex: [2048, 2048, 512], error: 0.001},
  yeast: {tex: [2048, 2048, 256], error: 0.0015}
};

async function shrinkTextures(src, out, [colorPx, normalPx, attribPx]) {
  const glb = await readFile(src);
  const jsonLength = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  const binStart = 20 + jsonLength + 8, bin = glb.subarray(binStart, binStart + glb.readUInt32LE(20 + jsonLength));
  if (json.buffers.length !== 1 || json.extensionsRequired?.length) throw Error(`${src}: expects a single-buffer GLB without required extensions`);
  // Texture class from how materials use it.
  const limit = new Map();
  const use = (info, side) => { if (!info) return; const image = json.textures[info.index].source; limit.set(image, Math.max(limit.get(image) ?? 0, side)); };
  for (const m of json.materials ?? []) {
    use(m.pbrMetallicRoughness?.baseColorTexture, colorPx); use(m.emissiveTexture, colorPx);
    use(m.normalTexture, normalPx); use(m.pbrMetallicRoughness?.metallicRoughnessTexture, attribPx); use(m.occlusionTexture, attribPx);
  }
  const views = json.bufferViews.map(v => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
  for (const [i, image] of json.images.entries()) {
    const side = limit.get(i) ?? colorPx, input = views[image.bufferView], {width, height} = await sharp(input).metadata();
    views[image.bufferView] = await sharp(input).resize({width: Math.min(side, width), height: Math.min(side, height), fit: 'fill'}).jpeg({quality: 90, mozjpeg: true}).toBuffer();
    image.mimeType = 'image/jpeg';
  }
  // Repack every view 4-byte aligned in its original order.
  let offset = 0; const parts = [];
  for (const [i, v] of views.entries()) { const pad = (4 - offset % 4) % 4; if (pad) parts.push(Buffer.alloc(pad)); offset += pad; Object.assign(json.bufferViews[i], {byteOffset: offset, byteLength: v.length}); parts.push(v); offset += v.length; }
  json.buffers[0].byteLength = offset;
  const binOut = Buffer.concat([...parts, Buffer.alloc((4 - offset % 4) % 4)]);
  let jsonOut = Buffer.from(JSON.stringify(json)); jsonOut = Buffer.concat([jsonOut, Buffer.alloc((4 - jsonOut.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonOut.length + 8 + binOut.length, 8);
  const chunk = (data, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(data.length, 0); h.writeUInt32LE(type, 4); return [h, data]; };
  await writeFile(out, Buffer.concat([header, ...chunk(jsonOut, 0x4e4f534a), ...chunk(binOut, 0x004e4942)]));
}

await mkdir('.tmp/models', {recursive: true});
for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(models)) {
  const {tex, error} = models[name], textured = `.tmp/models/${name}-tex.glb`, out = `public/assets/models/${name}.glb`;
  await shrinkTextures(`assets/generated/models-20261025/${name}-meshy.glb`, textured, tex);
  // -si only sets a floor; the error bound and locked seams decide where it stops. UVs 14-bit so seams stay put on 2048 textures.
  const log = execFileSync('node', ['node_modules/gltfpack/cli.js', '-i', textured, '-o', out, '-si', '0.01', '-se', String(error), '-cc', '-vt', '14', '-v'], {encoding: 'utf8'});
  console.log(name, log.match(/^output: 1 mesh primitives \((\d+) triangles/m)?.[1], 'tris', (await readFile(out)).length, 'bytes');
}
