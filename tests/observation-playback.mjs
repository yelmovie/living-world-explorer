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
    if(task.kind==='sample'){assert.equal(await start.count(),0,'choose a sampling site first');await button(page,'물가 가까이').click();}
    const stop=button(page,'직접 해보기');
    const initial=(await waitSaved(page)).preview.inquiry.records[task.id];
    await start.click();
    await stop.waitFor({state:'visible'});
    if(task.kind==='microscope'){
      const caption=await page.locator('.observation-caption').innerText();
      const feature={mushroom:'주름',mold:'솜털 같은 실',spirogyra:'초록 실'}[task.organism];
      assert.ok(caption.includes(feature),task.id+' loupe caption matches the specimen');
      if(task.organism!=='mushroom')assert.ok(!caption.includes('주름'));
    }
    assert.ok(await button(page,'발견 기록하기').isDisabled());
    await stop.click();
    assert.deepEqual((await waitSaved(page)).preview.inquiry.records[task.id],initial,'stop must restore '+task.id);
    await page.getByLabel('재생 속도',{exact:true}).selectOption('2');
    await start.click();
    await stop.waitFor({state:'hidden',timeout:18000});
    const result=(await waitSaved(page)).preview.inquiry.records[task.id];
    assert.equal(result.completedAt,undefined);
    assert.equal(result.capture,false);
    assert.deepEqual(result.marks,[]);
    assert.deepEqual(result.pins,initial.pins);
    assert.deepEqual(result.opened,initial.opened);
    if(task.kind==='microscope'){
      assert.equal(result.level,2,'automatic observation prepares the microscope');
      assert.equal(result.focus,65);
      assert.equal(result.capture,false,'the learner still takes the observation photo');
    }
    if(task.kind==='sample'){
      assert.equal(result.assignments.site,'edge');
      assert.equal(result.sequence,3);
      assert.equal(await start.isVisible(),false);
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
