import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {button,launchBrowser,navigate,skipFilm,teacherTools,waitSaved} from './browser.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const out=process.env.CORE_SHOTS||'.tmp/core-figure';
await mkdir(out,{recursive:true});
const live=process.env.CORE_WEBGL==='1';
const browser=live?await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}):await launchBrowser();
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,serviceWorkers:'block'});
 if(!live)await context.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};
 });
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await navigate(page,base,'nature-map');
 const tools=await teacherTools(page);
 await tools.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
 await tools.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();
 await page.locator('dialog[open]').waitFor({state:'detached'});
 await navigate(page,base,'core-restoration');
 const port=page.locator('.core-port'),lamps=page.locator('.core-lamp');
 const power=button(page,'코어 가동');
 assert.equal(await lamps.count(),5);
 assert.equal(await page.locator('.core-lamp.is-lit').count(),0);
 assert.equal(await page.locator('.core-port:disabled').count(),5);
 assert.ok(await power.isDisabled());
 await navigate(page,base,'final-report');
 for(let i=0;i<5;i++)await button(page,'이 기록 확인').click();
 await button(page,'발견을 코어에 연결').click();
 await page.locator(`.core-figure-stage[data-renderer=${live?'three':'image'}]`).waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.core-figure img')].every(n=>n.complete&&n.naturalWidth));

 for(const [width,height] of [[1280,800],[1920,1080],[1024,768],[915,412],[830,515],[375,812]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>document.querySelector('#app').scrollTop=0);
  const status=await page.evaluate(()=>{
   const app=document.querySelector('#app'),stage=document.querySelector('.core-figure-stage');
   const art=stage.querySelector(stage.dataset.renderer==='three'?'.core-live-canvas':'.core-figure-art').getBoundingClientRect();
   const controls=[...document.querySelectorAll('.core-port')],panel=document.querySelector('.core-controls').getBoundingClientRect();
   const targets=controls.map(b=>{
    const r=b.getBoundingClientRect();
    return {width:r.width,height:r.height,hit:r.top>=panel.top&&r.bottom<=Math.min(panel.bottom,innerHeight)+1&&b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
   });
   const power=document.querySelector('.action-bar .primary').getBoundingClientRect();
   return {overflow:app.scrollWidth>innerWidth+1,artHeight:art.height,powerInView:power.bottom<=innerHeight+1,targets};
  });
  assert.ok(!status.overflow&&status.artHeight>=130,JSON.stringify({width,height,status}));
  assert.ok(status.targets.every(r=>r.width>=44&&r.height>=47.5),JSON.stringify({width,height,status}));
  if(width>=830)assert.ok(status.powerInView&&status.targets.every(r=>r.hit),'All five ports and power should be in view: '+JSON.stringify({width,height,status}));
  else{await port.last().scrollIntoViewIfNeeded();assert.ok(await port.last().evaluate(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));}
  await page.screenshot({path:out+'/'+width+'x'+height+'-waiting.png'});
 }
 await page.setViewportSize({width:915,height:412});
 await port.nth(2).tap();
 assert.deepEqual(await page.locator('.core-lamp.is-lit').evaluateAll(nodes=>nodes.map(n=>n.dataset.channel)),['3']);
 assert.match(await port.nth(2).innerText(),/연결 완료/);
 await port.nth(2).evaluate(b=>b.click());
 const partial=await waitSaved(page,s=>s.preview.ports.length===1);
 assert.deepEqual(partial.preview.ports,['M3']);
 await page.screenshot({path:out+'/915x412-one-linked.png'});
 await navigate(page,base,'final-report');
 await button(page,'발견을 코어에 연결').click();
 assert.deepEqual(await page.locator('.core-lamp.is-lit').evaluateAll(nodes=>nodes.map(n=>n.dataset.channel)),['3']);
 assert.ok(await power.isDisabled());

 await port.first().press('Enter');
 assert.equal(await port.nth(1).evaluate(n=>n===document.activeElement),true,'keyboard focus moves to the next port');
 for(const i of [1,3,4])await port.nth(i).tap();
 assert.equal(await page.locator('.core-lamp.is-lit').count(),5);
 assert.ok(await power.isEnabled());
 await page.screenshot({path:out+'/915x412-ready.png'});
 await page.setViewportSize({width:1280,height:800});
 await power.tap();
 assert.equal(await page.locator('.core-figure').getAttribute('data-power'),'running');
 if(live){
  const canvas=page.locator('.core-live-canvas');
  const first=await canvas.screenshot();
  await page.waitForTimeout(450);
  assert.notDeepEqual(await canvas.screenshot(),first,'the crystal and ring actually move during activation');
 }
 await page.screenshot({path:out+'/1280x800-powered.png',animations:'disabled'});
 // Taking software-rendered screenshots can outlast the five-second activation.
 await button(page,'결과로 바로 가기').click({timeout:2000}).catch(async error=>{
  if(!await page.locator('.screen-results').isVisible())throw error;
 });
 await skipFilm(page);
 await page.locator('.screen-results').waitFor();
 assert.deepEqual((await waitSaved(page,s=>s.preview.activated)).preview.ports.sort(),['M1','M2','M3','M4','M5']);
 await navigate(page,base,'core-restoration');
 if(live){
  await page.locator('.core-figure-stage[data-renderer=three]').waitFor();
  await page.locator('.core-live-canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.core-figure-stage[data-renderer=image] .core-figure-art').first().waitFor();
  assert.equal(await page.locator('.core-lamp.is-lit').count(),5);
 }else{
  await page.route('**/bio-core.webp',route=>route.abort());
  await navigate(page,base,'final-report');
  await navigate(page,base,'core-restoration');
  await page.locator('.core-figure-fallback').waitFor();
 }
 assert.equal(await page.locator('.core-figure').getAttribute('data-power'),'powered');
 assert.ok(await power.isEnabled(),'a failed image does not block activation');
 await power.click();
 await button(page,'결과로 바로 가기').click();
 await skipFilm(page);
 await page.locator('.screen-results').waitFor();
 assert.deepEqual(errors,[]);
 console.log(`CORE ${live?'THREE.JS':'IMAGE'} PASS: six viewport sizes, touch, keyboard, individual lamps, duplicate protection, revisit, activation, fallback`);
}finally{await browser.close();}
