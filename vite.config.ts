import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

// No @types/node here: Rollup's this.fs and Web Crypto keep the config type-checkable as-is.
const hash = async (data: Uint8Array | string, n: number) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)))].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, n);
// After the bundle is written, list every emitted file (hashed JS/CSS + public/) with a content hash inside sw.js.
// BGM and the optional 3D viewer (three.js chunk + GLB models) are marked lazy: cached on first use, not at install.
// _headers is Cloudflare config and is never served.
function offlinePrecache(): Plugin {
  return { name: 'offline-precache', apply: 'build', async writeBundle({ dir }) {
    if (!dir) return;
    const walk = async (sub: string): Promise<string[]> => (await Promise.all((await this.fs.readdir(`${dir}/${sub}`, { withFileTypes: true })).map(e => e.isDirectory() ? walk(`${sub}${e.name}/`) : [sub + e.name]))).flat();
    const names = (await walk('')).filter(f => !['sw.js', '_headers'].includes(f)).sort();
    const files = await Promise.all(names.map(async f => [f, await hash(await this.fs.readFile(`${dir}/${f}`), 10), ...(/^assets\/(audio\/bgm-[^/]+\.m4a|models\/[^/]+\.glb|model-viewer-[^/]+\.js)$/.test(f) ? [1] : [])]));
    if (!names.includes('index.html')) throw Error('offline-precache: index.html missing');
    const sw = `${dir}/sw.js`, source = await this.fs.readFile(sw, { encoding: 'utf8' });
    const out = source.replace("const VERSION='dev',FILES=[];", `const VERSION='${await hash(JSON.stringify(files), 12)}',FILES=${JSON.stringify(files)};`);
    if (out === source) throw Error('offline-precache: marker missing in sw.js');
    await this.fs.writeFile(sw, out);
  } };
}
// Scratch builds in .tmp must not be watched: on Windows the watcher's handle blocks re-emptying those folders.
export default defineConfig({ base: './', plugins: [offlinePrecache()], server: { watch: { ignored: ['**/.tmp/**', '**/.cache/**'] } }, build: { chunkSizeWarningLimit: 1500 }, test: { environment: 'node', include: ['tests/**/*.test.ts'] } });
