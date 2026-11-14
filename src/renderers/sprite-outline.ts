import type Phaser from 'phaser';

/** Bake the walking sprite silhouette once per texture and keep its original feet anchor. */
export function outlinedSprite(textures:Phaser.Textures.TextureManager,key:string,displayHeight:number){
 const texture=textures.get(key);
 const frame=texture.get();
 const anchor={scale:displayHeight/frame.height,originX:.5,originY:1};
 const id=key+'-outline',radius=Math.max(1,Math.round(1.65/anchor.scale)),pad=radius+2;
 const width=frame.width+2*pad,height=frame.height+2*pad;
 if(!textures.exists(id)){
  const source=texture.getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  const stamp=document.createElement('canvas');stamp.width=width;stamp.height=height;
  const mask=stamp.getContext('2d'),out=textures.createCanvas(id,width,height);
  if(!mask||!out){out?.destroy();return {key,...anchor};}
  mask.drawImage(source,pad,pad);
  mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4d2';mask.fillRect(0,0,width,height);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;out.context.drawImage(stamp,Math.round(Math.cos(a)*radius),Math.round(Math.sin(a)*radius));}
  out.context.drawImage(source,pad,pad);out.refresh();
 }
 return {key:id,...anchor,originY:(pad+frame.height)/height};
}
