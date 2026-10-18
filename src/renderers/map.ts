import Phaser from 'phaser';
import type {Point} from '../model';
export const locations=[{x:182,y:129},{x:682,y:129},{x:787,y:302},{x:547,y:437},{x:192,y:370},{x:461,y:235}];
export function mountMap(host:HTMLElement,position:Point,completed:boolean[],onArrive:(index:number,point:Point)=>void,reduced:boolean){
 let go:(index:number)=>void=()=>{};let pending:number|undefined;
 class Nature extends Phaser.Scene{
  preload(){this.load.image('campus','assets/exploration-map.webp');}
  create(){
   if(this.textures.exists('campus'))this.add.image(480,280,'campus').setDisplaySize(960,560);
   else{const g=this.add.graphics();g.fillStyle(0xd8e5bc);g.fillRect(0,0,960,560);}
   locations.forEach((p,i)=>{if(completed[i]){this.add.ellipse(p.x,p.y+35,100,35,0xf6d782,.5);const lamp=this.add.circle(p.x-55,p.y+30,6,0xffe9a6);if(!reduced)this.tweens.add({targets:lamp,alpha:.4,duration:1200,yoyo:true,repeat:-1});}});
   const center=locations[5];const count=completed.filter(Boolean).length;const g=this.add.graphics();g.fillStyle(0x305c50,.95);g.fillCircle(center.x,center.y,33);for(let i=0;i<5;i++){const angle=i*Math.PI*2/5-Math.PI/2;g.fillStyle(completed[i]?0xf2cf70:0x6b8274);g.fillCircle(center.x+Math.cos(angle)*24,center.y+Math.sin(angle)*24,6);}this.add.text(center.x,center.y,String(count),{fontSize:'23px',color:'#fff6d5'}).setOrigin(.5);
   const avatar=this.add.container(position.x,position.y);avatar.add([this.add.ellipse(0,12,28,10,0x203e2a,.3),this.add.rectangle(0,0,18,22,0xe8b657),this.add.circle(0,-18,10,0xf1c79c),this.add.rectangle(0,-27,24,6,0x386453),this.add.rectangle(-6,15,6,12,0x304f40),this.add.rectangle(6,15,6,12,0x304f40)]);
   let tween:Phaser.Tweens.Tween|undefined;
   go=(index:number)=>{if(!locations[index])return;tween?.stop();const target=locations[index];const finish=()=>{avatar.setPosition(target.x,target.y+50);onArrive(index,{x:avatar.x,y:avatar.y});};if(reduced){finish();return;}
    const points=[{x:center.x,y:center.y+50},{x:target.x,y:target.y+50}];let part=0;const next=()=>{const p=points[part++];if(!p){finish();return;}tween=this.tweens.add({targets:avatar,x:p.x,y:p.y,duration:Math.min(650,Math.max(120,Phaser.Math.Distance.Between(avatar.x,avatar.y,p.x,p.y)*1.5)),ease:'Sine.easeInOut',onComplete:next});};next();
   };if(pending!==undefined)go(pending);
  }
  update(){if(document.hidden||document.querySelector('dialog[open]'))this.tweens.pauseAll();else this.tweens.resumeAll();}
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:960,height:560,backgroundColor:'#dce8bd',scene:Nature,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
 return {move:(i:number)=>{pending=i;go(i);},dispose:()=>game.destroy(true)};
}
