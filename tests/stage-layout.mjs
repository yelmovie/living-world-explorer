import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,button,navigate,teacherTools,linkCard,linkTarget,setRange,waitSaved} from './browser.mjs';
import {inquiryTasks,stageRoutes} from './curriculum.mjs';

const base=process.env.APP_URL||'http://127.0.0.1:5176';
const out=process.env.STAGE_LAYOUT_OUT||'.tmp/stage-layout';
const sizes=process.env.STAGE_LAYOUT_SIZES?JSON.parse(process.env.STAGE_LAYOUT_SIZES):[[1920,1080],[1366,768],[1280,800],[1280,720],[1024,768],[1024,600],[915,412],[830,515],[375,812]];
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
const errors=[],failures=[],screens=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
page.on('request',r=>{
 const url=new URL(r.url());
 if(/^https?:$/.test(url.protocol)&&url.origin!==new URL(base).origin)errors.push('Unexpected origin: '+url.origin);
});
const open=async(task)=>{
 await navigate(page,base,stageRoutes[Number(task.stage.slice(1))-1][task.order>2?1:0]);
 await page.getByRole('button',{name:new RegExp('^'+task.order+'번째 발견:')}).click();
 await page.getByRole('heading',{name:task.title,exact:true}).waitFor();
 await page.locator('.inquiry-loading').waitFor({state:'detached'});

};
const visible=locator=>locator.evaluate(n=>{
 const r=n.getBoundingClientRect();
 return r.width>0&&r.height>0&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
});
try{
 await mkdir(out,{recursive:true});
 await navigate(page,base,'nature-map');
 const dialog=await teacherTools(page);
 await dialog.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  for(const task of inquiryTasks){
   await open(task);
   const layout=await page.evaluate(()=>{
    const rect=n=>n.getBoundingClientRect(), viewport=n=>{const r=rect(n);return r.top>=-1&&r.bottom<=innerHeight+1&&r.left>=-1&&r.right<=innerWidth+1;};
    const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
    const scrollable=node=>{for(let p=node.parentElement;p;p=p.parentElement)if(/auto|scroll/.test(getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight+1)return true;return false;};
    const issues=[],hud=[...document.querySelectorAll('.toolbar button')];
    const title=document.querySelector('.expedition-header'),view=document.querySelector('.expedition-canvas-host');
    const visual=rect(view.querySelector('.link-board,canvas')||view);
    if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal overflow');
    for(const n of hud)if(!viewport(n)||hud.some(b=>n!==b&&overlap(rect(n),rect(b))))issues.push('toolbar: '+n.textContent);
    if(hud.some(b=>overlap(rect(b),rect(title))))issues.push('heading covered');
    if(visual.width<280||visual.height<152)issues.push('observation too small');
    const current=document.querySelector('.activity-stepper .current');
    if(current){
     const style=getComputedStyle(current);
     const luminance=color=>{
      const [r,g,b]=color.match(/[\d.]+/g).slice(0,3).map(value=>{
       const channel=Number(value)/255;
       return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
      });
      return .2126*r+.7152*g+.0722*b;
     };
     const foreground=luminance(style.color),background=luminance(style.backgroundColor);
     if((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)<3)issues.push('current activity number contrast');
    }
    for(const caption of view.querySelectorAll('.observation-caption,.observation-disclosure')){
     const bounds=rect(caption),host=rect(view);
     if(bounds.top<host.top-1||bounds.bottom>host.bottom+1)issues.push('clipped observation caption');
    }
    const compact=innerWidth<=850;
    if(!compact)for(const n of document.querySelectorAll('.expedition-footer button,.activity-stepper button')){
     if(!viewport(n)||rect(n).height<44||rect(n).width<44)issues.push('navigation: '+n.textContent);
    }
    // Measure the rendered glyphs, not just the button boxes: a passing grid can
    // still put a completion mark or an illustration over a long Korean label.
    const glyphs=node=>{
     const ranges=[],walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){
      if(!walker.currentNode.textContent.trim())continue;
      const range=document.createRange();range.selectNodeContents(walker.currentNode);
      ranges.push(...Array.from(range.getClientRects()).filter(r=>r.width&&r.height));
     }
     return ranges;
    };
    for(const node of document.querySelectorAll('.expedition-header,.link-card,.link-target,.expedition-tools .button,.level-steps .button')){
     if(!node.getClientRects().length)continue;
     const box=rect(node),text=glyphs(node);
     if(text.some(r=>r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2))issues.push('label outside: '+node.textContent.trim());
     for(const icon of node.querySelectorAll('img,svg,.link-mark')){
      if(!icon.getClientRects().length||getComputedStyle(icon).visibility==='hidden')continue;
      const visual=rect(icon);
      for(const label of node.querySelectorAll('.link-name,.link-target-name,h2,.eyebrow')){
       if(icon.contains(label)||label.contains(icon))continue;
       if(glyphs(label).some(r=>overlap(r,visual)))issues.push('image covers label: '+label.textContent);
      }
     }
    }
    for(const node of document.querySelectorAll('.link-name,.link-target-name')){
     if(node.clientHeight&&node.scrollHeight>node.clientHeight+2&&/hidden|clip/.test(getComputedStyle(node).overflowY))issues.push('clipped label: '+node.textContent);
    }
    const positions=Array.from(document.querySelectorAll('#app,.link-board')).map(n=>[n,n.scrollTop,n.scrollLeft]);
    for(const node of document.querySelectorAll('.link-card,.link-target')){
     const canScroll=scrollable(node);
     if(canScroll)node.scrollIntoView({behavior:'instant',block:'center',inline:'nearest'});
     const r=rect(node);
     if(r.width<48||r.height<48)issues.push('small touch target: '+node.textContent.trim());
     if(!viewport(node)||!node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))issues.push('covered card: '+node.textContent.trim());
     if(!canScroll&&Array.from(document.querySelectorAll('.expedition-footer button')).some(b=>overlap(r,rect(b))))issues.push('card touches navigation: '+node.textContent.trim());
    }
    for(const [node,top,left] of positions){node.scrollTop=top;node.scrollLeft=left;}
    return {issues:[...new Set(issues)],view:{width:Math.round(visual.width),height:Math.round(visual.height)}};
   });
   if(layout.issues.length)failures.push({task:task.id,width,height,...layout});
   screens.push({task:task.id,width,height,view:layout.view});
   if([412,800,812].includes(height))await page.screenshot({path:out+'/'+width+'-'+task.id+'.png'});
   const sourceCard=page.locator('.link-card').first();
   if(await sourceCard.count()){
    await sourceCard.click();
    const nextAction=page.locator('.source-preview .source-next');
    assert.ok(await nextAction.isVisible(),task.id+' selected source keeps next action visible');
    assert.ok(await visible(nextAction),task.id+' source action can be seen at '+width+'x'+height);
   }
  }
  console.log(width+'x'+height+' · 20 activities');
 }
 await page.setViewportSize({width:915,height:412});
 await open(inquiryTasks.find(t=>t.id==='M3-4'));
 await button(page,'모든 세균이 해로울 것 같아요').click();
 for(const label of ['새 자료: 요구르트 만들기','새 자료: 상한 우유']){await button(page,label).click();await button(page,'자료 확인했어요').click();}
 await page.getByRole('button',{name:'모든 세균이 해로워요',exact:true}).click();
 await button(page,'상한 우유').click();
 await button(page,'발견 기록하기').click();
 const feedback=page.locator('.inquiry-feedback');
 assert.match(await feedback.innerText(),/근거/);
 assert.equal(await page.getByRole('button',{name:'상한 우유',exact:true}).isEnabled(),true);
 if(!await visible(feedback))failures.push({task:'M3-4',issues:['retry feedback out of view']});
 await page.screenshot({path:out+'/915-M3-4-feedback.png'});
 // An incorrect visual link can be corrected with two keyboard activations.
 await open(inquiryTasks[0]);
 await linkCard(page,'log').press('Enter');
 await linkTarget(page,'mold').press('Enter');
 await page.locator('.link-line.is-wrong').waitFor();
 assert.match(await linkCard(page,'log').getAttribute('aria-label'),/다시 확인|연결됨/);
 await linkCard(page,'log').press('Enter');
 await linkTarget(page,'mushroom').press('Enter');
 await page.locator('.link-line.is-right').waitFor({state:'attached'});
 assert.match(await linkCard(page,'log').getAttribute('aria-label'),/확인 완료/);
 await page.screenshot({path:out+'/915-M1-1-connected.png'});
 // A pinned comparison and correct mark still need a source; it stays read when the task is revisited.
 await open(inquiryTasks.find(t=>t.id==='M4-1'));
 await page.getByRole('button',{name:/^이후 고정/}).click();
 await button(page,'버튼으로 조작').click();
 await setRange(page,'표시 가로 위치',.49);await setRange(page,'표시 세로 위치',.4);
 await button(page,'이 위치 표시').click();
 await page.getByRole('dialog').getByRole('button',{name:'닫기',exact:true}).click();
 await button(page,'발견 기록하기').click();
 assert.match(await feedback.innerText(),/조사 자료/);
 assert.equal(await page.locator('.discovery-dialog').count(),0);
 await page.getByText('관련 조사 자료 읽기',{exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'닫기',exact:true}).click();
 await page.locator('.expedition-shell.record-ready').waitFor();
 await waitSaved(page,s=>s.preview.inquiry.records['M4-1'].opened.includes('process'));
 await open(inquiryTasks.find(t=>t.id==='M5-4'));
 await button(page,'요구르트').click();
 await button(page,'유산균의 작용').press('Enter');
 assert.equal(await page.getByLabel('내 소개 문장',{exact:true}).evaluate(n=>n===document.activeElement),true);
 await page.getByLabel('내 소개 문장',{exact:true}).fill('요구르트에 쓰인 유산균의 작용을 소개해요.');
 await button(page,'소개할 사례 바꾸기').click();
 await page.getByRole('dialog').getByRole('button',{name:'빵 반죽',exact:true}).click();
 await button(page,'효모의 작용').click();
 assert.match(await page.getByLabel('내 소개 문장',{exact:true}).inputValue(),/효모/);
 // Retain the student's viewport controls on a compact stage change.
 await page.setViewportSize({width:830,height:515});
 await page.locator('.activity-stepper button').first().click();
 assert.equal(await page.locator('#app').evaluate(n=>n.scrollTop),0);
 assert.ok(await visible(button(page,'설정')));
 await page.emulateMedia({reducedMotion:'reduce'});
 await button(page,'홈').click();
 assert.equal(await page.locator('html').getAttribute('class'),'reduced');
}finally{
 await writeFile(out+'/results.json',JSON.stringify({screens,failures,errors},null,2));
 await browser.close();
}
assert.deepEqual(errors,[]);
assert.deepEqual(failures,[]);
console.log('PASS: '+screens.length+' activity screens; visible retry feedback; keyboard links; research gate; case switching; fold navigation; reduced motion');
