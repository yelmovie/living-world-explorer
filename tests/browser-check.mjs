import {launchBrowser,waitForScene} from './browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const base=process.env.APP_URL||'http://127.0.0.1:5176';await mkdir('.tmp/screens',{recursive:true});
const btn=(name)=>page.getByRole('button',{name,exact:true});
const navigate=async(route)=>{await page.goto(`${base}/#/${route}`);await page.locator(`.screen-${route}`).waitFor();};
try{
 await navigate('main');await btn('설정').click();await page.getByLabel('관리자 전체 해금').check();await page.locator('.preview-banner').waitFor();await btn('닫기').click();
 const routes=['main','nature-map','fungi-field','fungi-microscope','water-sampling','protist-observation','bacteria-sources','bacteria-profile','impact-investigation','impact-analysis','solution-assembly','solution-run','final-report','core-restoration','results'];
 const screens=[];
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:1280,height:720}]){
  await page.setViewportSize(size);
  for(const route of routes){await navigate(route);const sceneHost={'nature-map':'.map-host','fungi-field':'.explore-host','water-sampling':'.explore-host','bacteria-profile':'.link-host','impact-investigation':'.timeline-host','solution-assembly':'.three-host','solution-run':'.three-host','core-restoration':'.three-host'}[route];if(sceneHost)await waitForScene(page,sceneHost);await page.screenshot({timeout:10000,path:`.tmp/screens/${size.width}x${size.height}-${route}.png`});
   const layout=await page.evaluate(()=>({horizontal:document.documentElement.scrollWidth>innerWidth+1,footer:[...document.querySelectorAll('.action-bar button')].some(b=>{const r=b.getBoundingClientRect();return r.bottom>innerHeight||r.right>innerWidth||r.height<47;}),scrollAreas:[...document.querySelectorAll('.workbench,.tool-panel,.tool-tab-body,.screen')].filter(n=>n.scrollHeight>n.clientHeight+3).map(n=>({class:n.className,overflow:n.scrollHeight-n.clientHeight})),error:document.body.innerText.includes('화면을 다시 열어 주세요.')}));screens.push({size,route,...layout});
  }
 }
 await navigate('nature-map');await btn('설정').click();await page.getByLabel('관리자 전체 해금').uncheck();await btn('닫기').click();
 await page.locator('.preview-banner').waitFor({state:'detached'});
 if(await page.locator('.map-bottom strong').innerText()!=='연구소 복구 0 / 5')throw Error('Preview changed learner progress');
 await page.waitForFunction(()=>document.querySelector('.save-status')?.textContent==='기기에 저장됨');await page.reload();await page.locator('.screen-nature-map').waitFor();
 if(await page.locator('.preview-banner').count()||await page.locator('.map-bottom strong').innerText()!=='연구소 복구 0 / 5')throw Error('Preview isolation did not survive reload');
 await writeFile('.tmp/browser-audit.json',JSON.stringify({errors,screens,previewIsolation:true},null,2));
 console.log(JSON.stringify({errors,screens:screens.length,scrollAreas:screens.filter(s=>s.scrollAreas.length).map(s=>({size:s.size,route:s.route,areas:s.scrollAreas})),layoutFailures:screens.filter(s=>s.horizontal||s.footer||s.error)}));
 if(errors.length||screens.some(s=>s.horizontal||s.footer||s.error))process.exitCode=1;
}catch(error){process.exitCode=1;console.log('BROWSER FAILURE',error.message,errors,await page.locator('body').innerText());await page.screenshot({timeout:10000,path:'.tmp/browser-failure.png'});throw error;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);}
