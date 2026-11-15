import sharp from 'sharp';
import assert from 'node:assert/strict';

// The source PNGs are stored on the project drive outside Git. Runtime cell
// dimensions and anchors match src/renderers/map-walk.ts.
const originals=process.argv[2]??'asset-bank/original/map-walk-20261115';
const cellWidth=128,cellHeight=176,bodyHeight=160,feet=170;
const columns=4,rows=3;
const specs=[
 {name:'moa',source:'moa-alt.png',radius:3,columns:[0,408,710,1010,1448]},
 {name:'toto',source:'toto.png',radius:4,columns:[0,380,725,1070,1448]},
];
const rowCuts=[0,345,706,1086];

function outline(data,radius){
 const mask=new Uint8Array(cellWidth*cellHeight);
 const offsets=[];
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)
  if(dx*dx+dy*dy<=radius*radius)offsets.push([dx,dy]);
 for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++){
  const a=data[(y*cellWidth+x)*4+3];if(!a)continue;
  for(const [dx,dy] of offsets){
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<cellWidth&&yy>=0&&yy<cellHeight){
    const i=yy*cellWidth+xx;mask[i]=Math.max(mask[i],a);
   }
  }
 }
 const paper=Buffer.alloc(data.length);
 for(let i=0;i<mask.length;i++){
  if(mask[i])paper.set([255,244,210,mask[i]],i*4);
 }
 return paper;
}

async function frame(source,bounds,radius){
 const [left,top,width,height]=bounds;
 const raw=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
 let minX=width,maxX=-1,minY=height,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4+3,a=raw[i];
  if(a>=160){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(a<=32)raw[i]=0; // The generator leaves faint colored pixels in the transparent gutters.
 }
 assert.ok(maxY-minY>250&&maxX-minX>100,'Incomplete pose in source cell');
 const w=maxX-minX+1,h=maxY-minY+1,region={left:minX,top:minY,width:w,height:h};
 // Register to the middle of the body rather than to the farthest swinging hand or boot.
 let mass=0,totalX=0;
 for(let y=minY+Math.round(h*.26);y<minY+Math.round(h*.59);y++)for(let x=minX;x<=maxX;x++){
  const a=raw[(y*width+x)*4+3];if(a>=160){mass++;totalX+=x-minX;}
 }
 const resized=await sharp(raw,{raw:{width,height,channels:4}}).extract(region)
  .resize({height:bodyHeight}).raw().toBuffer({resolveWithObject:true});
 const sw=resized.info.width,center=totalX/mass*bodyHeight/h;
 const x0=Math.max(radius+1,Math.min(cellWidth-sw-radius-1,Math.round(cellWidth/2-center)));
 assert.ok(sw+2*(radius+1)<cellWidth,'A pose is too wide for its padded cell');
 const pixels=Buffer.alloc(cellWidth*cellHeight*4);
 for(let y=0;y<bodyHeight;y++){
  resized.data.copy(pixels,4*((feet-bodyHeight+y)*cellWidth+x0),y*sw*4,(y+1)*sw*4);
 }
 const shape={width:cellWidth,height:cellHeight,channels:4};
 return sharp(outline(pixels,radius),{raw:shape}).composite([{input:pixels,raw:shape}]).png().toBuffer();
}

for(const spec of specs){
 const source=`${originals}/${spec.source}`;
 const meta=await sharp(source).metadata();
 assert.equal(meta.width,1448);assert.equal(meta.height,1086);assert.ok(meta.hasAlpha);
 const layers=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=spec.columns[col],y=rowCuts[row],w=spec.columns[col+1]-x,h=rowCuts[row+1]-y;
  layers.push({input:await frame(source,[x,y,w,h],spec.radius),left:col*cellWidth,top:row*cellHeight});
 }
 const target=`public/assets/map/${spec.name}-walk.webp`;
 const out=await sharp({create:{width:cellWidth*columns,height:cellHeight*rows,channels:4,background:'#0000'}})
  .composite(layers).webp({quality:89,alphaQuality:100}).toFile(target);
 console.log(`${target}: ${out.width}×${out.height}, ${out.size} bytes`);
}
