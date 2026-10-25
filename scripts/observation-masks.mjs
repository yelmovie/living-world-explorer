// Rebuild only when the reviewed comparison artwork changes. No generated artwork.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(process.argv.includes('--check')){
 const stored=JSON.parse(await readFile('src/observation-masks.json','utf8'));
 for(const [name,hash] of Object.entries(stored.sources)){const actual=createHash('sha256').update(await readFile(`public/assets/${name}`)).digest('hex');if(actual!==hash)throw Error(`Observation artwork changed: ${name}. Review and rebuild masks.`);}
 console.log(`Observation asset hashes match: ${Object.keys(stored.sources).length}`);process.exit(0);
}
const width=640,height=360,output={width,height,sources:{},regions:{}};
output.sources['study/mushroom.webp']=createHash('sha256').update(await readFile('public/assets/study/mushroom.webp')).digest('hex');
await mkdir('.tmp/masks',{recursive:true});
for(const kind of ['mold','spirogyra']){
 const name=`study/${kind}.webp`,bytes=await readFile(`public/assets/${name}`);output.sources[name]=createHash('sha256').update(bytes).digest('hex');
 const data=await sharp(bytes).resize(width,height).removeAlpha().raw().toBuffer(),rows=[];
 let feature=Array.from({length:width*height},(_,i)=>{const[r,g,b]=data.subarray(i*3,i*3+3);return kind==='mold'?r<210&&g<205&&b<190:g>r*1.035&&g>b*1.12&&r<220;});
 if(kind==='spirogyra'){
  // Pale cell interiors are still part of a filament. Seal tiny outline gaps,
  // then fill only enclosed interiors; the adjacent connected background stays out.
  const offsets=[-width-1,-width,-width+1,-1,0,1,width-1,width,width+1];
  const dilated=feature.map((v,i)=>v||offsets.some(d=>feature[i+d]));
  feature=feature.map((v,i)=>v||offsets.every(d=>dilated[i+d]));
  const outside=new Uint8Array(width*height),queue=[];
  const add=i=>{if(i>=0&&i<outside.length&&!feature[i]&&!outside[i]){outside[i]=1;queue.push(i);}};
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  for(let n=0;n<queue.length;n++){const i=queue[n],x=i%width;add(i-width);add(i+width);if(x)add(i-1);if(x<width-1)add(i+1);}
  feature=feature.map((v,i)=>v||!outside[i]);
 }
 for(let y=0;y<height;y++){const row=[];for(let x=0;x<width;x++){if(!feature[y*width+x])continue;const start=x;while(x+1<width&&feature[y*width+x+1])x++;row.push(start,x);}rows.push(row);}
 output.regions[`${kind}:feature`]=rows;
}
for(const kind of ['bread','leaf']){
 const paths=[0,1,2,3].map(i=>`study/${kind}-${i}.webp`);
 const frames=[];
 for(const name of paths){const bytes=await readFile(`public/assets/${name}`);output.sources[name]=createHash('sha256').update(bytes).digest('hex');frames.push(await sharp(bytes).resize(width,height).removeAlpha().raw().toBuffer());}
 const semantic=frames.map((data,frame)=>Array.from({length:width*height},(_,i)=>{
  const [r,g,b]=data.subarray(i*3,i*3+3),[r0,g0,b0]=frames[0].subarray(i*3,i*3+3);
  const x=i%width/width,y=Math.floor(i/width)/height;
  if(kind==='bread')return frame>0&&x>.25&&x<.75&&y>.1&&y<.9&&r-b<35&&r-g<16&&r<210;
  // Removed leaf tissue: the original pixel is brown leaf; later it is paper.
  const interior=[-4*width,4*width,-4,4].every(d=>{const j=(i+d)*3;return j>=0&&j+2<frames[0].length&&frames[0][j]-frames[0][j+2]>55&&frames[0][j+1]-frames[0][j+2]>20;});
  return interior&&r0-b0>55&&g0-b0>20&&r>175&&g>165&&b>140&&r-b<45&&r-g<26;
 }));
 for(let a=0;a<3;a++)for(let b=a+1;b<=3;b++){
  const mask=semantic[b].map((v,i)=>{
   if(!v)return false;
   if(kind==='leaf')return !semantic[a][i];
   const delta=[0,1,2].reduce((sum,c)=>sum+Math.abs(frames[b][i*3+c]-frames[a][i*3+c]),0);
   return !semantic[a][i]||delta>70;
  });
  // Discard isolated color/compression specks. Keep each actual patch/hole.
  const clean=mask.map((v,i)=>v&&[-width-1,-width,-width+1,-1,1,width-1,width,width+1].filter(d=>mask[i+d]).length>=5);
  const runs=[];for(let y=0;y<height;y++){const row=[];for(let x=0;x<width;x++){if(!clean[y*width+x])continue;const start=x;while(x+1<width&&clean[y*width+x+1])x++;row.push(start,x);}runs.push(row);}
  output.regions[`${kind}:${a}-${b}`]=runs;
  const overlay=Buffer.alloc(width*height*4);clean.forEach((v,i)=>{if(v){overlay[i*4]=255;overlay[i*4+3]=130;}});
  await sharp(frames[b],{raw:{width,height,channels:3}}).composite([{input:overlay,raw:{width,height,channels:4}}]).png().toFile(`.tmp/masks/${kind}-${a}-${b}.png`);
 }
}
await writeFile('src/observation-masks.json',JSON.stringify(output));
console.log('Reviewed image change masks rebuilt: 12 frame pairs');
