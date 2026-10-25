import Phaser from 'phaser';
import type {InquiryTask,InquiryRecord} from '../inquiry-model';
import {canvas,draw} from '../draw';
import {invalidateRun} from '../inquiry-evaluate';
import {playEffect} from '../audio';
import {inquiryArt,artTime,artKey,artFrame} from '../artAssets';
type Hooks={changed:()=>void;open:(id:string)=>void;feedback:(text:string)=>void};
const WIDTH=960,HEIGHT=540;
export function mountInquiry(host:HTMLElement,task:InquiryTask,record:InquiryRecord,hooks:Hooks,reduced:boolean){
 let refresh=()=>{};let play=false;let disposed=false;let armed='';let reveal:number|undefined;let simulating=false;let scene:Phaser.Scene|undefined;let inputObjects:Phaser.GameObjects.GameObject[]=[];
 const blocked=()=>disposed||document.hidden||!!document.querySelector('dialog[open]');
 class Inquiry extends Phaser.Scene{
  trackSurface?:{canvas:HTMLCanvasElement;texture:Phaser.Textures.CanvasTexture};
  trackElapsed=0;
  preload(){const needed=new Set([...task.items.map(artKey),task.organism,task.kind==='sample'?'water':undefined]);for(const art of needed)if(art&&inquiryArt[art]){const asset=inquiryArt[art];if(asset.frames)asset.frames.forEach((src,i)=>this.load.image(`art-${art}-${i}`,src));else this.load.image(`art-${art}`,asset.src);}}
  create(){scene=this;refresh=()=>this.paint();this.paint();}
  wipe(){this.trackSurface=undefined;this.trackElapsed=0;inputObjects=[];this.children.removeAll(true);for(const name of this.textures.getTextureKeys())if(name.startsWith('plate-'))this.textures.remove(name);}
  text(x:number,y:number,text:string,size=23,color='#234b3c',width=330){return this.add.text(x,y,text,{fontFamily:'Lab Display, Malgun Gothic',fontSize:`${Math.max(28,size)}px`,color,align:'center',wordWrap:{width,useAdvancedWrap:true},lineSpacing:4}).setOrigin(.5);}
  caption(x:number,y:number,label:string,size=28,color='#234b3c',width=850){return this.text(x,y,label,size,color,width).setBackgroundColor('#fff9e9').setPadding(12,7);}
  plate(x:number,y:number,w:number,h:number,label:string,fill=0xfffbee){const box=this.add.rectangle(x,y,w,h,fill,.94).setStrokeStyle(3,0x668972);this.text(x,y,label,22,'#234b3c',w-20);return box;}
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
   this.paintPublish();
  }
  paintConnections(){
   const n=task.items.length;const columns=n>3?2:1;const itemWidth=columns===2?262:390;const rows=Math.ceil(n/columns);const rowH=Math.min(200,430/rows);
   const targetWidth=task.targets.length>2?190:240;const targetX=task.targets.length>2?827:805;
   const anchors=task.targets.map((t,i)=>({id:t.id,x:targetX,y:90+(i+.5)*(400/task.targets.length)}));
   const lines=this.add.graphics();for(const [i,it] of task.items.entries()){const x=columns===2?165+(i%2)*280:245;const y=65+(Math.floor(i/columns)+.5)*rowH;const target=anchors.find(a=>a.id===record.assignments[it.id]);if(target){lines.lineStyle(5,0x9aaf84,.85);lines.lineBetween(x+itemWidth/2,y,target.x-targetWidth/2,target.y);}}
   anchors.forEach(a=>{const info=task.targets.find(t=>t.id===a.id)!;this.plate(a.x,a.y,targetWidth,task.targets.length>2?98:145,info.label,0xe8edce);const zone=this.add.zone(a.x,a.y,targetWidth+10,task.targets.length>2?105:154).setRectangleDropZone(targetWidth+10,task.targets.length>2?105:154).setInteractive({useHandCursor:true});zone.setData('target',a.id);zone.on('pointerdown',()=>{if(armed&&!this.pauseGuard())this.assign(armed,a.id);});});
   for(const [i,it] of task.items.entries()){
    const x=columns===2?165+(i%2)*280:245,y=65+(Math.floor(i/columns)+.5)*rowH;const linked=!!record.assignments[it.id];const box=this.add.container(x,y);box.add(this.add.rectangle(0,5,itemWidth,rowH-16,0x2d4f38,.15));const back=this.add.rectangle(0,0,itemWidth,rowH-16,linked?0xdde8d1:0xfffbee,.98).setStrokeStyle(armed===it.id?5:2,armed===it.id?0xd39a3f:0x78987c);box.add(back);
    if(it.art)box.add(columns===2?this.art(0,-36,itemWidth-16,110,artKey(it)!,{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}):this.art(-117,0,144,rowH-30,artKey(it)!,{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));
    box.add(this.text(columns===2?0:65,it.art&&columns===2?51:0,(record.opened.includes(it.id)?'✓ ':'')+it.label,21,'#234b3c',columns===2?itemWidth-20:216));box.setSize(itemWidth,rowH-16).setInteractive({useHandCursor:true});this.input.setDraggable(box);inputObjects.push(box);
    let dragged=false;box.on('pointerdown',()=>{if(this.pauseGuard())return;dragged=false;armed=it.id;back.setStrokeStyle(5,0xd39a3f);});box.on('drag',(_pointer:Phaser.Input.Pointer,dx:number,dy:number)=>{if(this.pauseGuard())return;dragged=true;box.setPosition(dx,dy);box.setDepth(10);});
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
    if(isTimeline)this.add.zone(480,275,w,h).setInteractive({useHandCursor:true}).on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;if(p.x<left+w*(reveal??.5)){hooks.feedback('이후 쪽에서 달라진 부분을 표시해요.');return;}record.marks.push({x:((p.x-left)/w-.5)/record.zoom+.5-record.pan.x,y:((p.y-top)/h-.5)/record.zoom+.5-record.pan.y});record.marks=record.marks.slice(-8);record.submitted=false;this.commit();});
    const line=this.add.rectangle(split,275,5,h,0xd6a64a);const handle=this.add.rectangle(split,275,88,70,0xfff9df).setStrokeStyle(3,0x8a703c);const label=this.text(split,275,'↔',36);handle.setInteractive({useHandCursor:true});this.input.setDraggable(handle);
    handle.on('drag',(_p:Phaser.Input.Pointer,x:number)=>{if(this.pauseGuard())return;const clamped=Phaser.Math.Clamp(x,left,left+w);reveal=(clamped-left)/w;mask.clear().fillStyle(0xffffff).fillRect(clamped,top,left+w-clamped,h);line.x=handle.x=label.x=clamped;});
    this.caption(250,60,'A · 이전');this.caption(710,60,'B · 이후');this.caption(480,500,'손잡이를 밀어 같은 위치의 변화를 비교해요',28,'#3e6651',860);
   }else if(comparing){for(let i=0;i<2;i++){const x=260+i*440;this.drawSpecimen(x,265,410,340,kind,record.pins[i],i===1);this.caption(x,65,`${i===0?'A · 이전':'B · 이후'} ${isTimeline?'관찰 '+(record.pins[i]+1):'시점 '+record.pins[i]}`,24);}}
   else this.drawSpecimen(480,270,750,435,kind,record.time,true);
   if(isTrack&&reveal===undefined)this.caption(480,510,'같은 시야 · 같은 짚신벌레의 위치를 비교해요',20,'#3e6651',850);
   if(isTimeline&&reveal===undefined){const line=this.add.graphics();line.lineStyle(6,0xe5d4a7);line.lineBetween(235,505,725,505);for(let i=0;i<4;i++){const x=235+i*163;this.add.circle(x,505,35,i===record.time?0xe9bf64:0xfff9e8).setStrokeStyle(3,0x537b60).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.time=i;this.commit();});this.text(x,505,String(i+1),21);}}
  }
  specimenSize(w:number,h:number,kind:string,time:number){
   const name=inquiryArt[kind]?.frames?`art-${kind}-${artFrame(time)}`:`art-${kind}`;
   const source=this.textures.exists(name)?this.textures.get(name).getSourceImage() as HTMLImageElement:undefined;
   const aspect=task.kind==='track'?16/9:source?source.width/source.height:16/9;
   return w/h>aspect?{w:h*aspect,h}:{w,h:w/aspect};
  }
  drawSpecimen(x:number,y:number,w:number,h:number,kind:string,time:number,markable:boolean){
   ({w,h}=this.specimenSize(w,h,kind,time));
   this.add.rectangle(x,y,w+8,h+8,0xfffbee).setStrokeStyle(3,0xa9bca3);
   const marks=markable?record.marks:[];const opts={time,focus:task.kind==='microscope'?record.focus:65,light:task.kind==='microscope'?record.light:65,zoom:record.zoom,pan:record.pan,marks,trail:task.kind==='track'};
   this.art(x,y,w,h,kind,opts);
   const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});let down:{x:number;y:number}|undefined;let old={...record.pan};zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.pauseGuard())return;down={x:p.x,y:p.y};old={...record.pan};});
   zone.on('pointerup',(p:Phaser.Input.Pointer)=>{if(!down)return;const start=down;down=undefined;if(this.pauseGuard())return;const dx=p.x-start.x,dy=p.y-start.y;
    if(task.kind==='microscope'&&!record.capture&&Math.hypot(dx,dy)>20){record.pan={x:Math.max(-.35,Math.min(.35,old.x+dx/w)),y:Math.max(-.3,Math.min(.3,old.y+dy/h))};this.commit();return;}
    if(markable&&(task.kind==='microscope'&&record.capture||task.kind==='timeline'&&record.pins.length===2)){
     const px=(p.x-x+w/2)/w,py=(p.y-y+h/2)/h;record.marks.push({x:(px-.5)/record.zoom+.5-record.pan.x,y:(py-.5)/record.zoom+.5-record.pan.y});record.marks=record.marks.slice(-8);record.submitted=false;playEffect('snap');this.commit();}
   });zone.on('pointerout',()=>{down=undefined;});zone.on('pointercancel',()=>{down=undefined;});
  }
  paintSampling(){
   this.add.rectangle(325,315,616,366,0xfffbee).setStrokeStyle(3,0x8daa8b);this.art(325,315,600,350,'water');
   for(const [id,x,y,label] of [['edge',130,360,'물가 가까이'],['plant',390,265,'물풀 가까이']] as [string,number,number,string][]){this.add.circle(x,y,31,record.assignments.site===id?0xf2ce7d:0xfffbe9).setStrokeStyle(3,0x537b60).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.assignments.site=id;this.commit();});this.text(x,y+53,label,22);}
   this.plate(785,345,200,140,record.sequence===3?'한 방울 준비 완료':'받침 유리판',0xe8efe8);
   const pipette=this.add.container(record.sequence===2?550:300,125);pipette.add([this.add.rectangle(0,0,28,110,0xeaf3dc).setStrokeStyle(3,0x537d6c),this.add.ellipse(0,-62,58,60,record.sequence>0?0x72b3bc:0x4d8066),this.add.triangle(0,73,0,0,20,0,10,35,0xc1d7b8)]);pipette.setSize(80,190).setInteractive({useHandCursor:true});this.input.setDraggable(pipette);let dragged=false;
   pipette.on('pointerdown',()=>{if(!this.pauseGuard())dragged=false;});pipette.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;pipette.setPosition(x,y);});pipette.on('dragend',()=>{if(this.pauseGuard()){if(pipette.active)pipette.setPosition(record.sequence===2?550:300,125);return;}if(record.sequence===2&&pipette.x>665&&pipette.y>180){record.sequence=3;this.commit();}else if(pipette.active)pipette.setPosition(record.sequence===2?550:300,125);});
   pipette.on('pointerup',()=>{if(dragged||this.pauseGuard())return;if(!record.assignments.site){hooks.feedback('먼저 채집할 장소를 살펴봐요.');return;}if(record.sequence<2){record.sequence++;this.commit();}});
   if(record.sequence===3){pipette.setVisible(false);this.add.circle(785,315,20,0x73b4bd);}
   this.text(480,38,['채집할 장소를 살펴봐요','스포이드를 눌렀어요 · 물속에서 놓아요','유리판으로 옮겨요','한 방울 표본이 준비됐어요'][record.sequence],25);
  }
  paintBuild(){
   const slots=task.targets.map((t,i)=>({id:t.id,x:185+i*295,y:200}));const g=this.add.graphics();for(let i=0;i<2;i++){g.lineStyle(12,record.assignments[`edge${i+1}`]==='linked'?0x78ad7a:0xc7ccb8);g.lineBetween(slots[i].x+110,200,slots[i+1].x-110,200);this.add.circle(333+i*295,200,28,0xf4d68e).setStrokeStyle(2,0x668972).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;const id=`edge${i+1}`;record.assignments[id]=record.assignments[id]==='linked'?'':'linked';invalidateRun(record);this.commit();});this.text(333+i*295,200,record.assignments[`edge${i+1}`]==='linked'?'✓':'+',25);}
   slots.forEach((s,i)=>{const it=task.items.find(item=>item.id===record.assignments[s.id]);this.plate(s.x,s.y,230,180,it?'':'놓을 자리',0xfbf6df);if(it){this.art(s.x,s.y-28,206,104,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(s.x,s.y+59,it.label,21,'#234b3c',214);}this.caption(s.x,68,task.targets[i].label,23);const zone=this.add.zone(s.x,s.y,240,190).setRectangleDropZone(240,190).setInteractive({useHandCursor:true});zone.setData('target',s.id);zone.on('pointerdown',()=>{if(armed)this.place(armed,s.id);});});
   task.items.forEach((it,i)=>{const x=132+i*233,y=431;const box=this.add.container(x,y);box.add(this.add.rectangle(0,5,210,154,0x2d4f38,.15));box.add(this.add.rectangle(0,0,210,154,armed===it.id?0xf2dca2:0xfffbee,.98).setStrokeStyle(3,0x749773));box.add(this.art(0,-33,188,72,artKey(it)||'question',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'}));box.add(this.text(0,42,it.label,21,'#234b3c',194));box.setSize(210,154).setInteractive({useHandCursor:true});this.input.setDraggable(box);let dragged=false;box.on('pointerdown',()=>{if(this.pauseGuard())return;armed=it.id;dragged=false;});box.on('pointerup',()=>{if(!dragged&&!this.pauseGuard()){hooks.open(it.id);}});box.on('drag',(_p:Phaser.Input.Pointer,x:number,y:number)=>{if(this.pauseGuard())return;dragged=true;box.setPosition(x,y).setDepth(10);});box.on('drop',(_p:Phaser.Input.Pointer,zone:Phaser.GameObjects.Zone)=>this.place(it.id,String(zone.getData('target'))));box.on('dragend',()=>{if(box.active)box.setPosition(x,y).setDepth(0);});});
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
  paintPublish(){
   task.items.forEach((it,i)=>{const x=180+i*300;const selected=record.assignments.case===it.id;this.plate(x,170,260,245,'',selected?0xe1edcf:0xfffbee);this.art(x,135,230,140,artKey(it)||'yogurt',{time:artTime(artKey(it),it.detail,it.id),fit:'contain'});this.text(x,248,it.label,30);this.add.zone(x,170,260,245).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.pauseGuard())return;record.assignments.case=it.id;record.assignments.action='';playEffect('snap');this.commit();});});
   this.plate(480,415,850,180,'',0xfffbee);this.text(480,345,'내 소개 카드',28);
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
