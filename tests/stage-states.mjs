import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,linkCard,linkTarget,setRange,waitForScene,waitSaved} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5187';
const out=process.env.STAGE_STATES_OUT||'.tmp/responsive-20261108/states';
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true});
const errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
const open=async id=>{
 const task=inquiryTasks.find(t=>t.id===id);
 await navigate(page,base,stageRoutes[+task.stage.slice(1)-1][task.order>2?1:0]);
 await page.getByRole('button',{name:new RegExp('^'+task.order+'번째 발견:')}).click();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
 await waitForScene(page,'.expedition-canvas-host');return task;
};
const inspect=async name=>{
 const problems=await page.evaluate(()=>{
  const issues=[];
  for(const label of document.querySelectorAll('.link-name,.link-target-name,.inquiry-choice-label')){
   const card=label.closest('button'),box=card.getBoundingClientRect();
   const range=document.createRange();range.selectNodeContents(label);
   for(const text of range.getClientRects())if(text.width&&(text.left<box.left-2||text.right>box.right+2||text.top<box.top-2||text.bottom>box.bottom+2))issues.push('label outside: '+label.textContent);
   const mark=card.querySelector('.link-mark');
   if(mark?.textContent){const r=mark.getBoundingClientRect();for(const t of range.getClientRects())if(Math.min(t.right,r.right)-Math.max(t.left,r.left)>2&&Math.min(t.bottom,r.bottom)-Math.max(t.top,r.top)>2)issues.push('mark covers name: '+label.textContent);}
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal overflow');
  return issues;
 });
 assert.deepEqual(problems,[],name);
 await page.screenshot({path:out+'/'+name+'.png'});checks.push(name);
};
try{
 await mkdir(out,{recursive:true});await navigate(page,base,'nature-map');
 const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 for(const [width,height] of [[915,412],[830,515],[375,812]]){
  await page.setViewportSize({width,height});
  for(const id of ['M1-4','M3-2','M4-3']){
   const task=await open(id);
   for(const item of task.items){await linkCard(page,item.id).click();await linkTarget(page,item.target).click();}
   assert.equal(await page.locator('.link-card.is-right').count(),task.items.length);
   await waitSaved(page,s=>task.items.every(item=>s.preview.inquiry.records[id].assignments[item.id]===item.target));
   if(width===915&&id==='M1-4'){
    const board=page.locator('.link-board');await board.evaluate(n=>n.scrollTop=0);
    const r=await board.boundingBox(),cdp=await page.context().newCDPSession(page),x=r.x+r.width*.23,y=r.y+r.height*.8;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
    for(let step=1;step<=4;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*18,id:0}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(180);
    assert.equal(await board.evaluate(n=>n.scrollTop),0,'all cards fit without scrolling');
    await cdp.detach();checks.push('915-no-scroll');
   }
   await inspect(width+'-'+id+'-connected');
  }
 }
 await page.setViewportSize({width:915,height:412});
 await open('M1-2');await button(page,'돋보기로 크게 보기').click();
 assert.match(await page.locator('.next-instruction').innerText(),/주름/);assert.equal(await button(page,'돋보기').count(),0);
 await inspect('915-M1-2-tools');
 await open('M2-1');await button(page,'물풀 가까이').click();await button(page,'한 방울 채집').click();await button(page,'한 방울 옮기기').click();
 assert.match(await page.locator('.inquiry-counter').innerText(),/기록 준비/);await inspect('915-M2-1-prepared');
 await open('M4-1');await setRange(page,'관찰 순서',3);await page.getByRole('button',{name:/^이후 고정/}).click();
 await setRange(page,'전후 겹쳐 보기',20);
 const readout=page.getByRole('slider',{name:'전후 겹쳐 보기',exact:true}).locator('xpath=../..').locator('output');
 assert.equal(await readout.innerText(),'20');await button(page,'전후 겹쳐 보기 늘리기').click();assert.equal(await readout.innerText(),'25');
 await inspect('915-M4-1-comparison');
 await open('M5-1');
 assert.ok(await button(page,'버튼으로 조작').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>0&&r.bottom<innerHeight&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'large-label controls are visible before selecting a card');
 await button(page,'버튼으로 조작').click();const dialog=page.getByRole('dialog');
 for(const [card,target] of [['우유','재료 병에 담기'],['유산균 가루','발효기에 넣기'],['요구르트','만들 음식 고르기']]){await dialog.getByRole('button',{name:card,exact:true}).click();await dialog.getByRole('button',{name:target,exact:true}).click();}
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();assert.equal(await page.locator('.toast').count(),0,'assembly feedback must not cover the fermentation scene');await button(page,'요구르트가 될 거예요').click();await button(page,'발효기 켜기').click();
 await page.waitForTimeout(4450);await inspect('915-M5-1-fermenting');
 await button(page,'예상과 같아요').click();await inspect('915-M5-1-result');
 await open('M3-4');await button(page,'모든 세균이 해로울 것 같아요').click();
 for(const name of ['새 자료: 요구르트 만들기','새 자료: 상한 우유']){await button(page,name).click();await button(page,'자료 확인했어요').click();}
 await page.locator('html').evaluate(n=>n.classList.add('large-text'));
 await button(page,'모든 세균이 해로운 것은 아니에요').click();await button(page,'요구르트 만들기').click();
 await inspect('915-M3-4-large-text');assert.deepEqual(errors,[]);
 console.log('PASS: connected cards at three sizes; tool labels; prepared sample; comparison readout and +/-; large-label assembly; fermentation/result; large text');
}catch(error){
 await page.screenshot({path:out+'/failure.png'});console.error((await page.locator('body').innerText()).slice(-2000));throw error;
}finally{
 await writeFile(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();
}
