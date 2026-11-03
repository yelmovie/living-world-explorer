import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launchBrowser,navigate,teacherTools,waitForScene,waitSaved} from './browser.mjs';

// Sample real window panes, away from the door rings, map pins and moving characters.
async function windowColors(page){
  return page.locator('.map-host canvas').evaluate(canvas=>{
    const ctx=canvas.getContext('2d');
    return [[305,138],[966,118],[1140,347],[1004,518],[171,444],[704,321]].map(([x,y])=>
      Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3));
  });
}
const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
  const errors=[],images=new Set();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes('/map/residents/')&&r.ok())images.add(r.url());});
  await navigate(page,base,'nature-map');
  await waitForScene(page,'.map-host');
  const markers=page.locator('.map-resident');
  const original=(await waitSaved(page)).learner;
  const unlit=await windowColors(page);
  const settings=await teacherTools(page);
  await settings.getByRole('button',{name:'관리자 전체 해금'}).click();
  assert.equal(await markers.count(),0);
  assert.equal(images.size,0);
  await settings.getByRole('button',{name:'시연용 예시 기록 불러오기'}).click();
  await settings.waitFor({state:'detached'});
  await waitForScene(page,'.map-host');
  await page.waitForFunction(()=>[...document.querySelectorAll('.resident-sprite')].filter(img=>img.naturalWidth>0).length===5);
  const preview=(await waitSaved(page)).preview;
  const lit=await windowColors(page);
  lit.forEach(([red,green],i)=>{
    assert.ok(red-unlit[i][0]>65 && green-unlit[i][1]>35,'lamp did not illuminate pane '+i);
  });

  for(const [width,height] of [[1920,1080],[873,580],[1024,768],[1280,720]]){
    await page.setViewportSize({width,height});
    // A resize observer runs between these two paints, before Phaser's periodic size check.
    const offset=await page.evaluate(async()=>{
      await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
      const canvas=document.querySelector('.map-host canvas').getBoundingClientRect();
      const overlay=document.querySelector('.map-overlay').getBoundingClientRect();
      return Math.max(...['left','top','width','height'].map(key=>Math.abs(canvas[key]-overlay[key])));
    });
    assert.ok(offset<=1,'canvas and marker offset at '+width+'×'+height+': '+offset);
    const misses=await markers.evaluateAll(buttons=>buttons.filter(b=>{
      const box=b.getBoundingClientRect(),tag=b.querySelector('span').getBoundingClientRect();
      if(box.width<44||box.height<44)return true;
      return [[box.left+box.width*.4,box.top+box.height*.65],[tag.left+tag.width/2,tag.top+tag.height/2]]
        .some(([x,y])=>x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&!b.contains(document.elementFromPoint(x,y)));
    }).map(b=>b.title));
    assert.deepEqual(misses,[]);
  }
  await mkdir('.tmp',{recursive:true});
  await page.screenshot({path:'.tmp/resident-map.png'});
  for(const marker of await markers.all()){
    await marker.focus();await page.keyboard.press('Enter');
    const dialog=page.locator('.resident-dialog'),line=dialog.locator('.resident-line');
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute('aria-describedby'),await line.getAttribute('id'));
    const welcome=await line.innerText();
    const questions=dialog.locator('.resident-replies button');
    await questions.first().click();
    const first=await line.innerText();
    assert.notEqual(first,welcome);
    const stage=await marker.getAttribute('data-stage');
    if(stage==='M1')await page.screenshot({path:'.tmp/resident-conversation.png'});
    if(stage==='M2')assert.match(first,/물풀 가까이/);
    if(stage==='M5')assert.match(first,/요구르트/);
    await questions.last().click();
    assert.notEqual(await line.innerText(),first);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    assert.ok(await marker.evaluate(b=>b===document.activeElement));
  }
  const after=await waitSaved(page);
  assert.deepEqual(after.learner,original);assert.deepEqual(after.preview,preview);
  assert.equal(images.size,5);
  await page.reload();await page.locator('.screen-nature-map').waitFor();
  assert.equal(await markers.count(),0);
  assert.deepEqual((await waitSaved(page)).learner,original);
  await waitForScene(page,'.map-host');
  assert.deepEqual(await windowColors(page),unlit,'student windows changed after leaving preview');
  assert.deepEqual(errors,[]);
  console.log('PASS: six persistent window lights, five residents, four map sizes, saved memories, focus and preview isolation');
}finally{await browser.close();}
