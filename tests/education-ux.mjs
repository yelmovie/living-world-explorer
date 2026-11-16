import assert from 'node:assert/strict';
import {launchBrowser,button,navigate,teacherTools,waitSaved,waitForScene} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
const errors=[],checks=[],responses=new Map();
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{
 responses.set(new URL(response.url()).pathname,response.status());
 if(response.status()>=400)errors.push(response.status()+' '+response.url());
});
async function open(id){
 const task=inquiryTasks.find(candidate=>candidate.id===id);
 await navigate(page,base,stageRoutes[Number(task.stage.slice(1))-1][task.order>2?1:0]);
 await page.getByRole('button',{name:new RegExp('^'+task.order+'번째 발견:')}).click();
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
 return task;
}
try{
 await navigate(page,base,'nature-map');
 const learnerBefore=JSON.stringify((await waitSaved(page)).learner);
 const settings=await teacherTools(page);
 await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
 await settings.getByRole('button',{name:'닫기',exact:true}).click();
 // A fresh preview lets the first ladder attempt be wrong before example records are loaded.
 for(const [index,[width,height]] of [[375,812],[375,812],[915,412],[1024,768]].entries()){
  await page.setViewportSize({width,height});const task=await open('M3-2');
  // 2026-11-16: M3-2 is a quiz board; right answers move on by themselves.
  if(index===0)for(const [i,item] of task.items.entries()){await page.locator(`[data-quiz-answer="${item.target}"]`).click();if(i<task.items.length-1)await page.waitForFunction(id=>document.querySelector('.quiz-board')?.dataset.quizItem!==id,item.id,{timeout:5000});}
  await button(page,index===0?'크기 사다리에 세균 놓기':'✓ 크기 사다리 다시 보기').click();
  const ladder=page.locator('.ladder-dialog');
  await ladder.evaluate(async node=>{await Promise.all(node.getAnimations().map(animation=>animation.finished));});
  const frame=await ladder.evaluate(node=>{
   const box=node.getBoundingClientRect(),title=node.querySelector('h2').getBoundingClientRect(),close=node.querySelector('.modal-close').getBoundingClientRect();
   return {scrollTop:node.scrollTop,titleVisible:title.top>=box.top&&title.bottom<=box.bottom,closeVisible:close.top>=box.top&&close.bottom<=box.bottom};
  });
  assert.ok(frame.scrollTop===0&&frame.titleVisible&&frame.closeVisible,'ladder title and close remain visible: '+JSON.stringify({width,height,frame}));
  for(const asset of ['hair-shaft.webp','hypha-thread.webp']){
   const image=ladder.locator(`img[src$="/${asset}"]`);
   await image.waitFor();
   await image.evaluate(img=>img.decode());
   assert.ok(await image.evaluate(img=>img.complete&&img.naturalWidth>0),asset+' must decode');
  }
  assert.ok(await ladder.evaluate(node=>[node,...node.querySelectorAll('.size-ladder')].every(part=>part.scrollWidth<=part.clientWidth+1)),'ladder must fit horizontally');
  for(const label of await ladder.locator('.ladder-rung small').all()){
   await label.scrollIntoViewIfNeeded();
   const readable=await label.evaluate(node=>{
    const row=node.closest('.ladder-rung').getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(node);
    const text=range.getBoundingClientRect();
    return /\d/.test(node.textContent)&&parseFloat(getComputedStyle(node).fontSize)>=16&&text.width>0&&text.left>=row.left-1&&text.right<=row.right+1&&text.top>=row.top-1&&text.bottom<=row.bottom+1;
   });
   assert.ok(readable,'numeric size labels must stay inside their rows');
  }
  if(index===0){
   await ladder.getByRole('button',{name:'여기에 놓기',exact:true}).first().click();
   assert.match(await ladder.locator('.ladder-feedback').innerText(),/더 아래/);
   await ladder.getByRole('button',{name:'여기에 놓기',exact:true}).last().click();
   await waitSaved(page,state=>state.preview.inquiry.records['M3-2'].assignments.ladder==='smallest');
  }
  assert.equal(await ladder.locator('.ladder-slot.placed').count(),1,'placement must survive reopening');
  assert.match(await ladder.locator('.ladder-feedback').innerText(),/200배/);
  await ladder.getByRole('button',{name:'닫기',exact:true}).click();checks.push('ladder '+width+'x'+height);
 }
 await page.setViewportSize({width:1280,height:800});
 const example=await teacherTools(page);
 await example.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();
 await page.locator('dialog[open]').waitFor({state:'detached'});
 // 2026-11-16: science words live on the discovery record card ('도움말' was removed in 3db7714).
 for(const id of ['M1-2','M2-3','M4-4']){
  await open(id);await button(page,'기록 확인하고 계속').click();
  const card=page.locator('.discovery-dialog');await card.waitFor();
  const chips=card.locator('.term-chip.button');assert.ok(await chips.count()>0,id+' must offer science terms');
  for(const chip of await chips.all()){
   const term=(await chip.getAttribute('aria-label')).replace(/ 뜻 보기$/,'');
   await chip.click();
   const definition=page.getByRole('dialog',{name:term+' 알아보기',exact:true});
   assert.ok((await definition.locator('p').innerText()).length>10,'term must have an explanation');
   await definition.getByRole('button',{name:'닫기',exact:true}).click();
   await definition.waitFor({state:'detached'});
   assert.ok(await chip.evaluate(node=>node===document.activeElement),'term close restores record focus');
  }
  await page.keyboard.press('Escape');await card.waitFor({state:'detached'});checks.push('glossary '+id);
 }
 await open('M2-1');await waitForScene(page,'.expedition-canvas-host');
 assert.equal(responses.get('/assets/ui/slide-flat.webp'),200,'sampling scene must load the new flat slide');
 assert.equal(JSON.stringify((await waitSaved(page)).learner),learnerBefore,'teacher glossary and practice preserve learner records');
 assert.deepEqual(errors,[]);
 console.log('PASS education UX',checks.join(', '),'slide image and learner isolation');
}finally{
 await browser.close();
}
