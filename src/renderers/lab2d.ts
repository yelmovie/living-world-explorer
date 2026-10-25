import Phaser from 'phaser';
export function mountLab2d(host:HTMLElement,labels:string[],active:boolean[],pick:(i:number)=>void,edges:boolean[],core:boolean,reduced:boolean,ready:(ok:boolean)=>void=()=>{}){
 let scene:Phaser.Scene;let disposed=false;let panels:Phaser.GameObjects.Rectangle[]=[];
 class Lab extends Phaser.Scene{
 failed=false;
 preload(){this.load.on('loaderror',()=>this.failed=true);if(core){this.load.image('restored-core','assets/places/core.webp');['fungi','water','archive','village','workshop'].forEach((name,i)=>this.load.image(`facility-${i}`,`assets/places/${name}.webp`));}}
 create(){scene=this;if(this.failed){ready(false);return;}if(core){this.paintCore();ready(true);return;}const count=labels.length;const step=720/count;const g=this.add.graphics();g.fillStyle(0xe4eee5);g.fillRoundedRect(12,12,696,236,24);g.lineStyle(2,0xc8d8cc);for(let x=30;x<720;x+=30)g.lineBetween(x,15,x,245);for(let y=30;y<250;y+=30)g.lineBetween(15,y,705,y);
  labels.forEach((label,i)=>{const x=step*(i+.5),w=step-24;if(i<count-1){const linked=core?active[i]&&active[i+1]:edges[i];g.lineStyle(8,linked?0x418b70:0xb4c5b7);g.lineBetween(x+w/2,130,x+step-w/2,130);}
   const box=this.add.rectangle(x,130,w,144,active[i]?0xd4e7cd:0xfaf9ee).setStrokeStyle(3,active[i]?0x39755d:0xa8bcae);panels.push(box);box.setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))pick(i);});
   this.add.text(x,78,core?`${i+1}`:['재료','생물의 작용','결과'][i],{fontSize:'17px',color:'#466957',fontFamily:'Malgun Gothic'}).setOrigin(.5);
   this.add.circle(x,116,13,active[i]?0x4b9274:0xbdcabd);this.add.text(x,162,label,{fontSize:core?'17px':'20px',color:'#234d3b',fontFamily:'Malgun Gothic',wordWrap:{width:w-20},align:'center'}).setOrigin(.5);
  });ready(true);
 }
 paintCore(){
  this.add.image(480,270,'restored-core').setDisplaySize(960,540);
  const lines=this.add.graphics();
  labels.forEach((label,i)=>{const x=96+i*192,y=440;
   lines.lineStyle(active[i]?5:3,active[i]?0xf4d483:0x617d65,active[i]?.95:.55);lines.lineBetween(302,245,x,370);
   this.add.circle(x,368,active[i]?9:6,active[i]?0xffe59f:0xe4ecd7).setStrokeStyle(3,0x46654c);
   this.add.rectangle(x,y+5,174,136,0x193f30,.35);
   const box=this.add.rectangle(x,y,174,136,active[i]?0xf2e4b5:0xfff9e9,.97).setStrokeStyle(active[i]?4:2,active[i]?0x9b762e:0x718664);panels.push(box);
   this.add.image(x,y-22,`facility-${i}`).setDisplaySize(156,72);
   this.add.text(x,y+38,(active[i]?'✓ ':'')+label,{fontSize:'25px',color:'#234d3b',fontFamily:'Lab Display, Malgun Gothic',wordWrap:{width:162},align:'center'}).setOrigin(.5);
   this.add.zone(x,y,174,136).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))pick(i);});
  });
 }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:core?960:720,height:core?540:260,scene:Lab,backgroundColor:'#e4eee5',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
 return {progress:(i:number,failed:boolean)=>{if(disposed||!scene)return;panels.forEach((p,k)=>p.setStrokeStyle(k===i?6:3,k===i?(failed?0xb15f36:0xe2ad3e):0x7ba78d));if(!reduced&&panels[i])scene.tweens.add({targets:panels[i],alpha:.5,yoyo:true,duration:220,repeat:1});},dispose:()=>{disposed=true;game.destroy(true);}};
}
