import Phaser from 'phaser';
export function mountLab2d(host:HTMLElement,labels:string[],active:boolean[],pick:(i:number)=>void,edges:boolean[],core:boolean,reduced:boolean){
 let scene:Phaser.Scene;let disposed=false;let panels:Phaser.GameObjects.Rectangle[]=[];
 class Lab extends Phaser.Scene{create(){scene=this;const count=labels.length;const step=720/count;const g=this.add.graphics();g.fillStyle(0xe4eee5);g.fillRoundedRect(12,12,696,236,24);g.lineStyle(2,0xc8d8cc);for(let x=30;x<720;x+=30)g.lineBetween(x,15,x,245);for(let y=30;y<250;y+=30)g.lineBetween(15,y,705,y);
  labels.forEach((label,i)=>{const x=step*(i+.5),w=step-24;if(i<count-1){const linked=core?active[i]&&active[i+1]:edges[i];g.lineStyle(8,linked?0x418b70:0xb4c5b7);g.lineBetween(x+w/2,130,x+step-w/2,130);}
   const box=this.add.rectangle(x,130,w,144,active[i]?0xd4e7cd:0xfaf9ee).setStrokeStyle(3,active[i]?0x39755d:0xa8bcae);panels.push(box);box.setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))pick(i);});
   this.add.text(x,78,core?`${i+1}`:['재료','생물의 작용','결과'][i],{fontSize:'17px',color:'#466957',fontFamily:'Malgun Gothic'}).setOrigin(.5);
   this.add.circle(x,116,13,active[i]?0x4b9274:0xbdcabd);this.add.text(x,162,label,{fontSize:core?'17px':'20px',color:'#234d3b',fontFamily:'Malgun Gothic',wordWrap:{width:w-20},align:'center'}).setOrigin(.5);
  });
 }}
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:720,height:260,scene:Lab,backgroundColor:'#e4eee5',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
 return {progress:(i:number,failed:boolean)=>{if(disposed||!scene)return;panels.forEach((p,k)=>p.setStrokeStyle(k===i?6:3,k===i?(failed?0xb15f36:0xe2ad3e):0x7ba78d));if(!reduced&&panels[i])scene.tweens.add({targets:panels[i],alpha:.5,yoyo:true,duration:220,repeat:1});},dispose:()=>{disposed=true;game.destroy(true);}};
}
