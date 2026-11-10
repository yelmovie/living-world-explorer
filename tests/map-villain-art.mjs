import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,navigate,teacherTools,waitSaved,readSaved} from './browser.mjs';
const browser=await launchBrowser(),checks=[],errors=[];const base=process.env.APP_URL||'http://127.0.0.1:5176';
try{
 await mkdir('.tmp/villain-art',{recursive:true});
 for(const fallback of [false,true]){
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));if(fallback)await page.route('**/confusion-cloud-v2.webp',r=>r.abort());
  await navigate(page,base,'main');let dialog=await teacherTools(page);await dialog.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await dialog.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();
  await navigate(page,base,'nature-map');const target=page.locator('.mv-target').first();await target.waitFor();
  if(!fallback)await target.locator('.mv-painted').waitFor();else {await page.waitForTimeout(400);assert.equal(await page.locator('.mv-painted').count(),0);}
  const before=JSON.stringify((await waitSaved(page)).preview.inquiry);
  await page.screenshot({path:'.tmp/villain-art/'+(fallback?'fallback':'painted')+'.png'});
  await target.tap();await page.waitForTimeout(160);await target.press('Enter');await page.waitForTimeout(160);await target.press('Space');await page.waitForTimeout(250);
  assert.equal(await target.getAttribute('data-state'),'cleared');assert.equal(await target.locator('.mv-creature').isVisible(),false);
  assert.equal(JSON.stringify((await readSaved(page)).preview.inquiry),before,'battle never changes learning evidence');
  assert.equal(await page.evaluate(()=>localStorage.getItem('living-world:map-villains:v1')),null,'preview does not save battle progress');
  checks.push({fallback,painted:!fallback,touchKeyboard:true,reducedMotion:true,learningUnchanged:true,previewIsolated:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile('.tmp/villain-art/results.json',JSON.stringify({checks,errors},null,2));console.log('PASS generated villain art, fallback, touch/keyboard, reduced motion and preview isolation');
}finally{await browser.close();}
