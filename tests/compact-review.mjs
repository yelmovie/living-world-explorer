import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {button,launchBrowser,navigate} from './browser.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5378';
const reference=process.env.REVIEW_COMPARE;
const output=process.env.REVIEW_OUTPUT||'.tmp/compact-review';
// The full flow test generates this anonymous, completed learner fixture.
const fixture=process.env.REVIEW_STATE||'.tmp/learner20-state.json';
const stages=['균류','물 한 방울','세균','우리 생활','생물의 작용'];
const viewports=[[1875,846],[1024,768],[915,412],[390,844]];
await mkdir(output,{recursive:true});
const browser=await launchBrowser();

function size(locator){
  return locator.evaluate(node=>({width:node.offsetWidth,height:node.offsetHeight}));
}

async function openReview(origin,width,height){
  const storageState=JSON.parse(await readFile(fixture,'utf8'));
  assert.equal(storageState.cookies.length,0);
  assert.equal(storageState.origins.length,1);
  storageState.origins[0].origin=origin;
  const context=await browser.newContext({
    viewport:{width,height},hasTouch:true,storageState,serviceWorkers:'block',
    extraHTTPHeaders:{'Cache-Control':'no-cache'},
  });
  const page=await context.newPage();
  page.setDefaultTimeout(9000);
  await navigate(page,origin,'final-report');
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.discovery-review-card img').first().evaluate(image=>image.decode());
  return {context,page};
}

const results=[];
try{
  for(const [width,height] of viewports){
    const {context,page}=await openReview(base,width,height);
    try{
      const cards=page.locator('.discovery-review-card');
      const tabs=page.locator('.report-tabs');
      const dialog=page.locator('.review-record-dialog[open]');
      assert.equal(await cards.count(),4);
      assert.equal(await cards.evaluateAll(list=>list.some(card=>card.scrollWidth>card.clientWidth+1)),false);
      assert.ok(await button(page,'발견을 코어에 연결').isEnabled());

      await page.screenshot({path:output+'/report-'+width+'.png'});
      await button(page,'균류의 공통점 · 내 기록 크게 보기').tap();
      const detail=await size(dialog);
      assert.ok(detail.width<=Math.min(572,width-20)+1,JSON.stringify(detail));
      assert.ok(detail.height<=Math.min(330,height-20),JSON.stringify(detail));
      assert.equal(await dialog.evaluate(node=>getComputedStyle(node).backdropFilter),'none');
      assert.equal(await dialog.locator('.album-tile').count(),1);
      assert.match(await dialog.locator('.album-tile').innerText(),/버섯과 곰팡이/);
      assert.ok(await dialog.getByRole('button',{name:'닫기',exact:true}).isVisible());

      await dialog.evaluate(async node=>{
        await Promise.all(Array.from(node.querySelectorAll('img'),image=>image.decode()));
        await Promise.all(node.getAnimations().map(animation=>animation.finished));
      });
      await page.screenshot({path:output+'/record-'+width+'.png'});
      await dialog.getByRole('button',{name:'포자 뜻 보기',exact:true}).tap();
      const term=page.getByRole('dialog',{name:'포자 알아보기'});
      await term.getByRole('button',{name:'닫기',exact:true}).tap();
      await dialog.locator('.evidence-details summary').tap();
      assert.equal(await dialog.locator('details[open]').count(),1);
      await dialog.getByRole('button',{name:'닫기',exact:true}).tap();
      assert.equal(await dialog.count(),0);
      await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='균류의 공통점 · 내 기록 크게 보기');

      for(const stage of stages){
        await tabs.getByRole('button',{name:stage,exact:true}).tap();
        for(const card of await cards.all()){
          assert.ok(await card.isEnabled());
          await card.tap();
          assert.equal(await dialog.locator('.album-tile').count(),1);
          assert.equal(await dialog.evaluate(node=>node.scrollWidth>node.clientWidth+1),false);
          await dialog.getByRole('button',{name:'닫기',exact:true}).tap();
        }
      }
      await button(page,'생활 사건 발표').tap();
      const presentation=page.getByRole('dialog',{name:'우리 생활 속 생물'});
      assert.ok(await presentation.getByLabel('조사한 사건').isVisible());
      await presentation.getByRole('button',{name:'닫기',exact:true}).tap();
      await button(page,'발견을 코어에 연결').tap();
      await page.locator('.screen-core-restoration').waitFor();

      const result={width,height,detail,individualRecords:20,core:true,presentation:true};
      if(reference&&width===1875){
        const old=await openReview(reference,width,height);
        try{
          await old.page.screenshot({path:output+'/before-report.png'});
          await button(old.page,'균류의 공통점 · 내 기록 크게 보기').tap();
          result.before=await size(old.page.locator('.review-record-dialog[open]'));
          assert.ok(detail.width*detail.height<result.before.width*result.before.height*.45);
          await old.page.screenshot({path:output+'/before-record.png',animations:'disabled'});
        }finally{await old.context.close();}
      }
      results.push(result);
      console.log(JSON.stringify(result));
    }finally{await context.close();}
  }
  await writeFile(output+'/summary.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
