import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,setRange,waitSaved,waitForScene} from './browser.mjs';
import {playGerm} from './germ-play.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5187',out='.tmp/screen-fit-20261108';
const sizes=process.env.SCREEN_FIT_SIZES?JSON.parse(process.env.SCREEN_FIT_SIZES):[[1920,1080],[1366,768],[1280,800],[1280,720],[1024,768],[1024,600],[915,412],[830,515],[375,812]];
const browser=await launchBrowser(),page=await browser.newPage({hasTouch:true});
const errors=[],screens=[],states=[],failures=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const open=async id=>{
 const task=inquiryTasks.find(t=>t.id===id);
 await navigate(page,base,stageRoutes[+task.stage.slice(1)-1][task.order>2?1:0]);
 await page.locator('.activity-stepper button').nth(task.order-1).click();
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
 await waitForScene(page,'.expedition-canvas-host');
 return task;
};
const inspect=async(name,shot=false)=>{
 const result=await page.evaluate(()=>{
  const issues=[];
  for(const n of document.querySelectorAll('#app,.expedition-shell,.expedition-panel,.expedition-panel-body,.link-board'))
   if(n.scrollHeight>n.clientHeight+3||n.scrollWidth>n.clientWidth+3)issues.push('overflow '+n.className+': '+n.clientWidth+'x'+n.clientHeight+' / '+n.scrollWidth+'x'+n.scrollHeight);
  for(const n of document.querySelectorAll('.expedition-shell button,.expedition-shell input,.expedition-shell select,.toolbar button')){
   if(!n.getClientRects().length||n.closest('[hidden],[inert]'))continue;
   // 2026-11-17: the M3-2 bacteria swim around and may pass over each other by design.
   if(n.closest('.catch-field'))continue;
   const box=n.getBoundingClientRect();if(!box.width||!box.height)continue;
   const center=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
   if(!n.contains(center))issues.push('covered '+(n.getAttribute('aria-label')||n.textContent).slice(0,40));
   if(box.left<0||box.top<0||box.right>innerWidth+1||box.bottom>innerHeight+1)issues.push('outside '+n.textContent.slice(0,40));
   if(box.width<43||box.height<43)issues.push('small control '+n.textContent.slice(0,40));
   const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    if(!walker.currentNode.textContent.trim())continue;
    const range=document.createRange();range.selectNodeContents(walker.currentNode);
    for(const text of range.getClientRects())if(text.width&&(text.left<box.left-2||text.top<box.top-2||text.right>box.right+2||text.bottom>box.bottom+2))issues.push('clipped label '+n.textContent.slice(0,40));
   }
  }
  const canvas=document.querySelector('.expedition-canvas-host'),r=canvas.getBoundingClientRect();
  if(r.width<280||r.height<152)issues.push('small experiment '+Math.round(r.width)+'x'+Math.round(r.height));
  const texts=[...document.querySelectorAll('.expedition-shell p,.expedition-shell h2')].filter(n=>n.getClientRects().length).map(n=>n.textContent.trim()).filter(s=>s.length>=12);
  for(const text of new Set(texts))if(texts.filter(t=>t===text).length>1)issues.push('duplicate '+text);
  return {issues:[...new Set(issues)],view:{width:Math.round(r.width),height:Math.round(r.height)},width:innerWidth,height:innerHeight};
 });
 screens.push({name,...result});if(result.issues.length)failures.push({name,...result});
 if(shot||result.issues.length)await page.screenshot({path:out+'/'+result.width+'-'+name+'.png'});
 return result;
};
const inspectState=async name=>{states.push(name);return inspect(name,true);};
const close=()=>page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();
try{
 await mkdir(out,{recursive:true});await navigate(page,base,'nature-map');
 const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await close();
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  for(const task of inquiryTasks){await open(task.id);await inspect(task.id,['M1-2','M3-1','M4-1','M5-1'].includes(task.id)&&[412,800,812].includes(height));}
  console.log(width+'x'+height+' · 20 activities');
 }
 await page.setViewportSize({width:915,height:412});
 // 2026-11-16: M1-1 and M3-2 are quiz boards without link cards; the other card boards keep data-link-item/target.
 for(const task of inquiryTasks.filter(t=>['collect','connect','sort'].includes(t.kind)&&!['M1-1','M3-2'].includes(t.id))){
  await open(task.id);
  for(const item of task.items){await page.locator(`[data-link-item="${item.id}"]`).click();await inspectState(task.id+'-'+item.id+'-selected');await page.locator(`[data-link-target="${item.target}"]`).click();await inspectState(task.id+'-'+item.id+'-linked');}
 }
 for(const [width,height] of [[915,412],[375,812]]){
  await page.setViewportSize({width,height});
  const reset=await teacherTools(page);await reset.getByRole('button',{name:'시연 기록 초기화',exact:true}).click();await page.locator('.settings-confirm').getByRole('button',{name:'기록 지우기',exact:true}).click();
  await open('M2-1');assert.equal(await button(page,'자동재생').isVisible(),false);
  await button(page,'물가 가까이').click();assert.equal(await page.getByLabel('재생 속도',{exact:true}).count(),0);
  const before=(await waitSaved(page)).preview.inquiry.records['M2-1'];
  await button(page,'자동재생').click();await inspectState('sampling-playing');
  await button(page,'직접 해보기').click();assert.deepEqual((await waitSaved(page)).preview.inquiry.records['M2-1'],before);
  const started=Date.now();await button(page,'자동재생').click();
  await button(page,'직접 해보기').waitFor({state:'hidden'});assert.ok(Date.now()-started<6500,'2x speed applies to observation timers');
  const sampled=(await waitSaved(page)).preview.inquiry.records['M2-1'];assert.equal(sampled.sequence,3);assert.equal(sampled.assignments.site,'edge');assert.equal(sampled.completedAt,undefined);await inspectState('sampling-ready');
  await open('M2-3');await page.getByRole('button',{name:/^B 고정/}).click();await inspectState('track-comparison');
  await button(page,'현미경으로 움직임의 비밀 찾기').click();await inspectState('track-cilia');
  // 2026-11-16: M4-1 is a time-lapse; the research note appears beside the picture after a correct mark.
  await open('M4-1');await button(page,'▶ 빨리 감기').click();await page.waitForTimeout(3600);await inspectState('timeline-lapse');
  {const b=await page.locator('.timeline-layer').first().boundingBox();await page.touchscreen.tap(b.x+b.width*.536,b.y+b.height*.654);await page.locator('.timeline-note').waitFor();await inspectState('timeline-research-read');}
  // 2026-11-17: M3 bacteria lab states — the zoom at 100×, a loaded swab and the finished exhibit sentence.
  await open('M3-1');await page.locator('[data-guess="100"]').click();for(let k=0;k<2;k++)await button(page,'+ 키우기').click();await page.waitForTimeout(1600);await inspectState('zoom-100');
  await open('M3-3');await page.locator('.culture-place[data-place=hand]').focus();await page.keyboard.press('Enter');await inspectState('culture-loaded');
  await open('M3-4');await playGerm(page,'M3-4');await inspectState('exhibit-sentence');
  await open('M5-1');await page.locator('.yogurt-card[data-link-item="milk"]').click();await page.locator('.yogurt-card[data-link-item="lactic"]').click();await inspectState('build-prediction');await page.locator('[data-prediction="supported"]').click();await inspectState('build-ready');
  {const act=page.locator('.build-action');await act.scrollIntoViewIfNeeded();const hb=await act.boundingBox();await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();await page.waitForTimeout(1200);await inspectState('build-running');await page.waitForTimeout(1700);await page.mouse.up();}
  await page.locator('.build-verdict').waitFor();await inspectState('build-finished');
  await open('M5-4');await button(page,'요구르트').click();await inspectState('publish-action');await button(page,'유산균의 작용').click();await inspectState('publish-note');
  await page.getByLabel('내 소개 문장',{exact:true}).fill('유산균이 우유를 바꾸어 요구르트가 돼요.');await inspectState('publish-edited');
 }
 // The old large-text setting remains readable for existing saves.
 const oldSave=await waitSaved(page);oldSave.settings.large=true;
 await page.evaluate(saved=>new Promise((resolve,reject)=>{
  const open=indexedDB.open('life-code-lab',1);
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{const db=open.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(saved,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
 }),oldSave);
 await page.reload();await page.locator('html.large-text').waitFor();
 await navigate(page,base,'nature-map');
 const legacy=await teacherTools(page);await legacy.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await close();
 for(const [width,height] of [[915,412],[375,812]]){
  await page.setViewportSize({width,height});
  const reset=await teacherTools(page);await reset.getByRole('button',{name:'시연 기록 초기화',exact:true}).click();await page.locator('.settings-confirm').getByRole('button',{name:'기록 지우기',exact:true}).click();
  for(const task of inquiryTasks){await open(task.id);await inspect('large-'+task.id,task.id==='M1-3');}
  await open('M3-4');await playGerm(page,'M3-4');await inspectState('large-exhibit-sentence');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 console.log('PASS: '+screens.length+' screens, including '+states.length+' operation states; no scrolling, clipping or covered controls; speed and learner choices verified');
}finally{await writeFile(out+'/results.json',JSON.stringify({screens,states,failures,errors},null,2));await browser.close();}
