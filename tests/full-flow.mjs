import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,waitForScene,button,navigate,teacherTools,readSaved,waitSaved,setRange,skipFilm,linkCard,linkTarget} from './browser.mjs';
import {inquiryTasks,stageRoutes,names} from './curriculum.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,...(process.env.RESUME_FLOW?{storageState:'.tmp/learner20-state.json'}:{})});const page=await context.newPage();page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
const btn=name=>button(page,name);
const paneAt=[[305,138],[966,118],[1140,347],[1010,521],[171,444]];
const paneColor=([x,y])=>page.locator('.map-host canvas').evaluate((c,[x,y])=>Array.from(c.getContext('2d').getImageData(x,y,1,1).data).slice(0,3),[x,y]);
const observerArt=mode=>page.locator(`[data-${mode}-active] .scope-observer`).evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));return imgs.map(i=>i.getAttribute('src'));});
const alternative=async()=>{await btn('변화 위치 고르기').click();return page.getByRole('dialog').last();};
// Phaser suppresses synthetic mouse events just after touch; keep this tablet flow on one input device.
async function tapCanvas(p,x,y){const rect=await p.locator('.expedition-canvas-host canvas').boundingBox();assert.ok(rect);await p.touchscreen.tap(rect.x+x*rect.width,rect.y+y*rect.height);}
async function touch(x,y){await tapCanvas(page,x/960,y/540);}
async function connectAll(task){
 if(await page.locator('.quiz-board').count()){
  while(true){
   const id=await page.locator('.quiz-board').getAttribute('data-quiz-item');
   const item=task.items.find(it=>it.id===id);
   if(!item)throw Error('unknown quiz item');
   const answer=page.locator(`[data-quiz-answer="${item.target}"]`);
   if(await answer.getAttribute('aria-pressed')!=='true')await answer.tap();
   if(await btn('다음 문제').isHidden())break;
   await btn('다음 문제').tap();
  }
  return;
 }
 const saved=await readSaved(page),record=saved?.learner.inquiry.records[task.id];
 for(const [i,item] of task.items.entries()){
  if(task.kind==='build'&&!item.target)continue;
  if(task.kind==='build'&&record?.assignments[item.target]===item.id)continue;
  if(task.kind==='build')await touch(132+i*233,431);
  else await linkCard(page,item.id).tap();
  await page.locator('.source-preview').waitFor({state:'visible'});
  assert.equal(await page.locator('dialog[open]').count(),0,'source selection must not interrupt the canvas');
  const targetIndex=task.targets.findIndex(t=>t.id===item.target);
  if(task.kind==='build')await touch(185+targetIndex*295,200);
  else await linkTarget(page,item.target).tap();
 }
 if(task.kind==='build'){
  const latest=await waitSaved(page,s=>s.learner.inquiry.records[task.id].assignments.edge1==='linked'&&s.learner.inquiry.records[task.id].assignments.edge2==='linked');
  assert.equal(latest.learner.inquiry.records[task.id].assignments.edge2,'linked','filled slots connect automatically');
 }
}
async function mark(x,y){const dialog=await alternative();await setRange(page,'표시 가로 위치',x);await setRange(page,'표시 세로 위치',y);await dialog.getByRole('button',{name:'이 위치 표시',exact:true}).click();await dialog.getByRole('button',{name:'닫기',exact:true}).click();}
async function completeTask(task,replay=false){
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();await waitForScene(page,'.expedition-canvas-host');
 if(['collect','connect','sort'].includes(task.kind))await connectAll(task);
 if(task.id==='M3-2'){await btn('크기 사다리에 세균 놓기').click();const ladder=page.locator('.ladder-dialog');await ladder.getByRole('button',{name:'여기에 놓기'}).first().click();assert.match(await ladder.locator('.ladder-feedback').innerText(),/더 아래/);await ladder.getByRole('button',{name:'여기에 놓기'}).last().click();assert.match(await ladder.locator('.ladder-feedback').innerText(),/약 200배/);await ladder.getByRole('button',{name:'닫기',exact:true}).click();}
 if(task.kind==='microscope'){
  if(task.id==='M2-2'){
   await btn('눈으로 보기').click();await page.locator('[data-eye-active]').waitFor();
   assert.deepEqual(await observerArt('eye'),['assets/ui/moa-naked-eye.webp','assets/ui/toto-naked-eye.webp']);
   await page.screenshot({path:'.tmp/screens/pond-naked-eye.png'});
  }
  // Simplified microscope (2026-11): 돋보기 → 현미경 button, focus, then one observation photo. No hidden gate or feature marks.
  if(await btn('현미경으로 관찰하기').count())await btn('현미경으로 관찰하기').click();
  if(task.id==='M2-2'){
   await page.locator('[data-scope-active]').waitFor();
   assert.deepEqual(await observerArt('scope'),['assets/ui/moa-microscope.webp','assets/ui/toto-microscope.webp']);
   await page.screenshot({path:'.tmp/screens/pond-microscope.png'});
  }
  await setRange(page,'초점',65);await btn('관찰 사진 남기기').click();await btn('다시 관찰하기').waitFor();
 }
 if(task.kind==='sample'){await btn('물풀 가까이').click();for(const label of ['한 방울 채집','한 방울 옮기기'])await btn(label).click();}
 if(task.kind==='track'){await setRange(page,'관찰 시점',5);await page.getByRole('button',{name:/^B 고정/}).click();
  // A 440px-wide specimen fits inside the circular eyepiece without losing its cilia.
  await btn('현미경으로 움직임의 비밀 찾기').click();await btn('움직임 다시 보기').waitFor();
  await btn('몸 안쪽').click();assert.ok(await btn('발견 기록하기').isDisabled());
  await btn('몸 둘레').click();assert.ok(await btn('발견 기록하기').isEnabled());
  await btn('표시 되돌리기').click();
  const w=440,h=w*496/793;await tapCanvas(page,(480-.33*w)/960,(282+.001*h)/540);await page.getByText('현미경 · 몸 둘레 표시 1곳').waitFor();}
 if(task.kind==='timeline'){await setRange(page,'관찰 순서',3);await page.getByRole('button',{name:/^이후 고정/}).click();await mark(...(task.organism==='bread'?[.49,.4]:[.51,.54]));
  await page.getByText('관련 조사 자료 읽기',{exact:true}).click();assert.ok(await page.locator('.process-note').isVisible());await page.getByRole('dialog').getByRole('button',{name:'닫기',exact:true}).click();}
 if(task.kind==='build'){await connectAll(task);await btn(task.id==='M5-1'?'요구르트가 될 거예요':'사례처럼 이어질 것 같아요').click();await btn(task.id==='M5-1'?'발효기 켜기':'설계 가동').click();await page.locator('.run-reflection[data-result="matches"]').waitFor();assert.equal(await btn('예상과 같아요').count(),0,'the game compares the prediction; no extra tap');}
 if(task.kind==='review'){await btn('모든 세균이 해로울 것 같아요').click();for(const item of task.items){await btn(item.label).click();await page.locator('.source-preview').waitFor({state:'visible'});}assert.equal(await btn('자료 확인했어요').count(),0,'opening a source is reading it');await btn('모든 세균이 해로운 것은 아니에요').click();await btn('요구르트 만들기').click();assert.match(await page.locator('.inquiry-status').innerText(),/수정/);}
 if(task.kind==='publish'){await btn('요구르트').click();await btn('유산균의 작용').click();assert.ok((await page.getByLabel('내 소개 문장',{exact:true}).inputValue()).length>0,'selected case and action create an editable introduction');await page.getByLabel('내 소개 문장',{exact:true}).fill('특정 세균의 작용을 우유로 요구르트를 만드는 데 이용해요.');}
 if(task.kind==='summary'){
  await page.getByRole('heading',{name:'해캄 관찰 기록',exact:true}).waitFor();
  await page.getByRole('heading',{name:'짚신벌레 관찰 기록',exact:true}).waitFor();
  await page.getByText('현미경 사진 기록',{exact:true}).waitFor();
  await page.getByText('두 시점 비교 기록',{exact:true}).waitFor();
  await page.screenshot({path:'.tmp/screens/pond-summary.png'});
  assert.equal(await page.locator('.link-board').count(),0);await btn('정리 마치기').click();
 }else{
 await btn('발견 기록하기').click();await page.locator('.discovery-dialog').waitFor();
 assert.match(await page.locator('.discovery-dialog .pip-label').innerText(),new RegExp(`발견 도장 ${task.order} / 4`));
 await btn(task.order===4?'연구소 복구하기':'다음 발견으로').click();
 }
 if(task.order===4&&task.kind!=='summary'){const clues=await page.locator('[data-clue]').evaluateAll(nodes=>nodes.map((n,i)=>({id:n.dataset.clue,role:i===2?'limit':'supports'})));for(const clue of clues){await page.locator(`[data-clue="${clue.id}"]`).click();await page.locator(`[data-zone="${clue.role}"]`).click();}await btn('연결 확인하기').click();await btn('조사 결과 전달하기').click();}
 if(task.order===4&&!replay){
  const stageIndex=Number(task.stage.slice(1))-1;
  await page.locator('.concept-dialog').waitFor();await waitForScene(page,'.map-host');
  const pane=paneAt[stageIndex],dark=await paneColor(pane);
  await btn('복구 보상 받기').click();
  const reward=page.locator('.resident-reward');
  await reward.waitFor();
  if(task.stage==='M1')await page.waitForTimeout(900);
  assert.deepEqual(await paneColor(pane),dark,'the building stays dark behind the reward');
  // 2026-11-15: one step, no "talk or leave" choice; the neighbour's story follows by itself.
  assert.equal(await reward.getByRole('button').count(),1);
  await reward.getByRole('button',{name:/만나러 가기$/}).click();
  const talk=page.locator('.resident-dialog');await talk.waitFor();
  if(task.stage==='M1'){await talk.getByRole('button',{name:'노트에 뭘 그렸어?'}).click();assert.match(await talk.locator('.resident-line').innerText(),/갓 아래/);}
  await talk.getByRole('button',{name:'지도로 돌아가기',exact:true}).click();
  if(task.stage==='M1')assert.ok(await page.locator('.map-resident[data-stage="M1"]').evaluate(b=>b===document.activeElement));
  await page.locator('.screen-nature-map').waitFor();
  const lit=await page.waitForFunction(([x,y,red])=>document.querySelector('.map-host canvas').getContext('2d').getImageData(x,y,1,1).data[0]>red+65,[...pane,dark[0]],{timeout:4500});
  await lit.dispose();
  if(task.stage==='M1')await page.screenshot({path:'.tmp/screens/map-building-restored.png'});
  assert.equal(await page.locator('.map-resident').count(),Number(task.stage.slice(1)));
 }
 if(task.order===4&&replay){await page.locator('.screen-nature-map').waitFor();assert.equal(await page.locator('.map-resident').count(),5);}
 checks.push(task.id);console.log(task.id+' completed');
}
try{
 await mkdir('.tmp/screens',{recursive:true});await navigate(page,base,'main');if(!process.env.RESUME_FLOW){await btn('탐험 시작').click();await skipFilm(page);await btn('다음').click();await btn('다음').click();await btn('탐험 지도로').click();await waitForScene(page,'.map-host');assert.equal(await page.locator('.map-resident').count(),0);
 await btn('버섯숲 표본실로 가기').click();await page.locator('.screen-fungi-field').waitFor();
 // Quiz records stay disabled until every question has a correct answer.
 await page.locator('.inquiry-loading').waitFor({state:'detached'});
 assert.ok(await btn('발견 기록하기').isDisabled());assert.equal(await page.locator('.discovery-dialog').count(),0);
 await page.locator('[data-quiz-answer="mold"]').tap();
 assert.match(await page.locator('.quiz-feedback').innerText(),/다시 골라/);
 for(let stage=1;stage<=5;stage++){
  if(stage>1)await navigate(page,base,stageRoutes[stage-1][0]);
  for(const task of inquiryTasks.filter(t=>t.stage==='M'+stage))await completeTask(task);
 }
 await context.storageState({path:'.tmp/learner20-state.json',indexedDB:true});}else checks.push(...inquiryTasks.map(t=>t.id));
 let saved=await waitSaved(page,s=>Object.keys(s.learner.evidence).length===5);assert.equal(Object.values(saved.learner.inquiry.records).filter(r=>r.completedAt).length,20);assert.equal(saved.learner.inquiry.rewards.length,10);
 await navigate(page,base,'final-report');assert.equal(await page.getByRole('button',{name:/기록 확인/}).count(),0,'no confirmation taps in the report');await btn('생활 사건 발표').click();assert.ok(await page.locator('dialog .album-tile').count()>=4);await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();await btn('발견을 코어에 연결').click();
 for(const name of names){await btn(name+' 포트').click();assert.equal(await page.locator('dialog[open]').count(),0,'core connects with one tap');}
 await btn('코어 가동').click();await btn('결과로 바로 가기').click();await skipFilm(page);await page.locator('.screen-results').waitFor();await page.getByLabel('소개 카드 제목',{exact:true}).fill('내가 발견한 생물의 작용');await page.getByLabel('소개 문장',{exact:true}).fill('우리 생활에는 작은 생물의 도움이 있어요.');
 const dp=page.waitForEvent('download');await btn('내 카드 저장').click();const download=await dp;await download.saveAs('.tmp/result-card.png');saved=await waitSaved(page,s=>s.learner.cardTitle==='내가 발견한 생물의 작용');
 await page.reload();await page.locator('.screen-results').waitFor();assert.equal(await page.getByLabel('소개 카드 제목').inputValue(),'내가 발견한 생물의 작용');
 const learnerBefore=JSON.stringify((await readSaved(page)).learner);const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await settings.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();await page.locator('dialog[open]').waitFor({state:'detached'});await navigate(page,base,'solution-run');
 await page.getByRole('button',{name:/4번째 발견:/}).click();await page.locator('.inquiry-loading').waitFor({state:'detached'});await page.getByLabel('내 소개 문장',{exact:true}).fill('시연에서만 바꾸는 소개 문장이에요.');await waitSaved(page,s=>s.preview.inquiry.records['M5-4'].note==='시연에서만 바꾸는 소개 문장이에요.');assert.equal(JSON.stringify((await readSaved(page)).learner),learnerBefore);
 let previewSettings=await teacherTools(page);await previewSettings.getByRole('button',{name:'시연 기록 초기화',exact:true}).click();await page.locator('.settings-confirm').getByRole('button',{name:'기록 지우기',exact:true}).click();await page.locator('.screen-main').waitFor();assert.equal(JSON.stringify((await waitSaved(page,s=>Object.keys(s.preview.inquiry.records).length===0)).learner),learnerBefore);previewSettings=await teacherTools(page);await previewSettings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await previewSettings.getByRole('button',{name:'닫기',exact:true}).click();assert.equal(JSON.stringify((await waitSaved(page,s=>!s.settings.admin)).learner),learnerBefore);
 await page.reload();await page.locator('.screen-results').waitFor();assert.equal(await page.getByLabel('소개 문장',{exact:true}).inputValue(),'우리 생활에는 작은 생물의 도움이 있어요.');await page.screenshot({path:'.tmp/full-flow-results.png'});
 // The deliberate wrong M1-1 answer counts as a miss, so M1 can be replayed for its habit badge.
 if(!process.env.RESUME_FLOW){await navigate(page,base,'nature-map');await btn('토토의 지도 힌트').click();await btn('내 발견 도감').click();const records=page.locator('.records-dialog');assert.equal(await records.locator('.habit-row.earned').count(),4);await records.getByRole('button',{name:'다시 도전',exact:true}).click();await btn('다시 도전 시작').click();
  for(const task of inquiryTasks.filter(t=>t.stage==='M1'))await completeTask(task,true);
  assert.match(await page.locator('.toast').innerText(),/꼼꼼한 관찰자/);const after=(await readSaved(page)).learner;assert.equal(Object.keys(after.evidence).length,5);assert.equal(after.report.length,5);assert.equal(after.ports.length,5);assert.equal(after.activated,true);assert.equal(after.cardTitle,'내가 발견한 생물의 작용');
  await navigate(page,base,'results');assert.match(await page.locator('.habit-summary').innerText(),/5\/5/);checks.push('habit replay: M1 다시 도전 → badge, evidence kept');}
 assert.equal(errors.length,0,errors.join('; '));await writeFile('.tmp/full-flow.json',JSON.stringify({status:'PASS',errors,completed:checks,taskCount:checks.length,rewards:10,restored:true,previewIsolation:true,png:download.suggestedFilename()},null,2));console.log('FULL FLOW PASS: 20 tasks; report; core; PNG; reload; preview isolation');
}catch(error){process.exitCode=1;console.error('FLOW ERROR',error.stack);console.error('SAVED PREVIEW NOTE',(await readSaved(page))?.preview?.inquiry?.records?.['M5-4']?.note);console.error('INPUT',await page.getByLabel('내 소개 문장',{exact:true}).inputValue().catch(()=>''));await page.screenshot({timeout:10000,path:'.tmp/full-flow-failure.png'});console.error((await page.locator('body').innerText()).slice(0,5000));await writeFile('.tmp/full-flow.json',JSON.stringify({status:'FAIL',error:error.message,errors,completed:checks},null,2));}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);}
