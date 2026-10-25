// Classroom offline check: first online visit installs the service worker, then the server disappears and play continues.
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {launchBrowser,navigate,waitForScene} from './browser.mjs';

const out='.tmp/offline-dist';const vite='node_modules/vite/bin/vite.js';
const built=spawnSync(process.execPath,[vite,'build','--outDir',out,'--emptyOutDir','--logLevel','warn'],{stdio:'inherit'});if(built.status!==0)throw Error('build failed');
const files=JSON.parse(/FILES=(\[.*?\]);/.exec(readFileSync(`${out}/sw.js`,'utf8'))[1]);const precached=files.filter(f=>!f[2]);
const bytes=list=>list.reduce((n,[f])=>n+statSync(`${out}/${f}`).size,0);
const port=await new Promise(ok=>{const s=createServer().listen(0,'127.0.0.1',()=>{const {port}=s.address();s.close(()=>ok(port));});});
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,[vite,'preview','--outDir',out,'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});
const stop=()=>{if(server.exitCode===null)server.kill();};
const result={base,version:/VERSION='([^']+)'/.exec(readFileSync(`${out}/sw.js`,'utf8'))[1],precache:{files:precached.length,mb:+(bytes(precached)/1048576).toFixed(2)},lazy:files.filter(f=>f[2]).map(f=>f[0]),failed:[],errors:[]};
let browser,ok=false;
try{
 for(let i=0;;i++){try{if((await fetch(base+'/')).ok)break;}catch{}if(i>100)throw Error('preview server did not start');await new Promise(r=>setTimeout(r,100));}
 browser=await launchBrowser();const context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push(e.message));
 await navigate(page,base,'main');
 await page.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000});
 result.online=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;const keys=await (await caches.open('life-code-lab')).keys();return {state:r.active?.state,controlled:!!navigator.serviceWorker.controller,entries:keys.length};});
 if(result.online.entries<precached.length)throw Error(`precache incomplete: ${result.online.entries}/${precached.length}`);
 // Media elements send Range requests; playing BGM once online stores the whole file for later.
 const ranged=(src,range)=>page.evaluate(async([src,range])=>{const r=await fetch(src,{headers:{range}});return {status:r.status,range:r.headers.get('content-range'),bytes:(await r.arrayBuffer()).byteLength};},[src,range]);
 await ranged('assets/audio/bgm-main-theme.m4a','bytes=0-');
 // Server gone + browser offline: everything below must come from Cache Storage.
 stop();await context.setOffline(true);
 page.on('requestfailed',r=>{if(r.url().startsWith(base))result.failed.push(r.url().slice(base.length));});
 await page.reload();await page.locator('.screen-main').waitFor({timeout:20000});result.main=await page.locator('.hero .title-art').evaluate(i=>i.complete&&i.naturalWidth>0);
 await navigate(page,base,'nature-map');await waitForScene(page,'.map-host');result.map={canvas:await page.locator('.map-host canvas').count()};
 await navigate(page,base,'fungi-field');await waitForScene(page,'.expedition-canvas-host');result.inquiry={canvas:await page.locator('.expedition-canvas-host canvas').count()};
 const study=precached.map(f=>f[0]).filter(f=>f.startsWith('assets/study/'));
 result.inquiry.study=await page.evaluate(srcs=>Promise.all(srcs.map(src=>new Promise(done=>{const i=new Image();i.onload=i.onerror=()=>done({src,width:i.naturalWidth});i.src=src;}))),study);
 await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(i=>i.complete));
 result.inquiry.domImages=await page.locator('main img').evaluateAll(list=>list.map(i=>({src:i.getAttribute('src'),width:i.naturalWidth})));
 const broken=[...result.inquiry.study,...result.inquiry.domImages].filter(i=>!i.width);
 const bgm=statSync(`${out}/assets/audio/bgm-main-theme.m4a`).size;
 result.media={video:await ranged('assets/concepts/M1.mp4','bytes=100-199'),bgm:await ranged('assets/audio/bgm-main-theme.m4a','bytes=0-')};
 const mediaOk=result.media.video.status===206&&result.media.video.bytes===100&&/^bytes 100-199\//.test(result.media.video.range)&&result.media.bgm.status===206&&result.media.bgm.bytes===bgm;
 if(!result.main||!result.map.canvas||!result.inquiry.canvas||broken.length||result.failed.length||!mediaOk)throw Error('offline play broke: '+JSON.stringify({main:result.main,broken,failed:result.failed,media:result.media}));
 ok=true;
}catch(e){result.error=String(e?.stack||e);}
finally{await browser?.close();stop();await mkdir('.tmp',{recursive:true});await writeFile('.tmp/offline.json',JSON.stringify(result,null,1));}
console.log(JSON.stringify({ok,version:result.version,precache:result.precache,online:result.online,map:result.map,inquiry:result.inquiry&&{canvas:result.inquiry.canvas,study:result.inquiry.study?.length,domImages:result.inquiry.domImages?.length},media:result.media,failed:result.failed,error:result.error}));
process.exit(ok?0:1);
