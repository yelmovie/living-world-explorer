import assert from 'node:assert/strict';
import {launchBrowser,navigate,teacherTools,waitSaved,readSaved} from './browser.mjs';
const browser=await launchBrowser(),errors=[];const base=process.env.APP_URL||'http://127.0.0.1:5176';
try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await navigate(page,base,'main');const dialog=await teacherTools(page);await dialog.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await dialog.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();
 const example=await waitSaved(page,s=>Object.keys(s.preview?.evidence??{}).length===5);
 await navigate(page,base,'nature-map');await page.locator('.map-node.restored').first().waitFor();
 const assertRestoredMap=async()=>{assert.equal(await page.locator('.map-node.restored').count(),5,'completed stages still restore all five buildings');
  assert.equal(await page.locator('.mv-target,.mv-wave,.mv-label').count(),0,'completion never mounts a battle badge');
  assert.equal(await page.getByText('생명빛 파동 톡!',{exact:true}).count(),0);
 };
 await assertRestoredMap();
 // Preview is intentionally cleared on reload. Seed a completed learner attempt to verify the saved map.
 const before=example.preview;for(const evidence of Object.values(before.evidence))evidence.origin='learner';
 await page.evaluate(saved=>new Promise((resolve,reject)=>{const req=indexedDB.open('life-code-lab',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(saved,'current');tx.onerror=()=>reject(tx.error);tx.oncomplete=()=>{db.close();resolve();};};}),{...example,learner:before,settings:{...example.settings,admin:false}});
 await page.evaluate(()=>localStorage.setItem('living-world:map-villains:v1',JSON.stringify({0:'legacy-combat-record'})));
 await page.reload();await page.locator('.map-node.restored').first().waitFor();await assertRestoredMap();
 const after=(await readSaved(page)).learner;assert.deepEqual(after.evidence,before.evidence);assert.deepEqual(after.inquiry,before.inquiry);assert.deepEqual(errors,[]);
 await context.close();console.log('PASS restored buildings and learning records remain; completion badges are absent even after reload');
}finally{await browser.close();}
