// Turns the 2026-10-25 generated props into deploy WebP files (originals stay in assets/generated/props-20261025).
import sharp from 'sharp';
const src='assets/generated/props-20261025/', out='public/assets/ui/';
// Microscope frame: punch a clean round hole (centre/radius measured from the inner brass ring) and centre the ring.
{const {data,info}=await sharp(src+'microscope-frame.png').raw().toBuffer({resolveWithObject:true});const W=info.width,C=info.channels,cx=968.5,cy=960,r=636;
 for(let y=0;y<info.height;y++)for(let x=0;x<W;x++){const d=Math.hypot(x-cx,y-cy);if(d<r+2){const i=(y*W+x)*C;data[i+3]=d<r-2?0:Math.min(data[i+3],Math.round((d-(r-2))/4*255));}}
 const half=1060,canvas=sharp({create:{width:half*2,height:half*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}});
 const ring=await sharp(data,{raw:{width:W,height:info.height,channels:C}}).png().toBuffer();
 const centred=await canvas.composite([{input:ring,left:Math.round(half-cx),top:Math.round(half-cy)}]).png().toBuffer();
 await sharp(centred).resize(1024,1024).webp({quality:88,alphaQuality:95}).toFile(out+'microscope-frame.webp');
 console.log('frame hole ratio',(r/(half*2)).toFixed(4));}
const props=[['dropper',{height:512}],['slide',{width:560}],['water-drop',{width:240}],['notebook',{width:640}],['tape',{width:320}],...[1,2,3,4,5].map(n=>['badge-M'+n,{width:256,height:256}])];
for(const [name,size] of props){try{const trimmed=name.startsWith('badge')?sharp(src+name+'.png'):sharp(await sharp(src+name+'.png').trim({threshold:4}).toBuffer());await trimmed.resize({...size,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:86,alphaQuality:95}).toFile(out+name+'.webp');const m=await sharp(out+name+'.webp').metadata();console.log(name,m.width,m.height);}catch(e){console.log('skip',name,e.message);}}
