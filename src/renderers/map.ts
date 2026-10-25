import Phaser from 'phaser';
import type {Point} from '../model';
import {MAP_WIDTH,MAP_HEIGHT,mapSpawn,locations,pathGraph,destinationNodeIds,routeBetween,nearestRoadPoint,mapAssets} from '../mapData';
export {locations} from '../mapData';
type Direction='up'|'down'|'left'|'right';
let previousRepair:boolean[]|undefined;

/** The map is a ground-plane road network. DOM labels and the canvas share these coordinates. */
export function mountMap(host:HTMLElement,position:Point,completed:boolean[],onArrive:(index:number,point:Point)=>void,reduced:boolean,onMove?:(point:Point)=>void){
 let requested:number|undefined;let navigate:(index:number)=>void=()=>{};let walk:(direction:Direction)=>void=()=>{};let stop:()=>void=()=>{};let disposed=false;
 const repaired=completed.filter(Boolean).length;
 class Village extends Phaser.Scene{
  private hero!:Phaser.GameObjects.Container;
  private friend!:Phaser.GameObjects.Container;
  private heroImage!:Phaser.GameObjects.Image;
  private friendImage!:Phaser.GameObjects.Image;
  private route:Point[]=[];
  private destination:number|undefined;
  private pathHistory:Point[]=[];
  private keys=new Set<string>();
  private held:Direction|undefined;
  private moving=false;
  private insideDoors=new Set<number>();
  private elapsed=0;
  private direction='down';
  private friendDirection='down';
  preload(){
   this.load.image('village',mapAssets.terrain);
   for(const d of ['down','right','up','left']){
    this.load.image(`moa-${d}`,`assets/map-moa-${d==='left'?'left-v2':d}.webp`);
    this.load.image(`friend-${d}`,`assets/map-companion-${d}.webp`);
   }
  }
  create(){
   if(this.textures.exists('village'))this.add.image(MAP_WIDTH/2,MAP_HEIGHT/2,'village').setDisplaySize(MAP_WIDTH,MAP_HEIGHT);
   else this.add.rectangle(MAP_WIDTH/2,MAP_HEIGHT/2,MAP_WIDTH,MAP_HEIGHT,0xc8d6b5);
   const next=completed.findIndex(v=>!v);const current=locations[next<0?5:next];
   const ring=this.add.ellipse(current.x,current.y+2,74,24,0xf7cd69,.45).setStrokeStyle(3,0xffedb0,.9);if(!reduced)this.tweens.add({targets:ring,alpha:.55,scaleX:1.1,duration:1000,yoyo:true,repeat:-1});
   locations.forEach((p,i)=>{if(i<5&&!completed[i])return;const lit=i===5?repaired===5:completed[i];if(!lit)return;const aura=this.add.ellipse(p.x,p.y-24,110,115,0xffdf8c,.13);this.add.circle(p.x-21,p.y-48,4,0xffe5a3,.95);this.add.circle(p.x+21,p.y-48,4,0xffe5a3,.95);this.add.circle(p.x-40,p.y+2,5,0xffdc86,.95);if(!reduced)this.tweens.add({targets:aura,alpha:.22,duration:1700+i*100,yoyo:true,repeat:-1});});
   const valid=Number.isFinite(position.x)&&Number.isFinite(position.y)&&position.x>=0&&position.y>=0&&position.x<=MAP_WIDTH&&position.y<=MAP_HEIGHT;
   const spawn=nearestRoadPoint(valid?position:mapSpawn);
   this.hero=this.add.container(spawn.x,spawn.y);this.hero.add(this.add.ellipse(0,-2,37,13,0x203e2f,.3));
   this.heroImage=this.add.image(0,0,'moa-down').setOrigin(.5,1);this.heroImage.setScale(92/this.heroImage.height);this.hero.add(this.heroImage);
   this.friend=this.add.container(spawn.x,Math.min(MAP_HEIGHT-18,spawn.y+34));this.friend.add(this.add.ellipse(0,-2,25,10,0x203e2f,.23));this.friendImage=this.add.image(0,0,'friend-down').setOrigin(.5,1);this.friendImage.setScale(65/this.friendImage.height);this.friend.add(this.friendImage);
   this.pathHistory=[{x:this.friend.x,y:this.friend.y},{...spawn}];locations.forEach((p,i)=>{if(Math.hypot(p.x-spawn.x,p.y-spawn.y)<24)this.insideDoors.add(i);});
   // Restored structures remain brighter; this is derived from the saved evidence, not a second progress store.
   this.add.rectangle(MAP_WIDTH/2,MAP_HEIGHT/2,MAP_WIDTH,MAP_HEIGHT,0x263f3d,.21*(1-repaired/5)).setDepth(10000);
   if(previousRepair&&!reduced)completed.forEach((done,i)=>{if(done&&!previousRepair![i])this.restoration(i);});previousRepair=[...completed];
   navigate=(index:number)=>{if(!locations[index])return;this.keys.clear();this.held=undefined;this.destination=index;if(reduced){this.hero.setPosition(locations[index].x,locations[index].y);this.friend.setPosition(locations[index].x,locations[index].y+30);this.route=[];this.arrive();return;}this.route=routeBetween({x:this.hero.x,y:this.hero.y},destinationNodeIds[index]);};
   walk=(direction:Direction)=>{this.route=[];this.destination=undefined;this.held=direction;};
   stop=()=>{this.held=undefined;this.keys.clear();};
   this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
    if(document.hidden||document.querySelector('dialog[open]'))return;
    const tap={x:pointer.worldX,y:pointer.worldY};const index=locations.findIndex(p=>Math.hypot(tap.x-p.x,tap.y-p.y)<65);
    if(index>=0){navigate(index);return;}
    const target=nearestRoadPoint(tap);if(Math.hypot(target.x-tap.x,target.y-tap.y)>62)return;
    const nearest=pathGraph.reduce((a,b)=>Math.hypot(target.x-a.point.x,target.y-a.point.y)<Math.hypot(target.x-b.point.x,target.y-b.point.y)?a:b);
    this.keys.clear();this.held=undefined;this.destination=undefined;this.route=routeBetween({x:this.hero.x,y:this.hero.y},nearest.id);this.route.push(target);
   });
   this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(document.querySelector('dialog[open]'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();this.keys.add(e.code);this.route=[];this.destination=undefined;}});
   this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.keys.delete(e.code));
   const blur=()=>{this.keys.clear();this.held=undefined;};document.addEventListener('visibilitychange',blur);window.addEventListener('blur',blur);this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',blur);window.removeEventListener('blur',blur);});
   this.syncCamera();if(requested!==undefined)navigate(requested);
  }
  private restoration(index:number){
   const points=routeBetween(locations[index],destinationNodeIds[5]);const light=this.add.circle(locations[index].x,locations[index].y,7,0xffe9a8).setDepth(9000);let part=0;const next=()=>{const p=points[part++];if(!p){const halo=this.add.ellipse(locations[5].x,locations[5].y,24,10).setStrokeStyle(4,0xffdfa0).setDepth(9000);this.tweens.add({targets:halo,scale:5,alpha:0,duration:800,onComplete:()=>halo.destroy()});light.destroy();return;}this.tweens.add({targets:light,x:p.x,y:p.y,duration:Math.max(180,Phaser.Math.Distance.Between(light.x,light.y,p.x,p.y)*2),onComplete:next});};this.time.delayedCall(500,next);
  }
  private syncCamera(){onMove?.({x:this.hero.x,y:this.hero.y});this.scale.updateBounds();}
  private face(dx:number,dy:number,friend=false){
   const direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const previous=friend?this.friendDirection:this.direction;if(previous===direction)return;
   const image=friend?this.friendImage:this.heroImage;image.setTexture(`${friend?'friend':'moa'}-${direction}`);image.setScale((friend?65:92)/image.height);if(friend)this.friendDirection=direction;else this.direction=direction;
  }
  private arrive(){if(this.destination===undefined)return;const index=this.destination;this.destination=undefined;this.route=[];this.heroImage.y=0;this.syncCamera();onArrive(index,{x:this.hero.x,y:this.hero.y});}
  update(_time:number,delta:number){
   if(!this.hero||disposed)return;
   const blocked=document.hidden||!!document.querySelector('dialog[open]');if(blocked){this.keys.clear();this.held=undefined;this.tweens.pauseAll();return;}this.tweens.resumeAll();
   const seconds=Math.min(delta,50)/1000;this.elapsed+=seconds;const start={x:this.hero.x,y:this.hero.y};let next:Point|undefined;
   const dx=(this.keys.has('ArrowRight')||this.keys.has('KeyD')||this.held==='right'?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('KeyA')||this.held==='left'?1:0);
   const dy=(this.keys.has('ArrowDown')||this.keys.has('KeyS')||this.held==='down'?1:0)-(this.keys.has('ArrowUp')||this.keys.has('KeyW')||this.held==='up'?1:0);
   const speed=190;
   if(dx||dy){const len=Math.hypot(dx,dy);const wanted={x:start.x+dx/len*speed*seconds,y:start.y+dy/len*speed*seconds};const road=nearestRoadPoint(wanted);if(Math.hypot(wanted.x-road.x,wanted.y-road.y)<25)next=road;}
   else if(this.route.length){const target=this.route[0];const distance=Math.hypot(target.x-start.x,target.y-start.y);const amount=speed*seconds;if(distance<=amount){next=target;this.route.shift();}else next={x:start.x+(target.x-start.x)/distance*amount,y:start.y+(target.y-start.y)/distance*amount};}
   this.moving=!!next&&Math.hypot(next.x-start.x,next.y-start.y)>.01;
   if(this.moving&&next){this.face(next.x-start.x,next.y-start.y);this.hero.setPosition(next.x,next.y);const last=this.pathHistory.at(-1)!;if(Math.hypot(last.x-next.x,last.y-next.y)>2)this.pathHistory.push({...next});if(this.pathHistory.length>250)this.pathHistory.shift();this.syncCamera();}
   this.heroImage.y=!reduced&&this.moving?-Math.abs(Math.sin(this.elapsed*14))*3:0;
   let following=0;let friendTarget={x:this.friend.x,y:this.friend.y};for(let i=this.pathHistory.length-1;i>0;i--){const a=this.pathHistory[i],b=this.pathHistory[i-1];const d=Math.hypot(a.x-b.x,a.y-b.y);following+=d;if(following>=43){const t=(following-43)/Math.max(1,d);friendTarget={x:b.x+(a.x-b.x)*t,y:b.y+(a.y-b.y)*t};break;}}
   const fdx=friendTarget.x-this.friend.x,fdy=friendTarget.y-this.friend.y;if(Math.hypot(fdx,fdy)>.4){this.face(fdx,fdy,true);this.friend.setPosition(friendTarget.x,friendTarget.y);}
   this.friendImage.y=!reduced&&this.moving?-Math.abs(Math.sin(this.elapsed*16+.8))*4:0;this.hero.setDepth(this.hero.y+100);this.friend.setDepth(this.friend.y+100);
   if(this.destination!==undefined&&!this.route.length)this.arrive();
   locations.forEach((p,index)=>{const inside=Math.hypot(p.x-this.hero.x,p.y-this.hero.y)<20;if(inside&&!this.insideDoors.has(index)&&(dx||dy)&&this.moving){this.insideDoors.add(index);this.keys.clear();this.held=undefined;onArrive(index,{x:this.hero.x,y:this.hero.y});}else if(!inside)this.insideDoors.delete(index);});
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:MAP_WIDTH,height:MAP_HEIGHT,backgroundColor:'#9daf83',pixelArt:true,antialias:false,scene:Village,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
 return {move:(index:number)=>{requested=index;navigate(index);},walk:(direction:Direction)=>walk(direction),stop:()=>stop(),dispose:()=>{disposed=true;game.destroy(true);}};
}
