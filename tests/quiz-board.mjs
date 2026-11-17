import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,waitSaved} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const out=process.env.QUIZ_OUT||'.tmp/quiz-release-20261115/screens';
// 2026-11-16: M4-3 and M4-4 became swipe and lamp boards; 2026-11-17: M3 became the bacteria lab (both in stage-games.mjs). M1-1 is the remaining quiz.
const tasks=inquiryTasks.filter(t=>['M1-1'].includes(t.id));
const sizes=process.env.QUIZ_SIZES?JSON.parse(process.env.QUIZ_SIZES):[[1280,800],[915,412],[1024,768],[375,812]];
const browser=await launchBrowser(),errors=[];
await mkdir(out,{recursive:true});
const open=async(page,task)=>{
 await navigate(page,base,stageRoutes[Number(task.stage.slice(1))-1][task.order>2?1:0]);
 await page.getByRole('button',{name:new RegExp('^'+task.order+'번째 발견:')}).click();
 await page.locator('.quiz-board').waitFor();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
};
async function audit(page,label){
 const controls=page.locator('.quiz-option,.quiz-navigation button:visible,.expedition-footer button:visible');
 for(const control of await controls.all()){
  await control.scrollIntoViewIfNeeded();
  const geometry=await control.evaluate(n=>{
   const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {reachable:r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth+1&&n.contains(hit),width:r.width,height:r.height,x:r.x,y:r.y,hit:hit?.outerHTML.slice(0,220)};
  });
  if(!geometry.reachable)await page.screenshot({path:`${out}/${label}-failed.png`});
  assert.ok(geometry.reachable,`${label}: unreachable ${await control.innerText()} ${JSON.stringify(geometry)}`);
 }
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: horizontal overflow`);
 const title=page.locator('.quiz-question');await title.scrollIntoViewIfNeeded();
 const textFits=await page.locator('.quiz-question,.quiz-detail,.quiz-option,.quiz-figure figcaption').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth+1));
 assert.ok(textFits,`${label}: clipped text`);
 const contrast=await page.locator('.quiz-option[aria-pressed=true]').evaluateAll(nodes=>nodes.every(n=>{
  const light=color=>{
   const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
   return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const style=getComputedStyle(n),foreground=light(style.color),background=light(style.backgroundColor);
  return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)>=4.5;
 }));
 assert.ok(contrast,`${label}: selected answer text contrast`);
 await page.screenshot({path:`${out}/${label}.png`});
}
async function inject(page,saved){
 await page.evaluate(saved=>new Promise((resolve,reject)=>{
  const req=indexedDB.open('life-code-lab',1);
  req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(saved,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
  req.onerror=()=>reject(req.error);
 }),saved);
}
try{
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);
  await navigate(page,base,'nature-map');
  const settings=await teacherTools(page);
  await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
  await settings.getByRole('button',{name:'닫기',exact:true}).click();
  for(const task of tasks){
   await open(page,task);
   assert.equal(await page.locator('.link-board,.link-lines,.source-preview:visible').count(),0);
   assert.ok(await button(page,'발견 기록하기').isDisabled());
   for(const [index,item] of task.items.entries()){
    assert.equal(await page.locator('.quiz-board').getAttribute('data-quiz-item'),item.id);
    assert.ok(await page.locator('.quiz-detail').isVisible());
    const wrong=task.targets.find(t=>t.id!==item.target);
    if(index===0){
     await page.locator(`[data-quiz-answer="${wrong.id}"]`).press('Enter');
     assert.match(await page.locator('.quiz-feedback').innerText(),/다시 골라/);
     assert.ok(await button(page,'다음 문제').isHidden(),'2026-11-16: next appears only for a solved question');
     await waitSaved(page,s=>s.preview.inquiry.records[task.id].assignments[item.id]===wrong.id);
     await open(page,task);
     assert.equal(await page.locator('.quiz-board').getAttribute('data-quiz-item'),item.id);
     assert.equal(await page.locator(`[data-quiz-answer="${wrong.id}"]`).getAttribute('aria-pressed'),'true');
     await audit(page,`${width}-${height}-${task.id}-retry`);
    }
    await page.locator(`[data-quiz-answer="${item.target}"]`).press('Enter');
    assert.match(await page.locator('.quiz-feedback').innerText(),/맞았어요/);
    await waitSaved(page,s=>s.preview.inquiry.records[task.id].assignments[item.id]===item.target);
    // Double activation and other choices cannot undo a correct answer.
    await page.locator(`[data-quiz-answer="${wrong.id}"]`).dispatchEvent('click');
    assert.equal(await page.locator(`[data-quiz-answer="${item.target}"]`).getAttribute('aria-pressed'),'true');
    if(index<task.items.length-1){
     // 2026-11-16: a right answer moves on by itself.
     await page.waitForFunction(id=>document.querySelector('.quiz-board')?.dataset.quizItem!==id,item.id,{timeout:5000});
     assert.ok(await page.locator('.quiz-question').evaluate(n=>n===document.activeElement));
     assert.equal(await page.locator('.expedition-shell').evaluate(n=>n.scrollTop),0,'new questions start at the top');
    }
   }
   assert.ok(await button(page,'발견 기록하기').isEnabled());
   // The finished quiz opens its record by itself; Escape closes it so the review checks can continue.
   await page.locator('.discovery-dialog').waitFor({timeout:5000});await page.keyboard.press('Escape');await page.locator('.discovery-dialog').waitFor({state:'detached'}).catch(()=>{});
   // Phone-landscape heights hide the 이전/다음 row (quiz-board.css); elsewhere a solved question can be revisited.
   if(await button(page,'이전 문제').isVisible()){await button(page,'이전 문제').click();assert.match(await page.locator('.quiz-feedback').innerText(),/맞았어요/);}
   await open(page,task);
   assert.equal(await page.locator('.quiz-board').getAttribute('data-quiz-item'),task.items.at(-1).id);
   await audit(page,`${width}-${height}-${task.id}-complete`);
   // The record was already saved when the quiz finished (it opened by itself above).
   await waitSaved(page,s=>!!s.preview.inquiry.records[task.id].completedAt);
   assert.ok(await button(page,'기록 확인하고 계속').isEnabled());
  }
  console.log(`${width}×${height}: M1-1 quiz, auto-advance, keyboard retry, persistence and review passed`);
  await page.close();
 }
 const learner=await browser.newPage({viewport:{width:1024,height:768}});
 learner.on('pageerror',error=>errors.push(error.message));
 await navigate(learner,base,'fungi-field');await learner.locator('.inquiry-loading').waitFor({state:'detached'});
 await learner.locator('[data-quiz-answer="mold"]').click();
 await waitSaved(learner,s=>s.learner.inquiry.records['M1-1'].assignments.log==='mold');
 await learner.reload();await learner.locator('.quiz-board').waitFor();
 assert.equal(await learner.locator('.quiz-board').getAttribute('data-quiz-item'),'log');
 assert.match(await learner.locator('.quiz-feedback').innerText(),/다시 골라/);
 await learner.locator('[data-quiz-answer="mushroom"]').click();
 await waitSaved(learner,s=>s.learner.inquiry.records['M1-1'].assignments.log==='mushroom');
 await learner.reload();await learner.locator('.quiz-board').waitFor();
 assert.equal(await learner.locator('.quiz-board').getAttribute('data-quiz-item'),'bread');
 await learner.locator('[data-quiz-answer="mold"]').click();
 await learner.locator('.discovery-dialog').waitFor({timeout:5000});
 assert.equal((await waitSaved(learner)).learner.inquiry.records['M1-1'].clean,false,'retry history is retained');
 await learner.close();
 console.log('Learner reload resumes the wrong or next unanswered question and preserves retry history');
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
