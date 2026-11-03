import assert from 'node:assert/strict';
import {button,launchBrowser,navigate,teacherTools,waitSaved} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await navigate(page,base,'fungi-field');
  await page.locator('.inquiry-loading').waitFor({state:'detached'});
  const original=(await waitSaved(page)).learner;
  const settings=await teacherTools(page);
  await settings.getByRole('button',{name:'관리자 전체 해금'}).click();
  assert.ok(await settings.getByRole('button',{name:'시연 기록 초기화'}).isVisible());
  await settings.getByRole('button',{name:'닫기',exact:true}).click();

  let plays=0;
  for(const task of inquiryTasks){
    const [entry,exit]=stageRoutes[Number(task.stage.slice(1))-1];
    await navigate(page,base,task.order<=2?entry:exit);
    await page.getByRole('button',{name:new RegExp('^'+task.order+'번째 발견:')}).click();
    await page.locator('.inquiry-loading').waitFor({state:'detached'});
    const start=page.getByRole('button',{name:/자동재생/});
    if(!['microscope','sample','track','timeline'].includes(task.kind)){
      assert.equal(await start.count(),0,task.id+' is a learner decision');
      continue;
    }
    const stop=page.getByRole('button',{name:/멈추기/});
    const initial=(await waitSaved(page)).preview.inquiry.records[task.id];
    await start.click();
    assert.ok(await stop.isVisible());
    assert.ok(await button(page,'발견 기록하기').isDisabled());
    await stop.click();
    assert.deepEqual((await waitSaved(page)).preview.inquiry.records[task.id],initial,'stop must restore '+task.id);
    if(task.kind==='sample')await button(page,'물가 가까이').click();
    await start.click();
    await stop.waitFor({state:'hidden',timeout:18000});
    const result=(await waitSaved(page)).preview.inquiry.records[task.id];
    assert.equal(result.completedAt,undefined);
    assert.equal(result.capture,false);
    assert.deepEqual(result.marks,[]);
    assert.deepEqual(result.pins,initial.pins);
    assert.deepEqual(result.opened,initial.opened);
    if(task.id==='M1-3')assert.equal(result.focus,initial.focus,'mold focusing stays with the learner');
    if(task.id==='M1-2'){
      assert.equal(result.level,1,'wait at the gill decision');
      assert.equal(await start.count(),0);
    }
    if(task.kind==='sample'){
      assert.equal(result.assignments.site,'edge');
      assert.equal(result.sequence,3);
      assert.equal(await start.count(),0);
    }
    plays++;
    console.log(task.id+' optional playback and handoff passed');
  }
  assert.equal(plays,7);
  await navigate(page,base,'final-report');
  assert.ok(await button(page,'이 기록 확인').isDisabled());
  assert.ok(await button(page,'발견을 코어에 연결').isDisabled());
  await page.reload();
  await page.locator('.screen-fungi-field').waitFor();
  assert.equal(JSON.stringify((await waitSaved(page)).learner),JSON.stringify(original));
  assert.deepEqual(errors,[]);
  console.log('PASS: 7 optional demonstrations, 13 learner-only tasks, teacher reload isolation');
}finally{await browser.close();}
