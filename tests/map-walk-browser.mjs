import assert from 'node:assert/strict';
import {launchBrowser,navigate,waitForScene} from './browser.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:1180,height:740},reducedMotion,serviceWorkers:'block',hasTouch:true});
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  await page.addInitScript(()=>{
   window.walkFrames=[];
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image.naturalWidth===512&&image.naturalHeight===528&&args.length===8&&args[2]===128&&args[3]===176){
     const scale=this.getTransform().a;
     window.walkFrames.push({actor:Math.abs(scale)>.49?'moa':'toto',col:args[0]/128,row:args[1]/176,flipped:scale<0});
    }
    return draw.call(this,image,...args);
   };
  });
  await navigate(page,base.replace(/\/$/,''),'nature-map');
  await waitForScene(page,'.map-host');
  const step=(direction)=>page.locator(`[data-map-direction="${direction}"]`);
  const samples=()=>page.evaluate(()=>window.walkFrames.splice(0));
  assert.deepEqual(await samples(),[],'standing still does not render a walk frame');
  const animated=reducedMotion==='no-preference';
  await page.keyboard.down('ArrowUp');
  // Make room for the trailing rabbit to turn and complete its own steps on the return walk.
  await page.waitForTimeout(730);
  if(animated){
   await page.waitForFunction(()=>['moa','toto'].every(actor=>
    new Set(window.walkFrames.filter(f=>f.actor===actor&&f.row===2).map(f=>f.col)).size===4
   ),undefined,{timeout:3500});
  }
  await page.keyboard.up('ArrowUp');
  const keyboard=await samples();
  if(!animated)assert.deepEqual(keyboard,[],'reduced motion uses standing artwork while traveling');
  await step('down').evaluate(button=>{
   const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
   button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:19,clientX:x,clientY:y}));
  });
  if(animated)await page.waitForFunction(()=>['moa','toto'].every(actor=>
   new Set(window.walkFrames.filter(f=>f.actor===actor&&f.row===0).map(f=>f.col)).size>=2
  ),undefined,{timeout:3500});
  else await page.waitForTimeout(250);
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:19})));
  await samples();
  await page.waitForTimeout(160);
  assert.deepEqual(await samples(),[],'both sprites return to idle after release');
  assert.deepEqual(failures,[]);
  await page.close();
 }
 console.log('PASS: keyboard, touch direction pad, independent four-frame strides, idle, and reduced motion');
}finally{await browser.close();}
