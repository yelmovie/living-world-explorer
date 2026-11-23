import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const out='.tmp/ui-review',base=process.env.APP_URL||'http://127.0.0.1:5358';await mkdir(out,{recursive:true});
process.env.TMP=process.env.TEMP=new URL('../.tmp/browser-temp/',import.meta.url).pathname;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-gpu','--disable-gpu-compositing']});
try{const page=await browser.newPage();await page.goto(base+'/#/main');const ua=await page.evaluate(()=>navigator.userAgent),results=[];
 for(const path of ['assets/audio/voice/moa/discovery-M1-2-20261123.mp3','assets/audio/voice/moa/discovery-M3-1-20261123.mp3','assets/audio/voice/M3-memory-20261123.mp3']){
  const result=await page.evaluate(async path=>{const a=new Audio(path);a.muted=true;a.playbackRate=1;const result={path,events:[]};for(const type of ['loadedmetadata','playing','ended','error'])a.addEventListener(type,()=>result.events.push({type,t:a.currentTime}));return await new Promise(resolve=>{const timer=setTimeout(()=>{a.pause();resolve({...result,pass:false,error:'timeout'});},45000);a.onended=()=>{clearTimeout(timer);resolve({...result,ended:true,duration:a.duration,pass:true});};a.onerror=()=>{clearTimeout(timer);resolve({...result,pass:false,error:a.error?.message});};a.play().catch(error=>{clearTimeout(timer);resolve({...result,pass:false,error:error.message});});});},path);results.push(result);assert.ok(result.pass,JSON.stringify(result));console.log('VERSIONED VOICE PASS',path);
 }await writeFile(out+'/versioned-voice-playback.json',JSON.stringify({ua,muted:true,playbackRate:1,source:'installed Mac Chrome, dedicated isolated automated test context, final versioned paths',physicalTablet:false,results},null,2));
}finally{await browser.close();}
