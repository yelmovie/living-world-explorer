import Phaser from 'phaser';
import {addHandLens} from './hand-lens';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {canvas,draw} from '../draw';
import {assignCard as applyCard,syncBuildLinks,chooseCase} from '../inquiry-actions';
import {playEffect} from '../audio';
import {inquiryArt,artTime,artKey,artFrame,magnifyFor,type MagnifyView} from '../artAssets';
import {addMark,markHint,viewToImage,observedKind,featureAt} from '../observation';
import type {ObservationFrame} from '../inquiry-playback';
export type InquiryHooks={assigned:(id:string,target:string)=>void;changed:()=>void;open:(id:string)=>void;feedback:(text:string,kind?:'retry'|'success')=>void;ready:(ok:boolean)=>void};
const WIDTH=960,HEIGHT=540;
export function mountInquiry(host:HTMLElement,task:InquiryTask,learner:InquiryRecord,hooks:InquiryHooks,reduced:boolean){
 let record=learner;
 let beforeDemo:{preview:boolean;reveal:number|undefined}|undefined;
 let refresh=()=>{};let play=false;let preview=false;let disposed=false;let armed='';let reveal:number|undefined;let simulating=false;let scene:Phaser.Scene|undefined;let playbackRate=1;
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 // Scene colours follow the DOM tokens (styles.css stage layer), so one token edit restyles both.
 const css=(name:string,fallback:number)=>{const v=getComputedStyle(host).getPropertyValue(name).trim();return /^#[0-9a-f]{6}$/i.test(v)?parseInt(v.slice(1),16):fallback;};
 const tone={accent:css('--stage-accent',0x557a3f),soft:css('--stage-soft',0xe4edd5),paper:css('--paper-face',0xfffaf0),line:css('--paper-line',0xe6d8bc),brass:css('--brass-soft',0xecd08f),pick:0xd39a3f,shade:0x22312a,ink:'#1f3f31'};
 const LENS_HOLE=.3;// hole radius / width of ui/microscope-frame.webp (scripts/ui-props.mjs)
 class Inquiry extends Phaser.Scene{
  trackSurface?:{canvas:HTMLCanvasElement;texture:Phaser.Textures.CanvasTexture};
  trackElapsed=0;
  failed=false;
  preload(){this.load.on('loaderror',(file:Phaser.Loader.File)=>{if(!file.key.startsWith('ui-'))this.failed=true;});const view=task.kind==='microscope'?magnifyFor(task.organism,record.v===2):undefined;const needed=new Set([...task.items.map(artKey),task.organism,observedKind(task,record),task.kind==='sample'?'water':undefined,view?.context,view?.lens]);for(const art of needed)if(art&&inquiryArt[art]){const asset=inquiryArt[art];if(asset.frames)asset.frames.forEach((src,i)=>this.load.image(`art-${art}-${i}`,src));else this.load.image(`art-${art}`,asset.src);}
   // Decorative props are optional: a missing prop falls back to the drawn card, never blocks the activity.
   const props=['tape',...task.kind==='microscope'?['microscope-frame',...(view?['hand-lens']:[])]:[],...task.id==='M5-1'?['yogurt-maker']:[],...task.kind==='sample'?['dropper','slide','water-drop']:[]];for(const p of props)this.load.image(`ui-${p}`,`assets/ui/${p}.webp`);}
  create(){scene=this;this.tweens.timeScale=playbackRate;this.input.dragDistanceThreshold=12;if(this.failed){hooks.ready(false);return;}refresh=()=>this.paint();this.paint();hooks.ready(true);}
  wipe(){this.tweens.killAll();this.trackSurface=undefined;this.trackElapsed=0;this.children.removeAll(true);for(const name of this.textures.getTextureKeys())if(name.startsWith('plate-'))this.textures.remove(name);}
  text(x:number,y:number,text:string,size=23,color='#234b3c',width=330){return this.add.text(x,y,text,{fontFamily:'NanumSquareNeo, Malgun Gothic',fontSize:`${Math.max(28,size)}px`,color,align:'center',wordWrap:{width,useAdvancedWrap:true},lineSpacing:4}).setOrigin(.5);}
  // Rounded pill behind short captions so they read over any photo.
  caption(x:number,y:number,label:string,size=28,color=tone.ink,width=850){const t=this.text(x,y,label,size,color,width);const w=t.width+30,h=t.height+12,r=Math.min(22,h/2),g=this.add.graphics();g.fillStyle(tone.shade,.14).fillRoundedRect(x-w/2+2,y-h/2+4,w,h,r);g.fillStyle(tone.paper,.97).fillRoundedRect(x-w/2,y-h/2,w,h,r);g.lineStyle(2,tone.line,1).strokeRoundedRect(x-w/2,y-h/2,w,h,r);this.children.bringToTop(t);return t;}
  // Paper card: soft shadow + rounded face. Redrawing the same Graphics restyles armed/linked states in place.
  cardShape(g:Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,{fill=tone.paper,stroke=tone.line,width=2,radius=18,alpha=1}:{fill?:number;stroke?:number;width?:number;radius?:number;alpha?:number}={}){g.clear();g.fillStyle(tone.shade,.16*alpha).fillRoundedRect(x-w/2+3,y-h/2+7,w,h,radius);g.fillStyle(fill,alpha).fillRoundedRect(x-w/2,y-h/2,w,h,radius);g.lineStyle(width,stroke,1).strokeRoundedRect(x-w/2,y-h/2,w,h,radius);return g;}
  card(x:number,y:number,w:number,h:number,style:Parameters<Inquiry['cardShape']>[5]={}){return this.cardShape(this.add.graphics(),x,y,w,h,style);}
  tape(x:number,y:number,w=92,angle=-4){return this.textures.exists('ui-tape')?this.add.image(x,y,'ui-tape').setDisplaySize(w,w*.21).setAngle(angle).setAlpha(.95):undefined;}
  badge(x:number,y:number){const g=this.add.graphics();g.fillStyle(tone.accent,1).fillCircle(x,y,16);g.lineStyle(3,0xffffff,1).strokeCircle(x,y,16);return [g,this.add.text(x,y,'✓',{fontFamily:'NanumSquareNeo, Malgun Gothic',fontSize:'20px',color:'#ffffff'}).setOrigin(.5)];}
  // Numbered phases use a separate strip, leaving the specimen itself unobstructed.
  phase(x:number,y:number,index:number,label:string,done:boolean,current:boolean){
   this.card(x,y,280,48,{fill:current?tone.soft:tone.paper,stroke:current||done?tone.accent:tone.line,width:current?3:2,radius:24});
   const dot=this.add.circle(x-118,y,17,tone.paper);
   dot.setFillStyle(done||current?tone.accent:tone.paper).setStrokeStyle(2,tone.accent);
   this.text(x-118,y,done?'✓':String(index),28,done||current?'#fffdf4':tone.ink,38);
   this.text(x+16,y,label,28,tone.ink,218);
  }
  plate(x:number,y:number,w:number,h:number,label:string,fill=tone.paper){const box=this.card(x,y,w,h,{fill});if(label)this.text(x,y,label,22,tone.ink,w-20);return box;}
  art(x:number,y:number,w:number,h:number,kind:string,options:Parameters<typeof draw>[2]&{fit?:'contain'}={}){
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(options.time)}`:`art-${kind}`;
   const image=this.textures.exists(name)?this.textures.get(name).getSourceImage() as CanvasImageSource:undefined;
   const source=image as {width:number;height:number}|undefined;
   const c=options.fit==='contain'?canvas(640,Math.round(640*(source?.height||360)/(source?.width||640))):canvas(Math.round(w),Math.round(h));
   draw(c,kind,{...options,image,markerSpace:'world'});const key=`plate-${crypto.randomUUID()}`;const texture=this.textures.addCanvas(key,c)!;if(task.kind==='track'&&kind==='paramecium'&&record.level<2)this.trackSurface={canvas:c,texture};const picture=this.add.image(x,y,key);if(options.fit==='contain')picture.setScale(Math.min(w/c.width,h/c.height));return picture;}
  commit(){playEffect(task.kind==='sample'?(record.sequence===3?'pipette-drop':'water'):'click');hooks.changed();this.paint();}
  // Phaser also forwards window presses, whose coordinates can be stale just after scrolling.
  // Keep outside releases available for drag cleanup, but only apply an action from the canvas.
  pauseGuard(){return blocked()||simulating||!!beforeDemo||this.input.activePointer.event?.target!==this.game.canvas;}
  paint(){if(disposed)return;this.wipe();
   if(task.kind==='microscope'||task.kind==='track'||task.kind==='timeline'){this.paintObservation();return;}
   if(task.kind==='sample'){this.paintSampling();return;}
   if(task.kind==='build'){this.paintBuild();return;}
   if(task.kind==='review'){this.paintReview();return;}
   this.paintPublish();
  }
  paintObservation(){
   const isTimeline=task.kind==='timeline',isTrack=task.kind==='track';const kind=observedKind(task,record)||'mushroom';const comparing=record.pins.length===2&&Number.isFinite(record.pins[0])&&Number.isFinite(record.pins[1])&&!play&&!preview;
   // Cilia close-up: after A·B the same paramecium is shown still and large so its edge hairs can be marked.
   if(isTrack&&record.level===2){this.drawSpecimen(480,282,760,410,kind,0,true);this.caption(480,30,'현미경 · 몸 둘레의 가는 털을 찾아 눌러요',22);return;}
   if(comparing&&reveal!==undefined){
    const {w,h}=this.specimenSize(750,360,kind,record.pins[0]);const left=480-w/2,top=275-h/2;this.drawSpecimen(480,275,w,h,kind,record.pins[0],false);
    const after=this.art(480,275,w,h,kind,{time:record.pins[1],focus:65,light:65,trail:isTrack,marks:record.marks});
    const split=left+w*reveal;const mask=this.add.graphics().fillStyle(0xffffff).fillRect(split,top,left+w-split,h);mask.setVisible(false);after.setMask(mask.createGeometryMask());
    if(isTimeline)this.add.zone(480,275,w,h).setInteractive({useHandCursor:true}).on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;if(p.x<left+w*(reveal??.5)){hooks.feedback('이후 쪽에서 달라진 부분을 표시해요.');return;}if(!addMark(task,record,viewToImage({x:(p.x-left)/w,y:(p.y-top)/h},record)))return hooks.feedback(markHint(task));record.submitted=false;this.commit();});
    const line=this.add.rectangle(split,275,5,h,0xd6a64a);const handle=this.add.rectangle(split,275,88,70,0xfff9df).setStrokeStyle(3,0x8a703c);const label=this.text(split,275,'↔',36);handle.setInteractive({useHandCursor:true});this.input.setDraggable(handle);
    handle.on('drag',(_p:Phaser.Input.Pointer,x:number)=>{if(this.pauseGuard())return;const clamped=Phaser.Math.Clamp(x,left,left+w);reveal=(clamped-left)/w;mask.clear().fillStyle(0xffffff).fillRect(clamped,top,left+w-clamped,h);line.x=handle.x=label.x=clamped;});
    this.caption(250,60,'A · 이전');this.caption(710,60,'B · 이후');this.caption(480,500,'손잡이를 밀어 같은 위치의 변화를 비교해요',28,'#3e6651',860);
   }else if(comparing){
    for(let i=0;i<2;i++){
     const x=260+i*440;
     this.drawSpecimen(x,265,410,340,kind,record.pins[i],i===1);
     this.caption(x,65,`${i===0?'A · 이전':'B · 이후'} ${isTimeline?'관찰 '+(record.pins[i]+1):'시점 '+record.pins[i]}`,28,tone.ink,370);
    }
    if(isTimeline)this.caption(700,455,'달라진 곳을 눌러요',28,tone.ink,370);
   }
   else{this.drawSpecimen(480,isTimeline?255:270,isTimeline?730:750,isTimeline?390:435,kind,record.time,task.kind==='microscope');if(preview&&!play&&(isTimeline||isTrack))this.caption(480,30,isTimeline?'지금 고른 모습 · 관찰 '+(record.time+1):'지금 고른 순간 · 시점 '+Math.round(record.time),22);}
   if(isTrack&&(!comparing||reveal===undefined))this.caption(480,510,'같은 시야 · 같은 짚신벌레의 위치를 비교해요',20,'#3e6651',850);
   if(isTimeline&&(!comparing||reveal===undefined)){const g=this.add.graphics();g.lineStyle(6,tone.line,1).lineBetween(235,505,725,505);for(let i=0;i<4;i++){const x=235+i*163,current=i===record.time,pinned=record.pins.includes(i);g.fillStyle(tone.shade,.16).fillCircle(x+2,509,32);g.fillStyle(current?tone.accent:pinned?tone.soft:tone.paper,1).fillCircle(x,505,32);g.lineStyle(3,current||pinned?tone.accent:tone.line,1).strokeCircle(x,505,32);this.add.zone(x,505,76,76).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.time=i;preview=true;this.commit();});this.text(x,505,String(i+1),21,current?'#fffdf4':tone.ink);}}
  }
  specimenSize(w:number,h:number,kind:string,time:number){
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(time)}`:`art-${kind}`;
   const source=this.textures.exists(name)?this.textures.get(name).getSourceImage() as HTMLImageElement:undefined;
   const aspect=task.kind==='track'&&record.level<2?16/9:source?source.width/source.height:16/9;
   return w/h>aspect?{w:h*aspect,h}:{w,h:w/aspect};
  }
  drawSpecimen(x:number,y:number,w:number,h:number,kind:string,time:number,markable:boolean){
   const closeUp=task.kind==='track'&&record.level===2;
   const marks=markable&&(task.kind!=='track'||closeUp)?record.marks:[];const opts={time,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,marks,trail:task.kind==='track'&&!closeUp};
   // 맨눈 and 돋보기 show the place the specimen came from; only the microscope step can be focused and photographed.
   const view=magnifyFor(task.organism,record.v===2);if(task.kind==='microscope'&&markable&&!record.capture&&view&&record.level<2){this.drawContext(x,view,record.level);return;}
   if(task.kind==='microscope'&&markable&&!record.capture&&this.textures.exists('ui-microscope-frame')){
    const r=194;({w,h}=this.specimenSize(r*2.6,r*2.6,kind,time));y=262;
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
    if(task.kind==='timeline'&&!markable){
     hooks.feedback(record.pins.length===2&&!preview?'오른쪽 ‘이후’ 사진에서 달라진 곳을 눌러요.':'뒤의 모습을 골라 ‘이후 고정’을 눌러 두 사진을 나란히 놓아요.');return;
    }
    if(markable&&(task.kind==='microscope'&&record.capture||task.kind==='timeline'&&record.pins.length===2||closeUp)){
     const point=viewToImage({x:(p.x-x+w/2)/w,y:(p.y-y+h/2)/h},record);if(!addMark(task,record,point))return hooks.feedback(markHint(task,record));record.submitted=false;playEffect('snap');this.commit();}
   });zone.on('pointerout',()=>{down=undefined;});zone.on('pointercancel',()=>{down=undefined;});
  }
  drawContext(x:number,view:MagnifyView,level:number){
   const lensKey=level===1&&view.lens?`art-${view.lens}`:'';
   if(lensKey&&this.textures.exists(lensKey)){
    // 돋보기 has its own picture, so a new structure appears instead of a blurrier enlargement.
    const source=this.textures.get(lensKey).getSourceImage() as {width:number;height:number};const y=282,scale=Math.min(880/source.width,448/source.height),w=source.width*scale,h=source.height*scale;
    this.card(x,y,w+20,h+20,{fill:0xffffff,radius:12});
    const picture=this.add.image(x,y,lensKey).setScale(scale);
    addHandLens(this,{picture,start:{x:.53,y:.23},blocked:()=>this.pauseGuard(),inspect:point=>{
     if(view.gate&&featureAt(task.organism||'',point)!==view.gate)return hooks.feedback('렌즈를 갓 아래로 옮겨요. 나란한 주름이 보이면 그곳을 톡 눌러요.');
     record.level=2;this.commit();
    }});
    this.caption(x,30,view.captions[1],22);return;
   }
   const key=inquiryArt[view.context]?.frames?`art-${view.context}-${artFrame(view.time)}`:`art-${view.context}`;if(!this.textures.exists(key))return;
   const source=this.textures.get(key).getSourceImage() as {width:number;height:number};const y=282,scale=Math.min(880/source.width,448/source.height),w=source.width*scale,h=source.height*scale;
   this.card(x,y,w+20,h+20,{fill:0xffffff,radius:12});const picture=this.add.image(x,y,key).setScale(scale);
   const fx=x-w/2+view.focus.x*w,fy=y-h/2+view.focus.y*h,r=124;
   if(level===0){const ring=this.add.graphics();ring.lineStyle(5,0xffffff,.95).strokeCircle(fx,fy,62);ring.lineStyle(3,tone.accent,.9).strokeCircle(fx,fy,67);if(!reduced)this.tweens.add({targets:ring,alpha:.35,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});}
   else{
    addHandLens(this,{picture,start:view.focus,blocked:()=>this.pauseGuard(),inspect:()=>{record.level=2;this.commit();}});
    this.caption(x,30,view.captions[level],22);return;
   }
   this.add.zone(fx,fy,r*2,r*2).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.level=level+1;this.commit();});
   this.caption(x,30,view.captions[level],22);
  }
  paintSampling(){
   const site=!!record.assignments.site,collected=record.sequence>=2,prepared=record.sequence===3;
   const rail=this.add.graphics();rail.lineStyle(3,tone.line,1).lineBetween(180,33,785,33);
   this.phase(175,33,1,'장소 고르기',site,!site);
   this.phase(480,33,2,'한 방울 채집',collected,site&&!collected);
   this.phase(785,33,3,'유리판에 옮기기',prepared,collected&&!prepared);
   this.card(325,315,620,370,{fill:0xffffff,radius:14});this.art(325,315,600,350,'water');
   for(const [id,x,y,label] of [['edge',130,360,'물가 가까이'],['plant',390,265,'물풀 가까이']] as [string,number,number,string][]){
    const chosen=record.assignments.site===id;const ring=this.add.graphics();ring.lineStyle(5,0xffffff,.95).strokeCircle(x,y,30);ring.lineStyle(3,tone.accent,.9).strokeCircle(x,y,34);const dot=this.add.graphics();dot.fillStyle(chosen?tone.accent:0xffffff,chosen?1:.6).fillCircle(x,y,chosen?20:14);
    if(!chosen&&!reduced)this.tweens.add({targets:ring,alpha:.35,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.add.zone(x,y,88,88).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard()||record.assignments.site===id)return;record.assignments.site=id;record.sequence=0;this.commit();});this.caption(x,y+58,(chosen?'✓ ':'')+label,28,tone.ink,230);}
   const slideY=350;
   this.card(785,slideY+14,262,214,{fill:prepared?tone.soft:tone.paper,radius:20,stroke:collected?tone.accent:tone.line,width:collected?4:2});
   if(prepared)this.badge(887,slideY-65);if(this.textures.exists('ui-slide')){this.add.image(785,slideY,'ui-slide').setDisplaySize(230,97);}else this.plate(785,slideY,200,110,'',0xe8efe8);
   if(record.sequence===3&&this.textures.exists('ui-water-drop'))this.add.image(785,slideY-6,'ui-water-drop').setDisplaySize(58,45);else if(record.sequence===3)this.add.circle(785,slideY-6,20,0x73b4bd);
   this.text(785,slideY+82,prepared?'한 방울 준비 완료':collected?'여기에 한 방울 놓아요':'받침 유리판',28,tone.ink,230);
   this.add.zone(785,slideY+14,262,214).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
    if(this.pauseGuard()||record.sequence===3)return;
    if(record.sequence!==2)return hooks.feedback(record.assignments.site?'스포이드를 먼저 눌러 물 한 방울을 담아요.':'물가나 물풀 가까이를 먼저 골라요.');
    record.sequence=3;this.commit();
   });
   const home={x:record.sequence===2?550:300,y:168};const pipette=this.add.container(home.x,home.y);
   if(this.textures.exists('ui-dropper')){if(record.sequence>0){const glow=this.add.graphics();glow.fillStyle(0x9fd3d6,.45).fillEllipse(0,-62,64,64);pipette.add(glow);}pipette.add(this.add.image(0,0,'ui-dropper').setDisplaySize(31,210));if(record.sequence===2&&this.textures.exists('ui-water-drop'))pipette.add(this.add.image(0,112,'ui-water-drop').setDisplaySize(24,19));}
   else pipette.add([this.add.rectangle(0,0,28,110,0xeaf3dc).setStrokeStyle(3,0x537d6c),this.add.ellipse(0,-62,58,60,record.sequence>0?0x72b3bc:0x4d8066),this.add.triangle(0,73,0,0,20,0,10,35,0xc1d7b8)]);
   pipette.setSize(90,220).setInteractive({useHandCursor:true});this.input.setDraggable(pipette);let dragged=false;
   pipette.on('pointerdown',()=>{if(!this.pauseGuard())dragged=false;});pipette.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;pipette.setPosition(x,y);});pipette.on('dragend',()=>{if(this.pauseGuard()){if(pipette.active)pipette.setPosition(home.x,home.y);return;}if(record.sequence===2&&pipette.x>665&&pipette.y>180){record.sequence=3;this.commit();}else if(pipette.active)pipette.setPosition(home.x,home.y);});
   pipette.on('pointerup',()=>{if(dragged||this.pauseGuard())return;if(!record.assignments.site){hooks.feedback('먼저 채집할 장소를 살펴봐요.');return;}if(record.sequence<2){record.sequence=2;this.commit();}});
   if(record.sequence===3)pipette.setVisible(false);
   if(record.assignments.site&&record.sequence<2){
    const label=this.text(80,-70,'스포이드',22,tone.ink,125).setBackgroundColor('#fffbed').setPadding(8,4);
    pipette.add(label);
   }
  }
  paintBuild(){
   const yogurt=task.id==='M5-1';
   const resetFaces:(()=>void)[]=[];const slots=task.targets.map((t,i)=>({id:t.id,x:185+i*295,y:200}));const g=this.add.graphics();
   this.card(480,178,916,274,{fill:yogurt?0xfff5db:tone.paper,stroke:yogurt?0xb28e51:tone.line,radius:26,alpha:.97});
   for(let i=0;i<2;i++){const linked=record.assignments[`edge${i+1}`]==='linked',color=linked?tone.accent:tone.line;g.lineStyle(6,color,1);g.lineBetween(slots[i].x+117,200,slots[i+1].x-120,200);g.fillStyle(color,1).fillTriangle(slots[i+1].x-112,200,slots[i+1].x-129,190,slots[i+1].x-129,210);}
   slots.forEach((s,i)=>{const it=task.items.find(item=>item.id===record.assignments[s.id]);
    if(yogurt&&s.id==='action'){
     this.drawYogurtMaker(s.x,166,245,150);
     this.caption(s.x,274,it?it.label:'여기에 넣기',28,tone.ink,224);
    }else if(it){
     this.card(s.x,s.y,230,205,{fill:tone.paper,stroke:tone.accent,width:3});
     this.art(s.x,152,206,88,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});
     this.text(s.x,254,it.label,28,tone.ink,210);
    }
    else{
     this.card(s.x,s.y,230,205,{fill:tone.soft,stroke:tone.accent,alpha:.82});
     const guide=this.add.graphics();guide.lineStyle(2,tone.accent,.35).strokeRoundedRect(s.x-101,111,202,178,12);
     this.text(s.x,s.y,yogurt?(s.id==='input'?'병에 담기':'목표 음식 놓기'):'여기에 놓아요',28,tone.ink,190);
    }
    this.caption(s.x,68,`${i+1} · ${yogurt&&s.id==='action'?'발효기':task.targets[i].label}`,28,tone.ink,235);const zone=this.add.zone(s.x,s.y,240,190).setRectangleDropZone(240,190).setInteractive({useHandCursor:true});zone.setData('target',s.id);zone.on('pointerdown',()=>{if(this.pauseGuard())return;if(armed)this.place(armed,s.id);else hooks.feedback('아래에서 놓고 싶은 카드를 먼저 골라요.');});});
   task.items.forEach((it,i)=>{const x=132+i*233,y=431;const box=this.add.container(x,y);const face=this.add.graphics();this.cardShape(face,0,0,210,174,{stroke:armed===it.id?tone.pick:tone.line,width:armed===it.id?5:2});resetFaces.push(()=>this.cardShape(face,0,0,210,174));box.add(face);box.add(this.art(0,-45,188,64,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));box.add(this.text(0,39,it.label,28,tone.ink,194));box.setSize(210,174).setInteractive({useHandCursor:true});this.input.setDraggable(box);box.on('pointerdown',()=>{if(this.pauseGuard())return;armed=it.id;resetFaces.forEach(reset=>reset());this.cardShape(face,0,0,210,174,{stroke:tone.pick,width:5});hooks.open(it.id);});box.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;box.setPosition(x,y).setDepth(10);});box.on('drop',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>this.place(it.id,String(zone.getData('target'))));box.on('dragend',()=>{if(box.active)box.setPosition(x,y).setDepth(0);});});
   if(!record.runResult){const filled=task.targets.every(t=>!!record.assignments[t.id]);if(!yogurt||!filled||armed)this.caption(480,322,armed?'이제 위쪽에서 놓을 곳을 눌러요':yogurt?'아래에서 골라 작업대에 놓아요':'아래에서 카드 한 장을 골라요',22);}
   if(record.runResult){const ok=record.runResult==='supported';this.caption(480,315,yogurt?(ok?'완성! 우유가 걸쭉하고 새콤해졌어요':'다시 살펴보기 · 재료와 만들 음식을 확인해요'):ok?`${task.caseName} 사례로 연결됐어요`:'흐름이 멈췄어요 · 연결과 자료를 다시 봐요',23,ok?'#286341':'#995131',850);}
  }
  place(id:string,target:string){
   // Milk or water can go straight into the machine as the liquid ingredient.
   if(task.id==='M5-1'&&target==='action'&&(id==='milk'||id==='water'))target='input';
   if(!this.pauseGuard())assignCard(id,target);
  }
  drawYogurtMaker(x:number,y:number,w:number,h:number){
   if(!this.textures.exists('ui-yogurt-maker')){this.plate(x,y,w,h,'요구르트 발효기');return;}
   const pic=this.add.image(x,y,'ui-yogurt-maker');pic.setScale(Math.min(w/pic.width,h/pic.height));
  }
  ferment(valid:boolean,finish:()=>void){
   this.wipe();
   this.card(480,265,860,454,{fill:0xfff5db,stroke:0xb28e51,radius:32});
   this.caption(480,85,'발효기 관찰 · 시간을 빠르게 돌려 봐요',26);
   this.drawYogurtMaker(401,256,416,265);
   const ingredient=task.items.find(it=>it.id===record.assignments.input);
   const container=this.art(165,218,100,75,ingredient?artKey(ingredient)||'milk':'milk',{fit:'contain'});
   const dial=this.add.circle(750,165,42,0xfff6da).setStrokeStyle(6,0xaa8150);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;this.add.circle(dial.x+Math.sin(a)*32,dial.y-Math.cos(a)*32,2.5,0x775735);}
   const hand=this.add.rectangle(dial.x,dial.y,5,28,0x745238).setOrigin(.5,1);
   if(valid){
    const result=this.art(750,325,190,124,'yogurt',{fit:'contain'}).setAlpha(0);
    const label=this.text(750,241,'완성!',26,tone.ink).setAlpha(0);
    this.tweens.add({targets:[result,label],delay:3850,alpha:1,y:'-=18',duration:650,ease:'Sine.easeOut'});
   }
   const line=this.text(480,432,'고른 재료를 발효기에 넣어요.',27,tone.ink,790);
   this.tweens.add({targets:container,x:388,y:250,alpha:0,duration:750,ease:'Sine.easeIn'});
   this.tweens.add({targets:hand,angle:valid?660:100,duration:valid?6000:2300,ease:'Linear',onUpdate:t=>{
    line.setText(!valid?'재료와 만들 음식이 잘 맞는지 살펴봐요.':t.progress<.25?'발효기가 우유를 따뜻하게 유지해요.':t.progress<.67?'유산균이 우유 속 당을 이용해 젖산을 만들어요.':'시간이 지나면 우유가 걸쭉하고 새콤해져요.');
   },onComplete:()=>{simulating=false;if(!disposed)finish();}});
  }
  animateRun(valid:boolean,finish:()=>void){
   if(simulating||disposed)return;simulating=true;
   if(reduced){simulating=false;finish();return;}
   if(task.id==='M5-1'){this.ferment(valid,finish);return;}
   const signal=this.add.circle(185,200,18,0xffde7a).setStrokeStyle(4,0x547b51).setDepth(30);
   const end=valid?775:!record.assignments.edge1||record.assignments.input!==task.items.find(i=>i.target==='input')?.id?310:605;
   this.tweens.add({targets:signal,x:end,duration:1400,ease:'Sine.easeInOut',onComplete:()=>{simulating=false;signal.destroy();if(!disposed)finish();}});
  }
  paintReview(){
   task.items.forEach((it,i)=>{
    const x=260+i*440,read=record.opened.includes(it.id);
    this.card(x,275,390,410,{fill:read?tone.soft:tone.paper,stroke:read?tone.accent:tone.line,width:read?3:2});
    this.text(x,102,`조사 자료 ${i+1}`,28,tone.ink,300);
    this.art(x,245,350,225,artKey(it)||'bacteria',{fit:'contain'});
    this.text(x,395,it.label,28,tone.ink,345);
    this.caption(x,455,read?'✓ 읽은 자료':'눌러서 자료 읽기',28,tone.ink,345);this.add.zone(x,275,390,410).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;if(!record.assignments.initial)return hooks.feedback('새 자료를 보기 전 생각을 먼저 골라요.');hooks.open(it.id);});});
  }
  paintPublish(){
   task.items.forEach((it,i)=>{const x=180+i*300;const selected=record.assignments.case===it.id;this.card(x,170,260,245,{fill:selected?tone.soft:tone.paper,stroke:selected?tone.accent:tone.line,width:selected?4:2});if(selected)this.badge(x+118,58);this.art(x,135,230,140,artKey(it)||'yogurt',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(x,248,it.label,30);this.add.zone(x,170,260,245).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;if(chooseCase(task,record,it.id)){playEffect('snap');this.commit();}});});
   this.card(480,415,850,180);
   this.text(480,347,'내 소개 카드',28);
   this.add.graphics().lineStyle(2,tone.line,1).lineBetween(88,372,872,372);
   this.text(480,438,record.note.length>68?record.note.slice(0,68)+'…':record.note||'사례를 고르면 나만의 소개를 완성할 수 있어요.',28,tone.ink,780);
  }
  update(_time:number,delta:number){
   if(blocked()){this.tweens.pauseAll();return;}this.tweens.resumeAll();
   if(!play||task.kind!=='track'||simulating)return;
   record.time=(record.time+delta/1000*playbackRate)%10;this.trackElapsed+=delta;
   // Playback repaints one persistent canvas, never the text, input zones or display list.
   if(this.trackSurface&&this.trackElapsed>=1000/30){this.trackElapsed=0;const image=this.textures.exists('art-paramecium')?this.textures.get('art-paramecium').getSourceImage() as CanvasImageSource:undefined;draw(this.trackSurface.canvas,task.organism||'paramecium',{time:record.time,focus:65,light:65,zoom:record.zoom,pan:record.pan,trail:true,image});this.trackSurface.texture.refresh();}
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:WIDTH,height:HEIGHT,transparent:true,scene:Inquiry,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false,render:{antialias:true}});
 // Narrow layouts scroll inside the screen, not the window; Phaser only re-reads the canvas position on resize, so taps drifted after scrolling.
 const rebound=()=>game.scale?.updateBounds();document.addEventListener('scroll',rebound,{capture:true,passive:true});
 const beforePointer=(e:PointerEvent)=>{if(e.target===game.canvas)rebound();};
 document.addEventListener('pointerdown',beforePointer,true);
 // DOM alternatives intentionally work inside their own dialog; canvas handlers use pauseGuard.
 function assignCard(id:string,target:string){
  if(disposed||simulating||document.hidden)return false;
  const item=task.items.find(it=>it.id===id);if(!item||!task.targets.some(t=>t.id===target))return false;
  if(!record.opened.includes(id))hooks.open(id);
  const changed=applyCard(task,record,id,target);
  armed='';hooks.assigned(id,target);
  if(changed){playEffect('snap');hooks.changed();}
  refresh();
  return changed;
 }
 // Upgrade a saved unfinished design whose old manual + buttons had not been pressed.
 if(syncBuildLinks(task,record))hooks.changed();
 const showFrame=(frame:ObservationFrame)=>{
  if(disposed||simulating)return;
  if(!beforeDemo){beforeDemo={preview,reveal};record=structuredClone(learner);}
  Object.assign(record,structuredClone(frame.patch));
  play=!!frame.moving&&!reduced;preview=false;reveal=undefined;refresh();
 };
 const endDemo=()=>{
  if(!beforeDemo)return;
  record=learner;preview=beforeDemo.preview;reveal=beforeDemo.reveal;play=false;beforeDemo=undefined;refresh();
 };
 return {showFrame,endDemo,setPlaybackRate:(rate:number)=>{playbackRate=rate;if(scene)scene.tweens.timeScale=rate;},refresh:()=>{if(!disposed&&!simulating)refresh();},setPreview:(value:boolean)=>{if(disposed||simulating)return;preview=value;refresh();},setReveal:(value:number|undefined)=>{if(disposed||simulating)return;preview=false;reveal=value===undefined?undefined:Phaser.Math.Clamp(value,0,1);refresh();},animateRun:(valid:boolean,finish:()=>void)=>{if(scene instanceof Inquiry)scene.animateRun(valid,finish);else finish();},setPlaying:(value:boolean)=>{if(disposed||simulating||value&&blocked())return;if(play!==value){play=value;refresh();}},arm:(id:string)=>{if(disposed||simulating)return;armed=id;refresh();},assignCard,assign:assignCard,place:assignCard,dispose:()=>{disposed=true;play=false;document.removeEventListener('scroll',rebound,{capture:true});document.removeEventListener('pointerdown',beforePointer,true);game.destroy(true);}};
}
export type InquiryView=ReturnType<typeof mountInquiry>;
