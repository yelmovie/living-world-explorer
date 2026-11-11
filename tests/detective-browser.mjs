import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,navigate,teacherTools,waitSaved} from './browser.mjs';
import {stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const out=process.env.DETECTIVE_OUT||'.tmp/detective';
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
const errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
const dialog=()=>page.locator('.detective-dialog');
const report=()=>dialog().getByRole('button',{name:'증거로 사건 설명하기',exact:true});
const done=()=>dialog().getByRole('button',{name:'관찰로 돌아가기',exact:true});
async function connect(index,role){
 await page.locator('.detective-clue').nth(index).click();
 await page.locator(`[data-zone="${role}"]`).click();
}
async function reopen(){
 await dialog().getByRole('button',{name:'닫기',exact:true}).click();
 await page.getByRole('button',{name:'사건 증거판',exact:true}).click();
}
async function inspect(){
 const problems=await dialog().evaluate(modal=>{
  const issues=[],bounds=modal.getBoundingClientRect();
  if(bounds.left<0||bounds.right>innerWidth+1||bounds.top<0||bounds.bottom>innerHeight+1)issues.push('dialog outside viewport');
  if(modal.scrollWidth>modal.clientWidth+1)issues.push('horizontal overflow');
  for(const card of modal.querySelectorAll('.detective-clue,.detective-zone')){
   const r=card.getBoundingClientRect();
   if(r.width<44||r.height<44)issues.push('small touch target');
   for(const label of card.querySelectorAll('strong,span')){
    const range=document.createRange();range.selectNodeContents(label);
    for(const text of range.getClientRects())if(text.width&&(text.left<r.left-1||text.right>r.right+1||text.top<r.top-1||text.bottom>r.bottom+1))issues.push('clipped text '+label.textContent);
   }
  }
  return issues;
 });
 assert.deepEqual(problems,[]);
 for(const control of await dialog().locator('button:visible').all()){
  await control.scrollIntoViewIfNeeded();
  assert.ok(await control.evaluate(button=>{
   const r=button.getBoundingClientRect();
   return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
  }),'every dialog action must be reachable');
 }
 await dialog().evaluate(modal=>{modal.scrollTop=0;});
}
try{
 await mkdir(out,{recursive:true});
 await navigate(page,base,'nature-map');
 const learnerBefore=JSON.stringify((await waitSaved(page)).learner);
 const settings=await teacherTools(page);
 await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
 await settings.getByRole('button',{name:'닫기',exact:true}).click();
 for(const [width,height] of [[1280,800],[1024,768],[1024,600],[915,412],[830,515],[390,844],[375,812]]){
  await page.setViewportSize({width,height});
  for(let stage=0;stage<5;stage++){
   await navigate(page,base,stageRoutes[stage][1]);
   await page.getByRole('button',{name:/^4번째 발견:/}).click();
   await page.getByRole('button',{name:'사건 증거판',exact:true}).click();
   const first=page.locator('.detective-clue').first();
   await first.focus();await page.keyboard.press('Enter');
   assert.ok(await first.evaluate(node=>node===document.activeElement),'inspection must preserve keyboard focus');
   for(let i=0;i<3;i++)await connect(i,'supports');
   await report().click();
   assert.equal(await done().isVisible(),false,'incorrect explanation cannot finish');
   assert.ok(await page.locator('.detective-clue').nth(2).evaluate(node=>node===document.activeElement),'retry focuses the clue to reconsider');
   await connect(2,'limit');await report().click();
   assert.equal(await done().isVisible(),true);
   await reopen();
   assert.equal(await done().isVisible(),true,'solved state must survive reopening');
   await connect(0,'limit');
   assert.equal(await done().isVisible(),false,'editing a solved case revokes completion');
   assert.equal(await report().isVisible(),true);
   await reopen();
   assert.equal(await done().isVisible(),false,'incorrect revision must stay incomplete after reopening');
   await connect(0,'supports');await report().click();
   await inspect();
   await page.screenshot({path:`${out}/${width}x${height}-M${stage+1}.png`});
   await done().click();
   checks.push({width,height,stage:`M${stage+1}`});
  }
  console.log('DETECTIVE',width+'x'+height,'5 cases passed');
 }
 assert.equal(JSON.stringify((await waitSaved(page)).learner),learnerBefore,'teacher case practice must preserve learner data');
 assert.deepEqual(errors,[]);
 console.log('PASS',checks.length,'production-entry cases, keyboard focus, incorrect retry, completion invalidation, reopen, layout and learner isolation');
}finally{
 await writeFile(out+'/results.json',JSON.stringify({checks,errors},null,2));
 await browser.close();
}
