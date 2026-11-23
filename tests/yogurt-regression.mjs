import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {navigate,readSaved,waitSaved} from './browser.mjs';

/** Runs on the fresh learner's own M1–M4 progress, captured by full-flow; no teacher unlock or fixture completion. */
export async function yogurtRegressions(browser,base,studentState,{viewport={width:1024,height:768}}={}){
 await mkdir('.tmp/p8-review',{recursive:true});const results=[],suffix=viewport.width===1024?'':`-${viewport.width}x${viewport.height}`;
 const visibleControls=async page=>{const blocked=await page.locator('.is-yogurt .build-panel button').evaluateAll(nodes=>nodes.filter(n=>{const b=n.getBoundingClientRect();if(!b.width||!b.height)return false;const x=b.x+b.width/2,y=b.y+b.height/2;return x<0||y<0||x>innerWidth||y>innerHeight||!n.contains(document.elementFromPoint(x,y));}).map(n=>n.textContent));assert.deepEqual(blocked,[],'experiment and retry controls must be visible and uncovered');};
 const cases=['tap','short-press','touch-cancel','enter','space','slow-frames','duplicate-touch','water+lactic','milk+none','water+none','visibility','navigate-away','reload','deadline'];
 for(const name of cases){
  const context=await browser.newContext({storageState:studentState,viewport,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await navigate(page,base,'solution-assembly');await page.locator('.inquiry-loading').waitFor({state:'detached'});
   const saved=await readSaved(page);assert.equal(saved.settings.admin,false);assert.equal(Object.keys(saved.learner.evidence).length,4,'real student has finished M1–M4');assert.equal(saved.learner.inquiry.records['M5-1']?.completedAt,undefined);
   const wrong=name.includes('+'),[input,added]=wrong?name.split('+'):['milk','lactic'];
   await page.locator(`[data-link-item="${input}"]`).tap();await page.locator(`[data-link-item="${added}"]`).tap();await page.locator('[data-prediction="supported"]').tap();
   const act=page.locator('.is-yogurt .build-action');await visibleControls(page);
   await act.evaluate(n=>{window.__warm=n;window.__warmRemoved=0;new MutationObserver(ms=>{for(const m of ms)for(const removed of m.removedNodes)if(removed===n||removed.contains(n))window.__warmRemoved++;}).observe(n.closest('.is-yogurt'),{childList:true,subtree:true});});
   if(name==='slow-frames')await page.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),900);window.cancelAnimationFrame=id=>clearTimeout(id);});
   if(name==='deadline')await page.evaluate(()=>{const now=performance.now.bind(performance);window.__reviewOffset=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>now()+window.__reviewOffset});});
   const box=await act.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,started=Date.now();
   if(name==='enter'||name==='space'){await act.focus();await act.press(name==='enter'?'Enter':'Space');}
   else if(name==='short-press'){await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(40);await page.mouse.up();}
   else if(name==='touch-cancel'){
    const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();
   }else{await page.touchscreen.tap(x,y);if(name==='duplicate-touch'){await page.touchscreen.tap(x,y);await page.touchscreen.tap(x,y);}}
   if(name==='visibility')await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
   if(name==='navigate-away'||name==='reload'){
    await waitSaved(page,s=>s.learner.inquiry.records['M5-1'].runs.at(-1)?.status==='running');
    if(name==='reload')await page.reload();else{await navigate(page,base,'nature-map');await navigate(page,base,'solution-assembly');}
    await page.locator('.inquiry-loading').waitFor({state:'detached'});
   }
   if(name==='deadline')await page.evaluate(()=>{window.__reviewOffset=11000;});
   const interrupted=['visibility','navigate-away','reload','deadline'].includes(name);
   if(interrupted){
    await page.waitForFunction(()=>document.querySelector('.is-yogurt')?.dataset.phase==='retry');
    let r=(await waitSaved(page,s=>s.learner.inquiry.records['M5-1'].runs.at(-1).status==='interrupted')).learner.inquiry.records['M5-1'];
    assert.equal(r.assignments.input,input);assert.equal(r.assignments.action,added);assert.equal(r.prediction,'supported');assert.equal(r.completedAt,undefined);assert.equal(await page.locator('.yogurt-card:disabled').count(),0);
    assert.match(await page.locator('.build-verdict').innerText(),name==='deadline'?/기다리는 시간/:/중단|멈췄/);
    await visibleControls(page);await page.screenshot({path:`.tmp/p8-review/yogurt-${name}${suffix}-retry.png`});if(name==='deadline')await page.evaluate(()=>{window.__reviewOffset=0;});
    await page.getByRole('button',{name:'재료 바꿔 다시 해 보기',exact:true}).tap();assert.equal((await readSaved(page)).learner.inquiry.records['M5-1'].prediction,'supported');await act.tap();
   }
   await page.waitForFunction(()=>document.querySelector('.is-yogurt')?.dataset.phase==='done');
   let r=(await waitSaved(page,s=>s.learner.inquiry.records['M5-1'].runs.at(-1).status==='completed')).learner.inquiry.records['M5-1'];
   if(wrong){
    await visibleControls(page);assert.equal(r.runResult,'stopped');assert.equal(r.completedAt,undefined);assert.ok(await page.getByRole('button',{name:'발견 기록하기',exact:true}).isDisabled());assert.match(await page.locator('.build-verdict').innerText(),/물|우유|컵/);const original=structuredClone(r.runs[0]);
    await page.getByRole('button',{name:'재료 바꿔 다시 해 보기',exact:true}).tap();
    await page.locator('[data-link-item="milk"]').tap();await page.locator('[data-link-item="lactic"]').tap();await page.locator('[data-prediction="stopped"]').tap();await act.tap();
    await page.waitForFunction(()=>document.querySelector('.is-yogurt')?.dataset.phase==='done');r=(await waitSaved(page,s=>s.learner.inquiry.records['M5-1'].runResult==='supported')).learner.inquiry.records['M5-1'];
    assert.deepEqual(r.runs[0],original,'retry preserves the observed failed run');assert.equal(r.reflection,'differs','a wrong prediction never blocks a correct experiment');
   }
   assert.equal(r.runResult,'supported');assert.equal(r.runs.filter(run=>run.result==='supported').length,1);
   if(!['navigate-away','reload'].includes(name)){assert.equal(await page.evaluate(()=>window.__warm===document.querySelector('.is-yogurt .build-action')),true);assert.equal(await page.evaluate(()=>window.__warmRemoved),0,'the active button must stay attached across paints');}
   await visibleControls(page);await page.screenshot({path:`.tmp/p8-review/yogurt-${name}${suffix}-done.png`});
   if(!await page.locator('.discovery-dialog').count())await page.getByRole('button',{name:'발견 기록하기',exact:true}).evaluate(b=>{b.click();b.click();});
   await page.locator('.discovery-dialog').waitFor();r=(await waitSaved(page,s=>!!s.learner.inquiry.records['M5-1'].completedAt)).learner.inquiry.records['M5-1'];
   assert.equal(r.tries,1,'duplicate recording activation saves completion only once');assert.equal(await page.locator('.discovery-dialog').count(),1);
   await page.getByRole('button',{name:'다음 발견으로',exact:true}).tap();await page.getByRole('heading',{name:'이번에는 빵 반죽 설계에 도전해요',exact:true}).waitFor();
   assert.deepEqual(errors,[]);results.push({case:name,status:'PASS',runs:r.runs.length,successfulRuns:1,completionWrites:r.tries,elapsedMs:Date.now()-started,input:'Chromium emulated touch / desktop mouse / keyboard',nextActivity:'M5-2'});console.log('YOGURT PASS '+name);
  }catch(error){await page.screenshot({path:`.tmp/p8-review/yogurt-${name}${suffix}-failure.png`}).catch(()=>{});results.push({case:name,status:'FAIL',error:error.message});throw error;}
  finally{await writeFile(`.tmp/p8-review/yogurt-regressions${suffix}.json`,JSON.stringify({viewport,setup:'new learner M1–M4 from this full-flow run; no teacher unlock',visibility:'simulated visibilitychange',deadline:'simulated elapsed time beyond 10 seconds',results},null,2));await context.close();}
 }
 return results;
}
