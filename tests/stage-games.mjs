// 2026-11-16: the game boards that replaced repeated buttons — M1 lens/spores, focus dial/tags and Venn sort,
// M3 bacteria lab games, M4 swipe and signal lamps, M4 time-lapse and wipe. Each is played by touch, including one wrong move
// (Toto hint, nothing stored), and must open its discovery record by itself when finished.
import assert from 'node:assert/strict';
import {launchBrowser,navigate,teacherTools,waitSaved,linkCard,linkTarget} from './browser.mjs';
import {inquiryTasks} from './curriculum.mjs';
import {playGerm} from './germ-play.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:4173';
const sizes=process.env.GAME_SIZES?JSON.parse(process.env.GAME_SIZES):[[1280,800],[915,412]];
const routes={M1:['fungi-field','fungi-microscope'],M3:['bacteria-sources','bacteria-profile'],M4:['impact-investigation','impact-analysis']};
const spores=[[0.482,0.3014],[0.4461,0.3708],[0.4406,0.4403]],moldTags={thread:[0.4813,0.3653],round:[0.5,0.6]},changes={bread:[0.536,0.654],leaf:[0.46,0.4486]};
const browser=await launchBrowser();const errors=[];
try{
 for(const [width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const rec=async id=>((await waitSaved(page)).preview.inquiry.records[id]);
  const task=id=>inquiryTasks.find(t=>t.id===id);
  const toto=()=>page.locator('.toto-bubble:not([hidden]) .toto-bubble-text').innerText();
  const open=async id=>{const t=task(id);await navigate(page,base,routes[t.stage][t.order<3?0:1]);await page.getByRole('button',{name:new RegExp(`^${t.order}번째 발견:`)}).click();await page.locator('.inquiry-loading').waitFor({state:'detached'});await page.waitForTimeout(400);};
  const finished=async()=>{await page.locator('.discovery-dialog').waitFor({timeout:9000});await page.keyboard.press('Escape');await page.locator('.discovery-dialog').waitFor({state:'detached'}).catch(()=>{});};
  const centre=async l=>{const b=await l.boundingBox();return [b.x+b.width/2,b.y+b.height/2];};
  const cdp=await context.newCDPSession(page);
  const swipe=async(a,b,c,d)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:a,y:b}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:a+(c-a)*i/10,y:b+(d-b)*i/10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const drag=async(from,to)=>{const [a,b]=await centre(from),[c,d]=await centre(to);await swipe(a,b,c,d);};
  const eye=p=>page.locator('.eye-field').evaluate((f,p)=>{const r=f.getBoundingClientRect(),b={left:r.left+f.clientLeft,top:r.top+f.clientTop,width:f.clientWidth,height:f.clientHeight},img=f.querySelector('img'),a=img.naturalWidth/img.naturalHeight,w=b.height*a;return [b.left+p[0]*w-(w-b.width)/2,b.top+p[1]*b.height];},p);
  // A fresh browser context starts with empty records; the teacher unlock opens every activity.
  await navigate(page,base,'nature-map');{const t=await teacherTools(page);await t.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await t.getByRole('button',{name:'닫기',exact:true}).click();}

  // M1-2: hand lens to the gills, then three spores in the eyepiece.
  await open('M1-2');const lv=await page.locator('.lens-view').boundingBox();
  await page.mouse.move(lv.x+lv.width*.2,lv.y+lv.height*.85);await page.mouse.down();await page.mouse.move(lv.x+lv.width*.33,lv.y+lv.height*.42,{steps:10});await page.waitForTimeout(900);await page.mouse.up();await page.locator('.scope-next').click();
  await page.locator('.eye-field').waitFor();await page.waitForTimeout(700);
  for(const p of spores){const [x,y]=await eye(p);await page.mouse.click(x,y);await page.waitForTimeout(250);}
  await page.waitForTimeout(900);let r=await rec('M1-2');assert.ok(r.capture&&r.level===2&&r.focus===65,'M1-2 saves a sharp microscope photo');await finished();
  // M1-3: dial by drag, a wrong tag, then both tags.
  await open('M1-3');const d=await page.locator('.focus-dial').boundingBox();const cx=d.x+d.width/2,cy=d.y+d.height/2,R=d.width*.4;
  await page.mouse.move(cx+R,cy);await page.mouse.down();for(let a=0;a<=130;a+=5){const t=a*Math.PI/180;await page.mouse.move(cx+R*Math.cos(t),cy+R*Math.sin(t));}await page.mouse.up();
  for(let i=0;i<12&&Math.abs((await rec('M1-3')).focus-65)>4;i++)await page.getByRole('button',{name:(await rec('M1-3')).focus<65?'오른쪽으로 ▶':'◀ 왼쪽으로'}).click();
  await page.locator('[data-tag="round"]').click();{const [x,y]=await eye(moldTags.thread);await page.mouse.click(x,y);}assert.match(await toto(),/이름표/);assert.equal((await rec('M1-3')).marks.length,0,'a wrong tag is not stored');
  for(const [id,p] of Object.entries(moldTags)){await page.locator(`[data-tag="${id}"]`).click();const [x,y]=await eye(p);await page.mouse.click(x,y);await page.waitForTimeout(250);}
  await page.waitForTimeout(900);r=await rec('M1-3');assert.ok(r.capture&&r.marks.length===2);await finished();
  // M1-4: wrong drop returns with a hint; right drops and taps fill the two circles.
  await open('M1-4');await drag(linkCard(page,'cap'),linkTarget(page,'mold'));assert.match(await toto(),/줄무늬/);assert.notEqual((await rec('M1-4'))?.assignments.cap,'mold');
  await drag(linkCard(page,'cap'),linkTarget(page,'mushroom'));await linkCard(page,'hypha').tap();await linkTarget(page,'mold').tap();await drag(linkCard(page,'mycelium'),linkTarget(page,'both'));await drag(linkCard(page,'spread'),linkTarget(page,'both'));
  assert.deepEqual((await rec('M1-4')).assignments,{cap:'mushroom',hypha:'mold',mycelium:'both',spread:'both'});await finished();
  // 2026-11-17: M3 bacteria lab — zoom dial, catching shapes, swab culture and the comparison exhibit, each with one wrong move first.
  for(const id of ['M3-1','M3-2','M3-3','M3-4']){await open(id);const hints=await playGerm(page,id,{wrong:true});assert.ok(hints.every(h=>h.length>0),id+' wrong moves get a Toto hint: '+JSON.stringify(hints));
   const r=await rec(id);assert.equal(r.misses>0,true,id+' counts the mistake');await finished();}
  // M4-4 swipes, M4-3 lamps.
  for(const id of ['M4-4']){await open(id);const t=task(id);for(let i=0;i<t.items.length;i++){const cur=await page.locator('.choice-card').getAttribute('data-link-item');const it=t.items.find(x=>x.id===cur);const [x,y]=await centre(page.locator('.choice-card'));const dir=it.target===t.targets[0].id?1:-1;if(i===0){await swipe(x,y,x-dir*260,y);await page.waitForTimeout(400);assert.ok((await toto()).length>0,'wrong swipe gets a hint');}await swipe(x,y,x+dir*260,y);await page.waitForTimeout(600);}
   assert.ok(t.items.every(async it=>(await rec(id)).assignments[it.id]===it.target));await finished();}
  await open('M4-3');const t43=task('M4-3');await drag(linkCard(page,'bread-case'),linkTarget(page,'help'));assert.ok((await toto()).length>0);
  for(const [i,it] of t43.items.entries()){if(i%2)await drag(linkCard(page,it.id),linkTarget(page,it.target));else{await linkCard(page,it.id).click();await linkTarget(page,it.target).click();}await page.waitForTimeout(200);}
  assert.ok(t43.items.every(it=>true));r=await rec('M4-3');for(const it of t43.items)assert.equal(r.assignments[it.id],it.target);await finished();
  // M4-1 time-lapse and M4-2 wipe: compare first, then mark the change on the picture.
  for(const id of ['M4-1','M4-2']){await open(id);const kind=task(id).organism;const b0=await page.locator('.timeline-layer').first().boundingBox();
   await page.mouse.click(b0.x+b0.width*.1,b0.y+b0.height*.9);{const said=await toto().catch(()=>'(no bubble)');assert.match(said,/먼저/,'tapping before comparing asks to compare: '+said+' pins='+JSON.stringify((await rec(id)).pins));}
   if(id==='M4-1'){await page.getByRole('button',{name:'▶ 빨리 감기',exact:true}).click();await page.waitForTimeout(3600);}else{await page.getByRole('button',{name:'◀ 처음 더 보기',exact:true}).click();await page.getByRole('button',{name:'나중 더 보기 ▶',exact:true}).click();}
   const b=await page.locator('.timeline-layer').first().boundingBox();await page.mouse.click(b.x+b.width*.05,b.y+b.height*.95);
   const [x,y]=changes[kind];await page.mouse.click(b.x+b.width*x,b.y+b.height*y);await page.waitForTimeout(300);if(await page.locator('.timeline-note').isHidden()){await page.screenshot({path:'.tmp/stage-games-'+id+'.png'});console.log('DEBUG',id,width,JSON.stringify(await rec(id)),await toto().catch(()=>''));}await page.locator('.timeline-note').waitFor();
   r=await rec(id);assert.deepEqual(r.pins,[0,3]);assert.ok(r.marks.length>=1&&r.opened.includes('process'));await finished();}
  // M5-2 oven (press and hold) and M5-3 compost (five taps): a wrong card stops with a hint, the right one succeeds.
  for(const [id,right,wrong] of [['M5-2','yeast','bacterium'],['M5-3','decompose','sealed']]){
   await navigate(page,base,'solution-run');await page.getByRole('button',{name:new RegExp(`^${task(id).order}번째 발견:`)}).click();await page.locator('.inquiry-loading').waitFor({state:'detached'});await page.waitForTimeout(400);
   const run=async card=>{await linkCard(page,card).click();await page.locator('.build-vessel').click();await page.locator('[data-prediction="supported"]').click();const act=page.locator('.build-action');await act.scrollIntoViewIfNeeded();
    if(id==='M5-2'){const b=await act.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(2900);await page.mouse.up();}else for(let i=0;i<5;i++){await act.click();await page.waitForTimeout(120);}
    await page.locator('.build-verdict').waitFor();await page.waitForTimeout(300);return rec(id);};
   r=await run(wrong);assert.equal(r.runResult,'stopped');assert.ok((await toto()).length>0,'a stopped run gets a hint');
   await page.getByRole('button',{name:'다른 카드로 다시 해 보기',exact:true}).click();
   r=await run(right);assert.equal(r.runResult,'supported');assert.equal(r.reflection,'matches');await finished();
  }
  console.log(`${width}x${height}: M1 lens·dial·sort, M3 zoom·catch·culture·exhibit, M4 swipe·lamp, M4 time-lapse·wipe, M5 oven·compost passed`);
  await context.close();
 }
 // A picture that fails to load leaves a retry button instead of a dead board (moved from interaction-review.mjs).
 {const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});const page=await context.newPage();await page.route('**/study/mushroom.webp',route=>route.abort());
  await navigate(page,base,'nature-map');const t=await teacherTools(page);await t.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await t.getByRole('button',{name:'닫기',exact:true}).click();
  await navigate(page,base,'fungi-field');await page.getByRole('button',{name:/^2번째 발견:/}).click();
  await page.getByRole('button',{name:'이미지 다시 준비',exact:true}).waitFor();assert.match(await page.locator('.inquiry-loading').innerText(),/준비하지 못했어요/);await context.close();console.log('failed picture: retry button shown');}
 assert.deepEqual(errors,[]);console.log('PASS stage games');
}finally{await browser.close();}
