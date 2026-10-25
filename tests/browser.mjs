import {chromium} from '@playwright/test';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

export function launchBrowser(){
 const temporary=resolve('.tmp/browser-temp');mkdirSync(temporary,{recursive:true});process.env.TEMP=temporary;process.env.TMP=temporary;
 const local='.cache/browser-manual/chrome-win/chrome.exe';
 const executablePath=process.env.BROWSER_PATH||(existsSync(local)?local:undefined);
 return chromium.launch({headless:true,executablePath,args:['--disable-gpu','--disable-gpu-compositing']});
}

// A canvas is attached before Phaser finishes loading and painting its scene.
export async function waitForScene(page,selector){
 // Fixed before/after comparisons intentionally hide the live timeline.
 if(await page.locator(selector).evaluate(host=>getComputedStyle(host).display==='none'))return;
 await page.waitForFunction(selector=>{
  const host=document.querySelector(selector);
  if(host?.querySelector('.flat-lab'))return true;
  const canvas=host?.querySelector('canvas');
  const context=canvas?.getContext('2d');
  if(!context||!canvas.width||!canvas.height)return false;
  const data=context.getImageData(0,0,canvas.width,canvas.height).data;
  const colors=new Set();
  for(let i=0;i<data.length;i+=148){
   colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
   if(colors.size>8)return true;
  }
  return false;
 },selector,{timeout:30000});
}

export const button=(page,name)=>page.getByRole('button',{name,exact:true});
export async function navigate(page,base,route){
 if(page.url()==='about:blank')await page.goto(base+'/#/'+route);
 else await page.evaluate(route=>{location.hash='#/'+route;},route);
 await page.locator('.screen-'+route).waitFor();
}
export async function settings(page){await button(page,'설정').click();return page.locator('dialog.settings-dialog');}
export async function teacherTools(page){const dialog=await settings(page);await dialog.locator('summary').filter({hasText:/^교사용 가이드$/}).click();await dialog.locator('summary').filter({hasText:/^교사용 도구$/}).click();return dialog;}
export async function readSaved(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const op=indexedDB.open('life-code-lab',1);op.onsuccess=()=>{const db=op.result;const req=db.transaction('state').objectStore('state').get('current');req.onsuccess=()=>{resolve(req.result);db.close();};req.onerror=()=>reject(req.error);};op.onerror=()=>reject(op.error);}));}
export async function waitSaved(page,predicate){await page.waitForTimeout(220);for(let i=0;i<30;i++){const saved=await readSaved(page);if(saved&&(!predicate||predicate(saved)))return saved;await page.waitForTimeout(100);}throw Error('expected persisted state was not reached');}
export async function setRange(page,label,value){await page.getByRole('slider',{name:label,exact:true}).evaluate((n,v)=>{n.value=String(v);n.dispatchEvent(new Event('input',{bubbles:true}));},value);}
export async function choose(page,label,text){await button(page,label).click();await page.getByRole('dialog').last().getByRole('button',{name:text,exact:true}).click();}
export async function tapCanvas(page,x,y){const c=page.locator('.expedition-canvas-host canvas');const r=await c.boundingBox();if(!r)throw Error('inquiry canvas missing');await page.mouse.click(r.x+r.width*x,r.y+r.height*y);}
