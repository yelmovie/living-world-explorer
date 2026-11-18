// 2026-11-18 초기 로딩 실측(edu-final-check D1·8번): 새 컨텍스트, 캐시 끔, 서비스 워커 차단, 10Mbps·40ms·CPU 4배 감속.
// 사용: APP_URL=https://living-world-explorer.pages.dev node tests/startup-load.mjs
import {launchBrowser} from './browser.mjs';
const base=process.env.APP_URL||'https://living-world-explorer.pages.dev',runs=+(process.env.RUNS||3);
const browser=await launchBrowser(),rows=[];
try{
 for(let i=0;i<runs;i++){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:800}});const page=await context.newPage();
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:10*1024*1024/8,uploadThroughput:5*1024*1024/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const started=Date.now();await page.goto(base+'/#/main');
  await page.getByRole('button',{name:'탐험 시작',exact:true}).waitFor();
  await page.waitForFunction(()=>document.fonts.status==='loaded'&&[...document.images].every(i=>i.complete));
  const ready=Date.now()-started;
  const res=await page.evaluate(()=>{const e=performance.getEntriesByType('resource');return {bytes:e.reduce((s,r)=>s+(r.transferSize||0),0)+(performance.getEntriesByType('navigation')[0]?.transferSize||0),requests:e.length+1,external:e.filter(r=>new URL(r.name).origin!==location.origin).length};});
  rows.push({run:i+1,readyMs:ready,...res});console.log(JSON.stringify(rows.at(-1)));await context.close();
 }
}finally{await browser.close();}
