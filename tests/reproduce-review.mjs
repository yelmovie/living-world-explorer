import {launchBrowser,button,navigate,teacherTools,setRange,choose,readSaved} from './browser.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:1024,height:768}});
const base=process.env.APP_URL||'http://127.0.0.1:5176',btn=n=>button(page,n),results={};
async function mark(x,y){await btn('버튼으로 조작').click();await setRange(page,'표시 가로 위치',x);await setRange(page,'표시 세로 위치',y);await btn('이 위치 표시').click();await page.getByRole('dialog').last().getByRole('button',{name:'닫기',exact:true}).click();}
async function task(route,order){await navigate(page,base,route);await page.getByRole('button',{name:new RegExp(order+'번째 발견:')}).click();}
try{
 await navigate(page,base,'main');const settings=await teacherTools(page);await settings.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await settings.getByRole('button',{name:'시연용 예시 기록 불러오기',exact:true}).click();await settings.getByRole('button',{name:'닫기',exact:true}).click();
 await task('fungi-microscope',2);await btn('표시 되돌리기').click();await mark(.5,.24);await btn('기록 확인하고 계속').click();results.upperGillsRejected=await page.locator('.discovery-dialog').count()===0;results.gillFeedback=await page.locator('.inquiry-feedback').innerText();await page.screenshot({path:'.tmp/review-before/mushroom.png'});
 await task('impact-investigation',1);await setRange(page,'관찰 순서',0);await page.getByRole('button',{name:/^이전 고정/}).click();await setRange(page,'관찰 순서',3);await page.getByRole('button',{name:/^이후 고정/}).click();await mark(.35,.48);await btn('기록 확인하고 계속').click();results.cleanBreadAccepted=await page.locator('.discovery-dialog').count()>0;await page.getByRole('dialog').last().getByRole('button',{name:'다음 발견으로',exact:true}).click();
 await task('solution-assembly',1);await choose(page,'나의 예상','중간에 멈출 것 같아요');await btn('예상과 달라요').click();await btn('기록 확인하고 계속').click();results.postRunPredictionAccepted=await page.locator('.discovery-dialog').count()>0;await btn('다음 발견으로').click();
 await task('solution-run',4);await page.getByLabel('내 소개 문장',{exact:true}).fill('재탐구에서 새롭게 정리한 근거');await btn('기록 확인하고 계속').click();await btn('연구소 복구하기').click();await page.waitForTimeout(400);const s=await readSaved(page);results.reinquiryDraft=s.preview.inquiry.records['M5-4'].note;results.albumNote=s.preview.evidence.M5.inquiry.records['M5-4'].note;results.staleAlbum=results.reinquiryDraft!==results.albumNote;
 await navigate(page,base,'final-report');await page.getByRole('button',{name:'생명과학 작업실',exact:true}).click();results.paragraphWidths=await page.locator('.album-tile p').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().width)));await page.screenshot({path:'.tmp/review-before/report.png'});
 console.log(JSON.stringify(results,null,2));await writeFile('.tmp/review-before/reproduction.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
