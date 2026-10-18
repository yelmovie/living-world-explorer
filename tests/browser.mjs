import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';

export function launchBrowser(){
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
