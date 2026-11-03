import Phaser from 'phaser';

type Point={x:number;y:number};
type LensOptions={picture:Phaser.GameObjects.Image;start:Point;blocked:()=>boolean;inspect:(point:Point)=>void};

/** The disk and specimen share a texture. Only the point under the glass is magnified. */
export function addHandLens(scene:Phaser.Scene,{picture,start,blocked,inspect}:LensOptions){
 const bounds=picture.getBounds(),radius=82,zoom=2.5;
 const glass=scene.add.circle(0,0,radius+2,0xf0efdf);
 const detail=scene.add.image(0,0,picture.texture.key).setOrigin(0).setScale(picture.scaleX*zoom);
 const hole=scene.make.graphics({},false).fillStyle(0xffffff).fillEllipse(0,0,2*(radius+2),2*(radius+2));
 const mask=hole.createGeometryMask();detail.setMask(mask);
 // The clear opening of the generated 1254px prop is centered at (465,438).
 const frame=scene.textures.exists('ui-hand-lens')
  ?scene.add.image(0,0,'ui-hand-lens').setOrigin(465/1254,438/1254).setDisplaySize(radius*1254/337,radius*1254/343)
  :scene.add.graphics().lineStyle(15,0x875630).lineBetween(54,54,132,132).lineStyle(12,0xd8ae63).strokeCircle(0,0,radius+4);
 const move=(x:number,y:number)=>{
  const cx=Phaser.Math.Clamp(x,bounds.left,bounds.right),cy=Phaser.Math.Clamp(y,bounds.top,bounds.bottom);
  glass.setPosition(cx,cy);hole.setPosition(cx,cy);frame.setPosition(cx,cy);
  detail.setPosition(cx-(cx-bounds.left)*zoom,cy-(cy-bounds.top)*zoom);
 };
 move(bounds.left+start.x*bounds.width,bounds.top+start.y*bounds.height);
 const zone=scene.add.zone(0,0,scene.scale.width,scene.scale.height).setOrigin(0).setInteractive();
 let down:{id:number;at:Point;offset:Point;moved:boolean}|undefined;
 const onHandle=(x:number,y:number)=>{
  const dx=x-frame.x,dy=y-frame.y;
  return dx>radius*.62&&dy>radius*.62&&dx<radius*2.2&&dy<radius*2.35&&Math.abs(dx-dy)<radius*.42;
 };
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{
  if(blocked()||down)return;
  const handle=onHandle(p.x,p.y);if(!handle&&!bounds.contains(p.x,p.y))return;
  down={id:p.id,at:{x:p.x,y:p.y},offset:handle?{x:frame.x-p.x,y:frame.y-p.y}:{x:0,y:0},moved:false};
  if(!handle)move(p.x,p.y);
 });
 zone.on('pointermove',(p:Phaser.Input.Pointer)=>{
  if(blocked())return;
  if(down){
   if(down.id!==p.id)return;
   if(Math.hypot(p.x-down.at.x,p.y-down.at.y)>7)down.moved=true;
   move(p.x+down.offset.x,p.y+down.offset.y);
  }else if(bounds.contains(p.x,p.y))move(p.x,p.y);
 });
 zone.on('pointerup',(p:Phaser.Input.Pointer)=>{
  if(!down||down.id!==p.id)return;
  const tap=!down.moved&&Math.hypot(p.x-down.at.x,p.y-down.at.y)<=7;
  down=undefined;if(!tap||blocked()||!bounds.contains(p.x,p.y))return;
  move(p.x,p.y);inspect({x:(p.x-bounds.left)/bounds.width,y:(p.y-bounds.top)/bounds.height});
 });
 const cancel=()=>{down=undefined;};
 zone.on('pointerout',cancel);scene.input.on('gameout',cancel);scene.input.on('pointerupoutside',cancel);
 zone.once('destroy',()=>{scene.input.off('gameout',cancel);scene.input.off('pointerupoutside',cancel);mask.destroy();hole.destroy();});
}
