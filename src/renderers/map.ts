import {stepAlongRoad,MAP_VECTORS} from '../map-controls.js';
import Phaser from 'phaser';
import {drawBuildingLights} from './map-lighting';
import {outlinedSprite} from './sprite-outline';
import {advanceGait,footfall,walkCells,walkFrame,type Direction,type Gait,type Stride} from './map-walk';
import {playStep,stopStep} from '../audio';
import type {Point} from '../model';
import type {MapReaction,MapReactions} from '../map-encounters.js';
import {MAP_WIDTH,MAP_HEIGHT,mapSpawn,locations,pathSegments,pathGraph,destinationNodeIds,routeBetween,nearestRoadPoint,mapAssets} from '../mapData';
export {locations} from '../mapData';
const MOA_STEP=19,TOTO_STEP=15;
type Reveal={index:number;ready:()=>boolean;started:()=>void};

/** The map is a ground-plane road network. DOM labels and the canvas share these coordinates. */
export function mountMap(host:HTMLElement,position:Point,completed:boolean[],onArrive:(index:number,point:Point)=>void,reduced:boolean,onMove?:(point:Point,companion:Point)=>void,onManual?:()=>void,canTap=()=>true,onReady?:()=>void,encounters?:(hero:Point,ally:Point)=>MapReactions,reveal?:Reveal){
 // A dialog or an achievement card (it makes the app inert) holds the map. Phaser listens on the window, so inert alone does not stop it.
 const held=()=>!!document.querySelector('dialog[open]')||!!host.closest('[inert]');
 let requested:number|undefined;let navigate:(index:number)=>void=()=>{};let walk:(direction:Direction)=>void=()=>{};let nudge:(direction:Direction)=>void=()=>{};let stop:()=>void=()=>{};let cancel:()=>void=()=>{};let disposed=false;
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
  private insideDoors=new Set<number>();
  private heroGait:Gait={direction:'down',distance:0};
  private friendGait:Gait={direction:'down',distance:0};
  private stride:Stride={next:0};
  private beforeReveal?:Phaser.GameObjects.Image;
  private styleSprite(image:Phaser.GameObjects.Image,key:string,height:number){
   const outline=outlinedSprite(this.textures,key,height);
   image.setTexture(outline.key).setOrigin(outline.originX,outline.originY).setScale(outline.scale);
  }
  preload(){
   this.load.image('village',mapAssets.terrain);
   for(const d of ['down','right','up','left']){
    this.load.image(`moa-${d}`,`assets/map/moa-${d}.webp`);
    this.load.image(`friend-${d}`,`assets/map/companion-${d}.webp`);
   }
   for(const [name,file] of [['moa','moa'],['friend','toto']]){
    this.load.spritesheet(`${name}-walk`,`assets/map/${file}-walk.webp`,{frameWidth:walkCells.width,frameHeight:walkCells.height});
   }
   if(completed.some(Boolean))for(const [asset,url] of Object.entries(import.meta.glob<string>('/public/assets/map-encounter/map-*-reaction.webp',{eager:true,import:'default',query:'?url'}))){
    const role=asset.includes('-hero-')?'moa':'friend';
    this.load.spritesheet(`${role}-reaction`,url,{frameWidth:256,frameHeight:256});
   }
  }
  create(){
   if(this.textures.exists('village'))this.add.image(MAP_WIDTH/2,MAP_HEIGHT/2,'village').setDisplaySize(MAP_WIDTH,MAP_HEIGHT);
   else this.add.rectangle(MAP_WIDTH/2,MAP_HEIGHT/2,MAP_WIDTH,MAP_HEIGHT,0xc8d6b5);
   const lamps=this.textures.createCanvas('building-lights',MAP_WIDTH,MAP_HEIGHT);
   if(lamps){
    drawBuildingLights(lamps.context,completed);lamps.refresh();
    this.add.image(0,0,'building-lights').setOrigin(0);
   }
   if(reveal&&!reduced&&completed[reveal.index]&&this.textures.exists('village')){
    const before=this.textures.createCanvas('buildings-before-reveal',MAP_WIDTH,MAP_HEIGHT);
    if(before){
     const terrain=this.textures.get('village').getSourceImage() as HTMLImageElement;
     before.context.drawImage(terrain,0,0,MAP_WIDTH,MAP_HEIGHT);
     const previous=[...completed];previous[reveal.index]=false;
     drawBuildingLights(before.context,previous);before.refresh();
     this.beforeReveal=this.add.image(0,0,'buildings-before-reveal').setOrigin(0);
    }
   }
   if(!this.beforeReveal)reveal?.started();
   const next=completed.findIndex(v=>!v);const current=locations[next<0?5:next];
   const ring=this.add.ellipse(current.x,current.y+2,74,24,0xf7cd69,.45).setStrokeStyle(3,0xffedb0,.9);if(!reduced)this.tweens.add({targets:ring,alpha:.55,scaleX:1.1,duration:1000,yoyo:true,repeat:2});
   const valid=Number.isFinite(position.x)&&Number.isFinite(position.y)&&position.x>=0&&position.y>=0&&position.x<=MAP_WIDTH&&position.y<=MAP_HEIGHT;
   const spawn=nearestRoadPoint(valid?position:mapSpawn);
   this.hero=this.add.container(spawn.x,spawn.y);this.hero.add(this.add.ellipse(0,-2,37,13,0x203e2f,.3));
   this.heroImage=this.add.image(0,0,'moa-down');this.styleSprite(this.heroImage,'moa-down',92);this.hero.add(this.heroImage);
   this.friend=this.add.container(spawn.x,Math.min(MAP_HEIGHT-18,spawn.y+34));this.friend.add(this.add.ellipse(0,-2,25,10,0x203e2f,.23));this.friendImage=this.add.image(0,0,'friend-down');this.styleSprite(this.friendImage,'friend-down',65);this.friend.add(this.friendImage);
   this.pathHistory=[{x:this.friend.x,y:this.friend.y},{...spawn}];locations.forEach((p,i)=>{if(Math.hypot(p.x-spawn.x,p.y-spawn.y)<24)this.insideDoors.add(i);});
   navigate=(index:number)=>{if(!locations[index])return;this.keys.clear();this.held=undefined;this.destination=index;if(reduced){const p=locations[index];this.hero.setPosition(p.x,p.y);this.friend.setPosition(p.x,Math.min(MAP_HEIGHT-18,p.y+30));this.pathHistory=[{x:this.friend.x,y:this.friend.y},{x:p.x,y:p.y}];this.route=[];this.arrive();return;}this.route=routeBetween({x:this.hero.x,y:this.hero.y},destinationNodeIds[index]);};
   walk=(direction:Direction)=>{this.route=[];this.destination=undefined;this.held=direction;};
   stop=()=>{this.held=undefined;};
   cancel=()=>{this.route=[];this.destination=undefined;this.keys.clear();this.held=undefined;};
   nudge=(direction:Direction)=>{const start={x:this.hero.x,y:this.hero.y};const p=stepAlongRoad(start,MAP_VECTORS[direction],12,pathSegments);this.route=Math.hypot(p.x-start.x,p.y-start.y)>.01?[p]:[];this.destination=undefined;this.held=undefined;};
   this.input.on('pointerup',(pointer:Phaser.Input.Pointer)=>{
    if(!canTap()||pointer.event?.target!==this.game.canvas||Math.hypot(pointer.upX-pointer.downX,pointer.upY-pointer.downY)>8||document.hidden||held())return;
    const tap={x:pointer.worldX,y:pointer.worldY};const index=locations.findIndex(p=>Math.hypot(tap.x-p.x,tap.y-p.y)<65);
    if(index>=0){onManual?.();navigate(index);return;}
    const target=nearestRoadPoint(tap);if(Math.hypot(target.x-tap.x,target.y-tap.y)>62)return;
    const nearest=pathGraph.reduce((a,b)=>Math.hypot(target.x-a.point.x,target.y-a.point.y)<Math.hypot(target.x-b.point.x,target.y-b.point.y)?a:b);
    onManual?.();this.keys.clear();this.held=undefined;this.destination=undefined;this.route=routeBetween({x:this.hero.x,y:this.hero.y},nearest.id);this.route.push(target);
   });
   this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(held()||e.ctrlKey||e.metaKey||e.altKey||(e.target instanceof HTMLElement&&(e.target.isContentEditable||e.target.closest('input,textarea,select'))))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();onManual?.();this.keys.add(e.code);this.route=[];this.destination=undefined;}});
   this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.keys.delete(e.code));
   const blur=()=>{this.keys.clear();this.held=undefined;};document.addEventListener('visibilitychange',blur);window.addEventListener('blur',blur);this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',blur);window.removeEventListener('blur',blur);});
   this.syncCamera();onReady?.();if(requested!==undefined)navigate(requested);
  }
  private restoration(index:number){
   const spot=locations[index];
   const burst=this.add.ellipse(spot.x,spot.y-36,66,38).setStrokeStyle(3,0xffedac,.92).setDepth(9000);
   this.tweens.add({targets:burst,scale:2.1,alpha:0,duration:780,onComplete:()=>burst.destroy()});
   const points=routeBetween(locations[index],destinationNodeIds[5]);const light=this.add.circle(locations[index].x,locations[index].y,7,0xffe9a8).setDepth(9000);let part=0;const next=()=>{const p=points[part++];if(!p){const halo=this.add.ellipse(locations[5].x,locations[5].y,24,10).setStrokeStyle(4,0xffdfa0).setDepth(9000);this.tweens.add({targets:halo,scale:5,alpha:0,duration:800,onComplete:()=>halo.destroy()});light.destroy();return;}this.tweens.add({targets:light,x:p.x,y:p.y,duration:Math.max(180,Phaser.Math.Distance.Between(light.x,light.y,p.x,p.y)*2),onComplete:next});};this.time.delayedCall(500,next);
  }
  private syncCamera(){onMove?.({x:this.hero.x,y:this.hero.y},{x:this.friend.x,y:this.friend.y});this.scale.updateBounds();}
  private drawWalker(image:Phaser.GameObjects.Image,gait:Gait,moving:boolean,pose:MapReaction|null|undefined,friend=false){
   const name=friend?'friend':'moa',height=friend?65:92;
   image.x=pose?.dx??0;
   if(pose){
    const atlas=`${name}-reaction`;
    image.setFlipX(false);
    if(this.textures.exists(atlas)){
     const row=(pose.kind==='hurt'?2:0)+(pose.direction>0?1:0);
     image.setTexture(atlas,row*4+pose.frame).setOrigin(.5,240/256).setScale(height/208);
     image.angle=0;image.clearTint();return;
    }
    this.styleSprite(image,`${name}-${pose.direction===-1?'left':'right'}`,height);
    image.angle=reduced?0:(pose.kind==='hurt'?-pose.direction:pose.direction)*[0,7,5,0][pose.frame];
    image.setTint(pose.kind==='hurt'?0xffd5cc:0xf4e3ff);return;
   }
   if(image.angle)image.angle=0;
   if(image.isTinted)image.clearTint();
   const atlas=`${name}-walk`;
   if(moving&&!reduced&&this.textures.exists(atlas)){
    const frame=walkFrame(gait,friend?TOTO_STEP:MOA_STEP);
    if(image.texture.key!==atlas||String(image.frame.name)!==String(frame)){
     image.setTexture(atlas,frame).setOrigin(.5,walkCells.feet/walkCells.height).setScale(height/walkCells.bodyHeight);
    }
    image.setFlipX(gait.direction==='left');return;
   }
   const key=`${name}-${gait.direction}`;
   image.setFlipX(false);
   if(image.texture.key!==key+'-outline'&&image.texture.key!==key)this.styleSprite(image,key,height);
  }
  private arrive(){if(this.destination===undefined)return;const index=this.destination;this.destination=undefined;this.route=[];this.heroImage.y=0;this.syncCamera();onArrive(index,{x:this.hero.x,y:this.hero.y});}
  update(_time:number,delta:number){
   if(this.beforeReveal&&reveal?.ready()&&!document.hidden&&!document.querySelector('dialog[open]')){
    const earlier=this.beforeReveal;this.beforeReveal=undefined;reveal.started();
    this.tweens.add({targets:earlier,alpha:0,duration:740,onComplete:()=>{
     earlier.destroy();this.textures.remove('buildings-before-reveal');
    }});
    this.restoration(reveal.index);
   }
   if(!this.hero||disposed)return;
   const blocked=document.hidden||held();if(blocked){this.keys.clear();this.held=undefined;this.tweens.pauseAll();footfall(this.stride,false,0);stopStep();this.heroGait.distance=this.friendGait.distance=0;this.drawWalker(this.heroImage,this.heroGait,false,null);this.drawWalker(this.friendImage,this.friendGait,false,null,true);encounters?.(this.hero,this.friend);return;}this.tweens.resumeAll();
   const seconds=Math.min(delta,50)/1000;const start={x:this.hero.x,y:this.hero.y};let next:Point|undefined;
   const dx=(this.keys.has('ArrowRight')||this.keys.has('KeyD')||this.held==='right'?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('KeyA')||this.held==='left'?1:0);
   const dy=(this.keys.has('ArrowDown')||this.keys.has('KeyS')||this.held==='down'?1:0)-(this.keys.has('ArrowUp')||this.keys.has('KeyW')||this.held==='up'?1:0);
   const speed=190;
   if(dx||dy)next=stepAlongRoad(start,{x:dx,y:dy},speed*seconds,pathSegments);
   else if(this.route.length){const target=this.route[0];const distance=Math.hypot(target.x-start.x,target.y-start.y);const amount=speed*seconds;if(distance<=amount){next=target;this.route.shift();}else next={x:start.x+(target.x-start.x)/distance*amount,y:start.y+(target.y-start.y)/distance*amount};}
   const mx=(next?.x??start.x)-start.x,my=(next?.y??start.y)-start.y,moving=Math.hypot(mx,my)>.01;
   advanceGait(this.heroGait,mx,my,MOA_STEP);
   // Footsteps follow the hero only while the position really changes (keys, a held arrow or a tapped route alike).
   if(footfall(this.stride,moving,performance.now()))playStep();else if(!moving)stopStep();
   if(moving&&next){this.hero.setPosition(next.x,next.y);this.pathHistory.push(next);if(this.pathHistory.length>250)this.pathHistory.shift();}
   let following=0;let friendTarget={x:this.friend.x,y:this.friend.y};for(let i=this.pathHistory.length-1;i>0;i--){const a=this.pathHistory[i],b=this.pathHistory[i-1];const d=Math.hypot(a.x-b.x,a.y-b.y);if(!d)continue;following+=d;if(following>=43){const t=(following-43)/d;friendTarget={x:b.x+(a.x-b.x)*t,y:b.y+(a.y-b.y)*t};break;}}
   const fdx=friendTarget.x-this.friend.x,fdy=friendTarget.y-this.friend.y,friendMoved=Math.hypot(fdx,fdy)>.01;
   advanceGait(this.friendGait,fdx,fdy,TOTO_STEP);
   if(friendMoved)this.friend.setPosition(friendTarget.x,friendTarget.y);
   if(moving||friendMoved)this.syncCamera();
   this.hero.setDepth(this.hero.y+100);this.friend.setDepth(this.friend.y+100);
   const reactions=encounters?.(this.hero,this.friend);this.drawWalker(this.heroImage,this.heroGait,moving,reactions?.hero);this.drawWalker(this.friendImage,this.friendGait,friendMoved,reactions?.ally,true);
   if(this.destination!==undefined&&!this.route.length){this.arrive();if(disposed)return;}
   locations.forEach((p,index)=>{const inside=Math.hypot(p.x-this.hero.x,p.y-this.hero.y)<20;if(inside&&!this.insideDoors.has(index)&&(dx||dy)&&moving){this.insideDoors.add(index);this.keys.clear();this.held=undefined;onArrive(index,{x:this.hero.x,y:this.hero.y});}else if(!inside)this.insideDoors.delete(index);});
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:MAP_WIDTH,height:MAP_HEIGHT,backgroundColor:'#9daf83',pixelArt:true,antialias:false,scene:Village,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
 // Resize the canvas and touch coordinates in the same frame as the DOM map markers.
 const resize=()=>{if(game.scale.canvas&&game.scale.getParentBounds())game.scale.refresh();};
 return {resize,bounds:()=>game.scale.updateBounds(),move:(index:number)=>{requested=index;navigate(index);},walk:(direction:Direction)=>walk(direction),nudge:(direction:Direction)=>nudge(direction),stop:()=>stop(),cancel:()=>{requested=undefined;cancel();},dispose:()=>{disposed=true;stopStep();game.destroy(true);}};
}
