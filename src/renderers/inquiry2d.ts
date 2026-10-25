import Phaser from 'phaser';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {canvas,draw} from '../draw';
import {invalidateRun} from '../inquiry-evaluate';
import {playEffect} from '../audio';
import {inquiryArt,artTime,artKey,artFrame} from '../artAssets';
import {addMark,markHint,viewToImage} from '../observation';
type Hooks={changed:()=>void;open:(id:string)=>void;feedback:(text:string)=>void;ready:(ok:boolean)=>void};
const WIDTH=960,HEIGHT=540;
export function mountInquiry(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:Hooks,reduced:boolean){
 let refresh=()=>{};let play=false;let disposed=false;let armed='';let reveal:number|undefined;let simulating=false;let scene:Phaser.Scene|undefined;let inputObjects:Phaser.GameObjects.GameObject[]=[];
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 // Scene colours follow the DOM tokens (styles.css stage layer), so one token edit restyles both.
 const css=(name:string,fallback:number)=>{const v=getComputedStyle(host).getPropertyValue(name).trim();return /^#[0-9a-f]{6}$/i.test(v)?parseInt(v.slice(1),16):fallback;};
 const tone={accent:css('--stage-accent',0x557a3f),soft:css('--stage-soft',0xe4edd5),paper:css('--paper-face',0xfffaf0),line:css('--paper-line',0xe6d8bc),brass:css('--brass-soft',0xecd08f),pick:0xd39a3f,shade:0x22312a,ink:'#1f3f31'};
 const LENS_HOLE=.3;// hole radius / width of ui/microscope-frame.webp (scripts/ui-props.mjs)
 class Inquiry extends Phaser.Scene{
  trackSurface?:{canvas:HTMLCanvasElement;texture:Phaser.Textures.CanvasTexture};
  trackElapsed=0;
  failed=false;
  preload(){this.load.on('loaderror',(file:Phaser.Loader.File)=>{if(!file.key.startsWith('ui-'))this.failed=true;});const needed=new Set([...task.items.map(artKey),task.organism,task.kind==='sample'?'water':undefined]);for(const art of needed)if(art&&inquiryArt[art]){const asset=inquiryArt[art];if(asset.frames)asset.frames.forEach((src,i)=>this.load.image(`art-${art}-${i}`,src));else this.load.image(`art-${art}`,asset.src);}
   // Decorative props are optional: a missing prop falls back to the drawn card, never blocks the activity.
   const props=['tape',...task.kind==='microscope'?['microscope-frame']:[],...task.kind==='sample'?['dropper','slide','water-drop']:[],...['collect','connect','sort'].includes(task.kind)?['notebook']:[]];for(const p of props)this.load.image(`ui-${p}`,`assets/ui/${p}.webp`);}
  create(){scene=this;if(this.failed){hooks.ready(false);return;}refresh=()=>this.paint();this.paint();hooks.ready(true);}
  wipe(){this.trackSurface=undefined;this.trackElapsed=0;inputObjects=[];this.children.removeAll(true);for(const name of this.textures.getTextureKeys())if(name.startsWith('plate-'))this.textures.remove(name);}
  text(x:number,y:number,text:string,size=23,color='#234b3c',width=330){return this.add.text(x,y,text,{fontFamily:'Lab Display, Malgun Gothic',fontSize:`${Math.max(28,size)}px`,color,align:'center',wordWrap:{width,useAdvancedWrap:true},lineSpacing:4}).setOrigin(.5);}
  // Rounded pill behind short captions so they read over any photo.
  caption(x:number,y:number,label:string,size=28,color=tone.ink,width=850){const t=this.text(x,y,label,size,color,width);const w=t.width+30,h=t.height+12,r=Math.min(22,h/2),g=this.add.graphics();g.fillStyle(tone.shade,.14).fillRoundedRect(x-w/2+2,y-h/2+4,w,h,r);g.fillStyle(tone.paper,.97).fillRoundedRect(x-w/2,y-h/2,w,h,r);g.lineStyle(2,tone.line,1).strokeRoundedRect(x-w/2,y-h/2,w,h,r);this.children.bringToTop(t);return t;}
  // Paper card: soft shadow + rounded face. Redrawing the same Graphics restyles armed/linked states in place.
  cardShape(g:Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,{fill=tone.paper,stroke=tone.line,width=2,radius=18,alpha=1}:{fill?:number;stroke?:number;width?:number;radius?:number;alpha?:number}={}){g.clear();g.fillStyle(tone.shade,.16*alpha).fillRoundedRect(x-w/2+3,y-h/2+7,w,h,radius);g.fillStyle(fill,alpha).fillRoundedRect(x-w/2,y-h/2,w,h,radius);g.lineStyle(width,stroke,1).strokeRoundedRect(x-w/2,y-h/2,w,h,radius);return g;}
  card(x:number,y:number,w:number,h:number,style:Parameters<Inquiry['cardShape']>[5]={}){return this.cardShape(this.add.graphics(),x,y,w,h,style);}
  tape(x:number,y:number,w=92,angle=-4){return this.textures.exists('ui-tape')?this.add.image(x,y,'ui-tape').setDisplaySize(w,w*.21).setAngle(angle).setAlpha(.95):undefined;}
  badge(x:number,y:number){const g=this.add.graphics();g.fillStyle(tone.accent,1).fillCircle(x,y,16);g.lineStyle(3,0xffffff,1).strokeCircle(x,y,16);return [g,this.add.text(x,y,'✓',{fontFamily:'Lab Display, Malgun Gothic',fontSize:'20px',color:'#ffffff'}).setOrigin(.5)];}
  thumb(x:number,y:number,it:InquiryTask['items'][number]){const kind=artKey(it);const key=kind&&inquiryArt[kind]?.frames?`art-${kind}-${artFrame(artTime(kind,it.detail,it.id))}`:`art-${kind}`;const g=this.add.graphics();g.fillStyle(tone.shade,.2).fillRoundedRect(x-21,y-15,44,34,5);g.fillStyle(0xffffff,1).fillRoundedRect(x-22,y-17,44,34,5);g.lineStyle(2,tone.accent,1).strokeRoundedRect(x-22,y-17,44,34,5);if(this.textures.exists(key)){const pic=this.add.image(x,y,key);pic.setScale(Math.min(38/pic.width,28/pic.height));}else this.add.text(x,y,'?',{fontFamily:'Lab Display, Malgun Gothic',fontSize:'22px',color:tone.ink}).setOrigin(.5);}
  plate(x:number,y:number,w:number,h:number,label:string,fill=tone.paper){const box=this.card(x,y,w,h,{fill});if(label)this.text(x,y,label,22,tone.ink,w-20);return box;}
  art(x:number,y:number,w:number,h:number,kind:string,options:Parameters<typeof draw>[2]&{fit?:'contain'}={}){
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(options.time)}`:`art-${kind}`;
   const image=this.textures.exists(name)?this.textures.get(name).getSourceImage() as CanvasImageSource:undefined;
   const source=image as {width:number;height:number}|undefined;
   const c=options.fit==='contain'?canvas(640,Math.round(640*(source?.height||360)/(source?.width||640))):canvas(Math.round(w),Math.round(h));
   draw(c,kind,{...options,image,markerSpace:'world'});const key=`plate-${crypto.randomUUID()}`;const texture=this.textures.addCanvas(key,c)!;if(task.kind==='track'&&kind==='paramecium')this.trackSurface={canvas:c,texture};const picture=this.add.image(x,y,key);if(options.fit==='contain')picture.setScale(Math.min(w/c.width,h/c.height));return picture;}
  commit(){playEffect(task.kind==='sample'?'water':'click');hooks.changed();this.paint();}
  pauseGuard(){return blocked()||simulating;}
  paint(){if(disposed)return;this.wipe();
   if(['collect','connect','sort'].includes(task.kind)){this.paintConnections();return;}
   if(task.kind==='microscope'||task.kind==='track'||task.kind==='timeline'){this.paintObservation();return;}
   if(task.kind==='sample'){this.paintSampling();return;}
   if(task.kind==='build'){this.paintBuild();return;}
   if(task.kind==='review'){this.paintReview();return;}
   this.paintPublish();
  }
  paintConnections(){
   const n=task.items.length;const columns=n>3?2:1;const itemWidth=columns===2?262:390;const rows=Math.ceil(n/columns);const rowH=Math.min(200,430/rows);
   const notebook=task.targets.length<=2&&this.textures.exists('ui-notebook');const targetWidth=task.targets.length>2?200:250,targetHeight=task.targets.length>2?112:186;const targetX=task.targets.length>2?827:805;
   const anchors=task.targets.map((t,i)=>({id:t.id,x:targetX,y:90+(i+.5)*(400/task.targets.length)}));
   // Drop targets glow while a card is armed or dragged over them (tap → tap works the same as drag).
   const glows=new Map<string,Phaser.GameObjects.Graphics>();
   anchors.forEach(a=>{const info=task.targets.find(t=>t.id===a.id)!;const glow=this.add.graphics();glow.lineStyle(6,tone.pick,.9).strokeRoundedRect(a.x-targetWidth/2-8,a.y-targetHeight/2-8,targetWidth+16,targetHeight+16,24);glow.setVisible(!!armed);glows.set(a.id,glow);
    const filed=task.items.filter(it=>record.assignments[it.id]===a.id);const label=filed.length?a.y-24:a.y;
    if(notebook){const pic=this.add.image(a.x,a.y,'ui-notebook');pic.setScale(Math.min(targetWidth/pic.width,targetHeight/pic.height));this.caption(a.x,filed.length?a.y-30:a.y+6,info.label,22,tone.ink,targetWidth-40);}
    else{this.card(a.x,a.y,targetWidth,targetHeight,{fill:tone.soft,stroke:tone.accent,width:2});const tab=this.add.graphics();tab.fillStyle(tone.accent,1).fillRoundedRect(a.x-targetWidth/2,a.y-targetHeight/2,12,targetHeight,{tl:18,bl:18,tr:0,br:0});this.text(a.x+6,label,info.label,22,tone.ink,targetWidth-30);}
    filed.forEach((it,k)=>this.thumb(a.x+(k-(filed.length-1)/2)*50,a.y+(notebook?38:28),it));
    const zone=this.add.zone(a.x,a.y,targetWidth+10,targetHeight+8).setRectangleDropZone(targetWidth+10,targetHeight+8).setInteractive({useHandCursor:true});zone.setData('target',a.id);zone.on('pointerdown',()=>{if(armed&&!this.pauseGuard())this.assign(armed,a.id);});});
   const showGlow=(id?:string)=>glows.forEach((g,key)=>g.setVisible(id===undefined?!!armed:key===id));
   for(const [i,it] of task.items.entries()){
    const x=columns===2?165+(i%2)*280:245,y=65+(Math.floor(i/columns)+.5)*rowH;const linked=!!record.assignments[it.id];const box=this.add.container(x,y);const cardH=rowH-16;
    const face=this.add.graphics();const style=(picked:boolean)=>this.cardShape(face,0,0,itemWidth,cardH,{fill:linked?tone.soft:tone.paper,stroke:picked?tone.pick:linked?tone.accent:tone.line,width:picked?5:2});style(armed===it.id);box.add(face);
    if(it.art)box.add(columns===2?this.art(0,-30,itemWidth-24,cardH-70,artKey(it)!,{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}):this.art(-117,0,144,cardH-24,artKey(it)!,{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));
    box.add(this.text(columns===2?0:65,it.art&&columns===2?cardH/2-30:0,(record.opened.includes(it.id)?'✓ ':'')+it.label,21,tone.ink,columns===2?itemWidth-20:216));
    const tape=this.tape(0,-cardH/2+3,84,i%2?3:-4);if(tape)box.add(tape);if(linked)box.add(this.badge(itemWidth/2-10,-cardH/2+10));
    box.setSize(itemWidth,cardH).setInteractive({useHandCursor:true});this.input.setDraggable(box);inputObjects.push(box);
    let dragged=false;box.on('pointerdown',()=>{if(this.pauseGuard())return;dragged=false;armed=it.id;style(true);showGlow();});box.on('drag',(_pointer:Phaser.Input.Pointer,dx:number,dy:number)=>{if(this.pauseGuard())return;dragged=true;box.setPosition(dx,dy);box.setDepth(10);});
    box.on('dragenter',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>showGlow(String(zone.getData('target'))));box.on('dragleave',()=>showGlow());
    box.on('pointerup',()=>{if(!dragged&&!this.pauseGuard())hooks.open(it.id);});box.on('drop',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>{this.assign(it.id,String(zone.getData('target')));});box.on('dragend',()=>{if(!disposed&&box.active)box.setPosition(x,y).setDepth(0);});
   }
  }
  assign(id:string,target:string){if(this.pauseGuard())return;if(!record.opened.includes(id)){hooks.feedback('자료를 먼저 눌러 내용을 살펴봐요.');return;}record.assignments[id]=target;record.submitted=false;armed='';playEffect('snap');this.commit();}
  paintObservation(){
   const isTimeline=task.kind==='timeline',isTrack=task.kind==='track';const kind=task.organism||'mushroom';const comparing=record.pins.length===2&&Number.isFinite(record.pins[0])&&Number.isFinite(record.pins[1])&&!play;
   if(comparing&&reveal!==undefined){
    const {w,h}=this.specimenSize(750,360,kind,record.pins[0]);const left=480-w/2,top=275-h/2;this.drawSpecimen(480,275,w,h,kind,record.pins[0],false);
    const after=this.art(480,275,w,h,kind,{time:record.pins[1],focus:65,light:65,trail:isTrack,marks:record.marks});
    const split=left+w*reveal;const mask=this.add.graphics().fillStyle(0xffffff).fillRect(split,top,left+w-split,h);mask.setVisible(false);after.setMask(mask.createGeometryMask());
    if(isTimeline)this.add.zone(480,275,w,h).setInteractive({useHandCursor:true}).on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;if(p.x<left+w*(reveal??.5)){hooks.feedback('이후 쪽에서 달라진 부분을 표시해요.');return;}if(!addMark(task,record,viewToImage({x:(p.x-left)/w,y:(p.y-top)/h},record)))return hooks.feedback(markHint(task));record.submitted=false;this.commit();});
    const line=this.add.rectangle(split,275,5,h,0xd6a64a);const handle=this.add.rectangle(split,275,88,70,0xfff9df).setStrokeStyle(3,0x8a703c);const label=this.text(split,275,'↔',36);handle.setInteractive({useHandCursor:true});this.input.setDraggable(handle);
    handle.on('drag',(_p:Phaser.Input.Pointer,x:number)=>{if(this.pauseGuard())return;const clamped=Phaser.Math.Clamp(x,left,left+w);reveal=(clamped-left)/w;mask.clear().fillStyle(0xffffff).fillRect(clamped,top,left+w-clamped,h);line.x=handle.x=label.x=clamped;});
    this.caption(250,60,'A · 이전');this.caption(710,60,'B · 이후');this.caption(480,500,'손잡이를 밀어 같은 위치의 변화를 비교해요',28,'#3e6651',860);
   }else if(comparing){for(let i=0;i<2;i++){const x=260+i*440;this.drawSpecimen(x,265,410,340,kind,record.pins[i],i===1);this.caption(x,65,`${i===0?'A · 이전':'B · 이후'} ${isTimeline?'관찰 '+(record.pins[i]+1):'시점 '+record.pins[i]}`,24);}}
   else this.drawSpecimen(480,270,750,435,kind,record.time,true);
   if(isTrack&&reveal===undefined)this.caption(480,510,'같은 시야 · 같은 짚신벌레의 위치를 비교해요',20,'#3e6651',850);
   if(isTimeline&&reveal===undefined){const g=this.add.graphics();g.lineStyle(6,tone.line,1).lineBetween(235,505,725,505);for(let i=0;i<4;i++){const x=235+i*163,current=i===record.time,pinned=record.pins.includes(i);g.fillStyle(tone.shade,.16).fillCircle(x+2,509,32);g.fillStyle(current?tone.accent:pinned?tone.soft:tone.paper,1).fillCircle(x,505,32);g.lineStyle(3,current||pinned?tone.accent:tone.line,1).strokeCircle(x,505,32);this.add.zone(x,505,76,76).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.time=i;this.commit();});this.text(x,505,String(i+1),21,current?'#fffdf4':tone.ink);}}
  }
  specimenSize(w:number,h:number,kind:string,time:number){
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(time)}`:`art-${kind}`;
   const source=this.textures.exists(name)?this.textures.get(name).getSourceImage() as HTMLImageElement:undefined;
   const aspect=task.kind==='track'?16/9:source?source.width/source.height:16/9;
   return w/h>aspect?{w:h*aspect,h}:{w,h:w/aspect};
  }
  drawSpecimen(x:number,y:number,w:number,h:number,kind:string,time:number,markable:boolean){
   const marks=markable?record.marks:[];const opts={time,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,marks,trail:task.kind==='track'};
   if(task.kind==='microscope'&&markable&&!record.capture&&this.textures.exists('ui-microscope-frame')){
    const r=172;({w,h}=this.specimenSize(r*2.6,r*2.6,kind,time));y=262;
    const glass=this.add.graphics();glass.fillStyle(tone.shade,.25).fillCircle(x+4,y+10,r+40);glass.fillStyle(0xf6f3e6,1).fillCircle(x,y,r+4);
    const picture=this.art(x,y,w,h,kind,opts);const lens=this.make.graphics({},false).fillStyle(0xffffff).fillCircle(x,y,r);picture.setMask(lens.createGeometryMask());
    const frame=this.add.image(x,y,'ui-microscope-frame');frame.setDisplaySize(r*2/(LENS_HOLE*2),r*2/(LENS_HOLE*2));
   }else{
    ({w,h}=this.specimenSize(w,h,kind,time));
    this.card(x,y,w+20,h+20,{fill:0xffffff,stroke:tone.line,radius:12});
    this.art(x,y,w,h,kind,opts);
    if(task.kind==='microscope'&&markable){this.tape(x-w/2+30,y-h/2-4,96,-32);this.tape(x+w/2-30,y-h/2-4,96,32);}
   }
   const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});let down:{x:number;y:number}|undefined;let old={...record.pan};zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;down={x:p.x,y:p.y};old={...record.pan};});
   zone.on('pointerup',(p:Phaser.Input.Pointer)=>{if(!down)return;const start=down;down=undefined;if(this.pauseGuard())return;const dx=p.x-start.x,dy=p.y-start.y;
    if(task.kind==='microscope'&&!record.capture&&Math.hypot(dx,dy)>20){record.pan={x:Math.max(-.35,Math.min(.35,old.x+dx/w)),y:Math.max(-.3,Math.min(.3,old.y+dy/h))};this.commit();return;}
    if(markable&&(task.kind==='microscope'&&record.capture||task.kind==='timeline'&&record.pins.length===2)){
     const point=viewToImage({x:(p.x-x+w/2)/w,y:(p.y-y+h/2)/h},record);if(!addMark(task,record,point))return hooks.feedback(markHint(task));record.submitted=false;playEffect('snap');this.commit();}
   });zone.on('pointerout',()=>{down=undefined;});zone.on('pointercancel',()=>{down=undefined;});
  }
  paintSampling(){
   this.card(325,315,620,370,{fill:0xffffff,radius:14});this.art(325,315,600,350,'water');
   for(const [id,x,y,label] of [['edge',130,360,'물가 가까이'],['plant',390,265,'물풀 가까이']] as [string,number,number,string][]){
    const chosen=record.assignments.site===id;const ring=this.add.graphics();ring.lineStyle(5,0xffffff,.95).strokeCircle(x,y,30);ring.lineStyle(3,tone.accent,.9).strokeCircle(x,y,34);const dot=this.add.graphics();dot.fillStyle(chosen?tone.accent:0xffffff,chosen?1:.6).fillCircle(x,y,chosen?20:14);
    if(!chosen&&!reduced)this.tweens.add({targets:ring,alpha:.35,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.add.zone(x,y,88,88).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.assignments.site=id;this.commit();});this.caption(x,y+58,label,22);}
   const slideY=350;this.card(785,slideY+14,262,214,{fill:tone.paper,radius:20});this.tape(785,slideY-92,86,-3);if(this.textures.exists('ui-slide')){this.add.image(785,slideY,'ui-slide').setDisplaySize(230,97);}else this.plate(785,slideY,200,110,'',0xe8efe8);
   if(record.sequence===3&&this.textures.exists('ui-water-drop'))this.add.image(785,slideY-6,'ui-water-drop').setDisplaySize(58,45);else if(record.sequence===3)this.add.circle(785,slideY-6,20,0x73b4bd);
   this.text(785,slideY+82,record.sequence===3?'한 방울 준비 완료':'받침 유리판',22,tone.ink,240);
   const home={x:record.sequence===2?550:300,y:168};const pipette=this.add.container(home.x,home.y);
   if(this.textures.exists('ui-dropper')){if(record.sequence>0){const glow=this.add.graphics();glow.fillStyle(0x9fd3d6,.45).fillEllipse(0,-62,64,64);pipette.add(glow);}pipette.add(this.add.image(0,0,'ui-dropper').setDisplaySize(31,210));if(record.sequence===2&&this.textures.exists('ui-water-drop'))pipette.add(this.add.image(0,112,'ui-water-drop').setDisplaySize(24,19));}
   else pipette.add([this.add.rectangle(0,0,28,110,0xeaf3dc).setStrokeStyle(3,0x537d6c),this.add.ellipse(0,-62,58,60,record.sequence>0?0x72b3bc:0x4d8066),this.add.triangle(0,73,0,0,20,0,10,35,0xc1d7b8)]);
   pipette.setSize(90,220).setInteractive({useHandCursor:true});this.input.setDraggable(pipette);let dragged=false;
   pipette.on('pointerdown',()=>{if(!this.pauseGuard())dragged=false;});pipette.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;pipette.setPosition(x,y);});pipette.on('dragend',()=>{if(this.pauseGuard()){if(pipette.active)pipette.setPosition(home.x,home.y);return;}if(record.sequence===2&&pipette.x>665&&pipette.y>180){record.sequence=3;this.commit();}else if(pipette.active)pipette.setPosition(home.x,home.y);});
   pipette.on('pointerup',()=>{if(dragged||this.pauseGuard())return;if(!record.assignments.site){hooks.feedback('먼저 채집할 장소를 살펴봐요.');return;}if(record.sequence<2){record.sequence++;this.commit();}});
   if(record.sequence===3)pipette.setVisible(false);
   this.caption(480,30,['채집할 장소를 살펴봐요','스포이드를 눌렀어요 · 물속에서 놓아요','유리판으로 옮겨요','한 방울 표본이 준비됐어요'][record.sequence],24);
  }
  paintBuild(){
   const slots=task.targets.map((t,i)=>({id:t.id,x:185+i*295,y:200}));const g=this.add.graphics();
   for(let i=0;i<2;i++){const linked=record.assignments[`edge${i+1}`]==='linked';g.lineStyle(12,linked?tone.accent:tone.line,1);g.lineBetween(slots[i].x+110,200,slots[i+1].x-110,200);const knob=this.add.graphics();knob.fillStyle(tone.shade,.2).fillCircle(335+i*295,204,28);knob.fillStyle(linked?tone.accent:tone.brass,1).fillCircle(333+i*295,200,28);knob.lineStyle(3,0xffffff,.9).strokeCircle(333+i*295,200,28);this.add.zone(333+i*295,200,64,64).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;const id=`edge${i+1}`;record.assignments[id]=record.assignments[id]==='linked'?'':'linked';invalidateRun(record);this.commit();});this.text(333+i*295,200,linked?'✓':'+',25,linked?'#fffdf4':tone.ink);}
   slots.forEach((s,i)=>{const it=task.items.find(item=>item.id===record.assignments[s.id]);
    if(it){this.card(s.x,s.y,230,180);this.tape(s.x,s.y-88,84,i%2?3:-3);this.art(s.x,s.y-24,206,100,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(s.x,s.y+59,it.label,21,tone.ink,214);}
    else{this.card(s.x,s.y,230,180,{fill:tone.soft,stroke:tone.accent,alpha:.82});this.text(s.x,s.y,'여기에 놓아요',22,tone.ink,200);}
    this.caption(s.x,68,task.targets[i].label,23);const zone=this.add.zone(s.x,s.y,240,190).setRectangleDropZone(240,190).setInteractive({useHandCursor:true});zone.setData('target',s.id);zone.on('pointerdown',()=>{if(armed)this.place(armed,s.id);});});
   task.items.forEach((it,i)=>{const x=132+i*233,y=431;const box=this.add.container(x,y);const face=this.add.graphics();this.cardShape(face,0,0,210,154,{stroke:armed===it.id?tone.pick:tone.line,width:armed===it.id?5:2});box.add(face);box.add(this.art(0,-30,188,72,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));box.add(this.text(0,44,it.label,21,tone.ink,194));const tape=this.tape(0,-74,72,i%2?3:-4);if(tape)box.add(tape);box.setSize(210,154).setInteractive({useHandCursor:true});this.input.setDraggable(box);let dragged=false;box.on('pointerdown',()=>{if(this.pauseGuard())return;armed=it.id;dragged=false;this.cardShape(face,0,0,210,154,{stroke:tone.pick,width:5});});box.on('pointerup',()=>{if(!dragged&&!this.pauseGuard()){hooks.open(it.id);}});box.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;box.setPosition(x,y).setDepth(10);});box.on('drop',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>this.place(it.id,String(zone.getData('target'))));box.on('dragend',()=>{if(box.active)box.setPosition(x,y).setDepth(0);});});
   if(record.runResult){const ok=record.runResult==='supported';this.caption(480,315,ok?`${task.caseName} 사례로 연결됐어요`:'흐름이 멈췄어요 · 연결과 자료를 다시 봐요',23,ok?'#286341':'#995131',850);}
  }
  place(id:string,target:string){if(this.pauseGuard())return;record.assignments[target]=id;armed='';invalidateRun(record);playEffect('snap');this.commit();}
  animateRun(valid:boolean,finish:()=>void){
   if(simulating||disposed)return;simulating=true;
   if(reduced){simulating=false;finish();return;}
   const signal=this.add.circle(185,200,18,0xffde7a).setStrokeStyle(4,0x547b51).setDepth(30);
   const end=valid?775:!record.assignments.edge1||record.assignments.input!==task.items.find(i=>i.target==='input')?.id?310:605;
   this.tweens.add({targets:signal,x:end,duration:1400,ease:'Sine.easeInOut',onComplete:()=>{simulating=false;signal.destroy();if(!disposed)finish();}});
  }
  paintReview(){
   this.caption(480,45,'새 자료를 보고 내 생각을 다시 살펴봐요',30);
   task.items.forEach((it,i)=>{const x=260+i*440;this.card(x,265,390,325,{stroke:record.opened.includes(it.id)?tone.accent:tone.line});this.tape(x,108,92,i?4:-4);this.art(x,230,350,200,artKey(it)||'bacteria',{fit:'contain'});this.text(x,375,(record.opened.includes(it.id)?'✓ ':'')+it.label,28,'#234b3c',350);this.add.zone(x,265,390,325).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;if(!record.assignments.initial)return hooks.feedback('새 자료를 보기 전 생각을 먼저 골라요.');hooks.open(it.id);});});
   this.caption(480,485,'처음 생각 → 새 근거 → 유지하거나 수정한 주장',26);
  }
  paintPublish(){
   task.items.forEach((it,i)=>{const x=180+i*300;const selected=record.assignments.case===it.id;this.card(x,170,260,245,{fill:selected?tone.soft:tone.paper,stroke:selected?tone.accent:tone.line,width:selected?4:2});if(selected)this.badge(x+118,58);this.art(x,135,230,140,artKey(it)||'yogurt',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(x,248,it.label,30);this.add.zone(x,170,260,245).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.assignments.case=it.id;record.assignments.action='';playEffect('snap');this.commit();});});
   this.card(480,415,850,180);this.tape(480,327,110,-2);this.text(480,345,'내 소개 카드',28);
   this.text(480,425,record.note.length>68?record.note.slice(0,68)+'…':record.note||'사례를 고르면 나만의 소개를 완성할 수 있어요.',28,'#234b3c',780);
  }
  update(_time:number,delta:number){
   if(blocked()){this.tweens.pauseAll();return;}this.tweens.resumeAll();
   if(!play||task.kind!=='track'||this.pauseGuard())return;
   record.time=(record.time+delta/1000)%10;this.trackElapsed+=delta;
   // Playback repaints one persistent canvas, never the text, input zones or display list.
   if(this.trackSurface&&this.trackElapsed>=1000/30){this.trackElapsed=0;const image=this.textures.exists('art-paramecium')?this.textures.get('art-paramecium').getSourceImage() as CanvasImageSource:undefined;draw(this.trackSurface.canvas,task.organism||'paramecium',{time:record.time,focus:65,light:65,zoom:record.zoom,pan:record.pan,trail:true,image});this.trackSurface.texture.refresh();}
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:WIDTH,height:HEIGHT,transparent:true,scene:Inquiry,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false,render:{antialias:true}});
 return {refresh:()=>{if(!simulating)refresh();},setReveal:(value:number|undefined)=>{reveal=value===undefined?undefined:Phaser.Math.Clamp(value,0,1);refresh();},animateRun:(valid:boolean,finish:()=>void)=>{if(scene instanceof Inquiry)scene.animateRun(valid,finish);else finish();},setPlaying:(value:boolean)=>{if(value&&blocked())return;if(play!==value){play=value;refresh();}},arm:(id:string)=>{if(disposed||simulating)return;armed=id;refresh();},assign:(id:string,target:string)=>{if(blocked()||simulating)return;if(!record.opened.includes(id)){hooks.feedback('먼저 자료 내용을 살펴봐요.');return;}record.assignments[id]=target;record.submitted=false;playEffect('snap');hooks.changed();refresh();},place:(id:string,target:string)=>{if(blocked()||simulating)return;record.assignments[target]=id;invalidateRun(record);playEffect('snap');hooks.changed();refresh();},dispose:()=>{disposed=true;play=false;game.destroy(true);}};
}
