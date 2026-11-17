import assert from 'node:assert/strict';
import {launchBrowser,button,navigate,teacherTools,waitSaved,waitForScene} from './browser.mjs';
import {playGerm} from './germ-play.mjs';
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
 // 2026-11-17: the size idea now lives in the M3-1 zoom dial (the old M3-2 ladder was retired with the M3 card activities).
 for(const [index,[width,height]] of [[375,812],[375,812],[915,412],[1024,768]].entries()){
  await page.setViewportSize({width,height});await open('M3-1');
  if(index===0){await playGerm(page,'M3-1');await waitSaved(page,state=>state.preview.inquiry.records['M3-1'].assignments.found==='yes');await page.locator('.discovery-dialog').waitFor({timeout:9000});await page.keyboard.press('Escape');await page.locator('.discovery-dialog').waitFor({state:'detached'}).catch(()=>{});}
  const fit=await page.evaluate(()=>{const host=document.querySelector('.expedition-canvas-host').getBoundingClientRect();return ['.zoom-view','.zoom-panel'].every(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return r.width>0&&r.left>=host.left-1&&r.right<=host.right+1&&r.top>=host.top-1&&r.bottom<=host.bottom+1;});});
  assert.ok(fit,'zoom view and dial fit the board: '+width+'x'+height);
  assert.equal(await page.locator('.zoom-power').innerText(),'×1,000','the found state reopens at 1000×');
  checks.push('zoom '+width+'x'+height);
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
