// 2026-11-18 놀이 영역 비율·배경 조화·중복 조작 버튼 측정(_shared/LAYOUT-BALANCE-DELIVERY-20261118.md 1·2절).
// 사용: APP_URL=http://127.0.0.1:5308 LAYOUT_OUT=.tmp/layout-balance-20261118/before node tests/layout-balance.mjs
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,waitForScene,navigate,teacherTools} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5308',out=process.env.LAYOUT_OUT||'.tmp/layout-balance-20261118/before';
const sizes=[[1280,800],[1024,768],[1920,1080]];
const browser=await launchBrowser(),page=await browser.newPage({hasTouch:true});
const errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

// 놀이 영역: 학생이 조작하는 판의 눈에 보이는 상자. 활동은 캔버스 호스트 안 첫 판, 지도는 지도 호스트.
const measure=()=>page.evaluate(()=>{
 const W=innerWidth,H=innerHeight;
 const pick=[
  '.expedition-canvas-host .flat-lab','.expedition-canvas-host .quiz-board','.expedition-canvas-host .simple-observation','.expedition-canvas-host .fungi-sort',
  '.expedition-canvas-host .pond-summary','.expedition-canvas-host .choice-game','.expedition-canvas-host .timeline-game','.expedition-canvas-host .scope-game',
  '.expedition-canvas-host .build-game','.expedition-canvas-host .germ-game','.expedition-canvas-host canvas','.link-board','.expedition-canvas-host','.map-host','.core-figure','.result-card','.report-sheet','.home-card'];
 let host=null,sel='';
 for(const s of pick){const n=[...document.querySelectorAll(s)].find(n=>{const r=n.getBoundingClientRect();return r.width>40&&r.height>40;});if(n){host=n;sel=s;break;}}
 const r=host?.getBoundingClientRect();
 const play=r?{sel,x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),hPct:Math.round(r.height/H*100),areaPct:Math.round(r.width*r.height/(W*H)*100),
  gapL:Math.round(r.left/W*100),gapR:Math.round((W-r.right)/W*100),gapT:Math.round(r.top/H*100),gapB:Math.round((H-r.bottom)/H*100),
  offX:Math.round(((r.left+r.right)/2-W/2)/W*100),offY:Math.round(((r.top+r.bottom)/2-H/2)/H*100)}:null;
 const controls=[...document.querySelectorAll('button,[role=button],a[href],input,select,summary')].filter(n=>{
  if(!n.getClientRects().length||n.closest('[hidden],[inert]'))return false;const b=n.getBoundingClientRect();if(b.width<2||b.height<2)return false;
  const s=getComputedStyle(n);if(s.visibility==='hidden'||+s.opacity===0)return false;return b.bottom>0&&b.right>0&&b.top<H&&b.left<W;})
  .map(n=>{const b=n.getBoundingClientRect();return {t:(n.getAttribute('aria-label')||n.textContent||n.value||'').replace(/\s+/g,' ').trim().slice(0,30),x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),cls:(n.className&&n.className.baseVal===undefined?n.className:'').toString().split(' ')[0]};});
 const counts={};for(const c of controls)counts[c.t]=(counts[c.t]||0)+1;
 const dup=Object.entries(counts).filter(([t,n])=>n>1&&t).map(([t,n])=>t+'×'+n);
 return {W,H,play,controls,dup};
});
const record=async(name,shot=true)=>{
 await page.waitForTimeout(350);
 const m=await measure();rows.push({name,...m});
 if(shot)await page.screenshot({path:`${out}/${m.W}x${m.H}-${name}.png`});
 const p=m.play;console.log(`${m.W}x${m.H} ${name.padEnd(18)} ${p?`${p.sel} ${p.w}x${p.h} h${p.hPct}% a${p.areaPct}% gapL${p.gapL} R${p.gapR} T${p.gapT} B${p.gapB} off${p.offX},${p.offY}`:'-'} ctl${m.controls.length}${m.dup.length?' DUP '+m.dup.join(','):''}`);
};
const open=async task=>{
 await navigate(page,base,stageRoutes[+task.stage.slice(1)-1][task.order>2?1:0]);
 await page.locator('.activity-stepper button').nth(task.order-1).click();
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
 await waitForScene(page,'.expedition-canvas-host');
};
try{
 await mkdir(out,{recursive:true});
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  if(page.url()==='about:blank'){await navigate(page,base,'nature-map');const s=await teacherTools(page);await s.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await s.getByRole('button',{name:'닫기',exact:true}).click();}
  await navigate(page,base,'main');await record('main');
  await navigate(page,base,'nature-map');await waitForScene(page,'.map-host').catch(()=>{});await page.waitForTimeout(800);await record('nature-map');
  for(const task of inquiryTasks){await open(task);await record(task.id);}
  for(const route of ['final-report','core-restoration','results']){await navigate(page,base,route);await page.waitForTimeout(600);await record(route);}
 }
 await writeFile(out+'/measure.json',JSON.stringify({errors,rows},null,1));
 console.log('errors',errors.length,errors.slice(0,5));
}catch(e){console.error('FAIL',e.message);process.exitCode=1;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}
finally{await browser.close();}
