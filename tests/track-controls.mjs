import assert from 'node:assert/strict';
import {launchBrowser,button,navigate,teacherTools,setRange} from './browser.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const browser=await launchBrowser();
try {
 for(const [width,height] of [[915,412],[830,515],[375,812],[1024,768]]) {
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});
  page.setDefaultTimeout(10000);
  await navigate(page,base,'nature-map');
  const settings=await teacherTools(page);
  await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
  await settings.getByRole('button',{name:'닫기',exact:true}).click();
  await navigate(page,base,'protist-observation');
  await page.getByRole('button',{name:/^3번째 발견:/}).click();
  await page.locator('.inquiry-loading').waitFor({state:'detached'});
  await setRange(page,'관찰 시점',5);
  await page.getByRole('button',{name:/^B 고정/}).click();
  await button(page,'현미경으로 움직임의 비밀 찾기').click();
  await button(page,'몸 둘레').click();
  await button(page,'표시 되돌리기').click();
  assert.ok(await button(page,'발견 기록하기').isDisabled());
  await button(page,'몸 둘레').click();
  assert.ok(await button(page,'발견 기록하기').isEnabled());
  await button(page,'발견 기록하기').click();
  await page.locator('.discovery-dialog').waitFor();
  console.log(`${width}×${height}: comparison, microscope, cilia, undo and record are reachable`);
  await page.close();
 }
} finally {
 await browser.close();
}
