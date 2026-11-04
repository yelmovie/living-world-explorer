import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,waitSaved,linkCard,linkTarget} from './browser.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:5176',out='.tmp/link-board';await mkdir(out,{recursive:true});
const browser=await launchBrowser(),errors=[];
const context=await browser.newContext({viewport:{width:1868,height:935}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const links=[['fungi-field',1],['fungi-microscope',4],['protist-observation',4],['bacteria-sources',1],['bacteria-sources',2],['bacteria-profile',3],['impact-analysis',3],['impact-analysis',4]];
const sizes=[[1868,935],[1920,1080],[1366,768],[1280,720],[1024,768],[1024,600],[915,412],[830,515],[768,1024],[375,812]];
const open=async(route,order)=>{await navigate(page,base,route);await page.getByRole('button',{name:new RegExp('^'+order+'번째 발견:')}).click();await page.locator('.link-board').waitFor();await page.locator('.inquiry-loading').waitFor({state:'detached'});
 // Students have no teacher banner, so measure their layout.
 await page.evaluate(()=>document.querySelector('.preview-banner')?.remove());};
// Everything the student must reach, measured in the browser so a clipped card or crowded label fails the run.
const audit=()=>page.evaluate(()=>{
 const problems=[],board=document.querySelector('.link-board'),rect=n=>n.getBoundingClientRect();
 const scrolls=(n=>{for(let p=n.parentElement;p;p=p.parentElement){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight)return true;}return false;});
 for(const n of board.querySelectorAll('.link-card,.link-target')){
  const r=rect(n),name=n.dataset.linkItem||n.dataset.linkTarget;
  if(r.width<72||r.height<48)problems.push(`small ${name} ${Math.round(r.width)}x${Math.round(r.height)}`);
  if((r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1)&&!scrolls(n))problems.push(`offscreen ${name}`);
  for(const t of n.querySelectorAll('.link-name,.link-target-name')){const box=rect(t);if(box.bottom>r.bottom+1||box.top<r.top-1||t.scrollWidth>t.clientWidth+1)problems.push(`text overflow ${name}`);}
 }
 const cards=[...board.querySelectorAll('.link-card,.link-target')];
 cards.forEach((a,i)=>cards.slice(i+1).forEach(b=>{const x=rect(a),y=rect(b);if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1)problems.push(`overlap ${a.dataset.linkItem||a.dataset.linkTarget}/${b.dataset.linkItem||b.dataset.linkTarget}`);}));
 const hud=[...document.querySelectorAll('.toolbar button')].map(rect);
 for(const n of [...document.querySelectorAll('.link-heading'),document.querySelector('.expedition-header')]){const r=rect(n);if(hud.some(b=>Math.min(r.right,b.right)-Math.max(r.left,b.left)>1&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>1))problems.push(`HUD covers ${n.className}`);}
 const next=document.querySelector('.expedition-footer .primary');if(next&&!scrolls(next)&&rect(next).bottom>innerHeight+1)problems.push('record button offscreen');
 if(document.documentElement.scrollWidth>innerWidth+1)problems.push('horizontal scroll');
 const panel=document.querySelector('.expedition-panel');if(panel&&innerWidth>850&&!scrolls(panel)&&rect(panel).bottom>innerHeight+1)problems.push('panel offscreen');
 return problems;
});
try{
 await navigate(page,base,'fungi-field');
 const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금'}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await open('fungi-field',1);
 const panel=await page.locator('.expedition-panel').boundingBox(),board=await page.locator('.link-board').boundingBox();
 assert.ok(panel.width<=300,'the status panel stays a side note');assert.ok(board.width>1400&&board.height>640,'the board fills the work area: '+JSON.stringify(board));
 const photo=await page.locator('[data-link-item="log"] .link-photo').boundingBox();assert.ok(photo.width>=430&&photo.height>=250,'photos are large: '+JSON.stringify(photo));
 await page.screenshot({path:out+'/start.png'});
 // Drawing a line: a draft line follows the pointer and stops exactly on the record's port.
 const from=await linkCard(page,'log').boundingBox(),to=await linkTarget(page,'mushroom').boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width+60,from.y+from.height/2,{steps:6});
 assert.equal(await page.locator('.link-line.is-draft').count(),1);assert.ok(await page.locator('.link-heading.is-current').innerText().then(t=>t.includes('기록 칸')));await page.screenshot({path:out+'/drawing.png'});
 await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:6});await page.mouse.up();
 await waitSaved(page,s=>s.preview.inquiry.records['M1-1'].assignments.log==='mushroom');
 assert.equal(await page.locator('.link-line.is-right').count(),1);assert.equal(await linkCard(page,'log').locator('.link-mark').innerText(),'✓');assert.equal(await linkTarget(page,'mushroom').locator('.link-thumb').count(),1);
 const off=await page.evaluate(()=>{const d=document.querySelector('.link-line').getAttribute('d').split(' ').map(parseFloat),end=[d.at(-2),d.at(-1)],f=document.querySelector('.link-board').getBoundingClientRect(),p=document.querySelector('[data-link-target=mushroom] .link-port').getBoundingClientRect();return Math.hypot(end[0]+f.left-(p.left+p.width/2),end[1]+f.top-(p.top+p.height/2));});assert.ok(off<1.5,'line ends on the port, off by '+off);
 // A dropped line outside any record changes nothing; a wrong record says so without colour alone.
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width+30,from.y+from.height+6,{steps:6});await page.mouse.up();
 assert.equal((await waitSaved(page)).preview.inquiry.records['M1-1'].assignments.log,'mushroom');
 await linkTarget(page,'mushroom').click({trial:true});
 await linkCard(page,'bread').click();await linkTarget(page,'mushroom').click();
 await page.locator('.link-line.is-wrong').waitFor();assert.equal(await linkCard(page,'bread').locator('.link-mark').innerText(),'!');assert.ok((await page.locator('.inquiry-feedback').innerText()).length>0);await page.screenshot({path:out+'/wrong.png'});
 // Keyboard path: Enter on the card, Enter on the record, and focus stays usable.
 await linkCard(page,'bread').focus();await page.keyboard.press('Enter');assert.equal(await linkCard(page,'bread').getAttribute('aria-pressed'),'true');await linkTarget(page,'mold').focus();await page.keyboard.press('Enter');
 await page.locator('.expedition-shell.record-ready').waitFor();assert.equal(await page.locator('.link-line.is-right').count(),2);await page.screenshot({path:out+'/done.png'});
 // Saved links repaint when the student comes back to the task.
 await page.getByRole('button',{name:/^2번째 발견:/}).click();await page.locator('.expedition-canvas-host canvas').waitFor();await page.getByRole('button',{name:/^1번째 발견:/}).click();await page.locator('.link-board').waitFor();await page.waitForFunction(()=>document.querySelectorAll('.link-line').length===2);
 const failures=[];
 for(const [route,order] of links){
  await page.setViewportSize({width:1868,height:935});await open(route,order);
  for(const [width,height] of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(120);const problems=await audit();if(problems.length)failures.push({route,order,size:width+'x'+height,problems});await page.screenshot({path:`${out}/${route}-${order}-${width}x${height}.png`});}
 }
 assert.equal(failures.map(f=>`${f.route}#${f.order} ${f.size}: ${f.problems.join(', ')}`).join(' | '),'');assert.deepEqual(errors,[]);
 console.log('PASS: large board, drawn line, cancel, wrong link, keyboard, saved links, 8 tasks at '+sizes.length+' sizes');
}catch(error){await page.screenshot({path:out+'/failure.png'});throw error;}finally{await browser.close();}
