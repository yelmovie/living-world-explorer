import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,waitSaved,setRange,waitForScene,linkCard,linkTarget} from './browser.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:4173',browser=await launchBrowser();
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const b=name=>button(page,name);
await mkdir('.tmp/fungi-update',{recursive:true});
const shot=name=>page.screenshot({path:'.tmp/fungi-update/'+name+'.png'});
const ready=async()=>{await page.locator('.inquiry-loading').waitFor({state:'detached'});await waitForScene(page,'.expedition-canvas-host');};
const centre=async node=>{const box=await node.boundingBox();return [box.x+box.width/2,box.y+box.height/2];};
try{
 await navigate(page,base,'fungi-field');
 const original=(await waitSaved(page)).learner;
 const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금'}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await navigate(page,base,'fungi-microscope');await page.getByRole('button',{name:/^3번째 발견:/}).click();await ready();
 assert.equal(await page.locator('.mission-emblem img').getAttribute('src'),'assets/study/mold.webp');
 assert.equal(await page.getByRole('slider',{name:'초점',exact:true}).inputValue(),'25');
 assert.ok(await b('사진 촬영').isDisabled());await shot('mold-before-focus');
 const initial=await page.locator('.expedition-canvas-host canvas').screenshot();
 await setRange(page,'초점',65);assert.ok(await b('사진 촬영').isEnabled());
 await shot('mold-focused');const focused=await page.locator('.expedition-canvas-host canvas').screenshot();assert.notDeepEqual(initial,focused);
 await setRange(page,'밝기',20);assert.ok(await b('사진 촬영').isDisabled());await setRange(page,'밝기',65);
 await b('사진 촬영').click();await b('다시 관찰').click();assert.equal(await page.getByRole('slider',{name:'초점',exact:true}).inputValue(),'25');
 await page.getByRole('button',{name:/자동재생/}).click();await page.getByRole('button',{name:/멈추기/}).waitFor({state:'detached',timeout:18000});
 assert.equal(await page.getByRole('slider',{name:'초점',exact:true}).inputValue(),'25');assert.ok(await b('사진 촬영').isDisabled());
 await setRange(page,'초점',65);await b('사진 촬영').click();
 await b('버튼으로 조작').click();
 for(const [x,y] of [[.38,.17],[.36,.5]]){await setRange(page,'표시 가로 위치',x);await setRange(page,'표시 세로 위치',y);await b('이 위치 표시').click();}
 await b('닫기').click();await b('발견 기록하기').click();
 assert.equal(await page.locator('.discovery-stamp img').getAttribute('src'),'assets/study/mold.webp');
 await shot('mold-discovery');await b('다음 발견으로').click();await ready();
 // Wrong link, correction, cancelled drag, and two connections to the same target.
 await linkCard(page,'cap').tap();await linkTarget(page,'mold').tap();
 let saved=await waitSaved(page,s=>s.preview.inquiry.records['M1-4'].assignments.cap==='mold');assert.equal(saved.preview.inquiry.records['M1-4'].submitted,false);
 const cdp=await context.newCDPSession(page);
 async function drag(from,to){const [a,b]=await centre(from),[c,d]=Array.isArray(to)?to:await centre(to);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:a,y:b}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:a+(c-a)*i/8,y:b+(d-b)*i/8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await drag(linkCard(page,'cap'),linkTarget(page,'mushroom'));await waitSaved(page,s=>s.preview.inquiry.records['M1-4'].assignments.cap==='mushroom');
 const [gapX,gapY]=await centre(linkCard(page,'cap'));await drag(linkCard(page,'cap'),[gapX+260,gapY+6]);assert.equal((await waitSaved(page)).preview.inquiry.records['M1-4'].assignments.cap,'mushroom');
 await linkCard(page,'hypha').tap();await linkTarget(page,'mold').tap();await linkCard(page,'mycelium').tap();await linkTarget(page,'both').tap();await drag(linkCard(page,'spread'),linkTarget(page,'both'));
 saved=await waitSaved(page,s=>s.preview.inquiry.records['M1-4'].assignments.spread==='both');
 assert.deepEqual(saved.preview.inquiry.records['M1-4'].assignments,{cap:'mushroom',hypha:'mold',mycelium:'both',spread:'both'});
 await shot('matching-lines');
 await page.getByRole('button',{name:/^3번째 발견:/}).click();await ready();await page.getByRole('button',{name:/^4번째 발견:/}).click();await ready();
 assert.deepEqual((await waitSaved(page)).preview.inquiry.records['M1-4'].assignments,saved.preview.inquiry.records['M1-4'].assignments);
 await page.setViewportSize({width:1024,height:768});await shot('matching-tablet');
 await b('발견 기록하기').click();await page.locator('.discovery-dialog').waitFor();assert.equal(await page.locator('.discovery-stamp img').count(),3);
 assert.deepEqual((await waitSaved(page)).learner,original);
 // A pre-existing student record paints saved connections after reload too.
 const student=await browser.newPage({viewport:{width:1280,height:800},storageState:'.tmp/learner20-state.json'});
 student.on('pageerror',e=>errors.push(e.message));await navigate(student,base,'fungi-microscope');
 await student.getByRole('button',{name:/^4번째 발견:/}).click();await waitForScene(student,'.expedition-canvas-host');
 const links=(await waitSaved(student)).learner.inquiry.records['M1-4'].assignments;
 await student.reload();await student.locator('.screen-fungi-microscope').waitFor();await waitForScene(student,'.expedition-canvas-host');
 assert.deepEqual((await waitSaved(student)).learner.inquiry.records['M1-4'].assignments,links);
 assert.deepEqual(errors,[]);console.log('PASS: contextual artwork, focus and brightness before capture, reobserve/demo handoff, tap/drag/correction/cancel, saved links, student isolation');
}catch(error){await shot('failure');console.error((await page.locator('body').innerText()).slice(-2000));throw error;}finally{await browser.close();}
