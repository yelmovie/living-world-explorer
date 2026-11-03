import assert from 'node:assert/strict';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {button,navigate,teacherTools,waitForScene,waitSaved} from './browser.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:4173';
const output=resolve('.tmp/lab-tools');mkdirSync(output,{recursive:true});
process.env.TEMP=process.env.TMP=resolve('.tmp/browser-temp');mkdirSync(process.env.TEMP,{recursive:true});
const local='.cache/browser-manual/chrome-win/chrome.exe';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||(existsSync(local)?local:undefined),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const b=name=>button(page,name),canvas=page.locator('.expedition-canvas-host canvas');
const cdp=await page.context().newCDPSession(page);
const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
const point=async(x,y)=>{const r=await canvas.boundingBox();return [r.x+x*r.width/960,r.y+y*r.height/540];};
const waitLevel=name=>page.waitForFunction(n=>[...document.querySelectorAll('.level-steps button')].some(b=>b.textContent===n&&b.getAttribute('aria-pressed')==='true'),name);
try{
 await navigate(page,base,'fungi-field');const settings=await teacherTools(page);
 await settings.getByRole('button',{name:'관리자 전체 해금'}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await navigate(page,base,'fungi-field');await page.getByRole('button',{name:/^2번째 발견:/}).click();await waitForScene(page,'.expedition-canvas-host');
 await b('돋보기로 크게 보기').click();await waitLevel('돋보기');
 // Compare the disk at a fixed position to actual pixels from the same specimen enlarged 2.5 times.
 await page.mouse.move(...await point(390,215));await page.waitForTimeout(180);
 const pixelError=await canvas.evaluate(async c=>{
  const img=new Image();img.src='assets/study/mushroom.webp';await img.decode();
  const ref=document.createElement('canvas');ref.width=960;ref.height=540;const ctx=ref.getContext('2d');
  const s=405/img.height,w=img.width*s,left=480-w/2,top=282-405/2,cx=390,cy=215;
  ctx.drawImage(img,cx-(cx-left)*2.5,cy-(cy-top)*2.5,w*2.5,405*2.5);
  const actual=c.getContext('2d').getImageData(cx-30,cy-30,60,60).data;
  const wanted=ctx.getImageData(cx-30,cy-30,60,60).data;
  let error=0;for(let i=0;i<wanted.length;i++)error+=Math.abs(wanted[i]-actual[i]);return error/wanted.length;
 });assert.ok(pixelError<12,'lens should sample the specimen at its current position: '+pixelError);
 await page.screenshot({path:output+'/mushroom-lens.png'});
 const g=await point(376,213),stem=await point(477,377);
 await touch('touchStart',[stem]);await touch('touchMove',[g]);await touch('touchEnd',[]);await waitLevel('돋보기');
 const wrong=await point(206,430);await page.touchscreen.tap(...wrong);await waitLevel('돋보기');
 await b('3D로 돌려 보기').click();
 const dialog=page.locator('.model-dialog'),plus=dialog.getByRole('button',{name:'확대',exact:true}),minus=dialog.getByRole('button',{name:'축소',exact:true}),scale=dialog.locator('output');await dialog.locator('canvas').waitFor({timeout:30000});await plus.waitFor();
 await dialog.getByRole('button',{name:'아래에서 보기'}).click();await dialog.getByRole('button',{name:'아래에서 보기'}).click();
 const crop=async()=>sharp(await dialog.locator('canvas').screenshot()).resize(90,55).removeAlpha().raw().toBuffer();
 const before=await crop();await plus.click();await plus.click();assert.equal(await scale.textContent(),'2배');
 const after=await crop();let delta=0;for(let i=0;i<before.length;i++)delta+=Math.abs(before[i]-after[i]);assert.ok(delta/before.length>8,'actual model rendering enlarged');
 const r=await dialog.locator('canvas').boundingBox(),cx=r.x+r.width*.53,cy=r.y+r.height*.48;
 await page.mouse.move(cx,cy);await page.mouse.wheel(0,-700);await page.waitForFunction(()=>document.querySelector('.model-zoom output').value==='3배');assert.ok(await plus.isDisabled());
 await page.screenshot({path:output+'/mushroom-3d.png'});await minus.click();assert.equal(await scale.textContent(),'2.5배');
 await dialog.getByRole('button',{name:'처음 자리'}).click();assert.ok(await minus.isDisabled());
 await touch('touchStart',[[cx-25,cy],[cx+25,cy]]);await touch('touchMove',[[cx-50,cy],[cx+50,cy]]);await touch('touchEnd',[]);
 assert.ok(parseFloat(await scale.textContent())>1.7,'pinch zoom');
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();await page.touchscreen.tap(...g);await waitLevel('현미경');
 await navigate(page,base,'solution-assembly');await page.getByRole('button',{name:/^1번째 발견:/}).click();await waitForScene(page,'.expedition-canvas-host');
 await b('유산균은 어떤 세균일까?').click();await page.getByText('어떤 유산균이 함께 일할까?',{exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/불가리아균/);await b('닫기').click();
 const tap=async(x,y)=>page.touchscreen.tap(...await point(x,y));
 // The machine itself accepts a liquid and a starter, and the goal gets its own slot.
 for(const [source,target] of [[831,480],[365,480],[598,775]]){await tap(source,431);await tap(target,200);}
 await b('요구르트가 될 거예요').click();await b('발효기 켜기').click();await b('예상과 달라요').waitFor();await b('예상과 달라요').click();
 assert.equal((await waitSaved(page)).preview.inquiry.records['M5-1'].runResult,'stopped');
 await tap(132,431);await tap(480,200);await b('요구르트가 안 될 거예요').click();await page.screenshot({path:output+'/yogurt-workbench.png'});await b('발효기 켜기').click();await page.waitForTimeout(2900);await page.screenshot({path:output+'/yogurt-fermentation.png'});await b('예상과 달라요').waitFor();await b('예상과 달라요').click();
 const record=(await waitSaved(page)).preview.inquiry.records['M5-1'];assert.equal(record.runResult,'supported');assert.equal(record.runs.at(-1).prediction,'stopped');assert.equal(record.reflection,'differs');
 assert.deepEqual(errors,[]);console.log('PASS: same-image lens, drag vs tap, wheel/button/pinch and actual 3D rendering, wrong and correct yogurt batches, learner reflection', {pixelError});
}catch(e){console.error((await page.locator('body').innerText()).slice(-1600));await page.screenshot({path:output+'/failure.png'});throw e;}finally{await browser.close();}
