// 2026-11-17: plays the four M3 bacteria lab games (src/renderers/germ-games.ts) the way a learner would.
// `wrong` adds one mistaken move per game first, which must get a Toto hint and store nothing wrong.
const centre=async l=>{const b=await l.boundingBox();return [b.x+b.width/2,b.y+b.height/2];};
const toto=page=>page.locator('.toto-bubble:not([hidden]) .toto-bubble-text').innerText().catch(()=>'');
async function rub(page,target,{dx=70,times=8}={}){const [x,y]=await centre(target);await page.mouse.move(x,y);await page.mouse.down();for(let i=0;i<times;i++)await page.mouse.move(x+(i%2?dx:-dx),y+(i%3-1)*12,{steps:4});await page.mouse.up();}

export async function playGerm(page,id,{wrong=false}={}){
 const hints=[];
 if(id==='M3-1'){
  await page.locator('[data-guess="100"]').click();
  const more=page.getByRole('button',{name:'+ 키우기',exact:true});
  // 2026-11-18: each press moves one whole power (×1 → ×10 → ×100 → ×1000), and the button turns off at ×1000.
  for(let i=0;i<3;i++){await more.click();await page.waitForTimeout(40);}
  await page.waitForFunction(()=>document.querySelector('.zoom-power')?.textContent==='×1,000');
  const v=page.locator('.zoom-view');const b=await v.boundingBox();
  if(wrong){await page.mouse.click(b.x+b.width*.1,b.y+b.height*.5);hints.push(await toto(page));}
  // Upper right: clear of Toto's bubble, which sits low on the left on short screens.
  await page.mouse.click(b.x+b.width*.78,b.y+b.height*.28);
 }
 if(id==='M3-2'){
  const jarFor={round:'round',chain:'round',rod:'rod',tail:'rod',spiral:'spiral'};
  if(wrong){await page.locator('.catch-bug[data-bug=chain]').first().evaluate(n=>n.click());await page.locator('[data-jar=rod]').click();hints.push(await toto(page));}
  let dragged=false;
  for(let guard=0;guard<30;guard++){
   const counts=await page.locator('.catch-jar').evaluateAll(n=>Object.fromEntries(n.map(j=>[j.dataset.jar,Number(j.querySelector('.jar-count').textContent.split('/')[0])])));
   const need=Object.keys(counts).find(k=>counts[k]<2);if(!need)break;
   const kinds=Object.entries(jarFor).filter(([,j])=>j===need).map(([k])=>k);
   const bug=page.locator(kinds.map(k=>`.catch-bug[data-bug=${k}]`).join(',')).first();
   // Bacteria keep swimming: tap one first (a picked bug holds still), then drag it or tap its jar.
   await bug.evaluate(n=>n.click());
   if(!dragged){const [x,y]=await centre(bug);const [jx,jy]=await centre(page.locator(`[data-jar=${need}]`));await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(jx,jy,{steps:10});await page.mouse.up();dragged=true;}
   else await page.locator(`[data-jar=${need}]`).click();
   await page.waitForTimeout(120);
  }
 }
 if(id==='M3-3'){
  for(const place of ['hand','soil','pond']){
   await page.locator(`.culture-place[data-place=${place}]`).click();await page.locator('.culture-detail:not([hidden])').waitFor();const photo=page.locator('.culture-detail-photo'),pb=await photo.boundingBox();await rub(page,photo,{dx:Math.min(70,pb.width*.28),times:12});await page.waitForTimeout(150);
   if(wrong&&place==='hand'){const d=page.locator('.culture-dish[data-dish=hand]');const [x,y]=await centre(d);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+10,y,{steps:2});await page.mouse.up();hints.push(await toto(page));}
   await rub(page,page.locator(`.culture-dish[data-dish=${place}]`),{dx:45,times:8});await page.waitForTimeout(150);
  }
  await page.locator('.culture-days').fill('3');await page.waitForTimeout(200);
  if(wrong){await page.locator('[data-conclusion=soil]').click();hints.push(await toto(page));}
  await page.locator('[data-conclusion=many]').click();
 }
 if(id==='M3-4'){
  // A board finished earlier (same preview, another screen size) only needs its sentence checked.
  if(await page.locator('.exhibit-shelf.is-solved').count()){for(const [blank,option] of [['size','small'],['shape','many'],['place','many']])await page.locator(`[data-blank=${blank}][data-option=${option}]`).click();return hints;}
  const put=async(specimen,slot)=>{await page.locator(`.exhibit-tray .exhibit-card[data-specimen=${specimen}]`).click();await page.locator(`.exhibit-slot[data-slot="${slot}"]`).click();};
  if(wrong){await put('bacteria',0);await put('mushroom',1);await put('paramecium',2);hints.push(await toto(page));for(const s of [0,1,2])await page.locator(`.exhibit-slot[data-slot="${s}"]`).click();}
  await put('mushroom',0);await put('paramecium',1);await put('bacteria',2);
  if(wrong){await page.locator('[data-blank=size][data-option=big]').click();hints.push(await toto(page));}
  for(const [blank,option] of [['size','small'],['shape','many'],['place','many']])await page.locator(`[data-blank=${blank}][data-option=${option}]`).click();
 }
 return hints;
}
