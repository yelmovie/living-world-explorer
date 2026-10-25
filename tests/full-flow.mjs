import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,waitForScene,button,navigate,teacherTools,readSaved,waitSaved,setRange,choose,tapCanvas} from './browser.mjs';
import {inquiryTasks,stageRoutes,names} from './curriculum.mjs';
const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,...(process.env.RESUME_FLOW?{storageState:'.tmp/learner20-state.json'}:{})});const page=await context.newPage();page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
const btn=name=>button(page,name);
const alternative=async()=>{await btn('버튼으로 조작').click();return page.getByRole('dialog').last();};
async function connectAll(task){const dialog=await alternative();for(const item of task.items){await dialog.getByRole('button',{name:item.label,exact:true}).click();if(task.kind==='build'&&!item.target)continue;const target=task.targets.find(t=>t.id===item.target);await dialog.getByRole('button',{name:target.label+'에 연결',exact:true}).click();}if(task.kind==='build'){await dialog.getByRole('button',{name:'재료와 작용 잇기',exact:true}).click();await dialog.getByRole('button',{name:'작용과 결과 잇기',exact:true}).click();}await dialog.getByRole('button',{name:'닫기',exact:true}).click();}
async function mark(x,y){const dialog=await alternative();await setRange(page,'표시 가로 위치',x);await setRange(page,'표시 세로 위치',y);await dialog.getByRole('button',{name:'이 위치 표시',exact:true}).click();await dialog.getByRole('button',{name:'닫기',exact:true}).click();}
async function completeTask(task){
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();await waitForScene(page,'.expedition-canvas-host');
 if(['collect','connect','sort'].includes(task.kind))await connectAll(task);
 if(task.kind==='microscope'){await setRange(page,'초점',65);await btn('사진 촬영').click();await btn('표시 되돌리기').waitFor();
  // Actual canvas hit testing, including the required two distinct mold regions.
  const imageWidth=435*793/496;for(const [x,y] of task.organism==='mold'?[[.38,.17],[.36,.5]]:task.organism==='mushroom'?[[.5,.24]]:[[.4,.3]])await tapCanvas(page,(480-imageWidth/2+x*imageWidth)/960,(52.5+y*435)/540);
 }
 if(task.kind==='sample'){await btn('물풀 가까이').click();for(const label of ['스포이드 누르기','물속에서 놓기','한 방울 옮기기'])await btn(label).click();}
 if(task.kind==='track'){await setRange(page,'관찰 시점',0);await page.getByRole('button',{name:/^A 고정/}).click();await setRange(page,'관찰 시점',5);await page.getByRole('button',{name:/^B 고정/}).click();}
 if(task.kind==='timeline'){await page.getByRole('button',{name:/^이전 고정/}).click();await setRange(page,'관찰 순서',3);await page.getByRole('button',{name:/^이후 고정/}).click();await mark(...(task.organism==='bread'?[.49,.4]:[.51,.54]));await btn('관련 작용 자료').click();await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();}
 if(task.kind==='build'){await connectAll(task);await choose(page,'나의 예상','사례처럼 이어질 것 같아요');await btn('설계 가동').click();await btn('예상과 같아요').waitFor();await btn('예상과 같아요').click();}
 if(task.kind==='review'){await btn('모든 세균이 해로울 것 같아요').click();for(const item of task.items){await btn(item.label).click();await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();}await choose(page,'새 자료를 보고 고른 주장','모든 세균이 해로운 것은 아니에요');await choose(page,'내 주장의 근거','새 자료: 요구르트 만들기');await btn('처음 생각을 수정했어요').click();}
 if(task.kind==='publish'){const dialog=await alternative();await dialog.getByRole('button',{name:'요구르트 소개하기',exact:true}).click();await dialog.getByRole('button',{name:'닫기',exact:true}).click();await choose(page,'어떤 생물의 작용인가요?','특정 세균의 작용');await choose(page,'소개할 근거',task.items[0].detail);await page.getByLabel('내 소개 문장',{exact:true}).fill('특정 세균의 작용을 우유로 요구르트를 만드는 데 이용해요.');}
 await btn('발견 기록하기').click();await page.locator('.discovery-dialog').waitFor();
 await btn(task.order===4?'연구소 복구하기':'다음 발견으로').click();
 if(task.order===4){await page.locator('.concept-dialog').waitFor();await btn('복구 보상 받기').click();await btn('다음 장소 탐험').click();await page.locator('.screen-nature-map').waitFor();}
 checks.push(task.id);console.log(task.id+' completed');
}
try{
 await mkdir('.tmp/screens',{recursive:true});await navigate(page,base,'main');if(!process.env.RESUME_FLOW){await btn('탐험 시작').click();await btn('다음').click();await btn('다음').click();await btn('탐험 지도로').click();await waitForScene(page,'.map-host');
 await page.getByRole('button',{name:/^1\. 버섯숲 표본실/}).click();await btn('연구소 들어가기').click();
 // Empty submission must stay on the activity and explain what is missing.
 await btn('발견 기록하기').click();assert.ok((await page.locator('.inquiry-feedback').innerText()).length>0);assert.equal(await page.locator('.discovery-dialog').count(),0);
 for(let stage=1;stage<=5;stage++){
  if(stage>1)await navigate(page,base,stageRoutes[stage-1][0]);
  for(const task of inquiryTasks.filter(t=>t.stage==='M'+stage))await completeTask(task);
 }
 await context.storageState({path:'.tmp/learner20-state.json',indexedDB:true});}else checks.push(...inquiryTasks.map(t=>t.id));
 let saved=await waitSaved(page,s=>Object.keys(s.learner.evidence).length===5);assert.equal(Object.values(saved.learner.inquiry.records).filter(r=>r.completedAt).length,20);assert.equal(saved.learner.inquiry.rewards.length,10);
 await navigate(page,base,'final-report');for(let i=0;i<5;i++)await page.getByRole('button',{name:/^(이 )?기록 확인$/}).click();await btn('생활 사건 발표').click();assert.ok(await page.locator('dialog .album-tile').count()>=4);await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();await btn('발견을 코어에 연결').click();
 for(const name of names){await page.locator('.tool-panel').getByRole('button',{name,exact:true}).click();await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();await btn(name+' 포트').click();}
 await btn('코어 가동').click();await btn('결과로 바로 가기').click();await page.locator('.screen-results').waitFor();await page.getByLabel('소개 카드 제목',{exact:true}).fill('내가 발견한 생물의 작용');await page.getByLabel('소개 문장',{exact:true}).fill('우리 생활에는 작은 생물의 도움이 있어요.');
 const dp=page.waitForEvent('download');await btn('내 카드 저장').click();const download=await dp;await download.saveAs('.tmp/result-card.png');saved=await waitSaved(page,s=>s.learner.cardTitle==='내가 발견한 생물의 작용');
 await page.reload();await page.locator('.screen-results').waitFor();assert.equal(await page.getByLabel('소개 카드 제목').inputValue(),'내가 발견한 생물의 작용');
 const learnerBefore=JSON.stringify((await readSaved(page)).learner);const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await settings.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();await navigate(page,base,'solution-run');
 await page.getByRole('button',{name:/4번째 발견:/}).click();await page.locator('.inquiry-loading').waitFor({state:'detached'});await page.getByLabel('내 소개 문장',{exact:true}).fill('시연에서만 바꾸는 소개 문장이에요.');await waitSaved(page,s=>s.preview.inquiry.records['M5-4'].note==='시연에서만 바꾸는 소개 문장이에요.');assert.equal(JSON.stringify((await readSaved(page)).learner),learnerBefore);
 let previewSettings=await teacherTools(page);await previewSettings.getByRole('button',{name:'시연 기록 초기화',exact:true}).click();await page.locator('.settings-confirm').getByRole('button',{name:'기록 지우기',exact:true}).click();await page.locator('.screen-main').waitFor();assert.equal(JSON.stringify((await waitSaved(page,s=>Object.keys(s.preview.inquiry.records).length===0)).learner),learnerBefore);previewSettings=await teacherTools(page);await previewSettings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await previewSettings.getByRole('button',{name:'닫기',exact:true}).click();assert.equal(JSON.stringify((await waitSaved(page,s=>!s.settings.admin)).learner),learnerBefore);
 await page.reload();await page.locator('.screen-results').waitFor();assert.equal(await page.getByLabel('소개 문장',{exact:true}).inputValue(),'우리 생활에는 작은 생물의 도움이 있어요.');await page.screenshot({path:'.tmp/full-flow-results.png'});
 assert.equal(errors.length,0,errors.join('; '));await writeFile('.tmp/full-flow.json',JSON.stringify({status:'PASS',errors,completed:checks,taskCount:checks.length,rewards:10,restored:true,previewIsolation:true,png:download.suggestedFilename()},null,2));console.log('FULL FLOW PASS: 20 tasks; report; core; PNG; reload; preview isolation');
}catch(error){process.exitCode=1;console.error('FLOW ERROR',error.stack);console.error('SAVED PREVIEW NOTE',(await readSaved(page))?.preview?.inquiry?.records?.['M5-4']?.note);console.error('INPUT',await page.getByLabel('내 소개 문장',{exact:true}).inputValue().catch(()=>''));await page.screenshot({timeout:10000,path:'.tmp/full-flow-failure.png'});console.error((await page.locator('body').innerText()).slice(0,5000));await writeFile('.tmp/full-flow.json',JSON.stringify({status:'FAIL',error:error.message,errors,completed:checks},null,2));}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);process.exit(process.exitCode||0);}
