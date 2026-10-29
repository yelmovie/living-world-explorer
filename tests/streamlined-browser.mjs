import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,button,navigate,readSaved,waitSaved,setRange,teacherTools} from './browser.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser(),errors=[],checks=[];
const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const btn=n=>button(page,n);
async function touch(p,x,y){const rect=await p.locator('.expedition-canvas-host canvas').boundingBox();assert.ok(rect);await p.touchscreen.tap(rect.x+x/960*rect.width,rect.y+y/540*rect.height);}
async function ready(p){await p.locator('.inquiry-loading').waitFor({state:'detached'});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function activity(p,route,order){await navigate(p,base,route);await p.getByRole('button',{name:new RegExp('^'+order+'번째 발견:')}).click();await ready(p);}
async function centerPixels(p){await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return p.locator('.expedition-canvas-host canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(350,140,250,180).data).filter((_,i)=>i%103===0).join(','));}
async function alternative(p){await button(p,'버튼으로 조작').click();return p.getByRole('dialog').last();}
try{
 await mkdir('.tmp/streamlined',{recursive:true});
 await navigate(page,base,'fungi-field');await ready(page);
 // A wrong grouping is editable in place. Reading and choosing never requires a source modal.
 await touch(page,245,165);assert.equal(await page.locator('dialog[open]').count(),0);assert.ok((await page.locator('.source-preview').innerText()).includes('죽은 나무'));
 await touch(page,805,390);await waitSaved(page,s=>s.learner.inquiry.records['M1-1'].assignments.log==='mold');assert.ok((await page.locator('.inquiry-feedback').innerText()).length>0);
 await touch(page,245,165);await touch(page,805,190);await waitSaved(page,s=>s.learner.inquiry.records['M1-1'].assignments.log==='mushroom');
 await page.screenshot({path:'.tmp/streamlined/source-touch.png'});checks.push('wrong classification gives feedback and can be corrected with two taps without reopening a modal');
 // Empty teacher preview does not acquire ports or activate the core, even when routing is unlocked.
 let settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await navigate(page,base,'water-sampling');await ready(page);
 await touch(page,130,360);await touch(page,300,168);await waitSaved(page,s=>s.preview.inquiry.records['M2-1'].sequence===2);await btn('한 방울 옮기기').click();await waitSaved(page,s=>s.preview.inquiry.records['M2-1'].sequence===3);
 await touch(page,130,360);assert.equal((await waitSaved(page)).preview.inquiry.records['M2-1'].sequence,3);await touch(page,390,265);await waitSaved(page,s=>s.preview.inquiry.records['M2-1'].assignments.site==='plant'&&s.preview.inquiry.records['M2-1'].sequence===0);checks.push('one pipette tap collects water; changing the sampling site requires a fresh sample, reselecting the same site preserves it');
 await navigate(page,base,'core-restoration');await page.locator('.scene-loading').waitFor({state:'detached'});
 for(const port of await page.locator('.slot-row button').all())assert.ok(await port.isDisabled());assert.ok(await btn('코어 가동').isDisabled());
 await page.locator('.slot-row button').first().evaluate(b=>{b.click();b.click();});assert.deepEqual((await readSaved(page)).preview.ports,[]);checks.push('unlocked routing cannot connect missing evidence or activate the core');
 settings=await teacherTools(page);await settings.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();await page.locator('dialog[open]').waitFor({state:'detached'});
 await navigate(page,base,'core-restoration');await page.locator('.scene-loading').waitFor({state:'detached'});assert.ok(await btn('코어 가동').isDisabled());assert.ok(await page.locator('.slot-row button').first().isDisabled());
 await navigate(page,base,'final-report');for(let i=0;i<5;i++)await page.getByRole('button',{name:/^(이 )?기록 확인$/}).click();await btn('발견을 코어에 연결').click();await page.locator('.scene-loading').waitFor({state:'detached'});
 await page.locator('.slot-row button').first().evaluate(b=>{b.click();b.click();});await waitSaved(page,s=>s.preview.ports.length===1);assert.equal(await page.locator('dialog[open]').count(),0);assert.equal((await readSaved(page)).preview.ports.length,1);checks.push('core requires reported evidence and double input connects each record exactly once');
 // Completed learner records are isolated from the teacher preview checks above.
 const completed=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,storageState:'.tmp/learner20-state.json'}),p=await completed.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 await activity(p,'solution-assembly',1);const before=(await readSaved(p)).learner.inquiry.records['M5-1'];
 const editor=await alternative(p);await editor.getByRole('button',{name:'우유',exact:true}).click();await editor.getByRole('button',{name:'재료에 연결',exact:true}).click();await editor.getByRole('button',{name:'닫기',exact:true}).click();
 const after=(await waitSaved(p)).learner.inquiry.records['M5-1'];assert.equal(after.prediction,before.prediction);assert.equal(after.runResult,before.runResult);assert.equal(after.reflection,before.reflection);assert.deepEqual(after.runs,before.runs);checks.push('placing the same design material preserves its completed experiment');
 await activity(p,'protist-observation',3);if(await button(p,'움직임 다시 보기').count())await button(p,'움직임 다시 보기').click();
 await setRange(p,'관찰 시점',0);const pinB=p.getByRole('button',{name:/^B 고정/});if(await pinB.isEnabled())await pinB.click();
 const invalid=(await waitSaved(p)).learner.inquiry.records['M2-3'];assert.ok(Math.abs(invalid.pins[1]-invalid.pins[0])>=3,'an invalid B must not replace the accepted comparison');assert.ok((await p.locator('.inquiry-feedback').innerText()).includes('다른 순간'));
 await setRange(p,'관찰 시점',5);await p.getByRole('button',{name:/^B 고정/}).click();assert.ok(await button(p,'현미경으로 움직임의 비밀 찾기').isEnabled());checks.push('movement close-up requires two distinct observation times and recovers after correction');
 await activity(p,'impact-investigation',1);const paired=await centerPixels(p);await setRange(p,'관찰 순서',1);const preview=await centerPixels(p);assert.notEqual(preview,paired,'changing time after comparison must preview the selected specimen, not keep the pinned pair');
 await p.screenshot({path:'.tmp/streamlined/timeline-preview.png'});checks.push('changing time after a pinned comparison previews the selected image');
 const markDialog=await alternative(p);await markDialog.getByRole('button',{name:'닫기',exact:true}).click();const restoredPair=await centerPixels(p);assert.equal(restoredPair,paired,'button-based marking must return from a preview to the pinned comparison');checks.push('alternative marking returns to the same pinned before/after pictures');
 await activity(p,'solution-run',4);await p.getByLabel('내 소개 문장',{exact:true}).fill('내가 고친 소개 문장을 지켜요.');
 const publishBefore=(await waitSaved(p,s=>s.learner.inquiry.records['M5-4'].note==='내가 고친 소개 문장을 지켜요.')).learner.inquiry.records['M5-4'];
 await touch(p,180,170);const publishAfter=(await waitSaved(p)).learner.inquiry.records['M5-4'];assert.equal(publishAfter.note,publishBefore.note);assert.equal(publishAfter.assignments.action,publishBefore.assignments.action);assert.equal(publishAfter.assignments.evidence,'yogurt');
 await p.setViewportSize({width:768,height:1024});await p.getByRole('button',{name:'기록 확인하고 계속',exact:true}).scrollIntoViewIfNeeded();assert.ok(await p.getByRole('button',{name:'기록 확인하고 계속',exact:true}).isVisible());await p.reload();await ready(p);assert.equal(await p.getByLabel('내 소개 문장',{exact:true}).inputValue(),'내가 고친 소개 문장을 지켜요.');checks.push('reselecting a case, rotation and reload preserve the learner introduction');
 assert.equal(errors.length,0,errors.join('; '));await writeFile('.tmp/streamlined/checks.json',JSON.stringify({status:'PASS',checks,errors},null,2));console.log(JSON.stringify({status:'PASS',checks,errors},null,2));
}catch(error){process.exitCode=1;console.error(error.stack);await page.screenshot({path:'.tmp/streamlined/failure.png'}).catch(()=>{});await writeFile('.tmp/streamlined/checks.json',JSON.stringify({status:'FAIL',checks,errors,error:error.message},null,2));}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);}
