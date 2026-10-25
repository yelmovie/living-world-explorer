import {position,breadSpots,type Point} from './model';
import {imageToView} from './observation';
export function canvas(w=720,h=450){const c=document.createElement('canvas');c.width=w;c.height=h;c.className='observation';c.setAttribute('role','img');return c;}
export type DrawOptions={focus?:number;light?:number;zoom?:number;pan?:Point;time?:number;marks?:Point[];trail?:boolean;image?:CanvasImageSource;markerSpace?:'world'};
const motionImages=new WeakMap<object,HTMLCanvasElement>();
function motionImage(source:CanvasImageSource){
 const cached=motionImages.get(source);if(cached)return cached;
 const sprite=canvas(640,400),ctx=sprite.getContext('2d')!;ctx.drawImage(source,0,0,640,400);
 ctx.globalCompositeOperation='destination-in';
 for(const horizontal of [true,false]){const fade=ctx.createLinearGradient(0,0,horizontal?640:0,horizontal?0:400);fade.addColorStop(0,'transparent');fade.addColorStop(.1,'white');fade.addColorStop(.9,'white');fade.addColorStop(1,'transparent');ctx.fillStyle=fade;ctx.fillRect(0,0,640,400);}
 motionImages.set(source,sprite);return sprite;
}
export function draw(c:HTMLCanvasElement,kind:string,opts:DrawOptions={}){
 const g=c.getContext('2d')!;const w=c.width,h=c.height;g.clearRect(0,0,w,h);g.fillStyle='#eef5df';g.fillRect(0,0,w,h);
 g.save();g.translate(w/2,h/2);g.scale(opts.zoom??1,opts.zoom??1);g.translate(-w/2+(opts.pan?.x||0)*w,-h/2+(opts.pan?.y||0)*h);
 const sx=(x:number)=>x*w,sy=(y:number)=>y*h;
 g.filter=`blur(${Math.abs((opts.focus??65)-65)/7}px) brightness(${(opts.light??65)/65})`;
 const circle=(x:number,y:number,r:number,color:string)=>{g.beginPath();g.fillStyle=color;g.arc(sx(x),sy(y),r*w,0,Math.PI*2);g.fill();};
 if(opts.image&&!(kind==='paramecium'&&opts.trail)){g.drawImage(opts.image,0,0,w,h);
 }else if(kind==='mushroom'){
  g.fillStyle='#d2b595';g.beginPath();g.roundRect(sx(.45),sy(.42),sx(.1),sy(.4),18);g.fill();
  g.fillStyle='#8e513b';g.beginPath();g.ellipse(sx(.5),sy(.43),sx(.24),sy(.18),0,Math.PI,Math.PI*2);g.lineTo(sx(.74),sy(.45));g.quadraticCurveTo(sx(.5),sy(.55),sx(.26),sy(.45));g.fill();
  g.strokeStyle='#e3c19c';g.lineWidth=3;for(let i=0;i<13;i++){g.beginPath();g.moveTo(sx(.5),sy(.5));g.lineTo(sx(.27+i*.038),sy(.44));g.stroke();}
 }else if(kind==='mold'){
  g.strokeStyle='#577650';g.lineWidth=5;for(const p of [{x:.32,y:.3},{x:.65,y:.4},{x:.47,y:.64}]){g.beginPath();g.moveTo(sx(.5),sy(.95));g.quadraticCurveTo(sx(p.x-.1),sy(.6),sx(p.x),sy(p.y));g.stroke();circle(p.x,p.y,.09,'#73804c');for(let i=0;i<24;i++){const a=i*2.4;circle(p.x+Math.cos(a)*.055*(i%3+1)/3,p.y+Math.sin(a)*.08,.009,'#374a39');}}
 }else if(kind==='spirogyra'){
  g.strokeStyle='#699a53';g.lineWidth=34;for(let k=0;k<3;k++){g.beginPath();g.moveTo(sx(.2+k*.22),sy(.1));g.lineTo(sx(.35+k*.22),sy(.9));g.stroke();g.strokeStyle='#d5e6a9';g.lineWidth=3;for(let i=0;i<8;i++){g.beginPath();g.moveTo(sx(.18+k*.22+i*.019),sy(.16+i*.09));g.lineTo(sx(.24+k*.22+i*.019),sy(.16+i*.09));g.stroke();}g.strokeStyle='#699a53';g.lineWidth=34;}
 }else if(kind==='paramecium'){
  const p=position(opts.time??0);if(opts.trail){g.strokeStyle='#9fa78c';g.lineWidth=3;g.setLineDash([7,7]);g.beginPath();for(let i=0;i<=10;i++){const q=position(i);i?g.lineTo(sx(q.x),sy(q.y)):g.moveTo(sx(q.x),sy(q.y));}g.stroke();g.setLineDash([]);}
  if(opts.image){const sprite=motionImage(opts.image),width=w*.28,height=width*sprite.height/sprite.width;g.drawImage(sprite,sx(p.x)-width/2,sy(p.y)-height/2,width,height);}
  else{g.save();g.translate(sx(p.x),sy(p.y));g.rotate(-.25);g.fillStyle='#c9bd83';g.strokeStyle='#7c8152';g.lineWidth=3;g.beginPath();g.ellipse(0,0,sx(.11),sy(.07),0,0,Math.PI*2);g.fill();g.stroke();for(let i=0;i<22;i++){const a=i*Math.PI/11;g.beginPath();g.moveTo(Math.cos(a)*sx(.11),Math.sin(a)*sy(.07));g.lineTo(Math.cos(a)*sx(.125),Math.sin(a)*sy(.095));g.stroke();}g.fillStyle='#7d8055';g.beginPath();g.ellipse(-8,0,12,8,0,0,7);g.fill();g.restore();}
 }else if(kind==='bread'){
  g.fillStyle='#b9804d';g.beginPath();g.roundRect(sx(.2),sy(.2),sx(.6),sy(.62),40);g.fill();g.fillStyle='#ecd2a2';g.beginPath();g.roundRect(sx(.23),sy(.23),sx(.54),sy(.55),30);g.fill();
  for(let i=0;i<30;i++)circle(.28+(i*.097)% .42,.3+(i*.073)% .36,.006,'#cfb080');
 }else if(kind==='bacteria'){
  for(let i=0;i<15;i++){g.save();g.translate(sx(.15+(i*.137)% .7),sy(.15+(i*.23)% .7));g.rotate(i);g.fillStyle=i%2?'#78a67e':'#5d866c';g.beginPath();g.roundRect(-20,-9,i%3?48:20,18,10);g.fill();g.restore();}
 }else if(kind==='leaf'){
  for(let i=0;i<7;i++){g.save();g.translate(sx(.2+(i*.11)% .6),sy(.3+(i*.17)% .4));g.rotate(i);g.fillStyle=i%2?'#ad864b':'#a8a45d';g.beginPath();g.ellipse(0,0,55,23,0,0,7);g.fill();g.restore();}
 }else if(kind==='yogurt'){
  g.fillStyle='#fffdf6';g.strokeStyle='#b3c5b6';g.lineWidth=6;g.beginPath();g.roundRect(sx(.35),sy(.2),sx(.3),sy(.6),24);g.fill();g.stroke();g.fillStyle='#437c64';g.fillRect(sx(.35),sy(.45),sx(.3),sy(.2));
 }else if(kind==='question'){
  g.fillStyle='#fff9e9';g.strokeStyle='#8a9e79';g.lineWidth=4;g.beginPath();g.roundRect(sx(.19),sy(.12),sx(.62),sy(.72),18);g.fill();g.stroke();
  g.font=`bold ${Math.round(h*.51)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#bc8b3d';g.fillText('?',sx(.5),sy(.5));
 }else{g.fillStyle='#bdd9cf';g.fillRect(sx(.1),sy(.25),sx(.8),sy(.5));for(let i=0;i<7;i++)circle(.2+i*.1,.4+Math.sin(i)*.1,.025,'#4d8b7a');}
 // Generated comparison frames already contain the change. Use these fallback
 // overlays only while no image is available, keeping the specimen coordinates.
 if(kind==='bread'&&!opts.image)breadSpots(opts.time??0).forEach((p,i)=>{
  const x=sx(p.x),y=sy(p.y),r=p.r*w;const edge=g.createRadialGradient(x,y,r*.3,x,y,r);edge.addColorStop(0,i%2?'#59794d':'#75835d');edge.addColorStop(.72,'#8b9b71');edge.addColorStop(1,'#a2aa7d33');g.fillStyle=edge;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
  circle(p.x,p.y,p.r*.3,i%2?'#536944':'#6e7a55');
 });
 if(kind==='leaf'&&!opts.image)for(let i=0;i<Math.floor(opts.time??0)*6;i++){
  const a=i*2.4,x=sx(.52+Math.cos(a)*.025*Math.sqrt(i)),y=sy(.48+Math.sin(a)*.034*Math.sqrt(i)),r=w*(.027+(opts.time??0)*.007);
  const soil=g.createRadialGradient(x,y,0,x,y,r);soil.addColorStop(0,'#63533a');soil.addColorStop(.6,'#7d6948e6');soil.addColorStop(1,'#8a754c00');g.fillStyle=soil;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
 }
 g.filter='none';g.restore();
 for(const p of opts.marks||[]){const {x,y}=opts.markerSpace==='world'?imageToView(p,{zoom:opts.zoom??1,pan:opts.pan??{x:0,y:0}}):p;g.strokeStyle='#fff9e9';g.lineWidth=7;g.beginPath();g.arc(sx(x),sy(y),14,0,7);g.stroke();g.strokeStyle='#be652d';g.lineWidth=4;g.stroke();}
 c.setAttribute('aria-label',`${kind} 설명용 관찰 모형`);
}
