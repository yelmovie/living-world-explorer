import sharp from 'sharp';

const width=321,height=405,raw={width,height,channels:4};
const openSource=process.argv[2]??'asset-bank/original/map-walk-20261115/moa-speaking.png';
const closed=await sharp('public/assets/characters/moa-full.webp')
 .extract({left:0,top:0,width,height}).ensureAlpha().raw().toBuffer();
const generated=await sharp(openSource).resize(width,height,{fit:'fill'}).ensureAlpha().raw().toBuffer();
const open=Buffer.from(closed);

// Use only the generated mouth and nearby skin; the original silhouette,
// eyes, glasses, and posture are identical in both frames.
for(let y=226;y<253;y++)for(let x=140;x<194;x++){
 const fade=Math.min(1,(x-140)/5,(193-x)/5,(y-226)/4,(252-y)/4);
 const i=(y*width+x)*4;
 for(let channel=0;channel<3;channel++)open[i+channel]=Math.round(closed[i+channel]*(1-fade)+generated[i+channel]*fade);
}
const frames=[closed,open].map((input,i)=>({input,raw,top:0,left:i*width}));
await sharp({create:{width:width*2,height,channels:4,background:'#0000'}})
 .composite(frames).webp({lossless:true}).toFile('public/assets/characters/moa-dialogue.webp');
