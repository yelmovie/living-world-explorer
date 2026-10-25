import Phaser from 'phaser';
export function mountField(host:HTMLElement,recorded:string[],onClue:(id:string)=>void,reduced:boolean){
 class Field extends Phaser.Scene{create(){const g=this.add.graphics();g.fillStyle(0xe1ebcf);g.fillRect(0,0,800,440);g.fillStyle(0xc1d0a2);g.fillEllipse(400,430,1000,280);
  for(let i=0;i<7;i++){const x=45+i*128;g.fillStyle(0x7a7650);g.fillRoundedRect(x,40,20,245,8);g.fillStyle(i%2?0x67936a:0x8aab75);g.fillCircle(x+10,45,75);g.fillCircle(x-20,100,48);}
  g.fillStyle(0x866349);g.fillRoundedRect(125,265,270,70,30);g.fillStyle(0xba8e61);g.fillEllipse(143,300,42,65);
  for(let i=0;i<4;i++){const x=210+i*40,y=265-i%2*38;g.fillStyle(0xe5cda6);g.fillRoundedRect(x-6,y,12,42,5);g.fillStyle(0xa66c47);g.fillEllipse(x,y,60,28);}
  g.fillStyle(0xeaf0da);g.fillRoundedRect(520,225,190,130,16);g.lineStyle(3,0x8ba59a);g.strokeRoundedRect(520,225,190,130,16);g.fillStyle(0xd8b980);g.fillRoundedRect(550,255,130,70,15);for(let i=0;i<12;i++){g.fillStyle(i%2?0x8a9d6d:0x627e5a);g.fillCircle(590+i%4*17,276+Math.floor(i/4)*14,10);}
  [{id:'wood',x:255,y:205,label:'죽은 나무'},{id:'moist',x:615,y:190,label:'밀폐된 빵 표본'},{id:'guess',x:430,y:365,label:'메모 조각'}].forEach(p=>{const done=recorded.includes(p.id);const halo=this.add.circle(p.x,p.y,28,done?0x4d8769:0xf6d17d).setStrokeStyle(4,0xfff9dc);this.add.text(p.x,p.y,done?'✓':'?',{fontSize:'26px',color:done?'#ffffff':'#5d512b',fontStyle:'bold'}).setOrigin(.5);this.add.text(p.x,p.y+38,p.label,{fontSize:'19px',color:'#234634',backgroundColor:'#fffbed',padding:{x:10,y:6},fontFamily:'Malgun Gothic'}).setOrigin(.5);this.add.zone(p.x,p.y,110,90).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!document.querySelector('dialog[open]'))onClue(p.id);});if(!done&&!reduced)this.tweens.add({targets:halo,scale:1.12,duration:850,yoyo:true,repeat:-1});});
 }}
 const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:800,height:440,scene:Field,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});return ()=>game.destroy(true);
}
