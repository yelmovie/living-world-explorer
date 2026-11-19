import Phaser from 'phaser';
import {addHandLens} from './hand-lens';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {canvas,draw} from '../draw';
import {assignCard as applyCard,syncBuildLinks,chooseCase} from '../inquiry-actions';
import {playEffect} from '../audio';
import {inquiryArt,artTime,artKey,artFrame,magnifyFor,type MagnifyView} from '../artAssets';
import {addMark,markHint,viewToImage,observedKind,featureAt} from '../observation';
import type {ObservationFrame} from '../inquiry-playback';
import {mountScopeDecor} from './scope-view';
export type InquiryHooks={/** 2026-11-18: the live clip's moment (0–10) while it plays outside the demo. */tick?:(time:number)=>void;assigned:(id:string,target:string)=>void;changed:()=>void;open:(id:string)=>void;feedback:(text:string,kind?:'retry'|'success')=>void;ready:(ok:boolean)=>void};
const WIDTH=960,HEIGHT=540;
/** The filmed paramecium clip is sampled every half second over its ten seconds. */
const LIVE_STEPS=20;
export function mountInquiry(host:HTMLElement,task:InquiryTask,learner:InquiryRecord,hooks:InquiryHooks,reduced:boolean){
 let record=learner;
 let beforeDemo:{preview:boolean;reveal:number|undefined}|undefined;
 let refresh=()=>{};let play=false;/* Learner playback keeps its own clock so the saved record.time only changes when the learner pins or drags. */let liveClock=0;let preview=false;let disposed=false;let armed='';let reveal:number|undefined;let simulating=false;let scene:Phaser.Scene|undefined;let playbackRate=1;
 const scope=task.kind==='track'?mountScopeDecor(host,'water'):undefined;
 // 2026-11-19 놀이 화면 비율: beside the tool panel the free box is taller than 16:9 on 4:3 and 16:10 screens,
 // so these scenes take the box's shape (960 wide, 540–800 tall) and spread their layout down instead of floating in a short strip.
 const tall=task.kind==='track'||task.kind==='build'||task.kind==='publish';
 const fitHeight=()=>{const box=host.getBoundingClientRect();return tall&&box.width>40&&box.height>40?Math.round(Phaser.Math.Clamp(WIDTH*box.height/box.width,HEIGHT,800)):HEIGHT;};
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 // Scene colours follow the DOM tokens (styles.css stage layer), so one token edit restyles both.
 const css=(name:string,fallback:number)=>{const v=getComputedStyle(host).getPropertyValue(name).trim();return /^#[0-9a-f]{6}$/i.test(v)?parseInt(v.slice(1),16):fallback;};
 const tone={accent:css('--stage-accent',0x557a3f),soft:css('--stage-soft',0xe4edd5),paper:css('--paper-face',0xfffaf0),line:css('--paper-line',0xe6d8bc),brass:css('--brass-soft',0xecd08f),pick:0xd39a3f,shade:0x22312a,ink:'#1f3f31'};
 const LENS_HOLE=.3;// hole radius / width of ui/microscope-frame.webp (scripts/ui-props.mjs)
 class Inquiry extends Phaser.Scene{
  trackSurface?:{canvas:HTMLCanvasElement;texture:Phaser.Textures.CanvasTexture};
  trackElapsed=0;
  failed=false;
  /** Scene height (540 on a 16:9 box) and the vertical stretch the build and publish layouts use. */
  get H(){return this.scale.height;}
  y(v:number){return v*this.H/HEIGHT;}
  preload(){this.load.on('loaderror',(file:Phaser.Loader.File)=>{if(!file.key.startsWith('ui-'))this.failed=true;});const view=task.kind==='microscope'?magnifyFor(task.organism,record.v===2):undefined;const needed=new Set([...task.items.map(artKey),task.organism,observedKind(task,record),task.kind==='sample'?'water':undefined,view?.context,view?.lens]);for(const art of needed)if(art&&inquiryArt[art]){const asset=inquiryArt[art];if(asset.frames)asset.frames.forEach((src,i)=>this.load.image(`art-${art}-${i}`,src));else this.load.image(`art-${art}`,asset.src);}
   if(task.kind==='track')for(let i=0;i<=LIVE_STEPS;i++)this.load.image(`live-paramecium-${i}`,`assets/study/live/paramecium-${String(i).padStart(2,'0')}.webp`);
   // Decorative props are optional: a missing prop falls back to the drawn card, never blocks the activity.
   const props=['tape',...task.kind==='microscope'?['microscope-frame',...(view?['hand-lens']:[])]:[],...task.id==='M5-1'?['yogurt-maker']:[],...task.kind==='sample'?['dropper','slide','slide-drop','water-drop']:[]];for(const p of props)this.load.image(`ui-${p}`,`assets/ui/${p==='slide'?'slide-flat':p}.webp`);}
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
  /** Filmed frames for the paramecium track: two neighbours and how far between them the time falls. */
  liveFrames(time=0){const at=Math.max(0,Math.min(10,time))/10*LIVE_STEPS,a=Math.floor(at),b=Math.min(LIVE_STEPS,a+1),get=(i:number)=>this.textures.exists(`live-paramecium-${i}`)?this.textures.get(`live-paramecium-${i}`).getSourceImage() as CanvasImageSource:undefined;const live=get(a);return live?{live,liveNext:get(b),liveMix:at-a}:{};}
  art(x:number,y:number,w:number,h:number,kind:string,options:Parameters<typeof draw>[2]&{fit?:'contain';softEdge?:boolean}={}){
   if(kind==='paramecium'&&options.trail)options={...options,...this.liveFrames(options.time)};
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(options.time)}`:`art-${kind}`;
   const image=this.textures.exists(name)?this.textures.get(name).getSourceImage() as CanvasImageSource:undefined;
   const source=image as {width:number;height:number}|undefined;
   const c=options.fit==='contain'?canvas(640,Math.round(640*(source?.height||360)/(source?.width||640))):canvas(Math.round(w),Math.round(h));
   draw(c,kind,{...options,image,markerSpace:'world'});
   if(options.softEdge){
    const g=c.getContext('2d')!;g.save();g.globalCompositeOperation='destination-in';
    for(const vertical of [false,true]){
     const edge=g.createLinearGradient(0,0,vertical?0:c.width,vertical?c.height:0);
     edge.addColorStop(0,'transparent');edge.addColorStop(.025,'white');edge.addColorStop(.975,'white');edge.addColorStop(1,'transparent');
     g.fillStyle=edge;g.fillRect(0,0,c.width,c.height);
    }
    g.restore();
   }
   const key=`plate-${crypto.randomUUID()}`;const texture=this.textures.addCanvas(key,c)!;if(task.kind==='track'&&kind==='paramecium'&&record.level<2)this.trackSurface={canvas:c,texture};const picture=this.add.image(x,y,key);if(options.fit==='contain')picture.setScale(Math.min(w/c.width,h/c.height));return picture;}
  commit(){playEffect(task.kind==='sample'?(record.sequence===3?'pipette-drop':'water'):'click');hooks.changed();this.paint();}
  // Phaser also forwards window presses, whose coordinates can be stale just after scrolling.
  // Keep outside releases available for drag cleanup, but only apply an action from the canvas.
  pauseGuard(){return blocked()||simulating||!!beforeDemo||this.input.activePointer.event?.target!==this.game.canvas;}
  paint(){if(disposed)return;const next=fitHeight();if(Math.abs(next-this.H)>=8)this.scale.setGameSize(WIDTH,next);this.wipe();
   if(task.kind==='microscope'||task.kind==='track'||task.kind==='timeline'){this.paintObservation();return;}
   if(task.kind==='sample'){this.paintSampling();return;}
   if(task.kind==='build'){this.paintBuild();return;}
   if(task.kind==='review'){this.paintReview();return;}
   this.paintPublish();
  }
  paintObservation(){
   const isTimeline=task.kind==='timeline',isTrack=task.kind==='track';const kind=observedKind(task,record)||'mushroom';const comparing=record.pins.length===2&&Number.isFinite(record.pins[0])&&Number.isFinite(record.pins[1])&&!play&&!preview;
   // Cilia close-up: after A·B the same paramecium is shown still and large so its edge hairs can be marked.
   scope?.show(record.level===2?'scope':null);
   const H=this.H,mid=(H-HEIGHT)/2;
   if(isTrack&&record.level===2){this.drawSpecimen(480,282+mid,440,440,kind,0,true);return;}
   if(comparing&&reveal!==undefined){
    const cy=275+mid,{w,h}=this.specimenSize(Math.min(900,750+(H-HEIGHT)*1.6),H-180,kind,record.pins[0]);const left=480-w/2,top=cy-h/2;this.drawSpecimen(480,cy,w,h,kind,record.pins[0],false);
    const after=this.art(480,cy,w,h,kind,{time:record.pins[1],focus:65,light:65,trail:isTrack,marks:record.marks});
    const split=left+w*reveal;const mask=this.add.graphics().fillStyle(0xffffff).fillRect(split,top,left+w-split,h);mask.setVisible(false);after.setMask(mask.createGeometryMask());
    if(isTimeline)this.add.zone(480,cy,w,h).setInteractive({useHandCursor:true}).on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;if(p.x<left+w*(reveal??.5)){hooks.feedback('이후 쪽에서 달라진 부분을 표시해요.');return;}if(!addMark(task,record,viewToImage({x:(p.x-left)/w,y:(p.y-top)/h},record)))return hooks.feedback(markHint(task));record.submitted=false;this.commit();});
    const line=this.add.rectangle(split,cy,5,h,0xd6a64a);const handle=this.add.rectangle(split,cy,88,70,0xfff9df).setStrokeStyle(3,0x8a703c);const label=this.text(split,cy,'↔',36);handle.setInteractive({useHandCursor:true});this.input.setDraggable(handle);
    handle.on('drag',(_p:Phaser.Input.Pointer,x:number)=>{if(this.pauseGuard())return;const clamped=Phaser.Math.Clamp(x,left,left+w);reveal=(clamped-left)/w;mask.clear().fillStyle(0xffffff).fillRect(clamped,top,left+w-clamped,h);line.x=handle.x=label.x=clamped;});
    const capY=Math.max(60,top-35);this.caption(250,capY,'A · 이전');this.caption(710,capY,'B · 이후');this.caption(480,H-40,'손잡이를 밀어 같은 위치의 변화를 비교해요',28,'#3e6651',860);
   }else if(comparing){
    for(let i=0;i<2;i++){
     const x=260+i*440;
     this.drawSpecimen(x,265+mid,410,340,kind,record.pins[i],i===1);
     this.caption(x,65+mid,`${i===0?'A · 이전':'B · 이후'} ${isTimeline?'관찰 '+(record.pins[i]+1):'시점 '+record.pins[i]}`,28,tone.ink,370);
    }
    if(isTimeline)this.caption(700,455+mid,'달라진 곳을 눌러요',28,tone.ink,370);
   }
   else{this.drawSpecimen(480,isTimeline?255:270+mid,isTimeline?730:Math.min(900,750+(H-HEIGHT)*1.6),isTimeline?390:435+(H-HEIGHT),kind,isTrack&&play&&!beforeDemo?liveClock:record.time,task.kind==='microscope');if(preview&&!play&&(isTimeline||isTrack))this.caption(480,30,isTimeline?'지금 고른 모습 · 관찰 '+(record.time+1):'지금 고른 순간 · 시점 '+Math.round(record.time),22);}
   if(isTrack&&(!comparing||reveal===undefined))this.caption(480,H-30,'같은 시야 · 같은 짚신벌레의 위치를 비교해요',20,'#3e6651',850);
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
   }else if(closeUp){
    ({w,h}=this.specimenSize(w,h,kind,time));
    const r=230,rim=this.add.graphics();
    rim.fillStyle(0x111917).fillCircle(x,y,r+13);
    rim.lineStyle(4,0x5c6b5b).strokeCircle(x,y,r+10);
    rim.lineStyle(3,0x9ba592).strokeCircle(x,y,r+2);
    rim.fillStyle(0xe9ebd4).fillCircle(x,y,r);
    const picture=this.art(x,y,w,h,kind,{...opts,softEdge:true});
    const mask=this.make.graphics({},false).fillStyle(0xffffff).fillCircle(x,y,r);
    picture.setMask(mask.createGeometryMask());
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
   if(level===0){const ring=this.add.graphics();ring.lineStyle(5,0xffffff,.95).strokeCircle(fx,fy,62);ring.lineStyle(3,tone.accent,.9).strokeCircle(fx,fy,67);if(!reduced)this.tweens.add({targets:ring,alpha:.35,duration:900,yoyo:true,repeat:2,ease:'Sine.easeInOut'});}
   else{
    addHandLens(this,{picture,start:view.focus,blocked:()=>this.pauseGuard(),inspect:()=>{record.level=2;this.commit();}});
    this.caption(x,30,view.captions[level],22);return;
   }
   this.add.zone(fx,fy,r*2,r*2).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.level=level+1;this.commit();});
   this.caption(x,30,view.captions[level],22);
  }
  paintSampling(){
   const site=!!record.assignments.site,collected=record.sequence>=2,prepared=record.sequence===3;
   // 2026-11-17 3초 규칙: the panel's counter is the one progress display, so the water photo takes the rail's room (60%+ of a 16:10 screen).
   this.card(385,290,760,452,{fill:0xffffff,radius:14});this.art(385,290,740,432,'water');
   for(const [id,x,y,label] of [['edge',145,346,'물가 가까이'],['plant',465,228,'물풀 가까이']] as [string,number,number,string][]){
    const chosen=record.assignments.site===id;const ring=this.add.graphics();ring.lineStyle(5,0xffffff,.95).strokeCircle(x,y,30);ring.lineStyle(3,tone.accent,.9).strokeCircle(x,y,34);const dot=this.add.graphics();dot.fillStyle(chosen?tone.accent:0xffffff,chosen?1:.6).fillCircle(x,y,chosen?20:14);
    if(!chosen&&!reduced)this.tweens.add({targets:ring,alpha:.35,duration:900,yoyo:true,repeat:2,ease:'Sine.easeInOut'});
    this.add.zone(x,y,88,88).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard()||record.assignments.site===id)return;record.assignments.site=id;record.sequence=0;this.commit();});this.caption(x,y+58,(chosen?'✓ ':'')+label,28,tone.ink,230);}
   const slideX=862,slideY=346;
   this.card(slideX,slideY+14,184,226,{fill:prepared?tone.soft:tone.paper,radius:20,stroke:collected?tone.accent:tone.line,width:collected?4:2});
   if(prepared)this.badge(slideX+64,slideY-72);
   // 2026-11-18: a real wet mount is one small, flat drop, so the placed sample is drawn into the slide picture instead of a big bubble on top.
   if(prepared&&this.textures.exists('ui-slide-drop'))this.add.image(slideX,slideY,'ui-slide-drop').setDisplaySize(164,46);
   else{if(this.textures.exists('ui-slide'))this.add.image(slideX,slideY,'ui-slide').setDisplaySize(164,69);else this.plate(slideX,slideY,150,80,'',0xe8efe8);if(prepared)this.add.ellipse(slideX,slideY,26,10,0x9fd3d6,.7);}
   this.text(slideX,slideY+82,prepared?'받침 유리판':collected?'여기에 한 방울 놓아요':'받침 유리판',24,tone.ink,166);
   this.add.zone(slideX,slideY+14,184,226).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
    if(this.pauseGuard()||record.sequence===3)return;
    if(record.sequence!==2)return hooks.feedback(record.assignments.site?'스포이드를 먼저 눌러 물 한 방울을 담아요.':'물가나 물풀 가까이를 먼저 골라요.');
    record.sequence=3;this.commit();
   });
   const home={x:record.sequence===2?640:300,y:168};const pipette=this.add.container(home.x,home.y);
   if(this.textures.exists('ui-dropper')){if(record.sequence>0){const glow=this.add.graphics();glow.fillStyle(0x9fd3d6,.45).fillEllipse(0,-62,64,64);pipette.add(glow);}pipette.add(this.add.image(0,0,'ui-dropper').setDisplaySize(31,210));if(record.sequence===2&&this.textures.exists('ui-water-drop'))pipette.add(this.add.image(0,109,'ui-water-drop').setDisplaySize(13,10));}
   else pipette.add([this.add.rectangle(0,0,28,110,0xeaf3dc).setStrokeStyle(3,0x537d6c),this.add.ellipse(0,-62,58,60,record.sequence>0?0x72b3bc:0x4d8066),this.add.triangle(0,73,0,0,20,0,10,35,0xc1d7b8)]);
   pipette.setSize(90,220).setInteractive({useHandCursor:true});this.input.setDraggable(pipette);let dragged=false;
   pipette.on('pointerdown',()=>{if(!this.pauseGuard())dragged=false;});pipette.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;pipette.setPosition(x,y);});pipette.on('dragend',()=>{if(this.pauseGuard()){if(pipette.active)pipette.setPosition(home.x,home.y);return;}if(record.sequence===2&&pipette.x>740&&pipette.y>200){record.sequence=3;this.commit();}else if(pipette.active)pipette.setPosition(home.x,home.y);});
   pipette.on('pointerup',()=>{if(dragged||this.pauseGuard())return;if(!record.assignments.site){hooks.feedback('먼저 채집할 장소를 살펴봐요.');return;}if(record.sequence<2){record.sequence=2;this.commit();}});
   if(record.sequence===3)pipette.setVisible(false);
   if(record.assignments.site&&record.sequence<2){
    const label=this.text(80,-70,'스포이드',22,tone.ink,125).setBackgroundColor('#fffbed').setPadding(8,4);
    pipette.add(label);
   }
  }
  paintBuild(){
   const yogurt=task.id==='M5-1';
   const Y=(v:number)=>this.y(v);
   const resetFaces:(()=>void)[]=[];const slots=task.targets.map((t,i)=>({id:t.id,x:185+i*295,y:Y(200)}));const g=this.add.graphics();
   this.card(480,Y(178),916,Y(274),{fill:yogurt?0xfff5db:tone.paper,stroke:yogurt?0xb28e51:tone.line,radius:26,alpha:.97});
   for(let i=0;i<2;i++){const linked=record.assignments[`edge${i+1}`]==='linked',color=linked?tone.accent:tone.line;g.lineStyle(6,color,1);const ay=Y(200);g.lineBetween(slots[i].x+117,ay,slots[i+1].x-120,ay);g.fillStyle(color,1).fillTriangle(slots[i+1].x-112,ay,slots[i+1].x-129,ay-10,slots[i+1].x-129,ay+10);}
   slots.forEach((s,i)=>{const it=task.items.find(item=>item.id===record.assignments[s.id]);
    if(yogurt&&s.id==='action'){
     this.drawYogurtMaker(s.x,Y(166),245,Y(150));
     this.caption(s.x,Y(274),it?it.label:'여기에 넣기',28,tone.ink,224);
    }else if(it){
     this.card(s.x,s.y,230,Y(205),{fill:tone.paper,stroke:tone.accent,width:3});
     this.art(s.x,Y(152),206,Y(88),artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});
     this.text(s.x,Y(254),it.label,28,tone.ink,210);
    }
    else{
     this.card(s.x,s.y,230,Y(205),{fill:tone.soft,stroke:tone.accent,alpha:.82});
     const guide=this.add.graphics();guide.lineStyle(2,tone.accent,.35).strokeRoundedRect(s.x-101,Y(111),202,Y(178),12);
     this.text(s.x,s.y,yogurt?(s.id==='input'?'병에 담기':'목표 음식 놓기'):'여기에 놓아요',28,tone.ink,190);
    }
    this.caption(s.x,Y(68),`${i+1} · ${yogurt&&s.id==='action'?'발효기':task.targets[i].label}`,28,tone.ink,235);const zone=this.add.zone(s.x,s.y,240,Y(190)).setRectangleDropZone(240,Y(190)).setInteractive({useHandCursor:true});zone.setData('target',s.id);zone.on('pointerdown',()=>{if(this.pauseGuard())return;if(armed)this.place(armed,s.id);else hooks.feedback('아래에서 놓고 싶은 카드를 먼저 골라요.');});});
   const ch=Y(174);task.items.forEach((it,i)=>{const x=132+i*233,y=Y(431);const box=this.add.container(x,y);const face=this.add.graphics();this.cardShape(face,0,0,210,ch,{stroke:armed===it.id?tone.pick:tone.line,width:armed===it.id?5:2});resetFaces.push(()=>this.cardShape(face,0,0,210,ch));box.add(face);box.add(this.art(0,Y(-45),188,Y(64),artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));box.add(this.text(0,Y(39),it.label,28,tone.ink,194));box.setSize(210,ch).setInteractive({useHandCursor:true});this.input.setDraggable(box);box.on('pointerdown',()=>{if(this.pauseGuard())return;armed=it.id;resetFaces.forEach(reset=>reset());this.cardShape(face,0,0,210,ch,{stroke:tone.pick,width:5});hooks.open(it.id);});box.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;box.setPosition(x,y).setDepth(10);});box.on('drop',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>this.place(it.id,String(zone.getData('target'))));box.on('dragend',()=>{if(box.active)box.setPosition(x,y).setDepth(0);});});
   if(!record.runResult){const filled=task.targets.every(t=>!!record.assignments[t.id]);if(!yogurt||!filled||armed)this.caption(480,Y(322),armed?'이제 위쪽에서 놓을 곳을 눌러요':yogurt?'아래에서 골라 작업대에 놓아요':'아래에서 카드 한 장을 골라요',22);}
   if(record.runResult){const ok=record.runResult==='supported';this.caption(480,Y(315),yogurt?(ok?'완성! 우유가 걸쭉하고 새콤해졌어요':'다시 살펴보기 · 재료와 만들 음식을 확인해요'):ok?`${task.caseName} 사례로 연결됐어요`:'흐름이 멈췄어요 · 연결과 자료를 다시 봐요',23,ok?'#286341':'#995131',850);}
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
   const Y=(v:number)=>this.y(v);
   this.card(480,Y(265),860,Y(454),{fill:0xfff5db,stroke:0xb28e51,radius:32});
   this.caption(480,Y(85),'발효기 관찰 · 시간을 빠르게 돌려 봐요',26);
   this.drawYogurtMaker(401,Y(256),416,Y(265));
   const ingredient=task.items.find(it=>it.id===record.assignments.input);
   const container=this.art(165,Y(218),100,Y(75),ingredient?artKey(ingredient)||'milk':'milk',{fit:'contain'});
   const dial=this.add.circle(750,Y(165),42,0xfff6da).setStrokeStyle(6,0xaa8150);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;this.add.circle(dial.x+Math.sin(a)*32,dial.y-Math.cos(a)*32,2.5,0x775735);}
   const hand=this.add.rectangle(dial.x,dial.y,5,28,0x745238).setOrigin(.5,1);
   if(valid){
    const result=this.art(750,Y(325),190,Y(124),'yogurt',{fit:'contain'}).setAlpha(0);
    const label=this.text(750,Y(241),'완성!',26,tone.ink).setAlpha(0);
    this.tweens.add({targets:[result,label],delay:3850,alpha:1,y:'-=18',duration:650,ease:'Sine.easeOut'});
   }
   const line=this.text(480,Y(432),'고른 재료를 발효기에 넣어요.',27,tone.ink,790);
   this.tweens.add({targets:container,x:388,y:Y(250),alpha:0,duration:750,ease:'Sine.easeIn'});
   this.tweens.add({targets:hand,angle:valid?660:100,duration:valid?6000:2300,ease:'Linear',onUpdate:t=>{
    line.setText(!valid?'재료와 만들 음식이 잘 맞는지 살펴봐요.':t.progress<.25?'발효기가 우유를 따뜻하게 유지해요.':t.progress<.67?'유산균이 우유 속 당을 이용해 젖산을 만들어요.':'시간이 지나면 우유가 걸쭉하고 새콤해져요.');
   },onComplete:()=>{simulating=false;if(!disposed)finish();}});
  }
  animateRun(valid:boolean,finish:()=>void){
   if(simulating||disposed)return;simulating=true;
   if(reduced){simulating=false;finish();return;}
   if(task.id==='M5-1'){this.ferment(valid,finish);return;}
   const signal=this.add.circle(185,this.y(200),18,0xffde7a).setStrokeStyle(4,0x547b51).setDepth(30);
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
   const Y=(v:number)=>this.y(v);
   task.items.forEach((it,i)=>{const x=180+i*300;const selected=record.assignments.case===it.id;this.card(x,Y(170),260,Y(245),{fill:selected?tone.soft:tone.paper,stroke:selected?tone.accent:tone.line,width:selected?4:2});if(selected)this.badge(x+118,Y(58));this.art(x,Y(135),230,Y(140),artKey(it)||'yogurt',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(x,Y(248),it.label,30);this.add.zone(x,Y(170),260,Y(245)).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;if(chooseCase(task,record,it.id)){playEffect('snap');this.commit();}});});
   this.card(480,Y(415),850,Y(180));
   this.text(480,Y(347),'내 소개 카드',28);
   this.add.graphics().lineStyle(2,tone.line,1).lineBetween(88,Y(372),872,Y(372));
   this.text(480,Y(438),record.note.length>68?record.note.slice(0,68)+'…':record.note||'사례를 고르면 나만의 소개를 완성할 수 있어요.',28,tone.ink,780);
  }
  update(_time:number,delta:number){
   if(blocked()){this.tweens.pauseAll();return;}this.tweens.resumeAll();
   if(!play||task.kind!=='track'||simulating)return;
   const demo=!!beforeDemo,step=delta/1000*playbackRate;if(demo)record.time=(record.time+step)%10;else liveClock=(liveClock+step)%10;const now=demo?record.time:liveClock;this.trackElapsed+=delta;
   // Playback repaints one persistent canvas, never the text, input zones or display list.
   if(this.trackSurface&&this.trackElapsed>=1000/30){this.trackElapsed=0;const image=this.textures.exists('art-paramecium')?this.textures.get('art-paramecium').getSourceImage() as CanvasImageSource:undefined;draw(this.trackSurface.canvas,task.organism||'paramecium',{time:now,focus:65,light:65,zoom:record.zoom,pan:record.pan,trail:true,image,...this.liveFrames(now)});this.trackSurface.texture.refresh();if(!demo)hooks.tick?.(now);}
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:WIDTH,height:fitHeight(),transparent:true,scene:Inquiry,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false,render:{antialias:true}});
 // Narrow layouts scroll inside the screen, not the window; Phaser only re-reads the canvas position on resize, so taps drifted after scrolling.
 const rebound=()=>game.scale?.updateBounds();
 // Window or panel size changes repaint the taller scenes at the box's new shape (paint() resizes the game first).
 const reshape=new ResizeObserver(()=>{if(tall&&scene&&!disposed&&!simulating&&Math.abs(fitHeight()-game.scale.height)>=8)refresh();});reshape.observe(host);document.addEventListener('scroll',rebound,{capture:true,passive:true});
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
  return {showFrame,endDemo,setPlaybackRate:(rate:number)=>{playbackRate=rate;if(scene)scene.tweens.timeScale=rate;},refresh:()=>{if(!disposed&&!simulating)refresh();},setPreview:(value:boolean)=>{if(disposed||simulating)return;preview=value;refresh();},setReveal:(value:number|undefined)=>{if(disposed||simulating)return;preview=false;reveal=value===undefined?undefined:Phaser.Math.Clamp(value,0,1);refresh();},animateRun:(valid:boolean,finish:()=>void)=>{if(scene instanceof Inquiry)scene.animateRun(valid,finish);else finish();},setPlaying:(value:boolean)=>{if(disposed||simulating||value&&blocked())return;if(play!==value){if(value&&!beforeDemo)liveClock=record.time;play=value;refresh();}},arm:(id:string)=>{if(disposed||simulating)return;armed=id;refresh();},assignCard,assign:assignCard,place:assignCard,dispose:()=>{disposed=true;play=false;reshape.disconnect();scope?.dispose();document.removeEventListener('scroll',rebound,{capture:true});document.removeEventListener('pointerdown',beforePointer,true);game.destroy(true);}};
}
export type InquiryView=ReturnType<typeof mountInquiry>;
